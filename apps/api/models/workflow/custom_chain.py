import asyncio
import inspect
import time
from enum import Enum
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
from uuid import UUID

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    AsyncCallbackManagerForLLMRun,
    CallbackManagerForChainRun,
)
from langchain.chains import (
    ConversationChain,
    LLMChain,
    LLMSummarizationCheckerChain,
    SequentialChain,
)
from langchain.chains.base import Chain
from langchain.chat_models import ChatOpenAI
from langchain.prompts.base import BasePromptTemplate
from langchain.retrievers import SelfQueryRetriever
from langchain.schema import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain.schema.language_model import BaseLanguageModel
from utils.base import get_buffer_string
from loguru import logger
from models.base.model import Memory
from models.prompt_manager.compress import PromptCompressor
from pydantic import Extra, Field, root_validator
from utils.base import to_string

from .callbacks import CustomAsyncIteratorCallbackHandler


class TargetedChainStatus(str, Enum):
    INIT = "initialized"
    FINISHED = "finished"
    ERROR = "error"
    RUNNING = "running"


class TargetedChain(Chain):
    system_prompt: BasePromptTemplate
    check_prompt: BasePromptTemplate
    output_definition: BasePromptTemplate
    llm: ChatOpenAI
    memory_option: Memory = Field(default_factory=Memory)
    output_key: str = "text"
    max_retries: int = 0
    process: str = TargetedChainStatus.INIT
    suffix: str = "The content you want to output first is:"
    dialog_key: str = "dialog"
    target: str = "target"
    need_output: bool = True

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
        if inputs.get(self.dialog_key, None) is not None and isinstance(
            inputs[self.dialog_key], str
        ):
            inputs[self.dialog_key] = [inputs[self.dialog_key]]
        basic_messages = inputs.get(self.dialog_key, [])
        human_input = inputs.get("question", "")
        basic_messages += [HumanMessage(content=human_input)]

        question = ""
        if self.process == TargetedChainStatus.RUNNING:
            prompt_value = self.check_prompt.format_prompt(**inputs)
            messages = [SystemMessage(content=prompt_value.to_string())] + [
                HumanMessage(
                    content=get_buffer_string(
                        basic_messages, human_prefix="User", ai_prefix="AI"
                    )
                )
            ]
            response = await self.llm.agenerate(
                messages=[messages],
                callbacks=run_manager.get_child() if run_manager else None,
            )
            response_text = response.generations[0][0].text
            if response_text.startswith("AI:"):
                response_text = response_text[3:]
            # if response.generations[0][0].text.lower().startswith("yes"):
            if (
                response_text.lower().strip().startswith("yes")
                and len(response_text) < 5
            ):
                self.process = TargetedChainStatus.FINISHED
                return {self.output_key: response_text}
            else:
                self.max_retries -= 1
                if self.max_retries <= 0:
                    self.process = TargetedChainStatus.ERROR
                    return {self.output_key: response_text}
                question = response_text
        prompt_value = self.system_prompt.format_prompt(**inputs)
        if self.process == TargetedChainStatus.INIT:
            self.process = TargetedChainStatus.RUNNING
            system_message = prompt_value.to_string()
        else:
            system_message = f"{prompt_value.to_string()}\n{self.suffix}{question}\n"
        messages = [SystemMessage(content=system_message)] + basic_messages
        response = await self.llm.agenerate(
            messages=[messages],
            callbacks=run_manager.get_child() if run_manager else None,
        )
        return {self.output_key: response.generations[0][0].text}

    async def get_output(
        self,
        inputs: dict,
    ):
        if self.process == TargetedChainStatus.RUNNING:
            return ""

        if self.need_output is False:
            return ""

        copy_inputs = inputs.copy()
        for k in copy_inputs:
            if "dialog" in k:
                try:
                    copy_inputs[k] = get_buffer_string(
                        copy_inputs[k], human_prefix="User"
                    )
                except:
                    logger.error(f"Error in get_output: {copy_inputs[k]}")

        run_manager = AsyncCallbackManagerForChainRun.get_noop_manager()
        response = await self.llm.agenerate(
            messages=[
                [
                    SystemMessage(content=""),
                    HumanMessage(
                        content=self.output_definition.format_prompt(
                            **copy_inputs
                        ).to_string()
                    ),
                ]
            ],
            callbacks=run_manager.get_child(),
        )
        if response.generations[0][0].text.startswith("AI:"):
            return response.generations[0][0].text[3:].strip()
        return response.generations[0][0].text


