/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater, type BundleInfo } from "@capgo/capacitor-updater";
import { APP_VERSION } from "./version";
import { showToast } from "./toast";
import { triggerHaptic } from "./haptics";

export const DEFAULT_MANIFEST_URL =
  "https://raw.githubusercontent.com/ManuRoma02/Liftlab/main/update-manifest.json";

export const FALLBACK_MANIFEST_URLS: string[] = [
  "https://raw.githubusercontent.com/ManuRoma02/Liftlab/main/updates/update-manifest.json",
];

export const OTA_MANIFEST_URL_STORAGE_KEY = "liftlab_ota_manifest_url";
export const OTA_AUTOCHECK_STORAGE_KEY = "liftlab_ota_autocheck";

export interface OtaManifest {
  version: string;
  url: string;
  checksum: string;
  releaseDate?: string;
  notes?: string;
  minNativeVersion?: string;
  bundleSizeMb?: string;
}

export interface OtaStatus {
  version: string;
  bundleId: string;
  isBuiltin: boolean;
  nativeVersion: string;
}

export interface CheckUpdateResult {
  available: boolean;
  manifest?: OtaManifest;
  currentVersion: string;
  error?: string;
}

export type OtaState = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export interface OtaEventPayload {
  state: OtaState;
  manifest?: OtaManifest;
  currentVersion: string;
  error?: string;
}

// Reactive subscriber system for in-app UI updates
type OtaListener = (event: OtaEventPayload) => void;
const otaListeners = new Set<OtaListener>();
let lastOtaEvent: OtaEventPayload | null = null;

export function subscribeOtaEvents(listener: OtaListener): () => void {
  otaListeners.add(listener);
  if (lastOtaEvent) {
    try {
      listener(lastOtaEvent);
    } catch {}
  }
  return () => otaListeners.delete(listener);
}

export function emitOtaEvent(event: OtaEventPayload): void {
  lastOtaEvent = event;
  for (const listener of otaListeners) {
    try {
      listener(event);
    } catch (e) {
      console.warn("[OTA] Listener error:", e);
    }
  }
}

export function getLastOtaEvent(): OtaEventPayload | null {
  return lastOtaEvent;
}

/**
 * Compare two SemVer version strings (e.g. "1.0.1" vs "1.0.0").
 * Returns true if remote is strictly newer than current.
 */
export function isVersionNewer(remoteVersion: string, currentVersion: string): boolean {
  if (!remoteVersion || !currentVersion) return false;
  if (remoteVersion.trim() === currentVersion.trim()) return false;

  const clean = (v: string) => v.replace(/^v/i, "").trim();
  const remoteParts = clean(remoteVersion).split(".").map((n) => parseInt(n, 10) || 0);
  const currentParts = clean(currentVersion).split(".").map((n) => parseInt(n, 10) || 0);

  const length = Math.max(remoteParts.length, currentParts.length);
  for (let i = 0; i < length; i++) {
    const r = remoteParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export function isValidManifestUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("https://")) return true;
  // Allow loopback or local LAN addresses for development/testing
  if (/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?\//i.test(trimmed)) {
    return true;
  }
  return false;
}

export function getOtaManifestUrl(): string {
  try {
    const custom = localStorage.getItem(OTA_MANIFEST_URL_STORAGE_KEY);
    if (custom && isValidManifestUrl(custom)) {
      return custom.trim();
    }
  } catch {}
  return DEFAULT_MANIFEST_URL;
}

export function setOtaManifestUrl(url: string | null): void {
  try {
    if (!url || url.trim() === "" || url.trim() === DEFAULT_MANIFEST_URL) {
      localStorage.removeItem(OTA_MANIFEST_URL_STORAGE_KEY);
    } else if (isValidManifestUrl(url)) {
      localStorage.setItem(OTA_MANIFEST_URL_STORAGE_KEY, url.trim());
    } else {
      showToast("L'URL del manifest deve utilizzare il protocollo sicuro HTTPS.", "error");
    }
  } catch {}
}

