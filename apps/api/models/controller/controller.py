from models.base import BaseManager
from models.base import Dataset
from models.base import Model
import logging
from typing import Optional, Union
from models.retrieval import Retriever

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class RelativeManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("dataset_chain_associations")

    @classmethod
    def get_chain_urn(cls, model_id: str, chain_key: str):
        return f"{model_id}-{chain_key}"

    @BaseManager.db_session
    def save_relative(self, dataset_id: str, model_id: str, chain_key: str):
        urn = self.get_chain_urn(model_id, chain_key)
        logger.info(f"Saving relative {dataset_id} {urn}")
        return self.table.insert().values(dataset_id=dataset_id, chain_urn=urn)

    @BaseManager.db_session
    def _get_relative_datasets(self, model_id: str, chain_key: str):
        urn = self.get_chain_urn(model_id, chain_key)
        logger.info(f"Getting relative datasets {urn}")
        return self.table.select().where(self.table.c.chain_urn == urn)

    @BaseManager.db_session
    def _get_relative_chains(self, dataset_id: str):
        logger.info(f"Getting relative chains {dataset_id}")
        return self.table.select().where(self.table.c.dataset_id == dataset_id)

    @BaseManager.db_session
    def delete_relative(
        self, dataset_id: str = None, model_id: str = None, chain_key: str = None
    ):
        if dataset_id and model_id and chain_key:
            urn = self.get_chain_urn(model_id, chain_key)
            logger.info(f"Deleting relative {dataset_id} {urn}")
            return (
                self.table.delete()
                .where(self.table.c.dataset_id == dataset_id)
                .where(self.table.c.chain_urn == urn)
            )
        elif dataset_id:
            logger.info(f"Deleting relative {dataset_id}")
            return self.table.delete().where(self.table.c.dataset_id == dataset_id)
        elif model_id and chain_key:
            urn = self.get_chain_urn(model_id, chain_key)
            logger.info(f"Deleting relative {urn}")
            return self.table.delete().where(self.table.c.chain_urn == urn)
        else:
            raise ValueError("dataset_id or model_id and chain_key must be provided")

    def get_relative_datasets(self, model_id: str, chain_key: str):
        relative_datasets = self._get_relative_datasets(model_id, chain_key)
        if relative_datasets is None:
            return None
        relative_datasets = relative_datasets.fetchall()
        if len(relative_datasets) == 0:
            return None
        return [dataset.dataset_id for dataset in relative_datasets]

    def get_relative_chains(self, dataset_id: str):
        relative_chains = self._get_relative_chains(dataset_id)
        if relative_chains is None:
            return None
        relative_chains = relative_chains.fetchall()
        if len(relative_chains) == 0:
            return None
        return [chain.chain_urn for chain in relative_chains]


# TODO delete datasets properties in chains
relative_manager = RelativeManager()


class DatasetManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("datasets")

    @BaseManager.db_session
    def save_dataset(self, dataset: Dataset):
        logger.info(f"Saving dataset {dataset.id}")
        # check if dataset is pdf
        if len(dataset.documents) != 0:
            if dataset.documents[0].type != "pdf":
                raise ValueError(f"Dataset {dataset.id} is not a pdf dataset")
            Retriever.create_index([dataset])
        return self.table.insert().values(dataset.dict())

    @BaseManager.db_session
    def update_dataset(self, dataset_id: str, update_data: dict):
        logger.info(f"Updating dataset {dataset_id}")
        if update_data.get("documents"):
            dataset = self.get_datasets(dataset_id)[0]
            if update_data.get("retrieval"):
                retrieval_dict = update_data["retrieval"]
            else:
                retrieval_dict = dataset.retrieval
            update_data.pop("retrieval", None)
            update_data["retrieval"] = retrieval_dict
            # Let's start all over again first
            chains = []
            if len(dataset.documents) != 0:
                if dataset.documents[0].type != "pdf":
                    raise ValueError(f"Dataset {dataset.id} is not a pdf dataset")
                chains = Retriever.get_relative_chains(dataset)
                Retriever.delete_index(dataset)
            if len(update_data["documents"]) != 0:
                if update_data["documents"][0]["type"] != "pdf":
                    raise ValueError(f"Dataset {dataset.id} is not a pdf dataset")
                dataset = Dataset(id=dataset_id, **update_data)
                # pages updated
                Retriever.create_index([dataset])
                for chain in chains:
                    parts = chain.split("-", 1)
                    Retriever.add_relative_chain_to_dataset(dataset, parts[0], parts[1])
                return (
                    self.table.update()
                    .where(self.table.c.id == dataset.id)
                    .values(**dataset.dict())
                )
        return (
            self.table.update()
            .where(self.table.c.id == dataset_id)
            .values(**update_data)
        )

    @BaseManager.db_session
    def delete_dataset(self, dataset_id: str):
        logger.info(f"Deleting dataset {dataset_id}")
        relative_manager.delete_relative(dataset_id=dataset_id)
        return self.table.delete().where(self.table.c.id == dataset_id)

    @BaseManager.db_session
    def _get_datasets(self, dataset_id: str = None):
        if dataset_id:
            logger.info(f"Getting dataset {dataset_id}")
            return self.table.select().where(self.table.c.id == dataset_id)
        else:
            logger.info("Getting all datasets")
            return self.table.select()

    def get_datasets(self, dataset_id: str = None) -> Union[Dataset, list[Dataset]]:
        dataset_info = self._get_datasets(dataset_id)
        if dataset_info is None:
            return None
        dataset_info = dataset_info.fetchall()
        if len(dataset_info) == 0:
            return None
        # return [Dataset(**dataset._mapping) for dataset in dataset_info]
        datasets = []
        for dataset in dataset_info:
            try:
                datasets.append(Dataset(**dataset._mapping))
            except Exception as e:
                logger.error(
                    f'Error when parsing dataset {dataset._mapping["id"]}: {e}'
                )
        return datasets

    def upsert_dataset(self, dataset_id: str, dataset: dict):
        dataset_info = self.get_datasets(dataset_id)
        if dataset_info is None:
            try:
                dataset["id"] = dataset_id
                _dataset = Dataset(dataset)
                return self.save_dataset(_dataset)
            except Exception as e:
                logger.error(f"Error when saving dataset {dataset_id}: {e}")
                raise e
        else:
            return self.update_dataset(dataset_id, dataset)


dataset_manager = DatasetManager()


class ModelManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("models")

    @BaseManager.db_session
    def save_model(self, model: Model):
        logger.info(f"Saving model {model.id}")
        for chain in model.chains:
            for dataset_id in chain.datasets:
                dataset = dataset_manager.get_datasets(dataset_id)[0]
                relative_manager.save_relative(dataset.id, model.id, chain.key)
                Retriever.add_relative_chain_to_dataset(dataset, model.id, chain.key)
        return self.table.insert().values(model.dict())

    @BaseManager.db_session
    def update_model(
        self,
        model_id: str,
        update_data: dict,
    ):
        logger.info(f"Updating model {model_id}")
        if update_data.get("chains"):
            model = self.get_models(model_id)[0]
            # Let's start all over again first
            for chain in model.chains:
                for dataset_id in chain.datasets:
                    relative_manager.delete_relative(dataset_id, model_id, chain.key)
                    Retriever.delete_relative_chain_from_dataset(
                        dataset_manager.get_datasets(dataset_id)[0], model_id, chain.key
                    )
            for chain in update_data["chains"]:
                if "datasets" in chain:
                    for dataset_id in chain["datasets"]:
                        dataset = dataset_manager.get_datasets(dataset_id)[0]
                        relative_manager.save_relative(
                            dataset.id, model_id, chain["key"]
                        )
                        Retriever.add_relative_chain_to_dataset(
                            dataset, model_id, chain["key"]
                        )
        return (
            self.table.update().where(self.table.c.id == model_id).values(**update_data)
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

    def upsert_model(self, model_id: str, model: dict):
        model_info = self.get_models(model_id)
        if model_info is None:
            try:
                _model = Model(**model)
                return self.save_model(_model)
            except Exception as e:
                logger.error(
                    f"Error when parsing model {model_id} with properties{model}: {e}"
                )
                return None
        else:
            return self.update_model(model_id, model)


model_manager = ModelManager()
