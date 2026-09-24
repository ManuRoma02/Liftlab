# LiftLab: First-Time UX, Onboarding & Italian Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate workout discard button ambiguity, complete 100% Italian localization across all tabs/eyebrows/exercises, provide beginner guidance with streamlined 4-column workout entry (RPE off by default), and replace the cold zero-metric Day One dashboard with a welcoming, actionable onboarding hub.

**Architecture:** 
- Centralize all new/refined translation tokens in `src/data/translations.ts` with automated unit testing in `src/lib/translations.test.ts`.
- Update `RoutineEditor.tsx` to provide clear exit actions ("Abbandona"), distinct modal buttons ("Elimina allenamento" vs "Continua allenamento"), an onboarding guide banner, and localized set placeholders.
- Update `useWorkoutData.ts` to default `showRpe` to `false` for new users while retaining full Settings toggling.
- Localize all static tab eyebrows, search inputs, badges, and timeframe buttons in `Workout.tsx`, `Library.tsx`, and `Progress.tsx`.
- Refactor `Dashboard.tsx` to display a dedicated Welcome Hub and Progress Preview card on Day One (`workoutLogs.length === 0`), dynamically activating the metric Bento grid once the user completes their first session.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Vitest/TSX.

## Global Constraints
- Do not introduce regressions to existing live workout crash recovery or timer logic.
- All Italian copy must sound natural, professional, and consistent with modern fitness apps (Strong, Hevy).
- TypeScript strictness: zero errors on `npx tsc --noEmit`.
- Automated tests run via `npm test` (`tsx`).

---

### Task 1: Localization Foundation & Automated Test

**Files:**
- Create: `src/lib/translations.test.ts`
- Modify: `src/data/translations.ts`

**Interfaces:**
- Consumes: `translations` object from `src/data/translations.ts`.
- Produces: Updated dictionary containing distinct `exit_workout`, `discard_workout_confirm_btn`, `keep_workout_btn`, starter exercise translations, and Day One dashboard copy across `it`, `en`, and `es`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/translations.test.ts`:
```ts
import assert from "node:assert/strict";
import { translations } from "../data/translations";

console.log("Running translations tests...");

const it = translations.it;
assert.ok(it, "Italian translations should exist");

// Discard vs Cancel disambiguation
assert.notEqual(it.discard_workout_confirm_btn, it.cancel, "Discard confirm button must not equal cancel");
assert.equal(it.discard_workout_confirm_btn, "Elimina allenamento");
assert.equal(it.keep_workout_btn, "Continua allenamento");
assert.equal(it.exit_workout, "Abbandona");

// Starter exercises
assert.equal(it["Barbell Full Squat"], "Squat con Bilanciere");
assert.equal(it["Barbell Deadlift"], "Stacco da Terra con Bilanciere");
assert.equal(it["Cable Cross-Over Variation"], "Croci ai Cavi");
assert.equal(it["Barbell Bench Press"], "Panca Piana con Bilanciere");

// Day One Dashboard tokens
assert.ok(it.no_log_day, "no_log_day should exist in IT");
assert.ok(it.welcome_title, "welcome_title should exist in IT");
assert.ok(it.progress_preview_title, "progress_preview_title should exist in IT");
assert.ok(it.workout_guide_title, "workout_guide_title should exist in IT");

