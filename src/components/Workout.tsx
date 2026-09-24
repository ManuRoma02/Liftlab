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
  Sparkles,
} from "lucide-react";
import { TabHero } from "./common/TabHero";
import { ConfirmModal } from "./common/ConfirmModal";
import { getExerciseSearchScore } from "../lib/searchUtils";
import type { RoutineData } from "../types/workout";
import { motion } from "motion/react";
import { triggerHaptic } from "../lib/haptics";

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
  onLoadStarterRoutines,
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
  onLoadStarterRoutines?: () => void;
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
      (r.exercises || []).some((ex) =>
        ex.title?.toLowerCase().includes(query) ||
        (t && t(ex.title)?.toLowerCase().includes(query)) ||
        getExerciseSearchScore(query, ex, t) > 0
      )
    );
  }, [sortedRoutines, routineSearch, t]);

  return (
    <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg w-full">
      <TabHero
        eyebrow="Workout"
        title={t("workout")}
        subtitle={routines.length > 0 ? t("select_program") : "Create your first routine to start training."}
        icon={<Dumbbell className="w-7 h-7" />}
        onOpenSettings={() => navigateTo("settings")}
        metric={
          <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
            {routinesToday > 0 ? `${routinesToday} today` : `${routines.length} routines`}
          </span>
        }
        action={
          <div className="flex gap-2 w-full justify-end relative flex-wrap sm:flex-nowrap">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("medium");
                onStartLiveWorkout("empty");
              }}
              className="bg-[#30D158] text-black text-xs font-extrabold px-4 py-3 rounded-full hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(48,209,88,0.3)] shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{t("start_empty") || "Allenamento Libero"}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("light");
                onCreate();
              }}
              className="bg-white/8 text-white border border-white/10 text-xs font-bold px-4 py-3 rounded-full hover:bg-white/12 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="truncate">{t("create_new") || "Nuova Scheda"}</span>
            </motion.button>
            <div className="relative shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  triggerHaptic("light");
                  setIsImportMenuOpen((prev) => !prev);
                }}
                aria-expanded={isImportMenuOpen}
                aria-haspopup="menu"
                className="w-10 h-10 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title={t("upload_routine_file") || "Import"}
              >
                <Upload className="w-4 h-4" strokeWidth={2} />
              </motion.button>
              {isImportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsImportMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C1E] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[101] overflow-hidden py-1.5">
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setIsImportMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/8 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#30D158] shrink-0" />
                      <span>{t("upload_routine_file") || "Carica File Scheda"}</span>
                    </button>
                    <hr className="border-white/8 my-1" />
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setIsImportMenuOpen(false);
                        onOpenImportCode();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/8 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LinkIcon className="w-4 h-4 text-[#30D158] shrink-0" />
                      <span>{t("import_routine_code") || "Incolla Testo o Codice"}</span>
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#30D158] transition-colors" />
          <input
            type="text"
            value={routineSearch}
            onChange={(e) => setRoutineSearch(e.target.value)}
            placeholder="Search routines by name or exercise..."
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:border-[#30D158]/50 focus:outline-none transition-all placeholder:text-[#8E8E93]"
          />
          {routineSearch.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setRoutineSearch("");
              }}
              aria-label="Clear routine search"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Routine library */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 overflow-visible">
        {routines.length === 0 ? (
          <div className="md:col-span-3 flex flex-col items-center justify-center gap-6 py-20 border-2 border-dashed border-white/10 rounded-3xl bg-[#1C1C1E]/50">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[#30D158]">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div className="text-center max-w-sm px-4">
              <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                {t("no_routines_title") || "No Routines Found"}
              </h3>
              <p className="text-sm text-[#8E8E93] mb-6">
                {t("no_routines_subtitle") || "Start right away with a freestyle workout or create your first routine."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic("medium");
                    onStartLiveWorkout("empty");
                  }}
                  className="bg-[#30D158] text-black font-extrabold px-6 py-3 rounded-full hover:opacity-90 transition-all text-xs tracking-tight shadow-[0_4px_14px_rgba(48,209,88,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  <span>{t("start_empty") || "Inizia Allenamento Libero"}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic("light");
                    onCreate();
                  }}
                  className="bg-white/8 text-white border border-white/10 font-bold px-6 py-3 rounded-full hover:bg-white/12 transition-all text-xs tracking-tight cursor-pointer"
                >
                  {t("create_new") || "Crea Nuova Scheda"}
                </motion.button>
                {onLoadStarterRoutines && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      triggerHaptic("medium");
                      onLoadStarterRoutines();
                    }}
                    className="bg-white/10 text-white border border-white/20 font-bold px-6 py-3 rounded-full hover:bg-white/20 transition-all text-xs tracking-tight cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#30D158]" />
                    <span>{t("restore_starter_routines") || "Carica Schede Starter"}</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="md:col-span-3 flex flex-col items-center justify-center gap-4 py-16 border border-dashed border-white/10 rounded-3xl bg-[#1C1C1E]/50">
            <Search className="w-8 h-8 text-[#8E8E93]" />
            <div className="text-center max-w-sm px-4">
              <h3 className="text-lg font-bold text-white mb-1">
                {t("no_routines_search") || "Nessuna scheda trovata"}
              </h3>
              <p className="text-sm text-[#8E8E93] mb-4">
                {routineSearch ? `Nessun risultato per "${routineSearch}"` : "Nessun risultato corrispondente."}
              </p>
              <button
                onClick={() => setRoutineSearch("")}
                className="bg-white/10 text-white border border-white/15 px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/15 transition-all cursor-pointer"
              >
                {t("clear_search") || "Azzera Ricerca"}
              </button>
            </div>
          </div>
        ) : (
          filteredRoutines.map((routine) => (
            <article
              key={routine.id}
              className={`apple-glass-card rounded-3xl flex flex-col justify-between p-5 hover:border-white/20 active:scale-[0.98] transition-all duration-150 relative group shadow-[0_4px_20px_rgba(0,0,0,0.3)] gpu-accelerated ${
                activeRoutineId === routine.id ? "ring-1 ring-[#30D158]/50 border-[#30D158]/50" : ""
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
                        <span className="bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase shrink-0">
                          {scheduleLabels[Number(routine.scheduledDay)].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] font-medium">
                      <span>{routine.duration} min</span>
                      <span className="text-white/20">•</span>
                      <span>
                        {Number(routine.exercises?.length ?? 0) === 1
                          ? (t("one_exercise") || "1 exercise")
                          : `${routine.exercises?.length ?? 0} ${t("exercises") || "exercises"}`}
                      </span>
                    </div>
                  </div>

                  {/* Options Menu & Favorite */}
                  <div className="relative flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic("light");
                        onToggleFavoriteRoutine(routine.id);
                      }}
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer active:scale-90 ${
                        routine.favorite
                          ? "text-[#30D158] bg-[#30D158]/15"
                          : "text-[#8E8E93] hover:text-[#30D158] hover:bg-white/5"
                      }`}
                      aria-label={routine.favorite ? "Remove favorite" : "Favorite routine"}
                    >
                      <Star className="w-4 h-4" fill={routine.favorite ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic("light");
                        setActiveMenuId(
                          activeMenuId === routine.id ? null : routine.id,
                        );
                      }}
                      aria-label={`Actions for ${routine.name || "routine"}`}
                      aria-expanded={activeMenuId === routine.id}
                      aria-haspopup="menu"
                      className="min-w-[44px] min-h-[44px] text-[#8E8E93] hover:text-white transition-colors relative z-10 cursor-pointer flex items-center justify-center rounded-full hover:bg-white/5 active:scale-90"
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
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#1C1C1E] border border-white/15 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-[101] overflow-hidden py-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("light");
                              duplicateRoutine(routine);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-white hover:bg-white/8 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4 text-white/70" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("light");
                              onShareRoutine(routine);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-white hover:bg-white/8 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <LinkIcon className="w-4 h-4 text-white/70" />
                            <span>Share QR / Code</span>
                          </button>
                          <div className="h-[1px] bg-white/8 my-1 mx-2" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic("warning");
                              deleteRoutine(routine.id);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#FF453A] hover:bg-[#FF453A]/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-[#FF453A]" />
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
                    triggerHaptic("light");
                    onSelectRoutine(routine.id);
                    navigateTo("routine_editor");
                  }}
                  className="min-h-[44px] border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-full active:scale-95 transition-all cursor-pointer text-center"
                >
                  EDIT
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("medium");
                    onStartLiveWorkout(routine.id);
                  }}
                  className="min-h-[44px] bg-[#30D158] text-black text-xs font-bold py-2 rounded-full hover:opacity-90 active:scale-95 transition-all cursor-pointer text-center shadow-[0_4px_14px_rgba(48,209,88,0.3)]"
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
