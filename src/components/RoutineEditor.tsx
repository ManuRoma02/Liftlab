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
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import consoleIconImg from "../assets/images/liftlab_console_icon.png";

import { ConfirmModal, useBackDismiss } from "./common/ConfirmModal";
import { ExerciseMuscleVisual } from "./common/ExerciseMuscleVisual";
import { ExerciseMedia } from "./common/ExerciseMedia";
import { ExerciseFilterBar } from "./common/ExerciseFilterBar";
import { AddExercise } from "./common/AddExercise";
import { PlateCalculatorModal } from "./common/PlateCalculatorModal";
import { ReorderExercisesModal } from "./common/ReorderExercisesModal";
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
  getEquipmentBarWeight,
  usesWeightPlates,
} from "../lib/workoutUtils";
import { getExerciseSearchScore } from "../lib/searchUtils";
import { readJson, removeJsonAtomic, writeJsonAtomic, writeJsonSafe } from "../lib/storage";
import { showToast } from "../lib/toast";
import {
  updateLiveWorkoutNotification,
  stopLiveWorkoutNotification,
  addLiveWorkoutActionListener,
  drainPendingLiveWorkoutActions,
  isNativeAndroid,
} from "../lib/liveWorkoutBridge";
import type { RoutineData, ExerciseData, SetData } from "../types/workout";
import { triggerHaptic } from "../lib/haptics";
import { appleSpringDefault, appleSpringBouncy, CARTOON_SPRINGS, CARTOON_KEYFRAMES } from "../lib/motion";

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
  onDraftChange,
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
  onDraftChange?: (draft: RoutineData) => void;
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
    isRestFinishedOverride?: boolean,
  ) => {
    if (mode !== "live") return;
    const source = currentRoutine || routineRef.current;
    if (!source) return;
    let activeExTitle = source.name || "Live Workout";
    let activeSetInfo = "In corso";
    let setNumber = 1;
    let totalSets = 1;
    let defaultRest = restTimer || 90;
    let weightRepsInfo = "";

    for (const ex of source.exercises || []) {
      const isDrop = (s: SetData, idx: number) => idx > 0 && s.technique === "dropset";
      const incompleteIdx = (ex.sets || []).findIndex((s) => !s.completed);
      if (incompleteIdx !== -1) {
        const targetSet = ex.sets[incompleteIdx];
        activeExTitle = ex.title;

        // Count main sets only so drop sets are not counted as independent sets
        const mainSets = (ex.sets || []).filter((s, idx) => !isDrop(s, idx));
        totalSets = Math.max(1, mainSets.length);

        let mainSetNum = 1;
        for (let i = 0; i <= incompleteIdx; i++) {
          if (!isDrop(ex.sets[i], i)) {
            mainSetNum = (ex.sets || []).slice(0, i + 1).filter((s, idx) => !isDrop(s, idx)).length;
          }
        }
        setNumber = Math.max(1, mainSetNum);
        defaultRest = getExerciseRestPreset(ex, exerciseRestPresets, restTimer) || 90;
        const weightText =
          targetSet.weight !== "" && targetSet.weight !== undefined
            ? `${targetSet.weight} ${unitLabel}`
            : "";
        const repsText = targetSet.reps ? `${targetSet.reps} ${isTimedExercise(ex) ? "secs" : "reps"}` : "";
        weightRepsInfo = weightText && repsText ? `${weightText} × ${repsText}` : (weightText || repsText);
        activeSetInfo = `Serie ${setNumber} di ${totalSets}${weightRepsInfo ? ` (${weightRepsInfo})` : ""}`;
        break;
      }
    }
    const remaining = restLeft !== undefined ? restLeft : readWallClockRestLeft();
    const isResting = Boolean(remaining && remaining > 0);
    const isRestFinished = isRestFinishedOverride !== undefined
      ? isRestFinishedOverride
      : Boolean(!isResting && (remaining === 0 || remaining === null) && activeRestLeft === 0);

    void updateLiveWorkoutNotification({
      currentExercise: activeExTitle,
      currentSetInfo: activeSetInfo,
      restRemainingSeconds: isResting && remaining ? remaining : 0,
      isResting,
      setNumber,
      totalSets,
      defaultRestSeconds: defaultRest,
      weightRepsInfo,
      isRestFinished,
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

  const startRestTimer = async (duration: number, nextRoutine?: RoutineData) => {
    lastBeepSecondRef.current = null;
    const routineToUse = nextRoutine || routineRef.current;
    if (nextRoutine) {
      routineRef.current = nextRoutine;
    }
    if (duration <= 0) {
      localStorage.removeItem(LIVE_REST_TIMER_KEY);
      setActiveRestLeft(null);
      pushNativeLiveState(routineToUse, 0, false);
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
      if (!isNativeAndroid()) {
        try {
          await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
        } catch (e) {}
      }
      return;
    }
    if (activeRestLeft === null || duration > initialRestDuration) {
      setInitialRestDuration(duration);
    }
    const state = { duration, startedAt: Date.now() };
    writeJsonSafe(LIVE_REST_TIMER_KEY, state);
    setActiveRestLeft(duration);
    pushNativeLiveState(routineToUse, duration, false);

    if (!isNativeAndroid()) {
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
    }
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
        pushNativeLiveState(routineRef.current, 0, true);
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
        let foundSet: SetData | undefined;
        let incSetIdx = -1;
        for (const ex of currentRoutine.exercises || []) {
          const idx = (ex.sets || []).findIndex((s) => !s.completed);
          if (idx !== -1) {
            foundExId = ex.id;
            foundSetId = ex.sets[idx].id;
            foundExercise = ex;
            foundSet = ex.sets[idx];
            incSetIdx = idx;
            break;
          }
        }
        if (!foundExId || !foundSetId || !foundExercise || !foundSet) return;

        // Auto-fill fallback weight & reps if missing so completing from notification always succeeds
        let completedWeight = finalizeLiveNumericInput(foundSet.weight);
        let completedReps = finalizeLiveNumericInput(foundSet.reps);

        if (completedReps === "" || completedReps === 0) {
          const prevCompleted = foundExercise.sets.find((s) => s.completed && s.reps);
          const hist = prevSetsMap[normalizeExerciseTitle(foundExercise.title)]?.[0];
          completedReps = prevCompleted?.reps
            ? finalizeLiveNumericInput(prevCompleted.reps)
            : (hist?.reps ? finalizeLiveNumericInput(hist.reps) : 8);
        }
        if (completedWeight === "") {
          if (isBodyweightExercise(foundExercise)) {
            completedWeight = 0;
          } else {
            const prevCompleted = foundExercise.sets.find((s) => s.completed && s.weight !== "");
            const hist = prevSetsMap[normalizeExerciseTitle(foundExercise.title)]?.[0];
            completedWeight = prevCompleted?.weight !== undefined && prevCompleted?.weight !== ""
              ? finalizeLiveNumericInput(prevCompleted.weight)
              : (hist?.weight !== undefined && hist?.weight !== "" ? finalizeLiveNumericInput(hist.weight) : 20);
          }
        }

        // Find all attached drop sets belonging to this set
        const attachedDropIndices: number[] = [];
        for (let i = incSetIdx + 1; i < foundExercise.sets.length; i++) {
          if (foundExercise.sets[i]?.technique === "dropset") {
            attachedDropIndices.push(i);
          } else {
            break;
          }
        }
        const setIdsToComplete = new Set([
          foundSetId,
          ...attachedDropIndices.map((i) => foundExercise!.sets[i].id),
        ]);

        const updatedSets = foundExercise.sets.map((s) => {
          if (setIdsToComplete.has(s.id)) {
            let sWeight = finalizeLiveNumericInput(s.weight);
            let sReps = finalizeLiveNumericInput(s.reps);
            if (s.id === foundSetId) {
              sWeight = completedWeight;
              sReps = completedReps;
            } else {
              if (sReps === "" || sReps === 0) sReps = completedReps;
              if (sWeight === "") {
                sWeight = typeof completedWeight === "number" && completedWeight > 0
                  ? Math.max(1, Math.round(completedWeight * 0.75))
                  : completedWeight;
              }
            }
            return {
              ...s,
              completed: true,
              weight: sWeight,
              reps: sReps,
            };
          }
          return s;
        });

        // Auto-carry forward weight and reps to next main set if next set is empty
        const nextMainSetIdx = incSetIdx + attachedDropIndices.length + 1;
        if (nextMainSetIdx < updatedSets.length) {
          const nextSet = updatedSets[nextMainSetIdx];
          const nextHasNoWeight = nextSet.weight === "" || nextSet.weight === undefined || nextSet.weight === null;
          const nextHasNoReps = nextSet.reps === "" || nextSet.reps === undefined || nextSet.reps === null;
          if (nextHasNoWeight && nextHasNoReps) {
            updatedSets[nextMainSetIdx] = {
              ...nextSet,
              weight: completedWeight,
              reps: completedReps,
            };
          }
        }

        const updatedRoutine: RoutineData = {
          ...currentRoutine,
          exercises: currentRoutine.exercises.map((ex) =>
            ex.id === foundExId
              ? {
                  ...ex,
                  sets: updatedSets,
                }
              : ex,
          ),
        };

        setRoutine(updatedRoutine);
        routineRef.current = updatedRoutine;
        writeJsonAtomic(LIVE_PROGRESS_KEY, updatedRoutine);

        const allWorkoutSetsCompleted = updatedRoutine.exercises.every((ex) =>
          ex.sets.every((s) => s.completed),
        );

        if (!allWorkoutSetsCompleted) {
          const timer = foundExercise
            ? getExerciseRestPreset(foundExercise, exerciseRestPresets, restTimer)
            : restTimer;
          if (timer > 0) {
            startRestTimer(timer, updatedRoutine);
          } else {
            pushNativeLiveState(updatedRoutine, 0, false);
          }
        } else {
          startRestTimer(0, updatedRoutine);
          pushNativeLiveState(updatedRoutine, 0, false);
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

  // ── Listen for exercises added from ExerciseDetails in live workout mode ──
  useEffect(() => {
    if (mode !== "live") return;
    const handleLiveAdd = (e: Event) => {
      const customEvent = e as CustomEvent<ExerciseData>;
      if (!customEvent.detail) return;
      const added = customEvent.detail;
      setRoutine((current) => {
        if (!current) return current;
        return {
          ...current,
          exercises: [...(current.exercises || []), added],
        };
      });
    };
    window.addEventListener("liftlab:live-add-exercise", handleLiveAdd);
    return () => window.removeEventListener("liftlab:live-add-exercise", handleLiveAdd);
  }, [mode]);

  // ── Debounced auto-save & synchronous unmount flush ────────────────────────
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const isInitialMount = useRef<boolean>(true);

  const flushPendingSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (!isDirtyRef.current) return;
    const current = routineRef.current;
    if (!current) return;

    if (mode === "live") {
      writeJsonAtomic(LIVE_PROGRESS_KEY, current);
      if (elapsedRef.current != null) {
        writeJsonSafe(LIVE_ELAPSED_KEY, String(elapsedRef.current));
      }
    } else {
      writeJsonAtomic("liftlab_routine_edit_draft", current);
      onDraftChange?.(current);
    }
    isDirtyRef.current = false;
  };

  useEffect(() => {
    routineRef.current = routine;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    isDirtyRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      flushPendingSave();
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [routine, mode]);

  // Synchronous unmount flush: guarantees any pending dirty state is flushed on unmount
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, []);

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
      writeJsonSafe(LIVE_ELAPSED_KEY, String(elapsedRef.current));
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
      writeJsonSafe(LIVE_ELAPSED_KEY, String(elapsed));
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
  const [warmupModalExercise, setWarmupModalExercise] = useState<ExerciseData | null>(null);

  const [isCustomExerciseOpen, setIsCustomExerciseOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [debouncedExerciseSearch, setDebouncedExerciseSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("All");
  const [filterEquipment, setFilterEquipment] = useState<string>("All");
  const [isEquipmentFilterOpen, setIsEquipmentFilterOpen] = useState(false);
  const [makingSupersetForId, setMakingSupersetForId] = useState<string | null>(
    null,
  );
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);

  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
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
    const barWeight = getEquipmentBarWeight(ex.equipment, ex.title, unit);

    const generated = generateWarmupSets(workingWeight, barWeight, ex.equipment);
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

    showToast(t("warmup_sets_generated") || "Riscaldamento pronto", "success");
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
        writeJsonSafe(LIVE_ELAPSED_KEY, String(currentElapsed));
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
      technique: "",
      supersetId: undefined,
      sets: ex.sets.map((s) => ({ ...s, id: crypto.randomUUID() })),
    };
    const newExercises = [...(routine?.exercises ?? [])];
    const idx = newExercises.findIndex((e) => e.id === id);
    newExercises.splice(idx + 1, 0, duplicated);
    setRoutine({ ...routine, exercises: newExercises });
    setActiveMenuId(null);
  };

  const deleteExercise = (id: string) => {
    triggerHaptic("warning");
    const updatedExercises = dissolveSuperset(routine?.exercises ?? [], id).filter(
      (e) => e.id !== id,
    );
    setRoutine({
      ...routine,
      exercises: updatedExercises,
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

  const toggleSetCompletion = (
    exId: string,
    setId: string,
    currentCompleted: boolean,
  ) => {
    const activeExercise = (routine?.exercises ?? []).find((ex) => ex.id === exId);
    if (!activeExercise) return;
    const targetSetIdx = activeExercise.sets.findIndex((s) => s.id === setId);
    if (targetSetIdx === -1) return;
    const targetSet = activeExercise.sets[targetSetIdx];

    // Find all attached drop sets immediately following this set
    const attachedDropIndices: number[] = [];
    for (let i = targetSetIdx + 1; i < activeExercise.sets.length; i++) {
      if (activeExercise.sets[i]?.technique === "dropset") {
        attachedDropIndices.push(i);
      } else {
        break;
      }
    }

    if (!currentCompleted) {
      if (!canCompleteSet(targetSet, activeExercise)) {
        showToast(t("complete_set_needs_values") || "Enter weight and reps before completing the set.", "error");
        return;
      }
      for (const dropIdx of attachedDropIndices) {
        const dropSet = activeExercise.sets[dropIdx];
        if (!canCompleteSet(dropSet, activeExercise)) {
          showToast(t("complete_dropset_needs_values") || "Inserisci peso e ripetizioni anche per il drop set prima di completare.", "error");
          return;
        }
      }
    }

    const updatedCompleted = !currentCompleted;
    if (updatedCompleted) {
      triggerHaptic("success");
    } else {
      triggerHaptic("light");
    }

    // Set IDs to update together: main set + all attached drops
    const setIdsToUpdate = new Set([
      setId,
      ...attachedDropIndices.map((i) => activeExercise.sets[i].id),
    ]);

    const updatedSets = (activeExercise?.sets ?? []).map((s) => {
      if (setIdsToUpdate.has(s.id)) {
        return {
          ...s,
          completed: updatedCompleted,
          weight: finalizeLiveNumericInput(s.weight),
          reps: finalizeLiveNumericInput(s.reps),
        };
      }
      return s;
    });

    // Auto-carry forward weight and reps to next main set if next set is empty
    if (updatedCompleted) {
      const nextMainSetIdx = targetSetIdx + attachedDropIndices.length + 1;
      if (nextMainSetIdx < updatedSets.length) {
        const nextSet = updatedSets[nextMainSetIdx];
        const currentSet = updatedSets[targetSetIdx];
        const nextHasNoWeight = nextSet.weight === "" || nextSet.weight === undefined || nextSet.weight === null;
        const nextHasNoReps = nextSet.reps === "" || nextSet.reps === undefined || nextSet.reps === null;
        if (nextHasNoWeight && nextHasNoReps) {
          updatedSets[nextMainSetIdx] = {
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
    routineRef.current = updatedRoutine;
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
        startRestTimer(timer, updatedRoutine);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalWorkoutSets = routine.exercises.reduce(
    (sum, ex) => sum + (ex.sets || []).filter((s, idx) => !(idx > 0 && s.technique === "dropset")).length,
    0,
  );
  const completedWorkoutSets = routine.exercises.reduce(
    (sum, ex) => sum + (ex.sets || []).filter((s, idx) => !(idx > 0 && s.technique === "dropset") && s.completed).length,
    0,
  );
  const workoutProgress =
    totalWorkoutSets > 0
      ? Math.round((completedWorkoutSets / totalWorkoutSets) * 100)
      : 0;

  const exerciseCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: exercises.length };
    for (const ex of exercises) {
      const cat = ex.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [exercises]);

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
      .slice(0, queryStr ? 60 : 24)
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
          <div className="flex flex-col justify-center min-w-0 max-w-[180px] sm:max-w-xs truncate">
            {routine.title ? (
              <>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary truncate flex items-center gap-1.5">
                  {mode === "live" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse shrink-0 inline-block" />
                      {t("active_session") || "Sessione Attiva"}
                    </>
                  ) : (
                    t("edit_routine") || "Routine"
                  )}
                </span>
                <span className="text-sm font-semibold text-on-surface truncate">
                  {routine.title}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-on-surface truncate flex items-center gap-1.5">
                {mode === "live" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse shrink-0 inline-block" />
                    {t("active_session") || "Sessione Attiva"}
                  </>
                ) : (
                  t("edit_routine") || "Routine"
                )}
              </span>
            )}
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
          <motion.button
            ref={mode === "live" ? headerFinishButtonRef : undefined}
            data-testid={mode === "live" ? "finish-workout-btn" : "save-routine-btn"}
            onClick={handleRoutineSave}
            disabled={isSaving}
            whileTap={{ scale: 0.91, rotate: -1.5 }}
            whileHover={{ scale: 1.03 }}
            transition={CARTOON_SPRINGS.bouncy}
            className={`premium-cta font-black rounded-full uppercase hover:brightness-110 transition-all tracking-wider ${mode === "live" ? "px-4 py-2 text-[11px]" : "px-5 py-2.5 text-sm"} ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2" role="status" aria-label={t("saving") || "Saving..."}>
                <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-primary-container opacity-40" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-on-primary-container" />
                </span>
                {t("saving") || "Saving..."}
              </div>
            ) : mode === "live" ? (
              t("finish_workout")
            ) : (
              t("save_routine")
            )}
          </motion.button>
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
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                {/* 1. Hero Live Stopwatch */}
                <div className="bg-black/40 border border-[#30D158]/35 rounded-2xl p-3 flex items-center justify-between shadow-[0_4px_16px_rgba(48,209,88,0.1)]">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#30D158]" />
                      {t("time_elapsed") || "Tempo Trascorso"}
                    </span>
                    <span className="text-2xl font-black text-white font-mono tracking-tight tabular-nums mt-0.5">
                      {formatTime(elapsed)}
                    </span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-pulse" />
                </div>

                {/* 2. Completed Sets Progress */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93]">
                      {t("set") || "Serie"}
                    </span>
                    <span className="text-xs font-black text-[#30D158]">
                      {workoutProgress}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-black text-white tabular-nums">
                      {completedWorkoutSets} <span className="text-xs text-[#8E8E93] font-normal">/ {totalWorkoutSets}</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-[#30D158] rounded-full transition-all duration-300"
                      style={{ width: `${workoutProgress}%` }}
                    />
                  </div>
                </div>

                {/* 3. Rest Timer Status & Steppers */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93]">
                      {t("rest_timer") || "Recupero"}
                    </span>
                    <span className="text-xl font-black text-white tabular-nums mt-0.5">
                      {activeRestLeft !== null ? formatTime(activeRestLeft) : `${restTimer}s`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setRestTimer?.(Math.max(0, restTimer - 15));
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs min-w-6 text-center text-[#30D158] tabular-nums">
                      {restTimer}s
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setRestTimer?.(restTimer + 15);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
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
          <div className="mx-margin-mobile md:mx-margin-desktop mb-4 p-4 rounded-2xl bg-[#141417] border border-[#30D158]/35 shadow-[0_8px_24px_rgba(48,209,88,0.15),inset_0_1px_0_rgba(255,255,255,0.06)] relative flex flex-col gap-2">
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
            return groups.map((group, groupIdx) => {
              if (group.length > 1) {
                const maxRounds = Math.max(...group.map((e) => e.sets?.length || 0));
                return (
                  <div
                    key={`superset-group-${groupIdx}`}
                    className="md:col-span-12 relative w-full"
                  >
                    <div className="apple-glass-card rounded-3xl p-4 md:p-6 relative border border-[#30D158]/35 bg-gradient-to-b from-[#1C201D] via-[#16171A] to-[#121315] shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
                      {/* Superset Top Header */}
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#30D158]/20 border border-[#30D158]/40 text-[#30D158] text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <LinkIcon className="w-3.5 h-3.5" />
                            {t("superset")} • {group.map((_, i) => `A${i + 1}`).join(" + ")}
                          </span>
                          <span className="text-xs text-white/80 font-bold truncate max-w-[220px] sm:max-w-md">
                            {group.map((e) => t(e.title) || e.title).join(" + ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeSuperset(group[0].id)}
                            className="text-xs font-semibold text-[#8E8E93] hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                          >
                            {t("remove_from_superset") || "Separa"}
                          </button>
                        </div>
                      </div>

                      {/* Exercises Mini Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        {group.map((ex, exIdx) => {
                          const labelLetter = `A${exIdx + 1}`;
                          return (
                            <div
                              key={ex.id}
                              className="bg-black/40 border border-white/8 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-7 h-7 rounded-xl bg-[#30D158]/20 text-[#30D158] font-black text-xs flex items-center justify-center shrink-0 border border-[#30D158]/30">
                                  {labelLetter}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic("light");
                                    onOpenDetail?.(ex);
                                  }}
                                  className="w-10 h-10 bg-black/50 rounded-xl overflow-hidden shrink-0 border border-white/10 cursor-pointer"
                                  title={t("view_exercise_details") || "Dettagli esercizio"}
                                >
                                  <ExerciseMedia exercise={ex} className="w-full h-full" />
                                </button>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-white leading-tight break-words">
                                    {t(ex.title) || ex.title}
                                  </h4>
                                  <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">
                                    {ex.category || "General"} • {getExerciseRestPreset(ex, exerciseRestPresets, restTimer)}s rest
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {usesWeightPlates(ex) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic("light");
                                      openPlateCalculator(ex);
                                    }}
                                    className="p-2 text-[#8E8E93] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                                    title={t("plate_calculator") || "Plate Calculator"}
                                  >
                                    <Disc className="w-4 h-4 text-[#30D158]" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setWarmupModalExercise(ex)}
                                  className="p-2 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-white/5 cursor-pointer"
                                  title={t("warmup") || "Warmup"}
                                >
                                  <Flame className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Round by Round Paired Rows */}
                      <div className="space-y-4 mb-4">
                        {Array.from({ length: maxRounds }).map((_, rIdx) => {
                          return (
                            <div
                              key={`round-${rIdx}`}
                              className="bg-black/30 border border-white/8 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-inner"
                            >
                              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#30D158] pb-1 border-b border-white/6">
                                <span>{t("superset_round") || "Giro"} {rIdx + 1}</span>
                                <span className="text-[10px] text-[#8E8E93] font-normal normal-case">
                                  {group.map((_, i) => `A${i + 1}`).join(" ➔ ")}
                                </span>
                              </div>

                              {group.map((ex, exIdx) => {
                                const set = ex.sets[rIdx];
                                if (!set) return null;
                                const labelLetter = `A${exIdx + 1}`;

                                return (
                                  <div
                                    key={set.id}
                                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all duration-150 border ${
                                      set.completed
                                        ? "bg-[#30D158]/10 border-[#30D158]/40 shadow-sm"
                                        : "bg-black/40 border-white/6"
                                    }`}
                                  >
                                    {/* Set Badge & Ex tag */}
                                    <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.5 rounded-md bg-[#30D158]/20 text-[#30D158] text-[10px] font-black shrink-0">
                                        {labelLetter}
                                      </span>
                                      {mode === "live" ? (
                                        <motion.button
                                          type="button"
                                          onClick={() => toggleSetCompletion(ex.id, set.id, set.completed)}
                                          whileTap={{ scale: 0.82, rotate: -3 }}
                                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 cursor-pointer select-none transition-all ${
                                            set.completed
                                              ? "bg-[#30D158] text-black font-extrabold shadow-sm"
                                              : "bg-white/6 border border-white/10 text-white/80 hover:bg-white/10"
                                          }`}
                                        >
                                          {set.completed ? (
                                            <Check className="w-4 h-4 stroke-[3]" />
                                          ) : (
                                            <span className="text-xs font-bold">{rIdx + 1}</span>
                                          )}
                                        </motion.button>
                                      ) : (
                                        <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                          {rIdx + 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Previous Performance */}
                                    <div className="col-span-2 text-center hidden sm:flex flex-col items-center justify-center">
                                      {(() => {
                                        const prev = prevSetsMap[ex.id]?.[rIdx];
                                        if (prev?.weight && prev?.reps) {
                                          return (
                                            <span className="text-[11px] font-bold text-[#8E8E93] tabular-nums">
                                              {prev.weight}×{prev.reps}
                                            </span>
                                          );
                                        }
                                        return <span className="text-[10px] text-[#8E8E93]/60">—</span>;
                                      })()}
                                    </div>

                                    {/* Weight Input */}
                                    <div className="col-span-4 sm:col-span-3 relative flex items-center">
                                      <input
                                        className="w-full bg-[#18191e] border border-white/10 rounded-xl text-white text-center h-10 py-1.5 px-2 text-sm font-extrabold tabular-nums tracking-tight focus:border-[#30D158] focus:outline-none transition-all shadow-inner"
                                        placeholder={isBodyweightExercise(ex) ? "BW" : unit}
                                        type="text"
                                        inputMode="decimal"
                                        value={set.weight === "" || set.weight === undefined ? "" : String(set.weight)}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => updateSet(ex.id, set.id, { weight: e.target.value })}
                                        onBlur={(e) => updateSet(ex.id, set.id, { weight: finalizeLiveNumericInput(e.target.value) })}
                                      />
                                    </div>

                                    {/* Reps Input */}
                                    <div className="col-span-4 sm:col-span-3 relative flex items-center">
                                      <input
                                        className="w-full bg-[#18191e] border border-white/10 rounded-xl text-white text-center h-10 py-1.5 px-2 text-sm font-extrabold tabular-nums tracking-tight focus:border-[#30D158] focus:outline-none transition-all shadow-inner"
                                        placeholder={isTimedExercise(ex) ? "Secs" : (t("reps_upper") || "Ripet.")}
                                        type="text"
                                        inputMode="numeric"
                                        value={set.reps === "" || set.reps === undefined ? "" : String(set.reps)}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => updateSet(ex.id, set.id, { reps: e.target.value })}
                                        onBlur={(e) => updateSet(ex.id, set.id, { reps: finalizeLiveNumericInput(e.target.value) })}
                                      />
                                    </div>

                                    {/* Delete Set */}
                                    <div className="col-span-1 flex justify-center text-error">
                                      <button
                                        type="button"
                                        onClick={() => deleteSet(ex.id, set.id)}
                                        className="p-1.5 hover:bg-error/10 active:scale-90 transition-all rounded-lg cursor-pointer"
                                        title="Delete Set"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-white/8">
                        <motion.button
                          whileTap={{ scale: 0.9, rotate: -1.5 }}
                          whileHover={{ scale: 1.04 }}
                          transition={CARTOON_SPRINGS.bouncy}
                          onClick={() => {
                            group.forEach((ex) => addSet(ex.id));
                          }}
                          className="text-xs font-bold text-black bg-[#30D158] hover:brightness-110 flex items-center gap-1.5 px-4 py-2.5 rounded-full cursor-pointer shadow-sm"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          {t("add_superset_round") || "Aggiungi Giro (A1 + A2)"}
                        </motion.button>

                        {group.map((ex, exIdx) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => addSet(ex.id)}
                            className="text-xs font-semibold text-[#8E8E93] hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full cursor-pointer border border-white/5"
                          >
                            + {t("add_set") || "Serie"} A{exIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`group-${groupIdx}`}
                  className="md:col-span-12 flex flex-col gap-4 relative"
                >
                  {group.map((ex, idx) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="relative z-10 w-full"
                  >
                    <div className="apple-glass-card rounded-3xl p-stack-lg relative transition-all duration-200 hover:border-white/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                      {/* Exercise Header */}
                      <div className="mb-stack-md flex flex-col gap-3">
                        {/* Row 1: Full-width Exercise Header (NO TRUNCATION) */}
                        <div className="flex items-start gap-3 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic("light");
                              onOpenDetail?.(ex);
                            }}
                            className="w-14 h-14 bg-black/40 flex items-center justify-center rounded-2xl border border-white/10 shrink-0 overflow-hidden cursor-pointer hover:border-[#30D158]/50 transition-colors active:scale-95 shadow-sm"
                            title={t("view_exercise_details") || "Dettagli esercizio"}
                            aria-label={`Visualizza dettagli per ${ex.title}`}
                          >
                            <ExerciseMedia exercise={ex} className="w-full h-full object-cover" />
                          </button>

                          <div className="flex-1 min-w-0">
                            {mode === "live" ? (
                              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight break-words tracking-tight">
                                {t(ex.title) || ex.title}
                              </h3>
                            ) : (
                              <input
                                className="font-extrabold text-base sm:text-lg bg-transparent border-b border-transparent focus:border-[#30D158]/60 text-white leading-tight break-words tracking-tight outline-none w-full"
                                value={t(ex.title)}
                                onChange={(e) =>
                                  updateExercise(ex.id, { title: e.target.value })
                                }
                                placeholder={t("exercise_name") || "Exercise Name"}
                              />
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs font-bold">
                              <span className="text-[#30D158] uppercase tracking-wider text-[11px]">
                                {ex.category || "General"}
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-[#8E8E93] text-[11px] font-sans font-semibold tabular-nums">
                                ⏱ {getExerciseRestPreset(ex, exerciseRestPresets, restTimer)}s rest
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Dedicated Command Toolbar placed underneath */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/6 w-full">
                          <div className="flex items-center gap-1.5">
                            {usesWeightPlates(ex) && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic("light");
                                  openPlateCalculator(ex);
                                }}
                                className="h-8 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold text-white/90 border border-white/8 cursor-pointer"
                                title={t("plate_calculator") || "Calcola dischi"}
                              >
                                <Disc className="w-3.5 h-3.5 text-[#30D158]" />
                                <span className="text-[11px] font-bold">Dischi</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setWarmupModalExercise(ex);
                              }}
                              className="h-8 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold text-amber-400 border border-amber-500/20 cursor-pointer"
                              title={t("warmup") || "Riscaldamento"}
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">Warmup</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openExerciseModal(undefined, ex.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-[#0A84FF] hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                              title="Sostituisci esercizio"
                              aria-label="Replace exercise"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === ex.id ? null : ex.id)
                                }
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                                aria-label="Exercise options"
                              >
                                <MoreVertical className="w-4 h-4" />
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
                                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#18181b] border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,1)] z-[101] overflow-hidden animate-in fade-in zoom-in duration-150">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        triggerHaptic("light");
                                        setIsReorderModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors"
                                    >
                                      <ListOrdered className="w-4 h-4 text-[#30D158]" />
                                      <span>{t("reorder_exercises") || "Riordina / Sposta"}</span>
                                    </button>
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
                                      className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-white/5"
                                    >
                                      <LinkIcon className={`w-4 h-4 ${ex.technique === "superset" ? "text-[#30D158]" : "text-[#8E8E93]"}`} />
                                      <span>{ex.technique === "superset"
                                        ? (t("remove_from_superset") || "Separa da Superset")
                                        : (t("make_superset") || "Crea Superset")}</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        duplicateExercise(ex.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-colors border-t border-white/5"
                                    >
                                      <Copy className="w-4 h-4 text-[#8E8E93]" />
                                      {t("duplicate") || "Duplica"}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteExercise(ex.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-xs font-bold text-[#FF453A] hover:bg-[#FF453A]/10 flex items-center gap-2 cursor-pointer transition-colors border-t border-white/5"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {t("delete") || "Elimina Esercizio"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sets Header */}
                      <div className="grid grid-cols-12 gap-2 mb-2 text-on-surface-variant text-[11px] uppercase tracking-wider px-2">
                        <div className="col-span-2 text-center font-bold">
                          {t("set")}
                        </div>
                        <div className="col-span-2 text-center font-bold">
                          {t("previous")}
                        </div>
                        <div className={`${showRpe ? "col-span-3" : "col-span-4"} text-center font-bold`}>
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
                        {(() => {
                          let mainSetCounter = 0;
                          const setNumberMap = ex.sets.map((s: any, idx: number) => {
                            const isAttached = idx > 0 && s.technique === "dropset";
                            if (!isAttached) {
                              mainSetCounter += 1;
                            }
                            return mainSetCounter;
                          });

                          return ex.sets.map((set: any, sIdx: number) => {
                            const isDropSet = set.technique === "dropset";
                            const isCluster = set.technique === "cluster";
                            const isAttachedChild = sIdx > 0 && isDropSet;
                            const nextIsAttachedChild = (sIdx + 1 < ex.sets.length) && ex.sets[sIdx + 1]?.technique === "dropset";
                            const displaySetNumber = setNumberMap[sIdx];

                            return (
                              <div key={set.id} className="relative">
                                {isAttachedChild && (
                                  <div className="absolute -top-3 left-6 z-10 flex flex-col items-center opacity-80 pointer-events-none">
                                    <div className="w-0.5 h-3 bg-primary-fixed" />
                                    <div className="w-2 h-2 border-r-2 border-b-2 border-primary-fixed rotate-45 -translate-y-1" />
                                  </div>
                                )}
                                <div
                                  className={`grid grid-cols-12 gap-2 items-center p-2.5 transition-all duration-150 border gpu-accelerated ${
                                    set.completed
                                      ? "bg-[#30D158]/10 border-[#30D158]/40 shadow-sm"
                                      : `bg-black/30 border-white/8 ${isAttachedChild ? "bg-white/[0.02] border-t-[#30D158]/20" : ""}`
                                  } ${isAttachedChild ? "-mt-2 rounded-t-none rounded-b-2xl border-t-0" : nextIsAttachedChild ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"}`}
                                >
                                  <div className="col-span-2 flex flex-col items-center justify-center relative">
                                    {isAttachedChild ? (
                                      <motion.div
                                        initial={false}
                                        animate={{
                                          scale: set.completed ? [1, 1.2, 0.94, 1.05, 1] : 1,
                                          rotate: set.completed ? [0, -5, 5, 0] : 0,
                                        }}
                                        transition={
                                          set.completed
                                            ? { ...CARTOON_KEYFRAMES.elastic, delay: 0.08 }
                                            : appleSpringDefault
                                        }
                                        className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl flex flex-col items-center justify-center relative transition-all duration-150 select-none ${
                                          set.completed
                                            ? "bg-[#30D158]/20 border border-[#30D158]/50 text-[#30D158] shadow-[0_0_12px_rgba(48,209,88,0.25)]"
                                            : "bg-white/4 border border-dashed border-primary-fixed/30 text-primary-fixed"
                                        }`}
                                        title="Drop set collegato alla serie principale"
                                      >
                                        {set.completed ? (
                                          <Check className="w-4 h-4 text-[#30D158] stroke-[2.5]" />
                                        ) : (
                                          <span className="text-xs font-black text-primary-fixed leading-none">↳</span>
                                        )}
                                        <span className="text-[7.5px] font-black uppercase tracking-wider leading-none mt-0.5">
                                          DROP
                                        </span>
                                      </motion.div>
                                    ) : mode === "live" ? (
                                      <motion.button
                                        type="button"
                                        onClick={() => toggleSetCompletion(ex.id, set.id, set.completed)}
                                        whileTap={{ scale: 0.8, rotate: -3 }}
                                        initial={false}
                                        animate={{
                                          scale: set.completed ? [1, 1.26, 0.92, 1.06, 1] : 1,
                                          rotate: set.completed ? [0, -7, 7, -2, 0] : 0,
                                        }}
                                        transition={set.completed ? CARTOON_KEYFRAMES.elastic : appleSpringDefault}
                                        className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm cursor-pointer select-none ${
                                          set.completed
                                            ? "bg-[#30D158] text-black font-extrabold shadow-[0_2px_14px_rgba(48,209,88,0.45)]"
                                            : "bg-white/6 border border-white/10 text-[#8E8E93] hover:bg-white/10 hover:text-white hover:border-[#30D158]/40"
                                        }`}
                                        aria-label={`Toggle set ${displaySetNumber} completion`}
                                      >
                                        {set.completed && (
                                          <motion.span
                                            key={`ripple-${set.id}`}
                                            initial={{ scale: 0.7, opacity: 0.85 }}
                                            animate={{ scale: 1.9, opacity: 0 }}
                                            transition={CARTOON_KEYFRAMES.ripple}
                                            className="absolute inset-0 rounded-2xl border-2 border-white pointer-events-none"
                                          />
                                        )}
                                        {set.completed ? (
                                          <motion.span
                                            key="completed"
                                            initial={{ scale: 0.5, opacity: 0, rotate: -25 }}
                                            animate={{ scale: [0.5, 1.32, 0.94, 1], opacity: 1, rotate: [-20, 8, -4, 0] }}
                                            transition={CARTOON_KEYFRAMES.pop}
                                            className="flex items-center justify-center"
                                          >
                                            <Check className="w-5 h-5 relative z-10 text-black stroke-[2.8]" />
                                          </motion.span>
                                        ) : (
                                          <span className="text-sm font-extrabold text-white/90 tabular-nums">
                                            {displaySetNumber}
                                          </span>
                                        )}
                                      </motion.button>
                                    ) : (
                                      <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                                        {displaySetNumber}
                                      </div>
                                    )}
                                    {isDropSet && !isAttachedChild && (
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
                                <div className="col-span-2 text-center flex flex-col items-center justify-center gap-0.5">
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
                                          <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.86, rotate: -2 }}
                                            whileHover={{ scale: 1.05 }}
                                            transition={CARTOON_SPRINGS.bouncy}
                                            onClick={() => {
                                              updateSet(ex.id, set.id, {
                                                weight: set.weight !== "" ? set.weight : prevW,
                                                reps: set.reps !== "" ? set.reps : targetR,
                                              });
                                            }}
                                            className="group inline-flex items-center gap-0.5 bg-surface-variant/40 hover:bg-primary-fixed/20 text-on-surface px-1.5 py-0.5 rounded text-[11px] font-bold font-sans tabular-nums border border-white/5 hover:border-primary-fixed/40 transition-colors cursor-pointer shadow-inner"
                                            title={`Scorsa volta: ${prevW}×${prevR}. Tocca per compilare target (${targetW}×${targetR})`}
                                          >
                                            <span>{prevW}<span className="text-primary-fixed/80 mx-0.5">×</span>{prevR}</span>
                                          </motion.button>
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
                                <div className={`${showRpe ? "col-span-3" : "col-span-4"} relative flex items-center`}>
                                  <input
                                    className="w-full bg-[#18191e] border border-white/10 rounded-xl text-white text-center h-11 py-2 px-2 text-base font-extrabold font-sans tabular-nums tracking-tight focus:border-[#30D158] focus:bg-[#1f2026] caret-[#30D158] focus:ring-1 focus:ring-[#30D158]/50 focus:outline-none transition-all shadow-inner"
                                    placeholder={isBodyweightExercise(ex) ? "BW" : unit}
                                    type="text"
                                    inputMode="decimal"
                                    value={set.weight === "" || set.weight === undefined ? "" : String(set.weight)}
                                    onFocus={(e) => {
                                      e.target.select();
                                    }}
                                    onChange={(e) =>
                                      updateSet(ex.id, set.id, {
                                        weight: e.target.value,
                                      })
                                    }
                                    onBlur={(e) => {
                                      updateSet(ex.id, set.id, {
                                        weight: finalizeLiveNumericInput(e.target.value),
                                      });
                                    }}
                                  />
                                </div>
                                <div className={`${showRpe ? "col-span-2" : "col-span-3"} relative flex items-center`}>
                                  <input
                                    className="w-full bg-[#18191e] border border-white/10 rounded-xl text-white text-center h-11 py-2 px-2 text-base font-extrabold font-sans tabular-nums tracking-tight focus:border-[#30D158] focus:bg-[#1f2026] caret-[#30D158] focus:ring-1 focus:ring-[#30D158]/50 focus:outline-none transition-all shadow-inner"
                                    placeholder={isTimedExercise(ex) ? "Secs" : (t("reps_upper") || "Ripet.")}
                                    type="text"
                                    inputMode="numeric"
                                    value={set.reps === "" || set.reps === undefined ? "" : String(set.reps)}
                                    onFocus={(e) => {
                                      e.target.select();
                                    }}
                                    onChange={(e) =>
                                      updateSet(ex.id, set.id, {
                                        reps: e.target.value,
                                      })
                                    }
                                    onBlur={(e) => {
                                      updateSet(ex.id, set.id, {
                                        reps: finalizeLiveNumericInput(e.target.value),
                                      });
                                    }}
                                  />
                                </div>
                                {showRpe && (
                                  <div className="col-span-2">
                                    <input
                                      className="w-full bg-[#18191e] border border-white/10 rounded-xl text-white text-center h-11 py-2 px-1 text-sm font-extrabold font-sans tabular-nums tracking-tight focus:border-[#30D158] focus:bg-[#1f2026] caret-[#30D158] focus:outline-none transition-all shadow-inner"
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
                        });
                      })()}
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
                          <motion.button
                            whileTap={{ scale: 0.8, rotate: -4 }}
                            whileHover={{ scale: 1.1 }}
                            transition={CARTOON_SPRINGS.bouncy}
                            onClick={() => {
                              const next = Math.max(0, getExerciseRestPreset(ex, exerciseRestPresets, restTimer) - 15);
                              updateExercise(ex.id, { restTimer: next });
                              onSaveExerciseRestPreset?.(ex.title, next);
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <span className="w-12 text-center text-primary font-black tabular-nums">
                            {getExerciseRestPreset(ex, exerciseRestPresets, restTimer)}s
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.8, rotate: 4 }}
                            whileHover={{ scale: 1.1 }}
                            transition={CARTOON_SPRINGS.bouncy}
                            onClick={() => {
                              const next = getExerciseRestPreset(ex, exerciseRestPresets, restTimer) + 15;
                              updateExercise(ex.id, { restTimer: next });
                              onSaveExerciseRestPreset?.(ex.title, next);
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-stack-md flex gap-stack-sm items-center flex-wrap">
                        <motion.button
                          whileTap={{ scale: 0.88, rotate: -1.5 }}
                          whileHover={{ scale: 1.05 }}
                          transition={CARTOON_SPRINGS.bouncy}
                          onClick={() => addSet(ex.id)}
                          className="text-sm font-bold text-on-surface-variant hover:text-primary-fixed flex items-center gap-1 transition-colors bg-white/5 px-3 py-2 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> {t("add_set")}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.88, rotate: -1.5 }}
                          whileHover={{ scale: 1.05 }}
                          transition={CARTOON_SPRINGS.bouncy}
                          onClick={() => setWarmupModalExercise(ex)}
                          className="text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-full hover:bg-amber-500/20 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-amber-400" /> {t("warmup") || "Warmup"}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.88, rotate: -1.5 }}
                          whileHover={{ scale: 1.05 }}
                          transition={CARTOON_SPRINGS.bouncy}
                          onClick={() => addSet(ex.id, "dropset")}
                          className="text-sm font-bold text-on-surface-variant hover:text-primary-fixed flex items-center gap-1 transition-colors bg-white/5 px-3 py-2 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                          <Zap className="w-4 h-4" /> {t("add_drop_cluster")}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          });
          })()}

          {/* Add Exercise Button */}
          <div className="md:col-span-12 mt-stack-md">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.01 }}
              transition={CARTOON_SPRINGS.bouncy}
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
            </motion.button>
          </div>
        </div>
      </main>

      {/* Exercise Selection Modal */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-surface-variant rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl will-change-transform transform-gpu">
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
                  className="w-full bg-surface-container border border-surface-variant rounded-lg pl-10 pr-10 py-2 text-sm outline-none focus:border-primary-fixed transition-colors"
                />
                {exerciseSearch && (
                  <button
                    type="button"
                    onClick={() => setExerciseSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <ExerciseFilterBar
                selectedCategory={filterMuscle}
                onSelectCategory={setFilterMuscle}
                counts={exerciseCategoryCounts}
                t={t}
              />

              {/* Equipment Filter & Reset Bar */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <div className="relative flex-1 max-w-[200px]">
                  <button
                    onClick={() => {
                      setIsEquipmentFilterOpen(!isEquipmentFilterOpen);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-container border border-surface-variant rounded-lg text-xs transition-colors hover:border-primary-fixed"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {t("equip")}:
                      </span>
                      <span className="font-bold text-primary truncate">
                        {t(filterEquipment.toLowerCase())}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-on-surface-variant transition-transform shrink-0 ${isEquipmentFilterOpen ? "rotate-180" : ""}`}
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
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-variant transition-colors ${filterEquipment === e ? "text-primary font-bold" : "text-on-surface"}`}
                        >
                          {t(e.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(filterMuscle !== "All" || filterEquipment !== "All" || exerciseSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMuscle("All");
                      setFilterEquipment("All");
                      setExerciseSearch("");
                    }}
                    className="text-xs text-primary hover:underline font-semibold px-2 py-1"
                  >
                    {t("clear_filters") || "Azzera filtri"}
                  </button>
                )}
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
                        <ExerciseMedia
                          exercise={ex}
                          className="w-16 h-16 shrink-0 rounded-lg"
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
              {modalExerciseResults.length === 0 && (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 text-on-surface-variant opacity-30" />
                  <p className="text-on-surface-variant text-sm">
                    {exerciseSearch
                      ? `No exercises found for "${exerciseSearch}"`
                      : "No exercises in this category"}
                  </p>
                  {(filterMuscle !== "All" || filterEquipment !== "All" || exerciseSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMuscle("All");
                        setFilterEquipment("All");
                        setExerciseSearch("");
                      }}
                      className="text-xs text-primary hover:underline font-semibold pt-1"
                    >
                      {t("clear_filters") || "Azzera filtri"}
                    </button>
                  )}
                </div>
              )}
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
      <AnimatePresence>
        {activeRestLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={appleSpringDefault}
            className="fixed bottom-0 left-0 w-full z-[150] px-margin-mobile py-3 pointer-events-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
          >
            <div className="bg-[#18181b]/95 backdrop-blur-2xl rounded-3xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between border border-[#30D158]/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(48,209,88,0.18)]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center justify-center relative shadow-sm">
                  <Clock className="w-5 h-5 absolute text-[#30D158]" />
                  <svg className="w-10 h-10 -rotate-90">
                    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" className="text-white/10" fill="none" />
                    <circle
                      cx="20" cy="20" r="16"
                      stroke="currentColor" strokeWidth="2.5"
                      className="text-[#30D158] transition-all duration-1000"
                      fill="none"
                      strokeDasharray={100.53}
                      strokeDashoffset={100.53 - (100.53 * (activeRestLeft || 0)) / (initialRestDuration || 90)}
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    {t("rest_timer") || "Recupero"}
                  </span>
                  <span className="text-3xl font-black tracking-tight tabular-nums text-white leading-none font-mono">
                    {formatTime(activeRestLeft)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 font-bold text-sm">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    triggerHaptic("light");
                    startRestTimer(Math.max(0, activeRestLeft - 15));
                  }}
                  className="h-10 px-3.5 bg-white/8 hover:bg-white/15 text-white rounded-full flex items-center justify-center transition-all text-xs font-semibold cursor-pointer border border-white/10"
                >
                  -15s
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    triggerHaptic("light");
                    startRestTimer(activeRestLeft + 30);
                  }}
                  className="h-10 px-3.5 bg-white/8 hover:bg-white/15 text-white rounded-full flex items-center justify-center transition-all text-xs font-semibold cursor-pointer border border-white/10"
                >
                  +30s
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    triggerHaptic("medium");
                    startRestTimer(0);
                  }}
                  className="h-10 px-4 bg-[#30D158] text-black font-extrabold rounded-full flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-[0_2px_12px_rgba(48,209,88,0.35)]"
                >
                  <span>Salta</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode !== "live" && (
        <div className="max-w-[1280px] mx-auto w-full px-margin-mobile md:px-margin-desktop pb-8">
          <button
            type="button"
            data-testid="bottom-save-routine-btn"
            onClick={handleRoutineSave}
            disabled={isSaving}
            className={`w-full bg-surface-variant hover:bg-white/10 border border-white/10 text-on-surface font-black rounded-2xl uppercase tracking-widest active:scale-[0.98] transition-all px-5 py-4 text-sm flex items-center justify-center gap-2 ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2" role="status" aria-label={t("saving") || "Saving..."}>
                <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-35" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                </span>
                {t("saving") || "Saving..."}
              </div>
            ) : (
              t("save_routine") || "Save Routine"
            )}
          </button>
        </div>
      )}

      

      {/* Apple-style Warmup Confirmation Modal */}
      <AnimatePresence>
        {warmupModalExercise && (() => {
          const firstSetWeight = Number(warmupModalExercise.sets[0]?.weight);
          const workingWeight = Number.isFinite(firstSetWeight) && firstSetWeight > 0 ? firstSetWeight : 60;
          const barWeight = getEquipmentBarWeight(warmupModalExercise.equipment, warmupModalExercise.title, unit);
          const previewSets = generateWarmupSets(workingWeight, barWeight, warmupModalExercise.equipment);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-4"
              onClick={() => setWarmupModalExercise(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={appleSpringDefault}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1C1C1E] border border-white/12 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)] p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-white tracking-tight">
                      {t("warmup_sets") || "Serie di Riscaldamento"}
                    </h3>
                    <p className="text-xs text-[#8E8E93] truncate font-medium">
                      {warmupModalExercise.title}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  {t("warmup_modal_desc") || "Genera 3 serie di riscaldamento progressive (40%, 60%, 80%) basate sul tuo carico target per preparare muscoli e articolazioni."}
                </p>

                <div className="bg-black/40 border border-white/8 rounded-2xl p-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex justify-between">
                    <span>Target: {workingWeight} {unit}</span>
                    <span>3 Serie Piramidali</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    {previewSets.map((s, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center text-white/90 bg-white/5 px-2.5 py-1.5 rounded-xl">
                        <span className="text-[#8E8E93] text-[11px] font-sans">Set {sIdx + 1}</span>
                        <span className="font-bold">{s.weight} {unit} × {s.reps} reps</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setWarmupModalExercise(null)}
                    className="flex-1 min-h-[44px] py-3 bg-white/10 hover:bg-white/15 text-white rounded-full font-semibold text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    {t("cancel") || "Annulla"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleGenerateWarmup(warmupModalExercise.id);
                      setWarmupModalExercise(null);
                    }}
                    className="flex-1 min-h-[44px] py-3 bg-amber-500 text-black rounded-full font-bold text-xs hover:brightness-105 transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center"
                  >
                    {t("add_warmup_sets") || "Aggiungi serie"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
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
          confirmLabel={t("save_and_finish") || "Termina e Salva"}
          cancelLabel={t("keep_workout_btn") || "Continua Sessione"}
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
