/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dumbbell, LayoutDashboard, Database, Scale, Save, LineChart as LucideLineChart } from "lucide-react";
import { useWorkoutData } from "./hooks/useWorkoutData";

import { Dashboard } from "./components/Dashboard";
import { Library } from "./components/Library";
import { Workout } from "./components/Workout";
import { Progress } from "./components/Progress";
import { Settings } from "./components/Settings";
import { OnboardingTutorial } from "./components/OnboardingTutorial";
import { RoutineEditor } from "./components/RoutineEditor";
import { WorkoutSummaryView } from "./components/WorkoutSummaryView";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { CookieBanner } from "./components/common/CookieBanner";
import { PrivacyPolicyModal } from "./components/common/PrivacyPolicyModal";
import { TOSModal } from "./components/common/TOSModal";
import { ShareRoutineModal } from "./components/common/ShareRoutineModal";
import { ImportRoutineModal } from "./components/common/ImportRoutineModal";
import { ExerciseDetails } from "./components/common/ExerciseDetails";
import { AddExercise } from "./components/common/AddExercise";

import { parseLiftLabRoutineText } from "./lib/routineImport";
import { showToast } from "./lib/toast";
import type { RoutineData } from "./types/workout";
import { ToastViewport } from "./components/common/ToastViewport";
import { AnimatePresence, motion } from "motion/react";
import { triggerHaptic } from "./lib/haptics";

