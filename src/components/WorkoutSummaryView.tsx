import React, { useMemo } from "react";
import { Trophy, Clock, Dumbbell, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { getVolumeComparison, getWorkoutComparisonMetrics } from "../lib/workoutUtils";
import { triggerHaptic } from "../lib/haptics";
import { APPLE_SPRINGS } from "../lib/motion";

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
  let totalReps = 0;
  logData.exercises?.forEach((ex: any) => {
    ex.sets?.forEach((s: any) => {
      if (s.completed && s.reps) {
        const r = parseInt(s.reps) || 0;
        totalReps += r;
        if (s.weight) {
          const w = parseFloat(s.weight) || 0;
          totalVolume += w * r;
        }
      }
    });
  });

  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
    <div
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
      }}
      className="bg-black text-white min-h-[100dvh] flex flex-col px-4 relative font-sans antialiased overflow-y-auto"
    >
      {/* Dynamic Background Effects */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#30D158]/12 via-black to-black pointer-events-none"
      />

      <div className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto w-full z-10 text-center gap-5 py-8">
        {/* Apple Fitness Award Badge */}
        <motion.div
          initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={APPLE_SPRINGS.bouncy}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#30D158] to-[#64D2FF] p-0.5 shadow-[0_0_50px_rgba(48,209,88,0.35)]"
        >
          <div className="w-full h-full bg-[#1C1C1E] rounded-[22px] flex items-center justify-center text-[#30D158]">
            <Trophy className="w-12 h-12 text-[#30D158]" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={APPLE_SPRINGS.criticallyDamped}
        >
          <div className="flex items-center justify-center gap-1.5 text-[#30D158] font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("workout_completed") || "Workout Completed!"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {logData.routineName || "Custom Workout"}
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1">
            {t("workout_completed_subtitle") || "Ottimo lavoro! Ecco il riepilogo della tua sessione."}
          </p>
        </motion.div>

        {/* Apple Stat Grid (Duration & Sets) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          className="grid grid-cols-2 gap-3 w-full"
        >
          <div className="apple-glass-card rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute top-3.5 right-3.5 opacity-20 text-[#8E8E93]">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mb-1">
              {t("duration") || "Time"}
            </span>
            <p className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {formatDuration(logData.duration)}
            </p>
          </div>

          <div className="apple-glass-card rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute top-3.5 right-3.5 opacity-20 text-[#8E8E93]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mb-1">
              {t("sets") || "Sets"}
            </span>
            <p className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {totalSets}
            </p>
          </div>
        </motion.div>

        {/* Comparison Metrics vs Previous Session */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          className="apple-glass-card rounded-3xl p-5 w-full flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#30D158] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              {t("vs_previous_session") || "Vs Previous Session"}
            </span>
            <span className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold">
              {comparisonMetrics.previousLogFound ? (t("previous_session") || "Previous Session") : (t("first_session") || "First Session")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-black/40 border border-white/6 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-[#8E8E93] mb-1">
                {t("volume_diff") || "Volume Diff"}
              </span>
              <span
                className={`text-sm font-black tabular-nums ${
                  comparisonMetrics.volumeDiff >= 0 ? "text-[#30D158]" : "text-[#FF9F0A]"
                }`}
              >
                {comparisonMetrics.volumeDiffFormatted}
              </span>
            </div>

            <div className="bg-black/40 border border-white/6 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-[#8E8E93] mb-1">
                {t("total_sets") || "Total Sets"}
              </span>
              <span className="text-sm font-black text-white tabular-nums">
                {totalSets}
                <span className="text-[10px] text-[#8E8E93] ml-1">
                  ({comparisonMetrics.setsDiffFormatted})
                </span>
              </span>
            </div>

            <div className="bg-black/40 border border-white/6 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-[#8E8E93] mb-1">
                {t("prs_earned") || "PRs Earned"}
              </span>
              <span className="text-sm font-black text-[#FFD60A] flex items-center justify-center gap-1 tabular-nums">
                <Trophy className="w-3.5 h-3.5" />
                {comparisonMetrics.prsEarned}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Volume Hero Card */}
        {totalVolume > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={APPLE_SPRINGS.criticallyDamped}
            className="w-full relative"
          >
            <div className="apple-glass-card rounded-3xl p-6 flex flex-col items-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mb-1">
                {t("total_volume") || "Total Volume"}
              </span>
              <div className="flex items-baseline gap-1.5">
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                  {totalVolume.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </p>
                <span className="text-base text-[#30D158] font-bold uppercase">{unit}</span>
              </div>

              {comparison && comparisonText && (
                <div className="mt-4 pt-3.5 border-t border-white/6 w-full text-center">
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    {language === "it"
                      ? "Hai sollevato l'equivalente di "
                      : language === "es"
                        ? "Levantaste el equivalente a "
                        : "You lifted the equivalent of "}
                    <br />
                    <span className="text-sm text-[#30D158] font-bold uppercase tracking-wider block mt-1">
                      {comparisonText}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Total Reps Hero Card (for bodyweight workouts) */}
        {totalVolume === 0 && totalReps > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={APPLE_SPRINGS.criticallyDamped}
            className="w-full relative"
          >
            <div className="apple-glass-card rounded-3xl p-6 flex flex-col items-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mb-1">
                {t("total_reps") || "Total Repetitions"}
              </span>
              <div className="flex items-baseline gap-1.5">
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                  {totalReps.toLocaleString()}
                </p>
                <span className="text-base text-[#30D158] font-bold uppercase">reps</span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-2">
                {t("bodyweight_focus") || "Ottima sessione a corpo libero!"}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom Finish Button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={APPLE_SPRINGS.criticallyDamped}
        className="pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-2 px-4 w-full max-w-md mx-auto z-10 sticky bottom-0"
      >
        <button
          onClick={() => {
            triggerHaptic("success");
            onBack();
          }}
          className="w-full bg-[#30D158] text-black font-extrabold text-base py-4 rounded-full shadow-[0_8px_24px_rgba(48,209,88,0.3)] hover:brightness-105 active:scale-95 transition-all cursor-pointer uppercase tracking-wider min-h-[44px]"
        >
          {t("finish_workout") || "Finish"}
        </button>
      </motion.div>
    </div>
  );
}
