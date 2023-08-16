import io
import logging
import uuid
from typing import List, cast

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
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pydantic import BaseModel, Field
from utils import PINECONE_API_KEY, PINECONE_ENVIRONMENT
from models.base import Dataset, Model

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
    @classmethod
    def create_index(self, datasets: List[Dataset]):
        docs = PDFLoader.load_and_split_documents(datasets)

        embedding = OpenAIEmbeddings()

        ids = [doc.metadata["urn"] for doc in docs]
        texts = [doc.page_content for doc in docs]
        metadatas = [doc.metadata for doc in docs]
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        vector_store = Pinecone.from_texts(
            texts=texts,
            embedding=embedding,
            namespace="withcontext",
            metadatas=metadatas,
            ids=ids,
            index_name="context-prod",
        )
        return vector_store

    @classmethod
    def delete_index(self, dataset: Dataset):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        ids = []
        for doc in dataset.documents:
            for i in range(doc.page_size):
                ids.append(f"{dataset.id}-{doc.url}-{i}")
        if ids == []:
            logger.warning(
                f"Dataset {dataset.id} has no documents when deleting, or page_size bug"
            )
            return
        index.delete(ids=ids, namespace="withcontext")

    @classmethod
    def get_relative_chains(self, dataset: Dataset):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        if len(dataset.documents) == 0:
            logger.warning(f"Dataset {dataset.id} has no documents when getting chains")
            return []
        id = f"{dataset.id}-{dataset.documents[0].url}-0"
        logger.info(f"Getting vector for id{id}")
        vector = (
            index.fetch(namespace="withcontext", ids=[id])
            .to_dict()
            .get("vectors", {})
            .get(id, {})
        )
        if vector == {}:
            logger.warning(f"vector {id} not found when getting chains")
            return []
        return vector.get("metadata", {}).get("relative_chains", [])

    @classmethod
    def add_relative_chain_to_dataset(
        self, dataset: Dataset, model_id: str, chain_key: str
    ):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        known_chains = self.get_relative_chains(dataset)
        chain_urn = f"{model_id}-{chain_key}"
        known_chains.append(chain_urn)
        for doc in dataset.documents:
            for i in range(doc.page_size):
                id = f"{dataset.id}-{doc.url}-{i}"
                index.update(
                    id=id,
                    set_metadata={"relative_chains": known_chains},
                    namespace="withcontext",
                )

    @classmethod
    def delete_relative_chain_from_dataset(
        self, dataset: Dataset, model_id: str, chain_key: str
    ):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        known_chains = self.get_relative_chains(dataset)
        chain_urn = f"{model_id}-{chain_key}"
        try:
            known_chains.remove(chain_urn)
        except ValueError:
            logger.warning(f"Chain {chain_urn} not found when deleting")
            return
        for doc in dataset.documents:
            for i in range(doc.page_size):
                id = f"{dataset.id}-{doc.url}-{i}"

                index.update(
                    id=id,
                    set_metadata={"relative_chains": known_chains},
                    namespace="withcontext",
                )

    @classmethod
    def get_retriever(cls, filter: dict = {}) -> Pinecone:
        vector_store = Pinecone.from_existing_index(
            index_name="context-prod",
            namespace="withcontext",
            embedding=OpenAIEmbeddings(),
        )
        retriever = PatchedSelfQueryRetriever.from_llm(
            filter=filter,
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
        retriever.search_kwargs = {"filter": filter}
        retriever.search_type = "mmr"
        return retriever
