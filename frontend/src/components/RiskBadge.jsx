/**
 * RiskBadge
 * Displays a coloured pill for a risk tier.
 *
 * Props:
 *  tier  {string}  — "LOW" | "MEDIUM" | "HIGH"
 *  size  {string}  — "sm" | "md" (default "md")
 */

const CONFIG = {
  LOW: {
    label: "Low Risk",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.35)",
    color: "#10b981",
    dot: "#10b981",
  },
  MEDIUM: {
    label: "Medium Risk",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    color: "#f59e0b",
    dot: "#f59e0b",
  },
  HIGH: {
    label: "High Risk",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.35)",
    color: "#ef4444",
    dot: "#ef4444",
  },
};

export default function RiskBadge({ tier = "MEDIUM", size = "md" }) {
  const cfg = CONFIG[tier] ?? CONFIG.MEDIUM;

  const padding = size === "sm" ? "0.2rem 0.6rem" : "0.28rem 0.85rem";
  const fontSize = size === "sm" ? "0.7rem" : "0.78rem";
  const dotSize = size === "sm" ? 6 : 7;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding,
        borderRadius: "99px",
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {/* Pulsing dot */}
      <span style={{ position: "relative", display: "inline-flex" }}>
        <span
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: cfg.dot,
            display: "block",
          }}
        />
      </span>
      {cfg.label}
    </span>
  );
}