import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import PrivateRoute from "./components/PrivateRoute";

// Public
import LoginPage from "./pages/LoginPage";

// User-facing
import ApplyForm from "./pages/user/ApplyForm";
import MyHistory from "./pages/user/MyHistory";

// Admin pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ApplicantsPage from "./pages/admin/ApplicantsPage";
import TrendsPage from "./pages/admin/TrendsPage";
import HistoryPage from "./pages/admin/HistoryPage";
import EvaluatePage from "./pages/admin/EvaluatePage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public ───────────────────────────────────────── */}
              <Route path="/login" element={<LoginPage />} />

              {/* ── Any authenticated user ───────────────────────── */}
              <Route element={<PrivateRoute />}>
                <Route path="/apply" element={<ApplyForm />} />
                <Route path="/history" element={<MyHistory />} />
              </Route>

              {/* ── Admin only ───────────────────────────────────── */}
              <Route element={<PrivateRoute requiredRole="ROLE_ADMIN" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="applicants" element={<ApplicantsPage />} />
                  <Route path="trends" element={<TrendsPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="evaluate" element={<EvaluatePage />} />
                </Route>
              </Route>

              {/* ── Fallback ─────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}