import requests
import logging
from utils import (
    FACE_TO_AI_ENDPOINT,
    FACE_TO_CLIENT_ID,
    FACE_TO_CLIENT_SECRET,
    WEBHOOK_KEY,
    BACKEND_URL,
)
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FaceToAiManager:
    url: FACE_TO_AI_ENDPOINT
    client_id: FACE_TO_CLIENT_ID
    client_secret: FACE_TO_CLIENT_SECRET

    @classmethod
    def get_token(cls):
        url = FACE_TO_AI_ENDPOINT + "/v1/auth"
        payload = {
            "client_id": FACE_TO_CLIENT_ID,
            "client_secret": FACE_TO_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": "faceto-ai-code",
        }
        headers = {"Content-Type": "application/json"}
        response = requests.request(
            "POST", url, headers=headers, data=json.dumps(payload)
        )
        logger.info(response.json())
        return response.json()["access_token"]

    @classmethod
    def get_room_link(
        cls, opening_remarks: str, session_id: str, is_mock: bool = False
    ):
        token = cls.get_token()
        url = FACE_TO_AI_ENDPOINT + "/v1/room/link"
        payload = {
            "config": {
                "greeting": opening_remarks,
            },
            "chatapi": {
                "api": f"{BACKEND_URL}/v1/chat/completions/video/{session_id}",
                "key": WEBHOOK_KEY,
            },
            "webhook": {
                "api": f"{BACKEND_URL}/v1/chat/completions/video/{session_id}/webhook",
                "key": WEBHOOK_KEY,
            },
        }
        if is_mock:
            payload["config"]["voice_id"] = "8QAi78THegBm75BpJ4f5"
        logger.info(f"payload: {payload}")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        response = requests.request(
            "POST", url, headers=headers, data=json.dumps(payload)
        )

        return response.json()["link"]
