import React, { useEffect } from "react";
import { FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../../lib/haptics";
import { APPLE_SPRINGS } from "../../lib/motion";

export function TOSModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handleBack = (event: Event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("liftlab:back", handleBack);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("liftlab:back", handleBack);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl"
        onClick={() => {
          triggerHaptic("light");
          onClose();
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Terms of Service"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] relative flex flex-col shadow-2xl"
        >
          <div className="flex justify-between items-center p-6 md:p-7 border-b border-white/8 shrink-0">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 text-white border border-white/15 mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                Terms of Service
              </h2>
              <p className="text-[#8E8E93] text-xs mt-0.5">
                Simple rules for this indie app.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center text-[#8E8E93] hover:text-white self-start cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-[#8E8E93] space-y-7 text-sm leading-relaxed">
            <section>
              <h3 className="text-white flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-[#30D158]">1.</span> It's a Personal Project
              </h3>
              <p>
                Welcome to LiftLab! By using this app, you acknowledge that it is
                provided "as-is" by an independent developer, not a company. I
                strive to make it awesome, but there are no strict guarantees of
                100% uptime.
              </p>
            </section>

            <section>
              <h3 className="text-[#FF453A] flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-[#FF453A]">2.</span> Medical Disclaimer
              </h3>
              <p className="text-[#8E8E93]">
                LiftLab is a tool to track your workouts,{" "}
                <strong className="text-white">not medical advice</strong>. Always consult a healthcare
                professional before starting any new diet or exercise regimen. I
                am not responsible for any injuries or issues you might experience
                while working out. Lift heavy, but lift safe!
              </p>
            </section>

            <section>
              <h3 className="text-white flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-[#30D158]">3.</span> Fair Use
              </h3>
              <p>
                Use the app for your personal training. Don't attempt to exploit, scrape, or reverse engineer proprietary data or features without permission.
              </p>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