console.log("Translations tests passed!");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/lib/translations.test.ts`
Expected: FAIL with assertion error.

- [ ] **Step 3: Update `src/data/translations.ts` with all required tokens**

In `src/data/translations.ts`, add the missing and disambiguated keys for `en`, `it`, and `es`:
```ts
// In en:
exit_workout: "Discard",
discard_workout_confirm_btn: "Discard Workout",
keep_workout_btn: "Keep Workout",
no_log_day: "No workout logged",
logged_count: "{count} logged",
training_calendar_day: "{day} training calendar",
history_saved_local: "Workout history saved locally",
goal_reached_badge: "Goal reached!",
workouts_left: "{count} left",
percent_this_week: "{percent}% this week",
set_your_goal: "Set Your Goal",
workouts_per_week: "workouts per week",
avg_last_4_weeks: "Avg last 4 weeks: {count} sessions",
past_4_weeks: "Past 4 Weeks",
now_label: "Now",
green_workout_legend: "Green = workout day • Last 35 days shown",
welcome_title: "Welcome to LiftLab!",
welcome_subtitle: "Your fitness journey starts today. Choose how to begin:",
start_today_routine: "Start Today's Routine",
freestyle_session: "Start Freestyle Workout",
freestyle_desc: "Train freely and add exercises as you go.",
or_browse_routines: "Or browse and create routines in the Workout tab",
progress_preview_title: "Your progress will appear here",
progress_preview_desc: "Total volume, weekly sets, 1RM estimates, and personal records will automatically unlock after you complete your first workout.",
workout_guide_title: "How to log your workout",
workout_guide_p1: "Enter weight and reps for each completed set.",
workout_guide_p2: "Tap the set number on the left to check it off and trigger the rest timer.",
workout_guide_p3: "The 'Prev.' column will show your past weights on future workouts.",
got_it: "Got it",
first_time_badge: "New",
monthly: "Monthly",
yearly: "Yearly",
all_time: "All Time",
loading_catalog: "Loading offline exercise catalog...",
exercises_stored_offline: "{count} exercises available offline",
featured_badge: "Featured",
found_badge: "{count} found",
start_first_workout_cta: "Start Your First Workout",

// In it:
exit_workout: "Abbandona",
discard_workout_confirm_btn: "Elimina allenamento",
keep_workout_btn: "Continua allenamento",
no_log_day: "Nessun allenamento",
logged_count: "{count} completati",
training_calendar_day: "Calendario: {day}",
history_saved_local: "Storico salvato sul dispositivo",
goal_reached_badge: "Obiettivo raggiunto!",
workouts_left: "{count} rimanenti",
percent_this_week: "{percent}% questa settimana",
set_your_goal: "Imposta il Tuo Obiettivo",
workouts_per_week: "allenamenti a settimana",
avg_last_4_weeks: "Media ultime 4 settimane: {count} sessioni",
past_4_weeks: "Ultime 4 Settimane",
now_label: "Ora",
green_workout_legend: "Verde = giorno di allenamento • Ultimi 35 giorni",
welcome_title: "Benvenuto su LiftLab!",
welcome_subtitle: "Il tuo percorso inizia oggi. Scegli come svolgere il tuo primo allenamento:",
start_today_routine: "Avvia Scheda Consigliata",
freestyle_session: "Inizia Allenamento Libero",
freestyle_desc: "Allenati senza scheda e aggiungi gli esercizi mentre ti alleni.",
or_browse_routines: "Oppure sfoglia e crea nuove schede nella sezione Allenamento",
progress_preview_title: "I tuoi progressi appariranno qui",
progress_preview_desc: "Volume totale, serie settimanali, massimali stimati e record personali si popoleranno automaticamente non appena completerai la tua prima sessione.",
workout_guide_title: "Come registrare la sessione",
workout_guide_p1: "Inserisci carico (KG) e ripetizioni (RIPET.) per ogni serie completata.",
workout_guide_p2: "Tocca il numero della serie a sinistra per completarla e avviare il timer di recupero.",
workout_guide_p3: "I trattini in 'Serie Prec.' mostreranno i tuoi carichi passati nelle prossime sessioni.",
got_it: "Ho capito",
first_time_badge: "Nuovo",
monthly: "Mensile",
yearly: "Annuale",
all_time: "Sempre",
loading_catalog: "Caricamento catalogo offline...",
exercises_stored_offline: "{count} esercizi disponibili offline",
featured_badge: "In evidenza",
found_badge: "{count} trovati",
start_first_workout_cta: "Inizia il tuo primo allenamento",
"Barbell Full Squat": "Squat con Bilanciere",
"Barbell Deadlift": "Stacco da Terra con Bilanciere",
"Cable Cross-Over Variation": "Croci ai Cavi",
"Barbell Bench Press": "Panca Piana con Bilanciere",
"Dumbbell Incline Bench Press": "Panca Inclinata con Manubri",
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/lib/translations.test.ts`
Expected: PASS with "Translations tests passed!"

- [ ] **Step 5: Add translations test to package.json scripts and commit**

Modify `package.json`: append `&& tsx src/lib/translations.test.ts` to `scripts.test`.
Run: `npm test`
Expected: All tests pass.
Commit:
```bash
git add src/data/translations.ts src/lib/translations.test.ts package.json
git commit -m "feat(i18n): add comprehensive Italian translations and test"
```

---

### Task 2: Discard Workout UX & Modal Disambiguation

**Files:**
- Modify: `src/components/RoutineEditor.tsx:1100-1110, 2240-2260`

**Interfaces:**
- Consumes: `t("exit_workout")`, `t("discard_workout_confirm_btn")`, `t("keep_workout_btn")`
- Produces: Unambiguous exit button and modal in live workout mode.

- [ ] **Step 1: Update TopBar live mode discard button in `RoutineEditor.tsx`**

In `src/components/RoutineEditor.tsx` (around line 1100):
```tsx
{mode === "live" && onDiscard && (
  <button
    onClick={() => {
      setDiscardConfirmOpen(true);
    }}
    className="text-error font-bold uppercase hover:bg-error/10 active:scale-95 transition-all tracking-wider px-3 py-2 rounded-full text-[11px] cursor-pointer"
  >
    {t("exit_workout") || "Abbandona"}
  </button>
)}
```

- [ ] **Step 2: Update `ConfirmModal` for workout discard in `RoutineEditor.tsx`**

In `src/components/RoutineEditor.tsx` (around line 2242):
```tsx
{discardConfirmOpen && (
  <ConfirmModal
    title={t("exit_workout") || "Abbandona allenamento"}
    message={(t("discard_workout_confirm") || "Sei sicuro di voler eliminare questo allenamento? I progressi andranno persi.").replace("{name}", userName || "amico")}
    confirmLabel={t("discard_workout_confirm_btn") || "Elimina allenamento"}
    cancelLabel={t("keep_workout_btn") || "Continua allenamento"}
    destructive
    onConfirm={() => {
      setDiscardConfirmOpen(false);
      removeJsonAtomic(LIVE_PROGRESS_KEY);
      localStorage.removeItem(LIVE_ELAPSED_KEY);
      localStorage.removeItem(LIVE_REST_TIMER_KEY);
      localStorage.removeItem(LIVE_STARTED_AT_KEY);
      startRestTimer(0);
      stopLiveWorkoutNotification();
      onDiscard?.();
    }}
    onCancel={() => setDiscardConfirmOpen(false)}
  />
)}
```

- [ ] **Step 3: Verify TypeScript compilation & tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git bash
git add src/components/RoutineEditor.tsx
git commit -m "fix(ux): disambiguate workout discard dialog buttons and top bar action"
```

