import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { TOAST_EVENT, type ToastDetail } from "../../lib/toast";

type ToastItem = ToastDetail & { id: number };

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const { message, tone } = (event as CustomEvent<ToastDetail>).detail;
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, tone === "error" ? 5200 : 3600);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[500] flex flex-col items-center gap-2 pointer-events-none lg:left-28 lg:right-6 lg:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
        return (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.tone === "error"
                ? "border-error/35 bg-error-container/95 text-on-error-container"
                : toast.tone === "success"
                  ? "border-emerald-400/30 bg-emerald-950/95 text-emerald-50"
                  : "border-primary-fixed/30 bg-surface-container-high/95 text-on-surface"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-current/75 transition-colors hover:bg-white/10 hover:text-current"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