export function isOtaAutoCheckEnabled(): boolean {
  try {
    return localStorage.getItem(OTA_AUTOCHECK_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setOtaAutoCheckEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(OTA_AUTOCHECK_STORAGE_KEY, enabled ? "true" : "false");
  } catch {}
}

/**
 * Initialize OTA subsystem.
 * Must be called early on app boot so CapacitorUpdater marks the active bundle as healthy.
 * Automatically checks and pre-downloads live bundles in the background if enabled.
 */
export async function initOta(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Notify native updater that web context is healthy.
    // If this is not called within appReadyTimeout, CapacitorUpdater rolls back.
    await CapacitorUpdater.notifyAppReady();
    console.log("[OTA] notifyAppReady() confirmed active bundle.");

    // Check if an update bundle was already staged on previous session
    try {
      const nextBundle = await CapacitorUpdater.getNextBundle();
      if (nextBundle && nextBundle.version) {
        const current = await getCurrentOtaVersion();
        if (isVersionNewer(nextBundle.version, current.version)) {
          console.log(`[OTA] Detected queued update bundle v${nextBundle.version}.`);
          emitOtaEvent({
            state: "ready",
            currentVersion: current.version,
            manifest: {
              version: nextBundle.version,
              url: (nextBundle as any).link || "",
              checksum: nextBundle.checksum || "",
              notes: (nextBundle as any).comment || "• **Aggiornamento pronto**: tocca Riavvia per applicare le novità.",
            },
          });
        }
      }
    } catch {}

    // If auto-check is enabled, run a background check a few seconds after startup
    if (isOtaAutoCheckEnabled()) {
      window.setTimeout(async () => {
        try {
          const checkRes = await checkForOtaUpdate({ silent: true });
          if (checkRes.available && checkRes.manifest) {
            emitOtaEvent({
              state: "available",
              manifest: checkRes.manifest,
              currentVersion: checkRes.currentVersion,
            });

            // Pre-download silently in background and stage for next restart
            console.log(`[OTA] Pre-downloading update v${checkRes.manifest.version} in background...`);
            emitOtaEvent({
              state: "downloading",
              manifest: checkRes.manifest,
              currentVersion: checkRes.currentVersion,
            });

            const downloadRes = await downloadAndApplyOta(checkRes.manifest, {
              reloadImmediately: false,
              silent: true,
            });

            if (downloadRes.success) {
              console.log(`[OTA] Live update v${checkRes.manifest.version} staged for next launch.`);
              emitOtaEvent({
                state: "ready",
                manifest: checkRes.manifest,
                currentVersion: checkRes.currentVersion,
              });
            }
          }
        } catch (err) {
          console.debug("[OTA] Background auto-update check skipped or failed:", err);
        }
      }, 3500);
    }
  } catch (err) {
    console.warn("[OTA] Failed to notify app ready:", err);
  }
}

/**
 * Get the current active version & bundle information.
 * Resolves "builtin" placeholder to the actual native APK versionName.
 */
export async function getCurrentOtaVersion(): Promise<OtaStatus> {
  if (!Capacitor.isNativePlatform()) {
    return {
      version: APP_VERSION,
      bundleId: "web",
      isBuiltin: true,
      nativeVersion: APP_VERSION,
    };
  }

  try {
    const info = await CapacitorUpdater.current();
    const rawBundleVersion = info?.bundle?.version;
    const bundleId = info?.bundle?.id || "builtin";
    const isBuiltin = bundleId === "builtin" || !bundleId;
    const nativeVersion = info?.native || APP_VERSION;

    // The native plugin returns version="builtin" or "unknown" for factory APK bundles.
    // Map it to nativeVersion/APP_VERSION so semver comparisons and UI labels are accurate.
    const version =
      !rawBundleVersion || rawBundleVersion === "builtin" || rawBundleVersion === "unknown"
        ? nativeVersion
        : rawBundleVersion;

    return {
      version,
      bundleId,
      isBuiltin,
      nativeVersion,
    };
  } catch (e) {
    return {
      version: APP_VERSION,
      bundleId: "builtin",
      isBuiltin: true,
      nativeVersion: APP_VERSION,
    };
  }
}

/**
 * Check whether a new OTA bundle is available by querying the manifest.
 */
export async function checkForOtaUpdate(
  options: { silent?: boolean; customUrl?: string } = {},
): Promise<CheckUpdateResult> {
  const currentInfo = await getCurrentOtaVersion();
  const currentVersion = currentInfo.version;
  const configuredUrl = options.customUrl || getOtaManifestUrl();

  const candidateUrls = options.customUrl
    ? [options.customUrl]
    : [configuredUrl, ...FALLBACK_MANIFEST_URLS.filter((u) => u !== configuredUrl)];

  let lastError = "";

  for (const manifestUrl of candidateUrls) {
    try {
      const urlWithCacheBuster = `${manifestUrl}${manifestUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      const response = await fetch(urlWithCacheBuster, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status} (${response.statusText})`;
        continue;
      }

      const manifest: OtaManifest = await response.json();
      if (!manifest.version || !manifest.url || !manifest.checksum) {
        const err = "Manifest non valido o privo di checksum SHA-256";
        if (!options.silent) {
          showToast(err, "error");
        }
        return { available: false, currentVersion, error: err };
      }

      // Safety guard: if bundle requires a newer native APK than installed
      if (manifest.minNativeVersion && isVersionNewer(manifest.minNativeVersion, currentInfo.nativeVersion)) {
        const err = `Questa versione richiede un nuovo APK nativo (richiesta v${manifest.minNativeVersion}, installata v${currentInfo.nativeVersion}).`;
        if (!options.silent) {
          showToast(err, "error");
        }
        return { available: false, currentVersion, error: err };
      }

      const available = isVersionNewer(manifest.version, currentVersion);

      if (available) {
        if (!options.silent) {
          showToast(`Nuova versione LiftLab v${manifest.version} disponibile!`, "success");
        }
        return {
          available: true,
          manifest,
          currentVersion,
        };
      } else {
        if (!options.silent) {
          showToast(`LiftLab è già aggiornato all'ultima versione (v${currentVersion}).`, "info");
        }
        return {
          available: false,
          manifest,
          currentVersion,
        };
      }
    } catch (err: any) {
      lastError = err?.message || "Errore di rete o timeout";
    }
  }

  const userFriendlyErr = lastError.includes("404")
    ? "Manifest non trovato su GitHub (404). Esegui 'git push' per pubblicare update-manifest.json e il pacchetto zip."
    : `Controllo aggiornamenti fallito: ${lastError}`;

  if (!options.silent) {
    showToast(userFriendlyErr, "error");
  }
  return { available: false, currentVersion, error: userFriendlyErr };
}

