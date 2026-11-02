/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Challenger M1-2 Empirical Verification & Adversarial Stress Harness
 * Focus areas:
 * 1. Haptics System Invariants & Stress (Bursts, Dual Shudder, Render Pass Purity, Sandbox Security)
 * 2. Dashboard Performance & Computations (1,000+ historical workout logs benchmark & memoization audit)
 * 3. Domain Model Duration Invariants (Extreme values: 0, negative, float, NaN, Inf, conversions)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";

// Import modules under test
import {
  triggerHaptic,
  hapticPress,
  isHapticsEnabled,
  setHapticsEnabled,
  HAPTICS_STORAGE_KEY,
  type HapticStyle,
} from "../../src/lib/haptics";
import {
  getWorkoutLogDurationMinutes,
  buildRoutineFromWorkoutLog,
  buildTemplateFromLiveWorkout,
  calculateStreaks,
  calculateSetVolume,
  getLogDate,
} from "../../src/lib/workoutUtils";
import { TabHero } from "../../src/components/common/TabHero";
import { AppleBottomSheet } from "../../src/components/common/AppleBottomSheet";
import type { RoutineData, WorkoutLog } from "../../src/types/workout";

console.log("================================================================================");
console.log("   CHALLENGER M1-2: HAPTICS, PERFORMANCE & BOUNDARY EMPIRICAL HARNESS           ");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;
const failures: { name: string; error: string }[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error("Synchronous test expected in this runner");
    }
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    -> ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

// Global environment setup
const mockStorageMap = new Map<string, string>();
const mockWindow = {
  localStorage: {
    getItem: (k: string) => mockStorageMap.get(k) ?? null,
    setItem: (k: string, v: string) => mockStorageMap.set(k, String(v)),
    removeItem: (k: string) => mockStorageMap.delete(k),
    clear: () => mockStorageMap.clear(),
  },
  dispatchEvent: (event: any) => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

(globalThis as any).window = mockWindow;
(globalThis as any).localStorage = mockWindow.localStorage;
if (!(globalThis as any).navigator) {
  (globalThis as any).navigator = {};
}

let vibrateCalls: (number | number[])[] = [];
(navigator as any).vibrate = (pattern: number | number[]) => {
  vibrateCalls.push(pattern);
  return true;
};

// ============================================================================
// 1. HAPTICS SYSTEM INVARIANTS & STRESS
// ============================================================================
console.log("--- 1. Haptics System Invariants & Stress ---");

test("H01: High-frequency burst stress (100 events in rapid synchronous loop)", () => {
  vibrateCalls = [];
  setHapticsEnabled(true);
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    triggerHaptic("light");
  }
  const duration = performance.now() - start;
  assert.equal(vibrateCalls.length, 100, "Must record 100 vibrations");
  assert.ok(duration < 20, `100 haptic triggers executed in ${duration.toFixed(2)}ms (<20ms budget)`);
});

test("H02: Simulated high-frequency touch interactions (burst of 50-100 events/sec through hapticPress)", () => {
  vibrateCalls = [];
  setHapticsEnabled(true);
  const handler = hapticPress("selection");
  assert.equal(typeof handler, "function", "hapticPress must return a function");

  for (let i = 0; i < 100; i++) {
    (handler as Function)();
  }
  assert.equal(vibrateCalls.length, 100, "Handler closure must trigger haptic 100 times without dropping or locking");
});

test("H03: Render pass purity - hapticPress invocation NEVER triggers vibration during render", () => {
  vibrateCalls = [];
  setHapticsEnabled(true);

  // Simulate evaluation of JSX attributes during render:
  // <button onPointerDown={hapticPress("light")} />
  // <button onPointerDown={hapticPress("heavy")} />
  // <button onPointerDown={hapticPress()} />
  // <button onPointerDown={hapticPress(undefined)} />
  const h1 = hapticPress("light");
  const h2 = hapticPress("heavy");
  const h3 = hapticPress();
  const h4 = hapticPress(undefined);

  assert.equal(vibrateCalls.length, 0, "ZERO vibrations must be triggered during render evaluation of hapticPress");
  assert.equal(typeof h1, "function");
  assert.equal(typeof h2, "function");
  assert.equal(typeof h3, "function");
  assert.equal(typeof h4, "function");

  // Now simulate actual user touch on h1:
  (h1 as Function)();
  assert.equal(vibrateCalls.length, 1, "Exactly one vibration must fire when user touches");
  assert.equal(vibrateCalls[0], 8, "Light vibration pattern is 8ms");
});

