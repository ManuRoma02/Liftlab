/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Empirical Adversarial Challenge Test Harness — Milestone 1
 * Author: challenger_m1_1 (Adversarial State & Concurrency Verifier)
 *
 * Focus:
 * 1. Modal Stack Concurrency & State Invariants
 * 2. Storage Fallback, Error Injection & In-Memory Retention
 * 3. Direct localStorage SecurityError Audit
 * 4. Exit Animation / AnimatePresence Audit
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

console.log("================================================================================");
console.log("   CHALLENGER 1 (M1) — EMPIRICAL ADVERSARIAL CONCURRENCY & STORAGE HARNESS       ");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;
const findings: { id: string; title: string; detail: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" }[] = [];

function runChallenge(
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

// Helper to set up fake window keydown
let keydownListeners: ((e: any) => void)[] = [];
const mockWindow = {
  addEventListener: (type: string, listener: any, options?: any) => {
    if (type === "keydown") keydownListeners.push(listener);
  },
  removeEventListener: (type: string, listener: any) => {
    keydownListeners = keydownListeners.filter((l) => l !== listener);
  },
  dispatchEvent: (event: any) => true,
};

runChallenge("MODAL-01", "LIFO Ordering & Single Pop Invariant", () => {
  _resetModalStackForTesting();
  const dismissed: string[] = [];

  const cleanupA = pushModal(() => dismissed.push("ModalA"));
  const cleanupB = pushModal(() => dismissed.push("ModalB"));
  const cleanupC = pushModal(() => dismissed.push("ModalC"));

  assert.equal(getModalStackDepth(), 3, "Stack depth must be 3");

  // First pop must only dismiss topmost ModalC
  const popped1 = popAndDismiss();
  assert.equal(popped1, true);
  assert.deepEqual(dismissed, ["ModalC"], "Only topmost modal C must be dismissed");
  assert.equal(getModalStackDepth(), 2, "Stack depth must be 2 after 1 pop");

  // Second pop must dismiss ModalB
  const popped2 = popAndDismiss();
  assert.equal(popped2, true);
  assert.deepEqual(dismissed, ["ModalC", "ModalB"], "Modal B must be dismissed next");
  assert.equal(getModalStackDepth(), 1, "Stack depth must be 1 after 2 pops");

  // Third pop must dismiss ModalA
  const popped3 = popAndDismiss();
  assert.equal(popped3, true);
  assert.deepEqual(dismissed, ["ModalC", "ModalB", "ModalA"], "Modal A must be dismissed last");
  assert.equal(getModalStackDepth(), 0, "Stack depth must be 0 after all popped");

  // Fourth pop on empty stack must return false safely without error
  const popped4 = popAndDismiss();
  assert.equal(popped4, false, "Popping empty stack must return false");

  cleanupA();
  cleanupB();
  cleanupC();
});

runChallenge("MODAL-02", "Rapid Escape Keystroke Burst (10x in 1ms)", () => {
  _resetModalStackForTesting();
  let dismissCount = 0;

  pushModal(() => dismissCount++);
  pushModal(() => dismissCount++);
  pushModal(() => dismissCount++);

  assert.equal(getModalStackDepth(), 3);

  // Hammer popAndDismiss 10 times consecutively
  const results: boolean[] = [];
  for (let i = 0; i < 10; i++) {
    results.push(popAndDismiss());
  }

  assert.equal(dismissCount, 3, "Exactly 3 modals should have been dismissed");
  assert.equal(getModalStackDepth(), 0, "Stack depth must be 0");
  assert.equal(
    results.filter(Boolean).length,
    3,
    "Exactly 3 pops must return true, 7 must return false"
  );
});

runChallenge("MODAL-03", "Dynamic Out-of-Order Unmount Without Escape", () => {
  _resetModalStackForTesting();
  const dismissed: string[] = [];

  const unregisterA = pushModal(() => dismissed.push("A"));
  const unregisterB = pushModal(() => dismissed.push("B"));
  const unregisterC = pushModal(() => dismissed.push("C"));

  assert.equal(getModalStackDepth(), 3);

  // Dynamically unmount middle modal B without pressing Escape
  unregisterB();

  assert.equal(getModalStackDepth(), 2, "Stack depth must decrease to 2 after B unmounts");

  // Pop topmost: must be C
  popAndDismiss();
  assert.deepEqual(dismissed, ["C"], "Top modal C must be dismissed");

  // Pop next: must be A (since B was unmounted cleanly)
  popAndDismiss();
  assert.deepEqual(dismissed, ["C", "A"], "Bottom modal A must be dismissed");

  assert.equal(getModalStackDepth(), 0);

  unregisterA();
  unregisterC();
});

runChallenge("MODAL-04", "Idempotent Unregister Cleanup", () => {
  _resetModalStackForTesting();
  const unregister = pushModal(() => {});
  assert.equal(getModalStackDepth(), 1);

  // Calling unregister multiple times should not cause negative depth or errors
  unregister();
  assert.equal(getModalStackDepth(), 0);
  unregister();
  assert.equal(getModalStackDepth(), 0);
});

runChallenge("MODAL-05", "Re-entrant Modal Push During Dismissal", () => {
  _resetModalStackForTesting();
  let secondModalPushed = false;
  let cleanupSecond: (() => void) | null = null;

  pushModal(() => {
    // When Modal 1 is dismissed, it immediately pushes a confirmation modal
    cleanupSecond = pushModal(() => {
      secondModalPushed = true;
    });
  });

  assert.equal(getModalStackDepth(), 1);

  // Pop Modal 1 -> triggers push of Confirmation Modal
  popAndDismiss();

  assert.equal(getModalStackDepth(), 1, "Confirmation modal must now be on stack");

  // Pop Confirmation Modal
  popAndDismiss();
  assert.equal(secondModalPushed, true, "Confirmation modal dismiss handler must have executed");
  assert.equal(getModalStackDepth(), 0);

  if (cleanupSecond) (cleanupSecond as () => void)();
});

runChallenge("MODAL-06", "Double Registration Defect (RoutineEditor + ConfirmModal)", () => {
  _resetModalStackForTesting();
  // In RoutineEditor.tsx lines 818-819:
  // useBackDismiss(discardConfirmOpen, () => setDiscardConfirmOpen(false));
  // AND ConfirmModal.tsx line 35:
  // useModalDismiss(true, onCancel);
  // When discardConfirmOpen=true, BOTH register for the same modal!

  let isDiscardOpen = true;
  let confirmCancelFired = false;
  let editorCancelFired = false;

  // Simulate RoutineEditor registration
  const editorCleanup = pushModal(() => {
    editorCancelFired = true;
    isDiscardOpen = false;
  });

  // Simulate ConfirmModal registration
  const confirmCleanup = pushModal(() => {
    confirmCancelFired = true;
    isDiscardOpen = false;
  });

  // EMPIRICAL OBSERVATION:
  const depth = getModalStackDepth();
  console.log(`    -> Observed stack depth for single logical modal: ${depth}`);

  // In an ideal architecture, single modal has depth 1. Here depth is 2!
  assert.equal(depth, 2, "Confirmed double registration: stack depth is 2 for 1 logical modal");

  // First Escape pops ConfirmModal handler
  popAndDismiss();
  assert.equal(confirmCancelFired, true, "ConfirmModal handler executed");

  // BUT editor handler is STILL on stack!
  const depthAfterOnePop = getModalStackDepth();
  console.log(`    -> Stack depth after first Escape: ${depthAfterOnePop}`);
  assert.equal(depthAfterOnePop, 1, "Editor handler remains on stack until unmount cleanup!");

  // If another Escape happens before React re-render:
  popAndDismiss();
  assert.equal(editorCancelFired, true, "Second Escape popped duplicate handler");
  assert.equal(getModalStackDepth(), 0);

  editorCleanup();
  confirmCleanup();
}, "MEDIUM");

runChallenge("MODAL-07", "Exception in Topmost Dismiss Handler Does Not Corrupt Stack", () => {
  _resetModalStackForTesting();
  let modalAFired = false;

  pushModal(() => {
    modalAFired = true;
  });

  // Top modal throws an exception during dismiss
  pushModal(() => {
    throw new Error("Simulated unhandled exception in modal onClose");
  });

  assert.equal(getModalStackDepth(), 2);

  // Pop top modal: it will throw
  let threw = false;
  try {
    popAndDismiss();
  } catch {
    threw = true;
  }
  assert.equal(threw, true, "popAndDismiss propagates handler exception");

  // Invariant check: Did the throwing handler get removed from stack, or is it stuck?
  assert.equal(getModalStackDepth(), 1, "Throwing handler was popped, preventing infinite loop");

  // Next modal can still be popped
  popAndDismiss();
  assert.equal(modalAFired, true, "Underlying modal A can still be dismissed");
  assert.equal(getModalStackDepth(), 0);
});

/* =========================================================================
 * SECTION 2: STORAGE FALLBACK, ERROR INJECTION & IN-MEMORY RETENTION
 * ========================================================================= */
console.log("\n--- SECTION 2: Storage Fallback & Error Injection ---");

runChallenge("STORE-01", "getSafeStorage Recovers from SecurityError on window.localStorage", () => {
  const origWindow = (globalThis as any).window;
  const origStorageDesc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  try {
    // Simulate restricted iframe / private browsing sandbox where accessing window.localStorage or localStorage throws
    (globalThis as any).window = {};
    Object.defineProperty((globalThis as any).window, "localStorage", {
      get() {
        const err = new Error("SecurityError: The operation is insecure.");
        err.name = "SecurityError";
        throw err;
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        const err = new Error("SecurityError: The operation is insecure.");
        err.name = "SecurityError";
        throw err;
      },
      configurable: true,
    });

    const safe = getSafeStorage();
    // Must return the in-memory fallback store
    assert.ok(safe, "getSafeStorage must return an object");
    assert.equal(typeof safe.getItem, "function");
    assert.equal(typeof safe.setItem, "function");

    // Must allow setItem and getItem in memory
    safe.setItem("test_key", "test_val");
    assert.equal(safe.getItem("test_key"), "test_val", "In-memory store retains written value");
    assert.equal(safe.length, 1);
  } finally {
    (globalThis as any).window = origWindow;
    if (origStorageDesc) {
      Object.defineProperty(globalThis, "localStorage", origStorageDesc);
    } else {
      delete (globalThis as any).localStorage;
    }
  }
});

runChallenge("STORE-02", "In-Memory Storage Retains Multiple Keys Across Re-renders", () => {
  const origWindow = (globalThis as any).window;
  const origStorageDesc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  try {
    // Simulate restricted iframe / private browsing sandbox where accessing window.localStorage or localStorage throws
    (globalThis as any).window = {};
    Object.defineProperty((globalThis as any).window, "localStorage", {
      get() {
        const err = new Error("SecurityError: The operation is insecure.");
        err.name = "SecurityError";
        throw err;
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        const err = new Error("SecurityError: The operation is insecure.");
        err.name = "SecurityError";
        throw err;
      },
      configurable: true,
    });

    const safe = getSafeStorage();
    safe.setItem("liftlab_routines", JSON.stringify([{ id: "r1", name: "Routine 1" }]));
    safe.setItem("liftlab_weight_logs", JSON.stringify([{ date: "2026-11-02", weight: 75 }]));
    safe.setItem("liftlab_user_data", JSON.stringify({ displayName: "Athlete" }));

    // Re-fetch storage simulating a component re-render
    const safeAgain = getSafeStorage();

    const routines = JSON.parse(safeAgain.getItem("liftlab_routines") || "[]");
    const weights = JSON.parse(safeAgain.getItem("liftlab_weight_logs") || "[]");
    const user = JSON.parse(safeAgain.getItem("liftlab_user_data") || "{}");

    assert.equal(routines.length, 1);
    assert.equal(routines[0].name, "Routine 1");
    assert.equal(weights[0].weight, 75);
    assert.equal(user.displayName, "Athlete");
  } finally {
    (globalThis as any).window = origWindow;
    if (origStorageDesc) {
      Object.defineProperty(globalThis, "localStorage", origStorageDesc);
    } else {
      delete (globalThis as any).localStorage;
    }
  }
});

runChallenge("STORE-03", "writeJsonSafe Handles QuotaExceededError Gracefully", () => {
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

  // Must not throw, must return false
  const success = writeJsonSafe("big_dataset", { data: "large_payload" }, quotaStorage);
  assert.equal(success, false, "writeJsonSafe must return false when quota is exceeded");
});

runChallenge("STORE-04", "writeJsonAtomic Cleans up Temporary Key on Failure", () => {
  const store = new Map<string, string>();
  let failOnFinal = false;

  const quotaStorage: Storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      if (failOnFinal && !k.endsWith("_tmp")) {
        throw new Error("QuotaExceededError: write failed");
      }
      store.set(k, v);
    },
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };

  // Normal atomic write
  writeJsonAtomic("atomic_key", { v: 1 }, quotaStorage);
  assert.equal(store.has("atomic_key_tmp"), false, "_tmp key must be cleaned up on success");

  // Failed atomic write
  failOnFinal = true;
  writeJsonAtomic("atomic_key", { v: 2 }, quotaStorage);
  assert.equal(store.has("atomic_key_tmp"), false, "_tmp key must be cleaned up even on failure");
});

