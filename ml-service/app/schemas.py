# ml-service/app/schemas.py
from pydantic import BaseModel

class LoanRequest(BaseModel):
    revolving_utilization: float
    age: int
    num_times_late_30_59: int
    debt_ratio: float
    monthly_income: float
    num_open_credit_lines: int
    num_times_late_90: int
    num_real_estate_loans: int
    num_times_late_60_89: int
    num_dependents: int

class PredictionResponse(BaseModel):
    default_probability: float
    risk_tier: str
    message: str