import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Wifi, WifiOff, User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { checkMlHealth } from "../services/loanService";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
  const { theme, toggleTheme }  = useTheme();
  const { user, logout }        = useAuth();
  const navigate                = useNavigate();
  const [mlStatus, setMlStatus] = useState("checking");

  useEffect(() => {
    const ping = async () => {
      try {
        await checkMlHealth();
        setMlStatus("online");
      } catch {
        setMlStatus("offline");
      }
    };
    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Avatar initials from username
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "LO";

  const statusConfig = {
    online:   { label: "ML service online",  color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)",  Icon: Wifi    },
    offline:  { label: "ML service offline", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   Icon: WifiOff },
    checking: { label: "Checking...",         color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  Icon: Wifi    },
  };

  const s = statusConfig[mlStatus];

  return (
    <header
      style={{
        height: 56,
        borderBottom: "1px solid var(--ll-border)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 1.5rem",
        gap: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
        transition: "background var(--transition-theme), border-color var(--transition-theme)",
      }}
    >
      {/* ── ML Status badge ── */}
      <motion.div
        key={mlStatus}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.3rem 0.85rem",
          borderRadius: 99,
          fontSize: "0.75rem",
          fontWeight: 600,
          fontFamily: "Arial, sans-serif",
          background: s.bg,
          border: `1px solid ${s.border}`,
          color: s.color,
        }}
      >
        {mlStatus === "online" ? (
          <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: s.color, opacity: 0.5, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "block" }} />
          </span>
        ) : (
          <s.Icon size={13} />
        )}
        {s.label}
      </motion.div>

      {/* ── Theme toggle ── */}
      <motion.button
        onClick={toggleTheme}
        whileTap={{ scale: 0.88, rotate: theme === "dark" ? 20 : -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "1px solid var(--ll-border)",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </motion.button>

      {/* ── User Avatar + Dropdown ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: 8,
              outline: "none",
            }}
          >
            <Avatar style={{ width: 34, height: 34, border: "1px solid var(--ll-border-strong)" }}>
              <AvatarFallback
                style={{
                  background: "var(--grad-accent)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "Arial, sans-serif", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.username ?? "Admin"}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--ll-border-strong)",
            borderRadius: 12,
            minWidth: 180,
            boxShadow: "var(--shadow-card)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <DropdownMenuLabel style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            {user?.username ?? "Admin"}
          </DropdownMenuLabel>

          <DropdownMenuSeparator style={{ background: "var(--ll-border)" }} />

          <DropdownMenuItem
            style={{ color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer", gap: "0.6rem" }}
            className="hover:bg-white/5"
          >
            <User size={14} />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            style={{ color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer", gap: "0.6rem" }}
            className="hover:bg-white/5"
          >
            <Settings size={14} />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator style={{ background: "var(--ll-border)" }} />

          <DropdownMenuItem
            onClick={handleLogout}
            style={{ color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", gap: "0.6rem" }}
            className="hover:bg-red-500/10"
          >
            <LogOut size={14} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </header>
  );
}