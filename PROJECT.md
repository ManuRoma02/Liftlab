# Project: LiftLab Gym App — Code Quality, Bug Fixes & Apple HIG Overhaul

## Architecture
- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, Capacitor 8 (iOS & Android).
- **Core State Management**: `useWorkoutData.ts` hook managing offline storage (`localStorage`), active live workout session state, routine templates, workout history logs, exercise catalog, and user preferences.
- **UI Architecture**: Multi-tab interface (`Dashboard`, `Workout`, `Progress`, `History`, `Settings`) with secondary modals/sheets and drill-down views (`RoutineEditor`, `ExerciseDetails`, `WorkoutSummaryView`).
- **Platform Bridges**: Capacitor Plugins for Local Notifications, App state, Haptics, and custom Android `LiveWorkoutService` foreground notification service.

## Feature Inventory
| # | Feature / Issue | Description | Milestone | Source |
|---|-----------------|-------------|-----------|--------|
| 1 | Native iOS Haptics Support | Add `@capacitor/haptics` to `package.json` to enable physical Taptic Engine feedback on iOS devices | M1 | Explorer 1, 3 |
| 2 | Haptics Storage Safety | Wrap `isHapticsEnabled` localStorage access in try/catch to prevent unhandled `SecurityError` crash in restricted sandboxes | M1 | Explorer 1, 2 |
| 3 | Haptics Render-Time Execution Fix | Ensure `hapticPress` returns an event handler instead of triggering vibration during React render pass | M1 | Explorer 1, 2 |
| 4 | Dual Haptic Shudder Elimination | Remove redundant `onPointerDown` + `onClick` dual haptic triggers on `TabHero`, `AppleBottomSheet`, and navigation buttons | M1 | Explorer 1 |
| 5 | Storage API Exception Resilience | Add try/catch guarding in `storage.ts` and `Settings.tsx` to handle private browsing and quota errors gracefully | M1 | Explorer 2 |
| 6 | Modal Exit Animation Life-Cycle | Wrap all conditional modals in `<AnimatePresence>` and place `<AnimatePresence>` outside conditional null returns so exit spring animations work | M1 | Explorer 1 |
| 7 | Coordinated Modal Escape Dismissal | Route keyboard `Escape` through a unified LIFO stack so pressing Escape closes only the topmost modal rather than all simultaneously | M1 | Explorer 1, 2 |
| 8 | Domain Model Duration Clarification | Differentiate `duration` representations in `RoutineData` (minutes for routine templates vs seconds for workout logs) and eliminate conversion ambiguity | M1 | Explorer 1 |
| 9 | Dashboard Performance & Prop Fix | Pass `userName` prop from `App.tsx` to `Dashboard.tsx` to prevent synchronous `localStorage.parse` on render; memoize heavy stats calculations | M1 | Explorer 1 |
| 10 | Personal Records Wiring | Wire `buildPersonalRecords(workoutLogs)` into `Dashboard.tsx` and `PRListModal.tsx` so PR counts and PR modal display real data instead of being permanently empty/0 | M2 | Explorer 2 |
| 11 | Workout Summary Historical Delta | Pass missing `workoutLogs` prop to `<WorkoutSummaryView>` in `App.tsx` so workout comparison metrics correctly display deltas against previous sessions | M2 | Explorer 2 |
| 12 | Live Workout Routine Protection | Prevent live workout modifications from silently overwriting baseline routine templates; ensure explicit template update confirmation dialog | M2 | Explorer 2 |
| 13 | Routine Editor Exercise Addition & State Preservation | Fix `handleDetailsAddExercise` so adding exercises from `ExerciseDetails` works for new/empty routines without data loss | M2 | Explorer 2 |
| 14 | Daylight Saving Time Streak Robustness | Update `calculateStreaks` in `workoutUtils.ts` to step by calendar days instead of fixed 86,400,000ms millisecond addition | M2 | Explorer 2 |
| 15 | Warmup Set Generation Equipment Awareness | Prevent clamping barbell weight (20kg/45lb) for dumbbells, cables, and bodyweight exercises in warmup calculator | M2 | Explorer 2 |
| 16 | Superset Deletion Integrity | Cleanly dissolve superset pairings when an exercise belonging to a superset is deleted, eliminating orphaned indicators | M2 | Explorer 2 |
| 17 | Routine Editor Debounce Auto-Save Flush | Flush pending debounced auto-save on unmount in `RoutineEditor` so fast tab switches do not discard recent edits | M2 | Explorer 2 |
| 18 | Edge-to-Edge Apple Tab Bar | Replace detached floating pill dock (`.apple-floating-dock`) with an authentic edge-to-edge pinned `UITabBar` extending into safe area, removing cartoon rotation | M3 | Explorer 3 |
| 19 | Touch Target Compliance (>= 44x44pt) | Increase hit areas for reorder buttons (28px -> 44px), delete set buttons (32px -> 44px), rest steppers (32px -> 44px), upload button (40px -> 44px), and dismiss buttons | M3 | Explorer 3 |
| 20 | Native iOS Form Bottom Sheets | Refactor centered desktop dialogs (`PRListModal`, `AchievementsModal`, `PlateCalculatorModal`, `ShareRoutineModal`, `ImportRoutineModal`, `FullWorkoutHistoryModal`, Weight Modal) into iOS form sheets with drag grabber | M3 | Explorer 3 |
| 21 | Typography & Iconography Polish | Eliminate illegible sub-10pt font sizes (7px, 7.5px, 8px), replace Material `ArrowLeft` with iOS `ChevronLeft`, and replace bottom-right Android FABs with navigation bar actions | M3 | Explorer 3 |
| 22 | iOS PWA & Status Bar Meta Tags | Add `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, and `apple-mobile-web-app-title` in `index.html` | M3 | Explorer 3 |
| 23 | Collapsing Large Titles Navigation | Introduce standard iOS navigation bar pattern with large titles that collapse on scroll across main tabs | M3 | Explorer 3 |
| 24 | E2E Requirement-Driven Test Suite | Build comprehensive opaque-box test suite (Tiers 1-4) covering all 23 features and app capabilities | E2E_TRACK | Orchestrator |
| 25 | Final E2E Pass & Adversarial Hardening | 100% pass across E2E Tiers 1-4, followed by Tier 5 adversarial stress testing and coverage hardening | FINAL | Orchestrator |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Requirement-driven test harness, runner, and test cases (Tiers 1-4) published via `TEST_READY.md` | none | IN_PROGRESS |
| 1 | Core Architecture, Storage & Haptics Foundation | Features #1, #2, #3, #4, #5, #6, #7, #8, #9 | none | PLANNED |
| 2 | Functional Bugs & Logic Fixes | Features #10, #11, #12, #13, #14, #15, #16, #17 | M1 | PLANNED |
| 3 | Apple Design & iOS HIG UI/UX Overhaul | Features #18, #19, #20, #21, #22, #23 | M1 | PLANNED |
| FINAL | Final Verification & Adversarial Hardening | Pass 100% of E2E tests (Tiers 1-4), then Tier 5 adversarial coverage hardening | E2E, M1, M2, M3 | PLANNED |

## Interface Contracts
### `src/lib/haptics.ts`
- `triggerHaptic(style: HapticStyle): Promise<void>`: Safe asynchronous invocation of `@capacitor/haptics` with WebKit fallback without throwing.
- `hapticPress(style?: HapticStyle): (e?: any) => void`: Returns an event handler function that triggers haptic feedback on user action (NEVER triggers during render).
- `isHapticsEnabled(): boolean`: Synchronously returns boolean preference wrapped in try/catch against `DOMException: SecurityError`.

### `src/lib/storage.ts`
- `safeGetItem<T>(key: string, fallback: T): T`: Guaranteed non-throwing JSON parser and localStorage getter.
- `safeSetItem<T>(key: string, value: T): boolean`: Safe setter catching QuotaExceededError and SecurityError.

### `src/lib/workoutUtils.ts`
- `buildPersonalRecords(workoutLogs: WorkoutLog[]): Record<string, { prWeight: number, oneRepMax: number, date: string, reps: number }>`: Computes maximum weight and 1RM per exercise across historical logs.
- `calculateStreaks(logs: WorkoutLog[], referenceDate?: Date): { currentStreak: number, bestStreak: number, activeDays: number }`: Calendar day based streak calculation robust to DST.
- `generateWarmupSets(workingWeight: number, unit: "KG"|"LBS", exerciseName?: string, equipment?: string): WorkoutSet[]`: Equipment-aware warmup calculation.

### Modal Coordination (`src/lib/modalStack.ts` or `src/hooks/useModalStack.ts`)
- LIFO modal stack registering mounted modal close handlers so that pressing `Escape` pops and invokes only the topmost modal handler.

## Code Layout
- `src/lib/`: Core utilities (`haptics.ts`, `storage.ts`, `workoutUtils.ts`, `modalStack.ts`).
- `src/types/`: Domain models and TypeScript contracts (`workout.ts`).
- `src/hooks/`: State hooks (`useWorkoutData.ts`, `useModalStack.ts`).
- `src/components/common/`: Shared UI components and sheets (`AppleBottomSheet.tsx`, `PRListModal.tsx`, `AchievementsModal.tsx`, etc.).
- `src/components/`: Screen components (`Dashboard.tsx`, `Workout.tsx`, `RoutineEditor.tsx`, `Progress.tsx`, `WorkoutHistory.tsx`, `Settings.tsx`).
- `tests/e2e/`: Requirement-driven opaque-box test suites (Tiers 1-4).
- `tests/adversarial/`: Tier 5 white-box stress and invariant tests.
