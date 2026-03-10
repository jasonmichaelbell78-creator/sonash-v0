import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/append-hook-warning.js

describe("append-hook-warning: warning message building", () => {
  function buildWarningMessage(hookName: string, reason: string, timestamp: string): string {
    return `<!-- HOOK WARNING: ${hookName} — ${reason} — ${timestamp} -->`;
  }

  it("builds correct warning comment format", () => {
    const msg = buildWarningMessage("pre-push", "pattern violation", "2026-01-01");
    assert.ok(msg.startsWith("<!-- HOOK WARNING:"));
    assert.ok(msg.includes("pre-push"));
    assert.ok(msg.includes("pattern violation"));
    assert.ok(msg.endsWith("-->"));
  });
});

describe("append-hook-warning: deduplication check", () => {
  function hasExistingWarning(content: string, hookName: string): boolean {
    return content.includes(`HOOK WARNING: ${hookName}`);
  }

  it("detects existing warning for same hook", () => {
    const content = "<!-- HOOK WARNING: pre-push — test — 2026-01-01 -->";
    assert.strictEqual(hasExistingWarning(content, "pre-push"), true);
  });

  it("does not false-positive on different hook names", () => {
    const content = "<!-- HOOK WARNING: pre-commit — test -->";
    assert.strictEqual(hasExistingWarning(content, "pre-push"), false);
  });

  it("returns false for content without warnings", () => {
    assert.strictEqual(hasExistingWarning("plain content", "pre-push"), false);
  });
});

describe("append-hook-warning: path containment", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects traversal", () => {
    assert.strictEqual(isPathTraversal("../../etc"), true);
  });

  it("allows safe path", () => {
    assert.strictEqual(isPathTraversal(".claude/hooks/WARNINGS.md"), false);
  });
});
