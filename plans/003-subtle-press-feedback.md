# 003 — Replace exaggerated presses with one 160ms press

- **Status**: DONE
- **Commit**: d69780a
- **Severity**: HIGH
- **Category**: Physicality, purpose & frequency
- **Estimated scope**: 7 files, medium

## Problem

Press feedback should be `scale: 0.97` (allowed band 0.95–0.98) for 160ms with a strong ease-out. Rotation on press is not press feedback. `whileHover` scale on buttons and lists grows the control on touch devices, which fire hover on tap.

These are the current props. Each one is too small, rotated, or both. Several also use `CARTOON_SPRINGS.bouncy` (`stiffness: 420, damping: 14, mass: 0.7`), which oscillates.

`src/App.tsx:700` nav item:

```tsx
<motion.div whileTap={{ scale: 0.94 }} className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
  <motion.div animate={isActive ? { scale: 1.05 } : { scale: 1 }} transition={{ duration: 0.15, ease: "easeOut" }}>
```

`src/App.tsx:924-928` OTA restart button:

```tsx
<motion.button
  type="button"
  whileTap={{ scale: 0.92 }}
```

`src/App.tsx:991-992` live pill (do not change `transition` here; plan 001 owns it):

```tsx
whileHover={{ scale: 1.04 }}
whileTap={{ scale: 0.9, rotate: -2 }}
```

`src/components/common/ConfirmModal.tsx:78-83` icon, then buttons at 109 and 121:

```tsx
<motion.div
  animate={{
    scale: [0.75, 1.2, 0.95, 1],
    rotate: destructive ? [0, -10, 10, -3, 0] : [0, 8, -8, 2, 0],
  }}
  transition={{ duration: 0.45, ease: "easeOut" }}
>
```

```tsx
whileTap={{ scale: 0.9, rotate: -2 }}
transition={{ type: "spring", ...CARTOON_SPRINGS.bouncy }}
```

```tsx
whileTap={{ scale: 0.9, rotate: destructive ? 2 : -2 }}
transition={{ type: "spring", ...CARTOON_SPRINGS.bouncy }}
```

`src/components/Library.tsx:257-259` and `:361-363`:

```tsx
whileTap={{ scale: 0.95 }}
whileHover={{ scale: 1.05 }}
transition={CARTOON_SPRINGS.bouncy}
```

```tsx
whileTap={{ scale: 0.97 }}
whileHover={{ scale: 1.01 }}
transition={CARTOON_SPRINGS.bouncy}
```

`src/components/Settings.tsx:782-784`, `:856-858`, `:869-871` all use `whileTap={{ scale: 0.95 }}`, `whileHover={{ scale: 1.01 }}`, `transition={CARTOON_SPRINGS.bouncy}`.

`src/components/Workout.tsx:579-582` favorite:

```tsx
whileTap={{ scale: 0.72, rotate: 20 }}
animate={routine.favorite ? { scale: [0.8, 1.35, 0.95, 1], rotate: [0, -12, 12, 0] } : { scale: 1, rotate: 0 }}
transition={routine.favorite ? CARTOON_KEYFRAMES.wobble : appleSpringDefault}
```

`src/components/Workout.tsx:679-681` and `:694-696`:

```tsx
whileTap={{ scale: 0.88, rotate: -2 }}
whileHover={{ scale: 1.03 }}
transition={CARTOON_SPRINGS.bouncy}
```

```tsx
whileTap={{ scale: 0.88, rotate: -2 }}
whileHover={{ scale: 1.04 }}
transition={CARTOON_SPRINGS.bouncy}
```

`src/components/RoutineEditor.tsx` presses that are not set completion:

- `:1461-1463` `whileTap={{ scale: 0.91, rotate: -1.5 }}`, `whileHover={{ scale: 1.03 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:2014` `whileTap={{ scale: 0.85 }}`
- `:2031` `whileTap={{ scale: 0.85 }}`
- `:2050-2052` `whileTap={{ scale: 0.92, rotate: -1.5 }}`, `whileHover={{ scale: 1.03 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:2439-2441` `whileTap={{ scale: 0.86, rotate: -2 }}`, `whileHover={{ scale: 1.05 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:2589-2591` `whileTap={{ scale: 0.8, rotate: -4 }}`, `whileHover={{ scale: 1.1 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:2605-2607` `whileTap={{ scale: 0.8, rotate: 4 }}`, `whileHover={{ scale: 1.1 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:2623-2625`, `:2632-2634`, `:2641-2643` each `whileTap={{ scale: 0.88, rotate: -1.5 }}`, `whileHover={{ scale: 1.05 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:2662-2664` `whileTap={{ scale: 0.96 }}`, `whileHover={{ scale: 1.01 }}`, `transition={CARTOON_SPRINGS.bouncy}`
- `:3019`, `:3029`, `:3039` each `whileTap={{ scale: 0.9 }}`

