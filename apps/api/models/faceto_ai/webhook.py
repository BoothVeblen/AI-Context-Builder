import requests
import logging
import json
import time
from tenacity import retry, stop_after_attempt, wait_fixed, after_log
from models.base import FaceToAiWebhookRequest
from utils.config import WEBHOOK_ENDPOINT

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


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
        after=after_log(logger, logging.WARNING),
    )
    def forward_data(self, data: dict, session_id: str) -> None:
        # forward while ended
        logger.info(f"Forwarding data to {self.target_url}")
        logger.info(f"Data: {data}")
        _data = FaceToAiWebhookRequest(
            object="event",
            type="call.ended",
            data={
                "session_id": session_id,
                "duration": data["data"]["vod"]["duration"],
            },
        )
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            self.target_url, data=json.dumps(_data.dict()), headers=headers
        )
        response.raise_for_status()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        reraise=True,
        after=after_log(logger, logging.WARNING),
    )
    def create_video_room_link(self, session_id: str, room_link: str):
        data = FaceToAiWebhookRequest(
            object="event",
            type="call.created",
            data={"session_id": session_id, "link": room_link},
        )
        logger.info(f"Forwarding data to {self.target_url}")
        logger.info(f"Data: {data}")
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            self.target_url, data=json.dumps(data.dict()), headers=headers
        )
        response.raise_for_status()
