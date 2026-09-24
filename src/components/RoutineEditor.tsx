import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Clock,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  RefreshCw,
  PlusCircle,
  Check,
  CheckCircle2,
  Trash2,
  Copy,
  Link as LinkIcon,
  Dumbbell,
  Zap,
  HelpCircle,
  ChevronRight,
  Search,
  Disc,
  Flame,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import logoInAppImg from "../assets/images/logo_in_app.png";
import consoleIconImg from "../assets/images/liftlab_console_icon.png";

import { ConfirmModal, useBackDismiss } from "./common/ConfirmModal";
import { ExerciseMuscleVisual } from "./common/ExerciseMuscleVisual";
import { AddExercise } from "./common/AddExercise";
import { PlateCalculatorModal } from "./common/PlateCalculatorModal";
import {
  getExerciseRestPreset,
  buildPreviousSetsMap,
  buildCompletedWorkoutLog,
  getRestTimerLeft,
  isTimedExercise,
  isBodyweightExercise,
  generateWarmupSets,
  shouldRestoreLiveProgress,
  canCompleteSet,
  dissolveSuperset,
  finalizeLiveNumericInput,
  parseGymNumber,
  formatWeightUnit,
  roundToGymWeight,
} from "../lib/workoutUtils";
import { getExerciseSearchScore } from "../lib/searchUtils";
import { readJson, removeJsonAtomic, writeJsonAtomic } from "../lib/storage";
import { showToast } from "../lib/toast";
import {
  updateLiveWorkoutNotification,
  stopLiveWorkoutNotification,
  addLiveWorkoutActionListener,
  drainPendingLiveWorkoutActions,
} from "../lib/liveWorkoutBridge";
import type { RoutineData, ExerciseData, SetData } from "../types/workout";
import { triggerHaptic } from "../lib/haptics";

