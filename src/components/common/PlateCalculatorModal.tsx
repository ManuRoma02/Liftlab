import React, { useState, useEffect } from "react";
import { X, Disc, Plus, Minus } from "lucide-react";
import { calculatePlatesPerSide } from "../../lib/workoutUtils";

export interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: string;
  initialWeight?: number;
  t?: (key: string) => string;
}

const getPlateStyle = (plateVal: number, isLbs: boolean) => {
  if (isLbs) {
    const lbsMap: Record<number, { bg: string; text: string; height: string }> = {
      45: { bg: "bg-red-600 border-red-400", text: "text-white font-bold", height: "h-28" },
      35: { bg: "bg-amber-500 border-amber-300", text: "text-slate-950 font-black", height: "h-22" },
      25: { bg: "bg-emerald-600 border-emerald-400", text: "text-white font-bold", height: "h-18" },
      10: { bg: "bg-slate-100 border-slate-300", text: "text-slate-900 font-black", height: "h-14" },
      5: { bg: "bg-zinc-700 border-zinc-500", text: "text-zinc-100 font-bold", height: "h-11" },
      2.5: { bg: "bg-slate-400 border-slate-300", text: "text-slate-950 font-black", height: "h-9" },
    };
    return lbsMap[plateVal] || { bg: "bg-primary border-primary", text: "text-on-primary font-bold", height: "h-16" };
  }
  const kgMap: Record<number, { bg: string; text: string; height: string }> = {
    25: { bg: "bg-red-600 border-red-400", text: "text-white font-bold", height: "h-28" },
    20: { bg: "bg-blue-600 border-blue-400", text: "text-white font-bold", height: "h-24" },
    15: { bg: "bg-amber-500 border-amber-300", text: "text-slate-950 font-black", height: "h-20" },
    10: { bg: "bg-emerald-600 border-emerald-400", text: "text-white font-bold", height: "h-16" },
    5: { bg: "bg-slate-100 border-slate-300", text: "text-slate-900 font-black", height: "h-12" },
    2.5: { bg: "bg-zinc-700 border-zinc-500", text: "text-zinc-100 font-bold", height: "h-10" },
    1.25: { bg: "bg-slate-400 border-slate-300", text: "text-slate-950 font-black", height: "h-8" },
  };
  return kgMap[plateVal] || { bg: "bg-primary border-primary", text: "text-on-primary font-bold", height: "h-16" };
};

