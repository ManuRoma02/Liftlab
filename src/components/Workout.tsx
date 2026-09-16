import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dumbbell,
  Plus,
  Upload,
  Link as LinkIcon,
  ClipboardList,
  Star,
  MoreVertical,
  Copy,
  Trash2,
  Clock,
  Search,
  X,
} from "lucide-react";
import { TabHero } from "./common/TabHero";
import { ConfirmModal } from "./common/ConfirmModal";
import type { RoutineData } from "../types/workout";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export function Workout({
  t,
  unit,
  routines,
  onDuplicateRoutine,
  onDeleteRoutine,
  navigateTo,
  onSelectRoutine,
  onStartLiveWorkout,
  onToggleFavoriteRoutine,
  onCreate,
  onImportRoutine,
  activeRoutineId,
  onShareRoutine,
  onOpenImportCode,
}: {
  t: any;
  unit: string;
  routines: RoutineData[];
  onDuplicateRoutine: (routine: RoutineData) => void;
  onDeleteRoutine: (id: string) => void;
  navigateTo: (tab: string) => void;
  onSelectRoutine: (id: string) => void;
  onStartLiveWorkout: (id: string) => void;
  onToggleFavoriteRoutine: (id: string) => void;
  onCreate: () => void;
  onImportRoutine: (file: File) => Promise<void> | void;
  activeRoutineId?: string | null;
  onShareRoutine: (routine: RoutineData) => void;
  onOpenImportCode: () => void;
}) {
  const [routineSearch, setRoutineSearch] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleBack = (event: Event) => {
      if (routineToDelete) {
        event.preventDefault();
        setRoutineToDelete(null);
        return;
      }
      if (activeMenuId) {
        event.preventDefault();
        setActiveMenuId(null);
      }
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [activeMenuId, routineToDelete]);

  const duplicateRoutine = (routine: RoutineData) => {
    onDuplicateRoutine(routine);
    setActiveMenuId(null);
  };

  const deleteRoutine = (id: string) => {
    setRoutineToDelete(id);
    setActiveMenuId(null);
  };

  const scheduleLabels = ["mo", "tu", "we", "th", "fr", "sa", "su"];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const routinesToday = routines.filter((routine) => routine.scheduledDay != null && Number(routine.scheduledDay) === todayIndex).length;

  const sortedRoutines = useMemo(
    () =>
      [...routines].sort((a, b) => {
        const aToday = (a.scheduledDay != null && Number(a.scheduledDay) === todayIndex) ? 1 : 0;
        const bToday = (b.scheduledDay != null && Number(b.scheduledDay) === todayIndex) ? 1 : 0;
        if (aToday !== bToday) return bToday - aToday;
        return Number(!!b.favorite) - Number(!!a.favorite);
      }),
    [routines, todayIndex],
  );

  const filteredRoutines = useMemo(() => {
    if (!routineSearch.trim()) return sortedRoutines;
    const query = routineSearch.toLowerCase();
    return sortedRoutines.filter((r) =>
      r.name?.toLowerCase().includes(query) ||
      r.exercises.some((ex) => ex.title?.toLowerCase().includes(query))
    );
  }, [sortedRoutines, routineSearch]);

  return (
    <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg w-full">
      <TabHero
        eyebrow="Workout"
        title={t("workout")}
        subtitle={routines.length > 0 ? t("select_program") : "Create your first routine to start training."}
        icon={<Dumbbell className="w-7 h-7" />}
        onOpenSettings={() => navigateTo("settings")}
        metric={
          <span className="hidden sm:inline-flex text-xs font-black uppercase tracking-widest text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/20 rounded-full px-3 py-2">
            {routinesToday > 0 ? `${routinesToday} today` : `${routines.length} routines`}
          </span>
        }
        action={
          <div className="flex gap-2 w-full justify-end relative">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onCreate}
              className="bg-primary-fixed text-[#07110a] text-xs font-black uppercase tracking-wider px-4 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ flex: "1 1 60%", minWidth: "120px" }}
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
              <span className="truncate">Create New</span>
            </motion.button>
            <div className="relative" style={{ flex: "1 1 40%", minWidth: "90px" }}>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsImportMenuOpen((prev) => !prev)}
                aria-expanded={isImportMenuOpen}
                aria-haspopup="menu"
                className="w-full bg-[#1c1f20] text-white border border-white/5 text-xs font-black uppercase tracking-wider px-3 py-3.5 rounded-xl hover:bg-[#25292a] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 shrink-0" strokeWidth={3} />
                <span className="truncate">Import</span>
              </motion.button>
              {isImportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsImportMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#141618] border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[101] overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setIsImportMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-primary-fixed/20 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-primary-fixed shrink-0" />
                      <span>Upload JSON File</span>
                    </button>
                    <hr className="border-white/10" />
                    <button
                      onClick={() => {
                        setIsImportMenuOpen(false);
                        onOpenImportCode();
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-primary-fixed/20 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LinkIcon className="w-4 h-4 text-primary-fixed shrink-0" />
                      <span>Paste Code / Text</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              multiple
              className="hidden"
              onChange={async (event) => {
                const files = event.currentTarget.files;
                if (files && files.length > 0) {
                  for (let i = 0; i < files.length; i++) {
                    await onImportRoutine(files[i]);
                  }
                }
                event.currentTarget.value = "";
              }}
            />
          </div>
        }
      />

      {/* Routine Search Input */}
      {routines.length > 2 && (
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary-fixed transition-colors" />
          <input
            type="text"
            value={routineSearch}
            onChange={(e) => setRoutineSearch(e.target.value)}
            placeholder="Search routines by name or exercise..."
            className="w-full bg-surface-container-lowest border border-surface-variant rounded-xl pl-11 pr-10 py-2.5 text-sm text-on-background focus:border-primary-fixed focus:outline-none transition-all placeholder:text-on-surface-variant"
          />
          {routineSearch.length > 0 && (
            <button
              onClick={() => setRoutineSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-on-surface-variant hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Routine library */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 overflow-visible">
        {routines.length === 0 ? (
          <div className="md:col-span-3 flex flex-col items-center justify-center gap-6 py-20 border-2 border-dashed border-surface-variant rounded-xl bg-surface-container-low">
            <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center text-primary-fixed">
              <ClipboardList className="w-10 h-10" />
            </div>
            <div className="text-center max-w-sm px-4">
              <h3 className="text-headline-md font-bold text-on-background mb-2">
                No Routines Found
              </h3>
              <p className="text-body-lg text-on-surface-variant mb-6">
                Start by creating a new workout program or importing a workout JSON.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={onCreate}
                  className="bg-primary-fixed text-[#000000] text-label-bold px-6 py-3 rounded-lg hover:opacity-90 transition-all uppercase tracking-wide text-xs"
                >
                  Create New Program
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          filteredRoutines.map((routine) => (
            <article
              key={routine.id}
              className={`premium-panel rounded-2xl flex flex-col justify-between p-4 hover:border-primary-fixed/30 active:scale-[0.99] transition-all duration-150 relative group shadow-md gpu-accelerated ${
                activeRoutineId === routine.id ? "ring-1 ring-primary-fixed/40 border-primary-fixed/40" : ""
              }`}
            >
              <div className="flex flex-col gap-3">
                {/* Header: Name, Day Badge, Actions */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-tight truncate">
                        {routine.name || "Unnamed Routine"}
                      </h3>
                      {routine.scheduledDay != null && (
                        <span className="bg-[#0e271a] text-[#22c55e] border border-[#22c55e]/25 rounded-md px-2 py-0.5 text-[9px] font-black uppercase shrink-0">
                          {scheduleLabels[Number(routine.scheduledDay)].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                      <span>{routine.duration} min</span>
                      <span className="text-on-surface-variant/40">•</span>
                      <span>{routine.exercises?.length || 0} exercises</span>
                    </div>
                  </div>

                  {/* Options Menu & Favorite */}
                  <div className="relative flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteRoutine(routine.id);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer active:scale-90 ${
                        routine.favorite
                          ? "text-primary-fixed bg-primary-fixed/10"
                          : "text-on-surface-variant hover:text-primary-fixed hover:bg-white/5"
                      }`}
                      aria-label={routine.favorite ? "Remove favorite" : "Favorite routine"}
                    >
                      <Star className="w-4 h-4" fill={routine.favorite ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === routine.id ? null : routine.id,
                        );
                      }}
                      aria-label={`Actions for ${routine.name || "routine"}`}
                      aria-expanded={activeMenuId === routine.id}
                      aria-haspopup="menu"
                      className="w-9 h-9 text-on-surface-variant hover:text-primary transition-colors p-1 relative z-10 cursor-pointer flex items-center justify-center rounded-full hover:bg-white/5 active:scale-90"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === routine.id && (
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#101112] border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-[101] overflow-hidden py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateRoutine(routine);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4 text-white/70" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareRoutine(routine);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
                          >
                            <LinkIcon className="w-4 h-4 text-white/70" />
                            <span>Share QR / Code</span>
                          </button>
                          <div className="h-[1px] bg-white/5 my-1 mx-2" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoutine(routine.id);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoutine(routine.id);
                    navigateTo("routine_editor");
                  }}
                  className="min-h-10 border border-white/10 text-on-surface text-xs font-bold py-2 rounded-xl hover:bg-white/5 hover:border-primary-fixed/40 active:scale-95 transition-all uppercase tracking-wider cursor-pointer text-center"
                >
                  EDIT
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartLiveWorkout(routine.id);
                  }}
                  className="min-h-10 premium-cta text-[#07110a] text-xs font-black py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider cursor-pointer text-center"
                >
                  START
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {routineToDelete && (
        <ConfirmModal
          message={`Delete "${routines.find(r => r.id === routineToDelete)?.name?.trim() || "Unnamed Routine"}"? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive
          onConfirm={() => { onDeleteRoutine(routineToDelete); setRoutineToDelete(null); }}
          onCancel={() => setRoutineToDelete(null)}
        />
      )}
    </main>
  );
}
