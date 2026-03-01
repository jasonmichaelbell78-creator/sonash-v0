const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * Integration test: Health pipeline end-to-end flow.
 *
 * Verifies that real scripts produce expected output structure
 * and exit cleanly when run against the actual codebase.
 */
describe("Health pipeline integration", { timeout: 30000 }, () => {
  it("health:quick produces composite score output", () => {
    const output = execFileSync("node", ["scripts/health/run-health-check.js", "--quick"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.ok(output.includes("Composite:"), 'Output should contain "Composite:" score line');
  });

  it("health:full produces composite score and category results", () => {
    const output = execFileSync("node", ["scripts/health/run-health-check.js"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.ok(output.includes("Composite:"), 'Output should contain "Composite:" score line');
    // Full mode produces more categories than quick mode
    assert.ok(output.length > 100, "Full mode should produce substantial output");
  });

  it("gate check exits cleanly on compliant codebase", () => {
    // Should not throw (exit 0) on the current codebase
    const output = execFileSync("node", ["scripts/check-pattern-compliance.js"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.ok(typeof output === "string", "gate check should produce output");
  });
});
