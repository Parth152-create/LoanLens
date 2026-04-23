import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ScanLine, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import RiskBadge from "../../components/RiskBadge";
import ProbabilityMeter from "../../components/ProbabilityMeter";
import {
  predict,
  submitLoanApplication,
  mapFormToMLFeatures,
  mapFormToLoanRequest,
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

const FIELDS = [
  { name: "age",             label: "Age",                       placeholder: "35",   group: "Personal" },
  { name: "dependents",      label: "Dependents",                placeholder: "2",    group: "Personal" },
  { name: "realEstateLoans", label: "Real Estate Loans",         placeholder: "1",    group: "Personal" },
  { name: "monthlyIncome",   label: "Monthly Income ($)",        placeholder: "5000", group: "Financial" },
  { name: "debtRatio",       label: "Debt Ratio",                placeholder: "0.35", group: "Financial" },
  { name: "utilization",     label: "Credit Utilization (0–1)", placeholder: "0.45", group: "Financial" },
  { name: "openCreditLines", label: "Open Credit Lines",         placeholder: "6",    group: "Financial" },
  { name: "late30",          label: "Late 30–59 Days",           placeholder: "0",    group: "Delinquencies" },
  { name: "late60",          label: "Late 60–89 Days",           placeholder: "0",    group: "Delinquencies" },
  { name: "late90",          label: "Late 90+ Days",             placeholder: "0",    group: "Delinquencies" },
];

const GROUPS = ["Personal", "Financial", "Delinquencies"];

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

const GROUP_COLORS = {
  Personal:      "#0ea5e9",
  Financial:     "#14b8a6",
  Delinquencies: "#f59e0b",
};

// ─── SHAP Bar ─────────────────────────────────────────────────
function ShapBar({ label, score, maxAbs }) {
  const pct    = maxAbs > 0 ? Math.abs(score) / maxAbs : 0;
  const isHurt = score > 0;
  const color  = isHurt ? "#ef4444" : "#10b981";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <div className="flex justify-between items-center">
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          {label}
        </span>
        <div className="flex items-center gap-1">
          {isHurt
            ? <TrendingUp size={11} color={color} />
            : <TrendingDown size={11} color={color} />
          }
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color, fontFamily: "'Courier New', monospace" }}>
            {isHurt ? "+" : ""}{score.toFixed(3)}
          </span>
        </div>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: "var(--ll-border)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(pct * 100)}%` }}
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

