import React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";

export function TabHero({
  eyebrow,
  title,
  subtitle,
  icon,
  metric,
  action,
  onOpenSettings,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  metric?: React.ReactNode;
  action?: React.ReactNode;
  onOpenSettings?: () => void;
}) {
  return (
    <section className="bg-[#1C1C1E] border border-white/8 rounded-3xl overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(48,209,88,0.12),transparent_16rem),radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.03),transparent_14rem)]" />
      </div>
      <div className="p-5 sm:p-6 flex items-center gap-4 relative z-10">
        <div className="w-13 h-13 rounded-2xl border border-[#30D158]/25 bg-[#30D158]/12 text-[#30D158] flex items-center justify-center shrink-0 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#30D158] mb-0.5">
            {eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[-0.025em] leading-none text-balance">
            {title}
          </h1>
          <p className="text-xs text-[#8E8E93] truncate mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {metric}
          {onOpenSettings && (
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenSettings();
              }}
              aria-label="Settings"
              className="w-10 h-10 rounded-full bg-white/6 border border-white/10 text-[#8E8E93] hover:text-white hover:bg-white/12 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {action && (
        <div className="px-5 sm:px-6 pb-5 relative z-10">
          {action}
        </div>
      )}
    </section>
  );
}
