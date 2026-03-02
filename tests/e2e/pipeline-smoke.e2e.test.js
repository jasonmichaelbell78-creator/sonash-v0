/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * E2E Smoke Test: Full Pipeline
 *
 * Exercises the complete v2 pipeline on real project data:
 *   review JSONL -> consolidation -> promotion -> health check -> gate check
 *
 * Covers: INTG-07, TEST-02
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const ECOSYSTEM_DIR = path.join(ROOT, "data", "ecosystem-v2");
const REVIEWS_FILE = path.join(ECOSYSTEM_DIR, "reviews.jsonl");
const MANIFEST_FILE = path.join(ECOSYSTEM_DIR, "enforcement-manifest.jsonl");

describe("E2E: Full pipeline smoke test", { timeout: 60000 }, () => {
  it("reviews.jsonl exists and has sufficient entries", () => {
    assert.ok(fs.existsSync(REVIEWS_FILE), "reviews.jsonl must exist");
    const lines = fs.readFileSync(REVIEWS_FILE, "utf8").trim().split("\n").filter(Boolean);
    assert.ok(lines.length > 300, `Expected >300 review entries, got ${lines.length}`);
  });

  it("review JSONL entries have required fields", () => {
    const lines = fs.readFileSync(REVIEWS_FILE, "utf8").trim().split("\n").filter(Boolean);

    // Sample first 5 and last 5 entries
    const sample = [...lines.slice(0, 5), ...lines.slice(-5)];

    for (const line of sample) {
      const record = JSON.parse(line);
      assert.ok(record.id !== undefined, "Record must have id field");
      assert.ok(record.date !== undefined, "Record must have date field");
      assert.ok(record.source !== undefined, "Record must have source field");
    }
  });

  it("consolidation runs without error", () => {
    const output = execFileSync(
      "node",
      [path.join(ROOT, "scripts", "run-consolidation.js"), "--auto"],
      { encoding: "utf8", stdio: "pipe", cwd: ROOT }
    );
    // --auto mode exits 0 whether consolidation was needed or not
    assert.ok(typeof output === "string", "Consolidation should produce output");
  });

  it("pattern promotion runs without error", () => {
    const output = execFileSync(
      "node",
      [path.join(ROOT, "scripts", "promote-patterns.js"), "--dry-run"],
      { encoding: "utf8", stdio: "pipe", cwd: ROOT }
    );
    assert.ok(typeof output === "string", "Promotion should produce output");
  });

  it("enforcement manifest exists and has valid entries", () => {
    assert.ok(fs.existsSync(MANIFEST_FILE), "enforcement-manifest.jsonl must exist");
    const lines = fs.readFileSync(MANIFEST_FILE, "utf8").trim().split("\n").filter(Boolean);
    assert.ok(lines.length > 0, "Manifest must have at least one entry");

    // Verify first entry has expected fields
    const first = JSON.parse(lines[0]);
    assert.ok(first.pattern_id, "Manifest entry must have pattern_id");
    assert.ok(first.status, "Manifest entry must have status");
  });

  it("health check runs and produces a numeric score", () => {
    // --quick mode runs only fast checkers; capture both stdout and stderr
    let stdout;
    try {
      stdout = execFileSync(
        "node",
        [path.join(ROOT, "scripts", "health", "run-health-check.js"), "--quick"],
        { encoding: "utf8", stdio: "pipe", cwd: ROOT }
      );
    } catch (err) {
      // run-health-check.js writes report to stdout even if exit code non-zero
      stdout = err.stdout || "";
    }

    // The text output contains "Composite: X (NN/100)"
    const compositeMatch = stdout.match(/Composite:\s+\S+\s+\((\d+)\/100\)/);
    assert.ok(
      compositeMatch,
      `Health check should output composite score. Got: ${stdout.slice(0, 200)}`
    );
    const score = Number(compositeMatch[1]);
    assert.ok(score >= 0 && score <= 100, `Score must be 0-100, got ${score}`);
  });

  it("gate check (pattern compliance) runs without crash", () => {
    // --all flag scans the full repo; exit code 0 = clean, 1 = violations (both valid)
    try {
      execFileSync(
        "node",
        [path.join(ROOT, "scripts", "check-pattern-compliance.js"), "--all", "--json"],
        { encoding: "utf8", stdio: "pipe", cwd: ROOT }
      );
    } catch (err) {
      // Exit code 1 = violations found (expected in real codebase); only code 2 is error
      if (err.status === 2) {
        assert.fail(
          `Pattern compliance crashed with exit code 2: ${(err.stderr || "").slice(0, 200)}`
        );
      }
      // Exit code 1 is acceptable (violations found but not a crash)
    }
  });
});
