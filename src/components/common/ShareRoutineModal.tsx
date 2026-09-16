import React, { useState, useEffect, useMemo } from "react";
import { X, Copy } from "lucide-react";
import QRCode from "qrcode";
import { isTimedExercise } from "../../lib/workoutUtils";
import { showToast } from "../../lib/toast";
import type { RoutineData } from "../../types/workout";

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-routine-title" className="bg-surface-container border border-surface-variant rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 gap-4 animate-in fade-in zoom-in duration-200" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-surface-variant/30 pb-3">
          <h3 id="share-routine-title" className="font-bold text-lg text-primary uppercase tracking-wide">Share Routine</h3>
          <button onClick={onClose} aria-label="Close share dialog" className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-variant hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-on-surface-variant text-center">
          Let your training partner scan this code to import <strong>{routine.name}</strong> offline.
        </p>
        <div className="flex justify-center bg-white p-3 rounded-xl mx-auto shadow-inner">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Routine QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-surface-variant animate-pulse rounded-lg flex items-center justify-center text-xs">
              Generating QR...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 py-3 border border-surface-variant text-on-surface-variant rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Code
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-primary-fixed text-[#000000] rounded-lg font-bold text-xs uppercase tracking-wide hover:opacity-90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
