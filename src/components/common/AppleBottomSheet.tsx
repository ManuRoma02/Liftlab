/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { APPLE_SPRINGS } from "../../lib/motion";
import { triggerHaptic, hapticPress } from "../../lib/haptics";
import { useBackDismiss } from "./ConfirmModal";

export interface AppleBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string; // default: "max-h-[85vh]"
  maxWidth?: string;  // default: "max-w-xl"
  className?: string;
  showCloseButton?: boolean;
  showDragHandle?: boolean;
  headerAction?: React.ReactNode;
}

/**
 * AppleBottomSheet — Unified Apple HIG Bottom Sheet & Dialog Component.
 *
 * Implements Apple Design WWDC guidelines:
 * - Mobile (< md): Anchored to bottom, rounded-t-[32px], drag handle pill, direct manipulation drag-to-dismiss.
 * - Desktop/Tablet (>= md): Ergonomic centered modal with rounded-3xl and subtle glass border.
 * - Critically damped spring enter/exit transitions (APPLE_SPRINGS.sheet).
 * - Full integration with useBackDismiss for Android hardware back button and iOS back swipe.
 * - Full safe-area inset compliance (env(safe-area-inset-bottom)).
 * - 44x44pt accessible touch targets on close actions.
 */
export function AppleBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = "max-h-[85vh]",
  maxWidth = "max-w-xl",
  className = "",
  showCloseButton = true,
  showDragHandle = true,
  headerAction,
}: AppleBottomSheetProps) {
  const dragControls = useDragControls();

  // Hardware and gesture back dismiss integration
  useBackDismiss(isOpen, onClose);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 pointer-events-none">
          {/* Translucent Backdrop Dimming Scrim */}
          <motion.div
            key="apple-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
            aria-hidden="true"
          />

          {/* Modal Sheet Container */}
          <motion.div
            key="apple-sheet-container"
            role="dialog"
            aria-modal="true"
            aria-label={title || "Modal sheet"}
            initial={{ y: "100%", opacity: 0.95 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.95 }}
            transition={APPLE_SPRINGS.sheet}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              // Dismiss if dragged down beyond threshold or flicked downwards
              if (info.offset.y > 80 || info.velocity.y > 300) {
                triggerHaptic("light");
                onClose();
              }
            }}
            className={`pointer-events-auto w-full ${maxWidth} ${maxHeight} flex flex-col overflow-hidden bg-[#1C1C1E]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.16)] rounded-t-[32px] md:rounded-3xl md:border md:border-white/10 md:shadow-2xl pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:pb-6 relative ${className}`}
          >
            {/* Top Drag Handle Header (Interactive Direct Manipulation Area) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full shrink-0 select-none cursor-grab active:cursor-grabbing touch-none pt-3 pb-1"
            >
              {showDragHandle && (
                <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-2 md:hidden" />
              )}

              {/* Title & Action Bar */}
              {(title || showCloseButton || headerAction) && (
                <div className="flex items-center justify-between px-6 pt-1 pb-2">
                  <div className="min-w-0 flex-1 pr-3">
                    {title && (
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {headerAction}
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          onClose();
                        }}
                        aria-label="Close"
                        className="w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Sheet Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-1 text-on-surface">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
