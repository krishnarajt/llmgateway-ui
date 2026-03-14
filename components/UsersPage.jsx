"use client";

// ═══════════════════════════════════════════════════════════════
// USERS PAGE — Admin user management with CRUD operations
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Modal from "./Modal";
import Icon from "./Icons";

export default function UsersPage({ token, toast }) {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "user", display_name: "" });

  const load = useCallback(async () => {
    try {
      setUsers(await api("/admin/users", { token }));
    } catch (e) {
      toast.show(e.message, "error");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    try {
      await api("/admin/users", { method: "POST", body: form, token });
      toast.show("User created", "success");
      setModal(false);
      setForm({ username: "", password: "", role: "user", display_name: "" });
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const remove = async (id) => {
    try {
      await api(`/admin/users/${id}`, { method: "DELETE", token });
      toast.show("User deleted", "success");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="USER MANAGEMENT"
        subtitle={`// ${users.length} registered users`}
        action={
          <button className="btn btn-cyan" onClick={() => setModal(true)}>
            <Icon name="plus" size={14} /> NEW USER
          </button>
        }
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Display Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td style={{ color: "var(--text-muted)" }}>#{u.id}</td>
                <td style={{ color: "var(--text-primary)" }}>{u.username}</td>
                <td>
                  <span className={`badge ${u.role === "admin" ? "badge-magenta" : "badge-cyan"}`}>{u.role}</span>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{u.display_name || "—"}</td>
                <td>
                  {u.is_default_admin ? (
                    <span className="badge badge-yellow">DEFAULT</span>
                  ) : (
                    <span className="badge badge-green">ACTIVE</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-sm btn-red" onClick={() => remove(u.id)}>
                    <Icon name="trash" size={12} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="CREATE USER">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="input" placeholder="Display Name (optional)" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn btn-fill-cyan" onClick={create} style={{ justifyContent: "center", marginTop: 8 }}>
            CREATE
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
