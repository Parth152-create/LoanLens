/**
 * FactorTag
 * Displays a single SHAP factor with its impact type.
 *
 * Props:
 *  type   {string}  — "hurts" | "caution" | "helps"
 *  label  {string}  — plain English description
 *                     e.g. "High credit card utilization (75%)"
 */

const CONFIG = {
  hurts: {
    icon: "↑",
    word: "Hurts",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    iconBg: "rgba(239, 68, 68, 0.15)",
  },
  caution: {
    icon: "~",
    word: "Caution",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    iconBg: "rgba(245, 158, 11, 0.15)",
  },
  helps: {
    icon: "↓",
    word: "Helps",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    iconBg: "rgba(16, 185, 129, 0.15)",
  },
};

export default function FactorTag({ type = "caution", label = "" }) {
  const cfg = CONFIG[type] ?? CONFIG.caution;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.5rem 0.85rem",
        borderRadius: "10px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Icon pill */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: "6px",
          background: cfg.iconBg,
          color: cfg.color,
          fontSize: "0.85rem",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </span>

      {/* Text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.05rem" }}>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: cfg.color,
          }}
        >
          {cfg.word}
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}