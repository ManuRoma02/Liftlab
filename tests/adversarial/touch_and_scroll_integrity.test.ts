/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

console.log("================================================================================");
console.log("   TOUCH & SCROLL INTEGRITY TEST SUITE (TDD)                                    ");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Details: ${err.message}`);
    failedCount++;
  }
}

// 1. Verify index.html does not lock vertical scrolling
runTest("1.1 index.html must NOT set global overflow: hidden on html, body", () => {
  const indexHtmlPath = path.join(rootDir, "index.html");
  const htmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
  
  // Extract style tag
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(styleMatch, "index.html must have a style block");
  const styleContent = styleMatch[1];
  
  // Check if html, body has overflow: hidden
  const htmlBodyOverflowHidden = /html\s*,\s*body\s*\{[^}]*overflow:\s*hidden/i.test(styleContent);
  assert.equal(
    htmlBodyOverflowHidden,
    false,
    "CRITICAL BUG: index.html contains 'overflow: hidden' on html, body, which completely breaks all page scrolling on Android/iOS!"
  );
});

// 2. Verify subview exit transitions don't block pointer events
runTest("2.1 App.tsx subview container must use isSubview, cache lastSubviewRef, and disable pointerEvents on exit", () => {
  const appTsxPath = path.join(rootDir, "src", "App.tsx");
  const appContent = fs.readFileSync(appTsxPath, "utf-8");
  
  assert.ok(
    appContent.includes("isSubview"),
    "App.tsx must use dedicated 'isSubview' guard so live_editor doesn't trigger sliding subview overlay"
  );
  assert.ok(
    appContent.includes("lastSubviewRef"),
    "App.tsx must use 'lastSubviewRef' to preserve subview content during exit transition"
  );
  assert.ok(
    appContent.includes("pointerEvents: isSubview ? \"auto\" : \"none\""),
    "App.tsx must disable pointer events when subview is exiting so touches are never swallowed"
  );
});

// 3. Verify touch-action and scrolling integrity in index.css
runTest("3.1 index.css must support vertical scrolling on html, body, and app-shell", () => {
  const indexCssPath = path.join(rootDir, "src", "index.css");
  const cssContent = fs.readFileSync(indexCssPath, "utf-8");
  
  // html, body must not have overflow: hidden or overflow-y: hidden
  assert.ok(
    !/html\s*,\s*body\s*\{[^}]*overflow(-y)?:\s*hidden/i.test(cssContent),
    "index.css must not lock vertical scrolling with overflow: hidden on html, body"
  );
});

// 4. Library & AddExercise UI styling consistency
runTest("4.1 Library.tsx add exercise button must use compact pill styling with whileTap and ml-auto", () => {
  const libraryPath = path.join(rootDir, "src", "components", "Library.tsx");
  const libraryContent = fs.readFileSync(libraryPath, "utf-8");

  assert.ok(
    libraryContent.includes("data-testid=\"library-add-exercise-btn\""),
    "Library.tsx must include test id for add exercise button"
  );
  assert.ok(
    libraryContent.includes("ml-auto"),
    "Library.tsx add exercise button should be compact and right-aligned with ml-auto"
  );
  assert.ok(
    libraryContent.includes("whileTap={{ scale: 0.95 }}"),
    "Library.tsx add exercise button must include whileTap spring feedback"
  );
});

runTest("4.2 AddExercise.tsx must follow Apple dark HIG without legacy Material tokens or harsh horizontal divider", () => {
  const addExercisePath = path.join(rootDir, "src", "components", "common", "AddExercise.tsx");
  const addExerciseContent = fs.readFileSync(addExercisePath, "utf-8");

  // No Material tokens
  assert.ok(
    !addExerciseContent.includes("bg-surface-container-lowest"),
    "AddExercise.tsx must not use Material 3 bg-surface-container-lowest"
  );
  assert.ok(
    !addExerciseContent.includes("border-surface-variant"),
    "AddExercise.tsx must not use harsh border-surface-variant divider line"
  );
  // No fake upload box
  assert.ok(
    !addExerciseContent.includes("Upload Demo Photo/Video"),
    "AddExercise.tsx must not contain fake non-functional Upload Demo Photo/Video placeholder"
  );
  // Must use Apple top navbar and Inset Group card tokens
  assert.ok(
    addExerciseContent.includes("ChevronLeft"),
    "AddExercise.tsx must use Apple ChevronLeft back button"
  );
  assert.ok(
    addExerciseContent.includes("border-white/5"),
    "AddExercise.tsx header must use subtle border-white/5 instead of harsh dividing lines"
  );
  assert.ok(
    addExerciseContent.includes("bg-[#1C1C1E]"),
    "AddExercise.tsx must use Apple Inset Group bg-[#1C1C1E] for form sections"
  );
});

console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedCount} passed, ${failedCount} failed.`);
console.log("================================================================================");

if (failedCount > 0) {
  process.exit(1);
}
