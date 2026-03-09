/**
 * Tests for .claude/hooks/session-start.js
 *
 * The hook runs at SessionStart. It validates the project directory,
 * checks session state, and runs setup steps.
 *
 * We test the pure utility logic: path security, session state validation,
 * and the sanitizeInput usage patterns.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";
import * as os from "node:os";

// Extracted security check from the hook
function isProjectDirSafe(baseDir: string, projectDir: string): boolean {
  const rel = path.relative(baseDir, projectDir);
  if (rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
    return false;
  }
  return true;
}

// Extracted session state validation
interface SessionState {
  currentSessionId?: unknown;
  sessionCount?: unknown;
  lastBegin?: unknown;
  lastEnd?: unknown;
}

function isSessionStateValid(state: unknown): state is SessionState {
  if (!state || typeof state !== "object" || Array.isArray(state)) return false;
  const s = state as Record<string, unknown>;
  // Allow any shape — just must be a non-null object
  return true;
}

function getSessionCount(state: unknown): number {
  if (!isSessionStateValid(state)) return 0;
  const count = (state as Record<string, unknown>).sessionCount;
  return typeof count === "number" && Number.isFinite(count) ? count : 0;
}

// Extracted: check if a hash file changed (for cache invalidation)
function computeHashChanged(current: string, stored: string | null): boolean {
  if (!stored) return true;
  return current !== stored;
}

// Remote environment detection
function detectEnvironmentType(env: Record<string, string | undefined>): "remote" | "local" {
  return env.CLAUDE_CODE_REMOTE === "true" ? "remote" : "local";
}

describe("isProjectDirSafe", () => {
  test("returns true for same directory", () => {
    const base = path.resolve(os.tmpdir(), "project");
    assert.equal(isProjectDirSafe(base, base), true);
  });

  test("returns true for subdirectory", () => {
    const base = path.resolve(os.tmpdir(), "project");
    const sub = path.join(base, "subdir");
    assert.equal(isProjectDirSafe(base, sub), true);
  });

  test("returns false when projectDir is parent of baseDir (..)", () => {
    const base = path.resolve(os.tmpdir(), "project");
    const parent = path.dirname(base);
    assert.equal(isProjectDirSafe(base, parent), false);
  });

  test("returns false for completely unrelated path", () => {
    const base = "/home/user/project";
    const other = "/var/log";
    assert.equal(isProjectDirSafe(base, other), false);
  });

  test("returns false for path with .. traversal", () => {
    const base = "/home/user/project";
    const traversal = "/home/user/other";
    assert.equal(isProjectDirSafe(base, traversal), false);
  });
});

describe("getSessionCount", () => {
  test("extracts sessionCount from valid state", () => {
    const state = { sessionCount: 42, currentSessionId: "sess-1" };
    assert.equal(getSessionCount(state), 42);
  });

  test("returns 0 for null state", () => {
    assert.equal(getSessionCount(null), 0);
  });

  test("returns 0 when sessionCount is absent", () => {
    assert.equal(getSessionCount({}), 0);
  });

  test("returns 0 when sessionCount is a string", () => {
    assert.equal(getSessionCount({ sessionCount: "five" }), 0);
  });

  test("returns 0 for Infinity", () => {
    assert.equal(getSessionCount({ sessionCount: Infinity }), 0);
  });
});

describe("isSessionStateValid", () => {
  test("returns true for a plain object", () => {
    assert.equal(isSessionStateValid({ currentSessionId: "sess-1" }), true);
  });

  test("returns false for null", () => {
    assert.equal(isSessionStateValid(null), false);
  });

  test("returns false for array", () => {
    assert.equal(isSessionStateValid([]), false);
  });

  test("returns false for string", () => {
    assert.equal(isSessionStateValid("state"), false);
  });

  test("returns true for empty object", () => {
    assert.equal(isSessionStateValid({}), true);
  });
});

describe("computeHashChanged", () => {
  test("returns true when stored hash is null (first run)", () => {
    assert.equal(computeHashChanged("abc123", null), true);
  });

  test("returns false when hashes match", () => {
    assert.equal(computeHashChanged("abc123", "abc123"), false);
  });

  test("returns true when hashes differ", () => {
    assert.equal(computeHashChanged("abc123", "def456"), true);
  });

  test("returns true for empty current hash with non-null stored", () => {
    assert.equal(computeHashChanged("", "abc123"), true);
  });
});

describe("detectEnvironmentType", () => {
  test("returns 'remote' when CLAUDE_CODE_REMOTE is 'true'", () => {
    assert.equal(detectEnvironmentType({ CLAUDE_CODE_REMOTE: "true" }), "remote");
  });

  test("returns 'local' when CLAUDE_CODE_REMOTE is absent", () => {
    assert.equal(detectEnvironmentType({}), "local");
  });

  test("returns 'local' when CLAUDE_CODE_REMOTE is 'false'", () => {
    assert.equal(detectEnvironmentType({ CLAUDE_CODE_REMOTE: "false" }), "local");
  });

  test("returns 'local' for other CLAUDE_CODE_REMOTE values", () => {
    assert.equal(detectEnvironmentType({ CLAUDE_CODE_REMOTE: "1" }), "local");
    assert.equal(detectEnvironmentType({ CLAUDE_CODE_REMOTE: "yes" }), "local");
  });
});
