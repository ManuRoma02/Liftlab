/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Dumbbell, LayoutDashboard, Database, Scale, Save, LineChart as LucideLineChart, Sparkles, X } from "lucide-react";
import { useWorkoutData } from "./hooks/useWorkoutData";
import { subscribeOtaEvents, reloadOtaApp, type OtaManifest } from "./lib/otaUpdate";
import { useAndroidSwipeBack } from "./lib/useAndroidSwipeBack";

import { Dashboard } from "./components/Dashboard";
import { Workout } from "./components/Workout";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { CookieBanner } from "./components/common/CookieBanner";

const Library = React.lazy(() => import("./components/Library").then(m => ({ default: m.Library })));
const Progress = React.lazy(() => import("./components/Progress").then(m => ({ default: m.Progress })));
const Settings = React.lazy(() => import("./components/Settings").then(m => ({ default: m.Settings })));
const OnboardingTutorial = React.lazy(() => import("./components/OnboardingTutorial").then(m => ({ default: m.OnboardingTutorial })));
const RoutineEditor = React.lazy(() => import("./components/RoutineEditor").then(m => ({ default: m.RoutineEditor })));
const WorkoutSummaryView = React.lazy(() => import("./components/WorkoutSummaryView").then(m => ({ default: m.WorkoutSummaryView })));
const PrivacyPolicyModal = React.lazy(() => import("./components/common/PrivacyPolicyModal").then(m => ({ default: m.PrivacyPolicyModal })));
const TOSModal = React.lazy(() => import("./components/common/TOSModal").then(m => ({ default: m.TOSModal })));
const ShareRoutineModal = React.lazy(() => import("./components/common/ShareRoutineModal").then(m => ({ default: m.ShareRoutineModal })));
const ImportRoutineModal = React.lazy(() => import("./components/common/ImportRoutineModal").then(m => ({ default: m.ImportRoutineModal })));
const ExerciseDetails = React.lazy(() => import("./components/common/ExerciseDetails").then(m => ({ default: m.ExerciseDetails })));
const AddExercise = React.lazy(() => import("./components/common/AddExercise").then(m => ({ default: m.AddExercise })));

