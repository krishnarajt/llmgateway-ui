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

const rateLimitKey = (providerApiKeyId, modelId) => `${providerApiKeyId}:${modelId}`;

const rateLimitDraftFromRow = (row) => ({
  rpm_limit: row?.rpm_limit ? String(row.rpm_limit) : "",
  rph_limit: row?.rph_limit ? String(row.rph_limit) : "",
  rpd_limit: row?.rpd_limit ? String(row.rpd_limit) : "",
});

const normalizeLimitValue = (value) => {
  const parsed = parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const envLabel = (envVar) => {
  if (!envVar) return "Unknown env key";
  return envVar.description ? `${envVar.key} - ${envVar.description}` : envVar.key;
};

const sourceKeyLabel = (key) => key.env_var_key || key.label || `source-key-${key.id}`;

export default function ProviderKeyRoutingPage({ token, toast }) {
  const [providers, setProviders] = useState([]);
  const [envVars, setEnvVars] = useState([]);
  const [models, setModels] = useState([]);
  const [keysByProvider, setKeysByProvider] = useState({});
  const [rateLimits, setRateLimits] = useState({});
  const [drafts, setDrafts] = useState({});
  const [rateLimitDrafts, setRateLimitDrafts] = useState({});
  const [savingProviderId, setSavingProviderId] = useState("");
  const [savingRateLimitKey, setSavingRateLimitKey] = useState("");

  const load = useCallback(async () => {
    try {
      const [providerData, envVarData, modelData, rateLimitData] = await Promise.all([
        api("/admin/providers", { token }),
        api("/admin/env-vars", { token }),
        api("/admin/models", { token }),
        api("/admin/provider-key-model-rate-limits", { token }),
      ]);
      const keyEntries = await Promise.all(providerData.map(async (provider) => [
        provider.id,
        await api(`/admin/provider-api-keys/${provider.id}`, { token }),
      ]));
      const keyMap = Object.fromEntries(keyEntries);
      const rateLimitMap = Object.fromEntries(
        rateLimitData.map((row) => [rateLimitKey(row.provider_api_key_id, row.model_id), row])
      );
      setProviders(providerData);
      setEnvVars(envVarData);
      setModels(modelData);
      setKeysByProvider(keyMap);
      setRateLimits(rateLimitMap);
      setDrafts(Object.fromEntries(providerData.map((provider) => [
        provider.id,
        providerDraft(keyMap[provider.id]),
      ])));
      setRateLimitDrafts(Object.fromEntries(
        rateLimitData.map((row) => [
          rateLimitKey(row.provider_api_key_id, row.model_id),
          rateLimitDraftFromRow(row),
        ])
      ));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const envById = useMemo(
    () => Object.fromEntries(envVars.map((envVar) => [String(envVar.id), envVar])),
    [envVars]
  );

  const modelsByProvider = useMemo(() => {
    return models.reduce((acc, model) => {
      const providerModels = acc[model.provider_id] || [];
      providerModels.push(model);
      return { ...acc, [model.provider_id]: providerModels };
    }, {});
  }, [models]);

  const stats = useMemo(() => {
    const allKeys = Object.values(keysByProvider).flat();
    const limitRows = Object.values(rateLimits);
    return {
      providers: providers.length,
      envVars: envVars.length,
      dbKeys: allKeys.filter((key) => key.source === "env_var").length,
      legacyKeys: allKeys.filter((key) => key.source === "direct").length,
      limitedRoutes: limitRows.filter((row) => row.rpm_limit || row.rph_limit || row.rpd_limit).length,
    };
  }, [providers, envVars, keysByProvider, rateLimits]);

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
      const rateLimitData = await api("/admin/provider-key-model-rate-limits", { token });
      setRateLimits(Object.fromEntries(
        rateLimitData.map((row) => [rateLimitKey(row.provider_api_key_id, row.model_id), row])
      ));
      setRateLimitDrafts(Object.fromEntries(
        rateLimitData.map((row) => [
          rateLimitKey(row.provider_api_key_id, row.model_id),
          rateLimitDraftFromRow(row),
        ])
      ));
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

  const getRateLimitDraft = (providerApiKeyId, modelId) => {
    const key = rateLimitKey(providerApiKeyId, modelId);
    return rateLimitDrafts[key] || rateLimitDraftFromRow(rateLimits[key]);
  };

  const updateRateLimitDraft = (providerApiKeyId, modelId, field, value) => {
    const key = rateLimitKey(providerApiKeyId, modelId);
    setRateLimitDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] || rateLimitDraftFromRow(rateLimits[key])),
        [field]: value,
      },
    }));
  };

  const rateLimitIsDirty = (providerApiKeyId, modelId) => {
    const key = rateLimitKey(providerApiKeyId, modelId);
    const saved = rateLimitDraftFromRow(rateLimits[key]);
    const draft = getRateLimitDraft(providerApiKeyId, modelId);
    return JSON.stringify(saved) !== JSON.stringify(draft);
  };

  const saveRateLimit = async (providerApiKeyId, modelId) => {
    const key = rateLimitKey(providerApiKeyId, modelId);
    const draft = getRateLimitDraft(providerApiKeyId, modelId);
    setSavingRateLimitKey(key);
    try {
      const saved = await api(`/admin/provider-api-keys/${providerApiKeyId}/models/${modelId}/rate-limit`, {
        method: "PUT",
        body: {
          rpm_limit: normalizeLimitValue(draft.rpm_limit),
          rph_limit: normalizeLimitValue(draft.rph_limit),
          rpd_limit: normalizeLimitValue(draft.rpd_limit),
        },
        token,
      });
      setRateLimits((current) => ({ ...current, [key]: saved }));
      setRateLimitDrafts((current) => ({ ...current, [key]: rateLimitDraftFromRow(saved) }));
      toast.show("Rate limit saved", "success");
    } catch (e) {
      toast.show(e.message, "error");
    } finally {
      setSavingRateLimitKey("");
    }
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
          ["LIMITED", stats.limitedRoutes],
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
        const providerModels = modelsByProvider[providerId] || [];

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

            {keys.length > 0 && providerModels.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Icon name="model" size={14} className="text-[#00f0ff]" />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "var(--text-primary)", letterSpacing: 1 }}>
                    MODEL RATE LIMITS
                  </span>
                  <span className="badge badge-yellow">95% exhaustion</span>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {keys.map((sourceKey) => (
                    <div
                      key={`rate-limits-${sourceKey.id}`}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 12,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "var(--cyan)", letterSpacing: 1 }}>
                          {sourceKeyLabel(sourceKey)}
                        </span>
                        <span className={sourceKey.order_index === 0 ? "badge badge-green" : "badge badge-cyan"}>
                          {sourceKey.order_index === 0 ? "primary" : `fallback ${sourceKey.order_index}`}
                        </span>
                        <span className={`badge ${sourceKey.is_active ? "badge-green" : "badge-red"}`}>
                          {sourceKey.is_active ? "active" : "disabled"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                        {providerModels.map((model) => {
                          const pairKey = rateLimitKey(sourceKey.id, model.id);
                          const draftLimit = getRateLimitDraft(sourceKey.id, model.id);
                          const savedLimit = rateLimits[pairKey];
                          const dirtyLimit = rateLimitIsDirty(sourceKey.id, model.id);
                          const counts = savedLimit
                            ? `${savedLimit.rpm_count}/${savedLimit.rph_count}/${savedLimit.rpd_count}`
                            : "0/0/0";
                          const lastCalled = savedLimit?.last_called_at
                            ? new Date(savedLimit.last_called_at).toLocaleString()
                            : "never";

                          return (
                            <div
                              key={`${sourceKey.id}:${model.id}`}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
                                gap: 8,
                                alignItems: "center",
                                paddingTop: 8,
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--text-primary)", letterSpacing: 1 }}>
                                  {model.display_name}
                                </div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {model.model_id}
                                </div>
                              </div>

                              <input
                                className="input"
                                type="number"
                                min="1"
                                placeholder="RPM"
                                value={draftLimit.rpm_limit}
                                onChange={(e) => updateRateLimitDraft(sourceKey.id, model.id, "rpm_limit", e.target.value)}
                              />
                              <input
                                className="input"
                                type="number"
                                min="1"
                                placeholder="RPH"
                                value={draftLimit.rph_limit}
                                onChange={(e) => updateRateLimitDraft(sourceKey.id, model.id, "rph_limit", e.target.value)}
                              />
                              <input
                                className="input"
                                type="number"
                                min="1"
                                placeholder="RPD"
                                value={draftLimit.rpd_limit}
                                onChange={(e) => updateRateLimitDraft(sourceKey.id, model.id, "rpd_limit", e.target.value)}
                              />

                              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
                                <div>COUNT {counts}</div>
                                <div>{lastCalled}</div>
                              </div>

                              <button
                                className="btn btn-sm btn-cyan"
                                disabled={!dirtyLimit || savingRateLimitKey === pairKey}
                                onClick={() => saveRateLimit(sourceKey.id, model.id)}
                                style={{ justifyContent: "center" }}
                              >
                                <Icon name="save" size={12} />
                                {savingRateLimitKey === pairKey ? "SAVING" : "SAVE"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {keys.length > 0 && providerModels.length === 0 && (
              <div style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                No models registered for this provider.
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
