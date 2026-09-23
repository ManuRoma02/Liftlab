import assert from "node:assert/strict";
import {
  buildPreviousSetsMap,
  buildPersonalRecords,
  buildPersonalRecordSlots,
  buildCompletedWorkoutLog,
  buildRoutineFromWorkoutLog,
  buildSavedExerciseNotes,
  buildTemplateFromLiveWorkout,
  canCompleteSet,
  dissolveSuperset,
  finalizeLiveNumericInput,
  formatWeightUnit,
  hasWorkoutLoggedOnDay,
  getExerciseRestPreset,
  getRestTimerLeft,
  getNextScheduledRoutine,
  getVolumeComparison,
  getWorkoutComparisonMetrics,
  calculatePlatesPerSide,
  generateWarmupSets,
  isTimedExercise,
  isBodyweightExercise,
  shouldRestoreLiveProgress,
  convertWeight,
  roundToGymWeight,
  KG_TO_LBS,
} from "./workoutUtils";

const now = 1_000_000;

assert.equal(
  getRestTimerLeft({ duration: 90, startedAt: now - 30_000 }, now),
  60,
  "rest timer should advance while app is backgrounded",
);

assert.equal(
  getRestTimerLeft({ duration: 90, startedAt: now - 95_000 }, now),
  null,
  "expired rest timer should not resume",
);

const previous = buildPreviousSetsMap(
  [
    {
      date: "2026-06-03T10:00:00.000Z",
      exercises: [
        {
          id: "bench-template",
          title: "Bench Press",
          sets: [
            { weight: 80, reps: 8, completed: true },
            { weight: 82.5, reps: 6, completed: true },
          ],
        },
      ],
    },
  ],
  [{ id: "today-bench", title: "Bench Press" }],
);

assert.deepEqual(previous["today-bench"], [
  { weight: 80, reps: 8 },
  { weight: 82.5, reps: 6 },
]);

const first = getVolumeComparison(15_000, 42);
const second = getVolumeComparison(15_000, 43);
assert.notEqual(first.item, second.item, "same volume should rotate comparisons by seed");
assert.equal(getVolumeComparison(0, 1), null);

const repeated = buildRoutineFromWorkoutLog({
  id: "log-1",
  routineName: "Push Day",
  duration: 3600, // 3600 seconds in log
  exercises: [
    {
      id: "bench-log",
      title: "Bench Press",
      notes: "Pause first rep",
      sets: [
        { id: "s1", weight: 80, reps: 8, completed: true },
        { id: "s2", weight: 75, reps: 10, completed: false },
      ],
    },
  ],
});

assert.equal(repeated.name, "Push Day");
assert.equal(repeated.duration, 60, "3600 seconds log duration must convert to 60 minutes in routine template");
assert.equal(repeated.exercises[0].sets[0].completed, false);
assert.equal(repeated.exercises[0].sets[0].weight, 80);
assert.notEqual(repeated.exercises[0].id, "bench-log");

const records = buildPersonalRecords([
  {
    date: "2026-06-01T10:00:00.000Z",
    exercises: [
      {
        title: "Bench Press",
        sets: [
          { weight: 80, reps: 8, completed: true },
          { weight: 100, reps: 1, completed: true },
        ],
      },
      {
        title: "Squat",
        sets: [{ weight: 120, reps: 5, completed: true }],
      },
    ],
  },
]);

assert.equal(records[0].title, "Squat");
assert.equal(records.find((record) => record.title === "Bench Press")?.bestWeight, 100);

const recordSlots = buildPersonalRecordSlots(
  records,
  ["bench", "", "missing"],
  [
    { id: "bench", title: "Bench Press" },
    { id: "squat", title: "Squat" },
    { id: "row", title: "Row" },
  ],
);

assert.equal(recordSlots.length, 3);
assert.equal(recordSlots[0].exercise?.title, "Bench Press");
assert.equal(recordSlots[0].record?.title, "Bench Press");
assert.equal(recordSlots[1].exercise?.title, "Squat");
assert.equal(recordSlots[2].exercise?.title, "Row");

