from typing import Union
from models.controller import dataset_manager
from loguru import logger
from models.base import BaseManager, Dataset, Model, SessionState
from models.retrieval import Retriever
from models.retrieval.relative import relative_manager


from .webhook import WebhookHandler as DatasetWebhookHandler

from utils.config import UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_PORT
import redis
import json


class ModelManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("models")
        self.redis = redis.Redis(
            host=UPSTASH_REDIS_REST_URL,
            password=UPSTASH_REDIS_REST_TOKEN,
            port=UPSTASH_REDIS_REST_PORT,
            ssl=True,
        )

    @staticmethod
    def get_model_urn(model_id: str):
        return f"model:{model_id}"

    @BaseManager.db_session
    def save_model(self, model: Model):
        """Saves a model to the database and updates related datasets.

        Args:
            model: The model object to save.
        """
        logger.info(f"Saving model {model.id}")
        handler = DatasetWebhookHandler()
        urn = self.get_model_urn(model.id)
        self.redis.set(urn, json.dumps(model.dict()))
        for chain in model.chains:
            for dataset_id in chain.datasets:
                handler.update_dataset_status(dataset_id, 1)
                dataset = dataset_manager.get_datasets(dataset_id)[0]
                relative_manager.save_relative(dataset.id, model.id, chain.key)
                Retriever.add_relative_chain_to_dataset(dataset, model.id, chain.key)
                handler.update_dataset_status(dataset_id, 0)
        return self.table.insert().values(model.dict())

    @BaseManager.db_session
    def update_model(
            self,
            model_id: str,
            update_data: dict,
    ):
        logger.info(f"Updating model {model_id}")
        urn = self.get_model_urn(model_id)
        if self.redis.get(urn):
            logger.info(f"Deleting model {model_id} from cache")
            self.redis.delete(urn)
        handler = DatasetWebhookHandler()
        if update_data.get("chains"):
            model = self.get_models(model_id)[0]
            # Let's start all over again first
            for chain in model.chains:
                for dataset_id in chain.datasets:
                    handler.update_dataset_status(dataset_id, 1)
                    relative_manager.delete_relative(dataset_id, model_id, chain.key)
                    get_dataset = dataset_manager.get_datasets(dataset_id)
                    if get_dataset is not None:
                        Retriever.delete_relative_chain_from_dataset(
                            get_dataset[0], model_id, chain.key
                        )
                    handler.update_dataset_status(dataset_id, 0)
            for chain in update_data["chains"]:
                if "datasets" in chain:
                    for dataset_id in chain["datasets"]:
                        handler.update_dataset_status(dataset_id, 1)
                        dataset = dataset_manager.get_datasets(dataset_id)
                        if dataset is not None:
                            relative_manager.save_relative(
                                dataset[0].id, model_id, chain["key"]
                            )
                            Retriever.add_relative_chain_to_dataset(
                                dataset[0], model_id, chain["key"]
                            )
                        handler.update_dataset_status(dataset_id, 0)
            model_dict = model.dict()
            model_dict.update(update_data)
            self.redis.set(urn, json.dumps(model_dict))
            logger.info(f"Updating model {model_id} in cache, model: {model_dict}")
        return (
            self.table.update().where(self.table.c.id == model_id).values(**update_data)
        )

    @BaseManager.db_session
    def delete_model(self, model_id: str):
        logger.info(f"Deleting model {model_id}")
        self.redis.delete(self.get_model_urn(model_id))
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
        if model_id is not None:
            cache = self.redis.get(self.get_model_urn(model_id))
            if cache:
                logger.info(f"Getting model {model_id} from cache")
                return [Model(**json.loads(cache))]
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
        for model in models:
            self.redis.set(self.get_model_urn(model.id), json.dumps(model.dict()))
        return models

    def upsert_model(self, model_id: str, model: dict):
        model_info = self.get_models(model_id)
        if model_info is None:
            try:
                _model = Model(**model)
                self.save_model(_model)
            except Exception as e:
                logger.error(
                    f"Error when parsing model {model_id} with properties{model}: {e}"
                )
                return None
        else:
            self.update_model(model_id, model)


model_manager = ModelManager()
