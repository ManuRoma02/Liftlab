import React, { useDeferredValue, useState, useEffect, useMemo } from "react";
import { Database, Plus, Search, ChevronDown, ChevronRight, X, Filter, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TabHero } from "./common/TabHero";
import { ExerciseMuscleVisual } from "./common/ExerciseMuscleVisual";
import { ExerciseMedia } from "./common/ExerciseMedia";
import { getExerciseSearchScore } from "../lib/searchUtils";
import type { ExerciseData } from "../types/workout";
import { triggerHaptic } from "../lib/haptics";
import { appleSpringDefault, CARTOON_SPRINGS } from "../lib/motion";

export function Library({
  t,
  unit,
  exercises,
  onAddExercise,
  onOpenDetail,
  onOpenSettings,
  isCatalogLoading = false,
  isOpen = true,
}: {
  t: any;
  unit: string;
  exercises: ExerciseData[];
  onAddExercise: () => void;
  onOpenDetail: (ex: ExerciseData) => void;
  onOpenSettings: () => void;
  isCatalogLoading?: boolean;
  isOpen?: boolean;
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState("All");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Auto-reset search query, selected category, and selected muscle filters whenever opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setFilter("All");
      setSelectedMuscle("All");
      setIsFilterOpen(false);
    }
  }, [isOpen]);

  const safeExercises = exercises || [];
  const isSearching = deferredSearch.trim().length > 0 || filter !== "All" || selectedMuscle !== "All";

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: safeExercises.length };
    for (const ex of safeExercises) {
      const cat = ex.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [safeExercises]);

  const availableCategories = useMemo(() => {
    const defaultOrder = [
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
    const extras = Object.keys(categoryCounts).filter(
      (cat) => !defaultOrder.includes(cat) && cat !== "All"
    );
    return [...defaultOrder, ...extras];
  }, [categoryCounts]);

  const featuredTitles = [
    "Barbell Bench Press",
    "Barbell Full Squat",
    "Barbell Deadlift",
    "Dumbbell Incline Bench Press",
    "Barbell Bent Over Row",
    "Dumbbell Seated Shoulder Press",
    "Pull-up",
    "Barbell Romanian Deadlift",
    "Dumbbell Lunge",
    "Barbell Curl",
    "Cable Triceps Pushdown (v-bar)",
    "Weighted Front Plank",
  ];

  const filteredExercises = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const hasQuery = query.length > 0;

    const results: { ex: ExerciseData; score: number }[] = [];

    for (let i = 0; i < safeExercises.length; i++) {
      const ex = safeExercises[i];

      if (filter !== "All" && ex.category !== filter) {
        continue;
      }

      if (selectedMuscle !== "All") {
        const matchesMuscle =
          ex.category === selectedMuscle ||
          (ex.muscleFocus && ex.muscleFocus.includes(selectedMuscle));
        if (!matchesMuscle) continue;
      }

      let score = 0;
      if (hasQuery) {
        score = getExerciseSearchScore(query, ex, t);
        if (score <= 0) continue;
      }

      results.push({ ex, score });
    }

    if (hasQuery) {
      results.sort(
        (a, b) =>
          b.score - a.score ||
          String(a.ex.title).localeCompare(String(b.ex.title))
      );
    }

    return results.map(({ ex }) => ex);
  }, [deferredSearch, filter, selectedMuscle, safeExercises, t]);

  const featuredExercises = useMemo(() => {
    const exercisesByTitle = new Map(
      safeExercises.map((exercise) => [(exercise.title || "").trim().toLowerCase(), exercise]),
    );
    return featuredTitles
      .map((title) => exercisesByTitle.get(title.toLowerCase()))
      .filter((exercise): exercise is ExerciseData => Boolean(exercise));
  }, [safeExercises]);

  const resultLimit = 60;
  const displayedExercises = isSearching
    ? filteredExercises.slice(0, resultLimit)
    : featuredExercises;

  useEffect(() => {
    const handleBack = (event: Event) => {
      if (search || filter !== "All" || selectedMuscle !== "All") {
        event.preventDefault();
        setSearch("");
        setFilter("All");
        setSelectedMuscle("All");
      }
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [search, filter, selectedMuscle]);

  return (
    <main className="px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col w-full max-w-[1280px] mx-auto gap-stack-lg relative">
      <TabHero

        title={t("library")}
        subtitle={isCatalogLoading ? (t("loading_catalog") || "Caricamento catalogo...") : (t("exercises_stored_offline") || "{count} esercizi disponibili offline").replace("{count}", String(safeExercises.length))}
        icon={<Database className="w-7 h-7" />}
        onOpenSettings={onOpenSettings}
        metric={
          <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
            {isSearching ? (t("found_badge") || "{count} trovati").replace("{count}", String(filteredExercises.length)) : (t("featured_badge") || "In evidenza")}
          </span>
        }
        action={
          <div className="flex items-center justify-between w-full gap-2 relative">
            {/* Category Selectable Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setIsFilterOpen((prev) => !prev);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  filter !== "All"
                    ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
                    : "bg-white/6 hover:bg-white/12 border-white/10 text-white"
                }`}
                aria-haspopup="listbox"
                aria-expanded={isFilterOpen}
              >
                <Filter className="w-3.5 h-3.5 text-[#30D158]" />
                <span>{filter === "All" ? (t("all") || "Tutti") : (t(filter.toLowerCase()) || filter)}</span>
                <span className="text-[10px] tabular-nums bg-white/10 px-1.5 py-0.5 rounded-full font-mono text-[#8E8E93]">
                  {categoryCounts[filter] ?? safeExercises.length}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div
                    role="listbox"
                    aria-label="Filter exercises by category"
                    className="absolute left-0 top-full mt-2 w-56 sm:w-64 bg-[#24252c] border border-white/16 rounded-2xl p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl z-50 max-h-72 overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
                  >
                    {availableCategories.map((cat) => {
                      const isSelected = filter.toLowerCase() === cat.toLowerCase();
                      const count = categoryCounts[cat];
                      return (
                        <button
                          key={cat}
                          role="option"
                          aria-selected={isSelected}
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            setFilter(cat);
                            setSelectedMuscle("All");
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                            isSelected
                              ? "bg-[#30D158] text-black font-extrabold shadow-[0_2px_8px_rgba(48,209,88,0.25)]"
                              : "text-white/90 hover:bg-white/8 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 shrink-0 text-black stroke-[3]" />
                            ) : (
                              <span className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">{cat === "All" ? (t("all") || "Tutti") : (t(cat.toLowerCase()) || cat)}</span>
                          </div>
                          {count !== undefined && (
                            <span
                              className={`ml-2 text-[10px] tabular-nums px-2 py-0.5 rounded-full shrink-0 font-mono ${
                                isSelected ? "bg-black/20 text-black font-extrabold" : "bg-white/10 text-[#8E8E93]"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <motion.button
              data-testid="library-add-exercise-btn"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              transition={CARTOON_SPRINGS.bouncy}
              onClick={() => {
                triggerHaptic("light");
                onAddExercise();
              }}
              className="bg-[#30D158] text-black text-xs font-extrabold px-4 py-2.5 rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(48,209,88,0.25)] ml-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
              <span>{t("add_exercise")}</span>
            </motion.button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="relative w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#30D158] transition-colors" />
        <input
          data-testid="library-search-input"
          className="w-full bg-[#18191e] border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:border-[#30D158]/50 focus:outline-none transition-all placeholder:text-[#8E8E93]"
          placeholder={t("search") || "Cerca esercizi..."}
          aria-label={t("search") || "Cerca esercizi"}
          type="text"
          autoComplete="off"
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (val === "") {
              setFilter("All");
              setSelectedMuscle("All");
            }
          }}
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setSearch("");
              setFilter("All");
              setSelectedMuscle("All");
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            aria-label={t("clear_search") || "Azzera ricerca"}
          >
            <div className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </div>
          </button>
        )}
      </div>

      {/* Header and Results Count */}
      <div className="w-full flex items-center justify-between px-1">
        <h3 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-[0.06em]">
          {isSearching ? t("all_exercises") : t("featured_exercises")}
          {isSearching && (
            <span className="ml-2 text-xs font-semibold text-[#30D158]">
              ({filteredExercises.length})
            </span>
          )}
        </h3>
        {(filter !== "All" || selectedMuscle !== "All" || search.length > 0) && (
          <button
            onClick={() => {
              triggerHaptic("light");
              setFilter("All");
              setSelectedMuscle("All");
              setSearch("");
            }}
            className="text-xs text-[#30D158] hover:underline font-semibold"
          >
            {t("clear_filters") || "Azzera filtri"}
          </button>
        )}
      </div>

      {/* Exercise Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        aria-busy={search !== deferredSearch || isCatalogLoading}
      >
        {isCatalogLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="w-full text-left apple-glass-card rounded-3xl overflow-hidden flex shadow-sm animate-pulse border border-white/5 bg-[#1C1C1E]/60 p-3"
            >
              <div className="w-24 h-24 rounded-2xl bg-white/6 shrink-0" />
              <div className="p-3 flex flex-col justify-center flex-grow min-w-0 gap-2.5">
                <div className="h-4 bg-white/10 rounded-md w-3/4" />
                <div className="h-3 bg-white/5 rounded-md w-1/2" />
                <div className="h-3 bg-white/5 rounded-full w-16 mt-1" />
              </div>
            </div>
          ))
        ) : (
          displayedExercises.map((ex) => (
          <motion.button
            type="button"
            key={ex.id}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            transition={CARTOON_SPRINGS.bouncy}
            onClick={() => {
              triggerHaptic("light");
              onOpenDetail(ex);
            }}
            className="w-full text-left apple-glass-card rounded-3xl overflow-hidden flex hover:border-white/20 transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex-shrink-0">
              <ExerciseMedia exercise={ex} className="w-24 h-24" />
            </div>
            <div className="p-3 sm:p-4 flex flex-col justify-center flex-grow truncate min-w-0">
              <h3 className="text-sm font-bold text-white truncate tracking-tight">
                {t(ex.title)}
              </h3>
              <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
                {ex.category} • {ex.type}
              </p>
              {ex.equipment && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/10 text-[#8E8E93] tracking-wider uppercase truncate">
                    {ex.equipment}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 flex items-center justify-center border-l border-white/5 group-hover:border-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white transition-colors" />
            </div>
          </motion.button>
        )))}
        {isSearching && filteredExercises.length > resultLimit && (
          <p className="col-span-full text-center text-sm text-on-surface-variant" role="status">
            Showing the best {resultLimit} of {filteredExercises.length} matches. Refine your search for a shorter list.
          </p>
        )}
        {!isCatalogLoading && filteredExercises.length === 0 && (
          <div
            data-testid="library-empty-state"
            className="col-span-full flex flex-col items-center justify-center gap-4 py-16 px-6 border border-white/10 rounded-3xl bg-[#121418]/90 text-center shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#30D158] shadow-[0_0_24px_rgba(48,209,88,0.15)]">
              <Search className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <div className="max-w-sm">
              <h3 className="text-base font-bold text-white tracking-tight mb-1">
                {t("no_exercises_found") || "Nessun esercizio trovato"}
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed mb-6">
                {t("no_exercises_search_hint") || "Prova ad azzerare i filtri o crea un nuovo esercizio personalizzato."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                {isSearching && (
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setSearch("");
                      setFilter("All");
                      setSelectedMuscle("All");
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all text-xs font-semibold cursor-pointer border border-white/10"
                  >
                    {t("clear_filters") || "Azzera Filtri"}
                  </button>
                )}
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    onAddExercise();
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#30D158] text-black active:scale-95 transition-all text-xs font-bold shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>{t("add_custom_exercise") || "Nuovo Esercizio"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
