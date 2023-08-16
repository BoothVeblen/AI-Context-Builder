import io
import logging

from langchain.schema import Document
from langchain.text_splitter import CharacterTextSplitter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pydantic import BaseModel, Field
from utils.StorageClient import GoogleCloudStorageClient
from models.base.dataset import Dataset

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class PDFSplitterOption(BaseModel):
    type: str = Field(default="character")
    chunk_size: int = Field(default=1000)
    chunk_overlap: int = Field(default=0)


class PDFEmbeddingOption(BaseModel):
    model: str = Field(default="gpt-3.5-turbo")


class PDFRetrivalOption(BaseModel):
    splitter: PDFSplitterOption = Field(default_factory=PDFSplitterOption)
    embedding: PDFEmbeddingOption = Field(default_factory=PDFEmbeddingOption)


class PDFLoader:
    @staticmethod
    def load_and_split_documents(
        datasets: list[Dataset], storage_client=GoogleCloudStorageClient()
    ):
        doc = []
        for dataset in datasets:
            logger.info(f"Loading dataset {dataset.id}")
            _doc = []
            options = PDFRetrivalOption(**dataset.retrieval)

            text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
                separator=" ",
                chunk_size=options.splitter.chunk_size,
                chunk_overlap=options.splitter.chunk_overlap,
            )
            for document in dataset.documents:
                if document.type == "pdf":
                    pdf_content = storage_client.load(document.url)
                    text = PDFLoader.extract_text_from_pdf(pdf_content)
                    pages = text.split("\f")
                    for page_number, page in enumerate(pages):
                        _doc.append(
                            Document(
                                page_content=page,
                                metadata={
                                    "source": document.url,
                                    "page_number": page_number,
                                    "urn": f"{dataset.id}-{document.url}-{page_number}",
                                },
                            )
                        )
                    # warning!!! it is a bad idea to change the page size here!!!
                    document.page_size = page_number
                else:
                    logger.error(f"Document type {document.type} not supported")
                    raise Exception("Document type not supported")
                _doc = text_splitter.split_documents(_doc)
                logger.info(
                    f"got documents: {len(_doc)} while loading dataset {dataset.id}"
                )
                doc += _doc
        return doc

    @staticmethod
    def extract_text_from_pdf(contents: io.BytesIO) -> list:
        resource_manager = PDFResourceManager()
        fake_file_handle = io.StringIO()
        converter = TextConverter(
            resource_manager, fake_file_handle, laparams=LAParams()
        )
        page_interpreter = PDFPageInterpreter(resource_manager, converter)
        for page in PDFPage.get_pages(contents, caching=True, check_extractable=True):
            page_interpreter.process_page(page)
        text = fake_file_handle.getvalue()

        converter.close()
        fake_file_handle.close()

        return text
