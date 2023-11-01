import asyncio
import json
import secrets
import time
from typing import AsyncIterable, Awaitable, List

import graphsignal
from fastapi import APIRouter, Depends, HTTPException, Request
from models.response.response import OpenAIStreamResponse
from langchain.schema import AIMessage, HumanMessage, SystemMessage
from loguru import logger
from models.base import Choices, CompletionsRequest, CompletionsResponse
from models.base import Messages as MessagesContent
from models.base import SessionRequest, VideoCompletionsRequest
from models.controller import model_manager, session_state_manager
from models.logsnag.handler import LogsnagHandler
from models.faceto_ai import FaceToAiManager, WebhookHandler
from models.workflow import Workflow
from utils import WEBHOOK_KEY
from concurrent.futures import ThreadPoolExecutor
from models.workflow.custom_chain import (
    TargetedChainStatus,
    TargetedChain,
)

executor = ThreadPoolExecutor(max_workers=1000)

router = APIRouter(prefix="/v1/chat")
CHUNK_DATA = "chunk data"

# {"data": [{"key": "tool-0", "finished": True, "succeed": True}]}


def get_token_header(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=400, detail="Token header not found")
    if token != "Bearer " + WEBHOOK_KEY:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token


def wrap_token(
    token: str, model_id: str, session_id: str, filt: bool = False, openai_callback=None
) -> str:
    if filt:
        content = {"content": token}
        if token == CHUNK_DATA:
            return f": {json.dumps(content)}\n\n"
        return f"data: {json.dumps(content)}\n\n"
    if token == CHUNK_DATA:
        return f": {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=model_id, choices=[Choices(index=0, delta={'content': token})]).dict())}\n\n"
    return f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=model_id, choices=[Choices(index=0, delta={'content': token})]).dict())}\n\n"


def wrap_error(error: str):
    if error.startswith("This model's maximum context length"):
        return "The message you submitted was too long, please reload the conversation and submit something shorter."
    elif error.startswith("You exceed your current quota"):
        return "API key exceeds the usage limit."
    else:
        return "Something went wrong. Please try reloading the conversation."


async def send_message(
    messages_contents: List[MessagesContent],
    session_id: str,
    filt=False,
    start_time=None,
    disconnect_event: asyncio.Event = None,
) -> AsyncIterable[str]:
    messages = []
    for message_content in messages_contents:
        if message_content.role == "user":
            messages.append(HumanMessage(content=message_content.content))
        elif message_content.role == "system":
            messages.append(SystemMessage(content=message_content.content))
        elif message_content.role == "assistant":
            messages.append(AIMessage(content=message_content.content))
        else:
            raise HTTPException(
                status_code=400, detail=f"Invalid role: {message_content.role}"
            )

    model_id = session_state_manager.get_model_id(session_id)
    models = model_manager.get_models(model_id)
    if not models:
        raise HTTPException(
            status_code=400, detail=f"Model {model_id} not found in model manager"
        )
    if len(models) > 1:
        raise HTTPException(
            status_code=400,
            detail=f"Model {model_id} has {len(models)} models in model manager",
        )
    model = models[0]
    workflow = session_state_manager.get_workflow(session_id, model, disconnect_event)

    async def wrap_done(fn: Awaitable, event: asyncio.Event):
        try:
            await fn

        except Exception as e:
            logger.exception(e)
            raise e
        finally:
            event.set()

    try:
        task = asyncio.create_task(
            wrap_done(workflow.agenerate(messages), workflow.context.done)
        )

        yield wrap_token(CHUNK_DATA, model_id, session_id, filt=filt)

        async for token in workflow.context.aiter():
            if start_time:
                duration_time = time.time() - start_time
                start_time = None
                logger.info(f"duration_time: {duration_time}")
                logsang_handler = LogsnagHandler()
                asyncio.create_task(
                    logsang_handler.send_log(
                        channel="chat",
                        event="completion",
                        description=f"model_id:{model_id}, response_time: {duration_time}",
                        tags={
                            "model-id": model_id,
                            "session-id": session_id,
                            "duration-time": duration_time,
                        },
                    )
                )
            yield wrap_token(token, model_id, session_id, filt=filt)
        await task
    except Exception as e:
        logger.warning(e)

    if not filt:
        yield f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=workflow.model.id, choices=[Choices(index=0, finish_reason='stop', delta={})]).dict())}\n\n"
        info = {
            "metadata": {
                "token": {"total_tokens": workflow.cost_content.total_tokens},
                "raw": workflow.io_traces,
            }
        }
        yield f"data: {json.dumps(info)}\n\n"
        if workflow.error_flags:
            info = {
                "metadata": {"error": wrap_error(str(workflow.error_flags[0].args[0]))}
            }
            yield f"data: {json.dumps(info)}\n\n"

    if not workflow.disconnect_event.is_set():
        yield "data: [DONE]\n\n"
        session_state_manager.save_workflow_status(session_id, workflow)


