/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning" = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (type) {
      case "light":
        navigator.vibrate(8);
        break;
      case "medium":
        navigator.vibrate(16);
        break;
      case "heavy":
        navigator.vibrate(28);
        break;
      case "success":
        navigator.vibrate([12, 40, 24]);
        break;
      case "warning":
        navigator.vibrate([25, 50, 25]);
        break;
      default:
        navigator.vibrate(8);
    }
  } catch {
    // Gracefully ignore if vibration is restricted by browser policy
  }
}
