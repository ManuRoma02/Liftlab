# LiftLab

LiftLab is an offline-first workout tracker built with React, Vite, and Capacitor for Android.

## Current Behavior

- No login screen is used.
- No Firebase or cloud sync runtime is included.
- Workout routines, logs, body weight, custom exercises, settings, and import/export data are stored in browser/device localStorage.
- Android builds use Capacitor and package the Vite `dist` output.
- Routine import supports LiftLab JSON files, including normal sets, supersets, cluster/drop-set style techniques, rest timers, custom exercise creation, and previous-weight autofill.

## Development

Prerequisite: Node.js and Android Studio/SDK for APK builds.

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm test
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Debug APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Routine Import Sample

Use this file to test routine import:

```text
examples/liftlab-routine-import-sample.json
```

## Local Data

The app uses `localStorage` keys prefixed with `liftlab_`. Export/import is available in-app for backup and migration.
