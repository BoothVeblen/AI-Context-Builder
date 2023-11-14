import asyncio
import copy
from typing import Union

from langchain.schema import Document
from langchain.text_splitter import CharacterTextSplitter
from loguru import logger
from models.base import BaseManager, Dataset, Model, SessionState
from models.data_loader import PDFHandler, WordHandler
from models.retrieval import Retriever
from utils import AnnotatedDataStorageClient, GoogleCloudStorageClient

from .webhook import WebhookHandler as DatasetWebhookHandler

from models.retrieval.webhook import WebhookHandler as DocumentWebhookHandler
from models.retrieval.relative import relative_manager
from utils.config import UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_PORT
import redis
import json


class DatasetManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("datasets")
        self.redis = redis.Redis(
            host=UPSTASH_REDIS_REST_URL,
            password=UPSTASH_REDIS_REST_TOKEN,
            port=UPSTASH_REDIS_REST_PORT,
            ssl=True,
        )

    @staticmethod
    def get_dataset_urn(dataset_id: str):
        return f"dataset:{dataset_id}"

    @BaseManager.db_session
    def save_dataset(self, dataset: Dataset):
        """Saves a dataset to the database and updates the relevant status.

        Args:
            dataset: The dataset object to save.
        """
        logger.info(f"Saving dataset {dataset.id}")
        # check if dataset is pdf
        handler = DatasetWebhookHandler()
        urn = self.get_dataset_urn(dataset.id)
        handler.update_dataset_status(dataset.id, 1)

        if len(dataset.documents) != 0:
            Retriever.create_index(dataset)
        self.redis.set(urn, json.dumps(dataset.dict()))
        Retriever.upsert_vector(
            id=f"dataset:{dataset.id}", content="", metadata={"text": ""}
        )
        handler.update_dataset_status(dataset.id, 0)

        return self.table.insert().values(dataset.dict())

    @BaseManager.db_session
    def _update_dataset(self, dataset_id: str, update_data: dict):
        return (
            self.table.update()
            .where(self.table.c.id == dataset_id)
            .values(**update_data)
        )

    @staticmethod
    def get_documents_to_add(current_data: dict, new_data: dict):
        current_uids = {doc["uid"] for doc in current_data.get("documents", [])}
        updated_documents = new_data.get("documents", [])
        return [doc for doc in updated_documents if doc["uid"] not in current_uids]

    @staticmethod
    def get_documents_to_delete(current_data: dict, new_data: dict):
        new_uids = {doc["uid"] for doc in new_data.get("documents", [])}
        current_documents = current_data.get("documents", [])
        return [doc for doc in current_documents if doc["uid"] not in new_uids]

    def add_document_to_dataset(self, dataset_id: str, new_document: dict):
        # set dataset index status for indexing
        handler = DatasetWebhookHandler()
        handler.update_dataset_status(dataset_id, 1)

        # create index for new document
        _new_document = {"documents": [new_document]}
        new_dataset = Dataset(id=dataset_id, **_new_document)
        Retriever.create_index(new_dataset)

        # update relative_chain to doc for dataset
        dataset = self.get_datasets(dataset_id)[0]
        chains = Retriever.get_relative_chains(dataset)
        logger.info(f"get_relative_chains: {len(chains)} from dataset {dataset_id}")
        for chain in chains:
            parts = chain.split("-", 1)
            Retriever.add_relative_chain_to_dataset(new_dataset, parts[0], parts[1])

        # update document status to 0
        webhook_handler = DocumentWebhookHandler()
        for doc in new_dataset.documents:
            webhook_handler.update_document_status(
                dataset.id, doc.uid, doc.content_size, 0
            )
        # set dataset index status for complete
        handler.update_dataset_status(dataset_id, 0)

        new_dataset_dict = new_dataset.dict()
        document = new_dataset_dict["documents"][0]
        document["hundredth_ids"] = [i for i in range(99, document["page_size"], 100)]

        # update in redis and psql
        urn = self.get_dataset_urn(dataset_id)
        current_data = json.loads(self.redis.get(urn))
        current_data["documents"].extend(new_dataset_dict["documents"])
        logger.info(f"Added document {new_document['uid']} to dataset {dataset_id}")
        self.redis.set(urn, json.dumps(current_data))

        for document in current_data["documents"]:
            document["hundredth_ids"] = []
        self._update_dataset(dataset_id, current_data)

    def delete_document_from_dataset(self, dataset_id: str, document_to_delete: dict):
        uid = document_to_delete["uid"]
        logger.info(f"Deleting document {uid} from dataset {dataset_id}")

        # delete documents's index
        _document_to_delete = {"documents": [document_to_delete]}
        new_dataset = Dataset(id=dataset_id, **_document_to_delete)
        Retriever.delete_index(new_dataset)

        # update redis
        urn = self.get_dataset_urn(dataset_id)
        current_data = json.loads(self.redis.get(urn))
        current_data["documents"] = [
            doc for doc in current_data.get("documents", []) if doc["uid"] != uid
        ]
        self.redis.set(urn, json.dumps(current_data))
        logger.info(f"Deleted document {uid} from dataset {dataset_id}")

        # update psql
        for document in current_data["documents"]:
            document["hundredth_ids"] = []
        self._update_dataset(dataset_id, current_data)

    @BaseManager.db_session
    def delete_dataset(self, dataset_id: str):
        logger.info(f"Deleting dataset {dataset_id}")
        relative_manager.delete_relative(dataset_id=dataset_id)

        # delete document's docs index
        dataset = self.get_datasets(dataset_id)[0]
        Retriever.delete_index(dataset)

        self.redis.delete(self.get_dataset_urn(dataset_id))
        return self.table.delete().where(self.table.c.id == dataset_id)

    @BaseManager.db_session
    def _get_datasets(self, dataset_id: str = None):
        if dataset_id:
            logger.info(f"Getting dataset {dataset_id}")
            return self.table.select().where(self.table.c.id == dataset_id)
        else:
            logger.info("Getting all datasets")
            return self.table.select()

    def get_datasets(self, dataset_id: str = None) -> Union[Dataset, list[Dataset]]:
        if dataset_id is not None:
            cache = self.redis.get(self.get_dataset_urn(dataset_id))
            if cache:
                return [Dataset(**json.loads(cache))]
        dataset_info = self._get_datasets(dataset_id)
        if dataset_info is None:
            return None
        dataset_info = dataset_info.fetchall()
        if len(dataset_info) == 0:
            return None
        # return [Dataset(**dataset._mapping) for dataset in dataset_info]
        datasets = []
        for dataset in dataset_info:
            try:
                datasets.append(Dataset(**dataset._mapping))
            except Exception as e:
                logger.error(
                    f'Error when parsing dataset {dataset._mapping["id"]}: {e}'
                )
        for dataset in datasets:
            self.redis.set(self.get_dataset_urn(dataset.id), json.dumps(dataset.dict()))
        return datasets

    def get_document_segments(
        self, dataset_id: str, uid: str, offset: int = 0, limit: int = 10, query=None
    ):
        preview = self.get_preview_segment(dataset_id, uid)
        if preview is not None and limit == 5:
            logger.info(f"Preview found for dataset {dataset_id}, document {uid}")
            return len(preview), preview
        if query is not None:
            logger.info(f"Searching for query {query}")
            return self.search_document_segments(dataset_id, uid, query=query)
        # retrieve the dataset object
        dataset_response = self.get_datasets(dataset_id)
        if not dataset_response:
            raise ValueError("Dataset not found")
        dataset = dataset_response[0]
        matching_url = None
        segment_size = None
        for document in dataset.documents:
            if document.uid == uid:
                matching_url = document.url
                segment_size = document.page_size
                if hasattr(document, "hundredth_ids"):
                    hundredth_ids = document.hundredth_ids
                else:
                    hundredth_ids = [i for i in range(99, segment_size, 100)]
                    document.hundredth_ids = hundredth_ids
                    urn = self.get_dataset_urn(dataset_id)
                    self.redis.set(urn, json.dumps(dataset.dict()))
                break
        if not matching_url:
            raise ValueError("UID not found in dataset documents")
        if not hundredth_ids:
            start_idx = 0
            end_idx = segment_size
        else:
            start_idx = 0 if offset == 0 else hundredth_ids[offset // 100 - 1] + 1
            end_idx = (
                segment_size
                if start_idx - 1 == hundredth_ids[-1]
                else hundredth_ids[(offset + limit) // 100 - 1]
            )
        seg_ids_to_fetch = [
            f"{dataset_id}-{matching_url}-{i}" for i in range(start_idx, end_idx + 1)
        ]
        vectors = Retriever.fetch_vectors(ids=seg_ids_to_fetch)
        segments = [
            {"segment_id": seg_id, "content": vectors[seg_id]["metadata"]["text"]}
            for seg_id in sorted(vectors, key=lambda x: int(x.split("-")[-1]))
        ]
        return segment_size, segments

    def search_document_segments(self, dataset_id, uid, query):
        dataset = self.get_datasets(dataset_id)[0]
        doc = None
        for _doc in dataset.documents:
            if _doc.uid == uid:
                doc = _doc
                break
        if doc is None:
            raise ValueError("UID not found in dataset documents")
        retriever = Retriever.get_retriever(
            filter={
                "urn": {
                    "$in": [f"{dataset_id}-{doc.url}-{i}" for i in range(doc.page_size)]
                }
            }
        )
        retriever.search_kwargs["k"] = 10000
        retriever.search_type = "similarity_score_threshold"
        docs_and_similarities = asyncio.run(retriever.aget_relevant_documents(query))
        docs = [doc for doc, _ in docs_and_similarities]
        docs = [doc for doc in docs if query.lower() in doc.page_content.lower()]
        segments = []
        segments_id = []
        for _doc in docs:
            if _doc.metadata["urn"] in segments_id:
                continue
            segments.append(
                {
                    "segment_id": _doc.metadata["urn"],
                    "content": _doc.page_content,
                }
            )
            segments_id.append(_doc.metadata["urn"])
        sorted_segments = sorted(
            segments, key=lambda x: int(x["segment_id"].rsplit("-", 1)[-1])
        )
        return len(sorted_segments), sorted_segments

    def add_segment(self, dataset_id, uid, content):
        dataset = self.get_datasets(dataset_id)[0]
        page_size = 0
        matching_url = None
        for doc in dataset.documents:
            if doc.uid == uid:
                page_size = doc.page_size
                matching_url = doc.url
                break
        if page_size == 0:
            raise ValueError("UID not found in dataset documents")
        segment_id = f"{dataset_id}-{matching_url}-{page_size}"
        self.upsert_segment(dataset_id, uid, segment_id, content)

    def upsert_segment(self, dataset_id, uid, segment_id: str, content: str):
        def get_page_size_via_segment_id(segment):
            return int(segment.split("-")[-1])

        dataset = self.get_datasets(dataset_id)[0]
        matching_url = None
        for doc in dataset.documents:
            if doc.uid == uid:
                current_page_size = get_page_size_via_segment_id(segment_id)
                matching_url = doc.url
                if not hasattr(doc, "hundredth_ids"):
                    hundredth_ids = [i for i in range(99, doc.page_size, 100)]
                    doc.hundredth_ids = hundredth_ids
                if content == "":
                    # handle deletion
                    if doc.page_size > 0:
                        segment_length = len(
                            Retriever.fetch_vectors(ids=[segment_id])[segment_id][
                                "metadata"
                            ]["text"]
                        )
                        doc.content_size -= segment_length
                        # update hundreaith_id values
                        if len(doc.hundredth_ids) == 1:
                            if 0 <= current_page_size <= doc.hundredth_ids[0]:
                                doc.hundredth_ids[0] += 1
                        else:
                            adjusted = False
                            if doc.hundredth_ids:
                                if current_page_size <= doc.hundredth_ids[0]:
                                    adjusted = True
                                    doc.hundredth_ids[0] += 1
                            for i in range(len(doc.hundredth_ids) - 1):
                                if (
                                    adjusted
                                    or doc.hundredth_ids[i]
                                    <= current_page_size
                                    <= doc.hundredth_ids[i + 1]
                                ):
                                    doc.hundredth_ids[i + 1] += 1
                                    adjusted = True
                elif doc.page_size == current_page_size:
                    # handle addition
                    doc.page_size += 1
                    doc.content_size += len(content)
                    if doc.hundredth_ids:
                        if doc.page_size - doc.hundredth_ids[-1] >= 100:
                            seg_ids = [
                                f"{dataset_id}-{matching_url}-{i}"
                                for i in range(doc.hundreaith_id[-1], doc.page_size)
                            ]
                            vectors = Retriever.fetch_vectors(ids=seg_ids)
                            if len(vectors) >= 100:
                                last_vector_id = get_page_size_via_segment_id(
                                    list(vectors.keys())[-1]
                                )
                                doc.hundredth_ids.append(last_vector_id)
                    else:
                        if doc.page_size >= 99:
                            seg_ids = [
                                f"{dataset_id}-{matching_url}-{i}"
                                for i in range(0, doc.page_size)
                            ]
                            vectors = Retriever.fetch_vectors(ids=seg_ids)
                            if len(vectors) >= 100:
                                last_vector_id = get_page_size_via_segment_id(
                                    list(vectors.keys())[-1]
                                )
                                doc.hundredth_ids.append(last_vector_id)
                else:
                    # handle edit
                    segment_length = len(
                        Retriever.fetch_vectors(ids=[segment_id])[segment_id][
                            "metadata"
                        ]["text"]
                    )
                    doc.content_size += len(content) - segment_length
                break
        urn = self.get_dataset_urn(dataset_id)
        self.redis.set(urn, json.dumps(dataset.dict()))
        for document in dataset.documents:
            document.hundredth_ids = []
        self._update_dataset(dataset_id, dataset.dict())
        logger.info(
            f"Updating dataset {dataset_id} in cache, dataset: {dataset.dict()}"
        )
        webhook_handler = DocumentWebhookHandler()
        for doc in dataset.documents:
            webhook_handler.update_document_status(
                dataset.id, doc.uid, doc.content_size, 0
            )
        if content:
            first_segment = "-".join(segment_id.split("-")[0:2])
            metadata = Retriever.get_metadata(first_segment)
            metadata["text"] = content
            metadata["urn"] = segment_id
            Retriever.upsert_vector(segment_id, content, metadata)
        else:
            Retriever.delete_vector(segment_id)

    def upsert_preview(self, dataset, preview_size, document_uid):
        # todo change logic to retriever folder
        selected_doc = None
        url = None
        splitter = {}
        doc_type = None
        uid = None
        for doc in dataset.documents:
            if doc.uid == document_uid:
                selected_doc = doc
                url = doc.url
                splitter = doc.split_option
                doc_type = doc.type
                uid = doc.uid
                break
        if doc_type == None:
            raise ValueError("UID not found in dataset documents")
        text_splitter = CharacterTextSplitter(
            chunk_size=splitter.get("chunk_size", 100),
            chunk_overlap=splitter.get("chunk_overlap", 0),
            separator="\n",
        )
        if doc_type == "pdf":
            storage_client = GoogleCloudStorageClient()
            pdf_content = storage_client.load(url)
            text = PDFHandler.extract_text_from_pdf(pdf_content, preview_size)
            pages = text.split("\f")
            _docs = [
                Document(page_content=page, metadata={"source": url}) for page in pages
            ]
        elif doc_type == "annotated_data":
            storage_client = AnnotatedDataStorageClient()
            annotated_data = storage_client.load(uid)
            _docs = [Document(page_content=annotated_data, metadata={"source": uid})]
        elif doc_type == "word":
            word_handler = WordHandler()
            text = word_handler.fetch_content(selected_doc, preview_size)
            pages = text.split("\f")
            _docs = [
                Document(page_content=page, metadata={"source": url}) for page in pages
            ]
        else:
            raise ValueError("Document type not supported")
        _docs = text_splitter.split_documents(_docs)
        preview_list = [
            {"segment_id": "fake", "content": doc.page_content}
            for doc in _docs[:preview_size]
        ]
        self.redis.set(f"preview:{dataset.id}-{document_uid}", json.dumps(preview_list))
        logger.info(f"Upsert preview for dataset {dataset.id}, document {document_uid}")

    def delete_preview_segment(self, dataset_id, document_id):
        self.redis.delete(f"preview:{dataset_id}-{document_id}")

    def get_preview_segment(self, dataset_id, document_id):
        preview = self.redis.get(f"preview:{dataset_id}-{document_id}")
        if preview is None:
            return None
        return json.loads(preview)


dataset_manager = DatasetManager()
