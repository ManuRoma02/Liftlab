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
   * Critically damped default: damping: 1.0, duration 0.32s, bounce 0 (zero overshoot).
   * Used for layout transitions, modal reveals, and cards.
   */
  criticallyDamped: {
    type: "spring" as const,
    duration: 0.32,
    bounce: 0,
  },
  /**
   * Sheet drag and dismiss: duration 0.32s, bounce 0.05.
   * Used for iOS bottom sheets, slide-overs, and drag-to-dismiss gestures.
   */
  sheet: {
    type: "spring" as const,
    duration: 0.32,
    bounce: 0.05,
  },
  /**
   * Snappy micro-interaction: damping: 1.0, duration 0.22s, bounce 0.
   * Used for toggles, steppers, segmented controls, and button presses.
   */
  snappy: {
    type: "spring" as const,
    duration: 0.22,
    bounce: 0,
  },
  /**
   * Bouncy celebration / badge reveal: duration 0.4s, bounce 0.16.
   * Used for trophies, achievement badges, and celebratory reveals.
   */
  bouncy: {
    type: "spring" as const,
    duration: 0.4,
    bounce: 0.16,
  },
} as const;

export type AppleSpringKey = keyof typeof APPLE_SPRINGS;

// Ergonomic named aliases
export const appleSpringDefault = APPLE_SPRINGS.criticallyDamped;
export const appleSpringSheet = APPLE_SPRINGS.sheet;
export const appleSpringSnappy = APPLE_SPRINGS.snappy;
export const appleSpringBouncy = APPLE_SPRINGS.bouncy;

/**
 * Cartoon & Juicy Spring Configurations.
 * Grounded in Emil Kowalski's micro-interaction physics + cartoon squash & stretch:
 * - High kinetic response on tap
 * - Organic bouncy overshoot on completion, rewards, and transitions
 * - Never scale from 0 (always 0.88-0.95 to 1)
 */
export const CARTOON_SPRINGS = {
  /**
   * Juicy Cartoon Bounce (playful, tactile, elastic).
   */
  bouncy: {
    type: "spring" as const,
    stiffness: 420,
    damping: 14,
    mass: 0.7,
  },
  /**
   * Snappy Pop (instant feedback on buttons and toggles).
   */
  pop: {
    type: "spring" as const,
    stiffness: 520,
    damping: 16,
    mass: 0.5,
  },
  /**
   * Cartoon Wobble (fun playful celebration on trophies and achievements).
   */
  wobble: {
    type: "spring" as const,
    stiffness: 320,
    damping: 11,
    mass: 0.8,
  },
  /**
   * Smooth Liquid View Transition (for tabs, sheets, and dialogs).
   */
  liquid: {
    type: "spring" as const,
    stiffness: 350,
    damping: 24,
    mass: 0.75,
  },
} as const;

export const cartoonSpringBouncy = CARTOON_SPRINGS.bouncy;
export const cartoonSpringPop = CARTOON_SPRINGS.pop;
export const cartoonSpringWobble = CARTOON_SPRINGS.wobble;
export const cartoonSpringLiquid = CARTOON_SPRINGS.liquid;

/**
 * Cartoon Keyframe Transition Curves.
 * Tuned for multi-step keyframe sequences (e.g. scale [1, 1.25, 0.92, 1.05, 1])
 * where Framer Motion requires explicit duration and easing curves.
 * Uses elastic overshoots (cubic-bezier) so animations remain clearly perceptible
 * and juicy to the human eye without feeling sluggish or jittery.
 */
export const CARTOON_KEYFRAMES = {
  /**
   * Elastic snap for checkmarks, badges, and toggle pops (420ms).
   */
  pop: {
    duration: 0.42,
    ease: [0.34, 1.56, 0.64, 1] as const,
  },
  /**
   * Full elastic bounce for completed set buttons and celebrate events (460ms).
   */
  elastic: {
    duration: 0.46,
    ease: [0.34, 1.6, 0.64, 1] as const,
  },
  /**
   * Playful cartoon wobble for stars, favorites, and trophies (480ms).
   */
  wobble: {
    duration: 0.48,
    ease: [0.34, 1.45, 0.64, 1] as const,
  },
  /**
   * Expanding celebration ripple ring (480ms).
   */
  ripple: {
    duration: 0.48,
    ease: "easeOut" as const,
  },
} as const;

/**
 * Micro-Interaction Gestures
 */
export const cartoonTapButton = {
  scale: 0.92,
  transition: { type: "spring", stiffness: 500, damping: 15 },
};

export const cartoonTapCard = {
  scale: 0.97,
  transition: { type: "spring", stiffness: 450, damping: 18 },
};

export const cartoonHoverButton = {
  scale: 1.03,
  y: -1,
  transition: { type: "spring", stiffness: 400, damping: 14 },
};

/**
 * Cartoon View & Modal Transition Variants
 */
export const cartoonPopInVariants = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: -8 },
  transition: CARTOON_SPRINGS.bouncy,
};

export const cartoonTabVariants = {
  initial: { opacity: 0, scale: 0.985 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.16, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: { duration: 0.08, ease: "easeIn" },
  },
};


