import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/sync-reviews-to-jsonl.js

describe("sync-reviews-to-jsonl: tryLabelColonNumber", () => {
  function tryLabelColonNumber(text: string, afterLabel: number): number {
    let cursor = afterLabel;
    while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
    if (cursor >= text.length || text[cursor] !== ":") return -1;
    cursor++;
    while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
    const numStart = cursor;
    while (cursor < text.length && text[cursor] >= "0" && text[cursor] <= "9") cursor++;
    if (cursor > numStart) return Number.parseInt(text.slice(numStart, cursor), 10);
    return -1;
  }

  it("parses 'Label: 42' format", () => {
    const text = "Critical: 42";
    const afterLabel = "Critical".length;
    assert.strictEqual(tryLabelColonNumber(text, afterLabel), 42);
  });

  it("returns -1 when no colon follows", () => {
    const text = "Critical 42";
    assert.strictEqual(tryLabelColonNumber(text, 8), -1);
  });

  it("returns -1 when no number follows colon", () => {
    const text = "Critical: abc";
    assert.strictEqual(tryLabelColonNumber(text, 8), -1);
  });

  it("handles tabs as whitespace", () => {
    const text = "Issues:\t5";
    assert.strictEqual(tryLabelColonNumber(text, 6), 5);
  });
});

describe("sync-reviews-to-jsonl: tryNumberBeforeLabel", () => {
  function tryNumberBeforeLabel(text: string, beforePos: number): number {
    let cursor = beforePos;
    while (cursor >= 0 && (text[cursor] === " " || text[cursor] === "\t")) cursor--;
    if (cursor < 0 || text[cursor] < "0" || text[cursor] > "9") return -1;
    const numEnd = cursor + 1;
    while (cursor >= 0 && text[cursor] >= "0" && text[cursor] <= "9") cursor--;
    return Number.parseInt(text.slice(cursor + 1, numEnd), 10);
  }

  it("parses '42 LABEL' format", () => {
    const text = "42 CRITICAL";
    const pos = text.indexOf(" CRITICAL");
    assert.strictEqual(tryNumberBeforeLabel(text, pos - 1), 42);
  });

  it("returns -1 when no digit before position", () => {
    const text = "abc CRITICAL";
    assert.strictEqual(tryNumberBeforeLabel(text, 2), -1);
  });

  it("parses multi-digit numbers", () => {
    const text = "123 ISSUES";
    const pos = text.indexOf(" ISSUES");
    assert.strictEqual(tryNumberBeforeLabel(text, pos - 1), 123);
  });
});

describe("sync-reviews-to-jsonl: parseSeverityCount", () => {
  function tryLabelColonNumber(text: string, afterLabel: number): number {
    let cursor = afterLabel;
    while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
    if (cursor >= text.length || text[cursor] !== ":") return -1;
    cursor++;
    while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
    const numStart = cursor;
    while (cursor < text.length && text[cursor] >= "0" && text[cursor] <= "9") cursor++;
    if (cursor > numStart) return Number.parseInt(text.slice(numStart, cursor), 10);
    return -1;
  }

  function tryNumberBeforeLabel(text: string, beforePos: number): number {
    let cursor = beforePos;
    while (cursor >= 0 && (text[cursor] === " " || text[cursor] === "\t")) cursor--;
    if (cursor < 0 || text[cursor] < "0" || text[cursor] > "9") return -1;
    const numEnd = cursor + 1;
    while (cursor >= 0 && text[cursor] >= "0" && text[cursor] <= "9") cursor--;
    return Number.parseInt(text.slice(cursor + 1, numEnd), 10);
  }

  function parseSeverityCount(text: string, label: string): number {
    const lower = text.toLowerCase();
    const lowerLabel = label.toLowerCase();
    let idx = lower.indexOf(lowerLabel);
    while (idx !== -1) {
      const afterIdx = idx + lowerLabel.length;
      const colonResult = tryLabelColonNumber(text, afterIdx);
      if (colonResult >= 0) return colonResult;
      const beforeResult = tryNumberBeforeLabel(text, idx - 1);
      if (beforeResult >= 0) return beforeResult;
      idx = lower.indexOf(lowerLabel, afterIdx);
    }
    return 0;
  }

  it("parses 'Critical: 3' format", () => {
    assert.strictEqual(parseSeverityCount("Critical: 3", "critical"), 3);
  });

  it("parses '5 CRITICAL' format", () => {
    assert.strictEqual(parseSeverityCount("5 CRITICAL findings", "critical"), 5);
  });

  it("returns 0 when label not found", () => {
    assert.strictEqual(parseSeverityCount("nothing here", "critical"), 0);
  });

  it("is case-insensitive", () => {
    assert.strictEqual(parseSeverityCount("CRITICAL: 7", "critical"), 7);
  });
});

describe("sync-reviews-to-jsonl: sanitizeError", () => {
  function sanitizeError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  it("masks Windows paths", () => {
    const result = sanitizeError(new Error("at C:\\Users\\jbell\\project"));
    assert.ok(result.includes("[USER_PATH]"));
  });

  it("masks Unix home paths", () => {
    const result = sanitizeError(new Error("at /home/jbell/project"));
    assert.ok(result.includes("[HOME]"));
  });

  it("leaves safe messages intact", () => {
    assert.strictEqual(sanitizeError(new Error("file not found")), "file not found");
  });
});

describe("sync-reviews-to-jsonl: review ID parsing from markdown", () => {
  function extractReviewIds(content: string): number[] {
    const ids: number[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^####\s+Review\s+#(\d+)/);
      if (match) {
        ids.push(Number.parseInt(match[1], 10));
      }
    }
    return ids;
  }

  it("extracts review IDs from markdown headings", () => {
    const content = "#### Review #101\nsome content\n#### Review #102\nmore content";
    assert.deepStrictEqual(extractReviewIds(content), [101, 102]);
  });

  it("returns empty array when no reviews found", () => {
    assert.deepStrictEqual(extractReviewIds("# Title\n## Section"), []);
  });

  it("handles single review", () => {
    assert.deepStrictEqual(extractReviewIds("#### Review #42"), [42]);
  });
});
