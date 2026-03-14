"use client";

// ═══════════════════════════════════════════════════════════════
// MY REQUESTS PAGE — User permission request submission & tracking
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Modal from "./Modal";
import Icon from "./Icons";

export default function MyRequestsPage({ token, toast }) {
  const [requests, setRequests] = useState([]);
  const [keys, setKeys] = useState([]);
  const [models, setModels] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ api_key_id: "", model_id: "", request_message: "" });

  const load = useCallback(async () => {
    try {
      setRequests(await api("/user/permission-requests", { token }));
      setKeys(await api("/user/api-keys", { token }));
      setModels(await api("/user/models", { token }));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    try {
      await api("/user/permission-requests", {
        method: "POST",
        body: { ...form, api_key_id: parseInt(form.api_key_id), model_id: parseInt(form.model_id) },
        token,
      });
      toast.show("Request submitted", "success");
      setModal(false);
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="MY REQUESTS"
        subtitle={`// ${requests.length} total`}
        action={
          <button className="btn btn-cyan" onClick={() => setModal(true)}>
            <Icon name="plus" size={14} /> REQUEST ACCESS
          </button>
        }
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Model</th><th>API Key</th><th>Message</th><th>Status</th><th>Admin Note</th></tr>
          </thead>
          <tbody>
            {requests.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td style={{ color: "var(--cyan)" }}>{r.model_display_name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.api_key_label}</td>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{r.request_message || "—"}</td>
                <td>
                  <span className={`badge ${r.status === "pending" ? "badge-yellow" : r.status === "approved" ? "badge-green" : "badge-red"}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{r.admin_message || "—"}</td>
              </motion.tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontFamily: "var(--font-mono)" }}>
                  No requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="REQUEST MODEL ACCESS">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <select className="input" value={form.api_key_id} onChange={(e) => setForm({ ...form, api_key_id: e.target.value })}>
            <option value="">Select API Key</option>
            {keys.map((k) => <option key={k.id} value={k.id}>{k.label} ({k.key_prefix})</option>)}
          </select>
          <select className="input" value={form.model_id} onChange={(e) => setForm({ ...form, model_id: e.target.value })}>
            <option value="">Select Model</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.display_name} ({m.provider_name})</option>)}
          </select>
          <textarea
            className="input"
            placeholder="Why do you need access? (optional)"
            rows={3}
            value={form.request_message}
            onChange={(e) => setForm({ ...form, request_message: e.target.value })}
            style={{ resize: "vertical" }}
          />
          <button className="btn btn-fill-cyan" onClick={create} style={{ justifyContent: "center" }}>
            SUBMIT REQUEST
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
