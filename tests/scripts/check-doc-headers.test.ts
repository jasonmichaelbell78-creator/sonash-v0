import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-doc-headers.js

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function parseDocHeaderArgs(argv: string[]): { verbose: boolean; checkAll: boolean } {
  return {
    verbose: argv.includes("--verbose"),
    checkAll: argv.includes("--all"),
  };
}

describe("check-doc-headers: required headers validation", () => {
  const REQUIRED_HEADERS = ["Document Version", "Last Updated", "Status"];

  function validateHeaders(content: string): string[] {
    return REQUIRED_HEADERS.filter((h) => !content.includes(h));
  }

  it("passes document with all headers", () => {
    const content = "Document Version: 1.0\nLast Updated: 2026-01-01\nStatus: ACTIVE";
    assert.strictEqual(validateHeaders(content).length, 0);
  });

  it("reports missing Document Version", () => {
    const content = "Last Updated: 2026-01-01\nStatus: ACTIVE";
    assert.ok(validateHeaders(content).includes("Document Version"));
  });

  it("reports all missing headers for new doc", () => {
    const missing = validateHeaders("# New Document\nJust content.");
    assert.strictEqual(missing.length, 3);
  });
});

describe("check-doc-headers: EXEMPT_PATTERNS", () => {
  const EXEMPT_PATTERNS = [
    /^\.github\//,
    /^\.claude\//,
    /CHANGELOG\.md$/i,
    /^README\.md$/i,
    /^LICENSE/i,
  ];

  function isExempt(filePath: string): boolean {
    const normalized = filePath.replaceAll("\\", "/");
    return EXEMPT_PATTERNS.some((p) => p.test(normalized));
  }

  it("exempts .github/ files", () => {
    assert.strictEqual(isExempt(".github/PULL_REQUEST_TEMPLATE.md"), true);
  });

  it("exempts .claude/ files", () => {
    assert.strictEqual(isExempt(".claude/hooks/pattern-check.js"), true);
  });

  it("exempts CHANGELOG.md", () => {
    assert.strictEqual(isExempt("CHANGELOG.md"), true);
  });

  it("exempts README.md", () => {
    assert.strictEqual(isExempt("README.md"), true);
  });

  it("does not exempt regular docs", () => {
    assert.strictEqual(isExempt("docs/TECHNICAL_DEBT.md"), false);
  });
});

describe("check-doc-headers: getErrorMessage", () => {
  it("extracts message from Error", () => {
    assert.strictEqual(getErrorMessage(new Error("file not found")), "file not found");
  });

  it("converts non-Error to string", () => {
    assert.strictEqual(getErrorMessage("raw string"), "raw string");
  });

  it("handles numeric errors", () => {
    assert.strictEqual(getErrorMessage(42), "42");
  });
});

describe("check-doc-headers: argument parsing", () => {
  it("parses --verbose flag", () => {
    assert.strictEqual(parseDocHeaderArgs(["--verbose"]).verbose, true);
  });

  it("parses --all flag", () => {
    assert.strictEqual(parseDocHeaderArgs(["--all"]).checkAll, true);
  });

  it("defaults to false for both", () => {
    const result = parseDocHeaderArgs([]);
    assert.strictEqual(result.verbose, false);
    assert.strictEqual(result.checkAll, false);
  });
});
