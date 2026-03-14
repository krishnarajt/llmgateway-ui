"use client";

// ═══════════════════════════════════════════════════════════════
// TOAST SYSTEM — Auto-dismissing notification toasts
// ═══════════════════════════════════════════════════════════════
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const ToastEl = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 30, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`toast toast-${toast.type}`}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { show, ToastEl };
}
