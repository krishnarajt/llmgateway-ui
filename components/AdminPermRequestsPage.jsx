"use client";

// ═══════════════════════════════════════════════════════════════
// ADMIN PERMISSION REQUESTS PAGE — Review and approve/reject user requests
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Icon from "./Icons";

export default function AdminPermRequestsPage({ token, toast }) {
  const [requests, setRequests] = useState([]);

  const load = useCallback(async () => {
    try {
      setRequests(await api("/admin/permission-requests", { token }));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    try {
      await api(`/admin/permission-requests/${id}`, { method: "PUT", body: { status }, token });
      toast.show(`Request ${status}`, "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="PERMISSION REQUESTS"
        subtitle={`// ${requests.filter((r) => r.status === "pending").length} pending`}
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>User</th><th>API Key</th><th>Model</th><th>Provider</th><th>Message</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {requests.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td style={{ color: "var(--text-primary)" }}>{r.username}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.api_key_label}</td>
                <td style={{ color: "var(--cyan)" }}>{r.model_display_name}</td>
                <td><span className="badge badge-cyan">{r.provider_name}</span></td>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.request_message || "—"}
                </td>
                <td>
                  <span className={`badge ${r.status === "pending" ? "badge-yellow" : r.status === "approved" ? "badge-green" : "badge-red"}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-green" onClick={() => review(r.id, "approved")}>
                        <Icon name="check" size={12} />
                      </button>
                      <button className="btn btn-sm btn-red" onClick={() => review(r.id, "rejected")}>
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontFamily: "var(--font-mono)" }}>
                  No permission requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
