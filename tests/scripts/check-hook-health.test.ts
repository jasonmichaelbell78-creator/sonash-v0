import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

// Re-implements core logic from scripts/check-hook-health.js

function isPathContainedHookHealth(targetDir: string, baseDir: string): boolean {
  const rel = path.relative(baseDir, targetDir);
  return !(/^\.\.(?:[\\/]|$)/.test(rel) || rel === ".." || path.isAbsolute(rel));
}

function parseSessionState(content: string): object | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isHookFile(filename: string): boolean {
  return filename.endsWith(".js") || filename.endsWith(".ts");
}

function isTestFile(filename: string): boolean {
  return filename.includes(".test.") || filename.includes(".spec.");
}

describe("check-hook-health: path containment validation", () => {
  it("accepts path within base directory", () => {
    const base = "/project";
    const target = "/project/hooks";
    assert.strictEqual(isPathContainedHookHealth(target, base), true);
  });

  it("rejects path outside base directory", () => {
    const base = "/project";
    const target = "/other";
    assert.strictEqual(isPathContainedHookHealth(target, base), false);
  });
});

describe("check-hook-health: session state parsing", () => {
  it("parses valid session state JSON", () => {
    const content = JSON.stringify({ sessionActive: true, startTime: "2026-01-01" });
    const state = parseSessionState(content);
    assert.ok(state !== null);
  });

  it("returns null for invalid JSON", () => {
    assert.strictEqual(parseSessionState("not json"), null);
  });

  it("returns null for JSON array", () => {
    assert.strictEqual(parseSessionState("[]"), null);
  });

  it("returns null for null JSON value", () => {
    assert.strictEqual(parseSessionState("null"), null);
  });
});

describe("check-hook-health: hook file syntax check", () => {
  it("identifies JS hook files", () => {
    assert.strictEqual(isHookFile("pattern-check.js"), true);
  });

  it("identifies TS hook files", () => {
    assert.strictEqual(isHookFile("symlink-guard.ts"), true);
  });

  it("does not flag non-script files", () => {
    assert.strictEqual(isHookFile("README.md"), false);
  });

  it("identifies test files", () => {
    assert.strictEqual(isTestFile("pattern-check.test.ts"), true);
  });
});

describe("check-hook-health: ANSI color codes", () => {
  const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
  };

  function colorize(text: string, color: string, useTty: boolean): string {
    if (!useTty) return text;
    return `${color}${text}${COLORS.reset}`;
  }

  it("wraps text with ANSI codes when TTY", () => {
    const result = colorize("error!", COLORS.red, true);
    assert.ok(result.startsWith("\x1b[31m"));
    assert.ok(result.endsWith("\x1b[0m"));
  });

  it("returns plain text when not TTY", () => {
    const result = colorize("error!", COLORS.red, false);
    assert.strictEqual(result, "error!");
  });
});
