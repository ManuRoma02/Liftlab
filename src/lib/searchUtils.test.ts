import assert from "node:assert/strict";
import { getExerciseSearchScore, fuzzyScore, normalizeSearchText } from "./searchUtils";
import type { ExerciseData } from "../types/workout";

const sampleExercises: ExerciseData[] = [
  {
    id: "e_bp",
    title: "Barbell Bench Press",
    category: "Chest",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Chest", "Triceps", "Shoulders"],
    targetMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    notes: "",
    sets: []
  },
  {
    id: "e_sq",
    title: "Barbell Full Squat",
    category: "Legs",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Quadriceps", "Glutes", "Hamstrings", "Calves"],
    targetMuscle: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings", "Calves"],
    notes: "",
    sets: []
  },
  {
    id: "e_dl",
    title: "Barbell Deadlift",
    category: "Legs",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Glutes", "Hamstrings", "Lower Back", "Back"],
    targetMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings", "Lower Back", "Back"],
    notes: "",
    sets: []
  },
  {
    id: "e_rdl",
    title: "Barbell Romanian Deadlift",
    category: "Legs",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Glutes", "Hamstrings"],
    targetMuscle: "Hamstrings",
    notes: "",
    sets: []
  },
  {
    id: "e_lat",
    title: "Dumbbell Lateral Raise",
    category: "Shoulders",
    type: "Isolation",
    equipment: "Dumbbell",
    muscleFocus: ["Shoulders"],
    targetMuscle: "Shoulders",
    notes: "",
    sets: []
  },
  {
    id: "e_pull",
    title: "Pull-up",
    category: "Back",
    type: "Compound",
    equipment: "Bodyweight",
    muscleFocus: ["Back", "Biceps"],
    targetMuscle: "Back",
    notes: "",
    sets: []
  },
  {
    id: "e_curl",
    title: "Barbell Curl",
    category: "Arms",
    type: "Isolation",
    equipment: "Barbell",
    muscleFocus: ["Biceps"],
    targetMuscle: "Biceps",
    notes: "",
    sets: []
  },
  {
    id: "e_plank",
    title: "Weighted Front Plank",
    category: "Core",
    type: "Isolation",
    equipment: "Bodyweight",
    muscleFocus: ["Core"],
    targetMuscle: "Core",
    notes: "",
    sets: []
  }
];

const mockT = (key: string) => {
  const map: Record<string, string> = {
    "Barbell Bench Press": "Panca Piana con Bilanciere",
    "Barbell Full Squat": "Squat con Bilanciere",
    "Barbell Deadlift": "Stacco da Terra con Bilanciere",
    "chest": "petto",
    "legs": "gambe",
    "back": "dorso",
    "shoulders": "spalle",
    "arms": "braccia",
    "core": "addome",
    "barbell": "bilanciere",
    "dumbbell": "manubri",
    "bodyweight": "corpo libero"
  };
  return map[key] || key;
};

// 1. English queries
assert.ok(getExerciseSearchScore("bench press", sampleExercises[0], mockT) > 0, "bench press should match Barbell Bench Press");
assert.ok(getExerciseSearchScore("squat", sampleExercises[1], mockT) > 0, "squat should match Barbell Full Squat");
assert.ok(getExerciseSearchScore("deadlift", sampleExercises[2], mockT) > 0, "deadlift should match Barbell Deadlift");
assert.ok(getExerciseSearchScore("rdl", sampleExercises[3], mockT) > 0, "rdl should match Romanian Deadlift");

// 2. Italian queries
assert.ok(getExerciseSearchScore("panca", sampleExercises[0], mockT) > 0, "panca should match Barbell Bench Press");
assert.ok(getExerciseSearchScore("panca piana", sampleExercises[0], mockT) > 0, "panca piana should match Barbell Bench Press");
assert.ok(getExerciseSearchScore("stacco", sampleExercises[2], mockT) > 0, "stacco should match Barbell Deadlift");
assert.ok(getExerciseSearchScore("stacco rumeno", sampleExercises[3], mockT) > 0, "stacco rumeno should match Barbell Romanian Deadlift");
assert.ok(getExerciseSearchScore("alzate laterali", sampleExercises[4], mockT) > 0, "alzate laterali should match Dumbbell Lateral Raise");
assert.ok(getExerciseSearchScore("trazioni", sampleExercises[5], mockT) > 0, "trazioni should match Pull-up");
assert.ok(getExerciseSearchScore("bicipiti", sampleExercises[6], mockT) > 0, "bicipiti should match Barbell Curl");
assert.ok(getExerciseSearchScore("addominali", sampleExercises[7], mockT) > 0, "addominali should match Weighted Front Plank");
assert.ok(getExerciseSearchScore("bilanciere", sampleExercises[0], mockT) > 0, "bilanciere should match Barbell Bench Press");
assert.ok(getExerciseSearchScore("manubri", sampleExercises[4], mockT) > 0, "manubri should match Dumbbell Lateral Raise");

// 3. Normalization and accents
assert.ok(getExerciseSearchScore("PÀNCA", sampleExercises[0], mockT) > 0, "accented PÀNCA should match Barbell Bench Press");
assert.ok(getExerciseSearchScore("  squat  ", sampleExercises[1], mockT) > 0, "trimmed query should match");

console.log("All searchUtils unit tests passed successfully!");
