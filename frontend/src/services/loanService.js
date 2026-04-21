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

// ─── Request Interceptor (optional auth header later) ────────
springApi.interceptors.request.use((config) => {
  // e.g. config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor (global error normalisation) ───────
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

/**
 * Submit a new loan application.
 * POST /api/loans
 * @param {Object} formData — raw form values from the 3-step wizard
 * @returns {Promise<LoanApplicationResponse>}
 */
export const submitLoanApplication = (formData) =>
  springApi.post("/loans", formData).then((r) => r.data);

/**
 * Get all loan applications (admin).
 * GET /api/loans
 * @returns {Promise<LoanApplicationResponse[]>}
 */
export const getAllLoans = () =>
  springApi.get("/loans").then((r) => r.data);

/**
 * Get a single loan application by ID.
 * GET /api/loans/{id}
 * @param {number|string} id
 * @returns {Promise<LoanApplicationResponse>}
 */
export const getLoanById = (id) =>
  springApi.get(`/loans/${id}`).then((r) => r.data);

// ────────────────────────────────────────────────────────────
// ML PREDICTIONS  (FastAPI → XGBoost)
// ────────────────────────────────────────────────────────────

/**
 * Run ML prediction directly against FastAPI.
 * POST /predict
 *
 * Payload shape mirrors the XGBoost feature set:
 * {
 *   age, dependents, realEstateLoans,
 *   monthlyIncome, debtRatio, revolving_utilization,
 *   openCreditLines, late_30_59, late_60_89, late_90
 * }
 *
 * Response shape (PredictionResponse):
 * {
 *   probability: number,          // 0–1
 *   riskTier: "LOW"|"MEDIUM"|"HIGH",
 *   shapValues: { [feature]: number }
 * }
 *
 * @param {Object} features
 * @returns {Promise<PredictionResponse>}
 */
export const predict = (features) =>
  mlApi.post("/predict", features).then((r) => r.data);

// ────────────────────────────────────────────────────────────
// HEALTH CHECKS
// ────────────────────────────────────────────────────────────

/**
 * Spring Boot actuator health.
 * GET /actuator/health
 */
export const checkSpringHealth = () =>
  axios.get("http://localhost:8081/actuator/health").then((r) => r.data);

/**
 * FastAPI health.
 * GET /health  (add this route in FastAPI if not present)
 */
export const checkMlHealth = () =>
  mlApi.get("/health").then((r) => r.data);

// ────────────────────────────────────────────────────────────
// HELPERS — shape transformers
// ────────────────────────────────────────────────────────────

/**
 * Maps the 3-step wizard form values to the Spring Boot DTO shape.
 * Call this before submitLoanApplication().
 */
export const mapFormToLoanRequest = (step1, step2) => ({
  // Step 1 — personal
  age:             Number(step1.age),
  dependents:      Number(step1.dependents),
  realEstateLoans: Number(step1.realEstateLoans),

  // Step 2 — financial
  monthlyIncome:         Number(step2.monthlyIncome),
  debtRatio:             Number(step2.debtRatio),
  revolvingUtilization:  Number(step2.utilization),
  openCreditLines:       Number(step2.openCreditLines),
  numberOfLate3059Days:  Number(step2.late30),
  numberOfLate6089Days:  Number(step2.late60),
  numberOfTimes90Days:   Number(step2.late90),
});

/**
 * Maps wizard form values to the FastAPI /predict payload shape.
 * Call this when you want an instant ML result without saving to DB.
 */
export const mapFormToMLFeatures = (step1, step2) => ({
  age:                    Number(step1.age),
  dependents:             Number(step1.dependents),
  real_estate_loans:      Number(step1.realEstateLoans),
  monthly_income:         Number(step2.monthlyIncome),
  debt_ratio:             Number(step2.debtRatio),
  revolving_utilization:  Number(step2.utilization),
  open_credit_lines:      Number(step2.openCreditLines),
  late_30_59:             Number(step2.late30),
  late_60_89:             Number(step2.late60),
  late_90:                Number(step2.late90),
});

/**
 * Converts raw SHAP values map into sorted Hurts/Caution/Helps tags.
 * @param {Object} shapValues  — { feature: shap_score }
 * @param {Object} formValues  — original form values for display labels
 * @returns {{ hurts: Tag[], caution: Tag[], helps: Tag[] }}
 */
export const categoriseShap = (shapValues, formValues) => {
  const FEATURE_LABELS = {
    revolving_utilization: (v) => `High credit card utilization (${Math.round(v * 100)}%)`,
    debt_ratio:            (v) => `Debt ratio of ${(v * 100).toFixed(0)}%`,
    late_30_59:            (v) => `${v} late payment(s) (30–59 days)`,
    late_60_89:            (v) => `${v} late payment(s) (60–89 days)`,
    late_90:               (v) => `${v} serious delinquency(ies)`,
    monthly_income:        (v) => `Stable monthly income of $${Number(v).toLocaleString()}`,
    open_credit_lines:     (v) => `${v} open credit line(s)`,
    age:                   (v) => `Age ${v}`,
    dependents:            (v) => `${v} dependent(s)`,
    real_estate_loans:     (v) => `${v} real estate loan(s)`,
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