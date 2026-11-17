# 006 — Stop the live pill from pinging forever

- **Status**: DONE
- **Commit**: d69780a
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, tiny

## Problem

The return-to-workout pill stays on screen for the whole session. Its dot runs `animate-ping` the entire time. That is constant decorative motion on a control the user can see for an hour.

`src/App.tsx:1001-1004`:

```tsx
<div className="relative flex items-center justify-center">
  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-ping absolute opacity-75"></span>
  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]"></span>
</div>
```

The pill's own entrance is enough to show that it arrived. Plan 001 owns that entrance. The solid green dot still marks the live state.

## Target

```tsx
<div className="relative flex items-center justify-center">
  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]"></span>
</div>
```

No `animate-ping`. No second span.

## Repo conventions to follow

The pill is the `motion.button` with `key="live-session-pill"` in `src/App.tsx`. Only the inner dot markup changes. Leave `whileTap`, `transition`, and the entrance props to plans 001 and 003.

## Steps

1. Delete the `<span>` whose className includes `animate-ping` inside `key="live-session-pill"`.
2. Keep the solid `w-2.5 h-2.5 rounded-full bg-[#30D158]` span.

## Boundaries

- Do NOT remove the pill.
- Do NOT change its entrance, press, or click handler.
- Do NOT change other `animate-ping` or `animate-pulse` classes in the repo.
- If that ping span is already gone, STOP and report the plan as already done.

## Verification

- **Mechanical**: `npx tsc --noEmit` exits 0.
- **Feel check**: start a live workout, leave the editor, and watch the pill for several seconds. The green dot is steady. It does not radiate. The pill still opens the live editor.
- **Done when**: `src/App.tsx` has no `animate-ping` inside the live-session pill.
