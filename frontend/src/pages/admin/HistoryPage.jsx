import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAllLoans } from "../../services/loanService";
import RiskBadge from "../../components/RiskBadge";
import VerdictChip from "../../components/VerdictChip";

// ─── constants ───────────────────────────────────────────────────────────────
const RISK_TIERS = ["ALL", "LOW", "MEDIUM", "HIGH"];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const COLUMNS = [
  { key: "id",                 label: "ID",         sortable: true,  width: "80px"  },
  { key: "age",                label: "Age",        sortable: true,  width: "80px"  },
  { key: "monthlyIncome",      label: "Income (₹)", sortable: true,  width: "130px" },
  { key: "debtRatio",          label: "Debt Ratio", sortable: true,  width: "110px" },
  { key: "riskTier",           label: "Risk",       sortable: true,  width: "100px" },
  { key: "defaultProbability", label: "Default %",  sortable: true,  width: "110px" },
  { key: "message",            label: "Verdict",    sortable: false, width: "160px" },
  { key: "createdAt",          label: "Date",       sortable: true,  width: "140px" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = {
  currency: (n) =>
    n == null ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n),
  percent: (n) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`),
  date: (s) => {
    if (!s) return "—";
    const d = new Date(s);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  },
};

function SortIcon({ column, sortKey, sortDir }) {
  if (column !== sortKey)
    return <ChevronsUpDown size={13} className="sort-icon muted" />;
  return sortDir === "asc"
    ? <ChevronUp size={13} className="sort-icon active" />
    : <ChevronDown size={13} className="sort-icon active" />;
}

// ─── skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ cols }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <span className="skeleton-cell" style={{ width: i === 0 ? "40px" : i === 1 ? "60px" : "80px" }} />
        </td>
      ))}
    </tr>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <tr>
      <td colSpan={COLUMNS.length} className="empty-state-cell">
        <div className="empty-state">
          <FileText size={36} className="empty-icon" />
          <p className="empty-title">{filtered ? "No matching applications" : "No applications yet"}</p>
          <p className="empty-sub">
            {filtered
              ? "Try adjusting your search or filter."
              : "Evaluated loans will appear here."}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [riskFilter, setRiskFilter]     = useState("ALL");
  const [sortKey, setSortKey]           = useState("createdAt");
  const [sortDir, setSortDir]           = useState("desc");
  const [page, setPage]                 = useState(0);
  const [pageSize, setPageSize]         = useState(10);

  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  // ── debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // loanService.getAll() maps to GET /api/loans
      // Returns a flat array from Spring Boot
      const data = await getAllLoans();

      if (!controller.signal.aborted) {
        let filtered = data ?? [];

        // client-side filter by riskTier
        if (riskFilter !== "ALL") {
          filtered = filtered.filter((r) => r.riskTier === riskFilter);
        }

        // client-side search by id
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          filtered = filtered.filter((r) =>
            String(r.id).includes(q)
          );
        }

        // client-side sort
        filtered = [...filtered].sort((a, b) => {
          const av = a[sortKey], bv = b[sortKey];
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
          return sortDir === "asc" ? av - bv : bv - av;
        });

        setTotal(filtered.length);

        // client-side pagination
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

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  // ── sort toggle ────────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  // ── pagination helpers ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart  = total === 0 ? 0 : page * pageSize + 1;
  const pageEnd    = Math.min((page + 1) * pageSize, total);

  const pageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0)        { pages.push(0); if (left > 1) pages.push("…"); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) pages.push("…"); pages.push(totalPages - 1); }
    return pages;
  };

  const isFiltered = riskFilter !== "ALL" || debouncedSearch.length > 0;

  // ── export (CSV) ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!rows.length) return;
    const headers = COLUMNS.map((c) => c.label).join(",");
    const csvRows = rows.map((r) =>
      [
        r.id,
        r.age,
        r.monthlyIncome,
        r.debtRatio,
        r.riskTier,
        fmt.percent(r.defaultProbability),
        `"${r.message ?? ""}"`,
        fmt.date(r.createdAt),
      ].join(",")
    );
    const blob = new Blob([[headers, ...csvRows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `loanlens-history-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="history-page">
      {/* ── page header ── */}
      <motion.div
        className="history-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="history-title-group">
          <h1 className="history-title">Application History</h1>
          <p className="history-subtitle">
            {total > 0
              ? `${total.toLocaleString()} total evaluation${total !== 1 ? "s" : ""}`
              : "All evaluated loan applications"}
          </p>
        </div>

        <div className="history-actions">
          <button
            className="ll-btn-ghost icon-btn"
            onClick={exportCSV}
            disabled={!rows.length}
            title="Export current page as CSV"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
          <button
            className="ll-btn-ghost icon-btn"
            onClick={fetchData}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "spinning" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* ── toolbar ── */}
      <motion.div
        className="history-toolbar ll-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        {/* search */}
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ll-input search-input"
            placeholder="Search by ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear">
              <X size={13} />
            </button>
          )}
        </div>

        {/* risk filter pills */}
        <div className="filter-group">
          <Filter size={14} className="filter-label-icon" />
          {RISK_TIERS.map((tier) => (
            <button
              key={tier}
              className={`filter-pill ${riskFilter === tier ? "active" : ""} ${tier !== "ALL" ? `risk-${tier.toLowerCase()}` : ""}`}
              onClick={() => { setRiskFilter(tier); setPage(0); }}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* page size */}
        <div className="pagesize-group">
          <span className="pagesize-label">Show</span>
          <select
            className="ll-input pagesize-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* ── error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-banner ll-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={fetchData} className="retry-btn">Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── table card ── */}
      <motion.div
        className="table-card ll-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{ minWidth: col.width }}
                    className={col.sortable ? "sortable" : ""}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="th-inner">
                      {col.label}
                      {col.sortable && (
                        <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                  <SkeletonRow key={i} cols={COLUMNS.length} />
                ))
              ) : rows.length === 0 ? (
                <EmptyState filtered={isFiltered} />
              ) : (
                rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    className="data-row"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.025 }}
                  >
                    <td className="cell-id">#{row.id}</td>
                    <td>{row.age ?? "—"}</td>
                    <td className="cell-amount">₹{fmt.currency(row.monthlyIncome)}</td>
                    <td>{row.debtRatio != null ? row.debtRatio.toFixed(2) : "—"}</td>
                    <td className="cell-risk">
                      <RiskBadge tier={row.riskTier} />
                    </td>
                    <td className="cell-prob">
                      <div className="prob-wrap">
                        <div
                          className={`prob-bar ${
                            row.defaultProbability > 0.6 ? "prob-high"
                            : row.defaultProbability > 0.35 ? "prob-med"
                            : "prob-low"
                          }`}
                          style={{ width: `${Math.min(100, (row.defaultProbability ?? 0) * 100)}%` }}
                        />
                        <span className="prob-label">{fmt.percent(row.defaultProbability)}</span>
                      </div>
                    </td>
                    <td className="cell-verdict">
                      <VerdictChip verdict={row.riskTier} />
                    </td>
                    <td className="cell-date">{fmt.date(row.createdAt)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── pagination ── */}
        <div className="pagination-bar">
          <span className="pagination-info">
            {total === 0 ? "No results" : `${pageStart}–${pageEnd} of ${total.toLocaleString()}`}
          </span>

          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>

            {pageNumbers().map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                  disabled={loading}
                >
                  {p + 1}
                </button>
              )
            )}

            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── scoped styles ── */}
      <style>{`
        .history-page {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.75rem 2rem;
          min-height: 100%;
        }
        .history-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .history-title {
          font-family: var(--font-display, 'Syne', sans-serif);
          font-size: 1.65rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.1;
        }
        .history-subtitle {
          margin: 0.25rem 0 0;
          font-size: 0.82rem;
          color: var(--color-text-muted);
        }
        .history-actions { display: flex; gap: 0.5rem; align-items: center; }
        .ll-btn-ghost {
          background: transparent;
          border: 1px solid var(--color-border, rgba(255,255,255,0.1));
          border-radius: 8px;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.18s ease;
          font-size: 0.82rem;
        }
        .ll-btn-ghost:hover:not(:disabled) {
          background: var(--color-surface-hover, rgba(255,255,255,0.06));
          color: var(--color-text-primary);
        }
        .ll-btn-ghost:disabled { opacity: 0.4; cursor: default; }
        .icon-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }
        .spinning { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .history-toolbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 0.85rem 1.1rem;
        }
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 340px;
        }
        .search-icon {
          position: absolute;
          left: 0.7rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding-left: 2.1rem !important;
          padding-right: 2rem !important;
        }
        .search-clear {
          position: absolute;
          right: 0.55rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          padding: 2px;
          display: flex;
          border-radius: 4px;
        }
        .search-clear:hover { color: var(--color-text-primary); }
        .filter-group { display: flex; align-items: center; gap: 0.35rem; }
        .filter-label-icon { color: var(--color-text-muted); flex-shrink: 0; }
        .filter-pill {
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          letter-spacing: 0.03em;
          cursor: pointer;
          border: 1px solid var(--color-border, rgba(255,255,255,0.1));
          background: transparent;
          color: var(--color-text-secondary);
          transition: all 0.16s ease;
        }
        .filter-pill:hover { background: var(--color-surface-hover, rgba(255,255,255,0.06)); }
        .filter-pill.active { background: var(--color-accent, #6366f1); border-color: var(--color-accent, #6366f1); color: #fff; }
        .filter-pill.risk-low.active   { background: var(--color-success, #22c55e); border-color: var(--color-success, #22c55e); }
        .filter-pill.risk-medium.active { background: var(--color-warning, #f59e0b); border-color: var(--color-warning, #f59e0b); }
        .filter-pill.risk-high.active  { background: var(--color-danger, #ef4444);  border-color: var(--color-danger, #ef4444); }
        .pagesize-group { display: flex; align-items: center; gap: 0.45rem; margin-left: auto; }
        .pagesize-label { font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; }
        .pagesize-select { padding: 0.35rem 0.6rem !important; width: auto !important; cursor: pointer; }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          color: var(--color-danger, #ef4444);
          font-size: 0.85rem;
          overflow: hidden;
        }
        .retry-btn {
          margin-left: auto;
          background: var(--color-danger, #ef4444);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.3rem 0.7rem;
          font-size: 0.78rem;
          cursor: pointer;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }
        .table-card { padding: 0; overflow: hidden; border-radius: 14px; }
        .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }
        .history-table thead tr {
          border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
          background: var(--color-surface-subtle, rgba(255,255,255,0.025));
        }
        .history-table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          white-space: nowrap;
          user-select: none;
        }
        .history-table th.sortable { cursor: pointer; }
        .history-table th.sortable:hover .th-inner { color: var(--color-text-primary); }
        .th-inner { display: inline-flex; align-items: center; gap: 0.3rem; transition: color 0.15s; }
        .sort-icon { opacity: 0.5; }
        .sort-icon.active { opacity: 1; color: var(--color-accent, #6366f1); }
        .sort-icon.muted  { opacity: 0.3; }
        .history-table tbody tr.data-row {
          border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.05));
          transition: background 0.15s;
        }
        .history-table tbody tr.data-row:last-child { border-bottom: none; }
        .history-table tbody tr.data-row:hover { background: var(--color-surface-hover, rgba(255,255,255,0.04)); }
        .history-table td { padding: 0.75rem 1rem; color: var(--color-text-primary); vertical-align: middle; }
        .cell-id { color: var(--color-text-muted); font-size: 0.78rem; font-variant-numeric: tabular-nums; }
        .cell-amount { font-variant-numeric: tabular-nums; font-weight: 500; }
        .cell-date { font-size: 0.8rem; color: var(--color-text-secondary); white-space: nowrap; }
        .prob-wrap { position: relative; width: 80px; }
        .prob-bar {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 3px;
          border-radius: 2px;
          opacity: 0.35;
          transition: width 0.4s ease;
        }
        .prob-bar.prob-low  { background: var(--color-success, #22c55e); }
        .prob-bar.prob-med  { background: var(--color-warning, #f59e0b); }
        .prob-bar.prob-high { background: var(--color-danger,  #ef4444); }
        .prob-label { position: relative; font-size: 0.82rem; font-variant-numeric: tabular-nums; font-weight: 500; }
        .skeleton-row td { padding: 0.85rem 1rem; }
        .skeleton-cell {
          display: inline-block;
          height: 14px;
          border-radius: 6px;
          background: var(--color-skeleton, rgba(255,255,255,0.07));
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .empty-state-cell { padding: 3.5rem 1rem !important; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center; }
        .empty-icon { color: var(--color-text-muted); opacity: 0.4; }
        .empty-title { font-weight: 600; color: var(--color-text-secondary); margin: 0; }
        .empty-sub   { font-size: 0.82rem; color: var(--color-text-muted); margin: 0; }
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.85rem 1.1rem;
          border-top: 1px solid var(--color-border, rgba(255,255,255,0.07));
          flex-wrap: wrap;
        }
        .pagination-info { font-size: 0.8rem; color: var(--color-text-muted); }
        .pagination-controls { display: flex; align-items: center; gap: 0.3rem; }
        .page-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 0.4rem;
          border-radius: 7px;
          border: 1px solid var(--color-border, rgba(255,255,255,0.1));
          background: transparent;
          color: var(--color-text-secondary);
          font-size: 0.82rem;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          font-variant-numeric: tabular-nums;
        }
        .page-btn:hover:not(:disabled):not(.active) {
          background: var(--color-surface-hover, rgba(255,255,255,0.06));
          color: var(--color-text-primary);
        }
        .page-btn.active {
          background: var(--color-accent, #6366f1);
          border-color: var(--color-accent, #6366f1);
          color: #fff;
          font-weight: 600;
        }
        .page-btn:disabled { opacity: 0.3; cursor: default; }
        .page-ellipsis { color: var(--color-text-muted); font-size: 0.85rem; padding: 0 0.2rem; line-height: 32px; }
        @media (max-width: 768px) {
          .history-page { padding: 1rem; }
          .history-toolbar { gap: 0.75rem; }
          .search-wrap { max-width: 100%; }
          .pagesize-group { margin-left: 0; }
          .history-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}