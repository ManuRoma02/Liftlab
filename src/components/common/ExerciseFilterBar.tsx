import React from "react";
import { triggerHaptic } from "../../lib/haptics";
import { motion } from "motion/react";
import { CARTOON_SPRINGS } from "../../lib/motion";

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
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {/* Category Pills (Muscle Groups / Disciplines) */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 select-none touch-pan-x"
        role="tablist"
        aria-label="Filter exercises by muscle group"
      >
        {categories.map((cat) => {
          const isSelected =
            selectedCategory.toLowerCase() === cat.toLowerCase();
          const count = counts ? counts[cat] : undefined;

          // Don't hide 'All', but if counts are provided and a category has 0 items, we can still show or fade it
          const countBadge =
            count !== undefined ? (
              <span
                className={`ml-1 text-[10px] tabular-nums px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-black/20 text-black font-extrabold"
                    : "bg-white/10 text-[#8E8E93]"
                }`}
              >
                {count}
              </span>
            ) : null;

          return (
            <motion.button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isSelected}
              whileTap={{ scale: 0.88, rotate: -2 }}
              whileHover={{ scale: 1.04 }}
              transition={CARTOON_SPRINGS.bouncy}
              onClick={() => {
                triggerHaptic("light");
                onSelectCategory(cat);
              }}
              className={`shrink-0 inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#30D158] text-black font-extrabold shadow-[0_2px_12px_rgba(48,209,88,0.3)] scale-[1.02]"
                  : "bg-white/6 hover:bg-white/12 text-[#8E8E93] hover:text-white border border-white/8 font-semibold"
              }`}
            >
              <span>{cat === "All" ? (t("all") || "Tutti") : (t(cat.toLowerCase()) || cat)}</span>
              {countBadge}
            </motion.button>
          );
        })}
      </div>

      {/* Optional Equipment Row (Barbell, Dumbbell, Cable, Machine, Bodyweight) */}
      {equipments && onSelectEquipment && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 select-none touch-pan-x"
          role="tablist"
          aria-label="Filter exercises by equipment"
        >
          {equipments.map((eq) => {
            const isSelected =
              (selectedEquipment || "All").toLowerCase() === eq.toLowerCase();
            return (
              <motion.button
                key={eq}
                type="button"
                role="tab"
                aria-selected={isSelected}
                whileTap={{ scale: 0.88, rotate: 2 }}
                whileHover={{ scale: 1.04 }}
                transition={CARTOON_SPRINGS.bouncy}
                onClick={() => {
                  triggerHaptic("light");
                  onSelectEquipment(eq);
                }}
                className={`shrink-0 inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-white text-black font-extrabold shadow-sm"
                    : "bg-white/4 hover:bg-white/8 text-[#8E8E93] hover:text-white border border-white/6 font-medium"
                }`}
              >
                <span>{eq === "All" ? (t("all") || "Tutti") : (t(eq.toLowerCase()) || eq)}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
