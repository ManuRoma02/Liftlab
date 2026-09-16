import React, { useDeferredValue, useState, useEffect, useMemo } from "react";
import { Database, Plus, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TabHero } from "./common/TabHero";
import { ExerciseMuscleVisual } from "./common/ExerciseMuscleVisual";
import { fuzzyScore } from "../lib/searchUtils";
import type { ExerciseData } from "../types/workout";

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

  const featuredTitles = [
    "Barbell Bench Press",
    "Barbell Squat",
    "Barbell Deadlift",
    "Incline Dumbbell Press",
    "Bent Over Barbell Row",
    "Dumbbell Shoulder Press",
    "Pullups",
    "Romanian Deadlift",
    "Barbell Walking Lunge",
    "Barbell Curl",
    "Triceps Pushdown",
    "Plank",
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
        const haystack = `${ex.title ?? ""} ${ex.category ?? ""} ${ex.type ?? ""} ${ex.equipment ?? ""}`;
        score = fuzzyScore(query, haystack);
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
  }, [deferredSearch, filter, selectedMuscle, safeExercises]);

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
      if (!isFilterOpen) return;
      event.preventDefault();
      setIsFilterOpen(false);
    };
    window.addEventListener("liftlab:back", handleBack);
    return () => window.removeEventListener("liftlab:back", handleBack);
  }, [isFilterOpen]);

  return (
    <main className="px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col w-full max-w-[1280px] mx-auto gap-stack-lg relative">
      <TabHero
        eyebrow="Library"
        title={t("library")}
        subtitle={isCatalogLoading ? "Loading the offline exercise catalog..." : `${safeExercises.length} exercises stored locally`}
        icon={<Database className="w-7 h-7" />}
        onOpenSettings={onOpenSettings}
        metric={
          <span className="hidden sm:inline-flex text-xs font-black uppercase tracking-widest text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/20 rounded-full px-3 py-2">
            {isSearching ? `${filteredExercises.length} found` : "Featured"}
          </span>
        }
        action={
          <button
            onClick={onAddExercise}
            className="w-full bg-primary-container text-[#000000] text-label-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            {t("add_exercise")}
          </button>
        }
      />

      {/* Search Bar */}
      <div className="relative w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary-container transition-colors" />
        <input
          className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg pl-12 pr-10 py-3 text-body-md text-on-background focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all placeholder:text-on-surface-variant"
          placeholder="Search exercises..."
          aria-label="Search exercises"
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
              setSearch("");
              setFilter("All");
              setSelectedMuscle("All");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-on-surface-variant hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isSearching && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-primary">{t("search_tip")}</p>
        </div>
      )}

      {/* Category List */}
      <div className="w-full flex flex-col gap-2 relative z-20">
        <div className="flex items-center justify-between">
          <h3 className="text-label-bold text-on-surface-variant uppercase tracking-widest px-1">
            {isSearching ? t("all_exercises") : t("featured_exercises")}
          </h3>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-surface-variant rounded-full text-sm font-bold text-primary active:scale-95 transition-all"
          >
            {filter === "All" ? t("all") : t(filter.toLowerCase())}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 left-0 right-0 bg-surface-container-high rounded-xl border border-surface-variant overflow-hidden shadow-2xl z-30 flex flex-col"
            >
              <button
                onClick={() => {
                  setFilter("All");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-5 py-3 font-bold text-sm transition-all hover:bg-surface-variant ${
                  filter === "All" ? "text-primary" : "text-on-surface"
                }`}
              >
                {t("all")}
              </button>
              {[
                "Chest",
                "Back",
                "Legs",
                "Arms",
                "Core",
                "Shoulders",
                "Cardio",
                "Functional",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilter(cat);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 border-t border-surface-variant/50 font-bold text-sm transition-all hover:bg-surface-variant ${
                    filter === cat ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {t(cat.toLowerCase())}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercise Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg"
        aria-busy={search !== deferredSearch || isCatalogLoading}
      >
        {displayedExercises.map((ex) => (
          <button
            type="button"
            key={ex.id}
            onClick={() => onOpenDetail(ex)}
            className="w-full text-left bg-surface border border-surface-variant rounded-xl overflow-hidden flex hover:border-primary-fixed focus-visible:border-primary-fixed transition-colors group cursor-pointer"
          >
            <div className="flex-shrink-0">
              <ExerciseMuscleVisual exercise={ex} className="w-24 h-24" />
            </div>
            <div className="p-stack-md flex flex-col justify-center flex-grow truncate">
              <h3 className="text-label-bold text-primary truncate">
                {t(ex.title)}
              </h3>
              <p className="text-body-md text-on-surface-variant text-sm mt-1 truncate">
                {ex.category} • {ex.type}
              </p>
              {ex.equipment && (
                <div className="flex items-center gap-stack-sm mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-surface-variant text-on-surface-variant tracking-widest uppercase truncate">
                    {ex.equipment}
                  </span>
                </div>
              )}
            </div>
            <div className="p-stack-md flex items-center justify-center border-l border-surface-variant group-hover:border-primary-container transition-colors">
              <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary-container transition-colors" />
            </div>
          </button>
        ))}
        {isSearching && filteredExercises.length > resultLimit && (
          <p className="col-span-full text-center text-sm text-on-surface-variant" role="status">
            Showing the best {resultLimit} of {filteredExercises.length} matches. Refine your search for a shorter list.
          </p>
        )}
        {filteredExercises.length === 0 && (
          <div className="col-span-full py-12 text-center text-on-surface-variant text-body-lg">
            No exercises found matching your search.
          </div>
        )}
      </div>
    </main>
  );
}
