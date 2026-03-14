"use client";

// ═══════════════════════════════════════════════════════════════
// MODELS PAGE — Admin/User LLM model registry
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Modal from "./Modal";
import Icon from "./Icons";

export default function ModelsPage({ token, role, toast }) {
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ provider_id: "", model_id: "", display_name: "", max_context_tokens: "" });

  const load = useCallback(async () => {
    try {
      const m = role === "admin" ? await api("/admin/models", { token }) : await api("/user/models", { token });
      setModels(m);
      if (role === "admin") setProviders(await api("/admin/providers", { token }));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token, role]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    try {
      const body = {
        ...form,
        provider_id: parseInt(form.provider_id),
        max_context_tokens: form.max_context_tokens ? parseInt(form.max_context_tokens) : null,
      };
      await api("/admin/models", { method: "POST", body, token });
      toast.show("Model registered", "success");
      setModal(false);
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const remove = async (id) => {
    try {
      await api(`/admin/models/${id}`, { method: "DELETE", token });
      toast.show("Model deleted", "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="LLM MODELS"
        subtitle={`// ${models.length} registered`}
        action={
          role === "admin" && (
            <button className="btn btn-cyan" onClick={() => setModal(true)}>
              <Icon name="plus" size={14} /> REGISTER MODEL
            </button>
          )
        }
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Model ID</th>
              <th>Display Name</th>
              <th>Provider</th>
              <th>Context</th>
              <th>Status</th>
              {role === "admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <motion.tr
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td style={{ color: "var(--text-muted)" }}>#{m.id}</td>
                <td style={{ color: "var(--cyan)" }}>{m.model_id}</td>
                <td>{m.display_name}</td>
                <td><span className="badge badge-cyan">{m.provider_name}</span></td>
                <td style={{ color: "var(--text-secondary)" }}>{m.max_context_tokens?.toLocaleString() || "—"}</td>
                <td>
                  {m.is_active ? <span className="badge badge-green">ACTIVE</span> : <span className="badge badge-red">DISABLED</span>}
                </td>
                {role === "admin" && (
                  <td>
                    <button className="btn btn-sm btn-red" onClick={() => remove(m.id)}>
                      <Icon name="trash" size={12} />
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="REGISTER MODEL">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <select className="input" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })}>
            <option value="">Select Provider</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
          <input className="input" placeholder="Model ID (e.g. gpt-4o)" value={form.model_id} onChange={(e) => setForm({ ...form, model_id: e.target.value })} />
          <input className="input" placeholder="Display Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          <input className="input" placeholder="Max Context Tokens (optional)" type="number" value={form.max_context_tokens} onChange={(e) => setForm({ ...form, max_context_tokens: e.target.value })} />
          <button className="btn btn-fill-cyan" onClick={create} style={{ justifyContent: "center" }}>
            REGISTER
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
