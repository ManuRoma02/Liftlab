import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Check,
  CheckSquare,
  Share2,
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
  Play,
  Pencil,
  ChevronRight,
  ArrowUpDown,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { TabHero } from "./common/TabHero";
import { ConfirmModal } from "./common/ConfirmModal";
import { AppleBottomSheet } from "./common/AppleBottomSheet";
import { ShareRoutineModal } from "./common/ShareRoutineModal";
import { shareRoutinesNative } from "../lib/routineSharing";
import { getExerciseSearchScore } from "../lib/searchUtils";
import { getLogDate } from "../lib/workoutUtils";
import type { RoutineData } from "../types/workout";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../lib/haptics";
import { CARTOON_SPRINGS, CARTOON_KEYFRAMES, appleSpringDefault } from "../lib/motion";

function formatRelativeDays(timestamp: number, t: (k: string) => string): string {
  const now = Date.now();
  const diffDays = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("done_today") || "Svolta oggi";
  if (diffDays === 1) return t("done_yesterday") || "Svolta ieri";
  if (diffDays < 7) return `${diffDays} ${t("days_ago") || "giorni fa"}`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return t("done_one_week_ago") || "1 sett. fa";
  return `${diffWeeks} ${t("weeks_ago") || "sett. fa"}`;
}

