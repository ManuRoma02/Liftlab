import React from "react";
import { Settings as SettingsIcon } from "lucide-react";

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
    <section className="bg-[#171412] border border-white/5 rounded-2xl overflow-visible relative shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,197,94,0.16),transparent_18rem),radial-gradient(circle_at_100%_15%,rgba(255,255,255,0.045),transparent_16rem)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
      </div>
      <div className="p-5 flex items-center gap-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl border border-primary-fixed/25 bg-emerald-950/40 text-primary-fixed flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-fixed mb-1">
            {eyebrow}
          </p>
          <h1 className="font-[var(--font-headline-lg)] text-4xl font-extrabold text-white tracking-tight leading-none text-balance">
            {title}
          </h1>
          <p className="text-xs text-on-surface-variant/80 truncate mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {metric}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-on-surface-variant hover:text-primary hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {action && (
        <div className="px-5 pb-5 relative z-10">
          {action}
        </div>
      )}
    </section>
  );
}
