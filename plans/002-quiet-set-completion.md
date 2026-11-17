# 002 — Quiet set-completion feedback

- **Status**: DONE
- **Commit**: d69780a
- **Severity**: HIGH
- **Category**: Purpose & frequency, interruptibility, physicality
- **Estimated scope**: 1 file, medium

## Problem

Marking a set done is the most repeated control in a workout. Two buttons call `toggleSetCompletion`. Both squash and twist. The main one also runs a keyframe sequence. Keyframes restart from the first frame if the user taps again before they finish.

Small set badge (`src/components/RoutineEditor.tsx:1917-1920`):

```tsx
<motion.button
  type="button"
  onClick={() => toggleSetCompletion(ex.id, set.id, set.completed)}
  whileTap={{ scale: 0.82, rotate: -3 }}
```

Main set button (`src/components/RoutineEditor.tsx:2345-2376`):

```tsx
<motion.button
  type="button"
  onClick={() => toggleSetCompletion(ex.id, set.id, set.completed)}
  whileTap={{ scale: 0.8, rotate: -3 }}
  initial={false}
  animate={{
    scale: set.completed ? [1, 1.26, 0.92, 1.06, 1] : 1,
    rotate: set.completed ? [0, -7, 7, -2, 0] : 0,
  }}
  transition={set.completed ? CARTOON_KEYFRAMES.elastic : appleSpringDefault}
>
  {set.completed && (
    <motion.span
      key={`ripple-${set.id}`}
      initial={{ scale: 0.7, opacity: 0.85 }}
      animate={{ scale: 1.9, opacity: 0 }}
      transition={CARTOON_KEYFRAMES.ripple}
      className="absolute inset-0 rounded-2xl border-2 border-white pointer-events-none"
    />
  )}
  {set.completed ? (
    <motion.span
      key="completed"
      initial={{ scale: 0.5, opacity: 0, rotate: -25 }}
      animate={{ scale: [0.5, 1.32, 0.94, 1], opacity: 1, rotate: [-20, 8, -4, 0] }}
      transition={CARTOON_KEYFRAMES.pop}
    >
      <Check className="w-5 h-5 relative z-10 text-black stroke-[2.8]" />
    </motion.span>
  ) : (
    <span className="text-sm font-extrabold text-white/90 tabular-nums">
      {displaySetNumber}
    </span>
  )}
</motion.button>
```

`CARTOON_KEYFRAMES.elastic` is `{ duration: 0.46, ease: [0.34, 1.6, 0.64, 1] }` (`src/lib/motion.ts:128-131`). `pop` is 0.42s and `ripple` is 0.48s. A press should be 100–160ms. Nothing should scale from 0.5 or rotate on this control.

The linked drop-set badge just above it (`src/components/RoutineEditor.tsx:2317-2327`) uses the same elastic keyframes:

```tsx
animate={{
  scale: set.completed ? [1, 1.2, 0.94, 1.05, 1] : 1,
  rotate: set.completed ? [0, -5, 5, 0] : 0,
}}
transition={
  set.completed
    ? { ...CARTOON_KEYFRAMES.elastic, delay: 0.08 }
    : appleSpringDefault
}
```

## Target

Press feedback is `scale: 0.97` with this exact transition, already added by plan 003 as `pressTransition` in `src/lib/motion.ts`:

```tsx
export const pressTransition = {
  duration: 0.16,
  ease: [0.23, 1, 0.32, 1] as const,
};
```

If `pressTransition` is missing, STOP. Do not paste a different curve.

Both completion buttons:

```tsx
whileTap={{ scale: 0.97 }}
transition={pressTransition}
```

No `rotate`. No `animate` keyframe arrays. No ripple `motion.span`. The check icon is a plain `<Check>`, not a `motion.span`. The drop-set badge loses `animate` and `transition` and stays a non-motion indicator: change that `motion.div` to a `div` and delete the `animate` and `transition` props. Completion is still shown by the existing green classes (`bg-[#30D158]` and the check icon).

## Repo conventions to follow

`pressTransition` is the shared press token from plan 003. The home screen already uses a small named press const plus `whileTap={{ scale: 0.98 }}` at `src/components/Dashboard.tsx:27` and `:546`. Match that shape (named const, scale only). Use 0.97 and the cubic array above, not the string `"easeOut"`.

## Steps

1. Confirm `pressTransition` is exported from `src/lib/motion.ts`. Import it in `src/components/RoutineEditor.tsx`.
2. On the button at line 1917 (`whileTap={{ scale: 0.82, rotate: -3 }}`), set `whileTap={{ scale: 0.97 }}` and `transition={pressTransition}`. Do not add rotate. Do not add an `animate` prop.
3. Replace the drop-set `motion.div` at line 2317 with a `div`. Delete `initial`, `animate`, and `transition`. Keep the className and the children.
4. On the button at line 2345, set `whileTap={{ scale: 0.97 }}` and `transition={pressTransition}`. Delete `initial`, `animate`, the ripple `motion.span`, and the check `motion.span`. Render `<Check className="w-5 h-5 relative z-10 text-black stroke-[2.8]" />` when `set.completed` is true, and keep the numbered `<span>` when it is false.
5. If `CARTOON_KEYFRAMES` is unused after that, remove it from the import. Leave `CARTOON_SPRINGS` alone if other buttons still use it.

## Boundaries

- Do NOT change `CARTOON_KEYFRAMES` values in `src/lib/motion.ts` or the assertions in `src/lib/motionAndHaptics.test.ts`.
- Do NOT edit any `motion.button` whose `onClick` is not `toggleSetCompletion`, except the drop-set badge in step 3.
- Do NOT change set-logging logic, haptics, or class colors.
- Do NOT add a dependency.
- If either button's `onClick` is no longer `toggleSetCompletion`, STOP.

## Verification

- **Mechanical**: `npx tsc --noEmit` exits 0. `npx tsx src/lib/motionAndHaptics.test.ts` still passes the keyframe duration assertions (0.42, 0.46, 0.48, 0.48).
- **Feel check**: in a live workout, complete and uncomplete the same set five times quickly. At 10% playback the button scales to 0.97 and returns. It does not rotate, does not grow past 1, and a second tap does not replay a multi-step bounce. The ripple ring is gone. The check icon still appears.
- **Done when**: `RoutineEditor.tsx` has no `CARTOON_KEYFRAMES` usage and no `toggleSetCompletion` button with `rotate` or a scale below 0.97.
