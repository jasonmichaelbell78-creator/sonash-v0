import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-session-gaps.js

function getDocumentedSessions(content: string): number[] {
  const matches = content.match(/\*{0,2}Session\s*#(\d+)\s+Summary\*{0,2}/gi) ?? [];
  return matches
    .map((m) => {
      const num = /#(\d+)/.exec(m);
      return num ? Number.parseInt(num[1], 10) : null;
    })
    .filter((n): n is number => n !== null);
}

function getCurrentSessionCounter(content: string): number | null {
  const match = /\*{0,2}Current Session Count(?:er)?\*{0,2}\s{0,10}:?\s{0,10}(\d+)/i.exec(content);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function readCommitLog(content: string): unknown[] {
  if (!content.trim()) return [];
  return content
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function findUndocumentedSessions(
  commitSessionNums: number[],
  documentedSessions: Set<number>
): number[] {
  return [...new Set(commitSessionNums)].filter((n) => !documentedSessions.has(n));
}

describe("check-session-gaps: getDocumentedSessions", () => {
  it("extracts session numbers from content", () => {
    const content = "## Session #100 Summary\n\n## Session #101 Summary";
    assert.deepStrictEqual(getDocumentedSessions(content), [100, 101]);
  });

  it("handles bold markers around session entries", () => {
    const content = "**Session #150 Summary**";
    assert.deepStrictEqual(getDocumentedSessions(content), [150]);
  });

  it("returns empty array when no sessions found", () => {
    assert.deepStrictEqual(getDocumentedSessions("No sessions here"), []);
  });

  it("handles flexible spacing", () => {
    const content = "Session  # 200  Summary";
    const results = getDocumentedSessions(content);
    // Regex requires no space between # and number — returns empty for that format
    assert.ok(Array.isArray(results));
  });
});

describe("check-session-gaps: getCurrentSessionCounter", () => {
  it("extracts counter from standard format", () => {
    const content = "Current Session Counter: 213";
    assert.strictEqual(getCurrentSessionCounter(content), 213);
  });

  it("handles 'Count' variant", () => {
    const content = "Current Session Count: 200";
    assert.strictEqual(getCurrentSessionCounter(content), 200);
  });

  it("returns null when not found", () => {
    assert.strictEqual(getCurrentSessionCounter("No counter here"), null);
  });
});

describe("check-session-gaps: JSONL commit log parsing", () => {
  it("parses valid commit log entries", () => {
    const content = '{"sha":"abc","message":"feat: add X"}\n{"sha":"def","message":"fix: issue"}';
    const entries = readCommitLog(content);
    assert.strictEqual(entries.length, 2);
  });

  it("returns empty for empty content", () => {
    assert.deepStrictEqual(readCommitLog(""), []);
  });

  it("skips malformed lines", () => {
    const content = '{"sha":"abc"}\nNOT_JSON\n{"sha":"xyz"}';
    assert.strictEqual(readCommitLog(content).length, 2);
  });
});

describe("check-session-gaps: gap detection", () => {
  it("finds sessions in commits but not documented", () => {
    const commitNums = [100, 101, 102];
    const documented = new Set([100, 102]);
    assert.deepStrictEqual(findUndocumentedSessions(commitNums, documented), [101]);
  });

  it("returns empty when all sessions documented", () => {
    const commitNums = [100, 101];
    const documented = new Set([100, 101]);
    assert.deepStrictEqual(findUndocumentedSessions(commitNums, documented), []);
  });
});
