import inspect
import re
from copy import deepcopy
from typing import Any, Dict, List, Optional, cast

from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)
from langchain.chains import ConversationalRetrievalChain, RetrievalQA
from langchain.chains.base import Chain
from langchain.chains.retrieval_qa.base import BaseRetrievalQA
from langchain.prompts.base import BasePromptTemplate
from langchain.schema.language_model import BaseLanguageModel
from langchain.schema.output import LLMResult
from pydantic import Extra, Field

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

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        """Run get_relevant_text and llm on input query.

        If chain has 'return_source_documents' as 'True', returns
        the retrieved documents as well under the key 'source_documents'.

        Example:
        .. code-block:: python

        res = indexqa({'query': 'This is my query'})
        answer, docs = res['result'], res['source_documents']
        """
        _run_manager = run_manager or AsyncCallbackManagerForChainRun.get_noop_manager()
        question = inputs[self.input_key]
        accepts_run_manager = (
            "run_manager" in inspect.signature(self._aget_docs).parameters
        )
        if accepts_run_manager:
            docs = await self._aget_docs(question, run_manager=_run_manager)
        else:
            docs = await self._aget_docs(question)  # type: ignore[call-arg]
        # To add input variables to the prompt, we need to patch it⬇️
        _input = deepcopy(inputs)
        _input.pop("question")
        answer = await self.combine_documents_chain.arun(
            input_documents=docs,
            question=question,
            callbacks=_run_manager.get_child(),
            **_input,
        )

        if self.return_source_documents:
            return {self.output_key: answer, "source_documents": docs}
        else:
            return {self.output_key: answer}


class BaseCustomChain(Chain):
    prompt: BasePromptTemplate
    llm: BaseLanguageModel
    output_key: str = "text"

    class Config:
        extra = Extra.forbid
        arbitrary_types_allowed = True

    @property
    def input_keys(self) -> List[str]:
        return self.prompt.input_variables

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]

    def _call(
        self, inputs: Dict[str, Any], run_manager: CallbackManagerForChainRun = None
    ) -> Dict[str, str]:
        # Your custom chain logic goes here
        # This is just an example that mimics LLMChain
        prompt_value = self.prompt.format_prompt(**inputs)
        # Whenever you call a language model, or another chain, you should pass
        # a callback manager to it. This allows the inner run to be tracked by
        # any callbacks that are registered on the outer run.
        # You can always obtain a callback manager for this by calling
        # `run_manager.get_child()` as shown below.
        response = self.llm.generate_prompt(
            [prompt_value], callbacks=[run_manager.get_child() if run_manager else None]
        )
        # If you want to log something about this run, you can do so by calling
        # methods on the `run_manager`, as shown below. This will trigger any
        # callbacks that are registered for that event.
        if run_manager:
            run_manager.on_text("Log something about this run")
        return {self.output_key: response.generations[0][0].text}

    async def acall(
        self,
        inputs: Dict[str, Any],
        run_manager: AsyncCallbackManagerForChainRun = None,
    ) -> Dict[str, str]:
        # Your custom chain logic goes here
        # This is just an example that mimics LLMChain
        prompt_value = self.prompt.format_prompt(**inputs)

        # Whenever you call a language model, or another chain, you should pass
        # a callback manager to it. This allows the inner run to be tracked by
        # any callbacks that are registered on the outer run.
        # You can always obtain a callback manager for this by calling
        # `run_manager.get_child()` as shown below.
        response = await self.llm.agenerate_prompt(
            [prompt_value], callbacks=run_manager.get_child() if run_manager else None
        )

        # If you want to log something about this run, you can do so by calling
        # methods on the `run_manager`, as shown below. This will trigger any
        # callbacks that are registered for that event.
        if run_manager:
            await run_manager.on_text("Log something about this run")

        return {self.output_key: response.generations[0][0].text}

    @property
    def _chain_type(self) -> str:
        return "custom_chain"
