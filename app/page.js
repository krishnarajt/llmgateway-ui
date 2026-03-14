"use client";

// ═══════════════════════════════════════════════════════════════
// MAIN APP PAGE — LLM Gateway UI
// Client-side SPA with authentication, role-based routing,
// and cyberpunk-themed dashboard layout.
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import DashboardPage from "@/components/DashboardPage";
import UsersPage from "@/components/UsersPage";
import ProvidersPage from "@/components/ProvidersPage";
import ModelsPage from "@/components/ModelsPage";
import EnvVarsPage from "@/components/EnvVarsPage";
import AdminPermRequestsPage from "@/components/AdminPermRequestsPage";
import MyKeysPage from "@/components/MyKeysPage";
import MyRequestsPage from "@/components/MyRequestsPage";
import ChatPage from "@/components/ChatPage";
import SettingsPage from "@/components/SettingsPage";

export default function Home() {
  const [auth, setAuth] = useState(null); // { accessToken, refreshToken, role, ... }
  const [page, setPage] = useState("dashboard");
  const { show, ToastEl } = useToast();

  // ═══════════════════════════════════════════════════════════════
  // AUTH HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const handleLogin = (data) => {
    setAuth(data);
    setPage("dashboard");
    if (data.message && data.message !== "Login successful") {
      show(data.message, "info");
    }
  };

  const handleLogout = () => {
    if (auth?.refreshToken) {
      api("/auth/logout", { method: "POST", body: { refreshToken: auth.refreshToken } }).catch(() => {});
    }
    setAuth(null);
    setPage("dashboard");
  };

  // ═══════════════════════════════════════════════════════════════
  // UNAUTHENTICATED — Show login
  // ═══════════════════════════════════════════════════════════════
  if (!auth) {
    return (
      <>
        <LoginPage onLogin={handleLogin} toast={{ show }} />
        {ToastEl}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTHENTICATED — Dashboard layout
  // ═══════════════════════════════════════════════════════════════
  const token = auth.accessToken;
  const role = auth.role || "user";
  const toastObj = { show };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage role={role} loginMessage={auth.message} />;
      case "users":
        return role === "admin" ? <UsersPage token={token} toast={toastObj} /> : null;
      case "providers":
        return role === "admin" ? <ProvidersPage token={token} toast={toastObj} /> : null;
      case "models":
        return <ModelsPage token={token} role={role} toast={toastObj} />;
      case "env-vars":
        return role === "admin" ? <EnvVarsPage token={token} toast={toastObj} /> : null;
      case "perm-requests":
        return role === "admin" ? <AdminPermRequestsPage token={token} toast={toastObj} /> : null;
      case "my-keys":
        return <MyKeysPage token={token} toast={toastObj} />;
      case "my-requests":
        return <MyRequestsPage token={token} toast={toastObj} />;
      case "chat":
        return <ChatPage toast={toastObj} />;
      case "settings":
        return <SettingsPage token={token} toast={toastObj} />;
      default:
        return <DashboardPage role={role} loginMessage={auth.message} />;
    }
  };

  return (
    <>
      {/* Background effects */}
      <div className="grid-bg" />
      <div className="scanline-overlay" />

      {/* Sidebar navigation */}
      <Sidebar
        role={role}
        activePage={page}
        setPage={setPage}
        onLogout={handleLogout}
        username={auth.username || "operator"}
      />

      {/* Main content area */}
      <main
        className="main-content"
        style={{
          marginLeft: 220,
          minHeight: "100vh",
          padding: "32px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast notifications */}
      {ToastEl}
    </>
  );
}
