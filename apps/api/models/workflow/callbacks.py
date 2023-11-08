import asyncio
from asyncio import Task, sleep
from typing import Any, Coroutine, Dict, List, Optional, Union, cast
from uuid import UUID

import tiktoken
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.callbacks.base import AsyncCallbackHandler
from langchain.schema import LLMResult
from langchain.schema.messages import BaseMessage
from langchain.schema.output import LLMResult
from loguru import logger
from pydantic import BaseModel, Field

# https://github.com/langchain-ai/langchain/issues/3114

MODEL_COST_PER_1K_TOKENS = {
    # GPT-4 input
    "gpt-4": 0.03,
    "gpt-4-0314": 0.03,
    "gpt-4-0613": 0.03,
    "gpt-4-32k": 0.06,
    "gpt-4-32k-0314": 0.06,
    "gpt-4-32k-0613": 0.06,
    # GPT-4 output
    "gpt-4-completion": 0.06,
    "gpt-4-0314-completion": 0.06,
    "gpt-4-0613-completion": 0.06,
    "gpt-4-32k-completion": 0.12,
    "gpt-4-32k-0314-completion": 0.12,
    "gpt-4-32k-0613-completion": 0.12,
    # GPT-3.5 input
    "gpt-3.5-turbo": 0.0015,
    "gpt-3.5-turbo-0301": 0.0015,
    "gpt-3.5-turbo-0613": 0.0015,
    "gpt-3.5-turbo-16k": 0.003,
    "gpt-3.5-turbo-16k-0613": 0.003,
    # GPT-3.5 output
    "gpt-3.5-turbo-completion": 0.002,
    "gpt-3.5-turbo-0301-completion": 0.002,
    "gpt-3.5-turbo-0613-completion": 0.002,
    "gpt-3.5-turbo-16k-completion": 0.004,
    "gpt-3.5-turbo-16k-0613-completion": 0.004,
    # Azure GPT-35 input
    "gpt-35-turbo": 0.0015,  # Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0301": 0.0015,  # Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0613": 0.0015,
    "gpt-35-turbo-16k": 0.003,
    "gpt-35-turbo-16k-0613": 0.003,
    # Azure GPT-35 output
    "gpt-35-turbo-completion": 0.002,  # Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0301-completion": 0.002,  # Azure OpenAI version of ChatGPT
    "gpt-35-turbo-0613-completion": 0.002,
    "gpt-35-turbo-16k-completion": 0.004,
    "gpt-35-turbo-16k-0613-completion": 0.004,
    # Others
    "text-ada-001": 0.0004,
    "ada": 0.0004,
    "text-babbage-001": 0.0005,
    "babbage": 0.0005,
    "text-curie-001": 0.002,
    "curie": 0.002,
    "text-davinci-003": 0.02,
    "text-davinci-002": 0.02,
    "code-davinci-002": 0.02,
    "ada-finetuned": 0.0016,
    "babbage-finetuned": 0.0024,
    "curie-finetuned": 0.012,
    "davinci-finetuned": 0.12,
}


class IOTrace(BaseModel):
    input: str
    output: str


class TokenCostProcess(BaseModel):
    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    successful_requests: int = 0

    def sum_prompt_tokens(self, tokens: int):
        self.prompt_tokens = self.prompt_tokens + tokens
        self.total_tokens = self.total_tokens + tokens

    def sum_completion_tokens(self, tokens: int):
        self.completion_tokens = self.completion_tokens + tokens
        self.total_tokens = self.total_tokens + tokens

    def sum_successful_requests(self, requests: int):
        self.successful_requests = self.successful_requests + requests

    def get_openai_total_cost_for_model(self, model: str) -> float:
        return MODEL_COST_PER_1K_TOKENS[model] * self.total_tokens / 1000

    def get_cost_summary(self, model: str) -> str:
        cost = self.get_openai_total_cost_for_model(model)

        return (
            f"Tokens Used: {self.total_tokens}\n"
            f"\tPrompt Tokens: {self.prompt_tokens}\n"
            f"\tCompletion Tokens: {self.completion_tokens}\n"
            f"Successful Requests: {self.successful_requests}\n"
            f"Total Cost (USD): {cost}"
        )


