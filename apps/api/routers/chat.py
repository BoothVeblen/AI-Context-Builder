import asyncio
import json
import logging
import os
import secrets
import uuid
from typing import AsyncIterable, Awaitable, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain.schema import AIMessage, BaseMessage, HumanMessage, SystemMessage

from models.base import (
    Choices,
    CompletionsRequest,
    CompletionsResponse,
    SessionRequest,
    model_manager,
    session_state_manager,
    VideoCompletionsRequest,
    Messages as MessagesContent,
)
from models.workflow import Workflow
from models.faceto_ai import FaceToAiManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/chat")


def wrap_token(token: str, model_id: str, session_id: str, filt: bool = False) -> str:
    if filt:
        content = {"content": token}
        return f"data: {content}\n\n"
    return f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=model_id, choices=[Choices(index=0, delta={'content': ''})]).dict())}\n\n"


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

    yield wrap_token("", model_id, session_id, filt=filt)

    async for token in callback.aiter():
        yield wrap_token(token, model_id, session_id, filt=filt)

    if not filt:
        yield f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=workflow.model.id, choices=[Choices(index=0, finish_reason='stop', delta={})]).dict())}\n\n"
    yield "data: [DONE]\n\n"

    await task


@router.post("/completions")
async def stream_completions(body: CompletionsRequest):
    logger.info(f"completions payload: {body.dict()}")
    model_id = session_state_manager.get_model_id(body.session_id)
    model = model_manager.get_models(model_id)[0]
    if model.enable_video_interaction:
        link = FaceToAiManager.get_room_link(model.opening_remarks, body.session_id)
        return {"data": {"link": link}, "message": "success", "status": 200}
    else:
        return StreamingResponse(
            send_message(body.messages, body.session_id), media_type="text/event-stream"
        )


@router.post("/completions/vedio/{session_id}")
async def video_stream_completions(session_id: str, body: VideoCompletionsRequest):
    return StreamingResponse(
        send_message(body.messages, session_id),
        media_type="text/event-stream",
        filt=True,
    )


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
