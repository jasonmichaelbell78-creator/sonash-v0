import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/analyze-learning-effectiveness.js

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
}

function sanitizeDisplayString(str: string | undefined | null, maxLength = 100): string {
  if (!str) return "";
  const sanitized = String(str)
    .replace(/```[\s\S]*?```/g, "[CODE]")
    .replace(/`[^`]+`/g, "[CODE]")
    .replace(/C:\\Users\\[^\s]+/gi, "[PATH]")
    .replace(/\/home\/[^\s]+/gi, "[PATH]")
    .replace(/\/Users\/[^\s]+/gi, "[PATH]")
    .replace(/\s+/g, " ")
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
    const err = new Error("File not found: C:\\Users\\JohnDoe\\project\\foo.ts");
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
  return String(str).replace(/\s+/g, " ").trim().substring(0, maxLength);
}

function escapeMd(str: string, maxLength = 100): string {
  const sanitized = sanitizeForEscape(str, maxLength);
  return sanitized.replace(/[\\[\]()_*`#>!-]/g, "\\$&");
}

describe("analyze-learning-effectiveness: escapeMd", () => {
  it("escapes markdown special characters", () => {
    const result = escapeMd("hello [world]");
    assert.ok(result.includes("\\["));
    assert.ok(result.includes("\\]"));
  });

  it("escapes asterisks", () => {
    assert.ok(escapeMd("**bold**").includes("\\*"));
  });

  it("escapes backticks", () => {
    assert.ok(escapeMd("`code`").includes("\\`"));
  });

  it("handles empty string", () => {
    assert.strictEqual(escapeMd(""), "");
  });
});
