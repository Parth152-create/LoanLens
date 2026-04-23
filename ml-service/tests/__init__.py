"""
LoanLens ML Service — pytest test suite
Run from ml-service/ directory:
    pytest tests/test_ml_service.py -v
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.model import get_risk_tier, get_confidence, _feature_hash, get_cache_stats
from app.schemas import LoanRequest

client = TestClient(app)

# ── Fixtures ──────────────────────────────────────────────────

@pytest.fixture
def valid_payload():
    return {
        "revolving_utilization": 0.5,
        "age":                   35,
        "num_times_late_30_59":  0,
        "debt_ratio":            0.3,
        "monthly_income":        5000.0,
        "num_open_credit_lines": 6,
        "num_times_late_90":     0,
        "num_real_estate_loans": 1,
        "num_times_late_60_89":  0,
        "num_dependents":        2,
    }

@pytest.fixture
def low_risk_payload():
    """Profile that should produce LOW risk."""
    return {
        "revolving_utilization": 0.1,
        "age":                   55,
        "num_times_late_30_59":  0,
        "debt_ratio":            0.1,
        "monthly_income":        10000.0,
        "num_open_credit_lines": 8,
        "num_times_late_90":     0,
        "num_real_estate_loans": 2,
        "num_times_late_60_89":  0,
        "num_dependents":        1,
    }

@pytest.fixture
def high_risk_payload():
    """Profile that should produce HIGH risk."""
    return {
        "revolving_utilization": 0.95,
        "age":                   25,
        "num_times_late_30_59":  5,
        "debt_ratio":            0.9,
        "monthly_income":        1500.0,
        "num_open_credit_lines": 2,
        "num_times_late_90":     3,
        "num_real_estate_loans": 0,
        "num_times_late_60_89":  2,
        "num_dependents":        4,
    }


# ── /health endpoint ──────────────────────────────────────────

class TestHealthEndpoint:

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_status_ok(self):
        data = client.get("/health").json()
        assert data["status"] == "ok"

    def test_health_service_name(self):
        data = client.get("/health").json()
        assert data["service"] == "LoanLens ML Service"

    def test_health_has_model_version(self):
        data = client.get("/health").json()
        assert "model_version" in data
        assert isinstance(data["model_version"], str)
        assert len(data["model_version"]) > 0

    def test_health_has_feature_count(self):
        data = client.get("/health").json()
        assert "features" in data
        assert data["features"] == 15

    def test_health_has_uptime(self):
        data = client.get("/health").json()
        assert "uptime_seconds" in data
        assert data["uptime_seconds"] >= 0

    def test_health_has_cache_stats(self):
        data = client.get("/health").json()
        assert "cache" in data
        cache = data["cache"]
        assert "hits" in cache
        assert "misses" in cache
        assert "size" in cache


# ── /predict endpoint ─────────────────────────────────────────

class TestPredictEndpoint:

    def test_predict_valid_returns_200(self, valid_payload):
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 200

    def test_predict_response_has_all_fields(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert "default_probability" in data
        assert "risk_tier" in data
        assert "message" in data
        assert "confidence" in data
        assert "confidence_score" in data
        assert "shap_values" in data

    def test_predict_probability_in_range(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert 0.0 <= data["default_probability"] <= 1.0

    def test_predict_risk_tier_valid_value(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert data["risk_tier"] in ("LOW", "MEDIUM", "HIGH")

    def test_predict_confidence_valid_value(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert data["confidence"] in ("LOW", "MEDIUM", "HIGH")

    def test_predict_confidence_score_in_range(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert 0.0 <= data["confidence_score"] <= 1.0

    def test_predict_shap_values_is_dict(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert isinstance(data["shap_values"], dict)
        assert len(data["shap_values"]) == 15

    def test_predict_message_contains_risk_level(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        assert any(word in data["message"].lower() for word in ["low", "moderate", "high"])

    def test_predict_high_risk_profile(self, high_risk_payload):
        data = client.post("/predict", json=high_risk_payload).json()
        assert data["risk_tier"] == "HIGH"
        assert data["default_probability"] >= 0.40

    def test_predict_low_risk_profile(self, low_risk_payload):
        data = client.post("/predict", json=low_risk_payload).json()
        assert data["default_probability"] < 0.40


# ── Input validation ──────────────────────────────────────────

class TestInputValidation:

    def test_age_below_18_returns_422(self, valid_payload):
        valid_payload["age"] = 15
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_age_above_100_returns_422(self, valid_payload):
        valid_payload["age"] = 150
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_utilization_above_1_returns_422(self, valid_payload):
        valid_payload["revolving_utilization"] = 1.5
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_negative_utilization_returns_422(self, valid_payload):
        valid_payload["revolving_utilization"] = -0.1
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_negative_income_returns_422(self, valid_payload):
        valid_payload["monthly_income"] = -500
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_negative_dependents_returns_422(self, valid_payload):
        valid_payload["num_dependents"] = -1
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_missing_required_field_returns_422(self, valid_payload):
        del valid_payload["age"]
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_empty_body_returns_422(self):
        response = client.post("/predict", json={})
        assert response.status_code == 422

    def test_multiple_invalid_fields_returns_422(self, valid_payload):
        valid_payload["age"] = 10
        valid_payload["revolving_utilization"] = 5.0
        valid_payload["monthly_income"] = -100
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 422

    def test_zero_income_is_valid(self, valid_payload):
        """Zero income is allowed (unemployed applicant)."""
        valid_payload["monthly_income"] = 0
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 200

    def test_boundary_age_18_is_valid(self, valid_payload):
        valid_payload["age"] = 18
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 200

    def test_boundary_utilization_1_is_valid(self, valid_payload):
        valid_payload["revolving_utilization"] = 1.0
        response = client.post("/predict", json=valid_payload)
        assert response.status_code == 200


# ── get_risk_tier() unit tests ────────────────────────────────

class TestGetRiskTier:

    def test_probability_0_is_low(self):
        assert get_risk_tier(0.0) == "LOW"

    def test_probability_0_14_is_low(self):
        assert get_risk_tier(0.14) == "LOW"

    def test_probability_0_15_is_medium(self):
        assert get_risk_tier(0.15) == "MEDIUM"

    def test_probability_0_39_is_medium(self):
        assert get_risk_tier(0.39) == "MEDIUM"

    def test_probability_0_40_is_high(self):
        assert get_risk_tier(0.40) == "HIGH"

    def test_probability_1_0_is_high(self):
        assert get_risk_tier(1.0) == "HIGH"

    def test_probability_0_5_is_high(self):
        assert get_risk_tier(0.5) == "HIGH"


# ── get_confidence() unit tests ───────────────────────────────

class TestGetConfidence:

    def test_returns_tuple_of_str_and_float(self):
        label, score = get_confidence(0.5)
        assert isinstance(label, str)
        assert isinstance(score, float)

    def test_label_is_valid_value(self):
        for prob in [0.0, 0.1, 0.3, 0.5, 0.8, 1.0]:
            label, _ = get_confidence(prob)
            assert label in ("LOW", "MEDIUM", "HIGH")

    def test_score_in_range(self):
        for prob in [0.0, 0.15, 0.27, 0.40, 0.75, 1.0]:
            _, score = get_confidence(prob)
            assert 0.0 <= score <= 1.0

    def test_far_from_boundary_is_high_confidence(self):
        """Probability very far from 0.15 and 0.40 should be HIGH confidence."""
        label, score = get_confidence(0.0)
        assert score > 0.5

    def test_near_boundary_is_low_confidence(self):
        """Probability right at boundary should be LOW confidence."""
        label, score = get_confidence(0.15)
        assert score == 0.0

    def test_near_second_boundary_is_low_confidence(self):
        label, score = get_confidence(0.40)
        assert score == 0.0


# ── Caching ───────────────────────────────────────────────────

class TestCaching:

    def test_same_input_uses_cache(self, valid_payload):
        """Second identical request should increment cache hits."""
        import app.model as model_module

        # Reset cache state
        model_module._prediction_cache.clear()
        model_module._cache_hits = 0
        model_module._cache_misses = 0

        client.post("/predict", json=valid_payload)
        client.post("/predict", json=valid_payload)

        stats = get_cache_stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1

    def test_different_inputs_both_miss(self, valid_payload, high_risk_payload):
        """Two different inputs should both be cache misses."""
        import app.model as model_module

        model_module._prediction_cache.clear()
        model_module._cache_hits = 0
        model_module._cache_misses = 0

        client.post("/predict", json=valid_payload)
        client.post("/predict", json=high_risk_payload)

        stats = get_cache_stats()
        assert stats["misses"] == 2
        assert stats["size"] == 2

    def test_cache_size_increases(self, valid_payload):
        import app.model as model_module

        model_module._prediction_cache.clear()
        initial_size = get_cache_stats()["size"]

        client.post("/predict", json=valid_payload)

        assert get_cache_stats()["size"] == initial_size + 1

    def test_feature_hash_deterministic(self):
        """Same dict always produces same hash."""
        raw = {"age": 35, "debt_ratio": 0.3, "monthly_income": 5000.0}
        assert _feature_hash(raw) == _feature_hash(raw)

    def test_feature_hash_different_for_different_inputs(self):
        raw1 = {"age": 35, "debt_ratio": 0.3}
        raw2 = {"age": 36, "debt_ratio": 0.3}
        assert _feature_hash(raw1) != _feature_hash(raw2)