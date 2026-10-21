import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Medal,
  Target,
  X,
  ChevronRight,
  Dumbbell,
  Clock,
  ClipboardList,
  Settings as SettingsIcon,
  Check,
  CheckCircle2,
  Layers,
  TrendingUp,
  TrendingDown,
  Trophy,
  BarChart2,
  LineChart as LucideLineChart,
  Plus,
  Play,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { CARTOON_SPRINGS } from "../lib/motion";

import { LiftLabBrand, LiftLabMark } from "./common/LiftLabBrand";
import { triggerHaptic } from "../lib/haptics";

import { PRListModal } from "./common/PRListModal";
import { ConfirmModal } from "./common/ConfirmModal";
import { AppleBottomSheet } from "./common/AppleBottomSheet";
import {
  hasWorkoutLoggedOnDay,
  getNextScheduledRoutine,
  isTimedExercise,
  getWorkoutLogDurationMinutes,
  calculateStreaks,
} from "../lib/workoutUtils";
import type { RoutineData, ExerciseData } from "../types/workout";

interface DetailedActivity {
  id?: string;
  title: string;
  duration: number;
  exercises: any[];
}

const getLogDate = (log: any) => {
  if (!log || !log.date) return new Date();
  if (typeof log.date.toDate === "function") return log.date.toDate();
  return new Date(log.date);
};

