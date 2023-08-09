from typing import Optional, Union
import os
import logging

from pydantic import BaseModel, Field
from sqlalchemy import JSON, Column, String, Boolean

from .base import Base, BaseManager
from utils import OPENAI_API_KEY

logger = logging.getLogger(__name__)


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
    id: Optional[str]
    chains: list[Chain]
    enable_video_interaction: Optional[bool] = Field(default=False)
    opening_remarks: Optional[str] = Field(default="")


class ModelTable(Base):
    __tablename__ = "models"

    id = Column(String, primary_key=True)
    chains = Column(JSON)
    enable_video_interaction = Column(Boolean)
    opening_remarks = Column(String)


class ModelManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("models")

    @BaseManager.db_session
    def save_model(self, model: Model):
        logger.info(f"Saving model {model.id}")
        return self.table.insert().values(model.dict())

    @BaseManager.db_session
    def update_model(self, model: Model):
        logger.info(f"Updating model {model.id}")
        return (
            self.table.update().where(self.table.c.id == model.id).values(model.dict())
        )

    @BaseManager.db_session
    def delete_model(self, model_id: str):
        logger.info(f"Deleting model {model_id}")
        return self.table.delete().where(self.table.c.id == model_id)

    @BaseManager.db_session
    def _get_model(self, model_id: str = None):
        if model_id:
            logger.info(f"Getting model {model_id}")
            return self.table.select().where(self.table.c.id == model_id)
        else:
            logger.info("Getting all models")
            return self.table.select()

    def get_models(self, model_id: str = None) -> Union[Model, list[Model]]:
        model_info = self._get_model(model_id)
        if model_info is None:
            return None
        model_info = model_info.fetchall()
        if len(model_info) == 0:
            return None

        models = []
        for model in model_info:
            try:
                models.append(Model(**model._mapping))
            except Exception as e:
                logger.error(f"Error when parsing model {model._mapping['id']}: {e}")
        return models

    def upsert_model(self, model: Model):
        model_info = self.get_models(model.id)
        if model_info is None:
            return self.save_model(model)
        else:
            return self.update_model(model)


model_manager = ModelManager()
