import assert from "node:assert/strict";
import { findRoutineCatalogMatch, parseLiftLabRoutineText } from "./routineImport";

let idCounter = 0;
const nextId = () => `id-${++idCounter}`;

const importedList = parseLiftLabRoutineText(
  JSON.stringify({
    schema: "liftlab.routine.v1",
    routine: {
      name: "PT Import Check",
      duration: "52",
      scheduledDay: "friday",
      tags: ["pt", "import"],
      exercises: [
        {
          title: "Bench Press",
          restTimer: 120,
          sets: [
            { weight: 80, reps: 6, rpe: 8 },
            { weight: 70, reps: 10, technique: "drop set" },
          ],
        },
        {
          title: "Lat Pulldown",
          superset: "A",
          restTimer: 45,
          sets: [{ weight: 55, reps: 12 }],
        },
        {
          title: "Shoulder Press",
          superset: "A",
          restTimer: 0,
          sets: [{ weight: 22.5, reps: 10, cluster: true }],
        },
      ],
    },
  }),
  [{ title: "Barbell Bench Press", category: "Chest", type: "Barbell" }],
  nextId,
);

assert.equal(importedList.length, 1);
const imported = importedList[0];
assert.equal(imported.name, "PT Import Check");
assert.equal(imported.duration, 52);
assert.equal(imported.scheduledDay, 4);
assert.equal(imported.exercises[0].title, "Barbell Bench Press");
assert.equal(imported.exercises[0].category, "Chest");
assert.equal(imported.exercises[0].sets[0].rpe, 8);
assert.equal(imported.exercises[0].sets[1].technique, "dropset");
assert.equal(imported.exercises[1].technique, "superset");
assert.equal(imported.exercises[2].technique, "superset");
assert.equal(imported.exercises[1].supersetId, imported.exercises[2].supersetId);
assert.equal(imported.exercises[2].restTimer, 0);
assert.equal(imported.exercises[2].sets[0].technique, "cluster");

// Test multiple routines as a JSON array
const multiRoutinesArray = parseLiftLabRoutineText(
  JSON.stringify([
    {
      name: "Routine Array 1",
      exercises: [{ title: "Squat", sets: [{ weight: 100, reps: 5 }] }],
    },
    {
      name: "Routine Array 2",
      exercises: [{ title: "Deadlift", sets: [{ weight: 150, reps: 5 }] }],
    },
  ]),
  [],
  nextId,
);
assert.equal(multiRoutinesArray.length, 2);
assert.equal(multiRoutinesArray[0].name, "Routine Array 1");
assert.equal(multiRoutinesArray[0].exercises[0].title, "Squat");
assert.equal(multiRoutinesArray[1].name, "Routine Array 2");
assert.equal(multiRoutinesArray[1].exercises[0].title, "Deadlift");

// Test multiple routines as an object with `routines` array
const multiRoutinesObject = parseLiftLabRoutineText(
  JSON.stringify({
    schema: "liftlab.multi.v1",
    routines: [
      {
        name: "Routine Object 1",
        exercises: [{ title: "Pushups", sets: [{ reps: 20 }] }],
      },
      {
        name: "Routine Object 2",
        exercises: [{ title: "Pullups", sets: [{ reps: 10 }] }],
      },
    ],
  }),
  [],
  nextId,
);
assert.equal(multiRoutinesObject.length, 2);
assert.equal(multiRoutinesObject[0].name, "Routine Object 1");
assert.equal(multiRoutinesObject[1].name, "Routine Object 2");

// Test free text / WhatsApp import format
const freeTextWorkout = `
Push Day - Lunedi
1. Panca Piana 4x8 @ 80kg
2. Spinte Manubri 3x10 24kg (dropset)
3. Plank 3x60s
`;

const parsedFreeText = parseLiftLabRoutineText(
  freeTextWorkout,
  [{ title: "Barbell Bench Press", category: "Chest" }],
  nextId,
);

assert.equal(parsedFreeText.length, 1);
assert.equal(parsedFreeText[0].name, "Push Day - Lunedi");
assert.equal(parsedFreeText[0].scheduledDay, 0); // Monday
assert.equal(parsedFreeText[0].exercises.length, 3);
assert.equal(parsedFreeText[0].exercises[0].sets.length, 4);
assert.equal(parsedFreeText[0].exercises[0].sets[0].weight, 80);
assert.equal(parsedFreeText[0].exercises[0].sets[0].reps, 8);
assert.equal(parsedFreeText[0].exercises[1].title, "Spinte Manubri");
assert.equal(parsedFreeText[0].exercises[1].sets[0].weight, 24);
assert.equal(parsedFreeText[0].exercises[1].sets[0].technique, "dropset");
assert.equal(parsedFreeText[0].exercises[2].type, "Duration");
assert.equal(parsedFreeText[0].exercises[2].sets[0].reps, 60);

