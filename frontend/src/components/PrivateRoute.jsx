import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route to require authentication.
 * Optionally pass `requiredRole="ROLE_ADMIN"` to also enforce role.
 *
 * Usage:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/apply" element={<ApplyPage />} />
 *   </Route>
 *
 *   <Route element={<PrivateRoute requiredRole="ROLE_ADMIN" />}>
 *     <Route path="/admin/*" element={<AdminLayout />} />
 *   </Route>
 */
import { Outlet } from "react-router-dom";

export default function PrivateRoute({ requiredRole }) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // Authenticated but wrong role — send back to apply page
    return <Navigate to="/apply" replace />;
  }

  return <Outlet />;
}