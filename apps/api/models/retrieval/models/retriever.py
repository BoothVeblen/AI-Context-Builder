import io
import sys
from typing import List, Dict

import pinecone
from pinecone import Index
from langchain.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.llms import OpenAI
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.schema import Document
from langchain.vectorstores import Pinecone
from loguru import logger
from models.base import Dataset
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage
from pydantic import Field
from utils import PINECONE_API_KEY, PINECONE_ENVIRONMENT
from ..webhook import WebhookHandler
from models.data_loader import PDFHandler, load_and_split_documents


class PatchedSelfQueryRetriever(SelfQueryRetriever):
    async def _aget_relevant_documents(
        self, query: str, *, run_manager: AsyncCallbackManagerForRetrieverRun
    ) -> List[Document]:
        if self.search_type == "similarity":
            docs = await self.vectorstore.asimilarity_search(
                query, **self.search_kwargs
            )
        elif self.search_type == "similarity_score_threshold":
            docs = await self.vectorstore.asimilarity_search_with_relevance_scores(
                query, **self.search_kwargs
            )
        elif self.search_type == "mmr":
            docs = await self.vectorstore.amax_marginal_relevance_search(
                query, **self.search_kwargs
            )
        else:
            raise ValueError(f"search_type of {self.search_type} not allowed.")
        return docs


class Retriever:
    @classmethod
    def create_index(cls, dataset: Dataset):
        docs = load_and_split_documents([dataset])
        embedding = OpenAIEmbeddings()
        ids = [doc.metadata["urn"] for doc in docs]
        texts = [doc.page_content for doc in docs]
        metadatas = [doc.metadata for doc in docs]
        # metadata same for all pages in a document
        metadata = docs[0].metadata
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        vector_store = Pinecone.from_texts(
            texts=texts,
            embedding=embedding,
            namespace="withcontext",
            metadatas=metadatas,
            ids=ids,
            index_name="context-prod",
        )
        # TODO efficiency can be optimized
        meta_ids = []
        for id in ids:
            _id = "-".join(id.split("-")[0:2])
            if _id not in meta_ids:
                meta_ids.append(_id)
        for id in meta_ids:
            cls.upsert_vector(id=id, content="", metadata=metadata)
        # metadata["text"] = ""
        # cls.upsert_vector(id=f"dataset:{dataset.id}", content="", metadata=metadata)

        return vector_store

    @classmethod
    def delete_index(cls, dataset: Dataset):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        ids = []
        for doc in dataset.documents:
            for i in range(doc.page_size):
                ids.append(f"{dataset.id}-{doc.url}-{i}")
            ids.append(f"{dataset.id}-{doc.url}")
        if len(ids) == 0:
            logger.warning(f"Dataset {dataset.id} has no documents when deleting")
            return
        MAX_IDS_PER_REQUEST = 1000
        for start_idx in range(0, len(ids), MAX_IDS_PER_REQUEST):
            batch_ids = ids[start_idx : start_idx + MAX_IDS_PER_REQUEST]
            index.delete(ids=batch_ids, namespace="withcontext")

    @classmethod
    def get_relative_chains(cls, dataset: Dataset):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        id = f"dataset:{dataset.id}"
        # id = f"{dataset.id}-{dataset.documents[0].url}"
        logger.info(f"Getting vector for id{id}")
        vector = (
            index.fetch(namespace="withcontext", ids=[id])
            .to_dict()
            .get("vectors", {})
            .get(id, {})
        )
        if vector == {}:
            if len(dataset.documents) == 0:
                logger.warning(f"Dataset {dataset.id} has no documents when getting")
                return []
            id = f"{dataset.id}-{dataset.documents[0].url}"
            vector = (
                index.fetch(namespace="withcontext", ids=[id])
                .to_dict()
                .get("vectors", {})
                .get(id, {})
            )
            logger.warning(f"vector {id} need to be updated")
        logger.info(
            f"relative chains: {vector.get('metadata', {}).get('relative_chains', [])}"
        )
        return vector.get("metadata", {}).get("relative_chains", [])

    @classmethod
    def add_relative_chain_to_dataset(
        cls, dataset: Dataset, model_id: str, chain_key: str
    ):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        known_chains = cls.get_relative_chains(dataset)
        chain_urn = f"{model_id}-{chain_key}"
        if chain_urn not in known_chains:
            known_chains.append(chain_urn)
        logger.info(f"Adding chain {chain_urn} to dataset {dataset.id}")
        logger.info(f"Known chains: {known_chains}")
        for doc in dataset.documents:
            if doc.page_size == 0:
                logger.warning(
                    f"Document {doc.url} has page_size 0 when adding relative chain"
                )
                doc.page_size = PDFHandler.get_document_page_size(doc)
                logger.info(f"Updated Document {doc.url} page_size to {doc.page_size}")
            for i in range(doc.page_size):
                id = f"{dataset.id}-{doc.url}-{i}"
                index.update(
                    id=id,
                    set_metadata={"relative_chains": known_chains},
                    namespace="withcontext",
                )
                logger.info(f"Updated {id} with relative chains {known_chains}")
            id = f"{dataset.id}-{doc.url}"
            index.update(
                id=id,
                set_metadata={"relative_chains": known_chains},
                namespace="withcontext",
            )
            logger.info(f"Updated {id} with relative chains {known_chains}")
        id = f"dataset:{dataset.id}"
        index.update(
            id=id,
            set_metadata={"relative_chains": known_chains},
            namespace="withcontext",
        )
        logger.info(f"Updated {id} with relative chains {known_chains}")

    @classmethod
    def delete_relative_chain_from_dataset(
        cls, dataset: Dataset, model_id: str, chain_key: str
    ):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = pinecone.Index("context-prod")
        known_chains = cls.get_relative_chains(dataset)
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
            id = f"{dataset.id}-{doc.url}"
            index.update(
                id=id,
                set_metadata={"relative_chains": known_chains},
                namespace="withcontext",
            )
            id = f"dataset:{dataset.id}"
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

    @classmethod
    def fetch_vectors(cls, ids: List[str]) -> Dict:
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = Index("context-prod")
        result = (
            index.fetch(namespace="withcontext", ids=ids).to_dict().get("vectors", {})
        )
        valid_vectors = {k: v for k, v in result.items() if v}
        return valid_vectors

    @classmethod
    def upsert_vector(cls, id, content, metadata):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = Index("context-prod")
        embeddings = OpenAIEmbeddings()
        vector = embeddings.embed_documents([content])[0]
        index.upsert(vectors=[(id, vector, metadata)], namespace="withcontext")

    @classmethod
    def delete_vector(cls, id):
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        index = Index("context-prod")
        index.delete(ids=[id], namespace="withcontext")

    @classmethod
    def get_metadata(cls, id):
        vector = cls.fetch_vectors([id])
        return vector.get(id, {}).get("metadata", {})
