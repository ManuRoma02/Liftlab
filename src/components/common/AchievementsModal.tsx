import React, { useState, useMemo, useEffect } from "react";
import { Trophy, X, Search, CheckCircle } from "lucide-react";
import { ACHIEVEMENTS } from "../../lib/achievements";
import { triggerHaptic } from "../../lib/haptics";

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[300] flex items-center justify-center p-3 md:p-6">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/8 flex justify-between items-center bg-[#1C1C1E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF9F0A]/15 border border-[#FF9F0A]/25 rounded-2xl flex items-center justify-center text-[#FF9F0A]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-white tracking-tight">
                {tr("achievements", "Legacy Achievements")}
              </h3>
              <p className="text-xs text-[#8E8E93]">
                {unlockedCount} / {ACHIEVEMENTS.length} {tr("unlocked", "Unlocked")}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls: Search & Filters */}
        <div className="p-4 border-b border-white/6 bg-black/20 flex flex-col sm:flex-row gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder={tr("search_achievements", "Search achievements...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-sm text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#30D158] transition-all"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-black/40 p-1 rounded-full border border-white/10 overflow-x-auto scrollbar-none shrink-0">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic("light");
                    setFilter(tab.id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#30D158] text-black shadow-sm font-bold"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {filteredAchievements.length === 0 ? (
            <div className="py-20 text-center text-[#8E8E93]">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {tr("no_achievements_found", "No achievements found matching your filter.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                    className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? `bg-black/50 border-[#30D158]/30 shadow-sm`
                        : "bg-black/30 border-white/6 opacity-50 grayscale hover:opacity-75"
                    }`}
                  >
                    {/* Top Row: Icon & Status / Level Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isUnlocked
                            ? `${style.bg} ${style.border} ${style.text}`
                            : "bg-white/5 border-white/10 text-[#8E8E93]"
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
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
                          <CheckCircle className="w-4 h-4 text-[#30D158] shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="flex-1 mb-3">
                      <h4
                        className={`text-sm font-bold leading-tight mb-1 ${
                          isUnlocked ? "text-white" : "text-[#8E8E93]"
                        }`}
                      >
                        {tr(ach.title, ach.title)}
                      </h4>
                      <p className="text-xs text-[#8E8E93] leading-relaxed">
                        {tr(ach.description, ach.description)}
                      </p>
                    </div>

                    {/* Bottom: Progress Bar (if locked) or Unlocked Label */}
                    <div className="mt-auto pt-2 border-t border-white/5">
                      {isUnlocked ? (
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#30D158]">
                          <span>{tr("unlocked_caps", "UNLOCKED")}</span>
                          <span>100%</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-[#8E8E93] mb-1 font-mono">
                            <span>{tr("progress", "Progress")}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#30D158] h-full rounded-full transition-all duration-300"
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
        <div className="p-4 border-t border-white/6 flex justify-end shrink-0">
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-full sm:w-auto px-7 py-2.5 bg-[#30D158] text-black font-bold rounded-full hover:brightness-105 active:scale-95 transition-all text-xs cursor-pointer shadow-sm"
          >
            {tr("close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
