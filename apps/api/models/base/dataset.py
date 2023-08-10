import logging
from typing import Optional, Union

from pydantic import BaseModel, Field
from sqlalchemy import JSON, Column, String

from .base import Base, BaseManager

logger = logging.getLogger(__name__)


class Document(BaseModel):
    uid: str = Field(default_factory=str)
    url: str = Field(default_factory=str)
    type: str = Field(default_factory=str)


class Dataset(BaseModel):
    id: str = Field(default_factory=str)
    documents: Optional[list[Document]] = Field(default_factory=list)
    retrieval: Optional[dict] = Field(default_factory=dict)


class DatasetTable(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True)
    documents = Column(JSON)
    retrieval = Column(JSON)


class DatasetManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("datasets")

    @BaseManager.db_session
    def save_dataset(self, dataset: Dataset):
        logger.info(f"Saving dataset {dataset.id}")
        return self.table.insert().values(dataset.dict())

    @BaseManager.db_session
    def update_dataset(self, dataset_id: str, update_data: dict):
        logger.info(f"Updating dataset {dataset_id}")
        return (
            self.table.update()
            .where(self.table.c.id == dataset_id)
            .values(**update_data)
        )

    @BaseManager.db_session
    def delete_dataset(self, dataset_id: str):
        logger.info(f"Deleting dataset {dataset_id}")
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
