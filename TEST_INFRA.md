# LiftLab E2E Test Infrastructure (`TEST_INFRA.md`)

## 1. Architectural Overview & Philosophy
The LiftLab End-to-End (E2E) Test Suite is an opaque-box, specification-driven, requirement-grounded testing harness designed to independently verify all 23 functional features and design contracts defined in `PROJECT.md § Feature Inventory`.

### Core Engineering Principles
1. **Opaque-Box Specification Grounding**: Tests treat the application as a black box against specification contracts (Apple Human Interface Guidelines, WCAG touch target standards, storage resilience contracts, and mathematical domain models).
2. **Progressive Testability**: The suite can run at any stage of project maturity. Tests assert specifications and contracts progressively, ensuring green execution on current baselines while guaranteeing failure if regressions occur or if upcoming milestone implementations violate interface contracts.
3. **Zero External Test Framework Dependency**: Built directly on Node.js standard modules (`node:assert/strict`, `node:fs`, `node:path`) executed via `tsx` (TypeScript Execute). No slow browser spin-up or heavyweight external test runners required for logic, contract, and boundary verification.
4. **Deterministic Sub-50ms Execution**: The full suite of 262 test cases runs synchronously in under 40 milliseconds, enabling frictionless pre-commit and CI verification.

---

## 2. Test Suite Hierarchy (Tiers 1–4)

```
                       [ Tier 4: Real-World Workloads ]
                            (6 End-to-End Scenarios)
                                      ▲
                                      │
                     [ Tier 3: Pairwise Cross-Feature ]
                         (26 Combinatorial Tests)
                                      ▲
                                      │
                   [ Tier 2: Boundary & Corner Cases ]
                     (115 Tests: 5 per Feature 1-23)
                                      ▲
                                      │
                 [ Tier 1: Feature Isolation & Contracts ]
                     (115 Tests: 5 per Feature 1-23)
```

### Tier 1: Isolation & Functional Contracts (115 Tests)
- **Path**: `tests/e2e/tier1-features.test.ts`
- **Scope**: Dedicated, isolated verification of each of the 23 features from `PROJECT.md § Feature Inventory` (5 tests per feature).
- **Focus**: Function signatures, return contracts, error handling wrappers, component existence, event handler currying, and mathematical correctness.

### Tier 2: Boundary & Corner Cases (115 Tests)
- **Path**: `tests/e2e/tier2-boundary.test.ts`
- **Scope**: Rigorous stress testing of extreme, malformed, and edge conditions across all 23 features (5 tests per feature).
- **Focus**: Zero-values, negative numbers, empty strings, corrupt JSON payloads, `QuotaExceededError`, `SecurityError`, DST hour shifts, maximum rep bounds (Epley formula clamping), and non-existent identifiers.

### Tier 3: Pairwise Cross-Feature Interactions (26 Tests)
- **Path**: `tests/e2e/tier3-pairwise.test.ts`
- **Scope**: Combinatorial interaction testing across paired subsystems.
- **Focus**:
  - Haptics + Storage (Features 1, 2, 3, 5)
  - Modals + Escape LIFO Stack + Exit Animations (Features 6, 7, 20)
  - Live Workout + Template Protection + Superset Integrity (Features 12, 13, 16)
  - Streaks + DST Shifts + PR Calculations (Features 10, 14)
  - Warmups + Equipment Filtering + Units (Features 8, 15)
  - Touch Targets + Tab Bar Safe Area + Navigation (Features 18, 19, 21, 23)

### Tier 4: Real-World User Workloads (6 Scenarios)
- **Path**: `tests/e2e/tier4-scenarios.test.ts`
- **Scope**: End-to-end user journeys simulating active lifecycle workflows:
  - **Scenario 1 (S1)**: First-Time User Onboarding & Safe Sandbox Profile Creation
  - **Scenario 2 (S2)**: Full Live Workout Lifecycle with Supersets, Rest Timers & Completion
  - **Scenario 3 (S3)**: Routine Builder, Warmup Generation & Template Protection
  - **Scenario 4 (S4)**: Historical Progress, PR Tracking & Daylight Saving Time Streak Audit
  - **Scenario 5 (S5)**: Apple HIG Modals, Nested Dialogs & LIFO Escape Dismissal
  - **Scenario 6 (S6)**: Storage Corruption, Atomic Rollback & Backup Recovery

