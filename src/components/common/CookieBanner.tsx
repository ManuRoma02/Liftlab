import React from "react";
import { Lock } from "lucide-react";

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
    <div role="region" aria-label="Privacy preference" className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 md:p-6 z-[9999] pointer-events-none lg:left-24">
      <div className="bg-surface-container/90 backdrop-blur-2xl border border-surface-variant/50 p-5 md:p-6 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-5 md:gap-8 max-w-4xl mx-auto pointer-events-auto">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <h4 className="font-bold text-[16px] tracking-tight">
              {t("privacyData")}
            </h4>
          </div>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            {t("cookieConsentMessage")}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={onDecline}
            type="button" className="min-h-11 px-5 py-2.5 text-[14px] text-on-surface-variant hover:text-on-background hover:bg-surface-variant/30 rounded-xl transition-colors font-semibold tracking-wide uppercase"
          >
            {t("cookieConsentDecline")}
          </button>
          <button
            onClick={onAccept}
            type="button" className="min-h-11 px-6 py-2.5 bg-primary-fixed text-[#07110a] rounded-xl text-[14px] font-bold tracking-wide transition-colors uppercase hover:bg-primary-container shadow-[0_4px_14px_0_rgba(34,197,94,0.2)]"
          >
            {t("cookieConsentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
