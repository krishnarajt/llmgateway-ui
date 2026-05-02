"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Icon from "./Icons";

const routeKey = (rule) => `${rule.api_key_id}:${rule.primary_model_id}`;

const modelLabel = (model) => {
  if (!model) return "Unknown model";
  const provider = model.provider_name ? ` / ${model.provider_name}` : "";
  return `${model.display_name || model.model_id}${provider}`;
};

export default function MultiplexingPage({ token, toast }) {
  const [keys, setKeys] = useState([]);
  const [rules, setRules] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState("");

  const load = useCallback(async () => {
    try {
      const [keyData, ruleData, modelData] = await Promise.all([
        api("/user/api-keys", { token }),
        api("/user/multiplexing", { token }),
        api("/user/models", { token }),
      ]);
      setKeys(keyData);
      setRules(ruleData);
      setModels(modelData);
      setDrafts(
        Object.fromEntries(
          ruleData.map((rule) => [
            routeKey(rule),
            {
              enabled: rule.enabled,
              fallback_model_ids: rule.fallback_model_ids || [],
            },
          ])
        )
      );
      setSelectedKeyId((current) => current || (keyData.length > 0 ? String(keyData[0].id) : ""));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const modelsById = useMemo(
    () => Object.fromEntries(models.map((model) => [model.id, model])),
    [models]
  );

  const selectedKey = keys.find((key) => String(key.id) === String(selectedKeyId));
  const rulesForKey = rules.filter((rule) => String(rule.api_key_id) === String(selectedKeyId));
  const accessibleModels = (selectedKey?.permissions || [])
    .filter((permission) => permission.is_active)
    .map((permission) => modelsById[permission.model_id] || {
      id: permission.model_id,
      model_id: permission.model_identifier,
      display_name: permission.model_display_name,
      provider_name: permission.provider_name,
    });

  const stats = {
    keys: keys.length,
    routes: rules.length,
    activeRoutes: rules.filter((rule) => rule.enabled && rule.fallback_model_ids?.length > 0).length,
    fallbacks: rules.reduce((total, rule) => total + (rule.fallback_model_ids?.length || 0), 0),
  };

  const updateDraft = (rule, updater) => {
    const key = routeKey(rule);
    setDrafts((current) => {
      const draft = current[key] || { enabled: true, fallback_model_ids: [] };
      return { ...current, [key]: updater(draft) };
    });
  };

  const fallbackOptions = (rule, draft) => accessibleModels.filter(
    (model) => model.id !== rule.primary_model_id && !draft.fallback_model_ids.includes(model.id)
  );

  const isDirty = (rule, draft) => {
    const original = {
      enabled: rule.enabled,
      fallback_model_ids: rule.fallback_model_ids || [],
    };
    return JSON.stringify(original) !== JSON.stringify(draft);
  };

  const saveRule = async (rule) => {
    const key = routeKey(rule);
    const draft = drafts[key] || { enabled: true, fallback_model_ids: [] };
    setSavingKey(key);
    try {
      const saved = await api(`/user/api-keys/${rule.api_key_id}/multiplexing/${rule.primary_model_id}`, {
        method: "PUT",
        body: draft,
        token,
      });
      setRules((current) => current.map((item) => routeKey(item) === key ? saved : item));
      setDrafts((current) => ({
        ...current,
        [key]: { enabled: saved.enabled, fallback_model_ids: saved.fallback_model_ids || [] },
      }));
      toast.show("Multiplex route saved", "success");
    } catch (e) {
      toast.show(e.message, "error");
    } finally {
      setSavingKey("");
    }
  };

  const moveFallback = (rule, index, direction) => {
    updateDraft(rule, (draft) => {
      const next = [...draft.fallback_model_ids];
      const target = index + direction;
      if (target < 0 || target >= next.length) return draft;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...draft, fallback_model_ids: next };
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="MODEL MULTIPLEXING" subtitle={`// ${stats.activeRoutes} active fallback routes`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          ["API KEYS", stats.keys],
          ["MODEL ROUTES", stats.routes],
          ["ACTIVE CHAINS", stats.activeRoutes],
          ["FALLBACK STEPS", stats.fallbacks],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: 1 }}>
              {label}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--cyan)", marginTop: 4 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, alignItems: "center" }}>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              API KEY
            </label>
            <select className="input" value={selectedKeyId} onChange={(e) => setSelectedKeyId(e.target.value)}>
              {keys.map((key) => (
                <option key={key.id} value={key.id}>{key.label} ({key.key_prefix})</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className={`badge ${selectedKey?.is_active ? "badge-green" : "badge-red"}`}>
              {selectedKey?.is_active ? "key active" : "key disabled"}
            </span>
            <span className="badge badge-cyan">{accessibleModels.length} accessible models</span>
            <span className="badge badge-magenta">provider keys first</span>
            <span className="badge badge-yellow">fallback order preserved</span>
          </div>
        </div>
      </div>

      {rulesForKey.map((rule, index) => {
        const key = routeKey(rule);
        const draft = drafts[key] || { enabled: true, fallback_model_ids: [] };
        const selectedFallbacks = draft.fallback_model_ids.map((id) => modelsById[id]).filter(Boolean);
        const options = fallbackOptions(rule, draft);
        const dirty = isDirty(rule, draft);

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="card"
            style={{ marginBottom: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Icon name="route" size={16} className="text-[#00f0ff]" />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--text-primary)", letterSpacing: 1 }}>
                    {rule.primary_model_display_name}
                  </span>
                  <span className="badge badge-cyan">{rule.primary_provider_name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                    {rule.primary_model_identifier}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className={`badge ${draft.enabled ? "badge-green" : "badge-red"}`}>
                    {draft.enabled ? "multiplex enabled" : "multiplex disabled"}
                  </span>
                  <span className="badge badge-yellow">{draft.fallback_model_ids.length} fallbacks</span>
                  {dirty && <span className="badge badge-magenta">unsaved</span>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`btn btn-sm ${draft.enabled ? "btn-green" : "btn-red"}`}
                  onClick={() => updateDraft(rule, (current) => ({ ...current, enabled: !current.enabled }))}
                >
                  <Icon name={draft.enabled ? "toggleOn" : "toggleOff"} size={14} />
                  {draft.enabled ? "ON" : "OFF"}
                </button>
                <button
                  className="btn btn-sm btn-cyan"
                  disabled={!dirty || savingKey === key}
                  onClick={() => saveRule(rule)}
                >
                  <Icon name="save" size={13} />
                  {savingKey === key ? "SAVING" : "SAVE"}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "start" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minHeight: 34 }}>
                {selectedFallbacks.map((model, fallbackIndex) => (
                  <span
                    key={`${key}:${model.id}`}
                    className="badge badge-cyan"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingRight: 6 }}
                  >
                    {fallbackIndex + 1}. {modelLabel(model)}
                    <button className="btn btn-sm" onClick={() => moveFallback(rule, fallbackIndex, -1)} disabled={fallbackIndex === 0} style={{ padding: "2px 5px" }}>
                      <Icon name="up" size={10} />
                    </button>
                    <button className="btn btn-sm" onClick={() => moveFallback(rule, fallbackIndex, 1)} disabled={fallbackIndex === selectedFallbacks.length - 1} style={{ padding: "2px 5px" }}>
                      <Icon name="down" size={10} />
                    </button>
                    <button
                      className="btn btn-sm btn-red"
                      onClick={() => updateDraft(rule, (current) => ({
                        ...current,
                        fallback_model_ids: current.fallback_model_ids.filter((id) => id !== model.id),
                      }))}
                      style={{ padding: "2px 5px" }}
                    >
                      <Icon name="x" size={10} />
                    </button>
                  </span>
                ))}
                {selectedFallbacks.length === 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                    Primary model only
                  </span>
                )}
              </div>

              <select
                className="input"
                value=""
                disabled={options.length === 0}
                onChange={(e) => {
                  const modelId = parseInt(e.target.value);
                  if (!modelId) return;
                  updateDraft(rule, (current) => ({
                    ...current,
                    fallback_model_ids: [...current.fallback_model_ids, modelId],
                  }));
                }}
              >
                <option value="">Add fallback</option>
                {options.map((model) => (
                  <option key={model.id} value={model.id}>{modelLabel(model)}</option>
                ))}
              </select>
            </div>
          </motion.div>
        );
      })}

      {keys.length === 0 && (
        <div className="card" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          No API keys available.
        </div>
      )}
      {keys.length > 0 && rulesForKey.length === 0 && (
        <div className="card" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          No active model permissions on this API key.
        </div>
      )}
    </motion.div>
  );
}
