/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error";

export const HAPTICS_STORAGE_KEY = "liftlab_haptics_enabled";

let cachedCapacitorHaptics: any = null;

// Attempt dynamic lookup of Capacitor Haptics plugin
function getCapacitorHaptics(): any {
  if (cachedCapacitorHaptics) return cachedCapacitorHaptics;
  if (typeof window !== "undefined") {
    const win = window as any;
    if (win.Capacitor?.isPluginAvailable?.("Haptics") && win.Capacitor?.Plugins?.Haptics) {
      cachedCapacitorHaptics = win.Capacitor.Plugins.Haptics;
      return cachedCapacitorHaptics;
    }
  }
  return null;
}

// Background dynamic import for native bundle environments
if (typeof window !== "undefined") {
  try {
    const capacitorHapticsPkg = "@capacitor/haptics";
    import(/* @vite-ignore */ capacitorHapticsPkg)
      .then((mod) => {
        if (mod?.Haptics) {
          cachedCapacitorHaptics = mod.Haptics;
        }
      })
      .catch(() => {
        // Plugin not packaged in web bundle; standard fallback used
      });
  } catch {
    // Ignore environments where dynamic import is unavailable
  }
}

/**
 * Returns whether haptic feedback is currently enabled by user settings.
 * Defaults to true if no preference is stored.
 */
export function isHapticsEnabled(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    const val = localStorage.getItem(HAPTICS_STORAGE_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

/**
 * Persists the user's haptic feedback preference to localStorage.
 */
export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent("liftlab:haptics-changed", { detail: { enabled } })
    );
  } catch (error) {
    console.error("Failed to persist haptics preference:", error);
  }
}

/**
 * Triggers tactile haptic feedback matching Apple iOS physical patterns.
 * Supports native Capacitor Haptics, Android navigator.vibrate, and silent WebKit fallback.
 */
export function triggerHaptic(style: HapticStyle = "light"): void {
  if (!isHapticsEnabled()) return;
  if (typeof window === "undefined") return;

  // 1. Native Capacitor Haptics (iOS Taptic Engine / Android LRA)
  const capHaptics = getCapacitorHaptics();
  if (capHaptics) {
    try {
      switch (style) {
        case "light":
          capHaptics.impact({ style: "LIGHT" });
          return;
        case "medium":
          capHaptics.impact({ style: "MEDIUM" });
          return;
        case "heavy":
          capHaptics.impact({ style: "HEAVY" });
          return;
        case "selection":
          if (typeof capHaptics.selectionChanged === "function") {
            capHaptics.selectionChanged();
          } else {
            capHaptics.impact({ style: "LIGHT" });
          }
          return;
        case "success":
          capHaptics.notification({ type: "SUCCESS" });
          return;
        case "warning":
          capHaptics.notification({ type: "WARNING" });
          return;
        case "error":
          capHaptics.notification({ type: "ERROR" });
          return;
        default:
          capHaptics.impact({ style: "LIGHT" });
          return;
      }
    } catch {
      // Fallback to web vibration on failure
    }
  }

  // 2. WebKit / Android Web Vibration API fallback
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      switch (style) {
        case "light":
          navigator.vibrate(8);
          break;
        case "selection":
          navigator.vibrate(5);
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
        case "error":
          navigator.vibrate([40, 60, 40, 60, 40]);
          break;
        default:
          navigator.vibrate(8);
      }
    } catch {
      // Gracefully ignore browser restriction or policy denials
    }
  }

  // 3. WebKit Safari Desktop/iOS fallback: gracefully handles absence of navigator.vibrate
}

/**
 * Instant pointer-down feedback helper.
 * Eliminates the 100-300ms touch-up delay by firing haptics the moment the pointer makes contact.
 *
 * Supported patterns:
 * - `onPointerDown={() => hapticPress("light")}`
 * - `onPointerDown={hapticPress("light")}`
 * - `onPointerDown={hapticPress}`
 */
export function hapticPress(
  styleOrEvent?: HapticStyle | unknown,
  defaultStyle: HapticStyle = "light"
): ((event?: unknown) => void) | void {
  if (typeof styleOrEvent === "string") {
    triggerHaptic(styleOrEvent as HapticStyle);
    return () => triggerHaptic(styleOrEvent as HapticStyle);
  }
  triggerHaptic(defaultStyle);
}
