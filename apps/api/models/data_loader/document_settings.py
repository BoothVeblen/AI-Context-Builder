from pydantic import BaseModel, Field

class PDFSplitterOption(BaseModel):
    """
    Configuration options for splitting PDFs.
    """
    type: str = Field(default="character")
    chunk_size: int = Field(default=100)
    chunk_overlap: int = Field(default=0)

class PDFEmbeddingOption(BaseModel):
    """
    Configuration options for embedding PDFs.
    """
    model: str = Field(default="gpt-3.5-turbo")

class PDFRetrivalOption(BaseModel):
    """
    Overall options for retrieving PDFs, which can involve both splitting and embedding.
    """
    splitter: PDFSplitterOption = Field(default_factory=PDFSplitterOption)
    embedding: PDFEmbeddingOption = Field(default_factory=PDFEmbeddingOption)