async def send_done_message():
    yield "data: [DONE]\n\n"


@router.post("/completions")
async def stream_completions(body: CompletionsRequest):
    start_time = time.time()
    logger.info(f"start_time: {start_time}")
    with graphsignal.start_trace("completions"):
        logger.info(f"completions payload: {body.dict()}")
        model_id = session_state_manager.get_model_id(body.session_id)
        model = model_manager.get_models(model_id)[0]
        if model.enable_video_interaction:
            link = FaceToAiManager.get_room_link(
                model.opening_remarks,
                body.session_id,
                model_id,
            )
            webhook_handler = WebhookHandler()
            webhook_handler.create_video_room_link(body.session_id, link)
            disconnect_event = asyncio.Event()
            return OpenAIStreamResponse(
                content=send_done_message(),
                media_type="text/event-stream",
                disconnect_event=disconnect_event,
            )
        else:
            disconnect_event = asyncio.Event()
            return OpenAIStreamResponse(
                content=send_message(
                    body.messages,
                    body.session_id,
                    start_time=start_time,
                    disconnect_event=disconnect_event,
                ),
                media_type="text/event-stream",
                disconnect_event=disconnect_event,
            )


@router.post("/completions/video/{session_id}")
async def video_stream_completions(
    session_id: str,
    body: VideoCompletionsRequest,
    token: str = Depends(get_token_header),
):
    with graphsignal.start_trace("completions_video"):
        logger.info(f"completions payload: {body.dict()}")
        disconnect_event = asyncio.Event()
        return OpenAIStreamResponse(
            content=send_message(
                body.messages, session_id, filt=True, disconnect_event=disconnect_event
            ),
            media_type="text/event-stream",
            disconnect_event=disconnect_event,
        )


@router.post("/completions/video/{session_id}/webhook")
async def video_stream_completions_webhook(
    session_id: str,
    body: dict,
    token: str = Depends(get_token_header),
):
    with graphsignal.start_trace("completions_video_webhook"):
        logger.info(f"wbhook payload: {body}")

        if body.get("object", None) != "Event":
            raise HTTPException(status_code=500, detail="object not allowed")
        if body.get("type", None) not in [
            "Event.RoomStarted",
            "Event.ParticipantJoined",
            "Event.ParticipantLeft",
            "Event.RoomEgressEnd",
            "Event.RoomFinished",
        ]:
            raise HTTPException(status_code=500, detail="event not allowed")
        webhook_handler = WebhookHandler()
        try:
            if body.get("type") == "Event.ParticipantLeft":
                if body.get("data", {}).get("vod", {}).get("duration", None) is None:
                    raise HTTPException(
                        status_code=500, detail="data.vod.duration not found"
                    )
                webhook_handler.forward_data(body, session_id)
            else:
                return {"message": "success", "status": 200}
        except Exception as e:
            logger.exception(e)
            raise HTTPException(status_code=500, detail=str(e))
        return {"message": "success", "status": 200}


@router.post("/session")
async def create_session(body: SessionRequest):
    with graphsignal.start_trace("create_session"):
        logger.info(f"session payload: {body.dict()}")
        try:
            session_id = secrets.token_hex(16)
            session_state_manager.save_session_state(session_id, body.model_id)
            return {
                "data": {"session_id": session_id},
                "message": "success",
                "status": 200,
            }
        except Exception as e:
            logger.exception(e)
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/process")
async def get_process_status(session_id: str):
    logger.info(f"session_id: {session_id}")
    with graphsignal.start_trace("get_process_status"):
        workflow = session_state_manager.get_workflow(session_id, None, None)
        if workflow is None:
            return {"data": [], "message": "workflow not found", "status": 400}
        process_list = []
        for chain in workflow.context.chains:
            if isinstance(chain, TargetedChain):
                match chain.process:
                    case TargetedChainStatus.INIT:
                        process_list.append(
                            {
                                "key": "-".join(chain.output_key.split("_")[0:2]),
                                "finished": False,
                                "succeed": False,
                            }
                        )
                    case TargetedChainStatus.RUNNING:
                        process_list.append(
                            {
                                "key": "-".join(chain.output_key.split("_")[0:2]),
                                "finished": False,
                                "succeed": False,
                            }
                        )
                    case TargetedChainStatus.FINISHED:
                        process_list.append(
                            {
                                "key": "-".join(chain.output_key.split("_")[0:2]),
                                "finished": True,
                                "succeed": True,
                            }
                        )
                    case TargetedChainStatus.ERROR:
                        process_list.append(
                            {
                                "key": "-".join(chain.output_key.split("_")[0:2]),
                                "finished": True,
                                "succeed": False,
                            }
                        )
                    case _:
                        logger.warning(f"invalid chain status: {chain.process}")
        return {"data": process_list, "message": "success", "status": 200}
