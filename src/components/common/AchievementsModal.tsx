import React, { useState, useMemo, useEffect } from "react";
import { Trophy, X, Search, CheckCircle } from "lucide-react";
import { ACHIEVEMENTS, type Achievement } from "../../lib/achievements";

export interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutLogs: any[];
  unit: string;
  t?: (key: string) => string;
}

type FilterLevel = "all" | "bronze" | "silver" | "gold" | "platinum";

const levelStyles: Record<
  string,
  { badge: string; text: string; border: string; glow: string; bg: string }
> = {
  bronze: {
    badge: "bg-amber-700/20 text-amber-500 border-amber-600/30",
    text: "text-amber-500",
    border: "border-amber-500/30",
    glow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    bg: "bg-amber-500/10",
  },
  silver: {
    badge: "bg-slate-400/20 text-slate-300 border-slate-400/30",
    text: "text-slate-300",
    border: "border-slate-400/30",
    glow: "drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]",
    bg: "bg-slate-400/10",
  },
  gold: {
    badge: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
    text: "text-yellow-400",
    border: "border-yellow-400/30",
    glow: "drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]",
    bg: "bg-yellow-400/10",
  },
  platinum: {
    badge: "bg-cyan-300/20 text-cyan-300 border-cyan-300/30",
    text: "text-cyan-300",
    border: "border-cyan-300/30",
    glow: "drop-shadow-[0_0_8px_rgba(103,232,249,0.4)]",
    bg: "bg-cyan-300/10",
  },
};

export function AchievementsModal({
  isOpen,
  onClose,
  workoutLogs,
  unit,
  t,
}: AchievementsModalProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterLevel>("all");

  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (event: Event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [isOpen, onClose]);

  const tr = (key: string, fallback: string) => {
    if (typeof t === "function") {
      const val = t(key);
      if (val && val !== key) return val;
    }
    return fallback;
  };

  const unlockedCount = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => ach.progress(workoutLogs, unit) >= 1)
      .length;
  }, [workoutLogs, unit]);

  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => {
      const level = ach.level || "bronze";
      const matchesFilter = filter === "all" || level === filter;

      const q = search.toLowerCase().trim();
      const titleStr = tr(ach.title, ach.title).toLowerCase();
      const descStr = tr(ach.description, ach.description).toLowerCase();
      const matchesSearch = !q || titleStr.includes(q) || descStr.includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search, workoutLogs, unit, t]);

  if (!isOpen) return null;

  const filterTabs: { id: FilterLevel; label: string }[] = [
    { id: "all", label: tr("all", "All") },
    { id: "bronze", label: "Bronze" },
    { id: "silver", label: "Silver" },
    { id: "gold", label: "Gold" },
    { id: "platinum", label: "Platinum" },
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-surface-variant flex justify-between items-center bg-surface-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-[var(--font-headline-sm)] text-[18px] md:text-[22px] font-bold text-primary tracking-tight uppercase">
                {tr("achievements", "Legacy Achievements")}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {unlockedCount} / {ACHIEVEMENTS.length} {tr("unlocked", "Unlocked")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-variant/50"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls: Search & Filters */}
        <div className="p-4 border-b border-surface-variant/50 bg-surface-container flex flex-col sm:flex-row gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder={tr("search_achievements", "Search achievements...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-surface-variant rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface border border-surface-variant/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0">
          {filteredAchievements.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">
                {tr("no_achievements_found", "No achievements found matching your filter.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredAchievements.map((ach) => {
                const rawProg = ach.progress(workoutLogs, unit);
                const progressPercent = Math.min(100, Math.floor(rawProg * 100));
                const isUnlocked = rawProg >= 1;
                const levelKey = ach.level || "bronze";
                const style = levelStyles[levelKey] || levelStyles.bronze;
                const IconComponent = ach.icon;

                return (
                  <div
                    key={ach.id}
                    className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isUnlocked
                        ? `bg-surface border-primary/40 ${style.border}`
                        : "bg-surface/40 border-surface-variant opacity-60 grayscale hover:opacity-80"
                    }`}
                  >
                    {/* Top Row: Icon & Status / Level Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isUnlocked
                            ? `${style.bg} ${style.border} ${style.text}`
                            : "bg-surface-variant/40 border-surface-variant text-on-surface-variant"
                        }`}
                      >
                        <IconComponent
                          className={`w-6 h-6 ${
                            isUnlocked ? style.glow : ""
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}
                        >
                          {levelKey}
                        </span>
                        {isUnlocked && (
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="flex-1 mb-3">
                      <h4
                        className={`text-sm font-bold leading-tight mb-1 ${
                          isUnlocked
                            ? "text-on-surface"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {tr(ach.title, ach.title)}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant leading-snug">
                        {tr(ach.description, ach.description)}
                      </p>
                    </div>

                    {/* Bottom: Progress Bar (if locked) or Unlocked Label */}
                    <div className="mt-auto pt-2 border-t border-surface-variant/40">
                      {isUnlocked ? (
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary">
                          <span>{tr("unlocked_caps", "UNLOCKED")}</span>
                          <span>100%</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1 font-mono">
                            <span>{tr("progress", "Progress")}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-variant/10 border-t border-surface-variant/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity uppercase tracking-wide text-xs"
          >
            {tr("close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
