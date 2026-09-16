import React from "react";
import { Shield, X } from "lucide-react";

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
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
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-[var(--font-headline-md)] text-[28px] font-bold text-on-background tracking-tight leading-tight">
              Privacy Policy
            </h2>
            <p className="text-on-surface-variant text-[14px] mt-1">
              Written in plain English, for a personal fitness app.
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
              <span className="text-primary">1.</span> Who I Am
            </h3>
            <p>
              I am an independent developer building LiftLab as a personal
              project. This is not a corporation. I don't sell your data, I
              don't run ads, and I don't track you across the web. I just want
              to build a great workout tracker.
            </p>
          </section>

          <section>
            <h3 className="text-on-background flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-primary">2.</span> What I Collect
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
            <h3 className="text-on-background flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-primary">3.</span> Where Your Data Lives
            </h3>
            <p>
              Your data is stored locally on your device (via HTML5 local storage). There is no central server, database, or third-party cloud synchronization. This means you have total ownership and control over your data.
            </p>
            <p className="mt-2 text-on-surface-variant/80">
              Note: If you uninstall the app or clear your storage data, your workout history will be lost. To prevent data loss, please use the Export Data option in the settings menu.
            </p>
          </section>

          <section>
            <h3 className="text-on-background flex items-center gap-2 font-bold text-[18px] mb-3">
              <span className="text-primary">4.</span> Your Right to Be Forgotten
            </h3>
            <p>
              You own your data. You can export it at any time, or permanently clear all local data directly from the settings page. Clearing local data instantly deletes all local routines and logs from your device. It cannot be recovered.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
