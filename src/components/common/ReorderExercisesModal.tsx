import React, { useState, useEffect } from "react";
import { X, GripVertical, Check, ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import type { ExerciseData } from "../../types/workout";
import { triggerHaptic } from "../../lib/haptics";
import { APPLE_SPRINGS, CARTOON_SPRINGS } from "../../lib/motion";
import { useModalDismiss } from "../../lib/modalStack";
import { createPortal } from "react-dom";
import { useAndroidSwipeBack } from "../../lib/useAndroidSwipeBack";
import { ExerciseMedia } from "./ExerciseMedia";

export interface ReorderExercisesModalProps {
  isOpen: boolean;
  exercises: ExerciseData[];
  onClose: () => void;
  onApply: (reordered: ExerciseData[]) => void;
  t?: (key: string) => string;
}

export function ReorderExercisesModal({
  isOpen,
  exercises,
  onClose,
  onApply,
  t = (k: string) => k,
}: ReorderExercisesModalProps) {
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

  const [items, setItems] = useState<ExerciseData[]>(exercises);

  useEffect(() => {
    if (isOpen) {
      setItems(exercises);
    }
  }, [isOpen, exercises]);

  const handleNudge = (index: number, direction: "up" | "down") => {
    triggerHaptic("light");
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
    onApply(newItems);
  };

  const handleSave = () => {
    triggerHaptic("success");
    onApply(items);
    onClose();
  };

  const modalElement = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
        key="reorder-exercises-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ opacity: scrimOpacity }}
        className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reorder-exercises-title"
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
          className="bg-[#24252c] border border-white/16 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col will-change-transform transform-gpu select-none"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-[#24252c] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#30D158]/15 border border-[#30D158]/25 rounded-2xl flex items-center justify-center text-[#30D158] shrink-0">
                <ListOrdered className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 id="reorder-exercises-title" className="font-bold text-base text-white tracking-tight truncate">
                  {t("reorder_exercises") || "Riordina Esercizi"}
                </h3>
                <p className="text-xs text-[#8E8E93] truncate">
                  {t("reorder_exercises_subtitle") || "Tieni premuto e trascina per spostare"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              aria-label={t("close") || "Chiudi"}
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reorderable List */}
          <div className="p-3 sm:p-4 overflow-y-auto flex-1 overscroll-contain">
            {items.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8E8E93]">
                {t("no_exercises_in_routine") || "Nessun esercizio nella routine."}
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={items}
                onReorder={(newOrder) => {
                  triggerHaptic("selection");
                  setItems(newOrder);
                  onApply(newOrder);
                }}
                className="flex flex-col gap-2.5"
              >
                {items.map((ex, index) => {
                  const isFirst = index === 0;
                  const isLast = index === items.length - 1;

                  return (
                    <Reorder.Item
                      key={ex.id}
                      value={ex}
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.7), 0 0 15px rgba(48,209,88,0.3)",
                        borderColor: "rgba(48,209,88,0.6)",
                        zIndex: 50,
                      }}
                      onDragStart={() => triggerHaptic("medium")}
                      onDragEnd={() => triggerHaptic("light")}
                      className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors touch-none cursor-grab active:cursor-grabbing"
                    >
                      {/* Left: Drag Handle & Index & Thumbnail */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#8E8E93] shrink-0">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <span className="w-6 h-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/60 border border-white/8 shrink-0">
                          <ExerciseMedia exercise={ex} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-sm font-bold text-white truncate leading-tight">
                            {t(ex.title) || ex.title}
                          </span>
                          <span className="text-[10px] text-[#8E8E93] uppercase font-semibold tracking-wider truncate">
                            {ex.category || "General"} {ex.equipment ? `• ${ex.equipment}` : ""}
                            {ex.technique === "superset" && (
                              <span className="text-[#30D158] font-bold ml-1">• Superset</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick Nudge Steppers (Accessibility fallback) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNudge(index, "up");
                          }}
                          aria-label={`Sposta ${ex.title} su`}
                          className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 active:scale-90 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNudge(index, "down");
                          }}
                          aria-label={`Sposta ${ex.title} giù`}
                          className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 active:scale-90 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-white/10 bg-[#24252c] shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={CARTOON_SPRINGS.bouncy}
              onClick={handleSave}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-[#30D158] hover:brightness-105 active:scale-98 text-black font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(48,209,88,0.3)] transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t("save_order") || "Salva Ordine"}</span>
            </motion.button>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalElement, document.body) : modalElement;
}
