# Background Workout Persistence & Interactive Notifications Design

- **Date:** 2026-08-26
- **Status:** Approved
- **Target Platform:** Android (Capacitor 8) + Web/PWA

---

## 1. Overview & Goals

When a user exercises with LiftLab, locking the phone or switching to another app (e.g. Spotify, WhatsApp) must not cause the app to cold-restart upon returning.
The app will maintain an active, battery-efficient Android Foreground Service with an ongoing interactive notification in the notification shade and lock screen, displaying:
1. Current exercise and active set details (reps, weight, RPE).
2. Live rest timer countdown when resting.
3. Interactive quick-action buttons directly inside the notification:
   - `[✅ Complete Set]`
   - `[⏱️ +30s Rest]`
   - `[⏭️ Skip Rest]`
4. Audio + haptic feedback (3 pulses) when rest timer reaches zero.
5. Instantaneous 0 ms resume time (warm memory retention) when returning to the app.

---

## 2. Architecture & Component Breakdown

### 2.1 Android Native Foreground Service (`LiveWorkoutService.java`)
- **Lifecycle:**
  - Started by Capacitor bridge plugin when `isLiveWorkoutActive` becomes `true`.
  - Stopped immediately when workout is finished or canceled.
- **Notification Channel:** `liftlab_live_workout` with high importance and default vibration/sound.
- **Sticky / Ongoing Flag:** `setOngoing(true)` prevents accidental dismissal while workout is active.
- **PendingIntent Action Receiver (`LiveWorkoutReceiver.java`):**
  - Handles action button clicks (`ACTION_COMPLETE_SET`, `ACTION_ADD_REST_30S`, `ACTION_SKIP_REST`, `ACTION_OPEN_APP`).
  - Mutates live state atomically and synchronizes with React via Capacitor event bridge or storage reflection.
  - Updates the notification payload immediately with the next state.

### 2.2 Warm Memory Retention (`MainActivity.java`)
- `launchMode="singleTask"` ensures tapping notification or app launcher returns immediately to the existing active Activity instance without re-instantiation.
- Back button handling: when a live workout is running on the root live editor screen, pressing Back minimizes the activity to background via `moveTaskToBack(true)` rather than finishing the Activity.

### 2.3 Bridge Plugin (`LiveWorkoutPlugin.java` & `liveWorkoutBridge.ts`)
- Exposes methods to TypeScript:
  - `startLiveService({ routineName, currentExercise, currentSet, totalSets, restRemainingSeconds })`
  - `updateLiveService({ currentExercise, currentSet, totalSets, restRemainingSeconds, isResting })`
  - `stopLiveService()`
- Listens for native events:
  - `onNotificationAction(({ action, timestamp }) => { ... })`

### 2.4 React Integration (`RoutineEditor.tsx` & `useWorkoutData.ts`)
- In `RoutineEditor.tsx`:
  - Whenever a set is toggled, rest timer starts, or rest is adjusted, calls `updateLiveService(...)`.
  - On `onNotificationAction` event, performs the corresponding state update in React (e.g. `toggleSetCompletion`, `setRestTimerSeconds((prev) => prev + 30)`).
- In `useWorkoutData.ts`:
  - On `handleStartLiveWorkout`, starts the background service.
  - On `handleSaveRoutine` (save or finish) or workout cancellation, stops the background service.

---

## 3. Notification Visual States

| State | Title | Body Text | Action Buttons |
| :--- | :--- | :--- | :--- |
| **Working Set** | `LiftLab • [Exercise Name]` | `Set X of Y • [Weight] kg × [Reps] reps` | `[✅ Complete Set]` |
| **Resting** | `⏱️ Rest: MM:SS • Next: Set X/Y` | `[Exercise Name] • [Weight] kg × [Reps] reps` | `[⏱️ +30s]`, `[⏭️ Skip Rest]` |
| **Rest Complete** | `🔔 Rest Finished!` | `Next up: [Exercise Name] • Set X of Y` | `[✅ Complete Set]` |

---

## 4. Error Handling & Edge Cases

1. **App Force-Killed by User / Task Manager:**
   - Android sends `onTaskRemoved` to `LiveWorkoutService`, cleanly removing the notification.
   - `liftlab_live_progress` in atomic storage guarantees full crash recovery on next app launch.
2. **Device Reboot during Workout:**
   - Service is killed gracefully; on reboot, user can resume from crash recovery banner.
3. **PWA / Browser Mode Fallback:**
   - If running in standard Web browser rather than native Android Capacitor, gracefully falls back to Web Notifications API & Web Audio API beep without throwing errors.

---

## 5. Verification Plan

1. **Unit & Build Tests:** `npm test`, `npm run lint`, `npm run build`.
2. **Native Android APK Build:** `gradlew assembleDebug`.
3. **Background & Notification Test:**
   - Start a Live Workout $\rightarrow$ lock screen $\rightarrow$ verify persistent notification appears.
   - Tap `[Complete Set]` in notification $\rightarrow$ verify set is completed and rest timer starts.
   - Tap `[+30s]` $\rightarrow$ verify rest countdown increases by 30 seconds.
   - Wait for rest timer to expire $\rightarrow$ verify vibration and "Rest Finished" alert.
   - Unlock and open app $\rightarrow$ verify instant resume (0 ms cold boot) with UI in sync.
