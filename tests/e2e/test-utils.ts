import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export interface TestCaseResult {
  name: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export interface TestSuiteResult {
  name: string;
  results: TestCaseResult[];
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}

export class TestHarness {
  private currentSuiteName = "Default Suite";
  private suites: TestSuiteResult[] = [];
  private currentSuiteResults: TestCaseResult[] = [];
  private suiteStartTime = 0;
  public totalAssertions = 0;

  startSuite(name: string): void {
    if (this.currentSuiteResults.length > 0) {
      this.finishSuite();
    }
    this.currentSuiteName = name;
    this.currentSuiteResults = [];
    this.suiteStartTime = Date.now();
  }

  test(name: string, fn: () => void | Promise<void>): void | Promise<void> {
    const start = Date.now();
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result
          .then(() => {
            this.totalAssertions++;
            this.currentSuiteResults.push({
              name,
              passed: true,
              durationMs: Date.now() - start,
            });
          })
          .catch((err) => {
            this.totalAssertions++;
            this.currentSuiteResults.push({
              name,
              passed: false,
              error: err instanceof Error ? err : new Error(String(err)),
              durationMs: Date.now() - start,
            });
          });
      }
      this.totalAssertions++;
      this.currentSuiteResults.push({
        name,
        passed: true,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.totalAssertions++;
      this.currentSuiteResults.push({
        name,
        passed: false,
        error: err instanceof Error ? err : new Error(String(err)),
        durationMs: Date.now() - start,
      });
    }
  }

  finishSuite(): TestSuiteResult {
    const passed = this.currentSuiteResults.filter((r) => r.passed).length;
    const failed = this.currentSuiteResults.filter((r) => !r.passed).length;
    const suiteRes: TestSuiteResult = {
      name: this.currentSuiteName,
      results: [...this.currentSuiteResults],
      passed,
      failed,
      total: this.currentSuiteResults.length,
      durationMs: Date.now() - this.suiteStartTime,
    };
    this.suites.push(suiteRes);
    this.currentSuiteResults = [];
    return suiteRes;
  }

  getAllSuites(): TestSuiteResult[] {
    if (this.currentSuiteResults.length > 0) {
      this.finishSuite();
    }
    return this.suites;
  }

  getSummary() {
    const all = this.getAllSuites();
    const totalTests = all.reduce((sum, s) => sum + s.total, 0);
    const totalPassed = all.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = all.reduce((sum, s) => sum + s.failed, 0);
    const totalDuration = all.reduce((sum, s) => sum + s.durationMs, 0);
    return {
      totalSuites: all.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      totalAssertions: this.totalAssertions,
      success: totalFailed === 0,
    };
  }
}

// Global harness singleton
export const harness = new TestHarness();

// Root path helper
export const ROOT_DIR = path.resolve(process.cwd());

// Polyfill localStorage for Node.js environment
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
    configurable: true,
    writable: true,
  });
}

export function readProjectFile(relPath: string): string | null {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
}

/* =========================================================================
 * Apple Design & iOS HIG Oracles (WWDC Specifications)
 * ========================================================================= */

/**
 * Apple Fluid Interfaces (WWDC 2018): Momentum Projection Formula
 * Endpoint = currentPosition + (velocity / 1000) * (deceleration / (1 - deceleration))
 * Default decelerationRate for normal scroll ≈ 0.998, 0.99 for snappier
 */
export function projectMomentum(
  initialVelocity: number, // px/s
  currentPosition = 0,
  decelerationRate = 0.998
): number {
  const travel =
    (initialVelocity / 1000) * (decelerationRate / (1 - decelerationRate));
  return currentPosition + travel;
}

/**
 * Apple WWDC Rubber-Band Resistance Formula (Damped edge boundary)
 * rubberband(overshoot, dimension, constant = 0.55)
 */
export function calculateRubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/**
 * Apple Spring Physics Harmonic Oscillator
 * Damped harmonic response: evaluates critically damped (damping = 1.0) vs underdamped.
 */
export function evaluateSpringOscillation(
  dampingRatio: number,
  angularFrequency: number,
  time: number
): { position: number; velocity: number } {
  // target = 1.0, starting from 0.0
  if (dampingRatio === 1.0) {
    // Critically damped: x(t) = 1 - (1 + w0*t)*e^(-w0*t)
    const decay = Math.exp(-angularFrequency * time);
    const pos = 1 - (1 + angularFrequency * time) * decay;
    const vel = angularFrequency * angularFrequency * time * decay;
    return { position: pos, velocity: vel };
  } else if (dampingRatio < 1.0) {
    // Underdamped
    const wd = angularFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
    const decay = Math.exp(-dampingRatio * angularFrequency * time);
    const pos =
      1 -
      decay *
        (Math.cos(wd * time) +
          ((dampingRatio * angularFrequency) / wd) * Math.sin(wd * time));
    return { position: pos, velocity: 0 };
  } else {
    // Overdamped
    return { position: 1, velocity: 0 };
  }
}

/**
 * Minimum Touch Target Standard (iOS HIG: 44x44pt)
 */
export function is44ptAccessible(dimensionPx: number): boolean {
  return dimensionPx >= 44;
}

/**
 * Apple System Colors
 */
export const APPLE_PALETTE = {
  systemGreen: "#30D158",
  systemBlue: "#0A84FF",
  systemRed: "#FF453A",
  systemGray: "#8E8E93",
  darkSurface: "rgba(28, 28, 30, 0.78)",
  insetHighlight: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)",
  legacyNeonLime: "#c3f400",
};

/**
 * Expected Glass Token Specifications
 */
export const GLASS_TOKEN_SPEC = {
  blurRadiusPx: 28,
  saturationPercent: 190,
  topRimHighlight: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)",
  outerRadiusRem: 1.5, // rounded-3xl = 24px = 1.5rem
  groupedRowRadiusRem: 1.0, // rounded-2xl = 16px = 1.0rem
  chipRadius: "rounded-full",
};

/**
 * Expected Spring Physics Configurations
 */
export const SPRING_CONTRACT_SPEC = {
  criticallyDamped: {
    type: "spring",
    damping: 1.0,
    duration: 0.35,
    bounce: 0,
  },
  sheet: {
    type: "spring",
    damping: 0.85,
    duration: 0.32,
    bounce: 0.05,
  },
  snappy: {
    type: "spring",
    damping: 1.0,
    duration: 0.25,
    bounce: 0,
  },
};
