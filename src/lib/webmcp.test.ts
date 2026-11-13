import assert from "node:assert/strict";
import { initWebMcp } from "./webmcp";
import { writeJsonAtomic } from "./storage";

// Clean state before testing
writeJsonAtomic("liftlab_weight_logs", []);
writeJsonAtomic("liftlab_user_data", { unit: "kg" });

const mcp = initWebMcp();

assert.ok(mcp, "WebMCP actions registry must be exposed");
assert.ok(mcp["log-weight"], "log-weight action must be registered");
assert.ok(mcp["search-exercises"], "search-exercises action must be registered");
assert.ok(mcp["get-routines"], "get-routines action must be registered");
assert.ok(mcp["get-workout-history"], "get-workout-history action must be registered");

// Test log-weight action
const weightRes = await mcp["log-weight"].handler({ weight: 78.5, unit: "kg" });
assert.equal(weightRes.success, true, "log-weight should succeed");
assert.equal(weightRes.weight, 78.5);

// Test search-exercises action
const searchRes = await mcp["search-exercises"].handler({ query: "bench" });
assert.equal(searchRes.success, true, "search-exercises should succeed");
assert.ok(Array.isArray(searchRes.exercises), "exercises should be an array");

console.log("✓ WebMCP unit tests passed successfully!");
