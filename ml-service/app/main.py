from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from app.schemas import LoanRequest, PredictionResponse
from app.model import predict_default, MODEL_VERSION, get_cache_stats, feature_names

import time

app = FastAPI(
    title="LoanLens ML Service",
    description="Credit risk scoring API using XGBoost",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Track startup time ────────────────────────────────────────
_startup_time = time.time()


# ── Health endpoint with model info ──────────────────────────
@app.get("/health")
def health_check():
    return {
        "status":        "ok",
        "service":       "LoanLens ML Service",
        "model_version": MODEL_VERSION,
        "features":      len(feature_names),
        "uptime_seconds": round(time.time() - _startup_time, 1),
        "cache":         get_cache_stats(),
    }


# ── Predict endpoint ──────────────────────────────────────────
@app.post("/predict", response_model=PredictionResponse)
def predict(request: LoanRequest):
    try:
        probability, risk_tier, confidence_label, confidence_score, shap_values = predict_default(request)

        risk_label = (
            "Low"      if risk_tier == "LOW"
            else "Moderate" if risk_tier == "MEDIUM"
            else "High"
        )

        return PredictionResponse(
            default_probability = round(probability, 4),
            risk_tier           = risk_tier,
            message             = f"{risk_label} risk of default.",
            confidence          = confidence_label,
            confidence_score    = confidence_score,
            shap_values         = shap_values,
        )

    except ValidationError as e:
        # Return structured validation errors
        errors = [
            {"field": err["loc"][-1], "message": err["msg"]}
            for err in e.errors()
        ]
        raise HTTPException(
            status_code=422,
            detail={"errors": errors, "message": "Invalid input data"}
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "message": "Prediction failed — please try again"}
        )