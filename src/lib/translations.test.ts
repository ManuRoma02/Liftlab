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

// English verification
const en = translations.en;
assert.ok(en, "English translations should exist");
assert.equal(en.discard_workout_confirm_btn, "Discard Workout");
assert.equal(en.keep_workout_btn, "Keep Workout");
assert.equal(en.exit_workout, "Discard");
assert.ok(en.no_log_day, "no_log_day should exist in EN");
assert.ok(en.welcome_title, "welcome_title should exist in EN");

// Spanish verification
const es = translations.es;
assert.ok(es, "Spanish translations should exist");
assert.equal(es.discard_workout_confirm_btn, "Descartar entrenamiento");
assert.equal(es.keep_workout_btn, "Mantener entrenamiento");
assert.equal(es.exit_workout, "Descartar");
assert.ok(es.no_log_day, "no_log_day should exist in ES");
assert.ok(es.welcome_title, "welcome_title should exist in ES");

console.log("Translations tests passed!");
