import type { ExerciseData, RoutineData } from "../types/workout";

export type PreviousSet = { weight: number | string; reps: number | string };

export type RestTimerState = {
  duration: number;
  startedAt: number;
};

export type PersonalRecord = {
  title: string;
  bestWeight: number;
  bestReps: number;
  bestVolume: number;
  estimatedOneRepMax: number;
  date?: string;
};

type DateLike = string | number | Date | { toDate: () => Date };
type SetLike = { id?: string; weight?: number | string; reps?: number | string; completed?: boolean; technique?: string };
type ExerciseLike = Omit<Partial<ExerciseData>, "sets"> & { sets?: SetLike[] };
type WorkoutLogLike = {
  id?: string;
  name?: string;
  routineName?: string;
  date?: DateLike;
  duration?: number;
  tags?: string[];
  exercises?: ExerciseLike[];
  plannedSetCount?: number;
};

const toDate = (value: DateLike) => {
  if (value instanceof Date) return value;
  if (typeof value !== "object") return new Date(value);
  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return new Date(0);
};

const getLogTime = (log: { date?: DateLike }) => {
  if (!log?.date) return 0;
  const time = toDate(log.date).getTime();
  return Number.isFinite(time) ? time : 0;
};

const formatLogDate = (date?: DateLike) => {
  if (!date) return undefined;
  return toDate(date).toISOString();
};

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function hasWorkoutLoggedOnDay(workoutLogs: WorkoutLogLike[], day: Date) {
  const targetKey = getDateKey(day);
  return (workoutLogs || []).some((log) => {
    if (!log?.date || !log?.exercises?.length) return false;
    const date = toDate(log.date);
    if (!Number.isFinite(date.getTime())) return false;
    return getDateKey(date) === targetKey;
  });
}

export function buildPreviousSetsMap(
  workoutLogs: WorkoutLogLike[],
  routineExercises: Pick<ExerciseData, "id" | "title">[],
) {
  const map: Record<string, PreviousSet[]> = {};
  const sorted = [...(workoutLogs || [])]
    .filter((log) => log?.date)
    .sort((a, b) => getLogTime(b) - getLogTime(a));

  for (const routineEx of routineExercises || []) {
    const title = routineEx.title?.trim().toLowerCase();
    for (const log of sorted) {
      const found = log.exercises?.find((ex: any) => {
        const exTitle = ex.title?.trim().toLowerCase();
        return exTitle === title || ex.id === routineEx.id;
      });
      if (found?.sets?.length > 0) {
        map[routineEx.id] = found.sets
          .filter((set: any) => set.completed && set.weight !== "")
          .map((set: any) => ({ weight: set.weight, reps: set.reps }));
        if (map[routineEx.id].length > 0) break;
      }
    }
  }

  return map;
}

export function getRestTimerLeft(
  state: RestTimerState | null,
  now = Date.now(),
) {
  if (!state || state.duration <= 0 || state.startedAt <= 0) return null;
  if (now < state.startedAt) return state.duration;
  const elapsed = Math.floor((now - state.startedAt) / 1000);
  if (elapsed < 0) return state.duration;
  const left = state.duration - elapsed;
  if (left > state.duration) return state.duration;
  return left > 0 ? left : null;
}

