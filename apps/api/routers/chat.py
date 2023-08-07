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
)
from models.workflow import Workflow

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/chat")


async def send_message(
    messages: List[BaseMessage], session_id: str
) -> AsyncIterable[str]:
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

    yield f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=workflow.model.id, choices=[Choices(index=0, delta={'content': ''})]).dict())}\n\n"

    async for token in callback.aiter():
        resp = CompletionsResponse(
            id=session_id,
            object="chat.completion.chunk",
            model=workflow.model.id,
            choices=[Choices(index=0, finish_reason=None, delta={"content": token})],
        )
        yield f"data: {json.dumps(resp.dict())}\n\n"

    yield f"data: {json.dumps(CompletionsResponse(id=session_id, object='chat.completion.chunk', model=workflow.model.id, choices=[Choices(index=0, finish_reason='stop', delta={})]).dict())}\n\n"
    yield "data: [DONE]\n\n"

    await task


@router.post("/completions")
async def stream_completions(body: CompletionsRequest):
    logger.info(f"completions payload: {body.dict()}")
    # TODO check role
    messages = []
    for message in body.messages:
        if message.role == "user":
            messages.append(HumanMessage(content=message.content))
        elif message.role == "system":
            messages.append(SystemMessage(content=message.content))
        elif message.role == "assistant":
            messages.append(AIMessage(content=message.content))
        else:
            raise HTTPException(status_code=400, detail=f"Invalid role: {message.role}")

    return StreamingResponse(
        send_message(messages, body.session_id), media_type="text/event-stream"
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
