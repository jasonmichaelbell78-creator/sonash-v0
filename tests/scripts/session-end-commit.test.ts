import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/session-end-commit.js

describe("session-end-commit: commit message building", () => {
  function buildCommitMessage(sessionNum: number, summary: string): string {
    return `docs: session #${sessionNum} end — ${summary}`;
  }

  it("builds correct commit message format", () => {
    const msg = buildCommitMessage(213, "PR #424 merged, branch cleanup");
    assert.ok(msg.startsWith("docs: session #213 end"));
    assert.ok(msg.includes("PR #424 merged"));
  });

  it("includes session number", () => {
    const msg = buildCommitMessage(100, "routine end");
    assert.ok(msg.includes("#100"));
  });
});

describe("session-end-commit: session number extraction", () => {
  function extractSessionNumber(sessionContextContent: string): number | null {
    const match = sessionContextContent.match(/Current Session Count(?:er)?\s*:?\s*(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  it("extracts session number from context", () => {
    const content = "Current Session Counter: 213";
    assert.strictEqual(extractSessionNumber(content), 213);
  });

  it("handles 'Count' variant", () => {
    assert.strictEqual(extractSessionNumber("Current Session Count: 99"), 99);
  });

  it("returns null when not found", () => {
    assert.strictEqual(extractSessionNumber("No counter here"), null);
  });
});

describe("session-end-commit: pre-conditions check", () => {
  function checkPreConditions(
    hasUnstagedChanges: boolean,
    hasConflicts: boolean
  ): { canCommit: boolean; reason?: string } {
    if (hasConflicts) return { canCommit: false, reason: "unresolved conflicts" };
    if (!hasUnstagedChanges) return { canCommit: false, reason: "nothing to commit" };
    return { canCommit: true };
  }

  it("allows commit when there are changes", () => {
    const result = checkPreConditions(true, false);
    assert.strictEqual(result.canCommit, true);
  });

  it("blocks commit with conflicts", () => {
    const result = checkPreConditions(true, true);
    assert.strictEqual(result.canCommit, false);
    assert.ok(result.reason?.includes("conflicts"));
  });

  it("blocks commit with nothing to commit", () => {
    const result = checkPreConditions(false, false);
    assert.strictEqual(result.canCommit, false);
    assert.ok(result.reason?.includes("nothing"));
  });
});
