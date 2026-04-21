# ml-service/app/model.py
import pickle
import logging
import numpy as np
import pandas as pd
import shap
from pathlib import Path

log = logging.getLogger("loanlens-ml")

BASE_DIR = Path(__file__).resolve().parent.parent
model_path    = BASE_DIR / "models" / "credit_model.pkl"
features_path = BASE_DIR / "models" / "feature_names.pkl"

with open(model_path, "rb") as f:
    model = pickle.load(f)

with open(features_path, "rb") as f:
    feature_names = pickle.load(f)

# Build explainer once at startup — reused for every request
try:
    explainer = shap.TreeExplainer(model)
    log.info("SHAP TreeExplainer initialised (%d features)", len(feature_names))
except Exception as exc:
    explainer = None
    log.warning("SHAP explainer could not be initialised: %s", exc)


def get_risk_tier(probability: float) -> str:
    if probability < 0.15:
        return "LOW"
    elif probability < 0.40:
        return "MEDIUM"
    else:
        return "HIGH"


def compute_shap(df: pd.DataFrame) -> dict[str, float]:
    """
    Returns { feature_name: shap_value } for a single-row DataFrame.
    Values are log-odds space: positive = pushes toward default.
    Falls back to zeros on any error so prediction is never blocked.
    """
    if explainer is None:
        return {f: 0.0 for f in feature_names}
    try:
        values = explainer.shap_values(df)
        # Older SHAP returns [neg_class_array, pos_class_array] for binary XGBoost
        if isinstance(values, list):
            values = values[1] if len(values) > 1 else values[0]
        flat = np.array(values).flatten()
        return {name: round(float(v), 6) for name, v in zip(feature_names, flat)}
    except Exception as exc:
        log.error("SHAP computation failed: %s", exc)
        return {f: 0.0 for f in feature_names}


def predict_default(request) -> tuple:
    # Map request fields to model feature names  (unchanged)
    raw = {
        "RevolvingUtilizationOfUnsecuredLines": request.revolving_utilization,
        "age": request.age,
        "NumberOfTime30-59DaysPastDueNotWorse": request.num_times_late_30_59,
        "DebtRatio": request.debt_ratio,
        "MonthlyIncome": request.monthly_income,
        "NumberOfOpenCreditLinesAndLoans": request.num_open_credit_lines,
        "NumberOfTimes90DaysLate": request.num_times_late_90,
        "NumberRealEstateLoansOrLines": request.num_real_estate_loans,
        "NumberOfTime60-89DaysPastDueNotWorse": request.num_times_late_60_89,
        "NumberOfDependents": request.num_dependents,
        "total_late": request.num_times_late_30_59 + request.num_times_late_60_89 + request.num_times_late_90,
        "debt_per_dependent": request.debt_ratio / (request.num_dependents + 1),
        "util_per_credit_line": request.revolving_utilization / (request.num_open_credit_lines + 1),
        "income_debt_ratio": request.monthly_income / (request.debt_ratio + 1),
        "age_group": int(np.digitize(request.age, bins=[30, 45, 60]))
    }

    # Build feature vector in correct order  (unchanged)
    features = np.array([[raw[f] for f in feature_names]])
    probability = float(model.predict_proba(features)[0][1])
    risk_tier = get_risk_tier(probability)

    # SHAP — pass a named DataFrame so column order is guaranteed
    df = pd.DataFrame(features, columns=feature_names)
    shap_values = compute_shap(df)

    return probability, risk_tier, shap_values