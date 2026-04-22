// ============================================================
// FILE: loanService.js
// LOCATION: /Users/parth/IdeaProjects/LoanLens/frontend/src/services/loanService.js
// CHANGE: Fixed mapFormToMLFeatures() to use exact FastAPI schema field names
//         FastAPI expects: revolving_utilization, num_times_late_30_59,
//         num_open_credit_lines, num_real_estate_loans, num_times_late_90,
//         num_times_late_60_89, num_dependents
//         Everything else is IDENTICAL to your original
// ============================================================

import axios from "axios";

// ─── Base Clients ────────────────────────────────────────────
const springApi = axios.create({
  baseURL: "http://localhost:8081/api",
  headers: { "Content-Type": "application/json" },
});

const mlApi = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ─────────────────────────────────────
springApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor ────────────────────────────────────
const handleError = (error) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong";
  return Promise.reject(new Error(message));
};

springApi.interceptors.response.use((r) => r, handleError);
mlApi.interceptors.response.use((r) => r, handleError);

// ────────────────────────────────────────────────────────────
// LOAN APPLICATIONS  (Spring Boot → PostgreSQL)
// ────────────────────────────────────────────────────────────

export const submitLoanApplication = (formData) =>
  springApi.post("/loans", formData).then((r) => r.data);

export const getAllLoans = () =>
  springApi.get("/loans").then((r) => r.data);

export const getLoanById = (id) =>
  springApi.get(`/loans/${id}`).then((r) => r.data);

// ────────────────────────────────────────────────────────────
// ML PREDICTIONS  (FastAPI → XGBoost)
// ────────────────────────────────────────────────────────────

export const predict = (features) =>
  mlApi.post("/predict", features).then((r) => r.data);

// ────────────────────────────────────────────────────────────
// HEALTH CHECKS
// ────────────────────────────────────────────────────────────

export const checkSpringHealth = () =>
  axios.get("http://localhost:8081/actuator/health").then((r) => r.data);

export const checkMlHealth = () =>
  mlApi.get("/health").then((r) => r.data);

// ────────────────────────────────────────────────────────────
// HELPERS — shape transformers
// ────────────────────────────────────────────────────────────

/**
 * Maps wizard form values to Spring Boot LoanRequest DTO.
 * Field names must match LoanRequest.java public fields exactly.
 */
export const mapFormToLoanRequest = (step1, step2) => ({
  age:                  Number(step1.age),
  numDependents:        Number(step1.dependents),
  numRealEstateLoans:   Number(step1.realEstateLoans),
  monthlyIncome:        Number(step2.monthlyIncome),
  debtRatio:            Number(step2.debtRatio),
  revolvingUtilization: Number(step2.utilization),
  numOpenCreditLines:   Number(step2.openCreditLines),
  numTimesLate3059:     Number(step2.late30),
  numTimesLate6089:     Number(step2.late60),
  numTimesLate90:       Number(step2.late90),
});

/**
 * Maps wizard form values to FastAPI /predict payload.
 * Field names must match schemas.py LoanRequest exactly.   // ← FIXED
 */
export const mapFormToMLFeatures = (step1, step2) => ({
  revolving_utilization:  Number(step2.utilization),        // ← FIXED (was revolving_utilization mismatch)
  age:                    Number(step1.age),
  num_times_late_30_59:   Number(step2.late30),             // ← FIXED (was late_30_59)
  debt_ratio:             Number(step2.debtRatio),
  monthly_income:         Number(step2.monthlyIncome),
  num_open_credit_lines:  Number(step2.openCreditLines),    // ← FIXED (was open_credit_lines)
  num_times_late_90:      Number(step2.late90),             // ← FIXED (was late_90)
  num_real_estate_loans:  Number(step1.realEstateLoans),    // ← FIXED (was real_estate_loans)
  num_times_late_60_89:   Number(step2.late60),             // ← FIXED (was late_60_89)
  num_dependents:         Number(step1.dependents),         // ← FIXED (was dependents)
});

/**
 * Converts raw SHAP values map into sorted Hurts/Caution/Helps tags.
 */
export const categoriseShap = (shapValues, formValues) => {
  const FEATURE_LABELS = {
    revolving_utilization:  (v) => `High credit card utilization (${Math.round(v * 100)}%)`,
    debt_ratio:             (v) => `Debt ratio of ${(v * 100).toFixed(0)}%`,
    num_times_late_30_59:   (v) => `${v} late payment(s) (30–59 days)`,
    num_times_late_60_89:   (v) => `${v} late payment(s) (60–89 days)`,
    num_times_late_90:      (v) => `${v} serious delinquency(ies)`,
    monthly_income:         (v) => `Stable monthly income of $${Number(v).toLocaleString()}`,
    num_open_credit_lines:  (v) => `${v} open credit line(s)`,
    age:                    (v) => `Age ${v}`,
    num_dependents:         (v) => `${v} dependent(s)`,
    num_real_estate_loans:  (v) => `${v} real estate loan(s)`,
  };

  const tags = Object.entries(shapValues).map(([feature, score]) => ({
    feature,
    score,
    label: FEATURE_LABELS[feature]?.(formValues[feature]) ?? feature,
  }));

  return {
    hurts:   tags.filter((t) => t.score >  0.05).sort((a, b) => b.score - a.score),
    caution: tags.filter((t) => t.score >= 0 && t.score <= 0.05),
    helps:   tags.filter((t) => t.score <  0).sort((a, b) => a.score - b.score),
  };
};