import logging

from .models.PDF import PDFRetrieverMixin

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class Retriever(PDFRetrieverMixin):
    pass
