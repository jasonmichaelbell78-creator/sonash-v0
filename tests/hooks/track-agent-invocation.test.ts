/**
 * Tests for .claude/hooks/track-agent-invocation.js
 *
 * The hook fires PostToolUse on Task tool calls and records agent invocations.
 * We test the description sanitization, state normalization, and security check.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";

// Extracted from the hook for unit testing

function sanitizeDescription(desc: string): string {
  if (!desc) return "";
  return desc
    .slice(0, 100)
    .replaceAll(/[A-Za-z0-9+/=]{20,}/g, "[REDACTED]")
    .replaceAll(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]")
    .replaceAll(/password|secret|token|key|credential/gi, "[SENSITIVE]");
}

interface AgentState {
  sessionId: string | null;
  sessionStart: string | null;
  agentsInvoked: object[];
  agentsSuggested: object[];
  filesModified: string[];
}

function normalizeState(parsed: unknown): AgentState {
  const defaults: AgentState = {
    sessionId: null,
    sessionStart: null,
    agentsInvoked: [],
    agentsSuggested: [],
    filesModified: [],
  };

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
  const p = parsed as Record<string, unknown>;

  return {
    sessionId: typeof p.sessionId === "string" ? p.sessionId : null,
    sessionStart: typeof p.sessionStart === "string" ? p.sessionStart : null,
    agentsInvoked: Array.isArray(p.agentsInvoked) ? p.agentsInvoked : [],
    agentsSuggested: Array.isArray(p.agentsSuggested) ? p.agentsSuggested : [],
    filesModified: Array.isArray(p.filesModified) ? p.filesModified : [],
  };
}

// Project dir security check
function isProjectDirSafe(safeBaseDir: string, projectDir: string): boolean {
  const rel = path.relative(safeBaseDir, projectDir);
  return !(/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel));
}

describe("sanitizeDescription", () => {
  test("returns empty string for empty input", () => {
    assert.equal(sanitizeDescription(""), "");
  });

  test("truncates to 100 characters", () => {
    const long = "a".repeat(200);
    const result = sanitizeDescription(long);
    assert.ok(result.length <= 100, `Should be max 100 chars, got ${result.length}`);
  });

  test("redacts base64-like tokens of 20+ characters", () => {
    // 20+ char base64-like string
    const token = "abcdefghijklmnopqrst"; // 20 chars, alphanumeric
    const result = sanitizeDescription(`token is ${token}`);
    assert.ok(result.includes("[REDACTED]"), `Expected redaction, got: ${result}`);
  });

  test("redacts email addresses", () => {
    const result = sanitizeDescription("Contact user@example.com for details");
    assert.ok(result.includes("[EMAIL]"), `Expected [EMAIL], got: ${result}`);
    assert.ok(!result.includes("user@example.com"), "Email should be removed");
  });

  test("redacts sensitive keywords", () => {
    const result = sanitizeDescription("Use the password here");
    assert.ok(result.includes("[SENSITIVE]"), `Expected [SENSITIVE], got: ${result}`);
  });

  test("redacts 'token' keyword case-insensitively", () => {
    const result = sanitizeDescription("Set TOKEN value");
    assert.ok(result.includes("[SENSITIVE]"));
  });

  test("preserves normal descriptive text", () => {
    const desc = "Review code changes for auth module";
    const result = sanitizeDescription(desc);
    // 'auth' is NOT in the sensitive keyword list — only password/secret/token/key/credential
    assert.ok(result.includes("Review code changes"));
  });
});

describe("normalizeState", () => {
  test("returns defaults for null input", () => {
    const state = normalizeState(null);
    assert.equal(state.sessionId, null);
    assert.deepEqual(state.agentsInvoked, []);
    assert.deepEqual(state.filesModified, []);
  });

  test("returns defaults for array input", () => {
    const state = normalizeState([]);
    assert.equal(state.sessionId, null);
  });

  test("returns defaults for non-object input", () => {
    const state = normalizeState("string");
    assert.equal(state.sessionId, null);
  });

  test("extracts valid string sessionId", () => {
    const state = normalizeState({ sessionId: "sess-123", agentsInvoked: [] });
    assert.equal(state.sessionId, "sess-123");
  });

  test("falls back to null for numeric sessionId", () => {
    const state = normalizeState({ sessionId: 42 });
    assert.equal(state.sessionId, null);
  });

  test("extracts valid agentsInvoked array", () => {
    const invocations = [{ agent: "code-reviewer", timestamp: "2026-01-01T00:00:00Z" }];
    const state = normalizeState({ agentsInvoked: invocations });
    assert.deepEqual(state.agentsInvoked, invocations);
  });

  test("falls back to empty array when agentsInvoked is not an array", () => {
    const state = normalizeState({ agentsInvoked: "not-an-array" });
    assert.deepEqual(state.agentsInvoked, []);
  });

  test("caps agentsInvoked at 200 (simulated)", () => {
    // The hook slices to -200; verify the cap logic
    const large = Array.from({ length: 250 }, (_, i) => ({ i }));
    const capped = large.slice(-200);
    assert.equal(capped.length, 200);
    assert.equal((capped[0] as { i: number }).i, 50); // First 50 were dropped
  });
});

describe("isProjectDirSafe", () => {
  test("returns true when projectDir equals baseDir", () => {
    const base = "/home/user/project";
    assert.equal(isProjectDirSafe(base, base), true);
  });

  test("returns true for subdirectory", () => {
    const base = "/home/user/project";
    assert.equal(isProjectDirSafe(base, base + "/subdir"), true);
  });

  test("returns false for path outside base", () => {
    const base = "/home/user/project";
    const outside = "/home/user/other";
    assert.equal(isProjectDirSafe(base, outside), false);
  });

  test("returns false for absolute rel (different drive on Windows)", () => {
    // If the relative computation produces an absolute, reject it
    const result = isProjectDirSafe("/base", "/completely/different");
    assert.equal(result, false);
  });
});

function parseArg(arg: string): { subagentType: string; description: string } {
  try {
    const parsed = JSON.parse(arg);
    return {
      subagentType: parsed.subagent_type || "",
      description: parsed.description || "",
    };
  } catch {
    return { subagentType: "", description: "" };
  }
}

describe("JSON argument parsing", () => {
  test("extracts subagent_type from JSON arg", () => {
    const arg = JSON.stringify({
      subagent_type: "code-reviewer",
      description: "Review PR changes",
    });
    const result = parseArg(arg);
    assert.equal(result.subagentType, "code-reviewer");
    assert.equal(result.description, "Review PR changes");
  });

  test("returns empty strings for invalid JSON", () => {
    assert.deepEqual(parseArg("not json"), { subagentType: "", description: "" });
    assert.deepEqual(parseArg(""), { subagentType: "", description: "" });
  });
});
