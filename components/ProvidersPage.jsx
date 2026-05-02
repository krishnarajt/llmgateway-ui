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

const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI", name: "openai", displayName: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { value: "gemini", label: "Gemini", name: "gemini", displayName: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com" },
  { value: "ollama", label: "Ollama", name: "ollama", displayName: "Ollama (Local)", baseUrl: "http://localhost:11434" },
  { value: "groq", label: "Groq", name: "groq", displayName: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  { value: "huggingface", label: "Hugging Face", name: "huggingface", displayName: "Hugging Face", baseUrl: "https://router.huggingface.co/v1" },
];

const defaultProviderForm = (providerType = "openai") => {
  const option = PROVIDER_TYPES.find((item) => item.value === providerType) || PROVIDER_TYPES[0];
  return {
    name: option.name,
    display_name: option.displayName,
    base_url: option.baseUrl,
    provider_type: option.value,
  };
};

const emptyProviderForm = { name: "", display_name: "", base_url: "", provider_type: "openai" };

const isDefaultProviderValue = (field, value) => PROVIDER_TYPES.some((option) => option[field] === value);

export default function ProvidersPage({ token, toast }) {
  const [providers, setProviders] = useState([]);
  const [keys, setKeys] = useState({});
  const [modal, setModal] = useState(null); // null | "provider"
  const [provForm, setProvForm] = useState(emptyProviderForm);

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
      setProvForm(emptyProviderForm);
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const setProviderType = (providerType) => {
    const defaults = defaultProviderForm(providerType);
    setProvForm((current) => ({
      ...current,
      provider_type: defaults.provider_type,
      name: !current.name || isDefaultProviderValue("name", current.name) ? defaults.name : current.name,
      display_name: !current.display_name || isDefaultProviderValue("displayName", current.display_name) ? defaults.display_name : current.display_name,
      base_url: !current.base_url || isDefaultProviderValue("baseUrl", current.base_url) ? defaults.base_url : current.base_url,
    }));
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
          <button className="btn btn-cyan" onClick={() => setModal("provider")}>
            <Icon name="plus" size={14} /> PROVIDER
          </button>
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
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}>
                      {k.order_index === 0 ? "primary" : `fallback ${k.order_index}`} / {k.env_var_key || k.label}
                    </span>
                    <span className={`badge ${k.source === "env_var" ? "badge-cyan" : "badge-magenta"}`} style={{ marginLeft: 8 }}>
                      {k.source}
                    </span>
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
          <input className="input" placeholder="Name (e.g. groq)" value={provForm.name} onChange={(e) => setProvForm({ ...provForm, name: e.target.value })} />
          <input className="input" placeholder="Display Name" value={provForm.display_name} onChange={(e) => setProvForm({ ...provForm, display_name: e.target.value })} />
          <input className="input" placeholder="Base URL" value={provForm.base_url} onChange={(e) => setProvForm({ ...provForm, base_url: e.target.value })} />
          <select className="input" value={provForm.provider_type} onChange={(e) => setProviderType(e.target.value)}>
            {PROVIDER_TYPES.map((providerType) => (
              <option key={providerType.value} value={providerType.value}>{providerType.label}</option>
            ))}
          </select>
          <button className="btn btn-fill-cyan" onClick={createProvider} style={{ justifyContent: "center" }}>
            CREATE
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
