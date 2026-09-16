import assert from "node:assert/strict";
import { ACHIEVEMENTS } from "./achievements";

// 1. Verify achievement count is >= 35
assert.ok(ACHIEVEMENTS.length >= 35, `Expected >= 35 achievements, got ${ACHIEVEMENTS.length}`);

// 2. Verify all achievements have valid properties and safe progress functions
ACHIEVEMENTS.forEach((ach) => {
  assert.ok(ach.id, "Achievement must have an id");
  assert.ok(ach.title, `Achievement ${ach.id} must have a title`);
  assert.ok(ach.description, `Achievement ${ach.id} must have a description`);
  assert.ok(ach.icon, `Achievement ${ach.id} must have an icon`);
  assert.ok(ach.level, `Achievement ${ach.id} must have a level`);

  // Test progress function with null, undefined, empty array
  // @ts-ignore
  const pNull = ach.progress(null, "KG");
  // @ts-ignore
  const pUndef = ach.progress(undefined, "KG");
  const pEmpty = ach.progress([], "KG");

  assert.ok(typeof pNull === "number" && !isNaN(pNull), `Progress for ${ach.id} with null must be a valid number`);
  assert.ok(typeof pUndef === "number" && !isNaN(pUndef), `Progress for ${ach.id} with undefined must be a valid number`);
  assert.ok(typeof pEmpty === "number" && !isNaN(pEmpty), `Progress for ${ach.id} with [] must be a valid number`);

  assert.ok(pNull >= 0 && pNull <= 1, `Progress for ${ach.id} with null must be between 0 and 1`);
  assert.ok(pUndef >= 0 && pUndef <= 1, `Progress for ${ach.id} with undefined must be between 0 and 1`);
  assert.ok(pEmpty >= 0 && pEmpty <= 1, `Progress for ${ach.id} with [] must be between 0 and 1`);
});

// 3. Test specific requested achievements
const getAch = (id: string) => {
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  assert.ok(found, `Achievement with id '${id}' should exist`);
  return found;
};

// Check IDs from prompt
const requiredIds = [
  "5_workouts",
  "25_workouts",
  "75_workouts",
  "200_workouts",
  "volume_50k",
  "volume_250k",
  "volume_500k",
  "volume_2m5",
  "workout_volume_5k",
  "workout_volume_10k",
  "workout_50_sets",
  "dumbbell_lover",
  "cable_warrior",
  "multipower_beast",
  "streak_3",
  "weekend_warrior",
];

requiredIds.forEach((id) => getAch(id));

// Test workout milestone progress
assert.equal(getAch("5_workouts").progress([{}, {}, {}, {}, {}], "KG"), 1);
assert.equal(getAch("25_workouts").progress(Array(25).fill({}), "KG"), 1);
assert.equal(getAch("75_workouts").progress(Array(75).fill({}), "KG"), 1);
assert.equal(getAch("200_workouts").progress(Array(200).fill({}), "KG"), 1);

// Test volume progress
const volumeLog = [
  {
    exercises: [
      {
        sets: [
          { completed: true, weight: 100, reps: 500 }, // 50,000 volume
        ],
      },
    ],
  },
];
assert.equal(getAch("volume_50k").progress(volumeLog, "KG"), 1);

// Test equipment achievements
const dumbbellLog = [
  {
    exercises: [
      {
        title: "Dumbbell Press",
        sets: Array(50).fill({ completed: true }),
      },
    ],
  },
];
assert.equal(getAch("dumbbell_lover").progress(dumbbellLog, "KG"), 1);

const cableLog = [
  {
    exercises: [
      {
        title: "Cable Fly",
        sets: Array(50).fill({ completed: true }),
      },
    ],
  },
];
assert.equal(getAch("cable_warrior").progress(cableLog, "KG"), 1);

const multiLog = [
  {
    exercises: [
      {
        title: "Multipower Squat",
        sets: Array(20).fill({ completed: true }),
      },
    ],
  },
];
assert.equal(getAch("multipower_beast").progress(multiLog, "KG"), 1);

// Test plate achievements with lowercase 'kg' unit
const benchPlateLog = [
  {
    exercises: [
      {
        title: "Bench Press",
        sets: [{ completed: true, weight: 100, reps: 1 }],
      },
    ],
  },
];
assert.equal(getAch("bench_plates").progress(benchPlateLog, "kg"), 1);
assert.equal(getAch("bench_plates").progress(benchPlateLog, "KG"), 1);

// Test malformed set weights/reps (e.g. non-numeric, NaN) does not poison progress with NaN
const malformedVolumeLog = [
  {
    exercises: [
      {
        sets: [
          { completed: true, weight: "invalid", reps: 10 },
          { completed: true, weight: 100, reps: "xyz" },
          { completed: true, weight: NaN, reps: 5 },
          { completed: true, weight: 100, reps: 100 }, // 10,000 valid volume
        ],
      },
    ],
  },
];
const p10k = getAch("volume_10k").progress(malformedVolumeLog, "KG");
assert.equal(typeof p10k === "number" && !isNaN(p10k), true);
assert.equal(p10k, 1);

const makeSets = (count: number, completed = true) =>
  Array.from({ length: count }, (_, i) => ({ id: `s${i}`, weight: 50, reps: 5, completed }));

assert.equal(
  getAch("perfectionist").progress(
    [{ exercises: [{ sets: makeSets(10) }] }],
    "KG",
  ),
  1,
  "legacy logs without plannedSetCount still complete if all stored sets are done",
);
assert.equal(
  getAch("perfectionist").progress(
    [{ plannedSetCount: 12, exercises: [{ sets: makeSets(10) }] }],
    "KG",
  ),
  0,
  "completed-only logs must not unlock Perfectionist unless plannedSetCount matches",
);
assert.equal(
  getAch("perfectionist").progress(
    [{ plannedSetCount: 10, exercises: [{ sets: makeSets(10) }] }],
    "KG",
  ),
  1,
);

const day = (offset: number, hour = 10) =>
  new Date(Date.UTC(2026, 5, 1 + offset, hour)).toISOString();
assert.equal(
  getAch("streak_7").progress(
    [
      { date: day(0, 8) },
      { date: day(0, 20) },
      { date: day(1) },
      { date: day(2) },
      { date: day(3) },
      { date: day(4) },
      { date: day(5) },
    ],
    "KG",
  ),
  1,
  "seven workouts inside seven days, including same-day sessions, unlock Unstoppable",
);
assert.ok(
  getAch("streak_7").progress([{ date: day(0) }, { date: day(0, 18) }], "KG") > 0,
);

console.log("Achievements tests passed!");


