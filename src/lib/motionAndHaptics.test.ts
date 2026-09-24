/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { APPLE_SPRINGS, appleSpringDefault, appleSpringSheet, appleSpringSnappy } from "./motion";
import {
  triggerHaptic,
  hapticPress,
  isHapticsEnabled,
  setHapticsEnabled,
  HAPTICS_STORAGE_KEY,
} from "./haptics";

// Setup mock window & localStorage environment for headless testing
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, val: string): void {
    this.store.set(key, val);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const mockLocalStorage = new MemoryStorage();
let lastVibration: number | number[] | null = null;

(globalThis as any).window = {
  localStorage: mockLocalStorage,
  dispatchEvent: () => true,
};
(globalThis as any).localStorage = mockLocalStorage;

Object.defineProperty(globalThis.navigator, "vibrate", {
  value: (pattern: number | number[]) => {
    lastVibration = pattern;
    return true;
  },
  configurable: true,
  writable: true,
});

console.log("Running motion & haptics unit tests...");

// --- Motion Springs Tests ---
assert.equal(APPLE_SPRINGS.criticallyDamped.type, "spring");
assert.equal(APPLE_SPRINGS.criticallyDamped.damping, 1.0);
assert.equal(APPLE_SPRINGS.criticallyDamped.duration, 0.35);
assert.equal(APPLE_SPRINGS.criticallyDamped.bounce, 0);

assert.equal(APPLE_SPRINGS.sheet.type, "spring");
assert.equal(APPLE_SPRINGS.sheet.damping, 0.85);
assert.equal(APPLE_SPRINGS.sheet.duration, 0.32);
assert.equal(APPLE_SPRINGS.sheet.bounce, 0.05);

assert.equal(APPLE_SPRINGS.snappy.type, "spring");
assert.equal(APPLE_SPRINGS.snappy.damping, 1.0);
assert.equal(APPLE_SPRINGS.snappy.duration, 0.25);
assert.equal(APPLE_SPRINGS.snappy.bounce, 0);

assert.equal(APPLE_SPRINGS.bouncy.type, "spring");
assert.equal(APPLE_SPRINGS.bouncy.damping, 0.75);
assert.equal(APPLE_SPRINGS.bouncy.duration, 0.45);
assert.equal(APPLE_SPRINGS.bouncy.bounce, 0.18);

assert.deepEqual(appleSpringDefault, APPLE_SPRINGS.criticallyDamped);
assert.deepEqual(appleSpringSheet, APPLE_SPRINGS.sheet);
assert.deepEqual(appleSpringSnappy, APPLE_SPRINGS.snappy);

console.log("✓ APPLE_SPRINGS verified successfully");

// --- Haptics Persistence Tests ---
mockLocalStorage.clear();
assert.equal(isHapticsEnabled(), true, "Haptics should default to enabled");

setHapticsEnabled(false);
assert.equal(mockLocalStorage.getItem(HAPTICS_STORAGE_KEY), "false");
assert.equal(isHapticsEnabled(), false, "isHapticsEnabled should return false when disabled");

setHapticsEnabled(true);
assert.equal(mockLocalStorage.getItem(HAPTICS_STORAGE_KEY), "true");
assert.equal(isHapticsEnabled(), true, "isHapticsEnabled should return true when enabled");

console.log("✓ Haptics persistence verified successfully");

// --- Haptic Vibration Patterns Tests ---
lastVibration = null;
triggerHaptic("light");
assert.equal(lastVibration, 8, "Light haptic should vibrate 8ms");

lastVibration = null;
triggerHaptic("selection");
assert.equal(lastVibration, 5, "Selection haptic should vibrate 5ms");

lastVibration = null;
triggerHaptic("medium");
assert.equal(lastVibration, 16, "Medium haptic should vibrate 16ms");

lastVibration = null;
triggerHaptic("heavy");
assert.equal(lastVibration, 28, "Heavy haptic should vibrate 28ms");

lastVibration = null;
triggerHaptic("success");
assert.deepEqual(lastVibration, [12, 40, 24], "Success haptic should vibrate [12, 40, 24]");

lastVibration = null;
triggerHaptic("warning");
assert.deepEqual(lastVibration, [25, 50, 25], "Warning haptic should vibrate [25, 50, 25]");

lastVibration = null;
triggerHaptic("error");
assert.deepEqual(lastVibration, [40, 60, 40, 60, 40], "Error haptic should vibrate [40, 60, 40, 60, 40]");

// Test disabling haptics prevents vibration
setHapticsEnabled(false);
lastVibration = null;
triggerHaptic("heavy");
assert.equal(lastVibration, null, "Disabled haptics should not vibrate");

setHapticsEnabled(true);

console.log("✓ Haptic vibration patterns and disabling verified successfully");

// --- hapticPress Pointer-down Helper Tests ---
lastVibration = null;
const pressHandler = hapticPress("medium");
assert.equal(typeof pressHandler, "function", "hapticPress with style string should return a function");
assert.equal(lastVibration, 16, "hapticPress should trigger immediately on call");

lastVibration = null;
if (typeof pressHandler === "function") {
  pressHandler();
  assert.equal(lastVibration, 16, "Returned pressHandler should trigger medium haptic");
}

lastVibration = null;
hapticPress(undefined, "heavy");
assert.equal(lastVibration, 28, "hapticPress with event fallback should trigger defaultStyle");

console.log("✓ hapticPress helper verified successfully");

console.log("All motion & haptics unit tests passed successfully!");
