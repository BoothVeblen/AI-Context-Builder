import io
import sys

from langchain.schema import Document
from langchain.text_splitter import CharacterTextSplitter
from loguru import logger
from models.base.dataset import Dataset, Document as DocumentModel
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage
from pydantic import BaseModel, Field
from utils.StorageClient import GoogleCloudStorageClient, AnnotatedDataStorageClient


class PDFSplitterOption(BaseModel):
    type: str = Field(default="character")
    chunk_size: int = Field(default=100)
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
            for document in dataset.documents:
                _doc = []
                if document.type == "pdf":
                    options = PDFRetrivalOption(
                        splitter=PDFSplitterOption(
                            chunk_overlap=document.split_option.get("chunk_overlap", 0),
                            chunk_size=document.split_option.get("chunk_size", 100),
                        )
                    )
                    text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
                        chunk_size=options.splitter.chunk_size,
                        chunk_overlap=options.splitter.chunk_overlap,
                    )
                    pdf_content = storage_client.load(document.url)
                    text = PDFLoader.extract_text_from_pdf(pdf_content)
                    document.content_size = sys.getsizeof(text)
                    pages = text.split("\f")
                    for page in pages:
                        _doc.append(
                            Document(
                                page_content=page,
                                metadata={
                                    "source": document.url,
                                },
                            )
                        )
                elif document.type == "annotated_data":
                    document.url = document.uid
                    webhook_handler = AnnotatedDataStorageClient()
                    annotated_data = webhook_handler.load(document.uid)
                    options = PDFRetrivalOption(
                        splitter=PDFSplitterOption(
                            chunk_overlap=document.split_option.get("chunk_overlap", 0),
                            chunk_size=document.split_option.get("chunk_size", 100),
                        )
                    )
                    text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
                        chunk_size=options.splitter.chunk_size,
                        chunk_overlap=options.splitter.chunk_overlap,
                    )
                    _doc.append(
                        Document(
                            page_content=annotated_data,
                            metadata={
                                "source": document.uid,
                            },
                        )
                    )
                    document.content_size = len(annotated_data)
                else:
                    logger.error(f"Document type {document.type} not supported")
                    raise Exception("Document type not supported")
                _doc = text_splitter.split_documents(_doc)
                for page_number, _d in enumerate(_doc):
                    _d.metadata["page_number"] = page_number
                    _d.metadata[
                        "urn"
                    ] = f"{dataset.id}-{document.url}-{_d.metadata['page_number']}"

                document.page_size = len(_doc)
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

    @staticmethod
    def get_document_page_size(document: DocumentModel) -> int:
        if document.page_size != 0:
            return document.page_size
        else:
            pdf_content = GoogleCloudStorageClient().load(document.url)
            text = PDFLoader.extract_text_from_pdf(pdf_content)
            pages = text.split("\f")
            return len(pages)