---

### Task 3: Active Workout Guidance & Default RPE Streamlining

**Files:**
- Modify: `src/hooks/useWorkoutData.ts:305-312`
- Modify: `src/components/RoutineEditor.tsx`

**Interfaces:**
- Consumes: `workoutLogs`, `showRpe`, `t`
- Produces: Default `showRpe = false` for clean 4-column layout, dismissible beginner guide banner, localized reps placeholder, softened previous set indicator.

- [ ] **Step 1: Set default `showRpe` to false for new users in `src/hooks/useWorkoutData.ts`**

Update `useWorkoutData.ts`:
```ts
const [showRpe, setShowRpe] = useState<boolean>(() => {
  const saved = localStorage.getItem("liftlab_guest_data");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.showRpe === true; // Default to FALSE for new users unless explicitly true
    } catch {}
  }
  return false;
});
```
And in `loadUserData`:
```ts
setShowRpe(userData.showRpe === true);
```

- [ ] **Step 2: Add dismissible `FirstWorkoutGuideBanner` in `src/components/RoutineEditor.tsx`**

Add state in `RoutineEditor.tsx`:
```tsx
const [isGuideDismissed, setIsGuideDismissed] = useState<boolean>(() => {
  return localStorage.getItem("liftlab_workout_guide_dismissed") === "true";
});

const handleDismissGuide = () => {
  localStorage.setItem("liftlab_workout_guide_dismissed", "true");
  setIsGuideDismissed(true);
};
```
Render banner just above exercise group container if `mode === "live"` and `workoutLogs.length === 0` and `!isGuideDismissed`:
```tsx
{mode === "live" && workoutLogs.length === 0 && !isGuideDismissed && (
  <div className="mx-margin-mobile md:mx-margin-desktop mb-4 p-4 rounded-2xl bg-[#1C1C1E] border border-[#30D158]/30 shadow-lg relative flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#30D158]" />
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          {t("workout_guide_title") || "Come registrare la sessione"}
        </h4>
      </div>
      <button
        onClick={handleDismissGuide}
        className="text-[#8E8E93] hover:text-white text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        {t("got_it") || "Ho capito"}
      </button>
    </div>
    <ul className="text-xs text-[#8E8E93] space-y-1 pl-1">
      <li>• <strong>{unit}</strong> e <strong>{t("reps_upper") || "RIPET."}</strong>: inserisci i valori per ogni serie completata.</li>
      <li>• <strong>Numero serie (1, 2...)</strong>: tocca per segnarla come completata e avviare il recupero.</li>
      <li>• <strong>{t("previous") || "Prec."}</strong>: mostra i tuoi carichi passati per confrontare i progressi.</li>
    </ul>
  </div>
)}
```

