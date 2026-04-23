import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronUp, ChevronDown, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { getAllLoans } from "../../services/loanService";
import RiskBadge from "../../components/RiskBadge";
import VerdictChip from "../../components/VerdictChip";

// ─── Helpers ──────────────────────────────────────────────────
const getTier = (loan) => {
  if (loan.riskTier) return loan.riskTier.toUpperCase();
  const p = loan.defaultProbability ?? 0;
  return p < 0.35 ? "LOW" : p < 0.65 ? "MEDIUM" : "HIGH";
};

const TIER_CONFIG = {
  LOW:    { label: "Low Risk",    color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)"  },
  MEDIUM: { label: "Medium Risk", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)"  },
  HIGH:   { label: "High Risk",   color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"   },
};

const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

// ─── Tier Group ───────────────────────────────────────────────
function TierGroup({ tier, loans, delay }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = TIER_CONFIG[tier];

  const ages    = loans.map((l) => l.age).filter(Boolean);
  const incomes = loans.map((l) => l.monthlyIncome).filter(Boolean);
  const probs   = loans.map((l) => l.defaultProbability ?? 0);

  const avgAge    = avg(ages).toFixed(0);
  const avgIncome = avg(incomes).toFixed(0);
  const avgProb   = (avg(probs) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card style={{ background: "var(--bg-card)", border: `1px solid ${cfg.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>

        {/* ── Group Header ── */}
        <div
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-between flex-wrap gap-3 cursor-pointer select-none px-5 py-4"
          style={{ background: cfg.bg, borderBottom: expanded ? `1px solid ${cfg.border}` : "none" }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontFamily: "'Times New Roman', serif", fontWeight: 700, fontSize: "1rem", color: cfg.color }}>
              {cfg.label}
            </span>
            <Badge style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: "0.72rem", fontWeight: 700 }}>
              {loans.length} applicant{loans.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Right — stats + toggle */}
          <div className="flex items-center gap-5">
            {[
              { label: "Avg Age",    value: ages.length    ? avgAge    : "—" },
              { label: "Avg Income", value: incomes.length ? `$${Number(avgIncome).toLocaleString()}` : "—" },
              { label: "Avg Risk",   value: `${avgProb}%`, color: cfg.color },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {label}
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: color ?? "var(--text-primary)", fontFamily: "'Courier New', monospace" }}>
                  {value}
                </span>
              </div>
            ))}
            <div style={{ color: "var(--text-muted)", marginLeft: 4 }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              {loans.length === 0 ? (
                <div className="flex items-center justify-center py-10" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No applicants in this tier.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: `${cfg.border}`, background: "rgba(0,0,0,0.15)" }}>
                      {["ID", "Age", "Income", "Debt Ratio", "Default %", "Risk", "Verdict"].map((h) => (
                        <TableHead key={h} style={{ color: "var(--text-muted)", fontSize: "0.63rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan, i) => {
                      const prob = loan.defaultProbability ?? 0;
                      return (
                        <motion.tr
                          key={loan.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          style={{ borderColor: "var(--ll-border)" }}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <TableCell style={{ fontFamily: "'Courier New', monospace", fontSize: "0.78rem", color: cfg.color, fontWeight: 600 }}>
                            #{loan.id}
                          </TableCell>
                          <TableCell style={{ color: "var(--text-secondary)" }}>{loan.age ?? "—"}</TableCell>
                          <TableCell style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                            {loan.monthlyIncome ? `$${Number(loan.monthlyIncome).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell style={{ color: "var(--text-secondary)" }}>
                            {loan.debtRatio != null ? `${(loan.debtRatio * 100).toFixed(0)}%` : "—"}
                          </TableCell>
                          <TableCell>
                            <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.85rem", fontWeight: 700, color: prob > 0.65 ? "#ef4444" : prob > 0.35 ? "#f59e0b" : "#10b981" }}>
                              {Math.round(prob * 100)}%
                            </span>
                          </TableCell>
                          <TableCell><RiskBadge tier={getTier(loan)} size="sm" /></TableCell>
                          <TableCell><VerdictChip verdict={loan.verdict ?? getTier(loan)} /></TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
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

  const filtered = search.trim()
    ? loans.filter((l) => String(l.id).includes(search.trim()))
    : loans;

  const grouped = { LOW: [], MEDIUM: [], HIGH: [] };
  filtered.forEach((loan) => {
    const tier = getTier(loan);
    if (grouped[tier]) grouped[tier].push(loan);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-end justify-between flex-wrap gap-3"
      >
        <div>
          <h1 style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Applicants
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
            {loading ? "Loading…" : `${filtered.length} applicant${filtered.length !== 1 ? "s" : ""} grouped by risk tier`}
          </p>
        </div>

        {/* Search */}
        <div className="relative" style={{ width: 220 }}>
          <Search size={14} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <Input
            placeholder="Search by ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: "2.1rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--ll-border)",
              borderRadius: 10,
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              height: 36,
            }}
          />
        </div>
      </motion.div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16 }}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20 mb-3" style={{ background: "var(--ll-border)" }} />
                  <Skeleton className="h-8 w-12" style={{ background: "var(--ll-border)" }} />
                </CardContent>
              </Card>
            ))
          : Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
              <motion.div key={tier} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: tier === "LOW" ? 0 : tier === "MEDIUM" ? 0.08 : 0.16 }}>
                <Card style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 16 }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <Users size={15} color={cfg.color} />
                    </div>
                    <p style={{ fontFamily: "'Times New Roman', serif", fontSize: "2rem", fontWeight: 800, color: cfg.color, margin: 0, lineHeight: 1 }}>
                      {grouped[tier].length}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
        }
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* ── Tier Groups ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16 }}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-32 mb-4" style={{ background: "var(--ll-border)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full" style={{ background: "var(--ll-border)" }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Users size={36} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {search ? "No applicants match your search." : "No applicants yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {["HIGH", "MEDIUM", "LOW"].map((tier, i) =>
            grouped[tier].length > 0 ? (
              <TierGroup key={tier} tier={tier} loans={grouped[tier]} delay={i * 0.08} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}