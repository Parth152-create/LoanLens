import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, RefreshCw, X, AlertCircle, FileText, Download,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { getAllLoans } from "../../services/loanService";
import RiskBadge from "../../components/RiskBadge";
import VerdictChip from "../../components/VerdictChip";

// ─── Constants ────────────────────────────────────────────────
const RISK_TIERS = ["ALL", "LOW", "MEDIUM", "HIGH"];
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const COLUMNS = [
  { key: "id",                 label: "ID",         sortable: true  },
  { key: "age",                label: "Age",        sortable: true  },
  { key: "monthlyIncome",      label: "Income",     sortable: true  },
  { key: "debtRatio",          label: "Debt Ratio", sortable: true  },
  { key: "riskTier",           label: "Risk",       sortable: true  },
  { key: "defaultProbability", label: "Default %",  sortable: true  },
  { key: "message",            label: "Verdict",    sortable: false },
  { key: "createdAt",          label: "Date",       sortable: true  },
];

const TIER_COLORS = {
  LOW:    { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", color: "#10b981" },
  MEDIUM: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", color: "#f59e0b" },
  HIGH:   { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  color: "#ef4444" },
  ALL:    { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.3)", color: "#6366f1" },
};

const fmt = {
  currency: (n) => n == null ? "—" : `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`,
  percent:  (n) => n == null ? "—" : `${(n * 100).toFixed(1)}%`,
  date:     (s) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  },
};

