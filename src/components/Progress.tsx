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
  CheckCircle,
  Medal,
  BarChart2,
  LineChart as LucideLineChart,
  Search,
  Trash2,
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
import { triggerHaptic } from "../lib/haptics";
import { AchievementsModal } from "./common/AchievementsModal";
import { ConfirmModal } from "./common/ConfirmModal";
import { FullWorkoutHistoryModal } from "./common/FullWorkoutHistoryModal";
import {
  buildPersonalRecords,
  buildPersonalRecordSlots,
  calculateOneRepMax,
  getWorkoutLogDurationMinutes,
  isTimedExercise,
} from "../lib/workoutUtils";
import { ACHIEVEMENTS, type Achievement } from "../lib/achievements";
import { writeJsonAtomic } from "../lib/storage";
import type { ExerciseData } from "../types/workout";

const getLogDate = (log: any) => {
  if (!log || !log.date) return new Date();
  if (typeof log.date.toDate === "function") return log.date.toDate();
  return new Date(log.date);
};

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
  const [timeframe, setTimeframe] = useState("Monthly");
  const [chartMetric, setChartMetric] = useState<"max" | "1rm" | "both">("both");
  const [strengthLiftExId, setStrengthLiftExId] = useState<string>("e_sq"); // Default to Squat
  const [bestLiftExId, setBestLiftExId] = useState<string>("e_dl"); // Default to Deadlift
  const [isLiftPickerOpen, setIsLiftPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"best" | "strength" | `record-${number}`>("best");
  const [liftSearch, setLiftSearch] = useState("");
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
      if (!isLiftPickerOpen) return;
      event.preventDefault();
      setIsLiftPickerOpen(false);
      setLiftSearch("");
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [isLiftPickerOpen, pendingDeleteLogId, isFullHistoryOpen]);

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
      writeJsonAtomic(
        "liftlab_unlocked_achievements",
        currentUnlockedIds
      );
    } catch (e) {
      console.error("Failed to save liftlab_unlocked_achievements", e);
    }
    setUnlockedCelebration(null);
  };

  const safeExercises = exercises || [];

  const bestLiftEx =
    safeExercises.find((ex) => ex.id === bestLiftExId) || safeExercises[0];

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

  const strengthLiftEx =
    safeExercises.find((ex) => ex.id === strengthLiftExId) || safeExercises[0];

  const getProgressData = () => {
    return sortedLogs.map((log, i) => {
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
        name: dateStr || `Workout ${i + 1}`,
        liftWeight: liftWeight || null,
        estimated1RM: estimated1RM || null,
      };
    });
  };

  const getVolumeData = () => {
    return sortedLogs.map((log, i) => {
      const date = getLogDate(log);
      const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      let volume = 0;
      log.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight && s.reps) volume += s.weight * s.reps;
        });
      });
      return { name: dateStr || `Workout ${i + 1}`, volume };
    });
  };

  const getMuscleVolumeData = () => {
    const volumes: Record<string, number> = {};
    sortedLogs.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        const cat = ex.category || safeExercises.find((e: any) => e.title?.trim().toLowerCase() === ex.title?.trim().toLowerCase())?.category || "Strength";
        if (cat === "Cardio") return;
        let vol = 0;
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight && s.reps) {
            vol += Number(s.weight) * Number(s.reps);
          }
        });
        if (vol > 0) {
          volumes[cat] = (volumes[cat] || 0) + vol;
        }
      });
    });
    return Object.entries(volumes).map(([name, volume]) => ({ name, volume }));
  };

  const getWeightData = () => {
    return [...weightLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((log) => ({
        name: new Date(log.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        weight: log.weight,
      }));
  };

  const progressData = useMemo(() => getProgressData(), [sortedLogs, strengthLiftExId, strengthLiftEx]);
  const volumeData = useMemo(() => getVolumeData(), [sortedLogs]);
  const weightDataForChart = useMemo(() => getWeightData(), [weightLogs]);
  const personalRecords = useMemo(
    () => buildPersonalRecords(workoutLogs, oneRepMaxFormula),
    [workoutLogs, oneRepMaxFormula],
  );

  const getWorkoutsCount = () => {
    return workoutLogs.length.toString();
  };

  const getTotalVolumeNum = () => {
    let vol = 0;
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
        });
      });
    });
    return vol;
  };

  const personalRecordSlots = useMemo(
    () => buildPersonalRecordSlots(personalRecords, recordExerciseIds, safeExercises, 3),
    [personalRecords, recordExerciseIds, safeExercises],
  );

  const sortedExercisesForPicker = useMemo(() => {
    const recordTitles = new Set(personalRecords.map((r) => (r.title || "").trim().toLowerCase()));
    const withRecords = safeExercises.filter((ex) => recordTitles.has((ex.title || "").trim().toLowerCase()));
    const withoutRecords = safeExercises.filter((ex) => !recordTitles.has((ex.title || "").trim().toLowerCase()));
    const sortByTitle = (a: any, b: any) => t(a.title).localeCompare(t(b.title));
    return [...withRecords.sort(sortByTitle), ...withoutRecords.sort(sortByTitle)];
  }, [safeExercises, personalRecords, t]);

  const getTotalVolume = () => {
    const vol = getTotalVolumeNum();
    if (vol >= 1000) return (vol / 1000).toFixed(1) + "k";
    return (Math.round(vol * 10) / 10).toString();
  };

  const getVolumeLabel = () => {
    return t("total_volume") || "Total Volume";
  };

  const getWorkoutStatus = () => {
    return t("workouts_logged") || "Workouts Logged";
  };

  const totalLoggedSets = workoutLogs.reduce((sum, log) => {
    return sum + (log.exercises || []).reduce((exerciseSum: number, ex: any) => {
      return exerciseSum + (ex.sets || []).filter((set: any) => set.completed).length;
    }, 0);
  }, 0);

  let bestLiftMax = 0;
  const bestLiftTitle = bestLiftEx?.title?.trim().toLowerCase();
  const bestLiftId = bestLiftEx?.id;

  workoutLogs.forEach((log) => {
    log.exercises?.forEach((ex: any) => {
      const exTitle = ex.title?.trim().toLowerCase();
      const exId = ex.id;
      const matches =
        (bestLiftId && (exId === bestLiftId || ex.exerciseId === bestLiftId)) ||
        (exTitle && bestLiftTitle && (exTitle === bestLiftTitle || exTitle.includes(bestLiftTitle) || bestLiftTitle.includes(exTitle)));

      if (matches) {
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight !== "" && s.weight !== undefined && s.weight !== null) {
            const w = Number(s.weight);
            if (Number.isFinite(w) && w > bestLiftMax) {
              bestLiftMax = w;
            }
          }
        });
      }
    });
  });

  if (bestLiftMax === 0 && bestLiftEx) {
    bestLiftMax = Number(bestLiftEx.prWeight || bestLiftEx.oneRepMax || 0);
  }

  return (
    <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg w-full">
      <TabHero
        eyebrow="Progress"
        title={t("progress")}
        subtitle="Track your gains, refine your strategy."
        icon={<LucideLineChart className="w-7 h-7" />}
        onOpenSettings={() => navigateTo("settings")}
        metric={
          <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
            {totalLoggedSets} sets
          </span>
        }
        action={
          <div className="flex p-1 bg-white/6 backdrop-blur-xl rounded-full border border-white/10">
            {["Monthly", "Yearly", "All Time"].map((frame) => (
              <button
                key={frame}
                onClick={() => {
                  triggerHaptic("light");
                  setTimeframe(frame);
                }}
                className={`flex-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  timeframe === frame
                    ? "bg-[#30D158] text-black shadow-sm"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                {frame}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary Stats Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat Card 1 - Best Lift (Customizable) */}
        <div
          onClick={() => {
            triggerHaptic("light");
            setPickerTarget("best");
            setIsLiftPickerOpen(true);
          }}
          className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-white/18 transition-all cursor-pointer active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between text-[#8E8E93] mb-3">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-[#30D158]" strokeWidth={2} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("best_lift")}</span>
            </div>
            <SettingsIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
              {Math.round(bestLiftMax)}
              <span className="text-xs text-[#8E8E93] ml-1 font-medium">
                {unit.toLowerCase()}
              </span>
            </div>
            <div className="text-xs text-[#30D158] font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />{" "}
              <span className="truncate">{bestLiftEx?.title || "Lift"}</span>
            </div>
          </div>
        </div>

        {/* Stat Card 2 - Workouts */}
        <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-1.5 text-[#8E8E93] mb-3">
            <Calendar className="w-4 h-4 text-[#0A84FF]" strokeWidth={2} />
            <span className="text-[11px] font-bold uppercase tracking-wider">{t("workouts")}</span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
              {getWorkoutsCount()}
            </div>
            <div className="text-xs text-[#0A84FF] font-semibold mt-1 flex items-center gap-1">
              <ChevronUp className="w-3.5 h-3.5" /> {getWorkoutStatus()}
            </div>
          </div>
        </div>

        {/* Stat Card 3 - Weight */}
        <div
          onClick={() => {
            triggerHaptic("light");
            onUpdateWeight();
          }}
          className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden hover:border-white/18 transition-all cursor-pointer active:scale-95 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between text-[#8E8E93] mb-3">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#FF9F0A]" strokeWidth={2} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("current_weight") || "Current Weight"}</span>
            </div>
            <SettingsIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
              {typeof userData?.currentWeight === "number"
                ? Number(userData.currentWeight.toFixed(1))
                : userData?.currentWeight || 0}
              <span className="text-xs text-[#8E8E93] ml-1 font-medium">
                {unit.toLowerCase()}
              </span>
            </div>
            <div className="text-xs text-[#FF9F0A] font-semibold mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> {t("keep_tracking") || "Keep Tracking!"}
            </div>
          </div>
        </div>

        {/* Stat Card 4 - Volume */}
        <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-1.5 text-[#8E8E93] mb-3">
            <Zap className="w-4 h-4 text-[#BF5AF2]" strokeWidth={2} />
            <span className="text-[11px] font-bold uppercase tracking-wider">{t("total_volume")}</span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-tight">
              {getTotalVolume()}
              <span className="text-xs text-[#8E8E93] ml-1 font-medium">
                {unit.toLowerCase()}
              </span>
            </div>
            <div className="text-xs text-[#BF5AF2] font-semibold mt-1 flex items-center gap-1">
              {getVolumeLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Records Bento */}
      <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FF9F0A]" />
              Personal Records
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Choose 3 exercises to track from local workout history.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {personalRecordSlots.map(({ exercise, record }, index) => (
            <button
              key={exercise?.id || index}
              onClick={() => {
                triggerHaptic("light");
                setPickerTarget(`record-${index}`);
                setIsLiftPickerOpen(true);
              }}
              className="bg-black/40 border border-white/6 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate group-hover:text-[#30D158] transition-colors">
                  {exercise ? t(exercise.title) : `Exercise ${index + 1}`}
                </p>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  {record
                    ? `Best set ${record.bestWeight} ${unit} × ${record.bestReps}`
                    : "Tap to choose an exercise"}
                </p>
              </div>
              <div className="flex items-end justify-between gap-3 pt-1 border-t border-white/5">
                <div className="text-[11px] font-semibold text-[#8E8E93] flex items-center gap-1 group-hover:text-white transition-colors">
                  <Edit2 className="w-3 h-3 text-[#30D158]" />
                  Edit
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
                  {pickerTarget.startsWith("record-") ? "Choose Record Exercise" : "Track Personal Record"}
                </h3>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setIsLiftPickerOpen(false);
                    setLiftSearch("");
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/15 rounded-full text-[#8E8E93] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#8E8E93] focus:ring-1 focus:ring-[#30D158] focus:border-[#30D158] outline-none transition-all"
                  value={liftSearch}
                  onChange={(e) => setLiftSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="p-3.5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
                {sortedExercisesForPicker
                  .filter(
                    (ex) =>
                      (t(ex.title) || "")
                        .toLowerCase()
                        .includes(liftSearch.toLowerCase()) ||
                      (ex.category || "")
                        .toLowerCase()
                        .includes(liftSearch.toLowerCase()) ||
                      (ex.equipment || "")
                        .toLowerCase()
                        .includes(liftSearch.toLowerCase()),
                  )
                  .map((ex) => {
                    const isSelected = (pickerTarget === "best"
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
              {sortedExercisesForPicker.filter(
                (ex) =>
                  (t(ex.title) || "")
                    .toLowerCase()
                    .includes(liftSearch.toLowerCase()) ||
                  (ex.category || "")
                    .toLowerCase()
                    .includes(liftSearch.toLowerCase()) ||
                  (ex.equipment || "")
                    .toLowerCase()
                    .includes(liftSearch.toLowerCase()),
              ).length === 0 && (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <Search className="w-10 h-10 text-[#8E8E93] opacity-30" />
                  <p className="text-[#8E8E93] text-sm">
                    No exercises found for "{liftSearch}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Chart Area - Strength Progression */}
      <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {t("strength_progression")}
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5 capitalize">
              {t(strengthLiftEx?.title || "Exercise")} vs Time
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex p-0.5 bg-black/40 rounded-full border border-white/10 text-xs">
              {(["max", "1rm", "both"] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => {
                    triggerHaptic("light");
                    setChartMetric(metric);
                  }}
                  className={`border-none px-3.5 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-150 ${
                    chartMetric === metric
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white bg-transparent"
                  }`}
                >
                  {metric === "max" ? "Max" : metric === "1rm" ? "1RM" : "Both"}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                setPickerTarget("strength");
                setIsLiftPickerOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 border border-white/10 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors text-xs font-semibold cursor-pointer"
            >
              {t(strengthLiftEx?.title || "Select Exercise")}
              <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" />
            </button>
          </div>
        </div>

        <div className="w-full h-64 md:h-80 relative text-xs min-w-0 min-h-0">
          {progressData.length === 0 || !progressData.some((p) => p.liftWeight || p.estimated1RM) ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-black/20">
              <LucideLineChart className="w-8 h-8 text-[#8E8E93] mb-2" />
              <p className="text-sm font-semibold text-white">{t("no_data_yet") || "Nessun dato registrato"}</p>
              <p className="text-xs text-[#8E8E93] mt-1 max-w-xs">
                {t("start_first_workout_desc") || "Completa il tuo primo allenamento per visualizzare la progressione dei carichi nel tempo."}
              </p>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <AreaChart
                data={progressData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#30D158" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2C2C2E"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#8E8E93"
                  tick={{ fill: "#8E8E93", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#8E8E93"
                  tick={{ fill: "#8E8E93", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1C1C1E",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#30D158" }}
                />
                {(chartMetric === "max" || chartMetric === "both") && (
                  <Area
                    type="monotone"
                    dataKey="liftWeight"
                    name="Max Weight"
                    stroke="#30D158"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    connectNulls
                  />
                )}
                {(chartMetric === "1rm" || chartMetric === "both") && (
                  <Area
                    type="monotone"
                    dataKey="estimated1RM"
                    name="Estimated 1RM"
                    stroke="#0A84FF"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#color1RM)"
                    connectNulls
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Volume Trend */}
        <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 sm:p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold text-white text-sm mb-0.5">
            {t("volume_trend")}
          </h3>
          <p className="text-xs text-[#8E8E93] mb-4">
            Total {unit.toLowerCase()} moved per week
          </p>

          <div className="flex-1 min-h-[160px] relative text-[10px] min-w-0">
            {volumeData.length === 0 || !volumeData.some((v) => v.volume > 0) ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl">
                <p className="text-xs text-[#8E8E93]">{t("no_volume_yet") || "Nessun volume registrato finora."}</p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <BarChart
                  data={volumeData}
                  margin={{ top: 0, right: 15, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#8E8E93"
                    tick={{ fill: "#8E8E93", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1C1C1E",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "#FFFFFF",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    itemStyle={{ color: "#30D158" }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#30D158"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Muscle Volume Breakdown */}
        <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 sm:p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold text-white text-sm mb-0.5">
            Muscle Volume Breakdown
          </h3>
          <p className="text-xs text-[#8E8E93] mb-4">
            Total load moved per muscle group ({unit.toLowerCase()})
          </p>

          <div className="flex-1 flex flex-col gap-3 justify-center">
            {(() => {
              const muscleData = getMuscleVolumeData();
              if (muscleData.length === 0) {
                return (
                  <div className="text-center text-xs text-[#8E8E93] py-8">
                    No volume data recorded yet.
                  </div>
                );
              }
              const maxVol = Math.max(...muscleData.map((d) => d.volume));
              return muscleData
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 5) // Show top 5
                .map((item) => {
                  const percent = maxVol > 0 ? (item.volume / maxVol) * 100 : 0;
                  return (
                    <div key={item.name} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white">{t(item.name.toLowerCase()) || item.name}</span>
                        <span className="text-[#30D158] font-bold tabular-nums">
                          {item.volume >= 1000
                            ? (item.volume / 1000).toFixed(1) + "k"
                            : item.volume}{" "}
                          {unit.toLowerCase()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#30D158] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>

        {/* Body Composition / Weight */}
        <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 sm:p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-start mb-0.5">
            <div>
              <h3 className="font-bold text-white text-sm">
                {t("body_weight_tracker")}
              </h3>
              <p className="text-xs text-[#8E8E93] mb-4">
                Moving average over 30 days
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                onUpdateWeight();
              }}
              className="text-xs text-[#30D158] font-bold hover:underline cursor-pointer"
            >
              + {t("morning_weigh_in") || "Registra"}
            </button>
          </div>

          <div className="flex-1 min-h-[160px] relative text-[10px] min-w-0">
            {weightDataForChart.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl">
                <p className="text-xs text-[#8E8E93]">{t("no_weight_yet") || "Nessun dato sul peso registrato."}</p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <AreaChart
                  data={weightDataForChart}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9F0A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF9F0A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2C2C2E"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#8E8E93"
                  tick={{ fill: "#8E8E93", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#8E8E93"
                  tick={{ fill: "#8E8E93", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1C1C1E",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#FFFFFF",
                  }}
                  itemStyle={{ color: "#FF9F0A" }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#FF9F0A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#weightGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Workout History List */}
      <div className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#30D158]" />
              Workout History
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Completed workout sessions ({workoutLogs.length})
            </p>
          </div>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="py-8 text-center text-[#8E8E93] text-sm">
            No completed workout logs found.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sortedLogsDescending.slice(0, 5).map((log) => {
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
                  className="bg-black/40 border border-white/6 rounded-2xl overflow-hidden hover:border-white/18 transition-all cursor-pointer"
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
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{durationFormatted} min</span>
                        <span>•</span>
                        <span>{totalCompletedSetsInLog} sets</span>
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
                          title="Delete workout log"
                          aria-label="Delete workout log"
                        >
                          <Trash2 className="w-4 h-4 text-[#FF453A]" />
                        </button>
                      )}
                      <div className="p-1 text-[#8E8E93]">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && validExercises.length > 0 && (
                    <div className="p-4 border-t border-white/5 bg-black/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                                  className="bg-black/50 text-[#30D158] font-semibold px-2 py-0.5 rounded-md text-[11px] tabular-nums"
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

            {sortedLogsDescending.length > 5 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setIsFullHistoryOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-1"
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
      </div>

      {pendingDeleteLogId && onDeleteWorkoutLog && (
        <ConfirmModal
          message="Are you sure you want to delete this workout log from your history?"
          confirmLabel={t("delete") || "Delete"}
          cancelLabel={t("cancel") || "Cancel"}
          destructive
          onConfirm={() => {
            onDeleteWorkoutLog(pendingDeleteLogId);
            setPendingDeleteLogId(null);
          }}
          onCancel={() => setPendingDeleteLogId(null)}
        />
      )}

      {/* Achievements Summary Card */}
      <div
        onClick={() => {
          triggerHaptic("light");
          setIsAchievementsOpen(true);
        }}
        className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 md:p-6 hover:border-white/18 transition-all cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#FF9F0A]/15 rounded-2xl text-[#FF9F0A] group-hover:scale-105 transition-transform shrink-0">
            <Medal className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🏆 {unlockedAchievements.length} / {ACHIEVEMENTS.length} Achievements Unlocked</span>
            </h2>
            <p className="text-xs md:text-sm text-[#8E8E93] mt-0.5">
              Tap to view legacy badges & milestones
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
                    className="p-2 rounded-xl bg-black/40 border border-white/10 text-[#FF9F0A] shadow-sm"
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

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        workoutLogs={workoutLogs}
        unit={unit}
        t={t}
      />

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
                    className:
                      "w-12 h-12 text-[#30D158]",
                  })}
                </div>
              </div>

              <span className="text-xs font-bold tracking-wider text-[#30D158] uppercase mb-1">
                ACHIEVEMENT UNLOCKED!
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
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