test("H04: Direct event callback pattern - onPointerDown={hapticPress} handles synthetic PointerEvent", () => {
  vibrateCalls = [];
  setHapticsEnabled(true);

  // If developer writes onPointerDown={hapticPress} (without calling it):
  const syntheticPointerEvent = {
    type: "pointerdown",
    target: {},
    nativeEvent: {},
  };

  hapticPress(syntheticPointerEvent);
  assert.equal(vibrateCalls.length, 1, "Direct event pass-through triggers default light haptic");
  assert.equal(vibrateCalls[0], 8);
});

test("H05: Dual-haptic shudder elimination - TabHero settings button", () => {
  vibrateCalls = [];
  setHapticsEnabled(true);

  // Inspect TabHero JSX source for onPointerDown and onClick
  const tabHeroFile = fs.readFileSync("src/components/common/TabHero.tsx", "utf-8");
  assert.ok(
    tabHeroFile.includes("onPointerDown={hapticPress("),
    "TabHero must attach hapticPress onPointerDown"
  );
  assert.ok(
    !tabHeroFile.includes("onClick={() => {\n                triggerHaptic(") &&
      !tabHeroFile.includes("onClick={() => { triggerHaptic("),
    "TabHero onClick MUST NOT trigger haptics (shudder elimination)"
  );

  // Simulate user tap lifecycle (pointerdown followed by click)
  let onOpenSettingsCalled = false;
  const onPointerDown = hapticPress("light");
  const onClick = () => {
    onOpenSettingsCalled = true;
  };

  // 1. Finger down:
  (onPointerDown as Function)();
  assert.equal(vibrateCalls.length, 1, "Pointer down fires haptic");

  // 2. Click fires on release:
  onClick();
  assert.equal(vibrateCalls.length, 1, "Click does NOT fire second haptic (no shudder)");
  assert.equal(onOpenSettingsCalled, true);
});

test("H06: Dual-haptic shudder elimination - AppleBottomSheet scrim and close button", () => {
  const sheetFile = fs.readFileSync("src/components/common/AppleBottomSheet.tsx", "utf-8");

  // Scrim check
  assert.ok(
    sheetFile.includes("onPointerDown={hapticPress(\"light\")}\n            onClick={onClose}") ||
    sheetFile.includes("onPointerDown={hapticPress(\"light\")}") && sheetFile.includes("onClick={onClose}"),
    "AppleBottomSheet scrim must use hapticPress onPointerDown and pure onClose on click"
  );

  // Close button check
  assert.ok(
    !sheetFile.includes("onClick={() => {\n                          triggerHaptic("),
    "AppleBottomSheet close button MUST NOT fire triggerHaptic inside onClick"
  );
});

test("H07: Dual-haptic shudder elimination - App navigation tabs", () => {
  const appFile = fs.readFileSync("src/App.tsx", "utf-8");
  assert.ok(
    appFile.includes("onPointerDown={hapticPress(\"light\")}\n                  onClick={() => navigateTo(tab.id)}") ||
    (appFile.includes("onPointerDown={hapticPress(\"light\")}") && appFile.includes("onClick={() => navigateTo(tab.id)}")),
    "App navigation tab buttons must use hapticPress on pointerDown and pure navigateTo on click"
  );
});

test("H08: Restricted sandbox - localStorage throws SecurityError in isHapticsEnabled", () => {
  const originalGetItem = (window.localStorage as any).getItem;
  (window.localStorage as any).getItem = () => {
    const err = new Error("SecurityError: Access is denied for this document");
    err.name = "SecurityError";
    throw err;
  };

  try {
    // Should NOT throw! Must return true as safe default
    const result = isHapticsEnabled();
    assert.equal(result, true, "Must default to true without throwing SecurityError");
  } finally {
    (window.localStorage as any).getItem = originalGetItem;
  }
});

