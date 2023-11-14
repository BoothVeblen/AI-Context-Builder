from loguru import logger
from models.base import BaseManager, Dataset, Model, SessionState


class RelativeManager(BaseManager):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.get_table("dataset_chain_associations")

    @classmethod
    def get_chain_urn(cls, model_id: str, chain_key: str):
        """Constructs and returns a unique chain identifier.

        Args:
            model_id: The ID of the model.
            chain_key: The key associated with the chain.

        Returns:
            A unique identifier for the chain.
        """
        return f"{model_id}-{chain_key}"

    @BaseManager.db_session
    def save_relative(self, dataset_id: str, model_id: str, chain_key: str):
        """Saves the relative association of a dataset to a chain.

        Args:
            dataset_id: The ID of the dataset.
            model_id: The ID of the model.
            chain_key: The key of the chain.
        """
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


relative_manager = RelativeManager()