const savedNotes = buildSavedExerciseNotes([
  {
    exercises: [
      { title: "Bench Press", notes: "Elbows tucked" },
      { title: "Squat", notes: "" },
    ],
  },
]);

assert.equal(savedNotes["bench press"], "Elbows tucked");
assert.equal(savedNotes["squat"], undefined);

assert.equal(getExerciseRestPreset({ title: "Bench Press", restTimer: 120 }, { "bench press": 75 }, 60), 120);
assert.equal(getExerciseRestPreset({ title: "Bench Press", restTimer: 0 }, { "bench press": 75 }, 60), 0);
assert.equal(getExerciseRestPreset({ title: "Bench Press" }, { "bench press": 75 }, 60), 75);
assert.equal(getExerciseRestPreset({ title: "Bench Press" }, { "bench press": 0 }, 60), 0);
assert.equal(getExerciseRestPreset({ title: "Row" }, { "bench press": 75 }, 60), 60);

const nextRoutine = getNextScheduledRoutine(
  [
    { id: "mon", name: "Monday", duration: 60, tags: [], scheduledDay: 0, exercises: [] },
    { id: "fri", name: "Friday", duration: 60, tags: [], scheduledDay: 4, exercises: [] },
  ],
  new Date("2026-06-11T12:00:00"),
);
assert.equal(nextRoutine?.id, "fri", "next workout uses closest upcoming scheduled day");
assert.equal(
  getNextScheduledRoutine(
    [
      { id: "thu", name: "Thursday", duration: 60, tags: [], scheduledDay: 3, exercises: [] },
      { id: "fri", name: "Friday", duration: 60, tags: [], scheduledDay: 4, exercises: [] },
    ],
    new Date("2026-06-11T12:00:00"),
  )?.id,
  "thu",
  "next workout keeps today's scheduled routine first",
);
assert.equal(
  getNextScheduledRoutine(
    [
      { id: "r1", name: "Routine 1", duration: 60, tags: [], exercises: [], favorite: false },
      { id: "r2", name: "Routine 2 (Fav)", duration: 60, tags: [], exercises: [], favorite: true },
    ],
    new Date("2026-06-11T12:00:00"),
  )?.id,
  "r2",
  "fallback to favorite routine if no routines are scheduled",
);
assert.equal(
  getNextScheduledRoutine(
    [
      { id: "r1", name: "Routine 1", duration: 60, tags: [], exercises: [], favorite: false },
      { id: "r2", name: "Routine 2", duration: 60, tags: [], exercises: [], favorite: false },
    ],
    new Date("2026-06-11T12:00:00"),
  )?.id,
  "r1",
  "fallback to routines[0] if no routines are scheduled or favorited",
);

const completedOnly = buildCompletedWorkoutLog({
  id: "r1",
  name: "Workout",
  duration: 120,
  tags: [],
  exercises: [
    {
      id: "e1",
      title: "Bench",
      category: "Strength",
      type: "Strength",
      notes: "",
      sets: [
        { id: "s1", weight: 100, reps: 5, completed: true },
        { id: "s2", weight: 100, reps: 5, completed: false },
      ],
    },
    {
      id: "e2",
      title: "Empty",
      category: "Strength",
      type: "Strength",
      notes: "",
      sets: [{ id: "s3", weight: 20, reps: 10, completed: false }],
    },
  ],
});

assert.equal(completedOnly.exercises.length, 1);
assert.equal(completedOnly.exercises[0].sets.length, 1);
assert.equal(completedOnly.exercises[0].sets[0].id, "s1");

const liveForTemplate = {
  id: "r1",
  name: "Workout",
  duration: 1800,
  tags: [],
  exercises: [
    {
      id: "e1",
      title: "Bench",
      category: "Strength",
      type: "Strength",
      notes: "",
      sets: [
        { id: "s1", weight: 100, reps: 5, completed: true },
        { id: "s2", weight: 100, reps: 5, completed: false },
      ],
    },
    {
      id: "e2",
      title: "Empty",
      category: "Strength",
      type: "Strength",
      notes: "",
      sets: [{ id: "s3", weight: 20, reps: 10, completed: false }],
    },
  ],
};
const templateFromLive = buildTemplateFromLiveWorkout(liveForTemplate);
assert.equal(templateFromLive.exercises.length, 2, "template must keep skipped exercises");
assert.equal(templateFromLive.exercises[0].sets.length, 2, "template must keep incomplete sets");
assert.equal(templateFromLive.exercises[0].sets.every((set) => set.completed === false), true);
assert.equal(templateFromLive.duration, 30);