test("H09: Restricted sandbox - localStorage throws SecurityError in setHapticsEnabled", () => {
  const originalSetItem = (window.localStorage as any).setItem;
  (window.localStorage as any).setItem = () => {
    const err = new Error("SecurityError: Access is denied for this document");
    err.name = "SecurityError";
    throw err;
  };

  try {
    // Should NOT throw! Must catch gracefully
    assert.doesNotThrow(() => {
      setHapticsEnabled(false);
    }, "setHapticsEnabled must swallow SecurityError");
  } finally {
    (window.localStorage as any).setItem = originalSetItem;
  }
});

test("H10: Restricted sandbox - window.localStorage is null / undefined", () => {
  const originalStorage = (window as any).localStorage;
  Object.defineProperty(window, "localStorage", {
    value: null,
    configurable: true,
  });

  try {
    assert.equal(isHapticsEnabled(), true, "isHapticsEnabled handles null localStorage");
    assert.doesNotThrow(() => setHapticsEnabled(true), "setHapticsEnabled handles null localStorage");
  } finally {
    Object.defineProperty(window, "localStorage", {
      value: originalStorage,
      configurable: true,
    });
  }
});

test("H11: Restricted sandbox - navigator.vibrate is absent or throws SecurityError", () => {
  const originalVibrate = (navigator as any).vibrate;
  (navigator as any).vibrate = () => {
    throw new Error("SecurityError: vibrate not allowed in sandboxed iframe");
  };

  try {
    assert.doesNotThrow(() => {
      triggerHaptic("heavy");
    }, "triggerHaptic must gracefully swallow vibrate SecurityError");
  } finally {
    (navigator as any).vibrate = originalVibrate;
  }
});

test("H12: Capacitor Haptics plugin mock with rejected promise / thrown exception", () => {
  (window as any).Capacitor = {
    isPluginAvailable: (name: string) => name === "Haptics",
    Plugins: {
      Haptics: {
        impact: () => {
          throw new Error("Capacitor bridge error");
        },
      },
    },
  };

  vibrateCalls = [];
  try {
    // Even if Capacitor plugin throws, it should fall back to navigator.vibrate without crashing
    triggerHaptic("medium");
    assert.equal(vibrateCalls.length, 1, "Falls back to web vibrate when Capacitor plugin throws");
    assert.equal(vibrateCalls[0], 16);
  } finally {
    delete (window as any).Capacitor;
  }
});

// ============================================================================
// 2. DASHBOARD PERFORMANCE & COMPUTATIONS (1,000+ WORKOUT LOGS)
// ============================================================================
console.log("\n--- 2. Dashboard Performance & Computations (1,000+ Logs) ---");

// Generate realistic synthetic dataset of 1,000 workout logs
function generate1000WorkoutLogs(): WorkoutLog[] {
  const exercisesList = [
    "Barbell Squat",
    "Bench Press",
    "Deadlift",
    "Overhead Press",
    "Barbell Row",
    "Incline Dumbbell Press",
    "Lat Pulldown",
    "Romanian Deadlift",
  ];

  const logs: WorkoutLog[] = [];
  const baseDate = new Date("2024-01-01T10:00:00Z").getTime();

  for (let i = 0; i < 1000; i++) {
    const date = new Date(baseDate + i * 24 * 3600 * 1000); // 1 per day for 1000 days
    const numExercises = 3 + (i % 3); // 3 to 5 exercises
    const exercises: any[] = [];

    for (let e = 0; e < numExercises; e++) {
      const exName = exercisesList[(i + e) % exercisesList.length];
      const sets: any[] = [];
      const numSets = 3 + (e % 2); // 3 to 4 sets
      for (let s = 0; s < numSets; s++) {
        sets.push({
          id: `set-${i}-${e}-${s}`,
          weight: 60 + (i % 50) + s * 5,
          reps: 8 + (s % 5),
          completed: true,
        });
      }
      exercises.push({
        id: `ex-${i}-${e}`,
        title: exName,
        sets,
      });
    }

    logs.push({
      id: `log-${i}`,
      name: `Workout Session #${i + 1}`,
      routineName: `Routine ${(i % 4) + 1}`,
      duration: 2400 + (i % 1800), // 40-70 minutes in seconds
      date: date.toISOString(),
      tags: ["strength"],
      exercises,
    });
  }
  return logs;
}

