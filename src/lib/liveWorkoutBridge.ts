import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface LiveWorkoutOptions {
  currentExercise?: string;
  currentSetInfo?: string;
  restRemainingSeconds?: number;
  isResting?: boolean;
  setNumber?: number;
  totalSets?: number;
  defaultRestSeconds?: number;
  weightRepsInfo?: string;
  isRestFinished?: boolean;
}

export interface LiveWorkoutPluginInterface {
  startLiveService(options: LiveWorkoutOptions): Promise<void>;
  updateLiveService(options: LiveWorkoutOptions): Promise<void>;
  stopLiveService(): Promise<void>;
  drainPendingActions(): Promise<{ action?: string }>;
  addListener(
    eventName: "notificationAction",
    listenerFunc: (info: { action: string; timestamp: number }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

const LiveWorkoutNative = registerPlugin<LiveWorkoutPluginInterface>("LiveWorkoutPlugin");

export const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export type LiveNotificationResult = {
  ok: boolean;
  permissionDenied: boolean;
};

export const startLiveWorkoutNotification = async (
  options: LiveWorkoutOptions,
): Promise<LiveNotificationResult> => {
  if (!isNativeAndroid()) {
    return { ok: true, permissionDenied: false };
  }

  let permissionDenied = false;
  try {
    const perm = await LocalNotifications.requestPermissions();
    permissionDenied = perm.display !== "granted";
  } catch {
    permissionDenied = true;
  }

  try {
    await LiveWorkoutNative.startLiveService(options);
    return { ok: true, permissionDenied };
  } catch (e) {
    console.warn("Could not start native LiveWorkoutService:", e);
    return { ok: false, permissionDenied };
  }
};

export const updateLiveWorkoutNotification = async (
  options: LiveWorkoutOptions,
): Promise<boolean> => {
  if (!isNativeAndroid()) return true;
  try {
    await LiveWorkoutNative.updateLiveService(options);
    return true;
  } catch (e) {
    console.warn("Could not update native LiveWorkoutService:", e);
    return false;
  }
};

export const stopLiveWorkoutNotification = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return true;
  try {
    await LiveWorkoutNative.stopLiveService();
    return true;
  } catch (e) {
    console.warn("Could not stop native LiveWorkoutService:", e);
    try {
      await LiveWorkoutNative.stopLiveService();
      return true;
    } catch (retryError) {
      console.warn("Retry stopLiveService failed:", retryError);
      return false;
    }
  }
};

export const drainPendingLiveWorkoutActions = async (): Promise<string | null> => {
  if (!isNativeAndroid()) return null;
  try {
    const result = await LiveWorkoutNative.drainPendingActions();
    return result?.action || null;
  } catch (e) {
    console.warn("Could not drain pending live workout actions:", e);
    return null;
  }
};

export const addLiveWorkoutActionListener = (
  callback: (action: string) => void,
) => {
  if (!isNativeAndroid()) {
    return { remove: async () => {} };
  }

  const handlePromise = LiveWorkoutNative.addListener("notificationAction", (info) => {
    if (info && info.action) {
      callback(info.action);
    }
  }).then(async (handle) => {
    await drainPendingLiveWorkoutActions();
    return handle;
  });

  return {
    remove: async () => {
      try {
        const handle = await handlePromise;
        await handle.remove();
      } catch (e) {
        console.warn("Could not remove live workout action listener:", e);
      }
    },
  };
};
