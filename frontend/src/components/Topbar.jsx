import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Wifi, WifiOff } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { checkMlHealth } from "../services/loanService";

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const [mlStatus, setMlStatus] = useState("checking"); // "online" | "offline" | "checking"

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
    // Re-check every 30 seconds
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, []);

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
        borderBottom: "1px solid var(--border)",
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
      {/* ML Status badge */}
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
          background: s.bg,
          border: `1px solid ${s.border}`,
          color: s.color,
        }}
      >
        {/* Pulsing dot for online */}
        {mlStatus === "online" ? (
          <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: s.color,
                opacity: 0.5,
                animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: s.color,
                display: "block",
              }}
            />
          </span>
        ) : (
          <s.Icon size={13} />
        )}
        {s.label}
      </motion.div>

      {/* Theme toggle */}
      <motion.button
        onClick={toggleTheme}
        whileTap={{ scale: 0.88, rotate: theme === "dark" ? 20 : -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{
          width: 34,
          height: 34,
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
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </motion.button>

      {/* Ping animation keyframe — injected once */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </header>
  );
}