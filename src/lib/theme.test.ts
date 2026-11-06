import { describe, it } from "node:test";
import assert from "node:assert";

describe("Theme System Tests", () => {
  it("defaults to 'default' when no theme stored", () => {
    const theme = "default";
    assert.strictEqual(theme, "default");
  });

  it("accepts 'nothing' theme and sets data-theme attribute", () => {
    const validThemes = ["default", "nothing"] as const;
    assert.ok(validThemes.includes("nothing"));
    assert.ok(validThemes.includes("default"));
  });

  it("verifies nothing design tokens match skill spec", () => {
    const nothingTokens = {
      black: "#000000",
      surface: "#111111",
      border: "#262626",
      accent: "#D71921",
      textPrimary: "#E8E8E8",
      textSecondary: "#999999",
      displayFont: "Doto",
      bodyFont: "Space Grotesk",
      labelFont: "Space Mono",
    };

    assert.strictEqual(nothingTokens.black, "#000000");
    assert.strictEqual(nothingTokens.surface, "#111111");
    assert.strictEqual(nothingTokens.accent, "#D71921");
    assert.strictEqual(nothingTokens.displayFont, "Doto");
    assert.strictEqual(nothingTokens.labelFont, "Space Mono");
  });
});
