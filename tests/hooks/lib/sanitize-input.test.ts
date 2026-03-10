/**
 * Tests for .claude/hooks/lib/sanitize-input.js
 *
 * Validates that sanitizeInput() strips control characters,
 * redacts secrets, and enforces length limits.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      /* existsSync race */
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

/* eslint-disable @typescript-eslint/no-require-imports */
const { sanitizeInput, SECRET_PATTERNS } = require(
  path.join(PROJECT_ROOT, ".claude/hooks/lib/sanitize-input.js")
) as {
  sanitizeInput: (value: string, maxLength?: number) => string;
  SECRET_PATTERNS: RegExp[];
};
/* eslint-enable @typescript-eslint/no-require-imports */

describe("sanitizeInput", () => {
  test("returns value unchanged for plain safe strings", () => {
    const result = sanitizeInput("hello world");
    assert.equal(result, "hello world");
  });

  test("returns falsy input as-is (null/undefined/empty passthrough)", () => {
    assert.equal(sanitizeInput(""), "");
    // @ts-expect-error testing JS runtime behavior
    assert.equal(sanitizeInput(null), null);
    // @ts-expect-error testing JS runtime behavior
    assert.equal(sanitizeInput(undefined), undefined);
  });

  test("strips control characters below ASCII 32 except tab, newline, CR", () => {
    // Bell (7), BS (8), vertical tab (11), form feed (12) should be stripped
    const input = "hello\x07\x08\x0bworld";
    const result = sanitizeInput(input);
    assert.equal(result, "helloworld");
  });

  test(String.raw`preserves tab (\t), newline (\n), and carriage return (\r)`, () => {
    const input = "line1\nline2\r\nindented\t";
    const result = sanitizeInput(input);
    assert.equal(result, input);
  });

  test("truncates output exceeding maxLength and appends ...[truncated]", () => {
    const long = "a".repeat(600);
    const result = sanitizeInput(long, 500);
    assert.ok(
      result.endsWith("...[truncated]"),
      `Expected truncation suffix, got: ${result.slice(-20)}`
    );
    assert.ok(result.length <= 514, "Truncated result should not be much longer than maxLength");
  });

  test("respects custom maxLength parameter", () => {
    const input = "abcdefghij";
    const result = sanitizeInput(input, 5);
    assert.ok(result.endsWith("...[truncated]"));
    assert.ok(result.startsWith("abcde"));
  });

  test("redacts bearer tokens", () => {
    const input = "Authorization: Bearer ABCDEF123456789";
    const result = sanitizeInput(input);
    assert.ok(result.includes("[REDACTED]"), `Expected redaction in: ${result}`);
    assert.ok(!result.includes("ABCDEF123456789"), "Token value should be removed");
  });

  test("redacts key=value patterns with sensitive names", () => {
    const input = 'api_key="super-secret-value-here"';
    const result = sanitizeInput(input);
    assert.ok(result.includes("[REDACTED]"), `Expected redaction in: ${result}`);
  });

  test("redacts password= patterns", () => {
    const input = "password=mysupersecretpassword123"; // NOSONAR — intentional test data for redaction testing
    const result = sanitizeInput(input);
    assert.ok(result.includes("[REDACTED]"), `Expected redaction in: ${result}`);
  });

  test("does not redact short common words (low false positive)", () => {
    // Short words under 24 chars with no digits should not trigger the token pattern
    const input = "hello world foo bar baz";
    const result = sanitizeInput(input);
    assert.equal(result, input);
  });

  test("redacts long alphanumeric tokens that mix letters and digits", () => {
    // 24+ chars with both letters and digits — looks like a token
    const token = "abc123def456ghi789jkl012";
    assert.equal(token.length, 24);
    const result = sanitizeInput(`token is ${token}`);
    assert.ok(result.includes("[REDACTED]"), `Expected redaction of long token in: ${result}`);
  });

  test("SECRET_PATTERNS is a non-empty array of RegExp", () => {
    assert.ok(Array.isArray(SECRET_PATTERNS));
    assert.ok(SECRET_PATTERNS.length > 0);
    for (const p of SECRET_PATTERNS) {
      assert.ok(p instanceof RegExp, `Expected RegExp, got ${typeof p}`);
    }
  });
});
