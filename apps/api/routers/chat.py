import asyncio
import json
import logging
import os
import secrets
import uuid
from typing import AsyncIterable, Awaitable, List

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from langchain.schema import AIMessage, BaseMessage, HumanMessage, SystemMessage

from models.base import (
    Choices,
    CompletionsRequest,
    CompletionsResponse,
    SessionRequest,
    session_state_manager,
    VideoCompletionsRequest,
    Messages as MessagesContent,
    FaceToAiWebhookRequest,
)
from models.workflow import Workflow
from models.faceto_ai import FaceToAiManager, WebhookHandler
from models.controller import model_manager
from utils import WEBHOOK_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/chat")


def get_token_header(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=400, detail="Token header not found")
    if token != "Bearer " + WEBHOOK_KEY:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token


def wrap_token(token: str, model_id: str, session_id: str, filt: bool = False) -> str:
    if filt:
        content = {"content": token}
        return f"data: {json.dumps(content)}\n\n"
    return f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=model_id, choices=[Choices(index=0, delta={'content': token})]).dict())}\n\n"


async def send_message(
    messages_contents: List[MessagesContent], session_id: str, filt=False
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
    workflow = Workflow(model=model, session_id=session_id)

    callback = workflow.sequential_chain_callback

    async def wrap_done(fn: Awaitable, event: asyncio.Event):
        try:
            await fn

        except Exception as e:
            logger.exception(e)
            raise e
        finally:
            event.set()

    task = asyncio.create_task(wrap_done(workflow.agenerate(messages), callback.done))

    async for token in callback.aiter():
        yield wrap_token(token, model_id, session_id, filt=filt)

    if not filt:
        yield f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=workflow.model.id, choices=[Choices(index=0, finish_reason='stop', delta={})]).dict())}\n\n"
    yield "data: [DONE]\n\n"

    await task


async def send_done_message():
    yield "data: [DONE]\n\n"


@router.post("/completions")
async def stream_completions(body: CompletionsRequest):
    logger.info(f"completions payload: {body.dict()}")
    model_id = session_state_manager.get_model_id(body.session_id)
    model = model_manager.get_models(model_id)[0]
    if model.enable_video_interaction:
        link = FaceToAiManager.get_room_link(
            model.opening_remarks,
            body.session_id,
            model_id == "24a683074e7c4c6f881b747296aabbae",
        )
        webhook_handler = WebhookHandler()
        webhook_handler.create_video_room_link(body.session_id, link)
        return StreamingResponse(send_done_message(), media_type="text/event-stream")
    else:
        return StreamingResponse(
            send_message(body.messages, body.session_id), media_type="text/event-stream"
        )


@router.post("/completions/video/{session_id}")
async def video_stream_completions(
    session_id: str,
    body: VideoCompletionsRequest,
    token: str = Depends(get_token_header),
):
    logger.info(f"completions payload: {body.dict()}")
    return StreamingResponse(
        send_message(body.messages, session_id, filt=True),
        media_type="text/event-stream",
    )


@router.post("/completions/video/{session_id}/webhook")
async def video_stream_completions_webhook(
    session_id: str,
    body: dict,
    token: str = Depends(get_token_header),
):
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
    logger.info(f"session payload: {body.dict()}")
    try:
        session_id = secrets.token_hex(16)
        session_state_manager.save_session_state(session_id, body.model_id)
        return {"data": {"session_id": session_id}, "message": "success", "status": 200}
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))