- [ ] **Step 3: Update reps input placeholder and previous sets indicator in `RoutineEditor.tsx`**

Line 1708:
```tsx
placeholder={isTimedExercise(ex) ? "Secs" : (t("reps_upper") || "Ripet.")}
```
Line 1641 (no previous set available):
```tsx
return (
  <span className="text-[10px] text-[#8E8E93]/60 font-medium uppercase tracking-tight">
    {sIdx === 0 ? (t("first_time_badge") || "Nuovo") : "—"}
  </span>
);
```

- [ ] **Step 4: Verify TypeScript compilation & tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWorkoutData.ts src/components/RoutineEditor.tsx
git commit -m "feat(workout): streamline 4-column set view and add first-time workout guidance"
```

---

### Task 4: App-Wide Eyebrows, Badges, Search & Subtitles Localization

**Files:**
- Modify: `src/components/Workout.tsx`
- Modify: `src/components/Library.tsx`
- Modify: `src/components/Progress.tsx`

**Interfaces:**
- Consumes: Translation keys from `src/data/translations.ts`
- Produces: 100% localized tabs with zero hardcoded English eyebrow banners, subtitles, or search placeholders.

- [ ] **Step 1: Localize `Workout.tsx` TabHero and strings**

In `src/components/Workout.tsx`:
```tsx
<TabHero
  eyebrow={t("workout")}
  title={t("workout")}
  subtitle={routines.length > 0 ? t("select_program") : (t("no_routines_subtitle") || "Crea la tua prima scheda per iniziare ad allenarti.")}
  icon={<Dumbbell className="w-7 h-7" />}
  onOpenSettings={() => navigateTo("settings")}
  metric={
    <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
      {routinesToday > 0 ? `${routinesToday} ${t("today")?.toLowerCase() || "oggi"}` : `${routines.length} ${t("routines")?.toLowerCase() || "schede"}`}
    </span>
  }
  ...
/>
```

- [ ] **Step 2: Localize `Library.tsx` TabHero, search bar and catalog badges**

In `src/components/Library.tsx`:
```tsx
<TabHero
  eyebrow={t("library")}
  title={t("library")}
  subtitle={isCatalogLoading ? (t("loading_catalog") || "Caricamento catalogo...") : (t("exercises_stored_offline") || "{count} esercizi disponibili offline").replace("{count}", String(safeExercises.length))}
  icon={<Database className="w-7 h-7" />}
  onOpenSettings={onOpenSettings}
  metric={
    <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
      {isSearching ? (t("found_badge") || "{count} trovati").replace("{count}", String(filteredExercises.length)) : (t("featured_badge") || "In evidenza")}
    </span>
  }
  ...
/>
```
And search input:
```tsx
<input
  className="w-full bg-[#1C1C1E] border border-white/8 rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:border-[#30D158]/50 focus:outline-none transition-all placeholder:text-[#8E8E93]"
  placeholder={t("search") || "Cerca esercizi..."}
  aria-label={t("search") || "Cerca esercizi"}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

- [ ] **Step 3: Localize `Progress.tsx` TabHero, timeframes and history modal**

