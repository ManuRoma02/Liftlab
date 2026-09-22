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

  if (workoutLogs.length === 0) {
    return (
      <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col items-center justify-center w-full min-h-[50vh] text-center">
        <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center text-primary-fixed mb-6">
          <TrendingUp className="w-12 h-12" />
        </div>
        <h2 className="text-headline-md font-bold text-on-background mb-2">
          No Progress Recorded
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-sm">
          Start your first workout to begin tracking your gains, body weight,
          and strength improvements.
        </p>
        <button
          onClick={() => navigateTo("workout")}
          className="mt-8 bg-primary-fixed text-[#000000] text-label-bold px-10 py-3.5 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-[0_8px_16px_rgba(195,244,0,0.15)] uppercase"
        >
          {t("start_first_workout")}
        </button>
      </main>
    );
  }

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
        const cat = ex.category || exercises.find((e: any) => e.title?.trim().toLowerCase() === ex.title?.trim().toLowerCase())?.category || "Strength";
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
          <span className="hidden sm:inline-flex text-xs font-black uppercase tracking-widest text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/20 rounded-full px-3 py-2">
            {totalLoggedSets} sets
          </span>
        }
        action={
          <div className="flex p-1 bg-black/30 rounded-lg border border-white/10">
            {["Monthly", "Yearly", "All Time"].map((frame) => (
              <button
                key={frame}
                onClick={() => setTimeframe(frame)}
                className={`flex-1 px-3 py-2 rounded-md text-label-bold transition-colors ${timeframe === frame ? "bg-primary-container text-on-primary-container shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
              >
                {frame}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary Stats Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {/* Stat Card 1 - Best Lift (Customizable) */}
        <div
          onClick={() => {
            setPickerTarget("best");
            setIsLiftPickerOpen(true);
          }}
          className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col justify-between relative overflow-hidden group hover:border-primary-container transition-all cursor-pointer active:scale-95"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container opacity-5 blur-xl rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity"></div>
          <div className="flex items-center justify-between text-on-surface-variant mb-stack-md">
            <div className="flex items-center gap-stack-sm">
              <Dumbbell className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="text-label-bold">{t("best_lift")}</span>
            </div>
            <SettingsIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-[40px] leading-[48px] font-black font-[var(--font-stats-xl)] text-primary tracking-tight">
              {Math.round(bestLiftMax)}
              <span className="text-body-md text-on-surface-variant ml-1 font-normal">
                {unit.toLowerCase()}
              </span>
            </div>
            <div className="text-sm text-surface-tint mt-1 flex items-center gap-1 font-[var(--font-body-md)]">
              <TrendingUp className="w-[14px] h-[14px]" />{" "}
              {bestLiftEx?.title || "Lift"}
            </div>
          </div>
        </div>

        {/* Stat Card 2 - Workouts */}
        <div className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col justify-between relative overflow-hidden hover:border-outline transition-colors">
          <div className="flex items-center gap-stack-sm text-on-surface-variant mb-stack-md">
            <Calendar className="w-[18px] h-[18px]" strokeWidth={2} />
            <span className="text-label-bold">{t("workouts")}</span>
          </div>
          <div>
            <div className="text-[40px] leading-[48px] font-black font-[var(--font-stats-xl)] text-primary tracking-tight">
              {getWorkoutsCount()}
            </div>
            <div className="text-sm text-surface-tint mt-1 flex items-center gap-1 font-[var(--font-body-md)]">
              <ChevronUp className="w-[14px] h-[14px]" /> {getWorkoutStatus()}
            </div>
          </div>
        </div>

        {/* Stat Card 3 - Weight */}
        <div
          onClick={onUpdateWeight}
          className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col justify-between relative overflow-hidden hover:border-primary-container transition-all cursor-pointer active:scale-95 group"
        >
          <div className="flex items-center justify-between text-on-surface-variant mb-stack-md">
            <div className="flex items-center gap-stack-sm">
              <Scale className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="text-label-bold">{t("current_weight") || "Current Weight"}</span>
            </div>
            <SettingsIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-[40px] leading-[48px] font-black font-[var(--font-stats-xl)] text-primary tracking-tight">
              {typeof userData?.currentWeight === "number"
                ? Number(userData.currentWeight.toFixed(1))
                : userData?.currentWeight || 0}
              <span className="text-body-md text-on-surface-variant ml-1 font-normal">
                {unit.toLowerCase()}
              </span>
            </div>
            <div className="text-sm text-secondary mt-1 flex items-center gap-1 font-[var(--font-body-md)]">
              <TrendingDown className="w-[14px] h-[14px]" /> {t("keep_tracking") || "Keep Tracking!"}
            </div>
          </div>
        </div>

        {/* Stat Card 4 - Volume */}
        <div className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col justify-between relative overflow-hidden hover:border-outline transition-colors">
          <div className="flex items-center gap-stack-sm text-on-surface-variant mb-stack-md">
            <Zap className="w-[18px] h-[18px]" strokeWidth={2} />
            <span className="text-label-bold">{t("total_volume")}</span>
          </div>
          <div>
            <div className="text-[40px] leading-[48px] font-black font-[var(--font-stats-xl)] text-primary tracking-tight">
              {getTotalVolume()}
              <span className="text-body-md text-on-surface-variant ml-1 font-normal">
                {unit.toLowerCase()}
              </span>
            </div>
            <div className="text-sm text-on-surface-variant mt-1 flex items-center gap-1 font-[var(--font-body-md)]">
              {getVolumeLabel()}
            </div>
          </div>
        </div>
      </div>

      <div className="premium-panel rounded-2xl p-stack-lg">
        <div className="flex items-center justify-between mb-stack-md">
          <div>
            <h2 className="text-headline-md text-primary tracking-tight">
              Personal Records
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Choose 3 exercises to track from local workout history.
            </p>
          </div>
          <Trophy className="w-6 h-6 text-primary-fixed" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {personalRecordSlots.map(({ exercise, record }, index) => (
            <button
              key={exercise?.id || index}
              onClick={() => {
                setPickerTarget(`record-${index}`);
                setIsLiftPickerOpen(true);
              }}
              className="bg-black/25 border border-white/10 rounded-xl p-4 flex flex-col gap-3 text-left hover:border-primary-fixed/60 hover:bg-white/5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="min-w-0">
                <p className="font-black text-primary uppercase tracking-wide truncate">
                  {exercise ? t(exercise.title) : `Exercise ${index + 1}`}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {record
                    ? `Best set ${record.bestWeight} ${unit} x ${record.bestReps}`
                    : "Tap to choose an exercise"}
                </p>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />
                  Edit
                </div>
                <div className="text-right shrink-0">
                  <p className="font-[var(--font-stats-xl)] text-3xl font-black text-primary-fixed leading-none">
                    {record?.estimatedOneRepMax || 0}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    est 1RM
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lift Picker Modal */}
      {isLiftPickerOpen && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface-container-high border border-surface-variant rounded-3xl w-full max-w-lg flex flex-col shadow-2xl max-h-[85vh] overflow-hidden"
          >
            <div className="p-6 border-b border-surface-variant flex flex-col gap-4 bg-surface">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-primary uppercase tracking-tight">
                  {pickerTarget.startsWith("record-") ? "Choose Record Exercise" : "Track Personal Record"}
                </h3>
                <button
                  onClick={() => {
                    setIsLiftPickerOpen(false);
                    setLiftSearch("");
                  }}
                  className="p-2 bg-surface-variant/30 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  className="w-full bg-surface-container border border-surface-variant rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={liftSearch}
                  onChange={(e) => setLiftSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
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
                  .map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
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
                        (pickerTarget === "best"
                          ? bestLiftExId
                          : pickerTarget.startsWith("record-")
                            ? recordExerciseIds[Number(pickerTarget.replace("record-", ""))]
                            : strengthLiftExId) === ex.id
                          ? "border-primary-fixed bg-primary-fixed/10 ring-1 ring-primary-fixed"
                          : "border-surface-variant/50 hover:border-primary-fixed/50 bg-black/40"
                      }`}
                    >
                      <ExerciseMuscleVisual
                        exercise={ex}
                        className="w-10 h-10 shrink-0 opacity-80 group-hover:opacity-100"
                      />
                      <div className="flex flex-col flex-1 min-w-0 pr-6">
                        <span
                          className={`font-bold text-sm truncate transition-colors ${
                            (pickerTarget === "best"
                              ? bestLiftExId
                              : pickerTarget.startsWith("record-")
                                ? recordExerciseIds[Number(pickerTarget.replace("record-", ""))]
                                : strengthLiftExId) === ex.id
                              ? "text-primary-fixed"
                              : "text-on-surface"
                          }`}
                        >
                          {t(ex.title)}
                        </span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest truncate">
                          {ex.category}
                        </span>
                      </div>
                      {(pickerTarget === "best"
                        ? bestLiftExId
                        : pickerTarget.startsWith("record-")
                          ? recordExerciseIds[Number(pickerTarget.replace("record-", ""))]
                          : strengthLiftExId) === ex.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-primary-fixed" />
                        </div>
                      )}
                    </button>
                  ))}
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
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <Search className="w-12 h-12 text-on-surface-variant opacity-20" />
                  <p className="text-on-surface-variant text-sm font-medium">
                    No exercises found for "{liftSearch}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Chart Area - Strength Progression */}
      <div className="bg-surface-container border border-surface-variant rounded-lg p-stack-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-stack-lg">
          <div>
            <h2 className="text-headline-md text-primary tracking-tight">
              {t("strength_progression")}
            </h2>
            <p className="text-body-md text-on-surface-variant capitalize">
              {t(strengthLiftEx?.title || "Exercise")} vs Time
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/10 text-xs">
              {(["max", "1rm", "both"] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setChartMetric(metric)}
                  className={`border-none px-3 py-1.5 rounded-md font-bold uppercase transition-all duration-150 ${
                    chartMetric === metric
                      ? "bg-primary-fixed text-[#000000] shadow-sm scale-105"
                      : "text-on-surface-variant hover:text-primary bg-transparent"
                  }`}
                >
                  {metric === "max" ? "Max" : metric === "1rm" ? "1RM" : "Both"}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setPickerTarget("strength");
                setIsLiftPickerOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-surface-variant rounded-lg bg-surface text-on-surface hover:text-primary hover:border-outline transition-colors text-label-bold cursor-pointer"
            >
              {t(strengthLiftEx?.title || "Select Exercise")}
              <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>

        <div className="w-full h-64 md:h-80 relative font-[var(--font-body-md)] text-xs min-w-0 min-h-0">
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
                  <stop offset="5%" stopColor="#c3f400" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#c3f400" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#adc6ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#adc6ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a2a2a"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                tick={{ fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#131313",
                  borderColor: "#2a2a2a",
                  borderRadius: "8px",
                  color: "#eaeaea",
                }}
                itemStyle={{ color: "#c3f400" }}
              />
              {(chartMetric === "max" || chartMetric === "both") && (
                <Area
                  type="monotone"
                  dataKey="liftWeight"
                  name="Max Weight"
                  stroke="#c3f400"
                  strokeWidth={3}
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
                  stroke="#adc6ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#color1RM)"
                  connectNulls
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Volume Trend */}
        <div className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col">
          <h3 className="text-label-bold text-primary mb-1">
            {t("volume_trend")}
          </h3>
          <p className="text-xs text-on-surface-variant mb-4 font-[var(--font-body-md)]">
            Total {unit.toLowerCase()} moved per week
          </p>

          <div className="flex-1 min-h-[160px] relative font-[var(--font-body-md)] text-[10px] min-w-0">
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
                  stroke="#71717a"
                  tick={{ fill: "#71717a" }}
                  axisLine={true}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#131313",
                    borderColor: "#2a2a2a",
                    borderRadius: "8px",
                    color: "#eaeaea",
                  }}
                  cursor={{ fill: "#2a2a2a", opacity: 0.4 }}
                  itemStyle={{ color: "#c3f400" }}
                />
                <Bar
                  dataKey="volume"
                  fill="#c3f400"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Muscle Volume Breakdown */}
        <div className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col">
          <h3 className="text-label-bold text-primary mb-1">
            Muscle Volume Breakdown
          </h3>
          <p className="text-xs text-on-surface-variant mb-4 font-[var(--font-body-md)]">
            Total load moved per muscle group ({unit.toLowerCase()})
          </p>

          <div className="flex-1 flex flex-col gap-3 justify-center">
            {(() => {
              const muscleData = getMuscleVolumeData();
              if (muscleData.length === 0) {
                return (
                  <div className="text-center text-xs text-on-surface-variant py-8">
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
                    <div key={item.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface">{t(item.name)}</span>
                        <span className="text-primary-fixed">
                          {item.volume >= 1000
                            ? (item.volume / 1000).toFixed(1) + "k"
                            : item.volume}{" "}
                          {unit.toLowerCase()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-fixed rounded-full"
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
        <div className="bg-surface-container border border-surface-variant rounded-lg p-stack-md flex flex-col">
          <h3 className="text-label-bold text-primary mb-1">
            {t("body_weight_tracker")}
          </h3>
          <p className="text-xs text-on-surface-variant mb-4 font-[var(--font-body-md)]">
            Moving average over 30 days
          </p>

          <div className="flex-1 min-h-[160px] relative font-[var(--font-body-md)] text-[10px] min-w-0">
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
                    <stop offset="5%" stopColor="#adc6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#adc6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2a2a"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  tick={{ fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#131313",
                    borderColor: "#2a2a2a",
                    borderRadius: "8px",
                    color: "#eaeaea",
                  }}
                  itemStyle={{ color: "#adc6ff" }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#adc6ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#weightGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workout History List */}
      <div className="bg-surface-container border border-surface-variant rounded-2xl p-stack-lg flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-headline-md text-primary tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-fixed" />
              Workout History
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Completed workout sessions ({workoutLogs.length})
            </p>
          </div>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant text-sm">
            No completed workout logs found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
                  className="bg-black/30 border border-surface-variant/60 rounded-xl overflow-hidden hover:border-primary-fixed/40 transition-all cursor-pointer"
                  onClick={() =>
                    setExpandedLogIds((prev) => ({
                      ...prev,
                      [logId]: !prev[logId],
                    }))
                  }
                >
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-primary uppercase tracking-wide truncate">
                        {log.routineName || log.name || "Workout"}
                      </h3>
                      <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-2 mt-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{durationFormatted} min</span>
                        <span>•</span>
                        <span>{totalCompletedSetsInLog} sets</span>
                        <span>•</span>
                        <span className="text-primary-fixed font-semibold">{volumeFormatted}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onDeleteWorkoutLog && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteLogId(logId);
                          }}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Delete workout log"
                          aria-label="Delete workout log"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                      <div className="p-1 text-on-surface-variant">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && validExercises.length > 0 && (
                    <div className="p-4 border-t border-surface-variant/40 bg-surface/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {validExercises.map((ex: any, exIdx: number) => {
                        const setsToRender = ex.completedSets.length > 0 ? ex.completedSets : (ex.sets || []);
                        return (
                          <div
                            key={exIdx}
                            className="bg-surface/50 p-2.5 rounded-lg border border-surface-variant/30 text-xs"
                          >
                            <p className="font-bold text-on-surface truncate mb-1">
                              {t(ex.title)}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {setsToRender.map((set: any, setIdx: number) => (
                                <span
                                  key={setIdx}
                                  className="bg-black/40 text-primary-fixed px-2 py-0.5 rounded text-[11px] font-mono"
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
                onClick={() => setIsFullHistoryOpen(true)}
                className="w-full py-3.5 px-4 bg-primary-fixed/10 hover:bg-primary-fixed/20 border border-primary-fixed/30 hover:border-primary-fixed/60 text-primary-fixed font-bold text-sm rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] mt-1"
              >
                <Calendar className="w-4 h-4" />
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
        onClick={() => setIsAchievementsOpen(true)}
        className="bg-surface-container border border-surface-variant rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-all cursor-pointer group shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-105 transition-transform shrink-0">
            <Medal className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-on-background tracking-tight flex items-center gap-2">
              <span>🏆 {unlockedAchievements.length} / {ACHIEVEMENTS.length} Achievements Unlocked</span>
            </h2>
            <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
              Tap to view legacy badges & milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-surface-variant/40">
          <div className="flex items-center gap-2">
            {top3Unlocked.length > 0 ? (
              top3Unlocked.map((ach) => {
                const IconComp = ach.icon;
                return (
                  <div
                    key={ach.id}
                    className="p-2 rounded-xl bg-surface border border-primary/30 text-primary shadow-sm"
                    title={ach.title}
                  >
                    <IconComp className="w-5 h-5 drop-shadow-[0_0_6px_currentColor]" />
                  </div>
                );
              })
            ) : (
              <div className="w-32 bg-surface-variant h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (unlockedAchievements.length / ACHIEVEMENTS.length) * 100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-surface-container-high border-2 border-green-500/60 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center flex flex-col items-center shadow-2xl drop-shadow-[0_0_25px_rgba(34,197,94,0.7)]"
            >
              <div className="relative mb-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary-fixed/70 blur-[1px]"
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
                <div className="p-4 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 drop-shadow-[0_0_25px_rgba(34,197,94,0.7)]">
                  {React.createElement(unlockedCelebration.icon || Trophy, {
                    className:
                      "w-12 h-12 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)]",
                  })}
                </div>
              </div>

              <span className="text-xs font-black tracking-widest text-green-400 uppercase mb-1">
                ACHIEVEMENT UNLOCKED!
              </span>

              <h3 className="text-xl font-extrabold text-on-background mb-1">
                {unlockedCelebration.title}
              </h3>

              {unlockedCelebration.level && (
                <span className="inline-block px-3 py-1 mb-3 text-[10px] font-black uppercase tracking-wider rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  {unlockedCelebration.level}
                </span>
              )}

              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {unlockedCelebration.description}
              </p>

              <button
                onClick={handleClaimCelebration}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-slate-950 font-black rounded-xl uppercase tracking-wider text-sm transition-all shadow-lg hover:shadow-green-500/30 cursor-pointer"
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
