/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standardized Apple iOS Spring Configurations.
 * Grounded in Apple HIG and WWDC Designing Fluid Interfaces guidelines:
 * - Critically damped (damping 1.0) eliminates distracting visual oscillations
 * - Bounce is reserved strictly for momentum-driven physical releases (sheets, flicks)
 */
export const APPLE_SPRINGS = {
  /**
   * Critically damped default: damping 1.0, duration 0.35s (no overshoot/bounce).
   * Used for layout transitions, modal reveals, and cards.
   */
  criticallyDamped: {
    type: "spring" as const,
    damping: 1.0,
    duration: 0.35,
    bounce: 0,
  },
  /**
   * Sheet drag and dismiss: damping 0.85, duration 0.32s, bounce 0.05.
   * Used for iOS bottom sheets, slide-overs, and drag-to-dismiss gestures.
   */
  sheet: {
    type: "spring" as const,
    damping: 0.85,
    duration: 0.32,
    bounce: 0.05,
  },
  /**
   * Snappy micro-interaction: damping 1.0, duration 0.25s, bounce 0.
   * Used for toggles, steppers, segmented controls, and button presses.
   */
  snappy: {
    type: "spring" as const,
    damping: 1.0,
    duration: 0.25,
    bounce: 0,
  },
  /**
   * Bouncy celebration / badge reveal: damping 0.75, duration 0.45s, bounce 0.18.
   * Used for trophies, achievement badges, and celebratory reveals.
   */
  bouncy: {
    type: "spring" as const,
    damping: 0.75,
    duration: 0.45,
    bounce: 0.18,
  },
} as const;

export type AppleSpringKey = keyof typeof APPLE_SPRINGS;

// Ergonomic named aliases
export const appleSpringDefault = APPLE_SPRINGS.criticallyDamped;
export const appleSpringSheet = APPLE_SPRINGS.sheet;
export const appleSpringSnappy = APPLE_SPRINGS.snappy;
export const appleSpringBouncy = APPLE_SPRINGS.bouncy;
