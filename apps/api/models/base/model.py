import os
import sys
from typing import Optional

from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import JSON, Boolean, Column, String
from utils import OPENAI_API_KEY

from .base import Base


class LLM(BaseModel):
    name: str = Field(default_factory=str)
    max_tokens: int = Field(default=100)
    temperature: float = Field(default=1)
    top_p: float = Field(default=1)
    frequency_penalty: float = Field(default=0)
    presence_penalty: float = Field(default=0)
    api_key: str = Field(default=OPENAI_API_KEY)


class Prompt(BaseModel):
    template: str = Field(default_factory=str)


class Chain(BaseModel):
    llm: LLM
    prompt: Prompt
    datasets: Optional[list[str]] = []
    chain_type: str
    key: Optional[str] = None


class Model(BaseModel):
    id: Optional[str] = Field(default="")
    chains: Optional[list[Chain]] = Field(default=[])
    enable_video_interaction: Optional[bool] = Field(default=False)
    opening_remarks: Optional[str] = Field(default="")


class ModelTable(Base):
    __tablename__ = "models"

    id = Column(String, primary_key=True)
    chains = Column(JSON)
    enable_video_interaction = Column(Boolean)
    opening_remarks = Column(String)
