import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ScanLine, History, TrendingUp, Users } from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/evaluate",  icon: ScanLine,        label: "Evaluate"  },
  { to: "/admin/history",   icon: History,         label: "History"   },
  { to: "/admin/trends",    icon: TrendingUp,      label: "Trends"    },
  { to: "/admin/applicants",icon: Users,           label: "Applicants"},
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "var(--sidebar-w)",
        height: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        transition: "background var(--transition-theme), border-color var(--transition-theme)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1.25rem 0.75rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "var(--grad-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'Syne', sans-serif",
            flexShrink: 0,
          }}
        >
          L
        </span>
        <div>
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "0.95rem",
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            LoanLens
          </p>
          <p
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              margin: 0,
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Admin Portal
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            padding: "0.5rem 0.5rem 0.35rem",
            margin: 0,
          }}
        >
          Navigation
        </p>

        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.55rem 0.75rem",
                borderRadius: 10,
                fontSize: "0.88rem",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--accent-1)" : "var(--text-secondary)",
                background: active ? "rgba(14, 165, 233, 0.1)" : "transparent",
                border: active ? "1px solid rgba(14, 165, 233, 0.2)" : "1px solid transparent",
                transition: "all 0.18s ease",
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}

              {/* Active dot */}
              {active && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent-1)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div
        style={{
          padding: "0.85rem 1rem",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          transition: "border-color var(--transition-theme)",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--grad-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          LO
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Loan Officer
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>
            Admin
          </p>
        </div>
      </div>
    </aside>
  );
}