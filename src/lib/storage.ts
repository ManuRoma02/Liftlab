export const LIFTLAB_PREFIX = "liftlab_";

export function readJson<T>(key: string, fallback: T, storage: Storage = localStorage): T {
  const raw = storage.getItem(key);
  if (raw && raw.trim().length > 0) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Primary key was corrupt, attempt to restore from backup below
    }
  }

  // Primary key was corrupt, empty, or missing: attempt to restore from backup if available
  const backupRaw = storage.getItem(`${key}_bak`);
  if (backupRaw && backupRaw.trim().length > 0) {
    try {
      const recovered = JSON.parse(backupRaw) as T;
      // Re-persist valid backup to primary key
      storage.setItem(key, backupRaw);
      return recovered;
    } catch {
      // Backup also corrupt
    }
  }

  return fallback;
}

export function removeJsonAtomic(key: string, storage: Storage = localStorage) {
  storage.removeItem(key);
  storage.removeItem(`${key}_bak`);
  storage.removeItem(`${key}_tmp`);
}

export function readJsonArray<T>(key: string, storage: Storage = localStorage): T[] {
  const value = readJson<unknown>(key, [], storage);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function readJsonRecord<T>(key: string, storage: Storage = localStorage): Record<string, T> {
  const value = readJson<unknown>(key, {}, storage);
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, T>)
    : {};
}

export function writeJsonSafe<T>(key: string, value: T, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save key "${key}" to storage (quota exceeded or storage unavailable):`, error);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("liftlab:storage-error", { detail: { key, error } }));
    }
    return false;
  }
}

export function writeJsonAtomic<T>(key: string, value: T, storage: Storage = localStorage): boolean {
  const tmpKey = `${key}_tmp`;
  const bakKey = `${key}_bak`;
  try {
    const serialized = JSON.stringify(value);
    // Write to temporary slot and verify parseability
    storage.setItem(tmpKey, serialized);
    JSON.parse(storage.getItem(tmpKey) || "");

    // Rotate existing key to backup
    const existing = storage.getItem(key);
    if (existing) {
      storage.setItem(bakKey, existing);
    }

    // Commit new data
    storage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Atomic write failed for "${key}":`, error);
    // Crucial: remove tmpKey immediately so quota is freed before fallback
    try {
      storage.removeItem(tmpKey);
    } catch {}
    // Fallback: try direct write if quota permits
    return writeJsonSafe(key, value, storage);
  } finally {
    try {
      storage.removeItem(tmpKey);
    } catch {}
  }
}


export function writeJson<T>(key: string, value: T, storage: Storage = localStorage) {
  writeJsonSafe(key, value, storage);
}

export function readNumber(key: string, fallback: number, storage: Storage = localStorage) {
  const value = Number(storage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

export function filterLiftLabStorage(storage: Storage = localStorage) {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(LIFTLAB_PREFIX)) continue;
    const value = storage.getItem(key);
    if (typeof value === "string") entries[key] = value;
  }
  return entries;
}

const EXCLUDED_RESTORE_SUFFIXES = ["_bak", "_tmp"];

export function restoreRawLocalStorageEntries(
  entries: Record<string, unknown>,
  storage: Storage = localStorage,
  extraExcludeKeys: string[] = ["liftlab_backup_pre_import"],
) {
  const excluded = new Set(extraExcludeKeys);
  Object.entries(entries).forEach(([key, value]) => {
    if (!key.startsWith(LIFTLAB_PREFIX)) return;
    if (excluded.has(key)) return;
    if (EXCLUDED_RESTORE_SUFFIXES.some((suffix) => key.endsWith(suffix))) return;
    if (typeof value === "string") storage.setItem(key, value);
  });
}

export function parseGuestObject(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore corrupt guest payload
  }
  return {};
}

