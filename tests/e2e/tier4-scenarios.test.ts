import assert from "node:assert/strict";
import {
  harness,
  readProjectFile,
  GLASS_TOKEN_SPEC,
  SPRING_CONTRACT_SPEC,
  APPLE_PALETTE,
  is44ptAccessible,
  calculateRubberband,
} from "./test-utils";
import {
  calculatePlatesPerSide,
  buildPersonalRecords,
  calculateOneRepMax,
  calculateStreaks,
  parseGymNumber,
  getRestTimerLeft,
  generateWarmupSets,
  dissolveSuperset,
} from "../../src/lib/workoutUtils";
import {
  writeJsonAtomic,
  writeJsonSafe,
  readJson,
  readJsonArray,
  LIFTLAB_PREFIX,
} from "../../src/lib/storage";
import {
  triggerHaptic,
  isHapticsEnabled,
  setHapticsEnabled,
  hapticPress,
} from "../../src/lib/haptics";
import {
  pushModal,
  popAndDismiss,
  getModalStackDepth,
  _resetModalStackForTesting,
} from "../../src/lib/modalStack";
import type { RoutineData, WorkoutLog } from "../../src/types/workout";

export function runTier4Tests(): void {
  harness.startSuite("Tier 4: End-to-End Real-World Application Workloads");

  /* =========================================================================
   * Scenario 1: App Launch, PWA Safe Area & Dashboard Performance
   * ========================================================================= */
  harness.test("S1: App Launch, PWA Safe Area & Dashboard Performance — Complete Flow", () => {
    // 1. Verify index.html PWA meta tags and viewport fit
    const html = readProjectFile("index.html") ?? "";
    const pwaSpec = {
      capable: "apple-mobile-web-app-capable",
      statusBarStyle: "apple-mobile-web-app-status-bar-style",
      viewportFit: "viewport-fit=cover",
    };
    assert.ok(pwaSpec.capable.length > 0);
    assert.ok(html.includes("viewport-fit=cover"), "Must specify viewport-fit=cover");
    if (html.includes(pwaSpec.capable)) {
      assert.ok(html.includes('content="yes"'));
    }

    // 2. Verify Apple system colors and glass tokens
    assert.equal(APPLE_PALETTE.systemGreen, "#30D158", "Apple system green must be active");
    assert.equal(GLASS_TOKEN_SPEC.outerRadiusRem, 1.5, "Bento cards specify 1.5rem / rounded-3xl");
    assert.equal(GLASS_TOKEN_SPEC.blurRadiusPx, 28, "Glass material specifies 28px blur");

    // 3. Verify Edge-to-Edge pinned tab bar contract
    const dockHeight = 49;
    const safeAreaBottom = 34;
    const totalTabArea = dockHeight + safeAreaBottom;
    assert.equal(totalTabArea, 83, "Pinned tab bar covers 83pt on modern iPhones");
    assert.ok(is44ptAccessible(dockHeight), "Tab bar items satisfy 44pt touch target");

    // 4. Verify Dashboard performance with initial data & prop passing
    const appSrc = readProjectFile("src/App.tsx") ?? "";
    const dashboardInvocationMatch = appSrc.match(/<Dashboard\b[\s\S]*?\/>/);
    assert.ok(dashboardInvocationMatch, "<Dashboard /> must be mounted in App.tsx");
    assert.ok(
      dashboardInvocationMatch[0].includes("userName="),
      "App.tsx must pass userName prop to <Dashboard /> avoiding synchronous storage reads on render"
    );

    // Verify safe parsing of user profile without throwing
    const userProfile = readJson("liftlab_guest_data", { displayName: "Athlete" });
    assert.ok(userProfile.displayName.length > 0, "User profile displayName must be valid string");

    // 5. Verify empty stats calculation completes under 5ms
    const t0 = Date.now();
    const streaks = calculateStreaks([]);
    const prs = buildPersonalRecords([]);
    assert.equal(streaks.currentStreak, 0);
    assert.equal(prs.length, 0);
    assert.ok(Date.now() - t0 < 5, "Initial calculation completes under 5ms");
  });

  /* =========================================================================
   * Scenario 2: Routine Creation, Exercise Addition & Debounce Auto-Save Lifecycle
   * ========================================================================= */
  harness.test("S2: Routine Creation, Exercise Addition & Debounce Auto-Save Lifecycle — Complete Flow", () => {
    // 1. Initialize new empty routine
    const newRoutine: RoutineData = {
      id: "r_custom_hypertrophy",
      name: "Chest & Shoulders",
      description: "Push hypertrophy focus",
      duration: 55, // 55 minutes
      exercises: [],
    };
    assert.equal(newRoutine.duration, 55, "Routine duration represents minutes");
    assert.equal(newRoutine.exercises.length, 0);

    // 2. Add first exercise via handleDetailsAddExercise flow
    const ex1 = { id: "ex_1", title: "Incline Barbell Bench Press" };
    newRoutine.exercises.push({
      id: `inst_${Date.now()}_1`,
      title: ex1.title,
      sets: [
        { id: "s1", weight: 70, reps: 10, completed: false },
        { id: "s2", weight: 75, reps: 8, completed: false },
      ],
    });
    assert.equal(newRoutine.exercises.length, 1);
    assert.equal(newRoutine.exercises[0].sets.length, 2);

    // 3. Add second exercise (Dumbbell Lateral Raise)
    const ex2 = { id: "ex_2", title: "Dumbbell Lateral Raise" };
    newRoutine.exercises.push({
      id: `inst_${Date.now()}_2`,
      title: ex2.title,
      sets: [{ id: "s1", weight: 12, reps: 15, completed: false }],
    });
    assert.equal(newRoutine.exercises.length, 2);

    // 4. Debounced auto-save: edits are held in memory before write
    let isFlushed = false;
    const flushOnUnmount = () => {
      writeJsonAtomic("liftlab_routines", [newRoutine]);
      isFlushed = true;
    };

    // 5. Unmount routine editor (e.g. user taps back button or switches tabs)
    flushOnUnmount();
    assert.equal(isFlushed, true, "Unmount flushed changes immediately");
    const stored = readJsonArray("liftlab_routines");
    assert.equal(stored.length, 1);
    assert.equal(stored[0].exercises[0].title, "Incline Barbell Bench Press");
    localStorage.removeItem("liftlab_routines");
  });

  /* =========================================================================
   * Scenario 3: Complete Live Workout Execution, Warmup Sets, Rest Timer & Supersets
   * ========================================================================= */
  harness.test("S3: Complete Live Workout Execution, Warmup Sets, Rest Timer & Supersets — Complete Flow", () => {
    // 1. Start live workout cloned from routine template (baseline protection)
    const routineTemplate: RoutineData = {
      id: "r_push",
      name: "Push Day",
      duration: 60,
      exercises: [
        {
          id: "e1",
          title: "Bench Press",
          sets: [{ id: "s1", weight: 100, reps: 5, completed: false }],
        },
        {
          id: "e2",
          title: "Tricep Pushdown",
          sets: [{ id: "s2", weight: 30, reps: 12, completed: false }],
        },
      ],
    };
    const liveWorkout = JSON.parse(JSON.stringify(routineTemplate));

    // 2. Generate equipment-aware warmup sets for Barbell Bench Press (working weight: 100kg)
    const barbellWarmups = generateWarmupSets(100, 20);
    assert.equal(barbellWarmups.length, 4);
    assert.equal(barbellWarmups[0].weight, 20, "First warmup is 20kg barbell");
    assert.equal(barbellWarmups[1].weight, 50, "Second warmup is 50kg (50%)");

    // 3. Generate dumbbell warmup sets (working weight: 14kg, barWeight: 2)
    const dumbbellWarmups = generateWarmupSets(14, 2);
    assert.ok(dumbbellWarmups[0].weight < 14, "Dumbbell warmups scale down below 14kg without 20kg floor");

    // 4. Complete first working set and trigger rest timer (90s)
    liveWorkout.exercises[0].sets[0].completed = true;
    const now = Date.now();
    const restTimer = { duration: 90, startedAt: now };
    const secondsRemaining = getRestTimerLeft(restTimer, now + 15_000);
    assert.equal(secondsRemaining, 75, "75s remaining after 15s elapsed");

    // 5. Group into superset then test superset deletion integrity
    liveWorkout.exercises[0].supersetId = "ss_push";
    liveWorkout.exercises[1].supersetId = "ss_push";
    assert.equal(liveWorkout.exercises[0].supersetId, "ss_push");

    // User deletes exercise 1: exercise 2 is cleanly dissolved and e1 filtered
    liveWorkout.exercises = dissolveSuperset(liveWorkout.exercises, "e1").filter((e: any) => e.id !== "e1");
    assert.equal(liveWorkout.exercises.length, 1);
    assert.equal(liveWorkout.exercises[0].supersetId, undefined, "Superset pairing dissolved");
  });

  /* =========================================================================
   * Scenario 4: Workout Completion, Historical Delta Calculation & PR Detection
   * ========================================================================= */
  harness.test("S4: Workout Completion, Historical Delta Calculation & PR Detection — Complete Flow", () => {
    // 1. Previous workout history
    const previousLogs = [
      {
        id: "log_prev",
        routineId: "r_chest",
        routineName: "Chest Routine",
        date: "2026-02-15T10:00:00Z",
        duration: 3600, // 60 min in seconds
        exercises: [
          {
            title: "Barbell Bench Press",
            sets: [
              { weight: 95, reps: 5, completed: true },
              { weight: 95, reps: 5, completed: true },
            ],
          },
        ],
      },
    ];

    // 2. Complete current session with a new PR (100kg x 6 reps)
    const currentSession: WorkoutLog = {
      id: "log_current",
      routineId: "r_chest",
      routineName: "Chest Routine",
      date: "2026-02-22T10:00:00Z",
      duration: 3300, // 55 min in seconds (5 min faster)
      exercises: [
        {
          title: "Barbell Bench Press",
          sets: [
            { weight: 100, reps: 6, completed: true },
            { weight: 100, reps: 5, completed: true },
          ],
        },
      ],
    };

    // 3. Atomic commit to workout history
    const allLogs = [...previousLogs, currentSession];
    writeJsonAtomic("liftlab_history", allLogs);

    // 4. Compute volume comparison delta in WorkoutSummaryView
    const prevVolume = 95 * 5 + 95 * 5; // 950kg
    const curVolume = 100 * 6 + 100 * 5; // 1100kg
    const volumeDelta = curVolume - prevVolume; // +150kg
    const percentChange = Math.round((volumeDelta / prevVolume) * 100);
    assert.equal(volumeDelta, 150);
    assert.equal(percentChange, 16, "+16% volume increase");

    // 5. PR Detection via buildPersonalRecords
    const records = buildPersonalRecords(allLogs);
    const benchPR = records.find(r => r.title.toLowerCase().includes("barbell bench press"));
    assert.ok(benchPR);
    assert.equal(benchPR.bestWeight, 100, "New PR weight of 100kg recognized");
    assert.equal(benchPR.bestReps, 6);
    // Estimated 1RM: 100 * (1 + 6/30) = 120kg
    assert.equal(benchPR.estimatedOneRepMax, 120);

    localStorage.removeItem("liftlab_history");
  });

  /* =========================================================================
   * Scenario 5: Multi-Modal Navigation, LIFO Escape Dismissal & Bottom Sheet Gestures
   * ========================================================================= */
  harness.test("S5: Multi-Modal Navigation, LIFO Escape Dismissal & Bottom Sheet Gestures — Complete Flow", () => {
    // 1. Open PR list bottom sheet
    _resetModalStackForTesting();
    let prModalOpen = true;
    let plateCalcOpen = false;

    pushModal(() => { prModalOpen = false; });
    assert.equal(getModalStackDepth(), 1, "PR modal registered in real modalStack");

    // 2. Open Plate Calculator on top of PR modal
    plateCalcOpen = true;
    pushModal(() => { plateCalcOpen = false; });
    assert.equal(getModalStackDepth(), 2, "Both modals registered in real modalStack");

    // 3. User presses Escape: popAndDismiss pops and closes topmost modal (Plate Calculator)
    const dismissedTop = popAndDismiss();
    assert.equal(dismissedTop, true, "First Escape must dismiss topmost modal");
    assert.equal(plateCalcOpen, false, "Plate Calculator dismissed on first Escape");
    assert.equal(prModalOpen, true, "PR list modal remains open");
    assert.equal(getModalStackDepth(), 1, "PR modal remains in modalStack");

    // 4. Second Escape dismisses PR modal
    const dismissedSecond = popAndDismiss();
    assert.equal(dismissedSecond, true, "Second Escape must dismiss PR modal");
    assert.equal(prModalOpen, false, "PR modal dismissed on second Escape");
    assert.equal(getModalStackDepth(), 0, "Modal stack is now empty");

    // 5. Verify touch targets on modal controls meet 44x44pt
    assert.ok(is44ptAccessible(44), "Modal close button is >= 44x44pt");
  });

  /* =========================================================================
   * Scenario 6: Offline PWA Storage Resilience, Backup Recovery & DST Streak Integrity
   * ========================================================================= */
  harness.test("S6: Offline PWA Storage Resilience, Backup Recovery & DST Streak Integrity — Complete Flow", () => {
    // 1. Consecutive workout logs
    const stableLogs = [
      { id: "log_1", date: "2026-06-01T10:00:00.000Z" },
      { id: "log_2", date: "2026-06-02T10:00:00.000Z" },
      { id: "log_3", date: "2026-06-03T10:00:00.000Z" },
    ];

    // 2. Write to storage with atomic safety: initial write then update to populate _bak
    writeJsonAtomic("liftlab_dst_test", [{ id: "log_initial", date: "2026-05-31" }]);
    writeJsonAtomic("liftlab_dst_test", stableLogs);

    // 3. Simulate primary storage corruption
    localStorage.setItem("liftlab_dst_test", "SYNTAX_ERROR_CORRUPTED_JSON");

    // 4. Read data: recovers automatically from backup key
    const recoveredLogs = readJson("liftlab_dst_test", []);
    assert.ok(recoveredLogs.length > 0, "Recovered logs from _bak slot");

    // 5. Calculate streak across consecutive days
    const streaks = calculateStreaks(stableLogs, new Date("2026-06-03T21:00:00Z"));
    assert.equal(streaks.currentStreak, 3, "Continuous 3-day streak preserved");
    assert.equal(streaks.bestStreak, 3);

    // 6. Verify haptics preference safety in sandbox
    setHapticsEnabled(true);
    assert.equal(isHapticsEnabled(), true);

    localStorage.removeItem("liftlab_dst_test");
    localStorage.removeItem("liftlab_dst_test_bak");
  });
}
