import { isTimedExercise } from "./workoutUtils";

export type ImportedSet = {
  weight?: number | string;
  reps?: number | string;
  seconds?: number | string;
  time?: number | string;
  technique?: string;
  dropSet?: boolean;
  cluster?: boolean;
  rpe?: number | string;
};

export type ImportedExercise = {
  title?: string;
  category?: string;
  type?: string;
  image?: string;
  notes?: string;
  restTimer?: number | string;
  superset?: string;
  supersetGroup?: string;
  group?: string;
  sets?: ImportedSet[];
};

export type ImportedRoutinePayload = {
  schema?: string;
  routine?: {
    name?: string;
    duration?: number | string;
    tags?: string[];
    scheduledDay?: number | string;
    exercises?: ImportedExercise[];
  };
  name?: string;
  duration?: number | string;
  tags?: string[];
  scheduledDay?: number | string;
  exercises?: ImportedExercise[];
};

export type CatalogExercise = {
  title: string;
  category?: string;
  type?: string;
  image?: string;
};

type SetData = {
  id: string;
  weight: number | "";
  reps: number | "";
  completed: boolean;
  technique?: string;
  rpe?: number | "";
};

type ExerciseData = {
  id: string;
  title: string;
  category: string;
  type: string;
  sets: SetData[];
  notes: string;
  image?: string;
  technique?: string;
  supersetId?: string;
  restTimer?: number;
};

export type ImportedRoutine = {
  id: string;
  name: string;
  duration: number;
  tags: string[];
  scheduledDay?: number;
  exercises: ExerciseData[];
};

const dayMap: Record<string, number> = {
  // English
  monday: 0,
  mon: 0,
  mo: 0,
  tuesday: 1,
  tue: 1,
  tu: 1,
  wednesday: 2,
  wed: 2,
  we: 2,
  thursday: 3,
  thu: 3,
  th: 3,
  friday: 4,
  fri: 4,
  fr: 4,
  saturday: 5,
  sat: 5,
  sa: 5,
  sunday: 6,
  sun: 6,
  su: 6,
  // Italian
  lunedi: 0,
  lun: 0,
  martedi: 1,
  mar: 1,
  mercoledi: 2,
  mer: 2,
  giovedi: 3,
  gio: 3,
  venerdi: 4,
  ven: 4,
  sabato: 5,
  sab: 5,
  domenica: 6,
  dom: 6,
  // Spanish
  lunes: 0,
  martes: 1,
  miercoles: 2,
  mie: 2,
  jueves: 3,
  jue: 3,
  viernes: 4,
  vie: 4,
  domingo: 6,
};

export const normalizeRoutineImportText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toNumberOrEmpty = (value: unknown): number | "" => {
  if (value === undefined || value === null || value === "") return "";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : "";
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return fallback;
  return Math.round(numberValue);
};

const normalizeSetTechnique = (set: ImportedSet, setIndex?: number): string | undefined => {
  const technique = normalizeRoutineImportText(set.technique);
  if (set.cluster || technique.includes("cluster")) {
    return "cluster";
  }
  if (set.dropSet || technique.includes("drop")) {
    // If it is the first set of an exercise, it cannot be a child drop set of nothing
    if (setIndex === 0) return undefined;
    return "dropset";
  }
  return undefined;
};

const normalizeGroup = (exercise: ImportedExercise) => {
  const group = exercise.superset ?? exercise.supersetGroup ?? exercise.group;
  const normalized = String(group ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeDay = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6) return value;
  const asNumber = Number(value);
  if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber <= 6) return asNumber;
  return dayMap[normalizeRoutineImportText(value)];
};

const defaultIdFactory = () => crypto.randomUUID();