import { parseLiftLabRoutineText } from "./lib/routineImport";
import { removeJsonAtomic } from "./lib/storage";
import { showToast } from "./lib/toast";
import type { RoutineData } from "./types/workout";
import { ToastViewport } from "./components/common/ToastViewport";
import { OtaNotesView } from "./components/common/OtaNotesView";
import { LiftLabMark } from "./components/common/LiftLabBrand";
import { AnimatePresence, motion } from "motion/react";
import { triggerHaptic, hapticPress } from "./lib/haptics";
import { useModalDismiss } from "./lib/modalStack";
import { appleSpringDefault, appleSpringSheet, APPLE_SPRINGS, CARTOON_SPRINGS, cartoonTabVariants } from "./lib/motion";

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
    isUpdateTemplatePromptOpen,
    handleConfirmUpdateTemplate,
    editingRoutineDraft,
    setEditingRoutineDraft,
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
    theme,
    setAppTheme,
    restartTutorial,
    loadStarterRoutines,
  } = useWorkoutData();

  const isMainTab = ["dashboard", "library", "workout", "progress"].includes(activeTab);
  const SUBVIEW_TABS = ["exercise_details", "routine_editor", "workout_summary", "settings", "add_exercise"] as const;
  const isSubview = SUBVIEW_TABS.includes(activeTab as any);
  const effectiveTab = isMainTab
    ? activeTab
    : ["dashboard", "library", "workout", "progress"].includes(prevTab)
      ? prevTab
      : "dashboard";
  const lastSubviewRef = useRef<ReactNode>(null);

  const subviewSwipe = useAndroidSwipeBack({
    onDismiss: () => {
      setActiveTab(prevTab);
    },
    enabled: isSubview,
    threshold: 80,
    edgeOnly: true,
    edgeWidth: 54,
  });

  const weightSwipe = useAndroidSwipeBack({
    onDismiss: () => setIsWeightModalOpen(false),
    enabled: isWeightModalOpen,
    edgeOnly: false,
    threshold: 64,
  });

  const subviewBackProgress = typeof window !== "undefined" && window.innerWidth > 0
    ? Math.min(1, subviewSwipe.dragX / (window.innerWidth * 0.75))
    : 0;

  const mainContentStyle: React.CSSProperties = isSubview
    ? {
        transform: `scale(${0.94 + subviewBackProgress * 0.06}) translateX(${-24 + subviewBackProgress * 24}px)`,
        transformOrigin: "center center",
        opacity: 0.7 + subviewBackProgress * 0.3,
        filter: `brightness(${0.75 + subviewBackProgress * 0.25})`,
        transition: subviewSwipe.isDragging ? "none" : "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s, filter 0.24s",
        willChange: "transform, opacity, filter",
        pointerEvents: "none",
        userSelect: "none",
      }
    : {
        transform: "none",
        opacity: 1,
        transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s",
      };
  const MAIN_NAV_TABS = ["dashboard", "library", "workout", "progress"] as const;
  const [tabDirection, setTabDirection] = useState<number>(0);
  const prevNavTabRef = useRef<string>(effectiveTab);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isWeightModalOpen) {
      const timer = setTimeout(() => {
        weightInputRef.current?.focus();
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isWeightModalOpen]);

  useEffect(() => {
    const oldIdx = MAIN_NAV_TABS.indexOf(prevNavTabRef.current as any);
    const newIdx = MAIN_NAV_TABS.indexOf(effectiveTab as any);
    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      setTabDirection(newIdx > oldIdx ? 1 : -1);
    }
    prevNavTabRef.current = effectiveTab;
  }, [effectiveTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMainTab || isSubview) return;
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [data-no-swipe], .overflow-x-auto, canvas, [role='slider']")) {
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || !isMainTab || isSubview) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      const currentIndex = MAIN_NAV_TABS.indexOf(effectiveTab as any);
      if (currentIndex === -1) return;

      if (deltaX < 0) {
        if (currentIndex < MAIN_NAV_TABS.length - 1) {
          triggerHaptic("selection");
          navigateTo(MAIN_NAV_TABS[currentIndex + 1]);
        }
      } else {
        if (currentIndex > 0) {
          triggerHaptic("selection");
          navigateTo(MAIN_NAV_TABS[currentIndex - 1]);
        }
      }
    }
  };

  const [pendingOtaUpdate, setPendingOtaUpdate] = useState<OtaManifest | null>(null);
  const [isOtaRestartConfirmOpen, setIsOtaRestartConfirmOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeOtaEvents((event) => {
      if (event.state === "ready" && event.manifest) {
        setPendingOtaUpdate(event.manifest);
      }
    });
    return unsubscribe;
  }, []);

  const handleApplyOtaNow = async () => {
    if (isLiveWorkoutActive) {
      setIsOtaRestartConfirmOpen(true);
      return;
    }
    triggerHaptic("success");
    await reloadOtaApp();
  };

  const renderSubview = () => {
    if (activeTab === "exercise_details" && activeExercise) {
      const canAdd = prevTab === "routine_editor" || prevTab === "live_editor";
      return (
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
    }
    if (activeTab === "routine_editor") {
      const r = activeRoutineId
        ? routines.find((x) => x.id === activeRoutineId)
        : undefined;
      const initial =
        (editingRoutineDraft && (!activeRoutineId || editingRoutineDraft.id === activeRoutineId))
          ? editingRoutineDraft
          : (r || editingRoutineDraft || undefined);
      return (
        <RoutineEditor
          unit={unit}
          t={t}
          exercises={exercises}
          initialRoutine={initial}
          onBack={() => {
            setEditingRoutineDraft(null);
            removeJsonAtomic("liftlab_routine_edit_draft");
            setActiveTab("workout");
          }}
          onSave={(updated) => handleSaveRoutine(updated, false)}
          mode="edit"
          onAddCustomExercise={handleAddExercise}
          restTimer={restTimer}
          setRestTimer={setAppRestTimer}
          onOpenDetail={handleOpenExerciseDetails}
          userName={userName}
          workoutLogs={workoutLogs}
          showRpe={showRpe}
          onDraftChange={setEditingRoutineDraft}
        />
      );
    }
    if (activeTab === "workout_summary") {
      return (
        <WorkoutSummaryView
          logData={lastWorkoutData}
          unit={unit}
          language={language}
          onBack={() => setActiveTab("workout")}
          t={t}
          workoutLogs={workoutLogs}
        />
      );
    }
    if (activeTab === "settings") {
      return (
        <Settings
          t={t}
          unit={unit}
          setUnit={handleToggleUnit}
          language={language}
          setLanguage={setAppLanguage}
          theme={theme}
          setTheme={setAppTheme}
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
    }
    if (activeTab === "add_exercise") {
      return (
        <AddExercise
          t={t}
          unit={unit}
          language={language}
          onBack={() => setActiveTab(prevTab)}
          onSave={handleAddExercise}
        />
      );
    }
    return null;
  };

  const currentSubview = renderSubview();
  if (currentSubview) {
    lastSubviewRef.current = currentSubview;
  }

  const renderAppContent = () => {

    return (
      <div
        className="app-shell bg-background text-on-background min-h-[100dvh] pb-24 sm:pb-24 lg:pb-0 lg:pl-24 overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[600] focus:rounded-xl focus:bg-primary-fixed focus:px-4 focus:py-3 focus:font-bold focus:text-black"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1} style={mainContentStyle}>
        {/* Main Content Area */}
        <div className="w-full touch-pan-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <AnimatePresence initial={false} custom={tabDirection} mode="wait">
            <motion.div
              key={effectiveTab}
              custom={tabDirection}
              variants={cartoonTabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
            {effectiveTab === "dashboard" && (
              <Dashboard
                userName={userName}
                language={language}
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
            {effectiveTab === "library" && (
              <React.Suspense fallback={null}>
                <Library
                  t={t}
                  unit={unit}
                  exercises={exercises}
                  isCatalogLoading={isExerciseCatalogLoading}
                  onAddExercise={() => navigateTo("add_exercise")}
                  onOpenDetail={handleOpenExerciseDetails}
                  onOpenSettings={() => navigateTo("settings")}
                />
              </React.Suspense>
            )}
            {effectiveTab === "workout" && (
              <Workout
                t={t}
                unit={unit}
                routines={routines}
                workoutLogs={workoutLogs}
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
            {effectiveTab === "progress" && (
              <React.Suspense fallback={null}>
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
              </React.Suspense>
            )}
          </motion.div>
        </AnimatePresence>

        <React.Suspense fallback={null}>
          {sharingRoutine && (
            <ShareRoutineModal
              routine={sharingRoutine}
              onClose={() => setSharingRoutine(null)}
              t={t}
            />
          )}
          {isImportCodeOpen && (
            <ImportRoutineModal
              exercises={exercises}
              onClose={() => setIsImportCodeOpen(false)}
              t={t}
              onImport={async (text) => {
                const parsedRoutines = parseLiftLabRoutineText(text, exercises) as RoutineData[];
                if (parsedRoutines.length === 0) {
                  throw new Error(t("no_routines_found") || "Nessuna routine trovata nel codice.");
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
                    ? `${t("routine_imported") || "Scheda importata"}: ${namesStr} (+${totalCustomCreated})`
                    : `${t("routine_imported") || "Scheda importata"}: ${namesStr}`,
                  "success",
                );
              }}
            />
          )}
        </React.Suspense>


        </div>
        </div>

        {/* Weight Modal */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isWeightModalOpen && (
                <motion.div
                  key="weight-modal-scrim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ opacity: weightSwipe.scrimOpacity }}
                  className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
                  onClick={() => setIsWeightModalOpen(false)}
                >
                  <motion.div
                    key="weight-modal-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="weight-dialog-title"
                    {...weightSwipe.swipeHandlers}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      ...weightSwipe.swipeStyle,
                      willChange: "transform",
                      transform: weightSwipe.dragX > 0 ? `translateX(${weightSwipe.dragX}px)` : "translateZ(0)",
                    }}
                    className="bg-[#24252c] border border-white/16 rounded-3xl w-full max-w-sm flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)] overflow-hidden relative will-change-transform transform-gpu select-none"
                    onClick={(e) => e.stopPropagation()}
                    data-mcp-action="log-weight"
                    data-mcp-description="Record daily morning body weight in kg or lbs"
                    data-mcp-params='{"required": ["weight"], "optional": ["unit"]}'
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
                          ref={weightInputRef}
                          type="number"
                          inputMode="decimal"
                          min="1"
                          max="1000"
                          step="0.1"
                          aria-label={`Body weight in ${unit}`}
                          data-mcp-param="weight"
                          data-mcp-description="Body weight numeric value"
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          className="w-full bg-transparent text-center text-6xl font-extrabold text-white tracking-tight tabular-nums focus:outline-none placeholder:text-neutral-700"
                          placeholder="00.0"
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

                    <div className="bg-[#1c1d24] px-6 py-3 border-t border-white/8 flex justify-center">
                      <p className="text-[11px] text-[#8E8E93] font-medium tracking-wide">
                        {currentWeight > 0 ? `Current: ${currentWeight} ${unit}` : "No weight logged yet"}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

        {showTutorial && (
          <React.Suspense fallback={null}>
            <OnboardingTutorial onFinish={finishTutorial} language={language} t={t} />
          </React.Suspense>
        )}

        {/* Apple-Style Floating Navigation Dock */}
        <div
          className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-[100dvh] lg:w-24 lg:p-0 lg:pointer-events-auto"
        >
          <nav
            aria-label="Primary navigation"
            className="apple-floating-dock pointer-events-auto w-full max-w-[390px] sm:max-w-md h-[64px] px-2 py-1.5 rounded-[28px] sm:rounded-full flex items-center justify-around gap-1 lg:max-w-none lg:w-full lg:h-full lg:rounded-none lg:flex-col lg:justify-center lg:gap-3 lg:px-3 lg:py-4 gpu-accelerated"
          >
            <div className="absolute top-6 hidden flex-col items-center gap-2 lg:flex" aria-hidden="true">
              <LiftLabMark sizeClass="w-11 h-11" withBackground={false} className="rounded-2xl shadow-md" />
              <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${theme === "nothing" ? "font-mono text-white/90" : "text-[#8E8E93]"}`}>
                {theme === "nothing" ? "LIFT ● LAB" : "LiftLab"}
              </span>
            </div>

            {[
              { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
              { id: "library", label: t("library"), icon: Database },
              { id: "workout", label: t("workout"), icon: Dumbbell },
              { id: "progress", label: t("progress"), icon: LucideLineChart },
            ].map((tab) => {
              const isActive = (isMainTab ? activeTab : effectiveTab) === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  onPointerDown={hapticPress("light")}
                  onClick={() => navigateTo(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={tab.label}
                  className="relative flex-1 min-h-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-2xl sm:rounded-full cursor-pointer select-none lg:min-h-[72px] lg:w-full lg:flex-initial transition-colors"
                >
                  {isActive && (
                    <>
                      {/* Active capsule backdrop */}
                      <motion.div
                        layoutId="apple-nav-active-pill"
                        className={
                          theme === "nothing"
                            ? "absolute inset-1 rounded-full bg-white/[0.08] border border-white/20 shadow-none"
                            : "absolute inset-1 rounded-2xl sm:rounded-full bg-[#30D158]/14 border border-[#30D158]/35 shadow-[0_0_12px_rgba(48,209,88,0.2)]"
                        }
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 32,
                        }}
                      />
                    </>
                  )}
                  <motion.div
                    whileTap={{ scale: 0.94 }}
                    className="relative z-10 flex flex-col items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-200 ${
                          theme === "nothing"
                            ? isActive ? "text-white" : "text-[#777777]"
                            : isActive ? "text-[#30D158]" : "text-[#8E8E93] group-hover:text-white"
                        }`}
                        fill={theme === "nothing" ? "none" : (isActive ? "currentColor" : "none")}
                        strokeWidth={1.5}
                      />
                    </motion.div>
                    <span
                      className={`text-[10px] sm:text-[10.5px] mt-1 transition-colors duration-150 ${
                        theme === "nothing"
                          ? `font-mono uppercase tracking-[0.08em] ${isActive ? "font-bold text-white" : "text-[#777777]"}`
                          : `tracking-tight ${isActive ? "font-bold text-[#30D158]" : "font-medium text-[#8E8E93]"}`
                      }`}
                    >
                      {tab.label}
                    </span>
                    {theme === "nothing" && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] mt-0.5 shadow-[0_0_6px_rgba(215,25,33,0.8)]" />
                    )}
                  </motion.div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Full-Screen Sliding Subviews with Native Android Predictive Back & Window Reveal */}
        <AnimatePresence>
          {isSubview && (
            <motion.div
              key={activeTab}
              initial={{ x: "100%", opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{
                x: "100%",
                opacity: 0.95,
                transition: { duration: 0.18, ease: [0.25, 1, 0.5, 1] },
              }}
              transition={{
                duration: 0.22,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="fixed inset-0 z-[120] bg-background overflow-y-auto"
              style={{
                willChange: "transform, opacity, border-radius",
                WebkitOverflowScrolling: "touch",
                pointerEvents: isSubview ? "auto" : "none",
                transform: subviewSwipe.dragX > 0 ? `translateX(${subviewSwipe.dragX}px)` : undefined,
                boxShadow: subviewSwipe.dragX > 0 ? "-18px 0 45px rgba(0, 0, 0, 0.75)" : undefined,
                borderRadius: subviewSwipe.dragX > 0 ? "24px 0 0 24px" : "0px",
                transition: subviewSwipe.isDragging ? "none" : "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.2s",
              }}
              {...subviewSwipe.swipeHandlers}
            >
              <React.Suspense fallback={null}>
                {currentSubview || lastSubviewRef.current}
              </React.Suspense>
            </motion.div>
          )}
        </AnimatePresence>

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

        <React.Suspense fallback={null}>
          <AnimatePresence>
            {showPrivacyPolicy && (
              <PrivacyPolicyModal onClose={() => setShowPrivacyPolicy(false)} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showTOS && (
              <TOSModal onClose={() => setShowTOS(false)} />
            )}
          </AnimatePresence>
        </React.Suspense>

        <AnimatePresence>
          {isDeleteAccountConfirmOpen && (
            <ConfirmModal
              title={language === "it" ? "Elimina Dati Locali" : language === "es" ? "Eliminar Datos" : "Delete Local Data"}
              message={t("deleteAccountConfirm") || "Eliminare tutti i dati locali?"}
              confirmLabel={language === "it" ? "Elimina Dati" : language === "es" ? "Eliminar Datos" : "Delete Data"}
              cancelLabel={t("cancel") || "Annulla"}
              destructive
              onConfirm={handleDeleteAccountConfirmed}
              onCancel={() => setIsDeleteAccountConfirmOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isImportBackupConfirmOpen && (
            <ConfirmModal
              title={language === "it" ? "Ripristina Backup" : language === "es" ? "Restaurar Copia" : "Restore Backup"}
              message={
                language === "it"
                  ? `Sovrascrivere i dati con questo backup (${pendingBackupData?.routines?.length || 0} schede, ${pendingBackupData?.logs?.length || 0} allenamenti)? Copia di sicurezza automatica salvata.`
                  : language === "es"
                    ? `¿Sobrescribir datos con esta copia (${pendingBackupData?.routines?.length || 0} rutinas, ${pendingBackupData?.logs?.length || 0} entrenamientos)?`
                    : `Overwrite data with this backup (${pendingBackupData?.routines?.length || 0} routines, ${pendingBackupData?.logs?.length || 0} workouts)?`
              }
              confirmLabel={language === "it" ? "Ripristina Backup" : language === "es" ? "Restaurar Copia" : "Restore Backup"}
              cancelLabel={t("cancel") || "Annulla"}
              destructive
              onConfirm={handleConfirmImportBackup}
              onCancel={handleCancelImportBackup}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isReplaceWorkoutConfirmOpen && (
            <ConfirmModal
              title={language === "it" ? "Sessione in Corso" : language === "es" ? "Sesión Activa" : "Active Workout"}
              message={
                language === "it"
                  ? "C'è un allenamento in corso. Annullarlo e iniziarne uno nuovo?"
                  : language === "es"
                    ? "Hay un entrenamiento activo. ¿Descartarlo y empezar uno nuevo?"
                    : "An active workout is in progress. Discard it and start a new one?"
              }
              confirmLabel={language === "it" ? "Annulla e Avvia" : language === "es" ? "Descartar e Iniciar" : "Discard and Start"}
              cancelLabel={language === "it" ? "Continua Sessione" : language === "es" ? "Mantener Sesión" : "Keep Session"}
              destructive
              onConfirm={handleConfirmReplaceWorkout}
              onCancel={() => {
                setIsReplaceWorkoutConfirmOpen(false);
                navigateTo("live_editor");
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOtaRestartConfirmOpen && (
            <ConfirmModal
              message={
                language === "it"
                  ? "Hai un allenamento attivo in corso. Riavviando l'app verrà applicato il nuovo aggiornamento. Vuoi riavviare comunque o al termine dell'allenamento?"
                  : language === "es"
                    ? "Tienes un entrenamiento activo. Al reiniciar la app se aplicará la nueva versión. ¿Quieres reiniciar de todos modos o al terminar?"
                    : "You have an active workout in progress. Restarting the app will apply the update. Restart now or after finishing?"
              }
              confirmLabel={language === "it" ? "Riavvia Comunque" : language === "es" ? "Reiniciar Ahora" : "Restart Anyway"}
              cancelLabel={language === "it" ? "Al Termine" : language === "es" ? "Al Terminar" : "Later"}
              onConfirm={async () => {
                setIsOtaRestartConfirmOpen(false);
                triggerHaptic("success");
                await reloadOtaApp();
              }}
              onCancel={() => {
                setIsOtaRestartConfirmOpen(false);
                showToast(
                  language === "it"
                    ? "L'aggiornamento verrà applicato al prossimo riavvio."
                    : "The update will be applied on the next launch.",
                  "info"
                );
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
      <>
      <ToastViewport />

      {/* In-App Live Update Notification Banner */}
      <AnimatePresence>
        {pendingOtaUpdate && (
          <motion.div
            key="ota-ready-banner"
            role="status"
            aria-live="polite"
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={CARTOON_SPRINGS.bouncy}
            className="fixed top-2 inset-x-3 sm:inset-x-auto sm:right-4 sm:max-w-md z-[500] p-3.5 bg-[#24252c]/95 backdrop-blur-2xl border border-[#30D158]/50 shadow-[0_16px_48px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-2xl flex items-center justify-between gap-3 text-white"
            style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#30D158]/20 flex items-center justify-center shrink-0 text-[#30D158]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-0.5">
                  LiftLab v{pendingOtaUpdate.version}
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#30D158]/20 text-[#30D158] font-bold rounded-full">OTA</span>
                </span>
                <div className="max-h-20 overflow-y-auto pr-1">
                  <OtaNotesView
                    notes={pendingOtaUpdate.notes || "• **Aggiornamento pronto**: tocca Riavvia per applicare le novità."}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleApplyOtaNow}
                className="px-3.5 py-1.5 bg-[#30D158] text-black text-xs font-black rounded-xl cursor-pointer shadow-[0_2px_12px_rgba(48,209,88,0.3)] active:scale-95"
              >
                Riavvia
              </motion.button>
              <button
                type="button"
                onClick={() => setPendingOtaUpdate(null)}
                className="p-1 text-[#8E8E93] hover:text-white rounded-lg cursor-pointer"
                aria-label="Chiudi notifica aggiornamento"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: activeTab === "live_editor" ? "block" : "none" }}>
        {isLiveWorkoutActive && (
          <div key={`live_${liveWorkoutKey}`}>
            <React.Suspense fallback={null}>
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
            </React.Suspense>
          </div>
        )}
      </div>

      <div style={{ display: activeTab !== "live_editor" ? "block" : "none" }}>{renderAppContent()}</div>

      <AnimatePresence>
        {isLiveWorkoutActive && activeTab !== "live_editor" && (
          <motion.button
            key="live-session-pill"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.9, rotate: -2 }}
            transition={CARTOON_SPRINGS.bouncy}
            onClick={() => {
              triggerHaptic("medium");
              setActiveTab("live_editor");
            }}
            aria-label="Return to active workout"
            className="fixed bottom-20 right-4 z-[100] bg-[#24252c]/95 backdrop-blur-2xl border border-[#30D158]/50 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex items-center gap-2.5 transition-all cursor-pointer group lg:bottom-6 lg:right-6"
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
          </motion.button>
        )}
      </AnimatePresence>

      {/* Save as Routine Modal */}
      <AnimatePresence>
        {isEmptyPromptOpen && (
          <motion.div
            key="save-routine-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              key="save-routine-card"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "transform", transform: "translateZ(0)" }}
              className="bg-[#121418] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] will-change-transform transform-gpu"
            >
              <div className="p-7 text-center">
                <div className="w-14 h-14 bg-[#30D158]/15 rounded-full flex items-center justify-center text-[#30D158] mx-auto mb-4 border border-[#30D158]/25 shadow-[0_0_24px_rgba(48,209,88,0.2)]">
                  <Save className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                  {t("workout_completed")}
                </h2>
                <p className="text-xs text-[#8E8E93] mb-6">
                  {language === "it"
                    ? "Vuoi salvare questa sessione come scheda abituale per il futuro?"
                    : language === "es"
                      ? "¿Deseas guardar esta sesión como una rutina habitual para el futuro?"
                      : "Would you like to save this session as a regular routine for future use?"}
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    data-testid="modal-save-routine-btn"
                    onClick={() => {
                      triggerHaptic("success");
                      handleConfirmEmptySave(true);
                    }}
                    disabled={isConfirming}
                    className={`w-full min-h-[44px] bg-[#30D158] text-black font-bold py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all text-sm tracking-tight shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2 cursor-pointer ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isConfirming ? (
                      <div className="flex items-center gap-2" role="status" aria-label={t("saving") || "Saving..."}>
                        <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-30" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black" />
                        </span>
                        {t("saving") || "Saving..."}
                      </div>
                    ) : (
                      t("save_as_routine")
                    )}
                  </button>
                  <button
                    data-testid="modal-log-only-btn"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Routine Template Modal */}
      <AnimatePresence>
        {isUpdateTemplatePromptOpen && (
          <motion.div
            key="update-template-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              key="update-template-card"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "transform", transform: "translateZ(0)" }}
              className="bg-[#121418] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] will-change-transform transform-gpu"
            >
              <div className="p-7 text-center">
                <div className="w-14 h-14 bg-[#30D158]/15 rounded-full flex items-center justify-center text-[#30D158] mx-auto mb-4 border border-[#30D158]/25 shadow-[0_0_24px_rgba(48,209,88,0.2)]">
                  <Save className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                  {t("workout_completed")}
                </h2>
                <p className="text-xs text-[#8E8E93] mb-6">
                  {language === "it"
                    ? "Hai modificato serie o esercizi. Vuoi aggiornare la scheda abituale con queste modifiche?"
                    : language === "es"
                      ? "¿Deseas actualizar la rutina habitual con estos cambios?"
                      : "You modified sets or exercises. Would you like to update the routine template with these changes?"}
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    data-testid="modal-update-template-btn"
                    onClick={() => {
                      triggerHaptic("success");
                      handleConfirmUpdateTemplate(true);
                    }}
                    disabled={isConfirming}
                    className={`w-full min-h-[44px] bg-[#30D158] text-black font-bold py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all text-sm tracking-tight shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2 cursor-pointer ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isConfirming ? (
                      <div className="flex items-center gap-2" role="status" aria-label={t("saving") || "Saving..."}>
                        <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-30" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black" />
                        </span>
                        {t("saving") || "Saving..."}
                      </div>
                    ) : (
                      language === "it" ? "Aggiorna Scheda" : language === "es" ? "Actualizar Rutina" : "Update Routine"
                    )}
                  </button>
                  <button
                    data-testid="modal-log-only-template-btn"
                    onClick={() => {
                      triggerHaptic("light");
                      handleConfirmUpdateTemplate(false);
                    }}
                    disabled={isConfirming}
                    className={`w-full min-h-[44px] bg-white/10 text-white font-semibold py-3.5 rounded-full hover:bg-white/15 text-sm tracking-tight active:scale-95 transition-all cursor-pointer flex items-center justify-center ${isConfirming ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {t("log_only")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
  );
}
