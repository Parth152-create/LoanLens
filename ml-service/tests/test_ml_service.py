"""
LoanLens ML Service — pytest test suite
Run from ml-service/ directory:
    pytest tests/test_ml_service.py -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.model import get_risk_tier, get_confidence, _feature_hash, get_cache_stats

client = TestClient(app)

# ── Fixtures ──────────────────────────────────────────────────

@pytest.fixture
def valid_payload():
    return {
        "revolving_utilization": 0.5,
        "age": 35,
        "num_times_late_30_59": 0,
        "debt_ratio": 0.3,
        "monthly_income": 5000.0,
        "num_open_credit_lines": 6,
        "num_times_late_90": 0,
        "num_real_estate_loans": 1,
        "num_times_late_60_89": 0,
        "num_dependents": 2,
    }

@pytest.fixture
def high_risk_payload():
    return {
        "revolving_utilization": 0.95,
        "age": 25,
        "num_times_late_30_59": 5,
        "debt_ratio": 0.9,
        "monthly_income": 1500.0,
        "num_open_credit_lines": 2,
        "num_times_late_90": 3,
        "num_real_estate_loans": 0,
        "num_times_late_60_89": 2,
        "num_dependents": 4,
    }

@pytest.fixture
def low_risk_payload():
    return {
        "revolving_utilization": 0.1,
        "age": 55,
        "num_times_late_30_59": 0,
        "debt_ratio": 0.1,
        "monthly_income": 10000.0,
        "num_open_credit_lines": 8,
        "num_times_late_90": 0,
        "num_real_estate_loans": 2,
        "num_times_late_60_89": 0,
        "num_dependents": 1,
    }

# ── /health ───────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_health_returns_200(self):
        assert client.get("/health").status_code == 200

    def test_health_status_ok(self):
        assert client.get("/health").json()["status"] == "ok"

    def test_health_service_name(self):
        assert client.get("/health").json()["service"] == "LoanLens ML Service"

    def test_health_has_model_version(self):
        data = client.get("/health").json()
        assert "model_version" in data and len(data["model_version"]) > 0

    def test_health_has_feature_count(self):
        assert client.get("/health").json()["features"] == 15

    def test_health_has_uptime(self):
        assert client.get("/health").json()["uptime_seconds"] >= 0

    def test_health_has_cache_stats(self):
        cache = client.get("/health").json()["cache"]
        assert all(k in cache for k in ["hits", "misses", "size"])

# ── /predict ──────────────────────────────────────────────────

class TestPredictEndpoint:
    def test_predict_valid_returns_200(self, valid_payload):
        assert client.post("/predict", json=valid_payload).status_code == 200

    def test_predict_response_has_all_fields(self, valid_payload):
        data = client.post("/predict", json=valid_payload).json()
        for field in ["default_probability","risk_tier","message","confidence","confidence_score","shap_values"]:
            assert field in data

    def test_predict_probability_in_range(self, valid_payload):
        prob = client.post("/predict", json=valid_payload).json()["default_probability"]
        assert 0.0 <= prob <= 1.0

    def test_predict_risk_tier_valid(self, valid_payload):
        assert client.post("/predict", json=valid_payload).json()["risk_tier"] in ("LOW","MEDIUM","HIGH")

    def test_predict_confidence_valid(self, valid_payload):
        assert client.post("/predict", json=valid_payload).json()["confidence"] in ("LOW","MEDIUM","HIGH")

    def test_predict_confidence_score_in_range(self, valid_payload):
        score = client.post("/predict", json=valid_payload).json()["confidence_score"]
        assert 0.0 <= score <= 1.0

    def test_predict_shap_values_is_dict(self, valid_payload):
        shap = client.post("/predict", json=valid_payload).json()["shap_values"]
        assert isinstance(shap, dict) and len(shap) == 15

    def test_predict_high_risk_profile(self, high_risk_payload):
        data = client.post("/predict", json=high_risk_payload).json()
        assert data["risk_tier"] == "HIGH"
        assert data["default_probability"] >= 0.40

    def test_predict_low_risk_profile(self, low_risk_payload):
        data = client.post("/predict", json=low_risk_payload).json()
        assert data["default_probability"] < 0.40

    def test_predict_message_not_empty(self, valid_payload):
        msg = client.post("/predict", json=valid_payload).json()["message"]
        assert len(msg) > 0

# ── Input validation ──────────────────────────────────────────

class TestInputValidation:
    def test_age_below_18_returns_422(self, valid_payload):
        valid_payload["age"] = 15
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_age_above_100_returns_422(self, valid_payload):
        valid_payload["age"] = 150
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_utilization_above_1_returns_422(self, valid_payload):
        valid_payload["revolving_utilization"] = 1.5
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_negative_utilization_returns_422(self, valid_payload):
        valid_payload["revolving_utilization"] = -0.1
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_negative_income_returns_422(self, valid_payload):
        valid_payload["monthly_income"] = -500
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_negative_dependents_returns_422(self, valid_payload):
        valid_payload["num_dependents"] = -1
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_missing_field_returns_422(self, valid_payload):
        del valid_payload["age"]
        assert client.post("/predict", json=valid_payload).status_code == 422

    def test_empty_body_returns_422(self):
        assert client.post("/predict", json={}).status_code == 422

    def test_zero_income_is_valid(self, valid_payload):
        valid_payload["monthly_income"] = 0
        assert client.post("/predict", json=valid_payload).status_code == 200

    def test_boundary_age_18_is_valid(self, valid_payload):
        valid_payload["age"] = 18
        assert client.post("/predict", json=valid_payload).status_code == 200

    def test_boundary_utilization_1_is_valid(self, valid_payload):
        valid_payload["revolving_utilization"] = 1.0
        assert client.post("/predict", json=valid_payload).status_code == 200

# ── get_risk_tier() ───────────────────────────────────────────

class TestGetRiskTier:
    def test_0_is_low(self):          assert get_risk_tier(0.0)  == "LOW"
    def test_0_14_is_low(self):       assert get_risk_tier(0.14) == "LOW"
    def test_0_15_is_medium(self):    assert get_risk_tier(0.15) == "MEDIUM"
    def test_0_39_is_medium(self):    assert get_risk_tier(0.39) == "MEDIUM"
    def test_0_40_is_high(self):      assert get_risk_tier(0.40) == "HIGH"
    def test_1_0_is_high(self):       assert get_risk_tier(1.0)  == "HIGH"

# ── get_confidence() ──────────────────────────────────────────

class TestGetConfidence:
    def test_returns_tuple(self):
        label, score = get_confidence(0.5)
        assert isinstance(label, str) and isinstance(score, float)

    def test_label_valid(self):
        for p in [0.0, 0.2, 0.5, 0.8]:
            label, _ = get_confidence(p)
            assert label in ("LOW", "MEDIUM", "HIGH")

    def test_score_in_range(self):
        for p in [0.0, 0.15, 0.40, 0.75, 1.0]:
            _, score = get_confidence(p)
            assert 0.0 <= score <= 1.0

    def test_boundary_0_15_is_zero_confidence(self):
        _, score = get_confidence(0.15)
        assert score == 0.0

    def test_boundary_0_40_is_zero_confidence(self):
        _, score = get_confidence(0.40)
        assert score == 0.0

# ── Caching ───────────────────────────────────────────────────

class TestCaching:
    def test_same_input_increments_hits(self, valid_payload):
        import app.model as m
        m._prediction_cache.clear()
        m._cache_hits = 0
        m._cache_misses = 0
        client.post("/predict", json=valid_payload)
        client.post("/predict", json=valid_payload)
        assert get_cache_stats()["hits"] >= 1

    def test_different_inputs_both_miss(self, valid_payload, high_risk_payload):
        import app.model as m
        m._prediction_cache.clear()
        m._cache_hits = 0
        m._cache_misses = 0
        client.post("/predict", json=valid_payload)
        client.post("/predict", json=high_risk_payload)
        assert get_cache_stats()["misses"] == 2
        assert get_cache_stats()["size"] == 2

    def test_hash_is_deterministic(self):
        raw = {"age": 35, "debt_ratio": 0.3}
        assert _feature_hash(raw) == _feature_hash(raw)

    def test_hash_differs_for_different_inputs(self):
        assert _feature_hash({"age": 35}) != _feature_hash({"age": 36})
