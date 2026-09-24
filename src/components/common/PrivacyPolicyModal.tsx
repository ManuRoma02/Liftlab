import React, { useEffect } from "react";
import { Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../../lib/haptics";
import { APPLE_SPRINGS } from "../../lib/motion";

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
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
          aria-label="Privacy Policy"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] relative flex flex-col shadow-2xl"
        >
          <div className="flex justify-between items-center p-6 md:p-7 border-b border-white/8 shrink-0">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#5E5CE6]/15 text-[#5E5CE6] border border-[#5E5CE6]/25 mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                Privacy Policy
              </h2>
              <p className="text-[#8E8E93] text-xs mt-0.5">
                Written in plain English, for a personal fitness app.
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
                <span className="text-[#30D158]">1.</span> Who I Am
              </h3>
              <p>
                I am an independent developer building LiftLab as a personal
                project. This is not a corporation. I don't sell your data, I
                don't run ads, and I don't track you across the web. I just want
                to build a great workout tracker.
              </p>
            </section>

            <section>
              <h3 className="text-white flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-[#30D158]">2.</span> What I Collect
              </h3>
              <p>
                LiftLab operates entirely offline. No sign-up or registration is required. All data stays on your device:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  Your local settings (language, default timer, weight unit, preferences).
                </li>
                <li>
                  Your workout routines, exercise logs, and weight history to provide the core app functionality.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-white flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-[#30D158]">3.</span> Analytics & Third Parties
              </h3>
              <p>
                LiftLab uses zero third-party tracking scripts, zero marketing pixels, and zero profiling cookies. All calculations and storage remain 100% on your device.
              </p>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
