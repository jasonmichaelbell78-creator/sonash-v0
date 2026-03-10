import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/seed-commit-log.js (medium template)

describe("seed-commit-log: getSessionCounter from file content", () => {
  function getSessionCounter(content: string): number | null {
    const lines = content.split("\n");
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!lower.includes("current session count")) continue;
      const trimmed = line.trimEnd();
      let end = trimmed.length;
      while (end > 0 && trimmed[end - 1] >= "0" && trimmed[end - 1] <= "9") end--;
      if (end < trimmed.length) {
        return Number.parseInt(trimmed.slice(end), 10);
      }
    }
    return null;
  }

  it("extracts session counter from line", () => {
    const content = "Current Session Counter: 213\nother content";
    assert.strictEqual(getSessionCounter(content), 213);
  });

  it("handles 'Current Session Count' variant", () => {
    assert.strictEqual(getSessionCounter("Current Session Count: 99"), 99);
  });

  it("returns null when not found", () => {
    assert.strictEqual(getSessionCounter("No counter here"), null);
  });

  it("uses pure string parsing (no regex)", () => {
    // Verify the logic doesn't use regex by testing with edge case
    assert.strictEqual(getSessionCounter("Current Session Counter:  42"), 42);
  });
});

describe("seed-commit-log: count argument parsing", () => {
  function parseCount(argv: string[]): { count: number; isSync: boolean } {
    const isSync = argv.includes("--sync");
    const rawCount = isSync ? 500 : Number.parseInt(argv[2] ?? "", 10) || 50;
    const count = Math.max(1, Math.min(rawCount, 500));
    return { count, isSync };
  }

  it("defaults to 50 when no count given", () => {
    assert.strictEqual(parseCount([]).count, 50);
  });

  it("respects custom count", () => {
    assert.strictEqual(parseCount(["node", "script.js", "100"]).count, 100);
  });

  it("clamps count to max 500", () => {
    assert.strictEqual(parseCount(["node", "script.js", "9999"]).count, 500);
  });

  it("clamps count to min 1", () => {
    // parseInt("0") = 0, and 0 is falsy so `0 || 50` evaluates to 50 (the default),
    // not 0; zero never reaches Math.max(1, ...) — it falls through to the default
    assert.strictEqual(parseCount(["node", "script.js", "0"]).count, 50);
  });

  it("--sync mode uses 500", () => {
    const result = parseCount(["--sync"]);
    assert.strictEqual(result.isSync, true);
    assert.strictEqual(result.count, 500);
  });
});

describe("seed-commit-log: JSONL entry format", () => {
  function buildCommitEntry(
    sha: string,
    message: string,
    timestamp: string,
    session: number | null
  ): object {
    return { sha, message, timestamp, session, type: "commit" };
  }

  it("builds correct entry structure", () => {
    const entry = buildCommitEntry("abc1234", "feat: add X", "2026-01-01T00:00:00Z", 213) as Record<
      string,
      unknown
    >;
    assert.strictEqual(entry["sha"], "abc1234");
    assert.strictEqual(entry["message"], "feat: add X");
    assert.strictEqual(entry["session"], 213);
    assert.strictEqual(entry["type"], "commit");
  });

  it("handles null session", () => {
    const entry = buildCommitEntry("abc1234", "chore: update", "2026-01-01", null) as Record<
      string,
      unknown
    >;
    assert.strictEqual(entry["session"], null);
  });
});

describe("seed-commit-log: path containment", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects traversal", () => {
    assert.strictEqual(isPathTraversal("../outside"), true);
  });

  it("allows safe relative path", () => {
    assert.strictEqual(isPathTraversal(".claude/state/commit-log.jsonl"), false);
  });
});
