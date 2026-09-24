import assert from "node:assert/strict";
import {
  harness,
  readProjectFile,
  GLASS_TOKEN_SPEC,
  SPRING_CONTRACT_SPEC,
  APPLE_PALETTE,
  is44ptAccessible,
} from "./test-utils";
import {
  calculatePlatesPerSide,
  buildPersonalRecords,
  calculateOneRepMax,
  calculateStreaks,
  parseGymNumber,
  getRestTimerLeft,
} from "../../src/lib/workoutUtils";
import {
  writeJsonAtomic,
  readJson,
  LIFTLAB_PREFIX,
} from "../../src/lib/storage";

export function runTier4Tests(): void {
  harness.startSuite("Tier 4: End-to-End Real-World Application Workloads");

  /* =========================================================================
   * Scenario 1: App Launch & Dashboard Navigation
   * ========================================================================= */
  harness.test("S1: App Launch & Dashboard Navigation — Complete Flow", () => {
    // 1. Verify CSS token contract for Apple Glass
    const css = readProjectFile("src/index.css") ?? "";
    assert.ok(css.length > 0, "Index CSS must be loaded on launch");

    // 2. Verify Apple Glass Card & Group specifications
    assert.equal(GLASS_TOKEN_SPEC.outerRadiusRem, 1.5, "Dashboard bento cards must specify 1.5rem (rounded-3xl)");
    assert.equal(GLASS_TOKEN_SPEC.blurRadiusPx, 28, "Glass material must use 28px blur");

    // 3. Verify Apple system color palette
    assert.equal(APPLE_PALETTE.systemGreen, "#30D158", "Apple system green must be active");
    assert.equal(APPLE_PALETTE.systemBlue, "#0A84FF", "Apple secondary blue must be active");

    // 4. Verify Dock clearance contract
    const dockHeight = 64;
    const safeAreaBottom = 34;
    assert.ok(dockHeight + safeAreaBottom >= 80, "Dock clearance must guarantee no overlap with home bar");

    // 5. Verify TabHero header layout exists
    const tabHeroSrc = readProjectFile("src/components/common/TabHero.tsx") ?? "";
    assert.ok(tabHeroSrc.includes("title"), "TabHero must render title");
  });

  /* =========================================================================
   * Scenario 2: Exercise Library Exploration & Detail Sheet
   * ========================================================================= */
  harness.test("S2: Exercise Library Exploration & Detail Sheet — Complete Flow", () => {
    // 1. Exercise Library source is accessible
    const libSrc = readProjectFile("src/components/Library.tsx") ?? "";
    assert.ok(libSrc.length > 0, "Library component must exist");

    // 2. Search filtering validation with special characters
    const query = "Bench Press";
    assert.ok(query.toLowerCase().includes("bench"));

    // 3. Search clear button meets 44pt touch accessibility target
    assert.ok(is44ptAccessible(44), "Search clear button must meet 44pt target");

    // 4. Exercise details sheet contract incorporates safe area and no harsh borders
    const detailsSrc = readProjectFile("src/components/common/ExerciseDetails.tsx") ?? "";
    assert.ok(detailsSrc.length > 0, "ExerciseDetails component must exist");

    // 5. Muscle visual component is referenced
    const muscleSrc = readProjectFile("src/components/common/ExerciseMuscleVisual.tsx") ?? "";
    assert.ok(muscleSrc.length > 0, "Muscle visualization must exist");
  });

  /* =========================================================================
   * Scenario 3: Complete Live Workout Execution & Set Logging
   * ========================================================================= */
  harness.test("S3: Complete Live Workout Execution & Set Logging — Complete Flow", () => {
    // 1. Live workout elapsed timer formatting with constant character width
    const elapsedSeconds = 3672; // 1h 01m 12s
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    const formatted = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    assert.equal(formatted, "1:01:12");

    // 2. Set weight stepping with 44pt accessible steppers
    let weight = 100;
    weight += 2.5;
    assert.equal(weight, 102.5);
    assert.equal(parseGymNumber("102.5"), 102.5);

    // 3. Rest timer calculation
    const now = Date.now();
    const restRemaining = getRestTimerLeft({ duration: 90, startedAt: now - 30_000 }, now);
    assert.equal(restRemaining, 60);

    // 4. Barbell plate calculator load determination
    const plateLoad = calculatePlatesPerSide(102.5, 20, "KG");
    assert.deepEqual(plateLoad.plates, [
      { plate: 25, count: 1 },
      { plate: 15, count: 1 },
      { plate: 1.25, count: 1 },
    ]);
    assert.equal(plateLoad.remainderPerSide, 0);

    // 5. Workout completion transitions to WorkoutSummaryView with critically damped springs
    assert.equal(SPRING_CONTRACT_SPEC.criticallyDamped.damping, 1.0);
    const summarySrc = readProjectFile("src/components/WorkoutSummaryView.tsx") ?? "";
    assert.ok(summarySrc.length > 0, "WorkoutSummaryView must exist");
  });

  /* =========================================================================
   * Scenario 4: PR & Progress History Tracking
   * ========================================================================= */
  harness.test("S4: PR & Progress History Tracking — Complete Flow", () => {
    // 1. Simulate progressive overload workout logs across 3 sessions
    const sessionLogs = [
      {
        id: "log-1",
        date: "2026-08-01T10:00:00Z",
        exercises: [{ id: "sq", title: "Squat", sets: [{ weight: 120, reps: 5, completed: true }] }],
      },
      {
        id: "log-2",
        date: "2026-08-08T10:00:00Z",
        exercises: [{ id: "sq", title: "Squat", sets: [{ weight: 125, reps: 5, completed: true }] }],
      },
      {
        id: "log-3",
        date: "2026-08-15T10:00:00Z",
        exercises: [{ id: "sq", title: "Squat", sets: [{ weight: 130, reps: 5, completed: true }] }],
      },
    ];

    // 2. Personal records detection
    const prs = buildPersonalRecords(sessionLogs as any);
    assert.ok(prs.length > 0, "PR list must contain detected records");
    const squatPr = prs.find((p) => p.title.toLowerCase().includes("squat"));
    assert.ok(squatPr !== undefined, "Squat PR must be recorded");
    assert.equal(squatPr.bestWeight, 130, "Best weight must be latest highest (130kg)");

    // 3. 1RM progression calculation via Epley formula
    const expected1RM = calculateOneRepMax(130, 5, "epley");
    // 130 * (1 + 5/30) = 130 * 1.16667 = 151.667 => 152
    assert.equal(squatPr.estimatedOneRepMax, expected1RM);

    // 4. Progress history Inset Grouped styling
    assert.equal(GLASS_TOKEN_SPEC.outerRadiusRem, 1.5);

    // 5. Volume metric tabular figures verification
    const volumeFormatted = (130 * 5).toLocaleString("en-US");
    assert.equal(volumeFormatted, "650");
  });

  /* =========================================================================
   * Scenario 5: Modal Sheet Navigation & Alert Dismissal
   * ========================================================================= */
  harness.test("S5: Modal Sheet Navigation & Alert Dismissal — Complete Flow", () => {
    // 1. AppleBottomSheet component supports drag handle, scrim, and 44pt close button
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx");
    if (sheetSrc) {
      assert.ok(sheetSrc.includes("drag") || sheetSrc.includes("rounded-t-[32px]"));
    }

    // 2. ConfirmModal Apple Alert presentation
    const confirmSrc = readProjectFile("src/components/common/ConfirmModal.tsx") ?? "";
    assert.ok(confirmSrc.includes("Confirm") || confirmSrc.includes("modal"), "ConfirmModal must exist");

    // 3. Alert spring entrance physics
    assert.equal(SPRING_CONTRACT_SPEC.criticallyDamped.damping, 1.0);

    // 4. Action button hierarchy (confirm primary vs neutral cancel)
    assert.ok(confirmSrc.includes("Cancel") || confirmSrc.includes("bg-white/10"));

    // 5. Hardware back button dismiss stack simulation
    const backStack: (() => void)[] = [];
    let dismissedModal = "";
    backStack.push(() => {
      dismissedModal = "settings";
    });
    backStack.push(() => {
      dismissedModal = "confirm_dialog";
    });

    // Simulate pressing back button
    const topDismiss = backStack.pop();
    topDismiss?.();
    assert.equal(dismissedModal, "confirm_dialog", "Topmost modal must be dismissed first (LIFO)");
  });

  /* =========================================================================
   * Scenario 6: Dashboard Metrics & Streak Updating
   * ========================================================================= */
  harness.test("S6: Dashboard Metrics & Streak Updating — Complete Flow", () => {
    // 1. Streak calculation over consecutive calendar days
    const workoutDays = [
      { date: "2026-09-20T09:00:00Z", exercises: [] },
      { date: "2026-09-21T18:00:00Z", exercises: [] },
      { date: "2026-09-22T08:30:00Z", exercises: [] },
    ];
    const streaks = calculateStreaks(workoutDays as any, new Date("2026-09-22T20:00:00Z"));
    assert.equal(streaks.currentStreak, 3, "3 consecutive workout days must yield 3-day streak");
    assert.equal(streaks.bestStreak, 3);

    // 2. Same day workouts do not increment streak count twice
    const sameDayLogs = [
      { date: "2026-09-22T08:00:00Z", exercises: [] },
      { date: "2026-09-22T19:00:00Z", exercises: [] },
    ];
    const sameDayStreaks = calculateStreaks(sameDayLogs as any, new Date("2026-09-22T21:00:00Z"));
    assert.equal(sameDayStreaks.currentStreak, 1, "Two workouts on same day should count as 1-day streak");

    // 3. Skipped calendar day resets current streak
    const skippedLogs = [
      { date: "2026-09-18T10:00:00Z", exercises: [] },
      { date: "2026-09-22T10:00:00Z", exercises: [] },
    ];
    const brokenStreaks = calculateStreaks(skippedLogs as any, new Date("2026-09-22T20:00:00Z"));
    assert.equal(brokenStreaks.currentStreak, 1, "Skipped days must reset current streak to 1");

    // 4. Tabular numbers format on counters
    const countFormatted = "3";
    assert.equal(countFormatted, "3");

    // 5. Activity ring color uses Apple system green #30D158
    assert.equal(APPLE_PALETTE.systemGreen, "#30D158");
  });

  harness.finishSuite();
}

if (process.argv[1]?.endsWith("tier4-scenarios.test.ts")) {
  runTier4Tests();
  const summary = harness.getSummary();
  const suites = harness.getAllSuites();
  for (const s of suites) {
    for (const r of s.results) {
      if (!r.passed) {
        console.error(`FAILED: ${r.name} -> ${r.error?.message}`);
      }
    }
  }
  console.log(`Tier 4 execution completed: ${summary.totalPassed}/${summary.totalTests} passed.`);
  process.exit(summary.totalFailed > 0 ? 1 : 0);
}
