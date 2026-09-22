import { useState, useEffect, useMemo, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  BASIC_EXERCISES,
  loadExerciseCatalog,
  mergeExerciseCatalog,
} from "../data/exercises";
import { translations } from "../data/translations";
import {
  buildPersonalRecords,
  buildPersonalRecordSlots,
  buildCompletedWorkoutLog,
  buildPreviousSetsMap,
  buildRoutineFromWorkoutLog,
  buildSavedExerciseNotes,
  buildTemplateFromLiveWorkout,
  countPlannedSets,
  getExerciseRestPreset,
  getNextScheduledRoutine,
  hasWorkoutLoggedOnDay,
  getRestTimerLeft,
  isTimedExercise,
  calculateOneRepMax,
  convertWeight,
  roundToGymWeight,
  type OneRepMaxFormula,
} from "../lib/workoutUtils";
import {
  findRoutineCatalogMatch,
  normalizeRoutineImportText,
  parseLiftLabRoutineText,
} from "../lib/routineImport";
import {
  filterLiftLabStorage,
  parseGuestObject,
  readJson,
  readJsonArray,
  readJsonRecord,
  removeJsonAtomic,
  restoreRawLocalStorageEntries,
  writeJsonAtomic,
} from "../lib/storage";
import { showToast } from "../lib/toast";
import {
  startLiveWorkoutNotification,
  stopLiveWorkoutNotification,
} from "../lib/liveWorkoutBridge";
import type { RoutineData, ExerciseData, SetData, WeightLog, UserData } from "../types/workout";

export const getLogDate = (log: any) => {
  if (!log || !log.date) return new Date();
  if (typeof log.date.toDate === "function") return log.date.toDate();
  return new Date(log.date);
};

