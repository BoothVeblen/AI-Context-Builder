import asyncio
import sys
from uuid import uuid4

import graphsignal
from fastapi import APIRouter, HTTPException, Request
from loguru import logger
from models.base import Model
from models.controller import model_manager, session_state_manager
from crontab.celery import background_create_model, background_update_model

router = APIRouter(prefix="/v1/models")


@router.get("/{id}", tags=["models"])
def get_model(id: str):
    with graphsignal.start_trace("get_model"):
        model = model_manager.get_models(id)
        if model is None:
            raise HTTPException(status_code=404, detail="Model not found")
        return {"data": model, "message": "success", "status": 200}


@router.post("/", tags=["models"])
async def create_model(model: Model):
    with graphsignal.start_trace("create_model"):
        logger.info(f"model creating: {model}")
        model.id = uuid4().hex
        create_result = background_create_model.delay(model.dict())
        # create_result.get(timeout=30)
        return {"data": {"id": model.id}, "message": "success", "status": 200}


@router.patch("/{id}", tags=["models"])
async def update_model(id: str, model: dict):
    with graphsignal.start_trace("update_model"):
        logger.info(f"model updating: {model}")
        if model == {}:
            raise HTTPException(status_code=444, detail="Model is empty")
        update_result = background_update_model.delay(id, model)
        # update_result.get(timeout=100)
        return {"message": "success", "status": 200}


@router.delete("/{id}", tags=["models"])
def delete_model(id: str):
    with graphsignal.start_trace("delete_model"):
        model_manager.delete_model(id)
        return {"message": "success", "status": 200}