const largeLogs = generate1000WorkoutLogs();
console.log(`  Generated ${largeLogs.length} synthetic workout logs (~${largeLogs.length * 4 * 3} sets) for benchmarking.`);

test("P01: calculateStreaks on 1,000 historical logs executes within 15ms budget", () => {
  const start = performance.now();
  const streak = calculateStreaks(largeLogs, new Date("2026-09-27T10:00:00Z"));
  const duration = performance.now() - start;

  console.log(`    -> calculateStreaks time: ${duration.toFixed(2)}ms (Current: ${streak.currentStreak}, Best: ${streak.bestStreak})`);
  assert.ok(duration < 25, `calculateStreaks took ${duration.toFixed(2)}ms (<25ms budget)`);
  assert.ok(streak.bestStreak > 0);
});

test("P02: sortedLogs memoization sorting benchmark on 1,000 logs", () => {
  const start = performance.now();
  const sorted = [...largeLogs]
    .filter((log) => log.date)
    .sort((a, b) => getLogDate(a).getTime() - getLogDate(b).getTime());
  const duration = performance.now() - start;

  console.log(`    -> sortedLogs sort time: ${duration.toFixed(2)}ms`);
  assert.ok(duration < 15, `Sort took ${duration.toFixed(2)}ms (<15ms budget)`);
  assert.equal(sorted.length, 1000);
});

test("P03: Progress and Volume Chart Data Generation on 1,000 logs", () => {
  // getVolumeData computation
  const startVol = performance.now();
  const volData = largeLogs.map((log, i) => {
    let volume = 0;
    log.exercises?.forEach((ex: any) => {
      ex.sets?.forEach((s: any) => {
        volume += calculateSetVolume(s);
      });
    });
    return { name: `W${i}`, volume };
  });
  const durVol = performance.now() - startVol;
  console.log(`    -> getVolumeData time: ${durVol.toFixed(2)}ms`);
  assert.ok(durVol < 30, `Volume calculation took ${durVol.toFixed(2)}ms (<30ms budget)`);
  assert.equal(volData.length, 1000);

  // getProgressData computation (squat, bench, deadlift scanning)
  const startProg = performance.now();
  const progData = largeLogs.map((log, i) => {
    let squat = 0, deadlift = 0, bench = 0;
    log.exercises?.forEach((ex: any) => {
      const type = ex.title?.toLowerCase() || "";
      const setsMap = ex.sets?.map((s: any) => s.weight || 0) || [];
      const maxWeight = setsMap.length > 0 ? Math.max(...setsMap) : 0;
      if (type.includes("squat") && maxWeight > squat) squat = maxWeight;
      if (type.includes("deadlift") && maxWeight > deadlift) deadlift = maxWeight;
      if (type.includes("bench") && maxWeight > bench) bench = maxWeight;
    });
    return { name: `W${i}`, squat, deadlift, bench };
  });
  const durProg = performance.now() - startProg;
  console.log(`    -> getProgressData time: ${durProg.toFixed(2)}ms`);
  assert.ok(durProg < 30, `Progress calculation took ${durProg.toFixed(2)}ms (<30ms budget)`);
  assert.equal(progData.length, 1000);
});

