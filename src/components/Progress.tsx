import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Calendar,
  Scale,
  Zap,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  Trophy,
  Edit2,
  CheckCircle2,
  Medal,
  BarChart2,
  LineChart as LucideLineChart,
  Search,
  Trash2,
  Activity,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
} from "recharts";

import { TabHero } from "./common/TabHero";
import { ExerciseMuscleVisual } from "./common/ExerciseMuscleVisual";
import { ExerciseFilterBar } from "./common/ExerciseFilterBar";
import { triggerHaptic } from "../lib/haptics";
import { appleSpringDefault } from "../lib/motion";
import { AchievementsModal } from "./common/AchievementsModal";
import { ConfirmModal } from "./common/ConfirmModal";
import { FullWorkoutHistoryModal } from "./common/FullWorkoutHistoryModal";
import {
  buildPersonalRecords,
  buildPersonalRecordSlots,
  calculateOneRepMax,
  getWorkoutLogDurationMinutes,
  isTimedExercise,
  calculateSetVolume,
  getLogDate,
} from "../lib/workoutUtils";
import { ACHIEVEMENTS, type Achievement } from "../lib/achievements";
import { writeJsonAtomic } from "../lib/storage";

export function Progress({
  t,
  unit,
  exercises,
  workoutLogs,
  weightLogs = [],
  navigateTo,
  onUpdateWeight,
  userData,
  onDeleteWorkoutLog,
  oneRepMaxFormula = "epley",
}: {
  t: any;
  unit: string;
  exercises: any[];
  workoutLogs: any[];
  weightLogs?: { date: string; weight: number }[];
  navigateTo: (tab: string) => void;
  onUpdateWeight: () => void;
  userData: any;
  onDeleteWorkoutLog?: (logId: string) => void;
  oneRepMaxFormula?: "epley" | "brzycki";
}) {
  // Navigation: 3 clean iOS sections (Panoramica, Grafici, Storico)
  const [activeSection, setActiveSection] = useState<"overview" | "charts" | "history">("overview");

  // Timeframe filter (for Charts tab)
  const [timeframe, setTimeframe] = useState<"30D" | "90D" | "1Y" | "ALL">("30D");

  // Charts sub-tab
  const [activeChartMetric, setActiveChartMetric] = useState<"strength" | "volume" | "muscles" | "weight">("strength");
  const [chartCurveType, setChartCurveType] = useState<"max" | "1rm" | "both">("both");

  // Exercise selection for charts / PRs
  const [strengthLiftExId, setStrengthLiftExId] = useState<string>("e_sq"); // Squat
  const [bestLiftExId, setBestLiftExId] = useState<string>("e_dl"); // Deadlift
  const [isLiftPickerOpen, setIsLiftPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"best" | "strength" | `record-${number}`>("best");
  const [liftSearch, setLiftSearch] = useState("");
  const [liftCategory, setLiftCategory] = useState("All");

  // History search
  const [historySearch, setHistorySearch] = useState("");

  // Modals & Celebrations
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [unlockedCelebration, setUnlockedCelebration] = useState<Achievement | null>(null);
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);
  const [recordExerciseIds, setRecordExerciseIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("liftlab_pr_exercise_slots");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 3);
      } catch {}
    }
    return ["e_sq", "e_bp", "e_dl"];
  });

  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);

  // Hardware back button handler
  useEffect(() => {
    const handleBack = (event: Event) => {
      if (pendingDeleteLogId) {
        event.preventDefault();
        setPendingDeleteLogId(null);
        return;
      }
      if (isFullHistoryOpen) {
        event.preventDefault();
        setIsFullHistoryOpen(false);
        return;
      }
      if (isAchievementsOpen) {
        event.preventDefault();
        setIsAchievementsOpen(false);
        return;
      }
      if (!isLiftPickerOpen) return;
      event.preventDefault();
      setIsLiftPickerOpen(false);
      setLiftSearch("");
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [isLiftPickerOpen, pendingDeleteLogId, isFullHistoryOpen, isAchievementsOpen]);

  // Achievements calculation
  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => ach.progress(workoutLogs, unit) >= 1);
  }, [workoutLogs, unit]);

  const top3Unlocked = useMemo(() => {
    return unlockedAchievements.slice(0, 3);
  }, [unlockedAchievements]);

  useEffect(() => {
    if (!workoutLogs) return;

    let savedUnlockedIds: string[] = [];
    try {
      const saved = localStorage.getItem("liftlab_unlocked_achievements");
      if (saved) {
        savedUnlockedIds = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse liftlab_unlocked_achievements", e);
    }

    const currentUnlocked = ACHIEVEMENTS.filter(
      (ach) => ach.progress(workoutLogs, unit) >= 1
    );

    const newlyUnlocked = currentUnlocked.filter(
      (ach) => !savedUnlockedIds.includes(ach.id)
    );

    if (newlyUnlocked.length > 0) {
      setUnlockedCelebration(newlyUnlocked[newlyUnlocked.length - 1]);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([30, 50, 30]);
        } catch {}
      }
    }
  }, [workoutLogs, unit]);

  const handleClaimCelebration = () => {
    try {
      const currentUnlockedIds = unlockedAchievements.map((ach) => ach.id);
      writeJsonAtomic("liftlab_unlocked_achievements", currentUnlockedIds);
    } catch (e) {
      console.error("Failed to save liftlab_unlocked_achievements", e);
    }
    setUnlockedCelebration(null);
  };

  const safeExercises = exercises || [];

  const bestLiftEx =
    safeExercises.find((ex) => ex.id === bestLiftExId) || safeExercises[0];

  const strengthLiftEx =
    safeExercises.find((ex) => ex.id === strengthLiftExId) || safeExercises[0];

  const sortedLogs = useMemo(() => {
    return [...workoutLogs]
      .filter((log) => log.date)
      .sort((a, b) => getLogDate(a).getTime() - getLogDate(b).getTime());
  }, [workoutLogs]);

  const sortedLogsDescending = useMemo(() => {
    return [...workoutLogs]
      .filter((log) => log.date)
      .sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime());
  }, [workoutLogs]);

  // Filter logs by selected timeframe for charts
  const filteredLogsForCharts = useMemo(() => {
    if (timeframe === "ALL" || sortedLogs.length <= 1) return sortedLogs;
    const now = new Date();
    const days = timeframe === "30D" ? 30 : timeframe === "90D" ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const filtered = sortedLogs.filter((log) => getLogDate(log) >= cutoff);
    return filtered.length > 0 ? filtered : sortedLogs;
  }, [sortedLogs, timeframe]);

  // Filter weight logs by timeframe
  const filteredWeightLogs = useMemo(() => {
    if (timeframe === "ALL" || weightLogs.length <= 1) return weightLogs;
    const now = new Date();
    const days = timeframe === "30D" ? 30 : timeframe === "90D" ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const filtered = weightLogs.filter((l) => new Date(l.date) >= cutoff);
    return filtered.length > 0 ? filtered : weightLogs;
  }, [weightLogs, timeframe]);

  // Chart data generators
  const progressData = useMemo(() => {
    return filteredLogsForCharts.map((log, i) => {
      const date = getLogDate(log);
      const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      let liftWeight = 0;
      let estimated1RM = 0;
      const targetTitle = strengthLiftEx?.title?.trim().toLowerCase();
      const targetId = strengthLiftEx?.id;

      log.exercises?.forEach((ex: any) => {
        const exTitle = ex.title?.trim().toLowerCase();
        const exId = ex.id;
        const matches =
          (targetId && (exId === targetId || ex.exerciseId === targetId)) ||
          (exTitle && targetTitle && (exTitle === targetTitle || exTitle.includes(targetTitle) || targetTitle.includes(exTitle)));

        if (matches) {
          ex.sets?.forEach((s: any) => {
            if (s.completed && s.weight && s.reps) {
              const w = Number(s.weight);
              const r = Number(s.reps);
              if (Number.isFinite(w) && w > liftWeight) liftWeight = w;
              const oneRepMax = calculateOneRepMax(w, r, oneRepMaxFormula);
              if (Number.isFinite(oneRepMax) && oneRepMax > estimated1RM) estimated1RM = oneRepMax;
            }
          });
        }
      });
      return {
        name: dateStr || `Session ${i + 1}`,
        liftWeight: liftWeight || null,
        estimated1RM: estimated1RM || null,
      };
    });
  }, [filteredLogsForCharts, strengthLiftEx, oneRepMaxFormula]);

  const volumeData = useMemo(() => {
    return filteredLogsForCharts.map((log, i) => {
      const date = getLogDate(log);
      const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      let volume = 0;
      log.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          volume += calculateSetVolume(s);
        });
      });
      return { name: dateStr || `Session ${i + 1}`, volume };
    });
  }, [filteredLogsForCharts]);

  const muscleVolumeData = useMemo(() => {
    const volumes: Record<string, number> = {};
    filteredLogsForCharts.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        const cat = ex.category || safeExercises.find((e: any) => e.title?.trim().toLowerCase() === ex.title?.trim().toLowerCase())?.category || "Strength";
        if (cat === "Cardio") return;
        let vol = 0;
        ex.sets?.forEach((s: any) => {
          vol += calculateSetVolume(s);
        });
        if (vol > 0) {
          volumes[cat] = (volumes[cat] || 0) + vol;
        }
      });
    });
    return Object.entries(volumes).map(([name, volume]) => ({ name, volume }));
  }, [filteredLogsForCharts, safeExercises]);

  const weightDataForChart = useMemo(() => {
    return [...filteredWeightLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((log) => ({
        name: new Date(log.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        weight: log.weight,
      }));
  }, [filteredWeightLogs]);

  const personalRecords = useMemo(
    () => buildPersonalRecords(workoutLogs, oneRepMaxFormula),
    [workoutLogs, oneRepMaxFormula],
  );

  const personalRecordSlots = useMemo(
    () => buildPersonalRecordSlots(personalRecords, recordExerciseIds, safeExercises, 3),
    [personalRecords, recordExerciseIds, safeExercises],
  );

  const totalVolumeNum = useMemo(() => {
    let vol = 0;
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
        });
      });
    });
    return vol;
  }, [workoutLogs]);

  const totalVolumeFormatted = useMemo(() => {
    if (totalVolumeNum >= 1000) return (totalVolumeNum / 1000).toFixed(1) + "k";
    return (Math.round(totalVolumeNum * 10) / 10).toString();
  }, [totalVolumeNum]);

  const totalLoggedSets = useMemo(() => {
    return workoutLogs.reduce((sum, log) => {
      return sum + (log.exercises || []).reduce((exerciseSum: number, ex: any) => {
        return exerciseSum + (ex.sets || []).filter((set: any) => set.completed).length;
      }, 0);
    }, 0);
  }, [workoutLogs]);

  // Calculate Best Lift max
  const bestLiftMax = useMemo(() => {
    let max = 0;
    const bestTitle = bestLiftEx?.title?.trim().toLowerCase();
    const bestId = bestLiftEx?.id;

    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        const exTitle = ex.title?.trim().toLowerCase();
        const exId = ex.id;
        const matches =
          (bestId && (exId === bestId || ex.exerciseId === bestId)) ||
          (exTitle && bestTitle && (exTitle === bestTitle || exTitle.includes(bestTitle) || bestTitle.includes(exTitle)));

        if (matches) {
          ex.sets?.forEach((s: any) => {
            if (s.completed && s.weight !== "" && s.weight !== undefined && s.weight !== null) {
              const w = Number(s.weight);
              if (Number.isFinite(w) && w > max) {
                max = w;
              }
            }
          });
        }
      });
    });
    if (max === 0 && bestLiftEx) {
      return Number(bestLiftEx.prWeight || bestLiftEx.oneRepMax || 0);
    }
    return max;
  }, [workoutLogs, bestLiftEx]);

  // Picker exercises
  const sortedExercisesForPicker = useMemo(() => {
    const recordTitles = new Set(personalRecords.map((r) => (r.title || "").trim().toLowerCase()));
    const withRecords = safeExercises.filter((ex) => recordTitles.has((ex.title || "").trim().toLowerCase()));
    const withoutRecords = safeExercises.filter((ex) => !recordTitles.has((ex.title || "").trim().toLowerCase()));
    const sortByTitle = (a: any, b: any) => t(a.title).localeCompare(t(b.title));
    return [...withRecords.sort(sortByTitle), ...withoutRecords.sort(sortByTitle)];
  }, [safeExercises, personalRecords, t]);

  const pickerCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: sortedExercisesForPicker.length };
    for (const ex of sortedExercisesForPicker) {
      const cat = ex.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [sortedExercisesForPicker]);

  const filteredPickerExercises = useMemo(() => {
    const q = liftSearch.trim().toLowerCase();
    return sortedExercisesForPicker.filter((ex) => {
      const matchesCategory =
        liftCategory === "All" ||
        (ex.category || "").toLowerCase() === liftCategory.toLowerCase();
      if (!matchesCategory) return false;

      if (!q) return true;
      const titleMatch = (t(ex.title) || "").toLowerCase().includes(q);
      const catMatch = (ex.category || "").toLowerCase().includes(q);
      const eqMatch = (ex.equipment || "").toLowerCase().includes(q);
      return titleMatch || catMatch || eqMatch;
    });
  }, [sortedExercisesForPicker, liftSearch, liftCategory, t]);

  // History filtering by search
  const filteredHistoryLogs = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return sortedLogsDescending;
    return sortedLogsDescending.filter((log) => {
      const nameMatch = (log.routineName || log.name || "").toLowerCase().includes(q);
      const exerciseMatch = (log.exercises || []).some((ex: any) =>
        (ex.title || "").toLowerCase().includes(q) ||
        (t(ex.title) || "").toLowerCase().includes(q)
      );
      return nameMatch || exerciseMatch;
    });
  }, [sortedLogsDescending, historySearch, t]);

  // Metric stats for charts highlight pod
  const strengthPeak1RM = useMemo(() => {
    let peak = 0;
    progressData.forEach((p) => {
      if (p.estimated1RM && p.estimated1RM > peak) peak = p.estimated1RM;
    });
    return peak;
  }, [progressData]);

  const strengthPeakWeight = useMemo(() => {
    let peak = 0;
    progressData.forEach((p) => {
      if (p.liftWeight && p.liftWeight > peak) peak = p.liftWeight;
    });
    return peak;
  }, [progressData]);

  const periodTotalVolume = useMemo(() => {
    return volumeData.reduce((acc, curr) => acc + (curr.volume || 0), 0);
  }, [volumeData]);

  const periodAvgVolume = useMemo(() => {
    if (volumeData.length === 0) return 0;
    return Math.round(periodTotalVolume / volumeData.length);
  }, [periodTotalVolume, volumeData]);

  const weightDelta = useMemo(() => {
    if (weightDataForChart.length < 2) return null;
    const first = weightDataForChart[0].weight;
    const last = weightDataForChart[weightDataForChart.length - 1].weight;
    const diff = Number((last - first).toFixed(1));
    return diff;
  }, [weightDataForChart]);

  return (
    <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pb-44 flex flex-col gap-6 w-full">
      {/* iOS Header */}
      <TabHero

        title={t("progress") || "Progressi"}
        subtitle={
          (t("progress_subtitle") !== "progress_subtitle" && t("progress_subtitle")) ||
          "Monitora i tuoi carichi, volumi e traguardi in tempo reale."
        }
        icon={<LucideLineChart className="w-7 h-7 text-[#30D158]" />}
        onOpenSettings={() => navigateTo("settings")}
        metric={
          <span className="inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5 tabular-nums">
            {totalLoggedSets} {t("set")?.toLowerCase() || "serie totali"}
          </span>
        }
      />

      {/* iOS Segmented Control (Panoramica, Grafici, Storico) */}
      <div className="w-full bg-[#1C1C1E]/90 p-1.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "overview" as const, label: "Panoramica", icon: BarChart2 },
            { id: "charts" as const, label: "Grafici", icon: Activity },
            { id: "history" as const, label: "Storico", icon: Calendar },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveSection(tab.id);
                }}
                className={`relative py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "text-black shadow-md font-extrabold"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="progressMainTab"
                    transition={appleSpringDefault}
                    className="absolute inset-0 bg-[#30D158] rounded-xl shadow-[0_2px_12px_rgba(48,209,88,0.35)]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PANORAMICA (Overview) */}
      {activeSection === "overview" && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-6 w-full"
        >
          {/* Key Metric Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Best Lift (Customizable) */}
            <div
              onClick={() => {
                triggerHaptic("light");
                setPickerTarget("best");
                setIsLiftPickerOpen(true);
              }}
              className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between text-[#8E8E93] mb-3">
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-[#30D158]" strokeWidth={2.2} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t("best_lift") || "Miglior Carico"}</span>
                </div>
                <Edit2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#30D158] transition-opacity" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
                  {Math.round(bestLiftMax)}
                  <span className="text-xs text-[#8E8E93] ml-1 font-semibold uppercase">
                    {unit.toLowerCase()}
                  </span>
                </div>
                <div className="text-xs text-[#30D158] font-semibold mt-1 flex items-center gap-1 truncate">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{bestLiftEx ? t(bestLiftEx.title) : "Esercizio"}</span>
                </div>
              </div>
            </div>

            {/* Workouts Logged */}
            <div
              onClick={() => {
                triggerHaptic("light");
                setActiveSection("history");
              }}
              className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between text-[#8E8E93] mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0A84FF]" strokeWidth={2.2} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t("workouts") || "Sessioni"}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#0A84FF] transition-opacity" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
                  {workoutLogs.length}
                </div>
                <div className="text-xs text-[#0A84FF] font-semibold mt-1 flex items-center gap-1">
                  <span>{t("completed_sessions_count") ? "Completati" : "Registrati"}</span>
                </div>
              </div>
            </div>

            {/* Current Weight */}
            <div
              onClick={() => {
                triggerHaptic("light");
                onUpdateWeight();
              }}
              className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between text-[#8E8E93] mb-3">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-[#FF9F0A]" strokeWidth={2.2} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t("current_weight") || "Peso"}</span>
                </div>
                <Edit2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#FF9F0A] transition-opacity" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
                  {typeof userData?.currentWeight === "number"
                    ? Number(userData.currentWeight.toFixed(1))
                    : userData?.currentWeight || 0}
                  <span className="text-xs text-[#8E8E93] ml-1 font-semibold uppercase">
                    {unit.toLowerCase()}
                  </span>
                </div>
                <div className="text-xs text-[#FF9F0A] font-semibold mt-1 flex items-center gap-1">
                  <span>{t("morning_weigh_in") || "Registra peso"}</span>
                </div>
              </div>
            </div>

            {/* Total Volume */}
            <div
              onClick={() => {
                triggerHaptic("light");
                setActiveSection("charts");
                setActiveChartMetric("volume");
              }}
              className="apple-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between text-[#8E8E93] mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#BF5AF2]" strokeWidth={2.2} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t("total_volume") || "Volume"}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#BF5AF2] transition-opacity" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
                  {totalVolumeFormatted}
                  <span className="text-xs text-[#8E8E93] ml-1 font-semibold uppercase">
                    {unit.toLowerCase()}
                  </span>
                </div>
                <div className="text-xs text-[#BF5AF2] font-semibold mt-1 flex items-center gap-1">
                  <span>Carico sollevato</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Records Bento Pods */}
          <div className="apple-glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FF9F0A]" />
                  {t("personal_records") || "Record Personali"}
                </h2>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  I tuoi 3 esercizi chiave monitorati dallo storico allenamenti.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {personalRecordSlots.map(({ exercise, record }, index) => (
                <button
                  key={exercise?.id || index}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setPickerTarget(`record-${index}`);
                    setIsLiftPickerOpen(true);
                  }}
                  className="bg-black/40 border border-white/6 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate group-hover:text-[#30D158] transition-colors">
                      {exercise ? t(exercise.title) : `Esercizio ${index + 1}`}
                    </p>
                    <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
                      {record
                        ? `Miglior set: ${record.bestWeight} ${unit} × ${record.bestReps}`
                        : "Tocca per selezionare l'esercizio"}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="text-[11px] font-semibold text-[#8E8E93] flex items-center gap-1 group-hover:text-white transition-colors">
                      <Edit2 className="w-3 h-3 text-[#30D158]" />
                      Cambia
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-white tabular-nums leading-none">
                        {record?.estimatedOneRepMax || 0}
                      </p>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#8E8E93] mt-0.5">
                        est 1RM {unit.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Momentum / Latest Session Glance */}
          {sortedLogsDescending.length > 0 && (
            <div className="apple-glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#30D158]/15 border border-[#30D158]/25 flex items-center justify-center text-[#30D158]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Ultimo Allenamento</h3>
                    <p className="text-xs text-[#8E8E93]">
                      {getLogDate(sortedLogsDescending[0]).toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveSection("history");
                  }}
                  className="text-xs font-bold text-[#30D158] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Tutto lo Storico
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 border border-white/6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-white text-base">
                    {sortedLogsDescending[0].routineName || sortedLogsDescending[0].name || "Sessione Allenamento"}
                  </h4>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    {sortedLogsDescending[0].exercises?.length || 0} esercizi registrati
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold tabular-nums">
                  <div className="text-right">
                    <span className="block text-[#8E8E93] text-[10px] uppercase font-bold">Durata</span>
                    <span className="text-white font-bold">{getWorkoutLogDurationMinutes(sortedLogsDescending[0].duration)} min</span>
                  </div>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div className="text-right">
                    <span className="block text-[#8E8E93] text-[10px] uppercase font-bold">Volume</span>
                    <span className="text-[#30D158] font-bold">
                      {Math.round(
                        (sortedLogsDescending[0].exercises || []).reduce((acc: number, ex: any) => {
                          return acc + (ex.sets || []).reduce((sAcc: number, s: any) => sAcc + calculateSetVolume(s), 0);
                        }, 0)
                      )}{" "}
                      {unit.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Summary Spotlight */}
          <div
            onClick={() => {
              triggerHaptic("light");
              setIsAchievementsOpen(true);
            }}
            className="apple-glass-card rounded-3xl p-5 md:p-6 hover:border-white/20 transition-all cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/8"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#FF9F0A]/15 border border-[#FF9F0A]/25 rounded-2xl text-[#FF9F0A] group-hover:scale-105 transition-transform shrink-0">
                <Medal className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>🏆 {unlockedAchievements.length} di {ACHIEVEMENTS.length} Traguardi Sbloccati</span>
                </h2>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Tocca per visualizzare la bacheca trofei e i badge legacy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
              <div className="flex items-center gap-2">
                {top3Unlocked.length > 0 ? (
                  top3Unlocked.map((ach) => {
                    const IconComp = ach.icon;
                    return (
                      <div
                        key={ach.id}
                        className="p-2 rounded-xl bg-black/50 border border-white/10 text-[#FF9F0A] shadow-sm"
                        title={ach.title}
                      >
                        <IconComp className="w-5 h-5 drop-shadow-[0_0_6px_currentColor]" />
                      </div>
                    );
                  })
                ) : (
                  <div className="w-32 bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FF9F0A] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          (unlockedAchievements.length / ACHIEVEMENTS.length) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: GRAFICI (Charts & Trends Deep-Dive) */}
      {activeSection === "charts" && (
        <motion.div
          key="charts"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-6 w-full"
        >
          {/* Sub-Segmented Control: Select Metric to Analyze */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex p-1 bg-[#1C1C1E] rounded-2xl border border-white/10 shadow-sm overflow-x-auto">
              {[
                { id: "strength" as const, label: "Forza & 1RM", icon: Dumbbell },
                { id: "volume" as const, label: "Volume Sessione", icon: Zap },
                { id: "muscles" as const, label: "Gruppi Muscolari", icon: Layers },
                { id: "weight" as const, label: "Peso Corporeo", icon: Scale },
              ].map((m) => {
                const isSelected = activeChartMetric === m.id;
                const IconComp = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setActiveChartMetric(m.id);
                    }}
                    className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isSelected ? "text-black" : "text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeChartMetricPill"
                        transition={appleSpringDefault}
                        className="absolute inset-0 bg-[#30D158] rounded-xl shadow-sm"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Timeframe Filter (30D, 90D, 1Y, ALL) */}
            <div className="flex self-end sm:self-auto p-1 bg-white/6 backdrop-blur-xl rounded-2xl border border-white/10">
              {[
                { id: "30D" as const, label: "30G" },
                { id: "90D" as const, label: "90G" },
                { id: "1Y" as const, label: "1 Anno" },
                { id: "ALL" as const, label: "Tutto" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setTimeframe(f.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeframe === f.id
                      ? "bg-white text-black shadow-sm font-extrabold"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Context Highlight Pod */}
          <div className="apple-glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-5 border border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
            {/* Top Bar with specific metric controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  {activeChartMetric === "strength" && (
                    <>
                      <Dumbbell className="w-5 h-5 text-[#30D158]" />
                      <span>{t("strength_progression") || "Progressione Forza"}</span>
                    </>
                  )}
                  {activeChartMetric === "volume" && (
                    <>
                      <Zap className="w-5 h-5 text-[#BF5AF2]" />
                      <span>{t("volume_trend") || "Andamento Volume"}</span>
                    </>
                  )}
                  {activeChartMetric === "muscles" && (
                    <>
                      <Layers className="w-5 h-5 text-[#0A84FF]" />
                      <span>Ripartizione Gruppi Muscolari</span>
                    </>
                  )}
                  {activeChartMetric === "weight" && (
                    <>
                      <Scale className="w-5 h-5 text-[#FF9F0A]" />
                      <span>{t("body_weight_tracker") || "Andamento Peso Corporeo"}</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  {activeChartMetric === "strength" && `Analisi per ${t(strengthLiftEx?.title || "Esercizio")}`}
                  {activeChartMetric === "volume" && `Volume totale sollevato per sessione (${unit.toLowerCase()})`}
                  {activeChartMetric === "muscles" && "Distribuzione del carico sui principali distretti"}
                  {activeChartMetric === "weight" && "Fluttuazione del peso nel periodo selezionato"}
                </p>
              </div>

              {/* Extra controls depending on metric */}
              {activeChartMetric === "strength" && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Curve Toggle (Max, 1RM, Both) */}
                  <div className="flex p-0.5 bg-black/50 rounded-xl border border-white/10 text-xs">
                    {(["max", "1rm", "both"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setChartCurveType(m);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          chartCurveType === m
                            ? "bg-[#30D158] text-black shadow-sm font-extrabold"
                            : "text-[#8E8E93] hover:text-white"
                        }`}
                      >
                        {m === "max" ? "Max" : m === "1rm" ? "1RM" : "Entrambi"}
                      </button>
                    ))}
                  </div>

                  {/* Exercise selector button */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setPickerTarget("strength");
                      setIsLiftPickerOpen(true);
                    }}
                    className="flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <span className="truncate max-w-[140px]">{t(strengthLiftEx?.title || "Seleziona")}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>
                </div>
              )}

              {activeChartMetric === "weight" && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    onUpdateWeight();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-[#FF9F0A] hover:bg-[#FF9F0A]/25 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  + Registra Peso
                </button>
              )}
            </div>

            {/* Quick KPI stats banner inside the chart card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/40 rounded-2xl p-3.5 border border-white/5 text-xs">
              {activeChartMetric === "strength" && (
                <>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Massimale Stimato</span>
                    <span className="text-lg font-extrabold text-[#0A84FF] tabular-nums">
                      {Math.round(strengthPeak1RM)} {unit.toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Carico Massimo Sollevato</span>
                    <span className="text-lg font-extrabold text-[#30D158] tabular-nums">
                      {Math.round(strengthPeakWeight)} {unit.toLowerCase()}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Rilevazioni</span>
                    <span className="text-lg font-extrabold text-white tabular-nums">
                      {progressData.filter((p) => p.liftWeight || p.estimated1RM).length} sessioni
                    </span>
                  </div>
                </>
              )}

              {activeChartMetric === "volume" && (
                <>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Volume nel Periodo</span>
                    <span className="text-lg font-extrabold text-[#BF5AF2] tabular-nums">
                      {periodTotalVolume >= 1000
                        ? `${(periodTotalVolume / 1000).toFixed(1)}k`
                        : periodTotalVolume}{" "}
                      {unit.toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Media per Sessione</span>
                    <span className="text-lg font-extrabold text-white tabular-nums">
                      {periodAvgVolume >= 1000
                        ? `${(periodAvgVolume / 1000).toFixed(1)}k`
                        : periodAvgVolume}{" "}
                      {unit.toLowerCase()}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Sessioni Considerate</span>
                    <span className="text-lg font-extrabold text-white tabular-nums">
                      {volumeData.length}
                    </span>
                  </div>
                </>
              )}

              {activeChartMetric === "muscles" && (
                <>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Gruppi Coinvolti</span>
                    <span className="text-lg font-extrabold text-[#0A84FF] tabular-nums">
                      {muscleVolumeData.length} distretti
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Gruppo Più Allenato</span>
                    <span className="text-lg font-extrabold text-[#30D158] truncate block">
                      {muscleVolumeData.length > 0
                        ? t(
                            [...muscleVolumeData].sort((a, b) => b.volume - a.volume)[0].name.toLowerCase()
                          )
                        : "N/D"}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Volume Totale Muscolare</span>
                    <span className="text-lg font-extrabold text-white tabular-nums">
                      {periodTotalVolume >= 1000
                        ? `${(periodTotalVolume / 1000).toFixed(1)}k`
                        : periodTotalVolume}{" "}
                      {unit.toLowerCase()}
                    </span>
                  </div>
                </>
              )}

              {activeChartMetric === "weight" && (
                <>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Peso Attuale</span>
                    <span className="text-lg font-extrabold text-white tabular-nums">
                      {typeof userData?.currentWeight === "number"
                        ? Number(userData.currentWeight.toFixed(1))
                        : userData?.currentWeight || 0}{" "}
                      {unit.toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Variazione Periodo</span>
                    <span
                      className={`text-lg font-extrabold tabular-nums ${
                        weightDelta !== null && weightDelta < 0
                          ? "text-[#30D158]"
                          : weightDelta !== null && weightDelta > 0
                          ? "text-[#FF9F0A]"
                          : "text-white"
                      }`}
                    >
                      {weightDelta !== null ? `${weightDelta > 0 ? "+" : ""}${weightDelta} ${unit}` : "Invariato"}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Registrazioni</span>
                    <span className="text-lg font-extrabold text-[#FF9F0A] tabular-nums">
                      {weightDataForChart.length} pesate
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Main Interactive Chart Display */}
            <div className="w-full h-72 sm:h-84 relative text-xs min-w-0 min-h-0 pt-2">
              {/* STRENGTH CHART */}
              {activeChartMetric === "strength" && (
                <>
                  {progressData.length === 0 || !progressData.some((p) => p.liftWeight || p.estimated1RM) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-black/20">
                      <LucideLineChart className="w-8 h-8 text-[#8E8E93] mb-2" />
                      <p className="text-sm font-semibold text-white">{t("no_data_yet") || "Nessun dato registrato"}</p>
                      <p className="text-xs text-[#8E8E93] mt-1 max-w-xs">
                        Completa una sessione includendo {t(strengthLiftEx?.title || "questo esercizio")} per tracciarne la progressione.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMaxWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#30D158" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="color1RMGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                        <XAxis dataKey="name" stroke="#8E8E93" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#8E8E93" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1C1C1E",
                            borderColor: "rgba(255,255,255,0.12)",
                            borderRadius: "16px",
                            color: "#FFFFFF",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                            padding: "8px 12px",
                          }}
                        />
                        {(chartCurveType === "max" || chartCurveType === "both") && (
                          <Area
                            type="monotone"
                            dataKey="liftWeight"
                            name="Carico Massimo"
                            stroke="#30D158"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorMaxWeight)"
                            connectNulls
                          />
                        )}
                        {(chartCurveType === "1rm" || chartCurveType === "both") && (
                          <Area
                            type="monotone"
                            dataKey="estimated1RM"
                            name="1RM Stimato"
                            stroke="#0A84FF"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#color1RMGradient)"
                            connectNulls
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}

              {/* VOLUME CHART */}
              {activeChartMetric === "volume" && (
                <>
                  {volumeData.length === 0 || !volumeData.some((v) => v.volume > 0) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-black/20">
                      <Zap className="w-8 h-8 text-[#8E8E93] mb-2" />
                      <p className="text-sm font-semibold text-white">{t("no_volume_yet") || "Nessun dato di volume registrato"}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                        <XAxis dataKey="name" stroke="#8E8E93" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#8E8E93" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1C1C1E",
                            borderColor: "rgba(255,255,255,0.12)",
                            borderRadius: "16px",
                            color: "#FFFFFF",
                          }}
                          cursor={{ fill: "rgba(255,255,255,0.05)" }}
                          itemStyle={{ color: "#BF5AF2" }}
                        />
                        <Bar dataKey="volume" name="Volume Sessione" fill="#BF5AF2" radius={[6, 6, 0, 0]} maxBarSize={38} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}

              {/* MUSCLES BREAKDOWN */}
              {activeChartMetric === "muscles" && (
                <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col justify-center gap-3.5 pr-2">
                  {(() => {
                    if (muscleVolumeData.length === 0) {
                      return (
                        <div className="text-center text-xs text-[#8E8E93] py-8">
                          Nessun dato sul carico muscolare registrato.
                        </div>
                      );
                    }
                    const maxVol = Math.max(...muscleVolumeData.map((d) => d.volume));
                    return [...muscleVolumeData]
                      .sort((a, b) => b.volume - a.volume)
                      .map((item, idx) => {
                        const percent = maxVol > 0 ? (item.volume / maxVol) * 100 : 0;
                        const colors = ["#30D158", "#0A84FF", "#BF5AF2", "#FF9F0A", "#FF453A", "#64D2FF"];
                        const barColor = colors[idx % colors.length];
                        return (
                          <div key={item.name} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-white font-bold">{t(item.name.toLowerCase()) || item.name}</span>
                              <span className="font-extrabold tabular-nums" style={{ color: barColor }}>
                                {item.volume >= 1000 ? `${(item.volume / 1000).toFixed(1)}k` : item.volume} {unit.toLowerCase()}
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-white/6 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%`, backgroundColor: barColor }}
                              />
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              )}

              {/* WEIGHT CHART */}
              {activeChartMetric === "weight" && (
                <>
                  {weightDataForChart.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-black/20">
                      <Scale className="w-8 h-8 text-[#8E8E93] mb-2" />
                      <p className="text-sm font-semibold text-white">Nessuna pesata registrata</p>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          onUpdateWeight();
                        }}
                        className="mt-3 px-4 py-2 bg-[#FF9F0A] text-black font-bold rounded-xl text-xs hover:brightness-105 transition-all"
                      >
                        Registra il tuo peso iniziale
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={weightDataForChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="weightGradientPill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF9F0A" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#FF9F0A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                        <XAxis dataKey="name" stroke="#8E8E93" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#8E8E93" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 3", "dataMax + 3"]} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#1C1C1E",
                            borderColor: "rgba(255,255,255,0.12)",
                            borderRadius: "16px",
                            color: "#FFFFFF",
                          }}
                          itemStyle={{ color: "#FF9F0A" }}
                        />
                        <Area type="monotone" dataKey="weight" name="Peso Corporeo" stroke="#FF9F0A" strokeWidth={2.5} fillOpacity={1} fill="url(#weightGradientPill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: STORICO (Dedicated Workout History Log) */}
      {activeSection === "history" && (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-4 w-full"
        >
          {/* Search & Counter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Cerca per nome scheda o esercizio..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-[#8E8E93] focus:ring-1 focus:ring-[#30D158] focus:border-[#30D158] outline-none transition-all shadow-sm"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setHistorySearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-[#8E8E93] px-3 py-2 bg-black/40 rounded-xl border border-white/5 self-end sm:self-auto shrink-0">
              {filteredHistoryLogs.length} di {workoutLogs.length} sessioni
            </div>
          </div>

          {/* Logs List */}
          {workoutLogs.length === 0 ? (
            <div
              data-testid="progress-logs-empty-state"
              className="py-16 px-6 text-center border border-white/10 rounded-3xl bg-[#121418]/80 flex flex-col items-center justify-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                <Calendar className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-white">
                {t("no_data_yet") || "Nessun allenamento registrato"}
              </p>
              <p className="text-xs text-[#8E8E93] max-w-xs">
                {t("start_first_workout_desc") || "Completa il tuo primo allenamento per visualizzare lo storico dettagliato delle sessioni."}
              </p>
            </div>
          ) : filteredHistoryLogs.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2 border border-white/10 rounded-2xl bg-[#1C1C1E]/40">
              <Search className="w-8 h-8 text-[#8E8E93] opacity-40 mb-1" />
              <p className="text-white text-sm font-semibold">Nessuna sessione trovata</p>
              <p className="text-xs text-[#8E8E93]">Nessun allenamento corrisponde a "{historySearch}"</p>
              <button
                type="button"
                onClick={() => setHistorySearch("")}
                className="mt-2 text-xs text-[#30D158] font-bold hover:underline"
              >
                Reimposta filtro
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredHistoryLogs.slice(0, 10).map((log) => {
                const logId = log.id || String(getLogDate(log).getTime());
                const date = getLogDate(log);
                const dateStr = date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const isExpanded = !!expandedLogIds[logId];

                const validExercises = (log.exercises || [])
                  .map((ex: any) => ({
                    ...ex,
                    completedSets: (ex.sets || []).filter(
                      (s: any) => s.completed === true || (s.completed === undefined && (s.weight || s.reps))
                    ),
                  }))
                  .filter((ex: any) => ex.completedSets.length > 0 || (ex.sets && ex.sets.length > 0));

                const totalCompletedSetsInLog = (log.exercises || []).reduce(
                  (sum: number, ex: any) => {
                    const completed = (ex.sets || []).filter(
                      (s: any) => s.completed === true || (s.completed === undefined && (s.weight || s.reps))
                    );
                    return sum + (completed.length > 0 ? completed.length : (ex.sets || []).length);
                  },
                  0
                );

                let logVolume = 0;
                (log.exercises || []).forEach((ex: any) => {
                  (ex.sets || []).forEach((s: any) => {
                    const isComp = s.completed === true || (s.completed === undefined && (s.weight || s.reps));
                    if (isComp && s.weight && s.reps) {
                      logVolume += Number(s.weight) * Number(s.reps);
                    }
                  });
                });

                const volumeFormatted =
                  logVolume >= 1000
                    ? `${(logVolume / 1000).toFixed(1)}k ${unit.toLowerCase()}`
                    : `${logVolume} ${unit.toLowerCase()}`;

                const durationFormatted = getWorkoutLogDurationMinutes(log.duration);

                return (
                  <div
                    key={logId}
                    className="apple-glass-card rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer border border-white/8 shadow-sm"
                    onClick={() => {
                      triggerHaptic("light");
                      setExpandedLogIds((prev) => ({
                        ...prev,
                        [logId]: !prev[logId],
                      }));
                    }}
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-white tracking-tight truncate">
                          {log.routineName || log.name || "Workout"}
                        </h3>
                        <p className="text-xs text-[#8E8E93] flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-white/80">{dateStr}</span>
                          <span>•</span>
                          <span>{durationFormatted} min</span>
                          <span>•</span>
                          <span>{totalCompletedSetsInLog} serie</span>
                          <span>•</span>
                          <span className="text-[#30D158] font-bold">{volumeFormatted}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onDeleteWorkoutLog && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("warning");
                              setPendingDeleteLogId(logId);
                            }}
                            className="p-2 rounded-xl text-[#8E8E93] hover:text-[#FF453A] hover:bg-white/5 transition-colors cursor-pointer"
                            title="Elimina allenamento"
                            aria-label="Elimina allenamento"
                          >
                            <Trash2 className="w-4 h-4 text-[#FF453A]" />
                          </button>
                        )}
                        <div className="p-1 text-[#8E8E93]">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-white" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && validExercises.length > 0 && (
                      <div className="p-4 border-t border-white/5 bg-black/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {validExercises.map((ex: any, exIdx: number) => {
                          const setsToRender = ex.completedSets.length > 0 ? ex.completedSets : (ex.sets || []);
                          return (
                            <div
                              key={exIdx}
                              className="bg-white/5 p-3 rounded-xl border border-white/6 text-xs"
                            >
                              <p className="font-bold text-white truncate mb-1.5">
                                {t(ex.title)}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {setsToRender.map((set: any, setIdx: number) => (
                                  <span
                                    key={setIdx}
                                    className="bg-black/60 text-[#30D158] font-semibold px-2 py-0.5 rounded-md text-[11px] tabular-nums border border-[#30D158]/20"
                                  >
                                    {set.weight !== undefined && set.weight !== "" ? `${set.weight}${unit}` : ""}
                                    {set.reps !== undefined && set.reps !== "" ? ` × ${set.reps}` : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {sortedLogsDescending.length > 10 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsFullHistoryOpen(true);
                  }}
                  className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2 shadow-sm"
                >
                  <Calendar className="w-4 h-4 text-[#30D158]" />
                  {t("view_full_workout_history")
                    ? `${t("view_full_workout_history")} (${workoutLogs.length})`
                    : `Vedi tutto lo storico allenamenti (${workoutLogs.length})`}
                </button>
              )}
            </div>
          )}

          <FullWorkoutHistoryModal
            isOpen={isFullHistoryOpen}
            onClose={() => setIsFullHistoryOpen(false)}
            workoutLogs={workoutLogs}
            unit={unit}
            t={t}
            onDeleteWorkoutLog={onDeleteWorkoutLog}
          />
        </motion.div>
      )}

      {/* Delete confirmation modal */}
      {pendingDeleteLogId && onDeleteWorkoutLog && (
        <ConfirmModal
          message={t("delete_log_confirm") || "Eliminare questa sessione dallo storico?"}
          confirmLabel={t("delete_log_btn") || "Elimina Sessione"}
          cancelLabel={t("cancel") || "Annulla"}
          destructive
          onConfirm={() => {
            onDeleteWorkoutLog(pendingDeleteLogId);
            setPendingDeleteLogId(null);
          }}
          onCancel={() => setPendingDeleteLogId(null)}
        />
      )}

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        workoutLogs={workoutLogs}
        unit={unit}
        t={t}
      />

      {/* Lift Picker Modal */}
      {isLiftPickerOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl max-h-[85vh] overflow-hidden"
          >
            <div className="p-5 border-b border-white/10 flex flex-col gap-3.5 bg-[#1C1C1E]">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-white tracking-tight">
                  {pickerTarget.startsWith("record-") ? "Scegli Esercizio Record" : "Seleziona Esercizio"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsLiftPickerOpen(false);
                    setLiftSearch("");
                    setLiftCategory("All");
                  }}
                  aria-label="Chiudi selettore"
                  className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-white/10 hover:bg-white/15 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Cerca esercizio..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-[#8E8E93] focus:ring-1 focus:ring-[#30D158] focus:border-[#30D158] outline-none transition-all"
                  value={liftSearch}
                  onChange={(e) => setLiftSearch(e.target.value)}
                  autoFocus
                />
                {liftSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setLiftSearch("");
                    }}
                    aria-label="Cancella ricerca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ExerciseFilterBar
                selectedCategory={liftCategory}
                onSelectCategory={setLiftCategory}
                counts={pickerCategoryCounts}
                t={t}
              />
            </div>

            <div className="p-3.5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
                {filteredPickerExercises.map((ex) => {
                  const isSelected =
                    (pickerTarget === "best"
                      ? bestLiftExId
                      : pickerTarget.startsWith("record-")
                      ? recordExerciseIds[Number(pickerTarget.replace("record-", ""))]
                      : strengthLiftExId) === ex.id;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => {
                        triggerHaptic("light");
                        if (pickerTarget === "best") {
                          setBestLiftExId(ex.id);
                        } else if (pickerTarget.startsWith("record-")) {
                          const index = Number(pickerTarget.replace("record-", ""));
                          setRecordExerciseIds((prev) => {
                            const next = [...prev];
                            next[index] = ex.id;
                            const saved = next.slice(0, 3);
                            writeJsonAtomic("liftlab_pr_exercise_slots", saved);
                            return saved;
                          });
                        } else {
                          setStrengthLiftExId(ex.id);
                        }
                        setIsLiftPickerOpen(false);
                        setLiftSearch("");
                        setLiftCategory("All");
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative group overflow-hidden ${
                        isSelected
                          ? "border-[#30D158] bg-[#30D158]/10 ring-1 ring-[#30D158]"
                          : "border-white/6 hover:border-white/20 bg-black/40"
                      }`}
                    >
                      <ExerciseMuscleVisual
                        exercise={ex}
                        className="w-10 h-10 shrink-0 opacity-80 group-hover:opacity-100"
                      />
                      <div className="flex flex-col flex-1 min-w-0 pr-6">
                        <span
                          className={`font-bold text-sm truncate transition-colors ${
                            isSelected ? "text-[#30D158]" : "text-white"
                          }`}
                        >
                          {t(ex.title)}
                        </span>
                        <span className="text-[10px] text-[#8E8E93] uppercase tracking-wider truncate">
                          {ex.category}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {filteredPickerExercises.length === 0 && (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <Search className="w-10 h-10 text-[#8E8E93] opacity-30" />
                  <p className="text-[#8E8E93] text-sm">
                    {liftSearch
                      ? `Nessun esercizio trovato per "${liftSearch}"`
                      : "Nessun esercizio in questa categoria"}
                  </p>
                  {(liftSearch || liftCategory !== "All") && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setLiftSearch("");
                        setLiftCategory("All");
                      }}
                      className="text-xs text-[#30D158] hover:underline pt-1"
                    >
                      Reimposta filtri
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Unlocked Achievement Celebration Dialog */}
      <AnimatePresence>
        {unlockedCelebration && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-[#1C1C1E] border border-white/15 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center flex flex-col items-center shadow-2xl"
            >
              <div className="relative mb-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-[#30D158] blur-[1px]"
                    initial={{ x: (i - 3) * 25, y: 0, opacity: 0.8, scale: 0.5 }}
                    animate={{
                      y: [-10, -40, -10],
                      x: [(i - 3) * 25, (i - 3) * 30 + (i % 2 === 0 ? 10 : -10), (i - 3) * 25],
                      opacity: [0.3, 0.9, 0.3],
                      scale: [0.6, 1.2, 0.6],
                    }}
                    transition={{
                      duration: 2 + (i % 3) * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  />
                ))}
                <div className="p-4 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40 shadow-[0_0_25px_rgba(48,209,88,0.4)]">
                  {React.createElement(unlockedCelebration.icon || Trophy, {
                    className: "w-12 h-12 text-[#30D158]",
                  })}
                </div>
              </div>

              <span className="text-xs font-bold tracking-wider text-[#30D158] uppercase mb-1">
                TRAGUARDO SBLOCCATO!
              </span>

              <h3 className="text-xl font-extrabold text-white mb-1">
                {unlockedCelebration.title}
              </h3>

              {unlockedCelebration.level && (
                <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                  {unlockedCelebration.level}
                </span>
              )}

              <p className="text-xs text-[#8E8E93] mb-6 leading-relaxed">
                {unlockedCelebration.description}
              </p>

              <button
                onClick={() => {
                  triggerHaptic("success");
                  handleClaimCelebration();
                }}
                className="w-full py-3.5 bg-[#30D158] hover:brightness-105 active:scale-95 text-black font-bold rounded-full uppercase tracking-wider text-sm transition-all shadow-[0_8px_20px_rgba(48,209,88,0.25)] cursor-pointer"
              >
                Fantastico!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
