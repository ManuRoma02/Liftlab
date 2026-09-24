import React, { useRef } from "react";
import {
  ChevronLeft,
  Languages,
  Scale,
  Timer,
  Activity,
  TrendingUp,
  Minus,
  Plus,
  Lock,
  FileText,
  Database,
  Upload,
  RotateCcw,
  Trash2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import logoInAppImg from "../assets/images/logo_in_app.png";
import { triggerHaptic } from "../lib/haptics";

function AppleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        triggerHaptic("light");
        onChange(!checked);
      }}
      className="min-w-[44px] min-h-[44px] flex items-center justify-center p-0 bg-transparent border-none cursor-pointer select-none"
    >
      <div
        className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0 ${
          checked ? "bg-[#30D158]" : "bg-[#3A3A3C]"
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

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
  onReplayTutorial,
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
  onReplayTutorial?: () => void;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bg-black text-white min-h-[100dvh] antialiased flex flex-col w-full pb-24">
      {/* iOS Top Navigation Bar with Safe Area Inset */}
      <header
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] px-4 flex items-center justify-between"
      >
        <button
          onClick={() => {
            triggerHaptic("light");
            onBack();
          }}
          className="min-w-[44px] min-h-[44px] px-2 flex items-center gap-1 text-[#30D158] font-medium text-base hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer"
          aria-label={t("go_back") || "Go back"}
        >
          <ChevronLeft className="w-5 h-5 -ml-1.5" />
          <span>{t("go_back") || "Back"}</span>
        </button>

        <div className="h-7 overflow-hidden flex items-center">
          <img
            src={logoInAppImg}
            alt="LIFTLAB"
            className="h-full w-auto object-contain"
          />
        </div>

        <div className="w-14" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[768px] mx-auto px-4 py-6 flex flex-col gap-7">
        {/* Large Title */}
        <div className="px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#30D158] mb-1">
            {t("local_control") || "Local Control"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {t("settings")}
          </h1>
        </div>

        {/* Section 1: PREFERENCES */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] ml-4 mb-2">
            {t("preferences")}
          </div>

          <div className="bg-[#1C1C1E] border border-white/6 rounded-2xl divide-y divide-white/6 overflow-hidden shadow-sm">
            {/* Preference Item: Language */}
            {setLanguage && (
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#0A84FF] flex items-center justify-center text-white shrink-0">
                    <Languages className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white">
                      {t("language") || "Language"}
                    </span>
                    <span className="text-xs text-[#8E8E93] truncate">
                      {t("language_desc") || "Select your preferred application language"}
                    </span>
                  </div>
                </div>

                <div className="flex p-0.5 bg-black/40 rounded-full border border-white/10 text-xs shrink-0">
                  {[
                    { code: "en", label: "EN" },
                    { code: "it", label: "IT" },
                    { code: "es", label: "ES" },
                  ].map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => {
                        triggerHaptic("light");
                        setLanguage(code);
                      }}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs uppercase transition-all cursor-pointer ${
                        language === code
                          ? "bg-[#30D158] text-black shadow-sm"
                          : "text-[#8E8E93] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preference Item: Weight Unit */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#FF9F0A] flex items-center justify-center text-white shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white">
                    {t("weight_unit")}
                  </span>
                  <span className="text-xs text-[#8E8E93] truncate">
                    {t("weight_unit_desc") || "Global measurement standard"}
                  </span>
                </div>
              </div>

              <div className="flex p-0.5 bg-black/40 rounded-full border border-white/10 text-xs shrink-0">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setUnit("KG");
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all uppercase cursor-pointer ${
                    unit.toUpperCase() === "KG"
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  KG
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setUnit("LBS");
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all uppercase cursor-pointer ${
                    unit.toUpperCase() === "LBS"
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  LBS
                </button>
              </div>
            </div>

            {/* Preference Item: Rest Timer */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#30D158] flex items-center justify-center text-black shrink-0">
                  <Timer className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white">
                    {t("default_rest_timer") || "Default Rest Timer"}
                  </span>
                  <span className="text-xs text-[#8E8E93] truncate">
                    {t("auto_start_rest") || "Auto-start between sets"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-full p-0.5 shrink-0">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setRestTimer(Math.max(0, restTimer - 15));
                  }}
                  aria-label="Decrease rest timer by 15 seconds"
                  className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white min-w-10 text-center tabular-nums">
                  {restTimer}s
                </span>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setRestTimer(restTimer + 15);
                  }}
                  aria-label="Increase rest timer by 15 seconds"
                  className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preference Item: Show RPE */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#BF5AF2] flex items-center justify-center text-white shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white">
                    {t("show_rpe")}
                  </span>
                  <span className="text-xs text-[#8E8E93] truncate">
                    {t("show_rpe_desc")}
                  </span>
                </div>
              </div>

              <AppleSwitch checked={showRpe} onChange={setShowRpe} />
            </div>

            {/* Preference Item: 1RM Formula */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#64D2FF] flex items-center justify-center text-black shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white">
                    {t("formula_1rm") || "1RM Formula"}
                  </span>
                  <span className="text-xs text-[#8E8E93] truncate">
                    {t("formula_1rm_desc") || "Epley (standard) or Brzycki"}
                  </span>
                </div>
              </div>

              <div className="flex p-0.5 bg-black/40 rounded-full border border-white/10 text-xs shrink-0">
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setOneRepMaxFormula?.("epley");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    oneRepMaxFormula === "epley"
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  Epley
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setOneRepMaxFormula?.("brzycki");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    oneRepMaxFormula === "brzycki"
                      ? "bg-[#30D158] text-black shadow-sm"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  Brzycki
                </button>
              </div>
            </div>

            {/* Preference Item: Replay Setup Guide */}
            {onReplayTutorial && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  onReplayTutorial();
                }}
                className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#30D158] flex items-center justify-center text-black shrink-0">
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white">
                      {t("replay_tutorial") || "Replay Setup Guide"}
                    </span>
                    <span className="text-xs text-[#8E8E93] truncate">
                      {t("unit") || "Units"}, {t("weekly_goal") || "Goal"}, {t("weight") || "Weight"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>

        {/* Section 2: DATA & PRIVACY */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] ml-4 mb-2">
            {t("privacyData")}
          </div>

          <div className="bg-[#1C1C1E] border border-white/6 rounded-2xl divide-y divide-white/6 overflow-hidden shadow-sm">
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenPrivacy();
              }}
              className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#5E5CE6] flex items-center justify-center text-white shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">
                  {t("privacyPolicy")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenTOS();
              }}
              className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#8E8E93] flex items-center justify-center text-white shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">
                  {t("termsOfService")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                onExportData();
              }}
              className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#30D158] flex items-center justify-center text-black shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">
                  {t("exportData")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                importInputRef.current?.click();
              }}
              className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#0A84FF] flex items-center justify-center text-white shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">
                  {t("import_local_data") || "Import Local Data"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  triggerHaptic("medium");
                  onImportData(file);
                }
                event.currentTarget.value = "";
              }}
            />

            {Boolean(localStorage.getItem("liftlab_backup_pre_import")) && onRestoreBackup && (
              <button
                onClick={() => {
                  triggerHaptic("light");
                  onRestoreBackup();
                }}
                className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF9F0A] flex items-center justify-center text-black shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-[#FF9F0A]">
                    {t("restore_pre_import") || "Undo Last Import (Restore Snapshot)"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>

        {/* Section 3: DANGER ZONE */}
        {onDeleteAccount && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF453A] ml-4 mb-2">
              {t("danger_zone") || "Danger Zone"}
            </div>

            <div className="bg-[#1C1C1E] border border-[#FF453A]/25 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  triggerHaptic("warning");
                  onDeleteAccount();
                }}
                className="w-full flex justify-between items-center p-4 hover:bg-[#FF453A]/10 active:bg-[#FF453A]/20 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF453A]/20 flex items-center justify-center text-[#FF453A] shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#FF453A]">
                      {t("deleteAccount") || "Delete All Local Data"}
                    </span>
                    <span className="text-xs text-[#FF453A]/70">
                      {t("delete_account_hint") || "Permanently erase all workouts, routines, and records."}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#FF453A] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
