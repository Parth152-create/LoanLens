from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import LoanRequest, PredictionResponse
from app.model import predict_default

app = FastAPI(
    title="LoanLens ML Service",
    description="Credit risk scoring API using XGBoost",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LoanLens ML Service"}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: LoanRequest):
    try:
        probability, risk_tier, shap_values = predict_default(request)  # ← unpack 3
        return PredictionResponse(
            default_probability=round(probability, 4),
            risk_tier=risk_tier,
            message=f"{'Low' if risk_tier == 'LOW' else 'Moderate' if risk_tier == 'MEDIUM' else 'High'} risk of default.",
            shap_values=shap_values,                                     # ← add
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))