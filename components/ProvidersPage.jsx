"use client";

// ═══════════════════════════════════════════════════════════════
// PROVIDERS PAGE — Admin LLM provider management
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Modal from "./Modal";
import Icon from "./Icons";

export default function ProvidersPage({ token, toast }) {
  const [providers, setProviders] = useState([]);
  const [keys, setKeys] = useState({});
  const [modal, setModal] = useState(null); // null | "provider" | "key"
  const [provForm, setProvForm] = useState({ name: "", display_name: "", base_url: "", provider_type: "openai" });
  const [keyForm, setKeyForm] = useState({ provider_id: "", label: "default", api_key: "" });

  const load = useCallback(async () => {
    try {
      const provs = await api("/admin/providers", { token });
      setProviders(provs);
      const keyMap = {};
      for (const p of provs) {
        keyMap[p.id] = await api(`/admin/provider-api-keys/${p.id}`, { token });
      }
      setKeys(keyMap);
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createProvider = async () => {
    try {
      await api("/admin/providers", { method: "POST", body: provForm, token });
      toast.show("Provider created", "success");
      setModal(null);
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const addKey = async () => {
    try {
      await api("/admin/provider-api-keys", { method: "POST", body: keyForm, token });
      toast.show("API key added", "success");
      setModal(null);
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const deleteKey = async (id) => {
    try {
      await api(`/admin/provider-api-keys/${id}`, { method: "DELETE", token });
      toast.show("Key deleted", "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const deleteProvider = async (id) => {
    try {
      await api(`/admin/providers/${id}`, { method: "DELETE", token });
      toast.show("Provider deleted", "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="PROVIDERS"
        subtitle={`// ${providers.length} configured`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-cyan" onClick={() => setModal("provider")}>
              <Icon name="plus" size={14} /> PROVIDER
            </button>
            <button
              className="btn btn-magenta"
              onClick={() => {
                setKeyForm({ provider_id: providers[0]?.id || "", label: "default", api_key: "" });
                setModal("key");
              }}
            >
              <Icon name="key" size={14} /> ADD KEY
            </button>
          </div>
        }
      />

      {providers.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="card"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text-primary)", letterSpacing: 1 }}>
                {p.display_name}
              </span>
              <span className="badge badge-cyan">{p.provider_type}</span>
              {p.is_active ? <span className="badge badge-green">ACTIVE</span> : <span className="badge badge-red">DISABLED</span>}
            </div>
            <button className="btn btn-sm btn-red" onClick={() => deleteProvider(p.id)}>
              <Icon name="trash" size={12} />
            </button>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            {p.base_url}
          </div>

          {(keys[p.id] || []).length > 0 && (
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: 12 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 8 }}>
                API KEYS
              </div>
              {(keys[p.id] || []).map((k) => (
                <div
                  key={k.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}>{k.label}</span>
                    <span className={`badge ${k.is_active ? "badge-green" : "badge-red"}`} style={{ marginLeft: 8 }}>
                      {k.is_active ? "active" : "disabled"}
                    </span>
                  </div>
                  <button className="btn btn-sm btn-red" onClick={() => deleteKey(k.id)} style={{ padding: "3px 8px" }}>
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Add Provider Modal */}
      <Modal open={modal === "provider"} onClose={() => setModal(null)} title="ADD PROVIDER">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="input" placeholder="Name (e.g. openai)" value={provForm.name} onChange={(e) => setProvForm({ ...provForm, name: e.target.value })} />
          <input className="input" placeholder="Display Name" value={provForm.display_name} onChange={(e) => setProvForm({ ...provForm, display_name: e.target.value })} />
          <input className="input" placeholder="Base URL" value={provForm.base_url} onChange={(e) => setProvForm({ ...provForm, base_url: e.target.value })} />
          <select className="input" value={provForm.provider_type} onChange={(e) => setProvForm({ ...provForm, provider_type: e.target.value })}>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="ollama">Ollama</option>
          </select>
          <button className="btn btn-fill-cyan" onClick={createProvider} style={{ justifyContent: "center" }}>
            CREATE
          </button>
        </div>
      </Modal>

      {/* Add Key Modal */}
      <Modal open={modal === "key"} onClose={() => setModal(null)} title="ADD PROVIDER API KEY">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <select className="input" value={keyForm.provider_id} onChange={(e) => setKeyForm({ ...keyForm, provider_id: parseInt(e.target.value) })}>
            <option value="">Select Provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
          <input className="input" placeholder="Label" value={keyForm.label} onChange={(e) => setKeyForm({ ...keyForm, label: e.target.value })} />
          <input className="input" placeholder="API Key (will be encrypted)" value={keyForm.api_key} onChange={(e) => setKeyForm({ ...keyForm, api_key: e.target.value })} />
          <button className="btn btn-fill-cyan" onClick={addKey} style={{ justifyContent: "center" }}>
            ENCRYPT & STORE
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
