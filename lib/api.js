// ═══════════════════════════════════════════════════════════════
// API HELPER — Centralized fetch wrapper for LLM Gateway backend
// ═══════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://llmgateway.krishnarajthadesar.in/api";

/**
 * Generic API call helper with auth token and API key support.
 * @param {string} path - API endpoint path (e.g. "/auth/login")
 * @param {object} options - { method, body, token, apiKey }
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function api(path, { method = "GET", body, token, apiKey } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}