// ─── Result Panel ─────────────────────────────────────────────
function ResultPanel({ result }) {
  const shapEntries = Object.entries(result.shapValues ?? {})
    .map(([feature, score]) => ({ feature, score }))
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  const maxAbs = shapEntries.length
    ? Math.max(...shapEntries.map((e) => Math.abs(e.score)))
    : 1;

  const prob = result.probability ?? 0;
  const verdict = prob < 0.35 ? "APPROVED" : prob < 0.65 ? "REVIEW" : "REJECTED";
  const verdictColor = verdict === "APPROVED" ? "#10b981" : verdict === "REVIEW" ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Risk Assessment Card */}
      <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
        <CardHeader className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--ll-border)" }}>
          <div className="flex items-center justify-between">
            <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Risk Assessment
            </CardTitle>
            <RiskBadge tier={result.riskTier ?? "MEDIUM"} />
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {/* Verdict banner */}
          <div
            className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
            style={{
              background: `${verdictColor}12`,
              border: `1px solid ${verdictColor}30`,
            }}
          >
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Decision</span>
            <span style={{ fontFamily: "'Times New Roman', serif", fontWeight: 800, fontSize: "1rem", color: verdictColor }}>
              {verdict}
            </span>
          </div>

          {/* Confidence score */}
          {result.confidence && (
            <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--ll-border)" }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                  Model Confidence
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  How certain the model is about this prediction
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Confidence bar */}
                <div style={{ width: 60, height: 6, borderRadius: 99, background: "var(--ll-border)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((result.confidenceScore ?? 0) * 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: "100%",
                      borderRadius: 99,
                      background: result.confidence === "HIGH" ? "#10b981" : result.confidence === "MEDIUM" ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <Badge style={{
                  background: result.confidence === "HIGH" ? "rgba(16,185,129,0.12)" : result.confidence === "MEDIUM" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${result.confidence === "HIGH" ? "rgba(16,185,129,0.3)" : result.confidence === "MEDIUM" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: result.confidence === "HIGH" ? "#10b981" : result.confidence === "MEDIUM" ? "#f59e0b" : "#ef4444",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}>
                  {result.confidence}
                </Badge>
              </div>
            </div>
          )}

          <ProbabilityMeter probability={result.probability} />
        </CardContent>
      </Card>

      {/* SHAP Risk Drivers */}
      {shapEntries.length > 0 && (
        <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
          <CardHeader className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--ll-border)" }}>
            <div className="flex items-center justify-between">
              <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Risk Drivers
              </CardTitle>
              <Badge variant="outline" style={{ borderColor: "var(--ll-border-strong)", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                SHAP values
              </Badge>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
              🔴 Increases risk &nbsp;·&nbsp; 🟢 Reduces risk
            </p>
          </CardHeader>
          <CardContent className="px-5 py-4">
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
          </CardContent>
        </Card>
      )}

      {/* Top Factor Chips */}
      <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
        <CardContent className="px-5 py-4">
          <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Top factors
          </p>
          <div className="flex flex-wrap gap-2">
            {shapEntries.slice(0, 5).map(({ feature, score }) => {
              const isHurt = score > 0;
              return (
                <Badge
                  key={feature}
                  style={{
                    background: isHurt ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                    border: `1px solid ${isHurt ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                    color: isHurt ? "#ef4444" : "#10b981",
                    fontSize: "0.72rem",
                  }}
                >
                  {isHurt ? "↑" : "↓"} {FEATURE_LABELS[feature] ?? feature}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EvaluatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

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
      const step1 = { age: data.age, dependents: data.dependents, realEstateLoans: data.realEstateLoans };
      const step2 = {
        monthlyIncome: data.monthlyIncome, debtRatio: data.debtRatio,
        utilization: data.utilization, openCreditLines: data.openCreditLines,
        late30: data.late30, late60: data.late60, late90: data.late90,
      };
      const features = mapFormToMLFeatures(step1, step2);
      const loanReq  = mapFormToLoanRequest(step1, step2);
      const [prediction] = await Promise.all([
        predict(features),
        submitLoanApplication(loanReq).catch(() => null),
      ]);
      setResult({
        probability:     prediction.default_probability,
        riskTier:        prediction.risk_tier,
        shapValues:      prediction.shap_values,
        confidence:      prediction.confidence,
        confidenceScore: prediction.confidence_score,
      });
      toast.success("Evaluation complete");
    } catch (err) {
      toast.error(err.message || "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  const grouped = GROUPS.reduce((acc, g) => {
    acc[g] = FIELDS.filter((f) => f.group === g);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Evaluate Applicant
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
          Run a live ML risk assessment for any applicant
        </p>
      </motion.div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: result ? "1fr 1fr" : "minmax(0, 600px)",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* ── Form ── */}
        <motion.div layout>
          <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
            <CardHeader className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--ll-border)" }}>
              <div className="flex items-center justify-between">
                <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Applicant Details
                </CardTitle>
                {result && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { reset(); setResult(null); }}
                    style={{ borderColor: "var(--ll-border-strong)", color: "var(--text-secondary)", background: "transparent", fontSize: "0.78rem" }}
                  >
                    <RotateCcw size={12} className="mr-1.5" /> Reset
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-6 py-5">
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {GROUPS.map((group, gi) => (
                  <div key={group}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: GROUP_COLORS[group], flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GROUP_COLORS[group] }}>
                        {group}
                      </span>
                    </div>

                    {/* Fields grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {grouped[group].map(({ name, label, placeholder }) => (
                        <div key={name} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <Label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                            {label}
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder={placeholder}
                            {...register(name)}
                            style={{
                              background: "var(--bg-surface)",
                              border: `1px solid ${errors[name] ? "#ef4444" : "var(--ll-border)"}`,
                              borderRadius: 10,
                              color: "var(--text-primary)",
                              fontSize: "0.88rem",
                              height: 38,
                            }}
                          />
                          {errors[name] && (
                            <p style={{ fontSize: "0.7rem", color: "#ef4444", margin: 0 }}>
                              {errors[name].message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {gi < GROUPS.length - 1 && (
                      <Separator className="mt-4" style={{ background: "var(--ll-border)" }} />
                    )}
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "var(--grad-accent)",
                    border: "none",
                    borderRadius: 10,
                    height: 44,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.25rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <ScanLine size={16} />
                      </motion.div>
                      Evaluating…
                    </>
                  ) : (
                    <>
                      <ScanLine size={16} />
                      Run Evaluation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Result Panel ── */}
        <AnimatePresence>
          {result && <ResultPanel result={result} />}
        </AnimatePresence>
      </div>
    </div>
  );
}