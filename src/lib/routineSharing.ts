import type { RoutineData, ExerciseData, SetData } from "../types/workout";
import { isTimedExercise } from "./workoutUtils";
import { showToast } from "./toast";
import { triggerHaptic } from "./haptics";

export interface RoutineExportSet {
  id?: string;
  weight: number | string;
  reps: number | string;
  technique?: string;
  rpe?: number | string;
  completed?: boolean;
}

export interface RoutineExportExercise {
  id?: string;
  title: string;
  category: string;
  type: string;
  equipment?: string;
  notes: string;
  restTimer?: number;
  technique?: string;
  supersetId?: string;
  sets: RoutineExportSet[];
}

export interface RoutineExportItem {
  id?: string;
  name: string;
  duration: number;
  tags: string[];
  scheduledDay?: number;
  favorite?: boolean;
  exercises: RoutineExportExercise[];
}

export interface RoutinesExportPayload {
  schema: "liftlab.routine.v1";
  version: string;
  exportedAt: string;
  count: number;
  routine?: RoutineExportItem; // For backwards-compatibility with v1 single-routine parsers
  routines: RoutineExportItem[];
}

/**
 * Transforms an array of RoutineData into a full-fidelity export payload
 * preserving all exercises, notes, sets, target weights, reps, rest timers, techniques and RPE.
 */
export function buildRoutinesExportPayload(routines: RoutineData[]): RoutinesExportPayload {
  const formattedRoutines: RoutineExportItem[] = routines.map((routine) => ({
    id: routine.id,
    name: routine.name?.trim() || "Routine",
    duration: routine.duration || 60,
    tags: routine.tags || [],
    scheduledDay: routine.scheduledDay,
    favorite: routine.favorite,
    exercises: (routine.exercises || []).map((ex: ExerciseData) => ({
      id: ex.id,
      title: ex.title,
      category: ex.category || "Strength",
      type: ex.type || "Strength",
      equipment: ex.equipment,
      notes: ex.notes || "",
      restTimer: ex.restTimer,
      technique: ex.technique,
      supersetId: ex.supersetId,
      sets: (ex.sets || []).map((s: SetData) => {
        const setPayload: RoutineExportSet = {
          id: s.id,
          weight: s.weight === undefined || s.weight === null ? "" : s.weight,
          reps: s.reps === undefined || s.reps === null ? "" : s.reps,
          completed: false,
        };
        if (s.technique) setPayload.technique = s.technique;
        if (s.rpe !== undefined && s.rpe !== null && s.rpe !== "") setPayload.rpe = s.rpe;
        return setPayload;
      }),
    })),
  }));

  const payload: RoutinesExportPayload = {
    schema: "liftlab.routine.v1",
    version: "1.0.17",
    exportedAt: new Date().toISOString(),
    count: formattedRoutines.length,
    routines: formattedRoutines,
  };

  if (formattedRoutines.length === 1) {
    payload.routine = formattedRoutines[0];
  }

  return payload;
}

/**
 * Downloads a JSON file of the selected routines directly.
 */
export function downloadRoutinesJson(routines: RoutineData[], customFilename?: string): void {
  const payload = buildRoutinesExportPayload(routines);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const sanitizedName = routines.length === 1
    ? (routines[0].name || "routine").toLowerCase().replace(/[^a-z0-9]/g, "_")
    : `${routines.length}_schede`;
  a.href = url;
  a.download = customFilename || `liftlab_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  triggerHaptic("success");
}

/**
 * Copies the full-fidelity JSON of the selected routines to clipboard.
 */
export async function copyRoutinesJsonToClipboard(
  routines: RoutineData[],
  t?: (key: string) => string
): Promise<boolean> {
  const payload = buildRoutinesExportPayload(routines);
  const text = JSON.stringify(payload, null, 2);
  try {
    triggerHaptic("light");
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(field);
      if (!copied) throw new Error("Copy command failed");
    }
    showToast(
      routines.length === 1
        ? (t?.("routine_code_copied") || "Codice scheda copiato negli appunti.")
        : `${routines.length} schede copiate negli appunti.`,
      "success"
    );
    return true;
  } catch (err) {
    console.error("Clipboard copy error:", err);
    showToast(t?.("clipboard_copy_failed") || "Accesso agli appunti non riuscito. Riprova.", "error");
    return false;
  }
}

/**
 * Attempts to share routines via native Share API (WhatsApp, Telegram, Files, etc.).
 * Returns true if native share succeeded, or false if not supported/cancelled.
 */
export async function shareRoutinesNative(
  routines: RoutineData[],
  t?: (key: string) => string
): Promise<{ success: boolean; fallbackNeeded: boolean }> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return { success: false, fallbackNeeded: true };
  }

  const payload = buildRoutinesExportPayload(routines);
  const jsonStr = JSON.stringify(payload, null, 2);
  const sanitizedName = routines.length === 1
    ? (routines[0].name || "routine").toLowerCase().replace(/[^a-z0-9]/g, "_")
    : `${routines.length}_schede`;
  const fileName = `liftlab_${sanitizedName}.json`;

  try {
    const file = new File([jsonStr], fileName, { type: "application/json" });
    const shareData: ShareData = {
      title: routines.length === 1 ? `LiftLab: ${routines[0].name}` : `LiftLab: ${routines.length} Schede`,
      text: routines.length === 1
        ? `Scheda "${routines[0].name}" da LiftLab con esercizi, note, pesi e ripetizioni.`
        : `${routines.length} schede di allenamento esportate da LiftLab.`,
    };

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      shareData.files = [file];
    }

    triggerHaptic("medium");
    await navigator.share(shareData);
    showToast(
      routines.length === 1 ? "Scheda condivisa!" : `${routines.length} schede condivise!`,
      "success"
    );
    return { success: true, fallbackNeeded: false };
  } catch (err) {
    // If user cancelled, don't show error or fallback
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, fallbackNeeded: false };
    }
    console.warn("Native share failed, falling back to modal:", err);
    return { success: false, fallbackNeeded: true };
  }
}
