import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      // Expected response: { token: "...", username: "...", roles: ["ROLE_ADMIN"] }
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>LoanLens</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
              style={styles.input}
              placeholder="Enter username"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              style={styles.input}
              placeholder="Enter password"
            />
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4ff",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  },
  title: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#1a1a2e",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    color: "#6b7280",
    textAlign: "center",
    fontSize: "0.95rem",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    borderRadius: 8,
    padding: "0.6rem 1rem",
    marginBottom: 16,
    fontSize: "0.875rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    padding: "0.6rem 0.85rem",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border 0.2s",
  },
  button: {
    marginTop: 8,
    padding: "0.75rem",
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};