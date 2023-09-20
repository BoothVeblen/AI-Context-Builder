import asyncio
import sys
from uuid import uuid4

import graphsignal
from fastapi import APIRouter, HTTPException, Request
from loguru import logger
from models.base import Model
from models.controller import model_manager, session_state_manager
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=1000)

router = APIRouter(prefix="/v1/models")


@router.get("/{id}", tags=["models"])
def get_model(id: str):
    with graphsignal.start_trace("get_model"):
        model = model_manager.get_models(id)
        if model is None:
            raise HTTPException(status_code=404, detail="Model not found")
        return {"data": model, "message": "success", "status": 200}


def background_create_model(model: Model):
    try:
        model_manager.save_model(model)
        logger.info(f"model: {model} created")
    except Exception as e:
        logger.error(f"Error during creation of model: {model.id}: {e}")


@router.post("/", tags=["models"])
async def create_model(model: Model):
    with graphsignal.start_trace("create_model"):
        logger.info(f"model creating: {model}")
        model.id = uuid4().hex
        loop = asyncio.get_event_loop()
        loop.run_in_executor(executor, background_create_model, model)
        return {"data": {"id": model.id}, "message": "success", "status": 200}


def background_update_model(id: str, model: dict):
    try:
        model_manager.upsert_model(id, model)
        logger.info(f"model: {model} updated")
        session_state_manager.delete_session_state_cache_via_model(id)
    except Exception as e:
        logger.error(f"Error during update of model: {id}: {e}")


@router.patch("/{id}", tags=["models"])
async def update_model(id: str, model: dict):
    with graphsignal.start_trace("update_model"):
        logger.info(f"model updating: {model}")
        if model == {}:
            raise HTTPException(status_code=444, detail="Model is empty")
        loop = asyncio.get_event_loop()
        loop.run_in_executor(executor, background_update_model, id, model)
        return {"message": "success", "status": 200}


@router.delete("/{id}", tags=["models"])
def delete_model(id: str):
    with graphsignal.start_trace("delete_model"):
        model_manager.delete_model(id)
        return {"message": "success", "status": 200}
