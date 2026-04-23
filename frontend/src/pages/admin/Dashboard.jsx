import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
  CartesianGrid
} from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import AnimatedCounter from "../../components/AnimatedCounter";
import RiskBadge from "../../components/RiskBadge";
import VerdictChip from "../../components/VerdictChip";
import { getAllLoans } from "../../services/loanService";

// ─── Helpers ──────────────────────────────────────────────────
const getTier = (p) => (p < 0.35 ? "LOW" : p < 0.65 ? "MEDIUM" : "HIGH");

const computeStats = (loans) => {
  if (!loans.length) return { total: 0, low: 0, medium: 0, high: 0, avgProb: 0 };
  const low    = loans.filter((l) => getTier(l.defaultProbability ?? 0) === "LOW").length;
  const medium = loans.filter((l) => getTier(l.defaultProbability ?? 0) === "MEDIUM").length;
  const high   = loans.filter((l) => getTier(l.defaultProbability ?? 0) === "HIGH").length;
  const avgProb = loans.reduce((s, l) => s + (l.defaultProbability ?? 0), 0) / loans.length;
  return { total: loans.length, low, medium, high, avgProb };
};

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, suffix = "", color, delay = 0, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--ll-border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
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
                width: 36,
                height: 36,
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
          {loading ? (
            <Skeleton className="h-8 w-20" style={{ background: "var(--ll-border)" }} />
          ) : (
            <AnimatedCounter
              value={value}
              suffix={suffix}
              decimals={suffix === "%" ? 1 : 0}
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--ll-border-strong)",
        borderRadius: 10,
        padding: "0.6rem 1rem",
        fontSize: "0.82rem",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, marginBottom: 2 }}>{label || payload[0].name}</p>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>{payload[0].value} applications</p>
    </div>
  );
}

// ─── Recent Table ─────────────────────────────────────────────
function RecentTable({ loans, loading }) {
  const recent = [...loans]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, 8);

  return (
    <Card
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--ll-border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <CardHeader
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--ll-border)" }}
      >
        <div className="flex items-center justify-between">
          <CardTitle
            style={{
              fontFamily: "'Times New Roman', serif",
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Recent Evaluations
          </CardTitle>
          <Badge
            variant="outline"
            style={{
              borderColor: "var(--ll-border-strong)",
              color: "var(--text-muted)",
              fontSize: "0.72rem",
            }}
          >
            Last {recent.length} entries
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" style={{ background: "var(--ll-border)" }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Activity size={32} color="var(--text-muted)" strokeWidth={1.5} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              No evaluations yet
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "var(--ll-border)" }}>
                {["ID", "Date", "Income", "Probability", "Risk", "Verdict"].map((h) => (
                  <TableHead
                    key={h}
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((app, i) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ borderColor: "var(--ll-border)" }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <TableCell
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.78rem",
                      color: "var(--accent-1)",
                      fontWeight: 600,
                    }}
                  >
                    #{app.id}
                  </TableCell>
                  <TableCell style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </TableCell>
                  <TableCell style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {app.monthlyIncome ? `$${Number(app.monthlyIncome).toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: app.defaultProbability > 0.65
                          ? "#ef4444"
                          : app.defaultProbability > 0.35
                          ? "#f59e0b"
                          : "#10b981",
                      }}
                    >
                      {app.defaultProbability != null ? Math.round(app.defaultProbability * 100) + "%" : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RiskBadge tier={app.riskTier ?? getTier(app.defaultProbability ?? 0.5)} size="sm" />
                  </TableCell>
                  <TableCell>
                    <VerdictChip probability={app.defaultProbability ?? 0.5} />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
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
    { name: "Low",    value: stats.low,    color: "#10b981" },
    { name: "Medium", value: stats.medium, color: "#f59e0b" },
    { name: "High",   value: stats.high,   color: "#ef4444" },
  ];

  const statCards = [
    { icon: Users,         label: "Total Applications", value: stats.total,         color: "#0ea5e9" },
    { icon: CheckCircle,   label: "Low Risk",           value: stats.low,           color: "#10b981" },
    { icon: AlertTriangle, label: "High Risk",          value: stats.high,          color: "#ef4444" },
    { icon: TrendingUp,    label: "Avg Default Prob",   value: stats.avgProb * 100, suffix: "%", color: "#f59e0b" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Page Title ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1
          style={{
            fontFamily: "'Times New Roman', serif",
            fontSize: "1.7rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Portfolio Dashboard
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
          Real-time overview of all loan evaluations
        </p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.08} loading={loading} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Risk Segments Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--ll-border)",
              borderRadius: 16,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle
                style={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Risk Segments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? (
                <Skeleton className="h-44 w-full" style={{ background: "var(--ll-border)" }} />
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <BarChart data={riskChartData} barSize={44} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--ll-border)" strokeDasharray="4 4" />
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
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {riskChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribution Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.42 }}
        >
          <Card
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--ll-border)",
              borderRadius: 16,
              boxShadow: "var(--shadow-card)",
              height: "100%",
            }}
          >
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle
                style={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Distribution Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {[
                  { label: "Low Risk",    count: stats.low,    color: "#10b981" },
                  { label: "Medium Risk", count: stats.medium, color: "#f59e0b" },
                  { label: "High Risk",   count: stats.high,   color: "#ef4444" },
                ].map(({ label, count, color }) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between mb-1.5">
                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {label}
                        </span>
                        <span style={{ fontSize: "0.82rem", color, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 99,
                          background: "var(--ll-border)",
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

              <Separator className="my-4" style={{ background: "var(--ll-border)" }} />

              <div className="flex justify-between items-center">
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total evaluated</span>
                {loading ? (
                  <Skeleton className="h-7 w-12" style={{ background: "var(--ll-border)" }} />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Times New Roman', serif",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                    }}
                  >
                    {stats.total}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Recent Evaluations Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <RecentTable loans={loans} loading={loading} />
      </motion.div>
    </div>
  );
}