export default function App() {
  const {
    userData,
    sharingRoutine,
    setSharingRoutine,
    isImportCodeOpen,
    setIsImportCodeOpen,
    activeTab,
    setActiveTab,
    prevTab,
    lastWorkoutData,
    isLiveWorkoutActive,
    liveWorkoutKey,
    isConfirming,
    exercises,
    isExerciseCatalogLoading,
    routines,
    activeRoutineId,
    setActiveRoutineId,
    activeExercise,
    setActiveExercise,
    dashboardStats,
    weeklyGoal,
    setWeeklyGoal,
    showTutorial,
    currentWeight,
    weightLogs,
    language,
    unit,
    isEmptyPromptOpen,
    userName,
    restTimer,
    showRpe,
    isDeleteAccountConfirmOpen,
    setIsDeleteAccountConfirmOpen,
    isWeightModalOpen,
    setIsWeightModalOpen,
    weightInput,
    setWeightInput,
    isReplaceWorkoutConfirmOpen,
    setIsReplaceWorkoutConfirmOpen,
    pendingWorkout,
    transientLiveRoutine,
    workoutLogs,
    exerciseRestPresets,
    showPrivacyPolicy,
    setShowPrivacyPolicy,
    showTOS,
    setShowTOS,
    showCookieConsent,
    setShowCookieConsent,
    savedExerciseNotes,
    t,
    handleExportData,
    handleImportData,
    isImportBackupConfirmOpen,
    setIsImportBackupConfirmOpen,
    pendingBackupData,
    handleConfirmImportBackup,
    handleCancelImportBackup,
    handleRestorePreImportBackup,
    handleDeleteAccount,
    handleDeleteAccountConfirmed,
    finishTutorial,
    handleSaveRoutine,
    handleConfirmEmptySave,
    handleConfirmReplaceWorkout,
    handleDiscardLiveWorkout,
    navigateTo,
    handleStartLiveWorkout,
    handleRepeatLastWorkout,
    handleToggleFavoriteRoutine,
    handleSaveExerciseRestPreset,
    handleToggleUnit,
    handleAddExercise,
    handleUpdateWeight,
    handleImportRoutine,
    handleDeleteRoutine,
    handleDeleteWorkoutLog,
    handleDuplicateRoutine,
    setAppLanguage,
    setAppRestTimer,
    handleSetShowRpe,
    oneRepMaxFormula,
    handleSetOneRepMaxFormula,
    setAppWeight,
    setAppDashboardStats,
    handleCreateRoutine,
    handleOpenExerciseDetails,
    handleDetailsAddExercise,
    createMissingImportedExercises,
    fillImportedRoutineWeights,
    restartTutorial,
    loadStarterRoutines,
  } = useWorkoutData();

  const renderAppContent = () => {
    const isMainTab = ["dashboard", "library", "workout", "progress"].includes(activeTab);

    if (!isMainTab) {
      let subview = null;
      if (activeTab === "exercise_details" && activeExercise) {
        const canAdd = prevTab === "routine_editor" || prevTab === "live_editor";
        subview = (
          <ExerciseDetails
            ex={activeExercise}
            unit={unit}
            onBack={() => setActiveTab(prevTab)}
            t={t}
            language={language}
            exercises={exercises}
            onSelectVariation={setActiveExercise}
            onAddExercise={canAdd ? handleDetailsAddExercise : undefined}
          />
        );
      } else if (activeTab === "routine_editor") {
        const r = activeRoutineId
          ? routines.find((x) => x.id === activeRoutineId)
          : undefined;
        subview = (
          <RoutineEditor
            unit={unit}
            t={t}
            exercises={exercises}
            initialRoutine={r}
            onBack={() => setActiveTab("workout")}
            onSave={(updated) => handleSaveRoutine(updated, false)}
            mode="edit"
            onAddCustomExercise={handleAddExercise}
            restTimer={restTimer}
            setRestTimer={setAppRestTimer}
            onOpenDetail={handleOpenExerciseDetails}
            userName={userName}
            workoutLogs={workoutLogs}
            showRpe={showRpe}
          />
        );
      } else if (activeTab === "workout_summary") {
        subview = (
          <WorkoutSummaryView
            logData={lastWorkoutData}
            unit={unit}
            language={language}
            onBack={() => setActiveTab("workout")}
            t={t}
          />
        );
      } else if (activeTab === "settings") {
        subview = (
          <Settings
            t={t}
            unit={unit}
            setUnit={handleToggleUnit}
            language={language}
            setLanguage={setAppLanguage}
            onBack={() => setActiveTab(prevTab)}
            restTimer={restTimer}
            setRestTimer={setAppRestTimer}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onRestoreBackup={handleRestorePreImportBackup}
            onOpenPrivacy={() => setShowPrivacyPolicy(true)}
            onOpenTOS={() => setShowTOS(true)}
            showRpe={showRpe}
            setShowRpe={handleSetShowRpe}
            oneRepMaxFormula={oneRepMaxFormula}
            setOneRepMaxFormula={handleSetOneRepMaxFormula}
            onDeleteAccount={handleDeleteAccount}
            onReplayTutorial={restartTutorial}
          />
        );
      } else if (activeTab === "add_exercise") {
        subview = (
          <AddExercise
            t={t}
            unit={unit}
            onBack={() => setActiveTab(prevTab)}
            onSave={handleAddExercise}
          />
        );
      }

      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {subview}
          </motion.div>
        </AnimatePresence>
      );
    }

    return (
      <div
        className="app-shell bg-background text-on-background min-h-[100dvh] pb-28 sm:pb-32 lg:pb-0 lg:pl-24 overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[600] focus:rounded-xl focus:bg-primary-fixed focus:px-4 focus:py-3 focus:font-bold focus:text-black"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1}>
        {/* Main Content Area */}
        <div className="w-full transition-opacity duration-150">
            {activeTab === "dashboard" && (
              <Dashboard
                t={t}
                unit={unit}
                navigateTo={navigateTo}
                onSelectRoutine={setActiveRoutineId}
                onStartLiveWorkout={handleStartLiveWorkout}
                routines={routines}
                currentWeight={currentWeight}
                setCurrentWeight={setAppWeight}
                onUpdateWeight={() => {
                  setWeightInput(currentWeight > 0 ? currentWeight.toString() : "");
                  setIsWeightModalOpen(true);
                }}
                dashboardStats={dashboardStats}
                setDashboardStats={setAppDashboardStats}
                exercises={exercises}
                workoutLogs={workoutLogs}
                weightLogs={weightLogs}
                weeklyGoal={weeklyGoal}
                setWeeklyGoal={setWeeklyGoal}
                onDeleteLog={handleDeleteWorkoutLog}
              />
            )}
            {activeTab === "library" && (
              <Library
                t={t}
                unit={unit}
                exercises={exercises}
                isCatalogLoading={isExerciseCatalogLoading}
                onAddExercise={() => navigateTo("add_exercise")}
                onOpenDetail={handleOpenExerciseDetails}
                onOpenSettings={() => navigateTo("settings")}
              />
            )}
            {activeTab === "workout" && (
              <Workout
                t={t}
                unit={unit}
                routines={routines}
                onDuplicateRoutine={handleDuplicateRoutine}
                onDeleteRoutine={handleDeleteRoutine}
                navigateTo={navigateTo}
                onSelectRoutine={setActiveRoutineId}
                onStartLiveWorkout={handleStartLiveWorkout}
                onToggleFavoriteRoutine={handleToggleFavoriteRoutine}
                onCreate={handleCreateRoutine}
                onImportRoutine={handleImportRoutine}
                activeRoutineId={activeRoutineId}
                onShareRoutine={setSharingRoutine}
                onOpenImportCode={() => setIsImportCodeOpen(true)}
                onLoadStarterRoutines={loadStarterRoutines}
              />
            )}
            {activeTab === "progress" && (
              <Progress
                t={t}
                unit={unit}
                exercises={exercises}
                workoutLogs={workoutLogs}
                weightLogs={weightLogs}
                navigateTo={navigateTo}
                onUpdateWeight={() => {
                  setWeightInput(currentWeight > 0 ? currentWeight.toString() : "");
                  setIsWeightModalOpen(true);
                }}
                userData={userData}
                onDeleteWorkoutLog={handleDeleteWorkoutLog}
                oneRepMaxFormula={oneRepMaxFormula}
              />
            )}

        {sharingRoutine && (
          <ShareRoutineModal
            routine={sharingRoutine}
            onClose={() => setSharingRoutine(null)}
          />
        )}
        {isImportCodeOpen && (
          <ImportRoutineModal
            exercises={exercises}
            onClose={() => setIsImportCodeOpen(false)}
            onImport={async (text) => {
              const parsedRoutines = parseLiftLabRoutineText(text, exercises) as RoutineData[];
              if (parsedRoutines.length === 0) {
                throw new Error("No routines found in the code.");
              }
              let totalCustomCreated = 0;
              const importedNames: string[] = [];
              for (const parsedRoutine of parsedRoutines) {
                const customCreated = await createMissingImportedExercises(parsedRoutine);
                totalCustomCreated += customCreated;
                const importedRoutine = fillImportedRoutineWeights(parsedRoutine);
                await handleSaveRoutine(importedRoutine, false);
                setActiveRoutineId(importedRoutine.id);
                importedNames.push(importedRoutine.name);
              }
              const namesStr = importedNames.map((n) => `"${n}"`).join(", ");
              showToast(
                totalCustomCreated > 0
                  ? `Imported: ${namesStr}. Created ${totalCustomCreated} custom exercise(s).`
                  : `Imported: ${namesStr}`,
                "success",
              );
            }}
          />
        )}


        </div>
        </div>

        {/* Weight Modal */}
        {isWeightModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setIsWeightModalOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="weight-dialog-title"
              className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-sm flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden relative animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-7 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-[#30D158]/15 rounded-full flex items-center justify-center mb-5 border border-[#30D158]/25 text-[#30D158]">
                  <Scale className="w-7 h-7" />
                </div>

                <h2 id="weight-dialog-title" className="text-xl font-bold text-white tracking-tight mb-1">
                  {t("morning_weigh_in") || "Morning Weigh-In"}
                </h2>
                <p className="text-xs text-[#8E8E93] mb-6">
                  {t("track") || "Consistency is key to tracking your progress."}
                </p>

                <div className="relative w-full mb-7">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="1000"
                    step="0.1"
                    aria-label={`Body weight in ${unit}`}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full bg-transparent text-center text-6xl font-extrabold text-white tracking-tight tabular-nums focus:outline-none placeholder:text-neutral-700"
                    placeholder="00.0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        triggerHaptic("success");
                        handleUpdateWeight();
                      }
                    }}
                  />
                  <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mt-2">
                    {unit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setIsWeightModalOpen(false)}
                    className="min-h-[44px] py-3 px-5 rounded-full bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all font-semibold text-sm flex items-center justify-center cursor-pointer"
                  >
                    {t("cancel") || "Skip"}
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic("success");
                      handleUpdateWeight();
                    }}
                    disabled={!Number.isFinite(Number(weightInput)) || Number(weightInput) <= 0 || Number(weightInput) > 1000}
                    className="min-h-[44px] py-3 px-5 bg-[#30D158] text-black rounded-full font-bold text-sm tracking-tight hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center cursor-pointer"
                  >
                    {t("save") || "Save"}
                  </button>
                </div>
              </div>

              <div className="bg-[#161618] px-6 py-3 border-t border-white/5 flex justify-center">
                <p className="text-[11px] text-[#8E8E93] font-medium tracking-wide">
                  {currentWeight > 0 ? `Current: ${currentWeight} ${unit}` : "No weight logged yet"}
                </p>
              </div>
            </div>
          </div>
        )}

        {showTutorial && <OnboardingTutorial onFinish={finishTutorial} language={language} t={t} />}

        {/* Apple-Style Floating Navigation Dock */}
        <div
          className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-[100dvh] lg:w-24 lg:p-0 lg:pointer-events-auto"
        >
          <nav
            aria-label="Primary navigation"
            className="apple-floating-dock pointer-events-auto w-full max-w-[390px] sm:max-w-md h-[64px] px-2 py-1.5 rounded-[28px] sm:rounded-full flex items-center justify-around gap-1 lg:max-w-none lg:w-full lg:h-full lg:rounded-none lg:flex-col lg:justify-center lg:gap-3 lg:px-3 lg:py-4 gpu-accelerated"
          >
            <div className="absolute top-6 hidden flex-col items-center gap-2 lg:flex" aria-hidden="true">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#30D158] text-black shadow-[0_4px_14px_rgba(48,209,88,0.35)]">
                <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8E8E93]">LiftLab</span>
            </div>

            {[
              { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
              { id: "library", label: t("library"), icon: Database },
              { id: "workout", label: t("workout"), icon: Dumbbell },
              { id: "progress", label: t("progress"), icon: LucideLineChart },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic("light");
                    navigateTo(tab.id);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={tab.label}
                  className="relative flex-1 min-h-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-2xl sm:rounded-full cursor-pointer select-none transition-all duration-150 active:scale-90 apple-press lg:min-h-[72px] lg:w-full lg:flex-initial"
                >
                  {isActive && (
                    <motion.div
                      layoutId="apple-nav-active-pill"
                      className="absolute inset-0 rounded-2xl sm:rounded-full bg-white/[0.09] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? "scale-105 text-[#30D158]" : "text-[#8E8E93] group-hover:text-white"
                      }`}
                      fill={isActive ? "currentColor" : "none"}
                      strokeWidth={isActive ? 1.5 : 2}
                    />
                    <span
                      className={`text-[10px] sm:text-[10.5px] mt-1 tracking-tight transition-colors duration-150 ${
                        isActive ? "font-bold text-[#30D158]" : "font-medium text-[#8E8E93]"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {showCookieConsent && (
          <CookieBanner
            t={t}
            onAccept={() => {
              localStorage.setItem("liftlab_cookie_consent", "true");
              setShowCookieConsent(false);
            }}
            onDecline={() => {
              localStorage.setItem("liftlab_cookie_consent", "declined");
              setShowCookieConsent(false);
            }}
          />
        )}

        {showPrivacyPolicy && <PrivacyPolicyModal onClose={() => setShowPrivacyPolicy(false)} />}
        {showTOS && <TOSModal onClose={() => setShowTOS(false)} />}

        {isDeleteAccountConfirmOpen && (
          <ConfirmModal
            message={t("deleteAccountConfirm") || "Are you sure you want to delete your account?"}
            confirmLabel={t("delete") || "Delete"}
            cancelLabel={t("cancel") || "Cancel"}
            destructive
            onConfirm={handleDeleteAccountConfirmed}
            onCancel={() => setIsDeleteAccountConfirmOpen(false)}
          />
        )}

        {isImportBackupConfirmOpen && (
          <ConfirmModal
            message={
              language === "it"
                ? `Vuoi sovrascrivere i tuoi dati con questo backup (${pendingBackupData?.routines?.length || 0} schede, ${pendingBackupData?.logs?.length || 0} allenamenti)? Verrà creata una copia di sicurezza automatica.`
                : language === "es"
                  ? `¿Deseas sobrescribir tus datos con esta copia (${pendingBackupData?.routines?.length || 0} rutinas, ${pendingBackupData?.logs?.length || 0} entrenamientos)? Se creará una instantánea de seguridad.`
                  : `Overwrite your current data with this backup (${pendingBackupData?.routines?.length || 0} routines, ${pendingBackupData?.logs?.length || 0} workouts)? An automatic safety snapshot will be saved.`
            }
            confirmLabel={t("import") || "Import"}
            cancelLabel={t("cancel") || "Cancel"}
            destructive
            onConfirm={handleConfirmImportBackup}
            onCancel={handleCancelImportBackup}
          />
        )}

        {isReplaceWorkoutConfirmOpen && (
          <ConfirmModal
            message={
              language === "it"
                ? `C'è già un allenamento in corso. Vuoi annullarlo e iniziarne uno nuovo?`
                : language === "es"
                  ? `Ya hay un entrenamiento en curso. ¿Quieres descartarlo y empezar uno nuevo?`
                  : `There's already an active workout. Discard it and start a new one?`
            }
            confirmLabel={t("discard") || "Discard"}
            cancelLabel={t("cancel") || "Cancel"}
            destructive
            onConfirm={handleConfirmReplaceWorkout}
            onCancel={() => {
              setIsReplaceWorkoutConfirmOpen(false);
              navigateTo("live_editor");
            }}
          />
        )}
      </div>
    );
  };

  return (
      <>
      <ToastViewport />
      <div style={{ display: activeTab === "live_editor" ? "block" : "none" }}>
        {isLiveWorkoutActive && (
          <div key={`live_${liveWorkoutKey}`}>
            <RoutineEditor
              mode="live"
              unit={unit}
              t={t}
              exercises={exercises}
              initialRoutine={
                transientLiveRoutine && activeRoutineId === transientLiveRoutine.id
                  ? transientLiveRoutine
                  : activeRoutineId
                    ? routines.find((x) => x.id === activeRoutineId)
                    : undefined
              }
              routineId={activeRoutineId || undefined}
              onBack={() => setActiveTab("workout")}
              onDiscard={() => {
                void handleDiscardLiveWorkout();
              }}
              onSave={(updated) => handleSaveRoutine(updated, true)}
              onAddCustomExercise={handleAddExercise}
              restTimer={restTimer}
              setRestTimer={setAppRestTimer}
              onOpenDetail={handleOpenExerciseDetails}
              userName={userName}
              workoutLogs={workoutLogs}
              savedExerciseNotes={savedExerciseNotes}
              exerciseRestPresets={exerciseRestPresets}
              onSaveExerciseRestPreset={handleSaveExerciseRestPreset}
              showRpe={showRpe}
            />
          </div>
        )}
      </div>

      <div style={{ display: activeTab !== "live_editor" ? "block" : "none" }}>{renderAppContent()}</div>

      {isLiveWorkoutActive && activeTab !== "live_editor" && (
        <button
          onClick={() => {
            triggerHaptic("medium");
            setActiveTab("live_editor");
          }}
          aria-label="Return to active workout"
          className="fixed bottom-20 right-4 z-[100] bg-[#1C1C1E]/95 backdrop-blur-2xl border border-[#30D158]/50 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer group lg:bottom-6 lg:right-6"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-ping absolute opacity-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]"></span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#30D158] leading-none">
              {t("live_session") || "Live Session"}
            </span>
            <span className="text-[12px] font-bold text-white leading-tight">
              {t("in_progress") || "In Progress"}
            </span>
          </div>
          <Dumbbell className="w-4 h-4 text-white/70 ml-0.5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Save as Routine Modal */}
      {isEmptyPromptOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-150">
            <div className="p-7 text-center">
              <div className="w-14 h-14 bg-[#30D158]/15 rounded-full flex items-center justify-center text-[#30D158] mx-auto mb-4 border border-[#30D158]/25">
                <Save className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                {t("workout_completed")}
              </h2>
              <p className="text-xs text-[#8E8E93] mb-6">
                Would you like to save this session as a regular routine for future use?
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    triggerHaptic("success");
                    handleConfirmEmptySave(true);
                  }}
                  disabled={isConfirming}
                  className={`w-full min-h-[44px] bg-[#30D158] text-black font-bold py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all text-sm tracking-tight shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2 cursor-pointer ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isConfirming ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      {t("saving") || "Saving..."}
                    </>
                  ) : (
                    t("save_as_routine")
                  )}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    handleConfirmEmptySave(false);
                  }}
                  disabled={isConfirming}
                  className={`w-full min-h-[44px] bg-white/10 text-white font-semibold py-3.5 rounded-full hover:bg-white/15 text-sm tracking-tight active:scale-95 transition-all cursor-pointer flex items-center justify-center ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {t("log_only")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
  );
}
