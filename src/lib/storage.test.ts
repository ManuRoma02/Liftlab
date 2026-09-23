import assert from "node:assert/strict";
import {
  filterLiftLabStorage,
  parseGuestObject,
  readJson,
  readJsonArray,
  readJsonRecord,
  readNumber,
  restoreRawLocalStorageEntries,
  writeJson,
} from "./storage";

const store = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  },
  configurable: true,
});

store.clear();
writeJson("liftlab_test", [{ id: "1" }]);
assert.equal(readJson<{ id: string }[]>("liftlab_test", []).length, 1);

store.set("liftlab_bad", "{");
assert.equal(readJson("liftlab_bad", ["fallback"])[0], "fallback");

store.set("liftlab_wrong_array", '{"id":"not-an-array"}');
assert.deepEqual(readJsonArray("liftlab_wrong_array"), []);

store.set("liftlab_wrong_record", "[1,2]");
assert.deepEqual(readJsonRecord("liftlab_wrong_record"), {});

store.set("liftlab_number", "5");
assert.equal(readNumber("liftlab_number", 3), 5);

// Test atomic write and backup recovery
store.clear();
import { writeJsonAtomic, writeJsonSafe } from "./storage";

writeJsonAtomic("liftlab_atomic_test", { count: 42 });
assert.deepEqual(readJson("liftlab_atomic_test", null), { count: 42 });

// Write new value to create backup
writeJsonAtomic("liftlab_atomic_test", { count: 43 });
assert.deepEqual(readJson("liftlab_atomic_test", null), { count: 43 });
assert.equal(store.has("liftlab_atomic_test_bak"), true);

// Corrupt primary key and verify recovery from backup
store.set("liftlab_atomic_test", "{ CORRUPT JSON DATA");
const recovered = readJson("liftlab_atomic_test", { count: 0 });
assert.deepEqual(recovered, { count: 42 });
// Verify primary key was restored with valid backup data
assert.deepEqual(JSON.parse(store.get("liftlab_atomic_test") || "{}"), { count: 42 });

// Test empty / whitespace primary key also restores from backup
store.set("liftlab_atomic_test", "   ");
const recoveredEmpty = readJson("liftlab_atomic_test", { count: 0 });
assert.deepEqual(recoveredEmpty, { count: 42 });

store.set("other_key", "x");
const filtered = filterLiftLabStorage(localStorage);
assert.equal(filtered.liftlab_atomic_test !== undefined, true);
assert.equal(filtered.other_key, undefined);

// Test removeJsonAtomic
import { removeJsonAtomic } from "./storage";
writeJsonAtomic("liftlab_cleanup_test", { active: true });
writeJsonAtomic("liftlab_cleanup_test", { active: true, step: 2 });
assert.equal(store.has("liftlab_cleanup_test"), true);
assert.equal(store.has("liftlab_cleanup_test_bak"), true);

removeJsonAtomic("liftlab_cleanup_test");
assert.equal(store.has("liftlab_cleanup_test"), false);
assert.equal(store.has("liftlab_cleanup_test_bak"), false);
assert.equal(store.has("liftlab_cleanup_test_tmp"), false);
assert.equal(readJson("liftlab_cleanup_test", null), null);

store.clear();
store.set("liftlab_backup_pre_import", JSON.stringify({ keep: true }));
restoreRawLocalStorageEntries({
  liftlab_guest_data: JSON.stringify({ displayName: "Ada", unit: "KG" }),
  liftlab_is_live_active: "true",
  liftlab_routines_bak: "[]",
  liftlab_backup_pre_import: JSON.stringify({ overwritten: true }),
  other_key: "nope",
  liftlab_number: 12 as unknown as string,
});
assert.deepEqual(JSON.parse(store.get("liftlab_guest_data") || "{}"), { displayName: "Ada", unit: "KG" });
assert.equal(store.get("liftlab_is_live_active"), "true");
assert.equal(store.get("liftlab_routines_bak"), undefined);
assert.deepEqual(JSON.parse(store.get("liftlab_backup_pre_import") || "{}"), { keep: true });
assert.equal(store.get("other_key"), undefined);
assert.deepEqual(parseGuestObject(JSON.stringify(JSON.stringify({ displayName: "x" }))), {});
assert.deepEqual(parseGuestObject(JSON.stringify({ displayName: "Ada" })), { displayName: "Ada" });

// Test _tmp cleanup on failure
const failingStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (key === "failing_key") throw new Error("QuotaExceededError");
    store.set(key, value);
  },
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  key: (i: number) => null,
  length: 0,
} as unknown as Storage;

writeJsonAtomic("failing_key", { data: 123 }, failingStorage);
assert.equal(store.has("failing_key_tmp"), false, "tmp key must be cleaned up on failure");

console.log("storage tests passed");