export function PlateCalculatorModal({
  isOpen,
  onClose,
  unit,
  initialWeight,
  t = (k: string) => k,
}: PlateCalculatorModalProps) {
  const isLbs = unit.toUpperCase() === "LBS";
  const defaultBarWeight = isLbs ? 45 : 20;
  const defaultTargetWeight = initialWeight ?? (isLbs ? 135 : 60);

  const [targetWeight, setTargetWeight] = useState<number>(defaultTargetWeight);
  const [targetInput, setTargetInput] = useState(String(defaultTargetWeight));
  const [barWeight, setBarWeight] = useState<number>(defaultBarWeight);

  useEffect(() => {
    if (isOpen) {
      setBarWeight(isLbs ? 45 : 20);
      const nextTarget = initialWeight ?? (isLbs ? 135 : 60);
      setTargetWeight(nextTarget);
      setTargetInput(String(nextTarget));
    }
  }, [isOpen, initialWeight, isLbs]);

  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (event: Event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("liftlab:back", handleBack);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("liftlab:back", handleBack);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const plateResult = calculatePlatesPerSide(targetWeight, barWeight, unit);

  // Expand plates array into individual plate values for side sleeve representation
  const flattenedPlates: number[] = [];
  for (const item of plateResult.plates) {
    for (let i = 0; i < item.count; i++) {
      flattenedPlates.push(item.plate);
    }
  }

  const perSide = targetWeight > barWeight ? (targetWeight - barWeight) / 2 : 0;
  const plateSummaries = plateResult.plates
    .map((p) => `${p.count}x ${p.plate}${unit}`)
    .join(", ");

  const barPresets = isLbs ? [45, 35, 25, 0] : [20, 15, 10, 0];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-surface-variant flex justify-between items-center bg-surface-variant/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Disc className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-[var(--font-headline-sm)] text-lg md:text-xl font-bold text-primary tracking-tight uppercase">
                {t("plate_calculator") || "Plate Calculator"}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {t("calculate_plates_per_side") || "Calculate plates per side"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-variant/50"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Controls: Target weight & Bar weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Weight */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                {t("target_weight") || "Target Weight"} ({unit})
              </label>
              <div className="flex items-center gap-2 bg-surface border border-surface-variant rounded-xl p-1.5 focus-within:border-primary">
                <button
                  onClick={() => {
                    const next = Math.max(0, targetWeight - (isLbs ? 5 : 2.5));
                    setTargetWeight(next);
                    setTargetInput(String(next));
                  }}
                  className="w-8 h-8 rounded-lg bg-surface-variant/50 hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetInput}
                  onChange={(e) => {
                    setTargetInput(e.target.value);
                    const parsed = Number(e.target.value);
                    if (e.target.value !== "" && Number.isFinite(parsed)) setTargetWeight(parsed);
                  }}
                  onBlur={() => {
                    const parsed = Number(targetInput);
                    if (Number.isFinite(parsed)) {
                      setTargetWeight(parsed);
                      setTargetInput(String(parsed));
                    } else {
                      setTargetInput(String(targetWeight));
                    }
                  }}
                  className="w-full bg-transparent text-center font-black text-lg text-primary outline-none"
                />
                <button
                  onClick={() => {
                    const next = targetWeight + (isLbs ? 5 : 2.5);
                    setTargetWeight(next);
                    setTargetInput(String(next));
                  }}
                  className="w-8 h-8 rounded-lg bg-surface-variant/50 hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bar Weight */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                {t("bar_weight") || "Bar Weight"} ({unit})
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {barPresets.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBarWeight(b)}
                    className={`px-3 py-2 rounded-xl text-xs font-black tracking-wider transition-all border ${
                      barWeight === b
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface border-surface-variant text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    {b} {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barbell Graphic Representation */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
              {t("barbell_rack_view") || "Barbell Rack View (Per Side)"}
            </span>
            <div className="relative w-full py-8 px-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center overflow-x-auto min-h-[150px]">
              <div className="flex items-center">
                {/* Bar Inner Stopper */}
                <div className="w-4 h-20 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-l-md border-r border-slate-700 shadow-md flex-shrink-0" />

                {/* Sleeve holding plates */}
                <div className="relative flex items-center h-8 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 border-y border-slate-500 flex-shrink-0 px-1 gap-1.5 min-w-[200px] justify-start">
                  {flattenedPlates.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 select-none">
                      {targetWeight <= barWeight ? (t("no_plates_needed") || "No plates needed") : (t("empty_bar") || "Empty Bar")}
                    </span>
                  ) : (
                    flattenedPlates.map((plateVal, idx) => {
                      const style = getPlateStyle(plateVal, isLbs);
                      return (
                        <div
                          key={idx}
                          className={`w-9 ${style.height} ${style.bg} ${style.text} rounded-md border flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0 select-none`}
                        >
                          <span className="text-[10px] leading-none font-bold uppercase">{plateVal}</span>
                          <span className="text-[8px] leading-none opacity-80 uppercase">{unit}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sleeve Cap */}
                <div className="w-3 h-8 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded-r-md border-l border-slate-600 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Summary Text */}
          <div className="p-4 bg-surface border border-surface-variant rounded-xl text-center">
            <p className="text-sm font-bold text-on-surface">
              {t("per_side") || "Per side:"} <span className="text-primary font-black">{perSide} {unit}</span>
              {plateSummaries ? (
                <span className="text-on-surface-variant font-medium ml-1">
                  ({plateSummaries})
                </span>
              ) : null}
            </p>
            {plateResult.remainderPerSide > 0 && (
              <p className="text-xs text-amber-400 font-medium mt-1">
                + {plateResult.remainderPerSide} {unit} {t("remainder_per_side") || "remainder per side"}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-variant/10 border-t border-surface-variant/50 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity uppercase tracking-wide text-xs cursor-pointer"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
