"use client";

// ═══════════════════════════════════════════════════════════════
// SETTINGS PAGE — Account configuration & password management
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";

export default function SettingsPage({ token, toast }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });

  const change = async () => {
    if (form.new_password !== form.confirm) {
      toast.show("Passwords don't match", "error");
      return;
    }
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { current_password: form.current_password, new_password: form.new_password },
        token,
      });
      toast.show("Password changed", "success");
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="SETTINGS" subtitle="// account configuration" />

      <div className="card" style={{ maxWidth: 450 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--cyan-dim)", letterSpacing: 1.5, marginBottom: 20 }}>
          {"// CHANGE PASSWORD"}
        </div>
        <div className="shimmer-line" style={{ marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            className="input"
            type="password"
            placeholder="Current Password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="New Password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm New Password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
          <button className="btn btn-fill-cyan" onClick={change} style={{ justifyContent: "center" }}>
            UPDATE PASSWORD
          </button>
        </div>
      </div>
    </motion.div>
  );
}
