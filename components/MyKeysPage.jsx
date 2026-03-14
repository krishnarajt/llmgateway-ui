"use client";

// ═══════════════════════════════════════════════════════════════
// MY API KEYS PAGE — User gateway key generation and management
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Modal from "./Modal";
import Icon from "./Icons";

export default function MyKeysPage({ token, toast }) {
  const [keys, setKeys] = useState([]);
  const [modal, setModal] = useState(false);
  const [label, setLabel] = useState("default");
  const [newKey, setNewKey] = useState(null);

  const load = useCallback(async () => {
    try {
      setKeys(await api("/user/api-keys", { token }));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    try {
      const data = await api("/user/api-keys", { method: "POST", body: { label }, token });
      setNewKey(data.key);
      toast.show("API key created — copy it now!", "success");
      setModal(false);
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const revoke = async (id) => {
    try {
      await api(`/user/api-keys/${id}`, { method: "DELETE", token });
      toast.show("Key revoked", "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey);
    toast.show("Copied to clipboard", "success");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="MY API KEYS"
        subtitle={`// ${keys.length} keys`}
        action={
          <button className="btn btn-cyan" onClick={() => setModal(true)}>
            <Icon name="plus" size={14} /> GENERATE KEY
          </button>
        }
      />

      {/* Newly generated key banner */}
      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card glow-box-magenta"
            style={{ marginBottom: 20, borderColor: "var(--magenta)" }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "var(--magenta)", letterSpacing: 1.5, marginBottom: 8 }}>
              ⚠ NEW KEY — SAVE THIS NOW
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <code
                style={{
                  flex: 1,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text-primary)",
                  background: "rgba(0,0,0,0.4)",
                  padding: "8px 12px",
                  borderRadius: 4,
                  overflowX: "auto",
                }}
              >
                {newKey}
              </code>
              <button className="btn btn-sm btn-magenta" onClick={copyKey}>
                <Icon name="copy" size={12} /> COPY
              </button>
              <button className="btn btn-sm btn-red" onClick={() => setNewKey(null)}>
                <Icon name="x" size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key list */}
      {keys.map((k, i) => (
        <motion.div
          key={k.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="card"
          style={{ marginBottom: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--text-primary)", letterSpacing: 1 }}>
                {k.label}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginLeft: 12 }}>
                {k.key_prefix}
              </span>
              <span className={`badge ${k.is_active ? "badge-green" : "badge-red"}`} style={{ marginLeft: 10 }}>
                {k.is_active ? "active" : "disabled"}
              </span>
            </div>
            <button className="btn btn-sm btn-red" onClick={() => revoke(k.id)}>
              <Icon name="trash" size={12} /> REVOKE
            </button>
          </div>
          {k.permissions?.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {k.permissions.map((p) => (
                <span key={p.id} className="badge badge-cyan">{p.model_display_name || `model#${p.model_id}`}</span>
              ))}
            </div>
          )}
          {(!k.permissions || k.permissions.length === 0) && (
            <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
              No model permissions — request access from admin
            </div>
          )}
        </motion.div>
      ))}

      <Modal open={modal} onClose={() => setModal(false)} title="GENERATE API KEY">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="input" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button className="btn btn-fill-cyan" onClick={create} style={{ justifyContent: "center" }}>
            GENERATE
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
