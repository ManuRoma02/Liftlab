import React, { useMemo } from "react";
import { Trophy, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { getVolumeComparison, getWorkoutComparisonMetrics, isTimedExercise } from "../lib/workoutUtils";

export function WorkoutSummaryView({
  logData,
  unit,
  language,
  onBack,
  t,
  workoutLogs = [],
}: {
  logData: any;
  unit: string;
  language: string;
  onBack: () => void;
  t: any;
  workoutLogs?: any[];
}) {
  if (!logData) return null;

  let totalVolume = 0;
  logData.exercises?.forEach((ex: any) => {
    ex.sets?.forEach((s: any) => {
      if (s.completed && s.weight && s.reps) {
        let w = parseFloat(s.weight) || 0;
        let r = parseInt(s.reps) || 0;
        totalVolume += w * r;
      }
    });
  });

  // Ensure volume is converted to a base kg for comparison
  let volumeKg = totalVolume;
  if (unit === "LBS") {
    volumeKg = totalVolume * 0.453592;
  }

  const comparisonSeed = String(logData.id || logData.date || Date.now())
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const comparison = getVolumeComparison(volumeKg, comparisonSeed);
  const comparisonText = comparison?.item || "";

  const totalSets =
    logData.exercises?.reduce(
      (acc: number, ex: any) =>
        acc + (ex.sets?.filter((s: any) => s.completed).length || 0),
      0,
    ) || 0;

  const comparisonMetrics = useMemo(
    () => getWorkoutComparisonMetrics(logData, workoutLogs, unit),
    [logData, workoutLogs, unit]
  );

  return (
    <div className="app-shell bg-[#09090b] min-h-[100dvh] flex flex-col p-4 relative font-sans overflow-y-auto">
      {/* Dynamic Background Effects */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-fixed/15 via-background to-background pointer-events-none"
      />

      <div className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto w-full z-10 text-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 premium-cta rounded-[1.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.18)] rotate-3"
        >
          <Trophy className="w-10 h-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-[var(--font-display-lg)] text-3xl font-black text-white tracking-wide mb-1 uppercase leading-[0.9]">
            Workout
            <br />
            <span className="text-primary-fixed">Destroyed</span>
          </h1>
          <p className="text-sm text-zinc-400 font-semibold">
            {logData.routineName || "Custom Workout"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 w-full"
        >
          <div className="premium-panel rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 z-10">
              {t("duration") || "Time"}
            </span>
            <p className="text-2xl font-bold text-white font-mono z-10">
              {Math.floor(logData.duration / 60)}:
              {(logData.duration % 60).toString().padStart(2, "0")}
            </p>
          </div>

          <div className="premium-panel rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Dumbbell className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 z-10">
              {t("sets") || "Sets"}
            </span>
            <p className="text-2xl font-bold text-white font-mono z-10">
              {totalSets}
            </p>
          </div>
        </motion.div>

        {/* Comparison Metrics vs Previous Session */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="premium-panel rounded-2xl p-4 w-full flex flex-col gap-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary-fixed flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              {t("vs_previous_session") || "Vs Previous Session"}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
              {comparisonMetrics.previousLogFound ? "Previous Session" : "First Session"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">
                Volume Diff
              </span>
              <span
                className={`text-sm font-black font-mono ${
                  comparisonMetrics.volumeDiff >= 0 ? "text-primary-fixed" : "text-amber-400"
                }`}
              >
                {comparisonMetrics.volumeDiffFormatted}
              </span>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">
                Total Sets
              </span>
              <span className="text-sm font-black font-mono text-white">
                {totalSets}
                <span className="text-[10px] text-zinc-400 ml-1">
                  ({comparisonMetrics.setsDiffFormatted})
                </span>
              </span>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">
                PRs Earned
              </span>
              <span className="text-sm font-black font-mono text-yellow-400 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                {comparisonMetrics.prsEarned}
              </span>
            </div>
          </div>
        </motion.div>

        {totalVolume > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="w-full relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-fixed/30 via-secondary/20 to-primary-fixed/0 rounded-[1.5rem] blur-xl opacity-50 relative z-0"></div>
            <div className="premium-panel rounded-2xl p-5 flex flex-col items-center shadow-xl relative z-10 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed via-secondary to-primary-fixed"></div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1 relative">
                Total Volume
              </span>
              <div className="flex items-baseline gap-2 relative">
                <p className="text-4xl font-black text-white tracking-tighter">
                  {totalVolume.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </p>
                <span className="text-lg text-primary-fixed font-bold">{unit}</span>
              </div>

              {comparison && comparisonText && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 w-full relative">
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    {language === "it"
                      ? "Hai sollevato l'equivalente di "
                      : language === "es"
                        ? "Levantaste el equivalente a "
                        : "You lifted the equivalent of "}
                    <br />
                    <span className="text-sm text-primary-fixed font-bold uppercase tracking-wide block mt-0.5">
                      {comparisonText}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
        className="pb-6 pt-2 px-4 w-full max-w-md mx-auto z-10 sticky bottom-0"
      >
        <button
          onClick={onBack}
          className="w-full premium-cta rounded-xl font-black text-base py-4 uppercase tracking-widest hover:brightness-110 transition-transform active:scale-95 cursor-pointer"
        >
          {t("finish_workout") || "Finish"}
        </button>
      </motion.div>
    </div>
  );
}

