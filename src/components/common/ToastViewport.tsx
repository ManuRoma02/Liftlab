import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
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
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, tone === "error" ? 5200 : 3600);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return (
    <div
      className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[500] flex flex-col items-center gap-2 pointer-events-none lg:left-28 lg:right-6 lg:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
          return (
            <motion.div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: -24, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.92, transition: { duration: 0.2 } }}
              transition={CARTOON_SPRINGS.pop}
              className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full border px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-[#1C1C1E]/95 ${
                toast.tone === "error"
                  ? "border-[#FF453A]/30 text-white"
                  : toast.tone === "success"
                  ? "border-[#30D158]/30 text-white"
                  : "border-white/10 text-white"
              }`}
            >
              <motion.div
                className="shrink-0"
                animate={{
                  scale: [0.7, 1.25, 0.95, 1],
                  rotate: toast.tone === "error" ? [0, -10, 10, 0] : [0, 8, -8, 0],
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Icon
                  className={`h-5 w-5 ${
                    toast.tone === "error"
                      ? "text-[#FF453A]"
                      : toast.tone === "success"
                      ? "text-[#30D158]"
                      : "text-[#0A84FF]"
                  }`}
                  aria-hidden="true"
                />
              </motion.div>
              <p className="min-w-0 flex-1 text-sm font-semibold text-white leading-snug">{toast.message}</p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.8, rotate: 10 }}
                onClick={() => {
                  triggerHaptic("light");
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                }}
                className="flex min-h-[44px] min-w-[44px] h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors cursor-pointer -mr-1"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
