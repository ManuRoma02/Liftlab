/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect, type TouchEvent } from "react";
import { triggerHaptic } from "./haptics";

export interface AndroidSwipeBackOptions {
  onDismiss: () => void;
  enabled?: boolean;
  threshold?: number;
  edgeOnly?: boolean;
  edgeWidth?: number;
}

export function useAndroidSwipeBack({
  onDismiss,
  enabled = true,
  threshold = 72,
  edgeOnly = true,
  edgeWidth = 48,
}: AndroidSwipeBackOptions) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isDismissing || e.touches.length !== 1) return;
      const touch = e.touches[0];

      // If edgeOnly, check that touch started near left edge
      if (edgeOnly && touch.clientX > edgeWidth) {
        startXRef.current = null;
        startYRef.current = null;
        return;
      }

      // Check if user is interacting with form controls or no-swipe areas
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, [data-no-swipe], .overflow-x-auto, canvas, [role='slider'], button"
        ) &&
        !edgeOnly
      ) {
        return;
      }

      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = Date.now();
      isHorizontalSwipeRef.current = false;
      setIsDragging(false);
    },
    [enabled, isDismissing, edgeOnly, edgeWidth]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startXRef.current === null || startYRef.current === null || isDismissing) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = Math.abs(touch.clientY - startYRef.current);

      // Only allow dragging to the right (deltaX > 0)
      if (deltaX <= 0) {
        if (dragX > 0) setDragX(0);
        return;
      }

      // Detect horizontal dominance
      if (!isHorizontalSwipeRef.current) {
        if (deltaX > 8 && deltaX > deltaY * 1.2) {
          isHorizontalSwipeRef.current = true;
          setIsDragging(true);
        } else if (deltaY > 10) {
          // Vertical scroll dominant, abort gesture
          startXRef.current = null;
          startYRef.current = null;
          return;
        }
      }

      if (isHorizontalSwipeRef.current) {
        // Apply slight resistance for fluid native feel
        const resistance = deltaX > 200 ? 200 + (deltaX - 200) * 0.6 : deltaX;
        setDragX(Math.max(0, resistance));
      }
    },
    [dragX, isDismissing]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (startXRef.current === null || isDismissing) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaTime = Math.max(1, Date.now() - startTimeRef.current);
      const velocityX = (deltaX / deltaTime) * 1000; // px/sec

      startXRef.current = null;
      startYRef.current = null;
      setIsDragging(false);

      if (isHorizontalSwipeRef.current && (deltaX >= threshold || velocityX >= 350)) {
        // Trigger dismiss animation
        setIsDismissing(true);
        const exitTarget = typeof window !== "undefined" ? window.innerWidth : 600;
        setDragX(exitTarget);
        triggerHaptic("light");
        setTimeout(() => {
          onDismissRef.current();
          setIsDismissing(false);
          setDragX(0);
        }, 220);
      } else {
        // Snap back to 0
        setDragX(0);
      }
      isHorizontalSwipeRef.current = false;
    },
    [isDismissing, threshold]
  );

  const onTouchCancel = useCallback(() => {
    startXRef.current = null;
    startYRef.current = null;
    isHorizontalSwipeRef.current = false;
    setIsDragging(false);
    setDragX(0);
  }, []);

  // Opacity of backdrop scrim fading as window is dragged away
  const scrimOpacity = Math.max(0, 1 - (dragX / 300) * 0.7);

  // Style applied to the sliding window/card
  const swipeStyle = {
    transform: dragX > 0 ? `translateX(${dragX}px)` : undefined,
    transition: isDragging
      ? "none"
      : "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "transform",
    boxShadow: dragX > 0 ? "-16px 0 40px rgba(0, 0, 0, 0.65)" : undefined,
  };

  return {
    dragX,
    isDragging,
    isDismissing,
    scrimOpacity,
    swipeStyle,
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  };
}
