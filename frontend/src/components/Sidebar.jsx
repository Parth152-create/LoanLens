import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ScanLine, History, TrendingUp, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { to: "/admin/dashboard",  icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/admin/evaluate",   icon: ScanLine,        label: "Evaluate"   },
  { to: "/admin/history",    icon: History,         label: "History"    },
  { to: "/admin/trends",     icon: TrendingUp,      label: "Trends"     },
  { to: "/admin/applicants", icon: Users,           label: "Applicants" },
];

export default function Sidebar() {
  const { pathname }    = useLocation();
  const { user, logout } = useAuth();
  const navigate        = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "LO";

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "var(--sidebar-w)",
        height: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--ll-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        transition: "background var(--transition-theme), border-color var(--transition-theme)",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding: "1.25rem 1.25rem 0.75rem",
          borderBottom: "1px solid var(--ll-border)",
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
            fontFamily: "'Times New Roman', serif",
            flexShrink: 0,
          }}
        >
          L
        </span>
        <div>
          <p
            style={{
              fontFamily: "'Times New Roman', serif",
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
              fontFamily: "Arial, sans-serif",
            }}
          >
            Admin Portal
          </p>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            padding: "0.5rem 0.5rem 0.35rem",
            margin: 0,
            fontFamily: "Arial, sans-serif",
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
                fontFamily: "Arial, sans-serif",
                color: active ? "var(--accent-1)" : "var(--text-secondary)",
                background: active ? "rgba(14, 165, 233, 0.1)" : "transparent",
                border: active ? "1px solid rgba(14, 165, 233, 0.2)" : "1px solid transparent",
                transition: "all 0.18s ease",
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
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

      {/* ── User profile + logout ── */}
      <div
        style={{
          padding: "0.85rem 1rem",
          borderTop: "1px solid var(--ll-border)",
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
            fontFamily: "Arial, sans-serif",
          }}
        >
          {initials}
        </div>

        {/* Username */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {user?.username ?? "Admin"}
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, fontFamily: "Arial, sans-serif" }}>
            Admin
          </p>
        </div>

        {/* Logout button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.35rem",
                borderRadius: 8,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s, background 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "none";
              }}
            >
              <LogOut size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", color: "var(--text-primary)", fontSize: "0.78rem" }}>
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}