"use client";

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PAGE — System overview with animated stat cards
// ═══════════════════════════════════════════════════════════════
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

export default function DashboardPage({ role, loginMessage }) {
  const stats = [
    { label: "STATUS", value: "ONLINE", color: "var(--green)" },
    { label: "ROLE", value: role.toUpperCase(), color: role === "admin" ? "var(--magenta)" : "var(--cyan)" },
    { label: "SYSTEM", value: "NOMINAL", color: "var(--cyan)" },
    { label: "UPLINK", value: "ACTIVE", color: "var(--green)" },
  ];

  // Stagger animation config
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="SYSTEM OVERVIEW" subtitle="// real-time gateway status" />

      {/* System notice banner */}
      {loginMessage && loginMessage !== "Login successful" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card glow-box-magenta"
          style={{ marginBottom: 24, borderColor: "var(--magenta)" }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              color: "var(--magenta)",
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            ⚠ SYSTEM NOTICE
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}
          >
            {loginMessage}
          </p>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((s, i) => (
          <motion.div key={i} variants={item} className="card" style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                color: s.color,
                letterSpacing: 2,
              }}
            >
              {s.value}
            </div>
            {/* Animated underline */}
            <div
              style={{
                width: 40,
                height: 2,
                background: s.color,
                margin: "12px auto 0",
                opacity: 0.3,
                borderRadius: 1,
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick start card */}
      <motion.div variants={item} initial="hidden" animate="show" className="card" style={{ padding: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            color: "var(--cyan-dim)",
            letterSpacing: 1.5,
            marginBottom: 16,
          }}
        >
          {"// QUICK START"}
        </div>
        <div className="shimmer-line" style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 2 }}>
          {role === "admin" ? (
            <>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Add provider API keys under <span style={{ color: "var(--cyan)" }}>PROVIDERS</span></div>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Register models under <span style={{ color: "var(--cyan)" }}>MODELS</span></div>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Create users under <span style={{ color: "var(--cyan)" }}>USERS</span></div>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Review permission requests under <span style={{ color: "var(--cyan)" }}>REQUESTS</span></div>
            </>
          ) : (
            <>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Generate API keys under <span style={{ color: "var(--cyan)" }}>API KEYS</span></div>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Request model access under <span style={{ color: "var(--cyan)" }}>REQUESTS</span></div>
              <div><span style={{ color: "var(--cyan)" }}>→</span> Test LLM calls under <span style={{ color: "var(--cyan)" }}>CHAT TEST</span></div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
