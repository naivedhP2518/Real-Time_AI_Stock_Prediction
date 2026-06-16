"""
test_predict.py — ML Service unit tests
Tests: health endpoint, model status, prediction input validation
Run with: pytest test_ml_service.py -v
"""

import pytest
import json
import sys
import os

# Add ml-service dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app as flask_app


@pytest.fixture
def client():
    """Create Flask test client."""
    flask_app.config["TESTING"] = True
    flask_app.config["DEBUG"] = False
    with flask_app.test_client() as client:
        yield client


# ─── Health Check ─────────────────────────────────────────────────────────────
class TestHealthCheck:
    def test_health_returns_200(self, client):
        """Root endpoint must return HTTP 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_health_returns_json(self, client):
        """Health response must be valid JSON."""
        response = client.get("/")
        data = json.loads(response.data)
        assert "status" in data
        assert data["status"] == "online"

    def test_health_includes_service_name(self, client):
        """Health response includes service identifier."""
        response = client.get("/")
        data = json.loads(response.data)
        assert "service" in data
        assert "ML" in data["service"] or "QUANTUMSTOCKS" in data["service"]

    def test_health_includes_tensorflow_status(self, client):
        """Health response indicates TensorFlow availability."""
        response = client.get("/")
        data = json.loads(response.data)
        assert "tensorflow_active" in data
        assert isinstance(data["tensorflow_active"], bool)


# ─── Model Status ─────────────────────────────────────────────────────────────
class TestModelStatus:
    def test_model_status_returns_200(self, client):
        """Model status endpoint must return HTTP 200."""
        response = client.get("/model-status")
        assert response.status_code == 200

    def test_model_status_has_trained_symbols(self, client):
        """Model status must include trained_symbols list."""
        response = client.get("/model-status")
        data = json.loads(response.data)
        assert "trained_symbols" in data
        assert isinstance(data["trained_symbols"], list)

    def test_model_status_has_active_jobs(self, client):
        """Model status must include active_training_jobs."""
        response = client.get("/model-status")
        data = json.loads(response.data)
        assert "active_training_jobs" in data


# ─── Prediction Validation ────────────────────────────────────────────────────
class TestPredictionValidation:
    def test_predict_requires_symbol(self, client):
        """Predict endpoint must require symbol field."""
        response = client.post(
            "/predict",
            data=json.dumps({}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_predict_rejects_empty_symbol(self, client):
        """Empty symbol string must be rejected."""
        response = client.post(
            "/predict",
            data=json.dumps({"symbol": ""}),
            content_type="application/json"
        )
        assert response.status_code == 400

    def test_predict_accepts_valid_symbol(self, client):
        """Valid symbol must be accepted (may return 200 or 500 based on model)."""
        response = client.post(
            "/predict",
            data=json.dumps({"symbol": "AAPL"}),
            content_type="application/json"
        )
        # Either succeeds (200) or model error (500) — not a validation error (400)
        assert response.status_code != 400


# ─── Training Validation ──────────────────────────────────────────────────────
class TestTrainValidation:
    def test_train_requires_symbol(self, client):
        """Train endpoint must require symbol."""
        response = client.post(
            "/train-model",
            data=json.dumps({}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_train_accepts_valid_request(self, client):
        """Valid training request must be accepted and start background job."""
        response = client.post(
            "/train-model",
            data=json.dumps({"symbol": "TSLA", "epochs": 2, "batch_size": 32}),
            content_type="application/json"
        )
        # Should start or be in progress — not a 400/500
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "status" in data
        assert data["status"] in ["STARTED", "IN_PROGRESS"]


# ─── News Sentiment ───────────────────────────────────────────────────────────
class TestNewsSentiment:
    def test_news_endpoint_exists(self, client):
        """News endpoint must respond (200 or network error, not 404)."""
        response = client.get("/news/AAPL")
        assert response.status_code != 404

    def test_news_returns_json(self, client):
        """News response must be JSON."""
        response = client.get("/news/AAPL")
        assert response.content_type == "application/json"
