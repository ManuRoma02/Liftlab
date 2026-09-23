import React, { useDeferredValue, useState, useEffect, useMemo } from "react";
import { Database, Plus, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TabHero } from "./common/TabHero";
import { ExerciseMuscleVisual } from "./common/ExerciseMuscleVisual";
import { getExerciseSearchScore } from "../lib/searchUtils";
import type { ExerciseData } from "../types/workout";
import { triggerHaptic } from "../lib/haptics";

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
          <span className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider text-[#30D158] bg-[#30D158]/12 border border-[#30D158]/25 rounded-full px-3 py-1.5">
            {isSearching ? `${filteredExercises.length} found` : "Featured"}
          </span>
        }
        action={
          <button
            onClick={() => {
              triggerHaptic("light");
              onAddExercise();
            }}
            className="w-full bg-[#30D158] text-black font-bold px-4 py-3 rounded-full flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(48,209,88,0.3)] hover:opacity-90 transition-opacity active:scale-95 text-xs tracking-tight"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            {t("add_exercise")}
          </button>
        }
      />

      {/* Search Bar */}
      <div className="relative w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#30D158] transition-colors" />
        <input
          className="w-full bg-[#1C1C1E] border border-white/8 rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:border-[#30D158]/50 focus:outline-none transition-all placeholder:text-[#8E8E93]"
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
              triggerHaptic("light");
              setSearch("");
              setFilter("All");
              setSelectedMuscle("All");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isSearching && (
        <div className="bg-[#30D158]/10 border border-[#30D158]/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-8 h-8 rounded-full bg-[#30D158]/20 flex items-center justify-center text-[#30D158] flex-shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-[#30D158]">{t("search_tip")}</p>
        </div>
      )}

      {/* Category List */}
      <div className="w-full flex flex-col gap-2 relative z-20">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-[0.06em] px-1">
            {isSearching ? t("all_exercises") : t("featured_exercises")}
          </h3>
          <button
            onClick={() => {
              triggerHaptic("light");
              setIsFilterOpen(!isFilterOpen);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] border border-white/10 rounded-full text-xs font-bold text-white active:scale-95 transition-all shadow-sm"
          >
            {filter === "All" ? t("all") : t(filter.toLowerCase())}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
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
              className="absolute top-12 left-0 right-0 bg-[#1C1C1E] rounded-2xl border border-white/12 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-30 flex flex-col py-1"
            >
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setFilter("All");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-5 py-2.5 font-semibold text-xs transition-all hover:bg-white/8 ${
                  filter === "All" ? "text-[#30D158] font-bold" : "text-white"
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
                    triggerHaptic("light");
                    setFilter(cat);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-5 py-2.5 border-t border-white/5 font-semibold text-xs transition-all hover:bg-white/8 ${
                    filter === cat ? "text-[#30D158] font-bold" : "text-white"
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        aria-busy={search !== deferredSearch || isCatalogLoading}
      >
        {displayedExercises.map((ex) => (
          <button
            type="button"
            key={ex.id}
            onClick={() => {
              triggerHaptic("light");
              onOpenDetail(ex);
            }}
            className="w-full text-left bg-[#1C1C1E] border border-white/8 rounded-3xl overflow-hidden flex hover:border-white/18 active:scale-[0.98] transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex-shrink-0">
              <ExerciseMuscleVisual exercise={ex} className="w-24 h-24" />
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
