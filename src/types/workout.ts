export type SetData = {
  id: string;
  weight: number | string;
  reps: number | string;
  completed: boolean;
  technique?: string;
  rpe?: number | string;
};

export type ExerciseData = {
  id: string;
  title: string;
  category: string;
  type: string;
  sets: SetData[];
  notes: string;
  image?: string;
  technique?: string;
  supersetId?: string;
  equipment?: string;
  muscleFocus?: string[];
  cues?: string[];
  instructions?: string[];
  prWeight?: number;
  prReps?: number;
  prRepsWeight?: number;
  oneRepMax?: number;
  restTimer?: number;
};

/**
 * Base routine data structure.
 * Domain invariant on duration:
 * - Template routines (RoutineTemplate / RoutineData in routines list): duration is in MINUTES.
 * - Completed workout logs (WorkoutLog in workoutLogs list): duration is in SECONDS.
 */
export type RoutineData = {
  id: string;
  name: string;
  duration: number; // Minutes for templates, Seconds for completed logs
  tags: string[];
  exercises: ExerciseData[];
  scheduledDay?: number;
  favorite?: boolean;
  sourceLogId?: string;
};

/** Template routine definition where duration is expressed in MINUTES. */
export type RoutineTemplate = RoutineData;

/** Completed workout record where duration is expressed in SECONDS. */
export type WorkoutLog = RoutineData & {
  date?: string | Date;
  routineName?: string;
  routineId?: string;
  userId?: string;
  plannedSetCount?: number;
};

export type WeightLog = {
  id: string;
  date: string;
  weight: number;
};

export type UserData = {
  displayName?: string;
  unit?: "kg" | "lbs" | "KG" | "LBS";
  restTimer?: number;
  weeklyGoal?: number;
  dashboardStats?: string[];
  hasCompletedTutorial?: boolean;
  exerciseRestPresets?: Record<string, number>;
  oneRepMaxFormula?: "epley" | "brzycki";
  showRpe?: boolean;
  language?: string;
};

export const EQUIPMENT = [
  "Barbell",
  "Dumbbell",
  "Machine",
  "Multipower",
  "Cable",
  "Bodyweight",
  "Kettlebell",
  "Other",
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

