# 004 — Keep opacity, drop movement, when reduced motion is on

- **Status**: DONE
- **Commit**: d69780a
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 8 files, medium

## Problem

Indexed `src/` has no `prefers-reduced-motion` handling and no `useReducedMotion` call. Tab changes, toasts, banners, the live pill, and presses all move.

Tab content (`src/App.tsx:399-406`) uses `cartoonTabVariants`, which is `directionalTabVariants` (`src/lib/motion.ts:189-210`):

```tsx
initial: (direction = 0) => ({
  opacity: 0,
  x: direction > 0 ? 12 : direction < 0 ? -12 : 0,
}),
animate: {
  opacity: 1,
  x: 0,
  transition: { duration: 0.12, ease: [0.25, 1, 0.5, 1] },
},
exit: (direction = 0) => ({
  opacity: 0,
  x: direction > 0 ? -12 : direction < 0 ? 12 : 0,
  transition: { duration: 0.08, ease: [0.25, 1, 0.5, 1] },
}),
```

Reduced motion means fewer and gentler animations, not zero. Keep opacity. Drop translate, rotate, and scale overshoot. Do not use `ease-in`.

## Target

Add `src/lib/useLiftMotion.ts`. Do not import `motion/react` from `src/lib/motion.ts`. The node test `src/lib/motionAndHaptics.test.ts` imports `src/lib/motion.ts`, and a React import there can break that test.

```tsx
import { useReducedMotion } from "motion/react";
import { pressTransition } from "./motion";

export function useLiftMotion() {
  const reduce = useReducedMotion() === true;
  return { reduce, pressTransition };
}
```

Add this variant next to `cartoonTabVariants` in `src/lib/motion.ts`. Exit uses the same strong ease-out, not `ease-in`. Duration 0.2s matches a reduced fade.

```tsx
export const reducedTabVariants = {
  initial: { opacity: 0.88 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
  },
  exit: {
    opacity: 0.88,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
  },
};
```

When `reduce` is true:

- Tab shell uses `reducedTabVariants` instead of `cartoonTabVariants`.
- `whileTap` is omitted (`undefined`), so presses do not scale.
- Entrance `initial` / `exit` keep opacity and drop `x`, `y`, `scale`, and `rotate`.
- `animate` goes to `{ opacity: 1 }` with `{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }`.
- `animate-ping` is not rendered.

When `reduce` is false, leave the values from plans 001–003 in place.

## Repo conventions to follow

Motion components already import `AnimatePresence` and `motion` from `"motion/react"` (`src/App.tsx:38`). `useReducedMotion` comes from that same module. Press and tab tokens stay in `src/lib/motion.ts`.

This plan runs after 001, 002, and 003. The entrance and press values below are the post-plan values. If those plans have not landed, STOP.

## Steps

1. Add `reducedTabVariants` to `src/lib/motion.ts` exactly as in Target. Do not edit `directionalTabVariants` or `appleTabVariants`.
2. Add `src/lib/useLiftMotion.ts` exactly as in Target.
3. In `src/App.tsx` `renderAppContent`, call `const { reduce } = useLiftMotion();`. On the tab `motion.div` at line 400, set `variants={reduce ? reducedTabVariants : cartoonTabVariants}`. Import `reducedTabVariants`.
4. In these components, call `useLiftMotion()` once at the top of the component and branch. Files: `src/App.tsx` (OTA banner, live pill, nav `whileTap`), `src/components/common/ToastViewport.tsx`, `src/components/common/ConfirmModal.tsx` (dialog `motion.div` at line 66 and both buttons), `src/components/Settings.tsx` (update panel and its three buttons), `src/components/Library.tsx` (both `motion.button`s), `src/components/Workout.tsx` (favorite, Modifica, Inizia), `src/components/RoutineEditor.tsx` (every `whileTap` that plan 003 set to `pressTransition`, plus both `toggleSetCompletion` buttons), `src/components/common/ReorderExercisesModal.tsx` (save button).

Reduced branch for a press:

```tsx
whileTap={reduce ? undefined : { scale: 0.97 }}
transition={reduce ? { duration: 0.2, ease: [0.23, 1, 0.32, 1] } : pressTransition}
```

Nav stays `scale: 0.98` when motion is allowed, and `undefined` when reduced.

Reduced branch for an entrance that plans 001 left as opacity plus y/scale:

```tsx
initial={reduce ? { opacity: 0 } : { /* the plan 001 object */ }}
animate={reduce ? { opacity: 1 } : { /* the plan 001 object */ }}
exit={reduce ? { opacity: 0 } : { /* the plan 001 object */ }}
transition={reduce ? { duration: 0.2, ease: [0.23, 1, 0.32, 1] } : /* the plan 001 spring */}
```

5. On the live pill, render the ping span only when `reduce` is false. Plan 006 deletes that span. If plan 006 already removed it, do not add it back.
6. Do not call `useLiftMotion` in `src/lib/motion.ts`.

## Boundaries

- Do NOT add a React import to `src/lib/motion.ts`.
- Do NOT delete animations when reduced motion is off.
- Do NOT change `src/components/Dashboard.tsx`.
- Do NOT add a dependency. `motion/react` is already the motion import.
- If `pressTransition` or the plan 001 entrance objects are missing, STOP.

## Verification

- **Mechanical**: `npx tsx src/lib/motionAndHaptics.test.ts` still passes. `npx tsc --noEmit` exits 0.
- **Feel check**: Chrome Rendering panel, emulate `prefers-reduced-motion: reduce`. Change tabs: the page fades, it does not slide. Fire a toast and open a confirm dialog: opacity only, no slide, no scale, no icon wobble. Press Inizia and complete a set: the control does not scale. Turn emulation off and confirm the plan 001–003 motion is still there.
- **Done when**: every file in step 4 branches on `useLiftMotion().reduce`, and the tab shell uses `reducedTabVariants` only in that branch.
