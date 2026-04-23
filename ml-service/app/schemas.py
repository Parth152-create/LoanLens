from pydantic import BaseModel, Field, validator
from typing import Dict, Optional

class LoanRequest(BaseModel):
    revolving_utilization: float = Field(..., ge=0.0, le=1.0,  description="Revolving utilization (0–1)")
    age:                   int   = Field(..., ge=18,  le=100,   description="Applicant age (18–100)")
    num_times_late_30_59:  int   = Field(..., ge=0,   le=50,    description="Times 30–59 days late")
    debt_ratio:            float = Field(..., ge=0.0,           description="Debt ratio (≥ 0)")
    monthly_income:        float = Field(..., ge=0.0,           description="Monthly income (≥ 0)")
    num_open_credit_lines: int   = Field(..., ge=0,   le=100,   description="Open credit lines")
    num_times_late_90:     int   = Field(..., ge=0,   le=50,    description="Times 90+ days late")
    num_real_estate_loans: int   = Field(..., ge=0,   le=50,    description="Real estate loans")
    num_times_late_60_89:  int   = Field(..., ge=0,   le=50,    description="Times 60–89 days late")
    num_dependents:        int   = Field(..., ge=0,   le=20,    description="Number of dependents")

    @validator("revolving_utilization")
    def utilization_range(cls, v):
        if not (0.0 <= v <= 1.0):
            raise ValueError("revolving_utilization must be between 0 and 1")
        return v

    @validator("monthly_income")
    def income_positive(cls, v):
        if v < 0:
            raise ValueError("monthly_income must be non-negative")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "revolving_utilization": 0.5,
                "age": 35,
                "num_times_late_30_59": 0,
                "debt_ratio": 0.3,
                "monthly_income": 5000,
                "num_open_credit_lines": 6,
                "num_times_late_90": 0,
                "num_real_estate_loans": 1,
                "num_times_late_60_89": 0,
                "num_dependents": 2
            }
        }


class PredictionResponse(BaseModel):
    default_probability: float
    risk_tier:           str
    message:             str
    confidence:          str          # "HIGH" | "MEDIUM" | "LOW"
    confidence_score:    float        # 0.0 – 1.0
    shap_values:         Dict[str, float]