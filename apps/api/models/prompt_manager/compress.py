import tiktoken
from langchain.chains.summarize import load_summarize_chain
from langchain.llms import OpenAI
from langchain.text_splitter import CharacterTextSplitter
from loguru import logger
from langchain.prompts import PromptTemplate
from .utils import MODEL_TO_MAX_TOKEN, RESPONSE_BUFFER_SIZE
from langchain.schema import SystemMessage, Document, HumanMessage
from langchain.schema.messages import get_buffer_string
from utils.base import to_string


class PromptCompressor:
    # openai offical example
    @staticmethod
    def num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613"):
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

    @staticmethod
    def num_tokens_from_contents(content: str, model="gpt-3.5-turbo-0613"):
        """Return the number of tokens used by a string."""
        try:
            encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning("model not found. Using cl100k_base encoding.")
            encoding = tiktoken.get_encoding("cl100k_base")

        return len(encoding.encode(str(content)))

    @staticmethod
    async def sumrize_content(content, model, chain_type, max_tokens=500):
        """Return a summary of a string."""

        content = to_string(content)
        sumrize_step = 0
        current_tokens = PromptCompressor.num_tokens_from_contents(content, model)
        while sumrize_step < 5 and current_tokens > max_tokens:
            summarize_chain = load_summarize_chain(OpenAI(), chain_type=chain_type)
            token_splitter = CharacterTextSplitter.from_tiktoken_encoder(
                chunk_size=100, chunk_overlap=0, separator="\n"
            )
            documents = token_splitter.split_text(content)
            documents = [Document(page_content=document) for document in documents]
            documents = await summarize_chain.acombine_docs(documents)
            sumrize_step += 1
            content = documents[0]
            current_tokens = PromptCompressor.num_tokens_from_contents(content, model)
        if current_tokens > max_tokens:
            logger.warning(
                f"content is too long to summarize. Returning original content. content length: {current_tokens} max_tokens: {max_tokens}"
            )
        return content

    @staticmethod
    async def sumrize_messages(messages: list, model, chain_type, max_tokens=500):
        """Return a summary of a list of messages."""
        sumrize_step = 0
        current_tokens = PromptCompressor.num_tokens_from_messages(messages, model)
        while (sumrize_step < 2) and (current_tokens > max_tokens):
            summarize_chain = load_summarize_chain(OpenAI(), chain_type=chain_type)
            if type(messages[0]) == str:
                documents = [Document(page_content=message) for message in messages]
            else:
                documents = [
                    Document(page_content=message.content) for message in messages
                ]
            splitter = CharacterTextSplitter.from_tiktoken_encoder(
                chunk_size=500, chunk_overlap=0, separator="\n"
            )
            documents = splitter.split_documents(documents)
            documents = await summarize_chain.acombine_docs(documents)
            sumrize_step += 1
            messages = documents[0]
            current_tokens = PromptCompressor.num_tokens_from_messages(messages, model)
        if current_tokens > max_tokens:
            logger.warning(
                f"messages are too long to summarize. Returning original messages. messages length: {current_tokens} max_tokens: {max_tokens}"
            )
        if isinstance(messages, list):
            if messages == []:
                return ""
            if isinstance(messages[0], str):
                return "\n".join([message for message in messages])
            else:
                return "\n".join([message.content for message in messages])
        return messages

    @staticmethod
    async def get_compressed_messages(
        prompt_template: PromptTemplate,
        inputs: dict,
        model: str,
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

        history_messages = history_messages[:-1]
        messages = (
            [SystemMessage(content=prompt_value.to_string())]
            + history_messages
            + [HumanMessage(content=question)]
        )

        current_token = PromptCompressor.num_tokens_from_messages(messages, model)
        if current_token + RESPONSE_BUFFER_SIZE < max_tokens:
            return messages

        # compress history
        compressed_message = await PromptCompressor.sumrize_messages(
            history_messages, model, chain_type="map_reduce", max_tokens=500
        )
        compressed_messages = [
            SystemMessage(content=prompt_value.to_string() + compressed_message)
        ] + [HumanMessage(content=question)]
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
            compressed_inputs[key] = await PromptCompressor.sumrize_content(
                filt_inputs[key], model, chain_type="map_reduce", max_tokens=500
            )
        compressed_prompt_value = prompt_template.format_prompt(**compressed_inputs)
        compressed_messages = [
            SystemMessage(
                content=compressed_prompt_value.to_string() + "\n" + compressed_message
            )
        ] + [HumanMessage(content=question)]
        current_token = PromptCompressor.num_tokens_from_messages(
            compressed_messages, model
        )
        if current_token + RESPONSE_BUFFER_SIZE < max_tokens:
            return compressed_messages

        system_message = compressed_messages[0]

        # compress system message
        compressed_system_message = await PromptCompressor.sumrize_content(
            content=system_message.content,
            model=model,
            chain_type="stuff",
            max_tokens=max_tokens / 2,
        )

        compressed_messages = [
            SystemMessage(content=compressed_system_message),
            HumanMessage(content=question),
        ]

        if current_token + RESPONSE_BUFFER_SIZE > max_tokens:
            logger.warning(
                f"compressed messages are still too long. Returning original messages."
            )
        return compressed_messages

        # # compress question
        # system_message_token = PromptCompressor.num_tokens_from_messages(
        #     [SystemMessage(content=compressed_system_message)], model
        # )
        # question_token = max_tokens - RESPONSE_BUFFER_SIZE - system_message_token
        # question = question[: -(question_token * 2)]
        # return [
        #     SystemMessage(content=compressed_system_message),
        #     HumanMessage(content=question),
        # ]
