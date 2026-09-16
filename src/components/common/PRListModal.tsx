import React, { useState } from "react";
import { Trophy, X, Search } from "lucide-react";
import { ExerciseMuscleVisual } from "./ExerciseMuscleVisual";
import { isTimedExercise } from "../../lib/workoutUtils";
import type { ExerciseData } from "../../types/workout";

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-[var(--font-headline-sm)] text-[20px] font-bold text-primary tracking-tight uppercase">
              {t("personal_records")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder={t("search_exercise") || "Search exercise..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-surface-variant rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
          {allDisplayExercises.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No exercises found.</p>
            </div>
          ) : (
            allDisplayExercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-surface border border-surface-variant rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-variant rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    <ExerciseMuscleVisual exercise={ex} className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-on-background font-bold truncate">
                      {t(ex.title)}
                    </h4>
                    <p className="text-[12px] text-on-surface-variant uppercase font-medium">
                      {ex.category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-surface-variant/10 rounded-lg p-2">
                  <div className="text-center">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">
                      {t("est_1rm")}
                    </p>
                    <p className="font-black text-primary text-sm leading-none">
                      {ex.oneRepMax || 0}
                      <span className="text-[9px] ml-0.5 opacity-70 font-normal">
                        {unit}
                      </span>
                    </p>
                  </div>
                  <div className="text-center border-x border-surface-variant/30">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">
                      {t("max_weight")}
                    </p>
                    <p className="font-black text-on-background text-sm leading-none">
                      {ex.prWeight || 0}
                      <span className="text-[9px] ml-0.5 opacity-70 font-normal">
                        {unit}
                      </span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">
                      {t("best_set")}
                    </p>
                    <p className="font-black text-on-background text-sm leading-none">
                      {ex.prReps || 0}
                      <span className="text-[9px] ml-0.5 opacity-70 font-normal">
                        {isTimedExercise(ex) ? "SECS" : t("reps_upper")}
                      </span>
                    </p>
                    {ex.prRepsWeight && (
                      <p className="text-on-surface-variant text-[8px] mt-0.5 italic">
                        @ {ex.prRepsWeight}
                        {unit.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-surface-variant/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-primary-fixed text-on-primary-fixed font-bold rounded-lg hover:opacity-90 transition-opacity uppercase tracking-wide text-xs"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
