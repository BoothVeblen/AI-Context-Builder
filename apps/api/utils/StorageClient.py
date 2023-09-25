import requests
from io import BytesIO
from loguru import logger
from utils.config import WEBHOOK_ENDPOINT
import requests
from pydantic import BaseModel, Field


class DatasetStatusWebhookRequest(BaseModel):
    type: str = Field(default="dataset.updated")
    data: dict = Field(default_factory=dict)
    object: str = Field(default="event")


class BaseStorageClient:
    def download(self, uri: str, path: str):
        raise NotImplementedError()

    def load(self, uri: str):
        raise NotImplementedError()


class GoogleCloudStorageClient(BaseStorageClient):
    def download(self, uri: str, path: str):
        response = requests.get(uri)
        with open(path, "wb") as f:
            f.write(response.content)

    def load(self, uri: str):
        response = requests.get(uri)
        return BytesIO(response.content)


class AnnotatedDataStorageClient(BaseStorageClient):
    def __init__(self) -> None:
        self.target_url = (
            WEBHOOK_ENDPOINT
            if WEBHOOK_ENDPOINT is not None
            else "https://build.withcontext.ai/api/webhook/chat"
        )

    def get_annotated_datas(self, model_id):
        logger.info(f"Getting annotated data {model_id}")
        payload = DatasetStatusWebhookRequest(
            type="annotations.get", data={"api_model_ids": [model_id]}
        )
        headers = {"Content-Type": "application/json"}
        response = requests.post(self.target_url, json=payload.dict(), headers=headers)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            logger.error(e)
            logger.error(response.text)
        return response.json().get("data", [])

    def load(self, model_id):
        data = self.get_annotated_datas(model_id)
        annotated_data = ""
        for _data in data:
            human_message = _data.get("Human", "")
            annotated_data += f"Human:{human_message}\n"
            annotation = _data.get("Annotation", "")
            annotated_data += f"AI:{annotation}\n"
        return annotated_data
