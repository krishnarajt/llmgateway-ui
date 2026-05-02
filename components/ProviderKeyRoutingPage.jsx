"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Icon from "./Icons";

const providerDraft = (keys) => {
  const envKeyRows = (keys || [])
    .filter((key) => key.source === "env_var" && key.env_var_id)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  return {
    primary_env_var_id: envKeyRows[0]?.env_var_id ? String(envKeyRows[0].env_var_id) : "",
    fallback_env_var_ids: envKeyRows.slice(1).map((key) => String(key.env_var_id)),
  };
};

const envLabel = (envVar) => {
  if (!envVar) return "Unknown env key";
  return envVar.description ? `${envVar.key} - ${envVar.description}` : envVar.key;
};

export default function ProviderKeyRoutingPage({ token, toast }) {
  const [providers, setProviders] = useState([]);
  const [envVars, setEnvVars] = useState([]);
  const [keysByProvider, setKeysByProvider] = useState({});
  const [drafts, setDrafts] = useState({});
  const [savingProviderId, setSavingProviderId] = useState("");

  const load = useCallback(async () => {
    try {
      const [providerData, envVarData] = await Promise.all([
        api("/admin/providers", { token }),
        api("/admin/env-vars", { token }),
      ]);
      const keyMap = {};
      for (const provider of providerData) {
        keyMap[provider.id] = await api(`/admin/provider-api-keys/${provider.id}`, { token });
      }
      setProviders(providerData);
      setEnvVars(envVarData);
      setKeysByProvider(keyMap);
      setDrafts(Object.fromEntries(providerData.map((provider) => [
        provider.id,
        providerDraft(keyMap[provider.id]),
      ])));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const envById = useMemo(
    () => Object.fromEntries(envVars.map((envVar) => [String(envVar.id), envVar])),
    [envVars]
  );

  const stats = useMemo(() => {
    const allKeys = Object.values(keysByProvider).flat();
    return {
      providers: providers.length,
      envVars: envVars.length,
      dbKeys: allKeys.filter((key) => key.source === "env_var").length,
      legacyKeys: allKeys.filter((key) => key.source === "direct").length,
    };
  }, [providers, envVars, keysByProvider]);

  const updateDraft = (providerId, updater) => {
    setDrafts((current) => {
      const draft = current[providerId] || { primary_env_var_id: "", fallback_env_var_ids: [] };
      return { ...current, [providerId]: updater(draft) };
    });
  };

  const saveProvider = async (providerId) => {
    const draft = drafts[providerId] || { primary_env_var_id: "", fallback_env_var_ids: [] };
    const envVarIds = [
      draft.primary_env_var_id,
      ...draft.fallback_env_var_ids,
    ].filter(Boolean).map((id) => parseInt(id));

    setSavingProviderId(String(providerId));
    try {
      const saved = await api(`/admin/providers/${providerId}/api-key-routing`, {
        method: "PUT",
        body: { env_var_ids: envVarIds },
        token,
      });
      setKeysByProvider((current) => ({ ...current, [providerId]: saved }));
      setDrafts((current) => ({ ...current, [providerId]: providerDraft(saved) }));
      toast.show("Provider key route saved", "success");
    } catch (e) {
      toast.show(e.message, "error");
    } finally {
      setSavingProviderId("");
    }
  };

  const draftIsDirty = (providerId) => {
    const saved = providerDraft(keysByProvider[providerId] || []);
    const draft = drafts[providerId] || { primary_env_var_id: "", fallback_env_var_ids: [] };
    return JSON.stringify(saved) !== JSON.stringify(draft);
  };

  const fallbackOptions = (draft) => {
    const usedIds = new Set([draft.primary_env_var_id, ...draft.fallback_env_var_ids].filter(Boolean));
    return envVars.filter((envVar) => !usedIds.has(String(envVar.id)));
  };

  const moveFallback = (providerId, index, direction) => {
    updateDraft(providerId, (draft) => {
      const next = [...draft.fallback_env_var_ids];
      const target = index + direction;
      if (target < 0 || target >= next.length) return draft;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...draft, fallback_env_var_ids: next };
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="PROVIDER KEYS" subtitle="// db env vars drive provider key fallback order" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          ["PROVIDERS", stats.providers],
          ["ENV KEYS", stats.envVars],
          ["DB ROUTES", stats.dbKeys],
          ["LEGACY DIRECT", stats.legacyKeys],
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

      {envVars.length === 0 && (
        <div className="card" style={{ marginBottom: 16, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          No database environment variables exist yet. Add API key values in ENV VARS first.
        </div>
      )}

      {providers.map((provider, index) => {
        const providerId = provider.id;
        const keys = keysByProvider[providerId] || [];
        const draft = drafts[providerId] || { primary_env_var_id: "", fallback_env_var_ids: [] };
        const dirty = draftIsDirty(providerId);
        const legacyKeys = keys.filter((key) => key.source === "direct");
        const configuredCount = (draft.primary_env_var_id ? 1 : 0) + draft.fallback_env_var_ids.length;
        const options = fallbackOptions(draft);

        return (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
            style={{ marginBottom: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Icon name="server" size={16} className="text-[#00f0ff]" />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text-primary)", letterSpacing: 1 }}>
                    {provider.display_name}
                  </span>
                  <span className="badge badge-cyan">{provider.provider_type}</span>
                  <span className={`badge ${provider.is_active ? "badge-green" : "badge-red"}`}>
                    {provider.is_active ? "active" : "disabled"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-yellow">{configuredCount} db keys</span>
                  {legacyKeys.length > 0 && <span className="badge badge-magenta">{legacyKeys.length} legacy direct</span>}
                  {dirty && <span className="badge badge-cyan">unsaved</span>}
                </div>
              </div>
              <button
                className="btn btn-sm btn-cyan"
                disabled={!dirty || savingProviderId === String(providerId)}
                onClick={() => saveProvider(providerId)}
              >
                <Icon name="save" size={13} />
                {savingProviderId === String(providerId) ? "SAVING" : "SAVE"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  PRIMARY API KEY
                </label>
                <select
                  className="input"
                  value={draft.primary_env_var_id}
                  onChange={(e) => updateDraft(providerId, (current) => ({
                    primary_env_var_id: e.target.value,
                    fallback_env_var_ids: current.fallback_env_var_ids.filter((id) => id !== e.target.value),
                  }))}
                >
                  <option value="">No DB key configured</option>
                  {envVars.map((envVar) => (
                    <option key={envVar.id} value={envVar.id}>{envLabel(envVar)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  ADD FALLBACK API KEY
                </label>
                <select
                  className="input"
                  value=""
                  disabled={!draft.primary_env_var_id || options.length === 0}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    updateDraft(providerId, (current) => ({
                      ...current,
                      fallback_env_var_ids: [...current.fallback_env_var_ids, e.target.value],
                    }));
                  }}
                >
                  <option value="">Select fallback env key</option>
                  {options.map((envVar) => (
                    <option key={envVar.id} value={envVar.id}>{envLabel(envVar)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", minHeight: 34 }}>
              {draft.primary_env_var_id && (
                <span className="badge badge-green">
                  1. {envById[draft.primary_env_var_id]?.key || "unknown"} / primary
                </span>
              )}
              {draft.fallback_env_var_ids.map((envVarId, fallbackIndex) => (
                <span
                  key={`${providerId}:${envVarId}`}
                  className="badge badge-cyan"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingRight: 6 }}
                >
                  {fallbackIndex + 2}. {envById[envVarId]?.key || "unknown"}
                  <button className="btn btn-sm" onClick={() => moveFallback(providerId, fallbackIndex, -1)} disabled={fallbackIndex === 0} style={{ padding: "2px 5px" }}>
                    <Icon name="up" size={10} />
                  </button>
                  <button className="btn btn-sm" onClick={() => moveFallback(providerId, fallbackIndex, 1)} disabled={fallbackIndex === draft.fallback_env_var_ids.length - 1} style={{ padding: "2px 5px" }}>
                    <Icon name="down" size={10} />
                  </button>
                  <button
                    className="btn btn-sm btn-red"
                    onClick={() => updateDraft(providerId, (current) => ({
                      ...current,
                      fallback_env_var_ids: current.fallback_env_var_ids.filter((id) => id !== envVarId),
                    }))}
                    style={{ padding: "2px 5px" }}
                  >
                    <Icon name="x" size={10} />
                  </button>
                </span>
              ))}
              {!draft.primary_env_var_id && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                  Container env fallback only if no DB key route is saved.
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
