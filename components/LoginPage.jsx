"use client";

// ═══════════════════════════════════════════════════════════════
// LOGIN PAGE — Cyberpunk authentication screen
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function LoginPage({ onLogin, toast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: { username, password } });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div className="grid-bg" />
      <div className="scanline-overlay" />

      {/* Floating ambient orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "15%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,46,170,0.05) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float 6s ease-in-out infinite reverse",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: "100%", maxWidth: 420, padding: 20, position: "relative", zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: 8,
              background: "linear-gradient(135deg, var(--cyan), var(--magenta))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}
          >
            LLM GATEWAY
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-secondary)",
              letterSpacing: 3,
            }}
          >
            UNIFIED AI ACCESS CONTROL
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 60 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
              height: 2,
              background: "linear-gradient(90deg, var(--cyan), var(--magenta))",
              margin: "16px auto 0",
            }}
          />
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="card glow-box-cyan"
          style={{ padding: 32 }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              letterSpacing: 2,
              color: "var(--cyan-dim)",
              marginBottom: 24,
            }}
          >
            {"// AUTHENTICATION REQUIRED"}
          </div>

          <div onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  display: "block",
                  letterSpacing: 1,
                }}
              >
                USERNAME
              </label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="enter_username"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  display: "block",
                  letterSpacing: 1,
                }}
              >
                PASSWORD
              </label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  background: "rgba(255,68,102,0.1)",
                  border: "1px solid var(--red)",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--red)",
                }}
              >
                {error}
              </motion.div>
            )}

            <button
              className="btn btn-fill-cyan"
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              style={{
                width: "100%",
                justifyContent: "center",
                height: 44,
                fontSize: 14,
                letterSpacing: 2,
              }}
            >
              {loading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{
            textAlign: "center",
            marginTop: 20,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          Default credentials: admin / admin
        </motion.div>
      </motion.div>
    </div>
  );
}
