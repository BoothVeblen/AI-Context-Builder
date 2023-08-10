import requests
import logging
import json
import time
from tenacity import retry, stop_after_attempt, wait_fixed, after_log
from models.base import FaceToAiWebhookRequest

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class WebhookHandler:
    target_url = (
        "https://builder-git-fork-lzl-websocket-withcontext.vercel.app/api/webhook/chat"
    )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        reraise=True,
        after=after_log(logger, logging.WARNING),
    )
    def forward_data(self, data: FaceToAiWebhookRequest, session_id: str) -> None:
        logger.info(f"Forwarding data to {self.target_url}")
        data.data["session_id"] = session_id
        response = requests.post(self.target_url, json=json.dumps(data.dict()))
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
            data={"session_id": session_id, "room_link": room_link},
        )
        response = requests.post(self.target_url, json=json.dumps(data.dict()))
        response.raise_for_status()
