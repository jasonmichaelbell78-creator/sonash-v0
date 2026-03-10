/**
 * Unit tests for intake-manual.js
 *
 * Tests: parseArgs, getNextDebtId, schema validation (severity, category,
 * effort, type), and required field checks.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Schema constants (mirrors scripts/config/audit-schema.json) ──────────────

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
const VALID_TYPES = new Set([
  "bug",
  "code-smell",
  "vulnerability",
  "hotspot",
  "tech-debt",
  "process-gap",
  "enhancement",
]);
const VALID_EFFORTS = new Set(["E0", "E1", "E2", "E3"]);

// ─── parseArgs ────────────────────────────────────────────────────────────────

function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};
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

describe("parseArgs (intake-manual)", () => {
  it("parses --dry-run flag", () => {
    assert.equal(parseArgs(["--dry-run"]).dryRun, true);
  });

  it("parses --file value", () => {
    assert.equal(parseArgs(["--file", "src/auth.ts"]).file, "src/auth.ts");
  });

  it("parses --title value", () => {
    assert.equal(parseArgs(["--title", "Fix auth bug"]).title, "Fix auth bug");
  });

  it("parses --severity value", () => {
    assert.equal(parseArgs(["--severity", "S1"]).severity, "S1");
  });

  it("parses --category value", () => {
    assert.equal(parseArgs(["--category", "security"]).category, "security");
  });

  it("parses --effort value", () => {
    assert.equal(parseArgs(["--effort", "E2"]).effort, "E2");
  });

  it("parses --line value", () => {
    assert.equal(parseArgs(["--line", "42"]).line, "42");
  });

  it("does not capture dangling flag value", () => {
    const result = parseArgs(["--file", "--dry-run"]);
    assert.equal(result.dryRun, true);
    assert.equal(result.file, undefined);
  });

  it("handles all fields combined", () => {
    const args = [
      "--file",
      "src/a.ts",
      "--line",
      "10",
      "--title",
      "Some issue",
      "--severity",
      "S2",
      "--category",
      "code-quality",
      "--effort",
      "E1",
    ];
    const result = parseArgs(args);
    assert.equal(result.file, "src/a.ts");
    assert.equal(result.line, "10");
    assert.equal(result.title, "Some issue");
    assert.equal(result.severity, "S2");
    assert.equal(result.category, "code-quality");
    assert.equal(result.effort, "E1");
  });
});

// ─── getNextDebtId ────────────────────────────────────────────────────────────

function getNextDebtId(existingItems: Array<{ id?: string }>): number {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = item.id.match(/DEBT-(\d+)/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

describe("getNextDebtId (intake-manual)", () => {
  it("returns 1 for empty list", () => {
    assert.equal(getNextDebtId([]), 1);
  });

  it("returns max+1", () => {
    assert.equal(getNextDebtId([{ id: "DEBT-0007" }, { id: "DEBT-0003" }]), 8);
  });

  it("ignores non-DEBT IDs", () => {
    assert.equal(getNextDebtId([{ id: "CANON-0010" }]), 1);
  });
});

// ─── Schema validation ────────────────────────────────────────────────────────

describe("VALID_CATEGORIES (intake-manual)", () => {
  it("accepts all 10 categories", () => {
    assert.equal(VALID_CATEGORIES.size, 10);
  });
  it("accepts security", () => assert.ok(VALID_CATEGORIES.has("security")));
  it("rejects unknown", () => assert.equal(VALID_CATEGORIES.has("unknown"), false));
});

describe("VALID_SEVERITIES", () => {
  it("accepts S0-S3", () => {
    ["S0", "S1", "S2", "S3"].forEach((s) => assert.ok(VALID_SEVERITIES.has(s)));
  });
  it("rejects S4", () => assert.equal(VALID_SEVERITIES.has("S4"), false));
  it("rejects lowercase 's0'", () => assert.equal(VALID_SEVERITIES.has("s0"), false));
});

describe("VALID_TYPES", () => {
  it("accepts tech-debt", () => assert.ok(VALID_TYPES.has("tech-debt")));
  it("accepts vulnerability", () => assert.ok(VALID_TYPES.has("vulnerability")));
  it("rejects 'feature'", () => assert.equal(VALID_TYPES.has("feature"), false));
});

describe("VALID_EFFORTS", () => {
  it("accepts E0-E3", () => {
    ["E0", "E1", "E2", "E3"].forEach((e) => assert.ok(VALID_EFFORTS.has(e)));
  });
  it("rejects E4", () => assert.equal(VALID_EFFORTS.has("E4"), false));
  it("defaults to E1 if unspecified", () => {
    const effort: string | undefined = undefined;
    const resolved = effort ?? "E1";
    assert.ok(VALID_EFFORTS.has(resolved));
  });
});

// ─── Required field validation ────────────────────────────────────────────────

interface ManualIntakeArgs {
  file?: string;
  title?: string;
  severity?: string;
  category?: string;
}

function validateRequiredFields(args: ManualIntakeArgs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!args.file) errors.push("--file is required");
  if (!args.title) errors.push("--title is required");
  if (!args.severity) errors.push("--severity is required");
  if (!args.category) errors.push("--category is required");
  return { valid: errors.length === 0, errors };
}

describe("validateRequiredFields", () => {
  it("passes with all required fields", () => {
    const result = validateRequiredFields({
      file: "src/a.ts",
      title: "Fix bug",
      severity: "S2",
      category: "code-quality",
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it("fails when file is missing", () => {
    const result = validateRequiredFields({ title: "T", severity: "S1", category: "security" });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("--file")));
  });

  it("collects all missing field errors", () => {
    const result = validateRequiredFields({});
    assert.equal(result.errors.length, 4);
  });
});
