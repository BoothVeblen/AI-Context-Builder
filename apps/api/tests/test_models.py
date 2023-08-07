import pytest
from fastapi.testclient import TestClient
from app import app  # Assuming your FastAPI application is named app
from models.base import Model, model_manager, Chain, LLM, Prompt

client = TestClient(app)


def test_get_model():
    """
    Tests the GET /v1/models/{id} endpoint.
    The endpoint is supposed to return a specific model given its id.
    """
    # Insert a model into the system for testing
    test_model = Model(
        id="test1",
        chains=[
            Chain(
                llm=LLM(name="test"),
                prompt=Prompt(template="test"),
                chain_type="conversation_chain",
                key="test-key",
            )
        ],
    )
    model_manager.save_model(test_model)

    response = client.get("/v1/models/test1")

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200
    assert response.json()["data"][0]["id"] == "test1"


def test_get_models():
    """
    Tests the GET /v1/models endpoint.
    The endpoint is supposed to return all models.
    """
    response = client.get("/v1/models")

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200
    # Not testing the data because it depends on the models in the system


def test_create_model():
    """
    Tests the POST /v1/models endpoint.
    The endpoint is supposed to create a new model.
    """
    response = client.post(
        "/v1/models/",
        json={
            "chains": [],
            "llm": {"name": "test2"},
            "prompt": {"template": "test2"},
            "chain_type": "conversational_retrieval_qa_chain",
        },
    )

    # The endpoint should return with a 200 OK status and the id of the created model
    assert response.status_code == 200
    assert "id" in response.json()["data"]


def test_update_model():
    """
    Tests the PATCH /v1/models/{id} endpoint.
    The endpoint is supposed to update an existing model.
    """
    # Update the model created in the test_create_model test
    response = client.patch(
        "/v1/models/test1", json={"chains": [], "chain_type": "conversation_chain"}
    )

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200


def test_delete_model():
    """
    Tests the DELETE /v1/models/{id} endpoint.
    The endpoint is supposed to delete an existing model.
    """
    # Delete the model created in the test_create_model test
    response = client.delete("/v1/models/test1")

    # The endpoint should return with a 200 OK status
    assert response.status_code == 200