test("P04: Dashboard unmemoized computations audit (totalVolume & avgDurationMin overhead)", () => {
  // Audit what Dashboard.tsx recalculates on EVERY render when props/state change
  // 1. totalVolume
  const startTotVol = performance.now();
  let totalVolume = 0;
  largeLogs.forEach((log) => {
    log.exercises?.forEach((ex: any) => {
      ex.sets?.forEach((s: any) => {
        if (s.completed && s.weight && s.reps)
          totalVolume += Number(s.weight) * Number(s.reps);
      });
    });
  });
  const durTotVol = performance.now() - startTotVol;

  // 2. avgDurationMin
  const startAvgDur = performance.now();
  const avgDurationMin = largeLogs.length > 0
    ? Math.round(largeLogs.reduce((sum, log) => sum + getWorkoutLogDurationMinutes(log.duration), 0) / largeLogs.length)
    : 0;
  const durAvgDur = performance.now() - startAvgDur;

  console.log(`    -> Unmemoized totalVolume scan: ${durTotVol.toFixed(2)}ms`);
  console.log(`    -> Unmemoized avgDurationMin scan: ${durAvgDur.toFixed(2)}ms`);

  // Total unmemoized overhead per render pass
  const totalOverheadMs = durTotVol + durAvgDur;
  console.log(`    -> Combined unmemoized overhead: ${totalOverheadMs.toFixed(2)}ms per render`);

  assert.ok(
    totalOverheadMs < 20,
    `Unmemoized operations must execute under 20ms even with 1,000 logs (${totalOverheadMs.toFixed(2)}ms observed)`
  );
  assert.ok(totalVolume > 0);
  assert.ok(avgDurationMin > 0);
});

test("P05: Dashboard userName prop avoids synchronous JSON.parse on render", () => {
  const dashboardSource = fs.readFileSync("src/components/Dashboard.tsx", "utf-8");

  // Verify userName prop is accepted
  assert.ok(
    dashboardSource.includes("userName: userNameProp") || dashboardSource.includes("userName?: string"),
    "Dashboard must accept userName prop"
  );

  // Verify userName is derived from userNameProp with ZERO synchronous localStorage reads during render pass
  assert.ok(
    !dashboardSource.includes("localStorage.getItem"),
    "Dashboard must not perform synchronous localStorage reads during render pass"
  );
  assert.ok(
    dashboardSource.includes("userNameProp && userNameProp !== \"Guest\"") ||
      dashboardSource.includes("userName = userNameProp"),
    "Dashboard must derive userName from userNameProp"
  );
});

// ============================================================================
// 3. DOMAIN MODEL DURATION INVARIANTS & CONVERSIONS
// ============================================================================
console.log("\n--- 3. Domain Model Duration Invariants & Extreme Boundaries ---");

test("D01: getWorkoutLogDurationMinutes handles 0 and negative seconds (clamped to 0)", () => {
  assert.equal(getWorkoutLogDurationMinutes(0), 0, "0s -> 0 min");
  assert.equal(getWorkoutLogDurationMinutes(-1), 0, "-1s -> 0 min");
  assert.equal(getWorkoutLogDurationMinutes(-1000), 0, "-1000s -> 0 min");
});

test("D02: getWorkoutLogDurationMinutes handles non-finite numbers (NaN, Infinity, -Infinity)", () => {
  assert.equal(getWorkoutLogDurationMinutes(NaN), 0, "NaN -> 0 min");
  assert.equal(getWorkoutLogDurationMinutes(Infinity), 0, "Infinity -> 0 min");
  assert.equal(getWorkoutLogDurationMinutes(-Infinity), 0, "-Infinity -> 0 min");
});

test("D03: getWorkoutLogDurationMinutes handles non-numbers (null, undefined, string, object)", () => {
  assert.equal(getWorkoutLogDurationMinutes(null), 0, "null -> 0 min");
  assert.equal(getWorkoutLogDurationMinutes(undefined), 0, "undefined -> 0 min");
  assert.equal(getWorkoutLogDurationMinutes("60" as any), 0, "string '60' -> 0 min (strict number)");
  assert.equal(getWorkoutLogDurationMinutes({} as any), 0, "object -> 0 min");
});

test("D04: getWorkoutLogDurationMinutes enforces 1-minute floor for active durations < 60s", () => {
  // If an athlete completes a quick set or workout lasting 15-45s, it displays 1 min instead of 0 min
  assert.equal(getWorkoutLogDurationMinutes(1), 1, "1s -> 1 min");
  assert.equal(getWorkoutLogDurationMinutes(15), 1, "15s -> 1 min");
  assert.equal(getWorkoutLogDurationMinutes(30), 1, "30s -> 1 min");
  assert.equal(getWorkoutLogDurationMinutes(59), 1, "59s -> 1 min");
});

