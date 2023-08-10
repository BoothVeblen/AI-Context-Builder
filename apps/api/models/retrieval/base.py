import logging

import pinecone
from models.base import dataset_manager
from utils.config import PINECONE_API_KEY, PINECONE_ENVIRONMENT
from utils.StorageClient import GoogleCloudStorageClient

from .models.PDF import PDFRetrieverMixin

logger = logging.getLogger(__name__)


class Retriever(PDFRetrieverMixin):
    def __init__(self, dataset_ids: str):
        self.dataset_ids = dataset_ids

    def query(self, query: str, index_type: str):
        if index_type == "pdf":
            return self.query_from_pdf(query)
        raise Exception("Index type not supported")
