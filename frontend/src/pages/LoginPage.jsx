import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Invalid credentials");
      }

      const data = await res.json();
      login(data.token, { username: data.username, roles: data.roles });

      if (data.roles?.includes("ROLE_ADMIN")) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/apply", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const t = dark ? theme.dark : theme.light;

  return (
    <div style={{ ...styles.page, background: t.pageBg, transition: "background 0.3s" }}>

      {/* Toggle button */}
      <button
        onClick={() => setDark((d) => !d)}
        style={{ ...styles.toggleBtn, background: t.toggleBg, color: t.toggleColor }}
        title="Toggle dark mode"
      >
        {dark ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div style={{ ...styles.card, background: t.cardBg, boxShadow: t.shadow }}>

        {/* Logo / Title */}
        <div style={styles.logoRow}>
          <span style={{ ...styles.logoIcon, background: t.accent }}>L</span>
          <h1 style={{ ...styles.title, color: t.text }}>LoanLens</h1>
        </div>
        <p style={{ ...styles.subtitle, color: t.subtext }}>Sign in to continue</p>

        {error && (
          <div style={{ ...styles.errorBox, background: t.errorBg, borderColor: t.errorBorder, color: t.errorText }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={{ ...styles.label, color: t.label }}>
            Username
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Enter username"
              style={{
                ...styles.input,
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
          </label>

          <label style={{ ...styles.label, color: t.label }}>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter password"
              style={{
                ...styles.input,
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              background: loading ? t.buttonDisabled : t.accent,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ ...styles.footer, color: t.subtext }}>
          LoanLens © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ── Themes ────────────────────────────────────────────────────────────────────
const theme = {
  light: {
    pageBg:         "#f0f4ff",
    cardBg:         "#ffffff",
    text:           "#1a1a2e",
    subtext:        "#6b7280",
    label:          "#374151",
    inputBg:        "#f9fafb",
    inputBorder:    "#d1d5db",
    accent:         "#4f46e5",
    buttonDisabled: "#a5b4fc",
    shadow:         "0 4px 24px rgba(0,0,0,0.10)",
    toggleBg:       "#e0e7ff",
    toggleColor:    "#4f46e5",
    errorBg:        "#fef2f2",
    errorBorder:    "#fca5a5",
    errorText:      "#b91c1c",
  },
  dark: {
    pageBg:         "#0f172a",
    cardBg:         "#1e293b",
    text:           "#f1f5f9",
    subtext:        "#94a3b8",
    label:          "#cbd5e1",
    inputBg:        "#0f172a",
    inputBorder:    "#334155",
    accent:         "#6366f1",
    buttonDisabled: "#4338ca",
    shadow:         "0 4px 24px rgba(0,0,0,0.40)",
    toggleBg:       "#334155",
    toggleColor:    "#f1f5f9",
    errorBg:        "#450a0a",
    errorBorder:    "#991b1b",
    errorText:      "#fca5a5",
  },
};

// ── Base styles (theme-independent) ──────────────────────────────────────────
const styles = {
  page: {
    minHeight:      "100vh",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "'Inter', sans-serif",
    position:       "relative",
  },
  toggleBtn: {
    position:     "absolute",
    top:          20,
    right:        24,
    padding:      "0.4rem 1rem",
    borderRadius: 20,
    border:       "none",
    fontWeight:   600,
    fontSize:     "0.85rem",
    cursor:       "pointer",
    transition:   "background 0.3s, color 0.3s",
  },
  card: {
    borderRadius: 16,
    padding:      "2.5rem 2rem",
    width:        "100%",
    maxWidth:     400,
    transition:   "background 0.3s, box-shadow 0.3s",
  },
  logoRow: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            10,
    marginBottom:   4,
  },
  logoIcon: {
    width:          36,
    height:         36,
    borderRadius:   10,
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    color:          "#fff",
    fontWeight:     800,
    fontSize:       "1.1rem",
  },
  title: {
    margin:     0,
    fontSize:   "1.75rem",
    fontWeight: 700,
  },
  subtitle: {
    marginTop:    4,
    marginBottom: 24,
    textAlign:    "center",
    fontSize:     "0.95rem",
  },
  errorBox: {
    borderRadius: 8,
    border:       "1px solid",
    padding:      "0.6rem 1rem",
    marginBottom: 16,
    fontSize:     "0.875rem",
  },
  form: {
    display:       "flex",
    flexDirection: "column",
    gap:           16,
  },
  label: {
    display:       "flex",
    flexDirection: "column",
    gap:           6,
    fontSize:      "0.875rem",
    fontWeight:    600,
  },
  input: {
    padding:      "0.6rem 0.85rem",
    borderRadius: 8,
    fontSize:     "0.95rem",
    outline:      "none",
    transition:   "border 0.2s, background 0.3s",
  },
  button: {
    marginTop:    8,
    padding:      "0.75rem",
    borderRadius: 8,
    border:       "none",
    color:        "#fff",
    fontWeight:   700,
    fontSize:     "1rem",
    transition:   "background 0.2s",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize:  "0.75rem",
  },
};