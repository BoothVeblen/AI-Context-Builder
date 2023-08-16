import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from models.base import Model
from models.controller import model_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/models")


@router.get("/{id}", tags=["models"])
def get_model(id: str):
    model = model_manager.get_models(id)
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"data": model, "message": "success", "status": 200}


@router.get("/", tags=["models"])
def get_models():
    return {"data": model_manager.get_models(), "message": "success", "status": 200}


@router.post("/", tags=["models"])
def create_model(model: Model):
    logger.info(f"model: {model}")
    model.id = uuid4().hex
    model_manager.save_model(model)
    return {"data": {"id": model.id}, "message": "success", "status": 200}


@router.patch("/{id}", tags=["models"])
def update_model(id: str, model: dict):
    logger.info(f"model: {model}")
    if model == {}:
        raise HTTPException(status_code=444, detail="Model is empty")
    model_manager.upsert_model(id, model)
    return {"message": "success", "status": 200}


@router.delete("/{id}", tags=["models"])
def delete_model(id: str):
    model_manager.delete_model(id)
    return {"message": "success", "status": 200}
