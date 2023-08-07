import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from models.base import Dataset, dataset_manager
from models.retrieval import Retriever
from pydantic import BaseModel


class IndexResponse(BaseModel):
    index_type: str
    options: dict
    content: str


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/v1/datasets")


@router.get("/{id}", tags=["datasets"])
def get_dataset(id: str):
    dataset = dataset_manager.get_datasets(id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"data": dataset, "message": "success", "status": 200}


@router.get("/", tags=["datasets"])
def get_datasets():
    return {"data": dataset_manager.get_datasets(), "message": "success", "status": 200}


@router.post("/", tags=["datasets"])
def create_dataset(dataset: Dataset):
    logger.info(f"dataset: {dataset}")
    dataset.id = uuid4().hex
    try:
        dataset_manager.save_dataset(dataset)
        return {"data": {"id": dataset.id}, "message": "success", "status": 200}
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=400, detail="Dataset not created with error: {}".format(e)
        )


@router.patch("/{id}", tags=["datasets"])
def update_dataset(id: str, dataset: Dataset):
    logger.info(f"dataset: {dataset}")
    try:
        dataset.id = id
        dataset_manager.upsert_dataset(dataset)
        return {"message": "success", "status": 200}
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=400, detail="Dataset not updated with error: {}".format(e)
        )


@router.delete("/{id}", tags=["datasets"])
def delete_dataset(id: str):
    logger.info(f"dataset: {id}")
    try:
        dataset_manager.delete_dataset(id)
        return {"message": "success", "status": 200}
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=400, detail="Dataset not deleted with error: {}".format(e)
        )


@router.post("/{id}/index", tags=["datasets"])
def query(id: str, index: IndexResponse):
    try:
        retrieval = Retriever(index.options, id)
        query = retrieval.query(index.content, index.index_type)
        return {"data": {"query": query}, "message": "success", "status": 200}
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail="not supported")
