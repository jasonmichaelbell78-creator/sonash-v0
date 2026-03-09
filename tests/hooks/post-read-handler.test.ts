/**
 * Tests for .claude/hooks/post-read-handler.js
 *
 * The hook fires PostToolUse on Read operations. It:
 *   1. Tracks files read this session (context tracking)
 *   2. Warns when too many files are read or a single file is large
 *   3. Auto-saves context to MCP pending file when thresholds are exceeded
 *
 * We test the file path security normalization and context tracking logic.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";

// Extracted file path security logic from the hook
function normalizeFilePath(rawPath: string, projectDir: string): string {
  let filePath = rawPath;

  if (!filePath) return "";

  // Reject flag-like paths
  if (filePath.startsWith("-")) return "";

  // Reject paths with newlines/CRs
  if (filePath.includes("\n") || filePath.includes("\r")) return "";

  // Normalize backslashes
  filePath = filePath.replaceAll("\\", "/");

  // Convert absolute paths to relative
  if (path.isAbsolute(filePath) || /^[A-Za-z]:/.test(filePath)) {
    let canonicalized: string;
    try {
      canonicalized = path.resolve(filePath);
    } catch {
      canonicalized = path.resolve(filePath);
    }
    const rel = path.relative(projectDir, canonicalized);
    const isOutside = rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel);
    if (isOutside) {
      return "";
    } else {
      return rel.replaceAll("\\", "/");
    }
  }

  // Reject path traversal
  if (filePath.includes("/../") || /^\.\.(?:[\\/]|$)/.test(filePath) || filePath.endsWith("/..")) {
    return "";
  }

  return filePath;
}

// Extracted context state logic
interface ContextState {
  filesRead: string[];
  lastReset: number;
  warningShown: boolean;
}

function shouldWarnLargeFile(lineCount: number, limit: number, singleFileLimit: number): boolean {
  return lineCount > singleFileLimit && !limit;
}

function shouldWarnManyFiles(
  filesReadCount: number,
  sessionLimit: number,
  warningShown: boolean
): boolean {
  return filesReadCount >= sessionLimit && !warningShown;
}

function isContextStateExpired(state: ContextState, expiryMs: number): boolean {
  return Date.now() - state.lastReset > expiryMs;
}

// sanitizeContextData logic
interface Alert {
  type: string;
  severity: string;
  message: string;
  extra?: string; // extra field that should be stripped
}

interface ContextData {
  metrics?: object;
  sessionState?: { lastBegin?: string; lastEnd?: string; sessionCount?: number; extra?: string };
  alerts?: Alert[];
  decisions?: Array<{ date: string; title: string; extra?: string }>;
}

function sanitizeContextData(contextData: ContextData): object {
  return {
    metrics: contextData.metrics,
    sessionState: contextData.sessionState
      ? {
          lastBegin: contextData.sessionState.lastBegin,
          lastEnd: contextData.sessionState.lastEnd,
          sessionCount: contextData.sessionState.sessionCount,
        }
      : null,
    alerts: (contextData.alerts || []).map((a) => ({
      type: a.type,
      severity: a.severity,
      message: a.message,
    })),
    decisions: (contextData.decisions || []).map((d) => ({
      date: d.date,
      title: d.title,
    })),
  };
}

describe("normalizeFilePath: path security", () => {
  const projectDir = "/home/user/project";

  test("returns empty string for empty input", () => {
    assert.equal(normalizeFilePath("", projectDir), "");
  });

  test("returns empty string for flag-like paths", () => {
    assert.equal(normalizeFilePath("-r", projectDir), "");
    assert.equal(normalizeFilePath("--flag", projectDir), "");
  });

  test("returns empty string for paths with newlines", () => {
    assert.equal(normalizeFilePath("src/file\nnewline", projectDir), "");
  });

  test("returns empty string for paths with carriage returns", () => {
    assert.equal(normalizeFilePath("src/file\rpath", projectDir), "");
  });

  test("normalizes backslashes to forward slashes", () => {
    const result = normalizeFilePath(String.raw`src\module\util.ts`, projectDir);
    assert.ok(!result.includes("\\"), `Should not contain backslashes: ${result}`);
  });

  test("converts absolute path within project to relative", () => {
    const absPath = path.join(projectDir, "src", "util.ts");
    const result = normalizeFilePath(absPath, projectDir);
    assert.equal(result, "src/util.ts");
  });

  test("rejects absolute paths outside project", () => {
    const outsidePath = "/etc/passwd";
    const result = normalizeFilePath(outsidePath, projectDir);
    assert.equal(result, "");
  });

  test("rejects path traversal sequences", () => {
    assert.equal(normalizeFilePath("../../etc/passwd", projectDir), "");
    assert.equal(normalizeFilePath("src/../../outside", projectDir), "");
  });

  test("accepts simple relative paths", () => {
    const result = normalizeFilePath("src/components/Button.tsx", projectDir);
    assert.equal(result, "src/components/Button.tsx");
  });
});

describe("shouldWarnLargeFile", () => {
  const SINGLE_FILE_LINE_LIMIT = 5000;

  test("warns when lineCount exceeds limit and no pagination (limit=0)", () => {
    assert.equal(shouldWarnLargeFile(6000, 0, SINGLE_FILE_LINE_LIMIT), true);
  });

  test("does not warn when lineCount is within limit", () => {
    assert.equal(shouldWarnLargeFile(4000, 0, SINGLE_FILE_LINE_LIMIT), false);
  });

  test("does not warn when pagination limit is set (reading subset)", () => {
    assert.equal(shouldWarnLargeFile(6000, 100, SINGLE_FILE_LINE_LIMIT), false);
  });

  test("does not warn exactly at the threshold", () => {
    assert.equal(shouldWarnLargeFile(5000, 0, SINGLE_FILE_LINE_LIMIT), false);
  });
});

describe("shouldWarnManyFiles", () => {
  const SESSION_FILE_LIMIT = 15;

  test("warns when files read count reaches the session limit", () => {
    assert.equal(shouldWarnManyFiles(15, SESSION_FILE_LIMIT, false), true);
  });

  test("does not warn when under the limit", () => {
    assert.equal(shouldWarnManyFiles(14, SESSION_FILE_LIMIT, false), false);
  });

  test("does not warn twice (warningShown flag)", () => {
    assert.equal(shouldWarnManyFiles(15, SESSION_FILE_LIMIT, true), false);
    assert.equal(shouldWarnManyFiles(20, SESSION_FILE_LIMIT, true), false);
  });

  test("warns when files exceed limit (first time only)", () => {
    assert.equal(shouldWarnManyFiles(20, SESSION_FILE_LIMIT, false), true);
  });
});

describe("isContextStateExpired", () => {
  test("returns true when state is older than 30 minutes", () => {
    const state: ContextState = {
      filesRead: [],
      lastReset: Date.now() - 31 * 60 * 1000,
      warningShown: false,
    };
    assert.equal(isContextStateExpired(state, 30 * 60 * 1000), true);
  });

  test("returns false when state is fresh", () => {
    const state: ContextState = {
      filesRead: [],
      lastReset: Date.now() - 5 * 60 * 1000,
      warningShown: false,
    };
    assert.equal(isContextStateExpired(state, 30 * 60 * 1000), false);
  });
});

describe("sanitizeContextData", () => {
  test("strips extra fields from sessionState", () => {
    const contextData: ContextData = {
      sessionState: {
        lastBegin: "2026-03-09T08:00:00Z",
        lastEnd: "2026-03-09T09:00:00Z",
        sessionCount: 5,
        extra: "should be removed",
      },
    };
    const result = sanitizeContextData(contextData) as Record<string, unknown>;
    const sessionState = result.sessionState as Record<string, unknown>;
    assert.ok(!("extra" in sessionState), "extra field should be stripped");
    assert.equal(sessionState.sessionCount, 5);
  });

  test("strips extra fields from alerts", () => {
    const contextData: ContextData = {
      alerts: [
        { type: "warning", severity: "medium", message: "test alert", extra: "should be removed" },
      ],
    };
    const result = sanitizeContextData(contextData) as Record<string, unknown>;
    const alerts = result.alerts as Record<string, unknown>[];
    assert.ok(!("extra" in alerts[0]), "extra field should be stripped");
    assert.equal(alerts[0].message, "test alert");
  });

  test("strips extra fields from decisions", () => {
    const contextData: ContextData = {
      decisions: [{ date: "2026-03-09", title: "Use REST API", extra: "should be stripped" }],
    };
    const result = sanitizeContextData(contextData) as Record<string, unknown>;
    const decisions = result.decisions as Record<string, unknown>[];
    assert.ok(!("extra" in decisions[0]));
    assert.equal(decisions[0].title, "Use REST API");
  });

  test("handles null sessionState", () => {
    const contextData: ContextData = {};
    const result = sanitizeContextData(contextData) as Record<string, unknown>;
    assert.equal(result.sessionState, null);
  });

  test("handles empty alerts and decisions", () => {
    const contextData: ContextData = { alerts: [], decisions: [] };
    const result = sanitizeContextData(contextData) as Record<string, unknown>;
    assert.deepEqual(result.alerts, []);
    assert.deepEqual(result.decisions, []);
  });
});
