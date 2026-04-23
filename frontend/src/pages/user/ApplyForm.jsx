import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

// ─── Schemas ──────────────────────────────────────────────────
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

const STEP1_FIELDS = [
  { name: "age",             label: "Your Age",             placeholder: "e.g. 35",  hint: "Must be 18 or older" },
  { name: "dependents",      label: "Number of Dependents", placeholder: "e.g. 2",   hint: "People financially dependent on you" },
  { name: "realEstateLoans", label: "Real Estate Loans",    placeholder: "e.g. 1",   hint: "Mortgages or property loans" },
];

const STEP2_FIELDS = [
  { name: "monthlyIncome",   label: "Monthly Income ($)",         placeholder: "e.g. 5000", hint: "Your gross monthly income" },
  { name: "debtRatio",       label: "Debt Ratio",                 placeholder: "e.g. 0.35", hint: "Monthly debt ÷ monthly income" },
  { name: "utilization",     label: "Credit Card Utilization",    placeholder: "e.g. 0.45", hint: "Balance ÷ credit limit (0–1)" },
  { name: "openCreditLines", label: "Open Credit Lines",          placeholder: "e.g. 6",    hint: "Active credit accounts" },
  { name: "late30",          label: "Late Payments (30–59 days)", placeholder: "e.g. 0",    hint: "In the past 2 years" },
  { name: "late60",          label: "Late Payments (60–89 days)", placeholder: "e.g. 0",    hint: "In the past 2 years" },
  { name: "late90",          label: "Late Payments (90+ days)",   placeholder: "e.g. 0",    hint: "Serious delinquencies" },
];

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center:              { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <Label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {label}
      </Label>
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

// ─── Main Component ───────────────────────────────────────────
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

  const onStep1Submit = (data) => { setStep1Data(data); go(2); };

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
      setResult({
        probability: prediction.default_probability,
        shapValues:  prediction.shap_values,
        riskTier:    prediction.risk_tier,
        confidence:  prediction.confidence,
        formValues:  features,
      });
      if (saved) setHistory((prev) => [saved, ...prev]);
      toast.success("Application evaluated!");
      go(3);
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form1.reset(); form2.reset();
    setStep1Data(null); setResult(null); go(1);
  };

  const shapTags = result ? categoriseShap(result.shapValues ?? {}, result.formValues ?? {}) : null;

  return (
    <div style={{ paddingTop: "1rem" }}>
      <StepIndicator currentStep={step} />

      <div style={{ overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait" custom={direction}>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
              <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
                <CardHeader className="px-6 pt-6 pb-2">
                  <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Personal Information
                  </CardTitle>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                    Tell us a little about yourself to get started.
                  </p>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <form onSubmit={form1.handleSubmit(onStep1Submit)} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                    {STEP1_FIELDS.map(({ name, label, placeholder, hint }) => (
                      <Field key={name} label={label} hint={hint} error={form1.formState.errors[name]?.message}>
                        <Input
                          type="number"
                          placeholder={placeholder}
                          {...form1.register(name)}
                          style={{ background: "var(--bg-surface)", border: `1px solid ${form1.formState.errors[name] ? "#ef4444" : "var(--ll-border)"}`, borderRadius: 10, color: "var(--text-primary)", fontSize: "0.9rem", height: 40 }}
                        />
                      </Field>
                    ))}
                    <Button type="submit" style={{ background: "var(--grad-accent)", border: "none", borderRadius: 10, height: 44, fontWeight: 700, fontSize: "0.9rem", marginTop: "0.5rem" }}>
                      Continue →
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
              <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
                <CardHeader className="px-6 pt-6 pb-2">
                  <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Financial Details
                  </CardTitle>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                    This helps our model give you an accurate assessment.
                  </p>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <form onSubmit={form2.handleSubmit(onStep2Submit)} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                    {STEP2_FIELDS.map(({ name, label, placeholder, hint }) => (
                      <Field key={name} label={label} hint={hint} error={form2.formState.errors[name]?.message}>
                        <Input
                          type="number"
                          step="any"
                          placeholder={placeholder}
                          {...form2.register(name)}
                          style={{ background: "var(--bg-surface)", border: `1px solid ${form2.formState.errors[name] ? "#ef4444" : "var(--ll-border)"}`, borderRadius: 10, color: "var(--text-primary)", fontSize: "0.9rem", height: 40 }}
                        />
                      </Field>
                    ))}
                    <div className="flex gap-3 mt-2">
                      <Button type="button" variant="outline" onClick={() => go(1)} style={{ flex: 1, borderColor: "var(--ll-border-strong)", color: "var(--text-secondary)", background: "transparent", borderRadius: 10, height: 44 }}>
                        ← Back
                      </Button>
                      <Button type="submit" disabled={loading} style={{ flex: 2, background: "var(--grad-accent)", border: "none", borderRadius: 10, height: 44, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Analysing…" : "Get My Result →"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 3 && result && (
            <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
              <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)", marginBottom: "1rem" }}>
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      Your Assessment
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {result.confidence && (
                        <Badge style={{
                          background: result.confidence === "HIGH" ? "rgba(16,185,129,0.12)" : result.confidence === "MEDIUM" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                          border: `1px solid ${result.confidence === "HIGH" ? "rgba(16,185,129,0.3)" : result.confidence === "MEDIUM" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                          color: result.confidence === "HIGH" ? "#10b981" : result.confidence === "MEDIUM" ? "#f59e0b" : "#ef4444",
                          fontSize: "0.7rem",
                        }}>
                          {result.confidence} confidence
                        </Badge>
                      )}
                      <VerdictChip probability={result.probability} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ProbabilityMeter probability={result.probability} />

                  {shapTags && (
                    <div style={{ marginTop: "1.75rem" }}>
                      <Separator style={{ background: "var(--ll-border)", marginBottom: "1.25rem" }} />
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

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={handleReset} style={{ flex: 1, borderColor: "var(--ll-border-strong)", color: "var(--text-secondary)", background: "transparent", borderRadius: 10, height: 44 }}>
                      Try different info
                    </Button>
                    <Button onClick={() => toast.success("Application submitted!")} style={{ flex: 1, background: "var(--grad-accent)", border: "none", borderRadius: 10, height: 44, fontWeight: 700 }}>
                      Apply anyway
                    </Button>
                  </div>
                </CardContent>
              </Card>

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