export function useWorkoutData() {
  const [userData, setUserData] = useState<any | null>(() => {
    const existing = localStorage.getItem("liftlab_guest_data");
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch {
        // Fallback
      }
    }
    const defaultData = {
      displayName: "Guest",
      unit: "LBS",
      restTimer: 90,
      weeklyGoal: 3,
      dashboardStats: [
        "avg_duration",
        "total_sets_week",
        "best_volume",
        "workouts_week",
        "time_week",
      ],
      language: "en",
      hasCompletedTutorial: false,
      updatedAt: new Date().toISOString(),
    };
    writeJsonAtomic("liftlab_guest_data", defaultData);
    return defaultData;
  });

  const saveUserData = async (data: any) => {
    const existing = localStorage.getItem("liftlab_guest_data");
    const merged = parseGuestObject(existing);
    const updated = { ...merged, ...data, updatedAt: new Date().toISOString() };
    writeJsonAtomic("liftlab_guest_data", updated);
    setUserData(updated);
    if (data.language) setLanguage(data.language);
    if (data.unit) setUnit(data.unit);
  };

  const [sharingRoutine, setSharingRoutine] = useState<RoutineData | null>(null);
  const [isImportCodeOpen, setIsImportCodeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const active = localStorage.getItem("liftlab_is_live_active") === "true";
    return active ? "live_editor" : "dashboard";
  });
  const [prevTab, setPrevTab] = useState("dashboard");
  const [lastWorkoutData, setLastWorkoutData] = useState<any>(null);
  const [isLiveWorkoutActive, setIsLiveWorkoutActive] = useState(() => {
    return localStorage.getItem("liftlab_is_live_active") === "true";
  });
  const [liveWorkoutKey, setLiveWorkoutKey] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);

  const readCustomExercises = () => {
    const saved = localStorage.getItem("liftlab_custom_exercises");
    if (saved) {
      try {
        const custom = JSON.parse(saved);
        return Array.isArray(custom) ? custom : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const [exerciseCatalog, setExerciseCatalog] = useState<ExerciseData[]>(BASIC_EXERCISES);
  const [isExerciseCatalogLoading, setIsExerciseCatalogLoading] = useState(true);
  const [shouldLoadExerciseCatalog, setShouldLoadExerciseCatalog] = useState(false);
  const [exercises, setExercises] = useState<ExerciseData[]>(() =>
    mergeExerciseCatalog(BASIC_EXERCISES, readCustomExercises()),
  );

  useEffect(() => {
    const catalogTabs = new Set([
      "library",
      "workout",
      "progress",
      "routine_editor",
      "live_editor",
      "exercise_details",
      "add_exercise",
    ]);
    if (catalogTabs.has(activeTab)) {
      setShouldLoadExerciseCatalog(true);
      return;
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      let idleHandle: number | undefined;
      const delayHandle = window.setTimeout(() => {
        idleHandle = idleWindow.requestIdleCallback?.(
          () => setShouldLoadExerciseCatalog(true),
          { timeout: 3500 },
        );
      }, 1600);
      return () => {
        window.clearTimeout(delayHandle);
        if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      };
    }

    const handle = window.setTimeout(() => setShouldLoadExerciseCatalog(true), 3200);
    return () => window.clearTimeout(handle);
  }, [activeTab]);

  useEffect(() => {
    if (!shouldLoadExerciseCatalog) return;
    let cancelled = false;
    loadExerciseCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setExerciseCatalog(catalog);
        setExercises((current) =>
          mergeExerciseCatalog(
            catalog,
            current.filter((exercise) => exercise.id.startsWith("e_custom_")),
          ),
        );
      })
      .catch((error) => console.error("Error loading exercise catalog:", error))
      .finally(() => {
        if (!cancelled) setIsExerciseCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shouldLoadExerciseCatalog]);

  const [routines, setRoutines] = useState<RoutineData[]>(() => {
    return readJsonArray<RoutineData>("liftlab_routines");
  });

  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(() => {
    return localStorage.getItem("liftlab_active_routine_id");
  });

  const [activeExercise, setActiveExercise] = useState<ExerciseData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<string[]>([
    "avg_duration",
    "total_sets_week",
    "best_volume",
    "workouts_week",
    "time_week",
  ]);

  const [weeklyGoal, setWeeklyGoalState] = useState<number>(() => {
    const saved = localStorage.getItem("liftlab_weekly_goal");
    return saved ? parseInt(saved, 10) : 3;
  });

  const setWeeklyGoal = (n: number) => {
    setWeeklyGoalState(n);
    localStorage.setItem("liftlab_weekly_goal", String(n));
    saveUserData({ weeklyGoal: n });
  };

  const [showTutorial, setShowTutorial] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number>(() => {
    const saved = localStorage.getItem("liftlab_weight_logs");
    if (saved) {
      try {
        const logs = JSON.parse(saved);
        if (logs.length > 0) return logs[logs.length - 1].weight;
      } catch (e) {}
    }
    const guestData = localStorage.getItem("liftlab_guest_data");
    if (guestData) {
      try {
        const data = JSON.parse(guestData);
        if (data.currentWeight) return data.currentWeight;
      } catch (e) {}
    }
    return 0;
  });

  const [weightLogs, setWeightLogs] = useState<{ date: string; weight: number }[]>(() => {
    return readJsonArray<{ date: string; weight: number }>("liftlab_weight_logs");
  });

  const [language, setLanguage] = useState(() => {
    const existing = localStorage.getItem("liftlab_guest_data");
    if (existing) {
      try {
        const data = JSON.parse(existing);
        if (data.language) return data.language;
      } catch {}
    }
    return "en";
  });

  const [unit, setUnit] = useState(() => {
    const existing = localStorage.getItem("liftlab_guest_data");
    if (existing) {
      try {
        const data = JSON.parse(existing);
        if (data.unit) return data.unit;
      } catch {}
    }
    return "LBS";
  });

  const [isEmptyPromptOpen, setIsEmptyPromptOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [restTimer, setRestTimer] = useState(90);
  const [showRpe, setShowRpe] = useState<boolean>(() => {
    const saved = localStorage.getItem("liftlab_guest_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.showRpe !== false;
      } catch {}
    }
    return true;
  });

  const [oneRepMaxFormula, setOneRepMaxFormula] = useState<OneRepMaxFormula>(() => {
    const saved = localStorage.getItem("liftlab_guest_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.oneRepMaxFormula === "brzycki") return "brzycki";
      } catch {}
    }
    return "epley";
  });

  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [isReplaceWorkoutConfirmOpen, setIsReplaceWorkoutConfirmOpen] = useState(false);
  const [pendingStartRoutineId, setPendingStartRoutineId] = useState<string | null>(null);

  const [pendingWorkout, setPendingWorkout] = useState<RoutineData | null>(null);
  
  const [transientLiveRoutine, setTransientLiveRoutineState] = useState<RoutineData | null>(() => {
    return readJson<RoutineData | null>("liftlab_transient_routine", null);
  });

  const setTransientLiveRoutine = (routine: RoutineData | null) => {
    setTransientLiveRoutineState(routine);
    if (routine) {
      writeJsonAtomic("liftlab_transient_routine", routine);
    } else {
      removeJsonAtomic("liftlab_transient_routine");
    }
  };
  
  const [workoutLogs, setWorkoutLogs] = useState<any[]>(() => {
    return readJsonArray<any>("liftlab_workout_logs");
  });

  const [exerciseRestPresets, setExerciseRestPresets] = useState<Record<string, number>>(() => {
    return readJsonRecord<number>("liftlab_exercise_rest_presets");
  });

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(() => {
    return localStorage.getItem("liftlab_cookie_consent") === null;
  });

  const [pendingBackupData, setPendingBackupData] = useState<any | null>(null);
  const [isImportBackupConfirmOpen, setIsImportBackupConfirmOpen] = useState(false);

  const clearLiveSessionStorage = () => {
    removeJsonAtomic("liftlab_live_progress");
    localStorage.removeItem("liftlab_live_elapsed");
    localStorage.removeItem("liftlab_live_rest_timer");
    localStorage.removeItem("liftlab_live_started_at");
    localStorage.setItem("liftlab_is_live_active", "false");
    localStorage.removeItem("liftlab_active_routine_id");
  };

  const teardownLiveSession = async () => {
    clearLiveSessionStorage();
    setTransientLiveRoutine(null);
    setIsLiveWorkoutActive(false);
    setActiveRoutineId(null);
    const stopped = await stopLiveWorkoutNotification();
    if (!stopped) {
      showToast("Could not stop the live workout notification. It may still appear in the shade.", "error");
    }
  };

  const handleExportData = () => {
    const data = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      storage: "offline-local",
      user: userData,
      routines: routines,
      logs: workoutLogs,
      weightLogs,
      exerciseRestPresets,
      customExercises: exercises.filter((e) => e.id.startsWith("e_custom_")),
      localStorageKeys: Object.fromEntries(
        Object.keys(localStorage)
          .filter((key) => key.startsWith("liftlab_"))
          .map((key) => [key, localStorage.getItem(key)]),
      ),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liftlab_data_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (file: File) => {
    try {
      const raw = await file.text();
      const imported = JSON.parse(raw);
      if (!imported || typeof imported !== "object") {
        throw new Error("Invalid LiftLab export.");
      }
      setPendingBackupData(imported);
      setIsImportBackupConfirmOpen(true);
    } catch (error) {
      console.error("Import failed:", error);
      showToast("Could not import this file. Please choose a valid LiftLab JSON export.", "error");
    }
  };

  const handleCancelImportBackup = () => {
    setIsImportBackupConfirmOpen(false);
    setPendingBackupData(null);
  };

  const handleConfirmImportBackup = async () => {
    if (!pendingBackupData) return;
    const imported = pendingBackupData;
    setIsImportBackupConfirmOpen(false);
    setPendingBackupData(null);

    try {
      await teardownLiveSession();

      // Safety snapshot of current storage before overwrite
      try {
        const currentData = {
          routines,
          workoutLogs,
          weightLogs,
          userData,
          exerciseRestPresets,
          customExercises: exercises.filter((e) => e.id.startsWith("e_custom_")),
        };
        writeJsonAtomic("liftlab_backup_pre_import", currentData);
      } catch {}

      if (imported.localStorageKeys && typeof imported.localStorageKeys === "object") {
        restoreRawLocalStorageEntries(imported.localStorageKeys);
      }

      const importedRoutines = Array.isArray(imported.routines)
        ? imported.routines
        : readJsonArray<RoutineData>("liftlab_routines");
      const importedLogs = Array.isArray(imported.logs)
        ? imported.logs
        : readJsonArray<any>("liftlab_workout_logs");
      const importedWeightLogs = Array.isArray(imported.weightLogs)
        ? imported.weightLogs
        : readJsonArray<WeightLog>("liftlab_weight_logs");
      const importedCustomExercises = Array.isArray(imported.customExercises)
        ? imported.customExercises
        : readJsonArray<ExerciseData>("liftlab_custom_exercises");
      const importedPresets =
        imported.exerciseRestPresets && typeof imported.exerciseRestPresets === "object"
          ? imported.exerciseRestPresets
          : readJsonRecord<number>("liftlab_exercise_rest_presets");

      setRoutines(importedRoutines);
      setWorkoutLogs(importedLogs);
      setWeightLogs(importedWeightLogs);
      setExerciseRestPresets(importedPresets);
      setExercises(mergeExerciseCatalog(exerciseCatalog, importedCustomExercises));

      writeJsonAtomic("liftlab_routines", importedRoutines);
      writeJsonAtomic("liftlab_workout_logs", importedLogs);
      writeJsonAtomic("liftlab_weight_logs", importedWeightLogs);
      writeJsonAtomic("liftlab_custom_exercises", importedCustomExercises);
      writeJsonAtomic("liftlab_exercise_rest_presets", importedPresets);

      if (imported.user && typeof imported.user === "object") {
        const nextUser = { ...parseGuestObject(localStorage.getItem("liftlab_guest_data")), ...imported.user };
        writeJsonAtomic("liftlab_guest_data", nextUser);
        setUserData(nextUser);
      }

      if (importedWeightLogs.length > 0) {
        setCurrentWeight(importedWeightLogs[importedWeightLogs.length - 1].weight || 0);
      }
      if (imported.user?.unit) setUnit(imported.user.unit);
      if (imported.user?.restTimer) setRestTimer(imported.user.restTimer);
      if (Array.isArray(imported.user?.dashboardStats)) {
        setDashboardStats(imported.user.dashboardStats);
      }
      if (typeof imported.user?.weeklyGoal === "number") {
        setWeeklyGoal(imported.user.weeklyGoal);
      }
      if (imported.user?.oneRepMaxFormula) {
        setOneRepMaxFormula(imported.user.oneRepMaxFormula);
      }

      if (activeTab === "live_editor") {
        setActiveTab("dashboard");
      }

      showToast(`Imported ${importedRoutines.length} routine(s) and ${importedLogs.length} workout log(s).`, "success");
    } catch (error) {
      console.error("Import failed:", error);
      showToast("Could not import this file. Please choose a LiftLab JSON export.", "error");
    }
  };

  const handleRestorePreImportBackup = () => {
    const backup = readJson<any | null>("liftlab_backup_pre_import", null);
    if (!backup) {
      showToast("No pre-import safety backup available.", "error");
      return;
    }
    if (Array.isArray(backup.routines)) {
      setRoutines(backup.routines);
      writeJsonAtomic("liftlab_routines", backup.routines);
    }
    if (Array.isArray(backup.workoutLogs)) {
      setWorkoutLogs(backup.workoutLogs);
      writeJsonAtomic("liftlab_workout_logs", backup.workoutLogs);
    }
    if (Array.isArray(backup.weightLogs)) {
      setWeightLogs(backup.weightLogs);
      writeJsonAtomic("liftlab_weight_logs", backup.weightLogs);
    }
    if (backup.exerciseRestPresets) {
      setExerciseRestPresets(backup.exerciseRestPresets);
      writeJsonAtomic("liftlab_exercise_rest_presets", backup.exerciseRestPresets);
    }
    if (Array.isArray(backup.customExercises)) {
      setExercises(mergeExerciseCatalog(exerciseCatalog, backup.customExercises));
      writeJsonAtomic("liftlab_custom_exercises", backup.customExercises);
    }
    if (backup.userData) {
      writeJsonAtomic("liftlab_guest_data", backup.userData);
      setUserData(backup.userData);
      if (backup.userData.unit) setUnit(backup.userData.unit);
      if (backup.userData.restTimer) setRestTimer(backup.userData.restTimer);
      if (typeof backup.userData.weeklyGoal === "number") {
        setWeeklyGoalState(backup.userData.weeklyGoal);
        localStorage.setItem("liftlab_weekly_goal", String(backup.userData.weeklyGoal));
      }
      if (backup.userData.displayName) setUserName(backup.userData.displayName);
    }
    removeJsonAtomic("liftlab_backup_pre_import");
    showToast("Restored safety snapshot prior to last import.", "success");
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountConfirmOpen(true);
  };

  const handleDeleteAccountConfirmed = async () => {
    setIsDeleteAccountConfirmOpen(false);
    Object.keys(localStorage)
      .filter((key) => key.startsWith("liftlab_"))
      .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("liftlab_tutorial_completed", "true");
    saveUserData({ hasCompletedTutorial: true });
    setActiveTab("dashboard");
  };

  // Persistence effects
  useEffect(() => {
    writeJsonAtomic("liftlab_routines", routines);
  }, [routines]);

  useEffect(() => {
    writeJsonAtomic("liftlab_workout_logs", workoutLogs);
  }, [workoutLogs]);

  useEffect(() => {
    writeJsonAtomic("liftlab_exercise_rest_presets", exerciseRestPresets);
  }, [exerciseRestPresets]);

  const savedExerciseNotes = useMemo(
    () => buildSavedExerciseNotes(workoutLogs),
    [workoutLogs],
  );

  useEffect(() => {
    writeJsonAtomic("liftlab_weight_logs", weightLogs);
  }, [weightLogs]);

  useEffect(() => {
    const custom = exercises.filter((ex) => ex.id.startsWith("e_custom_"));
    writeJsonAtomic("liftlab_custom_exercises", custom);
  }, [exercises]);

  // Sync user settings from offline storage
  useEffect(() => {
    if (userData) {
      if (userData.language) setLanguage(userData.language);
      setUnit(userData.unit || "LBS");
      setRestTimer(userData.restTimer || 90);
      setShowRpe(userData.showRpe !== false);
      const latestWeightInLogs =
        userData.weightLogs && userData.weightLogs.length > 0
          ? userData.weightLogs[userData.weightLogs.length - 1].weight
          : 0;

      const newWeight = userData.currentWeight || latestWeightInLogs || 0;
      if (newWeight !== 0) {
        setCurrentWeight(newWeight);
      }

      if (userData.weightLogs) {
        setWeightLogs(userData.weightLogs);
      }
      const stats = userData.dashboardStats || [];
      if (stats.length === 0)
        setDashboardStats([
          "avg_duration",
          "total_sets_week",
          "best_volume",
          "workouts_week",
          "time_week",
        ]);
      else setDashboardStats(stats);

      if (userData.weeklyGoal) {
        setWeeklyGoalState(userData.weeklyGoal);
        localStorage.setItem("liftlab_weekly_goal", String(userData.weeklyGoal));
      }
      setUserName(userData.displayName || "User");

      const localTutorialCompleted =
        localStorage.getItem("liftlab_tutorial_completed") === "true";
      const userTutorialCompleted = userData.hasCompletedTutorial === true;

      if (localTutorialCompleted || userTutorialCompleted) {
        setShowTutorial(false);
      } else {
        setShowTutorial(true);
      }
    } else {
      const hasCompleted =
        localStorage.getItem("liftlab_tutorial_completed") === "true";
      setShowTutorial(!hasCompleted);
    }
  }, [userData]);

  // Clean ghost live workout on startup if referenced routine no longer exists
  useEffect(() => {
    const isLive = localStorage.getItem("liftlab_is_live_active") === "true";
    const activeId = localStorage.getItem("liftlab_active_routine_id");
    const progress = readJson<RoutineData | null>("liftlab_live_progress", null);

    if (isLive) {
      const isRoutineMatch = Boolean(activeId && activeId !== "empty" && routines.some((r) => r.id === activeId));
      const isTransientMatch = Boolean(activeId && transientLiveRoutine && transientLiveRoutine.id === activeId);
      const isEmptyWithProgress = activeId === "empty" || (!activeId && Boolean(progress && progress.id));

      if (!isRoutineMatch && !isTransientMatch && !isEmptyWithProgress) {
        localStorage.setItem("liftlab_is_live_active", "false");
        localStorage.removeItem("liftlab_active_routine_id");
        removeJsonAtomic("liftlab_live_progress");
        localStorage.removeItem("liftlab_live_elapsed");
        localStorage.removeItem("liftlab_live_rest_timer");
        localStorage.removeItem("liftlab_live_started_at");
        setIsLiveWorkoutActive(false);
        stopLiveWorkoutNotification();
        setActiveRoutineId(null);
        if (activeTab === "live_editor") {
          setActiveTab("dashboard");
        }
      }
    }
  }, [routines, transientLiveRoutine, activeTab]);

  useEffect(() => {
    try {
      LocalNotifications.requestPermissions().catch(() => undefined);
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleStorageError = () => {
      showToast("Storage quota warning. Consider exporting a backup.", "error");
    };
    window.addEventListener("liftlab:storage-error", handleStorageError);
    return () => window.removeEventListener("liftlab:storage-error", handleStorageError);
  }, []);

  const t = (key: string) =>
    translations[language]?.[key] || translations["en"]?.[key] || key;

  const updatePRsFromWorkout = async (_workout: RoutineData) => {
    // PRs are built reactively from workoutLogs in workoutUtils
  };

  const handleSaveRoutine = async (
    updatedRoutine: RoutineData,
    isWorkout: boolean = true,
  ) => {
    const exercisesChanged = () => {
      const baseRoutine = routines.find(r => r.id === updatedRoutine.id);
      if (!baseRoutine) return true;
      if (baseRoutine.exercises.length !== updatedRoutine.exercises.length) return true;
      for (let i = 0; i < baseRoutine.exercises.length; i++) {
        const baseEx = baseRoutine.exercises[i];
        const newEx = updatedRoutine.exercises[i];
        if (baseEx.title !== newEx.title || baseEx.id !== newEx.id) return true;
      }
      return false;
    };

    if (isWorkout && !isEmptyPromptOpen && !updatedRoutine.sourceLogId && (activeRoutineId === "empty" || exercisesChanged())) {
      setPendingWorkout(updatedRoutine);
      setIsEmptyPromptOpen(true);
      return;
    }

    if ((!updatedRoutine.sourceLogId && activeRoutineId !== "empty") || !isWorkout) {
      const templateToSave: RoutineData = isWorkout
        ? buildTemplateFromLiveWorkout(updatedRoutine)
        : updatedRoutine;
      setRoutines((prev) => {
        const exists = prev.find((r) => r.id === templateToSave.id);
        if (exists)
          return prev.map((r) =>
            r.id === templateToSave.id ? templateToSave : r,
          );
        return [templateToSave, ...prev];
      });
    }

    if (!isWorkout) {
      setActiveTab("workout");
      return;
    }

    const completedLog = buildCompletedWorkoutLog(updatedRoutine);
    if (completedLog.exercises.length === 0) {
      showToast("Complete at least one set before finishing.", "error");
      return;
    }

    const newGuestLog = {
      id: crypto.randomUUID(),
      routineId: updatedRoutine.id,
      routineName: updatedRoutine.name || "Workout",
      exercises: completedLog.exercises,
      duration: updatedRoutine.duration,
      plannedSetCount: countPlannedSets(updatedRoutine),
      date: new Date(),
      userId: "guest",
    };
    setWorkoutLogs((prev) => [newGuestLog as any, ...prev]);
    await teardownLiveSession();
    setPendingWorkout(null);
    setIsEmptyPromptOpen(false);
    setLastWorkoutData(newGuestLog);
    setActiveTab("workout_summary");
  };

  const handleConfirmEmptySave = async (saveAsRoutine: boolean) => {
    if (!pendingWorkout || isConfirming) return;
    setIsConfirming(true);

    try {
      const completedLog = buildCompletedWorkoutLog(pendingWorkout);
      if (completedLog.exercises.length === 0) {
        showToast("Complete at least one set before finishing.", "error");
        return;
      }
      if (saveAsRoutine) {
        const newRoutine: RoutineData = {
          ...buildTemplateFromLiveWorkout(pendingWorkout),
          id: crypto.randomUUID(),
          name: pendingWorkout.name || `Routine ${routines.length + 1}`,
        };
        setRoutines((prev) => [newRoutine, ...prev]);
      }
      const newEmptyLog = {
        id: crypto.randomUUID(),
        routineId: pendingWorkout.id,
        routineName: pendingWorkout.name || "Workout",
        exercises: completedLog.exercises,
        duration: pendingWorkout.duration,
        plannedSetCount: countPlannedSets(pendingWorkout),
        date: new Date(),
        userId: "guest",
      };
      setWorkoutLogs((prev) => [newEmptyLog as any, ...prev]);
      await teardownLiveSession();
      setPendingWorkout(null);
      setIsEmptyPromptOpen(false);
      setLastWorkoutData(newEmptyLog);
      setActiveTab("workout_summary");
    } finally {
      setIsConfirming(false);
    }
  };

  const navigateTo = (tab: string) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.history.pushState({ tab }, "", window.location.href);
  };

  const activeTabRef = useRef(activeTab);
  const prevTabRef = useRef(prevTab);
  const overlayBackHandlerRef = useRef<null | (() => boolean)>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
    prevTabRef.current = prevTab;
  }, [activeTab, prevTab]);

  useEffect(() => {
    overlayBackHandlerRef.current = () => {
      if (isImportBackupConfirmOpen) {
        setIsImportBackupConfirmOpen(false);
        setPendingBackupData(null);
        return true;
      }
      if (isReplaceWorkoutConfirmOpen) {
        setIsReplaceWorkoutConfirmOpen(false);
        setPendingStartRoutineId(null);
        return true;
      }
      if (isWeightModalOpen) {
        setIsWeightModalOpen(false);
        return true;
      }
      if (isEmptyPromptOpen) {
        setIsEmptyPromptOpen(false);
        setPendingWorkout(null);
        return true;
      }
      if (showPrivacyPolicy) {
        setShowPrivacyPolicy(false);
        return true;
      }
      if (showTOS) {
        setShowTOS(false);
        return true;
      }
      if (isDeleteAccountConfirmOpen) {
        setIsDeleteAccountConfirmOpen(false);
        return true;
      }
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem("liftlab_tutorial_completed", "true");
        return true;
      }
      return false;
    };
  }, [
    isDeleteAccountConfirmOpen,
    isEmptyPromptOpen,
    isImportBackupConfirmOpen,
    isReplaceWorkoutConfirmOpen,
    isWeightModalOpen,
    showPrivacyPolicy,
    showTOS,
    showTutorial,
  ]);

  const handleInAppBack = () => {
    const current = activeTabRef.current;
    window.history.pushState({ tab: current }, "", window.location.href);
    const backEvent = new CustomEvent("liftlab:back", { cancelable: true });
    window.dispatchEvent(backEvent);
    if (backEvent.defaultPrevented) return;
    if (overlayBackHandlerRef.current?.()) return;
    if (current === "live_editor") {
      try {
        (CapacitorApp as any).minimizeApp?.();
      } catch {}
      return;
    }
    if (current !== "dashboard") {
      setActiveTab("dashboard");
      return;
    }
    // Minimize app to keep process warm in background without cold restarts
    try {
      (CapacitorApp as any).minimizeApp?.();
    } catch {
      try {
        (CapacitorApp as any).exitApp?.();
      } catch {}
    }
  };

  useEffect(() => {
    window.history.pushState({ tab: activeTabRef.current }, "", window.location.href);
    const handlePop = () => handleInAppBack();
    window.addEventListener("popstate", handlePop);
    let nativeBack: { remove: () => Promise<void> } | null = null;
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      handleInAppBack();
      if (!canGoBack) {
        window.history.pushState({ tab: activeTabRef.current }, "", window.location.href);
      }
    }).then((listener) => {
      nativeBack = listener;
    });
    return () => {
      window.removeEventListener("popstate", handlePop);
      nativeBack?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle launcher shortcuts (e.g. liftlab://workout or liftlab://routines)
  useEffect(() => {
    let urlListener: { remove: () => Promise<void> } | null = null;
    CapacitorApp.addListener("appUrlOpen", (event) => {
      if (!event?.url) return;
      if (event.url.includes("workout")) {
        setActiveTab("workout");
      } else if (event.url.includes("routines")) {
        setActiveTab("library");
      }
    }).then((listener) => {
      urlListener = listener;
    });

    return () => {
      urlListener?.remove();
    };
  }, [setActiveTab]);

  const beginFreshLiveWorkout = async (id: string) => {
    await stopLiveWorkoutNotification();
    removeJsonAtomic("liftlab_live_progress");
    localStorage.removeItem("liftlab_live_elapsed");
    localStorage.removeItem("liftlab_live_rest_timer");
    setTransientLiveRoutine(null);
    localStorage.setItem("liftlab_live_started_at", String(Date.now()));
    localStorage.setItem("liftlab_is_live_active", "true");
    localStorage.setItem("liftlab_active_routine_id", id);
    setActiveRoutineId(id);
    setLiveWorkoutKey((prev) => prev + 1);
    setIsLiveWorkoutActive(true);
    const targetRoutine = routines.find((r) => r.id === id);
    const firstEx = targetRoutine?.exercises?.[0];
    const startResult = await startLiveWorkoutNotification({
      currentExercise: firstEx?.title || targetRoutine?.name || "Live Workout",
      currentSetInfo: `Serie 1 di ${firstEx?.sets?.length || 1}`,
      restRemainingSeconds: 0,
      isResting: false,
    });
    if (startResult.permissionDenied) {
      showToast("Notification permission is off. Live rest actions in the shade will not work.", "info");
    } else if (!startResult.ok) {
      showToast("Could not start the live workout notification.", "error");
    }
    navigateTo("live_editor");
  };

  const handleStartLiveWorkout = (id: string) => {
    if (isLiveWorkoutActive) {
      setPendingStartRoutineId(id);
      setIsReplaceWorkoutConfirmOpen(true);
      return;
    }
    void beginFreshLiveWorkout(id);
  };

  const handleConfirmReplaceWorkout = () => {
    setIsReplaceWorkoutConfirmOpen(false);
    if (!pendingStartRoutineId) return;
    const nextId = pendingStartRoutineId;
    setPendingStartRoutineId(null);
    void beginFreshLiveWorkout(nextId);
  };

  const handleDiscardLiveWorkout = async () => {
    await teardownLiveSession();
    navigateTo("workout");
  };

  const handleRepeatLastWorkout = () => {
    if (!workoutLogs.length) {
      navigateTo("workout");
      return;
    }
    if (isLiveWorkoutActive) {
      showToast("Finish or discard the current workout first.", "info");
      return;
    }
    const latest = [...workoutLogs]
      .filter((log) => log?.exercises?.length)
      .sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime())[0];
    if (!latest) return;
    const routine = {
      ...buildRoutineFromWorkoutLog(latest),
      sourceLogId: latest.id,
      tags: ["Repeat"],
      scheduledDay: undefined,
    } as RoutineData;
    removeJsonAtomic("liftlab_live_progress");
    localStorage.removeItem("liftlab_live_elapsed");
    localStorage.removeItem("liftlab_live_rest_timer");
    setTransientLiveRoutine(routine);
    localStorage.setItem("liftlab_live_started_at", String(Date.now()));
    localStorage.setItem("liftlab_is_live_active", "true");
    localStorage.setItem("liftlab_active_routine_id", routine.id);
    setActiveRoutineId(routine.id);
    setLiveWorkoutKey((prev) => prev + 1);
    setIsLiveWorkoutActive(true);
    const firstEx = routine?.exercises?.[0];
    void startLiveWorkoutNotification({
      currentExercise: firstEx?.title || routine?.name || "Live Workout",
      currentSetInfo: `Serie 1 di ${firstEx?.sets?.length || 1}`,
      restRemainingSeconds: 0,
      isResting: false,
    }).then((startResult) => {
      if (startResult.permissionDenied) {
        showToast("Notification permission is off. Live rest actions in the shade will not work.", "info");
      } else if (!startResult.ok) {
        showToast("Could not start the live workout notification.", "error");
      }
    });
    navigateTo("live_editor");
  };

  const handleToggleFavoriteRoutine = async (id: string) => {
    const routine = routines.find((r) => r.id === id);
    if (!routine) return;
    const updated = { ...routine, favorite: !routine.favorite };
    setRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const handleSaveExerciseRestPreset = (title: string, seconds: number) => {
    const key = title.trim().toLowerCase();
    if (!key) return;
    setExerciseRestPresets((prev) => ({ ...prev, [key]: seconds }));
  };

  const handleToggleUnit = async (newUnit: string) => {
    const fromUnit = unit || "LBS";
    const toUnit = newUnit;
    if (fromUnit.trim().toUpperCase() !== toUnit.trim().toUpperCase()) {
      const convertAndRound = (val: any) => {
        const converted = convertWeight(val, fromUnit, toUnit);
        return roundToGymWeight(converted, 2);
      };

      // Convert workoutLogs
      const convertedLogs = workoutLogs.map((log) => ({
        ...log,
        exercises: (log.exercises || []).map((ex: any) => ({
          ...ex,
          sets: (ex.sets || []).map((set: any) => ({
            ...set,
            weight: convertAndRound(set.weight),
          })),
        })),
      }));

      // Convert routines
      const convertedRoutines = routines.map((routine) => ({
        ...routine,
        exercises: (routine.exercises || []).map((ex) => ({
          ...ex,
          sets: (ex.sets || []).map((set) => ({
            ...set,
            weight: convertAndRound(set.weight),
          })),
        })),
      }));

      // Convert weightLogs
      const convertedWeightLogs = weightLogs.map((wl) => ({
        ...wl,
        weight: Number(convertAndRound(wl.weight)) || 0,
      }));

      // Convert currentWeight
      const convertedCurrentWeight = Number(convertAndRound(currentWeight)) || 0;

      // Convert custom exercises
      const convertedExercises = exercises.map((ex) => {
        if (!ex.id.startsWith("e_custom_")) return ex;
        return {
          ...ex,
          prWeight: ex.prWeight ? Number(convertAndRound(ex.prWeight)) : undefined,
          prRepsWeight: ex.prRepsWeight ? Number(convertAndRound(ex.prRepsWeight)) : undefined,
          oneRepMax: ex.oneRepMax ? Number(convertAndRound(ex.oneRepMax)) : undefined,
          sets: (ex.sets || []).map((s) => ({
            ...s,
            weight: convertAndRound(s.weight),
          })),
        };
      });

      // Convert transientLiveRoutine if active
      if (transientLiveRoutine) {
        const convertedTransient: RoutineData = {
          ...transientLiveRoutine,
          exercises: (transientLiveRoutine.exercises || []).map((ex) => ({
            ...ex,
            sets: (ex.sets || []).map((set) => ({
              ...set,
              weight: convertAndRound(set.weight),
            })),
          })),
        };
        setTransientLiveRoutine(convertedTransient);
      }

      // Convert liftlab_live_progress if active
      const savedLiveProgress = readJson<RoutineData | null>("liftlab_live_progress", null);
      if (savedLiveProgress && Array.isArray(savedLiveProgress.exercises)) {
        const convertedLive: RoutineData = {
          ...savedLiveProgress,
          exercises: savedLiveProgress.exercises.map((ex) => ({
            ...ex,
            sets: (ex.sets || []).map((set) => ({
              ...set,
              weight: convertAndRound(set.weight),
            })),
          })),
        };
        writeJsonAtomic("liftlab_live_progress", convertedLive);
      }

      setWorkoutLogs(convertedLogs);
      setRoutines(convertedRoutines);
      setWeightLogs(convertedWeightLogs);
      setCurrentWeight(convertedCurrentWeight);
      setExercises(convertedExercises);

      writeJsonAtomic("liftlab_workout_logs", convertedLogs);
      writeJsonAtomic("liftlab_routines", convertedRoutines);
      writeJsonAtomic("liftlab_weight_logs", convertedWeightLogs);
      writeJsonAtomic(
        "liftlab_custom_exercises",
        convertedExercises.filter((e) => e.id.startsWith("e_custom_")),
      );
      setUnit(newUnit);
      await saveUserData({
        unit: newUnit,
        currentWeight: convertedCurrentWeight,
        weightLogs: convertedWeightLogs,
      });
    } else {
      setUnit(newUnit);
      await saveUserData({ unit: newUnit });
    }
  };

  const handleSetOneRepMaxFormula = async (formula: OneRepMaxFormula) => {
    setOneRepMaxFormula(formula);
    await saveUserData({ oneRepMaxFormula: formula });
  };

  const handleAddExercise = async (newEx: any) => {
    try {
      if (newEx.id.startsWith("e_custom_")) {
        const saved = localStorage.getItem("liftlab_custom_exercises");
        let customList: any[] = [];
        if (saved) {
          try {
            customList = JSON.parse(saved);
          } catch (e) {}
        }
        customList.push(newEx);
        writeJsonAtomic("liftlab_custom_exercises", customList);
        setExercises((prev) => [...prev, newEx]);
      } else {
        setExercises((prev) => [...prev, newEx]);
      }
      if (activeTab !== "routine_editor" && activeTab !== "live_editor") {
        setActiveTab(prevTab);
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
    }
  };

  const handleUpdateWeight = () => {
    const num = Number(weightInput);
    if (!Number.isFinite(num) || num <= 0 || num > 1000) return;
    setAppWeight(num);
    setIsWeightModalOpen(false);
  };

  const getPreviousSetsForImportedExercise = (title: string) => {
    const target = normalizeRoutineImportText(title);
    if (!target) return [];
    const matchesTitle = (candidateTitle?: string) => {
      const candidate = normalizeRoutineImportText(candidateTitle);
      return candidate === target || candidate.includes(target) || target.includes(candidate);
    };

    const sortedLogs = [...workoutLogs].sort((a, b) => {
      const aTime = a?.date ? new Date(a.date).getTime() : 0;
      const bTime = b?.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });

    for (const log of sortedLogs) {
      const found = log?.exercises?.find((exercise: any) => matchesTitle(exercise?.title));
      const sets = found?.sets
        ?.filter((set: any) => set.weight !== "" && set.weight !== undefined && set.weight !== null)
        .map((set: any) => ({ weight: set.weight, reps: set.reps ?? "" }));
      if (sets?.length) return sets;
    }

    for (const routine of routines) {
      const found = routine.exercises?.find((exercise) => matchesTitle(exercise.title));
      const sets = found?.sets
        ?.filter((set) => set.weight !== "" && set.weight !== undefined && set.weight !== null)
        .map((set) => ({ weight: set.weight, reps: set.reps ?? "" }));
      if (sets?.length) return sets;
    }

    return [];
  };

  const fillImportedRoutineWeights = (routine: RoutineData): RoutineData => ({
    ...routine,
    exercises: routine.exercises.map((exercise) => {
      const previousSets = getPreviousSetsForImportedExercise(exercise.title);
      if (!previousSets.length) return exercise;
      return {
        ...exercise,
        sets: exercise.sets.map((set, index) => {
          const previous = previousSets[index] ?? previousSets[previousSets.length - 1];
          return {
            ...set,
            weight: set.weight === "" ? previous.weight : set.weight,
            reps: set.reps === "" ? previous.reps : set.reps,
          };
        }),
      };
    }),
  });

  const createMissingImportedExercises = async (routine: RoutineData) => {
    const existingTitles = new Set(exercises.map((exercise) => normalizeRoutineImportText(exercise.title)));
    const customExercises: ExerciseData[] = [];

    for (const exercise of routine.exercises) {
      const key = normalizeRoutineImportText(exercise.title);
      if (!key || existingTitles.has(key)) continue;
      const matched = findRoutineCatalogMatch(exercise.title, exercises);
      if (matched) {
        existingTitles.add(key);
        continue;
      }
      existingTitles.add(key);
      customExercises.push({
        id: `e_custom_import_${Date.now()}_${customExercises.length}`,
        title: exercise.title,
        category: exercise.category || "Custom",
        type: "Custom",
        equipment: exercise.type || "Custom",
        notes: exercise.notes || "Created automatically from routine import.",
        sets: [],
        muscleFocus: [exercise.category || "Custom"],
        image: exercise.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200&h=200",
      });
    }

    if (!customExercises.length) return 0;
    setExercises((prev) => [...prev, ...customExercises]);
    return customExercises.length;
  };

  const handleImportRoutine = async (file: File) => {
    try {
      const text = await file.text();
      const parsedRoutines = parseLiftLabRoutineText(text, exercises) as RoutineData[];
      if (parsedRoutines.length === 0) {
        showToast("No routines found to import.", "error");
        return;
      }

      let totalCustomCreated = 0;
      const importedNames: string[] = [];

      for (const parsedRoutine of parsedRoutines) {
        const customCreated = await createMissingImportedExercises(parsedRoutine);
        totalCustomCreated += customCreated;
        const importedRoutine = fillImportedRoutineWeights(parsedRoutine);
        await handleSaveRoutine(importedRoutine, false);
        setActiveRoutineId(importedRoutine.id);
        importedNames.push(importedRoutine.name);
      }

      const namesStr = importedNames.map((n) => `"${n}"`).join(", ");
      showToast(
        totalCustomCreated > 0
          ? `Imported ${parsedRoutines.length} routine(s): ${namesStr}. Created ${totalCustomCreated} custom exercise(s).`
          : `Imported ${parsedRoutines.length} routine(s): ${namesStr}`,
        "success",
      );
    } catch (error) {
      console.error("Routine import failed:", error);
      showToast(error instanceof Error ? error.message : "Import failed. Check the JSON file.", "error");
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (isLiveWorkoutActive && activeRoutineId === id) {
      showToast("Cannot delete routine while workout is in progress.", "error");
      return;
    }
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteWorkoutLog = async (logId: string) => {
    setWorkoutLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const handleDuplicateRoutine = async (routine: RoutineData) => {
    const duplicated: RoutineData = {
      ...routine,
      id: crypto.randomUUID(),
      name: `${routine.name} (Copy)`,
    };
    setRoutines((prev) => [...prev, duplicated]);
  };

  const setAppLanguage = (lang: string) => {
    setLanguage(lang);
    saveUserData({ language: lang });
  };

  const setAppRestTimer = (time: number) => {
    setRestTimer(time);
    saveUserData({ restTimer: time });
  };

  const handleSetShowRpe = async (show: boolean) => {
    setShowRpe(show);
    await saveUserData({ showRpe: show });
  };

  const setAppWeight = (w: number) => {
    setCurrentWeight(w);
    const newLog = { date: new Date().toISOString(), weight: w };
    setWeightLogs((prev) => {
      const updated = [...prev, newLog];
      saveUserData({ currentWeight: w, weightLogs: updated });
      return updated;
    });
  };

  const setAppDashboardStats = (stats: string[]) => {
    setDashboardStats(stats);
    saveUserData({ dashboardStats: stats });
  };

  const handleCreateRoutine = () => {
    setActiveRoutineId(null);
    navigateTo("routine_editor");
  };

  const handleOpenExerciseDetails = (ex: ExerciseData) => {
    setActiveExercise(ex);
    navigateTo("exercise_details");
  };

  const handleDetailsAddExercise = (exDef: ExerciseData) => {
    const titleKey = String(exDef.title || "").trim().toLowerCase();
    const newEx: any = {
      id: crypto.randomUUID(),
      title: exDef.title,
      category: exDef.category,
      type: exDef.type,
      image: exDef.image,
      notes: savedExerciseNotes[titleKey] || "",
      restTimer: getExerciseRestPreset(exDef, exerciseRestPresets, restTimer),
      sets: [
        { id: crypto.randomUUID(), weight: "", reps: "", completed: false },
      ],
    };

    if (activeRoutineId) {
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === activeRoutineId
            ? { ...r, exercises: [...(r.exercises || []), newEx] }
            : r,
        ),
      );
    }
    setActiveTab(prevTab);
  };

  return {
    userData,
    setUserData,
    saveUserData,
    sharingRoutine,
    setSharingRoutine,
    isImportCodeOpen,
    setIsImportCodeOpen,
    activeTab,
    setActiveTab,
    prevTab,
    setPrevTab,
    lastWorkoutData,
    setLastWorkoutData,
    isLiveWorkoutActive,
    setIsLiveWorkoutActive,
    liveWorkoutKey,
    setLiveWorkoutKey,
    isConfirming,
    setIsConfirming,
    exercises,
    isExerciseCatalogLoading,
    setExercises,
    routines,
    setRoutines,
    activeRoutineId,
    setActiveRoutineId,
    activeExercise,
    setActiveExercise,
    dashboardStats,
    setDashboardStats,
    weeklyGoal,
    setWeeklyGoal,
    showTutorial,
    setShowTutorial,
    currentWeight,
    setCurrentWeight,
    weightLogs,
    setWeightLogs,
    language,
    setLanguage,
    unit,
    setUnit,
    isEmptyPromptOpen,
    setIsEmptyPromptOpen,
    userName,
    setUserName,
    restTimer,
    setRestTimer,
    showRpe,
    setShowRpe,
    isDeleteAccountConfirmOpen,
    setIsDeleteAccountConfirmOpen,
    isWeightModalOpen,
    setIsWeightModalOpen,
    weightInput,
    setWeightInput,
    isReplaceWorkoutConfirmOpen,
    setIsReplaceWorkoutConfirmOpen,
    pendingStartRoutineId,
    setPendingStartRoutineId,
    pendingWorkout,
    setPendingWorkout,
    transientLiveRoutine,
    setTransientLiveRoutine,
    workoutLogs,
    setWorkoutLogs,
    exerciseRestPresets,
    setExerciseRestPresets,
    showPrivacyPolicy,
    setShowPrivacyPolicy,
    showTOS,
    setShowTOS,
    showCookieConsent,
    setShowCookieConsent,
    savedExerciseNotes,
    t,
    handleExportData,
    handleImportData,
    isImportBackupConfirmOpen,
    setIsImportBackupConfirmOpen,
    pendingBackupData,
    handleConfirmImportBackup,
    handleCancelImportBackup,
    handleRestorePreImportBackup,
    handleDeleteAccount,
    handleDeleteAccountConfirmed,
    finishTutorial,
    updatePRsFromWorkout,
    handleSaveRoutine,
    handleConfirmEmptySave,
    handleConfirmReplaceWorkout,
    handleDiscardLiveWorkout,
    navigateTo,
    handleInAppBack,
    handleStartLiveWorkout,
    handleRepeatLastWorkout,
    handleToggleFavoriteRoutine,
    handleSaveExerciseRestPreset,
    handleToggleUnit,
    handleAddExercise,
    handleUpdateWeight,
    getPreviousSetsForImportedExercise,
    fillImportedRoutineWeights,
    createMissingImportedExercises,
    handleImportRoutine,
    handleDeleteRoutine,
    handleDeleteWorkoutLog,
    handleDuplicateRoutine,
    setAppLanguage,
    setAppRestTimer,
    handleSetShowRpe,
    oneRepMaxFormula,
    setOneRepMaxFormula,
    handleSetOneRepMaxFormula,
    setAppWeight,
    setAppDashboardStats,
    handleCreateRoutine,
    handleOpenExerciseDetails,
    handleDetailsAddExercise,
  };
}
