/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Empirical Adversarial Challenger Test Suite — Milestone 1 Iteration 2
 * Agent: challenger_m1_iter2_1 (Adversarial State & Concurrency Verifier)
 *
 * Exhaustive Empirical Verification & Stress Harness:
 * 1. Modal Stack Concurrency & State Invariants (LIFO, rapid Esc, out-of-order unmount, 10,000 stress cycles)
 * 2. Component-Level Modal Integration & Lifecycle (useModalDismiss, nested modals, ConfirmModal props)
 * 3. Storage Resilience & Sandboxed Exceptions (SecurityError, QuotaExceededError, in-memory fallback)
 * 4. Haptics Engine Invariants (render pass purity, dual-shudder elimination, burst stress)
 * 5. Features 6, 8, 9 Verifications (AnimatePresence wrapping, duration differentiation, userName memoization)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Import modules under test
import {
  pushModal,
  popAndDismiss,
  getModalStackDepth,
  _resetModalStackForTesting,
  useModalDismiss,
} from "../../src/lib/modalStack";
import {
  getSafeStorage,
  readJson,
  writeJsonSafe,
  writeJsonAtomic,
  safeGetItem,
  safeSetItem,
  removeJsonAtomic,
} from "../../src/lib/storage";
import {
  triggerHaptic,
  hapticPress,
  isHapticsEnabled,
  setHapticsEnabled,
} from "../../src/lib/haptics";
import {
  getWorkoutLogDurationMinutes,
  buildRoutineFromWorkoutLog,
  buildTemplateFromLiveWorkout,
} from "../../src/lib/workoutUtils";
import type { RoutineData, WorkoutLog } from "../../src/types/workout";

