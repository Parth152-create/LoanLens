import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/apply", label: "Apply" },
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
        {/* Logo */}
        <Link
          to="/apply"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--grad-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 800,
              color: "#fff",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            L
          </span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.05rem",
              color: "var(--text-primary)",
              transition: "color var(--transition-theme)",
            }}
          >
            LoanLens
          </span>
        </Link>

        {/* Nav links + theme toggle */}
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
          <div
            style={{
              width: 1,
              height: 20,
              background: "var(--border)",
              margin: "0 0.5rem",
            }}
          />

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