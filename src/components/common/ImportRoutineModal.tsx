import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

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
      onClose();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "The routine code is not valid.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="import-routine-title" className="bg-[#141618] border border-white/15 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col p-6 gap-4 animate-in fade-in zoom-in duration-200" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-surface-variant/30 pb-3">
          <h3 id="import-routine-title" className="font-bold text-lg text-primary uppercase tracking-wide">Import Routine</h3>
          <button type="button" aria-label="Close import dialog" onClick={onClose} className="min-w-11 min-h-11 p-1 text-on-surface-variant hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-on-surface-variant">
          Paste the shared routine code or JSON below:
        </p>
        <textarea
          value={codeText}
          onChange={(e) => setCodeText(e.target.value)}
          placeholder='{"schema": "liftlab.routine.v1", ...}'
          aria-label="Routine code or JSON"
          aria-describedby={error ? "import-routine-error" : undefined}
          className="w-full h-32 p-3 bg-surface border border-surface-variant rounded-lg text-xs font-mono text-on-background focus:border-primary-fixed outline-none resize-none transition-all"
        />
        {error && <p id="import-routine-error" role="alert" className="text-sm text-error">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-surface-variant text-on-surface-variant rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-surface-variant transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!codeText.trim() || isImporting}
            className="flex-1 py-3 bg-primary-fixed text-[#000000] rounded-lg font-bold text-xs uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isImporting ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