type RoutineSortOption = "today" | "recent" | "favorites" | "alpha" | "duration";

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
  workoutLogs = [],
}: {
  workoutLogs?: any[];
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
  const [sortBy, setSortBy] = useState<RoutineSortOption>(() => {
    try {
      return (localStorage.getItem("liftlab_routines_sort") as RoutineSortOption) || "today";
    } catch {
      return "today";
    }
  });

  const handleSortChange = (newSort: RoutineSortOption) => {
    triggerHaptic("selection");
    setSortBy(newSort);
    try {
      localStorage.setItem("liftlab_routines_sort", newSort);
    } catch {}
  };

  const lastDoneMap = useMemo(() => {
    const map = new Map<string, number>();
    (workoutLogs || []).forEach((log) => {
      if (!log || !log.date) return;
      const time = getLogDate(log).getTime();
      if (log.routineId) {
        const existing = map.get(log.routineId) || 0;
        if (time > existing) map.set(log.routineId, time);
      }
      if (log.routineName) {
        const key = log.routineName.trim().toLowerCase();
        const existing = map.get(key) || 0;
        if (time > existing) map.set(key, time);
      }
      if (log.name) {
        const key = log.name.trim().toLowerCase();
        const existing = map.get(key) || 0;
        if (time > existing) map.set(key, time);
      }
    });
    return map;
  }, [workoutLogs]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  // Multi-selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<Set<string>>(new Set());
  const [sharingRoutinesList, setSharingRoutinesList] = useState<RoutineData[] | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Long-press detection refs
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);

  const toggleRoutineSelection = (id: string) => {
    triggerHaptic("selection");
    setSelectedRoutineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    triggerHaptic("light");
    if (selectedRoutineIds.size === filteredRoutines.length) {
      setSelectedRoutineIds(new Set());
    } else {
      setSelectedRoutineIds(new Set(filteredRoutines.map((r) => r.id)));
    }
  };

  const handleShareSelected = async () => {
    const selected = routines.filter((r) => selectedRoutineIds.has(r.id));
    if (selected.length === 0) return;
    const { success, fallbackNeeded } = await shareRoutinesNative(selected, t);
    if (!success && fallbackNeeded) {
      setSharingRoutinesList(selected);
    }
  };

  const handleConfirmBulkDelete = () => {
    triggerHaptic("warning");
    selectedRoutineIds.forEach((id) => onDeleteRoutine(id));
    setIsBulkDeleteConfirmOpen(false);
    setIsSelectionMode(false);
    setSelectedRoutineIds(new Set());
  };

  const handleTouchStart = (routineId: string, e: React.TouchEvent) => {
    if (isSelectionMode) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      triggerHaptic("medium");
      setIsSelectionMode(true);
      setSelectedRoutineIds(new Set([routineId]));
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (routineId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSelectionMode) {
      triggerHaptic("medium");
      setIsSelectionMode(true);
      setSelectedRoutineIds(new Set([routineId]));
    }
  };
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleBack = (event: Event) => {
      if (sharingRoutinesList) {
        event.preventDefault();
        setSharingRoutinesList(null);
        return;
      }
      if (isBulkDeleteConfirmOpen) {
        event.preventDefault();
        setIsBulkDeleteConfirmOpen(false);
        return;
      }
      if (isSelectionMode) {
        event.preventDefault();
        setIsSelectionMode(false);
        setSelectedRoutineIds(new Set());
        return;
      }
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

  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a, b) => {
      const aToday = a.scheduledDay != null && Number(a.scheduledDay) === todayIndex ? 1 : 0;
      const bToday = b.scheduledDay != null && Number(b.scheduledDay) === todayIndex ? 1 : 0;

      if (sortBy === "today") {
        if (aToday !== bToday) return bToday - aToday;
        if (Boolean(b.favorite) !== Boolean(a.favorite)) return Number(!!b.favorite) - Number(!!a.favorite);
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "recent") {
        const aTime = lastDoneMap.get(a.id) || lastDoneMap.get((a.name || "").trim().toLowerCase()) || 0;
        const bTime = lastDoneMap.get(b.id) || lastDoneMap.get((b.name || "").trim().toLowerCase()) || 0;
        if (aTime !== bTime) return bTime - aTime;
        if (aToday !== bToday) return bToday - aToday;
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "favorites") {
        if (Boolean(b.favorite) !== Boolean(a.favorite)) return Number(!!b.favorite) - Number(!!a.favorite);
        if (aToday !== bToday) return bToday - aToday;
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "alpha") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "duration") {
        return (Number(a.duration) || 0) - (Number(b.duration) || 0);
      }

      return 0;
    });
  }, [routines, todayIndex, sortBy, lastDoneMap]);

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
    <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pb-6 flex flex-col gap-stack-lg w-full">
      <TabHero

        title={t("workout")}
        subtitle={routines.length > 0 ? t("select_program") : (t("no_routines_subtitle") || "Crea la tua prima scheda per iniziare ad allenarti.")}
        icon={<Dumbbell className="w-7 h-7" />}
        onOpenSettings={() => navigateTo("settings")}
        metric={
          <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
            {routinesToday > 0 ? `${routinesToday} ${t("today")?.toLowerCase() || "oggi"}` : `${routines.length} ${t("routines")?.toLowerCase() || "schede"}`}
          </span>
        }
        action={
          <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-end relative flex-nowrap overflow-x-hidden">
            <motion.button
              data-testid="start-freestyle-workout-btn"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("medium");
                onStartLiveWorkout("empty");
              }}
              className="bg-[#30D158] text-black text-[11px] sm:text-xs font-bold h-10 px-2.5 sm:px-4 rounded-full hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-[0_2px_12px_rgba(48,209,88,0.25)] shrink min-w-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
              <span className="truncate whitespace-nowrap">{t("start_empty") || "Allenamento Libero"}</span>
            </motion.button>
            <motion.button
              data-testid="create-routine-btn"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("light");
                onCreate();
              }}
              className="bg-white/8 text-white border border-white/10 text-[11px] sm:text-xs font-semibold h-10 px-2 sm:px-3.5 rounded-full hover:bg-white/12 active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shrink min-w-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-[#8E8E93]" strokeWidth={2} />
              <span className="truncate whitespace-nowrap">{t("create_new") || "Nuova Scheda"}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("light");
                setIsSelectionMode((prev) => {
                  if (prev) setSelectedRoutineIds(new Set());
                  return !prev;
                });
              }}
              aria-pressed={isSelectionMode}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isSelectionMode
                  ? "bg-[#30D158] text-black border-[#30D158] shadow-[0_0_12px_rgba(48,209,88,0.4)]"
                  : "bg-white/6 hover:bg-white/10 border-white/10 text-[#8E8E93] hover:text-white"
              }`}
              title={isSelectionMode ? "Fine selezione" : "Seleziona schede"}
            >
              <CheckSquare className="w-4 h-4" strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("light");
                setIsImportMenuOpen(true);
              }}
              aria-expanded={isImportMenuOpen}
              aria-haspopup="dialog"
              className="w-10 h-10 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title={t("upload_routine_file") || "Import"}
            >
              <Upload className="w-4 h-4" strokeWidth={2} />
            </motion.button>
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
      {routines.length > 1 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#30D158] transition-colors" />
            <input
              type="text"
              value={routineSearch}
              onChange={(e) => setRoutineSearch(e.target.value)}
              placeholder={t("search") || "Cerca schede o esercizi..."}
              aria-label={t("search") || "Cerca schede o esercizi"}
              className="w-full bg-[#18191e] border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:border-[#30D158]/50 focus:outline-none transition-all placeholder:text-[#8E8E93]"
            />
            {routineSearch.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setRoutineSearch("");
                }}
                aria-label={t("clear_search") || "Azzera ricerca"}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </div>
              </button>
            )}
          </div>

          {/* Sort Selector Dropdown (Tendina) */}
          <div className="relative group shrink-0">
            <div className="flex items-center justify-between gap-2 px-3.5 py-3 bg-[#18191e] border border-white/10 rounded-2xl text-xs font-bold text-white shadow-sm pointer-events-none group-focus-within:border-[#30D158] transition-all">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#30D158]" />
                <span className="truncate max-w-[140px] sm:max-w-none">
                  {sortBy === "today"
                    ? (t("sort_today") || "In programma oggi")
                    : sortBy === "recent"
                    ? (t("sort_recent") || "Più recenti svolte")
                    : sortBy === "favorites"
                    ? (t("sort_favorites") || "Preferite prima")
                    : sortBy === "alpha"
                    ? (t("sort_alpha") || "Alfabetico (A - Z)")
                    : (t("sort_duration") || "Durata stimata")}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#8E8E93] shrink-0" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as RoutineSortOption)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-10"
              aria-label={t("sort_routines") || "Ordina schede"}
            >
              <option value="today" className="bg-[#1C1C1E] text-white py-1">
                📅 {t("sort_today") || "In programma oggi"}
              </option>
              <option value="recent" className="bg-[#1C1C1E] text-white py-1">
                ⏱ {t("sort_recent") || "Più recenti svolte"}
              </option>
              <option value="favorites" className="bg-[#1C1C1E] text-white py-1">
                ⭐ {t("sort_favorites") || "Preferite prima"}
              </option>
              <option value="alpha" className="bg-[#1C1C1E] text-white py-1">
                🔤 {t("sort_alpha") || "Alfabetico (A - Z)"}
              </option>
              <option value="duration" className="bg-[#1C1C1E] text-white py-1">
                ⏳ {t("sort_duration") || "Durata stimata"}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Routine library */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 overflow-visible">
        {routines.length === 0 ? (
          <div
            data-testid="workout-empty-state"
            className="md:col-span-3 flex flex-col items-center justify-center gap-6 py-20 px-6 border border-white/10 rounded-3xl bg-[#121418]/90 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
          >
            <div className="w-16 h-16 bg-[#30D158]/12 border border-[#30D158]/25 rounded-2xl flex items-center justify-center text-[#30D158] shadow-[0_0_28px_rgba(48,209,88,0.2)]">
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
          <div
            data-testid="workout-search-empty-state"
            className="md:col-span-3 flex flex-col items-center justify-center gap-4 py-16 px-6 border border-white/10 rounded-3xl bg-[#121418]/90 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
              <Search className="w-7 h-7" />
            </div>
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
          filteredRoutines.map((routine) => {
            const isMenuActive = activeMenuId === routine.id;
            const isToday = routine.scheduledDay != null && Number(routine.scheduledDay) === todayIndex;
            const lastDoneTime = lastDoneMap.get(routine.id) || lastDoneMap.get((routine.name || "").trim().toLowerCase()) || 0;
            const isSelected = selectedRoutineIds.has(routine.id);

            return (
              <motion.article
                key={routine.id}
                whileHover={isSelectionMode ? undefined : { scale: 1.01 }}
                transition={appleSpringDefault}
                onTouchStart={(e) => handleTouchStart(routine.id, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(routine.id, e)}
                onClick={() => {
                  if (longPressTriggeredRef.current) {
                    longPressTriggeredRef.current = false;
                    return;
                  }
                  if (isSelectionMode) {
                    toggleRoutineSelection(routine.id);
                  }
                }}
                className={`rounded-3xl flex flex-col justify-between p-5 transition-all duration-200 relative group select-none ${
                  isSelectionMode
                    ? isSelected
                      ? "border-2 border-[#30D158] bg-[#30D158]/10 ring-2 ring-[#30D158]/30 shadow-[0_8px_32px_rgba(48,209,88,0.25)] cursor-pointer"
                      : "apple-glass-card hover:border-white/30 cursor-pointer"
                    : isToday
                    ? "border-2 border-[#30D158] ring-1 ring-[#30D158]/60 shadow-[0_8px_32px_rgba(48,209,88,0.25)] bg-gradient-to-br from-[#1b261e]/95 via-[#15171a]/98 to-[#111214]"
                    : "apple-glass-card hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                } ${isMenuActive ? "z-40" : "z-10"} ${
                  activeRoutineId === routine.id && !isSelectionMode ? "ring-2 ring-[#30D158]" : ""
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
                        isToday ? (
                          <span className="bg-[#30D158] text-black border border-[#30D158] rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse shrink-0" />
                            {t("today") || "OGGI"} • {scheduleLabels[Number(routine.scheduledDay)].toUpperCase()}
                          </span>
                        ) : (
                          <span className="bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase shrink-0">
                            {scheduleLabels[Number(routine.scheduledDay)].toUpperCase()}
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] font-medium flex-wrap">
                      <span>{routine.duration} min</span>
                      <span className="text-white/20">•</span>
                      <span>
                        {Number(routine.exercises?.length ?? 0) === 1
                          ? (t("one_exercise") || "1 exercise")
                          : `${routine.exercises?.length ?? 0} ${t("exercises") || "exercises"}`}
                      </span>
                      {lastDoneTime > 0 && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="text-emerald-400 font-semibold">
                            {formatRelativeDays(lastDoneTime, t)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Options Menu & Favorite OR Selection Checkbox */}
                  {isSelectionMode ? (
                    <div className="flex items-center shrink-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#30D158] border-2 border-[#30D158] text-black shadow-[0_0_12px_rgba(48,209,88,0.5)] scale-105"
                            : "border-2 border-white/25 bg-black/40 text-transparent hover:border-white/40"
                        }`}
                      >
                        <Check className={`w-4 h-4 stroke-[3] transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} />
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-0.5 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.72, rotate: 20 }}
                        animate={routine.favorite ? { scale: [0.8, 1.35, 0.95, 1], rotate: [0, -12, 12, 0] } : { scale: 1, rotate: 0 }}
                        transition={routine.favorite ? CARTOON_KEYFRAMES.wobble : appleSpringDefault}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic("light");
                          onToggleFavoriteRoutine(routine.id);
                        }}
                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                          routine.favorite
                            ? "text-[#30D158] bg-[#30D158]/15"
                            : "text-[#8E8E93] hover:text-[#30D158] hover:bg-white/5"
                        }`}
                        aria-label={routine.favorite ? "Remove favorite" : "Favorite routine"}
                      >
                        <Star className="w-4 h-4" fill={routine.favorite ? "currentColor" : "none"} />
                      </motion.button>
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

                      {isMenuActive && (
                        <>
                          <div
                            className="fixed inset-0 z-[999]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-[#24252c] border border-white/16 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl z-[1000] overflow-hidden py-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic("light");
                                duplicateRoutine(routine);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-white hover:bg-white/8 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Copy className="w-4 h-4 text-white/70" />
                              <span>{t("duplicate") || "Duplica"}</span>
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
                              <span>{t("share_qr_code") || "Condividi Scheda"}</span>
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
                              <span>{t("delete") || "Elimina"}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons OR Selection Row */}
              {isSelectionMode ? (
                <div className="flex items-center justify-between text-xs font-semibold mt-4 pt-3 border-t border-white/5 select-none">
                  <span className={isSelected ? "text-[#30D158] font-bold" : "text-[#8E8E93]"}>
                    {isSelected ? "Scheda selezionata" : "Tocca per selezionare"}
                  </span>
                  <span className="text-[11px] text-[#8E8E93]/70">
                    {routine.exercises?.length || 0} es. &bull; {routine.duration || 60}m
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                  <motion.button
                    whileTap={{ scale: 0.88, rotate: -2 }}
                    whileHover={{ scale: 1.03 }}
                    transition={CARTOON_SPRINGS.bouncy}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic("light");
                      onSelectRoutine(routine.id);
                      navigateTo("routine_editor");
                    }}
                    className="min-h-[44px] border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#8E8E93]" />
                    <span>{t("edit") || "Modifica"}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.88, rotate: -2 }}
                    whileHover={{ scale: 1.04 }}
                    transition={CARTOON_SPRINGS.bouncy}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic("medium");
                      onStartLiveWorkout(routine.id);
                    }}
                    className={`min-h-[44px] text-black text-xs font-bold py-2 rounded-full hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isToday
                        ? "bg-[#30D158] font-black shadow-[0_4px_18px_rgba(48,209,88,0.45)] scale-[1.02]"
                        : "bg-[#30D158] shadow-[0_4px_14px_rgba(48,209,88,0.25)]"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>{isToday ? (t("start_today_routine") || "Avvia Oggi") : (t("start") || "Inizia")}</span>
                  </motion.button>
                </div>
              )}
            </motion.article>
          );
        })
        )}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <ConfirmModal
          title="Elimina Schede"
          message={`Eliminare le ${selectedRoutineIds.size} schede selezionate?`}
          confirmLabel={`Elimina ${selectedRoutineIds.size} Schede`}
          cancelLabel={t("cancel") || "Annulla"}
          destructive
          onConfirm={handleConfirmBulkDelete}
          onCancel={() => setIsBulkDeleteConfirmOpen(false)}
        />
      )}

      {/* Multi-routine Share Modal */}
      {sharingRoutinesList && (
        <ShareRoutineModal
          routines={sharingRoutinesList}
          onClose={() => setSharingRoutinesList(null)}
          t={t}
        />
      )}

      {/* Floating Multi-Selection Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={appleSpringDefault}
            className="fixed bottom-0 left-0 right-0 z-[160] px-4 py-3 pointer-events-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
          >
            <div className="max-w-[640px] mx-auto bg-[#18181b]/95 backdrop-blur-2xl rounded-3xl p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2.5 border border-white/16 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_25px_rgba(48,209,88,0.15)]">
              {/* Left: Close & Count */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsSelectionMode(false);
                    setSelectedRoutineIds(new Set());
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                  title="Annulla selezione"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white">
                    {selectedRoutineIds.size === 0
                      ? "Nessuna selezionata"
                      : selectedRoutineIds.size === 1
                      ? "1 scheda"
                      : `${selectedRoutineIds.size} schede`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] text-[#30D158] hover:underline font-bold self-start cursor-pointer"
                  >
                    {selectedRoutineIds.size === filteredRoutines.length ? "Deseleziona tutte" : "Seleziona tutte"}
                  </button>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  disabled={selectedRoutineIds.size === 0}
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="h-10 px-3 sm:px-3.5 rounded-full bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-[#FF453A] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Elimina</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  disabled={selectedRoutineIds.size === 0}
                  onClick={handleShareSelected}
                  className="h-10 px-4 sm:px-5 rounded-full bg-[#30D158] hover:brightness-105 active:scale-95 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_12px_rgba(48,209,88,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Condividi ({selectedRoutineIds.size})</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {routineToDelete && (
        <ConfirmModal
          title={t("delete_routine_btn") || "Elimina Scheda"}
          message={`Eliminare "${routines.find(r => r.id === routineToDelete)?.name?.trim() || "questa scheda"}"?`}
          confirmLabel={t("delete_routine_btn") || "Elimina Scheda"}
          cancelLabel={t("cancel") || "Annulla"}
          destructive
          onConfirm={() => { onDeleteRoutine(routineToDelete); setRoutineToDelete(null); }}
          onCancel={() => setRoutineToDelete(null)}
        />
      )}

      {/* Apple HIG Action Sheet for Routine Import */}
      <AppleBottomSheet
        isOpen={isImportMenuOpen}
        onClose={() => setIsImportMenuOpen(false)}
        title={t("import_routine_title") || "Importa Scheda"}
        subtitle={t("import_routine_subtitle") || "Seleziona la modalità di importazione"}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-3 py-2 pb-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsImportMenuOpen(false);
              importInputRef.current?.click();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/6 hover:bg-white/10 active:scale-[0.98] transition-all text-left border border-white/8 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center text-[#30D158] shrink-0 shadow-sm">
              <Upload className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white group-hover:text-[#30D158] transition-colors">
                {t("upload_routine_file") || "Carica File Scheda"}
              </div>
              <div className="text-xs text-[#8E8E93] mt-0.5 truncate">
                {t("upload_routine_file_desc") || "Importa file .json esportato in precedenza"}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsImportMenuOpen(false);
              onOpenImportCode();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/6 hover:bg-white/10 active:scale-[0.98] transition-all text-left border border-white/8 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF] shrink-0 shadow-sm">
              <LinkIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white group-hover:text-[#0A84FF] transition-colors">
                {t("import_routine_code") || "Incolla Testo o Codice"}
              </div>
              <div className="text-xs text-[#8E8E93] mt-0.5 truncate">
                {t("import_routine_code_desc") || "Incolla testo formattato o codice JSON"}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsImportMenuOpen(false);
            }}
            className="w-full mt-2 min-h-[48px] rounded-2xl bg-white/8 hover:bg-white/12 active:scale-[0.98] transition-all text-white font-semibold text-sm flex items-center justify-center cursor-pointer"
          >
            {t("cancel") || "Annulla"}
          </button>
        </div>
      </AppleBottomSheet>
    </main>
  );
}