assert.equal(canCompleteSet({ weight: "", reps: 8 }, { title: "Bench" }), false);
assert.equal(canCompleteSet({ weight: 80, reps: 8 }, { title: "Bench" }), true);
assert.equal(canCompleteSet({ weight: "", reps: 45 }, { title: "Plank" }), true);
assert.equal(canCompleteSet({ weight: 0, reps: 10 }, { title: "Push Up" }), true);
assert.equal(canCompleteSet({ weight: "", reps: 10 }, { title: "Push Up" }), true, "push up without weight should complete");
assert.equal(canCompleteSet({ weight: "", reps: 8 }, { title: "Pull Up" }), true, "pull up without weight should complete");
assert.equal(canCompleteSet({ weight: "", reps: 12 }, { title: "Custom Exercise", equipment: "Bodyweight" }), true, "equipment bodyweight without weight should complete");
assert.equal(canCompleteSet({ weight: "", reps: 15 }, { title: "Trazioni alla sbarra" }), true, "italian trazioni should complete");

assert.equal(isBodyweightExercise({ title: "Pull Up" }), true);
assert.equal(isBodyweightExercise({ title: "Dips", equipment: "Bodyweight" }), true);
assert.equal(isBodyweightExercise({ title: "Trazioni" }), true);
assert.equal(isBodyweightExercise({ title: "Panca Piana", equipment: "Barbell" }), false);

assert.equal(isTimedExercise({ title: "Barbell Walking Lunge", category: "Legs", type: "Compound" }), false);
assert.equal(isTimedExercise({ title: "Walking, Treadmill", category: "Cardio" }), true);
assert.equal(isTimedExercise({ title: "Plank" }), true);

const dissolved = dissolveSuperset(
  [
    { id: "a", technique: "superset", supersetId: "g1" },
    { id: "b", technique: "superset", supersetId: "g1" },
    { id: "c", technique: "", supersetId: undefined },
  ],
  "a",
);
assert.equal(dissolved[0].technique, "");
assert.equal(dissolved[1].technique, "");
assert.equal(dissolved[1].supersetId, undefined);
assert.equal(dissolved[2].id, "c");

assert.equal(shouldRestoreLiveProgress({ id: "empty" }, "empty"), true);
assert.equal(shouldRestoreLiveProgress({ id: "uuid-1234" }, "empty"), false);
assert.equal(shouldRestoreLiveProgress({ id: "r1" }, "r1"), true);
assert.equal(shouldRestoreLiveProgress({ id: "r1" }, "r2"), false);
assert.equal(shouldRestoreLiveProgress(null, "empty"), false);

assert.equal(finalizeLiveNumericInput("2."), 2);
assert.equal(finalizeLiveNumericInput("82.5"), 82.5);
assert.equal(finalizeLiveNumericInput(""), "");
assert.equal(formatWeightUnit("LBS"), "lbs");
assert.equal(formatWeightUnit("kg"), "kg");

assert.equal(
  hasWorkoutLoggedOnDay(
    [{ date: new Date(2026, 5, 5, 8, 0, 0), exercises: [{ title: "Squat" }] }],
    new Date(2026, 5, 5, 22, 0, 0),
  ),
  true,
);

assert.equal(
  hasWorkoutLoggedOnDay(
    [{ date: new Date(2026, 5, 4, 23, 59, 0), exercises: [{ title: "Squat" }] }],
    new Date(2026, 5, 5, 8, 0, 0),
  ),
  false,
);

const comparisonMetricsTest = getWorkoutComparisonMetrics(
  {
    id: "log-2",
    routineName: "Leg Day",
    date: "2026-06-05T10:00:00.000Z",
    exercises: [
      {
        title: "Squat",
        sets: [
          { weight: 100, reps: 5, completed: true },
          { weight: 110, reps: 5, completed: true },
        ],
      },
    ],
  },
  [
    {
      id: "log-1",
      routineName: "Leg Day",
      date: "2026-06-01T10:00:00.000Z",
      exercises: [
        {
          title: "Squat",
          sets: [{ weight: 90, reps: 5, completed: true }],
        },
      ],
    },
  ],
  "kg",
);

