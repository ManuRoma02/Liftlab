import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Dumbbell, Scale, Target, Check, ChevronRight } from "lucide-react";
import { triggerHaptic } from "../lib/haptics";
import { parseGymNumber } from "../lib/workoutUtils";

interface OnboardingProps {
  onFinish: (setupData?: { unit?: "KG" | "LBS"; weight?: number; weeklyGoal?: number }) => void;
  language?: string;
  t?: (key: string) => string;
}

const ONBOARDING_I18N: Record<
  string,
  {
    skip: string;
    next: string;
    finish: string;
    step1Title: string;
    step1Subtitle: string;
    unitKgDesc: string;
    unitLbsDesc: string;
    step2Title: string;
    step2Subtitle: string;
    weightPlaceholder: string;
    step3Title: string;
    step3Subtitle: string;
    daysPerWeek: string;
  }
> = {
  it: {
    skip: "Salta",
    next: "Avanti",
    finish: "Inizia ad Allenarti",
    step1Title: "Benvenuto su LiftLab",
    step1Subtitle: "Il tuo compagno minimalista e 100% offline per la sala pesi. Quale unità di misura preferisci?",
    unitKgDesc: "Chilogrammi (standard europeo)",
    unitLbsDesc: "Libbre (standard americano)",
    step2Title: "Peso Corporeo Iniziale",
    step2Subtitle: "Utile per tracciare i tuoi progressi nel tempo. Puoi anche saltarlo e impostarlo in seguito.",
    weightPlaceholder: "Es. 75.0",
    step3Title: "Obiettivo Settimanale",
    step3Subtitle: "Quanti giorni a settimana hai intenzione di allenarti in palestra?",
    daysPerWeek: "giorni a settimana",
  },
  es: {
    skip: "Saltar",
    next: "Siguiente",
    finish: "Empezar a Entrenar",
    step1Title: "Bienvenido a LiftLab",
    step1Subtitle: "Tu registro de gimnasio minimalista y 100% offline. ¿Qué unidad de peso prefieres?",
    unitKgDesc: "Kilogramos (estándar europeo)",
    unitLbsDesc: "Libras (estándar americano)",
    step2Title: "Peso Corporal Inicial",
    step2Subtitle: "Para registrar tu progreso en el tiempo. Puedes omitirlo y configurarlo después.",
    weightPlaceholder: "Ej. 75.0",
    step3Title: "Objetivo Semanal",
    step3Subtitle: "¿Cuántos días por semana planeas entrenar en el gimnasio?",
    daysPerWeek: "días por semana",
  },
  en: {
    skip: "Skip",
    next: "Next",
    finish: "Start Lifting",
    step1Title: "Welcome to LiftLab",
    step1Subtitle: "Your minimalist, 100% offline gym companion. Which weight unit do you prefer?",
    unitKgDesc: "Kilograms (metric standard)",
    unitLbsDesc: "Pounds (imperial standard)",
    step2Title: "Starting Body Weight",
    step2Subtitle: "To track your progress over time. You can skip this and log it anytime later.",
    weightPlaceholder: "e.g. 165 or 75",
    step3Title: "Weekly Goal",
    step3Subtitle: "How many days per week do you plan to train in the gym?",
    daysPerWeek: "days per week",
  },
};

