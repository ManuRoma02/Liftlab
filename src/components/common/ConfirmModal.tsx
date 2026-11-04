import React from "react";
import { Trash2, Trophy, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { triggerHaptic } from "../../lib/haptics";
import { CARTOON_SPRINGS } from "../../lib/motion";
import { useModalDismiss } from "../../lib/modalStack";

export interface ConfirmModalProps {
  key?: React.Key;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  title?: string;
  icon?: "default" | "finish" | "warning";
}

export function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  title,
  icon = "default",
}: ConfirmModalProps) {
  const Icon = destructive
    ? Trash2
    : icon === "finish"
    ? Trophy
    : icon === "warning"
    ? AlertTriangle
    : CheckCircle2;

  useModalDismiss(true, onCancel);
  const finalConfirmLabel = confirmLabel || (destructive ? "Delete" : "Save");

  return (
    <motion.div
      key="confirm-modal-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[300] flex items-center justify-center p-4"
    >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title || (destructive ? "Confirm destructive action" : "Confirm action")}
          aria-describedby="confirm-modal-message"
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", ...CARTOON_SPRINGS.bouncy }}
          className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden"
        >
          {/* iOS Alert Icon */}
          <motion.div
            animate={{
              scale: [0.75, 1.2, 0.95, 1],
              rotate: destructive ? [0, -10, 10, -3, 0] : [0, 8, -8, 2, 0],
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              destructive
                ? "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25"
                : "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25"
            }`}
          >
            <Icon className="w-7 h-7" strokeWidth={2.2} />
          </motion.div>

          <div className="flex flex-col gap-1 w-full">
            {title && (
              <h2 className="text-white font-bold text-lg tracking-tight">
                {title}
              </h2>
            )}
            <p id="confirm-modal-message" className="text-[#8E8E93] text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* iOS Alert Actions */}
          <div className="flex gap-2.5 w-full pt-2">
            <motion.button
              type="button"
              autoFocus
              whileTap={{ scale: 0.9, rotate: -2 }}
              transition={{ type: "spring", ...CARTOON_SPRINGS.bouncy }}
              onClick={() => {
                triggerHaptic("light");
                onCancel();
              }}
              className="flex-1 min-h-[44px] py-3 px-4 rounded-full font-semibold text-sm text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer flex items-center justify-center"
            >
              {cancelLabel}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9, rotate: destructive ? 2 : -2 }}
              transition={{ type: "spring", ...CARTOON_SPRINGS.bouncy }}
              onClick={() => {
                triggerHaptic(destructive ? "warning" : "success");
                onConfirm();
              }}
              className={`flex-1 min-h-[44px] py-3 px-4 rounded-full font-bold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center ${
                destructive
                  ? "bg-[#FF453A] text-white hover:brightness-105 shadow-[0_4px_16px_rgba(255,69,58,0.3)]"
                  : "bg-[#30D158] text-black hover:brightness-105 shadow-[0_4px_16px_rgba(48,209,88,0.3)]"
              }`}
            >
              {finalConfirmLabel}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
  );
}

export { useModalDismiss, useBackDismiss } from "../../lib/modalStack";