class EnhanceSequentialChain(SequentialChain):
    queue: asyncio.Queue[str]
    done: asyncio.Event
    known_values: Dict[str, Any] = Field(default_factory=dict)
    state_dependent_chains = [TargetedChain]
    current_chain: int = 0
    current_chain_io: List = []

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
        while self.current_chain < len(self.chains):
            chain = self.chains[self.current_chain]
            if type(chain) in self.state_dependent_chains:
                if (
                    chain.process == TargetedChainStatus.FINISHED
                    or chain.process == TargetedChainStatus.ERROR
                ):
                    self.current_chain += 1
                    continue
                else:
                    outputs = await chain.acall(
                        self.known_values, return_only_outputs=True, callbacks=callbacks
                    )
                    pre_dialog = inputs.get(chain.dialog_key, [])
                    current_output = outputs[chain.output_key]
                    outputs[chain.dialog_key] = (
                        get_buffer_string(pre_dialog)
                        + "\n"
                        + get_buffer_string(
                            [
                                HumanMessage(content=inputs["question"]),
                                AIMessage(content=current_output),
                            ],
                        )
                    )
                    outputs[chain.output_key] = await chain.get_output(
                        inputs=self.known_values
                    )
                    self.known_values.update(outputs)
                    self.current_chain_io.append(
                        {
                            "input": inputs["question"],
                            "output": current_output,
                            "chain_key": chain.output_key,
                        }
                    )
                    if chain.process not in [
                        TargetedChainStatus.FINISHED,
                        TargetedChainStatus.ERROR,
                    ]:
                        await self._put_tokens_into_queue(current_output)
                        return self._construct_return_dict()
                    elif self.current_chain == len(self.chains) - 1:
                        await self._handle_final_chain()
                        return self._construct_return_dict()
                    else:
                        inputs["question"] = ""
                        self.known_values["question"] = ""
                        self.current_chain += 1
            else:
                if self.current_chain == len(self.chains) - 1:
                    callbacks.add_handler(
                        CustomAsyncIteratorCallbackHandler(self.queue, self.done)
                    )
                outputs = await chain.acall(
                    self.known_values, return_only_outputs=True, callbacks=callbacks
                )
                pre_dialog = inputs.get(chain.dialog_key, [])
                outputs[chain.dialog_key] = (
                    get_buffer_string(pre_dialog)
                    + "\n"
                    + get_buffer_string(
                        [
                            HumanMessage(content=inputs["question"]),
                            AIMessage(content=outputs[chain.output_key]),
                        ],
                    )
                )
                self.known_values.update(outputs)
                self.current_chain_io.append(
                    {
                        "input": inputs["question"],
                        "output": outputs[chain.output_key],
                        "chain_key": chain.output_key,
                    }
                )
                if self.current_chain == len(self.chains) - 1:
                    self.current_chain = 0
                    return self._construct_return_dict()
                else:
                    self.current_chain += 1
        return self._construct_return_dict()

    async def _handle_final_chain(self):
        target_finished = "This chat has completed its goal. Please create a new chat to have a conversation."
        logger.info(f"Putting {target_finished} into queue")
        await self._put_tokens_into_queue(target_finished)

    async def _put_tokens_into_queue(self, tokens: str):
        for token in tokens:
            await self.queue.put(token)
        # I need to put all the output tokens into a queue so that
        # I can asynchronously fetch them from the queue later.
        # This code ensures that the queue becomes empty after all the tokens have been placed in it,
        # which ensures that all the tokens are processed.
        # If I don't do this, because of the competition between the two tasks in the aider function,
        # it will result in the loss of a token
        while not self.queue.empty():
            await asyncio.sleep(2)
        self.done.set()

    def _construct_return_dict(self):
        return_dict = {}
        for k in self.output_variables:
            return_dict[k] = self.known_values.get(k, "")
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
    memory_option: Memory = Field(default_factory=Memory)
    output_key: str = "text"
    dialog_key: str = "dialog"

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
        if inputs.get(self.dialog_key, None) is not None and isinstance(
            inputs[self.dialog_key], str
        ):
            inputs[self.dialog_key] = [inputs[self.dialog_key]]
        messages = await PromptCompressor.get_compressed_messages(
            prompt_template=self.prompt,
            inputs=inputs,
            model=self.llm.model_name,
            chain_dialog_key=self.dialog_key,
            memory=self.memory_option,
        )
        response = await self.llm.agenerate(
            messages=[messages],
            callbacks=run_manager.get_child() if run_manager else None,
        )
        return {self.output_key: response.generations[0][0].text}


class EnhanceConversationalRetrievalChain(Chain):
    prompt: BasePromptTemplate
    llm: ChatOpenAI
    memory_option: Memory = Field(default_factory=Memory)
    output_key: str = "text"
    retriever: SelfQueryRetriever
    dialog_key: str = "dialog"

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
        if inputs.get(self.dialog_key, None) is not None and isinstance(
            inputs[self.dialog_key], str
        ):
            inputs[self.dialog_key] = [inputs[self.dialog_key]]
        messages = inputs.get(self.dialog_key, [])

        question = inputs.get("question", None)
        if question is None:
            raise ValueError("Question is required")

        docs = await self.retriever.aget_relevant_documents(
            question, callbacks=run_manager.get_child()
        )
        context = "\n".join([to_string(doc.page_content) for doc in docs])
        inputs["context"] = context
        messages = await PromptCompressor.get_compressed_messages(
            self.prompt,
            inputs,
            self.llm.model_name,
            memory=self.memory_option,
            chain_dialog_key=self.dialog_key,
        )
        response = await self.llm.agenerate(
            messages=[messages],
            callbacks=run_manager.get_child() if run_manager else None,
        )
        return {self.output_key: response.generations[0][0].text}
