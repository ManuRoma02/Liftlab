import React, { useEffect, useRef } from "react";
import { Trash2, Trophy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  title,
  icon = "default",
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  title?: string;
  icon?: "default" | "finish" | "warning";
}) {
  const Icon = destructive ? Trash2 : icon === "finish" ? Trophy : CheckCircle2;
  useBackDismiss(true, onCancel);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title || (destructive ? "Confirm destructive action" : "Confirm action")}
          aria-describedby="confirm-modal-message"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden"
        >
          <div className={`absolute inset-x-0 top-0 h-1 ${destructive ? "bg-error" : "bg-primary-fixed"}`} />
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${destructive ? "bg-error/15 text-error" : "bg-primary-fixed text-black"}`}>
              <Icon className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              {title && (
                <h2 className="text-on-surface font-black uppercase tracking-widest text-sm mb-1">
                  {title}
                </h2>
              )}
              <p id="confirm-modal-message" className="text-on-surface-variant text-sm leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" autoFocus onClick={onCancel} className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface-variant border border-surface-variant hover:bg-surface-variant active:scale-95 transition-all">
              {cancelLabel}
            </button>
            <button type="button" onClick={onConfirm} className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg ${destructive ? "bg-error text-on-error hover:opacity-90 shadow-error/20" : "bg-primary-fixed text-black hover:opacity-90 shadow-primary-fixed/20"}`}>
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const backDismissStack: (() => void)[] = [];

if (typeof window !== "undefined") {
  window.addEventListener("liftlab:back", (event: Event) => {
    if (event.defaultPrevented) return;
    if (backDismissStack.length > 0) {
      event.preventDefault();
      const topHandler = backDismissStack.pop();
      topHandler?.();
    }
  });
}

export function useBackDismiss(isActive: boolean, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!isActive) return;
    const handler = () => {
      onDismissRef.current();
    };
    backDismissStack.push(handler);
    return () => {
      const idx = backDismissStack.lastIndexOf(handler);
      if (idx !== -1) {
        backDismissStack.splice(idx, 1);
      }
    };
  }, [isActive]);
}

