# Background Workout Persistence & Interactive Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an ongoing, battery-efficient Android Foreground Service with interactive notifications for live workouts that allows completing sets, adding +30s rest, skipping rest directly from the lock screen/notification shade, and ensures 0 ms cold boot when reopening the app.

**Architecture:** A native Android `LiveWorkoutService` and `LiveWorkoutReceiver` bridged via a custom Capacitor `LiveWorkoutPlugin` to `liveWorkoutBridge.ts`, hooked into `useWorkoutData.ts` and `RoutineEditor.tsx`.

**Tech Stack:** Java 22 / Android SDK 34 / Capacitor 8 / TypeScript 5.8 / React 19

---

## Global Constraints
- Must not cause cold-restarts when switching apps during a live workout.
- Must clean up notifications cleanly on workout completion or cancel.
- Must gracefully fall back to web notifications in non-native / browser environments.
- Must compile cleanly with `gradlew assembleDebug` and pass all unit tests with `npm test`.

---

### Task 1: Android Native Foreground Service & Receiver

**Files:**
- Create: `android/app/src/main/java/com/liftlab/app/LiveWorkoutService.java`
- Create: `android/app/src/main/java/com/liftlab/app/LiveWorkoutReceiver.java`
- Modify: `android/app/src/main/AndroidManifest.xml`

**Interfaces:**
- Produces: `LiveWorkoutService` capable of running in foreground with persistent notification channel `liftlab_live_workout` and interactive pending intents.

- [ ] **Step 1: Create LiveWorkoutReceiver.java**
Handle pending intents for `ACTION_COMPLETE_SET`, `ACTION_ADD_REST_30S`, `ACTION_SKIP_REST`.

- [ ] **Step 2: Create LiveWorkoutService.java**
Implement sticky notification builder with action buttons, countdown handler, and vibration alert on rest completion.

- [ ] **Step 3: Update AndroidManifest.xml**
Add required permissions (`FOREGROUND_SERVICE`, `POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`) and declare `<service>` and `<receiver>`.

- [ ] **Step 4: Verify Java syntax and build**
Run: `$env:JAVA_HOME = "C:\Program Files\Java\jdk-22" ; cd android ; .\gradlew.bat compileDebugJavaWithJavac`
Expected: `BUILD SUCCESSFUL`

---

### Task 2: Capacitor Native Plugin Bridge & TypeScript Wrapper

**Files:**
- Create: `android/app/src/main/java/com/liftlab/app/LiveWorkoutPlugin.java`
- Modify: `android/app/src/main/java/com/liftlab/app/MainActivity.java`
- Create: `src/lib/liveWorkoutBridge.ts`

**Interfaces:**
- Produces: `LiveWorkoutBridge` with `startService(...)`, `updateService(...)`, `stopService()`, and `addListener("notificationAction", ...)`

- [ ] **Step 1: Create LiveWorkoutPlugin.java**
Capacitor plugin exposing native control methods and dispatching `notificationAction` events.

- [ ] **Step 2: Register plugin in MainActivity.java**
Add `registerPlugin(LiveWorkoutPlugin.class);` in `MainActivity.java`.

- [ ] **Step 3: Create liveWorkoutBridge.ts**
TypeScript wrapper with fallback for non-native / browser mode.

- [ ] **Step 4: Verify compile**
Run: `npm run lint`
Expected: 0 errors

---

### Task 3: Warm Memory Retention & Lifecycle Integration

**Files:**
- Modify: `android/app/src/main/java/com/liftlab/app/MainActivity.java`
- Modify: `src/hooks/useWorkoutData.ts`

**Interfaces:**
- Consumes: `LiveWorkoutBridge`
- Produces: Instant 0 ms app resume on back button press during live workouts.

- [ ] **Step 1: Update MainActivity back button behavior**
Call `moveTaskToBack(true)` when live workout is active so Android keeps activity alive in RAM without destroying it.

- [ ] **Step 2: Integrate start & stop service in useWorkoutData.ts**
Start service on `handleStartLiveWorkout`, stop on `handleSaveRoutine` or cancel.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npm run lint`
Expected: 0 errors

---

### Task 4: Interactive Action Handling in RoutineEditor

**Files:**
- Modify: `src/components/RoutineEditor.tsx`

**Interfaces:**
- Consumes: `LiveWorkoutBridge.addListener("notificationAction", ...)`
- Produces: Real-time synchronization of completed sets and rest timer updates between notification shade and React live editor.

- [ ] **Step 1: Update live editor to sync state to background service**
Call `updateService` on set completion, rest timer start, and rest countdown updates.

- [ ] **Step 2: Listen for notification actions**
Handle `ACTION_COMPLETE_SET`, `ACTION_ADD_REST_30S`, `ACTION_SKIP_REST` inside `RoutineEditor.tsx`.

- [ ] **Step 3: Run unit tests**
Run: `npm test`
Expected: `workoutUtils tests passed`, `routineImport tests passed`, `storage tests passed`, `Achievements tests passed!`

---

### Task 5: End-to-End Build & Verification

**Files:**
- Output: `android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 1: Clean build web bundle**
Run: `npm run clean ; npm run build`

- [ ] **Step 2: Sync assets and build debug APK**
Run: `Copy-Item -Path "dist\*" -Destination "android\app\src\main\assets\public" -Recurse -Force ; $env:JAVA_HOME = "C:\Program Files\Java\jdk-22" ; cd android ; .\gradlew.bat assembleDebug`
Expected: `BUILD SUCCESSFUL`
