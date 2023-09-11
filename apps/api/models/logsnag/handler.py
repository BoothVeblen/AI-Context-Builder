import requests
from utils import LOGSNAG_API_KEY
import json
from loguru import logger


class LogsnagHandler:
    base_url = "https://api.logsnag.com/v1/"

    def __init__(self):
        if LOGSNAG_API_KEY is None:
            raise Exception("LOGSNAG_API_KEY is not set")
        self.api_key = LOGSNAG_API_KEY

    def _send_request(self, method, endpoint, data=None):
        headers = {
            "Authorization": "Bearer " + self.api_key,
            "Content-Type": "application/json",
        }
        if method == "GET":
            response = requests.get(
                self.base_url + endpoint, params=data, headers=headers
            )
        elif method == "POST":
            response = requests.post(
                self.base_url + endpoint, data=json.dumps(data), headers=headers
            )
        elif method == "PATCH":
            response = requests.patch(
                self.base_url + endpoint, data=json.dumps(data), headers=headers
            )
        else:
            raise Exception("Unsupported method")

        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            logger.error(e)
            logger.error(response.text)

    async def send_log(
        self,
        channel: str,
        event: str,
        description: str,
        tags: dict = {},
        icon=None,
        notify=False,
        project="withcontext-test",
    ):
        data = {
            "channel": channel,
            "event": event,
            "description": description,
            "tags": tags,
            "notify": notify,
            "project": project,
        }
        self._send_request("POST", "log", data=data)

    async def send_insight(
        self, title: str, value, icon=None, project="withcontext-test"
    ):
        data = {
            "project": project,
            "title": title,
            "value": value,
        }
        self._send_request("POST", "insight", data=data)

    async def mutate_insight(
        self,
        title: str,
        action="inc",
        delta_value=0,
        icon=None,
        project="withcontext-test",
    ):
        if action == "inc":
            data = {
                "project": project,
                "title": title,
                "icon": icon,
                "value": {"$inc": delta_value},
            }
            self._send_request("PATCH", "insight", data=data)
        else:
            raise Exception("Unsupported action")