class IOTraceCallbackHandler(AsyncCallbackHandler):
    def __init__(self, lis: [], chain_output_key) -> None:
        self.content = lis
        self.chain_output_key = chain_output_key

    async def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Coroutine[Any, Any, None]:
        pass

    async def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        **kwargs: Any,
    ) -> Coroutine[Any, Any, None]:
        self.content.append(
            {
                "input": self.tem_input,
                "output": response.generations[0][0].text,
                "chain_key": self.chain_output_key,
            }
        )

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Any:
        # system message and user input
        self.tem_input = (
            f"System: {messages[0][0].content}\nHuman: {messages[0][-1].content}"
        )
        logger.info(f"input log in callback: {self.tem_input}")


class CostCalcAsyncHandler(AsyncCallbackHandler):
    model: str = ""
    token_cost_process: TokenCostProcess

    def __init__(
        self, model_name: str, token_cost_process: TokenCostProcess = TokenCostProcess()
    ):
        self.model = model_name
        self.token_cost_process = token_cost_process

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        encoding = tiktoken.encoding_for_model(self.model)
        for prompt in prompts:
            self.token_cost_process.sum_prompt_tokens(len(encoding.encode(prompt)))

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.token_cost_process.sum_completion_tokens(1)

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.token_cost_process.sum_successful_requests(1)

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Any:
        pass


class SequentialChainAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    error_flags: List[Exception | KeyboardInterrupt] = Field(default=[])

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
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        await super().on_chain_start(serialized, prompts, **kwargs)

    async def on_chain_end(self, response: LLMResult, **kwargs: Any):
        await super().on_chain_end(response, **kwargs)

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

    async def on_chain_error(
        self,
        error: Exception | KeyboardInterrupt,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        **kwargs: Any,
    ) -> None:
        pass

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Any:
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
        await super().on_chain_start(serialized, prompts, **kwargs)

    async def on_chain_end(self, response: LLMResult, **kwargs: Any):
        await super().on_chain_end(response, **kwargs)

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        return await super().on_llm_new_token(token, **kwargs)

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Any:
        pass


class LLMAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    current_number: int = Field(default=0)
    sending_number: bool = Field(default=True)
    error_flags: List[Exception | KeyboardInterrupt] = Field(default=[])

    def __init__(self, error_flags) -> None:
        self.timer_task: Task = None
        super().__init__()
        if self.timer_task:
            self.timer_task.cancel()
        self.done.clear()
        self.current_number = 0
        self.timer_task = asyncio.create_task(self._send_number())
        self.error_flags = error_flags

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

    async def on_chain_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        await super().on_chain_start(serialized, prompts, **kwargs)

    async def on_chain_end(self, response: LLMResult, **kwargs: Any):
        await super().on_chain_end(response, **kwargs)

    async def on_llm_error(
        self, error: Exception | KeyboardInterrupt, **kwargs: Any
    ) -> None:
        self.error_flags.append(error)
        return await super().on_llm_error(error, **kwargs)

    async def on_chain_error(
        self,
        error: Exception | KeyboardInterrupt,
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        **kwargs: Any,
    ) -> None:
        self.error_flags.append(error)
        return await super().on_chain_error(
            error, run_id=run_id, parent_run_id=parent_run_id, tags=tags, **kwargs
        )


class CustomAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    def __init__(self, queue, done) -> None:
        self.done = done
        self.queue = queue

    async def on_llm_new_token(
        self, token: str, **kwargs: Any
    ) -> Coroutine[Any, Any, None]:
        if token is not None and token != "":
            await self.queue.put(token)

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: List[str] | None = None,
        metadata: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Any:
        pass

    async def on_llm_error(
        self, error: Exception | KeyboardInterrupt, **kwargs: Any
    ) -> None:
        return await super().on_llm_error(error, **kwargs)