const VOLUME_COMPARISONS = [
  { weight: 25, items: ["a suitcase packed by someone with zero restraint", "a stack of office chairs", "a suspiciously dense laundry basket"] },
  { weight: 50, items: ["a fully loaded vending-machine refill box", "a weekend of grocery bags in one trip", "a small hotel minibar inventory"] },
  { weight: 100, items: ["a washing machine trying to escape spin cycle", "a pile of dumbbells with bad attitude", "a compact fridge full of energy drinks"] },
  { weight: 200, items: ["a scooter with main-character energy", "a pizza oven for a very serious kitchen", "a stack of nightclub speakers"] },
  { weight: 400, items: ["a concert PA stack", "a steel safe full of questionable secrets", "an elevator door collection nobody asked for"] },
  { weight: 750, items: ["a tiny car with gym membership", "a cafe espresso machine fleet", "a pallet of protein powder tubs"] },
  { weight: 1200, items: ["a delivery van having an identity crisis", "a forklift battery with emotional baggage", "a bakery's monthly flour supply"] },
  { weight: 2500, items: ["a food truck ready for battle", "a marble countertop showroom", "a small boat pretending this is normal"] },
  { weight: 5000, items: ["a shipping container's bad mood", "a luxury SUV plus its ego", "a pile of gym machines that saw you coming"] },
  { weight: 10_000, items: ["a bus stop kiosk made of pure stubbornness", "a stack of arcade cabinets", "a nightclub sound system for the whole city"] },
  { weight: 20_000, items: ["a subway carriage having leg day", "a small construction crane's breakfast", "a warehouse rack full of chaos"] },
  { weight: 40_000, items: ["a regional train carriage with no chill", "a ferry deck worth of scooters", "a tower crane counterweight flex"] },
  { weight: 80_000, items: ["a cargo plane's carry-on luggage", "a bridge section doing reps", "a warehouse forklift convention"] },
  { weight: Infinity, items: ["a skyscraper lobby's entire personality", "an airport baggage claim nightmare", "a moon base starter kit"] },
];

export function getVolumeComparison(volumeKg: number, seed = Date.now()) {
  if (volumeKg <= 0) return null;
  const bucket = VOLUME_COMPARISONS.find((comparison) => volumeKg <= comparison.weight);
  if (!bucket) return null;
  const index = Math.abs(seed) % bucket.items.length;
  return { weight: bucket.weight, item: bucket.items[index] };
}

const normalizeTitle = (title: string) => title.trim().toLowerCase();

