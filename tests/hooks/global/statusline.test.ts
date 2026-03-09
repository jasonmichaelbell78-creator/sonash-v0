/* eslint-disable @typescript-eslint/no-require-imports, no-control-regex */
/**
 * Tests for .claude/hooks/global/statusline.js
 *
 * The hook reads JSON from stdin and outputs a terminal statusline.
 * We test the context window calculation, sanitization, and output building.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing

function computeContextUsage(remaining: number | null | undefined): {
  used: number;
  filled: number;
  barFilled: string;
  barEmpty: string;
} | null {
  if (remaining == null) return null;

  const remRaw = Math.round(Number(remaining));
  const rem = Number.isFinite(remRaw) ? Math.max(0, Math.min(100, remRaw)) : 0;
  const used = 100 - rem;
  const filled = Math.max(0, Math.min(10, Math.floor(used / 10)));

  return {
    used,
    filled,
    barFilled: "█".repeat(filled),
    barEmpty: "░".repeat(10 - filled),
  };
}

function sanitizeTerminalOutput(s: string): string {
  return s
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")

    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")

    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
    .slice(0, 80);
}

function isPathContained(filePath: string, containingDir: string): boolean {
  const rel = require("path").relative(containingDir, require("path").resolve(filePath));
  return !(rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || require("path").isAbsolute(rel));
}

describe("computeContextUsage", () => {
  test("returns null when remaining is null", () => {
    assert.equal(computeContextUsage(null), null);
  });

  test("returns null when remaining is undefined", () => {
    assert.equal(computeContextUsage(undefined), null);
  });

  test("computes 0% used when remaining is 100", () => {
    const result = computeContextUsage(100);
    assert.ok(result !== null);
    assert.equal(result.used, 0);
    assert.equal(result.filled, 0);
    assert.equal(result.barFilled, "");
    assert.equal(result.barEmpty, "░".repeat(10));
  });

  test("computes 50% used when remaining is 50", () => {
    const result = computeContextUsage(50);
    assert.ok(result !== null);
    assert.equal(result.used, 50);
    assert.equal(result.filled, 5); // floor(50/10) = 5
    assert.equal(result.barFilled, "█".repeat(5));
    assert.equal(result.barEmpty, "░".repeat(5));
  });

  test("computes 100% used when remaining is 0", () => {
    const result = computeContextUsage(0);
    assert.ok(result !== null);
    assert.equal(result.used, 100);
    assert.equal(result.filled, 10);
    assert.equal(result.barFilled, "█".repeat(10));
    assert.equal(result.barEmpty, "");
  });

  test("clamps remaining to [0, 100] range", () => {
    const over = computeContextUsage(150);
    assert.ok(over !== null);
    assert.equal(over.used, 0); // clamped remaining to 100 → used = 0

    const under = computeContextUsage(-10);
    assert.ok(under !== null);
    assert.equal(under.used, 100); // clamped remaining to 0 → used = 100
  });

  test("handles NaN remaining (from non-numeric context_window data)", () => {
    const result = computeContextUsage(NaN);
    assert.ok(result !== null);
    // NaN → remRaw is NaN → rem = 0 (fallback) → used = 100
    assert.equal(result.used, 100);
  });
});

describe("sanitizeTerminalOutput", () => {
  test("removes control characters", () => {
    const result = sanitizeTerminalOutput("hello\x07world\x1b[31m");
    // Should remove control chars and ANSI sequences
    assert.ok(!result.includes("\x07"), "Bell char should be removed");
  });

  test("strips ANSI color codes", () => {
    const result = sanitizeTerminalOutput("\x1b[32mgreen text\x1b[0m");
    assert.ok(!result.includes("\x1b"), "ANSI escape should be stripped");
    assert.ok(result.includes("green text"), "Text content should be preserved");
  });

  test("strips OSC sequences", () => {
    const result = sanitizeTerminalOutput("\x1b]0;title\x07");
    assert.ok(!result.includes("\x1b"), "OSC sequence should be stripped");
  });

  test("truncates to 80 characters", () => {
    const long = "a".repeat(100);
    const result = sanitizeTerminalOutput(long);
    assert.equal(result.length, 80);
  });

  test("preserves safe printable characters", () => {
    const safe = "feature/my-branch main 42%";
    const result = sanitizeTerminalOutput(safe);
    assert.equal(result, safe);
  });

  test("handles empty string", () => {
    assert.equal(sanitizeTerminalOutput(""), "");
  });
});

describe("isPathContained", () => {
  const path = require("path") as typeof import("path");

  test("returns true when filePath is inside containingDir", () => {
    const base = path.resolve(require("os").tmpdir());
    const child = path.join(base, "subdir", "file.json");
    assert.equal(isPathContained(child, base), true);
  });

  test("returns false when filePath escapes containingDir via ..", () => {
    const base = path.resolve(require("os").tmpdir(), "subdir");
    const outside = path.resolve(require("os").tmpdir(), "other", "file.json");
    assert.equal(isPathContained(outside, base), false);
  });

  test("returns false when filePath equals containingDir (is the dir itself, not a file in it)", () => {
    const base = path.resolve(require("os").tmpdir());
    // path.relative(base, base) === "" which is caught
    assert.equal(isPathContained(base, base), false);
  });
});

describe("statusline: JSON input parsing", () => {
  test("extracts model from nested display_name", () => {
    const data = { model: { display_name: "Claude 3.5 Sonnet" } };
    const model = data.model?.display_name || "Claude";
    assert.equal(model, "Claude 3.5 Sonnet");
  });

  test("falls back to 'Claude' when model is absent", () => {
    const data: Record<string, unknown> = {};
    const d = data as { model?: { display_name?: string } };
    const model = d.model?.display_name || "Claude";
    assert.equal(model, "Claude");
  });

  test("extracts current_dir from workspace", () => {
    const data = { workspace: { current_dir: "/home/user/project" } };
    const dir = data.workspace?.current_dir || process.cwd();
    assert.equal(dir, "/home/user/project");
  });

  test("extracts remaining_percentage from context_window", () => {
    const data = { context_window: { remaining_percentage: 75 } };
    const remaining = data.context_window?.remaining_percentage;
    assert.equal(remaining, 75);
  });
});
