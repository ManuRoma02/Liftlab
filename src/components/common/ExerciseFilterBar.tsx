import React from "react";
import { triggerHaptic } from "../../lib/haptics";
import { ChevronDown, Dumbbell, Layers } from "lucide-react";

export interface ExerciseFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories?: string[];
  counts?: Record<string, number>;
  selectedEquipment?: string;
  onSelectEquipment?: (equipment: string) => void;
  equipments?: string[];
  t: (key: string) => string;
  className?: string;
}

const DEFAULT_CATEGORIES = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Cardio",
  "Functional",
];

export const ExerciseFilterBar: React.FC<ExerciseFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = DEFAULT_CATEGORIES,
  counts,
  selectedEquipment,
  onSelectEquipment,
  equipments,
  t,
  className = "",
}) => {
  const formatCategory = (cat: string) => {
    if (cat.toLowerCase() === "all") return t("all") || "Tutti i muscoli";
    return t(cat.toLowerCase()) || cat;
  };

  const formatEquipment = (eq: string) => {
    if (eq.toLowerCase() === "all") return t("all") || "Tutte le attrezzature";
    return t(eq.toLowerCase()) || eq;
  };

  const hasEquipment = Boolean(equipments && equipments.length > 0 && onSelectEquipment);

  return (
    <div className={`w-full grid ${hasEquipment ? "grid-cols-2" : "grid-cols-1"} gap-2 ${className}`}>
      {/* Category / Muscle Group Dropdown */}
      <div className="relative group">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#1C1C1E] active:bg-[#2C2C2E] border border-white/10 rounded-xl text-xs font-semibold text-white shadow-sm transition-all pointer-events-none group-focus-within:border-[#30D158] group-focus-within:ring-1 group-focus-within:ring-[#30D158]/40">
          <div className="flex items-center gap-1.5 min-w-0">
            <Dumbbell className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
            <span className="truncate">
              {formatCategory(selectedCategory)}
            </span>
            {counts && counts[selectedCategory] !== undefined && (
              <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-white/10 text-[#8E8E93] shrink-0 font-bold">
                {counts[selectedCategory]}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-[#8E8E93] shrink-0 transition-transform group-focus-within:rotate-180" />
        </div>
        <select
          aria-label={t("filter_by_muscle") || "Filtra per gruppo muscolare"}
          value={selectedCategory}
          onChange={(e) => {
            triggerHaptic("selection");
            onSelectCategory(e.target.value);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-10"
        >
          {categories.map((cat) => {
            const count = counts ? counts[cat] : undefined;
            const label = formatCategory(cat) + (count !== undefined ? ` (${count})` : "");
            return (
              <option key={cat} value={cat} className="bg-[#1C1C1E] text-white py-1">
                {label}
              </option>
            );
          })}
        </select>
      </div>

      {/* Equipment Dropdown */}
      {hasEquipment && (
        <div className="relative group">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#1C1C1E] active:bg-[#2C2C2E] border border-white/10 rounded-xl text-xs font-semibold text-white shadow-sm transition-all pointer-events-none group-focus-within:border-[#0A84FF] group-focus-within:ring-1 group-focus-within:ring-[#0A84FF]/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />
              <span className="truncate">
                {formatEquipment(selectedEquipment || "All")}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#8E8E93] shrink-0 transition-transform group-focus-within:rotate-180" />
          </div>
          <select
            aria-label={t("filter_by_equipment") || "Filtra per attrezzatura"}
            value={selectedEquipment || "All"}
            onChange={(e) => {
              triggerHaptic("selection");
              onSelectEquipment!(e.target.value);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-10"
          >
            {equipments!.map((eq) => (
              <option key={eq} value={eq} className="bg-[#1C1C1E] text-white py-1">
                {formatEquipment(eq)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
