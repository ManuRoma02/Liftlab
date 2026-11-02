/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

export type ModalDismissHandler = () => void;

/**
 * In-memory LIFO stack of active modal dismiss handlers.
 * The topmost modal is at the end of the array (stack.length - 1).
 */
const modalStack: ModalDismissHandler[] = [];

/**
 * Registers a modal dismiss handler onto the LIFO stack.
 * Returns an unregister cleanup function.
 */
export function pushModal(handler: ModalDismissHandler): () => void {
  modalStack.push(handler);
  return () => {
    const idx = modalStack.lastIndexOf(handler);
    if (idx !== -1) {
      modalStack.splice(idx, 1);
    }
  };
}

/**
 * Pops and executes the topmost modal dismiss handler.
 * Returns true if a modal was dismissed, false if stack was empty.
 */
export function popAndDismiss(): boolean {
  if (modalStack.length === 0) return false;
  const topHandler = modalStack.pop();
  if (topHandler) {
    topHandler();
    return true;
  }
  return false;
}

/**
 * Returns current depth of the modal stack (useful for assertions and debug).
 */
export function getModalStackDepth(): number {
  return modalStack.length;
}

/**
 * Clears the modal stack. Strictly for testing teardown.
 */
export function _resetModalStackForTesting(): void {
  modalStack.length = 0;
}

// Global Event Listeners (Registered once at module initialization)
if (typeof window !== "undefined") {
  // Coordinated Keyboard Escape Listener
  window.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalStack.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        popAndDismiss();
      }
    },
    { capture: true } // Capture phase ensures topmost modal intercepts before child event handlers
  );

  // Coordinated Capacitor / Android Hardware Back Button Listener
  window.addEventListener("liftlab:back", (event: Event) => {
    if (event.defaultPrevented) return;
    if (modalStack.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      popAndDismiss();
    }
  });
}

/**
 * React Hook for declarative modal registration with the unified LIFO stack.
 *
 * @param isActive Whether the modal is currently open and active
 * @param onDismiss Callback invoked when Escape or hardware back dismisses this modal
 */
export function useModalDismiss(isActive: boolean, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!isActive) return;
    return pushModal(() => onDismissRef.current());
  }, [isActive]);
}

/**
 * Alias for backward compatibility with existing code importing useBackDismiss.
 */
export const useBackDismiss = useModalDismiss;
