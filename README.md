# LiftLab

LiftLab is an offline-first, privacy-focused gym workout tracker designed with an authentic Apple Human Interface Guidelines aesthetic and built for Android and iOS using React 19, TypeScript, Vite, Tailwind CSS v4, and Capacitor 8.

---

## Key Features & Architecture

- **100% Offline-First Architecture**: All workout routines, logs, body weight metrics, personal records, custom exercises, and settings are stored locally on-device via hardened atomic `localStorage` with quota protection. No mandatory account creation or cloud dependencies.
- **Apple HIG Design & Kinetic Physics**: Custom harmonic springs, Apple-glass surfaces, responsive typography, and tactile Taptic Engine / native vibration patterns via `@capacitor/haptics`.
- **Live Workout Engine & Native Android Service**: Foreground notification service (`LiveWorkoutService.java`) maintaining an accurate countdown rest timer across app pauses and screen locks.
- **Rich Offline Exercise Catalog**: 1,300+ precompiled exercises across muscle categories (Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Functional), complete with target muscle heatmaps and support for user-created custom exercises.
- **Routine Management & Technique Engine**: Support for standard sets, supersets, drop sets, cluster sets, RPE tracking, warm-up calculator, and rest timer automations.
- **Personal Records (PRs) & Progress**: 1RM calculation (Epley formula), calendar-based streak engine robust to Daylight Saving Time shifts, and historical workout performance deltas.
- **Data Portability**: Instant import and export of routines via structured JSON schemas (`liftlab.routine.v1`) and dynamic QR codes.
- **Over-The-Air (OTA) Updates**: Capgo Capacitor-Updater integration for seamless web bundle updates without requiring full app store rebuilds.

---

## Development Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **Java JDK**: 17 or 21 (for Android Gradle builds)
- **Android Studio & SDK**: Android SDK 34 / 35 with command-line tools

### Local Web Development
```bash
# 1. Install dependencies
npm install

# 2. Start Vite local development server
npm run dev
```

---

## Quality & Pre-Release Verification

Run the full verification suite before any production or store release:

```bash
# 1. TypeScript compilation & typecheck
npm run lint

# 2. Unit test suite (9 test suites across storage, logic, haptics, OTA, etc.)
npm test

# 3. Comprehensive End-to-End Test Suite (262 tests across Tiers 1–4)
npx tsx tests/e2e/runner.ts

# 4. Production Web Build (Vite + PWA manifest & service worker)
npm run build
```

---

## Android Build & Release Guide

### 1. Sync Web Assets with Capacitor
Whenever changes are made to the web code, generate the production build and synchronize it with the Android native shell:

```bash
npm run build
npx cap sync android
```

### 2. Build Debug APK
To generate a debug APK for immediate side-loading or testing on connected devices/emulators:

```bash
npm run build:apk
# Or manually:
cd android && .\gradlew.bat assembleDebug && cd ..
```
**Output Artifact**:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Build Release Android App Bundle (AAB) for Google Play Store
For publishing on the Google Play Console:

```bash
cd android
.\gradlew.bat bundleRelease
cd ..
```
**Output Artifact**:
```text
android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Build Release Signed APK
For distributing an independent release APK:

```bash
cd android
.\gradlew.bat assembleRelease
cd ..
```
**Output Artifact**:
```text
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

> **Note on Signing**: To sign release artifacts for production, configure your keystore credentials in `android/keystore.properties` or define `signingConfigs.release` inside `android/app/build.gradle`.

---

## Over-The-Air (OTA) Release Workflow

To publish an instant web update to installed devices using the automated script:

```bash
npm run ota:release
```
This script automatically:
1. Increments patch version in `package.json`
2. Generates a fresh production build in `dist/`
3. Packages the web assets into a release `.zip` archive
4. Computes the SHA-256 integrity hash
5. Updates `update-manifest.json`

---

## Version Alignment Checklist

Prior to publishing a release, ensure version consistency across project manifests:
- `package.json` (`version`)
- `android/app/build.gradle` (`versionCode`, `versionName`)
- `capacitor.config.ts` (`appName`, `appId`)

---

## Backup & Data Export

User data is stored under the `liftlab_` key namespace in `localStorage`. Routine templates and history can be backed up or transferred at any time from **Settings > Backup & Restore** or exported individually as JSON files.
