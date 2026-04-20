import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ScanLine, RotateCcw } from "lucide-react";

import RiskBadge from "../../components/RiskBadge";
import ProbabilityMeter from "../../components/ProbabilityMeter";
import {
  predict,
  submitLoanApplication,
  mapFormToMLFeatures,
  mapFormToLoanRequest,
  categoriseShap,
} from "../../services/loanService";

// ─── Schema ───────────────────────────────────────────────────
const schema = z.object({
  age:             z.coerce.number().min(18).max(100),
  dependents:      z.coerce.number().min(0).max(20),
  realEstateLoans: z.coerce.number().min(0).max(50),
  monthlyIncome:   z.coerce.number().min(0),
  debtRatio:       z.coerce.number().min(0).max(50),
  utilization:     z.coerce.number().min(0).max(1),
  openCreditLines: z.coerce.number().min(0).max(100),
  late30:          z.coerce.number().min(0).max(20),
  late60:          z.coerce.number().min(0).max(20),
  late90:          z.coerce.number().min(0).max(20),
});

// ─── Field definitions ────────────────────────────────────────
const FIELDS = [
  // Personal
  { name: "age",             label: "Age",                         placeholder: "35",    group: "Personal" },
  { name: "dependents",      label: "Dependents",                  placeholder: "2",     group: "Personal" },
  { name: "realEstateLoans", label: "Real Estate Loans",           placeholder: "1",     group: "Personal" },
  // Financial
  { name: "monthlyIncome",   label: "Monthly Income ($)",          placeholder: "5000",  group: "Financial" },
  { name: "debtRatio",       label: "Debt Ratio",                  placeholder: "0.35",  group: "Financial" },
  { name: "utilization",     label: "Credit Utilization (0–1)",    placeholder: "0.45",  group: "Financial" },
  { name: "openCreditLines", label: "Open Credit Lines",           placeholder: "6",     group: "Financial" },
  // Delinquencies
  { name: "late30",          label: "Late 30–59 Days",             placeholder: "0",     group: "Delinquencies" },
  { name: "late60",          label: "Late 60–89 Days",             placeholder: "0",     group: "Delinquencies" },
  { name: "late90",          label: "Late 90+ Days",               placeholder: "0",     group: "Delinquencies" },
];

const GROUPS = ["Personal", "Financial", "Delinquencies"];

// ─── SHAP driver bar ──────────────────────────────────────────
function ShapBar({ label, score, maxAbs }) {
  const pct    = maxAbs > 0 ? Math.abs(score) / maxAbs : 0;
  const isHurt = score > 0;
  const color  = isHurt ? "#ef4444" : "#10b981";
  const width  = `${Math.round(pct * 100)}%`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color }}>
          {isHurt ? "+" : ""}{score.toFixed(3)}
        </span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: 99,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: "100%",
            background: color,
            borderRadius: 99,
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────
function ResultCard({ result, formValues }) {
  const shapEntries = Object.entries(result.shapValues ?? {})
    .map(([feature, score]) => ({ feature, score }))
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  const maxAbs = shapEntries.length
    ? Math.max(...shapEntries.map((e) => Math.abs(e.score)))
    : 1;

  const FEATURE_LABELS = {
    revolving_utilization: "Credit Utilization",
    debt_ratio:            "Debt Ratio",
    late_30_59:            "Late 30–59 Days",
    late_60_89:            "Late 60–89 Days",
    late_90:               "Late 90+ Days",
    monthly_income:        "Monthly Income",
    open_credit_lines:     "Open Credit Lines",
    age:                   "Age",
    dependents:            "Dependents",
    real_estate_loans:     "Real Estate Loans",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Probability + risk badge */}
      <div className="ll-card" style={{ padding: "1.4rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Risk Assessment
          </p>
          <RiskBadge tier={result.riskTier ?? "MEDIUM"} />
        </div>

        <ProbabilityMeter probability={result.probability} />
      </div>

      {/* SHAP driver bars */}
      {shapEntries.length > 0 && (
        <div className="ll-card" style={{ padding: "1.4rem" }}>
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--text-primary)",
              marginBottom: "0.35rem",
            }}
          >
            Risk Drivers
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.1rem" }}>
            Red bars increase risk · Green bars reduce it
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {shapEntries.slice(0, 8).map(({ feature, score }) => (
              <ShapBar
                key={feature}
                label={FEATURE_LABELS[feature] ?? feature}
                score={score}
                maxAbs={maxAbs}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick summary chips */}
      <div className="ll-card" style={{ padding: "1.1rem 1.4rem" }}>
        <p
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          Top factors
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {shapEntries.slice(0, 5).map(({ feature, score }) => {
            const isHurt = score > 0;
            return (
              <span
                key={feature}
                style={{
                  padding: "0.25rem 0.65rem",
                  borderRadius: 99,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  background: isHurt ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                  border: `1px solid ${isHurt ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                  color: isHurt ? "#ef4444" : "#10b981",
                }}
              >
                {FEATURE_LABELS[feature] ?? feature}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function EvaluatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [formSnapshot, setFormSnapshot] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);

    try {
      const step1 = {
        age: data.age,
        dependents: data.dependents,
        realEstateLoans: data.realEstateLoans,
      };
      const step2 = {
        monthlyIncome: data.monthlyIncome,
        debtRatio: data.debtRatio,
        utilization: data.utilization,
        openCreditLines: data.openCreditLines,
        late30: data.late30,
        late60: data.late60,
        late90: data.late90,
      };

      const features = mapFormToMLFeatures(step1, step2);
      const loanReq  = mapFormToLoanRequest(step1, step2);

      const [prediction] = await Promise.all([
        predict(features),
        submitLoanApplication(loanReq).catch(() => null),
      ]);

      setResult(prediction);
      setFormSnapshot(features);
      toast.success("Evaluation complete");
    } catch (err) {
      toast.error(err.message || "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setFormSnapshot(null);
  };

  // Group fields by section
  const grouped = GROUPS.reduce((acc, g) => {
    acc[g] = FIELDS.filter((f) => f.group === g);
    return acc;
  }, {});

  return (
    <div>
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "1.5rem" }}
      >
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Evaluate Applicant
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
          Run a live ML risk assessment for any applicant
        </p>
      </motion.div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: result ? "1fr 1fr" : "600px",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* ── Left: form ── */}
        <motion.div layout className="ll-card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Applicant Details
            </p>
            {result && (
              <button
                className="ll-btn-ghost"
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.8rem",
                  fontSize: "0.8rem",
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}
          >
            {GROUPS.map((group) => (
              <div key={group}>
                {/* Group label */}
                <p
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--accent-1)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {group}
                </p>

                {/* Fields grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  {grouped[group].map(({ name, label, placeholder }) => (
                    <div key={name} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {label}
                      </label>
                      <input
                        className="ll-input"
                        type="number"
                        step="any"
                        placeholder={placeholder}
                        style={{ fontSize: "0.88rem" }}
                        {...register(name)}
                      />
                      {errors[name] && (
                        <p style={{ fontSize: "0.7rem", color: "#ef4444", margin: 0 }}>
                          {errors[name].message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="ll-btn-accent"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.25rem",
              }}
            >
              <ScanLine size={16} />
              {loading ? "Evaluating…" : "Run Evaluation"}
            </button>
          </form>
        </motion.div>

        {/* ── Right: result ── */}
        <AnimatePresence>
          {result && (
            <ResultCard result={result} formValues={formSnapshot} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}