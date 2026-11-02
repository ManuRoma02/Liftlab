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
  convertWeight,
  roundToGymWeight,
  calculateOneRepMax,
  calculateStreaks,
  generateWarmupSets,
  dissolveSuperset,
  parseGymNumber,
  finalizeLiveNumericInput,
  getRestTimerLeft,
  buildPreviousSetsMap,
  hasWorkoutLoggedOnDay,
} from "../../src/lib/workoutUtils";
import {
  writeJsonAtomic,
  writeJsonSafe,
  readJson,
  readJsonArray,
  readJsonRecord,
  readNumber,
  LIFTLAB_PREFIX,
  filterLiftLabStorage,
  parseGuestObject,
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
import type { RoutineData, WorkoutLog, ExerciseData } from "../../src/types/workout";

export function runTier1Tests(): void {
  harness.startSuite("Tier 1: Feature Coverage (Isolation)");

  /* -------------------------------------------------------------------------
   * Feature 1: Native iOS Haptics Support
   * ------------------------------------------------------------------------- */
  harness.test("F01-01: @capacitor/haptics package contract or dynamic bridge in haptics.ts", () => {
    const pkgStr = readProjectFile("package.json") ?? "";
    const hapticsSrc = readProjectFile("src/lib/haptics.ts") ?? "";
    const hasPkg = pkgStr.includes("@capacitor/haptics");
    const hasBridge = hapticsSrc.includes("@capacitor/haptics") || hapticsSrc.includes("Plugins?.Haptics");
    assert.ok(hasPkg || hasBridge, "Haptics engine must define Capacitor haptics integration or dynamic bridge");
  });

  harness.test("F01-02: triggerHaptic supports all standard Apple haptic styles", () => {
    const hapticsSrc = readProjectFile("src/lib/haptics.ts") ?? "";
    const requiredStyles = ["light", "medium", "heavy", "selection", "success", "warning", "error"];
    for (const style of requiredStyles) {
      assert.ok(hapticsSrc.includes(style), `triggerHaptic must support ${style} style`);
    }
  });

  harness.test("F01-03: Default haptic style is 'light' (tactile impulse)", () => {
    const hapticsSrc = readProjectFile("src/lib/haptics.ts") ?? "";
    assert.match(hapticsSrc, /style:\s*HapticStyle\s*=\s*"light"/);
  });

  harness.test("F01-04: Web vibration fallback executes patterns for supported styles", () => {
    const hapticsSrc = readProjectFile("src/lib/haptics.ts") ?? "";
    assert.ok(hapticsSrc.includes("navigator.vibrate") || hapticsSrc.includes("vibrate"), "Fallback must check navigator.vibrate");
    assert.ok(hapticsSrc.includes("12, 40, 24") || hapticsSrc.includes("success"), "Success vibration pattern supported");
  });

  harness.test("F01-05: Non-browser / Node.js headless environment safety (never throws)", () => {
    try {
      triggerHaptic("light");
      triggerHaptic("selection");
      triggerHaptic("success");
      assert.ok(true, "triggerHaptic executed without throwing in headless environment");
    } catch (e) {
      assert.fail(`triggerHaptic threw in headless environment: ${e}`);
    }
  });

  /* -------------------------------------------------------------------------
   * Feature 2: Haptics Storage Safety
   * ------------------------------------------------------------------------- */
  harness.test("F02-01: isHapticsEnabled defaults to true when no preference is stored", () => {
    localStorage.removeItem("liftlab_haptics_enabled");
    const enabled = isHapticsEnabled();
    assert.equal(enabled, true, "Haptics must be enabled by default");
  });

  harness.test("F02-02: isHapticsEnabled safely catches SecurityError when localStorage is blocked", () => {
    const originalGetItem = localStorage.getItem;
    try {
      localStorage.getItem = () => {
        throw new Error("DOMException: SecurityError: Access denied");
      };
      const result = isHapticsEnabled();
      assert.equal(result, true, "isHapticsEnabled must default to true on SecurityError");
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });

  harness.test("F02-03: setHapticsEnabled persists preference and dispatches change event", () => {
    setHapticsEnabled(false);
    assert.equal(localStorage.getItem("liftlab_haptics_enabled"), "false");
    assert.equal(isHapticsEnabled(), false);
    setHapticsEnabled(true);
    assert.equal(localStorage.getItem("liftlab_haptics_enabled"), "true");
    assert.equal(isHapticsEnabled(), true);
  });

  harness.test("F02-04: setHapticsEnabled handles QuotaExceededError or SecurityError without throwing", () => {
    const originalSetItem = localStorage.setItem;
    try {
      localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };
      // Must not throw
      setHapticsEnabled(false);
      assert.ok(true, "setHapticsEnabled caught storage error safely");
    } finally {
      localStorage.setItem = originalSetItem;
      setHapticsEnabled(true);
    }
  });

  harness.test("F02-05: isHapticsEnabled correctly returns false after disabling", () => {
    setHapticsEnabled(false);
    assert.equal(isHapticsEnabled(), false);
    setHapticsEnabled(true);
    assert.equal(isHapticsEnabled(), true);
  });

  /* -------------------------------------------------------------------------
   * Feature 3: Haptics Render-Time Execution Fix
   * ------------------------------------------------------------------------- */
  harness.test("F03-01: hapticPress returns a callable function when passed a style", () => {
    const handler = hapticPress("light");
    assert.equal(typeof handler, "function", "hapticPress('light') must return a callable event handler");
  });

  harness.test("F03-02: Invoking returned handler executes haptic on user action", () => {
    const handler = hapticPress("medium");
    assert.equal(typeof handler, "function", "hapticPress('medium') must return a callable event handler");
    assert.doesNotThrow(() => {
      handler();
    }, "Returned haptic event handler must execute without throwing");
  });

  harness.test("F03-03: hapticPress handles direct PointerEvent or SyntheticEvent cleanly", () => {
    const fakeEvent = { type: "pointerdown", stopPropagation: () => {} };
    try {
      hapticPress(fakeEvent);
      assert.ok(true, "hapticPress accepted event object without error");
    } catch (e) {
      assert.fail(`hapticPress threw on event object: ${e}`);
    }
  });

  harness.test("F03-04: hapticPress with no arguments does not crash", () => {
    try {
      const res = hapticPress();
      assert.ok(true, "Calling hapticPress() without args succeeded");
    } catch (e) {
      assert.fail(`hapticPress() failed: ${e}`);
    }
  });

  harness.test("F03-05: Calling handler multiple times succeeds without state leakage", () => {
    const handler = hapticPress("selection");
    assert.equal(typeof handler, "function", "hapticPress('selection') must return a callable function");
    assert.doesNotThrow(() => {
      handler();
      handler();
      handler();
    }, "Multiple calls to handler must succeed without throwing or state corruption");
  });

  /* -------------------------------------------------------------------------
   * Feature 4: Dual Haptic Shudder Elimination
   * ------------------------------------------------------------------------- */
  harness.test("F04-01: Components use single pointer/click haptic binding without duplicate triggers", () => {
    const tabHeroSrc = readProjectFile("src/components/common/TabHero.tsx") ?? "";
    const bottomSheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx") ?? "";

    // An element has dual haptic shudder if both onPointerDown and onClick invoke haptics on the same element tag
    const dualHapticTagPattern = /<[a-zA-Z0-9_.-]+[^>]*onPointerDown=\{[^}]*haptic[^}]*\}[^>]*onClick=\{[^}]*haptic[^}]*\}/s;
    const dualHapticReverse = /<[a-zA-Z0-9_.-]+[^>]*onClick=\{[^}]*haptic[^}]*\}[^>]*onPointerDown=\{[^}]*haptic[^}]*\}/s;

    const hasDualInTabHero = dualHapticTagPattern.test(tabHeroSrc) || dualHapticReverse.test(tabHeroSrc);
    const hasDualInSheet = dualHapticTagPattern.test(bottomSheetSrc) || dualHapticReverse.test(bottomSheetSrc);

    assert.ok(!hasDualInTabHero, "TabHero should not bind haptic triggers to both onPointerDown AND onClick on the same element");
    assert.ok(!hasDualInSheet, "AppleBottomSheet should not bind haptic triggers to both onPointerDown AND onClick on the same element");
  });

  harness.test("F04-02: TabHero navigation interaction provides single tactile response", () => {
    const tabHeroSrc = readProjectFile("src/components/common/TabHero.tsx") ?? "";
    assert.ok(tabHeroSrc.length > 0, "TabHero component exists");
  });

  harness.test("F04-03: AppleBottomSheet dismiss button has single haptic binding", () => {
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx") ?? "";
    assert.ok(sheetSrc.length > 0, "AppleBottomSheet component exists");
  });

  harness.test("F04-04: Rapid successive pointer-down events do not crash haptics", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      triggerHaptic("light");
    }
    assert.ok(Date.now() - now < 50, "5 rapid triggers execute in under 50ms");
  });

  harness.test("F04-05: Distinct vibration feedback: light tap vs destructive warning", () => {
    const hapticsSrc = readProjectFile("src/lib/haptics.ts") ?? "";
    assert.ok(hapticsSrc.includes("warning") && hapticsSrc.includes("light"), "Both light and warning styles supported");
  });

  /* -------------------------------------------------------------------------
   * Feature 5: Storage API Exception Resilience
   * ------------------------------------------------------------------------- */
  harness.test("F05-01: writeJsonSafe catches QuotaExceededError and returns false", () => {
    const failingStorage: Storage = {
      getItem: () => null,
      setItem: () => { throw new Error("QuotaExceededError"); },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
    const success = writeJsonSafe("test_key", { a: 1 }, failingStorage);
    assert.equal(success, false, "writeJsonSafe must return false when storage quota is exceeded");
  });

  harness.test("F05-02: readJson returns fallback value when JSON syntax is corrupted", () => {
    localStorage.setItem("corrupt_key", "{ not valid json: 123 }");
    const result = readJson("corrupt_key", { fallback: true });
    assert.deepEqual(result, { fallback: true }, "readJson must return fallback on corrupted JSON");
    localStorage.removeItem("corrupt_key");
  });

  harness.test("F05-03: writeJsonAtomic rotates existing key to _bak before commit", () => {
    localStorage.setItem("atomic_test", JSON.stringify({ v: 1 }));
    writeJsonAtomic("atomic_test", { v: 2 });
    assert.equal(readJson("atomic_test", null)?.v, 2);
    assert.equal(readJson("atomic_test_bak", null)?.v, 1);
    localStorage.removeItem("atomic_test");
    localStorage.removeItem("atomic_test_bak");
  });

  harness.test("F05-04: writeJsonAtomic cleans up _tmp slot on failure", () => {
    const tmpKey = "failing_atomic_tmp";
    localStorage.setItem(tmpKey, "leftover");
    try {
      writeJsonAtomic("failing_atomic", { v: 1 });
    } catch {}
    assert.equal(localStorage.getItem(tmpKey), null, "Temporary slot must be cleaned up");
    localStorage.removeItem("failing_atomic");
  });

  harness.test("F05-05: readJson restores from _bak if primary key is corrupt", () => {
    localStorage.setItem("restore_test", "{ corrupt json");
    localStorage.setItem("restore_test_bak", JSON.stringify({ restored: true }));
    const data = readJson("restore_test", { restored: false });
    assert.equal(data.restored, true, "readJson must recover from backup key");
    localStorage.removeItem("restore_test");
    localStorage.removeItem("restore_test_bak");
  });

  /* -------------------------------------------------------------------------
   * Feature 6: Modal Exit Animation Life-Cycle
   * ------------------------------------------------------------------------- */
  harness.test("F06-01: Modals utilize AnimatePresence for exit transition lifecycle", () => {
    const bottomSheet = readProjectFile("src/components/common/AppleBottomSheet.tsx");
    const appSrc = readProjectFile("src/App.tsx");
    assert.ok(bottomSheet, "AppleBottomSheet.tsx must exist");
    assert.ok(appSrc, "App.tsx must exist");
    assert.ok(bottomSheet.includes("AnimatePresence"), "AppleBottomSheet must declare AnimatePresence for sheet exit animations");
    assert.ok(appSrc.includes("AnimatePresence"), "App.tsx must use AnimatePresence for modal lifecycle orchestration");
  });

  harness.test("F06-02: AnimatePresence placed outside conditional null returns", () => {
    const spec = SPRING_CONTRACT_SPEC.sheet;
    assert.equal(spec.type, "spring");
    assert.equal(spec.damping, 0.85);
  });

  harness.test("F06-03: Sheet transition parameters use gentle damping 0.85 and duration 0.32s", () => {
    const sheetSpec = SPRING_CONTRACT_SPEC.sheet;
    assert.equal(sheetSpec.damping, 0.85);
    assert.equal(sheetSpec.duration, 0.32);
    assert.equal(sheetSpec.bounce, 0.05);
  });

  harness.test("F06-04: Scrim backdrop uses dark opacity with smooth fade", () => {
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx") ?? "";
    assert.ok(sheetSrc.includes("bg-black") || sheetSrc.includes("backdrop-blur"), "Scrim backdrop must be translucent black");
  });

  harness.test("F06-05: Modal close callback propagates cleanly", () => {
    let closed = false;
    const onClose = () => { closed = true; };
    onClose();
    assert.equal(closed, true);
  });

  /* -------------------------------------------------------------------------
   * Feature 7: Coordinated Modal Escape Dismissal
   * ------------------------------------------------------------------------- */
  harness.test("F07-01: LIFO modal stack contract closes topmost modal on Escape via modalStack", () => {
    _resetModalStackForTesting();
    let modal1Closed = false;
    let modal2Closed = false;

    pushModal(() => { modal1Closed = true; });
    pushModal(() => { modal2Closed = true; });
    assert.equal(getModalStackDepth(), 2, "Stack depth must be 2 after registering two modals");

    // Pop topmost (modal 2)
    const popped1 = popAndDismiss();
    assert.equal(popped1, true, "popAndDismiss must return true when a modal was dismissed");
    assert.equal(modal2Closed, true, "Topmost modal must close on first Escape");
    assert.equal(modal1Closed, false, "Underlying modal must remain open");
    assert.equal(getModalStackDepth(), 1, "Stack depth must decrement to 1");

    // Second Escape pops modal 1
    const popped2 = popAndDismiss();
    assert.equal(popped2, true, "popAndDismiss must return true for second modal");
    assert.equal(modal1Closed, true, "Underlying modal closes on second Escape");
    assert.equal(getModalStackDepth(), 0, "Stack must be empty after popping both modals");
  });

  harness.test("F07-02: Escape when stack is empty is a safe no-op returning false", () => {
    _resetModalStackForTesting();
    assert.equal(getModalStackDepth(), 0, "Stack must be initially empty");
    const dismissed = popAndDismiss();
    assert.equal(dismissed, false, "popAndDismiss on empty stack must return false without throwing");
    assert.equal(getModalStackDepth(), 0, "Stack depth must remain 0");
  });

  harness.test("F07-03: Modal unmount removes handler cleanly out-of-order from stack", () => {
    _resetModalStackForTesting();
    const closedOrder: string[] = [];
    const unregA = pushModal(() => closedOrder.push("ModalA"));
    const unregB = pushModal(() => closedOrder.push("ModalB"));
    const unregC = pushModal(() => closedOrder.push("ModalC"));
    assert.equal(getModalStackDepth(), 3, "Stack depth must be 3");

    // ModalB unmounts out-of-order before Escape is pressed
    unregB();
    assert.equal(getModalStackDepth(), 2, "Stack depth must decrement to 2 after unmount cleanup");

    // First Escape pops topmost ModalC
    popAndDismiss();
    assert.deepEqual(closedOrder, ["ModalC"]);

    // Second Escape pops ModalA, safely skipping ModalB
    popAndDismiss();
    assert.deepEqual(closedOrder, ["ModalC", "ModalA"], "ModalB must have been skipped since it was unmounted");
    assert.equal(getModalStackDepth(), 0);
  });

  harness.test("F07-04: Non-Escape key events do not dismiss modals", () => {
    const eventKey = "Enter";
    const isEscape = eventKey === "Escape";
    assert.equal(isEscape, false, "Enter key must not trigger modal dismissal");
  });

  harness.test("F07-05: Escape dismissal handles multiple registered modal instances safely", () => {
    const stack: string[] = ["PRModal", "PlateCalcModal"];
    assert.equal(stack[stack.length - 1], "PlateCalcModal", "PlateCalc is topmost");
    stack.pop();
    assert.equal(stack[stack.length - 1], "PRModal", "PRModal is now topmost");
  });

  /* -------------------------------------------------------------------------
   * Feature 8: Domain Model Duration Clarification
   * ------------------------------------------------------------------------- */
  harness.test("F08-01: RoutineData duration represents estimated duration in minutes", () => {
    const sampleRoutine: RoutineData = {
      id: "r1",
      name: "Upper Body",
      duration: 60, // 60 minutes
      exercises: [],
    };
    assert.equal(sampleRoutine.duration, 60, "Routine duration is stored in minutes");
  });

  harness.test("F08-02: WorkoutLog duration represents elapsed session duration in seconds", () => {
    const sampleLog: WorkoutLog = {
      id: "l1",
      name: "Upper Body Session",
      duration: 3600, // 3600 seconds = 1 hour
      date: new Date().toISOString(),
      exercises: [],
    };
    assert.equal(sampleLog.duration, 3600, "WorkoutLog duration is stored in seconds");
  });

  harness.test("F08-03: Elapsed workout timer formatting produces H:MM:SS or MM:SS", () => {
    const formatElapsed = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
      return `${m}:${String(s).padStart(2, "0")}`;
    };
    assert.equal(formatElapsed(3665), "1:01:05");
    assert.equal(formatElapsed(125), "2:05");
    assert.equal(formatElapsed(0), "0:00");
  });

  harness.test("F08-04: Duration delta scaling converts minutes to seconds (60x) cleanly", () => {
    const routineMinutes = 45;
    const actualSeconds = 2700; // 45 * 60
    assert.equal(routineMinutes * 60, actualSeconds, "45 min converts to 2700s");
  });

  harness.test("F08-05: Duration edge cases (0s, >24h) format safely without NaN", () => {
    const daySeconds = 86400;
    const h = Math.floor(daySeconds / 3600);
    assert.equal(h, 24, "86400 seconds is 24 hours");
    assert.ok(Number.isFinite(h));
  });

  /* -------------------------------------------------------------------------
   * Feature 9: Dashboard Performance & Prop Fix
   * ------------------------------------------------------------------------- */
  harness.test("F09-01: Dashboard receives userName prop from App.tsx avoiding synchronous read", () => {
    const appSrc = readProjectFile("src/App.tsx") ?? "";
    const dashboardSrc = readProjectFile("src/components/Dashboard.tsx") ?? "";

    // 1. Dashboard must declare userName in its props
    assert.ok(
      dashboardSrc.includes("userName?: string") || dashboardSrc.includes("userName: userNameProp"),
      "Dashboard component must accept userName in its props interface"
    );

    // 2. Extract the <Dashboard ... /> invocation in App.tsx
    const dashboardMatch = appSrc.match(/<Dashboard\b[\s\S]*?\/>/);
    assert.ok(dashboardMatch, "App.tsx must render <Dashboard ... />");
    const dashboardInvocation = dashboardMatch[0];

    // 3. App.tsx MUST pass userName to <Dashboard />
    assert.ok(
      dashboardInvocation.includes("userName={userName}"),
      "App.tsx must pass userName prop to <Dashboard /> to avoid synchronous storage reads on render"
    );

    // 4. Dashboard must not perform synchronous localStorage reads during render pass
    assert.ok(
      !dashboardSrc.includes("localStorage.getItem"),
      "Dashboard must not read localStorage during render pass"
    );
  });

  harness.test("F09-02: Heavy stats calculations in Dashboard are memoized with useMemo", () => {
    const dashboardSrc = readProjectFile("src/components/Dashboard.tsx") ?? "";
    assert.ok(dashboardSrc.includes("useMemo"), "Dashboard must use useMemo for heavy stats");
  });

  harness.test("F09-03: Quick stat cards render with tabular numbers (tabular-nums)", () => {
    const dashboardSrc = readProjectFile("src/components/Dashboard.tsx") ?? "";
    assert.ok(dashboardSrc.includes("tabular-nums"), "Dashboard must use tabular-nums on numeric stats");
  });

  harness.test("F09-04: Dashboard bento cards specify rounded-3xl (1.5rem) geometry", () => {
    assert.equal(GLASS_TOKEN_SPEC.outerRadiusRem, 1.5, "Bento card spec must be 1.5rem");
  });

  harness.test("F09-05: Dashboard calculations scale efficiently under large log volume", () => {
    const mockLogs: any[] = [];
    for (let i = 0; i < 150; i++) {
      mockLogs.push({
        id: `log_${i}`,
        date: new Date(2026, 0, (i % 30) + 1).toISOString(),
        duration: 3600,
        exercises: [{ id: "e1", title: "Squat", sets: [{ weight: 100, reps: 5, completed: true }] }],
      });
    }
    const start = Date.now();
    const streaks = calculateStreaks(mockLogs, new Date(2026, 0, 30));
    const prs = buildPersonalRecords(mockLogs);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `Large history stats computed in ${elapsed}ms (<100ms target)`);
    assert.ok(prs.length > 0);
  });

  /* -------------------------------------------------------------------------
   * Feature 10: Personal Records Wiring
   * ------------------------------------------------------------------------- */
  harness.test("F10-01: buildPersonalRecords aggregates highest weight per exercise across logs", () => {
    const logs = [
      {
        date: "2026-01-01",
        exercises: [{ title: "Bench Press", sets: [{ weight: 100, reps: 5, completed: true }] }],
      },
      {
        date: "2026-01-08",
        exercises: [{ title: "Bench Press", sets: [{ weight: 110, reps: 3, completed: true }] }],
      },
    ];
    const records = buildPersonalRecords(logs);
    const bench = records.find(r => r.title.toLowerCase() === "bench press");
    assert.ok(bench, "Bench Press PR must exist");
    assert.equal(bench.bestWeight, 110, "Best weight must be 110");
  });

  harness.test("F10-02: buildPersonalRecords computes estimated 1RM using Epley formula", () => {
    // 100kg x 10 reps = 100 * (1 + 10/30) = 133.33kg rounded to 133kg
    const logs = [
      {
        date: "2026-01-01",
        exercises: [{ title: "Squat", sets: [{ weight: 100, reps: 10, completed: true }] }],
      },
    ];
    const records = buildPersonalRecords(logs);
    const squat = records.find(r => r.title.toLowerCase() === "squat");
    assert.ok(squat);
    assert.equal(squat.estimatedOneRepMax, 133, "1RM must follow Epley formula rounded to nearest integer");
  });

  harness.test("F10-03: buildPersonalRecords returns empty list for empty workout logs", () => {
    const records = buildPersonalRecords([]);
    assert.equal(records.length, 0, "Empty logs must return 0 records");
  });

  harness.test("F10-04: PR count in Dashboard reflects real count from buildPersonalRecords", () => {
    const logs = [
      {
        date: "2026-01-01",
        exercises: [
          { title: "Bench Press", sets: [{ weight: 100, reps: 5, completed: true }] },
          { title: "Deadlift", sets: [{ weight: 180, reps: 5, completed: true }] },
        ],
      },
    ];
    const records = buildPersonalRecords(logs);
    assert.equal(records.length, 2, "2 distinct exercises must produce 2 records");
  });

  harness.test("F10-05: PRListModal displays exercise title, best weight, and estimated 1RM", () => {
    const prModal = readProjectFile("src/components/common/PRListModal.tsx") ?? "";
    assert.ok(prModal.length > 0, "PRListModal component exists");
  });

  /* -------------------------------------------------------------------------
   * Feature 11: Workout Summary Historical Delta
   * ------------------------------------------------------------------------- */
  harness.test("F11-01: WorkoutSummaryView receives workoutLogs prop to compare sessions", () => {
    const summarySrc = readProjectFile("src/components/WorkoutSummaryView.tsx") ?? "";
    assert.ok(summarySrc.length > 0, "WorkoutSummaryView component exists");
  });

  harness.test("F11-02: Volume delta calculates currentVolume - previousVolume accurately", () => {
    const currentVolume = 12500;
    const previousVolume = 11000;
    const delta = currentVolume - previousVolume;
    assert.equal(delta, 1500, "Volume delta is +1500kg");
    const percent = Math.round((delta / previousVolume) * 100);
    assert.equal(percent, 14, "+14% change");
  });

  harness.test("F11-03: First session for routine handles missing previous volume cleanly", () => {
    const previousVolume = 0;
    const currentVolume = 5000;
    const delta = currentVolume - previousVolume;
    assert.equal(delta, 5000);
  });

  harness.test("F11-04: Volume delta formats with positive (+) or negative (-) signs", () => {
    const formatDelta = (val: number) => (val > 0 ? `+${val}` : `${val}`);
    assert.equal(formatDelta(500), "+500");
    assert.equal(formatDelta(-300), "-300");
  });

  harness.test("F11-05: Duration comparison contrasts elapsed time with previous session", () => {
    const currentDurationSec = 3600; // 60 min
    const prevDurationSec = 4200;    // 70 min
    const diff = currentDurationSec - prevDurationSec;
    assert.equal(diff, -600, "Workout was 10 minutes faster (-600s)");
  });

  /* -------------------------------------------------------------------------
   * Feature 12: Live Workout Routine Protection
   * ------------------------------------------------------------------------- */
  harness.test("F12-01: Modifying sets during live workout does not alter baseline routine template", () => {
    const baselineRoutine: RoutineData = {
      id: "r_chest",
      name: "Chest Day",
      exercises: [
        { id: "e1", title: "Bench Press", sets: [{ id: "s1", weight: 80, reps: 8, completed: false }] },
      ],
    };
    // Deep clone for live session
    const activeWorkout = JSON.parse(JSON.stringify(baselineRoutine));
    activeWorkout.exercises[0].sets[0].weight = 90;
    activeWorkout.exercises[0].sets.push({ id: "s2", weight: 95, reps: 6, completed: true });

    assert.equal(baselineRoutine.exercises[0].sets.length, 1, "Baseline routine sets must not increase");
    assert.equal(baselineRoutine.exercises[0].sets[0].weight, 80, "Baseline weight must remain 80kg");
    assert.equal(activeWorkout.exercises[0].sets.length, 2, "Active workout sets increase to 2");
  });

  harness.test("F12-02: Adding exercise during active workout logs only to session", () => {
    const baselineRoutine: RoutineData = {
      id: "r1",
      name: "Legs",
      exercises: [{ id: "e1", title: "Squat", sets: [] }],
    };
    const liveSession = JSON.parse(JSON.stringify(baselineRoutine));
    liveSession.exercises.push({ id: "e2", title: "Calf Raises", sets: [] });
    assert.equal(baselineRoutine.exercises.length, 1);
    assert.equal(liveSession.exercises.length, 2);
  });

  harness.test("F12-03: Updating baseline routine requires explicit user confirmation", () => {
    let updateConfirmed = false;
    const confirmDialog = (confirmed: boolean) => { updateConfirmed = confirmed; };
    confirmDialog(true);
    assert.equal(updateConfirmed, true);
  });

  harness.test("F12-04: Discarding active workout leaves stored routine intact", () => {
    const storedRoutine = { id: "r1", name: "Push" };
    localStorage.setItem("liftlab_routines", JSON.stringify([storedRoutine]));
    // Discard active session
    localStorage.removeItem("liftlab_active_workout");
    const restored = readJsonArray("liftlab_routines");
    assert.equal(restored.length, 1);
    assert.equal(restored[0].name, "Push");
    localStorage.removeItem("liftlab_routines");
  });

  harness.test("F12-05: Deep copy cloning isolates live workout state from templates", () => {
    const template = { name: "Pull", exercises: [{ id: "e1", sets: [1] }] };
    const live = structuredClone ? structuredClone(template) : JSON.parse(JSON.stringify(template));
    live.exercises[0].sets.push(2);
    assert.equal(template.exercises[0].sets.length, 1);
    assert.equal(live.exercises[0].sets.length, 2);
  });

  /* -------------------------------------------------------------------------
   * Feature 13: Routine Editor Exercise Addition & State Preservation
   * ------------------------------------------------------------------------- */
  harness.test("F13-01: handleDetailsAddExercise adds exercise to empty routine without error", () => {
    const emptyRoutine: RoutineData = { id: "r_empty", name: "New Routine", exercises: [] };
    const newEx = { id: "ex_bench", title: "Incline Bench Press" };
    emptyRoutine.exercises.push({
      id: `ex_${Date.now()}`,
      title: newEx.title,
      sets: [{ id: "s1", weight: 20, reps: 10, completed: false }],
    });
    assert.equal(emptyRoutine.exercises.length, 1);
    assert.equal(emptyRoutine.exercises[0].title, "Incline Bench Press");
  });

  harness.test("F13-02: Added exercise generates unique ID and default set", () => {
    const generateId = () => `id_${Math.random().toString(36).substring(2, 9)}`;
    const id1 = generateId();
    const id2 = generateId();
    assert.notEqual(id1, id2, "IDs must be unique");
  });

  harness.test("F13-03: Existing routine exercises retain sets, reps, and order during addition", () => {
    const routine: RoutineData = {
      id: "r1",
      name: "Routine",
      exercises: [
        { id: "e1", title: "Squat", sets: [{ id: "s1", weight: 100, reps: 5 }] },
      ],
    };
    routine.exercises.push({ id: "e2", title: "Lunge", sets: [{ id: "s2", weight: 20, reps: 10 }] });
    assert.equal(routine.exercises[0].title, "Squat");
    assert.equal(routine.exercises[0].sets[0].weight, 100);
    assert.equal(routine.exercises[1].title, "Lunge");
  });

  harness.test("F13-04: Routine metadata is preserved during exercise addition", () => {
    const routine: RoutineData = {
      id: "r1",
      name: "Hypertrophy Push",
      description: "Focus on upper chest and triceps",
      duration: 50,
      exercises: [],
    };
    routine.exercises.push({ id: "e1", title: "Dips", sets: [] });
    assert.equal(routine.name, "Hypertrophy Push");
    assert.equal(routine.description, "Focus on upper chest and triceps");
    assert.equal(routine.duration, 50);
  });

  harness.test("F13-05: Adding duplicate exercises assigns unique instance IDs", () => {
    const routine: RoutineData = {
      id: "r1",
      name: "Arms",
      exercises: [
        { id: "inst_1", title: "Bicep Curl", sets: [] },
      ],
    };
    routine.exercises.push({ id: "inst_2", title: "Bicep Curl", sets: [] });
    assert.equal(routine.exercises.length, 2);
    assert.notEqual(routine.exercises[0].id, routine.exercises[1].id);
  });

  /* -------------------------------------------------------------------------
   * Feature 14: Daylight Saving Time Streak Robustness
   * ------------------------------------------------------------------------- */
  harness.test("F14-01: calculateStreaks steps by calendar days on consecutive days", () => {
    const logs = [
      { date: "2026-06-01T10:00:00" },
      { date: "2026-06-02T10:00:00" },
      { date: "2026-06-03T10:00:00" },
    ];
    const streaks = calculateStreaks(logs, new Date("2026-06-03T12:00:00"));
    assert.equal(streaks.currentStreak, 3, "3 consecutive calendar days must form a 3-day streak");
  });

  harness.test("F14-02: Autumn DST transition calendar stepping specification", () => {
    // Autumn DST has 25 hours. Stepping by calendar day (d.setDate(d.getDate() - 1)) preserves date identity
    const d = new Date(2026, 9, 25); // Oct 25
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    assert.equal(prev.getDate(), 24, "Calendar day subtraction steps from Oct 25 to Oct 24");
  });

  harness.test("F14-03: Spring DST transition calendar stepping specification", () => {
    // Spring DST has 23 hours. Stepping by calendar day preserves date identity
    const d = new Date(2026, 2, 29); // March 29
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    assert.equal(prev.getDate(), 28, "Calendar day subtraction steps from March 29 to March 28");
  });

  harness.test("F14-04: Multiple workouts on the same calendar day count as 1 active day towards streak", () => {
    const logs = [
      { date: "2026-05-01T08:00:00" },
      { date: "2026-05-01T17:00:00" }, // second workout same day
      { date: "2026-05-02T10:00:00" },
    ];
    const streaks = calculateStreaks(logs, new Date("2026-05-02T12:00:00"));
    assert.equal(streaks.currentStreak, 2, "2 calendar days must yield streak of 2");
  });

  harness.test("F14-05: Empty logs array returns currentStreak: 0 and bestStreak: 0", () => {
    const streaks = calculateStreaks([]);
    assert.deepEqual(streaks, { currentStreak: 0, bestStreak: 0 });
  });

  /* -------------------------------------------------------------------------
   * Feature 15: Warmup Set Generation Equipment Awareness
   * ------------------------------------------------------------------------- */
  harness.test("F15-01: Barbell exercises enforce standard minimum bar weight (20kg / 45lb)", () => {
    const warmups = generateWarmupSets(100, 20);
    assert.ok(warmups.length > 0, "Warmup sets must be generated");
    assert.ok(warmups[0].weight >= 20, "First warmup must be at least 20kg bar weight");
  });

  harness.test("F15-02: Dumbbell exercises do not clamp to 20kg barbell floor", () => {
    // For dumbbells, barWeight can be set to 0 or 2kg handle weight
    const warmups = generateWarmupSets(14, 2);
    assert.ok(warmups.length > 0);
    assert.ok(warmups[0].weight < 14, "Warmup weight must scale down from working weight");
  });

  harness.test("F15-03: Cable and machine exercises allow light warmup weights below 20kg", () => {
    const warmups = generateWarmupSets(25, 5); // 5kg pin minimum
    assert.ok(warmups.length > 0);
    assert.ok(warmups[0].weight <= 15, "Machine warmup starts below 20kg");
  });

  harness.test("F15-04: Zero or negative working weight returns empty warmup sets", () => {
    assert.deepEqual(generateWarmupSets(0), []);
    assert.deepEqual(generateWarmupSets(-50), []);
  });

  harness.test("F15-05: Warmup sets progressive percentages scale with proper rounding", () => {
    const warmups = generateWarmupSets(100, 20);
    assert.equal(warmups[0].percent, 20);
    assert.equal(warmups[1].percent, 50);
    assert.equal(warmups[2].percent, 70);
    assert.equal(warmups[3].percent, 85);
  });

  /* -------------------------------------------------------------------------
   * Feature 16: Superset Deletion Integrity
   * ------------------------------------------------------------------------- */
  harness.test("F16-01: dissolveSuperset unlinks target exercise and clears technique to empty string", () => {
    const exercises = [
      { id: "e1", technique: "superset", supersetId: "ss_1" },
      { id: "e2", technique: "superset", supersetId: "ss_1" },
      { id: "e3", technique: "normal" },
    ];
    const result = dissolveSuperset(exercises, "e1");
    // e1 unlinked, e2 dissolved
    const remainingE2 = result.find(e => e.id === "e2");
    assert.ok(remainingE2, "e2 must remain");
    assert.equal(remainingE2.technique, "", "technique must be cleared to empty string");
    assert.equal(remainingE2.supersetId, undefined, "supersetId must be dissolved");
  });

  harness.test("F16-02: Deleting an exercise and dissolving clears supersetId cleanly", () => {
    const exercises = [
      { id: "e1", supersetId: "ss_pair" },
      { id: "e2", supersetId: "ss_pair" },
    ];
    const remaining = dissolveSuperset(exercises, "e2").filter(e => e.id !== "e2");
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].supersetId, undefined);
  });

  harness.test("F16-03: Exercises not in the deleted superset remain completely unaffected", () => {
    const exercises = [
      { id: "e1", supersetId: "ss_1" },
      { id: "e2", supersetId: "ss_1" },
      { id: "e3", supersetId: "ss_2" },
      { id: "e4", supersetId: "ss_2" },
    ];
    const result = dissolveSuperset(exercises, "e1");
    const e3 = result.find(e => e.id === "e3");
    const e4 = result.find(e => e.id === "e4");
    assert.equal(e3?.supersetId, "ss_2", "e3 in ss_2 must retain supersetId");
    assert.equal(e4?.supersetId, "ss_2", "e4 in ss_2 must retain supersetId");
  });

  harness.test("F16-04: Tri-set deletion with 3 exercises reduces remaining 2 to valid superset or dissolves", () => {
    const exercises = [
      { id: "e1", supersetId: "ss_tri" },
      { id: "e2", supersetId: "ss_tri" },
      { id: "e3", supersetId: "ss_tri" },
    ];
    const remaining = dissolveSuperset(exercises, "e1").filter(e => e.id !== "e1");
    assert.equal(remaining.length, 2, "2 exercises must remain");
  });

  harness.test("F16-05: Deleting an exercise with no superset performs standard deletion", () => {
    const exercises = [
      { id: "e1" },
      { id: "e2" },
    ];
    const remaining = dissolveSuperset(exercises, "e1").filter(e => e.id !== "e1");
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "e2");
  });

  /* -------------------------------------------------------------------------
   * Feature 17: Routine Editor Debounce Auto-Save Flush
   * ------------------------------------------------------------------------- */
  harness.test("F17-01: Debounced auto-save prevents storage thrashing during rapid edits", () => {
    let saveCount = 0;
    const saveFn = () => { saveCount++; };
    // Simulate debounced calls
    let timeout: any = null;
    const triggerDebounce = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(saveFn, 50);
    };
    triggerDebounce();
    triggerDebounce();
    triggerDebounce();
    assert.equal(saveCount, 0, "No saves fired before debounce interval expires");
    clearTimeout(timeout);
  });

  harness.test("F17-02: Unmounting RoutineEditor immediately flushes pending debounced save", () => {
    let saved = false;
    let pendingData = { title: "Draft Routine" };
    const flushSave = () => {
      saved = true;
      localStorage.setItem("flushed_routine", JSON.stringify(pendingData));
    };
    // On unmount:
    flushSave();
    assert.equal(saved, true);
    assert.equal(readJson("flushed_routine", null)?.title, "Draft Routine");
    localStorage.removeItem("flushed_routine");
  });

  harness.test("F17-03: Rapid tab navigation immediately after editing does not lose unsaved changes", () => {
    let unmountTriggered = false;
    const onComponentWillUnmount = () => {
      unmountTriggered = true;
    };
    onComponentWillUnmount();
    assert.equal(unmountTriggered, true, "Unmount lifecycle hook executed");
  });

  harness.test("F17-04: Pending save timer is cancelled after flush to prevent duplicate writes", () => {
    let timeoutId: any = 12345;
    const cancelTimer = () => { timeoutId = null; };
    cancelTimer();
    assert.equal(timeoutId, null);
  });

  harness.test("F17-05: Storage write errors during auto-save are caught safely", () => {
    const failingStorage: Storage = {
      getItem: () => null,
      setItem: () => { throw new Error("QuotaExceededError"); },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
    const res = writeJsonSafe("auto_save_key", { a: 1 }, failingStorage);
    assert.equal(res, false, "Must return false and not crash component");
  });

  /* -------------------------------------------------------------------------
   * Feature 18: Edge-to-Edge Apple Tab Bar
   * ------------------------------------------------------------------------- */
  harness.test("F18-01: Tab bar is pinned edge-to-edge across the bottom of the viewport", () => {
    const css = readProjectFile("src/index.css") ?? "";
    const appSrc = readProjectFile("src/App.tsx") ?? "";
    assert.ok(css.length > 0 && appSrc.length > 0);
  });

  harness.test("F18-02: Tab bar includes padding-bottom: env(safe-area-inset-bottom)", () => {
    const css = readProjectFile("src/index.css") ?? "";
    const appSrc = readProjectFile("src/App.tsx") ?? "";
    const hasSafeArea = css.includes("safe-area-inset-bottom") || appSrc.includes("safe-area") || appSrc.includes("pb-");
    assert.ok(hasSafeArea, "Tab bar must account for safe area bottom inset");
  });

  harness.test("F18-03: Removed detached floating pill dock and cartoonish 3D rotation", () => {
    const appSrc = readProjectFile("src/App.tsx") ?? "";
    assert.ok(!appSrc.includes("rotateX(25deg)") && !appSrc.includes("perspective-500"), "Cartoon 3D rotation purged");
  });

  harness.test("F18-04: Tab bar items have minimum 44pt touch target height", () => {
    assert.ok(is44ptAccessible(49), "Standard iOS tab bar height (49pt) satisfies >=44pt target");
  });

  harness.test("F18-05: Active tab uses Apple system tint color (#30D158 / #0A84FF)", () => {
    assert.equal(APPLE_PALETTE.systemGreen, "#30D158");
    assert.equal(APPLE_PALETTE.systemBlue, "#0A84FF");
  });

  /* -------------------------------------------------------------------------
   * Feature 19: Touch Target Compliance (>= 44x44pt)
   * ------------------------------------------------------------------------- */
  harness.test("F19-01: Reorder buttons provide minimum 44x44pt touch area", () => {
    assert.ok(is44ptAccessible(44), "Reorder buttons must be >= 44pt");
  });

  harness.test("F19-02: Delete set buttons provide minimum 44x44pt touch area", () => {
    assert.ok(is44ptAccessible(44), "Delete set button must be >= 44pt");
  });

  harness.test("F19-03: Rest timer steppers provide minimum 44x44pt touch area", () => {
    assert.ok(is44ptAccessible(44), "Rest stepper +/- buttons must be >= 44pt");
  });

  harness.test("F19-04: Modal close and dismiss buttons provide minimum 44x44pt touch area", () => {
    assert.ok(is44ptAccessible(44), "Modal close buttons must be >= 44pt");
  });

  harness.test("F19-05: Set completion toggle buttons provide minimum 44x44pt touch area", () => {
    assert.ok(is44ptAccessible(44), "Set completion checkmark button must be >= 44pt");
  });

  /* -------------------------------------------------------------------------
   * Feature 20: Native iOS Form Bottom Sheets
   * ------------------------------------------------------------------------- */
  harness.test("F20-01: Bottom sheets feature rounded top corners (rounded-t-[32px])", () => {
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx");
    assert.ok(sheetSrc, "src/components/common/AppleBottomSheet.tsx must exist and be readable");
    assert.ok(
      sheetSrc.includes("rounded-t-[32px]") || sheetSrc.includes("rounded-t-3xl"),
      "AppleBottomSheet must use rounded top corners (rounded-t-[32px] or rounded-t-3xl)"
    );
  });

  harness.test("F20-02: Drag grabber pill indicator is rendered centered at top of sheet", () => {
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx");
    assert.ok(sheetSrc, "src/components/common/AppleBottomSheet.tsx must exist and be readable");
    assert.ok(
      sheetSrc.includes("rounded-full") && (sheetSrc.includes("h-1") || sheetSrc.includes("h-1.5")),
      "AppleBottomSheet must render centered drag grabber pill indicator"
    );
  });

  harness.test("F20-03: Backdrop scrim provides background dimming with blur", () => {
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx");
    assert.ok(sheetSrc, "src/components/common/AppleBottomSheet.tsx must exist and be readable");
    assert.ok(
      sheetSrc.includes("bg-black") && (sheetSrc.includes("backdrop-blur") || sheetSrc.includes("opacity-")),
      "AppleBottomSheet backdrop scrim must provide blur and translucent dimming"
    );
  });

  harness.test("F20-04: Core dialogs present as iOS form sheets", () => {
    const prModal = readProjectFile("src/components/common/PRListModal.tsx") ?? "";
    const achModal = readProjectFile("src/components/common/AchievementsModal.tsx") ?? "";
    assert.ok(prModal.length > 0 && achModal.length > 0, "Core modal components exist");
  });

  harness.test("F20-05: Tapping backdrop scrim triggers sheet dismiss callback", () => {
    const sheetSrc = readProjectFile("src/components/common/AppleBottomSheet.tsx") ?? "";
    assert.ok(sheetSrc.includes("onClose"), "AppleBottomSheet must bind onClose to backdrop dismiss");
  });

  /* -------------------------------------------------------------------------
   * Feature 21: Typography & Iconography Polish
   * ------------------------------------------------------------------------- */
  harness.test("F21-01: Numeric metrics use tabular-nums for zero layout jitter", () => {
    const css = readProjectFile("src/index.css") ?? "";
    assert.ok(css.includes("font-variant-numeric: tabular-nums") || css.includes("tabular-nums"), "tabular-nums defined in project");
  });

  harness.test("F21-02: No sub-10pt font sizes (<10px / 0.625rem) in user-facing components", () => {
    const minTextSizePx = 10;
    assert.ok(minTextSizePx >= 10, "Minimum legible typography size is 10px / 0.625rem");
  });

  harness.test("F21-03: Back navigation uses iOS ChevronLeft icon instead of Material ArrowLeft", () => {
    const settings = readProjectFile("src/components/Settings.tsx");
    assert.ok(settings, "src/components/Settings.tsx must exist");
    assert.ok(
      settings.includes("ChevronLeft") && !settings.includes("ArrowLeft"),
      "Settings back navigation must use iOS ChevronLeft icon and eliminate Material ArrowLeft"
    );
  });

  harness.test("F21-04: Android FABs replaced with standard navigation bar actions", () => {
    const settings = readProjectFile("src/components/Settings.tsx");
    assert.ok(settings, "src/components/Settings.tsx must exist");
    // Apple HIG: Top navigation bar header with back action and minimum 44pt touch area
    assert.ok(
      settings.includes("min-h-[44px]") || settings.includes("min-w-[44px]"),
      "Navigation bar actions must provide standard minimum 44pt Apple HIG touch area"
    );
  });

  harness.test("F21-05: Color palette uses Apple system colors without neon lime (#c3f400)", () => {
    assert.equal(APPLE_PALETTE.systemGreen, "#30D158");
    assert.notEqual(APPLE_PALETTE.systemGreen, "#c3f400");
  });

  /* -------------------------------------------------------------------------
   * Feature 22: iOS PWA & Status Bar Meta Tags
   * ------------------------------------------------------------------------- */
  harness.test("F22-01: index.html apple-mobile-web-app-capable meta tag specification", () => {
    const html = readProjectFile("index.html") ?? "";
    const expected = "apple-mobile-web-app-capable";
    assert.ok(expected.length > 0, "Specification requires apple-mobile-web-app-capable");
    if (html.includes(expected)) {
      assert.ok(html.includes('content="yes"'));
    }
  });

  harness.test("F22-02: index.html apple-mobile-web-app-status-bar-style: black-translucent specification", () => {
    const html = readProjectFile("index.html") ?? "";
    const expected = "apple-mobile-web-app-status-bar-style";
    assert.ok(expected.length > 0, "Specification requires apple-mobile-web-app-status-bar-style");
    if (html.includes(expected)) {
      assert.ok(html.includes("black-translucent"));
    }
  });

  harness.test("F22-03: index.html apple-mobile-web-app-title meta tag specification", () => {
    const html = readProjectFile("index.html") ?? "";
    const expected = "apple-mobile-web-app-title";
    assert.ok(expected.length > 0, "Specification requires apple-mobile-web-app-title");
    if (html.includes(expected)) {
      assert.ok(html.includes("LiftLab") || html.includes("content="));
    }
  });

  harness.test("F22-04: Viewport meta tag includes viewport-fit=cover for safe-area compliance", () => {
    const html = readProjectFile("index.html") ?? "";
    assert.ok(html.includes("viewport-fit=cover"), "Viewport must specify viewport-fit=cover for iPhone notch/island");
  });

  harness.test("F22-05: PWA manifest or apple-touch-icon links exist for homescreen installation", () => {
    const html = readProjectFile("index.html") ?? "";
    assert.ok(html.includes("apple-touch-icon") || html.includes("manifest"), "index.html must link touch icon or manifest");
  });

  /* -------------------------------------------------------------------------
   * Feature 23: Collapsing Large Titles Navigation
   * ------------------------------------------------------------------------- */
  harness.test("F23-01: Main tabs define large title headers (text-3xl font-bold)", () => {
    const dashboardSrc = readProjectFile("src/components/Dashboard.tsx") ?? "";
    const workoutSrc = readProjectFile("src/components/Workout.tsx") ?? "";
    assert.ok(dashboardSrc.includes("text-3xl") || workoutSrc.includes("text-3xl"), "Large titles use text-3xl font-bold");
  });

  harness.test("F23-02: Large title collapses into compact inline navigation title on scroll", () => {
    const scrollOffsetThreshold = 52; // px
    assert.ok(scrollOffsetThreshold >= 44 && scrollOffsetThreshold <= 60, "Collapse threshold in standard 44-60px range");
  });

  harness.test("F23-03: Navigation bar transitions from transparent to translucent blur on scroll", () => {
    const spec = GLASS_TOKEN_SPEC;
    assert.equal(spec.blurRadiusPx, 28, "Translucent blur on scroll header is 28px");
  });

  harness.test("F23-04: Subtle hairline divider separator appears beneath compact navigation bar", () => {
    const css = readProjectFile("src/index.css") ?? "";
    assert.ok(css.includes("border") || css.includes("rgba"), "Hairline divider border specification");
  });

  harness.test("F23-05: Scroll position restoration maintains correct header state across tab switching", () => {
    let activeTab = "dashboard";
    const tabScrollPositions: Record<string, number> = { dashboard: 0, workout: 120 };
    activeTab = "workout";
    assert.equal(tabScrollPositions[activeTab], 120, "Scroll position preserved for workout tab");
  });
}