In `src/components/Progress.tsx`:
```tsx
<TabHero
  eyebrow={t("progress")}
  title={t("progress")}
  subtitle={t("progress_subtitle") || "Monitora i tuoi progressi e perfeziona la tua strategia."}
  icon={<LucideLineChart className="w-7 h-7" />}
  onOpenSettings={() => navigateTo("settings")}
  metric={
    <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
      {totalLoggedSets} {t("set")?.toLowerCase() || "serie"}
    </span>
  }
  action={
    <div className="flex p-1 bg-white/6 backdrop-blur-xl rounded-full border border-white/10">
      {[
        { id: "Monthly", label: t("monthly") || "Mensile" },
        { id: "Yearly", label: t("yearly") || "Annuale" },
        { id: "All Time", label: t("all_time") || "Sempre" },
      ].map((frame) => (
        <button
          key={frame.id}
          onClick={() => {
            triggerHaptic("light");
            setTimeframe(frame.id);
          }}
          className={`flex-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            timeframe === frame.id
              ? "bg-[#30D158] text-black shadow-sm"
              : "text-[#8E8E93] hover:text-white"
          }`}
        >
          {frame.label}
        </button>
      ))}
    </div>
  }
/>
```
And history section:
```tsx
<h3 className="font-bold text-white text-base">
  {t("workout_history") || "Storico Allenamenti"}
</h3>
<p className="text-xs text-[#8E8E93]">
  {(t("completed_sessions_count") || "Sessioni completate ({count})").replace("{count}", String(workoutLogs.length))}
</p>
```

- [ ] **Step 4: Verify TypeScript compilation & tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Workout.tsx src/components/Library.tsx src/components/Progress.tsx
git commit -m "fix(i18n): eliminate hardcoded English eyebrows, search placeholders and subtitles"
```

---

### Task 5: Empty Dashboard & Day One Welcome Hub

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `workoutLogs`, `nextRoutine`, `t`, `onStartLiveWorkout`, `navigateTo`
- Produces: Inviting Welcome Hub with dual start CTAs and a progress preview card replacing the zeroed-out stats when `workoutLogs.length === 0`. Full localization of all calendar headers and modals.

- [ ] **Step 1: Localize Dashboard top header, calendar, and modal dialogs**

In `src/components/Dashboard.tsx`:
- Line 411: `<p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#30D158]">{t("dashboard")}</p>`
- Line 417: `<p className="text-xs text-[#8E8E93] mt-0.5">{(t("training_calendar_day") || "Calendario: {day}").replace("{day}", days[selectedDayIndex].full)}</p>`
- Line 439-440:
```tsx
<span className="text-xs font-semibold text-[#30D158]">
  {selectedActivities.length > 0
    ? (t("logged_count") || "{count} completati").replace("{count}", String(selectedActivities.length))
    : (t("no_log_day") || "Nessun allenamento")}
</span>
```
- Line 519: `<span className="text-[10px] font-bold uppercase tracking-[0.06em]">{t("history") || "Storico"}</span>`
- Line 531: `{workoutLogs.length === 1 ? (t("workout_singular") || "allenamento") : (t("workouts_plural") || "allenamenti")}`
- Line 535: `{t("history_saved_local") || "Storico salvato sul dispositivo"}`
- Line 554: `<span className="text-[10px] font-bold uppercase tracking-[0.06em]">{t("weekly_goal") || "Obiettivo Settimanale"}</span>`
- Line 580: `{goalProgress >= 1 ? (t("goal_reached_badge") || "Obiettivo raggiunto!") : (t("workouts_left") || "{count} rimanenti").replace("{count}", String(weeklyGoal - workoutsThisWeek))}`
- Line 590: `{(t("percent_this_week") || "{percent}% questa settimana").replace("{percent}", String(Math.round(goalProgress * 100)))}`
- Modals: localizing labels for "Workout History", "Weekly Goal", "Set Your Goal", "Past 4 Weeks", "Now".

- [ ] **Step 2: Implement Day One Welcome Hub when `workoutLogs.length === 0`**

