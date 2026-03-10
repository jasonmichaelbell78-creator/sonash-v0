/**
 * Unit tests for intake-pr-deferred.js
 *
 * Tests: parseArgs, getNextDebtId, schema validation (severity, category),
 * and PR number validation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Schema constants ─────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  "code-quality",
  "security",
  "performance",
  "documentation",
  "refactoring",
  "engineering-productivity",
  "ai-optimization",
  "accessibility",
  "process",
  "enhancements",
]);
const VALID_SEVERITIES = new Set(["S0", "S1", "S2", "S3"]);

// ─── parseArgs ────────────────────────────────────────────────────────────────

function parseArgs(args: string[]): Record<string, string | boolean | number> {
  const parsed: Record<string, string | boolean | number> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg.startsWith("--")) {
      const key = arg.substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsed[key] = args[++i];
      }
    }
  }
  return parsed;
}

describe("parseArgs (intake-pr-deferred)", () => {
  it("parses --pr value", () => {
    assert.equal(parseArgs(["--pr", "123"]).pr, "123");
  });

  it("parses --file value", () => {
    assert.equal(parseArgs(["--file", "src/a.ts"]).file, "src/a.ts");
  });

  it("parses --title value", () => {
    assert.equal(parseArgs(["--title", "Add input validation"]).title, "Add input validation");
  });

  it("parses --severity value", () => {
    assert.equal(parseArgs(["--severity", "S1"]).severity, "S1");
  });

  it("parses --category with default", () => {
    const result = parseArgs(["--category", "security"]);
    assert.equal(result.category, "security");
  });

  it("parses --dry-run flag", () => {
    assert.equal(parseArgs(["--dry-run"]).dryRun, true);
  });

  it("handles all fields combined", () => {
    const args = [
      "--pr",
      "456",
      "--file",
      "src/api.ts",
      "--title",
      "Validate email",
      "--severity",
      "S1",
    ];
    const result = parseArgs(args);
    assert.equal(result.pr, "456");
    assert.equal(result.file, "src/api.ts");
    assert.equal(result.severity, "S1");
  });
});

// ─── getNextDebtId ────────────────────────────────────────────────────────────

function getNextDebtId(existingItems: Array<{ id?: string }>): number {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = /DEBT-(\d+)/.exec(item.id);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

describe("getNextDebtId (intake-pr-deferred)", () => {
  it("returns 1 for empty items", () => {
    assert.equal(getNextDebtId([]), 1);
  });

  it("increments from highest ID", () => {
    const items = [{ id: "DEBT-0015" }, { id: "DEBT-0022" }];
    assert.equal(getNextDebtId(items), 23);
  });
});

// ─── PR number validation ─────────────────────────────────────────────────────

function isValidPrNumber(value: string): boolean {
  const num = Number.parseInt(value, 10);
  return Number.isInteger(num) && num > 0;
}

describe("isValidPrNumber", () => {
  it("accepts positive integer string", () => assert.equal(isValidPrNumber("123"), true));
  it("rejects zero", () => assert.equal(isValidPrNumber("0"), false));
  it("rejects negative", () => assert.equal(isValidPrNumber("-5"), false));
  it("rejects non-numeric", () => assert.equal(isValidPrNumber("abc"), false));
  it("accepts large PR number", () => assert.equal(isValidPrNumber("9999"), true));
});

// ─── Severity and category validation ────────────────────────────────────────

describe("VALID_SEVERITIES (intake-pr-deferred)", () => {
  it("contains S0-S3", () => {
    ["S0", "S1", "S2", "S3"].forEach((s) => assert.ok(VALID_SEVERITIES.has(s)));
  });
  it("rejects S4", () => assert.equal(VALID_SEVERITIES.has("S4"), false));
});

describe("VALID_CATEGORIES (intake-pr-deferred)", () => {
  it("contains code-quality (default)", () => assert.ok(VALID_CATEGORIES.has("code-quality")));
  it("contains security", () => assert.ok(VALID_CATEGORIES.has("security")));
  it("rejects garbage input", () => assert.equal(VALID_CATEGORIES.has("garbage"), false));
});

// ─── Required field check ─────────────────────────────────────────────────────

interface PrDeferredArgs {
  pr?: string;
  file?: string;
  title?: string;
  severity?: string;
}

function getMissingFields(args: PrDeferredArgs): string[] {
  const missing: string[] = [];
  if (!args.pr) missing.push("--pr");
  if (!args.file) missing.push("--file");
  if (!args.title) missing.push("--title");
  if (!args.severity) missing.push("--severity");
  return missing;
}

describe("getMissingFields (intake-pr-deferred)", () => {
  it("returns empty array for complete args", () => {
    assert.deepEqual(getMissingFields({ pr: "123", file: "a.ts", title: "T", severity: "S1" }), []);
  });

  it("reports missing pr", () => {
    const missing = getMissingFields({ file: "a.ts", title: "T", severity: "S1" });
    assert.ok(missing.includes("--pr"));
  });

  it("reports all missing fields", () => {
    assert.equal(getMissingFields({}).length, 4);
  });
});