export function OnboardingTutorial({
  onFinish,
  language = "en",
}: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<"KG" | "LBS">(
    language === "en" ? "LBS" : "KG"
  );
  const [weightInput, setWeightInput] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(3);

  const langKey = ONBOARDING_I18N[language] ? language : "en";
  const i18n = ONBOARDING_I18N[langKey];

  const handleComplete = () => {
    triggerHaptic("success");
    const weightNum = parseGymNumber(weightInput);
    onFinish({
      unit: selectedUnit,
      weight: weightNum && weightNum > 0 && weightNum < 500 ? weightNum : undefined,
      weeklyGoal,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 bg-black/85 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col gap-6 relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#30D158]/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Skip Button */}
        <button
          onClick={() => {
            triggerHaptic("light");
            onFinish();
          }}
          type="button"
          className="absolute top-5 right-5 z-20 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[#8E8E93] hover:text-white text-xs font-bold tracking-wide transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          aria-label={i18n.skip}
        >
          <span>{i18n.skip}</span>
          <X className="w-3.5 h-3.5" />
        </button>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-unit"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-4 relative z-10 pt-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center text-[#30D158] mb-2 shadow-[0_4px_20px_rgba(48,209,88,0.2)]">
                <Dumbbell className="w-8 h-8 stroke-[2.2]" />
              </div>

              <h2 id="onboarding-title" className="text-2xl font-black text-white tracking-tight">
                {i18n.step1Title}
              </h2>
              <p className="text-[#8E8E93] text-sm leading-relaxed max-w-xs mb-2">
                {i18n.step1Subtitle}
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedUnit("KG");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedUnit === "KG"
                      ? "bg-[#30D158]/15 border-[#30D158] text-white shadow-[0_0_16px_rgba(48,209,88,0.2)]"
                      : "bg-white/5 border-white/10 text-[#8E8E93] hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xl font-black text-white">KG</span>
                    {selectedUnit === "KG" && <Check className="w-5 h-5 text-[#30D158]" />}
                  </div>
                  <span className="text-[11px] leading-tight block text-[#8E8E93]">
                    {i18n.unitKgDesc}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedUnit("LBS");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedUnit === "LBS"
                      ? "bg-[#30D158]/15 border-[#30D158] text-white shadow-[0_0_16px_rgba(48,209,88,0.2)]"
                      : "bg-white/5 border-white/10 text-[#8E8E93] hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xl font-black text-white">LBS</span>
                    {selectedUnit === "LBS" && <Check className="w-5 h-5 text-[#30D158]" />}
                  </div>
                  <span className="text-[11px] leading-tight block text-[#8E8E93]">
                    {i18n.unitLbsDesc}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-weight"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-4 relative z-10 pt-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] mb-2 shadow-[0_4px_20px_rgba(10,132,255,0.2)]">
                <Scale className="w-8 h-8 stroke-[2.2]" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">
                {i18n.step2Title}
              </h2>
              <p className="text-[#8E8E93] text-sm leading-relaxed max-w-xs mb-3">
                {i18n.step2Subtitle}
              </p>

              <div className="relative w-full max-w-[200px] mb-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={i18n.weightPlaceholder}
                  autoFocus
                  className="w-full bg-white/5 border border-white/15 focus:border-[#30D158] rounded-2xl text-center text-3xl font-black text-white py-3.5 px-4 outline-none tabular-nums transition-all focus:bg-white/10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8E93] uppercase">
                  {selectedUnit}
                </span>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-goal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-4 relative z-10 pt-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-2 shadow-[0_4px_20px_rgba(255,159,10,0.2)]">
                <Target className="w-8 h-8 stroke-[2.2]" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">
                {i18n.step3Title}
              </h2>
              <p className="text-[#8E8E93] text-sm leading-relaxed max-w-xs mb-2">
                {i18n.step3Subtitle}
              </p>

              <div className="flex justify-center gap-2 w-full my-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setWeeklyGoal(num);
                    }}
                    className={`w-12 h-14 rounded-2xl font-black text-lg transition-all flex flex-col items-center justify-center cursor-pointer active:scale-90 ${
                      weeklyGoal === num
                        ? "bg-[#30D158] text-black shadow-[0_4px_16px_rgba(48,209,88,0.35)] scale-105"
                        : "bg-white/6 text-white border border-white/10 hover:bg-white/12"
                    }`}
                  >
                    <span>{num}</span>
                    <span className="text-[8px] font-bold uppercase opacity-60">giorni</span>
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-[#8E8E93]">
                {weeklyGoal} {i18n.daysPerWeek}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step dots & CTA */}
        <div className="flex justify-between items-center mt-2 relative z-10 pt-2 border-t border-white/5">
          <div className="flex gap-2 items-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  i === step ? "w-6 bg-[#30D158]" : "w-2 bg-white/20"
                }`}
                onClick={() => {
                  triggerHaptic("light");
                  setStep(i);
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (step < 2) {
                triggerHaptic("light");
                setStep(step + 1);
              } else {
                handleComplete();
              }
            }}
            className="bg-[#30D158] text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:brightness-105 transition-all shadow-[0_4px_16px_rgba(48,209,88,0.3)] cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>{step === 2 ? i18n.finish : i18n.next}</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