runChallenge("STORE-05", "readJson Automatic Backup Recovery", () => {
  const store = new Map<string, string>();
  store.set("my_routine", "{corrupt json !!!");
  store.set("my_routine_bak", JSON.stringify({ id: "r1", name: "Recovered Routine" }));

  const mockStorage: Storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };

  const recovered = readJson<{ id: string; name: string }>("my_routine", { id: "", name: "" }, mockStorage);
  assert.equal(recovered.name, "Recovered Routine", "readJson must recover from backup if primary is corrupt");
  assert.ok(store.get("my_routine")?.includes("Recovered Routine"), "Primary slot must be restored from backup");
});

/* =========================================================================
 * SECTION 3: EMPIRICAL VULNERABILITY AUDIT IN APPLICATION CODE
 * ========================================================================= */
console.log("\n--- SECTION 3: Empirical Codebase Vulnerability Audit ---");

runChallenge("VULN-01", "Raw localStorage Calls in useWorkoutData.ts (SecurityError Vulnerability)", () => {
  const hookPath = path.resolve(process.cwd(), "src/hooks/useWorkoutData.ts");
  const content = fs.readFileSync(hookPath, "utf-8");

  // Find occurrences of raw localStorage.getItem / setItem
  const rawAccessRegex = /localStorage\.(getItem|setItem|removeItem)\(/g;
  const matches = [...content.matchAll(rawAccessRegex)];

  console.log(`    -> Discovered ${matches.length} direct localStorage calls in useWorkoutData.ts`);

  // EMPIRICAL VULNERABILITY CHECK:
  // If useWorkoutData initializes in a SecurityError sandbox (e.g. line 78: localStorage.getItem("liftlab_guest_data")),
  // it does NOT use safeGetItem or readJson!
  const hasRawGuestDataRead = content.includes('localStorage.getItem("liftlab_guest_data")');
  assert.equal(
    hasRawGuestDataRead,
    true,
    "Confirmed: useWorkoutData.ts uses raw unguarded localStorage.getItem('liftlab_guest_data')"
  );
}, "HIGH");

runChallenge("VULN-02", "AnimatePresence Absence Around Conditional Modals", () => {
  const auditFile = (relPath: string, modalPatterns: string[]) => {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");

    const unwrapped: string[] = [];

    for (const pattern of modalPatterns) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(pattern)) {
          // Check if lines[i] is inside an AnimatePresence block
          // Scan upwards to find nearest <AnimatePresence or </AnimatePresence>
          let isInside = false;
          for (let j = i - 1; j >= 0; j--) {
            if (lines[j].includes("</AnimatePresence>")) {
              isInside = false;
              break;
            }
            if (lines[j].includes("<AnimatePresence>")) {
              isInside = true;
              break;
            }
          }
          if (!isInside) {
            unwrapped.push(`${relPath}:${i + 1} (${pattern.trim()})`);
          }
        }
      }
    }
    return unwrapped;
  };

  const unwrappedModals: string[] = [
    ...auditFile("src/App.tsx", [
      "showPrivacyPolicy && <PrivacyPolicyModal",
      "showTOS && <TOSModal",
      "sharingRoutine && (",
      "isImportCodeOpen && (",
    ]),
    ...auditFile("src/components/Dashboard.tsx", [
      "isPRModalOpen && (",
      "pendingDeleteLogId && onDeleteLog && (",
    ]),
    ...auditFile("src/components/Progress.tsx", [
      "pendingDeleteLogId && onDeleteWorkoutLog && (",
    ]),
    ...auditFile("src/components/Workout.tsx", [
      "routineToDelete && (",
    ]),
    ...auditFile("src/components/RoutineEditor.tsx", [
      "isFinishConfirmOpen && (",
      "discardConfirmOpen && (",
    ]),
  ];

  console.log(`    -> Discovered ${unwrappedModals.length} unwrapped conditional modal sites:`);
  unwrappedModals.forEach((m) => console.log(`       - ${m}`));

  assert.equal(
    unwrappedModals.length > 0,
    true,
    "Confirmed architectural defect: conditional modals exist without <AnimatePresence>, bypassing exit animations"
  );
}, "HIGH");

