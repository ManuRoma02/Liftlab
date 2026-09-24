import React, { useState } from "react";
import { Trophy, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExerciseMuscleVisual } from "./ExerciseMuscleVisual";
import { isTimedExercise } from "../../lib/workoutUtils";
import type { ExerciseData } from "../../types/workout";
import { triggerHaptic } from "../../lib/haptics";
import { APPLE_SPRINGS } from "../../lib/motion";

export function PRListModal({
  exercises,
  unit,
  onClose,
  t,
}: {
  exercises: ExerciseData[];
  unit: string;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [search, setSearch] = useState("");

  const allDisplayExercises = exercises
    .filter((ex) => {
      const hasPR = ex.prWeight || ex.oneRepMax;
      const titleStr = t(ex.title) || ex.title;
      return hasPR && titleStr.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      return a.title.localeCompare(b.title);
    });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[300] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t("personal_records")}
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/8 flex justify-between items-center bg-[#1C1C1E] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF9F0A]/15 border border-[#FF9F0A]/25 rounded-2xl flex items-center justify-center text-[#FF9F0A]">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white tracking-tight">
                {t("personal_records")}
              </h3>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-white/6 shrink-0 bg-black/20">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <input
                type="text"
                placeholder={t("search_exercise") || "Search exercise..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-sm text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#30D158] transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2.5 min-h-0 custom-scrollbar">
            {allDisplayExercises.length === 0 ? (
              <div className="py-16 text-center text-[#8E8E93]">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No exercises found.</p>
              </div>
            ) : (
              allDisplayExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-black/40 border border-white/6 rounded-2xl p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      <ExerciseMuscleVisual exercise={ex} className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">
                        {t(ex.title)}
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-semibold tracking-wider">
                        {ex.category}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-black/30 rounded-xl p-2.5 text-center">
                    <div>
                      <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider mb-0.5">
                        {t("est_1rm")}
                      </p>
                      <p className="font-black text-[#30D158] text-sm leading-none tabular-nums">
                        {ex.oneRepMax || 0}
                        <span className="text-[9px] ml-0.5 text-[#8E8E93] font-normal">
                          {unit}
                        </span>
                      </p>
                    </div>
                    <div className="border-x border-white/6">
                      <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider mb-0.5">
                        {t("max_weight")}
                      </p>
                      <p className="font-black text-white text-sm leading-none tabular-nums">
                        {ex.prWeight || 0}
                        <span className="text-[9px] ml-0.5 text-[#8E8E93] font-normal">
                          {unit}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider mb-0.5">
                        {t("best_set")}
                      </p>
                      <p className="font-black text-white text-sm leading-none tabular-nums">
                        {ex.prReps || 0}
                        <span className="text-[9px] ml-0.5 text-[#8E8E93] font-normal">
                          {isTimedExercise(ex) ? "s" : t("reps_upper")}
                        </span>
                      </p>
                      {ex.prRepsWeight && (
                        <p className="text-[#8E8E93] text-[8px] mt-0.5">
                          @ {ex.prRepsWeight} {unit.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/6">
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="w-full py-3 min-h-[44px] bg-[#30D158] text-black font-bold rounded-full hover:brightness-105 active:scale-95 transition-all text-sm cursor-pointer shadow-sm flex items-center justify-center"
            >
              {t("close")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
