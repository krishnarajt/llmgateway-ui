"use client";

// ═══════════════════════════════════════════════════════════════
// ENV VARS PAGE — Admin encrypted key-value store management
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Modal from "./Modal";
import Icon from "./Icons";

export default function EnvVarsPage({ token, toast }) {
  const [vars, setVars] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ key: "", value: "", description: "", is_secret: true });

  const load = useCallback(async () => {
    try {
      setVars(await api("/admin/env-vars", { token }));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    try {
      await api("/admin/env-vars", { method: "POST", body: form, token });
      toast.show("Variable created", "success");
      setModal(false);
      setForm({ key: "", value: "", description: "", is_secret: true });
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const remove = async (id) => {
    try {
      await api(`/admin/env-vars/${id}`, { method: "DELETE", token });
      toast.show("Variable deleted", "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="ENVIRONMENT VARIABLES"
        subtitle="// encrypted key-value store (admin only)"
        action={
          <button className="btn btn-cyan" onClick={() => setModal(true)}>
            <Icon name="plus" size={14} /> ADD VARIABLE
          </button>
        }
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Key</th><th>Value</th><th>Description</th><th>Secret</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {vars.map((v, i) => (
              <motion.tr
                key={v.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td style={{ color: "var(--cyan)" }}>{v.key}</td>
                <td style={{ color: v.is_secret ? "var(--text-muted)" : "var(--text-primary)", fontStyle: v.is_secret ? "italic" : "normal" }}>
                  {v.value}
                </td>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{v.description || "—"}</td>
                <td>
                  {v.is_secret ? <span className="badge badge-magenta">SECRET</span> : <span className="badge badge-cyan">VISIBLE</span>}
                </td>
                <td>
                  <button className="btn btn-sm btn-red" onClick={() => remove(v.id)}>
                    <Icon name="trash" size={12} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="ADD VARIABLE">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="input" placeholder="KEY_NAME" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <input className="input" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <input className="input" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_secret} onChange={(e) => setForm({ ...form, is_secret: e.target.checked })} />
            Mark as secret (value will be masked in responses)
          </label>
          <button className="btn btn-fill-cyan" onClick={create} style={{ justifyContent: "center" }}>
            ENCRYPT & STORE
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