runChallenge("VULN-03", "TypeScript Compilation / Lint Failure in FullWorkoutHistoryModal.tsx", () => {
  // Check if FullWorkoutHistoryModal passes key prop to ConfirmModal
  const modalPath = path.resolve(process.cwd(), "src/components/common/FullWorkoutHistoryModal.tsx");
  const content = fs.readFileSync(modalPath, "utf-8");

  const hasInvalidKeyProp = content.includes('<ConfirmModal\n            key="delete-history-confirm"');
  console.log(`    -> FullWorkoutHistoryModal invalid key prop present: ${hasInvalidKeyProp}`);
  assert.equal(
    hasInvalidKeyProp,
    true,
    "Confirmed TS2322 compile error: FullWorkoutHistoryModal passes key prop to ConfirmModal"
  );
}, "HIGH");

runChallenge("VULN-04", "Modal Stack Escape Keydown event.repeat Flooding", () => {
  const modalStackSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/modalStack.ts"), "utf-8");
  // Check if Escape key listener guards against event.repeat
  const hasRepeatCheck = modalStackSrc.includes("event.repeat");
  console.log(`    -> modalStack.ts checks event.repeat on keydown: ${hasRepeatCheck}`);
  assert.equal(
    hasRepeatCheck,
    false,
    "Confirmed vulnerability: modalStack.ts does not check event.repeat, allowing holding Escape to flush all modals"
  );
}, "MEDIUM");

/* =========================================================================
 * SUMMARY
 * ========================================================================= */
console.log("\n================================================================================");
console.log(`CHALLENGER SUITE SUMMARY: ${passedCount} passed, ${failedCount} failed.`);
console.log(`Discovered Findings: ${findings.length}`);
for (const f of findings) {
  console.log(`  [${f.severity}] ${f.id}: ${f.title} -> ${f.detail}`);
}
console.log("================================================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
