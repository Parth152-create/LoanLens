// ============================================================
// FILE 1 OF 2 — Item 4: Applicants Page
// LOCATION: /Users/parth/IdeaProjects/LoanLens/frontend/src/pages/admin/ApplicantsPage.jsx
// ACTION: CREATE this file — it does not exist yet
// ============================================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllLoans } from "../../services/loanService";
import RiskBadge from "../../components/RiskBadge";
import VerdictChip from "../../components/VerdictChip";

// ── Helpers ───────────────────────────────────────────────────

const getTier = (loan) => {
  if (loan.riskTier) return loan.riskTier.toUpperCase();
  const p = loan.defaultProbability ?? loan.probability ?? 0;
  return p < 0.35 ? "LOW" : p < 0.65 ? "MEDIUM" : "HIGH";
};

const TIER_CONFIG = {
  LOW:    { label: "Low Risk",    color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)"  },
  MEDIUM: { label: "Medium Risk", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
  HIGH:   { label: "High Risk",   color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"  },
};

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

// ── Stat pill ─────────────────────────────────────────────────
function Pill({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: color ?? "var(--text-primary, #fff)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Single applicant row ──────────────────────────────────────
function ApplicantRow({ loan, index }) {
  const prob = loan.defaultProbability ?? loan.probability ?? 0;
  const verdict = loan.verdict ?? (getTier(loan) === "LOW" ? "APPROVED" : getTier(loan) === "MEDIUM" ? "REVIEW" : "REJECTED");

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      style={{
        display: "grid",
        gridTemplateColumns: "50px 80px 110px 110px 100px 130px 140px",
        gap: "0.75rem",
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid var(--border, rgba(255,255,255,0.06))",
        alignItems: "center",
        fontSize: "0.83rem",
      }}
    >
      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>#{loan.id}</span>
      <span style={{ color: "var(--text-secondary, #94a3b8)" }}>{loan.age ?? "—"}</span>
      <span style={{ color: "var(--text-secondary, #94a3b8)" }}>
        {loan.monthlyIncome ? `$${Number(loan.monthlyIncome).toLocaleString()}` : "—"}
      </span>
      <span style={{ color: "var(--text-secondary, #94a3b8)" }}>
        {loan.debtRatio != null ? `${(loan.debtRatio * 100).toFixed(0)}%` : "—"}
      </span>
      <span style={{ fontWeight: 600, color: "var(--text-primary, #fff)" }}>
        {Math.round(prob * 100)}%
      </span>
      <RiskBadge tier={getTier(loan)} size="sm" />
      <VerdictChip verdict={verdict} />
    </motion.div>
  );
}

// ── Risk tier group ───────────────────────────────────────────
function TierGroup({ tier, loans }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = TIER_CONFIG[tier];

  const ages    = loans.map((l) => l.age).filter(Boolean);
  const incomes = loans.map((l) => l.monthlyIncome).filter(Boolean);
  const probs   = loans.map((l) => l.defaultProbability ?? l.probability ?? 0);

  const avgAge    = avg(ages).toFixed(0);
  const avgIncome = avg(incomes).toFixed(0);
  const avgProb   = (avg(probs) * 100).toFixed(1);

  return (
    <div
      style={{
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 20,
        background: "var(--surface, #1e2535)",
      }}
    >
      {/* Group header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          background: cfg.bg,
          cursor: "pointer",
          userSelect: "none",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Left — title + count */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: cfg.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: cfg.color,
            }}
          >
            {cfg.label}
          </span>
          <span
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
              borderRadius: 99,
              padding: "1px 10px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {loans.length}
          </span>
        </div>

        {/* Right — summary stats */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Pill label="Avg Age"    value={ages.length    ? avgAge    : "—"} />
          <Pill label="Avg Income" value={incomes.length ? `$${Number(avgIncome).toLocaleString()}` : "—"} />
          <Pill label="Avg Risk"   value={`${avgProb}%`} color={cfg.color} />
          <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Table */}
      {expanded && (
        <>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "50px 80px 110px 110px 100px 130px 140px",
              gap: "0.75rem",
              padding: "0.5rem 1.25rem",
              borderBottom: "1px solid var(--border, rgba(255,255,255,0.06))",
              background: "rgba(0,0,0,0.15)",
            }}
          >
            {["ID", "Age", "Income", "Debt Ratio", "Default %", "Risk", "Verdict"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: "0.63rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loans.length === 0 ? (
            <p style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No applicants in this tier.
            </p>
          ) : (
            loans.map((loan, i) => (
              <ApplicantRow key={loan.id} loan={loan} index={i} />
            ))
          )}
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ApplicantsPage() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    getAllLoans()
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, color: "var(--text-muted)" }}>Loading applicants…</div>;
  if (error)   return <div style={{ padding: 24, color: "#ef4444" }}>Error: {error}</div>;

  // Filter by ID search
  const filtered = search.trim()
    ? loans.filter((l) => String(l.id).includes(search.trim()))
    : loans;

  // Group by tier
  const grouped = { LOW: [], MEDIUM: [], HIGH: [] };
  filtered.forEach((loan) => {
    const tier = getTier(loan);
    if (grouped[tier]) grouped[tier].push(loan);
  });

  const total = filtered.length;

  return (
    <div style={{ padding: "24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary, #fff)",
              margin: 0,
            }}
          >
            Applicants
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {total} applicant{total !== 1 ? "s" : ""} grouped by risk tier
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border, rgba(255,255,255,0.1))",
            background: "var(--surface, #1e2535)",
            color: "var(--text-primary, #fff)",
            fontSize: "0.85rem",
            width: 200,
            outline: "none",
          }}
        />
      </div>

      {/* ── Summary bar ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
          <div
            key={tier}
            style={{
              flex: 1,
              minWidth: 120,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: cfg.color }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: "1.6rem", fontWeight: 800, color: cfg.color, fontFamily: "'Syne', sans-serif" }}>
              {grouped[tier].length}
            </span>
          </div>
        ))}
      </div>

      {/* ── Tier groups ── */}
      {total === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
          No applicants found.
        </p>
      ) : (
        ["HIGH", "MEDIUM", "LOW"].map((tier) => (
          grouped[tier].length > 0 && (
            <TierGroup key={tier} tier={tier} loans={grouped[tier]} />
          )
        ))
      )}
    </div>
  );
}