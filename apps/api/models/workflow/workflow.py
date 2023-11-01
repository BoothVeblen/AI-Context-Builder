import asyncio
from typing import List, Optional

from langchain.callbacks import OpenAICallbackHandler
from langchain.chat_models import AzureChatOpenAI, ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import AIMessage, BaseMessage, HumanMessage
from loguru import logger
from models.base.model import Model, Chain, Memory
from models.retrieval import Retriever
from pydantic import BaseModel
from utils.config import (
    AZURE_API_KEY,
    AZURE_API_VERSION,
    AZURE_BASE_URL,
    AZURE_DEPLOYMENT_NAME,
)

from .callbacks import (
    CostCalcAsyncHandler,
    IOTraceCallbackHandler,
    LLMAsyncIteratorCallbackHandler,
    SequentialChainAsyncIteratorCallbackHandler,
    TokenCostProcess,
)
from .custom_chain import (
    EnhanceConversationalRetrievalChain,
    EnhanceConversationChain,
    EnhanceSequentialChain,
    TargetedChain,
)
from .utils import (
    extract_tool_patterns_from_brackets,
    replace_dot_with_dash_for_tool_pattern,
)

CHAT_HISTORY_KEY = "chat_history"
QUESTION_KEY = "question"
CONTEXT_KEY = "context"


