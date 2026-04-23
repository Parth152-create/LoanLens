import pickle
import logging
import hashlib
import json
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from functools import lru_cache

log = logging.getLogger("loanlens-ml")

BASE_DIR      = Path(__file__).resolve().parent.parent
model_path    = BASE_DIR / "models" / "credit_model.pkl"
features_path = BASE_DIR / "models" / "feature_names.pkl"

with open(model_path, "rb") as f:
    model = pickle.load(f)

with open(features_path, "rb") as f:
    feature_names = pickle.load(f)

# Model version derived from file modification time
MODEL_VERSION = str(int(model_path.stat().st_mtime))

# Build SHAP explainer once at startup
try:
    explainer = shap.TreeExplainer(model)
    log.info("SHAP TreeExplainer initialised (%d features)", len(feature_names))
except Exception as exc:
    explainer = None
    log.warning("SHAP explainer could not be initialised: %s", exc)

# ── Prediction cache ──────────────────────────────────────────
# Simple dict cache keyed by feature hash — avoids recomputing
# identical inputs (e.g. repeated test submissions)
_prediction_cache: dict = {}
_cache_hits   = 0
_cache_misses = 0


def _feature_hash(raw: dict) -> str:
    """Stable hash of the feature dict for cache keying."""
    return hashlib.md5(
        json.dumps(raw, sort_keys=True).encode()
    ).hexdigest()


def get_cache_stats() -> dict:
    return {
        "hits":   _cache_hits,
        "misses": _cache_misses,
        "size":   len(_prediction_cache),
    }


# ── Risk tier ─────────────────────────────────────────────────
def get_risk_tier(probability: float) -> str:
    if probability < 0.15:
        return "LOW"
    elif probability < 0.40:
        return "MEDIUM"
    else:
        return "HIGH"


# ── Confidence score ──────────────────────────────────────────
def get_confidence(probability: float) -> tuple[str, float]:
    """
    How far the probability is from the decision boundaries (0.15 and 0.40).
    The further from a boundary, the higher the confidence.
    Returns (label, score) where score is 0.0–1.0.
    """
    boundaries = [0.15, 0.40]
    min_dist   = min(abs(probability - b) for b in boundaries)

    # Normalise: max possible distance from nearest boundary is ~0.5
    score = round(min(min_dist / 0.25, 1.0), 4)

    if score >= 0.6:
        label = "HIGH"
    elif score >= 0.3:
        label = "MEDIUM"
    else:
        label = "LOW"

    return label, score


# ── SHAP ──────────────────────────────────────────────────────
def compute_shap(df: pd.DataFrame) -> dict[str, float]:
    if explainer is None:
        return {f: 0.0 for f in feature_names}
    try:
        values = explainer.shap_values(df)
        if isinstance(values, list):
            values = values[1] if len(values) > 1 else values[0]
        flat = np.array(values).flatten()
        return {name: round(float(v), 6) for name, v in zip(feature_names, flat)}
    except Exception as exc:
        log.error("SHAP computation failed: %s", exc)
        return {f: 0.0 for f in feature_names}


# ── Main predict function ─────────────────────────────────────
def predict_default(request) -> tuple:
    global _cache_hits, _cache_misses

    raw = {
        "RevolvingUtilizationOfUnsecuredLines": request.revolving_utilization,
        "age":                                  request.age,
        "NumberOfTime30-59DaysPastDueNotWorse": request.num_times_late_30_59,
        "DebtRatio":                            request.debt_ratio,
        "MonthlyIncome":                        request.monthly_income,
        "NumberOfOpenCreditLinesAndLoans":       request.num_open_credit_lines,
        "NumberOfTimes90DaysLate":              request.num_times_late_90,
        "NumberRealEstateLoansOrLines":         request.num_real_estate_loans,
        "NumberOfTime60-89DaysPastDueNotWorse": request.num_times_late_60_89,
        "NumberOfDependents":                   request.num_dependents,
        "total_late":         request.num_times_late_30_59 + request.num_times_late_60_89 + request.num_times_late_90,
        "debt_per_dependent": request.debt_ratio / (request.num_dependents + 1),
        "util_per_credit_line": request.revolving_utilization / (request.num_open_credit_lines + 1),
        "income_debt_ratio":  request.monthly_income / (request.debt_ratio + 1),
        "age_group":          int(np.digitize(request.age, bins=[30, 45, 60])),
    }

    # ── Cache check ───────────────────────────────────────────
    cache_key = _feature_hash(raw)
    if cache_key in _prediction_cache:
        _cache_hits += 1
        log.debug("Cache HIT (total hits: %d)", _cache_hits)
        return _prediction_cache[cache_key]

    _cache_misses += 1

    # ── Compute ───────────────────────────────────────────────
    features    = np.array([[raw[f] for f in feature_names]])
    probability = float(model.predict_proba(features)[0][1])
    risk_tier   = get_risk_tier(probability)
    confidence_label, confidence_score = get_confidence(probability)

    df          = pd.DataFrame(features, columns=feature_names)
    shap_values = compute_shap(df)

    result = (probability, risk_tier, confidence_label, confidence_score, shap_values)

    # Store in cache (cap at 500 entries to avoid memory bloat)
    if len(_prediction_cache) < 500:
        _prediction_cache[cache_key] = result

    return result