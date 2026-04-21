import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import VerdictChip from "../../components/VerdictChip";
import RiskBadge from "../../components/RiskBadge";
import ProbabilityMeter from "../../components/ProbabilityMeter";
import { getAllLoans } from "../../services/loanService";

// ─── Skeleton row ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 1fr 1fr 120px",
        alignItems: "center",
        gap: "1rem",
        padding: "0.9rem 1.25rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {[80, 120, 100, 90, 100].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            width: w,
            borderRadius: 6,
            background: "var(--border)",
            opacity: 0.6,
            animation: "ll-pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Expanded detail panel ────────────────────────────────────
function DetailPanel({ app }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Left: probability meter */}
        <div>
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
            Default Probability
          </p>
          <ProbabilityMeter probability={app.probability ?? 0} />
        </div>

        {/* Right: field breakdown */}
        <div>
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
            Application Details
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem 1rem",
            }}
          >
            {[
              ["Age",            app.age],
              ["Dependents",     app.dependents],
              ["Monthly Income", app.monthlyIncome ? `$${Number(app.monthlyIncome).toLocaleString()}` : "—"],
              ["Debt Ratio",     app.debtRatio != null ? (app.debtRatio * 100).toFixed(0) + "%" : "—"],
              ["Utilization",    app.revolvingUtilization != null ? (app.revolvingUtilization * 100).toFixed(0) + "%" : "—"],
              ["Credit Lines",   app.openCreditLines],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>{label}</p>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Single application row ───────────────────────────────────
function AppRow({ app, index }) {
  const [expanded, setExpanded] = useState(false);

  const date = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Row */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          display: "grid",
          gridTemplateColumns: "60px 1fr 1fr 1fr 140px",
          alignItems: "center",
          gap: "1rem",
          padding: "0.9rem 1.25rem",
          borderBottom: expanded ? "none" : "1px solid var(--border)",
          cursor: "pointer",
          transition: "background 0.15s",
          background: expanded ? "var(--bg-surface)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.background = "var(--bg-card-hover)";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* ID */}
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}>
          #{app.id}
        </span>

        {/* Date */}
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{date}</span>

        {/* Probability */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 60,
              height: 6,
              borderRadius: 99,
              background: "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((app.probability ?? 0) * 100)}%`,
                background:
                  (app.probability ?? 0) < 0.35
                    ? "linear-gradient(90deg,#10b981,#34d399)"
                    : (app.probability ?? 0) < 0.65
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#ef4444,#f97316)",
                borderRadius: 99,
              }}
            />
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: 32 }}>
            {app.probability != null ? Math.round(app.probability * 100) + "%" : "—"}
          </span>
        </div>

        {/* Risk badge */}
        <RiskBadge tier={app.riskTier ?? "MEDIUM"} size="sm" />

        {/* Verdict */}
        <VerdictChip probability={app.probability ?? 0.5} />
      </div>

      {/* Expandable detail */}
      {expanded && <DetailPanel app={app} />}
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1rem",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileText size={22} color="var(--text-muted)" />
      </div>
      <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        No applications yet
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
        Submit your first application to see it here.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function MyHistory() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const fetchApps = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getAllLoans();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Couldn't load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  return (
    <div style={{ paddingTop: "1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            My Applications
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
            {applications.length > 0
              ? `${applications.length} application${applications.length > 1 ? "s" : ""} found`
              : "Your loan history"}
          </p>
        </div>

        {/* Refresh button */}
        <button
          className="ll-btn-ghost"
          onClick={() => fetchApps(true)}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem" }}
        >
          <RefreshCw
            size={14}
            style={{
              transition: "transform 0.5s",
              transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
            }}
          />
          Refresh
        </button>
      </div>

      {/* Table card */}
      <div className="ll-card" style={{ overflow: "hidden", padding: 0 }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px 1fr 1fr 1fr 140px",
            gap: "1rem",
            padding: "0.65rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          {["ID", "Date", "Probability", "Risk", "Verdict"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: "0.68rem",
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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : applications.length === 0 ? (
          <EmptyState />
        ) : (
          applications.map((app, i) => (
            <AppRow key={app.id} app={app} index={i} />
          ))
        )}
      </div>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes ll-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}