`src/components/common/ReorderExercisesModal.tsx:222-223`:

```tsx
whileTap={{ scale: 0.97 }}
transition={CARTOON_SPRINGS.bouncy}
```

The scale there is already 0.97. The spring still oscillates the press.

## Target

Add this export to `src/lib/motion.ts` under the existing spring exports. Do not change `CARTOON_SPRINGS` or `APPLE_SPRINGS`.

```tsx
/** Press feedback. 160ms strong ease-out. Scale target is 0.97. */
export const pressTransition = {
  duration: 0.16,
  ease: [0.23, 1, 0.32, 1] as const,
};
```

On every control listed above, except where a step says otherwise:

```tsx
whileTap={{ scale: 0.97 }}
transition={pressTransition}
```

Delete every `whileHover` prop on those controls. Delete every `rotate` key.

Nav item (`src/App.tsx:700-705`) is tapped on every tab change, so it is quieter than 0.97:

```tsx
<motion.div whileTap={{ scale: 0.98 }} transition={pressTransition} className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
  <motion.div animate={{ scale: 1 }} transition={pressTransition}>
```

Live pill: delete `whileHover`. Set `whileTap={{ scale: 0.97 }}`. Do not replace its `transition` prop.

Confirm icon: delete `animate` and `transition` and change that `motion.div` to a `div`. The icon stays still. The dialog shell at lines 66–69 stays as it is (`duration: 0.22`, `ease: [0.16, 1, 0.3, 1]`, `scale: 0.92`).

Favorite star:

```tsx
whileTap={{ scale: 0.97 }}
animate={{ scale: 1, rotate: 0 }}
transition={pressTransition}
```

Keep the `Star` fill logic.

## Repo conventions to follow

Home already isolates press in one const (`src/components/Dashboard.tsx:27`, used at `:546` as `whileTap={{ scale: 0.98 }}` and `transition={homePress}`). This plan adds the shared const to `src/lib/motion.ts` instead of a second local string easing. Do not edit `Dashboard.tsx`. Do not use the string `"easeOut"`. The curve is exactly `[0.23, 1, 0.32, 1]`.

## Steps

1. Add `pressTransition` to `src/lib/motion.ts` exactly as in Target.
2. In `src/lib/motionAndHaptics.test.ts`, add `pressTransition` to the import from `./motion`. After the cartoon keyframe assertions, add:

```ts
assert.equal(pressTransition.duration, 0.16);
assert.deepEqual(pressTransition.ease, [0.23, 1, 0.32, 1]);
```

3. Apply the target props to every site in Problem, using the special cases for the nav item, the live pill, the confirm icon, and the favorite star.
4. Remove `CARTOON_SPRINGS` and `CARTOON_KEYFRAMES` imports from a file only when that file no longer references them.
5. Do not edit any button whose `onClick` calls `toggleSetCompletion`. Those belong to plan 002.

## Boundaries

- Do NOT change entrance `initial` / `animate` / `exit` on the OTA banner, the live pill, toasts, or the settings update panel. Plan 001 owns those.
- Do NOT change the nav `layoutId` spring at `src/App.tsx:691-695` (`stiffness: 450, damping: 32`).
- Do NOT change `src/components/Dashboard.tsx`.
- Do NOT change `CARTOON_SPRINGS` or `CARTOON_KEYFRAMES` numeric values.
- Do NOT add a dependency.
- If a listed `whileTap` line no longer matches the snippet, STOP on that file and report it.

## Verification

- **Mechanical**: `npx tsx src/lib/motionAndHaptics.test.ts` prints the existing cartoon success line and does not throw on the new `pressTransition` assertions. `npx tsc --noEmit` exits 0.
- **Feel check**: press the nav, a library row, Modifica, Inizia, the favorite star, a confirm button, a rest stepper, and the live pill. At 10% playback each press only scales to 0.97 (nav to 0.98) and returns on the cubic curve. No control rotates. No control grows on hover. The favorite star does not bounce to 1.35. The confirm icon does not wobble when the dialog opens.
- **Done when**: the files in this plan contain no `whileTap` scale below 0.97 and no `whileTap` or `whileHover` `rotate`, except `toggleSetCompletion` buttons left for plan 002.
