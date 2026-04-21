import RiskBadge from "./RiskBadge";
import VerdictChip from "./VerdictChip";

/**
 * MiniHistory
 * Compact list of past loan applications shown at the bottom of the result page.
 *
 * Props:
 *  applications  {Array}  — array of LoanApplicationResponse objects
 *  loading       {boolean}
 */
export default function MiniHistory({ applications = [], loading = false }) {
  if (loading) {
    return (
      <div style={{ padding: "1rem 0" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 52,
              borderRadius: 10,
              background: "var(--border)",
              marginBottom: "0.6rem",
              opacity: 0.5,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (!applications.length) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>
        No previous applications found.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {applications.slice(0, 5).map((app) => (
        <div
          key={app.id}
          className="ll-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
          }}
        >
          {/* Left: ID + date */}
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Application #{app.id}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
              {app.createdAt
                ? new Date(app.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })
                : "—"}
            </p>
          </div>

          {/* Right: verdict + probability */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {app.probability != null
                ? Math.round(app.probability * 100) + "%"
                : "—"}
            </span>
            <VerdictChip probability={app.probability ?? 0.5} />
          </div>
        </div>
      ))}
    </div>
  );
}