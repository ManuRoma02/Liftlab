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
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import consoleLogoImg from "../assets/images/liftlab_console_logo.png";
import consoleIconImg from "../assets/images/liftlab_console_icon.png";

import { PRListModal } from "./common/PRListModal";
import { ConfirmModal } from "./common/ConfirmModal";
import {
  hasWorkoutLoggedOnDay,
  getNextScheduledRoutine,
  isTimedExercise,
  getWorkoutLogDurationMinutes,
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
  }) => {
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
    const displayWeight = currentWeight || latestWeightFromLogs || 0;

    const nextRoutine = useMemo(
      () => getNextScheduledRoutine(routines),
      [routines],
    );
    const [isPRModalOpen, setIsPRModalOpen] = useState(false);

    // Week navigation state
    const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

    const days = [
      { label: "Mo", full: "Monday" },
      { label: "Tu", full: "Tuesday" },
      { label: "We", full: "Wednesday" },
      { label: "Th", full: "Thursday" },
      { label: "Fr", full: "Friday" },
      { label: "Sa", full: "Saturday" },
      { label: "Su", full: "Sunday" },
    ];

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
        if (date >= monday) {
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
        if (activity.duration > 0) {
          workoutsThisWeek++;
          durationThisWeek += activity.duration; // seconds
        }
      });
    });

    let totalVolume = 0;
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          if (s.completed && s.weight && s.reps)
            totalVolume += s.weight * s.reps;
        });
      });
    });
    const totalVolumeStr =
      totalVolume >= 1000
        ? (totalVolume / 1000).toFixed(1) + "k"
        : totalVolume.toString();

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
    const currentStreak = useMemo(() => {
      if (!workoutLogs || workoutLogs.length === 0) return 0;
      const logDates = new Set(
        workoutLogs.map((log) => {
          const d = getLogDate(log);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }),
      );
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      let check = new Date(today);
      if (!logDates.has(todayKey)) check.setDate(check.getDate() - 1);
      let streak = 0;
      while (true) {
        const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
        if (!logDates.has(key)) break;
        streak++;
        check.setDate(check.getDate() - 1);
      }
      return streak;
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

    // Best streak (all-time)
    const bestStreak = useMemo(() => {
      if (workoutLogs.length === 0) return 0;
      const sorted = [...workoutLogs]
        .filter((l) => l.date)
        .sort((a, b) => getLogDate(a).getTime() - getLogDate(b).getTime());
      let best = 1; let cur = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = getLogDate(sorted[i - 1]);
        const curr = getLogDate(sorted[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff <= 1.5) { cur++; if (cur > best) best = cur; }
        else cur = 1;
      }
      return best;
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
      <main className="px-margin-mobile py-stack-lg flex flex-col gap-stack-lg max-w-[1280px] mx-auto w-full">
        <section className="premium-panel rounded-2xl overflow-hidden relative">
          <img
            src={consoleLogoImg}
            alt=""
            className="hidden sm:block absolute right-3 top-3 w-32 h-20 object-cover rounded-xl opacity-20 pointer-events-none"
          />
          <div className="p-4 flex items-center gap-4 border-b border-white/10 relative z-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shrink-0">
              <img
                src={consoleIconImg}
                alt="LiftLab"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-fixed">
                Dashboard
              </p>
              <h1 className="font-[var(--font-headline-lg)] text-4xl font-black text-primary uppercase tracking-wide leading-none">
                LiftLab
              </h1>
              <p className="text-sm text-on-surface-variant">
                {days[selectedDayIndex].full} training calendar
              </p>
            </div>
            <button
              onClick={() => navigateTo("settings")}
              aria-label="Settings"
              className="ml-auto w-11 h-11 rounded-full bg-white/5 border border-white/10 text-on-surface-variant hover:text-primary hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 md:p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-label-bold text-on-surface-variant uppercase tracking-widest">
                {t("this_week")}
              </h2>
              <span className="text-sm font-bold text-primary-fixed">
                {selectedActivities.length > 0
                  ? `${selectedActivities.length} logged`
                  : "No log"}
              </span>
            </div>
            <div className="flex justify-between items-center w-full gap-1">
              {days.map((day, idx) => {
                const dayActivities = activityData[idx] || [];
                const hasWorkout =
                  dayActivities.length > 0 &&
                  dayActivities.some((a) => a.duration > 0);
                const isToday = idx === todayIndex;
                const isSelected = idx === selectedDayIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 flex-1 py-3 rounded-xl relative cursor-pointer ${
                      isSelected
                        ? "bg-black/60 border border-primary-fixed text-primary-fixed shadow-[0_8px_22px_rgba(34,197,94,0.18)] scale-105 z-10"
                        : isToday
                          ? "bg-primary-fixed/10 border border-primary-fixed/25"
                          : "hover:bg-white/5 border border-transparent"
                    } ${!isSelected && !isToday && !hasWorkout ? "opacity-45" : ""}`}
                  >
                    <span
                      className={`text-[11px] font-black uppercase tracking-wide ${
                        isSelected ? "text-primary-fixed" : isToday ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {day.label}
                    </span>
                    <div
                      className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        hasWorkout
                          ? isSelected
                            ? "premium-cta"
                            : "bg-primary-fixed/20 text-primary-fixed"
                          : "bg-surface-variant/40 text-on-surface-variant"
                      }`}
                    >
                      {hasWorkout ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    {isToday && (
                      <span className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider whitespace-nowrap ${
                        isSelected ? "bg-primary-fixed text-black" : "bg-white/10 text-primary"
                      }`}>
                        {t("today")}
                      </span>
                    )}
                  </button>
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
          <button
            type="button"
            onClick={() => setIsStreakModalOpen(true)}
            data-testid="streak-card"
            className="premium-panel rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform select-none text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/10 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">History</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant opacity-50" />
            </div>
            <div className="flex items-end gap-1 z-10">
              <span
                data-testid="streak-count"
                className={`text-[46px] font-black leading-none tabular-nums ${workoutLogs.length > 0 ? "text-primary drop-shadow-[0_0_12px_rgba(34,197,94,0.45)]" : "text-on-surface-variant"}`}
              >
                {workoutLogs.length}
              </span>
              <span className="text-[13px] text-on-surface-variant mb-1.5">
                {workoutLogs.length === 1 ? "log" : "logs"}
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-tight z-10">
              Workout history saved locally
            </p>
          </button>

          {/* Weekly goal card */}
          <button
            type="button"
            onClick={() => { setEditableGoal(weeklyGoal); setIsGoalModalOpen(true); }}
            data-testid="weekly-goal-card"
            className="premium-panel rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform select-none text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Weekly Goal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant opacity-50" />
            </div>
            <div className="flex items-center gap-3 z-10">
              {/* SVG progress ring */}
              <div className="relative flex-shrink-0 w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-variant" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke="#22c55e" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - goalProgress)}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    opacity={goalProgress === 0 ? 0.25 : 1}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span data-testid="weekly-goal-progress" className="text-[13px] font-black text-primary tabular-nums">
                    {workoutsThisWeek}/{weeklyGoal}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-on-surface">
                  {goalProgress >= 1 ? "Goal reached!" : `${weeklyGoal - workoutsThisWeek} left`}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: weeklyGoal }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-1.5 rounded-full transition-all duration-300 ${i < workoutsThisWeek ? "bg-primary-fixed shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-surface-variant"}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-on-surface-variant">{Math.round(goalProgress * 100)}% this week</span>
              </div>
            </div>
          </button>
        </div>

        {/* ── Streak History Modal ─────────────────────────────────────────── */}
        {isStreakModalOpen && (() => {
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
            <div className="fixed inset-0 z-[300] bg-black/70 flex items-end justify-center" onClick={() => setIsStreakModalOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="workout-history-title"
                className="bg-surface-container-low w-full max-w-md rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-full duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <h2 id="workout-history-title" className="font-black text-lg uppercase tracking-wide text-on-surface">Workout History</h2>
                  <button aria-label="Close workout history" onClick={() => setIsStreakModalOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-variant text-on-surface-variant hover:text-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Total", value: workoutLogs.length, unit: "logs" },
                    { label: "Last 35 Days", value: workoutsLast35, unit: "sessions" },
                    { label: "This Week", value: workoutsThisWeek, unit: "sessions" },
                  ].map((s) => (
                    <div key={s.label} className="bg-surface rounded-xl p-3 text-center">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-2xl font-black text-primary">{s.value}</p>
                      <p className="text-[9px] text-on-surface-variant">{s.unit}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] text-on-surface-variant font-bold">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const firstDay = calDays[0].date;
                    const startPad = (firstDay.getDay() + 6) % 7;
                    const cells: React.ReactElement[] = [];
                    for (let i = 0; i < startPad; i++) cells.push(<div key={`pad-${i}`} />);
                    calDays.forEach((day, idx) => {
                      cells.push(
                        <div
                          key={idx}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
                            day.isToday
                              ? "ring-2 ring-primary " + (day.hasWorkout ? "bg-primary text-on-primary" : "bg-surface text-primary")
                              : day.hasWorkout
                                ? "bg-primary/90 text-on-primary shadow-[0_0_8px_rgba(195,244,0,0.4)]"
                                : "bg-surface text-on-surface-variant opacity-40"
                          }`}
                        >
                          {day.date.getDate()}
                        </div>
                      );
                    });
                    return cells;
                  })()}
                </div>
                <p className="text-center text-[10px] text-on-surface-variant mt-4 opacity-60">
                  Green = workout day • Last 35 days shown
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Weekly Goal Modal ────────────────────────────────────────────── */}
        {isGoalModalOpen && (() => {
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
            <div className="fixed inset-0 z-[300] bg-black/70 flex items-end justify-center" onClick={() => setIsGoalModalOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="weekly-goal-title"
                className="bg-surface-container-low w-full max-w-md rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-full duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-5">
                  <h2 id="weekly-goal-title" className="font-black text-lg uppercase tracking-wide text-on-surface">Weekly Goal</h2>
                  <button aria-label="Close weekly goal" onClick={() => setIsGoalModalOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-variant text-on-surface-variant hover:text-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-surface rounded-2xl p-4 mb-4">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">This Week</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-variant" />
                        <circle
                          cx="28" cy="28" r="22" fill="none"
                          stroke="#c3f400" strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - Math.min(workoutsThisWeek / editableGoal, 1))}
                          style={{ transition: "stroke-dashoffset 0.4s ease" }}
                          opacity={workoutsThisWeek === 0 ? 0.25 : 1}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[13px] font-black text-primary">{workoutsThisWeek}/{editableGoal}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">
                        {workoutsThisWeek >= editableGoal ? "Goal reached! " : `${editableGoal - workoutsThisWeek} workout${editableGoal - workoutsThisWeek !== 1 ? "s" : ""} to go`}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">Avg last 4 weeks: {avgWeekly} sessions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-4 mb-5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Past 4 Weeks</p>
                  <div className="flex items-end gap-2 h-14">
                    {[...pastWeeks].reverse().map((count, i) => {
                      const h = editableGoal > 0 ? Math.min((count / editableGoal) * 100, 100) : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-on-surface-variant">{count}</span>
                          <div className="w-full rounded-t-sm relative" style={{ height: "40px" }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t bg-primary/70 transition-all duration-500"
                              style={{ height: `${Math.max(h, count > 0 ? 10 : 0)}%` }}
                            />
                            <div className="absolute bottom-0 w-full border-b-2 border-surface-variant" />
                          </div>
                          <span className="text-[9px] text-on-surface-variant">-{4-i}w</span>
                        </div>
                      );
                    })}
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-primary font-bold">{workoutsThisWeek}</span>
                      <div className="w-full rounded-t-sm relative" style={{ height: "40px" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-primary transition-all duration-500"
                          style={{ height: `${Math.min((workoutsThisWeek / editableGoal) * 100, 100)}%` }}
                        />
                        <div className="absolute bottom-0 w-full border-b-2 border-primary/30" />
                      </div>
                      <span className="text-[9px] text-primary font-bold">Now</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Set Your Goal</p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setEditableGoal(n);
                          setWeeklyGoal(n);
                        }}
                        className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${editableGoal === n ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(195,244,0,0.4)]" : "bg-surface-variant text-on-surface-variant hover:bg-surface-container"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-2 text-center">workouts per week</p>
                </div>
              </div>
            </div>
          );
        })()}

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
                      <span>{activity?.exercises?.length ?? 0} exercises</span>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : selectedDayIndex === todayIndex ? null : (
          <section className="bg-surface-container border border-surface-variant border-dashed rounded-xl p-stack-md flex flex-col items-center justify-center gap-1">
            <p className="text-body-md text-on-surface-variant">
              No activity logged for this day
            </p>
            <p className="text-label-bold text-primary-container text-xs cursor-pointer hover:underline">
              Add missed workout
            </p>
          </section>
        )}

        {/* Summary Modal */}
        {isSummaryModalOpen && focusedActivity && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="activity-summary-title" className="bg-surface-container-high border border-surface-variant rounded-xl w-full max-w-lg flex flex-col shadow-2xl max-h-[85vh]">
              <div className="p-6 border-b border-surface-variant flex justify-between items-center">
                <div>
                  <h2 id="activity-summary-title" className="text-xl font-bold text-primary mb-1">
                    {focusedActivity.title}
                  </h2>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                    {days[selectedDayIndex].full} • {getWorkoutLogDurationMinutes(focusedActivity.duration)}{" "}
                    min
                  </p>
                </div>
                <button
                  aria-label="Close activity summary"
                  onClick={() => {
                    setIsSummaryModalOpen(false);
                    setFocusedActivity(null);
                  }}
                  className="text-on-surface-variant hover:text-primary transition-colors min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-surface-variant"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex flex-col gap-6">
                {focusedActivity?.exercises?.map((ex, exIdx) => (
                  <div key={exIdx} className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-on-surface flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {t(ex.title)}
                      </h4>
                      <span className="text-xs text-on-surface-variant">
                        {ex.sets?.filter((s: any) => s.completed).length || 0} sets
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {ex.sets?.filter((s: any) => s.completed).map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className="bg-surface p-2 rounded border border-surface-variant text-center"
                        >
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                            {t("set")} {setIdx + 1}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {set.weight}{" "}
                            <span className="text-[10px] font-normal">
                              {unit}
                            </span>
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {set.reps} {isTimedExercise(ex) ? "secs" : t("reps")?.toLowerCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-surface-variant bg-surface-container flex gap-3">
                {onDeleteLog && focusedActivity?.id && (
                  <button
                    onClick={() => {
                      setPendingDeleteLogId(focusedActivity.id!);
                    }}
                    className="w-full py-3 bg-error/10 text-error rounded text-label-bold hover:bg-error/20 transition-colors"
                  >
                    {t("delete") || "Delete"}
                  </button>
                )}
                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="w-full py-3 bg-surface-variant text-on-surface rounded text-label-bold hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Next Workout Card */}
        {selectedDayIndex === todayIndex && !hasTodayWorkout && nextRoutine && (
          <section className="premium-panel rounded-2xl overflow-hidden">
            <button
              onClick={() => onStartLiveWorkout(nextRoutine.id)}
              className="relative w-full overflow-hidden h-36 md:h-48 flex flex-col justify-end p-4 md:p-6 group cursor-pointer active:scale-[0.99] transition-transform text-left"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSD3OOEmD78fTaBnJqYilure6mY1McKJ6Jf1YUDBmD_tkwF4V9xcADKpFJ6mZC0WG9YzPbJjI9pkzHh5FvgbWxAynV0sOt5RRKb3pi0mBbsFseaaeOy2OcfvyTDKJe4VvXbd6dbF4k5K6iJ6dTH0whAiw-XxPrNtJzCQDiZKPndVIfzkohVpwQqQt93btkiwmYK63DcAS2kLXIq07sUSjjb9b7uieN1Y34-dGHL8doGbYa6rQ7H7M8mS5BgKCAXrfr-ZrYHVv-zoo')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent" />
              <div className="absolute inset-0 bg-primary-container/5 mix-blend-overlay" />
              <div className="relative z-10 flex flex-col gap-stack-sm">
                <span className="w-fit border border-primary-container text-primary-container text-label-bold text-xs px-3 py-1 rounded bg-black/20">
                  Next Workout
                </span>
                <h3 className="text-headline-md text-primary tracking-tight">
                  {nextRoutine.name}
                </h3>
                <div className="flex items-center gap-4 text-on-surface-variant">
                  <p className="text-body-md flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {nextRoutine.duration} Min
                  </p>
                  <p className="text-body-md flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />{" "}
                    {nextRoutine?.exercises?.length ?? 0} Exercises
                  </p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* Quick Stats Bento Grid */}
        <section className="flex justify-between items-center">
          <h2 className="text-headline-md font-bold font-[var(--font-headline-md)] text-primary uppercase tracking-widest">
            {t("quick_stats")}
          </h2>
          <button
            onClick={() => setIsCustomizeStatsOpen(true)}
            className="min-h-11 rounded-xl px-3 text-primary hover:bg-white/5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors"
          >
            <SettingsIcon className="w-3 h-3" /> {t("customize")}
          </button>
        </section>
        {dashboardStats.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-stack-md">
            {/* Stat Card Avg Duration */}
            {dashboardStats.includes("avg_duration") && (
              <div
                onClick={() => navigateTo("progress")}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-surface-variant opacity-20">
                  <Clock className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-on-surface-variant relative z-10">
                  <Clock className="w-5 h-5 group-hover:text-primary-container transition-colors" />
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">Avg Duration</p>
                  <p className="text-headline-md text-primary">
                    {avgDurationMin}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">min</span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Total Sets Week */}
            {dashboardStats.includes("total_sets_week") && (
              <div
                onClick={() => navigateTo("progress")}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-surface-variant opacity-20">
                  <Layers className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-on-surface-variant relative z-10">
                  <Layers className="w-5 h-5 group-hover:text-primary-container transition-colors" />
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">Sets Done</p>
                  <p className="text-headline-md text-primary">
                    {totalSetsThisWeek}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">this week</span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Best Volume */}
            {dashboardStats.includes("best_volume") && (
              <div
                onClick={() => navigateTo("progress")}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-surface-variant opacity-20">
                  <TrendingUp className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-on-surface-variant relative z-10">
                  <TrendingUp className="w-5 h-5 group-hover:text-primary-container transition-colors" />
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">Best Session</p>
                  <p className="text-headline-md text-primary">
                    {bestVolumeSession >= 1000 ? (bestVolumeSession / 1000).toFixed(1) + "k" : bestVolumeSession}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">{unit.toLowerCase()}</span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Weight */}
            {dashboardStats.includes("weight") && (
              <div
                onClick={onUpdateWeight}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-secondary-container opacity-[0.03]">
                  <LucideLineChart className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-secondary-container relative z-10">
                  <LucideLineChart className="w-5 h-5 group-hover:text-secondary-fixed transition-colors" />
                  <ChevronRight className="w-4 h-4 group-hover:text-secondary-fixed transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">
                    Body Weight
                  </p>
                  <p className="text-headline-md text-secondary-fixed">
                    {displayWeight}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Volume */}
            {dashboardStats.includes("volume") && (
              <div
                onClick={() => navigateTo("progress")}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-surface-variant opacity-20">
                  <Dumbbell className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-on-surface-variant relative z-10">
                  <BarChart2 className="w-5 h-5 group-hover:text-primary-container transition-colors" />
                  <ChevronRight className="w-4 h-4 group-hover:text-primary-container transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">
                    Total Volume
                  </p>
                  <p className="text-headline-md text-primary">
                    {totalVolumeStr}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card PRs */}
            {dashboardStats.includes("prs") && (
              <div
                onClick={() => setIsPRModalOpen(true)}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-primary-container opacity-[0.03]">
                  <Trophy className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-primary-container relative z-10">
                  <Trophy className="w-5 h-5" />
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">
                    Personal Records
                  </p>
                  <p className="text-headline-md text-primary">
                    {totalPRs}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">
                      Total
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Workouts */}
            {dashboardStats.includes("workouts_week") && (
              <div
                onClick={() => navigateTo("progress")}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-surface-variant opacity-20">
                  <CheckCircle2 className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-on-surface-variant relative z-10">
                  <CheckCircle2 className="w-5 h-5 group-hover:text-primary-container transition-colors" />
                  <ChevronRight className="w-4 h-4 group-hover:text-primary-container transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">
                    Workouts
                  </p>
                  <p className="text-headline-md text-primary">
                    {workoutsThisWeek}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">
                      This Week
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* Stat Card Time */}
            {dashboardStats.includes("time_week") && (
              <div
                onClick={() => navigateTo("progress")}
                className="bg-surface-container p-stack-md rounded-lg border border-surface-variant flex flex-col gap-stack-md relative overflow-hidden cursor-pointer hover:border-primary-container transition-colors group"
              >
                <div className="absolute -right-4 -top-4 text-surface-variant opacity-20">
                  <Clock className="w-20 h-20" fill="currentColor" />
                </div>
                <div className="flex justify-between items-center text-on-surface-variant relative z-10">
                  <Clock className="w-5 h-5 group-hover:text-primary-container transition-colors" />
                  <ChevronRight className="w-4 h-4 group-hover:text-primary-container transition-colors" />
                </div>
                <div className="relative z-10">
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">
                    Total Time
                  </p>
                  <p className="text-headline-md text-primary">
                    {Math.floor(durationThisWeek / 60)}{" "}
                    <span className="text-body-md text-on-surface-variant font-normal">
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
                        fill="#c3f400"
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

        {/* Customize Stats Modal */}
        {isCustomizeStatsOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="customize-stats-title"
              className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden relative max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container shrink-0">
                <h2 id="customize-stats-title" className="text-xl font-bold text-primary mb-1 tracking-tight">
                  Customize Stats
                </h2>
                <button
                  aria-label="Close dashboard customization"
                  onClick={() => setIsCustomizeStatsOpen(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-surface-variant"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                <p className="text-body-sm text-on-surface-variant">
                  Select the quick stats you want to display on your dashboard.
                </p>

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
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isActive ? "bg-primary-container/10 border-primary-container text-on-background" : "bg-surface border-surface-variant text-on-surface-variant hover:bg-surface-variant"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`${isActive ? "text-primary" : "text-on-surface-variant"}`}
                        >
                          {stat.icon}
                        </div>
                        <span className="font-bold text-sm tracking-wide">
                          {stat.label}
                        </span>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full relative flex items-center shrink-0 transition-colors ${isActive ? "bg-primary-fixed" : "bg-surface-variant border border-outline-variant"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full absolute shadow-sm transition-all ${isActive ? "right-0.5 bg-on-primary-fixed" : "left-0.5 bg-on-surface-variant"}`}
                        ></div>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isActive}
                        onChange={() => {
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
            </div>
          </div>
        )}

        {/* Start Empty Workout Action - Small and at the bottom */}
        <section className="flex flex-col mt-4 self-center mb-8">
          <button
            onClick={() => onStartLiveWorkout("empty")}
            className="premium-cta min-h-12 w-fit rounded-full px-6 py-3 flex items-center gap-2 group active:scale-[0.97] transition-all hover:brightness-105 text-black"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              {t("start_empty")}
            </span>
          </button>
        </section>

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
