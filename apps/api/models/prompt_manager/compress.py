import tiktoken
from langchain.chains.summarize import load_summarize_chain
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import Document, HumanMessage, SystemMessage
from utils.base import get_buffer_string
from langchain.text_splitter import CharacterTextSplitter
from loguru import logger
from models.base.model import Memory
from utils.base import to_string

from .memory import (
    ConversationBufferWindowMemoryMixin,
    ConversationSummaryBufferMemoryMixin,
    ConversationTokenBufferMemoryMixin,
)
from .utils import MODEL_TO_MAX_TOKEN, RESPONSE_BUFFER_SIZE


class PromptCompressor(
    ConversationTokenBufferMemoryMixin,
    ConversationSummaryBufferMemoryMixin,
    ConversationBufferWindowMemoryMixin,
):
    # openai offical example
    @classmethod
    def num_tokens_from_messages(cls, messages, model="gpt-3.5-turbo-0613"):
        """Return the number of tokens used by a list of messages."""
        try:
            encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning("model not found. Using cl100k_base encoding.")
            encoding = tiktoken.get_encoding("cl100k_base")
        if model in {
            "gpt-3.5-turbo-0613",
            "gpt-3.5-turbo-16k-0613",
            "gpt-4-0314",
            "gpt-4-32k-0314",
            "gpt-4-0613",
            "gpt-4-32k-0613",
        }:
            tokens_per_message = 3
            tokens_per_name = 1
        elif model == "gpt-3.5-turbo-0301":
            tokens_per_message = (
                4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
            )
            tokens_per_name = -1  # if there's a name, the role is omitted
        elif "gpt-3.5-turbo" in model:
            logger.warning(
                "gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613."
            )
            return PromptCompressor.num_tokens_from_messages(
                messages, model="gpt-3.5-turbo-0613"
            )
        elif "gpt-4" in model:
            logger.warning(
                "gpt-4 may update over time. Returning num tokens assuming gpt-4-0613."
            )
            return PromptCompressor.num_tokens_from_messages(
                messages, model="gpt-4-0613"
            )
        else:
            raise NotImplementedError(
                f"""num_tokens_from_messages() is not implemented for model {model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens."""
            )
        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            if type(message) == str:
                num_tokens += len(encoding.encode(message))
            else:
                num_tokens += len(encoding.encode(message.content))
        num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
        return num_tokens

    @classmethod
    def num_tokens_from_contents(cls, content: str, model="gpt-3.5-turbo-0613"):
        """Return the number of tokens used by a string."""
        try:
            encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning("model not found. Using cl100k_base encoding.")
            encoding = tiktoken.get_encoding("cl100k_base")

        return len(encoding.encode(str(content)))

    @classmethod
    def sumrize_content(cls, content, model, chain_type, max_tokens=500):
        """Return a summary of a string."""

        content = to_string(content)
        sumrize_step = 0
        current_tokens = PromptCompressor.num_tokens_from_contents(content, model)
        while sumrize_step < 5 and current_tokens > max_tokens:
            summarize_chain = load_summarize_chain(OpenAI(), chain_type=chain_type)
            token_splitter = CharacterTextSplitter(
                chunk_size=100, chunk_overlap=0, separator="\n"
            )
            documents = token_splitter.split_text(content)
            documents = [Document(page_content=document) for document in documents]
            documents = summarize_chain.combine_docs(documents)
            sumrize_step += 1
            content = documents[0]
            current_tokens = PromptCompressor.num_tokens_from_contents(content, model)
        if current_tokens > max_tokens:
            logger.warning(
                f"content is too long to summarize. Returning original content. content length: {current_tokens} max_tokens: {max_tokens}"
            )
        return content

    @classmethod
    def sumrize_messages(
        cls, messages: list, memory: Memory, model: str = "gpt-3.5-turbo-0613"
    ) -> (list, str):
        match memory.memory_type:
            case "no_memory":
                return [], ""
            case "conversation_buffer_window_memory":
                return (
                    PromptCompressor.get_buffer_window_meesages(messages, memory.k),
                    "",
                )
            case "conversation_token_buffer_memory":
                return (
                    PromptCompressor.get_token_buffer_messages(
                        messages, memory.max_token_limit, model
                    ),
                    "",
                )
            case "summary_memory":
                return PromptCompressor.get_summary_buffer_messages(
                    messages, memory.max_token_limit, model
                )

    @classmethod
    async def get_compressed_messages(
        cls,
        prompt_template: PromptTemplate,
        inputs: dict,
        model: str,
        memory: Memory,
        chain_dialog_key="chat_history",
    ):
        """Return a compressed list of messages."""
        max_tokens = MODEL_TO_MAX_TOKEN.get(model)
        if max_tokens is None:
            raise NotImplementedError(
                f"get_compressed_messages() is not implemented for model {model}."
            )
        question = inputs.get("question")
        if question is None:
            logger.warning("question is not provided. Returning original messages.")
        filt_inputs = {}
        for k in inputs:
            if "dialog" in k and isinstance(inputs[k], list):
                try:
                    filt_inputs[k] = get_buffer_string(inputs[k])
                except:
                    filt_inputs[k] = inputs[k]
            else:
                filt_inputs[k] = inputs[k]
        prompt_value = prompt_template.format_prompt(**filt_inputs)
        history_messages = inputs.get(chain_dialog_key, [])

        # compress history
        # TODO change variable name
        compressed_memory, system_suffix = PromptCompressor.sumrize_messages(
            history_messages, memory, model=model
        )
        compressed_messages = (
            [SystemMessage(content=prompt_value.to_string() + system_suffix)]
            + compressed_memory
            + [HumanMessage(content=question)]
        )
        current_token = PromptCompressor.num_tokens_from_messages(
            compressed_messages, model
        )
        if current_token + RESPONSE_BUFFER_SIZE < max_tokens:
            return compressed_messages

        # compress variables
        compressed_inputs = {}
        for key in filt_inputs:
            if key == "chat_history" or key == "question" or key == chain_dialog_key:
                continue
            if type(filt_inputs[key]) == list:
                continue
            compressed_inputs[key] = PromptCompressor.sumrize_content(
                filt_inputs[key], model, chain_type="map_reduce", max_tokens=500
            )
        compressed_prompt_value = prompt_template.format_prompt(**compressed_inputs)
        compressed_messages = (
            [
                SystemMessage(
                    content=compressed_prompt_value.to_string() + "\n" + system_suffix
                )
            ]
            + compressed_memory
            + [HumanMessage(content=question)]
        )
        return compressed_messages
