import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { motion } from "motion/react";
import { EQUIPMENT } from "../../types/workout";
import { triggerHaptic } from "../../lib/haptics";

export function AddExercise({
  t,
  unit,
  onBack,
  onSave,
  isOpen = true,
  language = "it",
}: {
  t: (key: string) => string;
  unit: string;
  onBack: () => void;
  onSave: (ex: any) => void;
  isOpen?: boolean;
  language?: string;
  exercises?: any[];
}) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [equipment, setEquipment] = useState("Dumbbell");
  const [notes, setNotes] = useState("");

  // Auto-reset form fields when opened / mounted
  useEffect(() => {
    if (isOpen) {
      setName("");
      setMuscleGroup("Chest");
      setEquipment("Dumbbell");
      setNotes("");
    }
  }, [isOpen]);

  const muscleGroups = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
  const equipmentTypes = EQUIPMENT;

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newEx = {
      id: "e_custom_" + Date.now(),
      title: trimmedName,
      category: muscleGroup,
      type: "Custom",
      equipment: equipment,
      notes: notes.trim(),
      sets: [],
      muscleFocus: [muscleGroup],
      image:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200&h=200",
    };
    onSave(newEx);
  };

  return (
    <div className="bg-black text-white min-h-[100dvh] pb-24 flex flex-col font-sans antialiased">
      {/* iOS Top Navigation Bar with Safe Area Inset */}
      <header
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        className="sticky top-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 min-h-[calc(3.5rem+env(safe-area-inset-top,0px))]"
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            onBack();
          }}
          className="min-w-[44px] min-h-[44px] px-2 flex items-center gap-1 text-[#30D158] font-medium text-base hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer shrink-0"
          aria-label={t("cancel") || "Annulla"}
        >
          <ChevronLeft className="w-5 h-5 -ml-1.5" />
          <span>{t("cancel") || "Annulla"}</span>
        </button>

        <h1 className="font-bold text-base text-white truncate max-w-[200px] sm:max-w-md text-center px-2">
          {t("add_exercise_upper") || "Aggiungi Esercizio"}
        </h1>

        <button
          type="button"
          data-testid="add-exercise-header-save-btn"
          onClick={() => {
            if (!name.trim()) return;
            triggerHaptic("medium");
            handleSave();
          }}
          disabled={!name.trim()}
          className={`min-h-[36px] text-xs font-extrabold px-4 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
            name.trim()
              ? "bg-[#30D158] text-black shadow-sm hover:brightness-105 active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          <span>{t("save") || "Salva"}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Exercise Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] ml-3">
            {t("exercise_name") || "Nome Esercizio"}
          </label>
          <div className="bg-[#1C1C1E] border border-white/8 rounded-2xl p-1.5 focus-within:border-[#30D158]/50 transition-colors shadow-sm">
            <input
              data-testid="exercise-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-white text-base font-medium placeholder:text-[#8E8E93] focus:outline-none"
              placeholder={language === "it" ? "es. Panca Inclinata con Manubri" : "e.g. Incline Bench Press"}
              type="text"
            />
          </div>
        </div>

        {/* Muscle Group Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] ml-3">
            {t("muscle_group") || "Gruppo Muscolare"}
          </label>
          <div className="bg-[#1C1C1E] border border-white/8 rounded-2xl p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((group) => {
                const isSelected = muscleGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setMuscleGroup(group);
                    }}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer min-h-[38px] flex items-center justify-center ${
                      isSelected
                        ? "bg-[#30D158] text-black shadow-sm"
                        : "bg-white/6 text-[#8E8E93] hover:text-white border border-white/6"
                    }`}
                  >
                    {t(group.toLowerCase()) || group}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Equipment Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] ml-3">
            {t("equipment_type") || "Tipo di Attrezzatura"}
          </label>
          <div className="bg-[#1C1C1E] border border-white/8 rounded-2xl p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {equipmentTypes.map((type) => {
                const isSelected = equipment === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setEquipment(type);
                    }}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 cursor-pointer min-h-[38px] flex items-center justify-center ${
                      isSelected
                        ? "bg-[#30D158] text-black shadow-sm"
                        : "bg-white/6 text-[#8E8E93] hover:text-white border border-white/6"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Technical Cues / Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] ml-3">
            {t("notes_long") || "Suggerimenti Tecnici e Note"}
          </label>
          <div className="bg-[#1C1C1E] border border-white/8 rounded-2xl p-3.5 focus-within:border-[#30D158]/50 transition-colors shadow-sm">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-normal placeholder:text-[#8E8E93]/70 focus:outline-none resize-none leading-relaxed"
              placeholder={
                language === "it"
                  ? "es. Retrai le scapole, gomiti a 45 gradi, pausa 1 sec al petto..."
                  : "e.g. Retract scapula, keep elbows at 45 degrees, pause 1s at chest..."
              }
              rows={3}
            />
          </div>
        </div>

        {/* Primary Submit Button */}
        <div className="pt-2 pb-6">
          <motion.button
            data-testid="create-exercise-submit-btn"
            whileTap={{ scale: 0.98 }}
            disabled={!name.trim()}
            onClick={() => {
              if (!name.trim()) return;
              triggerHaptic("medium");
              handleSave();
            }}
            className={`w-full font-extrabold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(48,209,88,0.25)] ${
              !name.trim()
                ? "opacity-30 bg-[#1C1C1E] text-[#8E8E93] cursor-not-allowed border border-white/8 shadow-none"
                : "bg-[#30D158] text-black hover:opacity-95"
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t("create_exercise_upper") || "CREA ESERCIZIO"}</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
}