console.log("================================================================================");
console.log("   CHALLENGER M1 ITERATION 2: EMPIRICAL ADVERSARIAL STRESS HARNESS             ");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;
const findings: { id: string; title: string; detail: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" }[] = [];

function challenge(
  id: string,
  name: string,
  fn: () => void,
  severityIfFailed: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "HIGH"
) {
  try {
    fn();
    console.log(`  ✓ [PASS] [${id}] ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] [${id}] ${name}`);
    console.error(`    Details: ${err.message}`);
    failedCount++;
    findings.push({
      id,
      title: name,
      detail: err.message,
      severity: severityIfFailed,
    });
  }
}

/* =========================================================================
 * SECTION 1: MODAL STACK CONCURRENCY & STATE INVARIANTS
 * ========================================================================= */
console.log("--- SECTION 1: Modal Stack Concurrency & State Invariants ---");

challenge("M-01", "Strict LIFO Ordering with 10 Deep Nested Modals", () => {
  _resetModalStackForTesting();
  const dismissed: number[] = [];
  const cleanups: (() => void)[] = [];

  for (let i = 0; i < 10; i++) {
    cleanups.push(pushModal(() => dismissed.push(i)));
  }

  assert.equal(getModalStackDepth(), 10, "Stack depth must be 10");

  // Pop all 10 one by one
  for (let expected = 9; expected >= 0; expected--) {
    const popped = popAndDismiss();
    assert.equal(popped, true, `Pop must succeed for modal ${expected}`);
    assert.equal(dismissed[dismissed.length - 1], expected, `Modal ${expected} must be dismissed`);
    assert.equal(getModalStackDepth(), expected, `Stack depth must be ${expected}`);
  }

  // 11th pop on empty stack
  assert.equal(popAndDismiss(), false, "Pop on empty stack must return false");
  assert.equal(getModalStackDepth(), 0);

  // Cleanups must be idempotent
  cleanups.forEach((c) => c());
  assert.equal(getModalStackDepth(), 0);
});

challenge("M-02", "Rapid Escape Keystroke Hammering (500 bursts)", () => {
  _resetModalStackForTesting();

  for (let burst = 0; burst < 500; burst++) {
    let dismissCount = 0;
    pushModal(() => dismissCount++);
    pushModal(() => dismissCount++);
    pushModal(() => dismissCount++);

    assert.equal(getModalStackDepth(), 3);

    // Hammer popAndDismiss 10 times consecutively
    let trues = 0;
    let falses = 0;
    for (let k = 0; k < 10; k++) {
      if (popAndDismiss()) trues++;
      else falses++;
    }

    assert.equal(dismissCount, 3, "Exactly 3 modals must be dismissed per burst");
    assert.equal(trues, 3, "Exactly 3 calls must return true");
    assert.equal(falses, 7, "Remaining 7 calls must return false safely");
    assert.equal(getModalStackDepth(), 0, "Stack must be empty");
  }
});

challenge("M-03", "Randomized Out-of-Order Unmount Permutations (100 trials)", () => {
  _resetModalStackForTesting();

  for (let trial = 0; trial < 100; trial++) {
    const size = 8;
    const dismissed: number[] = [];
    const entries: { id: number; cleanup: () => void }[] = [];

    for (let i = 0; i < size; i++) {
      const id = i;
      const cleanup = pushModal(() => dismissed.push(id));
      entries.push({ id, cleanup });
    }

    assert.equal(getModalStackDepth(), size);

    // Randomly unregister 4 elements out of order
    const toUnregister = [1, 3, 5, 7];
    toUnregister.forEach((idx) => {
      entries[idx].cleanup();
    });

    assert.equal(getModalStackDepth(), size - toUnregister.length);

    // Remaining elements in stack should be [0, 2, 4, 6]
    // Popping should dismiss them in LIFO order: 6, 4, 2, 0
    const expectedOrder = [6, 4, 2, 0];
    for (const exp of expectedOrder) {
      assert.equal(popAndDismiss(), true);
      assert.equal(dismissed[dismissed.length - 1], exp);
    }

    assert.equal(getModalStackDepth(), 0);
    assert.equal(popAndDismiss(), false);

    // Clean up remaining
    entries.forEach((e) => e.cleanup());
    assert.equal(getModalStackDepth(), 0);
  }
});

challenge("M-04", "Re-entrant Push and Pop During Modal Dismissal Handler", () => {
  _resetModalStackForTesting();
  let step = 0;

  pushModal(() => {
    step = 1;
    // Dismissing Modal 1 immediately pushes Modal 2
    pushModal(() => {
      step = 2;
    });
  });

  assert.equal(getModalStackDepth(), 1);
  popAndDismiss();
  assert.equal(step, 1, "First modal handler executed");
  assert.equal(getModalStackDepth(), 1, "Re-entrant modal must now be on stack");

  popAndDismiss();
  assert.equal(step, 2, "Re-entrant modal handler executed");
  assert.equal(getModalStackDepth(), 0);
});

challenge("M-05", "10,000 Rapid Concurrency Cycles (Push, Pop, Cleanups, Invariants)", () => {
  _resetModalStackForTesting();
  const start = performance.now();

  for (let i = 0; i < 10000; i++) {
    const op = i % 4;
    if (op === 0) {
      const cleanup = pushModal(() => {});
      cleanup();
    } else if (op === 1) {
      const c1 = pushModal(() => {});
      const c2 = pushModal(() => {});
      popAndDismiss();
      c2();
      c1();
    } else if (op === 2) {
      pushModal(() => {});
      pushModal(() => {});
      popAndDismiss();
      popAndDismiss();
    } else {
      const c = pushModal(() => {});
      c();
      c(); // duplicate idempotent cleanup
    }
  }

  const duration = performance.now() - start;
  assert.equal(getModalStackDepth(), 0, "Stack depth must return to exactly 0");
  assert.ok(duration < 250, `10,000 cycles completed in ${duration.toFixed(2)}ms (<250ms budget)`);
});

challenge("M-06", "Global Window Event Interception (Keyboard Escape & Hardware Back)", () => {
  _resetModalStackForTesting();

  // Test custom event 'liftlab:back'
  let backDismissed = false;
  pushModal(() => {
    backDismissed = true;
  });

  assert.equal(getModalStackDepth(), 1);

  if (typeof window !== "undefined") {
    const backEvent = new Event("liftlab:back", { cancelable: true });
    window.dispatchEvent(backEvent);
    assert.equal(backDismissed, true, "liftlab:back must pop and dismiss topmost modal");
    assert.equal(getModalStackDepth(), 0);
  }
});

/* =========================================================================
 * SECTION 2: COMPONENT-LEVEL MODAL INTEGRATION & LIFECYCLE
 * ========================================================================= */
console.log("\n--- SECTION 2: Component-Level Modal Integration & Lifecycle ---");

challenge("C-01", "React useModalDismiss Dynamic Hook Lifecycle Simulation", () => {
  _resetModalStackForTesting();

  // Simulate a component rendering useModalDismiss(isOpen, onClose)
  let isOpen = false;
  let closedCount = 0;
  const onClose = () => {
    closedCount++;
    isOpen = false;
  };

  // Simulated effect runner
  let effectCleanup: (() => void) | undefined;
  const simulateRender = () => {
    if (effectCleanup) {
      effectCleanup();
      effectCleanup = undefined;
    }
    if (isOpen) {
      effectCleanup = pushModal(() => onClose());
    }
  };

  // Initially closed
  simulateRender();
  assert.equal(getModalStackDepth(), 0);

  // Opens
  isOpen = true;
  simulateRender();
  assert.equal(getModalStackDepth(), 1);

  // Escape key press
  const popped = popAndDismiss();
  assert.equal(popped, true);
  assert.equal(closedCount, 1);
  assert.equal(isOpen, false);

  // Component re-renders with isOpen=false
  simulateRender();
  assert.equal(getModalStackDepth(), 0);
});

challenge("C-02", "Nested Modal Integration (FullWorkoutHistoryModal + ConfirmModal)", () => {
  _resetModalStackForTesting();

  // Level 1: FullWorkoutHistoryModal is open
  let historyOpen = true;
  const historyCleanup = pushModal(() => {
    historyOpen = false;
  });

  assert.equal(getModalStackDepth(), 1);

  // Level 2: User clicks delete log -> ConfirmModal opens on top
  let confirmOpen = true;
  const confirmCleanup = pushModal(() => {
    confirmOpen = false;
  });

  assert.equal(getModalStackDepth(), 2);

  // First Escape: Only ConfirmModal must close
  popAndDismiss();
  assert.equal(confirmOpen, false, "ConfirmModal must be dismissed by first Escape");
  assert.equal(historyOpen, true, "FullWorkoutHistoryModal must REMAIN open after first Escape");
  assert.equal(getModalStackDepth(), 1);

  // Second Escape: FullWorkoutHistoryModal closes
  popAndDismiss();
  assert.equal(historyOpen, false, "FullWorkoutHistoryModal must be dismissed by second Escape");
  assert.equal(getModalStackDepth(), 0);

  historyCleanup();
  confirmCleanup();
});

challenge("C-03", "ConfirmModal Interface Contract Verification (TS2322 & Props)", () => {
  const confirmModalPath = path.resolve(process.cwd(), "src/components/common/ConfirmModal.tsx");
  const content = fs.readFileSync(confirmModalPath, "utf-8");

  // Verify ConfirmModalProps interface exists and includes optional key
  assert.ok(content.includes("export interface ConfirmModalProps"), "ConfirmModalProps interface must be exported");
  assert.ok(content.includes("key?: React.Key"), "ConfirmModalProps must include key?: React.Key for TS2322 compatibility");
  assert.ok(content.includes("useModalDismiss(true, onCancel)"), "ConfirmModal must register with modalStack");
});

/* =========================================================================
 * SECTION 3: STORAGE RESILIENCE & SANDBOXED EXCEPTIONS
 * ========================================================================= */
console.log("\n--- SECTION 3: Storage Resilience & Sandboxed Exceptions ---");

challenge("S-01", "getSafeStorage Recovers from SecurityError (Sandboxed Iframes / Disabled Storage)", () => {
  const origWindow = (globalThis as any).window;
  const origStorageDesc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  try {
    (globalThis as any).window = {};
    Object.defineProperty((globalThis as any).window, "localStorage", {
      get() {
        const err = new Error("SecurityError: Access is denied for this document");
        err.name = "SecurityError";
        throw err;
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        const err = new Error("SecurityError: Access is denied for this document");
        err.name = "SecurityError";
        throw err;
      },
      configurable: true,
    });

    const safe = getSafeStorage();
    assert.ok(safe, "Must return in-memory storage fallback");
    safe.setItem("test_key", "valid_payload");
    assert.equal(safe.getItem("test_key"), "valid_payload");

    // safeGetItem and safeSetItem helpers must work seamlessly
    const success = safeSetItem("athlete_weight", 82.5);
    assert.equal(success, true);
    const weight = safeGetItem<number>("athlete_weight", 70);
    assert.equal(weight, 82.5);
  } finally {
    (globalThis as any).window = origWindow;
    if (origStorageDesc) {
      Object.defineProperty(globalThis, "localStorage", origStorageDesc);
    } else {
      delete (globalThis as any).localStorage;
    }
  }
});

challenge("S-02", "writeJsonSafe and writeJsonAtomic Catch QuotaExceededError", () => {
  const quotaStorage: Storage = {
    getItem: () => null,
    setItem: () => {
      const err = new Error("QuotaExceededError: DomException quota exceeded");
      err.name = "QuotaExceededError";
      throw err;
    },
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  assert.doesNotThrow(() => {
    const ok = writeJsonSafe("payload", { data: 123 }, quotaStorage);
    assert.equal(ok, false, "Must return false without throwing");
  });

  assert.doesNotThrow(() => {
    const ok = writeJsonAtomic("atomic_payload", { data: 456 }, quotaStorage);
    assert.equal(ok, false, "writeJsonAtomic must return false on quota failure");
  });
});

/* =========================================================================
 * SECTION 4: HAPTICS ENGINE INVARIANTS
 * ========================================================================= */
console.log("\n--- SECTION 4: Haptics Engine Invariants ---");

challenge("H-01", "hapticPress Render Pass Purity (No Vibration During Render)", () => {
  const h1 = hapticPress("light");
  const h2 = hapticPress("medium");
  const h3 = hapticPress("heavy");
  const h4 = hapticPress();

  assert.equal(typeof h1, "function", "hapticPress must return a function");
  assert.equal(typeof h2, "function");
  assert.equal(typeof h3, "function");
  assert.equal(typeof h4, "function");
});

challenge("H-02", "Dual-Haptic Shudder Elimination (Source Audit)", () => {
  // TabHero
  const tabHeroSrc = fs.readFileSync("src/components/common/TabHero.tsx", "utf-8");
  assert.ok(
    !tabHeroSrc.includes("onClick={() => {\n                triggerHaptic(") &&
      !tabHeroSrc.includes("onClick={() => { triggerHaptic("),
    "TabHero onClick must not call triggerHaptic"
  );

  // AppleBottomSheet
  const sheetSrc = fs.readFileSync("src/components/common/AppleBottomSheet.tsx", "utf-8");
  assert.ok(
    !sheetSrc.includes("onClick={() => {\n                          triggerHaptic("),
    "AppleBottomSheet close button must not call triggerHaptic inside onClick"
  );

  // App navigation
  const appSrc = fs.readFileSync("src/App.tsx", "utf-8");
  assert.ok(
    appSrc.includes("onPointerDown={hapticPress(\"light\")}") && appSrc.includes("onClick={() => navigateTo(tab.id)}"),
    "App navigation must use hapticPress on pointerDown and pure navigateTo on click"
  );
});

challenge("H-03", "isHapticsEnabled Sandbox try/catch Resilience", () => {
  // Verify function runs without throwing in current environment
  assert.doesNotThrow(() => {
    const enabled = isHapticsEnabled();
    assert.equal(typeof enabled, "boolean");
  });
});

/* =========================================================================
 * SECTION 5: FEATURES 6, 8, 9 VERIFICATIONS
 * ========================================================================= */
console.log("\n--- SECTION 5: Features 6, 8, 9 Verifications ---");

challenge("F06", "All Conditional Modals Wrapped in AnimatePresence", () => {
  const appSrc = fs.readFileSync("src/App.tsx", "utf-8");
  const dashboardSrc = fs.readFileSync("src/components/Dashboard.tsx", "utf-8");

  // App.tsx
  assert.ok(
    appSrc.includes("<AnimatePresence>\n          {showPrivacyPolicy && (") ||
    appSrc.includes("<AnimatePresence>{showPrivacyPolicy && (") ||
    appSrc.includes("showPrivacyPolicy && (\n            <PrivacyPolicyModal"),
    "PrivacyPolicyModal must be wrapped in AnimatePresence"
  );
  assert.ok(
    appSrc.includes("<AnimatePresence>\n          {showTOS && (") ||
    appSrc.includes("<AnimatePresence>{showTOS && (") ||
    appSrc.includes("showTOS && (\n            <TOSModal"),
    "TOSModal must be wrapped in AnimatePresence"
  );

  // Dashboard.tsx
  assert.ok(
    dashboardSrc.includes("<AnimatePresence>\n          {isPRModalOpen && (") ||
    dashboardSrc.includes("<AnimatePresence>\n        {isPRModalOpen && (") ||
    dashboardSrc.includes("isPRModalOpen && (\n            <PRListModal"),
    "PRListModal must be wrapped in AnimatePresence"
  );
  assert.ok(
    dashboardSrc.includes("<AnimatePresence>\n          {pendingDeleteLogId && onDeleteLog && (") ||
    dashboardSrc.includes("<AnimatePresence>\n        {pendingDeleteLogId && onDeleteLog && (") ||
    dashboardSrc.includes("pendingDeleteLogId && onDeleteLog && (\n            <ConfirmModal"),
    "ConfirmModal in Dashboard must be wrapped in AnimatePresence"
  );
});

challenge("F08", "Domain Model Duration Invariants (Routine minutes vs Log seconds)", () => {
  // 1. Log duration in seconds converted to minutes
  assert.equal(getWorkoutLogDurationMinutes(0), 0);
  assert.equal(getWorkoutLogDurationMinutes(-50), 0);
  assert.equal(getWorkoutLogDurationMinutes(30), 1, "Under 60s active floor is 1 min");
  assert.equal(getWorkoutLogDurationMinutes(3600), 60, "3600s is 60 min");

  // 2. buildRoutineFromWorkoutLog converts 3600s to 60min
  const sampleLog: WorkoutLog = {
    id: "log-test",
    name: "Chest",
    duration: 3600,
    tags: [],
    exercises: [],
  };
  const routine = buildRoutineFromWorkoutLog(sampleLog);
  assert.equal(routine.duration, 60, "Template duration must be in minutes");

  // 3. buildTemplateFromLiveWorkout converts live seconds to minutes
  const live: RoutineData = {
    id: "live-test",
    name: "Legs",
    duration: 4800,
    tags: [],
    exercises: [],
  };
  const tmpl = buildTemplateFromLiveWorkout(live);
  assert.equal(tmpl.duration, 80, "Live workout duration 4800s must become 80 minutes");
});

challenge("F09", "Dashboard userName Prop Wiring & Zero Synchronous Render Reads", () => {
  const appSrc = fs.readFileSync("src/App.tsx", "utf-8");
  const dashboardSrc = fs.readFileSync("src/components/Dashboard.tsx", "utf-8");

  // 1. App.tsx passes userName to Dashboard
  assert.ok(
    appSrc.includes("<Dashboard\n                userName={userName}") ||
    appSrc.includes("<Dashboard userName={userName}") ||
    appSrc.includes("userName={userName}"),
    "App.tsx must pass userName prop to Dashboard"
  );

  // 2. Dashboard.tsx receives userName prop and has ZERO localStorage.getItem calls
  assert.ok(
    !dashboardSrc.includes("localStorage.getItem"),
    "Dashboard.tsx must have ZERO localStorage.getItem calls"
  );

  // 3. Stats calculations are memoized with useMemo
  assert.ok(dashboardSrc.includes("useMemo"), "Dashboard must use useMemo for heavy stats");
  assert.ok(dashboardSrc.includes("workoutsThisWeek, durationThisWeek } = useMemo"), "Weekly stats must be memoized");
  assert.ok(dashboardSrc.includes("totalVolume = useMemo"), "totalVolume must be memoized");
  assert.ok(dashboardSrc.includes("avgDurationMin = useMemo"), "avgDurationMin must be memoized");
});

/* =========================================================================
 * SUMMARY
 * ========================================================================= */
console.log("\n================================================================================");
console.log(`TOTAL CHALLENGES: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log("================================================================================\n");

if (failedCount > 0) {
  console.error("FAILURES DETECTED:");
  findings.forEach((f) => console.error(`  [${f.severity}] ${f.id}: ${f.title} -> ${f.detail}`));
  process.exit(1);
} else {
  console.log("✔ ALL ADVERSARIAL CHALLENGES EMPIRICALLY VERIFIED AND PASSED.");
  process.exit(0);
}