export function findRoutineCatalogMatch(title: string, catalog: CatalogExercise[]) {
  const target = normalizeRoutineImportText(title);
  if (!target) return undefined;

  const exact = catalog.find((exercise) => normalizeRoutineImportText(exercise.title) === target);
  if (exact) return exact;

  const contains = catalog.find((exercise) => {
    const candidate = normalizeRoutineImportText(exercise.title);
    return candidate.length >= 4 && (candidate.includes(target) || target.includes(candidate));
  });
  if (contains) return contains;

  const targetTokens = new Set(target.split(" ").filter((token) => token.length > 2));
  let best: { exercise: CatalogExercise; score: number } | undefined;
  for (const exercise of catalog) {
    const candidateTokens = new Set(
      normalizeRoutineImportText(exercise.title)
        .split(" ")
        .filter((token) => token.length > 2),
    );
    if (targetTokens.size === 0 || candidateTokens.size === 0) continue;
    const overlap = [...targetTokens].filter((token) => candidateTokens.has(token)).length;
    const score = overlap / Math.max(targetTokens.size, candidateTokens.size);
    if (!best || score > best.score) best = { exercise, score };
  }
  return best && best.score >= 0.66 ? best.exercise : undefined;
}

function parseSingleRoutine(
  payload: ImportedRoutinePayload,
  catalog: CatalogExercise[],
  idFactory: () => string,
): ImportedRoutine {
  const routine = payload.routine ?? payload;
  const exercisesInput = routine.exercises;
  if (!Array.isArray(exercisesInput) || exercisesInput.length === 0) {
    throw new Error("Import failed. JSON needs routine.exercises with at least one exercise.");
  }

  const groupCounts = new Map<string, number>();
  for (const exercise of exercisesInput) {
    const group = normalizeGroup(exercise);
    if (group) groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
  }

  const supersetIds = new Map<string, string>();
  for (const [group, count] of groupCounts.entries()) {
    if (count > 1) supersetIds.set(group, idFactory());
  }

  const exercises = exercisesInput.map((exercise, index) => {
    const title = String(exercise.title ?? "").trim();
    if (!title) throw new Error(`Import failed. Exercise ${index + 1} has no title.`);

    const matched = findRoutineCatalogMatch(title, catalog);
    const group = normalizeGroup(exercise);
    const supersetId = group ? supersetIds.get(group) : undefined;
    const setsInput = Array.isArray(exercise.sets) && exercise.sets.length > 0 ? exercise.sets : [{}];
    const restTimer = toPositiveInt(exercise.restTimer, 90);

    const resolvedCategory = exercise.category?.trim() || matched?.category || "Strength";
    const isTimed = isTimedExercise({ title: matched?.title ?? title, type: exercise.type, category: resolvedCategory });
    const resolvedType = exercise.type?.trim() || (isTimed ? "Duration" : (matched?.type || "Strength"));

    return {
      id: idFactory(),
      title: matched?.title ?? title,
      category: resolvedCategory,
      type: resolvedType,
      image: exercise.image || matched?.image,
      notes: exercise.notes?.trim() ?? "",
      restTimer,
      technique: supersetId ? "superset" : undefined,
      supersetId,
      sets: setsInput.map((set, setIdx) => {
        const repsVal = set.reps !== undefined && set.reps !== null && set.reps !== ""
          ? set.reps
          : (set.seconds !== undefined && set.seconds !== null && set.seconds !== ""
              ? set.seconds
              : set.time);
        return {
          id: idFactory(),
          weight: toNumberOrEmpty(set.weight),
          reps: toNumberOrEmpty(repsVal),
          completed: false,
          technique: normalizeSetTechnique(set, setIdx),
          rpe: toNumberOrEmpty(set.rpe),
        };
      }),
    };
  });

  const tags = Array.isArray(routine.tags)
    ? routine.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6)
    : ["imported"];

  const rawDuration = toPositiveInt(routine.duration, Math.max(30, exercises.length * 8));
  const normalizedDuration = rawDuration > 300 ? Math.max(15, Math.round(rawDuration / 60)) : rawDuration;

  return {
    id: idFactory(),
    name: String(routine.name ?? "Imported Routine").trim() || "Imported Routine",
    duration: normalizedDuration,
    tags,
    scheduledDay: normalizeDay(routine.scheduledDay),
    exercises,
  };
}

