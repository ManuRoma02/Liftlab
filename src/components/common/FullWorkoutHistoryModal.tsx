import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Search, X, ChevronDown, ChevronUp, Trash2, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ConfirmModal } from "./ConfirmModal";
import { getWorkoutLogDurationMinutes, getLogDate } from "../../lib/workoutUtils";
import { triggerHaptic, hapticPress } from "../../lib/haptics";
import { APPLE_SPRINGS } from "../../lib/motion";
import { useModalDismiss } from "../../lib/modalStack";
import { createPortal } from "react-dom";
import { useAndroidSwipeBack } from "../../lib/useAndroidSwipeBack";

export interface FullWorkoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutLogs: any[];
  unit: string;
  t?: (key: string) => string;
  onDeleteWorkoutLog?: (id: string) => void;
}

export function FullWorkoutHistoryModal({
  isOpen,
  onClose,
  workoutLogs = [],
  unit,
  t,
  onDeleteWorkoutLog,
}: FullWorkoutHistoryModalProps) {
  const [search, setSearch] = useState("");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);

  useModalDismiss(isOpen, onClose);

  const {
    dragX,
    scrimOpacity,
    swipeStyle,
    swipeHandlers,
  } = useAndroidSwipeBack({
    onDismiss: onClose,
    enabled: isOpen,
    edgeOnly: true,
    edgeWidth: 50,
  });

  const tr = (key: string, fallback: string) => {
    if (typeof t === "function") {
      const val = t(key);
      if (val && val !== key) return val;
    }
    return fallback;
  };

  const sortedLogsDescending = useMemo(() => {
    return [...workoutLogs]
      .filter((log) => log && log.date)
      .sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime());
  }, [workoutLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sortedLogsDescending;

    return sortedLogsDescending.filter((log) => {
      const nameMatch = (log.routineName || log.name || "Workout")
        .toLowerCase()
        .includes(q);
      const exMatch = (log.exercises || []).some((ex: any) => {
        const title = (ex.title || ex.name || "").toLowerCase();
        const translated = (typeof t === "function" ? t(ex.title || "") : "").toLowerCase();
        return title.includes(q) || translated.includes(q);
      });
      return nameMatch || exMatch;
    });
  }, [sortedLogsDescending, search, t]);

  const toggleExpand = (logId: string) => {
    triggerHaptic("light");
    setExpandedLogIds((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  const modalElement = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="full-history-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ opacity: scrimOpacity }}
          className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4"
          onClick={onClose}
        >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={tr("full_workout_history", "Full Workout History")}
          {...swipeHandlers}
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          style={{
            ...swipeStyle,
            willChange: "transform",
            transform: dragX > 0 ? `translateX(${dragX}px)` : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#24252c] border border-white/16 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col max-h-[85vh] will-change-transform transform-gpu select-none"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#24252c] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#30D158]/15 border border-[#30D158]/25 rounded-2xl flex items-center justify-center text-[#30D158]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-white tracking-tight">
                  {tr("full_workout_history", "Full Workout History")}
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  {filteredLogs.length} {filteredLogs.length === 1 ? "workout" : "workouts"} logged
                </p>
              </div>
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

          {/* Search Bar */}
          <div className="px-5 py-3 border-b border-white/6 shrink-0 bg-black/20">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <input
                type="text"
                placeholder={tr("search_workout_or_exercise", "Search workout or exercise...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#30D158] transition-all"
              />
            </div>
          </div>

        {/* Logs List */}
        <div className="p-4 md:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <Dumbbell className="w-10 h-10 text-[#8E8E93] opacity-30" />
              <p className="text-[#8E8E93] text-sm">
                {search ? `No workouts found matching "${search}"` : "No workout history found."}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const logId = log.id || String(getLogDate(log).getTime());
              const date = getLogDate(log);
              const dateStr = date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const isExpanded = !!expandedLogIds[logId];

              const validExercises = (log.exercises || [])
                .map((ex: any) => ({
                  ...ex,
                  completedSets: (ex.sets || []).filter(
                    (s: any) => s.completed === true || (s.completed === undefined && (s.weight || s.reps))
                  ),
                }))
                .filter((ex: any) => ex.completedSets.length > 0 || (ex.sets && ex.sets.length > 0));

              const totalCompletedSetsInLog = (log.exercises || []).reduce(
                (sum: number, ex: any) => {
                  const completed = (ex.sets || []).filter(
                    (s: any) => s.completed === true || (s.completed === undefined && (s.weight || s.reps))
                  );
                  return sum + (completed.length > 0 ? completed.length : (ex.sets || []).length);
                },
                0
              );

              let logVolume = 0;
              (log.exercises || []).forEach((ex: any) => {
                (ex.sets || []).forEach((s: any) => {
                  const isComp = s.completed === true || (s.completed === undefined && (s.weight || s.reps));
                  if (isComp && s.weight && s.reps) {
                    logVolume += Number(s.weight) * Number(s.reps);
                  }
                });
              });

              const volumeFormatted =
                logVolume >= 1000
                  ? `${(logVolume / 1000).toFixed(1)}k ${unit.toLowerCase()}`
                  : `${logVolume} ${unit.toLowerCase()}`;

              const durationFormatted = getWorkoutLogDurationMinutes(log.duration);

              return (
                <motion.div
                  key={logId}
                  whileTap={{ scale: 0.995 }}
                  transition={{ duration: 0.1 }}
                  className="bg-black/40 border border-white/6 rounded-2xl overflow-hidden hover:border-white/18 transition-all cursor-pointer"
                  onClick={() => toggleExpand(logId)}
                >
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-white tracking-tight truncate">
                        {log.routineName || log.name || "Workout"}
                      </h4>
                      <p className="text-xs text-[#8E8E93] flex flex-wrap items-center gap-2 mt-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{durationFormatted} min</span>
                        <span>•</span>
                        <span>{totalCompletedSetsInLog} sets</span>
                        <span>•</span>
                        <span className="text-[#30D158] font-bold">{volumeFormatted}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onDeleteWorkoutLog && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic("warning");
                            setPendingDeleteLogId(logId);
                          }}
                          className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#8E8E93] hover:text-[#FF453A] hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center"
                          title="Delete workout log"
                          aria-label="Delete workout log"
                        >
                          <Trash2 className="w-4 h-4 text-[#FF453A]" />
                        </button>
                      )}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="p-1 text-[#8E8E93]"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && validExercises.length > 0 && (
                      <motion.div
                        key={`modal-expanded-${logId}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.22, ease: "easeOut" },
                        }}
                        className="overflow-hidden border-t border-white/5 bg-black/20"
                      >
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {validExercises.map((ex: any, exIdx: number) => {
                            const setsToRender = ex.completedSets.length > 0 ? ex.completedSets : (ex.sets || []);
                            return (
                              <motion.div
                                key={exIdx}
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  duration: 0.22,
                                  delay: Math.min(exIdx * 0.03, 0.2),
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="bg-white/5 p-3 rounded-xl border border-white/6 text-xs hover:border-white/12 transition-colors"
                              >
                                <p className="font-bold text-white truncate mb-1.5">
                                  {tr(ex.title || ex.name || "", ex.title || ex.name || "Exercise")}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {setsToRender.map((set: any, setIdx: number) => (
                                    <span
                                      key={setIdx}
                                      className="bg-black/50 text-[#30D158] font-semibold px-2 py-0.5 rounded-md text-[11px] tabular-nums"
                                    >
                                      {set.weight !== undefined && set.weight !== "" ? `${set.weight}${unit}` : ""}
                                      {set.reps !== undefined && set.reps !== "" ? ` × ${set.reps}` : ""}
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {pendingDeleteLogId && onDeleteWorkoutLog && (
          <ConfirmModal
            key="delete-history-confirm"
            message="Are you sure you want to delete this workout log from your history?"
            confirmLabel={tr("delete", "Delete")}
            cancelLabel={tr("cancel", "Cancel")}
            destructive
            onConfirm={() => {
              onDeleteWorkoutLog(pendingDeleteLogId);
              setPendingDeleteLogId(null);
            }}
            onCancel={() => setPendingDeleteLogId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalElement, document.body) : modalElement;
}
