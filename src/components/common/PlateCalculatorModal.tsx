import React, { useState, useEffect } from "react";
import { X, Disc, Plus, Minus } from "lucide-react";
import { calculatePlatesPerSide } from "../../lib/workoutUtils";
import { triggerHaptic } from "../../lib/haptics";

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
      35: { bg: "bg-amber-500 border-amber-300", text: "text-black font-black", height: "h-22" },
      25: { bg: "bg-emerald-600 border-emerald-400", text: "text-white font-bold", height: "h-18" },
      10: { bg: "bg-zinc-200 border-zinc-400", text: "text-black font-black", height: "h-14" },
      5: { bg: "bg-zinc-700 border-zinc-500", text: "text-white font-bold", height: "h-11" },
      2.5: { bg: "bg-zinc-400 border-zinc-300", text: "text-black font-black", height: "h-9" },
    };
    return lbsMap[plateVal] || { bg: "bg-[#30D158] border-[#30D158]", text: "text-black font-bold", height: "h-16" };
  }
  const kgMap: Record<number, { bg: string; text: string; height: string }> = {
    25: { bg: "bg-red-600 border-red-400", text: "text-white font-bold", height: "h-28" },
    20: { bg: "bg-blue-600 border-blue-400", text: "text-white font-bold", height: "h-24" },
    15: { bg: "bg-amber-500 border-amber-300", text: "text-black font-black", height: "h-20" },
    10: { bg: "bg-emerald-600 border-emerald-400", text: "text-white font-bold", height: "h-16" },
    5: { bg: "bg-zinc-200 border-zinc-400", text: "text-black font-black", height: "h-12" },
    2.5: { bg: "bg-zinc-700 border-zinc-500", text: "text-white font-bold", height: "h-10" },
    1.25: { bg: "bg-zinc-400 border-zinc-300", text: "text-black font-black", height: "h-8" },
  };
  return kgMap[plateVal] || { bg: "bg-[#30D158] border-[#30D158]", text: "text-black font-bold", height: "h-16" };
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/8 flex justify-between items-center bg-[#1C1C1E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#30D158]/15 border border-[#30D158]/25 rounded-2xl flex items-center justify-center text-[#30D158]">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t("plate_calculator") || "Plate Calculator"}
              </h3>
              <p className="text-xs text-[#8E8E93]">
                {t("calculate_plates_per_side") || "Calculate plates per side"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Controls: Target weight & Bar weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Weight */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8E8E93]">
                {t("target_weight") || "Target Weight"} ({unit})
              </label>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 focus-within:border-[#30D158]">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    const next = Math.max(0, targetWeight - (isLbs ? 5 : 2.5));
                    setTargetWeight(next);
                    setTargetInput(String(next));
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
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
                  className="w-full bg-transparent text-center font-black text-lg text-white tabular-nums outline-none"
                />
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    const next = targetWeight + (isLbs ? 5 : 2.5);
                    setTargetWeight(next);
                    setTargetInput(String(next));
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bar Weight */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8E8E93]">
                {t("bar_weight") || "Bar Weight"} ({unit})
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {barPresets.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      triggerHaptic("light");
                      setBarWeight(b);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                      barWeight === b
                        ? "bg-[#30D158] text-black border-[#30D158] shadow-sm"
                        : "bg-black/40 border-white/10 text-[#8E8E93] hover:text-white"
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
            <span className="text-xs font-semibold text-[#8E8E93]">
              {t("barbell_rack_view") || "Barbell Rack View (Per Side)"}
            </span>
            <div className="relative w-full py-6 px-4 bg-black/40 border border-white/8 rounded-2xl flex items-center justify-center overflow-x-auto min-h-[140px]">
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
          <div className="p-4 bg-black/40 border border-white/6 rounded-2xl text-center">
            <p className="text-sm font-semibold text-white">
              {t("per_side") || "Per side:"} <span className="text-[#30D158] font-bold">{perSide} {unit}</span>
              {plateSummaries ? (
                <span className="text-[#8E8E93] font-normal ml-1">
                  ({plateSummaries})
                </span>
              ) : null}
            </p>
            {plateResult.remainderPerSide > 0 && (
              <p className="text-xs text-[#FF9F0A] font-medium mt-1">
                + {plateResult.remainderPerSide} {unit} {t("remainder_per_side") || "remainder per side"}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/6 flex justify-end">
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-full sm:w-auto px-7 py-2.5 bg-[#30D158] text-black font-bold rounded-full hover:brightness-105 active:scale-95 transition-all text-sm cursor-pointer shadow-sm"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
