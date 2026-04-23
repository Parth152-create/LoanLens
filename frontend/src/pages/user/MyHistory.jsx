import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import VerdictChip from "../../components/VerdictChip";
import RiskBadge from "../../components/RiskBadge";
import ProbabilityMeter from "../../components/ProbabilityMeter";
import { getAllLoans } from "../../services/loanService";

// ─── Detail Panel ─────────────────────────────────────────────
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
        className="grid gap-6 px-6 py-5"
        style={{
          gridTemplateColumns: "1fr 1fr",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--ll-border)",
        }}
      >
        {/* Probability meter */}
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Default Probability
          </p>
          <ProbabilityMeter probability={app.defaultProbability ?? 0} />
        </div>

        {/* Details grid */}
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Application Details
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem" }}>
            {[
              ["Age",          app.age],
              ["Monthly Income", app.monthlyIncome ? `$${Number(app.monthlyIncome).toLocaleString()}` : "—"],
              ["Debt Ratio",   app.debtRatio != null ? (app.debtRatio * 100).toFixed(0) + "%" : "—"],
              ["Utilization",  app.revolvingUtilization != null ? (app.revolvingUtilization * 100).toFixed(0) + "%" : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>{label}</p>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── App Row ──────────────────────────────────────────────────
function AppRow({ app, index }) {
  const [expanded, setExpanded] = useState(false);
  const prob = app.defaultProbability ?? 0;

  const date = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <TableRow
        onClick={() => setExpanded((p) => !p)}
        style={{ borderColor: "var(--ll-border)", cursor: "pointer" }}
        className="hover:bg-white/[0.03] transition-colors"
      >
        <TableCell style={{ fontFamily: "'Courier New', monospace", fontSize: "0.78rem", color: "var(--accent-1)", fontWeight: 600 }}>
          #{app.id}
        </TableCell>
        <TableCell style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{date}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div style={{ width: 60, height: 6, borderRadius: 99, background: "var(--ll-border)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round(prob * 100)}%`,
                borderRadius: 99,
                background: prob < 0.35 ? "linear-gradient(90deg,#10b981,#34d399)" : prob < 0.65 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f97316)",
              }} />
            </div>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.82rem", color: prob > 0.65 ? "#ef4444" : prob > 0.35 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
              {prob != null ? Math.round(prob * 100) + "%" : "—"}
            </span>
          </div>
        </TableCell>
        <TableCell><RiskBadge tier={app.riskTier ?? "MEDIUM"} size="sm" /></TableCell>
        <TableCell><VerdictChip probability={prob} /></TableCell>
        <TableCell>
          <span style={{ color: "var(--text-muted)" }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </TableCell>
      </TableRow>

      {/* Expandable row */}
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <AnimatePresence>
              <DetailPanel app={app} />
            </AnimatePresence>
          </td>
        </tr>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
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
    } catch {
      toast.error("Couldn't load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  return (
    <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            My Applications
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
            {loading ? "Loading…" : applications.length > 0
              ? `${applications.length} application${applications.length > 1 ? "s" : ""} found`
              : "Your loan history"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchApps(true)}
          disabled={refreshing}
          style={{ borderColor: "var(--ll-border-strong)", color: "var(--text-secondary)", background: "transparent", fontSize: "0.8rem" }}
        >
          <RefreshCw size={13} className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      {!loading && applications.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { label: "Total",    value: applications.length,                                                             color: "#0ea5e9" },
            { label: "Approved", value: applications.filter(a => a.riskTier === "LOW").length,                           color: "#10b981" },
            { label: "Rejected", value: applications.filter(a => a.riskTier === "HIGH" || a.riskTier === "MEDIUM").length, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <Card key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 14 }}>
              <CardContent className="p-4">
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 6px" }}>{label}</p>
                <p style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.8rem", fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Table Card ── */}
      <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
        {loading ? (
          <CardContent className="p-6">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" style={{ background: "var(--ll-border)" }} />
              ))}
            </div>
          </CardContent>
        ) : applications.length === 0 ? (
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--ll-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={22} color="var(--text-muted)" />
              </div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>No applications yet</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Submit your first application to see it here.</p>
            </div>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "var(--ll-border)", background: "rgba(255,255,255,0.02)" }}>
                {["ID", "Date", "Probability", "Risk", "Verdict", ""].map((h) => (
                  <TableHead key={h} style={{ color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app, i) => (
                <AppRow key={app.id} app={app} index={i} />
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}