export const Dashboard = React.memo(
  ({
    t,
    unit,
    navigateTo,
    onSelectRoutine,
    onStartLiveWorkout,
    routines,
    currentWeight,
    setCurrentWeight,
    onUpdateWeight,
    dashboardStats,
    setDashboardStats,
    exercises,
    workoutLogs,
    weightLogs = [],
    weeklyGoal,
    setWeeklyGoal,
    onDeleteLog,
    userName: userNameProp,
  }: {
    t: any;
    unit: string;
    navigateTo: (tab: string) => void;
    onSelectRoutine: (id: string) => void;
    onStartLiveWorkout: (id: string) => void;
    routines: RoutineData[];
    currentWeight: number;
    setCurrentWeight: (w: number) => void;
    onUpdateWeight: () => void;
    dashboardStats: string[];
    setDashboardStats: (stats: string[]) => void;
    exercises: ExerciseData[];
    workoutLogs: any[];
    weightLogs?: { date: string; weight: number }[];
    weeklyGoal: number;
    setWeeklyGoal: (n: number) => void;
    onDeleteLog?: (id: string) => void;
    userName?: string;
  }) => {
    const userName = userNameProp || (() => {
      try {
        const raw = localStorage.getItem("liftlab_guest_data");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.displayName && parsed.displayName !== "Guest" && parsed.displayName !== "User") {
            return parsed.displayName;
          }
        }
      } catch {}
      return undefined;
    })();
    const welcomeBase = (t("welcome_title") || "Benvenuto su LiftLab").replace(/[!¡]/g, "").trim();

    const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
    const hasTodayWorkout = hasWorkoutLoggedOnDay(workoutLogs, new Date());
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [focusedActivity, setFocusedActivity] = useState<DetailedActivity | null>(null);
    const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);
    const [isCustomizeStatsOpen, setIsCustomizeStatsOpen] = useState(false);

    const latestWeightFromLogs =
      weightLogs && weightLogs.length > 0
        ? weightLogs[weightLogs.length - 1].weight
        : 0;
    const rawWeight = currentWeight || latestWeightFromLogs || 0;
    const displayWeight =
      rawWeight > 0
        ? (rawWeight % 1 === 0 ? rawWeight : Number(rawWeight.toFixed(1)))
        : "-";

    const nextRoutine = useMemo(
      () => getNextScheduledRoutine(routines),
      [routines],
    );
    const [isPRModalOpen, setIsPRModalOpen] = useState(false);

    // Week navigation state
    const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

    const weekStartMonday = useMemo(() => {
      const m = new Date();
      m.setHours(0, 0, 0, 0);
      m.setDate(m.getDate() - todayIndex);
      return m;
    }, [todayIndex]);

    const days = [
      { label: "Mo", full: "Monday" },
      { label: "Tu", full: "Tuesday" },
      { label: "We", full: "Wednesday" },
      { label: "Th", full: "Thursday" },
      { label: "Fr", full: "Friday" },
      { label: "Sa", full: "Saturday" },
      { label: "Su", full: "Sunday" },
    ].map((d, idx) => {
      const dayDate = new Date(weekStartMonday);
      dayDate.setDate(weekStartMonday.getDate() + idx);
      return { ...d, dateNumber: dayDate.getDate() };
    });

    const sortedLogs = useMemo(() => {
      return [...workoutLogs]
        .filter((log) => log.date)
        .sort((a, b) => getLogDate(a).getTime() - getLogDate(b).getTime());
    }, [workoutLogs]);

    const getProgressData = () => {
      return sortedLogs.map((log, i) => {
        const date = getLogDate(log);
        const dateStr = date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        let squat = 0,
          deadlift = 0,
          bench = 0;
        log.exercises?.forEach((ex: any) => {
          const type = ex.title?.toLowerCase() || "";
          const setsMap = ex.sets?.map((s: any) => s.weight || 0) || [];
          const maxWeight = setsMap.length > 0 ? Math.max(...setsMap) : 0;

          if (type.includes("squat")) if (maxWeight > squat) squat = maxWeight;
          if (type.includes("deadlift"))
            if (maxWeight > deadlift) deadlift = maxWeight;
          if (type.includes("bench")) if (maxWeight > bench) bench = maxWeight;
        });
        return { name: dateStr || `Workout ${i + 1}`, squat, deadlift, bench };
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

    const progressData = useMemo(() => getProgressData(), [sortedLogs]);
    const volumeData = useMemo(() => getVolumeData(), [sortedLogs]);
    const weightDataForChart = useMemo(() => getWeightData(), [weightLogs]);

    // Process real workout logs for this week
    const activityData = useMemo(() => {
      const data: Record<number, DetailedActivity[]> = {};
      const now = new Date();
      // Start of "this week" (assume Monday start for consistency with todayIndex)
      const monday = new Date();
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - todayIndex);

      workoutLogs.forEach((log) => {
        if (!log.date) return;
        const date = getLogDate(log);

        // Check if it's within the current week (from this Monday onwards to Sunday)
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        if (date >= monday && date < nextMonday) {
          const dayIdx = (date.getDay() + 6) % 7;
          if (!data[dayIdx]) data[dayIdx] = [];
          data[dayIdx].push({
            id: log.id,
            title: log.routineName || "Workout",
            duration: log.duration || 0,
            exercises: log.exercises || [],
          });
        }
      });
      return data;
    }, [workoutLogs, todayIndex]);

    const selectedActivities = activityData[selectedDayIndex] || [];
    const hasWorkout = selectedActivities.length > 0;

    let workoutsThisWeek = 0;
    let durationThisWeek = 0; // accumulated in seconds
    Object.values(activityData).forEach((activities: DetailedActivity[]) => {
      activities.forEach((activity) => {
        if (activity.duration > 0 || (activity.exercises && activity.exercises.length > 0)) {
          workoutsThisWeek++;
          durationThisWeek += (activity.duration || 0); // seconds
        }
      });
    });

    let totalVolume = 0;
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight && s.reps)
            totalVolume += Number(s.weight) * Number(s.reps);
        });
      });
    });
    const totalVolumeStr =
      totalVolume >= 1000
        ? (totalVolume / 1000).toFixed(1) + "k"
        : (Math.round(totalVolume * 10) / 10).toString();

    // PR calculation
    const totalPRs = exercises.filter(
      (ex) => ex.prWeight || ex.oneRepMax,
    ).length;

    const getWeightChartData = () => {
      return [...weightLogs]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7)
        .map((log, i) => ({ name: i, weight: log.weight }));
    };

    const getVolumeChartData = () => {
      return [...workoutLogs]
        .sort((a, b) => getLogDate(a).getTime() - getLogDate(b).getTime())
        .slice(-7)
        .map((log, i) => {
          let vol = 0;
          log.exercises?.forEach((ex: any) => {
            ex.sets?.forEach((s: any) => {
              if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
            });
          });
          return { name: i, volume: vol };
        });
    };

    // ── Streak & Goals ───────────────────────────────────────────────────
    const { currentStreak, bestStreak } = useMemo(() => {
      return calculateStreaks(workoutLogs);
    }, [workoutLogs]);

    const goalProgress = Math.min(workoutsThisWeek / weeklyGoal, 1);
    const circumference = 2 * Math.PI * 22;

    const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editableGoal, setEditableGoal] = useState(weeklyGoal);

    useEffect(() => {
      const handleBack = (event: Event) => {
        if (isCustomizeStatsOpen) {
          event.preventDefault();
          setIsCustomizeStatsOpen(false);
          return;
        }
        if (isPRModalOpen) {
          event.preventDefault();
          setIsPRModalOpen(false);
          return;
        }
        if (isSummaryModalOpen) {
          event.preventDefault();
          setIsSummaryModalOpen(false);
          setFocusedActivity(null);
          return;
        }
        if (isGoalModalOpen) {
          event.preventDefault();
          setIsGoalModalOpen(false);
          return;
        }
        if (isStreakModalOpen) {
          event.preventDefault();
          setIsStreakModalOpen(false);
        }
      };
      window.addEventListener("liftlab:back", handleBack);
      return () => window.removeEventListener("liftlab:back", handleBack);
    }, [
      isCustomizeStatsOpen,
      isGoalModalOpen,
      isPRModalOpen,
      isStreakModalOpen,
      isSummaryModalOpen,
    ]);

    // ── New stats ─────────────────────────────────────────────────────────
    const totalSetsThisWeek = useMemo(() => {
      let count = 0;
      Object.values(activityData).forEach((activities: DetailedActivity[]) => {
        activities.forEach((a) => {
          a.exercises?.forEach((ex: any) => {
            ex.sets?.forEach((s: any) => { if (s.completed) count++; });
          });
        });
      });
      return count;
    }, [activityData]);

    const avgDurationMin = workoutLogs.length > 0
      ? Math.round(workoutLogs.reduce((sum, log) => sum + getWorkoutLogDurationMinutes(log.duration), 0) / workoutLogs.length)
      : 0;

    const bestVolumeSession = useMemo(() => {
      let best = 0;
      workoutLogs.forEach((log) => {
        let vol = 0;
        log.exercises?.forEach((ex: any) => {
          ex.sets?.forEach((s: any) => {
            if (s.completed && s.weight && s.reps) vol += Number(s.weight) * Number(s.reps);
          });
        });
        if (vol > best) best = vol;
      });
      return best;
    }, [workoutLogs]);

    // Build workout-date set for calendar
    const workoutDateKeys = useMemo(() => {
      const set = new Set<string>();
      workoutLogs.forEach((log) => {
        if (!log.date) return;
        const d = getLogDate(log);
        set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      return set;
    }, [workoutLogs]);

    const streakMessage =
      currentStreak === 0
        ? "Start your streak today!"
        : currentStreak < 3
          ? "Great start — keep going!"
          : currentStreak < 7
            ? "On fire — don't stop!"
            : currentStreak < 14
              ? "One week strong!"
              : "Unstoppable!";

    return (
      <main className="px-margin-mobile py-stack-lg pb-32 flex flex-col gap-stack-lg max-w-[1280px] mx-auto w-full">
        {/* Top Header Bar: Clean Apple Fitness+ aesthetic */}
        <header className="flex items-center justify-between px-1 pt-1 pb-1">
          <div className="flex items-center gap-3">
            <LiftLabMark sizeClass="w-11 h-11" withBackground={true} className="rounded-2xl shadow-md" />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black tracking-tight text-white leading-none">LIFT</span>
                <span className="text-xl font-black tracking-tight text-[#30D158] leading-none">LAB</span>
              </div>
              <p className="text-xs text-[#8E8E93] font-medium mt-1">
                {(t("training_calendar_day") || "Calendario: {day}").replace("{day}", days[selectedDayIndex].full)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              navigateTo("settings");
            }}
            aria-label="Settings"
            className="w-11 h-11 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Weekly Training Calendar Card */}
        <section className="bg-[#1C1C1E] border border-white/8 rounded-3xl overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.45)] p-4 sm:p-5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(48,209,88,0.1),transparent_18rem)]" />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#30D158]" />
                <h2 className="text-[13px] font-bold text-white tracking-wide">
                  {t("this_week")}
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#30D158]">
                {selectedActivities.length > 0
                  ? (t("logged_count") || "{count} completati").replace("{count}", String(selectedActivities.length))
                  : (t("no_log_day") || "Nessun allenamento")}
              </span>
            </div>
            <div className="flex justify-between items-center w-full gap-1.5">
              {days.map((day, idx) => {
                const dayActivities = activityData[idx] || [];
                const hasWorkout =
                  dayActivities.length > 0 &&
                  dayActivities.some((a) => a.duration > 0);
                const isToday = idx === todayIndex;
                const isSelected = idx === selectedDayIndex;

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.86, rotate: -2 }}
                    whileHover={{ scale: 1.04 }}
                    transition={CARTOON_SPRINGS.bouncy}
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedDayIndex(idx);
                    }}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-200 flex-1 py-2.5 rounded-2xl relative cursor-pointer ${
                      isSelected
                        ? "bg-[#30D158] text-black shadow-[0_4px_16px_rgba(48,209,88,0.35)] scale-105 z-10 font-bold"
                        : isToday
                          ? "bg-[#30D158]/15 border border-[#30D158]/35 text-[#30D158]"
                          : "hover:bg-white/5 border border-transparent text-[#8E8E93]"
                    } ${!isSelected && !isToday && !hasWorkout ? "opacity-60" : ""}`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-tight ${
                        isSelected ? "text-black" : isToday ? "text-[#30D158]" : "text-[#8E8E93]"
                      }`}
                    >
                      {day.label}
                    </span>
                    <div
                      className={`relative w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        hasWorkout
                          ? isSelected
                            ? "bg-black text-[#30D158]"
                            : "bg-[#30D158]/20 text-[#30D158]"
                          : isSelected
                            ? "bg-black/20 text-black"
                            : "bg-white/5 text-[#8E8E93]"
                      }`}
                    >
                      {hasWorkout ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : day.dateNumber}
                    </div>
                    {isToday && (
                      <span className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider whitespace-nowrap ${
                        isSelected ? "bg-black text-[#30D158]" : "bg-white/10 text-white"
                      }`}>
                        {t("today")}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
        {/* ── Streak & Goals Widget ──────────────────────────────────────── */}
        <div
          data-testid="streak-goals-widget"
          className="grid grid-cols-2 gap-3"
        >
          {/* Streak card */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95, rotate: -1 }}
            whileHover={{ scale: 1.015 }}
            transition={CARTOON_SPRINGS.bouncy}
            onClick={() => {
              triggerHaptic("light");
              setIsStreakModalOpen(true);
            }}
            data-testid="streak-card"
            className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-4 sm:p-5 flex flex-col gap-1 relative overflow-hidden cursor-pointer select-none text-left shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#30D158]/10 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 text-[#8E8E93]">
                <Calendar className="w-4 h-4 text-[#30D158]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.06em]">{(t("history") !== "history" && t("history")) || "Storico"}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] opacity-60" />
            </div>
            <div className="flex items-end gap-1.5 z-10 my-1">
              <span
                data-testid="streak-count"
                className={`text-[40px] sm:text-[46px] font-extrabold leading-none tabular-nums ${workoutLogs.length > 0 ? "text-white" : "text-[#8E8E93]"}`}
              >
                {workoutLogs.length}
              </span>
              <span className="text-xs text-[#8E8E93] font-medium mb-1.5">
                {workoutLogs.length === 1
                  ? ((t("workout_singular") !== "workout_singular" && t("workout_singular")) || "allenamento")
                  : ((t("workouts_plural") !== "workouts_plural" && t("workouts_plural")) || "allenamenti")}
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E93] leading-tight z-10">
              {t("history_saved_local") || "Storico salvato sul dispositivo"}
            </p>
          </motion.button>

          {/* Weekly goal card */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95, rotate: 1 }}
            whileHover={{ scale: 1.015 }}
            transition={CARTOON_SPRINGS.bouncy}
            onClick={() => {
              triggerHaptic("light");
              setEditableGoal(weeklyGoal);
              setIsGoalModalOpen(true);
            }}
            data-testid="weekly-goal-card"
            className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-4 sm:p-5 flex flex-col gap-1 relative overflow-hidden cursor-pointer select-none text-left shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 text-[#8E8E93]">
                <Target className="w-4 h-4 text-[#0A84FF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.06em]">{(t("weekly_goal") !== "weekly_goal" && t("weekly_goal")) || "Obiettivo Settimanale"}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] opacity-60" />
            </div>
            <div className="flex items-center gap-3 z-10 my-1">
              {/* SVG progress ring */}
              <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-white/10" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke="#30D158" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - goalProgress)}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    opacity={goalProgress === 0 ? 0.25 : 1}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span data-testid="weekly-goal-progress" className="text-[12px] font-extrabold text-white tabular-nums">
                    {workoutsThisWeek}/{weeklyGoal}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white">
                  {goalProgress >= 1
                    ? (t("goal_reached_badge") || "Obiettivo raggiunto!")
                    : (t("workouts_left") || "{count} rimanenti").replace("{count}", String(weeklyGoal - workoutsThisWeek))}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: weeklyGoal }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${i < workoutsThisWeek ? "bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.4)]" : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#8E8E93]">
                  {(t("percent_this_week") || "{percent}% questa settimana").replace("{percent}", String(Math.round(goalProgress * 100)))}
                </span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* ── Streak History Modal ─────────────────────────────────────────── */}
        <AppleBottomSheet
          isOpen={isStreakModalOpen}
          onClose={() => setIsStreakModalOpen(false)}
          title={(t("workout_history") !== "workout_history" && t("workout_history")) || (t("history") !== "history" && t("history")) || "Workout History"}
        >
          {(() => {
            const today = new Date();
            const calDays: { date: Date; hasWorkout: boolean; isToday: boolean }[] = [];
            for (let i = 34; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              calDays.push({ date: d, hasWorkout: workoutDateKeys.has(key), isToday: i === 0 });
            }
            const workoutsLast35 = calDays.filter((d) => d.hasWorkout).length;
            return (
              <div className="flex flex-col gap-5 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: (t("total") !== "total" && t("total")) || "Total", value: workoutLogs.length, unit: workoutLogs.length === 1 ? ((t("workout_singular") !== "workout_singular" && t("workout_singular")) || "log") : ((t("workouts_plural") !== "workouts_plural" && t("workouts_plural")) || "logs") },
                    { label: (t("last_35_days") !== "last_35_days" && t("last_35_days")) || "Last 35 Days", value: workoutsLast35, unit: "sessions" },
                    { label: t("this_week") || "This Week", value: workoutsThisWeek, unit: "sessions" },
                  ].map((s) => (
                    <div key={s.label} className="apple-glass-card rounded-2xl p-3 text-center">
                      <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-2xl font-black text-[#30D158] tabular-nums tracking-tight">{s.value}</p>
                      <p className="text-[9px] text-[#8E8E93]">{s.unit}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] text-[#8E8E93] font-bold">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const firstDay = calDays[0].date;
                    const startPad = (firstDay.getDay() + 6) % 7;
                    const cells: React.ReactElement[] = [];
                    for (let i = 0; i < startPad; i++) cells.push(<div key={`pad-${i}`} />);
                    calDays.forEach((day, idx) => {
                      cells.push(
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold transition-all tabular-nums ${
                            day.isToday
                              ? "ring-2 ring-[#30D158] " + (day.hasWorkout ? "bg-[#30D158] text-black" : "bg-white/10 text-[#30D158]")
                              : day.hasWorkout
                                ? "bg-[#30D158] text-black shadow-[0_0_8px_rgba(48,209,88,0.4)]"
                                : "bg-white/5 text-[#8E8E93] opacity-50"
                          }`}
                        >
                          {day.date.getDate()}
                        </div>
                      );
                    });
                    return cells;
                  })()}
                </div>
                <p className="text-center text-[11px] text-[#8E8E93] mt-2 opacity-70">
                  {t("green_workout_legend") || "Green = workout day • Last 35 days shown"}
                </p>
              </div>
            );
          })()}
        </AppleBottomSheet>

        {/* ── Weekly Goal Modal ────────────────────────────────────────────── */}
        <AppleBottomSheet
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          title={(t("weekly_goal") !== "weekly_goal" && t("weekly_goal")) || "Weekly Goal"}
        >
          {(() => {
            const pastWeeks: number[] = [];
            for (let w = 1; w <= 4; w++) {
              const wStart = new Date();
              wStart.setDate(wStart.getDate() - todayIndex - w * 7);
              wStart.setHours(0, 0, 0, 0);
              const wEnd = new Date(wStart);
              wEnd.setDate(wStart.getDate() + 7);
              const count = workoutLogs.filter((log) => {
                if (!log.date) return false;
                const d = getLogDate(log);
                return d >= wStart && d < wEnd;
              }).length;
              pastWeeks.push(count);
            }
            const avgWeekly = pastWeeks.length > 0
              ? (pastWeeks.reduce((a, b) => a + b, 0) / pastWeeks.length).toFixed(1)
              : "—";
            return (
              <div className="flex flex-col gap-4 pb-4">
                <div className="apple-glass-card rounded-2xl p-4">
                  <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest mb-3">{t("this_week") || "This Week"}</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-white/10" />
                        <circle
                          cx="28" cy="28" r="22" fill="none"
                          stroke="#30D158" strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - Math.min(workoutsThisWeek / editableGoal, 1))}
                          style={{ transition: "stroke-dashoffset 0.4s ease" }}
                          opacity={workoutsThisWeek === 0 ? 0.25 : 1}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[13px] font-black text-[#30D158] tabular-nums">{workoutsThisWeek}/{editableGoal}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">
                        {workoutsThisWeek >= editableGoal
                          ? `${t("goal_reached_badge") || "Goal reached!"} 🎉`
                          : (t("workouts_left") || "{count} to go").replace("{count}", String(editableGoal - workoutsThisWeek))}
                      </p>
                      <p className="text-xs text-[#8E8E93] mt-0.5">
                        {(t("avg_last_4_weeks") || "Avg last 4 weeks: {count} sessions").replace("{count}", avgWeekly)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="apple-glass-card rounded-2xl p-4">
                  <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest mb-3">{t("past_4_weeks") || "Past 4 Weeks"}</p>
                  <div className="flex items-end gap-2 h-16">
                    {[...pastWeeks].reverse().map((count, i) => {
                      const h = editableGoal > 0 ? Math.min((count / editableGoal) * 100, 100) : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-[#8E8E93] tabular-nums">{count}</span>
                          <div className="w-full rounded-t-sm relative" style={{ height: "40px" }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t bg-[#30D158]/70 transition-all duration-500"
                              style={{ height: `${Math.max(h, count > 0 ? 10 : 0)}%` }}
                            />
                            <div className="absolute bottom-0 w-full border-b-2 border-white/10" />
                          </div>
                          <span className="text-[9px] text-[#8E8E93]">-{4-i}w</span>
                        </div>
                      );
                    })}
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[#30D158] font-bold tabular-nums">{workoutsThisWeek}</span>
                      <div className="w-full rounded-t-sm relative" style={{ height: "40px" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-[#30D158] transition-all duration-500"
                          style={{ height: `${Math.min((workoutsThisWeek / editableGoal) * 100, 100)}%` }}
                        />
                        <div className="absolute bottom-0 w-full border-b-2 border-[#30D158]/40" />
                      </div>
                      <span className="text-[9px] text-[#30D158] font-bold">{t("now_label") || "Now"}</span>
                    </div>
                  </div>
                </div>

                <div className="apple-glass-card rounded-2xl p-4">
                  <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest mb-3">{t("set_your_goal") || "Set Your Goal"}</p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setEditableGoal(n);
                          setWeeklyGoal(n);
                        }}
                        className={`flex-1 min-h-[44px] py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${editableGoal === n ? "bg-[#30D158] text-black shadow-[0_0_12px_rgba(48,209,88,0.4)]" : "bg-white/8 text-[#8E8E93] hover:text-white hover:bg-white/15"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#8E8E93] mt-2 text-center">{t("workouts_per_week") || "workouts per week"}</p>
                </div>
              </div>
            );
          })()}
        </AppleBottomSheet>

        {/* Selected Day Summary */}
        {selectedActivities.length > 0 ? (
          <div className="flex flex-col gap-4">
            {selectedActivities.map((activity, idx) => (
              <section
                key={idx}
                onClick={() => {
                  setFocusedActivity(activity);
                  setIsSummaryModalOpen(true);
                }}
                className="bg-primary-container/10 border border-primary-container/30 rounded-xl p-stack-md flex flex-col gap-2 cursor-pointer hover:bg-primary-container/20 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-label-bold text-primary uppercase">
                    {t("activity_summary")}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-container rounded-lg">
                    <Dumbbell className="w-6 h-6 text-on-primary-container" />
                  </div>
                  <div>
                    <p className="text-headline-sm text-on-background">
                      {activity.title}
                    </p>
                    <div className="flex gap-3 text-body-sm text-on-surface-variant">
                      <span>{getWorkoutLogDurationMinutes(activity.duration)} min</span>
                      <span>•</span>
                      <span>
                        {Number(activity?.exercises?.length ?? 0) === 1
                          ? (t("one_exercise") || "1 exercise")
                          : `${activity?.exercises?.length ?? 0} ${t("exercises") || "exercises"}`}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : selectedDayIndex === todayIndex ? null : (
          <section className="bg-surface-container border border-surface-variant border-dashed rounded-xl p-stack-md flex flex-col items-center justify-center gap-1">
            <p className="text-body-md text-on-surface-variant">
              {t("no_activity_logged_day") || "No activity logged for this day"}
            </p>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                navigateTo("workout");
              }}
              className="text-label-bold text-primary-container text-xs cursor-pointer hover:underline bg-transparent border-none p-0 mt-0.5"
            >
              {t("start_empty") || "Inizia allenamento"}
            </button>
          </section>
        )}

        {/* Summary Modal */}
        <AppleBottomSheet
          isOpen={isSummaryModalOpen && Boolean(focusedActivity)}
          onClose={() => {
            setIsSummaryModalOpen(false);
            setFocusedActivity(null);
          }}
          title={focusedActivity?.title || t("activity_summary") || "Activity Summary"}
          subtitle={
            focusedActivity
              ? `${days[selectedDayIndex]?.full || ""} • ${getWorkoutLogDurationMinutes(focusedActivity.duration)} min`
              : undefined
          }
        >
          {focusedActivity && (
            <div className="flex flex-col gap-5 pb-4">
              <div className="flex flex-col gap-4">
                {focusedActivity.exercises?.map((ex: any, exIdx: number) => (
                  <div key={exIdx} className="apple-glass-card rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                        <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
                        {t(ex.title) || ex.title}
                      </h4>
                      <span className="text-xs text-[#8E8E93] font-medium tabular-nums">
                        {ex.sets?.filter((s: any, idx: number) => s.completed && !(idx > 0 && s.technique === "dropset")).length || 0} sets
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {ex.sets?.filter((s: any) => s.completed).map((set: any, setIdx: number) => (
                        <div
                          key={setIdx}
                          className="bg-white/5 p-2 rounded-xl border border-white/8 text-center"
                        >
                          <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                            {set.technique === "dropset" ? "↳ DROP" : `${t("set")} ${setIdx + 1}`}
                          </p>
                          <p className="text-sm font-extrabold text-[#30D158] tabular-nums tracking-tight">
                            {set.weight}{" "}
                            <span className="text-[10px] font-normal text-[#8E8E93]">
                              {unit}
                            </span>
                          </p>
                          <p className="text-[10px] text-[#8E8E93] tabular-nums">
                            {set.reps} {isTimedExercise(ex) ? "secs" : (t("reps")?.toLowerCase() || "reps")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                {onDeleteLog && focusedActivity.id && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      setPendingDeleteLogId(focusedActivity.id!);
                    }}
                    className="flex-1 min-h-[44px] py-3 bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 rounded-2xl font-bold text-sm hover:bg-[#FF453A]/25 transition-colors cursor-pointer"
                  >
                    {t("delete") || "Delete"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsSummaryModalOpen(false);
                    setFocusedActivity(null);
                  }}
                  className="flex-1 min-h-[44px] py-3 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/15 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </AppleBottomSheet>

        {/* Day One Welcome Hub when workoutLogs.length === 0 */}
        {workoutLogs.length === 0 && selectedDayIndex === todayIndex && (
          <section className="bg-gradient-to-br from-[#1C1C1E] via-[#1C1C1E] to-[#161618] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.45)] relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#30D158]/10 blur-[90px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1.5">
              <span className="w-fit text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#30D158] bg-[#30D158]/15 px-3 py-1 rounded-full border border-[#30D158]/30">
                LiftLab Starter
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {userName ? `${welcomeBase}, ${userName}!` : (t("welcome_title") || "Benvenuto su LiftLab!")}
              </h2>
              <p className="text-xs sm:text-sm text-[#8E8E93] max-w-xl">
                {t("welcome_subtitle") || "Il tuo percorso inizia oggi. Scegli come svolgere il tuo primo allenamento:"}
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {/* Option A: Scheduled or Default Starter Routine */}
              {nextRoutine ? (
                <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full">
                        {(t("recommended") !== "recommended" && t("recommended")) || "Consigliata per oggi"}
                      </span>
                      <span className="text-xs text-[#8E8E93] flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {nextRoutine.duration} min
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#30D158] transition-colors">
                      {nextRoutine.name}
                    </h3>
                    <p className="text-xs text-[#8E8E93] mt-1 line-clamp-1">
                      {nextRoutine.exercises?.map((e) => t(e.title)).join(" • ")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic("medium");
                      onStartLiveWorkout(nextRoutine.id);
                    }}
                    className="w-full bg-[#30D158] text-black font-extrabold text-sm py-3.5 rounded-2xl hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(48,209,88,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{t("start_today_routine") || "Avvia Scheda di Oggi"}</span>
                  </button>
                </div>
              ) : null}

              {/* Option B: Freestyle Session */}
              <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {(t("freestyle") !== "freestyle" && t("freestyle")) || "Libero"}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {t("freestyle_session") || "Inizia Allenamento Libero"}
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    {t("freestyle_desc") || "Allenati senza scheda e aggiungi gli esercizi mentre ti alleni."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    onStartLiveWorkout("empty");
                  }}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("start_empty") || "Allenamento Libero"}</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 pt-1 text-center sm:text-left">
              <button
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("workout");
                }}
                className="text-xs text-[#8E8E93] hover:text-[#30D158] transition-colors underline-offset-4 hover:underline cursor-pointer"
              >
                {t("or_browse_routines") || "Oppure sfoglia e crea nuove schede nella sezione Allenamento →"}
              </button>
            </div>
          </section>
        )}

        {/* Next Workout Card */}
        {workoutLogs.length > 0 && selectedDayIndex === todayIndex && !hasTodayWorkout && nextRoutine && (
          <section className="bg-[#1C1C1E] border border-white/8 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col">
            <button
              onClick={() => {
                triggerHaptic("medium");
                onStartLiveWorkout(nextRoutine.id);
              }}
              className="relative w-full overflow-hidden h-40 md:h-52 flex flex-col justify-end p-5 md:p-6 group cursor-pointer active:scale-[0.98] transition-all text-left"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSD3OOEmD78fTaBnJqYilure6mY1McKJ6Jf1YUDBmD_tkwF4V9xcADKpFJ6mZC0WG9YzPbJjI9pkzHh5FvgbWxAynV0sOt5RRKb3pi0mBbsFseaaeOy2OcfvyTDKJe4VvXbd6dbF4k5K6iJ6dTH0whAiw-XxPrNtJzCQDiZKPndVIfzkohVpwQqQt93btkiwmYK63DcAS2kLXIq07sUSjjb9b7uieN1Y34-dGHL8doGbYa6rQ7H7M8mS5BgKCAXrfr-ZrYHVv-zoo')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="relative z-10 flex flex-col gap-2">
                <span className="w-fit border border-[#30D158]/40 text-[#30D158] text-[11px] font-bold px-3 py-1 rounded-full bg-black/40 backdrop-blur-md uppercase tracking-[0.06em]">
                  {t("next_workout") || "Next Workout"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {nextRoutine.name}
                </h3>
                <div className="flex items-center gap-4 text-[#8E8E93]">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#30D158]" /> {nextRoutine.duration} Min
                  </p>
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-[#30D158]" />{" "}
                    {Number(nextRoutine?.exercises?.length ?? 0) === 1
                      ? (t("one_exercise") || "1 Exercise")
                      : `${nextRoutine?.exercises?.length ?? 0} ${t("exercises") || "Exercises"}`}
                  </p>
                </div>
              </div>
            </button>
            <div className="bg-black/40 border-t border-white/5 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] text-[#8E8E93]">
                {t("prefer_empty_session") || "Oppure inizia una sessione libera:"}
              </span>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  onStartLiveWorkout("empty");
                }}
                className="text-xs font-bold text-[#30D158] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("start_empty") || "Allenamento Libero"}</span>
              </button>
            </div>
          </section>
        )}

        {/* Quick Start Hero when no routine is scheduled */}
        {workoutLogs.length > 0 && selectedDayIndex === todayIndex && !hasTodayWorkout && !nextRoutine && (
          <section className="bg-gradient-to-br from-[#1C1C1E] to-black border border-[#30D158]/30 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.45)] relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#30D158]/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1">
              <span className="w-fit text-[11px] font-bold uppercase tracking-[0.06em] text-[#30D158] bg-[#30D158]/15 px-3 py-1 rounded-full border border-[#30D158]/30">
                {t("quick_start") || "Avvio Rapido"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                {t("ready_to_train") || "Pronto ad allenarti?"}
              </h3>
              <p className="text-sm text-[#8E8E93] max-w-md">
                {t("quick_start_desc") || "Inizia subito registrando serie, carichi e recupero in tempo reale, oppure scegli una scheda."}
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.9, rotate: -2 }}
                whileHover={{ scale: 1.03 }}
                transition={CARTOON_SPRINGS.bouncy}
                onClick={() => {
                  triggerHaptic("medium");
                  onStartLiveWorkout("empty");
                }}
                className="bg-[#30D158] text-black font-extrabold text-xs px-6 py-3.5 rounded-full hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(48,209,88,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>{t("start_empty") || "Inizia Allenamento Libero"}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92, rotate: 1.5 }}
                whileHover={{ scale: 1.02 }}
                transition={CARTOON_SPRINGS.bouncy}
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("workout");
                }}
                className="bg-white/6 hover:bg-white/12 border border-white/10 text-white font-semibold text-xs px-6 py-3.5 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Dumbbell className="w-4 h-4 text-[#8E8E93]" />
                <span>{t("view_routines") || "Sfoglia Schede"}</span>
              </motion.button>
            </div>
          </section>
        )}

        {/* Quick Stats Bento Grid */}
        <section className="flex justify-between items-center">
          <h2 className="text-headline-md font-bold font-[var(--font-headline-md)] text-primary uppercase tracking-widest">
            {t("quick_stats")}
          </h2>
          {workoutLogs.length > 0 && (
            <button
              onClick={() => setIsCustomizeStatsOpen(true)}
              className="min-h-11 rounded-xl px-3 text-primary hover:bg-white/5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors"
            >
              <SettingsIcon className="w-3 h-3" /> {t("customize")}
            </button>
          )}
        </section>
        {workoutLogs.length === 0 ? (
          <section className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="w-14 h-14 rounded-2xl bg-[#30D158]/12 border border-[#30D158]/25 flex items-center justify-center shrink-0 text-[#30D158]">
              <LucideLineChart className="w-7 h-7" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {t("progress_preview_title") || "I tuoi progressi appariranno qui"}
              </h3>
              <p className="text-xs sm:text-sm text-[#8E8E93] mt-1 max-w-xl">
                {t("progress_preview_desc") || "Volume totale, serie settimanali, massimali stimati e record personali si popoleranno automaticamente non appena completerai la tua prima sessione."}
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic("medium");
                onStartLiveWorkout(nextRoutine?.id || "empty");
              }}
              className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-3 rounded-xl border border-white/10 shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              {(t("start_first_workout_cta") !== "start_first_workout_cta" && t("start_first_workout_cta")) || "Inizia ora"}
            </button>
          </section>
        ) : dashboardStats.length > 0 ? (
          (() => {
            const activeSmallStatCards = [
              "avg_duration",
              "total_sets_week",
              "best_volume",
              "weight",
              "volume",
              "prs",
              "workouts_week",
              "time_week",
            ].filter((id) => dashboardStats.includes(id));
            const getCardSpanClass = (cardId: string) => {
              const isOddCount = activeSmallStatCards.length % 2 !== 0;
              const isLast =
                activeSmallStatCards[activeSmallStatCards.length - 1] === cardId;
              return isOddCount && isLast ? "col-span-2 md:col-span-1" : "";
            };

            return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Stat Card Avg Duration */}
            {dashboardStats.includes("avg_duration") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("progress");
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("avg_duration")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <Clock className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <Clock className="w-5 h-5 text-[#30D158] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">{t("avg_duration") || "Avg Duration"}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {avgDurationMin}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">min</span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Total Sets Week */}
            {dashboardStats.includes("total_sets_week") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("progress");
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("total_sets_week")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <Layers className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <Layers className="w-5 h-5 text-[#30D158] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">{t("sets_done") || "Sets Done"}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {totalSetsThisWeek}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">{t("this_week") || "this week"}</span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Best Volume */}
            {dashboardStats.includes("best_volume") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("progress");
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("best_volume")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <TrendingUp className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <TrendingUp className="w-5 h-5 text-[#30D158] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">{t("best_session") || "Best Session"}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {bestVolumeSession >= 1000 ? (bestVolumeSession / 1000).toFixed(1) + "k" : (Math.round(bestVolumeSession * 10) / 10)}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">{unit.toLowerCase()}</span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Weight */}
            {dashboardStats.includes("weight") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  onUpdateWeight();
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("weight")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <LucideLineChart className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <LucideLineChart className="w-5 h-5 text-[#FF9F0A] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    {t("body_weight") || "Body Weight"}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#FF9F0A] tabular-nums tracking-tight">
                    {displayWeight}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Volume */}
            {dashboardStats.includes("volume") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("progress");
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("volume")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <Dumbbell className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <BarChart2 className="w-5 h-5 text-[#30D158] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    {t("total_volume") || "Total Volume"}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {totalVolumeStr}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card PRs */}
            {dashboardStats.includes("prs") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  setIsPRModalOpen(true);
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("prs")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <Trophy className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <Trophy className="w-5 h-5 text-[#FFD60A]" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    {t("personal_records") || "Personal Records"}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#FFD60A] tabular-nums tracking-tight">
                    {totalPRs}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">
                      Total
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Workouts */}
            {dashboardStats.includes("workouts_week") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("progress");
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("workouts_week")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <CheckCircle2 className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <CheckCircle2 className="w-5 h-5 text-[#30D158] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    {t("workouts") || "Workouts"}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {workoutsThisWeek}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">
                      {t("this_week") || "This Week"}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Time */}
            {dashboardStats.includes("time_week") && (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  navigateTo("progress");
                }}
                className={`apple-glass-card p-4 sm:p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-white/20 group select-none ${getCardSpanClass("time_week")}`}
              >
                <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                  <Clock className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-[#8E8E93] relative z-10">
                  <Clock className="w-5 h-5 text-[#30D158] transition-colors" />
                  <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    {t("duration") || "Total Time"}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {Math.floor(durationThisWeek / 60)}{" "}
                    <span className="text-xs text-[#8E8E93] font-medium">
                      Min
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Weight Context Chart */}
            {dashboardStats.includes("weight_chart") && (
              <div
                onClick={() => navigateTo("progress")}
                className="col-span-2 md:col-span-3 bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="flex justify-between items-center text-secondary-container relative z-10 mb-2">
                  <p className="text-label-bold text-on-surface-variant uppercase flex gap-2 items-center">
                    <TrendingUp className="w-4 h-4" /> Body Weight Trend
                  </p>
                  <ChevronRight className="w-4 h-4 group-hover:text-secondary-fixed transition-colors" />
                </div>
                <div className="h-24 w-full text-[10px] relative z-10 min-w-0 min-h-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <AreaChart
                      data={getWeightChartData()}
                      margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="dbWeightGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#adc6ff"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#adc6ff"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#adc6ff"
                        strokeWidth={2}
                        fill="url(#dbWeightGrad)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Volume Context Chart */}
            {dashboardStats.includes("volume_chart") && (
              <div
                onClick={() => navigateTo("progress")}
                className="col-span-2 md:col-span-3 bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="flex justify-between items-center text-primary-container relative z-10 mb-2">
                  <p className="text-label-bold text-on-surface-variant uppercase flex gap-2 items-center">
                    <BarChart2 className="w-4 h-4 text-primary" /> Volume Trend
                  </p>
                  <ChevronRight className="w-4 h-4 group-hover:text-primary-container transition-colors" />
                </div>
                <div className="h-24 w-full text-[10px] relative z-10 min-w-0 min-h-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <BarChart
                      data={getVolumeChartData()}
                      margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    >
                      <Bar
                        dataKey="volume"
                        fill="#30D158"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
            );
          })()
        ) : (
          <div className="bg-surface-container border border-surface-variant border-dashed rounded-lg p-stack-md flex flex-col items-center justify-center gap-1">
            <p className="text-body-md text-on-surface-variant text-center">
              Your dashboard looks a bit empty.
            </p>
            <button
              onClick={() => setIsCustomizeStatsOpen(true)}
              className="text-label-bold text-primary-container text-xs cursor-pointer hover:underline"
            >
              Add Stats
            </button>
          </div>
        )}

        {/* PR Modal */}
        {isPRModalOpen && (
          <PRListModal
            exercises={exercises}
            unit={unit}
            onClose={() => setIsPRModalOpen(false)}
            t={t}
          />
        )}

        {/* Customize Stats Sheet */}
        <AppleBottomSheet
          isOpen={isCustomizeStatsOpen}
          onClose={() => setIsCustomizeStatsOpen(false)}
          title="Customize Stats"
          subtitle="Select the quick stats you want to display on your dashboard."
        >
          <div className="flex flex-col gap-2.5 pb-4">
            {[
              {
                id: "avg_duration",
                label: "Avg Workout Duration",
                icon: <Clock className="w-5 h-5" />,
              },
              {
                id: "total_sets_week",
                label: "Sets Done This Week",
                icon: <Layers className="w-5 h-5" />,
              },
              {
                id: "best_volume",
                label: "Best Session Volume",
                icon: <TrendingUp className="w-5 h-5" />,
              },
              {
                id: "weight",
                label: "Body Weight",
                icon: <LucideLineChart className="w-5 h-5" />,
              },
              {
                id: "volume",
                label: "Total Volume (All Time)",
                icon: <Dumbbell className="w-5 h-5" />,
              },
              {
                id: "prs",
                label: "Personal Records",
                icon: <Trophy className="w-5 h-5" />,
              },
              {
                id: "workouts_week",
                label: "Workouts This Week",
                icon: <CheckCircle2 className="w-5 h-5" />,
              },
              {
                id: "time_week",
                label: "Total Time This Week",
                icon: <Clock className="w-5 h-5" />,
              },
              {
                id: "weight_chart",
                label: "Body Weight Trend Chart",
                icon: <TrendingUp className="w-5 h-5" />,
              },
              {
                id: "volume_chart",
                label: "Volume Trend Chart",
                icon: <BarChart2 className="w-5 h-5" />,
              },
            ].map((stat) => {
              const isActive = dashboardStats.includes(stat.id);
              return (
                <label
                  key={stat.id}
                  className={`flex items-center justify-between p-3.5 min-h-[52px] rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${
                    isActive
                      ? "apple-glass-card border-[#30D158]/40 text-white"
                      : "bg-white/5 border-white/8 text-[#8E8E93] hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={isActive ? "text-[#30D158]" : "text-[#8E8E93]"}>
                      {stat.icon}
                    </div>
                    <span className="font-semibold text-sm tracking-wide">
                      {stat.label}
                    </span>
                  </div>
                  {/* Apple Toggle Switch */}
                  <div
                    className={`w-12 h-7 rounded-full relative flex items-center shrink-0 transition-colors p-0.5 ${
                      isActive ? "bg-[#30D158]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isActive}
                    onChange={() => {
                      triggerHaptic("light");
                      if (isActive) {
                        setDashboardStats(
                          dashboardStats.filter((id) => id !== stat.id),
                        );
                      } else {
                        setDashboardStats([...dashboardStats, stat.id]);
                      }
                    }}
                  />
                </label>
              );
            })}
          </div>
        </AppleBottomSheet>



        {pendingDeleteLogId && onDeleteLog && (
          <ConfirmModal
            title="Delete workout log?"
            message="This removes the session from your history and progress calculations. This action cannot be undone."
            confirmLabel={t("delete") || "Delete"}
            cancelLabel={t("cancel") || "Cancel"}
            destructive
            onConfirm={() => {
              onDeleteLog(pendingDeleteLogId);
              setPendingDeleteLogId(null);
              setIsSummaryModalOpen(false);
              setFocusedActivity(null);
            }}
            onCancel={() => setPendingDeleteLogId(null)}
          />
        )}
      </main>
    );
  }
);
