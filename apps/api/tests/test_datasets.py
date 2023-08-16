import pytest
from fastapi.testclient import TestClient
from app import app  # Assuming your FastAPI application is named app
from models.base import Dataset
from models.controller import dataset_manager
import uuid

client = TestClient(app)


def test_get_dataset():
    """
    Tests the GET /v1/datasets/{id} endpoint.
    The endpoint is supposed to return a specific dataset given its id.
    """
    # Insert a dataset into the system for testing
    test_dataset = Dataset(
        documents=[
            {
                "url": "https://storage.googleapis.com/context-builder/public-tmp/0wpj5TqcnFRM.pdf",
                "type": "pdf",
                "uid": "IQtABa9mZxfm",
            }
        ],
        id="test1",
    )
    dataset_manager.save_dataset(test_dataset)

    response = client.get("/v1/datasets/test1")

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200


def test_get_datasets():
    """
    Tests the GET /v1/datasets endpoint.
    The endpoint is supposed to return all datasets.
    """
    response = client.get("/v1/datasets")

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200
    # Not testing the data because it depends on the datasets in the system


def test_create_dataset():
    """
    Tests the POST /v1/datasets endpoint.
    The endpoint is supposed to create a new dataset.
    """
    response = client.post("/v1/datasets", json={"documents": []})

    # The endpoint should return with a 200 OK status and the id of the created dataset
    assert response.status_code == 200
    assert "id" in response.json()["data"]


def test_update_dataset():
    """
    Tests the PATCH /v1/datasets/{id} endpoint.
    The endpoint is supposed to update an existing dataset.
    """
    # Update the dataset created in the test_create_dataset test
    dataset_manager.upsert_dataset(dataset_id="test2", dataset={"documents": []})
    response = client.patch(
        "/v1/datasets/test2",
        json={
            "retrieval": {
                "splitter": {"type": "fake", "chunk_size": 100, "chunk_overlap": 0},
                "embedding": {"model": "text-embedding-ada-002"},
            }
        },
    )

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200


def test_delete_dataset():
    """
    Tests the DELETE /v1/datasets/{id} endpoint.
    The endpoint is supposed to delete an existing dataset.
    """
    # Delete the dataset created in the test_create_dataset test
    response = client.delete("/v1/datasets/test1")

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200
