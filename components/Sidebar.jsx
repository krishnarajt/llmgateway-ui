"use client";

// ═══════════════════════════════════════════════════════════════
// SIDEBAR — Role-aware navigation with cyberpunk styling
// ═══════════════════════════════════════════════════════════════
import { motion } from "framer-motion";
import Icon from "./Icons";

export default function Sidebar({ role, activePage, setPage, onLogout, username }) {
  // Admin navigation items
  const adminItems = [
    { id: "dashboard", label: "OVERVIEW", icon: "dashboard" },
    { id: "users", label: "USERS", icon: "users" },
    { id: "providers", label: "PROVIDERS", icon: "server" },
    { id: "models", label: "MODELS", icon: "model" },
    { id: "env-vars", label: "ENV VARS", icon: "lock" },
    { id: "perm-requests", label: "REQUESTS", icon: "shield" },
  ];

  // User navigation items
  const userItems = [
    { id: "dashboard", label: "OVERVIEW", icon: "dashboard" },
    { id: "my-keys", label: "API KEYS", icon: "key" },
    { id: "my-requests", label: "REQUESTS", icon: "shield" },
    { id: "models", label: "MODELS", icon: "model" },
  ];

  // Common items for all roles
  const commonItems = [
    { id: "chat", label: "CHAT TEST", icon: "chat" },
    { id: "settings", label: "SETTINGS", icon: "settings" },
  ];

  const items = role === "admin" ? [...adminItems, ...commonItems] : [...userItems, ...commonItems];

  return (
    <motion.div
      initial={{ x: -220 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="sidebar-container"
      style={{
        width: 220,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
        background: "rgba(6, 8, 15, 0.97)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 4,
            background: "linear-gradient(135deg, var(--cyan), var(--magenta))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          LLM GATEWAY
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          v1.0.0
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}>{username}</div>
        <span className={`badge ${role === "admin" ? "badge-magenta" : "badge-cyan"}`} style={{ marginTop: 6 }}>
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {items.map((item, i) => {
          const isActive = activePage === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setPage(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                border: "none",
                cursor: "pointer",
                background: isActive ? "rgba(0,240,255,0.08)" : "transparent",
                borderLeft: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                color: isActive ? "var(--cyan)" : "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontSize: 11,
                letterSpacing: 1.5,
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              whileHover={{
                background: "rgba(0,240,255,0.05)",
                x: 4,
              }}
            >
              <Icon name={item.icon} size={16} className={isActive ? "text-[#00f0ff]" : ""} />
              <span className="sidebar-label">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <button
          className="btn btn-red btn-sm"
          onClick={onLogout}
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Icon name="logout" size={14} /> DISCONNECT
        </button>
      </div>
    </motion.div>
  );
}
