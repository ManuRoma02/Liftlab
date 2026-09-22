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
        className="app-shell bg-background text-on-background min-h-[100dvh] pb-24 lg:pb-0 lg:pl-24 overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container"
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
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setIsWeightModalOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="weight-dialog-title"
              className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Scale className="w-32 h-32" />
              </div>

              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-6 border border-primary-container/30">
                  <Scale className="w-8 h-8 text-primary" />
                </div>

                <h2 id="weight-dialog-title" className="text-2xl font-bold text-on-background mb-2">
                  {t("morning_weigh_in") || "Morning Weigh-In"}
                </h2>
                <p className="text-body-md text-on-surface-variant mb-8">
                  {t("track") || "Consistency is key to tracking your progress."}
                </p>

                <div className="relative w-full mb-8">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="1000"
                    step="0.1"
                    aria-label={`Body weight in ${unit}`}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full bg-transparent text-center text-6xl font-bold text-primary focus:outline-none placeholder:text-surface-variant"
                    placeholder="00.0"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateWeight()}
                  />
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                    {unit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setIsWeightModalOpen(false)}
                    className="py-4 px-6 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-all font-bold text-sm tracking-wide"
                  >
                    {t("cancel") || "Skip"}
                  </button>
                  <button
                    onClick={handleUpdateWeight}
                    disabled={!Number.isFinite(Number(weightInput)) || Number(weightInput) <= 0 || Number(weightInput) > 1000}
                    className="py-4 px-6 bg-primary-fixed text-[#07110a] rounded-xl font-bold text-sm tracking-wide hover:shadow-[0_0_20px_rgba(34,197,94,0.28)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t("save") || "Save Progress"}
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-low px-8 py-4 border-t border-surface-variant flex justify-center">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">
                  {currentWeight > 0 ? `Current: ${currentWeight} ${unit}` : "No weight logged yet"}
                </p>
              </div>
            </div>
          </div>
        )}

        {showTutorial && <OnboardingTutorial onFinish={finishTutorial} />}

        {/* BottomNavBar */}
        <nav
          aria-label="Primary navigation"
          className="console-nav fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl px-gutter pt-2 lg:top-0 lg:h-[100dvh] lg:w-24 lg:flex-col lg:justify-center lg:gap-3 lg:rounded-none lg:px-3 lg:py-4 gpu-accelerated"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
        >
          <div className="absolute top-6 hidden flex-col items-center gap-2 lg:flex" aria-hidden="true">
            <div className="premium-cta flex h-12 w-12 items-center justify-center rounded-2xl">
              <Dumbbell className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">LiftLab</span>
          </div>
          <button
            onClick={() => navigateTo("dashboard")}
            aria-current={activeTab === "dashboard" ? "page" : undefined}
            aria-label={t("dashboard")}
            className={`min-h-12 min-w-[64px] flex flex-col items-center justify-center px-4 py-1.5 active:scale-95 transition-all duration-150 rounded-2xl cursor-pointer lg:min-h-[72px] lg:w-full lg:px-2 ${activeTab === "dashboard" ? "premium-cta" : "text-on-surface-variant hover:bg-white/5 hover:text-primary"}`}
          >
            <LayoutDashboard
              className="w-6 h-6"
              fill={activeTab === "dashboard" ? "currentColor" : "none"}
              strokeWidth={activeTab === "dashboard" ? 1 : 2}
            />
            <span className="text-label-bold text-[10px] mt-1">{t("dashboard")}</span>
          </button>

          <button
            onClick={() => navigateTo("library")}
            aria-current={activeTab === "library" ? "page" : undefined}
            aria-label={t("library")}
            className={`min-h-12 min-w-[64px] flex flex-col items-center justify-center px-4 py-1.5 active:scale-95 transition-all duration-150 rounded-2xl cursor-pointer lg:min-h-[72px] lg:w-full lg:px-2 ${activeTab === "library" ? "premium-cta" : "text-on-surface-variant hover:bg-white/5 hover:text-primary"}`}
          >
            <Database
              className="w-6 h-6"
              fill={activeTab === "library" ? "currentColor" : "none"}
              strokeWidth={activeTab === "library" ? 1 : 1.5}
            />
            <span className="text-label-bold text-[10px] mt-1">{t("library")}</span>
          </button>

          <button
            onClick={() => navigateTo("workout")}
            aria-current={activeTab === "workout" ? "page" : undefined}
            aria-label={t("workout")}
            className={`min-h-12 min-w-[64px] flex flex-col items-center justify-center px-4 py-1.5 active:scale-95 transition-all duration-150 rounded-2xl cursor-pointer lg:min-h-[72px] lg:w-full lg:px-2 ${activeTab === "workout" ? "premium-cta" : "text-on-surface-variant hover:bg-white/5 hover:text-primary"}`}
          >
            <Dumbbell
              className="w-6 h-6"
              fill={activeTab === "workout" ? "currentColor" : "none"}
              strokeWidth={activeTab === "workout" ? 1 : 1.5}
            />
            <span className="text-label-bold text-[10px] mt-1">{t("workout")}</span>
          </button>

          <button
            onClick={() => navigateTo("progress")}
            aria-current={activeTab === "progress" ? "page" : undefined}
            aria-label={t("progress")}
            className={`min-h-12 min-w-[64px] flex flex-col items-center justify-center px-4 py-1.5 active:scale-95 transition-all duration-150 rounded-2xl cursor-pointer lg:min-h-[72px] lg:w-full lg:px-2 ${activeTab === "progress" ? "premium-cta" : "text-on-surface-variant hover:bg-white/5 hover:text-primary"}`}
          >
            <LucideLineChart
              className="w-6 h-6"
              fill={activeTab === "progress" ? "currentColor" : "none"}
              strokeWidth={activeTab === "progress" ? 1 : 1.5}
            />
            <span className="text-label-bold text-[10px] mt-1">{t("progress")}</span>
          </button>
        </nav>

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
          onClick={() => setActiveTab("live_editor")}
          aria-label="Return to active workout"
          className="fixed bottom-24 right-4 z-[100] bg-primary-fixed text-[#07110a] w-14 h-14 rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.32)] flex items-center justify-center hover:bg-primary-container active:scale-95 transition-colors cursor-pointer group lg:bottom-6 lg:right-6"
        >
          <Dumbbell className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          <span className="sr-only">Workout in progress</span>
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-black"></div>
        </button>
      )}

      {/* Save as Routine Modal */}
      {isEmptyPromptOpen && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-surface-variant rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Save className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-on-background mb-2">
                {t("workout_completed")}
              </h2>
              <p className="text-on-surface-variant text-sm mb-6">
                Would you like to save this session as a regular routine for future use?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleConfirmEmptySave(true)}
                  disabled={isConfirming}
                  className={`w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-widest border border-primary/20 flex items-center justify-center gap-2 ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isConfirming ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></span>
                      {t("saving") || "Saving..."}
                    </>
                  ) : (
                    t("save_as_routine")
                  )}
                </button>
                <button
                  onClick={() => handleConfirmEmptySave(false)}
                  disabled={isConfirming}
                  className={`w-full bg-surface-variant text-on-surface-variant font-bold py-3 rounded-lg hover:bg-surface-container text-sm uppercase tracking-widest transition-all ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
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