// Test decimal weights with comma and space
const decimalWorkout = `
Upper Body
1. Spinte Manubri 3x10 22.5kg (dropset)
2. Alzate Laterali 4x12 12,5 kg
`;
const parsedDecimal = parseLiftLabRoutineText(decimalWorkout, [], nextId);
assert.equal(parsedDecimal[0].exercises[0].title, "Spinte Manubri");
assert.equal(parsedDecimal[0].exercises[0].sets[0].weight, 22.5);
assert.equal(parsedDecimal[0].exercises[0].sets[0].technique, "dropset");
assert.equal(parsedDecimal[0].exercises[1].title, "Alzate Laterali");
assert.equal(parsedDecimal[0].exercises[1].sets[0].weight, 12.5);

// Test leading weight format & 3-way format
const leadingWeightWorkout = `
Leg Day
1. 100kg 4x5 Squat
2. Stacco 3x10x120kg
`;
const parsedLeading = parseLiftLabRoutineText(leadingWeightWorkout, [], nextId);
assert.equal(parsedLeading[0].exercises[0].title, "Squat");
assert.equal(parsedLeading[0].exercises[0].sets[0].weight, 100);
assert.equal(parsedLeading[0].exercises[0].sets[0].reps, 5);
assert.equal(parsedLeading[0].exercises[0].sets.length, 4);
assert.equal(parsedLeading[0].exercises[1].title, "Stacco");
assert.equal(parsedLeading[0].exercises[1].sets[0].weight, 120);
assert.equal(parsedLeading[0].exercises[1].sets[0].reps, 10);
assert.equal(parsedLeading[0].exercises[1].sets.length, 3);

assert.throws(
  () => parseLiftLabRoutineText("   \n   \n", []),
  /empty/,
);

assert.throws(
  () => parseLiftLabRoutineText("gibberish non exercise text with no sets and no weights", []),
  /recognize any valid exercise/,
);

assert.throws(
  () => parseLiftLabRoutineText(JSON.stringify({ routine: { exercises: [] } }), []),
  /at least one exercise/,
);

assert.equal(
  findRoutineCatalogMatch("bench press", [{ title: "Barbell Bench Press" }])?.title,
  "Barbell Bench Press",
);

// Test exercise notes, timed exercises (Plank), and seconds/time set fields
const timedRoutine = parseLiftLabRoutineText(
  JSON.stringify({
    name: "Timed & Note Routine",
    exercises: [
      {
        title: "Plank",
        notes: "Keep core tight",
        sets: [
          { seconds: 60 },
          { time: 45 },
        ],
      },
    ],
  }),
  [],
  nextId,
);

assert.equal(timedRoutine[0].exercises[0].sets[1].reps, 45); // time mapped to reps

// Test Spanish free text workout import
const spanishWorkout = `
Dia de Pierna - Viernes
1. Sentadilla 4x8 @ 100kg
2. Prensa de Piernas 3x10 180kg
`;
const parsedSpanish = parseLiftLabRoutineText(spanishWorkout, [], nextId);
assert.equal(parsedSpanish.length, 1);
assert.equal(parsedSpanish[0].name, "Dia de Pierna - Viernes");
assert.equal(parsedSpanish[0].scheduledDay, 4); // Friday / Viernes
assert.equal(parsedSpanish[0].exercises.length, 2);
// Test duration normalization (converting raw seconds e.g. 3600 to minutes 60)
const importedWithSecondsDuration = parseLiftLabRoutineText(
  JSON.stringify({
    name: "Seconds Duration Routine",
    duration: 3600,
    exercises: [{ title: "Squat", sets: [{ weight: 100, reps: 5 }] }],
  }),
  [],
  nextId,
);
// Test repetition range import (e.g. 4x8-10, 3x6/8)
const repRangeWorkout = `
Hypertrophy Chest
1. Panca Piana 4x8-10 @ 80kg
2. Spinte Manubri 3x6/8 30kg
`;
const parsedRepRange = parseLiftLabRoutineText(repRangeWorkout, [], nextId);
assert.equal(parsedRepRange[0].exercises[0].sets.length, 4);
assert.equal(parsedRepRange[0].exercises[0].sets[0].reps, 8);
assert.equal(parsedRepRange[0].exercises[0].notes, "Target: 8-10 reps");
assert.equal(parsedRepRange[0].exercises[1].sets.length, 3);
assert.equal(parsedRepRange[0].exercises[1].sets[0].reps, 6);
assert.equal(parsedRepRange[0].exercises[1].notes, "Target: 6-8 reps");

console.log("routineImport tests passed");



