/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isVersionNewer,
  DEFAULT_MANIFEST_URL,
  getOtaManifestUrl,
  setOtaManifestUrl,
  isOtaAutoCheckEnabled,
  setOtaAutoCheckEnabled,
  subscribeOtaEvents,
  emitOtaEvent,
  type OtaManifest,
} from "./otaUpdate";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("Running OTA update unit tests...");

// 1. SemVer comparison tests
assert(isVersionNewer("1.0.1", "1.0.0"), "1.0.1 should be newer than 1.0.0");
assert(isVersionNewer("1.1.0", "1.0.9"), "1.1.0 should be newer than 1.0.9");
assert(isVersionNewer("2.0.0", "1.99.99"), "2.0.0 should be newer than 1.99.99");
assert(isVersionNewer("v1.0.5", "1.0.4"), "v1.0.5 with 'v' prefix should be newer than 1.0.4");
assert(isVersionNewer("1.0.5", "v1.0.4"), "1.0.5 should be newer than v1.0.4");
assert(isVersionNewer("1.0.10", "1.0.9"), "1.0.10 should be newer than 1.0.9");

// 2. Equal versions should return false
assert(!isVersionNewer("1.0.0", "1.0.0"), "Same version should not be newer");
assert(!isVersionNewer("v1.0.0", "1.0.0"), "Same version with 'v' should not be newer");
assert(!isVersionNewer("  1.0.0  ", "1.0.0"), "Same version with whitespace should not be newer");
assert(!isVersionNewer("1.0.3", "1.0.3"), "1.0.3 vs 1.0.3 should return false");

// 3. Older versions should return false
assert(!isVersionNewer("1.0.0", "1.0.1"), "1.0.0 is not newer than 1.0.1");
assert(!isVersionNewer("0.9.9", "1.0.0"), "0.9.9 is not newer than 1.0.0");
assert(!isVersionNewer("1.0.3", "1.0.4"), "1.0.3 is not newer than 1.0.4");

// 4. Edge cases
assert(!isVersionNewer("", "1.0.0"), "Empty remote should return false");
assert(!isVersionNewer("1.0.0", ""), "Empty current should return false");
assert(!isVersionNewer("invalid", "invalid"), "Invalid vs invalid should return false");

// 5. Default manifest url
assert(DEFAULT_MANIFEST_URL.startsWith("https://"), "Manifest URL must be HTTPS");
assert(DEFAULT_MANIFEST_URL.includes("update-manifest.json"), "Manifest URL must end with update-manifest.json");

// 6. Mock localStorage for storage helpers test
const memoryStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => { memoryStore.set(k, v); },
  removeItem: (k: string) => { memoryStore.delete(k); },
};
// @ts-ignore
globalThis.localStorage = mockLocalStorage;

// Test manifest URL storage
assert(getOtaManifestUrl() === DEFAULT_MANIFEST_URL, "Should return default URL initially");
setOtaManifestUrl("https://example.com/custom-manifest.json");
assert(getOtaManifestUrl() === "https://example.com/custom-manifest.json", "Should return custom URL");
// Test rejecting insecure cleartext HTTP
setOtaManifestUrl("http://insecure-domain.com/manifest.json");
assert(getOtaManifestUrl() === "https://example.com/custom-manifest.json", "Insecure HTTP URL must be rejected");
setOtaManifestUrl(null);
assert(getOtaManifestUrl() === DEFAULT_MANIFEST_URL, "Resetting should return default URL");

// Test auto-check toggle
assert(isOtaAutoCheckEnabled() === true, "Auto check should be enabled by default");
setOtaAutoCheckEnabled(false);
assert(isOtaAutoCheckEnabled() === false, "Auto check should be disabled");
setOtaAutoCheckEnabled(true);
assert(isOtaAutoCheckEnabled() === true, "Auto check should be re-enabled");

// 7. Event subscription test
let receivedState = "";
const unsubscribe = subscribeOtaEvents((event) => {
  receivedState = event.state;
});

const sampleManifest: OtaManifest = {
  version: "1.0.4",
  url: "https://example.com/bundle.zip",
  checksum: "abcdef1234567890",
};

emitOtaEvent({
  state: "ready",
  manifest: sampleManifest,
  currentVersion: "1.0.3",
});

assert(receivedState === "ready", "Subscriber should have received 'ready' event");
unsubscribe();

emitOtaEvent({
  state: "error",
  currentVersion: "1.0.3",
  error: "test",
});

assert(receivedState === "ready", "Unsubscribed listener should not receive subsequent events");

console.log("✓ All OTA update unit tests passed successfully!");
