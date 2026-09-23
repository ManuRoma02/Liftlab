import React from "react";
import { Shield, X } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-xl"
        onClick={() => {
          triggerHaptic("light");
          onClose();
        }}
      />
      <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] relative flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center text-[#8E8E93] hover:text-white self-start cursor-pointer"
          >
            <X className="w-4 h-4" />
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
      </div>
    </div>
  );
}
