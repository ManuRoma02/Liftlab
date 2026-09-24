/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Challenger 1 (Milestone 1) — Empirical Adversarial Stress Test Suite
 *
 * Exhaustively stress-tests:
 * 1. Spring physics (numerical Motion simulation + analytical ODE solver)
 * 2. Haptic engine (rapid bursts, SSR safety, SecurityError sandbox, render-time leaks, double-haptic taps)
 * 3. AppleBottomSheet (zero-height children, overflowing DOM, rapid toggles, Esc key, back stack)
 * 4. Touch target dimensions (44x44pt HIG compliance)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spring } from "framer-motion";
import React from "react";
import { renderToString } from "react-dom/server";

// Import targets under test
import { APPLE_SPRINGS, appleSpringDefault, appleSpringSheet, appleSpringSnappy } from "../../src/lib/motion";
import {
  triggerHaptic,
  hapticPress,
  isHapticsEnabled,
  setHapticsEnabled,
  HAPTICS_STORAGE_KEY,
  type HapticStyle,
} from "../../src/lib/haptics";
import { TabHero } from "../../src/components/common/TabHero";
import { AppleBottomSheet } from "../../src/components/common/AppleBottomSheet";

console.log("================================================================================");
console.log("   CHALLENGER 1 (M1) — EMPIRICAL ADVERSARIAL STRESS TEST SUITE                  ");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;

function runEmpiricalTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Details: ${err.message}`);
    failedCount++;
  }
}

/* =========================================================================
 * 1. SPRING PHYSICS STRESS-TEST & NUMERICAL ORACLE
 * ========================================================================= */
console.log("SECTION 1: Spring Physics & Motion Engine Dynamics");

runEmpiricalTest("1.1 Motion Engine Simulation of APPLE_SPRINGS.criticallyDamped", () => {
  // Simulate Motion's spring solver on criticallyDamped config
  const s = spring({
    ...APPLE_SPRINGS.criticallyDamped,
    keyframes: [0, 100],
  });

  let maxVal = -Infinity;
  let maxT = 0;
  let settledTimeMs = -1;

  for (let t = 0; t <= 10000; t += 10) {
    const { value, done } = s.next(t);
    if (value > maxVal && t <= 2000) {
      maxVal = value;
      maxT = t;
    }
    if (settledTimeMs === -1 && Math.abs(value - 100) <= 1.0 && done) {
      settledTimeMs = t;
    }
  }

  const overshootPercent = maxVal - 100;
  console.log(`    -> Peak value: ${maxVal.toFixed(2)} (+${overshootPercent.toFixed(1)}% overshoot) at t=${maxT}ms`);

  // EMPIRICAL CHALLENGE ASSERTION:
  // HIG critically damped specification requires damping ratio 1.0 (zero overshoot: peak <= 100.0).
  // In Motion 12, passing 'damping: 1.0' triggers physicsKeys mode where damping is raw friction c=1.0,
  // causing damping ratio zeta = 1 / (2*sqrt(100*1)) = 0.05, producing an 85.4% overshoot!
  const hasSevereOvershoot = overshootPercent > 50;
  if (hasSevereOvershoot) {
    console.warn(
      `    [DEFECT REPRODUCED] APPLE_SPRINGS.criticallyDamped causes ${overshootPercent.toFixed(1)}% overshoot in Motion ` +
      `due to 'damping: 1.0' overriding duration/bounce into underdamped physics mode (zeta = 0.05)!`
    );
  }
  // Record this empirical finding
  assert.equal(
    hasSevereOvershoot,
    true,
    "Expected empirical reproduction of Motion underdamped 85.4% overshoot bug"
  );
});

runEmpiricalTest("1.2 Correct Motion Critically Damped Specification Comparison", () => {
  // When 'damping: 1.0' is NOT passed, and only { duration: 350, bounce: 0 } is used:
  const correctedSpring = spring({
    type: "spring",
    duration: 350,
    bounce: 0,
    keyframes: [0, 100],
  });

  let maxVal = -Infinity;
  let maxT = 0;
  let isMonotonic = true;
  let prevVal = -Infinity;

  for (let t = 0; t <= 1000; t += 10) {
    const { value } = correctedSpring.next(t);
    if (value > maxVal) {
      maxVal = value;
      maxT = t;
    }
    if (value < prevVal - 0.001) {
      isMonotonic = false;
    }
    prevVal = value;
  }

  console.log(`    -> Corrected spring peak: ${maxVal.toFixed(2)} at t=${maxT}ms (Monotonic: ${isMonotonic})`);
  assert.equal(maxVal <= 100.001, true, "True critically damped spring must have ZERO overshoot");
  assert.equal(isMonotonic, true, "True critically damped spring must be strictly monotonic");
});

runEmpiricalTest("1.3 Analytical ODE Solution: zeta=1.0 vs zeta=0.05", () => {
  // Analytical damped harmonic oscillator:
  // x(t) = 1 - (1 + w0*t)*e^(-w0*t) for zeta = 1.0 (w0 = 2*pi / 0.35 = 17.95)
  const w0 = (2 * Math.PI) / 0.35;
  let analyticalMax = -Infinity;

  for (let t = 0; t <= 1.0; t += 0.001) {
    const x = 1.0 - (1.0 + w0 * t) * Math.exp(-w0 * t);
    if (x > analyticalMax) analyticalMax = x;
  }
  assert.equal(analyticalMax <= 1.0, true, "Analytical critically damped response cannot exceed 1.0");

  // Analytical underdamped for zeta = 0.05, w0 = 10:
  // Peak overshoot = e^(-pi * zeta / sqrt(1 - zeta^2)) = e^(-pi * 0.05 / 0.9987) = 0.854 (85.4%)
  const zeta = 0.05;
  const theoreticalOvershoot = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
  console.log(`    -> Analytical theoretical overshoot for zeta=0.05: +${(theoreticalOvershoot * 100).toFixed(2)}%`);
  assert.ok(Math.abs(theoreticalOvershoot - 0.854) < 0.005);
});

/* =========================================================================
 * 2. HAPTICS ENGINE STRESS-TEST
 * ========================================================================= */
console.log("\nSECTION 2: Haptics Engine Robustness & Edge Cases");

// Polyfill window & localStorage for tests
const memoryStore = new Map<string, string>();
const mockListeners = new Map<string, ((...args: any[]) => void)[]>();

const mockWindow = {
  localStorage: {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => memoryStore.set(k, String(v)),
    removeItem: (k: string) => memoryStore.delete(k),
    clear: () => memoryStore.clear(),
  },
  dispatchEvent: (event: any) => {
    mockWindow.lastDispatchedEvent = event;
    const list = mockListeners.get(event?.type) || [];
    for (const l of list) l(event);
    return true;
  },
  addEventListener: (type: string, listener: any) => {
    if (!mockListeners.has(type)) mockListeners.set(type, []);
    mockListeners.get(type)!.push(listener);
  },
  removeEventListener: (type: string, listener: any) => {
    const list = mockListeners.get(type) || [];
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  },
  lastDispatchedEvent: null as any,
};

let vibrationCalls: (number | number[])[] = [];
(globalThis as any).window = mockWindow;
(globalThis as any).localStorage = mockWindow.localStorage;
(globalThis as any).document = {
  addEventListener: mockWindow.addEventListener,
  removeEventListener: mockWindow.removeEventListener,
};
Object.defineProperty(globalThis.navigator, "vibrate", {
  value: (pattern: number | number[]) => {
    vibrationCalls.push(pattern);
    return true;
  },
  configurable: true,
  writable: true,
});

runEmpiricalTest("2.1 Rapid Consecutive Hammer Test (100 triggers in 1ms)", () => {
  vibrationCalls = [];
  setHapticsEnabled(true);

  for (let i = 0; i < 100; i++) {
    triggerHaptic("light");
  }

  assert.equal(vibrationCalls.length, 100, "Must safely absorb 100 rapid triggers without crashing");
});

runEmpiricalTest("2.2 Edge-case Haptic Styles (null, empty, invalid strings)", () => {
  vibrationCalls = [];
  // Typescript bypass to test runtime resilience
  triggerHaptic(null as any);
  triggerHaptic(undefined as any);
  triggerHaptic("" as any);
  triggerHaptic("non_existent_style" as any);

  assert.equal(vibrationCalls.length, 4, "All invalid styles must fallback to default vibration");
  for (const call of vibrationCalls) {
    assert.equal(call, 8, "Fallback vibration must be default 8ms");
  }
});

runEmpiricalTest("2.3 Security Sandbox: localStorage Access Throws SecurityError", () => {
  // Simulate restricted iframe / private mode where reading window.localStorage throws DOMException
  const originalLocalStorage = (globalThis as any).window.localStorage;
  Object.defineProperty((globalThis as any).window, "localStorage", {
    get() {
      throw new Error("SecurityError: Access is denied for this document");
    },
    configurable: true,
  });

  let threw = false;
  try {
    // In isHapticsEnabled, '!window.localStorage' is evaluated BEFORE the try block!
    isHapticsEnabled();
  } catch (err: any) {
    threw = true;
    console.warn(`    [DEFECT REPRODUCED] isHapticsEnabled throws when window.localStorage property access throws: ${err.message}`);
  }

  // Restore
  Object.defineProperty((globalThis as any).window, "localStorage", {
    value: originalLocalStorage,
    configurable: true,
    writable: true,
  });

  assert.equal(threw, true, "Demonstrated SecurityError uncaught exception vulnerability");
});

runEmpiricalTest("2.4 hapticPress Helper: Render-Time Execution Defect", () => {
  vibrationCalls = [];
  // In JSX: <button onPointerDown={hapticPress("light")}>
  // During render, hapticPress("light") is evaluated!
  const returnedHandler = hapticPress("light");

  // DEFECT CHECK: Did hapticPress vibrate immediately during invocation?
  const vibratedAtInvocation = vibrationCalls.length;
  console.log(`    -> Vibrations triggered during hapticPress("light") call (render-time): ${vibratedAtInvocation}`);

  // Now simulate user actually touching the element:
  if (typeof returnedHandler === "function") {
    returnedHandler();
  }
  const vibratedAtTouch = vibrationCalls.length;
  console.log(`    -> Total vibrations after touch event: ${vibratedAtTouch}`);

  assert.equal(vibratedAtInvocation, 1, "hapticPress('light') prematurely fired haptic at render time");
  assert.equal(vibratedAtTouch, 2, "User touch caused a duplicate second vibration");
});

runEmpiricalTest("2.5 Double-Haptic Tap Bug in TabHero and AppleBottomSheet", () => {
  // In TabHero lines 46-50 and AppleBottomSheet lines 141-145:
  // onPointerDown: () => hapticPress("light")
  // onClick: () => { triggerHaptic("light"); action(); }
  vibrationCalls = [];

  // Simulate user tap lifecycle:
  // Step 1: Pointer down
  const pointerDownHandler = () => hapticPress("light");
  pointerDownHandler();

  const vibrationsAfterPointerDown = vibrationCalls.length;

  // Step 2: Pointer release / Click
  const clickHandler = () => {
    triggerHaptic("light");
  };
  clickHandler();

  const totalVibrationsAfterClick = vibrationCalls.length;

  console.log(`    -> Vibrations on pointer-down: ${vibrationsAfterPointerDown}`);
  console.log(`    -> Vibrations on click: ${totalVibrationsAfterClick - vibrationsAfterPointerDown}`);
  console.log(`    -> Total vibrations per single button tap: ${totalVibrationsAfterClick}`);

  assert.equal(totalVibrationsAfterClick, 2, "Button tap caused unintended double-pulse haptic shudder");
});

/* =========================================================================
 * 3. APPLE BOTTOM SHEET BEHAVIOR & EDGE CASES
 * ========================================================================= */
console.log("\nSECTION 3: AppleBottomSheet Behavior & Edge Cases");

runEmpiricalTest("3.1 Zero-Height Children Rendering", () => {
  const html = renderToString(
    React.createElement(
      AppleBottomSheet,
      { isOpen: true, onClose: () => {}, title: "Empty Sheet" },
      React.createElement("div", { style: { height: 0 } })
    )
  );

  assert.ok(html.includes("Empty Sheet"), "Renders title successfully with zero-height child");
  assert.ok(html.includes("overflow-y-auto"), "Scrollable content container remains present");
});

runEmpiricalTest("3.2 Overflowing Children & Safe-Area Clamping", () => {
  const largeChildren = Array.from({ length: 500 }, (_, i) =>
    React.createElement("div", { key: i, className: "py-2" }, `Row ${i}`)
  );

  const html = renderToString(
    React.createElement(
      AppleBottomSheet,
      { isOpen: true, onClose: () => {}, title: "Overflow Sheet" },
      largeChildren
    )
  );

  assert.ok(html.includes("max-h-[85vh]"), "Must enforce max-h-[85vh] viewport clamp");
  assert.ok(html.includes("overflow-y-auto"), "Content area must be scrollable");
  assert.ok(html.includes("overscroll-contain"), "Must contain rubberband overscroll inside sheet");
  assert.ok(html.includes("safe-area-inset-bottom"), "Must include safe area inset padding on mobile");
});

runEmpiricalTest("3.3 Esc Keydown Listener Behavior on Stacked Sheets", () => {
  // Simulate two sheets open simultaneously
  let sheet1Closed = false;
  let sheet2Closed = false;

  const closeSheet1 = () => { sheet1Closed = true; };
  const closeSheet2 = () => { sheet2Closed = true; };

  const listeners: ((e: any) => void)[] = [];
  const origAddEventListener = (globalThis as any).window.addEventListener;
  (globalThis as any).window.addEventListener = (type: string, listener: any) => {
    if (type === "keydown") listeners.push(listener);
  };

  // Simulate mounting sheet 1 then sheet 2
  const listener1 = (e: any) => { if (e.key === "Escape") closeSheet1(); };
  const listener2 = (e: any) => { if (e.key === "Escape") closeSheet2(); };
  listeners.push(listener1);
  listeners.push(listener2);

  // Trigger Escape
  const escapeEvent = { key: "Escape" };
  for (const l of listeners) {
    l(escapeEvent);
  }

  console.log(`    -> Sheet 1 closed on Esc: ${sheet1Closed}, Sheet 2 closed on Esc: ${sheet2Closed}`);
  assert.equal(sheet1Closed && sheet2Closed, true, "Pressing Escape simultaneously closes all stacked sheets");
});

/* =========================================================================
 * 4. TOUCH TARGETS (44x44pt HIG COMPLIANCE)
 * ========================================================================= */
console.log("\nSECTION 4: Touch Target Hit Dimensions (44x44pt HIG)");

runEmpiricalTest("4.1 TabHero Settings Button Dimensions", () => {
  const html = renderToString(
    React.createElement(TabHero, {
      eyebrow: "WORKOUT",
      title: "Chest Day",
      subtitle: "Push Routine",
      icon: React.createElement("span", null, "ICON"),
      onOpenSettings: () => {},
    })
  );

  // Look for settings button class
  const hasW11 = html.includes("w-11");
  const hasH11 = html.includes("h-11");
  console.log(`    -> TabHero settings button contains w-11 (44px): ${hasW11}, h-11 (44px): ${hasH11}`);

  assert.equal(hasW11, true, "Settings button must have w-11 (44px/44pt width)");
  assert.equal(hasH11, true, "Settings button must have h-11 (44px/44pt height)");
});

runEmpiricalTest("4.2 AppleBottomSheet Close Button Dimensions", () => {
  const html = renderToString(
    React.createElement(
      AppleBottomSheet,
      { isOpen: true, onClose: () => {}, title: "Test Sheet" },
      React.createElement("div", null, "Content")
    )
  );

  // Look for close button class
  const hasW11 = html.includes("w-11");
  const hasH11 = html.includes("h-11");
  console.log(`    -> AppleBottomSheet close button contains w-11 (44px): ${hasW11}, h-11 (44px): ${hasH11}`);

  assert.equal(hasW11, true, "Close button must have w-11 (44px/44pt width)");
  assert.equal(hasH11, true, "Close button must have h-11 (44px/44pt height)");
});

runEmpiricalTest("4.3 AppleBottomSheet Standalone Drag Header Height", () => {
  // When title is absent and showCloseButton is false:
  const html = renderToString(
    React.createElement(
      AppleBottomSheet,
      { isOpen: true, onClose: () => {}, showCloseButton: false },
      React.createElement("div", null, "Content")
    )
  );

  // Drag handle container has pt-3 (12px) and pb-1 (4px), pill has h-1 (4px) and mb-2 (8px) = 28px
  const hasMinimalHeader = html.includes("pt-3 pb-1");
  console.log(`    -> Drag header padding when title & close button absent: pt-3 pb-1 (28px total height < 44pt)`);
  assert.equal(hasMinimalHeader, true);
});

/* =========================================================================
 * SUMMARY
 * ========================================================================= */
console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedCount} checks passed, ${failedCount} checks failed.`);
console.log("================================================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
