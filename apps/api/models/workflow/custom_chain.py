import asyncio
from typing import (
    Any,
    AsyncIterator,
    Coroutine,
    Dict,
    List,
    Literal,
    Optional,
    Union,
    cast,
)
from enum import Enum
import time
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)
from langchain.chains import (
    ConversationChain,
    LLMSummarizationCheckerChain,
    SequentialChain,
    LLMChain,
)
from langchain.chains.base import Chain
from langchain.prompts.base import BasePromptTemplate
from langchain.schema.language_model import BaseLanguageModel
from langchain.schema import SystemMessage, HumanMessage
from loguru import logger
from pydantic import Extra, root_validator, Field
import inspect
from langchain.schema.messages import get_buffer_string

from langchain.chat_models import ChatOpenAI
from langchain.retrievers import SelfQueryRetriever


class CustomAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    def __init__(self, queue, done) -> None:
        self.done = done
        self.queue = queue

    async def on_llm_new_token(
        self, token: str, **kwargs: Any
    ) -> Coroutine[Any, Any, None]:
        if token is not None and token != "":
            await self.queue.put(token)

    async def on_chain_end(self, response: Any, **kwargs: Any) -> None:
        self.done.set()


class TargetedChainStatus(str, Enum):
    INIT = "initialized"
    FINISHED = "finished"
    ERROR = "error"
    RUNNING = "running"


class TargetedChain(Chain):
    system_prompt: BasePromptTemplate
    check_prompt: BasePromptTemplate
    llm: ChatOpenAI
    output_key: str = "text"
    max_retries: int = 0
    process: str = TargetedChainStatus.INIT
    suffix: str = "The content you want to output first is:"

    class Config:
        extra = Extra.forbid
        arbitrary_types_allowed = True

    @property
    def input_keys(self) -> List[str]:
        return self.check_prompt.input_variables

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: CallbackManagerForChainRun | None = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: AsyncCallbackManagerForChainRun | None = None,
    ) -> Coroutine[Any, Any, Dict[str, Any]]:
        if inputs.get("chat_history", None) is not None and isinstance(
            inputs["chat_history"], str
        ):
            inputs["chat_history"] = [inputs["chat_history"]]
        bacis_messages = inputs.get("chat_history", [])
        inputs.pop("chat_history", None)

        question = ""
        if self.process == TargetedChainStatus.RUNNING:
            prompt_value = self.check_prompt.format_prompt(**inputs)
            messages = [SystemMessage(content=prompt_value.to_string())] + [
                HumanMessage(
                    content=get_buffer_string(
                        bacis_messages, human_prefix="User", ai_prefix="AI"
                    )
                )
            ]
            response = await self.llm.agenerate(
                messages=[messages],
                callbacks=run_manager.get_child() if run_manager else None,
            )
            if response.generations[0][0].text == "Yes":
                self.process = TargetedChainStatus.FINISHED
                return {self.output_key: response.generations[0][0].text}
            else:
                self.max_retries -= 1
                if self.max_retries <= 0:
                    self.process = TargetedChainStatus.ERROR
                    return {self.output_key: response.generations[0][0].text}
                question = response.generations[0][0].text
        prompt_value = self.system_prompt.format_prompt(**inputs)
        if self.process == TargetedChainStatus.INIT:
            self.process = TargetedChainStatus.RUNNING
            system_message = prompt_value.to_string()
        elif self.process == TargetedChainStatus.RUNNING:
            system_message = f"{prompt_value.to_string()}\n{self.suffix}{question}\n"
        messages = [SystemMessage(content=system_message)] + bacis_messages
        response = await self.llm.agenerate(
            messages=[messages],
            callbacks=run_manager.get_child() if run_manager else None,
        )
        return {self.output_key: response.generations[0][0].text}


