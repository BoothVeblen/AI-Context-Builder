import json
import sys

import requests
from loguru import logger
from utils import (
    BACKEND_URL,
    FACE_TO_AI_ENDPOINT,
    FACE_TO_CLIENT_ID,
    FACE_TO_CLIENT_SECRET,
    WEBHOOK_KEY,
)


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
    def get_room_link(cls, opening_remarks: str, session_id: str, model_id: str):
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
        mock_voices = {
            "24a683074e7c4c6f881b747296aabbae": "8QAi78THegBm75BpJ4f5",
            "e8c0e058e2944722be0fdad02d12d2be": "nF2FxJ50Kt8EKglc6fVP",
            "30048c219653405c9496fed8d6b581f7": "sKMbqHOYhThlmuvzrOPf",
        }
        if model_id in mock_voices:
            voice_id = mock_voices[model_id]
        else:
            voice_id = None
        if voice_id:
            payload["config"]["voice_id"] = voice_id
        logger.info(f"payload: {payload}")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        response = requests.request(
            "POST", url, headers=headers, data=json.dumps(payload)
        )

        return response.json()["link"]
