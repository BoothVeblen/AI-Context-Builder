from fastapi.responses import StreamingResponse
import asyncio
from loguru import logger
import time


class OpenAIStreamResponse(StreamingResponse):
    def __init__(self, disconnect_event: asyncio.Event, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.disconnect_event = disconnect_event

    async def listen_for_disconnect(self, receive) -> None:
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                self.disconnect_event.set()
                break
            else:
                logger.info(f"message: {message}")
