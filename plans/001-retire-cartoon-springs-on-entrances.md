# 001 — Retire cartoon springs on entrances

- **Status**: DONE
- **Commit**: d69780a
- **Severity**: HIGH
- **Category**: Easing & duration, cohesion
- **Estimated scope**: 3 files, small

## Problem

`CARTOON_SPRINGS.bouncy` is `{ type: "spring", stiffness: 420, damping: 14, mass: 0.7 }` (`src/lib/motion.ts:70-75`). That ratio is underdamped (zeta about 0.41), so it oscillates. `CARTOON_SPRINGS.pop` is `{ type: "spring", stiffness: 520, damping: 16, mass: 0.5 }` (`src/lib/motion.ts:79-84`), also underdamped. These springs are on UI that enters during normal use. The repo already has critically damped springs in `APPLE_SPRINGS`.

Current toast (`src/components/common/ToastViewport.tsx:44-47`):

```tsx
initial={{ opacity: 0, y: -20, scale: 0.92 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -16, scale: 0.92, transition: { duration: 0.18 } }}
transition={CARTOON_SPRINGS.pop}
```

Current OTA banner (`src/App.tsx:900-903`):

```tsx
initial={{ y: -60, opacity: 0, scale: 0.95 }}
animate={{ y: 0, opacity: 1, scale: 1 }}
exit={{ y: -60, opacity: 0, scale: 0.95 }}
transition={CARTOON_SPRINGS.bouncy}
```

Current live-session pill (`src/App.tsx:988-993`):

```tsx
initial={{ opacity: 0, scale: 0.8, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.8, y: 20 }}
whileHover={{ scale: 1.04 }}
whileTap={{ scale: 0.9, rotate: -2 }}
transition={CARTOON_SPRINGS.bouncy}
```

Current settings update panel (`src/components/Settings.tsx:801-804`):

```tsx
initial={{ opacity: 0, y: -10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -10, scale: 0.95 }}
transition={CARTOON_SPRINGS.bouncy}
```

`scale: 0.8` is below the allowed entrance floor of 0.9. A 60px slide on a small banner is too much travel for a notification.

## Target

Entrances use the existing tokens. Do not invent new spring numbers.

```tsx
export const APPLE_SPRINGS = {
  criticallyDamped: { type: "spring" as const, duration: 0.32, bounce: 0 },
  snappy: { type: "spring" as const, duration: 0.22, bounce: 0 },
};
```

Toast, live pill, and settings panel use `APPLE_SPRINGS.snappy` (220ms, bounce 0, under the 300ms UI cap). The OTA banner uses `APPLE_SPRINGS.criticallyDamped` (320ms, bounce 0).

```tsx
// ToastViewport — target
initial={{ opacity: 0, y: -8, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.18 } }}
transition={APPLE_SPRINGS.snappy}

// App.tsx OTA banner — target
initial={{ y: -12, opacity: 0, scale: 0.96 }}
animate={{ y: 0, opacity: 1, scale: 1 }}
exit={{ y: -12, opacity: 0, scale: 0.96 }}
transition={APPLE_SPRINGS.criticallyDamped}

// App.tsx live pill — target entrance only
initial={{ opacity: 0, scale: 0.96, y: 8 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.96, y: 8 }}
transition={APPLE_SPRINGS.snappy}

// Settings update panel — target
initial={{ opacity: 0, y: -8, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -8, scale: 0.96 }}
transition={APPLE_SPRINGS.snappy}
```

Leave `whileHover` and `whileTap` on the live pill untouched. Plan 003 owns those props.

## Repo conventions to follow

Springs already live in `src/lib/motion.ts`. `APPLE_SPRINGS.snappy` and `APPLE_SPRINGS.criticallyDamped` are the tokens. Import `APPLE_SPRINGS` from `../lib/motion` or `./lib/motion` the same way the file already imports `CARTOON_SPRINGS`.

Do not copy `homePress` (`src/components/Dashboard.tsx:27`). That const is a settled home-only press, not an entrance spring.

## Steps

1. In `src/components/common/ToastViewport.tsx`, replace the `CARTOON_SPRINGS` import with `APPLE_SPRINGS`. Apply the toast target block above. Do not change the click handler, colors, or markup.
2. In `src/App.tsx`, keep the existing `APPLE_SPRINGS` import. Replace only the `initial` / `animate` / `exit` / `transition` of the OTA banner (`key="ota-ready-banner"`) and of the live pill (`key="live-session-pill"`) with the target blocks. Do not edit `whileHover`, `whileTap`, `animate-ping`, or the inner Riavvia button.
3. If `CARTOON_SPRINGS` has no remaining use in `src/App.tsx`, delete it from the import on line 41. Leave `cartoonTabVariants` in that import.
4. In `src/components/Settings.tsx`, apply the settings-panel target. Keep the `CARTOON_SPRINGS` import, because the buttons at lines 784, 858, and 871 still use it.

## Boundaries

- Do NOT change `CARTOON_SPRINGS` or `CARTOON_KEYFRAMES` values in `src/lib/motion.ts`.
- Do NOT change `whileTap`, `whileHover`, or `animate-ping`.
- Do NOT change the download progress bar at `src/components/Settings.tsx:842-846` (it animates `width`).
- Do NOT change `src/components/Dashboard.tsx`.
- Do NOT add dependencies.
- If a cited snippet is not on the cited element, STOP and report the drift. Do not retarget a different animation.

## Verification

- **Mechanical**: `npx tsx src/lib/motionAndHaptics.test.ts` still prints `✓ CARTOON_SPRINGS & CARTOON_KEYFRAMES verified successfully`. `npx tsc --noEmit` exits 0.
- **Feel check**: trigger a toast, the OTA-ready banner, the settings update panel, and start a live workout so the pill appears. At 10% playback in the Animations panel, each one moves once toward its rest state and does not bounce back. Travel is about 8–12px, not 60px. The live pill still rotates on press (that is plan 003, not a failure of this plan).
- **Done when**: none of the four entrance `transition` props still reference `CARTOON_SPRINGS`, and no entrance `scale` is below 0.96.
