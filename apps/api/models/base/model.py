import os
import sys
from typing import Optional

from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import JSON, Boolean, Column, String
from utils import OPENAI_API_KEY, OUTPUT_DEFINITION_TEMPLATE

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
    target: Optional[str] = Field(default=None)
    check_prompt: Optional[str] = Field(default=None)
    follow_up_questions_num: Optional[int] = Field(default=0)
    basic_prompt: Optional[str] = Field(default=None)
    output_definition: Optional[str] = Field(default=OUTPUT_DEFINITION_TEMPLATE)


class Memory(BaseModel):
    memory_type: str = Field(default="conversation_buffer_window_memory")
    k: int = Field(default=5)
    max_token_limit: int = Field(default=2000)


class Chain(BaseModel):
    llm: LLM
    prompt: Prompt
    datasets: Optional[list[str]] = []
    chain_type: str
    memory: Optional[Memory] = Field(default_factory=lambda: Memory())
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
