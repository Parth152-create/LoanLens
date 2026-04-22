// ============================================================
// FILE: ApplyForm.jsx
// LOCATION: /Users/parth/IdeaProjects/LoanLens/frontend/src/pages/user/ApplyForm.jsx
// CHANGES (2 lines only, marked ← FIXED):
//   1. setResult now maps default_probability → probability
//   2. shapTags uses shap_values (FastAPI key) not shapValues
// ============================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import StepIndicator from "../../components/StepIndicator";
import ProbabilityMeter from "../../components/ProbabilityMeter";
import VerdictChip from "../../components/VerdictChip";
import FactorTag from "../../components/FactorTag";
import MiniHistory from "../../components/MiniHistory";

import {
  predict,
  submitLoanApplication,
  mapFormToMLFeatures,
  mapFormToLoanRequest,
  categoriseShap,
} from "../../services/loanService";

// ─── Zod schemas ─────────────────────────────────────────────
const step1Schema = z.object({
  age:             z.coerce.number().min(18, "Must be at least 18").max(100),
  dependents:      z.coerce.number().min(0).max(20),
  realEstateLoans: z.coerce.number().min(0).max(50),
});

const step2Schema = z.object({
  monthlyIncome:   z.coerce.number().min(0, "Required"),
  debtRatio:       z.coerce.number().min(0).max(50),
  utilization:     z.coerce.number().min(0).max(1, "Enter as decimal e.g. 0.75"),
  openCreditLines: z.coerce.number().min(0).max(100),
  late30:          z.coerce.number().min(0).max(20),
  late60:          z.coerce.number().min(0).max(20),
  late90:          z.coerce.number().min(0).max(20),
});

// ─── Field config ─────────────────────────────────────────────
const STEP1_FIELDS = [
  { name: "age",             label: "Your Age",               placeholder: "e.g. 35",  hint: "Must be 18 or older" },
  { name: "dependents",      label: "Number of Dependents",   placeholder: "e.g. 2",   hint: "People financially dependent on you" },
  { name: "realEstateLoans", label: "Real Estate Loans",      placeholder: "e.g. 1",   hint: "Mortgages or property loans you currently hold" },
];

const STEP2_FIELDS = [
  { name: "monthlyIncome",   label: "Monthly Income ($)",         placeholder: "e.g. 5000", hint: "Your gross monthly income" },
  { name: "debtRatio",       label: "Debt Ratio",                 placeholder: "e.g. 0.35", hint: "Monthly debt payments ÷ monthly income" },
  { name: "utilization",     label: "Credit Card Utilization",    placeholder: "e.g. 0.45", hint: "Balance ÷ credit limit (0 – 1)" },
  { name: "openCreditLines", label: "Open Credit Lines",          placeholder: "e.g. 6",    hint: "Active credit accounts" },
  { name: "late30",          label: "Late Payments (30–59 days)", placeholder: "e.g. 0",    hint: "In the past 2 years" },
  { name: "late60",          label: "Late Payments (60–89 days)", placeholder: "e.g. 0",    hint: "In the past 2 years" },
  { name: "late90",          label: "Late Payments (90+ days)",   placeholder: "e.g. 0",    hint: "Serious delinquencies" },
];

// ─── Slide variants ───────────────────────────────────────────
const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center:              { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Small reusable field ─────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: "0.72rem", color: "#ef4444", margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ApplyForm() {
  const [step, setStep]           = useState(1);
  const [direction, setDirection] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [history, setHistory]     = useState([]);

  const form1 = useForm({ resolver: zodResolver(step1Schema), mode: "onTouched" });
  const form2 = useForm({ resolver: zodResolver(step2Schema), mode: "onTouched" });

  const go = (nextStep) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const onStep1Submit = (data) => {
    setStep1Data(data);
    go(2);
  };

  const onStep2Submit = async (data) => {
    if (!step1Data) return;
    setLoading(true);

    try {
      const features = mapFormToMLFeatures(step1Data, data);
      const loanReq  = mapFormToLoanRequest(step1Data, data);

      const [prediction, saved] = await Promise.all([
        predict(features),
        submitLoanApplication(loanReq).catch(() => null),
      ]);

      // ← FIXED: FastAPI returns default_probability and shap_values (snake_case)
      setResult({
        probability: prediction.default_probability,   // ← FIXED
        shapValues:  prediction.shap_values,           // ← FIXED
        riskTier:    prediction.risk_tier,
        formValues:  features,
      });

      if (saved) {
        setHistory((prev) => [saved, ...prev]);
      }

      toast.success("Application evaluated!");
      go(3);
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form1.reset();
    form2.reset();
    setStep1Data(null);
    setResult(null);
    go(1);
  };

  const shapTags = result
    ? categoriseShap(result.shapValues ?? {}, result.formValues ?? {})
    : null;

  return (
    <div style={{ paddingTop: "1rem" }}>
      <StepIndicator currentStep={step} />

      <div style={{ overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait" custom={direction}>

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="ll-card" style={{ padding: "1.75rem" }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                  Personal Information
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  Tell us a little about yourself to get started.
                </p>

                <form
                  onSubmit={form1.handleSubmit(onStep1Submit)}
                  style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
                >
                  {STEP1_FIELDS.map(({ name, label, placeholder, hint }) => (
                    <Field key={name} label={label} hint={hint} error={form1.formState.errors[name]?.message}>
                      <input className="ll-input" type="number" placeholder={placeholder} {...form1.register(name)} />
                    </Field>
                  ))}
                  <button type="submit" className="ll-btn-accent" style={{ marginTop: "0.5rem", width: "100%" }}>
                    Continue →
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Financial Info ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="ll-card" style={{ padding: "1.75rem" }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                  Financial Details
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  This helps our model give you an accurate assessment.
                </p>

                <form
                  onSubmit={form2.handleSubmit(onStep2Submit)}
                  style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
                >
                  {STEP2_FIELDS.map(({ name, label, placeholder, hint }) => (
                    <Field key={name} label={label} hint={hint} error={form2.formState.errors[name]?.message}>
                      <input className="ll-input" type="number" step="any" placeholder={placeholder} {...form2.register(name)} />
                    </Field>
                  ))}

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button type="button" className="ll-btn-ghost" style={{ flex: 1 }} onClick={() => go(1)}>
                      ← Back
                    </button>
                    <button type="submit" className="ll-btn-accent" style={{ flex: 2 }} disabled={loading}>
                      {loading ? "Analysing…" : "Get My Result →"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 3 && result && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="ll-card" style={{ padding: "1.75rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Your Assessment
                  </h2>
                  <VerdictChip probability={result.probability} />
                </div>

                <ProbabilityMeter probability={result.probability} />

                {shapTags && (
                  <div style={{ marginTop: "1.75rem" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                      What's affecting your result
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {shapTags.hurts.map((t)   => <FactorTag key={t.feature} type="hurts"   label={t.label} />)}
                      {shapTags.caution.map((t)  => <FactorTag key={t.feature} type="caution" label={t.label} />)}
                      {shapTags.helps.map((t)    => <FactorTag key={t.feature} type="helps"   label={t.label} />)}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
                  <button className="ll-btn-ghost" style={{ flex: 1 }} onClick={handleReset}>
                    Try different info
                  </button>
                  <button className="ll-btn-accent" style={{ flex: 1 }} onClick={() => toast.success("Application submitted!")}>
                    Apply anyway
                  </button>
                </div>
              </div>

              {history.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                    Past Applications
                  </p>
                  <MiniHistory applications={history} />
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}