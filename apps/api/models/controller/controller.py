import asyncio
import copy
import json
import time
from typing import Union

import redis
from langchain.schema import Document
from langchain.text_splitter import CharacterTextSplitter
from loguru import logger
from models.base import BaseManager, Dataset, Model, SessionState
from models.data_loader import PDFHandler, WordHandler
from models.prompt_manager.manager import PromptManagerMixin
from models.retrieval import Retriever
from models.retrieval.webhook import WebhookHandler as DocumentWebhookHandler
from models.workflow import Workflow
from utils import AnnotatedDataStorageClient, GoogleCloudStorageClient
from utils.config import UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL

from .webhook import WebhookHandler as DatasetWebhookHandler


class RelativeManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("dataset_chain_associations")

    @classmethod
    def get_chain_urn(cls, model_id: str, chain_key: str):
        """Constructs and returns a unique chain identifier.

        Args:
            model_id: The ID of the model.
            chain_key: The key associated with the chain.

        Returns:
            A unique identifier for the chain.
        """
        return f"{model_id}-{chain_key}"

    @BaseManager.db_session
    def save_relative(self, dataset_id: str, model_id: str, chain_key: str):
        """Saves the relative association of a dataset to a chain.

        Args:
            dataset_id: The ID of the dataset.
            model_id: The ID of the model.
            chain_key: The key of the chain.
        """
        urn = self.get_chain_urn(model_id, chain_key)
        logger.info(f"Saving relative {dataset_id} {urn}")
        return self.table.insert().values(dataset_id=dataset_id, chain_urn=urn)

    @BaseManager.db_session
    def _get_relative_datasets(self, model_id: str, chain_key: str):
        urn = self.get_chain_urn(model_id, chain_key)
        logger.info(f"Getting relative datasets {urn}")
        return self.table.select().where(self.table.c.chain_urn == urn)

    @BaseManager.db_session
    def _get_relative_chains(self, dataset_id: str):
        logger.info(f"Getting relative chains {dataset_id}")
        return self.table.select().where(self.table.c.dataset_id == dataset_id)

    @BaseManager.db_session
    def delete_relative(
        self, dataset_id: str = None, model_id: str = None, chain_key: str = None
    ):
        if dataset_id and model_id and chain_key:
            urn = self.get_chain_urn(model_id, chain_key)
            logger.info(f"Deleting relative {dataset_id} {urn}")
            return (
                self.table.delete()
                .where(self.table.c.dataset_id == dataset_id)
                .where(self.table.c.chain_urn == urn)
            )
        elif dataset_id:
            logger.info(f"Deleting relative {dataset_id}")
            return self.table.delete().where(self.table.c.dataset_id == dataset_id)
        elif model_id and chain_key:
            urn = self.get_chain_urn(model_id, chain_key)
            logger.info(f"Deleting relative {urn}")
            return self.table.delete().where(self.table.c.chain_urn == urn)
        else:
            raise ValueError("dataset_id or model_id and chain_key must be provided")

    def get_relative_datasets(self, model_id: str, chain_key: str):
        relative_datasets = self._get_relative_datasets(model_id, chain_key)
        if relative_datasets is None:
            return None
        relative_datasets = relative_datasets.fetchall()
        if len(relative_datasets) == 0:
            return None
        return [dataset.dataset_id for dataset in relative_datasets]

    def get_relative_chains(self, dataset_id: str):
        relative_chains = self._get_relative_chains(dataset_id)
        if relative_chains is None:
            return None
        relative_chains = relative_chains.fetchall()
        if len(relative_chains) == 0:
            return None
        return [chain.chain_urn for chain in relative_chains]


relative_manager = RelativeManager()


class DatasetManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("datasets")
        self.redis = redis.Redis(
            host=UPSTASH_REDIS_REST_URL,
            password=UPSTASH_REDIS_REST_TOKEN,
            port=30535,
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

    def update_dataset(self, dataset_id: str, update_data: dict):
        logger.info(f"Updating dataset {dataset_id}")
        urn = self.get_dataset_urn(dataset_id)
        if self.redis.get(urn):
            self.redis.delete(urn)
        if update_data.get("documents") is not None:
            handler = DatasetWebhookHandler()
            handler.update_dataset_status(dataset_id, 1)
            dataset = self.get_datasets(dataset_id)[0]
            if update_data.get("retrieval"):
                retrieval_dict = update_data["retrieval"]
            else:
                retrieval_dict = dataset.retrieval
            update_data.pop("retrieval", None)
            update_data["retrieval"] = retrieval_dict
            # Let's start all over again first
            chains = Retriever.get_relative_chains(dataset)
            Retriever.delete_index(dataset)
            if len(update_data["documents"]) != 0:
                dataset = Dataset(id=dataset_id, **update_data)
                # pages updated
                Retriever.create_index(dataset)
                for chain in chains:
                    parts = chain.split("-", 1)
                    Retriever.add_relative_chain_to_dataset(dataset, parts[0], parts[1])
                handler.update_dataset_status(dataset_id, 0)
                dataset_dict_for_redis = copy.deepcopy(dataset.dict())
                for document in dataset_dict_for_redis["documents"]:
                    document["hundredth_ids"] = [
                        i for i in range(99, document["page_size"], 100)
                    ]
                self.redis.set(urn, json.dumps(dataset_dict_for_redis))
                logger.info(
                    f"Updating dataset {dataset_id} in cache, dataset: {dataset_dict_for_redis}"
                )
                self._update_dataset(dataset_id, dataset.dict())
                webhook_handler = DocumentWebhookHandler()
                for doc in dataset.documents:
                    webhook_handler.update_document_status(
                        dataset.id, doc.uid, doc.content_size, 0
                    )
                return
        webhook_handler = DocumentWebhookHandler()
        dataset = Dataset(**update_data, id=dataset_id)
        for doc in dataset.documents:
            webhook_handler.update_document_status(
                dataset.id, doc.uid, doc.content_size, 0
            )
        handler.update_dataset_status(dataset_id, 0)
        self._update_dataset(dataset_id, update_data)

    @BaseManager.db_session
    def delete_dataset(self, dataset_id: str):
        logger.info(f"Deleting dataset {dataset_id}")
        relative_manager.delete_relative(dataset_id=dataset_id)
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

    def upsert_dataset(self, dataset_id: str, dataset: dict):
        dataset_info = self.get_datasets(dataset_id)
        if dataset_info is None:
            try:
                dataset["id"] = dataset_id
                _dataset = Dataset(**dataset)
                self.save_dataset(_dataset)
            except Exception as e:
                logger.error(f"Error when saving dataset {dataset_id}: {e}")
                raise e
        else:
            self.update_dataset(dataset_id, dataset)

    def get_document_segments(
        self, dataset_id: str, uid: str, offset: int = 0, limit: int = 10, query=None
    ):
        preview = self.get_preview_segment(dataset_id, uid)
        if preview is not None:
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


class ModelManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("models")
        self.redis = redis.Redis(
            host=UPSTASH_REDIS_REST_URL,
            password=UPSTASH_REDIS_REST_TOKEN,
            port=30535,
            ssl=True,
        )

    @staticmethod
    def get_model_urn(model_id: str):
        return f"model:{model_id}"

    @BaseManager.db_session
    def save_model(self, model: Model):
        """Saves a model to the database and updates related datasets.

        Args:
            model: The model object to save.
        """
        logger.info(f"Saving model {model.id}")
        handler = DatasetWebhookHandler()
        urn = self.get_model_urn(model.id)
        self.redis.set(urn, json.dumps(model.dict()))
        for chain in model.chains:
            for dataset_id in chain.datasets:
                handler.update_dataset_status(dataset_id, 1)
                dataset = dataset_manager.get_datasets(dataset_id)[0]
                relative_manager.save_relative(dataset.id, model.id, chain.key)
                Retriever.add_relative_chain_to_dataset(dataset, model.id, chain.key)
                handler.update_dataset_status(dataset_id, 0)
        return self.table.insert().values(model.dict())

    @BaseManager.db_session
    def update_model(
        self,
        model_id: str,
        update_data: dict,
    ):
        logger.info(f"Updating model {model_id}")
        urn = self.get_model_urn(model_id)
        if self.redis.get(urn):
            logger.info(f"Deleting model {model_id} from cache")
            self.redis.delete(urn)
        handler = DatasetWebhookHandler()
        if update_data.get("chains"):
            model = self.get_models(model_id)[0]
            # Let's start all over again first
            for chain in model.chains:
                for dataset_id in chain.datasets:
                    handler.update_dataset_status(dataset_id, 1)
                    relative_manager.delete_relative(dataset_id, model_id, chain.key)
                    Retriever.delete_relative_chain_from_dataset(
                        dataset_manager.get_datasets(dataset_id)[0], model_id, chain.key
                    )
                    handler.update_dataset_status(dataset_id, 0)
            for chain in update_data["chains"]:
                if "datasets" in chain:
                    for dataset_id in chain["datasets"]:
                        handler.update_dataset_status(dataset_id, 1)
                        dataset = dataset_manager.get_datasets(dataset_id)[0]
                        relative_manager.save_relative(
                            dataset.id, model_id, chain["key"]
                        )
                        Retriever.add_relative_chain_to_dataset(
                            dataset, model_id, chain["key"]
                        )
                        handler.update_dataset_status(dataset_id, 0)
            model_dict = model.dict()
            model_dict.update(update_data)
            self.redis.set(urn, json.dumps(model_dict))
            logger.info(f"Updating model {model_id} in cache, model: {model_dict}")
        return (
            self.table.update().where(self.table.c.id == model_id).values(**update_data)
        )

    @BaseManager.db_session
    def delete_model(self, model_id: str):
        logger.info(f"Deleting model {model_id}")
        self.redis.delete(self.get_model_urn(model_id))
        return self.table.delete().where(self.table.c.id == model_id)

    @BaseManager.db_session
    def _get_model(self, model_id: str = None):
        if model_id:
            logger.info(f"Getting model {model_id}")
            return self.table.select().where(self.table.c.id == model_id)
        else:
            logger.info("Getting all models")
            return self.table.select()

    def get_models(self, model_id: str = None) -> Union[Model, list[Model]]:
        if model_id is not None:
            cache = self.redis.get(self.get_model_urn(model_id))
            if cache:
                logger.info(f"Getting model {model_id} from cache")
                return [Model(**json.loads(cache))]
        model_info = self._get_model(model_id)
        if model_info is None:
            return None
        model_info = model_info.fetchall()
        if len(model_info) == 0:
            return None

        models = []
        for model in model_info:
            try:
                models.append(Model(**model._mapping))
            except Exception as e:
                logger.error(f"Error when parsing model {model._mapping['id']}: {e}")
        for model in models:
            self.redis.set(self.get_model_urn(model.id), json.dumps(model.dict()))
        return models

    def upsert_model(self, model_id: str, model: dict):
        model_info = self.get_models(model_id)
        if model_info is None:
            try:
                _model = Model(**model)
                self.save_model(_model)
            except Exception as e:
                logger.error(
                    f"Error when parsing model {model_id} with properties{model}: {e}"
                )
                return None
        else:
            self.update_model(model_id, model)


model_manager = ModelManager()


class SessionStateManager(BaseManager, PromptManagerMixin):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("session_state")
        self.redis = redis.Redis(
            host=UPSTASH_REDIS_REST_URL,
            password=UPSTASH_REDIS_REST_TOKEN,
            port=30535,
            ssl=True,
        )

    @staticmethod
    def get_session_state_urn(session_id: str):
        return f"session:{session_id}"

    @BaseManager.db_session
    def save_session_state(self, session_id: str, model_id: str):
        logger.info(f"Saving session state {session_id}")
        return self.table.insert().values(id=session_id, model_id=model_id)

    @BaseManager.db_session
    def update_session_state(self, session_id: str, model_id: str):
        logger.info(f"Updating session state {session_id}")
        return (
            self.table.update()
            .where(self.table.c.id == session_id)
            .values(model_id=model_id)
        )

    @BaseManager.db_session
    def delete_session_state(self, session_id: str):
        logger.info(f"Deleting session state {session_id}")
        return self.table.delete().where(self.table.c.id == session_id)

    @BaseManager.db_session
    def _get_session_state(self, session_id: str = None):
        if session_id:
            logger.info(f"Getting session state {session_id}")
            return self.table.select().where(self.table.c.id == session_id)
        else:
            logger.info("Getting all session states")
            return self.table.select()

    @BaseManager.db_session
    def _get_session_id(self, model_id: str):
        logger.info(f"Getting session id {model_id}")
        return self.table.select().where(self.table.c.model_id == model_id)

    def get_model_id(self, session_id: str) -> Union[SessionState, list[SessionState]]:
        session_state_info = self._get_session_state(session_id)
        if session_state_info is None:
            return None
        session_state_info = session_state_info.fetchall()
        session_states = []
        for session_state in session_state_info:
            try:
                session_states.append(SessionState(**session_state._mapping))
            except Exception as e:
                logger.error(
                    f"Error when parsing session state {session_state._mapping['id']}: {e}"
                )
        if len(session_states) == 0:
            raise Exception("Session state not found")
        return session_states[0].model_id

    def save_workflow_status(self, session_id, workflow):
        logger.info(f"Saving workflow status {session_id}")
        for chain in workflow.context.chains:
            if type(chain) in workflow.context.state_dependent_chains:
                self.save_chain_status(
                    session_id,
                    chain.output_keys[0],
                    chain.process,
                    chain.max_retries,
                )
                self.save_chain_output(
                    session_id,
                    chain.output_keys[0],
                    workflow.context.known_values[chain.output_keys[0]],
                )
        self.save_chain_memory(session_id, workflow.context.current_chain_io)
        self.save_workflow_step(session_id, workflow.context.current_chain)

    def get_workflow(self, session_id, model, disconnect_event):
        if model is None:
            model_id = self.get_model_id(session_id)
            if model_id is None:
                raise Exception("Session state not found")
            model = model_manager.get_models(model_id)[0]
        workflow = Workflow(
            model=model, session_id=session_id, disconnect_event=disconnect_event
        )
        # get chain status
        for chain in workflow.context.chains:
            if type(chain) in workflow.context.state_dependent_chains:
                tup = self.get_chain_status(session_id, chain.output_keys[0])
                if tup is not None:
                    chain.process = tup[0]
                    chain.max_retries = tup[1]
                output = self.get_chain_output(session_id, chain.output_keys[0])
                if output is None:
                    output = ""
                workflow.outputs[chain.output_keys[0]] = output
        # get chain memory
        # memory example: {"tool_%d_dialog": [{"input": "human input", "output": "tool output"}]}
        workflow.current_memory = {}
        for chain in workflow.context.chains:
            workflow.current_memory[chain.dialog_key] = self.get_chain_memory(
                session_id, chain.output_keys[0]
            )
        # get workflow step
        workflow.context.current_chain = self.get_workflow_step(session_id)
        return workflow

    def delete_session_state_cache_via_model(self, model_id):
        session_info = self._get_session_id(model_id)
        if session_info is None:
            return None
        session_info = session_info.fetchall()
        session_ids = []
        for session in session_info:
            try:
                session_ids.append(SessionState(**session._mapping).id)
            except Exception as e:
                logger.error(
                    f"Error when parsing session state {session._mapping['id']}: {e}"
                )
        for session_id in session_ids:
            self.redis.delete(self.get_session_state_urn(session_id))

    def save_chain_status(self, session_id, output_key, status, max_retries):
        current_status = self.redis.get(self.get_session_state_urn(session_id))
        if current_status:
            current_status = json.loads(current_status)
            current_status[output_key] = (status, max_retries)
            self.redis.set(
                self.get_session_state_urn(session_id),
                json.dumps(current_status),
            )
        else:
            self.redis.set(
                self.get_session_state_urn(session_id),
                json.dumps({output_key: (status, max_retries)}),
            )

    def get_chain_status(self, session_id, output_key):
        current_status = self.redis.get(self.get_session_state_urn(session_id))
        if current_status:
            current_status = json.loads(current_status)
            return current_status.get(output_key)
        return None

    def get_workflow_step(self, session_id):
        current_step = self.redis.get(f"workflow_step:{session_id}")
        if current_step is None:
            return 0
        return int(current_step)

    def save_workflow_step(self, session_id, current_step):
        self.redis.set(f"workflow_step:{session_id}", current_step)


session_state_manager = SessionStateManager()
