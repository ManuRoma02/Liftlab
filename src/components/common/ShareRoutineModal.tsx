import React, { useState, useEffect, useMemo } from "react";
import { X, Copy, Download, Share2, Check, FileJson } from "lucide-react";
import QRCode from "qrcode";
import { motion } from "motion/react";
import type { RoutineData } from "../../types/workout";
import { triggerHaptic } from "../../lib/haptics";
import { APPLE_SPRINGS } from "../../lib/motion";
import { useModalDismiss } from "../../lib/modalStack";
import {
  buildRoutinesExportPayload,
  copyRoutinesJsonToClipboard,
  downloadRoutinesJson,
  shareRoutinesNative,
} from "../../lib/routineSharing";

export interface ShareRoutineModalProps {
  routine?: RoutineData;
  routines?: RoutineData[];
  onClose: () => void;
  t?: (key: string) => string;
}

export function ShareRoutineModal({
  routine,
  routines,
  onClose,
  t = (k: string) => k,
}: ShareRoutineModalProps) {
  useModalDismiss(true, onClose);

  const effectiveRoutines = useMemo(() => {
    if (routines && routines.length > 0) return routines;
    if (routine) return [routine];
    return [];
  }, [routine, routines]);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const exportPayload = useMemo(() => {
    return buildRoutinesExportPayload(effectiveRoutines);
  }, [effectiveRoutines]);

  const shareText = useMemo(() => {
    return JSON.stringify(exportPayload, null, 2);
  }, [exportPayload]);

  const isMultiple = effectiveRoutines.length > 1;
  const singleRoutine = effectiveRoutines[0];

  useEffect(() => {
    // Generate QR code only for single routine to keep matrix readable
    if (!isMultiple && singleRoutine) {
      QRCode.toDataURL(shareText, { margin: 2, width: 300 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [isMultiple, singleRoutine, shareText]);

  const handleCopy = async () => {
    const ok = await copyRoutinesJsonToClipboard(effectiveRoutines, t);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadRoutinesJson(effectiveRoutines);
  };

  const handleNativeShare = async () => {
    await shareRoutinesNative(effectiveRoutines, t);
  };

  if (effectiveRoutines.length === 0) return null;

  return (
    <motion.div
      key="share-routine-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4"
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
        className="bg-[#24252c] border border-white/16 rounded-3xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col p-6 gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/8 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 id="share-routine-title" className="font-bold text-base text-white tracking-tight">
                {isMultiple
                  ? `${effectiveRoutines.length} Schede Selezionate`
                  : (t("share_routine") || "Condividi Scheda")}
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                Note, pesi, ripetizioni e recuperi inclusi
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            aria-label="Close share dialog"
            className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected routines list or QR code */}
        {isMultiple ? (
          <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
              Schede incluse nel pacchetto:
            </div>
            <div className="flex flex-col gap-2">
              {effectiveRoutines.map((r) => (
                <div
                  key={r.id}
                  className="bg-black/40 border border-white/8 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-white truncate">{r.name}</h4>
                    <p className="text-xs text-[#8E8E93]">
                      {r.exercises?.length || 0} esercizi &bull; {r.duration || 60} min
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 shrink-0">
                    Pronta
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#8E8E93] text-center">
              {(t("scan_qr_desc") || "Inquadra questo QR code da un altro telefono per importare {name} offline.").replace("{name}", singleRoutine?.name || "la scheda")}
            </p>
            <div className="flex justify-center bg-white p-3.5 rounded-2xl mx-auto shadow-md">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Routine QR Code" className="w-44 h-44 rounded-lg" />
              ) : (
                <div className="w-44 h-44 bg-zinc-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-zinc-400">
                  {t("generating_qr") || "Generazione QR..."}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Primary Action: Native Share Sheet (WhatsApp, Telegram, etc.) */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full min-h-[44px] py-3 bg-[#30D158] text-black rounded-full font-bold text-xs hover:brightness-105 active:scale-95 transition-all shadow-[0_2px_14px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Condividi con altre app</span>
            </button>
          )}

          {/* Secondary Actions: Download JSON & Copy Code */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 min-h-[44px] py-2.5 px-3 bg-white/8 hover:bg-white/12 text-white rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#30D158]" />
              <span>Scarica JSON</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[44px] py-2.5 px-3 bg-white/8 hover:bg-white/12 text-white rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#30D158]" />
                  <span className="text-[#30D158]">Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white/80" />
                  <span>{t("copy_code") || "Copia Codice"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
