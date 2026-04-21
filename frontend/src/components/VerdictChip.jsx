/**
 * VerdictChip
 * Soft, user-friendly verdict — no jargon.
 *
 * Props:
 *  probability  {number}  — 0 to 1  (from ML model)
 *
 * Thresholds (tweak to match your model's calibration):
 *  < 0.35  → Eligible
 *  < 0.65  → Under Review
 *  ≥ 0.65  → Not Recommended
 */

const getVerdict = (p) => {
  if (p < 0.35) return {
    label: "Eligible",
    emoji: "✦",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.4)",
    color: "#10b981",
  };
  if (p < 0.65) return {
    label: "Under Review",
    emoji: "◎",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.4)",
    color: "#f59e0b",
  };
  return {
    label: "Not Recommended",
    emoji: "✕",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.4)",
    color: "#ef4444",
  };
};

export default function VerdictChip({ probability = 0.5 }) {
  const v = getVerdict(probability);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.45rem 1.1rem",
        borderRadius: "99px",
        fontSize: "0.95rem",
        fontWeight: 700,
        background: v.bg,
        border: `1.5px solid ${v.border}`,
        color: v.color,
        letterSpacing: "0.02em",
      }}
    >
      <span style={{ fontSize: "0.8rem" }}>{v.emoji}</span>
      {v.label}
    </span>
  );
}