// ─── Sort Icon ────────────────────────────────────────────────
function SortIcon({ column, sortKey, sortDir }) {
  if (column !== sortKey) return <ChevronsUpDown size={12} style={{ opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ChevronUp size={12} style={{ color: "var(--accent-1)" }} />
    : <ChevronDown size={12} style={{ color: "var(--accent-1)" }} />;
}

// ─── Main Component ───────────────────────────────────────────
export default function HistoryPage() {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [riskFilter, setRiskFilter]       = useState("ALL");
  const [sortKey, setSortKey]             = useState("createdAt");
  const [sortDir, setSortDir]             = useState("desc");
  const [page, setPage]                   = useState(0);
  const [pageSize, setPageSize]           = useState(10);

  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllLoans();
      if (!controller.signal.aborted) {
        let filtered = data ?? [];
        if (riskFilter !== "ALL") filtered = filtered.filter((r) => r.riskTier === riskFilter);
        if (debouncedSearch) filtered = filtered.filter((r) => String(r.id).includes(debouncedSearch.toLowerCase()));
        filtered = [...filtered].sort((a, b) => {
          const av = a[sortKey], bv = b[sortKey];
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
          return sortDir === "asc" ? av - bv : bv - av;
        });
        setTotal(filtered.length);
        const start = page * pageSize;
        setRows(filtered.slice(start, start + pageSize));
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && !controller.signal.aborted) {
        setError("Failed to load applications. Please try again.");
        toast.error("Failed to load applications");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDir, riskFilter, debouncedSearch]);

  useEffect(() => { fetchData(); return () => abortRef.current?.abort(); }, [fetchData]);

  const toggleSort = (key) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart  = total === 0 ? 0 : page * pageSize + 1;
  const pageEnd    = Math.min((page + 1) * pageSize, total);

  const pageNumbers = () => {
    const pages = [], delta = 2;
    const left = Math.max(0, page - delta), right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { pages.push(0); if (left > 1) pages.push("…"); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) pages.push("…"); pages.push(totalPages - 1); }
    return pages;
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const headers = COLUMNS.map((c) => c.label).join(",");
    const csvRows = rows.map((r) => [r.id, r.age, r.monthlyIncome, r.debtRatio, r.riskTier, fmt.percent(r.defaultProbability), `"${r.message ?? ""}"`, fmt.date(r.createdAt)].join(","));
    const blob = new Blob([[headers, ...csvRows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `loanlens-history-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const isFiltered = riskFilter !== "ALL" || debouncedSearch.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-end justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Application History
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
            {total > 0 ? `${total.toLocaleString()} total evaluation${total !== 1 ? "s" : ""}` : "All evaluated loan applications"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!rows.length}
            style={{ borderColor: "var(--ll-border-strong)", color: "var(--text-secondary)", background: "transparent", fontSize: "0.8rem" }}
          >
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            style={{ borderColor: "var(--ll-border-strong)", color: "var(--text-secondary)", background: "transparent", fontSize: "0.8rem" }}
          >
            <RefreshCw size={13} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 14 }}>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 320 }}>
                <Search size={14} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <Input
                  placeholder="Search by ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    paddingLeft: "2.1rem",
                    paddingRight: search ? "2rem" : "0.85rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--ll-border)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    height: 36,
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{ position: "absolute", right: "0.55rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <Separator orientation="vertical" style={{ height: 24, background: "var(--ll-border)" }} />

              {/* Risk filter pills */}
              <div className="flex items-center gap-1.5">
                <Filter size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                {RISK_TIERS.map((tier) => {
                  const c = TIER_COLORS[tier];
                  const isActive = riskFilter === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => { setRiskFilter(tier); setPage(0); }}
                      style={{
                        padding: "0.28rem 0.75rem",
                        borderRadius: 20,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: "pointer",
                        border: `1px solid ${isActive ? c.border : "var(--ll-border)"}`,
                        background: isActive ? c.bg : "transparent",
                        color: isActive ? c.color : "var(--text-muted)",
                        transition: "all 0.16s ease",
                      }}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>

              {/* Page size */}
              <div className="flex items-center gap-2 ml-auto">
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--ll-border)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    fontSize: "0.82rem",
                    padding: "0.3rem 0.6rem",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: "0.85rem" }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
            <button
              onClick={fetchData}
              style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "0.28rem 0.65rem", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--ll-border)", background: "rgba(255,255,255,0.02)" }}>
                  {COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        cursor: col.sortable ? "pointer" : "default",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sortable && <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                    <TableRow key={i} style={{ borderColor: "var(--ll-border)" }}>
                      {COLUMNS.map((col) => (
                        <TableCell key={col.key}>
                          <Skeleton className="h-4" style={{ width: col.key === "id" ? 32 : 72, background: "var(--ll-border)" }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <FileText size={36} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                        <p style={{ fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
                          {isFiltered ? "No matching applications" : "No applications yet"}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                          {isFiltered ? "Try adjusting your search or filter." : "Evaluated loans will appear here."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.025 }}
                      style={{ borderColor: "var(--ll-border)" }}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <TableCell style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "var(--accent-1)", fontWeight: 600 }}>
                        #{row.id}
                      </TableCell>
                      <TableCell style={{ color: "var(--text-primary)" }}>{row.age ?? "—"}</TableCell>
                      <TableCell style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {fmt.currency(row.monthlyIncome)}
                      </TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>
                        {row.debtRatio != null ? row.debtRatio.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell><RiskBadge tier={row.riskTier} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--ll-border)", overflow: "hidden", maxWidth: 60 }}>
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                width: `${Math.min(100, (row.defaultProbability ?? 0) * 100)}%`,
                                background: row.defaultProbability > 0.6 ? "#ef4444" : row.defaultProbability > 0.35 ? "#f59e0b" : "#10b981",
                              }}
                            />
                          </div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", fontWeight: 600, color: row.defaultProbability > 0.6 ? "#ef4444" : row.defaultProbability > 0.35 ? "#f59e0b" : "#10b981" }}>
                            {fmt.percent(row.defaultProbability)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell><VerdictChip verdict={row.riskTier} /></TableCell>
                      <TableCell style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {fmt.date(row.createdAt)}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div
            className="flex items-center justify-between gap-3 flex-wrap px-4 py-3"
            style={{ borderTop: "1px solid var(--ll-border)" }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {total === 0 ? "No results" : `${pageStart}–${pageEnd} of ${total.toLocaleString()}`}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                style={pageBtnStyle(false)}
              >
                <ChevronLeft size={14} />
              </button>

              {pageNumbers().map((p, i) =>
                p === "…" ? (
                  <span key={`e-${i}`} style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0 0.2rem" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    style={pageBtnStyle(p === page)}
                  >
                    {p + 1}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                style={pageBtnStyle(false)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

const pageBtnStyle = (active) => ({
  minWidth: 32,
  height: 32,
  padding: "0 0.4rem",
  borderRadius: 7,
  border: `1px solid ${active ? "var(--accent-1)" : "var(--ll-border)"}`,
  background: active ? "rgba(14,165,233,0.15)" : "transparent",
  color: active ? "var(--accent-1)" : "var(--text-secondary)",
  fontSize: "0.82rem",
  fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: active ? 700 : 400,
});