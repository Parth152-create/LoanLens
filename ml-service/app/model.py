# ml-service/app/model.py
import pickle
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
model_path = BASE_DIR / "models" / "credit_model.pkl"
features_path = BASE_DIR / "models" / "feature_names.pkl"

with open(model_path, "rb") as f:
    model = pickle.load(f)

with open(features_path, "rb") as f:
    feature_names = pickle.load(f)

def get_risk_tier(probability: float) -> str:
    if probability < 0.15:
        return "LOW"
    elif probability < 0.40:
        return "MEDIUM"
    else:
        return "HIGH"

def predict_default(request) -> tuple:
    # Map request fields to model feature names
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

    # Build feature vector in correct order
    features = np.array([[raw[f] for f in feature_names]])
    probability = float(model.predict_proba(features)[0][1])
    risk_tier = get_risk_tier(probability)

    return probability, risk_tier


