import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";

export function ImportRoutineModal({
  onImport,
  onClose,
  exercises,
}: {
  onImport: (text: string) => Promise<void> | void;
  onClose: () => void;
  exercises: any[];
}) {
  const [codeText, setCodeText] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handleBack = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("liftlab:back", handleBack);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("liftlab:back", handleBack);
    };
  }, [onClose]);

  const handleImport = async () => {
    const trimmed = codeText.trim();
    if (!trimmed || isImporting) return;
    setError("");
    setIsImporting(true);
    try {
      await onImport(trimmed);
      triggerHaptic("success");
      onClose();
    } catch (importError) {
      triggerHaptic("warning");
      setError(importError instanceof Error ? importError.message : "The routine code is not valid.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-routine-title"
        className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-white/8 pb-3">
          <h3 id="import-routine-title" className="font-bold text-base text-white tracking-tight">Import Routine</h3>
          <button
            type="button"
            aria-label="Close import dialog"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-[#8E8E93] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[#8E8E93]">
          Paste the shared routine code or JSON below:
        </p>
        <textarea
          value={codeText}
          onChange={(e) => setCodeText(e.target.value)}
          placeholder='{"schema": "liftlab.routine.v1", ...}'
          aria-label="Routine code or JSON"
          aria-describedby={error ? "import-routine-error" : undefined}
          className="w-full h-32 p-3.5 bg-black/40 border border-white/10 rounded-2xl text-xs font-mono text-white focus:border-[#30D158] outline-none resize-none transition-all placeholder:text-[#8E8E93]/60"
        />
        {error && <p id="import-routine-error" role="alert" className="text-xs text-[#FF453A] font-semibold">{error}</p>}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-full font-semibold text-xs transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!codeText.trim() || isImporting}
            className="flex-1 py-3 bg-[#30D158] text-black rounded-full font-bold text-xs hover:brightness-105 disabled:opacity-40 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            {isImporting ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
