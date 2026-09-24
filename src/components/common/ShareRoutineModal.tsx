import React, { useState, useEffect, useMemo } from "react";
import { X, Copy } from "lucide-react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import { isTimedExercise } from "../../lib/workoutUtils";
import { showToast } from "../../lib/toast";
import type { RoutineData } from "../../types/workout";
import { triggerHaptic } from "../../lib/haptics";
import { APPLE_SPRINGS } from "../../lib/motion";

export function ShareRoutineModal({
  routine,
  onClose,
}: {
  routine: RoutineData;
  onClose: () => void;
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const shareText = useMemo(() => {
    const payload = {
      schema: "liftlab.routine.v1",
      routine: {
        name: routine.name,
        duration: routine.duration,
        tags: routine.tags,
        scheduledDay: routine.scheduledDay,
        exercises: routine.exercises.map((ex) => ({
          title: ex.title,
          category: ex.category,
          type: ex.type,
          notes: ex.notes,
          restTimer: ex.restTimer,
          sets: ex.sets.map((s) => {
            const setPayload: any = {};
            if (s.weight !== "") setPayload.weight = s.weight;
            if (s.reps !== "") {
              if (isTimedExercise(ex)) {
                setPayload.seconds = s.reps;
              } else {
                setPayload.reps = s.reps;
              }
            }
            if (s.technique) setPayload.technique = s.technique;
            return setPayload;
          }),
        })),
      },
    };
    return JSON.stringify(payload);
  }, [routine]);

  useEffect(() => {
    QRCode.toDataURL(shareText, { margin: 2, width: 300 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code error:", err));
  }, [shareText]);

  const handleCopyText = async () => {
    try {
      triggerHaptic("light");
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const field = document.createElement("textarea");
        field.value = shareText;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Copy command was rejected");
      }
      showToast("Routine code copied to clipboard.", "success");
    } catch {
      showToast("Clipboard access failed. Please try again.", "error");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[300] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-routine-title"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={APPLE_SPRINGS.criticallyDamped}
          className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 gap-4"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b border-white/8 pb-3">
            <h3 id="share-routine-title" className="font-bold text-base text-white tracking-tight">Share Routine</h3>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              aria-label="Close share dialog"
              className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#8E8E93] text-center">
            Let your training partner scan this code to import <strong className="text-white">{routine.name}</strong> offline.
          </p>
          <div className="flex justify-center bg-white p-3.5 rounded-2xl mx-auto shadow-md">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Routine QR Code" className="w-48 h-48 rounded-lg" />
            ) : (
              <div className="w-48 h-48 bg-zinc-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-zinc-400">
                Generating QR...
              </div>
            )}
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleCopyText}
              className="flex-1 min-h-[44px] py-3 bg-white/10 hover:bg-white/15 text-white rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="flex-1 min-h-[44px] py-3 bg-[#30D158] text-black rounded-full font-bold text-xs hover:brightness-105 transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
