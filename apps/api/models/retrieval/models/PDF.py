import io
import logging
import uuid
from typing import List
import io

import pinecone
from langchain.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.document_loaders import OnlinePDFLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.llms import OpenAI
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.schema import Document
from langchain.vectorstores import Pinecone
from models.data_loader import PDFLoader
from utils import PINECONE_API_KEY, PINECONE_ENVIRONMENT
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pydantic import BaseModel, Field
from utils import PINECONE_API_KEY, PINECONE_ENVIRONMENT


logger = logging.getLogger(__name__)


def extract_text_from_pdf(contents: io.BytesIO) -> list:
    resource_manager = PDFResourceManager()
    fake_file_handle = io.StringIO()
    converter = TextConverter(resource_manager, fake_file_handle, laparams=LAParams())
    page_interpreter = PDFPageInterpreter(resource_manager, converter)
    for page in PDFPage.get_pages(contents, caching=True, check_extractable=True):
        page_interpreter.process_page(page)
    text = fake_file_handle.getvalue()
    pages = text.split("\f")

    # Remove the last line of each page if it's a number or its length is less than 5
    for i in range(len(pages)):
        lines = pages[i].split("\n")
        if len(lines) > 1:  # Ensure there is more than one line
            last_line = lines[-1]
            if last_line.isdigit() or len(last_line) < 5:
                logger.debug(f"Removing last line: {last_line}")
                lines = lines[:-1]  # Remove the last line
                pages[i] = "\n".join(lines)

    # Join the pages back together
    text = "\f".join(pages)

    converter.close()
    fake_file_handle.close()

    return text


logger = logging.getLogger(__name__)


class PatchedSelfQueryRetriever(SelfQueryRetriever):
    async def _aget_relevant_documents(
        self, query: str, *, run_manager: AsyncCallbackManagerForRetrieverRun
    ) -> List[Document]:
        if self.search_type == "similarity":
            docs = await self.vectorstore.asimilarity_search(
                query, **self.search_kwargs
            )
        elif self.search_type == "similarity_score_threshold":
            docs_and_similarities = (
                await self.vectorstore.asimilarity_search_with_relevance_scores(
                    query, **self.search_kwargs
                )
            )
            docs = [doc for doc, _ in docs_and_similarities]
        elif self.search_type == "mmr":
            docs = await self.vectorstore.amax_marginal_relevance_search(
                query, **self.search_kwargs
            )
        else:
            raise ValueError(f"search_type of {self.search_type} not allowed.")

        return docs


class PDFRetrieverMixin:
    def create_retriever(self):
        doc = PDFLoader.load_and_split_documents(self.dataset_ids)

        embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        namespace = uuid.uuid4().hex
        vector_store = Pinecone.from_documents(
            doc, embeddings, index_name="context-prod", namespace=namespace
        )
        vector_store.as_retriever()

        self.retriever = PatchedSelfQueryRetriever.from_llm(
            llm=OpenAI(),
            vectorstore=vector_store,
            verbose=True,
            document_contents="knowledge",
            metadata_field_info=[
                AttributeInfo(
                    name="source", type="string", description="source of pdf"
                ),
                AttributeInfo(
                    name="page_number", type="int", description="pdf page number"
                ),
            ],
        )
        self.retriever.search_type = "mmr"

    def get_retriever(self):
        if hasattr(self, "retriever"):
            return self.retriever
        self.create_retriever()
        return self.retriever

    def get_retriever(self):
        if hasattr(self, "retriever"):
            return self.retriever
        self.create_retriever()
        return self.retriever

    def query_from_pdf(self, query: str):
        return self.get_retriever().get_relevant_documents(query)
