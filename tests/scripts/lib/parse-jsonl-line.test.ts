/**
 * parse-jsonl-line.js Test Suite
 *
 * Tests the JSONL line-parsing helpers from scripts/lib/parse-jsonl-line.js.
 * Both safeParseLine (skip-on-error) and safeParseLineWithError (error-preserving).
 *
 * The helper exists because pre-commit's pattern-compliance detector flags
 * every inline `try { JSON.parse(line) } catch` that uses an intermediate
 * assignment — so scripts/ and .claude/hooks/ route all single-line JSONL
 * parsing through this module instead. Tests verify both the happy path and
 * the rejection/null-return semantics that downstream callers rely on.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/parse-jsonl-line.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { safeParseLine, safeParseLineWithError } = require(MODULE_PATH) as {
  safeParseLine: (line: unknown) => unknown;
  safeParseLineWithError: (line: unknown) => { value: unknown; error: Error | null };
};

describe("safeParseLine", () => {
  it("parses a valid JSON object", () => {
    const result = safeParseLine('{"id":"DEBT-1","title":"example"}');
    assert.deepEqual(result, { id: "DEBT-1", title: "example" });
  });

  it("parses a valid JSON array", () => {
    const result = safeParseLine("[1,2,3]");
    assert.deepEqual(result, [1, 2, 3]);
  });

  it("parses nested objects", () => {
    const result = safeParseLine('{"a":{"b":{"c":true}}}');
    assert.deepEqual(result, { a: { b: { c: true } } });
  });

  it("trims surrounding whitespace before parsing", () => {
    const result = safeParseLine('   {"k":1}\t  ');
    assert.deepEqual(result, { k: 1 });
  });

  it("returns null for an empty string", () => {
    assert.equal(safeParseLine(""), null);
  });

  it("returns null for a whitespace-only string", () => {
    assert.equal(safeParseLine("   \t  "), null);
  });

  it("returns null for malformed JSON (missing quote)", () => {
    assert.equal(safeParseLine('{"k":value}'), null);
  });

  it("returns null for a trailing comma", () => {
    assert.equal(safeParseLine('{"k":1,}'), null);
  });

  it("returns null when passed a non-string (number)", () => {
    assert.equal(safeParseLine(42 as unknown), null);
  });

  it("returns null when passed undefined", () => {
    assert.equal(safeParseLine(undefined as unknown), null);
  });

  it("returns null when passed null", () => {
    assert.equal(safeParseLine(null as unknown), null);
  });

  it("parses a line whose value is a JSON primitive (string)", () => {
    assert.equal(safeParseLine('"hello"'), "hello");
  });

  it("parses a line whose value is a JSON primitive (number)", () => {
    assert.equal(safeParseLine("123"), 123);
  });
});

describe("safeParseLineWithError", () => {
  it("returns { value, error: null } on successful parse", () => {
    const result = safeParseLineWithError('{"id":"DEBT-2"}');
    assert.deepEqual(result.value, { id: "DEBT-2" });
    assert.equal(result.error, null);
  });

  it("returns { value: null, error: null } for an empty string (silent skip)", () => {
    const result = safeParseLineWithError("");
    assert.equal(result.value, null);
    assert.equal(result.error, null);
  });

  it("returns { value: null, error: null } for whitespace-only (silent skip)", () => {
    const result = safeParseLineWithError("   \n  ");
    assert.equal(result.value, null);
    assert.equal(result.error, null);
  });

  it("returns { value: null, error: Error } for malformed JSON", () => {
    const result = safeParseLineWithError("{not valid}");
    assert.equal(result.value, null);
    assert.ok(result.error instanceof Error);
  });

  it("error on malformed JSON has a useful message", () => {
    const result = safeParseLineWithError("{oops}");
    assert.ok(result.error);
    assert.ok(typeof result.error!.message === "string" && result.error!.message.length > 0);
  });

  it("returns { value: null, error: null } for non-string input (number)", () => {
    const result = safeParseLineWithError(42 as unknown);
    assert.equal(result.value, null);
    assert.equal(result.error, null);
  });

  it("returns { value: null, error: null } for non-string input (undefined)", () => {
    const result = safeParseLineWithError(undefined as unknown);
    assert.equal(result.value, null);
    assert.equal(result.error, null);
  });

  it("returns { value: null, error: null } for non-string input (null)", () => {
    const result = safeParseLineWithError(null as unknown);
    assert.equal(result.value, null);
    assert.equal(result.error, null);
  });

  it("wraps a non-Error throw into an Error instance", () => {
    // JSON.parse always throws SyntaxError, so this path is mostly defensive.
    // Validate the shape contract: error field is always an Error or null.
    const result = safeParseLineWithError("garbage");
    assert.ok(result.error instanceof Error);
  });
});

describe("module API surface", () => {
  it("exports safeParseLine as a function", () => {
    assert.equal(typeof safeParseLine, "function");
  });

  it("exports safeParseLineWithError as a function", () => {
    assert.equal(typeof safeParseLineWithError, "function");
  });

  it("safeParseLine and safeParseLineWithError produce consistent results on valid input", () => {
    const line = '{"a":1,"b":[2,3]}';
    const viaSimple = safeParseLine(line);
    const viaErrorForm = safeParseLineWithError(line);
    assert.deepEqual(viaErrorForm.value, viaSimple);
    assert.equal(viaErrorForm.error, null);
  });

  it("safeParseLine returns null where safeParseLineWithError returns { error: Error }", () => {
    const badLine = "{bad}";
    assert.equal(safeParseLine(badLine), null);
    const viaErrorForm = safeParseLineWithError(badLine);
    assert.equal(viaErrorForm.value, null);
    assert.ok(viaErrorForm.error instanceof Error);
  });
});