class EnhanceSequentialChain(SequentialChain):
    queue: asyncio.Queue[str]
    done: asyncio.Event
    known_values: Dict[str, Any] = Field(default_factory=dict)
    state_dependent_chains = [TargetedChain]

    class Config:
        extra = Extra.allow
        arbitrary_types_allowed = True

    def _call(
        self,
        inputs: Dict[str, str],
        run_manager: CallbackManagerForChainRun | None = None,
    ) -> Dict[str, str]:
        raise NotImplementedError

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: AsyncCallbackManagerForChainRun | None = None,
    ) -> Dict[str, Any]:
        self.known_values.update(inputs)
        _run_manager = run_manager or AsyncCallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        for i, chain in enumerate(self.chains):
            if type(chain) in self.state_dependent_chains:
                if (
                    chain.process == TargetedChainStatus.FINISHED
                    or chain.process == TargetedChainStatus.ERROR
                ):
                    logger.info(f"Skipping chain {i} as it is already {chain.process}")
                    continue
                else:
                    outputs = await chain.acall(
                        self.known_values, return_only_outputs=True, callbacks=callbacks
                    )
                    self.known_values.update(outputs)
                    if chain.process not in [
                        TargetedChainStatus.FINISHED,
                        TargetedChainStatus.ERROR,
                    ]:
                        for token in outputs[chain.output_key]:
                            await self.queue.put(token)
                        while not self.queue.empty():
                            await asyncio.sleep(2)
                        # I need to put all the output tokens into a queue so that
                        # I can asynchronously fetch them from the queue later.
                        # This code ensures that the queue becomes empty after all the tokens have been placed in it,
                        # which ensures that all the tokens are processed.
                        # If I don't do this, because of the competition between the two tasks in the aider function,
                        # it will result in the loss of a token
                        self.done.set()
                        return_dict = {}
                        for k in self.output_variables:
                            if k in self.known_values:
                                return_dict[k] = self.known_values[k]
                            else:
                                return_dict[k] = ""
                        return return_dict
            else:
                if i == len(self.chains) - 1:
                    callbacks.add_handler(
                        CustomAsyncIteratorCallbackHandler(self.queue, self.done)
                    )
                outputs = await chain.acall(
                    self.known_values, return_only_outputs=True, callbacks=callbacks
                )
                self.known_values.update(outputs)
        return_dict = {}
        for k in self.output_variables:
            if k in self.known_values:
                return_dict[k] = self.known_values[k]
            else:
                return_dict[k] = ""
        return return_dict

    async def aiter(self) -> AsyncIterator[str]:
        while not self.queue.empty() or not self.done.is_set():
            # Wait for the next token in the queue,
            # but stop waiting if the done event is set
            done, other = await asyncio.wait(
                [
                    # NOTE: If you add other tasks here, update the code below,
                    # which assumes each set has exactly one task each
                    asyncio.ensure_future(self.queue.get()),
                    asyncio.ensure_future(self.done.wait()),
                ],
                return_when=asyncio.FIRST_COMPLETED,
            )
            if other:
                other.pop().cancel()
            token_or_done = cast(Union[str, Literal[True]], done.pop().result())
            if token_or_done is True:
                while not self.queue.empty():
                    yield await self.queue.get()
                break
            yield token_or_done


class EnhanceConversationChain(Chain):
    prompt: BasePromptTemplate
    llm: ChatOpenAI
    output_key: str = "text"

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: CallbackManagerForChainRun | None = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError

    @property
    def input_keys(self) -> List[str]:
        return self.prompt.input_variables

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: AsyncCallbackManagerForChainRun | None = None,
    ) -> Dict[str, Any]:
        if inputs.get("chat_history", None) is not None and isinstance(
            inputs["chat_history"], str
        ):
            inputs["chat_history"] = [inputs["chat_history"]]
        messages = inputs.get("chat_history", [])
        inputs.pop("chat_history", None)
        prompt_value = self.prompt.format_prompt(**inputs)
        messages = [SystemMessage(content=prompt_value.to_string())] + messages
        response = await self.llm.agenerate(
            messages=[messages],
            callbacks=run_manager.get_child() if run_manager else None,
        )
        return {self.output_key: response.generations[0][0].text}


class EnhanceConversationalRetrievalChain(Chain):
    prompt: BasePromptTemplate
    llm: ChatOpenAI
    output_key: str = "text"
    retriever: SelfQueryRetriever

    @property
    def input_keys(self) -> List[str]:
        return self.prompt.input_variables

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: CallbackManagerForChainRun | None = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: AsyncCallbackManagerForChainRun | None = None,
    ) -> Dict[str, Any]:
        if inputs.get("chat_history", None) is not None and isinstance(
            inputs["chat_history"], str
        ):
            inputs["chat_history"] = [inputs["chat_history"]]
        messages = inputs.get("chat_history", [])
        inputs.pop("chat_history", None)
        question = inputs.get("question", None)
        if question is None:
            raise ValueError("Question is required")
        inputs.pop("question", None)

        docs = await self.retriever.aget_relevant_documents(
            question, callbacks=run_manager.get_child()
        )
        context = "\n".join([doc.page_content for doc in docs])
        inputs["context"] = context
        prompt_value = self.prompt.format_prompt(**inputs)
        messages = [SystemMessage(content=prompt_value.to_string())] + messages
        messages = [SystemMessage(content=prompt_value.to_string())] + messages
        response = await self.llm.agenerate(
            messages=[messages],
            callbacks=run_manager.get_child() if run_manager else None,
        )
        return {self.output_key: response.generations[0][0].text}
