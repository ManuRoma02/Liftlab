import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import logoInAppImg from "../../assets/images/logo_in_app.png";
import { EQUIPMENT } from "../../types/workout";
import { fuzzyScore } from "../../lib/searchUtils";

export function AddExercise({
  t,
  unit,
  onBack,
  onSave,
  isOpen = true,
  exercises = [],
}: {
  t: any;
  unit: string;
  onBack: () => void;
  onSave: (ex: any) => void;
  isOpen?: boolean;
  exercises?: any[];
}) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [equipment, setEquipment] = useState("Dumbbell");
  const [notes, setNotes] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMuscle, setSelectedMuscle] = useState("All");

  // Auto-reset search query, category and muscle filters when opened / mounted
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedCategory("All");
      setSelectedMuscle("All");
      setName("");
      setMuscleGroup("Chest");
      setEquipment("Dumbbell");
      setNotes("");
    }
  }, [isOpen]);

  const muscleGroups = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
  const equipmentTypes = EQUIPMENT;

  // Memoized search and filter optimization for exercise search performance
  const filteredExercises = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasQuery = query.length > 0;

    const result: { ex: any; score: number }[] = [];

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];

      if (selectedCategory !== "All" && ex.category !== selectedCategory) {
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

      result.push({ ex, score });
    }

    if (hasQuery) {
      result.sort((a, b) => b.score - a.score || String(a.ex.title).localeCompare(String(b.ex.title)));
    }

    return result.map(({ ex }) => ex);
  }, [searchQuery, selectedCategory, selectedMuscle, exercises]);

  const handleSave = () => {
    if (!name) return;
    const newEx = {
      id: "e_custom_" + Date.now(),
      title: name,
      category: muscleGroup,
      type: "Custom",
      equipment: equipment,
      notes: notes,
      sets: [],
      muscleFocus: [muscleGroup],
      image:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200&h=200",
    };
    onSave(newEx);
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-md min-h-screen pb-20 selection:bg-primary-container selection:text-on-primary-container">
      {/* TopAppBar */}
      <header
        className="w-full top-0 sticky z-50 bg-surface/90 backdrop-blur-md border-b border-surface-variant flex items-center justify-between px-margin-mobile h-16"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center gap-stack-md">
          <button
            onClick={onBack}
            className="active:scale-95 transition-all text-primary-fixed p-2 hover:bg-surface-variant rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-xl uppercase text-primary-fixed tracking-tight">
            {t("add_exercise_upper")}
          </h1>
        </div>
        <div className="h-12 overflow-hidden opacity-20 hidden sm:block">
          <img
            src={logoInAppImg}
            alt="LIFTLAB"
            className="h-full w-auto object-contain"
          />
        </div>
      </header>

      <main className="px-margin-mobile pt-stack-lg max-w-2xl mx-auto space-y-stack-lg">
        {/* Exercise Name Input */}
        <section className="space-y-stack-sm">
          <label className="font-bold text-xs text-on-surface-variant uppercase tracking-widest ml-1">
            {t("exercise_name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container-low border border-surface-variant focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed rounded-2xl px-4 py-4 text-on-surface font-body-lg transition-all outline-none placeholder:text-on-surface-variant/30 min-h-[44px]"
            placeholder="e.g. Incline Bench Press"
            type="text"
          />
        </section>

        {/* Muscle Group Selection */}
        <section className="space-y-stack-md">
          <label className="font-bold text-xs text-on-surface-variant uppercase tracking-widest ml-1">
            {t("muscle_group")}
          </label>
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map((group) => (
              <button
                key={group}
                onClick={() => setMuscleGroup(group)}
                className={`px-5 py-2.5 rounded-full border font-bold text-sm transition-all active:scale-95 min-h-[44px] flex items-center justify-center ${
                  muscleGroup === group
                    ? "border-primary-fixed bg-primary-fixed text-[#000000]"
                    : "border-surface-variant text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {t(group.toLowerCase())}
              </button>
            ))}
          </div>
        </section>

        {/* Equipment Type Selection */}
        <section className="space-y-stack-md">
          <label className="font-bold text-xs text-on-surface-variant uppercase tracking-widest ml-1">
            {t("equipment_type")}
          </label>
          <div className="flex flex-wrap gap-2">
            {equipmentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setEquipment(type)}
                className={`px-5 py-2.5 rounded-full border font-bold text-sm transition-all active:scale-95 min-h-[44px] flex items-center justify-center ${
                  equipment === type
                    ? "border-primary-fixed bg-primary-fixed text-[#000000]"
                    : "border-surface-variant text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Technical Cues / Notes */}
        <section className="space-y-stack-sm">
          <label className="font-bold text-xs text-on-surface-variant uppercase tracking-widest ml-1">
            {t("notes_long")}
          </label>
          <div className="relative rounded-2xl overflow-hidden apple-glass-card">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface-container-low/70 border border-surface-variant focus:border-primary-fixed rounded-2xl focus:ring-0 px-4 py-4 text-on-surface font-body-md transition-all outline-none"
              placeholder="Retract scapula, keep elbows at 45 degrees..."
              rows={4}
            ></textarea>
          </div>
        </section>

        {/* Image Upload Placeholder */}
        <section className="apple-glass-card rounded-2xl border border-surface-variant p-8 flex flex-col items-center justify-center text-on-surface-variant cursor-pointer hover:bg-surface-variant/30 transition-all active:scale-[0.98] group">
          <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-container/10 group-hover:text-primary transition-colors">
            <Plus className="w-7 h-7" />
          </div>
          <span className="font-bold text-sm uppercase tracking-widest">
            Upload Demo Photo/Video
          </span>
          <p className="text-xs opacity-50 mt-1 lowercase">
            Support for MP4, JPG, PNG
          </p>
        </section>

        {/* Create Button */}
        <div className="pt-stack-lg">
          <button
            disabled={!name}
            onClick={handleSave}
            className={`w-full font-bold py-4 rounded-2xl uppercase tracking-tighter text-base min-h-[50px] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(48,209,88,0.2)] ${
              !name
                ? "opacity-40 bg-surface-variant text-on-surface-variant cursor-not-allowed"
                : "bg-primary-fixed text-[#000000] hover:shadow-[0_0_40px_rgba(48,209,88,0.3)]"
            }`}
          >
            {t("create_exercise_upper")}
          </button>
        </div>
      </main>
    </div>
  );
}
