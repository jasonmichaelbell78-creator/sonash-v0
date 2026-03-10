/**
 * validate-skip-reason.js Smoke Tests
 *
 * Verifies that validateSkipReason accepts valid reasons and rejects
 * empty, too-long, multiline, and control-character inputs.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/validate-skip-reason.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/validate-skip-reason.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateSkipReason } = require(MODULE_PATH) as {
  validateSkipReason: (
    rawReason: unknown,
    usageExample?: string
  ) => { valid: boolean; reason: string; error?: string };
};

describe("validateSkipReason", () => {
  it("accepts a valid single-line reason", () => {
    const result = validateSkipReason("Hotfix for production outage P1");
    assert.equal(result.valid, true);
    assert.equal(result.reason, "Hotfix for production outage P1");
  });

  it("trims whitespace and accepts the trimmed value", () => {
    const result = validateSkipReason("  valid reason  ");
    assert.equal(result.valid, true);
    assert.equal(result.reason, "valid reason");
  });

  it("rejects empty string", () => {
    const result = validateSkipReason("");
    assert.equal(result.valid, false);
    assert.ok(result.error !== undefined);
  });

  it("rejects undefined (treated as empty)", () => {
    const result = validateSkipReason(undefined);
    assert.equal(result.valid, false);
  });

  it("rejects reason longer than 500 characters", () => {
    const result = validateSkipReason("x".repeat(501));
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /too long/i);
  });

  it("rejects multiline reason (newline)", () => {
    const result = validateSkipReason("line one\nline two");
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /single-line/i);
  });

  it("rejects reason with carriage return", () => {
    const result = validateSkipReason("reason\rwith CR");
    assert.equal(result.valid, false);
  });

  it("rejects reason with control characters", () => {
    const result = validateSkipReason("reason\x07with bell");
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /control/i);
  });

  it("rejects Unicode bidi override characters", () => {
    const result = validateSkipReason("reason\u202Ewith bidi");
    assert.equal(result.valid, false);
  });

  it("includes usageExample in error message when provided", () => {
    const result = validateSkipReason("", "MY_FLAG=1");
    assert.ok(result.error?.includes("MY_FLAG=1"), "usageExample should appear in error");
  });
});
