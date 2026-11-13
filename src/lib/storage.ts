/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LIFTLAB_PREFIX = "liftlab_";

// In-memory storage fallback for private browsing, restricted sandboxes, or SSR
const memoryFallbackStore = new Map<string, string>();

/**
 * Safely resolves the active Storage instance without throwing SecurityError DOMExceptions.
 */
export function getSafeStorage(override?: Storage): Storage {
  if (override) return override;
  try {
    const s =
      typeof window !== "undefined"
        ? window.localStorage
        : typeof localStorage !== "undefined"
          ? localStorage
          : null;
    if (s) {
      // Probe storage access to ensure property getter does not throw SecurityError
      s.getItem("__liftlab_probe__");
      return s;
    }
  } catch {
    // Storage access blocked by security sandbox or private browsing
  }

  // Resilient in-memory fallback conforming to the Storage interface
  return {
    getItem: (key: string) => memoryFallbackStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryFallbackStore.set(key, String(value));
    },
    removeItem: (key: string) => {
      memoryFallbackStore.delete(key);
    },
    clear: () => {
      memoryFallbackStore.clear();
    },
    key: (index: number) => [...memoryFallbackStore.keys()][index] ?? null,
    get length() {
      return memoryFallbackStore.size;
    },
  };
}

/**
 * Reads and parses JSON from storage with automatic backup recovery and non-throwing guarantee.
 */
export function readJson<T>(key: string, fallback: T, storage?: Storage): T {
  try {
    const s = getSafeStorage(storage);
    const raw = s.getItem(key);
    if (raw && raw.trim().length > 0) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        // Primary key was corrupt, attempt to restore from backup below
      }
    }

    // Primary key was corrupt, empty, or missing: attempt restore from backup
    const backupRaw = s.getItem(`${key}_bak`);
    if (backupRaw && backupRaw.trim().length > 0) {
      try {
        const recovered = JSON.parse(backupRaw) as T;
        try {
          s.setItem(key, backupRaw);
        } catch {
          // Ignore quota error on recovery write
        }
        return recovered;
      } catch {
        // Backup also corrupt
      }
    }
  } catch (error) {
    console.warn(`readJson safely caught storage access exception for key "${key}":`, error);
  }

  return fallback;
}

/**
 * Guaranteed non-throwing JSON parser and localStorage getter.
 * Conforms to PROJECT.md § Interface Contracts.
 */
export function safeGetItem<T>(key: string, fallback: T, storage?: Storage): T {
  return readJson<T>(key, fallback, storage);
}

/**
 * Atomically removes primary, backup, and temporary keys without throwing.
 */
export function removeJsonAtomic(key: string, storage?: Storage): void {
  try {
    const s = getSafeStorage(storage);
    s.removeItem(key);
    s.removeItem(`${key}_bak`);
    s.removeItem(`${key}_tmp`);
  } catch (error) {
    console.warn(`removeJsonAtomic safely caught storage exception for key "${key}":`, error);
  }
}

export function readJsonArray<T>(key: string, storage?: Storage): T[] {
  const value = readJson<unknown>(key, [], storage);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function readJsonRecord<T>(key: string, storage?: Storage): Record<string, T> {
  const value = readJson<unknown>(key, {}, storage);
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, T>)
    : {};
}

/**
 * Safe setter catching QuotaExceededError and SecurityError.
 * Conforms to PROJECT.md § Interface Contracts.
 */
export function safeSetItem<T>(key: string, value: T, storage?: Storage): boolean {
  return writeJsonSafe<T>(key, value, storage);
}

export function writeJsonSafe<T>(key: string, value: T, storage?: Storage): boolean {
  try {
    const s = getSafeStorage(storage);
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save key "${key}" to storage (quota exceeded or storage unavailable):`, error);
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("liftlab:storage-error", { detail: { key, error } }));
      } catch {}
    }
    return false;
  }
}

export function writeJsonAtomic<T>(key: string, value: T, storage?: Storage): boolean {
  const tmpKey = `${key}_tmp`;
  const bakKey = `${key}_bak`;
  try {
    const s = getSafeStorage(storage);
    const serialized = JSON.stringify(value);
    // Write to temporary slot and verify parseability
    s.setItem(tmpKey, serialized);
    JSON.parse(s.getItem(tmpKey) || "");

    // Rotate existing key to backup
    const existing = s.getItem(key);
    if (existing) {
      try {
        s.setItem(bakKey, existing);
      } catch {}
    }

    // Commit new data
    s.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Atomic write failed for "${key}":`, error);
    try {
      const s = getSafeStorage(storage);
      s.removeItem(tmpKey);
    } catch {}
    // Fallback: try direct write if quota permits
    return writeJsonSafe(key, value, storage);
  } finally {
    try {
      const s = getSafeStorage(storage);
      s.removeItem(tmpKey);
    } catch {}
  }
}

export function writeJson<T>(key: string, value: T, storage?: Storage): void {
  writeJsonSafe(key, value, storage);
}

export function readNumber(key: string, fallback: number, storage?: Storage): number {
  try {
    const s = getSafeStorage(storage);
    const raw = s.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function filterLiftLabStorage(storage?: Storage): Record<string, string> {
  const entries: Record<string, string> = {};
  try {
    const s = getSafeStorage(storage);
    for (let index = 0; index < s.length; index += 1) {
      const key = s.key(index);
      if (!key?.startsWith(LIFTLAB_PREFIX)) continue;
      const value = s.getItem(key);
      if (typeof value === "string") entries[key] = value;
    }
  } catch (error) {
    console.warn("filterLiftLabStorage safely caught storage exception:", error);
  }
  return entries;
}

const EXCLUDED_RESTORE_SUFFIXES = ["_bak", "_tmp"];
const SAFE_LIFTLAB_KEY_REGEX = /^liftlab_[a-zA-Z0-9_]+$/;

export const DEFAULT_SECURITY_EXCLUDED_KEYS = [
  "liftlab_backup_pre_import",
  "liftlab_ota_manifest_url",
  "liftlab_ota_autocheck",
];

export function restoreRawLocalStorageEntries(
  entries: Record<string, unknown>,
  storage?: Storage,
  extraExcludeKeys: string[] = [],
): void {
  if (!entries || typeof entries !== "object") return;
  try {
    const s = getSafeStorage(storage);
    const excluded = new Set([...DEFAULT_SECURITY_EXCLUDED_KEYS, ...extraExcludeKeys]);
    Object.entries(entries).forEach(([key, value]) => {
      if (!key.startsWith(LIFTLAB_PREFIX) || !SAFE_LIFTLAB_KEY_REGEX.test(key)) return;
      if (key.includes("__proto__") || key.includes("prototype") || key.includes("constructor")) return;
      if (excluded.has(key)) return;
      if (EXCLUDED_RESTORE_SUFFIXES.some((suffix) => key.endsWith(suffix))) return;
      if (typeof value === "string") {
        try {
          s.setItem(key, value);
        } catch {}
      }
    });
  } catch (error) {
    console.warn("restoreRawLocalStorageEntries safely caught storage exception:", error);
  }
}

export function parseGuestObject(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k !== "__proto__" && k !== "prototype" && k !== "constructor") {
          sanitized[k] = v;
        }
      }
      return sanitized;
    }
  } catch {
    // ignore corrupt guest payload
  }
  return {};
}
