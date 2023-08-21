from typing import Optional, Union

from pydantic import BaseModel, Field
from sqlalchemy import JSON, Column, String

from .base import Base


class Document(BaseModel):
    uid: str = Field(default_factory=str)
    url: str = Field(default_factory=str)
    type: str = Field(default_factory=str)
    page_size: int = Field(default_factory=int)


class Dataset(BaseModel):
    id: str = Field(default_factory=str)
    documents: Optional[list[Document]] = Field(default_factory=list)
    retrieval: Optional[dict] = Field(default_factory=dict)


class DatasetTable(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True)
    documents = Column(JSON)
    retrieval = Column(JSON)


class DatasetChainAssociation(Base):
    __tablename__ = "dataset_chain_associations"
    dataset_id = Column(String, primary_key=True)
    chain_urn = Column(String, primary_key=True)


class DatasetStatusWebhookRequest(BaseModel):
    type: str = Field(default="dataset.updated")
    data: dict = Field(default_factory=dict)
