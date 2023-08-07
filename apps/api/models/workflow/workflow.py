import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, cast

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.chains import (
    ConversationalRetrievalChain,
    LLMChain,
    SequentialChain,
)
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import BaseMessage
from langchain.schema.output import LLMResult
from models.base import Model, model_manager
from models.retrieval import Retriever
from pydantic import Field

logger = logging.getLogger(__name__)
CHAT_HISTORY_KEY = "chat_history"
QUESTION_KEY = "question"


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


def parse_input_variables_from_template(template: str) -> List[str]:
    return re.findall(r"\{(.+?)\}", template)


def replace_dot_with_dash_in_brackets(text):
    matches = re.findall(r"\{[^}]*\}", text)

    for match in matches:
        replaced = match.replace(".", "-")
        text = text.replace(match, replaced)

    return text


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


class Workflow:
    model: Model
    session_id: str
    context: Optional[SequentialChain] = None
    sequential_chain_callback: Optional[AsyncIteratorCallbackHandler] = None

    def __init__(self, model: Model, session_id: str) -> None:
        chains = []
        self.session_id = session_id
        self.model = model
        for index, _chain in enumerate(model.chains):
            llm, prompt_template = self._prepare_llm_and_template(_chain, index)
            chain = self._prepare_chain(_chain, llm, prompt_template)
            if _chain.key is None:
                logger.warning(f"Chain key is None. model_id: {model.id}")
            chain.output_key = f"{_chain.key}-output"
            chains.append(chain)
        self.context = SequentialChain(
            chains=chains,
            verbose=True,
            input_variables=[QUESTION_KEY, CHAT_HISTORY_KEY],
        )

    def _prepare_llm_and_template(self, _chain, index):
        llm = _chain.llm.dict()
        llm_model = llm.pop("name")
        # TODO add max_tokens to chain
        llm.pop("max_tokens")
        temperature = llm.pop("temperature")
        llm = ChatOpenAI(
            model=llm_model,
            model_kwargs=llm,
            streaming=True,
            temperature=temperature,
            callbacks=[LLMAsyncIteratorCallbackHandler()],
        )
        self.sequential_chain_callback = llm.callbacks[0]
        template = replace_dot_with_dash_in_brackets(_chain.prompt.template)
        template += "\n {question}" if index == 0 else ""

        prompt_template = PromptTemplate(
            template=template,
            input_variables=parse_input_variables_from_template(template),
        )
        return llm, prompt_template

    def _prepare_chain(self, _chain, llm, prompt_template):
        match _chain.chain_type:
            case "conversational_retrieval_qa_chain":
                try:
                    retriever = Retriever(dataset_ids=_chain.datasets).get_retriever()
                    chain = PatchedConversationalRetrievalChain.from_llm(
                        input_keys=prompt_template.input_variables,
                        llm=llm,
                        retriever=retriever,
                        condense_question_prompt=prompt_template,
                        condense_question_llm=ChatOpenAI(),
                    )
                except Exception as e:
                    logger.error(
                        f"Error while creating conversational_retrieval_qa_chain: {e}"
                    )
                    raise e

            case "conversation_chain":
                try:
                    chain = LLMChain(
                        llm=llm,
                        prompt=prompt_template,
                    )
                except Exception as e:
                    logger.error(f"Error while creating conversation_chain: {e}")
                    raise e
            case _:
                logger.error(f"Chain type {_chain.chain_type} not supported")
                raise Exception("Chain type not supported")
        return chain

    async def agenerate(self, messages: List[BaseMessage]) -> str:
        # TODO buffer size limit
        prompt = messages[-1].content
        await self.context.arun({QUESTION_KEY: prompt, CHAT_HISTORY_KEY: messages})
