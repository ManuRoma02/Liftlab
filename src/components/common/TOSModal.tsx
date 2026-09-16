import React from "react";
import { FileText, X } from "lucide-react";

export function TOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="bg-surface-container border border-surface-variant/50 rounded-[28px] w-full max-w-2xl max-h-[85vh] relative flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 md:px-8 md:pt-8 md:pb-6 border-b border-surface-variant/30">
          <div>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="font-[var(--font-headline-md)] text-[28px] font-bold text-on-background tracking-tight leading-tight">
              Terms of Service
            </h2>
            <p className="text-on-surface-variant text-[14px] mt-1">
              Simple rules for this indie app.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-surface-variant/30 hover:bg-surface-variant transition-colors rounded-full text-on-surface-variant hover:text-on-background self-start"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto font-[var(--font-body-md)] text-on-surface-variant space-y-8 text-[15px] leading-relaxed">
          <section>
            <h3 className="text-on-background flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-primary">1.</span> It's a Personal Project
            </h3>
            <p>
              Welcome to LiftLab! By using this app, you acknowledge that it is
              provided "as-is" by an independent developer, not a company. I
              strive to make it awesome, but there are no strict guarantees of
              100% uptime.
            </p>
          </section>

          <section>
            <h3 className="text-error flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-error">2.</span> Medical Disclaimer
            </h3>
            <p className="text-on-surface-variant">
              LiftLab is a tool to track your workouts,{" "}
              <strong>not medical advice</strong>. Always consult a healthcare
              professional before starting any new diet or exercise regimen. I
              am not responsible for any injuries or issues you might experience
              while working out. Lift heavy, but lift safe!
            </p>
          </section>

          <section>
            <h3 className="text-on-background flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-primary">3.</span> Fair Use
            </h3>
            <p>
              Please just use the app as intended. Since all calculations and storage run locally on your device, there are no remote servers or accounts to abuse. Have fun tracking your workouts!
            </p>
          </section>

          <section>
            <h3 className="text-on-background flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-primary">4.</span> Changes to Service
            </h3>
            <p>
              Since this is an indie app, features might evolve, change, or
              occasionally break while I iterate and improve the platform. I'll
              do my best to keep your data safe, but it's always a good idea to
              export your data regularly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
