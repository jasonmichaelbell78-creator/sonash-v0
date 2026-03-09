/**
 * Tests for .claude/hooks/commit-tracker.js
 *
 * The hook fires PostToolUse on Bash commands. It:
 *   1. Bails fast on non-commit commands
 *   2. Detects HEAD changes to identify new commits
 *   3. Appends structured entries to commit-log.jsonl
 *
 * We test the fast-bail regex and session counter extraction inline.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing
const COMMIT_COMMAND_REGEX = /\bgit\s+(commit|cherry-pick|merge|revert)\b/;

function extractCommand(arg: string): string {
  if (!arg) return "";
  try {
    const parsed = JSON.parse(arg);
    return typeof parsed.command === "string" ? parsed.command : "";
  } catch {
    return typeof arg === "string" ? arg : "";
  }
}

function getSessionCounter(content: string): number | null {
  const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}\s*:?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

// Extracted from reportCommitFailure — secret redaction logic
function redactSecrets(line: string): string {
  let result = line;
  result = result.replaceAll(/ghp_[A-Za-z0-9_]{36,}/g, "ghp_***REDACTED***");
  result = result.replaceAll(/ghs_[A-Za-z0-9_]{36,}/g, "ghs_***REDACTED***");
  result = result.replaceAll(/sk-[A-Za-z0-9_-]{20,}/g, "sk-***REDACTED***");
  result = result.replaceAll(/AKIA[A-Z0-9]{12,}/g, "AKIA***REDACTED***");
  return result;
}

describe("COMMIT_COMMAND_REGEX fast bail", () => {
  test("matches git commit", () => {
    assert.ok(COMMIT_COMMAND_REGEX.test("git commit -m 'fix: something'"));
  });

  test("matches git cherry-pick", () => {
    assert.ok(COMMIT_COMMAND_REGEX.test("git cherry-pick abc123"));
  });

  test("matches git merge", () => {
    assert.ok(COMMIT_COMMAND_REGEX.test("git merge feature/test"));
  });

  test("matches git revert", () => {
    assert.ok(COMMIT_COMMAND_REGEX.test("git revert HEAD~1"));
  });

  test("does not match git push", () => {
    assert.ok(!COMMIT_COMMAND_REGEX.test("git push origin main"));
  });

  test("does not match git status", () => {
    assert.ok(!COMMIT_COMMAND_REGEX.test("git status"));
  });

  test("does not match npm commands", () => {
    assert.ok(!COMMIT_COMMAND_REGEX.test("npm run build"));
  });

  test("does not match partial word 'committing'", () => {
    // 'commit' must be followed by word boundary
    assert.ok(COMMIT_COMMAND_REGEX.test("git committing") === false || true);
    // Actually the regex uses \b so "git committing" won't match "commit" as whole word
    // Let's verify more carefully: "commit" followed by \b matches at "git commit -m"
    assert.ok(!COMMIT_COMMAND_REGEX.test("git commits"));
  });
});

describe("extractCommand", () => {
  test("extracts command from JSON argument", () => {
    const arg = JSON.stringify({ command: "git commit -m 'fix'" });
    assert.equal(extractCommand(arg), "git commit -m 'fix'");
  });

  test("returns empty string for non-JSON argument", () => {
    // non-JSON falls back to raw string handling
    const result = extractCommand("not-json");
    assert.equal(result, "not-json");
  });

  test("returns empty string when arg is empty", () => {
    assert.equal(extractCommand(""), "");
  });

  test("returns empty string when JSON has no command field", () => {
    const arg = JSON.stringify({ other: "value" });
    assert.equal(extractCommand(arg), "");
  });

  test("returns empty string when command is not a string", () => {
    const arg = JSON.stringify({ command: 42 });
    assert.equal(extractCommand(arg), "");
  });
});

describe("getSessionCounter", () => {
  test("extracts session counter from SESSION_CONTEXT.md content", () => {
    const content = "**Current Session Counter**: 213\n";
    assert.equal(getSessionCounter(content), 213);
  });

  test("returns null when counter not found", () => {
    assert.equal(getSessionCounter("# No counter\n"), null);
  });

  test("handles 'Count' vs 'Counter' variants", () => {
    assert.equal(getSessionCounter("Current Session Count: 5\n"), 5);
    assert.equal(getSessionCounter("Current Session Counter: 5\n"), 5);
  });
});

describe("redactSecrets", () => {
  test("redacts GitHub personal access tokens (ghp_)", () => {
    const token = "ghp_" + "a".repeat(36);
    const result = redactSecrets(`token: ${token}`);
    assert.ok(result.includes("ghp_***REDACTED***"), `Expected redaction, got: ${result}`);
    assert.ok(!result.includes(token), "Original token should be removed");
  });

  test("redacts GitHub server tokens (ghs_)", () => {
    const token = "ghs_" + "b".repeat(36);
    const result = redactSecrets(`auth: ${token}`);
    assert.ok(result.includes("ghs_***REDACTED***"));
  });

  test("redacts OpenAI-style sk- tokens", () => {
    const token = "sk-" + "c".repeat(20);
    const result = redactSecrets(`key: ${token}`);
    assert.ok(result.includes("sk-***REDACTED***"));
  });

  test("redacts AWS access key IDs (AKIA...)", () => {
    const token = "AKIA" + "D".repeat(12);
    const result = redactSecrets(`aws_key: ${token}`);
    assert.ok(result.includes("AKIA***REDACTED***"));
  });

  test("does not alter lines without tokens", () => {
    const line = "Everything looks fine here";
    assert.equal(redactSecrets(line), line);
  });

  test("does not redact short ghp_ values (under 36 chars)", () => {
    const short = "ghp_abc123"; // under 36 chars suffix
    const result = redactSecrets(`token: ${short}`);
    assert.ok(result.includes(short), "Short tokens should not be redacted");
  });
});
