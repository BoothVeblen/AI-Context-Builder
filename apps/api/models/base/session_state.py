import sys
from typing import Union
import redis

from loguru import logger
from pydantic import BaseModel
from sqlalchemy import Column, String

from .base import Base


class SessionState(BaseModel):
    id: str
    model_id: str


class SessionStateTable(Base):
    __tablename__ = "session_state"

    id = Column(String, primary_key=True)
    model_id = Column(String)