assert.equal(comparisonMetricsTest.previousLogFound, true);
assert.equal(comparisonMetricsTest.volumeDiff, 600);
assert.equal(comparisonMetricsTest.setsDiff, 1);
assert.equal(comparisonMetricsTest.prsEarned, 1); // 110 > 90

const firstSessionMetrics = getWorkoutComparisonMetrics(
  {
    id: "log-first",
    routineName: "Push",
    date: "2026-06-05T10:00:00.000Z",
    exercises: [{ title: "Bench", sets: [{ weight: 60, reps: 8, completed: true }] }],
  },
  [],
  "kg",
);
assert.equal(firstSessionMetrics.previousLogFound, false);
assert.equal(firstSessionMetrics.prsEarned, 0, "first session is a baseline, not automatic PRs");

const repPrMetrics = getWorkoutComparisonMetrics(
  {
    id: "log-reps",
    routineName: "Push",
    date: "2026-06-08T10:00:00.000Z",
    exercises: [{ title: "Bench", sets: [{ weight: 60, reps: 10, completed: true }] }],
  },
  [
    {
      id: "log-prev",
      routineName: "Push",
      date: "2026-06-01T10:00:00.000Z",
      exercises: [{ title: "Bench", sets: [{ weight: 60, reps: 8, completed: true }] }],
    },
  ],
  "kg",
);
assert.equal(repPrMetrics.prsEarned, 1, "same weight with more reps is a PR");

// calculatePlatesPerSide tests
const plateRes1 = calculatePlatesPerSide(20, 20, "KG");
assert.deepEqual(plateRes1, { plates: [], remainderPerSide: 0, targetWeight: 20, barWeight: 20 });

const plateRes2 = calculatePlatesPerSide(100, 20, "KG");
assert.deepEqual(plateRes2.plates, [
  { plate: 25, count: 1 },
  { plate: 15, count: 1 },
]);
assert.equal(plateRes2.remainderPerSide, 0);

const plateRes3 = calculatePlatesPerSide(101, 20, "KG");
assert.deepEqual(plateRes3.plates, [
  { plate: 25, count: 1 },
  { plate: 15, count: 1 },
]);
assert.equal(plateRes3.remainderPerSide, 0.5);

const plateRes4 = calculatePlatesPerSide(225, 45, "LBS");
assert.deepEqual(plateRes4.plates, [
  { plate: 45, count: 2 },
]);
assert.equal(plateRes4.remainderPerSide, 0);

// generateWarmupSets tests
assert.deepEqual(generateWarmupSets(0), []);
assert.deepEqual(generateWarmupSets(-10), []);

const warmups = generateWarmupSets(100, 20);
assert.equal(warmups.length, 4);
assert.deepEqual(warmups[0], { weight: 20, reps: 10, percent: 20 });
assert.deepEqual(warmups[1], { weight: 50, reps: 5, percent: 50 });
assert.deepEqual(warmups[2], { weight: 70, reps: 3, percent: 70 });
assert.deepEqual(warmups[3], { weight: 85, reps: 1, percent: 85 });

// 1RM Calculation & Reps Bounds tests
import {
  calculateOneRepMax,
  calculateOneRepMaxEpley,
  calculateOneRepMaxBrzycki,
  getWorkoutLogDurationMinutes,
} from "./workoutUtils";

// Epley tests
assert.equal(calculateOneRepMax(100, 0), 0);
assert.equal(calculateOneRepMax(100, 1), 100);
assert.equal(calculateOneRepMax(100, 10), 133);
assert.equal(calculateOneRepMax(100, 37), 200); // capped at 30 reps -> 100 * (1 + 30/30) = 200
assert.equal(calculateOneRepMax(100, 100), 200); // no division by zero or negative 1RM
assert.equal(calculateOneRepMax(-10, 5), 0);

