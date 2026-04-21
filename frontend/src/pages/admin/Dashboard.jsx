import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import AnimatedCounter from "../../components/AnimatedCounter";
import RiskBadge from "../../components/RiskBadge";
import VerdictChip from "../../components/VerdictChip";
import { getAllLoans } from "../../services/loanService";

// ─── Helpers ──────────────────────────────────────────────────
const getTier = (p) => (p < 0.35 ? "LOW" : p < 0.65 ? "MEDIUM" : "HIGH");

const computeStats = (loans) => {
  if (!loans.length) return { total: 0, low: 0, medium: 0, high: 0, avgProb: 0 };
  const low    = loans.filter((l) => getTier(l.probability ?? 0) === "LOW").length;
  const medium = loans.filter((l) => getTier(l.probability ?? 0) === "MEDIUM").length;
  const high   = loans.filter((l) => getTier(l.probability ?? 0) === "HIGH").length;
  const avgProb = loans.reduce((s, l) => s + (l.probability ?? 0), 0) / loans.length;
  return { total: loans.length, low, medium, high, avgProb };
};

// ─── Stat card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, suffix = "", prefix = "", color, delay = 0 }) {
  return (
    <motion.div
      className="ll-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ padding: "1.25rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={color} />
        </div>
      </div>

      <AnimatedCounter
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={suffix === "%" ? 1 : 0}
        className=""
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "2rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      />
    </motion.div>
  );
}

// ─── Custom tooltip for bar chart ─────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "0.5rem 0.85rem",
        fontSize: "0.82rem",
        color: "var(--text-primary)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>{payload[0].value} applications</p>
    </div>
  );
}

// ─── Recent evaluations table ─────────────────────────────────
function RecentTable({ loans }) {
  const recent = [...loans]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, 8);

  const COLS = ["ID", "Date", "Income", "Probability", "Risk", "Verdict"];
  const COL_WIDTHS = "50px 110px 110px 100px 120px 150px";

  return (
    <div className="ll-card" style={{ overflow: "hidden", padding: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem 0.6rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Recent Evaluations
        </p>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Last {recent.length} entries
        </span>
      </div>

      {/* Column labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COL_WIDTHS,
          gap: "0.75rem",
          padding: "0.55rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        {COLS.map((c) => (
          <span
            key={c}
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Rows */}
      {recent.length === 0 ? (
        <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No evaluations yet
        </p>
      ) : (
        recent.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: "grid",
              gridTemplateColumns: COL_WIDTHS,
              gap: "0.75rem",
              padding: "0.75rem 1.25rem",
              borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              #{app.id}
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {app.createdAt
                ? new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—"}
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {app.monthlyIncome ? `$${Number(app.monthlyIncome).toLocaleString()}` : "—"}
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {app.probability != null ? Math.round(app.probability * 100) + "%" : "—"}
            </span>
            <RiskBadge tier={app.riskTier ?? getTier(app.probability ?? 0.5)} size="sm" />
            <VerdictChip probability={app.probability ?? 0.5} />
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function Dashboard() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLoans()
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load portfolio data"))
      .finally(() => setLoading(false));
  }, []);

  const stats = computeStats(loans);

  const riskChartData = [
    { name: "Low Risk",    value: stats.low,    color: "#10b981" },
    { name: "Medium Risk", value: stats.medium, color: "#f59e0b" },
    { name: "High Risk",   value: stats.high,   color: "#ef4444" },
  ];

  const statCards = [
    { icon: Users,         label: "Total Applications", value: stats.total,              color: "#0ea5e9" },
    { icon: CheckCircle,   label: "Low Risk",            value: stats.low,                color: "#10b981" },
    { icon: AlertTriangle, label: "High Risk",           value: stats.high,               color: "#ef4444" },
    { icon: TrendingUp,    label: "Avg Default Prob",    value: stats.avgProb * 100, suffix: "%", color: "#f59e0b" },
  ];

  return (
    <div>
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
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
          Portfolio Dashboard
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
          Real-time overview of all loan evaluations
        </p>
      </motion.div>

      {/* Stat cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.08} />
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Risk segment bar chart */}
        <motion.div
          className="ll-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{ padding: "1.25rem" }}
        >
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--text-primary)",
              marginBottom: "1.25rem",
            }}
          >
            Risk Segments
          </p>
          {loading ? (
            <div style={{ height: 180, background: "var(--border)", borderRadius: 8, opacity: 0.4 }} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={riskChartData} barSize={40}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {riskChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Risk distribution breakdown */}
        <motion.div
          className="ll-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.42 }}
          style={{ padding: "1.25rem" }}
        >
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--text-primary)",
              marginBottom: "1.25rem",
            }}
          >
            Distribution Breakdown
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { label: "Low Risk",    count: stats.low,    color: "#10b981", bg: "rgba(16,185,129,0.15)" },
              { label: "Medium Risk", count: stats.medium, color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
              { label: "High Risk",   count: stats.high,   color: "#ef4444", bg: "rgba(239,68,68,0.15)"  },
            ].map(({ label, count, color, bg }) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "0.82rem", color, fontWeight: 700 }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 99,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: "100%", background: color, borderRadius: 99 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total evaluated</span>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {stats.total}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recent evaluations table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <RecentTable loans={loans} />
      </motion.div>
    </div>
  );
}