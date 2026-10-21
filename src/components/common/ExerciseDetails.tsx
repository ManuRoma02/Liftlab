import React, { useState } from "react";
import {
  ChevronLeft,
  Youtube,
  Plus,
  Check,
  Zap,
  Trophy,
  ClipboardList,
  Dumbbell,
} from "lucide-react";
import { ExerciseMuscleVisual } from "./ExerciseMuscleVisual";
import { ExerciseMedia } from "./ExerciseMedia";
import { AccordionItem } from "./AccordionItem";
import { isTimedExercise, normalizeExerciseImageUrl, getExerciseMediaCandidates } from "../../lib/workoutUtils";
import type { ExerciseData } from "../../types/workout";
import { triggerHaptic } from "../../lib/haptics";

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
  const allCandidates = React.useMemo(() => {
    const list: string[] = [];
    if (ex.gifUrl) list.push(...getExerciseMediaCandidates(ex.gifUrl));
    if (ex.image) list.push(...getExerciseMediaCandidates(ex.image));
    return [...new Set(list)];
  }, [ex.gifUrl, ex.image]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  const [visualMode, setVisualMode] = useState<"demo" | "anatomy">(
    allCandidates.length > 0 ? "demo" : "anatomy"
  );

  React.useEffect(() => {
    setCandidateIndex(0);
    setImgLoading(true);
    setImgFailed(false);
  }, [ex.id, ex.gifUrl, ex.image]);

  const activeImgUrl = allCandidates[candidateIndex] || null;

  const handleImgError = () => {
    if (candidateIndex + 1 < allCandidates.length) {
      setCandidateIndex((prev) => prev + 1);
      setImgLoading(true);
    } else {
      setImgFailed(true);
      setImgLoading(false);
    }
  };

  const variations = exercises
    .filter(
      (e) =>
        e.id !== ex.id &&
        (e.category === ex.category ||
          e.muscleFocus?.some((m) => ex.muscleFocus?.includes(m))),
    )
    .slice(0, 4);

  return (
    <div className="bg-black text-white min-h-[100dvh] pb-24 flex flex-col font-sans antialiased">
      {/* iOS Top Navigation Bar with Safe Area Inset */}
      <header
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        className="sticky top-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 min-h-[calc(3.5rem+env(safe-area-inset-top,0px))]"
      >
        <button
          onClick={() => {
            triggerHaptic("light");
            onBack();
          }}
          className="min-w-[44px] min-h-[44px] px-2 flex items-center gap-1 text-[#30D158] font-medium text-base hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5 -ml-1.5" />
          <span>{t("cancel") || "Back"}</span>
        </button>

        <h1 className="font-bold text-base text-white truncate max-w-[200px] sm:max-w-md text-center px-2">
          {t(ex.title)}
        </h1>

        <div className="flex items-center gap-2 shrink-0">
          {onAddExercise && (
            <button
              onClick={() => {
                triggerHaptic("medium");
                onAddExercise(ex);
              }}
              className="min-h-[44px] bg-[#30D158] text-black font-bold text-xs px-4 py-2 rounded-full hover:brightness-105 active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
          <button
            onClick={() => {
              triggerHaptic("light");
              window.open(
                `https://www.youtube.com/results?search_query=${encodeURIComponent(t(ex.title) + " exercise tutorial")}`,
                "_blank",
              );
            }}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
            title="Watch tutorial on YouTube"
          >
            <Youtube className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-5 w-full flex flex-col gap-6">
        {/* Muscle Group Chips */}
        <section className="overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
          <div className="flex gap-2">
            {ex.muscleFocus ? (
              ex.muscleFocus.map((m, i) => (
                <div
                  key={m}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    i === 0
                      ? "bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30"
                      : "bg-white/5 text-[#8E8E93] border-white/8"
                  }`}
                >
                  {i === 0 && <Check className="w-3.5 h-3.5" />}
                  <span>
                    {m} {i === 0 ? "(Primary)" : "(Secondary)"}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1.5 bg-[#30D158]/15 text-[#30D158] px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#30D158]/30">
                <Check className="w-3.5 h-3.5" />
                <span>
                  {t((ex.category || "").toLowerCase())} (Primary)
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Bento Layout for Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Visual Card (Animated Demo / Muscle Anatomy Toggle) */}
          <div className="md:col-span-1 apple-glass-card rounded-3xl overflow-hidden flex flex-col min-h-[260px] relative shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between p-3 border-b border-white/6 bg-black/20">
              <div className="flex bg-black/40 rounded-full p-0.5 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setVisualMode("demo");
                  }}
                  className={`px-3 py-1 rounded-full transition-all active:scale-95 text-xs font-bold ${
                    visualMode === "demo"
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setVisualMode("anatomy");
                  }}
                  className={`px-3 py-1 rounded-full transition-all active:scale-95 text-xs font-bold ${
                    visualMode === "anatomy"
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  Anatomy
                </button>
              </div>
              {ex.equipment && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] px-2.5 py-0.5 bg-white/5 rounded-full border border-white/8">
                  {ex.equipment}
                </span>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center p-3 bg-black/30 relative min-h-[220px]">
              {visualMode === "demo" && activeImgUrl && !imgFailed ? (
                <div className="relative w-full h-full flex items-center justify-center min-h-[190px]">
                  {imgLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 rounded-2xl animate-pulse">
                      <Dumbbell className="w-8 h-8 text-[#30D158]/50 animate-bounce" />
                      <span className="text-[11px] font-semibold text-[#8E8E93]">
                        {t("loading_demo") || "Caricamento demo..."}
                      </span>
                    </div>
                  )}
                  <img
                    src={activeImgUrl}
                    alt={ex.title}
                    loading="eager"
                    onLoad={() => setImgLoading(false)}
                    onError={handleImgError}
                    className={`max-h-[220px] w-auto max-w-full object-contain rounded-2xl shadow-sm transition-opacity duration-300 ${
                      imgLoading ? "opacity-0" : "opacity-100"
                    }`}
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
            icon={<Zap className="w-5 h-5 text-[#30D158]" />}
            className="md:col-span-3 apple-glass-card rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            defaultOpen={true}
          >
            <ul className="space-y-3.5 mt-2">
              {(
                ex.cues || [
                  "Maintain controlled movement speed",
                  "Focus on mind-muscle connection",
                  "Ensure proper joint alignment",
                ]
              ).map((cue, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#30D158] font-bold tabular-nums text-sm">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <p className="text-white text-sm leading-relaxed">{cue}</p>
                </li>
              ))}
            </ul>
          </AccordionItem>

          {/* Personal Records Card */}
          <div className="md:col-span-2 apple-glass-card rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#FF9F0A]" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  {t("personal_records")}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-black/40 rounded-2xl p-3.5 border border-white/6 flex flex-col justify-center text-center">
                  <p className="text-[#8E8E93] font-bold text-[10px] uppercase tracking-wider mb-1">
                    {t("est_1rm")}
                  </p>
                  <p className="text-2xl font-black text-[#30D158] leading-none tabular-nums">
                    {ex.oneRepMax || 0}
                    <span className="text-[11px] ml-1 font-normal text-[#8E8E93]">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
                <div className="bg-black/40 rounded-2xl p-3.5 border border-white/6 flex flex-col justify-center text-center">
                  <p className="text-[#8E8E93] font-bold text-[10px] uppercase tracking-wider mb-1">
                    {t("max_weight")}
                  </p>
                  <p className="text-2xl font-black text-white leading-none tabular-nums">
                    {ex.prWeight || 0}
                    <span className="text-[11px] ml-1 font-normal text-[#8E8E93]">
                      {unit.toLowerCase()}
                    </span>
                  </p>
                </div>
                <div className="bg-black/40 rounded-2xl p-3.5 border border-white/6 flex flex-col justify-center text-center">
                  <p className="text-[#8E8E93] font-bold text-[10px] uppercase tracking-wider mb-1">
                    {t("best_set")}
                  </p>
                  <p className="text-2xl font-black text-white leading-none tabular-nums">
                    {ex.prReps || 0}
                    <span className="text-[11px] ml-1 font-normal text-[#8E8E93]">
                      {isTimedExercise(ex) ? "s" : t("reps_upper")}
                    </span>
                  </p>
                  {ex.prRepsWeight && (
                    <p className="text-[#8E8E93] text-[9px] mt-1">
                      @ {ex.prRepsWeight} {unit.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Section */}
          <AccordionItem
            title={t("instructions")}
            icon={<ClipboardList className="w-5 h-5 text-[#0A84FF]" />}
            className="md:col-span-4 bg-[#1C1C1E] border border-white/8 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5 mt-3">
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
                <div key={i} className="flex gap-3.5">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center font-bold text-xs text-[#30D158]">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5 text-xs uppercase tracking-wider">
                      {t("step")} {i + 1}
                    </h4>
                    <p className="text-[#8E8E93] text-sm leading-relaxed">
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
          <section className="mt-2 mb-8">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#30D158]" />
              Related Variations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {variations.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    triggerHaptic("light");
                    onSelectVariation?.(variant);
                  }}
                  className="bg-[#1C1C1E] border border-white/6 hover:border-white/20 rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 transition-all active:scale-95 group cursor-pointer"
                >
                  <ExerciseMedia
                    exercise={variant}
                    className="w-14 h-14 rounded-xl"
                  />
                  <span className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#30D158] transition-colors">
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
