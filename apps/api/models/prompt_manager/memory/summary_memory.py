from typing import List
from langchain.schema import BaseMessage
from utils.base import get_buffer_string
import asyncio


class ConversationSummaryBufferMemoryMixin:
    @classmethod
    def get_summary_buffer_messages(
        cls, messages: List[BaseMessage], max_token_limit, model
    ):
        buffer = messages.copy()
        current_buffer_length = cls.num_tokens_from_messages(buffer)
        pruned_memory = []
        if current_buffer_length > max_token_limit:
            while current_buffer_length > max_token_limit:
                pruned_memory.append(buffer.pop(0))
                current_buffer_length = cls.num_tokens_from_messages(buffer)
        pruned_memory_string = get_buffer_string(pruned_memory)
        suffix = cls.sumrize_content(
            pruned_memory_string, model, chain_type="map_reduce"
        )
        return buffer, suffix