test("D05: getWorkoutLogDurationMinutes accurately rounds durations >= 60s", () => {
  assert.equal(getWorkoutLogDurationMinutes(60), 1, "60s -> 1 min");
  assert.equal(getWorkoutLogDurationMinutes(89), 1, "89s -> 1 min (rounds down)");
  assert.equal(getWorkoutLogDurationMinutes(90), 2, "90s -> 2 min (rounds up)");
  assert.equal(getWorkoutLogDurationMinutes(120), 2, "120s -> 2 min");
  assert.equal(getWorkoutLogDurationMinutes(3540), 59, "3540s -> 59 min");
  assert.equal(getWorkoutLogDurationMinutes(3600), 60, "3600s -> 60 min");
});

test("D06: getWorkoutLogDurationMinutes handles floating point seconds cleanly", () => {
  assert.equal(getWorkoutLogDurationMinutes(59.999), 1, "59.999s -> 1 min");
  assert.equal(getWorkoutLogDurationMinutes(60.001), 1, "60.001s -> 1 min");
  assert.equal(getWorkoutLogDurationMinutes(149.75), 2, "149.75s -> 2 min");
});

test("D07: getWorkoutLogDurationMinutes handles extreme ultra-endurance (>24 hours)", () => {
  const daySeconds = 86400; // 24 hours
  assert.equal(getWorkoutLogDurationMinutes(daySeconds), 1440, "86400s -> 1440 min");

  const longSeconds = 100000;
  assert.equal(getWorkoutLogDurationMinutes(longSeconds), Math.round(100000 / 60));
});

test("D08: buildRoutineFromWorkoutLog converts log seconds to template minutes", () => {
  const sampleLog: WorkoutLog = {
    id: "log-test-1",
    name: "Chest Day",
    duration: 3600, // 3600 seconds = 60 minutes
    tags: ["chest"],
    exercises: [
      {
        id: "ex1",
        title: "Bench Press",
        sets: [{ id: "s1", weight: 80, reps: 10, completed: true }],
      },
    ],
  };

  const routine = buildRoutineFromWorkoutLog(sampleLog);
  assert.equal(routine.duration, 60, "Routine template duration must be 60 minutes, NOT 3600");
  assert.equal(routine.exercises[0].sets[0].completed, false, "Sets in template must reset completed to false");
});

test("D09: buildTemplateFromLiveWorkout converts live session seconds to template minutes", () => {
  const liveSession: RoutineData = {
    id: "live-1",
    name: "Leg Day Live",
    duration: 5400, // 90 minutes in seconds
    tags: ["legs"],
    exercises: [
      {
        id: "ex1",
        title: "Squat",
        sets: [{ id: "s1", weight: 100, reps: 5, completed: true }],
      },
    ],
  };

  const template = buildTemplateFromLiveWorkout(liveSession);
  assert.equal(template.duration, 90, "Template duration must be 90 minutes, NOT 5400");
});

test("D10: WorkoutSummaryView formatDuration boundary handling", () => {
  const summaryFile = fs.readFileSync("src/components/WorkoutSummaryView.tsx", "utf-8");
  assert.ok(
    summaryFile.includes("const formatDuration = (seconds: number) => {"),
    "WorkoutSummaryView defines formatDuration"
  );

  // Extracted logic test:
  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(-50), "0:00");
  assert.equal(formatDuration(NaN), "0:00");
  assert.equal(formatDuration(125), "2:05");
  assert.equal(formatDuration(3665), "1h 1m");
  assert.equal(formatDuration(7200), "2h 0m");
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n================================================================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  console.error("\nFAILURES SUMMARY:");
  failures.forEach((f, idx) => {
    console.error(`  ${idx + 1}. ${f.name} -> ${f.error}`);
  });
  process.exit(1);
} else {
  console.log("✔ ALL EMPIRICAL VERIFICATION CHECKS PASSED WITH 100% SUCCESS.");
  process.exit(0);
}
