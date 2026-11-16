import assert from "node:assert/strict";
import { initWebMcp } from "./webmcp";
import { readJson, readJsonArray, writeJsonAtomic } from "./storage";

writeJsonAtomic("liftlab_weight_logs", []);
writeJsonAtomic("liftlab_guest_data", { displayName: "Guest", unit: "KG" });
writeJsonAtomic("liftlab_routines", []);
writeJsonAtomic("liftlab_custom_exercises", []);

const mcp = initWebMcp();

assert.ok(mcp, "WebMCP actions registry must be exposed");
assert.ok(mcp["log-weight"], "log-weight action must be registered");
assert.ok(mcp["search-exercises"], "search-exercises action must be registered");
assert.ok(mcp["get-routines"], "get-routines action must be registered");
assert.ok(mcp["get-workout-history"], "get-workout-history action must be registered");
assert.ok(mcp["import-routine"], "import-routine action must be registered");

const weightRes = await mcp["log-weight"].handler({ weight: 78.5, unit: "kg" });
assert.equal(weightRes.success, true, "log-weight should succeed");
assert.equal(weightRes.weight, 78.5);
assert.match(String(weightRes.date), /T/, "weight log date must be a full ISO timestamp");

const guest = readJson<Record<string, unknown>>("liftlab_guest_data", {});
assert.equal(guest.currentWeight, 78.5);
assert.equal(guest.unit, "KG");
assert.equal(readJson("liftlab_user_data", "absent"), "absent");

const logs = readJsonArray<{ date: string; weight: number }>("liftlab_weight_logs");
assert.equal(logs.length, 1);
assert.equal(logs[0].weight, 78.5);
assert.match(logs[0].date, /T/);

const converted = await mcp["log-weight"].handler({ weight: 100, unit: "lbs" });
assert.equal(converted.success, true);
assert.equal(converted.unit, "kg");
assert.equal(converted.weight, 45.36);
const guestAfter = readJson<Record<string, unknown>>("liftlab_guest_data", {});
assert.equal(guestAfter.unit, "KG");
assert.equal(guestAfter.currentWeight, 45.36);
const logsAfter = readJsonArray<{ date: string; weight: number }>("liftlab_weight_logs");
assert.equal(logsAfter.length, 2);
assert.equal(logsAfter[0].weight, 78.5);
assert.equal(logsAfter[1].weight, 45.36);

const imported = await mcp["import-routine"].handler({
  routine_code: JSON.stringify({
    name: "Agent Push",
    exercises: [{ title: "Agent Only Lift", sets: [{ weight: 20, reps: 8 }] }],
  }),
});
assert.equal(imported.success, true);
assert.equal(imported.count, 1);
assert.equal(imported.customExercisesCreated, 1);

const routines = readJsonArray<{ name: string }>("liftlab_routines");
assert.equal(routines[0]?.name, "Agent Push");
const custom = readJsonArray<{ title: string }>("liftlab_custom_exercises");
assert.equal(custom.length, 1);
assert.equal(custom[0]?.title, "Agent Only Lift");

const missing = await mcp["import-routine"].handler({});
assert.equal(missing.success, false);

const searchRes = await mcp["search-exercises"].handler({ query: "bench" });
assert.equal(searchRes.success, true, "search-exercises should succeed");
assert.ok(Array.isArray(searchRes.exercises), "exercises should be an array");

console.log("✓ WebMCP unit tests passed successfully!");
