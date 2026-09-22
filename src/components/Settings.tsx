import React, { useRef } from "react";
import {
  ArrowLeft,
  SlidersHorizontal,
  Minus,
  Plus,
  Shield,
  Lock,
  ChevronRight,
  FileText,
  Database,
  Upload,
  RotateCcw,
  Trash2,
} from "lucide-react";
import logoInAppImg from "../assets/images/logo_in_app.png";

export function Settings({
  t,
  unit,
  setUnit,
  language,
  setLanguage,
  onBack,
  restTimer,
  setRestTimer,
  onExportData,
  onImportData,
  onRestoreBackup,
  onOpenPrivacy,
  onOpenTOS,
  showRpe,
  setShowRpe,
  oneRepMaxFormula = "epley",
  setOneRepMaxFormula,
  onDeleteAccount,
}: {
  t: any;
  unit: string;
  setUnit: any;
  language?: string;
  setLanguage?: (lang: string) => void;
  onBack: () => void;
  restTimer: number;
  setRestTimer: (val: number) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onRestoreBackup?: () => void;
  onOpenPrivacy: () => void;
  onOpenTOS: () => void;
  showRpe: boolean;
  setShowRpe: (val: boolean) => void;
  oneRepMaxFormula?: "epley" | "brzycki";
  setOneRepMaxFormula?: (val: "epley" | "brzycki") => void;
  onDeleteAccount?: () => void;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="app-shell bg-background text-on-background font-[var(--font-body-md)] text-[16px] min-h-[100dvh] antialiased flex flex-col w-full pb-20">
      {/* TopAppBar */}
      <header className="console-topbar flex justify-center items-center w-full px-margin-mobile h-16 sticky top-0 z-50">
        <div className="h-10 overflow-hidden">
          <img
            src={logoInAppImg}
            alt="LIFTLAB"
            className="h-full w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg">
        <header className="premium-panel rounded-2xl p-4 flex items-center gap-stack-md mb-stack-sm">
          <button
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-on-background cursor-pointer"
            aria-label={t("cancel") || "Go back"}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-fixed">
              {t("local_control") || "Local Control"}
            </p>
            <h1 className="font-[var(--font-headline-lg)] text-[36px] leading-none font-black text-primary uppercase tracking-wide">
              {t("settings")}
            </h1>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-lg">
          {/* Preferences Section */}
          <section className="col-span-1 md:col-span-12 premium-panel rounded-2xl p-stack-lg flex flex-col gap-stack-md">
            <div className="flex items-center gap-2 border-b border-surface-variant pb-stack-md mb-stack-sm">
              <SlidersHorizontal className="w-5 h-5 text-primary-fixed" />
              <h3 className="text-[14px] font-bold text-primary uppercase tracking-widest">
                {t("preferences")}
              </h3>
            </div>

            {/* Preference Item: Language */}
            {setLanguage && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2 border-b border-surface-variant/40 pb-4">
                <div className="flex flex-col">
                  <span className="text-[18px] text-on-background font-bold">
                    {t("language") || "Language"}
                  </span>
                  <span className="text-[14px] text-on-surface-variant">
                    {t("language_desc") || "Select your preferred application language"}
                  </span>
                </div>
                <div className="w-full sm:w-auto flex bg-surface border border-surface-variant rounded-lg p-1">
                  {[
                    { code: "en", label: "EN" },
                    { code: "it", label: "IT" },
                    { code: "es", label: "ES" },
                  ].map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      aria-pressed={language === code}
                      className={`min-h-11 flex-1 sm:flex-none px-4 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${
                        language === code
                          ? "bg-primary-fixed text-on-primary-fixed shadow-sm"
                          : "text-on-surface-variant hover:text-on-background"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preference Item: Weight Unit */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-[18px] text-on-background font-bold">
                  {t("weight_unit")}
                </span>
                <span className="text-[14px] text-on-surface-variant">
                  {t("weight_unit_desc") || "Global measurement standard (auto-converts history)"}
                </span>
              </div>
              <div className="w-full sm:w-auto flex bg-surface border border-surface-variant rounded-lg p-1">
                <button
                  onClick={() => setUnit("KG")}
                  aria-pressed={unit.toUpperCase() === "KG"}
                  className={`min-h-11 flex-1 sm:flex-none px-5 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${unit.toUpperCase() === "KG" ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:text-on-background"}`}
                >
                  KG
                </button>
                <button
                  onClick={() => setUnit("LBS")}
                  aria-pressed={unit.toUpperCase() === "LBS"}
                  className={`min-h-11 flex-1 sm:flex-none px-5 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${unit.toUpperCase() === "LBS" ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:text-on-background"}`}
                >
                  LBS
                </button>
              </div>
            </div>

            {/* Preference Item: Rest Timer */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-[18px] text-on-background font-bold">
                  {t("default_rest_timer") || "Default Rest Timer"}
                </span>
                <span className="text-[14px] text-on-surface-variant">
                  {t("auto_start_rest") || "Auto-start between sets"}
                </span>
              </div>
              <div className="w-full sm:w-auto flex items-center justify-between gap-3 bg-surface border border-outline-variant rounded-lg p-1">
                <button
                  onClick={() => setRestTimer(Math.max(0, restTimer - 15))}
                  aria-label="Decrease rest timer by 15 seconds"
                  className="min-w-11 min-h-11 flex items-center justify-center text-on-surface-variant hover:text-primary-fixed transition-colors cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-[var(--font-headline-md)] text-[24px] font-bold text-primary w-12 text-center">
                  {restTimer}s
                </span>
                <button
                  onClick={() => setRestTimer(restTimer + 15)}
                  aria-label="Increase rest timer by 15 seconds"
                  className="min-w-11 min-h-11 flex items-center justify-center text-on-surface-variant hover:text-primary-fixed transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preference Item: Show RPE */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-[18px] text-on-background font-bold">
                  {t("show_rpe")}
                </span>
                <span className="text-[14px] text-on-surface-variant">
                  {t("show_rpe_desc")}
                </span>
              </div>
              <div className="w-full sm:w-auto flex bg-surface border border-surface-variant rounded-lg p-1">
                <button
                  onClick={() => setShowRpe(true)}
                  className={`min-h-11 flex-1 sm:flex-none px-5 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${showRpe ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:text-on-background"}`}
                >
                  {t("yes")}
                </button>
                <button
                  onClick={() => setShowRpe(false)}
                  className={`min-h-11 flex-1 sm:flex-none px-5 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${!showRpe ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:text-on-background"}`}
                >
                  {t("no")}
                </button>
              </div>
            </div>

            {/* Preference Item: 1RM Formula */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-[18px] text-on-background font-bold">
                  {t("formula_1rm") || "1RM Formula"}
                </span>
                <span className="text-[14px] text-on-surface-variant">
                  {t("formula_1rm_desc") || "Epley (standard) or Brzycki"}
                </span>
              </div>
              <div className="w-full sm:w-auto flex bg-surface border border-surface-variant rounded-lg p-1">
                <button
                  onClick={() => setOneRepMaxFormula?.("epley")}
                  className={`min-h-11 flex-1 sm:flex-none px-5 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${oneRepMaxFormula === "epley" ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:text-on-background"}`}
                >
                  Epley
                </button>
                <button
                  onClick={() => setOneRepMaxFormula?.("brzycki")}
                  className={`min-h-11 flex-1 sm:flex-none px-5 py-2 rounded-md text-[14px] font-bold transition-all uppercase cursor-pointer ${oneRepMaxFormula === "brzycki" ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:text-on-background"}`}
                >
                  Brzycki
                </button>
              </div>
            </div>
          </section>

          {/* Account & Security Section */}
          <section className="col-span-1 md:col-span-12 premium-panel rounded-2xl p-stack-lg flex flex-col gap-stack-md">
            <div className="flex items-center gap-2 border-b border-surface-variant pb-stack-md mb-stack-sm">
              <Shield className="w-5 h-5 text-primary-fixed" />
              <h3 className="text-[14px] font-bold text-primary uppercase tracking-widest">
                {t("privacyData")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-stack-lg gap-y-2">
              <button
                onClick={onOpenPrivacy}
                className="flex justify-between items-center py-4 border-b border-surface-variant/50 hover:bg-surface transition-colors px-2 rounded-lg -mx-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 text-on-background">
                  <Lock className="w-6 h-6 text-on-surface-variant" />
                  <span className="text-[18px]">{t("privacyPolicy")}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>

              <button
                onClick={onOpenTOS}
                className="flex justify-between items-center py-4 border-b border-surface-variant/50 hover:bg-surface transition-colors px-2 rounded-lg -mx-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 text-on-background">
                  <FileText className="w-6 h-6 text-on-surface-variant" />
                  <span className="text-[18px]">{t("termsOfService")}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>

              <button
                onClick={onExportData}
                className="flex justify-between items-center py-4 border-b border-surface-variant/50 md:border-b-0 hover:bg-surface transition-colors px-2 rounded-lg -mx-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 text-on-background">
                  <Database className="w-6 h-6 text-on-surface-variant" />
                  <span className="text-[18px]">{t("exportData")}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>

              <button
                onClick={() => importInputRef.current?.click()}
                className="flex justify-between items-center py-4 border-b border-surface-variant/50 md:border-b-0 hover:bg-surface transition-colors px-2 rounded-lg -mx-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 text-on-background">
                  <Upload className="w-6 h-6 text-on-surface-variant" />
                  <span className="text-[18px]">{t("import_local_data") || "Import Local Data"}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImportData(file);
                  event.currentTarget.value = "";
                }}
              />

              {Boolean(localStorage.getItem("liftlab_backup_pre_import")) && onRestoreBackup && (
                <button
                  onClick={onRestoreBackup}
                  className="flex justify-between items-center py-4 border-b border-surface-variant/50 md:border-b-0 hover:bg-surface transition-colors px-2 rounded-lg -mx-2 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-on-background">
                    <RotateCcw className="w-6 h-6 text-primary" />
                    <span className="text-[18px] text-primary font-medium">{t("restore_pre_import") || "Undo Last Import (Restore Snapshot)"}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </button>
              )}

              {onDeleteAccount && (
                <button
                  onClick={onDeleteAccount}
                  className="col-span-1 md:col-span-2 flex justify-between items-center py-4 hover:bg-error/10 transition-colors px-2 rounded-lg -mx-2 text-left text-error cursor-pointer mt-2 border border-error/20"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-6 h-6 text-error" />
                    <div>
                      <span className="text-[18px] font-bold">{t("deleteAccount") || "Delete All Local Data"}</span>
                      <p className="text-xs text-error/80">{t("delete_account_hint") || "Permanently erase all workouts, routines, and records."}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-error" />
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
