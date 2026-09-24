# LiftLab: First-Time User Experience (FTUE), Onboarding & Full Italian Localization Design

- **Date**: 2026-09-24
- **Status**: Approved by User
- **Topic**: First-Time User Experience (FTUE), Active Workout Guidance, Discard Dialog UX, and Complete Italian Localization

---

## 1. Overview & Context

A comprehensive UX evaluation of LiftLab revealed four friction points during onboarding and initial usage:
1. **Critical Ambiguity in the Workout Cancellation Dialog**:
   Prematurely stopping an active workout opened a confirmation modal where both the destructive button (red) and the cancel/dismiss button (gray) were identically labeled "Annulla" due to duplicate string mappings in Italian.
2. **Incomplete Localization (Half English / Half Italian)**:
   The user interface mixed English and Italian in visible areas: tab eyebrows ("DASHBOARD", "WORKOUT", "LIBRARY", "PROGRESS"), calendar status ("No log"), widget labels ("History", "Weekly Goal"), search inputs ("Search exercises..."), and starter routine exercise names (*Barbell Full Squat*, *Barbell Deadlift*, *Cable Cross-Over Variation*).
3. **Cognitive Overload in the First Active Workout Session**:
   Launching a workout dumped an unguided table of 12 sets with empty weight fields, a technical "RPE" column enabled by default, and dashes (`-`) under "SERIE PREC." without explaining what to input or how to mark sets as completed.
4. **Cold / Broken-Looking Empty Dashboard on Day One**:
   A brand-new user with zero logged workouts faced a grid of eight zeroed-out metric boxes (`0 min`, `0 sets`, `0 kg`, `0 PRs`), creating the impression of a broken or lifeless spreadsheet rather than an encouraging fitness tracker.

This document outlines the architectural and design solutions across all four domains to deliver a polished, intuitive, and 100% localized experience.

---

## 2. Section 1: Discard Workout Dialog & Navigation Safety

### 2.1 Problem Analysis
In `src/data/translations.ts`, both keys `cancel` and `discard` were mapped to `"Annulla"`. In `src/components/RoutineEditor.tsx`, the top bar button used `{t("discard")}` ("Annulla"), which opened `ConfirmModal`:
```tsx
<ConfirmModal
  confirmLabel={t("discard")} // Evaluated to "Annulla" (Destructive / Red)
  cancelLabel={t("cancel")}   // Evaluated to "Annulla" (Neutral / Gray)
  destructive
  ...
/>
```
This forced the user to guess intent purely based on button styling, risking accidental workout deletion or confusion.

### 2.2 Specifications
1. **Top Bar Exit Action**:
   - The button in `RoutineEditor` live mode will be labeled `"Abbandona"` (Italian), `"Discard"` (English), `"Abandonar"` (Spanish).
   - Key: `exit_workout` / `discard`.
2. **Discard Confirmation Modal**:
   - **Title/Message**: *"Tutto questo sudore per niente, {name}? Sei sicuro di voler eliminare questo allenamento? I progressi della sessione andranno persi."*
   - **Confirm Button (Red / Destructive)**:
     - IT: `"Elimina allenamento"`
     - EN: `"Discard Workout"`
     - ES: `"Eliminar entrenamiento"`
     - Key: `discard_workout_confirm_btn`
   - **Cancel Button (Gray / Safe)**:
     - IT: `"Continua allenamento"`
     - EN: `"Keep Workout"`
     - ES: `"Continuar entrenamiento"`
     - Key: `keep_workout_btn`
3. **Audit of All Other App Modals**:
   - Routine deletion: `"Elimina"` vs `"Annulla"`.
   - History log deletion: `"Elimina"` vs `"Annulla"`.
   - Account/data purge: `"Elimina tutto"` vs `"Annulla"`.

---

## 3. Section 2: Complete 100% Italian Localization

### 3.1 Problem Analysis
Several core UI components hardcoded English strings into eyebrows, subtitles, and labels instead of consuming translation keys:
- `Dashboard.tsx`: Hardcoded `"Dashboard"`, `"History"`, `"Weekly Goal"`, `"No log"`, `"training calendar"`, `"logs"`, `"Goal reached!"`.
- `Workout.tsx`: Hardcoded `eyebrow="Workout"`, `"Create your first routine to start training."`, `"today"`, `"routines"`.
- `Library.tsx`: Hardcoded `eyebrow="Library"`, `"Search exercises..."`, `"Featured"`, `"found"`, `"exercises stored locally"`.
- `Progress.tsx`: Hardcoded `eyebrow="Progress"`, `"Track your gains, refine your strategy."`, `"Monthly", "Yearly", "All Time"`, `"Workout History"`.
- Missing exercise translation keys in `translations.ts` for starter routines (*Barbell Full Squat*, *Barbell Deadlift*, *Cable Cross-Over Variation*).

