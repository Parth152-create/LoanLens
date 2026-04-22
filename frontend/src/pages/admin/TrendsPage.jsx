// ============================================================
// FILE 1 OF 2 — Item 3: Trends Page
// LOCATION: /Users/parth/IdeaProjects/LoanLens/frontend/src/pages/admin/TrendsPage.jsx
// ACTION: CREATE this file — it does not exist yet
// ============================================================

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { getAllLoans } from "../../services/loanService";

// ── Helpers ───────────────────────────────────────────────────

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildDailyData(loans) {
  // Group loans by day
  const map = {};
  loans.forEach((loan) => {
    const day = loan.createdAt?.slice(0, 10); // "YYYY-MM-DD"
    if (!day) return;
    if (!map[day]) {
      map[day] = { day, count: 0, totalProb: 0, LOW: 0, MEDIUM: 0, HIGH: 0 };
    }
    map[day].count++;
    map[day].totalProb += loan.defaultProbability ?? 0;
    const tier = loan.riskTier?.toUpperCase();
    if (tier === "LOW" || tier === "MEDIUM" || tier === "HIGH") {
      map[day][tier]++;
    }
  });

  return Object.values(map)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      ...d,
      label:   formatDay(d.day),
      avgProb: d.count > 0 ? +((d.totalProb / d.count) * 100).toFixed(1) : 0,
    }));
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "var(--surface, #1e2535)",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: 12,
        padding: "18px 22px",
        flex: 1,
        minWidth: 140,
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "0 0 6px" }}>
        {label}
      </p>
      <p style={{ fontSize: "1.8rem", fontWeight: 700, color: color ?? "var(--text)", margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────
function ChartCard({ title, children }) {
  return (
    <div
      style={{
        background: "var(--surface, #1e2535)",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--text-primary, #fff)",
          margin: "0 0 20px",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Tooltip style ─────────────────────────────────────────────
const tooltipStyle = {
  background: "#1e2535",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontSize: "0.8rem",
};

// ── Main component ────────────────────────────────────────────
export default function TrendsPage() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getAllLoans()
      .then(setLoans)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, color: "var(--text-muted)" }}>Loading trends…</div>;
  if (error)   return <div style={{ padding: 24, color: "#ef4444" }}>Error: {error}</div>;
  if (!loans.length) return <div style={{ padding: 24, color: "var(--text-muted)" }}>No data yet.</div>;

  const daily = buildDailyData(loans);

  const total    = loans.length;
  const avgProb  = total ? ((loans.reduce((s, l) => s + (l.defaultProbability ?? 0), 0) / total) * 100).toFixed(1) : 0;
  const approved = loans.filter((l) => l.riskTier?.toUpperCase() === "LOW").length;
  const rejected = loans.filter((l) => l.riskTier?.toUpperCase() === "HIGH").length;

  return (
    <div style={{ padding: "24px" }}>

      {/* ── Header ── */}
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary, #fff)",
          marginBottom: 24,
        }}
      >
        Trends
      </h1>

      {/* ── Summary stats ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total Applications" value={total} />
        <StatCard label="Avg Default Risk"   value={`${avgProb}%`}  color="#818cf8" />
        <StatCard label="Approved (LOW)"     value={approved}        color="#22c55e" />
        <StatCard label="Rejected (HIGH)"    value={rejected}        color="#ef4444" />
      </div>

      {/* ── Chart 1: Applications per day ── */}
      <ChartCard title="Applications Per Day">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              name="Applications"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#0ea5e9" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Chart 2: Avg default probability over time ── */}
      <ChartCard title="Avg Default Probability Over Time (%)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [`${v}%`, "Avg Default Prob"]}
            />
            <Line
              type="monotone"
              dataKey="avgProb"
              name="Avg Default Prob"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f59e0b" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Chart 3: Risk tier breakdown over time ── */}
      <ChartCard title="Risk Tier Breakdown Over Time">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: "0.8rem", color: "#94a3b8", paddingTop: 8 }}
            />
            <Bar dataKey="LOW"    name="Low Risk"    fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="MEDIUM" name="Medium Risk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="HIGH"   name="High Risk"   fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}