function parseFreeTextRoutine(
  text: string,
  catalog: CatalogExercise[],
  idFactory: () => string,
): ImportedRoutine {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[=\-_*~#]{3,}$/.test(l));

  if (lines.length === 0) {
    throw new Error("Import failed. Text is empty.");
  }

  let routineName = "Imported Routine";
  let scheduledDay: number | undefined;
  const exercises: ExerciseData[] = [];
  let startIndex = 0;

  // Check if first line is a title / header (no set patterns like 3x10 or 3 x 8)
  const setNotationPattern = /(\d+)\s*[xX*×]\s*(\d+)/;
  const isFirstLineHeader = !setNotationPattern.test(lines[0]);

  if (isFirstLineHeader) {
    routineName = lines[0].replace(/^[#*\-•\s]+/, "").trim() || "Imported Routine";
    // Check if line mentions a day of the week
    const words = normalizeRoutineImportText(lines[0]).split(" ");
    for (const w of words) {
      if (dayMap[w] !== undefined) {
        scheduledDay = dayMap[w];
        break;
      }
    }
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    // Clean bullet points, numbering (e.g. "1. ", "1) ", "- ")
    const line = rawLine.replace(/^(?:\d+[\.\)\-:]|\-|\*|•)\s*/, "").trim();
    if (!line) continue;

    // Detect sets x reps pattern: e.g. "4x10", "4 x 10", "4X10", "4*10", "4x8-10", "3x6/8"
    const matchSetsReps = line.match(/(?:(\d+)\s*[xX*×]\s*(\d+)(?:\s*[-/]\s*(\d+))?)/);
    // Detect timed pattern: e.g. "3x60s", "3 x 45 sec", "60s"
    const matchTimed = line.match(/(?:(\d+)\s*[xX*×]\s*)?(\d+)\s*(?:s|sec|secs|secondi|seconds)\b/i);

    let setsCount = 3;
    let repsCount: number | "" = "";
    let weightVal: number | "" = "";
    let exerciseTitle = "";
    let technique: string | undefined;
    let repRangeNote = "";

    // Check 3-way pattern: e.g. "Panca 3x10x80kg", "3x10x80 Panca", "3 x 10 @ 80kg Panca", "3x8-10x80kg"
    const matchThreeWay = line.match(/(?:(\d+)\s*[xX*×]\s*(\d+)(?:\s*[-/]\s*(\d+))?\s*(?:[xX*×@]|at)\s*(\d+(?:[.,]\d+)?)\s*(?:kg|lbs|kilos|kg\.)?)/i);
    // Check leading weight pattern: e.g. "80kg 3x10 Panca", "80 kg 4x8 Squat", "80kg 4x8-10 Squat"
    const matchLeadingWeight = line.match(/^(\d+(?:[.,]\d+)?)\s*(?:kg|lbs|kilos|kg\.)\s+(?:(\d+)\s*[xX*×]\s*(\d+)(?:\s*[-/]\s*(\d+))?)\s*(.*)$/i);

    if (matchTimed) {
      setsCount = matchTimed[1] ? Number(matchTimed[1]) : 3;
      repsCount = Number(matchTimed[2]);
      exerciseTitle = line.replace(matchTimed[0], "").trim();
    } else if (matchThreeWay) {
      setsCount = Number(matchThreeWay[1]);
      repsCount = Number(matchThreeWay[2]);
      if (matchThreeWay[3]) {
        repRangeNote = `Target: ${matchThreeWay[2]}-${matchThreeWay[3]} reps`;
      }
      weightVal = parseFloat(matchThreeWay[4].replace(",", "."));
      exerciseTitle = line.replace(matchThreeWay[0], "").trim();
    } else if (matchLeadingWeight) {
      weightVal = parseFloat(matchLeadingWeight[1].replace(",", "."));
      setsCount = Number(matchLeadingWeight[2]);
      repsCount = Number(matchLeadingWeight[3]);
      if (matchLeadingWeight[4]) {
        repRangeNote = `Target: ${matchLeadingWeight[3]}-${matchLeadingWeight[4]} reps`;
      }
      exerciseTitle = matchLeadingWeight[5].trim();
    } else if (matchSetsReps) {
      setsCount = Number(matchSetsReps[1]);
      repsCount = Number(matchSetsReps[2]);
      if (matchSetsReps[3]) {
        repRangeNote = `Target: ${matchSetsReps[2]}-${matchSetsReps[3]} reps`;
      }
      let prefix = line.slice(0, matchSetsReps.index).trim();
      const remainder = line.slice((matchSetsReps.index ?? 0) + matchSetsReps[0].length).trim();

      // Check weight in remainder (e.g. "@ 80kg", "80kg", "80 kg", "80.5", "80")
      const weightMatch = remainder.match(/@?\s*(\d+(?:[.,]\d+)?)\s*(?:kg|lbs|kilos|kg\.)?\b/i);
      if (weightMatch) {
        const parsedWeight = parseFloat(weightMatch[1].replace(",", "."));
        if (Number.isFinite(parsedWeight) && parsedWeight > 0) {
          weightVal = parsedWeight;
        }
      }

      // If weight not in remainder, check if prefix had leading weight (e.g. "80kg Panca")
      if (weightVal === "") {
        const prefixWeightMatch = prefix.match(/^(\d+(?:[.,]\d+)?)\s*(?:kg|lbs|kilos|kg\.)\s*(.*)$/i);
        if (prefixWeightMatch) {
          const parsedWeight = parseFloat(prefixWeightMatch[1].replace(",", "."));
          if (Number.isFinite(parsedWeight) && parsedWeight > 0) {
            weightVal = parsedWeight;
            prefix = prefixWeightMatch[2].trim();
          }
        }
      }

      exerciseTitle = prefix || remainder.replace(/@?\s*(\d+(?:[.,]\d+)?)\s*(?:kg|lbs|kilos|kg\.)?\b/i, "").trim();
    } else {
      // Fallback: line might just be an exercise name
      exerciseTitle = line;
    }

    // Clean up title punctuation and technique tags
    exerciseTitle = exerciseTitle
      .replace(/\s*\((?:drop\s*set|dropset|cluster|superserie?|superset)\)/gi, "")
      .replace(/\b(?:drop\s*set|dropset|cluster)\b/gi, "")
      .replace(/^[#*\-•\s@]+/, "")
      .replace(/[:\-–—]+$/, "")
      .trim();
    if (!exerciseTitle) continue;

    // Check for drop set / cluster in line
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes("drop") || lowerLine.includes("dropset") || lowerLine.includes("cluster")) {
      technique = "dropset";
    }

    const matched = findRoutineCatalogMatch(exerciseTitle, catalog);
    const resolvedTitle = matched?.title ?? exerciseTitle;
    const resolvedCategory = matched?.category || "Strength";
    const isTimed = isTimedExercise({ title: resolvedTitle, category: resolvedCategory });
    const resolvedType = isTimed ? "Duration" : (matched?.type || "Strength");

    const sets: SetData[] = Array.from({ length: Math.min(12, Math.max(1, setsCount)) }).map(() => ({
      id: idFactory(),
      weight: weightVal,
      reps: repsCount,
      completed: false,
      technique,
    }));

    exercises.push({
      id: idFactory(),
      title: resolvedTitle,
      category: resolvedCategory,
      type: resolvedType,
      image: matched?.image,
      notes: repRangeNote,
      restTimer: 90,
      sets,
    });
  }

  if (exercises.length === 0) {
    throw new Error("Import failed. Could not recognize any valid exercise in the text.");
  }

  return {
    id: idFactory(),
    name: routineName,
    duration: Math.max(30, exercises.length * 8),
    tags: ["imported", "text"],
    scheduledDay,
    exercises,
  };
}

export function parseLiftLabRoutineText(
  text: string,
  catalog: CatalogExercise[] = [],
  idFactory: () => string = defaultIdFactory,
): ImportedRoutine[] {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Import failed. Input text is empty.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // If not JSON, parse as free text (e.g. pasted from WhatsApp, notes, or coach messages)
    return [parseFreeTextRoutine(trimmed, catalog, idFactory)];
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => {
      try {
        return parseSingleRoutine(item as ImportedRoutinePayload, catalog, idFactory);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Import failed for routine at index ${index + 1}: ${message}`);
      }
    });
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.routines)) {
      if (obj.routines.length === 0) {
        throw new Error("Import failed. routines array is empty.");
      }
      return obj.routines.map((item, index) => {
        try {
          return parseSingleRoutine(item as ImportedRoutinePayload, catalog, idFactory);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Import failed for routine at index ${index + 1}: ${message}`);
        }
      });
    }
    return [parseSingleRoutine(parsed as ImportedRoutinePayload, catalog, idFactory)];
  }

  throw new Error("Import failed. Invalid JSON structure.");
}

