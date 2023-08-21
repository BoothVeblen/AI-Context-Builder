import re
from typing import Any, Dict, List, Optional, cast
from asyncio import sleep, Task
import asyncio

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.chains import ConversationalRetrievalChain, RetrievalQA
from langchain.chains.retrieval_qa.base import BaseRetrievalQA
from langchain.schema.output import LLMResult
from pydantic import Field


class SequentialChainAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    def __init__(self) -> None:
        super().__init__()

    async def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        await super().on_llm_start(serialized, prompts, **kwargs)

    async def on_llm_end(self, response: LLMResult, **kwargs: Any):
        await super().on_llm_end(response, **kwargs)

    async def on_llm_new_token(self, token: str, **kwargs: Any):
        return await super().on_llm_new_token(token, **kwargs)

    async def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        *,
        run_id,
        parent_run_id=None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Run when chain starts running."""
        pass

    async def on_chain_end(
        self,
        outputs: Dict[str, Any],
        *,
        run_id,
        parent_run_id: None,
        tags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> None:
        """Run when chain ends running."""
        pass


class ChainAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    index: int = Field(default=0)
    chain_type: str = Field(default="")

    def __init__(self, index, chain_type) -> None:
        self.index = index
        self.chain_type = chain_type
        super().__init__()

    async def on_chain_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        await super().on_llm_start(serialized, prompts, **kwargs)

    async def on_chain_end(self, response: LLMResult, **kwargs: Any):
        await super().on_llm_end(response, **kwargs)

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        return await super().on_llm_new_token(token, **kwargs)


class LLMAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    current_number: int = Field(default=0)
    sending_number: bool = Field(default=True)

    def __init__(self) -> None:
        self.timer_task: Task = None
        super().__init__()
        if self.timer_task:
            self.timer_task.cancel()
        self.done.clear()
        self.current_number = 0
        self.timer_task = asyncio.create_task(self._send_number())

    async def _send_number(self):
        # do this since frontend will close over the connection if no data is sent for 30 seconds
        while True and self.sending_number:
            await sleep(28)
            self.queue.put_nowait("chunk data")
            self.current_number += 1

    async def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        self.sending_number = False
        await super().on_llm_start(serialized, prompts, **kwargs)

    async def on_llm_end(self, response: LLMResult, **kwargs: Any):
        if self.timer_task:
            self.timer_task.cancel()
        await super().on_llm_end(response, **kwargs)

    async def on_llm_new_token(self, token: str, **kwargs: Any):
        return await super().on_llm_new_token(token, **kwargs)


tool_output_pattern = re.compile(r"\[\{tool-\d+\.output\}\]")
tool_output_brackets_pattern = re.compile(r"\[\{(\btool-\d+\-output\b)\}\]")


def replace_dot_with_dash_for_tool_pattern(text):
    def repl(match):
        return match.group(0).replace(".", "-")

    return tool_output_pattern.sub(repl, text)


def extract_tool_patterns_from_brackets(text):
    matches = tool_output_brackets_pattern.findall(text)
    return matches


class PatchedConversationalRetrievalChain(ConversationalRetrievalChain):
    is_input_keys: List[str] = Field(default_factory=list)

    @classmethod
    def from_llm(cls, input_keys, *args, **kwargs):
        instance = super().from_llm(*args, **kwargs)
        instance = cast(cls, instance)
        instance.is_input_keys = input_keys
        return instance

    @property
    def input_keys(self) -> List[str]:
        return self.is_input_keys

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]


class PatchedRetrievalQA(RetrievalQA):
    is_input_keys: List[str] = Field(default_factory=list)

    @classmethod
    def from_chain_type(
        cls,
        input_keys,
        *args,
        **kwargs: Any,
    ) -> BaseRetrievalQA:
        instance = super().from_chain_type(*args, **kwargs)
        instance = cast(cls, instance)
        instance.is_input_keys = input_keys
        instance.input_key = "question"
        return instance

    @property
    def input_keys(self) -> List[str]:
        return self.is_input_keys

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]
