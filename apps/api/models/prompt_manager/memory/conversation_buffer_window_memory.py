from langchain.schema import BaseMessage, AIMessage, HumanMessage
from typing import List


class ConversationBufferWindowMemoryMixin:
    @classmethod
    def get_buffer_window_meesages(cls, messages: List[BaseMessage], k: int):
        return messages[-k * 2 :] if k > 0 else []