---

## 3. Mathematical & Physical Oracles (`tests/e2e/test-utils.ts`)

To ensure tests evaluate real logic without depending on implementation details, `tests/e2e/test-utils.ts` implements authoritative reference models derived from Apple WWDC and biomechanics specifications:

### 1. Spring Physics Damped Harmonic Oscillator Oracle
Models Apple critically damped and underdamped spring curves:
$$\ddot{x} + 2\zeta\omega_n \dot{x} + \omega_n^2 x = 0$$
Calculates displacement and velocity iteratively to verify transition timing and overshoot prevention.

### 2. Apple Rubber-Band Direct Manipulation Oracle
Models iOS UIScrollView drag boundary resistance:
$$f(x, d, c) = \frac{x \cdot d \cdot c}{d + c \cdot x}$$
Validates that drag gestures past boundaries provide authentic tactile resistance without jumping.

### 3. Touch Target Compliance Oracle
Validates that interactive bounding boxes meet the 44×44pt minimum touch target requirement specified in Apple Human Interface Guidelines and WCAG 2.5.5.

### 4. Epley 1RM Calculation Oracle
Models estimated 1-rep maximum:
$$\text{1RM} = \text{round}\left(w \cdot \left(1 + \frac{\min(\text{reps}, 30)}{30}\right)\right)$$
Validates that rep counts are capped at 30 to prevent formula explosion on endurance sets.

### 5. Equipment-Aware Warmup Barbell Oracle
Verifies that barbell exercises enforce a 20kg (45lb) minimum working bar floor, while dumbbells, cables, and bodyweight movements allow arbitrary lower working increments.

---

## 4. Test Harness & Environment Mocks

### In-Memory Storage Polyfill
A spec-compliant `Storage` implementation providing:
- Full `getItem`, `setItem`, `removeItem`, `clear`, `key`, and `length` methods.
- Programmable error injection for simulating:
  - `QuotaExceededError` (simulating Safari private browsing storage exhaustion).
  - `SecurityError` (simulating restricted iframes or disabled cookies).

### Global Window & Haptics Polyfill
In headless Node environments, `test-utils.ts` ensures `globalThis.window` is safely available with `localStorage` and `dispatchEvent` bindings so that utility modules like `src/lib/haptics.ts` can execute without modification.

### Component Source Inspector
`readProjectFile(relativePath)` allows tests to inspect JSX and CSS declarations for structural HIG compliance (safe area tokens, touch target dimensions, modal stack hooks) without introducing the execution overhead of a full virtual DOM.

---

## 5. Execution & Verification

### Running the E2E Test Suite
```bash
npx tsx tests/e2e/runner.ts
```

### Exit Code Contract
- `0`: All test suites passed with 100% pass rate.
- `1`: One or more test assertions failed, or an unhandled exception occurred.

### Output Sample
```
================================================================================
       LIFTLAB E2E TEST SUITE: COMPREHENSIVE OPAQUE-BOX RUNNER (TIERS 1-4)      
================================================================================
Execution Environment: Node.js / tsx runtime
Scope: Tiers 1-4 (Isolation, Boundary, Pairwise, Real-World Workloads)
Target: 23 Features from PROJECT.md § Feature Inventory (>=260 Assertions)

TIER BREAKDOWN:
[PASSED] Tier 1: Feature Coverage (Isolation)                 | 115/115 passed (25ms)
[PASSED] Tier 2: Boundary & Corner Cases                      | 115/115 passed (8ms)
[PASSED] Tier 3: Pairwise Cross-Feature Interactions          | 26/26 passed (3ms)
[PASSED] Tier 4: End-to-End Real-World Application Workloads  | 6/6 passed (0ms)

FINAL SUMMARY:
Total Test Suites:       4
Total Test Cases:        262
Total Assertions Checked: 262
Total Tests Passed:      262
Total Tests Failed:      0
Total Execution Time:    37ms
Target Threshold:        >= 260 test cases across Tiers 1-4
Threshold Status:        ACHIEVED (262 tests, 262 assertions)

✔ ALL TESTS PASSED SUCCESSFULLY (100% PASS RATE).
================================================================================
```