/**
 * Download the bundle zip, verify its integrity with SHA-256, and stage it for the next app launch.
 */
export async function downloadAndApplyOta(
  manifest: OtaManifest,
  options: { reloadImmediately?: boolean; silent?: boolean } = {},
): Promise<{ success: boolean; bundle?: BundleInfo; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    if (!options.silent) {
      showToast("Gli aggiornamenti OTA sono supportati solo nell'app Android nativa.", "info");
    }
    return { success: false, error: "Not on native platform" };
  }

  if (!manifest.checksum) {
    const err = "Checksum SHA-256 mancante: aggiornamento rifiutato per sicurezza.";
    if (!options.silent) {
      showToast(err, "error");
    }
    return { success: false, error: err };
  }

  try {
    // If bundle is already downloaded locally on disk, skip network and queue directly
    try {
      const bundleList = await CapacitorUpdater.list();
      const cached = bundleList.bundles?.find(
        (b) => b.version === manifest.version && (b.status === "pending" || b.status === "success")
      );
      if (cached) {
        console.log(`[OTA] Bundle v${manifest.version} already cached locally (${cached.id}). Staging directly.`);
        if (options.reloadImmediately) {
          if (!options.silent) {
            triggerHaptic("success");
            showToast(`Aggiornamento completato. Riavvio in corso...`, "success");
          }
          await CapacitorUpdater.set({ id: cached.id });
        } else {
          await CapacitorUpdater.next({ id: cached.id });
          if (!options.silent) {
            triggerHaptic("success");
            showToast(
              `Aggiornamento v${manifest.version} pronto! Verrà applicato al prossimo riavvio.`,
              "success",
            );
          }
        }
        return { success: true, bundle: cached };
      }
    } catch (listErr) {
      console.debug("[OTA] Local bundle cache lookup skipped:", listErr);
    }

    if (!options.silent) {
      triggerHaptic("medium");
      showToast(`Download aggiornamento v${manifest.version} in corso...`, "info");
    }

    let bundle: BundleInfo;
    try {
      bundle = await CapacitorUpdater.download({
        url: manifest.url,
        version: manifest.version,
        checksum: manifest.checksum,
      });
    } catch (downloadErr) {
      if (manifest.url.includes("/main/updates/")) {
        const fallbackUrl = manifest.url.replace("/main/updates/", "/feat/ftue-and-italian-localization/updates/");
        console.warn(`[OTA] Primary bundle URL failed, trying branch fallback: ${fallbackUrl}`);
        bundle = await CapacitorUpdater.download({
          url: fallbackUrl,
          version: manifest.version,
          checksum: manifest.checksum,
        });
      } else {
        throw downloadErr;
      }
    }

    if (options.reloadImmediately) {
      if (!options.silent) {
        triggerHaptic("success");
        showToast(`Aggiornamento completato. Riavvio in corso...`, "success");
      }
      await CapacitorUpdater.set({ id: bundle.id });
    } else {
      await CapacitorUpdater.next({ id: bundle.id });
      if (!options.silent) {
        triggerHaptic("success");
        showToast(
          `Aggiornamento v${manifest.version} pronto! Verrà applicato al prossimo riavvio.`,
          "success",
        );
      }
    }

    return { success: true, bundle };
  } catch (err: any) {
    if (!options.silent) {
      triggerHaptic("warning");
      const message = err?.message || "Errore sconosciuto";
      showToast(`Download fallito: ${message}`, "error");
    }
    return { success: false, error: err?.message || "Errore sconosciuto" };
  }
}

/**
 * Reload immediately to apply the staged bundle.
 */
export async function reloadOtaApp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.reload();
    return;
  }
  await CapacitorUpdater.reload();
}

/**
 * Emergency reset to the factory APK builtin bundle.
 */
export async function resetToBuiltin(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.reload();
    return;
  }
  await CapacitorUpdater.reset();
}
