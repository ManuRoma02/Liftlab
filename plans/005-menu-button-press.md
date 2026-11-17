# 005 — Give the routine menu button a real press

- **Status**: DONE
- **Commit**: d69780a
- **Severity**: LOW
- **Category**: Missed opportunity, physicality
- **Estimated scope**: 1 file, tiny

## Problem

The routine overflow button is a plain `<button>`. `active:scale-90` jumps to 0.9, and `transition-colors` does not transition `transform`, so the scale snaps.

`src/components/Workout.tsx:597-609`:

```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    triggerHaptic("light");
    setActiveMenuId(
      activeMenuId === routine.id ? null : routine.id,
    );
  }}
  aria-label={`Actions for ${routine.name || "routine"}`}
  aria-expanded={activeMenuId === routine.id}
  aria-haspopup="menu"
  className="min-w-[44px] min-h-[44px] text-[#8E8E93] hover:text-white transition-colors relative z-10 cursor-pointer flex items-center justify-center rounded-full hover:bg-white/5 active:scale-90"
>
  <MoreVertical className="w-4 h-4" />
</button>
```

## Target

Press scale is 0.97. The transform transition is 160ms with the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`. Color can still change. Tailwind classes, no new motion component:

```tsx
className="min-w-[44px] min-h-[44px] text-[#8E8E93] hover:text-white relative z-10 cursor-pointer flex items-center justify-center rounded-full hover:bg-white/5 active:scale-[0.97] transition-[transform,color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
```

`duration-150` is 150ms, inside the 100–160ms press budget. Do not use Tailwind's built-in `ease-out`.

## Repo conventions to follow

This button is not a `motion` component. Keep it as a `<button>`. The scale 0.97 and the cubic match `pressTransition` in `src/lib/motion.ts` after plan 003. Do not import Motion just for this class.

## Steps

1. In `src/components/Workout.tsx`, replace the className string on the button that contains `<MoreVertical` with the target className. Leave the `onClick`, aria attributes, and icon as they are.
2. Do not change the favorite `motion.button` above it.

## Boundaries

- Do NOT convert this button to `motion.button`.
- Do NOT change other `active:scale-90` buttons in the repo. This plan is only this menu button.
- Do NOT edit `Dashboard.tsx`.
- If the className no longer contains `active:scale-90`, STOP.

## Verification

- **Mechanical**: `npx tsc --noEmit` exits 0.
- **Feel check**: on the workout list, press the vertical-dots button. At 10% playback it scales to 0.97 and the color fades. It does not jump to 0.9 and it does not rotate. The menu still opens.
- **Done when**: that className contains `active:scale-[0.97]` and `ease-[cubic-bezier(0.23,1,0.32,1)]`, and it does not contain `active:scale-90` or `transition-colors`.
