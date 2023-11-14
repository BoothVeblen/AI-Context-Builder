from fastapi import Query, HTTPException, Path
import asyncio
from uuid import uuid4

import graphsignal
from fastapi import APIRouter, HTTPException
from loguru import logger
from models.base.dataset import Dataset
from models.controller import dataset_manager
from models.retrieval import Retriever
from pydantic import BaseModel
from fastapi import Query
from crontab.celery import \
    background_create_dataset, \
    background_add_document, \
    background_delete_document, \
    background_delete_dataset


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


@router.post("/", tags=["datasets"])
async def create_dataset(dataset: Dataset):
    with graphsignal.start_trace("create_dataset"):
        logger.info(f"dataset creating: {dataset}")
        dataset.id = uuid4().hex
        try:
            create_result = background_create_dataset.delay(dataset.dict())
            create_result.get(timeout=30)
            return {"data": {"id": dataset.id}, "message": "success", "status": 200}
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=400, detail="Dataset not created with error: {}".format(e)
            )


@router.patch("/{id}", tags=["datasets"])
async def update_dataset(
        id: str,
        dataset: dict,
        preview: int = Query(0, description="Preview of the dataset"),
        uid: str = Query(None, description="UID of the document"),
):
    with graphsignal.start_trace("update_dataset"):
        logger.info(f"dataset updating, id:{id}, dataset:{dataset}, preview:{preview}, uid:{uid}")
        try:
            if preview != 0 and uid is not None:
                dataset_manager.upsert_preview(Dataset(**dataset, id=id), preview, uid)
                return {"message": "success", "status": 200}
            documents = dataset.get("documents", [])
            for doc in documents:
                uid = doc.get("uid", None)
                if uid is None:
                    logger.warning(f"UID not found in document {doc}")
                dataset_manager.delete_preview_segment(id, uid)

            current_data = dataset_manager.get_datasets(id)[0].dict()
            docs_to_add = dataset_manager.get_documents_to_add(current_data, dataset)
            docs_to_delete = dataset_manager.get_documents_to_delete(current_data, dataset)
            logger.info(f"docs_to_add -> {docs_to_add}")
            logger.info(f"docs_to_delete -> {docs_to_delete}")

            for doc in docs_to_add:
                background_add_document.delay(id, doc)
            for doc in docs_to_delete:
                background_delete_document.delay(id, doc)
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
            # dataset_manager.delete_dataset(id)
            background_delete_dataset.delay(id)
            return {"message": "success", "status": 200}
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=400, detail="Dataset not deleted with error: {}".format(e)
            )


@router.get("/{dataset_id}/document/{uid}", tags=["datasets"])
def retrieve_document_segments(
        dataset_id: str,
        uid: str,
        offset: int = Query(0, description="Offset for pagination"),
        limit: int = Query(10, description="Limit for pagination"),
        query: str = Query(None, description="Query to search for"),
):
    with graphsignal.start_trace("get_document_segments"):
        logger.info(
            f"Retrieving segments for dataset: {dataset_id}, document: {uid}, offset: {offset}, limit: {limit}, query: {query}"
        )
        error_mapping = {
            "Dataset not found": {
                "message": "Dataset not found",
                "status": "404",
                "data": None,
            },
            "UID not found in dataset documents": {
                "message": "UID not found in dataset documents",
                "status": "404",
                "data": None,
            },
            "Unexpected data format from Pinecone": {
                "message": "Unexpected data format from Pinecone",
                "status": "500",
                "data": None,
            },
        }
        try:
            segment_count, segments = dataset_manager.get_document_segments(
                dataset_id, uid, offset, limit, query
            )
            return {
                "message": "success",
                "status": "200",
                "data": {"totalItems": segment_count, "segments": segments},
            }
        except ValueError as e:
            return error_mapping.get(
                str(e),
                {"message": "Internal Server Error", "status": "500", "data": None},
            )


@router.patch(
    "/{dataset_id}/document/{uid}/segment/{segment_id:path}", tags=["datasets"]
)
def upsert_segment(dataset_id: str, uid: str, segment_id: str, segment: dict):
    with graphsignal.start_trace("upsert_segment"):
        logger.info(f"dataset: {dataset_id}, uid: {uid}, segment_id: {segment_id}")
        if "content" not in segment:
            return {"message": "content is required", "status": 400}
        try:
            dataset_manager.upsert_segment(
                dataset_id, uid, segment_id, segment["content"]
            )
            return {"message": "success", "status": 200}
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=400, detail="Segment not updated with error: {}".format(e)
            )


@router.post("/{dataset_id}/document/{uid}/segment/", tags=["datasets"])
def add_segment(dataset_id: str, uid: str, segment: dict):
    with graphsignal.start_trace("add_segment"):
        logger.info(f"dataset: {dataset_id}, uid: {uid}")
        if "content" not in segment:
            return {"message": "content is required", "status": 400}
        try:
            dataset_manager.add_segment(dataset_id, uid, segment["content"])
            return {"message": "success", "status": 200}
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=400, detail="Segment not added with error: {}".format(e)
            )
