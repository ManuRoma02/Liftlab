# Animation plans

Written against commit `d69780a`. Source code was not changed. Execute in this order. Each later plan assumes the earlier one landed. If a snippet does not match, the plan says STOP.

| Plan | Title | Severity | Status | Depends on |
| --- | --- | --- | --- | --- |
| 001 | Retire cartoon springs on entrances | HIGH | DONE | — |
| 003 | Replace exaggerated presses with one 160ms press | HIGH | DONE | 001, because both touch the live pill. 001 owns `transition` on that pill. |
| 002 | Quiet set-completion feedback | HIGH | DONE | 003, because it imports `pressTransition` |
| 005 | Give the routine menu button a real press | LOW | DONE | none, but run after 003 so `Workout.tsx` is edited once |
| 006 | Stop the live pill from pinging forever | MEDIUM | DONE | none. If 004 runs after this, it must not put `animate-ping` back |
| 004 | Keep opacity, drop movement, when reduced motion is on | HIGH | DONE | 001, 002, 003, 006 |

Recommended order: 001, 003, 002, 005, 006, 004.

Out of scope for every plan: `src/components/Dashboard.tsx` (`homePress` is already the quiet home press), `CARTOON_SPRINGS` / `CARTOON_KEYFRAMES` numeric values, and the nav `layoutId` spring in `src/App.tsx`.
