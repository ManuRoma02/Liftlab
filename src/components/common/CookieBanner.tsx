import React from "react";
import { Lock } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";

export function CookieBanner({
  t,
  onAccept,
  onDecline,
}: {
  t: (key: string) => string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div role="region" aria-label="Privacy preference" className="fixed bottom-20 md:bottom-6 left-0 right-0 p-4 z-[9999] pointer-events-none lg:left-24">
      <div className="bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center gap-4 md:gap-6 max-w-3xl mx-auto pointer-events-auto">
        <div className="flex-1 flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-[#30D158]">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <h4 className="font-bold text-sm tracking-tight text-white">
              {t("privacyData")}
            </h4>
          </div>
          <p className="text-xs text-[#8E8E93] leading-relaxed">
            {t("cookieConsentMessage")}
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-center md:justify-end">
          <button
            onClick={() => {
              triggerHaptic("light");
              onDecline();
            }}
            type="button"
            className="flex-1 md:flex-none px-5 py-2.5 text-xs text-[#8E8E93] hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors font-semibold cursor-pointer active:scale-95"
          >
            {t("cookieConsentDecline")}
          </button>
          <button
            onClick={() => {
              triggerHaptic("success");
              onAccept();
            }}
            type="button"
            className="flex-1 md:flex-none px-6 py-2.5 bg-[#30D158] text-black rounded-full text-xs font-bold transition-all hover:brightness-105 shadow-sm cursor-pointer active:scale-95"
          >
            {t("cookieConsentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
