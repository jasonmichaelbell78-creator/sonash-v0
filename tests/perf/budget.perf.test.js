const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * Performance budget tests (TEST-04).
 *
 * These run real scripts (no mocks) and assert wall-clock time stays
 * within the budgets defined in the project requirements.
 */
describe("Performance budgets", { timeout: 60000 }, () => {
  it("gate check (check-pattern-compliance) completes in <3s", () => {
    const start = Date.now();
    execFileSync(process.execPath, ["scripts/check-pattern-compliance.js"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, `Gate check took ${elapsed}ms, budget is 3000ms`);
  });

  it("health:quick completes in <1s", () => {
    const start = Date.now();
    execFileSync(process.execPath, ["scripts/health/run-health-check.js", "--quick"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 1000, `Health:quick took ${elapsed}ms, budget is 1000ms`);
  });

  it("health:full completes in <5s", () => {
    const start = Date.now();
    execFileSync(process.execPath, ["scripts/health/run-health-check.js"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Health:full took ${elapsed}ms, budget is 5000ms`);
  });

  it("consolidation (--auto) completes in <10s", () => {
    const start = Date.now();
    execFileSync(process.execPath, ["scripts/run-consolidation.js", "--auto"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 10000, `Consolidation took ${elapsed}ms, budget is 10000ms`);
  });
});
