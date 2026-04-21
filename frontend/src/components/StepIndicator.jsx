/**
 * StepIndicator
 * Shows progress through the 3-step apply wizard.
 *
 * Props:
 *  currentStep  {number}  — 1 | 2 | 3
 *  steps        {Array}   — [{ label: string }]
 */

const STEPS = [
  { label: "Personal Info" },
  { label: "Financial Info" },
  { label: "Your Result" },
];

export default function StepIndicator({ currentStep = 1, steps = STEPS }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        width: "100%",
        marginBottom: "2rem",
      }}
    >
      {steps.map((step, i) => {
        const num = i + 1;
        const isDone = num < currentStep;
        const isActive = num === currentStep;

        const circleColor = isDone
          ? "#10b981"
          : isActive
          ? "var(--accent-1)"
          : "var(--text-muted)";

        const circleBg = isDone
          ? "rgba(16, 185, 129, 0.15)"
          : isActive
          ? "rgba(14, 165, 233, 0.15)"
          : "transparent";

        return (
          <div key={num} style={{ display: "flex", alignItems: "center" }}>
            {/* Step node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `2px solid ${circleColor}`,
                  background: circleBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  <span style={{ color: "#10b981", fontSize: "1rem", fontWeight: 800 }}>✓</span>
                ) : (
                  <span
                    style={{
                      color: circleColor,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {num}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                  transition: "color 0.3s ease",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 2,
                  marginBottom: "1.2rem",
                  background: isDone
                    ? "rgba(16, 185, 129, 0.5)"
                    : "var(--border)",
                  transition: "background 0.3s ease",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}