import logging

import pinecone
from models.base import dataset_manager
from utils.config import PINECONE_API_KEY, PINECONE_ENVIRONMENT
from utils.StorageClient import GoogleCloudStorageClient

from .models.PDF import PDFRetrieverMixin

logger = logging.getLogger(__name__)


class Retriever(PDFRetrieverMixin):
    def __init__(self, dataset_ids: str, storage_client=GoogleCloudStorageClient()):
        self.datasets = []
        try:
            pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        except Exception as e:
            logger.error(f"Pinecone init failed: {e}")
            raise e
        for dataset_id in dataset_ids:
            try:
                dataset = dataset_manager.get_datasets(dataset_id)
                if dataset is None:
                    logger.error(f"Dataset {dataset_id} not found")
                    raise Exception(f"Dataset {dataset_id} not found")
                if len(dataset) > 1:
                    logger.error(f"Dataset {dataset_id} not unique")
                    raise Exception(f"Dataset {dataset_id} not unique")
                dataset = dataset[0]
                self.datasets.append(dataset)
            except Exception as e:
                raise e
        self.storage_client = storage_client

    def query(self, query: str, index_type: str):
        if index_type == "pdf":
            return self.query_from_pdf(query)
        raise Exception("Index type not supported")
