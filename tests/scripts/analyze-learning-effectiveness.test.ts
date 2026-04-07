import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/analyze-learning-effectiveness.js

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
    .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]");
}

function sanitizeDisplayString(str: string | undefined | null, maxLength = 100): string {
  if (!str) return "";
  const sanitized = String(str)
    .replaceAll(/```[\s\S]*?```/g, "[CODE]")
    .replaceAll(/`[^`]+`/g, "[CODE]")
    .replaceAll(/C:\\Users\\[^\s]+/gi, "[PATH]")
    .replaceAll(/\/home\/[^\s]+/gi, "[PATH]")
    .replaceAll(/\/Users\/[^\s]+/gi, "[PATH]")
    .replaceAll(/\s+/g, " ")
    .trim();
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + "..." : sanitized;
}

function findArrayEnd(content: string, startIdx: number): number {
  const openIdx = content.indexOf("[", startIdx);
  if (openIdx === -1) return content.length;
  let depth = 0;
  for (let i = openIdx; i < content.length; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return content.length;
}

function parsePatternBlock(
  block: string
): { id: string; message: string; reviewRefs: string } | null {
  const idMatch = /["'`]([^"'`]+)["'`]/.exec(block);
  if (!idMatch) return null;
  const messageMatch = /message:\s*["'`]([^"'`]+)["'`]/.exec(block);
  const reviewMatch = /review:\s*["'`]([^"'`]+)["'`]/.exec(block);
  return {
    id: idMatch[1],
    message: messageMatch ? messageMatch[1] : "",
    reviewRefs: reviewMatch ? reviewMatch[1] : "",
  };
}

describe("analyze-learning-effectiveness: sanitizeError", () => {
  it("masks Windows user path", () => {
    const err = new Error(String.raw`File not found: C:\Users\JohnDoe\project\foo.ts`);
    assert.ok(sanitizeError(err).includes("[USER_PATH]"));
    assert.ok(!sanitizeError(err).includes("JohnDoe"));
  });

  it("masks Unix home path", () => {
    const err = new Error("Cannot read /home/alice/project/file.ts");
    assert.ok(sanitizeError(err).includes("[HOME]"));
    assert.ok(!sanitizeError(err).includes("alice"));
  });

  it("masks macOS Users path", () => {
    const err = new Error("File at /Users/bob/dev/sonash/src");
    assert.ok(sanitizeError(err).includes("[HOME]"));
  });

  it("passes safe messages unchanged", () => {
    const err = new Error("ENOENT: no such file");
    assert.strictEqual(sanitizeError(err), "ENOENT: no such file");
  });

  it("handles non-Error input", () => {
    assert.strictEqual(sanitizeError("some string error"), "some string error");
  });
});

describe("analyze-learning-effectiveness: sanitizeDisplayString", () => {
  it("replaces code blocks with [CODE]", () => {
    const result = sanitizeDisplayString("Use ```const x = 1``` here");
    assert.ok(result.includes("[CODE]"));
  });

  it("replaces inline code with [CODE]", () => {
    const result = sanitizeDisplayString("call `myFunction()` here");
    assert.ok(result.includes("[CODE]"));
  });

  it("truncates long strings", () => {
    const longStr = "x".repeat(200);
    const result = sanitizeDisplayString(longStr, 100);
    assert.ok(result.length <= 103); // 100 + "..."
    assert.ok(result.endsWith("..."));
  });

  it("returns empty string for null/undefined", () => {
    assert.strictEqual(sanitizeDisplayString(null), "");
    assert.strictEqual(sanitizeDisplayString(undefined), "");
  });

  it("collapses whitespace", () => {
    const result = sanitizeDisplayString("hello   world\n\ntest");
    assert.strictEqual(result, "hello world test");
  });
});

describe("analyze-learning-effectiveness: findArrayEnd", () => {
  it("finds end of simple array", () => {
    const content = "const arr = [1, 2, 3];";
    const end = findArrayEnd(content, 0);
    assert.strictEqual(content.substring(0, end), "const arr = [1, 2, 3]");
  });

  it("handles nested arrays", () => {
    const content = "[[1, 2], [3, 4]]";
    const end = findArrayEnd(content, 0);
    assert.strictEqual(end, 16);
  });

  it("returns content.length when no opening bracket", () => {
    const content = "no brackets here";
    const end = findArrayEnd(content, 0);
    assert.strictEqual(end, content.length);
  });

  it("handles empty array", () => {
    const content = "const x = [];";
    const end = findArrayEnd(content, 0);
    assert.strictEqual(content.slice(10, end), "[]");
  });
});

describe("analyze-learning-effectiveness: parsePatternBlock", () => {
  it("parses a valid pattern block", () => {
    const block = `"pattern-id"\n  message: "Don't do X"\n  review: "#123"`;
    const result = parsePatternBlock(block);
    assert.ok(result !== null);
    assert.strictEqual(result.id, "pattern-id");
    // The regex [^"'`]+ stops at the apostrophe in "Don't", so only "Don" is captured
    assert.strictEqual(result.message, "Don");
    assert.strictEqual(result.reviewRefs, "#123");
  });

  it("returns null when no quoted string found", () => {
    const block = "no quotes here";
    assert.strictEqual(parsePatternBlock(block), null);
  });

  it("handles missing message field", () => {
    const block = `"pattern-id"`;
    const result = parsePatternBlock(block);
    assert.ok(result !== null);
    assert.strictEqual(result.message, "");
  });

  it("handles missing review field", () => {
    const block = `"pattern-id" message: "some message"`;
    const result = parsePatternBlock(block);
    assert.ok(result !== null);
    assert.strictEqual(result.reviewRefs, "");
  });
});

function sanitizeForEscape(str: string | undefined | null, maxLength = 100): string {
  if (!str) return "";
  return String(str).replaceAll(/\s+/g, " ").trim().substring(0, maxLength);
}

function escapeMd(str: string, maxLength = 100): string {
  const sanitized = sanitizeForEscape(str, maxLength);
  return sanitized.replaceAll(/[\\[\]()_*`#>!-]/g, String.raw`\$&`);
}

describe("analyze-learning-effectiveness: escapeMd", () => {
  it("escapes markdown special characters", () => {
    const result = escapeMd("hello [world]");
    assert.ok(result.includes(String.raw`\[`));
    assert.ok(result.includes(String.raw`\]`));
  });

  it("escapes asterisks", () => {
    assert.ok(escapeMd("**bold**").includes(String.raw`\*`));
  });

  it("escapes backticks", () => {
    assert.ok(escapeMd("`code`").includes("\\`"));
  });

  it("handles empty string", () => {
    assert.strictEqual(escapeMd(""), "");
  });
});

// ---------------------------------------------------------------------------
// MVM helper functions (mirror of scripts/analyze-learning-effectiveness.js)
// ---------------------------------------------------------------------------

function calculateViolationsPerPr(
  warnings: Array<{ timestamp: string; pr?: string }>,
  options: { windowDays?: number } = {}
): { violationsPerPr: number; prCount: number; totalViolations: number; signal: string } {
  const windowDays = options.windowDays || 30;
  const cutoff = new Date(Date.now() - windowDays * 86400000);
  const recent = warnings.filter((w) => new Date(w.timestamp) >= cutoff);
  if (recent.length < 2) {
    return { violationsPerPr: 0, prCount: 0, totalViolations: 0, signal: "insufficient_data" };
  }
  const prs = new Set(recent.map((w) => w.pr).filter(Boolean));
  const prCount = Math.max(prs.size, 1);
  const violationsPerPr = +(recent.length / prCount).toFixed(2);
  return { violationsPerPr, prCount, totalViolations: recent.length, signal: "ok" };
}

function calculateRecurrenceRate(warnings: Array<{ category: string }>): {
  recurringCategories: number;
  totalCategories: number;
  recurrenceRate: number;
} {
  const counts: Record<string, number> = {};
  for (const w of warnings) {
    counts[w.category] = (counts[w.category] || 0) + 1;
  }
  const totalCategories = Object.keys(counts).length;
  const recurringCategories = Object.values(counts).filter((c) => c > 1).length;
  const recurrenceRate =
    totalCategories > 0 ? +(recurringCategories / totalCategories).toFixed(3) : 0;
  return { recurringCategories, totalCategories, recurrenceRate };
}

function calculateTrend(
  thisWeek: number[],
  lastWeek: number[]
): { direction: string; changePercent: number } {
  const sumThis = thisWeek.reduce((a, b) => a + b, 0);
  const sumLast = lastWeek.reduce((a, b) => a + b, 0);
  if (sumLast === 0) {
    return { direction: sumThis === 0 ? "stable" : "rising", changePercent: sumThis > 0 ? 100 : 0 };
  }
  const changePercent = +(((sumThis - sumLast) / sumLast) * 100).toFixed(1);
  const direction = changePercent < -10 ? "declining" : changePercent > 10 ? "rising" : "stable";
  return { direction, changePercent };
}

describe("calculateViolationsPerPr", () => {
  it("returns insufficient_data when fewer than 2 warnings in window", () => {
    const warnings = [{ timestamp: new Date().toISOString(), pr: "123" }];
    const result = calculateViolationsPerPr(warnings);
    assert.strictEqual(result.signal, "insufficient_data");
    assert.strictEqual(result.violationsPerPr, 0);
  });

  it("returns insufficient_data for empty array", () => {
    const result = calculateViolationsPerPr([]);
    assert.strictEqual(result.signal, "insufficient_data");
  });

  it("calculates violations per PR with distinct PRs", () => {
    const now = new Date().toISOString();
    const warnings = [
      { timestamp: now, pr: "pr-1" },
      { timestamp: now, pr: "pr-1" },
      { timestamp: now, pr: "pr-2" },
      { timestamp: now, pr: "pr-2" },
    ];
    const result = calculateViolationsPerPr(warnings);
    assert.strictEqual(result.signal, "ok");
    assert.strictEqual(result.prCount, 2);
    assert.strictEqual(result.violationsPerPr, 2.0);
    assert.strictEqual(result.totalViolations, 4);
  });

  it("uses prCount of 1 when no pr field present", () => {
    const now = new Date().toISOString();
    const warnings = [{ timestamp: now }, { timestamp: now }, { timestamp: now }];
    const result = calculateViolationsPerPr(warnings);
    assert.strictEqual(result.signal, "ok");
    assert.strictEqual(result.prCount, 1);
    assert.strictEqual(result.violationsPerPr, 3.0);
  });

  it("excludes warnings outside the window", () => {
    const old = new Date(Date.now() - 60 * 86400000).toISOString(); // 60 days ago
    const now = new Date().toISOString();
    const warnings = [
      { timestamp: old },
      { timestamp: old },
      { timestamp: now },
      { timestamp: now },
    ];
    const result = calculateViolationsPerPr(warnings, { windowDays: 30 });
    assert.strictEqual(result.totalViolations, 2);
  });
});

describe("calculateRecurrenceRate", () => {
  it("returns zero recurrence for all-unique categories", () => {
    const warnings = [{ category: "cat-a" }, { category: "cat-b" }, { category: "cat-c" }];
    const result = calculateRecurrenceRate(warnings);
    assert.strictEqual(result.recurringCategories, 0);
    assert.strictEqual(result.totalCategories, 3);
    assert.strictEqual(result.recurrenceRate, 0);
  });

  it("counts recurring categories correctly", () => {
    const warnings = [
      { category: "cat-a" },
      { category: "cat-a" },
      { category: "cat-b" },
      { category: "cat-b" },
      { category: "cat-c" },
    ];
    const result = calculateRecurrenceRate(warnings);
    assert.strictEqual(result.recurringCategories, 2);
    assert.strictEqual(result.totalCategories, 3);
    assert.ok(result.recurrenceRate > 0.66 && result.recurrenceRate < 0.668);
  });

  it("returns zero for empty warnings array", () => {
    const result = calculateRecurrenceRate([]);
    assert.strictEqual(result.recurrenceRate, 0);
    assert.strictEqual(result.totalCategories, 0);
  });

  it("handles all warnings in same category", () => {
    const warnings = [{ category: "same" }, { category: "same" }, { category: "same" }];
    const result = calculateRecurrenceRate(warnings);
    assert.strictEqual(result.recurringCategories, 1);
    assert.strictEqual(result.totalCategories, 1);
    assert.strictEqual(result.recurrenceRate, 1.0);
  });
});

describe("calculateTrend", () => {
  it("returns declining when this week is significantly lower", () => {
    const result = calculateTrend([1, 1, 1, 1, 1, 1, 1], [5, 5, 5, 5, 5, 5, 5]);
    assert.strictEqual(result.direction, "declining");
    assert.ok(result.changePercent < -10);
  });

  it("returns rising when this week is significantly higher", () => {
    const result = calculateTrend([5, 5, 5, 5, 5, 5, 5], [1, 1, 1, 1, 1, 1, 1]);
    assert.strictEqual(result.direction, "rising");
    assert.ok(result.changePercent > 10);
  });

  it("returns stable when change is within 10%", () => {
    const result = calculateTrend([10, 10, 10, 10, 10, 10, 10], [10, 10, 10, 10, 10, 10, 10]);
    assert.strictEqual(result.direction, "stable");
    assert.strictEqual(result.changePercent, 0);
  });

  it("returns stable when both weeks are zero", () => {
    const result = calculateTrend([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
    assert.strictEqual(result.direction, "stable");
  });

  it("returns rising when last week is zero but this week has violations", () => {
    const result = calculateTrend([3, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
    assert.strictEqual(result.direction, "rising");
    assert.strictEqual(result.changePercent, 100);
  });
});
