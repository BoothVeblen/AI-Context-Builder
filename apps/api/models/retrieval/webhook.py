from loguru import logger
from models.base import DatasetStatusWebhookRequest
from tenacity import after_log, retry, stop_after_attempt, wait_fixed
from utils.config import WEBHOOK_ENDPOINT
import requests


class WebhookHandler:
    def __init__(self) -> None:
        self.target_url = (
            WEBHOOK_ENDPOINT
            if WEBHOOK_ENDPOINT is not None
            else "https://build.withcontext.ai/api/webhook/chat"
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        reraise=True,
        after=after_log(logger, 10),
    )
    def update_document_status(self, dataset_id, document_id, characters, status):
        """
        @params status: 0.index complete 1.indexing 2.index failed
        """
        logger.info(f"Updating status of {dataset_id} {document_id}to {status}")
        payload = DatasetStatusWebhookRequest(
            status=status,
            type="document.update",
            data={
                "api_dataset_id": dataset_id,
                "document_status": status,
                "document_id": document_id,
                "document_characters": characters,
            },
        )
        headers = {"Content-Type": "application/json"}
        logger.info(f"Sending payload {payload.dict()} to {self.target_url}")
        response = requests.post(self.target_url, json=payload.dict(), headers=headers)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            logger.error(e)
            logger.error(response.text)