const makeId = (prefix: string, index: number) =>
  `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;

export function buildRoutineFromWorkoutLog(log: WorkoutLogLike): RoutineData {
  const exercises = (log?.exercises || []).map((exercise: any, exIndex: number) => ({
    ...exercise,
    id: makeId("repeat-ex", exIndex),
    notes: exercise.notes || "",
    sets: (exercise.sets || []).map((set: any, setIndex: number) => ({
      ...set,
      id: makeId("repeat-set", setIndex),
      completed: false,
    })),
  }));

  // Convert seconds duration of log to minutes for the repeated routine template
  const rawDur = typeof log?.duration === "number" ? log.duration : 3600;
  const templateDuration = getWorkoutLogDurationMinutes(rawDur);

  return {
    id: makeId("repeat-routine", 0),
    name: log?.routineName || log?.name || "Repeated Workout",
    duration: templateDuration,
    tags: log?.tags || [],
    exercises,
  };
}

export function buildCompletedWorkoutLog(routine: RoutineData): RoutineData {
  return {
    ...routine,
    exercises: routine.exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => set.completed && canCompleteSet(set, exercise)),
      }))
      .filter((exercise) => exercise.sets.length > 0),
  };
}

export function countPlannedSets(routine: { exercises?: { sets?: unknown[] }[] } | null | undefined): number {
  return (routine?.exercises || []).reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);
}

export function buildTemplateFromLiveWorkout(routine: RoutineData): RoutineData {
  return {
    ...routine,
    duration: getWorkoutLogDurationMinutes(routine.duration),
    sourceLogId: undefined,
    exercises: (routine.exercises || []).map((exercise) => ({
      ...exercise,
      sets: (exercise.sets || []).map((set) => ({ ...set, completed: false })),
    })),
  };
}

export function shouldRestoreLiveProgress(
  saved: { id?: string } | null | undefined,
  targetId?: string | null,
): boolean {
  if (!saved?.id) return false;
  if (!targetId) return false;
  if (targetId === "empty") return saved.id === "empty";
  return saved.id === targetId;
}

export function canCompleteSet(
  set: { weight?: number | string; reps?: number | string } | null | undefined,
  exercise?: { title?: string; type?: string; category?: string },
): boolean {
  if (!set) return false;
  const reps = Number(set.reps);
  const hasReps = Number.isFinite(reps) && reps > 0;
  if (!hasReps) return false;
  if (exercise && isTimedExercise(exercise)) return true;
  return set.weight !== "" && set.weight !== undefined && Number.isFinite(Number(set.weight));
}

export function dissolveSuperset<T extends { id: string; technique?: string; supersetId?: string }>(
  exercises: T[],
  exId: string,
): T[] {
  const target = exercises.find((exercise) => exercise.id === exId);
  const supersetId = target?.supersetId;
  return exercises.map((exercise) => {
    const matches = supersetId ? exercise.supersetId === supersetId : exercise.id === exId;
    return matches ? { ...exercise, technique: "", supersetId: undefined } : exercise;
  });
}

export function finalizeLiveNumericInput(value: number | string | "" | null | undefined): number | "" {
  if (value === "" || value === undefined || value === null) return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "";
}

export function formatWeightUnit(unit: string | undefined | null): "kg" | "lbs" {
  return String(unit || "").trim().toUpperCase() === "LBS" ? "lbs" : "kg";
}

export function getNextScheduledRoutine(routines: RoutineData[], now = new Date()) {
  if (!routines || routines.length === 0) return undefined;
  const todayIndex = (now.getDay() + 6) % 7;
  const scheduled = routines.filter((routine) => routine.scheduledDay != null && routine.scheduledDay !== undefined);

  if (scheduled.length > 0) {
    for (let offset = 0; offset < 7; offset++) {
      const targetDay = (todayIndex + offset) % 7;
      const match = scheduled.find((routine) => Number(routine.scheduledDay) === targetDay);
      if (match) return match;
    }
  }

  return routines.find((r) => r.favorite) || routines[0];
}

export function buildSavedExerciseNotes(workoutLogs: WorkoutLogLike[]) {
  const notes: Record<string, string> = {};
  const sorted = [...(workoutLogs || [])]
    .filter((log) => log?.exercises?.length)
    .sort((a, b) => getLogTime(b) - getLogTime(a));

  for (const log of sorted) {
    for (const exercise of log.exercises || []) {
      const title = normalizeTitle(exercise?.title || "");
      const note = String(exercise?.notes || "").trim();
      if (title && note && !notes[title]) notes[title] = note;
    }
  }

  return notes;
}

export function getExerciseRestPreset(
  exercise: { title?: string; restTimer?: number },
  presets: Record<string, number>,
  fallback: number,
) {
  if (typeof exercise?.restTimer === "number" && exercise.restTimer >= 0) {
    return exercise.restTimer;
  }
  const title = normalizeTitle(exercise?.title || "");
  const saved = title ? presets?.[title] : undefined;
  return typeof saved === "number" && saved >= 0 ? saved : fallback;
}

export type OneRepMaxFormula = "epley" | "brzycki";

/**
 * Calculates estimated One Rep Max using Epley formula with asymptotic protection.
 * Formula: weight * (1 + min(30, reps) / 30)
 * Returns exact weight for reps === 1, and 0 for invalid inputs.
 */
export const calculateOneRepMaxEpley = (weight: number | string, reps: number | string): number => {
  const w = typeof weight === "number" ? weight : Number(weight);
  const r = typeof reps === "number" ? reps : Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return 0;
  if (r === 1) return Math.round(w);
  const cappedReps = Math.min(30, r);
  return Math.round(w * (1 + cappedReps / 30));
};

/**
 * Calculates estimated One Rep Max using Brzycki formula with asymptotic protection.
 * Formula: weight * (36 / (37 - min(36, reps)))
 * Returns exact weight for reps === 1, and 0 for invalid inputs.
 */
export const calculateOneRepMaxBrzycki = (weight: number | string, reps: number | string): number => {
  const w = typeof weight === "number" ? weight : Number(weight);
  const r = typeof reps === "number" ? reps : Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return 0;
  if (r === 1) return Math.round(w);
  const cappedReps = Math.min(36, r);
  const denominator = 37 - cappedReps;
  if (denominator <= 0) return Math.round(w * 36);
  return Math.round(w * (36 / denominator));
};

/**
 * Calculates estimated One Rep Max using selected formula (default: Epley).
 */
export const LBS_TO_KG = 0.45359237;
export const KG_TO_LBS = 2.20462262;

export function convertWeight(
  val: number | string | "" | undefined | null,
  fromUnit: string,
  toUnit: string,
): number | "" {
  if (val === "" || val === undefined || val === null) return "";
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return num;
  const from = fromUnit.trim().toUpperCase();
  const to = toUnit.trim().toUpperCase();
  if (from === to) return num;
  if (from === "KG" && to === "LBS") {
    return num * KG_TO_LBS;
  }
  if (from === "LBS" && to === "KG") {
    return num * LBS_TO_KG;
  }
  return num;
}

export function roundToGymWeight(
  val: number | string | "" | undefined | null,
  decimals = 2,
): number | "" {
  if (val === "" || val === undefined || val === null) return "";
  const num = Number(val);
  if (!Number.isFinite(num)) return "";
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export const calculateOneRepMax = (
  weight: number | string,
  reps: number | string,
  formula: OneRepMaxFormula = "epley",
): number => {
  return formula === "brzycki"
    ? calculateOneRepMaxBrzycki(weight, reps)
    : calculateOneRepMaxEpley(weight, reps);
};

export function buildPersonalRecords(workoutLogs: WorkoutLogLike[], formula: OneRepMaxFormula = "epley") {
  const records = new Map<string, PersonalRecord>();

  for (const log of workoutLogs || []) {
    for (const exercise of log.exercises || []) {
      const title = String(exercise?.title || "").trim();
      if (!title) continue;
      const key = normalizeTitle(title);
      for (const set of exercise.sets || []) {
        if (!set?.completed || set.weight === "" || set.reps === "") continue;
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) continue;
        const volume = weight * reps;
        const estimatedOneRepMax = calculateOneRepMax(weight, reps, formula);
        const current = records.get(key);
        const candidate: PersonalRecord = {
          title,
          bestWeight: weight,
          bestReps: reps,
          bestVolume: volume,
          estimatedOneRepMax,
          date: formatLogDate(log.date),
        };

        if (!current) {
          records.set(key, candidate);
          continue;
        }

        let bestWeight = current.bestWeight;
        let bestReps = current.bestReps;
        if (weight > current.bestWeight) {
          bestWeight = weight;
          bestReps = reps;
        } else if (weight === current.bestWeight) {
          bestReps = Math.max(current.bestReps, reps);
        }

        records.set(key, {
          title: current.title,
          bestWeight,
          bestReps,
          bestVolume: Math.max(current.bestVolume, volume),
          estimatedOneRepMax: Math.max(current.estimatedOneRepMax, estimatedOneRepMax),
          date: estimatedOneRepMax >= current.estimatedOneRepMax ? formatLogDate(log.date) : current.date,
        });
      }
    }
  }

  return [...records.values()].sort(
    (a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax || b.bestWeight - a.bestWeight,
  );
}

export function buildPersonalRecordSlots(
  records: PersonalRecord[],
  selectedExerciseIds: string[],
  exercises: { id: string; title: string }[],
  limit = 3,
) {
  const chosen = new Set<string>();
  const slots = Array.from({ length: limit }).map((_, index) => {
    const selectedId = selectedExerciseIds[index];
    let exercise = exercises.find((ex) => ex.id === selectedId);
    if (!exercise || chosen.has(exercise.id)) {
      // First try to find an exercise from records that has not been chosen yet
      const recordMatch = records.find((rec) => {
        const exObj = exercises.find((e) => normalizeTitle(e.title) === normalizeTitle(rec.title));
        return exObj && !chosen.has(exObj.id);
      });
      if (recordMatch) {
        exercise = exercises.find((e) => normalizeTitle(e.title) === normalizeTitle(recordMatch.title));
      } else {
        // Fallback to any exercise in catalog
        exercise = exercises.find((ex) => !chosen.has(ex.id));
      }
    }
    if (exercise) chosen.add(exercise.id);
    const record = exercise
      ? records.find((item) => normalizeTitle(item.title) === normalizeTitle(exercise.title))
      : undefined;
    return { exercise, record };
  });

  return slots;
}

export function isTimedExercise(exercise: { title?: string; type?: string; category?: string }) {
  const title = (exercise?.title || "").toLowerCase();
  const type = (exercise?.type || "").toLowerCase();
  const category = (exercise?.category || "").toLowerCase();
  const isLunge = title.includes("lunge") || title.includes("affondo");
  return (
    type === "duration" ||
    type === "time" ||
    type === "timed" ||
    category === "cardio" ||
    title.includes("plank") ||
    title.includes("hold") ||
    title.includes("isometric") ||
    title.includes("l-sit") ||
    title.includes("stretching") ||
    title.includes("corsa") ||
    title.includes("running") ||
    title.includes("ellittica") ||
    title.includes("cyclette") ||
    ((title.includes("camminata") || title.includes("walking")) && !isLunge)
  );
}

/**
 * Converts workout log duration (stored in seconds) to minutes.
 */
export function getWorkoutLogDurationMinutes(duration: number | undefined | null): number {
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) return 0;
  if (duration >= 60) {
    return Math.max(1, Math.round(duration / 60));
  }
  return 1;
}

export type WorkoutComparisonMetrics = {
  previousLogFound: boolean;
  volumeDiff: number;
  volumeDiffFormatted: string;
  setsDiff: number;
  setsDiffFormatted: string;
  prsEarned: number;
};

export function getWorkoutComparisonMetrics(
  currentLog: WorkoutLogLike,
  workoutLogs: WorkoutLogLike[],
  unit: string,
): WorkoutComparisonMetrics {
  if (!currentLog) {
    return {
      previousLogFound: false,
      volumeDiff: 0,
      volumeDiffFormatted: `+0 ${unit}`,
      setsDiff: 0,
      setsDiffFormatted: "+0",
      prsEarned: 0,
    };
  }

  let currentVolume = 0;
  let currentCompletedSets = 0;
  const currentExercisesMax: Record<string, { weight: number; reps: number; e1rm: number }> = {};

  (currentLog.exercises || []).forEach((ex: any) => {
    const titleKey = (ex.title || "").trim().toLowerCase();
    (ex.sets || []).forEach((s: any) => {
      if (s.completed && s.weight !== "" && s.reps !== "" && s.weight !== undefined && s.reps !== undefined) {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) return;
        currentVolume += w * r;
        currentCompletedSets++;
        const e1rm = calculateOneRepMax(w, r);
        const current = currentExercisesMax[titleKey];
        if (titleKey && (!current || w > current.weight || (w === current.weight && r > current.reps) || e1rm > current.e1rm)) {
          currentExercisesMax[titleKey] = { weight: w, reps: r, e1rm };
        }
      }
    });
  });

  const currentTime = currentLog.date ? toDate(currentLog.date).getTime() : Date.now();
  const priorLogs = (workoutLogs || [])
    .filter((log) => {
      if (log.id && currentLog.id && log.id === currentLog.id) return false;
      const logTime = log.date ? toDate(log.date).getTime() : 0;
      return logTime < currentTime;
    })
    .sort((a, b) => getLogTime(b) - getLogTime(a));

  const currentRoutineId = (currentLog as any).routineId;
  const currentRoutineName = ((currentLog as any).routineName || currentLog.name || "").trim().toLowerCase();

  let prevLog = priorLogs.find((log) => {
    if (currentRoutineId && (log as any).routineId === currentRoutineId) return true;
    const logName = ((log as any).routineName || log.name || "").trim().toLowerCase();
    return Boolean(currentRoutineName && logName === currentRoutineName);
  });

  if (!prevLog && priorLogs.length > 0) {
    prevLog = priorLogs[0];
  }

  if (!prevLog) {
    return {
      previousLogFound: false,
      volumeDiff: currentVolume,
      volumeDiffFormatted: `+${Math.round(currentVolume)} ${unit}`,
      setsDiff: currentCompletedSets,
      setsDiffFormatted: `+${currentCompletedSets}`,
      prsEarned: 0,
    };
  }

  let prevVolume = 0;
  let prevCompletedSets = 0;
  const priorExercisesMax: Record<string, { weight: number; reps: number; e1rm: number }> = {};

  (prevLog.exercises || []).forEach((ex: any) => {
    (ex.sets || []).forEach((s: any) => {
      if (s.completed && s.weight !== "" && s.reps !== "" && s.weight !== undefined && s.reps !== undefined) {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) return;
        prevVolume += w * r;
        prevCompletedSets++;
      }
    });
  });

  priorLogs.forEach((log) => {
    (log.exercises || []).forEach((ex: any) => {
      const titleKey = (ex.title || "").trim().toLowerCase();
      (ex.sets || []).forEach((s: any) => {
        if (s.completed && s.weight !== "" && s.reps !== "" && s.weight !== undefined && s.reps !== undefined) {
          const w = Number(s.weight) || 0;
          const r = Number(s.reps) || 0;
          if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) return;
          const e1rm = calculateOneRepMax(w, r);
          const current = priorExercisesMax[titleKey];
          if (titleKey && (!current || w > current.weight || (w === current.weight && r > current.reps) || e1rm > current.e1rm)) {
            priorExercisesMax[titleKey] = { weight: w, reps: r, e1rm };
          }
        }
      });
    });
  });

  let prsEarned = 0;
  Object.entries(currentExercisesMax).forEach(([titleKey, currentMax]) => {
    const prevMax = priorExercisesMax[titleKey];
    if (!prevMax) {
      prsEarned++;
      return;
    }
    if (
      currentMax.weight > prevMax.weight ||
      currentMax.e1rm > prevMax.e1rm ||
      (currentMax.weight === prevMax.weight && currentMax.reps > prevMax.reps)
    ) {
      prsEarned++;
    }
  });

  const volDiff = Math.round(currentVolume - prevVolume);
  const volDiffFormatted = volDiff >= 0 ? `+${volDiff} ${unit}` : `${volDiff} ${unit}`;

  const setsDiff = currentCompletedSets - prevCompletedSets;
  const setsDiffFormatted = setsDiff >= 0 ? `+${setsDiff}` : `${setsDiff}`;

  return {
    previousLogFound: true,
    volumeDiff: volDiff,
    volumeDiffFormatted: volDiffFormatted,
    setsDiff,
    setsDiffFormatted,
    prsEarned,
  };
}

export type PlateResult = {
  plates: { plate: number; count: number }[];
  remainderPerSide: number;
  targetWeight: number;
  barWeight: number;
};

export function calculatePlatesPerSide(
  targetWeight: number,
  barWeight = 20,
  unit = "KG"
): PlateResult {
  const availablePlates = unit.toUpperCase() === "LBS"
    ? [45, 35, 25, 10, 5, 2.5]
    : [25, 20, 15, 10, 5, 2.5, 1.25];

  if (targetWeight <= barWeight) {
    return { plates: [], remainderPerSide: 0, targetWeight, barWeight };
  }

  let perSide = (targetWeight - barWeight) / 2;
  const plates: { plate: number; count: number }[] = [];

  for (const p of availablePlates) {
    if (perSide >= p) {
      const count = Math.floor(perSide / p);
      perSide -= count * p;
      plates.push({ plate: p, count });
    }
  }

  return {
    plates,
    remainderPerSide: Math.round(perSide * 100) / 100,
    targetWeight,
    barWeight,
  };
}

export type GeneratedWarmupSet = {
  weight: number;
  reps: number;
  percent: number;
};

export function generateWarmupSets(
  workingWeight: number,
  barWeight = 20
): GeneratedWarmupSet[] {
  if (workingWeight <= 0) return [];
  const roundToStep = (val: number) => Math.max(barWeight, Math.round(val / 2.5) * 2.5);

  return [
    { weight: Math.max(barWeight, roundToStep(workingWeight * 0.2)), reps: 10, percent: 20 },
    { weight: roundToStep(workingWeight * 0.5), reps: 5, percent: 50 },
    { weight: roundToStep(workingWeight * 0.7), reps: 3, percent: 70 },
    { weight: roundToStep(workingWeight * 0.85), reps: 1, percent: 85 },
  ];
}


