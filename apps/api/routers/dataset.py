import asyncio
import sys
from uuid import uuid4

import graphsignal
from fastapi import APIRouter, HTTPException, BackgroundTasks
from loguru import logger
from models.base.dataset import Dataset
from models.controller import dataset_manager
from models.retrieval import Retriever
from pydantic import BaseModel


class IndexResponse(BaseModel):
    index_type: str
    options: dict
    content: str


router = APIRouter(prefix="/v1/datasets")


@router.get("/{id}", tags=["datasets"])
def get_dataset(id: str):
    with graphsignal.start_trace("get_dataset"):
        dataset = dataset_manager.get_datasets(id)
        if dataset is None:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"data": dataset, "message": "success", "status": 200}


@router.get("/", tags=["datasets"])
def get_datasets():
    with graphsignal.start_trace("get_datasets"):
        return {
            "data": dataset_manager.get_datasets(),
            "message": "success",
            "status": 200,
        }


async def background_create_dataset(dataset: Dataset):
    try:
        dataset_manager.save_dataset(dataset)
        logger.info(f"Dataset {dataset.id} created.")
    except Exception as e:
        logger.error(f"Error during creation of dataset {dataset.id}: {e}")


@router.post("/", tags=["datasets"])
async def create_dataset(dataset: Dataset, background_tasks: BackgroundTasks):
    with graphsignal.start_trace("create_dataset"):
        logger.info(f"dataset creating: {dataset}")
        dataset.id = uuid4().hex
        try:
            background_tasks.add_task(background_create_dataset, dataset)
            return {"data": {"id": dataset.id}, "message": "success", "status": 200}
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=400, detail="Dataset not created with error: {}".format(e)
            )


async def background_upsert_dataset(id: str, dataset_info: dict):
    try:
        dataset_manager.upsert_dataset(id, dataset_info)
        logger.info(f"Upsert for dataset {id} completed.")
    except Exception as e:
        logger.error(f"Error during upsert for dataset {id}: {e}")


@router.patch("/{id}", tags=["datasets"])
async def update_dataset(id: str, dataset: dict, background_tasks: BackgroundTasks):
    with graphsignal.start_trace("update_dataset"):
        logger.info(f"dataset updating: {dataset}")
        try:
            background_tasks.add_task(background_upsert_dataset, id, dataset)
            return {"message": "success", "status": 200}
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=400, detail="Dataset not updated with error: {}".format(e)
            )


@router.delete("/{id}", tags=["datasets"])
def delete_dataset(id: str):
    with graphsignal.start_trace("delete_dataset"):
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
