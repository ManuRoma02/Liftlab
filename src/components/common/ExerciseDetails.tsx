import React, { useState } from "react";
import { ArrowLeft, Youtube, Plus, Check, Zap, Trophy, ClipboardList, Dumbbell, Play } from "lucide-react";
import { ExerciseMuscleVisual } from "./ExerciseMuscleVisual";
import { AccordionItem } from "./AccordionItem";
import { isTimedExercise } from "../../lib/workoutUtils";
import type { ExerciseData } from "../../types/workout";

export function ExerciseDetails({
  ex,
  unit,
  onBack,
  t,
  language = "it",
  exercises = [],
  onSelectVariation,
  onAddExercise,
}: {
  ex: ExerciseData;
  unit: string;
  onBack: () => void;
  t: (key: string) => string;
  language?: string;
  exercises?: ExerciseData[];
  onSelectVariation?: (ex: ExerciseData) => void;
  onAddExercise?: (ex: ExerciseData) => void;
}) {
  const [visualMode, setVisualMode] = useState<"demo" | "anatomy">(
    ex.gifUrl || ex.image ? "demo" : "anatomy"
  );
  const variations = exercises
    .filter(
      (e) =>
        e.id !== ex.id &&
        (e.category === ex.category ||
          e.muscleFocus?.some((m) => ex.muscleFocus?.includes(m))),
    )
    .slice(0, 4);

  return (
    <div className="bg-background text-on-background min-h-[100dvh] pb-20 flex flex-col font-[var(--font-body-md)]">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-surface-variant flex items-center justify-between px-margin-mobile h-16">
        <div className="flex items-center gap-stack-md">
          <button
            onClick={onBack}
            className="active:scale-95 duration-100 hover:bg-surface-variant transition-colors p-2 rounded-full text-primary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-[var(--font-headline-md)] text-[20px] font-bold text-primary-fixed uppercase tracking-tighter truncate max-w-[200px] sm:max-w-md">
            {t(ex.title)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onAddExercise && (
            <button
              onClick={() => onAddExercise(ex)}
              className="bg-primary-fixed text-[#000000] text-[10px] sm:text-xs font-black px-4 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary-fixed/20"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add
            </button>
          )}
          <button
            onClick={() =>
              window.open(
                `https://www.youtube.com/results?search_query=${encodeURIComponent(t(ex.title) + " exercise tutorial")}`,
                "_blank",
              )
            }
            className="active:scale-95 duration-100 hover:bg-surface-variant transition-colors p-2 rounded-full text-primary"
            title="Watch tutorial on YouTube"
          >
            <Youtube className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-20 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto w-full">
        {/* Muscle Group Chips */}
        <section className="mb-stack-lg overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <div className="flex gap-stack-md">
            {ex.muscleFocus ? (
              ex.muscleFocus.map((m, i) => (
                <div
                  key={m}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${i === 0 ? "bg-primary-container text-on-primary-container border-primary-fixed" : "bg-surface-container text-on-surface-variant border-surface-variant"}`}
                >
                  {i === 0 && <Check className="w-4 h-4" />}
                  <span className="font-bold text-[14px]">
                    {m} {i === 0 ? "(Primary)" : "(Secondary)"}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-full border border-primary-fixed transition-all">
                <Check className="w-4 h-4" />
                <span className="font-bold text-[14px]">
                  {t((ex.category || "").toLowerCase())} (Primary)
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Bento Layout for Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-stack-lg">
          {/* Visual Card (Animated Demo / Muscle Anatomy Toggle) */}
          <div className="md:col-span-1 bg-surface-container border border-surface-variant rounded-xl overflow-hidden flex flex-col min-h-[250px] relative">
            <div className="flex items-center justify-between p-2.5 border-b border-surface-variant/40 bg-surface-container-low">
              <div className="flex bg-surface rounded-lg p-0.5 border border-surface-variant text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setVisualMode("demo")}
                  className={`px-3 py-1 rounded-md transition-all active:scale-95 ${
                    visualMode === "demo"
                      ? "bg-primary-fixed text-[#000000] shadow-sm font-black"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Demo
                </button>
                <button
                  type="button"
                  onClick={() => setVisualMode("anatomy")}
                  className={`px-3 py-1 rounded-md transition-all active:scale-95 ${
                    visualMode === "anatomy"
                      ? "bg-primary-fixed text-[#000000] shadow-sm font-black"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Anatomy
                </button>
              </div>
              {ex.equipment && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-2 py-0.5 bg-surface rounded border border-surface-variant/50">
                  {ex.equipment}
                </span>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center p-3 bg-black/15">
              {visualMode === "demo" && (ex.gifUrl || ex.image) ? (
                <div className="relative w-full h-full flex items-center justify-center min-h-[190px]">
                  <img
                    src={ex.gifUrl || ex.image}
                    alt={ex.title}
                    loading="lazy"
                    className="max-h-[220px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <ExerciseMuscleVisual exercise={ex} className="w-full h-full min-h-[190px]" />
              )}
            </div>
          </div>

          {/* Technical Cues Card */}
          <AccordionItem
            title={t("technical_cues")}
            icon={<Zap className="w-5 h-5 text-primary-fixed" />}
            className="md:col-span-3 border-l-4 border-l-primary-fixed"
            defaultOpen={true}
          >
            <ul className="space-y-4 mt-2">
              {(
                ex.cues || [
                  "Maintain controlled movement speed",
                  "Focus on mind-muscle connection",
                  "Ensure proper joint alignment",
                ]
              ).map((cue, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary-fixed font-bold">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <p className="text-on-surface leading-snug">{cue}</p>
                </li>
              ))}
            </ul>
          </AccordionItem>

          {/* Personal Records Card */}
          <div className="md:col-span-2 bg-surface-container-high border border-surface-variant rounded-xl p-stack-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-stack-md">
                <Trophy className="w-5 h-5 text-primary-fixed" />
                <h3 className="font-bold text-[14px] text-primary-fixed uppercase tracking-widest">
                  {t("personal_records")}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-stack-md">
                <div className="bg-background rounded-lg p-4 border border-surface-variant flex flex-col justify-center">
                  <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wider mb-1">
                    {t("est_1rm")}
                  </p>
                  <p className="font-[var(--font-stats-xl)] text-[32px] font-black text-primary flex items-baseline leading-none">
                    {ex.oneRepMax || 0}
                    <span className="text-[12px] ml-1 font-normal text-on-surface-variant">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-surface-variant">
                  <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wider mb-1">
                    {t("max_weight")}
                  </p>
                  <p className="font-[var(--font-stats-xl)] text-[32px] font-black text-on-surface flex items-baseline leading-none">
                    {ex.prWeight || 0}
                    <span className="text-[12px] ml-1 font-normal text-on-surface-variant">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-surface-variant">
                  <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wider mb-1">
                    {t("best_set")}
                  </p>
                  <p className="font-[var(--font-stats-xl)] text-[32px] font-black text-on-surface flex items-baseline leading-none">
                    {ex.prReps || 0}
                    <span className="text-[12px] ml-1 font-normal text-on-surface-variant">
                      {isTimedExercise(ex) ? "SECS" : t("reps_upper")}
                    </span>
                  </p>
                  {ex.prRepsWeight && (
                    <p className="text-on-surface-variant text-[9px] mt-1 italic">
                      @ {ex.prRepsWeight}
                      {unit.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Section */}
          <AccordionItem
            title={t("instructions")}
            icon={<ClipboardList className="w-5 h-5 text-primary-fixed" />}
            className="md:col-span-4"
          >
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 mt-2">
              {(
                (language === "en" && ex.instructionsByLang?.en?.length)
                  ? ex.instructionsByLang.en
                  : (ex.instructions && ex.instructions.length > 0)
                  ? ex.instructions
                  : [
                      "Setup the equipment to your height and comfort.",
                      "Ensure proper starting position with neutral spine.",
                      "Execute the concentric phase with explosive control.",
                      "Lower the weight slowly during the eccentric phase.",
                    ]
              ).map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-highest border border-surface-variant flex items-center justify-center font-bold text-primary-fixed shadow-inner">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1 uppercase text-sm tracking-tight">
                      {t("step")} {i + 1}
                    </h4>
                    <p className="text-on-surface-variant text-[15px] leading-relaxed">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionItem>
        </div>

        {/* Related Variations section */}
        {variations.length > 0 && (
          <section className="mt-8 mb-12">
            <h3 className="text-primary-fixed font-bold text-sm uppercase tracking-[0.2em] mb-4 border-b border-surface-variant pb-2 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Related Variations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {variations.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => onSelectVariation?.(variant)}
                  className="bg-surface-container border border-surface-variant rounded-xl p-3 flex flex-col items-center text-center gap-2 hover:border-primary-fixed transition-colors group"
                >
                  <ExerciseMuscleVisual
                    exercise={variant}
                    className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <span className="text-xs font-bold text-on-surface line-clamp-2">
                    {t(variant.title)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
