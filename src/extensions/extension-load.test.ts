import assert from "node:assert";
import { describe, it } from "node:test";

/**
 * Smoke test that verifies the extension entry point module loads and exports a
 * valid factory function. This catches syntax errors, import issues, or jiti
 * problems without requiring the full Pi runtime.
 */
describe("extension entry point", () => {
  it("exports a default factory function", async () => {
    const module = await import("../../extensions/index.js");
    assert.equal(typeof module.default, "function");
    assert.equal(module.default.length, 1);
  });
});