export function RoutineEditor({
  t,
  unit,
  exercises,
  routineId,
  initialRoutine,
  onBack,
  onSave,
  mode = "edit",
  onAddCustomExercise,
  onDiscard,
  restTimer = 90,
  setRestTimer,
  onOpenDetail,
  userName,
  workoutLogs = [],
  savedExerciseNotes = {},
  exerciseRestPresets = {},
  onSaveExerciseRestPreset,
  showRpe = false,
}: {
  t: any;
  unit: string;
  exercises: any[];
  routineId?: string;
  initialRoutine?: RoutineData;
  onBack: () => void;
  onSave: (r: RoutineData) => void;
  mode?: "edit" | "live";
  onAddCustomExercise?: (ex?: any) => void;
  onDiscard?: () => void;
  restTimer?: number;
  setRestTimer?: (val: number) => void;
  onOpenDetail?: (ex: ExerciseData) => void;
  userName?: string;
  workoutLogs?: any[];
  savedExerciseNotes?: Record<string, string>;
  exerciseRestPresets?: Record<string, number>;
  onSaveExerciseRestPreset?: (title: string, seconds: number) => void;
  showRpe?: boolean;
}) {
  const LIVE_PROGRESS_KEY = "liftlab_live_progress";
  const LIVE_ELAPSED_KEY  = "liftlab_live_elapsed";
  const LIVE_REST_TIMER_KEY = "liftlab_live_rest_timer";
  const LIVE_STARTED_AT_KEY = "liftlab_live_started_at";

  // ── Crash recovery: check for saved progress on mount ──────────────────
  const [wasRestored] = useState<boolean>(() => {
    if (mode !== "live") return false;
    const saved = readJson<RoutineData | null>(LIVE_PROGRESS_KEY, null);
    const targetId = initialRoutine?.id || routineId;
    return shouldRestoreLiveProgress(saved, targetId);
  });

  const [sessionStartedAt] = useState<number>(() => {
    if (mode !== "live") return Date.now();
    const saved = localStorage.getItem(LIVE_STARTED_AT_KEY);
    if (saved) {
      const parsed = Number(saved);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= Date.now()) {
        return parsed;
      }
    }
    const now = Date.now();
    localStorage.setItem(LIVE_STARTED_AT_KEY, String(now));
    return now;
  });

  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [isGuideDismissed, setIsGuideDismissed] = useState<boolean>(() => {
    return localStorage.getItem("liftlab_workout_guide_dismissed") === "true";
  });

  const handleDismissGuide = () => {
    localStorage.setItem("liftlab_workout_guide_dismissed", "true");
    setIsGuideDismissed(true);
  };
  const activeNotificationRef = useRef<Notification | null>(null);
  const [routine, setRoutine] = useState<RoutineData>(() => {
    // In live mode, restore saved progress if valid and matches target ID or is empty/dynamic session
    if (mode === "live") {
      const saved = readJson<RoutineData | null>(LIVE_PROGRESS_KEY, null);
      const targetId = initialRoutine?.id || routineId;
      if (shouldRestoreLiveProgress(saved, targetId)) {
        return saved!; // ← restore
      }
    }

    let rawExercises = initialRoutine?.exercises || [];
    if (mode === "live") {
      rawExercises = rawExercises.map((ex) => ({
        ...ex,
        sets: ex.sets?.map((s) => ({ ...s, completed: false })) || [],
      }));
    } else {
      rawExercises = JSON.parse(JSON.stringify(rawExercises));
    }

    return {
      id: initialRoutine?.id || routineId || crypto.randomUUID(),
      name: initialRoutine?.name || "",
      duration: initialRoutine?.duration || 60,
      tags: initialRoutine?.tags || [],
      exercises: rawExercises,
      scheduledDay: initialRoutine?.scheduledDay,
    };
  });

  const routineRef = useRef(routine);
  const unitLabel = formatWeightUnit(unit);

  const readWallClockRestLeft = () => getRestTimerLeft(readJson<any>(LIVE_REST_TIMER_KEY, null));

  const pushNativeLiveState = (
    currentRoutine?: RoutineData | null,
    restLeft?: number | null,
  ) => {
    if (mode !== "live") return;
    const source = currentRoutine || routineRef.current;
    if (!source) return;
    let activeExTitle = source.name || "Live Workout";
    let activeSetInfo = "In corso";
    for (const ex of source.exercises || []) {
      const incompleteIdx = (ex.sets || []).findIndex((s) => !s.completed);
      if (incompleteIdx !== -1) {
        const targetSet = ex.sets[incompleteIdx];
        activeExTitle = ex.title;
        const weightText =
          targetSet.weight !== "" && targetSet.weight !== undefined
            ? `${targetSet.weight} ${unitLabel} × `
            : "";
        const repsText = targetSet.reps ? `${targetSet.reps} ${isTimedExercise(ex) ? "secs" : "reps"}` : "";
        activeSetInfo = `Serie ${incompleteIdx + 1} di ${ex.sets.length}${weightText || repsText ? ` (${weightText}${repsText})` : ""}`;
        break;
      }
    }
    const remaining = restLeft !== undefined ? restLeft : readWallClockRestLeft();
    void updateLiveWorkoutNotification({
      currentExercise: activeExTitle,
      currentSetInfo: activeSetInfo,
      restRemainingSeconds: remaining && remaining > 0 ? remaining : 0,
      isResting: Boolean(remaining && remaining > 0),
    });
  };

  if (!routine) return null;

  const [elapsed, setElapsed] = useState<number>(() => {
    if (mode !== "live") return 0;
    return Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
  });
  const [activeRestLeft, setActiveRestLeft] = useState<number | null>(() => {
    if (mode !== "live") return null;
    return getRestTimerLeft(readJson<any>(LIVE_REST_TIMER_KEY, null));
  });
  const [initialRestDuration, setInitialRestDuration] = useState<number>(() => {
    if (mode !== "live") return 90;
    const parsed = readJson<any>(LIVE_REST_TIMER_KEY, null);
    return parsed?.duration || 90;
  });
  const lastBeepSecondRef = useRef<number | null>(null);

  // Build a map of previous sets for each exercise from the most recent workout log
  const prevSetsMap = useMemo(
    () => buildPreviousSetsMap(workoutLogs, routine.exercises),
    [workoutLogs, routine.exercises],
  );

  const normalizeExerciseTitle = (title: string) => title.trim().toLowerCase();

  const isRoutineModified = (current: RoutineData, initial?: RoutineData): boolean => {
    if (!initial) return false;
    const initExs = initial.exercises || [];
    const currExs = current.exercises || [];
    if (initExs.length !== currExs.length) return true;

    for (let i = 0; i < currExs.length; i++) {
      const cEx = currExs[i];
      const iEx = initExs[i];
      if (cEx.id !== iEx.id || cEx.title !== iEx.title) return true;
      if ((cEx.sets?.length || 0) !== (iEx.sets?.length || 0)) return true;
      for (let j = 0; j < (cEx.sets?.length || 0); j++) {
        const cSet = cEx.sets[j];
        const iSet = iEx.sets[j];
        if (!iSet) return true;
        if (cSet.weight !== iSet.weight || cSet.reps !== iSet.reps) return true;
      }
    }
    return false;
  };

  // Helper to play tone using Web Audio API
  const playTone = (frequency: number, durationMs: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {}
  };

  const startRestTimer = async (duration: number) => {
    lastBeepSecondRef.current = null;
    if (duration <= 0) {
      localStorage.removeItem(LIVE_REST_TIMER_KEY);
      setActiveRestLeft(null);
      pushNativeLiveState(routineRef.current, 0);
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      } catch (e) {}
      return;
    }
    if (activeRestLeft === null || duration > initialRestDuration) {
      setInitialRestDuration(duration);
    }
    const state = { duration, startedAt: Date.now() };
    localStorage.setItem(LIVE_REST_TIMER_KEY, JSON.stringify(state));
    setActiveRestLeft(duration);
    pushNativeLiveState(routineRef.current, duration);

    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: "Rest Over!",
            body: "Time for your next set. Tap to resume workout.",
            schedule: { at: new Date(Date.now() + duration * 1000) },
            sound: "beep.wav",
          },
        ],
      });
    } catch (e) {}
  };

  const showTimerNotification = (seconds: number) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (seconds <= 0) {
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
      return;
    }
    const title = `Rest ${formatTime(seconds)}`;
    const body = "LiftLab rest timer running.";
    try {
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
      }
      const notification = new Notification(title, {
        body,
        icon: consoleIconImg,
        badge: consoleIconImg,
        tag: "liftlab-rest-timer",
        silent: true,
      });
      activeNotificationRef.current = notification;
    } catch {
      // Browser/WebView can reject notifications in unsupported contexts.
    }
  };

  useEffect(() => {
    if (mode !== "live" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, [mode]);

  useEffect(() => {
    if (activeRestLeft === null) {
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
      return;
    }
    const tick = () => {
      const savedState = readJson<any>(LIVE_REST_TIMER_KEY, null);
      let next = getRestTimerLeft(savedState);
      if (next === null) {
        if (savedState) {
          localStorage.removeItem(LIVE_REST_TIMER_KEY);
          showTimerNotification(0);
          const expiredAgoMs = Date.now() - ((savedState.startedAt || 0) + (savedState.duration || 0) * 1000);
          if (lastBeepSecondRef.current !== 0 && expiredAgoMs >= 0 && expiredAgoMs < 10000) {
            lastBeepSecondRef.current = 0;
            playTone(880, 400);
          }
        }
      } else if (next === 0) {
        localStorage.removeItem(LIVE_REST_TIMER_KEY);
        showTimerNotification(0);
        if (lastBeepSecondRef.current !== 0) {
          lastBeepSecondRef.current = 0;
          playTone(880, 400);
        }
        next = null;
      } else if (next === 3 || next === 2 || next === 1) {
        if (lastBeepSecondRef.current !== next) {
          lastBeepSecondRef.current = next;
          playTone(440, 80);
        }
      }
      if (next === null || next === 0) {
        pushNativeLiveState(routineRef.current, 0);
      }
      setActiveRestLeft(next);
    };
    const interval = setInterval(tick, 1000);
    tick();
    return () => {
      clearInterval(interval);
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeRestLeft !== null]);

  const hasAppliedPreviousSets = useRef(wasRestored);
  useEffect(() => {
    if (mode !== "live" || hasAppliedPreviousSets.current) return;
    if (Object.keys(prevSetsMap).length === 0) return;
    hasAppliedPreviousSets.current = true;
    setRoutine((current) => ({
      ...current,
      exercises: current.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((set, idx) => {
          const previous = prevSetsMap[ex.id]?.[idx];
          if (!previous) return set;
          return {
            ...set,
            weight: set.weight === "" ? previous.weight : set.weight,
            reps: set.reps === "" ? previous.reps : set.reps,
          };
        }),
      })),
    }));
  }, [mode, prevSetsMap]);

  const elapsedRef = useRef(elapsed);

  useEffect(() => {
    routineRef.current = routine;
  }, [routine]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // Sync exercise/set text with native Foreground Service. Rest seconds are
  // owned by the native countdown except when rest starts, stops, or resumes.
  useEffect(() => {
    if (mode !== "live" || !routine) return;
    pushNativeLiveState(routine);
  }, [mode, routine]);

  // Handle native notification action button taps
  useEffect(() => {
    if (mode !== "live") return;

    const handleAction = (action: string) => {
      if (action === "complete_set") {
        const currentRoutine = routineRef.current;
        if (!currentRoutine) return;

        let foundExId: string | null = null;
        let foundSetId: string | null = null;
        let foundExercise: ExerciseData | undefined;
        for (const ex of currentRoutine.exercises || []) {
          const incSet = (ex.sets || []).find((s) => !s.completed);
          if (incSet) {
            foundExId = ex.id;
            foundSetId = incSet.id;
            foundExercise = ex;
            if (!canCompleteSet(incSet, ex)) return;
            break;
          }
        }
        if (!foundExId || !foundSetId) return;

        const updatedRoutine: RoutineData = {
          ...currentRoutine,
          exercises: currentRoutine.exercises.map((ex) =>
            ex.id === foundExId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.id === foundSetId
                      ? {
                          ...s,
                          completed: true,
                          weight: finalizeLiveNumericInput(s.weight),
                          reps: finalizeLiveNumericInput(s.reps),
                        }
                      : s,
                  ),
                }
              : ex,
          ),
        };

        setRoutine(updatedRoutine);
        writeJsonAtomic(LIVE_PROGRESS_KEY, updatedRoutine);

        const timer = foundExercise
          ? getExerciseRestPreset(foundExercise, exerciseRestPresets, restTimer)
          : restTimer;
        if (timer > 0) {
          startRestTimer(timer);
        } else {
          pushNativeLiveState(updatedRoutine, 0);
        }
      } else if (action === "add_30s") {
        const current = readWallClockRestLeft() || 0;
        startRestTimer(current + 30);
      } else if (action === "skip_rest") {
        startRestTimer(0);
      }
    };

    const listener = addLiveWorkoutActionListener(handleAction);
    return () => {
      listener.remove();
    };
  }, [mode, exerciseRestPresets, restTimer]);

  // ── Auto-save live workout progress reactively on every routine change ─────
  useEffect(() => {
    if (mode !== "live" || !routine) return;
    const timer = setTimeout(() => {
      writeJsonAtomic(LIVE_PROGRESS_KEY, routine);
    }, 200);
    return () => clearTimeout(timer);
  }, [mode, routine]);

  // Keep screen awake during live workout
  useEffect(() => {
    if (mode !== "live") return;
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
        }
      } catch {}
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLockSentinel?.release) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [mode]);

  // Flush live state immediately on backgrounding or pagehide
  useEffect(() => {
    if (mode !== "live") return;
    const flushNow = () => {
      if (routineRef.current) {
        writeJsonAtomic(LIVE_PROGRESS_KEY, routineRef.current);
      }
      localStorage.setItem(LIVE_ELAPSED_KEY, String(elapsedRef.current));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushNow();
      } else {
        pushNativeLiveState(routineRef.current, readWallClockRestLeft());
        void drainPendingLiveWorkoutActions();
      }
    };

    window.addEventListener("pagehide", flushNow);
    window.addEventListener("beforeunload", flushNow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let appStateListener: { remove: () => Promise<void> } | null = null;
    CapacitorApp.addListener("appStateChange", (state) => {
      if (!state.isActive) {
        flushNow();
      } else {
        pushNativeLiveState(routineRef.current, readWallClockRestLeft());
        void drainPendingLiveWorkoutActions();
      }
    }).then((listener) => {
      appStateListener = listener;
    }).catch(() => undefined);

    return () => {
      window.removeEventListener("pagehide", flushNow);
      window.removeEventListener("beforeunload", flushNow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      appStateListener?.remove();
    };
  }, [mode]);

  // Save elapsed time periodically every 5 seconds
  useEffect(() => {
    if (mode !== "live") return;
    const interval = setInterval(() => {
      localStorage.setItem(LIVE_ELAPSED_KEY, String(elapsed));
    }, 5000);
    return () => clearInterval(interval);
  }, [mode, elapsed]);
  // ─────────────────────────────────────────────────────────────────────────

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isHeaderFinishVisible, setIsHeaderFinishVisible] = useState(true);
  const headerFinishButtonRef = useRef<HTMLButtonElement | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [isCustomExerciseOpen, setIsCustomExerciseOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [debouncedExerciseSearch, setDebouncedExerciseSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("All");
  const [filterEquipment, setFilterEquipment] = useState<string>("All");
  const [isMuscleFilterOpen, setIsMuscleFilterOpen] = useState(false);
  const [isEquipmentFilterOpen, setIsEquipmentFilterOpen] = useState(false);
  const [makingSupersetForId, setMakingSupersetForId] = useState<string | null>(
    null,
  );
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);

  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [plateCalcInitialWeight, setPlateCalcInitialWeight] = useState<number | undefined>(undefined);

  const openPlateCalculator = (ex: ExerciseData) => {
    const topWeight = (ex.sets || []).reduce((max: number, s: SetData) => {
      const w = Number(s.weight) || 0;
      return w > max ? w : max;
    }, 0);
    setPlateCalcInitialWeight(topWeight > 0 ? topWeight : undefined);
    setIsPlateCalcOpen(true);
  };

  const handleGenerateWarmup = (exId: string) => {
    const ex = (routine?.exercises ?? []).find((e) => e.id === exId);
    if (!ex) return;
    const firstSetWeight = Number(ex.sets[0]?.weight);
    const workingWeight = Number.isFinite(firstSetWeight) && firstSetWeight > 0 ? firstSetWeight : 60;
    const barWeight = unit.toUpperCase() === "LBS" ? 45 : 20;

    const generated = generateWarmupSets(workingWeight, barWeight);
    const warmupSets: SetData[] = generated.map((wSet) => ({
      id: crypto.randomUUID(),
      weight: wSet.weight,
      reps: wSet.reps,
      completed: false,
      technique: "Warmup",
    }));

    updateExercise(exId, {
      sets: [...warmupSets, ...(ex.sets || [])],
    });

    showToast("Warmup sets generated!", "success");
  };

  // Debounce exercise search to avoid lag on large exercise list
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedExerciseSearch(exerciseSearch), 150);
    return () => clearTimeout(timer);
  }, [exerciseSearch]);

  const openExerciseModal = (supersetId?: string, replaceId?: string) => {
    setExerciseSearch("");
    setDebouncedExerciseSearch("");
    if (replaceId) {
      setReplacingExerciseId(replaceId);
      const oldEx = routine.exercises.find((e) => e.id === replaceId);
      if (oldEx && oldEx.category) {
        setFilterMuscle(oldEx.category);
      } else {
        setFilterMuscle("All");
      }
    } else {
      setReplacingExerciseId(null);
      setFilterMuscle("All");
    }
    setFilterEquipment("All");
    setIsMuscleFilterOpen(false);
    setIsEquipmentFilterOpen(false);
    if (supersetId) setMakingSupersetForId(supersetId);
    setIsExerciseModalOpen(true);
  };

  const closeExerciseModal = () => {
    setIsExerciseModalOpen(false);
    setReplacingExerciseId(null);
    setMakingSupersetForId(null);
    setExerciseSearch("");
    setDebouncedExerciseSearch("");
    setFilterMuscle("All");
    setFilterEquipment("All");
  };

  useBackDismiss(discardConfirmOpen, () => setDiscardConfirmOpen(false));
  useBackDismiss(isFinishConfirmOpen, () => setIsFinishConfirmOpen(false));
  useBackDismiss(isCustomExerciseOpen, () => setIsCustomExerciseOpen(false));
  useBackDismiss(isExerciseModalOpen, closeExerciseModal);
  useBackDismiss(isMuscleFilterOpen, () => setIsMuscleFilterOpen(false));
  useBackDismiss(isEquipmentFilterOpen, () => setIsEquipmentFilterOpen(false));
  useBackDismiss(isPlateCalcOpen, () => setIsPlateCalcOpen(false));

  const handleCustomExSave = (ex: any) => {
    try {
      if (onAddCustomExercise) {
        onAddCustomExercise(ex); // persist to offline storage/localStorage
      }
      addExercise(ex); // add to current routine
    } catch (error) {
      console.error("Error saving custom exercise:", error);
    } finally {
      setIsCustomExerciseOpen(false);
    }
  };

  useEffect(() => {
    if (mode === "live") {
      const tick = () => {
        const currentElapsed = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
        setElapsed(currentElapsed);
        localStorage.setItem(LIVE_ELAPSED_KEY, String(currentElapsed));
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, sessionStartedAt]);

  useEffect(() => {
    if (mode !== "live") {
      setIsHeaderFinishVisible(true);
      return;
    }
    const button = headerFinishButtonRef.current;
    if (!button) {
      setIsHeaderFinishVisible(false);
      return;
    }
    let frame = 0;
    const updateVisibility = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = button.getBoundingClientRect();
        setIsHeaderFinishVisible(rect.bottom > 0 && rect.top < window.innerHeight);
      });
    };
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [mode]);

  const handleRoutineSave = async () => {
    if (isSaving) return;
    if (mode === "live") {
      const completedRoutine = buildCompletedWorkoutLog(routine);
      if (completedRoutine.exercises.length === 0) {
        showToast(t("complete_one_set_first") || "Complete at least one set before finishing.", "error");
        return;
      }
      // If empty session or modified structure, proceed to onSave which prompts the single Save-as-Routine modal in App
      if (routineId === "empty" || !routineId || isRoutineModified(routine, initialRoutine)) {
        setIsSaving(true);
        try {
          await onSave({ ...routine, duration: elapsed });
        } finally {
          setIsSaving(false);
        }
        return;
      }
      setIsFinishConfirmOpen(true);
      return;
    }
    if (!routine.name || !routine.name.trim()) {
      showToast(t("routine_name_required") || "Routine name is required.", "error");
      return;
    }
    if (!routine.exercises || routine.exercises.length === 0) {
      showToast(t("add_at_least_one_exercise") || "Add at least one exercise to save the routine.", "error");
      return;
    }
    setIsSaving(true);
    removeJsonAtomic(LIVE_PROGRESS_KEY);
    localStorage.removeItem(LIVE_ELAPSED_KEY);
    localStorage.removeItem(LIVE_REST_TIMER_KEY);
    localStorage.removeItem(LIVE_STARTED_AT_KEY);
    try {
      await onSave(routine);
    } finally {
      setIsSaving(false);
    }
  };

  const updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoutine({ ...routine, name: e.target.value });
  };

  const updateScheduledDay = (dayIndex: number) => {
    setRoutine({
      ...routine,
      scheduledDay: (routine.scheduledDay != null && Number(routine.scheduledDay) === dayIndex) ? undefined : dayIndex,
    });
  };

  const addExercise = (exDef: any) => {
    const savedNote = savedExerciseNotes[normalizeExerciseTitle(exDef.title || "")] || "";
    const savedRestTimer = getExerciseRestPreset(exDef, exerciseRestPresets, restTimer);
    const newEx: ExerciseData = {
      id: crypto.randomUUID(),
      title: exDef.title,
      category: exDef.category as any,
      type: exDef.type,
      image: exDef.image,
      notes: savedNote,
      restTimer: savedRestTimer,
      sets: [
        { id: crypto.randomUUID(), weight: "", reps: "", completed: false },
      ],
    };
    if (makingSupersetForId) {
      const parentIdx = routine.exercises.findIndex(
        (e) => e.id === makingSupersetForId,
      );
      if (parentIdx !== -1) {
        const newExercises = [...routine.exercises];
        const parent = newExercises[parentIdx];
        const newSupersetId = parent.supersetId || crypto.randomUUID();
        newExercises[parentIdx] = {
          ...parent,
          technique: "superset",
          supersetId: newSupersetId,
        };
        newEx.technique = "superset";
        newEx.supersetId = newSupersetId;
        newExercises.splice(parentIdx + 1, 0, newEx);
        setRoutine({ ...routine, exercises: newExercises });
      }
      setMakingSupersetForId(null);
    } else if (replacingExerciseId) {
      // Replace exercise but keep sets count
      const idx = routine.exercises.findIndex(e => e.id === replacingExerciseId);
      if (idx !== -1) {
        const oldEx = routine.exercises[idx];
        const newExercises = [...routine.exercises];
        newExercises[idx] = {
          ...newEx,
          id: oldEx.id, // keep the same id
          sets: oldEx.sets.map(s => ({ ...s, completed: false })), // reset completion
        };
        setRoutine({ ...routine, exercises: newExercises });
      }
      setReplacingExerciseId(null);
    } else {
      setRoutine({
        ...routine,
        exercises: [...(routine?.exercises ?? []), newEx],
      });
    }
    closeExerciseModal();
  };

  const duplicateExercise = (id: string) => {
    const ex = (routine?.exercises ?? []).find((e) => e.id === id);
    if (!ex) return;
    const duplicated = {
      ...ex,
      id: crypto.randomUUID(),
      sets: ex.sets.map((s) => ({ ...s, id: crypto.randomUUID() })),
    };
    const newExercises = [...(routine?.exercises ?? [])];
    const idx = newExercises.findIndex((e) => e.id === id);
    newExercises.splice(idx + 1, 0, duplicated);
    setRoutine({ ...routine, exercises: newExercises });
    setActiveMenuId(null);
  };

  const deleteExercise = (id: string) => {
    setRoutine({
      ...routine,
      exercises: (routine?.exercises ?? []).filter((e) => e.id !== id),
    });
    setActiveMenuId(null);
  };

  const moveExercise = (id: string, dir: "up" | "down") => {
    const exs = routine.exercises ?? [];
    const idx = exs.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= exs.length) return;
    const newExs = [...exs];
    [newExs[idx], newExs[newIdx]] = [newExs[newIdx], newExs[idx]];
    setRoutine({ ...routine, exercises: newExs });
    setActiveMenuId(null);
  };

  const removeSuperset = (exId: string) => {
    setRoutine({
      ...routine,
      exercises: dissolveSuperset(routine?.exercises ?? [], exId),
    });
    setActiveMenuId(null);
  };

  const updateExercise = (id: string, updates: Partial<ExerciseData>) => {
    setRoutine({
      ...routine,
      exercises: (routine?.exercises ?? []).map((ex) =>
        ex.id === id ? { ...ex, ...updates } : ex,
      ),
    });
  };

  const addSet = (exId: string, technique?: string) => {
    const newSet: SetData = {
      id: crypto.randomUUID(),
      weight: "",
      reps: "",
      completed: false,
      technique,
    };
    const ex = (routine?.exercises ?? []).find((e) => e.id === exId);
    if (!ex) return;
    updateExercise(exId, { sets: [...ex.sets, newSet] });
  };

  const updateSet = (
    exId: string,
    setId: string,
    updates: Partial<SetData>,
  ) => {
    const ex = (routine?.exercises ?? []).find((e) => e.id === exId);
    if (!ex) return;
    updateExercise(exId, {
      sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
    });
  };

  const deleteSet = (exId: string, setId: string) => {
    const ex = (routine?.exercises ?? []).find((e) => e.id === exId);
    if (!ex) return;
    updateExercise(exId, {
      sets: ex.sets.filter((s) => s.id !== setId),
    });
  };

  const adjustSetWeight = (exId: string, setId: string, delta: number) => {
    const ex = (routine?.exercises ?? []).find((e) => e.id === exId);
    const s = ex?.sets.find((set) => set.id === setId);
    if (!s) return;
    const currentWeight = parseGymNumber(s.weight) ?? (isBodyweightExercise(ex) ? 0 : 20);
    const newWeight = Math.max(0, Math.round((currentWeight + delta) * 10) / 10);
    triggerHaptic("light");
    updateSet(exId, setId, { weight: newWeight });
  };

  const adjustSetReps = (exId: string, setId: string, delta: number) => {
    const ex = (routine?.exercises ?? []).find((e) => e.id === exId);
    const s = ex?.sets.find((set) => set.id === setId);
    if (!s) return;
    const currentReps = parseGymNumber(s.reps) ?? 8;
    const newReps = Math.max(1, currentReps + delta);
    triggerHaptic("light");
    updateSet(exId, setId, { reps: newReps });
  };

  const toggleSetCompletion = (
    exId: string,
    setId: string,
    currentCompleted: boolean,
  ) => {
    const activeExercise = (routine?.exercises ?? []).find((ex) => ex.id === exId);
    const targetSet = activeExercise?.sets.find((s) => s.id === setId);
    if (!currentCompleted && (!activeExercise || !canCompleteSet(targetSet, activeExercise))) {
      showToast(t("complete_set_needs_values") || "Enter weight and reps before completing the set.", "error");
      return;
    }
    const updatedCompleted = !currentCompleted;
    if (updatedCompleted) {
      triggerHaptic("success");
    } else {
      triggerHaptic("light");
    }

    const updatedSets = (activeExercise?.sets ?? []).map((s) => {
      if (s.id === setId) {
        return {
          ...s,
          completed: updatedCompleted,
          weight: finalizeLiveNumericInput(s.weight),
          reps: finalizeLiveNumericInput(s.reps),
        };
      }
      return s;
    });

    // Auto-carry forward weight and reps to next set if next set is empty
    if (updatedCompleted) {
      const setIdx = updatedSets.findIndex((s) => s.id === setId);
      if (setIdx >= 0 && setIdx + 1 < updatedSets.length) {
        const nextSet = updatedSets[setIdx + 1];
        const currentSet = updatedSets[setIdx];
        const nextHasNoWeight = nextSet.weight === "" || nextSet.weight === undefined || nextSet.weight === null;
        const nextHasNoReps = nextSet.reps === "" || nextSet.reps === undefined || nextSet.reps === null;
        if (nextHasNoWeight && nextHasNoReps) {
          updatedSets[setIdx + 1] = {
            ...nextSet,
            weight: currentSet.weight,
            reps: currentSet.reps,
          };
        }
      }
    }

    const updatedRoutine: RoutineData = {
      ...routine,
      exercises: (routine?.exercises ?? []).map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: updatedSets,
            }
          : ex,
      ),
    };
    setRoutine(updatedRoutine);
    if (mode === "live") {
      writeJsonAtomic(LIVE_PROGRESS_KEY, updatedRoutine);
    }
    const allWorkoutSetsCompleted = updatedRoutine.exercises.every((ex) =>
      ex.sets.every((s) => s.completed),
    );
    if (!currentCompleted && mode === "live" && !allWorkoutSetsCompleted) {
      const timer = activeExercise
        ? getExerciseRestPreset(activeExercise, exerciseRestPresets, restTimer)
        : restTimer;
      if (timer > 0) {
        startRestTimer(timer);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalWorkoutSets = routine.exercises.reduce(
    (sum, ex) => sum + (ex.sets?.length || 0),
    0,
  );
  const completedWorkoutSets = routine.exercises.reduce(
    (sum, ex) => sum + (ex.sets || []).filter((set) => set.completed).length,
    0,
  );
  const workoutProgress =
    totalWorkoutSets > 0
      ? Math.round((completedWorkoutSets / totalWorkoutSets) * 100)
      : 0;

  const modalExerciseResults = useMemo(() => {
    const queryStr = debouncedExerciseSearch.trim();
    return exercises
      .map((ex) => {
        return { ex, score: getExerciseSearchScore(queryStr, ex, t) };
      })
      .filter(({ ex, score }) => {
        const matchesSearch = !queryStr || score > 0;
        const matchesMuscle =
          filterMuscle === "All" ||
          ex.category === filterMuscle ||
          (ex.muscleFocus && ex.muscleFocus.includes(filterMuscle));
        const matchesEquipment = filterEquipment === "All" || ex.equipment === filterEquipment;
        return matchesSearch && matchesMuscle && matchesEquipment;
      })
      .sort((a, b) => b.score - a.score || String(a.ex.title).localeCompare(String(b.ex.title)))
      .slice(0, queryStr ? 80 : 32)
      .map(({ ex }) => ex);
  }, [debouncedExerciseSearch, exercises, filterEquipment, filterMuscle, t]);

  return (
    <div className={`app-shell bg-background text-on-surface antialiased min-h-[100dvh] flex flex-col font-[var(--font-body-md)] w-full ${mode === "live" ? "pb-44" : "pb-24"}`}>
      {/* TopAppBar */}
      <header className="console-topbar safe-topbar flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop sticky top-0 z-50">
        <div className="flex items-center gap-stack-md">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="h-10 flex items-center justify-center overflow-hidden">
            <img
              src={logoInAppImg}
              alt="LIFTLAB"
              className="h-full w-auto object-contain"
            />
          </div>
        </div>
        <div className="flex items-center gap-stack-md">
          {mode === "live" && onDiscard && (
            <button
              onClick={() => {
                setDiscardConfirmOpen(true);
              }}
              className="text-error font-bold uppercase hover:bg-error/10 active:scale-95 transition-all tracking-wider px-3 py-2 rounded-full text-[11px] cursor-pointer"
            >
              {t("exit_workout") || "Abbandona"}
            </button>
          )}
          <button
            ref={mode === "live" ? headerFinishButtonRef : undefined}
            onClick={handleRoutineSave}
            disabled={isSaving}
            className={`premium-cta font-black rounded-full uppercase hover:brightness-110 active:scale-95 transition-all tracking-wider ${mode === "live" ? "px-4 py-2 text-[11px]" : "px-5 py-2.5 text-sm"} ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></span>
                {t("saving") || "Saving..."}
              </div>
            ) : mode === "live" ? (
              t("finish_workout")
            ) : (
              t("save_routine")
            )}
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-grow p-margin-mobile md:p-margin-desktop max-w-[1280px] mx-auto w-full">
        {/* Routine Header */}
        <div className="mb-stack-lg flex flex-col md:flex-row justify-between items-stretch md:items-start gap-4 premium-panel rounded-2xl p-4 md:p-6 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed via-secondary to-primary-fixed opacity-80" />
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent border-none font-[var(--font-headline-lg)] text-[24px] sm:text-[32px] md:text-[34px] font-black text-primary focus:ring-0 p-0 mb-stack-sm outline-none placeholder:text-on-surface-variant/50 uppercase tracking-wide truncate"
              placeholder={t("routine_name")}
              type="text"
              value={routine.name}
              onChange={updateName}
            />
            <p className="text-on-surface-variant text-[15px] font-semibold">
              {mode === "live" ? t("workout_in_progress") : t("build_routine")}
            </p>
            {mode === "live" && (
              <div className="mt-4 grid grid-cols-3 gap-2 max-w-xl">
                <div className="bg-black/25 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black">
                    {t("set") || "Sets"}
                  </p>
                  <p className="text-xl font-black text-primary leading-none">
                    {completedWorkoutSets}/{totalWorkoutSets}
                  </p>
                </div>
                <div className="bg-black/25 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black">
                    {t("progress") || "Progress"}
                  </p>
                  <p className="text-xl font-black text-primary-fixed leading-none">
                    {workoutProgress}%
                  </p>
                </div>
                <div className="bg-black/25 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black">
                    {t("rest_timer") || "Rest"}
                  </p>
                  <p className="text-xl font-black text-primary leading-none tabular-nums">
                    {activeRestLeft === null ? (t("off") || "Off") : formatTime(activeRestLeft)}
                  </p>
                </div>
              </div>
            )}
            {mode !== "live" && (
              <div className="flex flex-row flex-wrap gap-stack-lg mt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {t("schedule_day")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["mo", "tu", "we", "th", "fr", "sa", "su"].map(
                      (dayKey, dIdx) => (
                        <button
                          key={dIdx}
                          onClick={() => updateScheduledDay(dIdx)}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                            (routine.scheduledDay != null && Number(routine.scheduledDay) === dIdx)
                              ? "premium-cta border-transparent scale-105"
                              : "bg-surface border-surface-variant text-on-surface-variant hover:border-primary-fixed/60 hover:bg-white/5"
                          }`}
                        >
                          {t(dayKey)}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {t("rest_timer")}
                  </span>
                  <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-full h-10 px-1">
                    <button
                      onClick={() =>
                        setRestTimer?.(Math.max(0, restTimer - 15))
                      }
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm w-8 text-center text-primary">
                      {restTimer}s
                    </span>
                    <button
                      onClick={() => setRestTimer?.(restTimer + 15)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {mode === "live" && (
            <div className="flex gap-x-stack-lg gap-y-2 items-center justify-between md:justify-end flex-wrap pt-2 md:pt-0 border-t border-white/5 md:border-t-0">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {t("rest_duration")}
                </span>
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-full p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setRestTimer?.(Math.max(0, restTimer - 15));
                    }}
                    aria-label="Decrease rest timer by 15 seconds"
                    className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs min-w-8 text-center text-primary tabular-nums">
                    {restTimer}s
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setRestTimer?.(restTimer + 15);
                    }}
                    aria-label="Increase rest timer by 15 seconds"
                    className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end text-primary">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("time_elapsed")}
                </span>
                <span className="font-[var(--font-stats-xl)] text-[24px] font-black tracking-tight leading-none h-8 tabular-nums">
                  {formatTime(elapsed)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Exercise List */}
        {wasRestored && (
          <div
            data-testid="recovered-banner"
            className="mx-margin-mobile mb-2 px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-400"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-bold">{t("session_recovered") || "Session recovered after crash — check your sets"}</span>
          </div>
        )}
        {mode === "live" && workoutLogs.length === 0 && !isGuideDismissed && (
          <div className="mx-margin-mobile md:mx-margin-desktop mb-4 p-4 rounded-2xl bg-[#1C1C1E] border border-[#30D158]/30 shadow-lg relative flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#30D158]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t("workout_guide_title") || "Come registrare la sessione"}
                </h4>
              </div>
              <button
                onClick={handleDismissGuide}
                className="text-[#8E8E93] hover:text-white text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                {t("got_it") || "Ho capito"}
              </button>
            </div>
            <ul className="text-xs text-[#8E8E93] space-y-1 pl-1">
              <li>• <strong>{unit}</strong> e <strong>{t("reps_upper") || "RIPET."}</strong>: inserisci i valori per ogni serie completata.</li>
              <li>• <strong>Numero serie (1, 2...)</strong>: tocca per segnarla come completata e avviare il recupero.</li>
              <li>• <strong>{t("previous") || "Prec."}</strong>: mostra i tuoi carichi passati per confrontare i progressi.</li>
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-lg relative">
          {(function () {
            const groups: any[][] = [];
            let currentGroup: any[] = [];
            (routine?.exercises || []).forEach((ex: any) => {
              if (currentGroup.length === 0) {
                currentGroup.push(ex);
              } else {
                const lastEx = currentGroup[currentGroup.length - 1];
                if (ex.supersetId && lastEx.supersetId === ex.supersetId) {
                  currentGroup.push(ex);
                } else {
                  groups.push(currentGroup);
                  currentGroup = [ex];
                }
              }
            });
            if (currentGroup.length > 0) {
              groups.push(currentGroup);
            }
            return groups.map((group, groupIdx) => (
              <div
                key={`group-${groupIdx}`}
                className={`md:col-span-12 flex flex-col gap-4 relative ${group.length > 1 ? "pl-4 border-l-2 border-primary-fixed/50 py-2" : ""}`}
              >
                {group.length > 1 && (
                  <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase font-black tracking-widest text-primary-fixed drop-shadow-sm whitespace-nowrap bg-background px-2 z-20 shadow-sm rounded-full border border-primary-fixed/30">
                    {t("superset")}
                  </div>
                )}
                {group.map((ex, idx) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="relative z-10 w-full"
                  >
                    <div className="apple-glass-card rounded-3xl p-stack-lg relative transition-all duration-200 hover:border-white/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-stack-md">
                        <div className="flex items-center gap-stack-md">
                          <div className="w-16 h-16 bg-black/35 flex items-center justify-center rounded-2xl border border-white/10 flex-shrink-0 shadow-inner">
                            <Dumbbell className="text-primary-fixed w-8 h-8" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <input
                                className={`font-black text-[16px] bg-transparent border-none text-primary mb-1 uppercase tracking-wide outline-none w-full max-w-xs ${mode === "live" ? "cursor-default select-none" : ""}`}
                                value={t(ex.title)}
                                onChange={(e) =>
                                  mode !== "live" && updateExercise(ex.id, { title: e.target.value })
                                }
                                readOnly={mode === "live"}
                                placeholder={t("exercise_name") || "Exercise Name"}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic("light");
                                  openPlateCalculator(ex);
                                }}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-primary-fixed transition-colors active:scale-90 cursor-pointer rounded-xl hover:bg-white/5 shrink-0 mb-1"
                                title={t("plate_calculator") || "Plate Calculator"}
                                aria-label="Open plate calculator"
                              >
                                <Disc className="w-4 h-4 text-primary-fixed" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs font-bold">
                              <span className="text-primary-fixed uppercase tracking-wider">
                                {ex.category || "General"}
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-on-surface-variant font-sans font-semibold tabular-nums">
                                ⏱ {getExerciseRestPreset(ex, exerciseRestPresets, restTimer)}s rest
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="relative flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveExercise(ex.id, "up")}
                            className="text-on-surface-variant hover:text-primary-fixed p-1.5 transition-colors active:scale-90 cursor-pointer rounded-lg hover:bg-white/5"
                            title="Move up"
                            aria-label="Move exercise up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveExercise(ex.id, "down")}
                            className="text-on-surface-variant hover:text-primary-fixed p-1.5 transition-colors active:scale-90 cursor-pointer rounded-lg hover:bg-white/5"
                            title="Move down"
                            aria-label="Move exercise down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openExerciseModal(undefined, ex.id)}
                            className="text-on-surface-variant hover:text-primary-fixed p-1.5 transition-colors active:scale-90 cursor-pointer rounded-lg hover:bg-white/5"
                            title="Replace Exercise"
                            aria-label="Replace exercise"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === ex.id ? null : ex.id,
                              )
                            }
                            className="text-on-surface-variant hover:text-primary-fixed transition-colors p-1.5 relative z-10 cursor-pointer rounded-lg hover:bg-white/5"
                            aria-label="Exercise options"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {activeMenuId === ex.id && (
                            <>
                              <div
                                className="fixed inset-0 z-[100]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                              />
                              <div className="absolute right-0 top-full mt-2 w-56 bg-black border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,1)] z-[101] overflow-hidden animate-in fade-in zoom-in duration-150">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (ex.technique === "superset") {
                                      removeSuperset(ex.id);
                                    } else {
                                      openExerciseModal(ex.id);
                                    }
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-primary-fixed/20 flex items-center justify-between transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <LinkIcon
                                      className={`w-4 h-4 ${ex.technique === "superset" ? "text-primary-fixed" : "text-on-surface-variant group-hover:text-primary-fixed"}`}
                                    />
                                    <span className="group-hover:text-primary-fixed transition-colors">
                                      {ex.technique === "superset"
                                        ? (t("remove_from_superset") || "Remove from Superset")
                                        : (t("make_superset") || "Make Superset")}
                                    </span>
                                  </div>
                                </button>
                                {ex.technique === "superset" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openExerciseModal(ex.id);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-primary-fixed/20 flex items-center justify-between transition-colors group"
                                  >
                                    <div className="flex items-center gap-3 pl-7">
                                      <Plus className="w-4 h-4 text-on-surface-variant group-hover:text-primary-fixed" />
                                      <span className="group-hover:text-primary-fixed transition-colors">
                                        {t("add_to_superset")}
                                      </span>
                                    </div>
                                  </button>
                                )}
                                <hr className="border-white/10" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openExerciseModal(undefined, ex.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-primary-fixed/20 flex items-center justify-between transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4 text-on-surface-variant group-hover:text-primary-fixed transition-colors" />
                                    <span className="group-hover:text-primary-fixed transition-colors">
                                      {t("replace_exercise") || "Replace Exercise"}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateExercise(ex.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-primary-fixed/20 flex items-center justify-between transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <Copy className="w-4 h-4 text-on-surface-variant group-hover:text-primary-fixed transition-colors" />
                                    <span className="group-hover:text-primary-fixed transition-colors">
                                      {t("duplicate")}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteExercise(ex.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-error hover:bg-error/20 flex items-center justify-between transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <Trash2 className="w-4 h-4" />
                                    <span>{t("delete")}</span>
                                  </div>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sets Header */}
                      <div className="grid grid-cols-12 gap-3 mb-2 text-on-surface-variant text-[11px] uppercase tracking-wider px-2">
                        <div className="col-span-2 text-center font-bold">
                          {t("set")}
                        </div>
                        <div className={`${showRpe ? "col-span-2" : "col-span-3"} text-center font-bold`}>
                          {t("previous")}
                        </div>
                        <div className="col-span-3 text-center font-bold">
                          {unit}
                        </div>
                        <div className={`${showRpe ? "col-span-2" : "col-span-3"} text-center font-bold`}>
                          {isTimedExercise(ex) ? "Secs" : (t("reps_upper") || t("reps"))}
                        </div>
                        {showRpe && (
                          <div className="col-span-2 text-center font-bold">
                            RPE
                          </div>
                        )}
                        <div className="col-span-1 text-center"></div>
                      </div>

                      {/* Set Rows */}
                      <div className="space-y-2 relative">
                        {ex.sets.map((set: any, sIdx: number) => {
                          const isDropSet = set.technique === "dropset";
                          const isCluster = set.technique === "cluster";
                          const isAttachedChild = sIdx > 0 && isDropSet;
                          const nextIsAttachedChild = (sIdx + 1 < ex.sets.length) && ex.sets[sIdx + 1]?.technique === "dropset";

                          return (
                            <div key={set.id} className="relative">
                              {isAttachedChild && (
                                <div className="absolute -top-3 left-6 z-10 flex flex-col items-center opacity-80 pointer-events-none">
                                  <div className="w-0.5 h-3 bg-primary-fixed" />
                                  <div className="w-2 h-2 border-r-2 border-b-2 border-primary-fixed rotate-45 -translate-y-1" />
                                </div>
                              )}
                              <div
                                className={`grid grid-cols-12 gap-3 items-center p-2.5 transition-all duration-150 border gpu-accelerated ${
                                  set.completed
                                    ? "bg-[#30D158]/10 border-[#30D158]/40 shadow-sm"
                                    : `bg-black/30 border-white/8 ${isAttachedChild ? "bg-white/[0.02] border-t-[#30D158]/20" : ""}`
                                } ${isAttachedChild ? "-mt-2 rounded-t-none rounded-b-2xl border-t-0" : nextIsAttachedChild ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"}`}
                              >
                                <div className="col-span-2 flex flex-col items-center justify-center relative">
                                  {mode === "live" ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleSetCompletion(ex.id, set.id, set.completed)}
                                      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl flex items-center justify-center transition-all duration-150 relative overflow-hidden shadow-sm cursor-pointer active:scale-90 ${
                                        set.completed
                                          ? "bg-[#30D158] text-black font-extrabold shadow-[0_2px_12px_rgba(48,209,88,0.4)] scale-100"
                                          : "bg-white/6 border border-white/10 text-[#8E8E93] hover:bg-white/10 hover:text-white hover:border-[#30D158]/40"
                                      }`}
                                      aria-label={`Toggle set ${sIdx + 1} completion`}
                                    >
                                      {set.completed ? (
                                        <Check className="w-5 h-5 relative z-10 text-black stroke-[2.5]" />
                                      ) : (
                                        <span className="text-sm font-extrabold text-white/90 tabular-nums">
                                          {sIdx + 1}
                                        </span>
                                      )}
                                    </button>
                                  ) : (
                                    <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                                      {sIdx + 1}
                                    </div>
                                  )}
                                  {isDropSet && (
                                    <span className="text-[7.5px] font-black uppercase tracking-wider text-primary-fixed text-center leading-none mt-1">
                                      DROP
                                    </span>
                                  )}
                                  {isCluster && (
                                    <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-400 text-center leading-none mt-1">
                                      CLUSTER
                                    </span>
                                  )}
                                  {set.technique && !isDropSet && !isCluster && (
                                    <span className="text-[7.5px] font-black uppercase tracking-wider text-on-surface-variant text-center leading-none mt-1">
                                      {set.technique}
                                    </span>
                                  )}
                                </div>
                                <div className={`${showRpe ? "col-span-2" : "col-span-3"} text-center flex flex-col items-center justify-center gap-0.5`}>
                                  {(() => {
                                    const prev = prevSetsMap[ex.id]?.[sIdx];
                                    if (prev?.weight && prev?.reps) {
                                      const prevW = Number(roundToGymWeight(Number(prev.weight) || 0)) || 0;
                                      const prevR = Number(prev.reps) || 0;
                                      const targetR = prevR >= 12 ? 8 : prevR + 1;
                                      const targetW = prevR >= 12 ? prevW + (prevW >= 50 ? 2.5 : 1.25) : prevW;

                                      const currW = Number(set.weight) || 0;
                                      const currR = Number(set.reps) || 0;

                                      let isOverload = false;
                                      let deltaBadge = "";
                                      if (currW > 0 && currR > 0) {
                                        if (currW > prevW) {
                                          const diff = Math.round((currW - prevW) * 10) / 10;
                                          deltaBadge = `+${diff}${unitLabel}`;
                                          isOverload = true;
                                        } else if (currW === prevW && currR > prevR) {
                                          deltaBadge = `+${currR - prevR}rep`;
                                          isOverload = true;
                                        } else if (currW === prevW && currR === prevR) {
                                          deltaBadge = "Match";
                                        }
                                      }

                                      return (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateSet(ex.id, set.id, {
                                                weight: set.weight !== "" ? set.weight : prevW,
                                                reps: set.reps !== "" ? set.reps : targetR,
                                              });
                                            }}
                                            className="group inline-flex items-center gap-0.5 bg-surface-variant/40 hover:bg-primary-fixed/20 text-on-surface px-1.5 py-0.5 rounded text-[11px] font-bold font-sans tabular-nums border border-white/5 hover:border-primary-fixed/40 transition-colors cursor-pointer active:scale-95 shadow-inner"
                                            title={`Scorsa volta: ${prevW}×${prevR}. Tocca per compilare target (${targetW}×${targetR})`}
                                          >
                                            <span>{prevW}<span className="text-primary-fixed/80 mx-0.5">×</span>{prevR}</span>
                                          </button>
                                          {deltaBadge && (
                                            <span
                                              className={`text-[8px] font-black uppercase tracking-wider px-1 rounded leading-tight ${
                                                isOverload
                                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                                                  : "bg-white/5 text-on-surface-variant/80"
                                              }`}
                                            >
                                              {isOverload ? `🔥 ${deltaBadge}` : deltaBadge}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    }
                                    return (
                                      <span className="text-[10px] text-[#8E8E93]/60 font-medium uppercase tracking-tight">
                                        {sIdx === 0 ? (t("first_time_badge") || "Nuovo") : "—"}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="col-span-3 relative flex items-center">
                                  {mode === "live" && !isBodyweightExercise(ex) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic("light");
                                        adjustSetWeight(ex.id, set.id, -2.5);
                                      }}
                                      className="absolute left-0 z-10 min-w-[32px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 text-xs font-bold active:scale-90 transition-all cursor-pointer select-none"
                                      title="-2.5"
                                      aria-label="Decrease weight"
                                    >
                                      -
                                    </button>
                                  )}
                                  <input
                                    className={`w-full bg-black/40 border border-white/10 rounded-xl text-on-surface text-center py-2.5 ${mode === "live" && !isBodyweightExercise(ex) ? "px-6" : "px-2"} text-sm font-extrabold font-sans tabular-nums tracking-tight focus:border-primary-fixed focus:bg-black/60 focus:outline-none transition-all shadow-inner`}
                                    placeholder={isBodyweightExercise(ex) ? "BW" : unit}
                                    type="text"
                                    inputMode="decimal"
                                    value={set.weight === "" || set.weight === undefined ? "" : String(set.weight)}
                                    onChange={(e) =>
                                      updateSet(ex.id, set.id, {
                                        weight: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      updateSet(ex.id, set.id, {
                                        weight: finalizeLiveNumericInput(e.target.value),
                                      })
                                    }
                                  />
                                  {mode === "live" && !isBodyweightExercise(ex) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic("light");
                                        adjustSetWeight(ex.id, set.id, 2.5);
                                      }}
                                      className="absolute right-0 z-10 min-w-[32px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 text-xs font-bold active:scale-90 transition-all cursor-pointer select-none"
                                      title="+2.5"
                                      aria-label="Increase weight"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                                <div className={`${showRpe ? "col-span-2" : "col-span-3"} relative flex items-center`}>
                                  {mode === "live" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic("light");
                                        adjustSetReps(ex.id, set.id, -1);
                                      }}
                                      className="absolute left-0 z-10 min-w-[32px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 text-xs font-bold active:scale-90 transition-all cursor-pointer select-none"
                                      title="-1"
                                      aria-label="Decrease reps"
                                    >
                                      -
                                    </button>
                                  )}
                                  <input
                                    className={`w-full bg-black/40 border border-white/10 rounded-xl text-on-surface text-center py-2.5 ${mode === "live" ? "px-6" : "px-2"} text-sm font-extrabold font-sans tabular-nums tracking-tight focus:border-primary-fixed focus:bg-black/60 focus:outline-none transition-all shadow-inner`}
                                    placeholder={isTimedExercise(ex) ? "Secs" : (t("reps_upper") || "Ripet.")}
                                    type="text"
                                    inputMode="decimal"
                                    value={set.reps === "" || set.reps === undefined ? "" : String(set.reps)}
                                    onChange={(e) =>
                                      updateSet(ex.id, set.id, {
                                        reps: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      updateSet(ex.id, set.id, {
                                        reps: finalizeLiveNumericInput(e.target.value),
                                      })
                                    }
                                  />
                                  {mode === "live" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic("light");
                                        adjustSetReps(ex.id, set.id, 1);
                                      }}
                                      className="absolute right-0 z-10 min-w-[32px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 text-xs font-bold active:scale-90 transition-all cursor-pointer select-none"
                                      title="+1"
                                      aria-label="Increase reps"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                                {showRpe && (
                                  <div className="col-span-2">
                                    <input
                                      className="w-full bg-black/40 border border-white/10 rounded-xl text-on-surface text-center py-2.5 px-1 text-sm font-extrabold font-sans tabular-nums tracking-tight focus:border-primary-fixed focus:bg-black/60 focus:outline-none transition-all shadow-inner"
                                      placeholder="RPE"
                                      type="text"
                                      inputMode="decimal"
                                      value={set.rpe === "" || set.rpe === undefined ? "" : String(set.rpe)}
                                      onChange={(e) =>
                                        updateSet(ex.id, set.id, {
                                          rpe: e.target.value,
                                        } as Partial<SetData>)
                                      }
                                      onBlur={(e) =>
                                        updateSet(ex.id, set.id, {
                                          rpe: finalizeLiveNumericInput(e.target.value),
                                        } as Partial<SetData>)
                                      }
                                    />
                                  </div>
                                )}
                                <div className="col-span-1 flex justify-center text-error relative z-20">
                                  <button
                                    onClick={() => deleteSet(ex.id, set.id)}
                                    className="p-2 hover:bg-error/10 active:scale-90 transition-all rounded-lg cursor-pointer"
                                    title="Delete Set"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes */}
                      {idx === group.length - 1 && (
                        <div className="mt-stack-md">
                          <label className="block text-[10px] font-bold tracking-[0.1em] text-on-surface-variant mb-1 uppercase">
                            {group.length > 1
                              ? "Superset Notes"
                              : "Exercise Notes"}
                          </label>
                          <div className="bg-surface-container border border-surface-variant rounded-xl overflow-hidden transition-colors focus-within:border-primary-fixed">
                            <textarea
                              className="w-full bg-transparent border-none focus:ring-0 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                              style={{ resize: "vertical", minHeight: "64px" }}
                              placeholder={t("add_cues_placeholder") || "Add cues, tempo, or modifications..."}
                              rows={3}
                              value={group[0].notes}
                              onChange={(e) =>
                                updateExercise(group[0].id, {
                                  notes: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-stack-md flex items-center justify-between gap-3 bg-black/25 border border-white/10 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <Clock className="w-4 h-4 text-primary-fixed" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {t("exercise_rest") || "Exercise Rest"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const next = Math.max(0, getExerciseRestPreset(ex, exerciseRestPresets, restTimer) - 15);
                              updateExercise(ex.id, { restTimer: next });
                              onSaveExerciseRestPreset?.(ex.title, next);
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center text-primary font-black tabular-nums">
                            {getExerciseRestPreset(ex, exerciseRestPresets, restTimer)}s
                          </span>
                          <button
                            onClick={() => {
                              const next = getExerciseRestPreset(ex, exerciseRestPresets, restTimer) + 15;
                              updateExercise(ex.id, { restTimer: next });
                              onSaveExerciseRestPreset?.(ex.title, next);
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-stack-md flex gap-stack-sm items-center flex-wrap">
                        <button
                          onClick={() => addSet(ex.id)}
                          className="text-sm font-bold text-on-surface-variant hover:text-primary-fixed flex items-center gap-1 transition-colors bg-white/5 px-3 py-2 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> {t("add_set")}
                        </button>
                        <button
                          onClick={() => handleGenerateWarmup(ex.id)}
                          className="text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-full hover:bg-amber-500/20 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-amber-400" /> {t("warmup") || "Warmup"}
                        </button>
                        <button
                          onClick={() => addSet(ex.id, "dropset")}
                          className="text-sm font-bold text-on-surface-variant hover:text-primary-fixed flex items-center gap-1 transition-colors bg-white/5 px-3 py-2 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                          <Zap className="w-4 h-4" /> {t("add_drop_cluster")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ));
          })()}

          {/* Add Exercise Button */}
          <div className="md:col-span-12 mt-stack-md">
            <button
              onClick={() => openExerciseModal()}
              className="w-full border-2 border-dashed border-white/10 rounded-2xl p-stack-lg flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary-container hover:bg-white/5 transition-all group cursor-pointer"
            >
              <PlusCircle
                className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform"
                strokeWidth={1}
              />
              <span className="font-bold text-[14px] uppercase tracking-widest">
                {t("add_exercise")}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Exercise Selection Modal */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-surface-variant rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-surface-variant space-y-4 bg-surface sticky top-0 rounded-t-xl z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary font-[var(--font-headline-md)]">
                  {replacingExerciseId ? (t("replace_exercise") || "Sostituisci Esercizio") : t("select_exercise")}
                </h2>
                <button
                  onClick={() => closeExerciseModal()}
                  className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {replacingExerciseId && (() => {
                const oldEx = routine.exercises.find((e) => e.id === replacingExerciseId);
                return (
                  <div className="bg-primary-fixed/10 border border-primary-fixed/30 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RefreshCw className="w-4 h-4 text-primary-fixed shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-primary-fixed">
                          {t("replace_exercise") || "Sostituzione Rapida"}
                        </div>
                        <div className="text-xs text-on-surface truncate">
                          Sostituisci <span className="text-primary-fixed font-bold">{oldEx?.title}</span> con un'alternativa:
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingExerciseId(null);
                        setFilterMuscle("All");
                      }}
                      className="text-[11px] text-on-surface-variant hover:text-white underline cursor-pointer shrink-0 font-bold"
                    >
                      {t("cancel") || "Annulla"}
                    </button>
                  </div>
                );
              })()}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder={t("search") || "Search exercises..."}
                  value={exerciseSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExerciseSearch(val);
                    if (val === "") {
                      setFilterMuscle("All");
                      setFilterEquipment("All");
                    }
                  }}
                  className="w-full bg-surface-container border border-surface-variant rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-primary-fixed transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <button
                    onClick={() => {
                      setIsMuscleFilterOpen(!isMuscleFilterOpen);
                      setIsEquipmentFilterOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surface-container border border-surface-variant rounded-lg text-sm transition-colors hover:border-primary-fixed"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {t("muscle")}
                      </span>
                      <span className="font-bold text-primary">
                        {t(filterMuscle.toLowerCase())}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-on-surface-variant transition-transform ${isMuscleFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isMuscleFilterOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-surface-variant rounded-lg shadow-xl z-[110] py-1 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                      {[
                        "All",
                        "Chest",
                        "Back",
                        "Legs",
                        "Arms",
                        "Core",
                        "Shoulders",
                        "Cardio",
                        "Functional",
                      ].map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setFilterMuscle(m);
                            setIsMuscleFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-variant transition-colors ${filterMuscle === m ? "text-primary font-bold" : "text-on-surface"}`}
                        >
                          {t(m.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative flex-1">
                  <button
                    onClick={() => {
                      setIsEquipmentFilterOpen(!isEquipmentFilterOpen);
                      setIsMuscleFilterOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surface-container border border-surface-variant rounded-lg text-sm transition-colors hover:border-primary-fixed"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {t("equip")}
                      </span>
                      <span className="font-bold text-primary">
                        {t(filterEquipment.toLowerCase())}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-on-surface-variant transition-transform ${isEquipmentFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isEquipmentFilterOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-surface-variant rounded-lg shadow-xl z-[110] py-1 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                       {[
                        "All",
                        "Barbell",
                        "Dumbbell",
                        "Cable",
                        "Machine",
                        "Multipower",
                        "Bodyweight",
                        "Kettlebell",
                        "Other",
                      ].map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setFilterEquipment(e);
                            setIsEquipmentFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-variant transition-colors ${filterEquipment === e ? "text-primary font-bold" : "text-on-surface"}`}
                        >
                          {t(e.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-4">
              <button
                onClick={() => setIsCustomExerciseOpen(true)}
                className="w-full py-4 border-2 border-dashed border-primary-container text-primary-container rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container/10 transition-colors font-bold uppercase tracking-widest mb-2"
              >
                <Plus className="w-5 h-5" />
                {t("add_custom_exercise") || "Add Custom Exercise"}
              </button>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {modalExerciseResults
                  .map((ex) => (
                    <div key={ex.id} className="relative group">
                      <button
                        onClick={() => addExercise(ex)}
                        className="w-full flex items-center gap-4 p-3 rounded-lg border border-surface-variant hover:border-primary-container hover:bg-surface-container transition-all text-left"
                      >
                        <ExerciseMuscleVisual
                          exercise={ex}
                          className="w-16 h-16 shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                            {t(ex.title)}
                          </span>
                          <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                            {ex.category} • {ex.type}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail?.(ex);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant hover:text-primary transition-colors z-10"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCustomExerciseOpen && (
        <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
          <AddExercise
            t={t}
            unit={unit}
            onBack={() => setIsCustomExerciseOpen(false)}
            onSave={handleCustomExSave}
          />
        </div>
      )}

      <PlateCalculatorModal
        isOpen={isPlateCalcOpen}
        onClose={() => setIsPlateCalcOpen(false)}
        unit={unit}
        initialWeight={plateCalcInitialWeight}
        t={t}
      />

      {/* Floating Rest Timer */}
      {activeRestLeft !== null && (
        <div className="fixed bottom-0 left-0 w-full z-[150] px-margin-mobile py-3 animate-in slide-in-from-bottom-full duration-300" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
          <div className="bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25 flex items-center justify-center relative shadow-sm">
                <Clock className="w-5 h-5 absolute" />
                <svg className="w-8 h-8 -rotate-90">
                  <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" className="text-white/10" fill="none" />
                  <circle
                    cx="16" cy="16" r="13"
                    stroke="currentColor" strokeWidth="2.5"
                    className="text-[#30D158] transition-all duration-1000"
                    fill="none"
                    strokeDasharray={81.68}
                    strokeDashoffset={81.68 - (81.68 * (activeRestLeft || 0)) / (initialRestDuration || 90)}
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8E8E93]">
                  {t("rest_timer") || "Rest Timer"}
                </span>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums text-white leading-none">
                  {formatTime(activeRestLeft)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 font-bold text-sm">
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  setIsFinishConfirmOpen(true);
                }}
                className="h-10 px-4 bg-[#30D158] text-black rounded-full flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_4px_14px_rgba(48,209,88,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t("finish_workout")}
              </button>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  startRestTimer(Math.max(0, activeRestLeft - 15));
                }}
                className="h-10 px-3.5 bg-white/8 hover:bg-white/14 text-white rounded-full flex items-center justify-center transition-all text-xs font-semibold cursor-pointer active:scale-95"
              >
                -15s
              </button>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  startRestTimer(activeRestLeft + 15);
                }}
                className="h-10 px-3.5 bg-white/8 hover:bg-white/14 text-white rounded-full flex items-center justify-center transition-all text-xs font-semibold cursor-pointer active:scale-95"
              >
                +15s
              </button>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  startRestTimer(0);
                }}
                className="ml-1 w-10 h-10 bg-white/8 hover:bg-white/14 text-[#8E8E93] hover:text-white rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {mode !== "live" && (
        <div className="max-w-[1280px] mx-auto w-full px-margin-mobile md:px-margin-desktop pb-8">
          <button
            type="button"
            onClick={handleRoutineSave}
            disabled={isSaving}
            className={`w-full bg-surface-variant hover:bg-white/10 border border-white/10 text-on-surface font-black rounded-2xl uppercase tracking-widest active:scale-[0.98] transition-all px-5 py-4 text-sm ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSaving ? t("saving") || "Saving..." : t("save_routine") || "Save Routine"}
          </button>
        </div>
      )}

      {/* Floating Finish Workout button (live mode) */}
      <AnimatePresence>
        {mode === "live" && !isHeaderFinishVisible && activeRestLeft === null && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-[140] pointer-events-auto"
          >
            <button
              type="button"
              onClick={handleRoutineSave}
              className="premium-cta font-black text-sm px-5 py-3.5 rounded-full active:scale-95 transition-all uppercase tracking-widest flex items-center gap-2 hover:brightness-110 shadow-xl cursor-pointer"
            >
              <Check className="w-5 h-5" strokeWidth={2.5} />
              {t("finish_workout") || "Finish Workout"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Finish Workout Modal */}
      {isFinishConfirmOpen && (
        <ConfirmModal
          title={t("finish_workout") || "Finish Workout"}
          message={
            isRoutineModified(routine, initialRoutine)
              ? (t("update_template_confirm") || "Do you want to update the original routine template with these changes?")
              : (t("finish_workout_confirm") || "Finish and save this workout?")
          }
          confirmLabel={t("finish_workout") || "Finish"}
          cancelLabel={t("cancel") || "Cancel"}
          icon="finish"
          onConfirm={async () => {
            setIsFinishConfirmOpen(false);
            const completedRoutine = buildCompletedWorkoutLog(routine);
            if (completedRoutine.exercises.length === 0) {
              showToast(t("complete_one_set_first") || "Complete at least one set before finishing.", "error");
              return;
            }
            setIsSaving(true);
            try {
              await onSave({ ...routine, duration: elapsed });
            } finally {
              setIsSaving(false);
            }
          }}
          onCancel={() => setIsFinishConfirmOpen(false)}
        />
      )}

      {discardConfirmOpen && (
        <ConfirmModal
          title={t("exit_workout") || "Abbandona allenamento"}
          message={(t("discard_workout_confirm") || "Sei sicuro di voler eliminare questo allenamento? I progressi andranno persi.").replace("{name}", userName || "amico")}
          confirmLabel={t("discard_workout_confirm_btn") || "Elimina allenamento"}
          cancelLabel={t("keep_workout_btn") || "Continua allenamento"}
          destructive
          onConfirm={() => {
            setDiscardConfirmOpen(false);
            removeJsonAtomic(LIVE_PROGRESS_KEY);
            localStorage.removeItem(LIVE_ELAPSED_KEY);
            localStorage.removeItem(LIVE_REST_TIMER_KEY);
            localStorage.removeItem(LIVE_STARTED_AT_KEY);
            startRestTimer(0);
            stopLiveWorkoutNotification();
            onDiscard?.();
          }}
          onCancel={() => setDiscardConfirmOpen(false)}
        />
      )}
    </div>
  );
}
