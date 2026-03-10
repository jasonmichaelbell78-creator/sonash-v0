import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-pattern-sync.js

function extractPatternIds(content: string): string[] {
  const ids: string[] = [];
  const regex = /\|\s*(ANTI-\d{3}|PAT-\d{3}|[A-Z]+-\d{3,4})\s*\|/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function findMismatches(
  codePatterns: Set<string>,
  learnedPatterns: Set<string>
): { onlyInCode: string[]; onlyInLearned: string[] } {
  const onlyInCode = [...codePatterns].filter((p) => !learnedPatterns.has(p));
  const onlyInLearned = [...learnedPatterns].filter((p) => !codePatterns.has(p));
  return { onlyInCode, onlyInLearned };
}

describe("check-pattern-sync: pattern ID extraction", () => {
  it("extracts pattern IDs from markdown table", () => {
    const content = "| ANTI-001 | description | medium |";
    const ids = extractPatternIds(content);
    assert.ok(ids.includes("ANTI-001"));
  });

  it("handles multiple IDs in table", () => {
    const content = "| ANTI-001 | desc |\n| ANTI-002 | desc |";
    assert.strictEqual(extractPatternIds(content).length, 2);
  });

  it("returns empty for content without IDs", () => {
    assert.deepStrictEqual(extractPatternIds("No patterns here"), []);
  });
});

describe("check-pattern-sync: sync status comparison", () => {
  it("identifies patterns only in code patterns doc", () => {
    const code = new Set(["PAT-001", "PAT-002"]);
    const learned = new Set(["PAT-001"]);
    const { onlyInCode } = findMismatches(code, learned);
    assert.deepStrictEqual(onlyInCode, ["PAT-002"]);
  });

  it("identifies patterns only in learned log", () => {
    const code = new Set(["PAT-001"]);
    const learned = new Set(["PAT-001", "PAT-NEW"]);
    const { onlyInLearned } = findMismatches(code, learned);
    assert.deepStrictEqual(onlyInLearned, ["PAT-NEW"]);
  });

  it("returns empty when perfectly synced", () => {
    const code = new Set(["PAT-001", "PAT-002"]);
    const learned = new Set(["PAT-001", "PAT-002"]);
    const result = findMismatches(code, learned);
    assert.deepStrictEqual(result.onlyInCode, []);
    assert.deepStrictEqual(result.onlyInLearned, []);
  });
});
