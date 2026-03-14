"use client";

// ═══════════════════════════════════════════════════════════════
// MODAL — Animated overlay modal with glassmorphism
// ═══════════════════════════════════════════════════════════════
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icons";

export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  color: "var(--cyan)",
                  letterSpacing: 2,
                }}
              >
                {title}
              </h3>
              <button className="btn btn-sm btn-red" onClick={onClose} style={{ padding: "4px 8px" }}>
                <Icon name="x" size={14} />
              </button>
            </div>

            {/* Shimmer divider */}
            <div className="shimmer-line" style={{ marginBottom: 20 }} />

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
