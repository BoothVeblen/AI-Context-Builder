from loguru import logger
from typing import Sequence
from langchain.schema import BaseMessage, HumanMessage, AIMessage


def to_string(content):
    if isinstance(content, str):
        return content
    elif isinstance(content, bytes):
        return content.decode()

    else:
        logger.warning(f"type {type(content)} is not supported.")
        return content


def get_buffer_string(
    messages: Sequence[BaseMessage], human_prefix: str = "User", ai_prefix: str = "AI"
):
    string_messages = []
    for m in messages:
        if isinstance(m, HumanMessage):
            role = human_prefix
        elif isinstance(m, AIMessage):
            role = ai_prefix
        else:
            raise ValueError(f"Got unsupported message type: {m}")
        message = f'{role}: "{m.content}"' if m.content else ""
        if isinstance(m, AIMessage) and "function_call" in m.additional_kwargs:
            message += f"{m.additional_kwargs['function_call']}"
        string_messages.append(message)

    return "\n".join(string_messages)