class Workflow(BaseModel):
    model: Model = None
    session_id: str = None
    context: Optional[EnhanceSequentialChain] = None
    cost_content: TokenCostProcess = TokenCostProcess()
    io_traces: List[str] = []
    known_keys: List[str] = []
    current_memory: dict = {}
    dialog_keys: List[str] = []
    outout_keys: List[str] = []
    outputs: dict = {}
    error_flags: List[Exception] = []
    disconnect_event: Optional[asyncio.Event] = asyncio.Event()

    class Config:
        arbitrary_types_allowed = True

    def __init__(
        self, model: Model, session_id: str, disconnect_event: asyncio.Event
    ) -> None:
        super().__init__()
        chains = []
        self.session_id = session_id
        self.model = model
        self.known_keys = []
        self.cost_content = TokenCostProcess()
        self.dialog_keys = []
        self.error_flags = []
        for _chain in model.chains:
            if _chain.memory == None:
                _chain.memory = Memory()
            llm, prompt_template = self._prepare_llm_and_template(_chain)
            chain = self._prepare_chain(_chain, llm, prompt_template)
            if _chain.key is None:
                logger.warning(f"Chain key is None. model_id: {model.id}")
            chain.output_key = self.get_chain_output_key(_chain.key)
            chain.dialog_key = self.get_chain_dialog_key(_chain.key)
            chains.append(chain)
            self.known_keys.append(chain.output_key)
            self.outout_keys.append(chain.output_key)
            chain_dialog_key = self.get_chain_dialog_key(_chain.key)
            self.known_keys.append(chain_dialog_key)
            self.dialog_keys.append(chain_dialog_key)
            self.disconnect_event = disconnect_event
        self.context = EnhanceSequentialChain(
            chains=chains,
            input_variables=[QUESTION_KEY, CHAT_HISTORY_KEY, CONTEXT_KEY]
            + self.dialog_keys,
            callbacks=[
                SequentialChainAsyncIteratorCallbackHandler(),
                OpenAICallbackHandler(),
            ],
            queue=asyncio.Queue(),
            done=asyncio.Event(),
        )
        self._set_target_chain_output()

    def _set_target_chain_output(self):
        input_keys = set()
        for chain in self.context.chains:
            try:
                if isinstance(chain, TargetedChain):
                    input_keys.update(chain.system_prompt.input_variables)
                    input_keys.update(chain.check_prompt.input_variables)
                else:
                    input_keys.update(chain.prompt.input_variables)
            except Exception as e:
                logger.error(f"Error while getting input_variables: {e}")
        for chain in self.context.chains:
            if isinstance(chain, TargetedChain):
                if chain.output_keys[0] not in input_keys:
                    chain.need_output = False

    def get_chain_output_key(self, chain_key):
        return f"{chain_key}-output".replace("-", "_")

    def get_chain_dialog_key(self, chain_key):
        return f"{chain_key}-dialog".replace("-", "_")

    def clear(self):
        self.context.done = asyncio.Event()
        self.io_traces.clear()
        self.cost_content.total_tokens = 0
        self.cost_content.prompt_tokens = 0
        self.cost_content.completion_tokens = 0
        self.cost_content.successful_requests = 0
        self.context.queue = asyncio.Queue()

    def _prepare_llm_and_template(self, _chain: Chain):
        llm = _chain.llm.dict()
        llm_model = llm.pop("name")
        # TODO add max_tokens to chain
        max_token = llm.pop("max_tokens")
        temperature = llm.pop("temperature")
        if llm_model == "Azure-GPT-3.5":
            llm = AzureChatOpenAI(
                openai_api_base=AZURE_BASE_URL,
                openai_api_version=AZURE_API_VERSION,
                deployment_name=AZURE_DEPLOYMENT_NAME,
                openai_api_key=AZURE_API_KEY,
                openai_api_type="azure",
                streaming=True,
                callbacks=[
                    CostCalcAsyncHandler(llm_model, self.cost_content),
                    IOTraceCallbackHandler(
                        self.io_traces, self.get_chain_output_key(_chain.key)
                    ),
                ],
            )
        else:
            llm = ChatOpenAI(
                model=llm_model,
                model_kwargs=llm,
                streaming=True,
                temperature=temperature,
                max_tokens=max_token,
                callbacks=[
                    CostCalcAsyncHandler(llm_model, self.cost_content),
                    IOTraceCallbackHandler(
                        self.io_traces, self.get_chain_output_key(_chain.key)
                    ),
                ],
            )
        template = _chain.prompt.template

        if _chain.prompt.basic_prompt is not None:
            template = template + _chain.prompt.basic_prompt

        template = replace_dot_with_dash_for_tool_pattern(template)
        # transfer f-format to jinja2 format
        input_variables = extract_tool_patterns_from_brackets(template) + [
            QUESTION_KEY,
            CONTEXT_KEY,
        ]
        unique_input_variables = []
        for var in input_variables:
            if var not in unique_input_variables:
                unique_input_variables.append(var)
        input_variables = []
        for var in unique_input_variables:
            if var.startswith("tool-"):
                _var = "_".join(var.split("-"))
                if _var in self.known_keys:
                    input_variables.append(var)
            elif var in [QUESTION_KEY, CONTEXT_KEY]:
                input_variables.append(var)

        for var in input_variables:
            template = template.replace("[{" + var + "}]", "{{ " + var + " }}")
        for i in range(len(input_variables)):
            var = input_variables[i]
            if var.startswith("tool-"):
                _var = "_".join(var.split("-"))
                template = template.replace("{{ " + var + " }}", "{{ " + _var + " }}")
                input_variables[i] = _var
            else:
                template = template.replace("{" + var + "}", "{{ " + var + " }}")

        if _chain.chain_type == "self_checking_chain":
            output_definition_template = replace_dot_with_dash_for_tool_pattern(
                _chain.prompt.output_definition
            )
            check_prompt = replace_dot_with_dash_for_tool_pattern(
                _chain.prompt.check_prompt
            )
            input_variables += extract_tool_patterns_from_brackets(check_prompt)
            input_variables += extract_tool_patterns_from_brackets(
                output_definition_template
            )
            for var in input_variables:
                output_definition_template = output_definition_template.replace(
                    "[{" + var + "}]", "{{ " + var + " }}"
                )
                check_prompt = check_prompt.replace(
                    "[{" + var + "}]", "{{ " + var + " }}"
                )
            for i in range(len(input_variables)):
                var = input_variables[i]
                if var.startswith("tool-"):
                    _var = "_".join(var.split("-"))
                    output_definition_template = output_definition_template.replace(
                        "{{ " + var + " }}", "{{ " + _var + " }}"
                    )
                    check_prompt = check_prompt.replace(
                        "{{ " + var + " }}", "{{ " + _var + " }}"
                    )
                    input_variables[i] = _var
                else:
                    template = template.replace("{" + var + "}", "{{ " + var + " }}")
                    output_definition_template.replace(
                        "{" + var + "}", "{{ " + var + " }}"
                    )
                    check_prompt.replace("{" + var + "}", "{{ " + var + " }}")
            system_template = PromptTemplate(
                template=template,
                input_variables=input_variables,
                validate_template=True,
                template_format="jinja2",
            )
            check_prompt = check_prompt.replace("[{target}]", _chain.prompt.target)
            check_template = PromptTemplate(
                template=check_prompt,
                input_variables=input_variables,
                validate_template=True,
                template_format="jinja2",
            )
            output_definition_template = output_definition_template.replace(
                "[{target}]", _chain.prompt.target
            )
            output_definition = PromptTemplate(
                template=output_definition_template,
                validate_template=True,
                template_format="jinja2",
                input_variables=input_variables,
            )
            return llm, [system_template, check_template, output_definition]

        prompt_template = PromptTemplate(
            template=template,
            input_variables=input_variables,
            validate_template=True,
            template_format="jinja2",
        )
        return llm, [prompt_template]

    def _prepare_chain(self, _chain: Chain, llm, prompt_template: List[PromptTemplate]):
        match _chain.chain_type:
            case "conversational_retrieval_qa_chain":
                try:
                    retriever = Retriever.get_retriever(
                        filter={
                            "relative_chains": {
                                "$in": [f"{self.model.id}-{_chain.key}"]
                            }
                        }
                    )
                    chain = EnhanceConversationalRetrievalChain(
                        prompt=prompt_template[0],
                        retriever=retriever,
                        llm=llm,
                        memory_option=_chain.memory,
                    )

                    chain.callbacks = [
                        LLMAsyncIteratorCallbackHandler(self.error_flags),
                    ]
                except Exception as e:
                    logger.error(
                        f"Error while creating conversational_retrieval_qa_chain: {e}"
                    )
                    raise e

            case "conversation_chain":
                try:
                    chain = EnhanceConversationChain(
                        llm=llm,
                        prompt=prompt_template[0],
                        memory_option=_chain.memory,
                    )
                    chain.callbacks = [
                        LLMAsyncIteratorCallbackHandler(self.error_flags),
                    ]
                except Exception as e:
                    logger.error(f"Error while creating conversation_chain: {e}")
                    raise e

            case "self_checking_chain":
                try:
                    chain = TargetedChain(
                        llm=llm,
                        system_prompt=prompt_template[0],
                        check_prompt=prompt_template[1],
                        max_retries=_chain.prompt.follow_up_questions_num + 1,
                        target=_chain.prompt.target,
                        memory_option=_chain.memory,
                        output_definition=prompt_template[2],
                    )
                    chain.callbacks = [
                        LLMAsyncIteratorCallbackHandler(self.error_flags),
                    ]
                except Exception as e:
                    logger.error(f"Error while creating self_checking_chain: {e}")
                    raise e

            case _:
                logger.error(f"Chain type {_chain.chain_type} not supported")
                raise Exception("Chain type not supported")

        return chain

    async def agenerate(self, messages: List[BaseMessage]) -> str:
        # TODO buffer size limit
        prompt = messages[-1].content
        dialog = self.get_messages_from_redis_memory()
        await self.context.arun(
            {
                CHAT_HISTORY_KEY: messages,
                QUESTION_KEY: prompt,
                CONTEXT_KEY: "",
                **dialog,
                **self.outputs,
            }
        )

    def get_messages_from_redis_memory(self):
        res = {}
        for dialog_key in self.current_memory:
            chain_memorys = self.current_memory[dialog_key]
            messages = []
            for chain_memory in chain_memorys:
                input = chain_memory.get("input", "")
                output = chain_memory.get("output", "")
                messages += [HumanMessage(content=input), AIMessage(content=output)]
            res[dialog_key] = messages
        return res
