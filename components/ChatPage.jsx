"use client";

// ═══════════════════════════════════════════════════════════════
// CHAT PAGE — Test LLM calls via gateway API key
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import SectionHeader from "./SectionHeader";
import Icon from "./Icons";

export default function ChatPage({ toast }) {
  const [gwKey, setGwKey] = useState("");
  const [model, setModel] = useState("");
  const [system, setSystem] = useState("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);

  const send = async () => {
    if (!gwKey || !model || !message) {
      toast.show("Fill in API key, model, and message", "error");
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const data = await api("/chat", {
        method: "POST",
        body: {
          system_prompt: system || null,
          user_prompt: message,
          config: { model, thinking },
        },
        apiKey: gwKey,
      });
      setResponse(data);
    } catch (e) {
      toast.show(e.message, "error");
      setResponse({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="CHAT TERMINAL" subtitle="// test LLM calls via gateway API key" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            GATEWAY API KEY
          </label>
          <input className="input" placeholder="gw-..." value={gwKey} onChange={(e) => setGwKey(e.target.value)} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            MODEL
          </label>
          <input
            className="input"
            placeholder="gpt-4o / llama-3.3-70b-versatile / deepseek-ai/DeepSeek-R1:fastest"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className={`btn btn-sm ${thinking ? "btn-magenta" : ""}`} onClick={() => setThinking((value) => !value)}>
          <Icon name={thinking ? "toggleOn" : "toggleOff"} size={16} />
          THINKING {thinking ? "ON" : "OFF"}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          SYSTEM PROMPT (OPTIONAL)
        </label>
        <input className="input" placeholder="You are a helpful assistant..." value={system} onChange={(e) => setSystem(e.target.value)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          USER MESSAGE
        </label>
        <textarea
          className="input"
          rows={4}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>

      <button className="btn btn-fill-cyan" onClick={send} disabled={loading} style={{ marginBottom: 24 }}>
        <Icon name="send" size={14} /> {loading ? "TRANSMITTING..." : "SEND"}
      </button>

      {/* Response display */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card"
            style={{ borderColor: response.error ? "var(--red)" : "var(--green)" }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 12,
                letterSpacing: 1.5,
                marginBottom: 12,
                color: response.error ? "var(--red)" : "var(--green)",
              }}
            >
              {response.error ? "// ERROR" : `// RESPONSE — ${response.model} via ${response.provider}`}
            </div>
            <pre
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.6,
                background: "rgba(0,0,0,0.3)",
                padding: 16,
                borderRadius: 4,
              }}
            >
              {response.error || response.content}
            </pre>
            {response.thinking && !response.error && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 12,
                    letterSpacing: 1.5,
                    margin: "16px 0 12px",
                    color: "var(--magenta)",
                  }}
                >
                  // THINKING
                </div>
                <pre
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.6,
                    background: "rgba(0,0,0,0.3)",
                    padding: 16,
                    borderRadius: 4,
                  }}
                >
                  {response.thinking}
                </pre>
              </>
            )}
            {response.usage && (
              <div style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                Tokens: {JSON.stringify(response.usage)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