// Brzycki tests
assert.equal(calculateOneRepMax(100, 0, "brzycki"), 0);
assert.equal(calculateOneRepMax(100, 1, "brzycki"), 100);
assert.equal(calculateOneRepMax(100, 5, "brzycki"), 113); // 100 * (36 / 32) = 112.5 -> 113
assert.equal(calculateOneRepMax(100, 10, "brzycki"), 133); // 100 * (36 / 27) = 133.3 -> 133
assert.equal(calculateOneRepMax(100, 36, "brzycki"), 3600); // 100 * (36 / 1) = 3600
assert.equal(calculateOneRepMax(100, 50, "brzycki"), 3600); // capped at 36 reps
assert.equal(calculateOneRepMax(-10, 5, "brzycki"), 0);

// Short log duration repeated workout test (e.g. 150 seconds log)
const shortRepeated = buildRoutineFromWorkoutLog({
  id: "short-log",
  routineName: "Short Session",
  duration: 150, // 150 seconds
  exercises: [],
});
assert.equal(shortRepeated.duration, 3, "150 seconds log duration converts to 3 minutes, not a 15-minute floor");

// Duration helper tests
assert.equal(getWorkoutLogDurationMinutes(0), 0);
assert.equal(getWorkoutLogDurationMinutes(45), 1);
assert.equal(getWorkoutLogDurationMinutes(1800), 30);
assert.equal(getWorkoutLogDurationMinutes(3600), 60);

// Clock drift test for rest timer
assert.equal(getRestTimerLeft({ duration: 90, startedAt: now + 5000 }, now), 90);

// convertWeight tests
assert.ok(
  Math.abs(Number(convertWeight(convertWeight(1.25, "KG", "LBS"), "LBS", "KG")) - 1.25) < 1e-6,
  "1.25 kg must round-trip through lbs without plate-weight drift",
);
assert.ok(Math.abs(Number(convertWeight(100, "KG", "LBS")) - 100 * KG_TO_LBS) < 1e-9);
assert.equal(convertWeight(100, "KG", "KG"), 100);
assert.equal(convertWeight("", "KG", "LBS"), "");
assert.equal(convertWeight(0, "KG", "LBS"), 0);

// roundToGymWeight tests
assert.equal(roundToGymWeight(9.071847400000001, 2), 9.07);
assert.equal(roundToGymWeight(11.33980925, 2), 11.34);
assert.equal(roundToGymWeight(272.15542200000004, 1), 272.2);
assert.equal(roundToGymWeight("", 2), "");
assert.equal(roundToGymWeight(null, 2), "");
assert.equal(roundToGymWeight(undefined, 2), "");
// Comma decimal parsing tests (Italian/European keyboards)
import { parseGymNumber } from "./workoutUtils";
assert.equal(parseGymNumber("62,5"), 62.5);
assert.equal(parseGymNumber("100,25"), 100.25);
assert.equal(parseGymNumber("80"), 80);
assert.equal(parseGymNumber(""), null);
assert.equal(parseGymNumber(null), null);
assert.equal(finalizeLiveNumericInput("62,5"), 62.5);
assert.equal(finalizeLiveNumericInput("62.5"), 62.5);
assert.equal(canCompleteSet({ weight: "62,5", reps: "8" }, { title: "Bench" }), true);
assert.equal(canCompleteSet({ weight: "80", reps: "8" }, { title: "Bench" }), true);

// Test PR metrics with European comma input
const testLog1 = {
  id: "l1",
  routineId: "r_chest",
  date: "2026-06-01T10:00:00Z",
  exercises: [{ title: "Bench", sets: [{ weight: "80,5", reps: "10", completed: true }] }],
};
const testLog2 = {
  id: "l2",
  routineId: "r_chest",
  date: "2026-06-08T10:00:00Z",
  exercises: [{ title: "Bench", sets: [{ weight: "85", reps: "10", completed: true }] }],
};
const comparison = getWorkoutComparisonMetrics(testLog2, [testLog1], "kg");
assert.equal(comparison.previousLogFound, true);
assert.equal(comparison.prsEarned, 1, "Higher weight with same reps must earn 1 PR");

console.log("workoutUtils tests passed");





