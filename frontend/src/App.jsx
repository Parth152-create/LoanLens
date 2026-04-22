import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Public
import LoginPage from "./pages/LoginPage";

// User-facing (authenticated, any role)
import ApplyPage from "./pages/ApplyPage";
import ResultPage from "./pages/ResultPage";

// Admin pages (require ROLE_ADMIN)
import AdminLayout from "./layouts/AdminLayout";       // your existing admin shell/nav
import DashboardPage from "./pages/DashboardPage";
import ApplicantsPage from "./pages/ApplicantsPage";
import TrendsPage from "./pages/TrendsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ───────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Any authenticated user ───────────────────────── */}
          <Route element={<PrivateRoute />}>
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/result/:id" element={<ResultPage />} />
          </Route>

          {/* ── Admin only ───────────────────────────────────── */}
          <Route element={<PrivateRoute requiredRole="ROLE_ADMIN" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="applicants" element={<ApplicantsPage />} />
              <Route path="trends" element={<TrendsPage />} />
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}