### 3.2 Specifications
1. **Dynamic Tab & Eyebrow Translations**:
   - Replace all static eyebrow strings with `{t(key)}` (`t("dashboard")`, `t("workout")`, `t("library")`, `t("progress")`).
2. **Calendar & Widget Localization in `Dashboard.tsx`**:
   - When no logs exist for selected day: `"Nessun allenamento"` (replacing `"No log"`).
   - When logs exist: `"{count} completati"` (replacing `"{count} logged"`).
   - Calendar header: `"Calendario allenamenti: {day}"`.
   - Streak card: `"{count} {allenamenti/allenamento}"`, subtitle: `"Storico salvato sul dispositivo"`.
   - Weekly goal card: `"Obiettivo Settimanale"`, `"Raggiunto!"`, `"{remaining} mancanti"`.
   - Modals: All stats ("Totale", "Ultimi 35 Giorni", "Questa Settimana", "Allenamenti a settimana", "Media ultime 4 settimane") fully localized.
3. **Library & Search Localization**:
   - Search bar placeholder: `{t("search")}` (`"Cerca esercizi..."`).
   - Badges: `"In evidenza"`, `"{count} trovati"`, `"{count} esercizi disponibili offline"`.
4. **Progress Localization**:
   - Subtitle: `"Monitora i tuoi progressi e perfeziona la tua strategia."`
   - Timeframe filter buttons: `"Mensile"`, `"Annuale"`, `"Sempre"`.
   - Workout history: `"Storico Allenamenti"`, `"Sessioni completate ({count})"`.
5. **Catalog Exercise Name Translations in `translations.ts`**:
   - Add explicit translations for all starter routine and basic exercises:
     - `"Barbell Full Squat"` -> `"Squat con Bilanciere"`
     - `"Barbell Deadlift"` -> `"Stacco da Terra con Bilanciere"`
     - `"Cable Cross-Over Variation"` -> `"Croci ai Cavi"`
     - `"Barbell Bench Press"` -> `"Panca Piana con Bilanciere"`
     - `"Dumbbell Incline Bench Press"` -> `"Panca Inclinata con Manubri"`
   - Ensure fallback searches in `searchUtils.ts` map flawlessly to Italian queries (e.g. searching "panca" finds both "Panca Piana" and "Barbell Bench Press").

---

## 4. Section 3: First Active Workout Guidance & Simplified Entry

### 4.1 Problem Analysis
In `useWorkoutData.ts`, `showRpe` defaulted to `true` (`parsed.showRpe !== false`). For users embarking on their first workout, an RPE column is unfamiliar and causes cognitive overload. The "Serie Prec." column displays uncontextualized hyphens (`-`). There are no in-app cues explaining the logging cycle (type weight/reps -> tap set number -> rest timer starts).

### 4.2 Specifications
1. **Default `showRpe` to `false` for New Users**:
   - In `useWorkoutData.ts`, update default initialization:
     ```ts
     const [showRpe, setShowRpe] = useState<boolean>(() => {
       const saved = localStorage.getItem("liftlab_guest_data");
       if (saved) {
         try {
           const parsed = JSON.parse(saved);
           return parsed.showRpe === true; // Default to FALSE for new users
         } catch {}
       }
       return false;
     });
     ```
   - Retain the toggle in Settings (*Preferenze -> Mostra RPE*) for power lifters.
   - Active workout table reduces from 5 columns to **4 clean columns**: `[ SERIE ]` `[ SERIE PREC. ]` `[ KG ]` `[ RIPET. ]`.
   - Reps placeholder localized to `"Ripet."` (replacing hardcoded `"Reps"`).

2. **First-Workout Guidance Banner in `RoutineEditor`**:
   - Display a dismissible Apple-style frosted banner at the top of `mode === "live"` when `workoutLogs.length === 0` and `liftlab_workout_guide_dismissed` is not `"true"`:
     - **Title**: *"💡 Come registrare l'allenamento"*
     - **Body**:
       - 1. Inserisci il **carico ({unit})** e le **ripetizioni (RIPET.)** per ogni serie completata.
       - 2. Tocca il **numero della serie** a sinistra per segnarla come completata e avviare il timer di recupero.
       - 3. La colonna **Serie Prec.** mostrerà i carichi della volta precedente nei prossimi allenamenti.
     - **Action**: Button `"Ho capito"` which saves dismissal in `localStorage`.

3. **Softened Empty State for "Serie Prec."**:
   - When no prior set history exists for an exercise, instead of a stark `-`, display a gentle badge or label `"Nuovo"` / `"Prima volta"` for set 1, and subtle muted indicators for subsequent sets.

---

## 5. Section 4: Empty Dashboard (Welcome State for Day One)

