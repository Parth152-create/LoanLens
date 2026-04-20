import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar — fixed left */}
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}