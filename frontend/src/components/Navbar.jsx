import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function LoanLensIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer lens circle */}
      <circle cx="16" cy="16" r="15" stroke="url(#grad)" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Inner lens shape — two intersecting arcs */}
      <path
        d="M10 16 C10 11.5 13 8.5 16 8 C19 8.5 22 11.5 22 16 C22 20.5 19 23.5 16 24 C13 23.5 10 20.5 10 16Z"
        fill="url(#grad)"
        opacity="0.15"
      />
      <path
        d="M10 16 C10 11.5 13 8.5 16 8 C19 8.5 22 11.5 22 16 C22 20.5 19 23.5 16 24 C13 23.5 10 20.5 10 16Z"
        stroke="url(#grad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Trend line through lens */}
      <polyline
        points="11,19 14,15 17,17 21,12"
        stroke="url(#grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Centre dot */}
      <circle cx="16" cy="16" r="1.5" fill="url(#grad)" />
      <defs>
        <linearGradient id="grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/apply",      label: "Apply"      },
    { to: "/my-history", label: "My History" },
  ];

  return (
    <nav
      style={{
        width: "100%",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "background var(--transition-theme), border-color var(--transition-theme)",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/apply"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.55rem" }}
        >
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <LoanLensIcon />
          </motion.div>

          {/* Wordmark */}
          <span style={{ display: "flex", alignItems: "baseline", gap: "0px" }}>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.1rem",
                background: "linear-gradient(135deg, #2DD4BF 0%, #6366F1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.01em",
              }}
            >
              Loan
            </span>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                transition: "color var(--transition-theme)",
              }}
            >
              Lens
            </span>
          </span>
        </Link>

        {/* ── Nav links + theme toggle ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  textDecoration: "none",
                  padding: "0.4rem 0.9rem",
                  borderRadius: 8,
                  fontSize: "0.88rem",
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--accent-1)" : "var(--text-secondary)",
                  background: active ? "var(--border)" : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 0.5rem" }} />

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.88, rotate: theme === "dark" ? 20 : -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
        </div>
      </div>
    </nav>
  );
}