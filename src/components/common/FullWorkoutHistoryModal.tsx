import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Search, X, ChevronDown, ChevronUp, Trash2, Dumbbell } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { getWorkoutLogDurationMinutes } from "../../lib/workoutUtils";

export interface FullWorkoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutLogs: any[];
  unit: string;
  t?: (key: string) => string;
  onDeleteWorkoutLog?: (id: string) => void;
}

const getLogDate = (log: any) => {
  if (!log || !log.date) return new Date();
  if (typeof log.date.toDate === "function") return log.date.toDate();
  return new Date(log.date);
};

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

  useEffect(() => {
    if (!isOpen) return;
    const handleBack = (event: Event) => {
      if (pendingDeleteLogId) {
        event.preventDefault();
        setPendingDeleteLogId(null);
        return;
      }
      if (event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [isOpen, onClose, pendingDeleteLogId]);

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
    setExpandedLogIds((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-surface-variant flex justify-between items-center bg-surface-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl text-primary tracking-tight uppercase">
                {tr("full_workout_history", "Full Workout History")}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {filteredLogs.length} {filteredLogs.length === 1 ? "workout" : "workouts"} logged
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-variant/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-surface-variant/40 shrink-0 bg-surface/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder={tr("search_workout_or_exercise", "Search workout or exercise...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-surface-variant rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-3 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <Dumbbell className="w-10 h-10 text-on-surface-variant/30" />
              <p className="text-on-surface-variant text-sm font-medium">
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
                <div
                  key={logId}
                  className="bg-black/30 border border-surface-variant/60 rounded-xl overflow-hidden hover:border-primary-fixed/40 transition-all cursor-pointer"
                  onClick={() => toggleExpand(logId)}
                >
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-primary uppercase tracking-wide truncate">
                        {log.routineName || log.name || "Workout"}
                      </h4>
                      <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-2 mt-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{durationFormatted} min</span>
                        <span>•</span>
                        <span>{totalCompletedSetsInLog} sets</span>
                        <span>•</span>
                        <span className="text-primary-fixed font-semibold">{volumeFormatted}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onDeleteWorkoutLog && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteLogId(logId);
                          }}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Delete workout log"
                          aria-label="Delete workout log"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                      <div className="p-1 text-on-surface-variant">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && validExercises.length > 0 && (
                    <div className="p-4 border-t border-surface-variant/40 bg-surface/30 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {validExercises.map((ex: any, exIdx: number) => {
                        const setsToRender = ex.completedSets.length > 0 ? ex.completedSets : (ex.sets || []);
                        return (
                          <div
                            key={exIdx}
                            className="bg-surface/50 p-3 rounded-lg border border-surface-variant/30 text-xs"
                          >
                            <p className="font-bold text-on-surface truncate mb-1.5">
                              {tr(ex.title || ex.name || "", ex.title || ex.name || "Exercise")}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {setsToRender.map((set: any, setIdx: number) => (
                                <span
                                  key={setIdx}
                                  className="bg-black/40 text-primary-fixed px-2 py-0.5 rounded text-[11px] font-mono border border-white/5"
                                >
                                  {set.weight !== undefined && set.weight !== "" ? `${set.weight}${unit}` : ""}
                                  {set.reps !== undefined && set.reps !== "" ? ` × ${set.reps}` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {pendingDeleteLogId && onDeleteWorkoutLog && (
        <ConfirmModal
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
    </div>
  );
}
