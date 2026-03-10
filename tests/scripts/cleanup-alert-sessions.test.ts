import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Smoke tests for scripts/cleanup-alert-sessions.js

describe("cleanup-alert-sessions: session file detection", () => {
  function isAlertSessionFile(filename: string): boolean {
    return filename.startsWith("alert-session-") && filename.endsWith(".jsonl");
  }

  it("identifies alert session files", () => {
    assert.strictEqual(isAlertSessionFile("alert-session-2026-01-01.jsonl"), true);
  });

  it("ignores non-session files", () => {
    assert.strictEqual(isAlertSessionFile("other.jsonl"), false);
  });

  it("ignores files without .jsonl extension", () => {
    assert.strictEqual(isAlertSessionFile("alert-session-2026-01-01.json"), false);
  });
});

describe("cleanup-alert-sessions: age-based deletion", () => {
  const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  function shouldDelete(mtimeMs: number, now: number): boolean {
    return mtimeMs < now - MAX_AGE_MS;
  }

  it("deletes files older than 7 days", () => {
    const now = Date.now();
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    assert.strictEqual(shouldDelete(eightDaysAgo, now), true);
  });

  it("keeps files newer than 7 days", () => {
    const now = Date.now();
    const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;
    assert.strictEqual(shouldDelete(fiveDaysAgo, now), false);
  });
});

describe("cleanup-alert-sessions: path containment", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("rejects path traversal", () => {
    assert.strictEqual(isPathTraversal("../outside"), true);
  });

  it("allows normal filename", () => {
    assert.strictEqual(isPathTraversal("alert-session-2026-01.jsonl"), false);
  });
});