In `src/components/Dashboard.tsx`, if `workoutLogs.length === 0` and `selectedDayIndex === todayIndex`:
Render the Welcome Hub section:
```tsx
{workoutLogs.length === 0 && (
  <section className="bg-gradient-to-br from-[#1C1C1E] via-[#1C1C1E] to-[#161618] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.45)] relative overflow-hidden flex flex-col gap-4">
    <div className="absolute top-0 right-0 w-72 h-72 bg-[#30D158]/10 blur-[90px] rounded-full pointer-events-none" />
    <div className="relative z-10 flex flex-col gap-1.5">
      <span className="w-fit text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#30D158] bg-[#30D158]/15 px-3 py-1 rounded-full border border-[#30D158]/30">
        LiftLab Starter
      </span>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        {userName ? `${t("welcome_title") || "Benvenuto su LiftLab"}, ${userName}!` : (t("welcome_title") || "Benvenuto su LiftLab!")}
      </h2>
      <p className="text-xs sm:text-sm text-[#8E8E93] max-w-xl">
        {t("welcome_subtitle") || "Il tuo percorso inizia oggi. Scegli come svolgere il tuo primo allenamento:"}
      </p>
    </div>

    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
      {/* Option A: Scheduled or Default Starter Routine */}
      {nextRoutine ? (
        <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full">
                {t("recommended") || "Consigliata per oggi"}
              </span>
              <span className="text-xs text-[#8E8E93] flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" /> {nextRoutine.duration} min
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#30D158] transition-colors">
              {nextRoutine.name}
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1 line-clamp-1">
              {nextRoutine.exercises?.map((e) => t(e.title)).join(" • ")}
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic("medium");
              onStartLiveWorkout(nextRoutine.id);
            }}
            className="w-full bg-[#30D158] text-black font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(48,209,88,0.35)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{t("start_today_routine") || "Avvia Scheda di Oggi"}</span>
          </button>
        </div>
      ) : null}

      {/* Option B: Freestyle Session */}
      <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
            {t("freestyle") || "Libero"}
          </span>
          <h3 className="text-lg font-bold text-white">
            {t("freestyle_session") || "Inizia Allenamento Libero"}
          </h3>
          <p className="text-xs text-[#8E8E93] mt-1">
            {t("freestyle_desc") || "Allenati senza scheda e aggiungi gli esercizi mentre ti alleni."}
          </p>
        </div>
        <button
          onClick={() => {
            triggerHaptic("medium");
            onStartLiveWorkout("empty");
          }}
          className="w-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("start_empty") || "Allenamento Libero"}</span>
        </button>
      </div>
    </div>

    <div className="relative z-10 pt-1 text-center sm:text-left">
      <button
        onClick={() => {
          triggerHaptic("light");
          navigateTo("workout");
        }}
        className="text-xs text-[#8E8E93] hover:text-[#30D158] transition-colors underline-offset-4 hover:underline cursor-pointer"
      >
        {t("or_browse_routines") || "Oppure sfoglia e crea nuove schede nella sezione Allenamento →"}
      </button>
    </div>
  </section>
)}
```

- [ ] **Step 3: Replace barren zeroed Bento with Progress Preview Card when `workoutLogs.length === 0`**

In `Dashboard.tsx`, wrap the Quick Stats Bento Grid:
```tsx
{workoutLogs.length === 0 ? (
  <section className="bg-[#1C1C1E] border border-white/8 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
    <div className="w-14 h-14 rounded-2xl bg-[#30D158]/12 border border-[#30D158]/25 flex items-center justify-center shrink-0 text-[#30D158]">
      <LucideLineChart className="w-7 h-7" />
    </div>
    <div className="flex-1 text-center sm:text-left">
      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
        {t("progress_preview_title") || "I tuoi progressi appariranno qui"}
      </h3>
      <p className="text-xs sm:text-sm text-[#8E8E93] mt-1 max-w-xl">
        {t("progress_preview_desc") || "Volume totale, serie settimanali, massimali stimati e record personali si popoleranno automaticamente non appena completerai la tua prima sessione."}
      </p>
    </div>
    <button
      onClick={() => {
        triggerHaptic("medium");
        onStartLiveWorkout(nextRoutine?.id || "empty");
      }}
      className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-3 rounded-xl border border-white/10 shrink-0 cursor-pointer active:scale-95 transition-all"
    >
      {t("start_first_workout_cta") || "Inizia ora"}
    </button>
  </section>
) : (
  /* Existing rich Bento grid rendered when workoutLogs.length > 0 */
  ...
)}
```

- [ ] **Step 4: Verify TypeScript compilation & tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): add Day One Welcome Hub and progress preview card"
```

---

### Task 6: End-to-End Build & Automated Verification

**Files:**
- Run full test suite & production build.

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: All unit tests pass.

- [ ] **Step 2: Run TypeScript compile check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Successful build in `dist/`.

- [ ] **Step 4: Commit and finalize**

```bash
git add -A
git commit -m "chore(release): verify build and all test suites pass"
```
