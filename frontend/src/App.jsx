import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

// User pages
import ApplyForm from "./pages/user/ApplyForm";
import MyHistory from "./pages/user/MyHistory";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import EvaluatePage from "./pages/admin/EvaluatePage";
import HistoryPage from "./pages/admin/HistoryPage";

// Layout wrappers
import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
            },
          }}
        />

        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/apply" replace />} />

          {/* ── User routes (no sidebar) ── */}
          <Route element={<UserLayout />}>
            <Route path="/apply" element={<ApplyForm />} />
            <Route path="/my-history" element={<MyHistory />} />
          </Route>

          {/* ── Admin routes (with sidebar) ── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="evaluate" element={<EvaluatePage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/apply" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}