### 5.1 Problem Analysis
When `workoutLogs.length === 0`, the Dashboard renders 8 metric cards populated with zeros (`0 min`, `0 kg`, `0 PRs`), making the app look uninviting and inactive. The calendar top bar displays `"No log"`, and the next workout card provides little contextual guidance.

### 5.2 Specifications
1. **Welcome Onboarding Hub (`workoutLogs.length === 0`)**:
   - Render a warm, encouraging Welcome Section:
     - **Greeting**: *"Benvenuto su LiftLab{name}!"*
     - **Subtitle**: *"Il tuo percorso inizia oggi. Scegli come iniziare il tuo primo allenamento:"*
2. **Clear Dual Starting CTAs**:
   - **Card A: Scheda Consigliata di Oggi** (if a scheduled or starter routine exists):
     - Displays routine name (e.g. *Full Body Starter*), estimated duration (~45 min), and exercise preview tags (*Squat*, *Panca*, *Stacco*, *Croci*).
     - Prominent Apple-green button: `"Avvia Scheda di Oggi"`.
   - **Card B: Allenamento Libero**:
     - Explanatory copy: *"Vuoi allenarti senza una scheda? Avvia una sessione libera e aggiungi gli esercizi mentre ti alleni."*
     - Secondary styled button: `"Inizia Allenamento Libero"`.
   - **Navigation Link**:
     - *"Oppure crea o sfoglia tutte le routine nella sezione Allenamento"*.
3. **Empty Quick Stats Bento Placeholder**:
   - Instead of rendering 8 empty cards with zeros, render an elegant single preview card:
     - **Icon**: `LineChart` / `Sparkles`
     - **Title**: *"I tuoi progressi appariranno qui"*
     - **Description**: *"Volume totale, serie settimanali, carichi massimali e record personali si popoleranno automaticamente non appena completerai la tua prima sessione."*
     - Quick action button: `"Inizia il tuo primo allenamento"`.
   - Once `workoutLogs.length > 0`, the full interactive Bento grid of stats is displayed automatically.
4. **Calendar Top Bar for Day One**:
   - When no workout is logged for the day: display `"Pronto per iniziare"` instead of `"No log"`.
   - Streak widget: displays `"Inizia la tua serie oggi!"` with a friendly starting cue.

---

## 6. Implementation Architecture & Files Affected

| Component / File | Purpose of Modification |
|------------------|-------------------------|
| `src/data/translations.ts` | Discard vs Cancel distinct translations, 100% IT translations for labels, badges, headers, and catalog exercises |
| `src/components/RoutineEditor.tsx` | Exit button ("Abbandona"), unambiguous confirm modal ("Elimina allenamento" vs "Continua allenamento"), dismissible workout guidance banner, reps placeholder localization, "Serie Prec." new state |
| `src/hooks/useWorkoutData.ts` | Default `showRpe` to `false` for fresh guest data |
| `src/components/Dashboard.tsx` | Day One Welcome Hub when `workoutLogs.length === 0`, replacement of zeroed-out Bento with progress preview card, full Italian localization of headers, calendar, and modals |
| `src/components/Workout.tsx` | TabHero eyebrow localization, subtitle localization, badge counts localization |
| `src/components/Library.tsx` | TabHero eyebrow and subtitle localization, search input placeholder localization, catalog badge localization |
| `src/components/Progress.tsx` | TabHero eyebrow and subtitle localization, timeframe filter localization, history modal text localization |

---

## 7. Testing & Verification Plan

1. **Discard Dialog Verification**:
   - Start any routine -> tap top-right exit button -> verify label is "Abbandona" (not "Annulla").
   - Confirm modal appears: verify Red button is "Elimina allenamento" and Gray button is "Continua allenamento".
   - Tapping Gray button resumes workout without data loss; tapping Red button properly discards session and cleans state.
2. **Localization Verification**:
   - Switch language to Italian in Settings.
   - Inspect Dashboard, Workout, Library, and Progress: verify zero English strings in eyebrows, subtitles, badges, and search bars.
   - Verify starter routines display exercises in Italian (*Squat con Bilanciere*, *Panca Piana con Bilanciere*, etc.).
3. **Active Workout First-Time Experience**:
   - Fresh state (0 logs): verify `showRpe` is false (4-column layout).
   - Verify dismissible info banner appears explaining weight, reps, set completion, and "Serie Prec.".
   - Verify dismiss button persists to `localStorage` and does not re-appear on subsequent visits.
4. **Dashboard Day One Experience**:
   - Fresh state (0 logs): verify Welcome Hub displays dual CTAs (Scheduled Routine & Freestyle), no zeroed-out stats grid, calendar says "Pronto per iniziare".
   - Log a test workout: verify Dashboard transitions seamlessly to active streak, goal ring, and rich stats Bento grid.
