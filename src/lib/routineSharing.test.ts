import assert from "node:assert/strict";
import { buildRoutinesExportPayload } from "./routineSharing";
import { parseLiftLabRoutineText } from "./routineImport";
import type { RoutineData } from "../types/workout";

console.log("Running routineSharing unit tests...");

const mockRoutineA: RoutineData = {
  id: "routine-push-01",
  name: "Push Day Hypertrophy",
  duration: 75,
  tags: ["Hypertrophy", "Upper"],
  scheduledDay: 0,
  favorite: true,
  exercises: [
    {
      id: "ex-bench",
      title: "Barbell Bench Press",
      category: "Chest",
      type: "Strength",
      equipment: "barbell",
      notes: "Arco lombare compatto, fermo al petto di 1 secondo",
      restTimer: 120,
      sets: [
        { id: "s1", weight: 90, reps: 8, completed: false, technique: "normal", rpe: 8 },
        { id: "s2", weight: 90, reps: 8, completed: false, technique: "normal", rpe: 8.5 },
        { id: "s3", weight: 80, reps: 10, completed: false, technique: "dropset", rpe: 9.5 },
      ],
    },
    {
      id: "ex-lateral",
      title: "Dumbbell Lateral Raise",
      category: "Shoulders",
      type: "Strength",
      equipment: "dumbbell",
      notes: "Pollici leggermente verso il basso, controllo eccentrico",
      restTimer: 60,
      sets: [
        { id: "s4", weight: 14, reps: 12, completed: false, rpe: 9 },
        { id: "s5", weight: 12, reps: 15, completed: false, rpe: 10 },
      ],
    },
  ],
};

const mockRoutineB: RoutineData = {
  id: "routine-pull-02",
  name: "Pull Day Strength",
  duration: 65,
  tags: ["Back", "Biceps"],
  scheduledDay: 2,
  exercises: [
    {
      id: "ex-deadlift",
      title: "Barbell Deadlift",
      category: "Back",
      type: "Strength",
      equipment: "barbell",
      notes: "Piedi larghezza bacino, spingi via il pavimento con i talloni",
      restTimer: 180,
      sets: [
        { id: "s6", weight: 140, reps: 5, completed: false, rpe: 7.5 },
        { id: "s7", weight: 150, reps: 5, completed: false, rpe: 8.5 },
      ],
    },
  ],
};

// Test 1: Single routine export format & backwards compatibility
const singlePayload = buildRoutinesExportPayload([mockRoutineA]);
assert.equal(singlePayload.schema, "liftlab.routine.v1");
assert.equal(singlePayload.count, 1);
assert.ok(singlePayload.routine, "Single routine export must populate .routine for backward compatibility");
assert.equal(singlePayload.routines.length, 1);
assert.equal(singlePayload.routine.name, "Push Day Hypertrophy");
assert.equal(singlePayload.routine.exercises[0].notes, "Arco lombare compatto, fermo al petto di 1 secondo");
assert.equal(singlePayload.routine.exercises[0].sets[0].weight, 90);
assert.equal(singlePayload.routine.exercises[0].sets[0].reps, 8);
assert.equal(singlePayload.routine.exercises[0].sets[0].rpe, 8);
assert.equal(singlePayload.routine.exercises[0].sets[2].technique, "dropset");

// Test 2: Multi-routine export format
const multiPayload = buildRoutinesExportPayload([mockRoutineA, mockRoutineB]);
assert.equal(multiPayload.count, 2);
assert.equal(multiPayload.routines.length, 2);
assert.equal(multiPayload.routine, undefined, "Multi-routine export should omit singular .routine");
assert.equal(multiPayload.routines[1].name, "Pull Day Strength");
assert.equal(multiPayload.routines[1].exercises[0].notes, "Piedi larghezza bacino, spingi via il pavimento con i talloni");
assert.equal(multiPayload.routines[1].exercises[0].sets[0].weight, 140);

// Test 3: Round-trip import parsing via parseLiftLabRoutineText
const jsonString = JSON.stringify(multiPayload);
const importedRoutines = parseLiftLabRoutineText(jsonString);
assert.equal(importedRoutines.length, 2, "Both exported routines must be parsed back successfully");
assert.equal(importedRoutines[0].name, "Push Day Hypertrophy");
assert.equal(importedRoutines[0].exercises[0].notes, "Arco lombare compatto, fermo al petto di 1 secondo");
assert.equal(importedRoutines[0].exercises[0].sets[0].weight, 90);
assert.equal(importedRoutines[0].exercises[0].sets[0].reps, 8);
assert.equal(importedRoutines[0].exercises[0].sets[0].rpe, 8);
assert.equal(importedRoutines[1].name, "Pull Day Strength");
assert.equal(importedRoutines[1].exercises[0].notes, "Piedi larghezza bacino, spingi via il pavimento con i talloni");
assert.equal(importedRoutines[1].exercises[0].sets[0].weight, 140);
assert.equal(importedRoutines[1].exercises[0].sets[0].reps, 5);

console.log("✓ All routineSharing unit tests passed successfully!");
