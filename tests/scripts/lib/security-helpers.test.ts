/**
 * security-helpers.js Test Suite
 *
 * Tests the reusable security helper functions from scripts/lib/security-helpers.js.
 * Validates path traversal prevention, URL allowlisting, filename sanitization,
 * CLI argument parsing, regex execution, and email masking.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

// Locate project root — walk up until package.json is found
function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/security-helpers.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const helpers = require(MODULE_PATH) as {
  sanitizeError: (error: unknown) => string;
  sanitizeDisplayString: (str: string, maxLength?: number) => string;
  escapeMd: (str: string, maxLength?: number) => string;
  validatePathInDir: (baseDir: string, userPath: string) => string;
  safeWriteFile: (
    filePath: string,
    content: string,
    options?: { allowOverwrite?: boolean }
  ) => void;
  safeReadFile: (
    filePath: string,
    description: string
  ) => { success: boolean; content?: string; error?: string };
  sanitizeFilename: (name: string, options?: { maxLength?: number; fallback?: string }) => string;
  parseCliArgs: (args: string[], schema: Record<string, unknown>) => Record<string, unknown>;
  validateUrl: (
    urlString: string,
    allowedHosts: string[]
  ) => { valid: boolean; url?: URL; error?: string };
  safeRegexExec: (pattern: RegExp, content: string) => RegExpExecArray[];
  maskEmail: (email: string) => string;
};

// =========================================================
// sanitizeError (security-helpers local version)
// =========================================================

describe("security-helpers.sanitizeError", () => {
  it("returns sanitized message from Error objects", () => {
    const err = new Error("Something broke");
    const result = helpers.sanitizeError(err);
    assert.equal(result, "Something broke");
  });

  it("redacts Windows user paths", () => {
    const err = new Error(String.raw`File at C:\Users\alice\secret.txt not found`);
    const result = helpers.sanitizeError(err);
    assert.ok(!result.includes(String.raw`C:\Users\alice`), "Windows user path should be redacted");
    assert.ok(result.includes("[USER_PATH]") || result.includes("[PATH]"), "Should be replaced");
  });

  it("redacts Linux home paths", () => {
    const err = new Error("Cannot access /home/bob/.config");
    const result = helpers.sanitizeError(err);
    assert.ok(!result.includes("/home/bob"), "Linux home path should be redacted");
  });

  it("handles non-Error string input", () => {
    const result = helpers.sanitizeError("simple error string");
    assert.equal(result, "simple error string");
  });
});

// =========================================================
// sanitizeDisplayString
// =========================================================

describe("security-helpers.sanitizeDisplayString", () => {
  it("returns empty string for empty input", () => {
    assert.equal(helpers.sanitizeDisplayString(""), "");
  });

  it("returns empty string for null/undefined-like falsy", () => {
    // The function checks !str, so false/null/undefined all return ""
    assert.equal(helpers.sanitizeDisplayString("" as string), "");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(200);
    const result = helpers.sanitizeDisplayString(long, 50);
    assert.ok(result.length <= 53, "Result should be at most maxLength + ellipsis");
    assert.ok(result.endsWith("..."), "Should end with ellipsis when truncated");
  });

  it("replaces code blocks with [CODE]", () => {
    const result = helpers.sanitizeDisplayString("Here is `some code` inline");
    assert.ok(!result.includes("`some code`"), "Inline code should be replaced");
    assert.ok(result.includes("[CODE]"), "Should contain [CODE]");
  });

  it("replaces fenced code blocks with [CODE]", () => {
    const result = helpers.sanitizeDisplayString("```\nconst x = 1;\n```");
    assert.ok(!result.includes("const x"), "Code block content should be replaced");
    assert.ok(result.includes("[CODE]"), "Should contain [CODE]");
  });

  it("redacts macOS home paths", () => {
    const result = helpers.sanitizeDisplayString("File at /Users/charlie/doc.txt");
    assert.ok(!result.includes("/Users/charlie"), "macOS home path should be replaced");
    assert.ok(result.includes("[PATH]"), "Should contain [PATH]");
  });

  it("collapses multiple spaces into one", () => {
    const result = helpers.sanitizeDisplayString("hello   world");
    assert.ok(!result.includes("   "), "Multiple spaces should be collapsed");
  });
});

// =========================================================
// escapeMd
// =========================================================

describe("security-helpers.escapeMd", () => {
  it("escapes Markdown metacharacters", () => {
    const result = helpers.escapeMd("hello *world* [link](url)");
    assert.ok(!result.includes("*world*"), "Asterisks should be escaped");
    assert.ok(!result.includes("[link]"), "Brackets should be escaped");
  });

  it("handles empty string", () => {
    const result = helpers.escapeMd("");
    assert.equal(result, "");
  });

  it("truncates at maxLength", () => {
    const long = "a".repeat(200);
    const result = helpers.escapeMd(long, 50);
    assert.ok(result.length <= 54, "Should be truncated to maxLength + ellipsis");
  });
});

// =========================================================
// validatePathInDir
// =========================================================

describe("security-helpers.validatePathInDir", () => {
  it("returns relative path for a valid in-bounds path", () => {
    const base = "/tmp/mydir";
    const result = helpers.validatePathInDir(base, "subdir/file.txt");
    assert.equal(result, path.normalize("subdir/file.txt"));
  });

  it("throws for path traversal using ..", () => {
    const base = "/tmp/mydir";
    assert.throws(
      () => helpers.validatePathInDir(base, "../etc/passwd"),
      (err: Error) => {
        assert.ok(err.message.includes("mydir"), "Error should mention base dir name");
        return true;
      }
    );
  });

  it("throws for empty path", () => {
    const base = "/tmp/mydir";
    assert.throws(() => helpers.validatePathInDir(base, ""), /Path must be within/);
  });

  it("throws for whitespace-only path", () => {
    const base = "/tmp/mydir";
    assert.throws(() => helpers.validatePathInDir(base, "   "), /Path must be within/);
  });

  it("throws for path that resolves to the base directory itself", () => {
    const base = "/tmp/mydir";
    // Resolving base+. gives base — relative is "" which should be rejected
    assert.throws(() => helpers.validatePathInDir(base, "."), /Path must be within/);
  });

  it("allows nested subdirectory paths", () => {
    const base = "/tmp/mydir";
    const result = helpers.validatePathInDir(base, "a/b/c/file.json");
    assert.ok(result.includes("a"), "Nested path should be returned");
    assert.ok(!result.includes(".."), "Result should not contain ..");
  });
});

// =========================================================
// sanitizeFilename
// =========================================================

describe("security-helpers.sanitizeFilename", () => {
  it("replaces path separators with underscores", () => {
    const result = helpers.sanitizeFilename("path/to/file");
    assert.ok(!result.includes("/"), "Forward slashes should be removed");
    assert.ok(result.includes("_"), "Should replace with underscore");
  });

  it("replaces spaces with underscores", () => {
    const result = helpers.sanitizeFilename("my file name");
    assert.ok(!result.includes(" "), "Spaces should be replaced");
    assert.ok(result.includes("_"), "Should replace with underscore");
  });

  it("strips leading dashes", () => {
    const result = helpers.sanitizeFilename("--my-file");
    assert.ok(!result.startsWith("-"), "Leading dashes should be stripped");
  });

  it("uses fallback for empty input", () => {
    const result = helpers.sanitizeFilename("");
    assert.equal(result, "UNNAMED");
  });

  it("uses custom fallback when provided", () => {
    const result = helpers.sanitizeFilename("", { fallback: "DEFAULT" });
    assert.equal(result, "DEFAULT");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(100);
    const result = helpers.sanitizeFilename(long, { maxLength: 10 });
    assert.ok(result.length <= 10, "Result should not exceed maxLength");
  });

  it("allows alphanumeric, underscores, dots, and hyphens", () => {
    const result = helpers.sanitizeFilename("valid-file_name.txt");
    assert.equal(result, "valid-file_name.txt");
  });
});

// =========================================================
// parseCliArgs
// =========================================================

describe("security-helpers.parseCliArgs", () => {
  it("parses boolean flags", () => {
    const schema = { "--verbose": { type: "boolean" } };
    const result = helpers.parseCliArgs(["--verbose"], schema);
    assert.equal(result["--verbose"], true);
  });

  it("defaults boolean flags to false when not provided", () => {
    const schema = { "--verbose": { type: "boolean" } };
    const result = helpers.parseCliArgs([], schema);
    assert.equal(result["--verbose"], false);
  });

  it("parses string options", () => {
    const schema = { "--output": { type: "string" } };
    const result = helpers.parseCliArgs(["--output", "file.txt"], schema);
    assert.equal(result["--output"], "file.txt");
  });

  it("parses number options", () => {
    const schema = { "--count": { type: "number", min: 1, max: 100 } };
    const result = helpers.parseCliArgs(["--count", "42"], schema);
    assert.equal(result["--count"], 42);
  });

  it("throws when number is below min", () => {
    const schema = { "--count": { type: "number", min: 5, max: 100 } };
    assert.throws(() => helpers.parseCliArgs(["--count", "2"], schema), /must be >=/);
  });

  it("throws when number is above max", () => {
    const schema = { "--count": { type: "number", min: 1, max: 10 } };
    assert.throws(() => helpers.parseCliArgs(["--count", "99"], schema), /must be <=/);
  });

  it("throws when required argument is missing", () => {
    const schema = { "--input": { type: "string", required: true } };
    assert.throws(() => helpers.parseCliArgs([], schema), /is required/);
  });

  it("throws when value for string option is another flag", () => {
    const schema = { "--output": { type: "string" }, "--verbose": { type: "boolean" } };
    assert.throws(() => helpers.parseCliArgs(["--output", "--verbose"], schema), /Missing value/);
  });

  it("ignores unknown flags", () => {
    const schema = { "--known": { type: "boolean" } };
    // Should not throw for unknown flags
    const result = helpers.parseCliArgs(["--unknown", "--known"], schema);
    assert.equal(result["--known"], true);
  });
});

// =========================================================
// validateUrl
// =========================================================

describe("security-helpers.validateUrl", () => {
  it("accepts valid HTTPS URL on allowlist", () => {
    const result = helpers.validateUrl("https://api.example.com/v1/data", ["api.example.com"]);
    assert.equal(result.valid, true);
    assert.ok(result.url instanceof URL, "Should return parsed URL");
  });

  it("rejects HTTP URLs (non-HTTPS)", () => {
    const result = helpers.validateUrl("http://api.example.com/data", ["api.example.com"]);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("HTTPS"), "Error should mention HTTPS");
  });

  it("rejects localhost URLs", () => {
    const result = helpers.validateUrl("https://localhost:3000/api", ["localhost"]);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("Localhost") || result.error?.includes("loopback"));
  });

  it("rejects 127.0.0.1", () => {
    const result = helpers.validateUrl("https://127.0.0.1/api", ["127.0.0.1"]);
    assert.equal(result.valid, false);
  });

  it("rejects IP addresses even if on allowlist", () => {
    const result = helpers.validateUrl("https://8.8.8.8/dns", ["8.8.8.8"]);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("IP addresses"), "Error should mention IP addresses");
  });

  it("rejects hostname not on allowlist", () => {
    const result = helpers.validateUrl("https://evil.com/steal", ["api.example.com"]);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("not in allowlist"), "Error should mention allowlist");
  });

  it("rejects malformed URL", () => {
    const result = helpers.validateUrl("not-a-url", ["example.com"]);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("Invalid URL"), "Error should mention invalid URL");
  });

  it("does NOT accept subdomain that was not explicitly allowlisted", () => {
    // Only exact hostname match should be allowed
    const result = helpers.validateUrl("https://sub.example.com/data", ["example.com"]);
    assert.equal(result.valid, false);
  });
});

// =========================================================
// safeRegexExec
// =========================================================

describe("security-helpers.safeRegexExec", () => {
  it("returns all matches for a global pattern", () => {
    const pattern = /\d+/g;
    const matches = helpers.safeRegexExec(pattern, "abc 123 def 456");
    assert.equal(matches.length, 2);
    assert.equal(matches[0][0], "123");
    assert.equal(matches[1][0], "456");
  });

  it("returns empty array when no matches", () => {
    const pattern = /\d+/g;
    const matches = helpers.safeRegexExec(pattern, "no numbers here");
    assert.equal(matches.length, 0);
  });

  it("throws when pattern does not have /g flag", () => {
    const pattern = /\d+/;
    assert.throws(() => helpers.safeRegexExec(pattern, "123"), /must have \/g flag/);
  });

  it("resets lastIndex before execution to avoid state leakage", () => {
    const pattern = /\d+/g;
    pattern.lastIndex = 999; // Poison the state
    const matches = helpers.safeRegexExec(pattern, "abc 42");
    assert.equal(matches.length, 1, "Should find match despite poisoned lastIndex");
    assert.equal(matches[0][0], "42");
  });

  it("handles empty string content", () => {
    const pattern = /\w+/g;
    const matches = helpers.safeRegexExec(pattern, "");
    assert.equal(matches.length, 0);
  });
});

// =========================================================
// maskEmail
// =========================================================

describe("security-helpers.maskEmail", () => {
  it("masks a simple email address", () => {
    const result = helpers.maskEmail("user@example.com");
    assert.ok(result.includes("@"), "Should contain @");
    assert.ok(!result.includes("user"), "Local part should be masked");
    assert.ok(result.startsWith("u"), "Should keep first character of local part");
    assert.ok(result.includes("***"), "Should use *** masking");
  });

  it("keeps first character of local part", () => {
    const result = helpers.maskEmail("alice@company.org");
    assert.ok(result.startsWith("a"), "Should keep first character 'a'");
  });

  it("keeps TLD visible", () => {
    const result = helpers.maskEmail("user@example.com");
    assert.ok(result.endsWith(".com"), "TLD should be preserved");
  });

  it("returns [REDACTED] for invalid email without @", () => {
    const result = helpers.maskEmail("notanemail");
    assert.equal(result, "[REDACTED]");
  });

  it("returns [REDACTED] for null/undefined-like input", () => {
    const result = helpers.maskEmail(null as unknown as string);
    assert.equal(result, "[REDACTED]");
  });

  it("returns [REDACTED] for empty string", () => {
    const result = helpers.maskEmail("");
    assert.equal(result, "[REDACTED]");
  });

  it("handles subdomain emails", () => {
    const result = helpers.maskEmail("user@mail.subdomain.example.com");
    assert.ok(result.includes("@"), "Should still contain @");
    assert.ok(!result.includes("user"), "Local part should be masked");
  });
});

// =========================================================
// safeReadFile
// =========================================================

describe("security-helpers.safeReadFile", () => {
  it("returns success:true with content for existing file", () => {
    // Use a file we know exists
    const result = helpers.safeReadFile(path.resolve(PROJECT_ROOT, "package.json"), "package.json");
    assert.equal(result.success, true);
    assert.ok(typeof result.content === "string", "Content should be a string");
    assert.ok(result.content.length > 0, "Content should not be empty");
  });

  it("returns success:false with error for non-existent file", () => {
    const result = helpers.safeReadFile("/does/not/exist/file.json", "test file");
    assert.equal(result.success, false);
    assert.ok(typeof result.error === "string", "Error should be a string");
    assert.ok(result.error.includes("not found") || result.error.includes("ENOENT"));
  });

  it("uses the description in the not-found error message", () => {
    const result = helpers.safeReadFile("/no/such/path.txt", "My Config File");
    assert.equal(result.success, false);
    assert.ok(result.error?.includes("My Config File"), "Error should reference description");
  });
});
