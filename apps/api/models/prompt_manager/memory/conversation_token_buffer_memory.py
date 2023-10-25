from typing import List
from langchain.schema import BaseMessage, AIMessage, HumanMessage


class ConversationTokenBufferMemoryMixin:
    @classmethod
    def get_token_buffer_messages(
        cls, messages: List[BaseMessage], max_token_limit, model="gpt-3.5-turbo-0613"
    ):
        buffer = messages.copy()
        current_buffer_length = cls.num_tokens_from_messages(buffer, model)
        if current_buffer_length > max_token_limit:
            while current_buffer_length > max_token_limit:
                buffer.pop(0)
                current_buffer_length = cls.num_tokens_from_messages(buffer, model)
        return buffer
