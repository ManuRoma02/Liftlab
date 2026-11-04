import { useEffect, useRef, useState } from "react";
import { Check, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TOAST_EVENT, type ToastDetail } from "../../lib/toast";
import { triggerHaptic } from "../../lib/haptics";
import { CARTOON_SPRINGS } from "../../lib/motion";

type ToastItem = ToastDetail & { id: number };

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const { message, tone } = (event as CustomEvent<ToastDetail>).detail;
      const id = nextId.current++;
      triggerHaptic(tone === "error" ? "warning" : tone === "success" ? "success" : "light");
      setToasts((current) => [...current.slice(-1), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, tone === "error" ? 4200 : 2800);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[500] flex flex-col items-center gap-2 pointer-events-none px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.tone === "success";
          const isError = toast.tone === "error";

          return (
            <motion.div
              key={toast.id}
              role={isError ? "alert" : "status"}
              initial={{ opacity: 0, y: -20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.92, transition: { duration: 0.18 } }}
              transition={CARTOON_SPRINGS.pop}
              onClick={() => {
                triggerHaptic("light");
                setToasts((current) => current.filter((item) => item.id !== toast.id));
              }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 max-w-sm rounded-full border border-white/12 bg-[#161618]/92 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isError
                    ? "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30"
                    : isSuccess
                    ? "bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30"
                    : "bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30"
                }`}
              >
                {isError ? (
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                ) : isSuccess ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <Info className="w-3 h-3 stroke-[2.5]" />
                )}
              </div>
              <p className="text-xs font-semibold text-white tracking-tight leading-snug">
                {toast.message}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
