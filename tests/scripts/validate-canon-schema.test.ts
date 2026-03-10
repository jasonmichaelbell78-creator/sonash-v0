import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/validate-canon-schema.js

describe("validate-canon-schema: CANON_ID_REGEX", () => {
  const CANON_ID_REGEX = /^CANON-\d{4}$/;

  it("accepts CANON-0001", () => {
    assert.ok(CANON_ID_REGEX.test("CANON-0001"));
  });

  it("accepts CANON-9999", () => {
    assert.ok(CANON_ID_REGEX.test("CANON-9999"));
  });

  it("rejects CANON-1 (too short)", () => {
    assert.ok(!CANON_ID_REGEX.test("CANON-1"));
  });

  it("rejects CANON-12345 (too long)", () => {
    assert.ok(!CANON_ID_REGEX.test("CANON-12345"));
  });

  it("rejects lowercase canon", () => {
    assert.ok(!CANON_ID_REGEX.test("canon-0001"));
  });

  it("rejects F-001 format", () => {
    assert.ok(!CANON_ID_REGEX.test("F-001"));
  });
});

describe("validate-canon-schema: required fields validation", () => {
  const REQUIRED_FIELDS = ["canonical_id", "category", "title", "severity", "effort", "files"];

  function validateRequiredFields(finding: Record<string, unknown>): string[] {
    return REQUIRED_FIELDS.filter((f) => !finding[f]);
  }

  it("passes when all fields present", () => {
    const finding = {
      canonical_id: "CANON-0001",
      category: "security",
      title: "Issue",
      severity: "S1",
      effort: "E2",
      files: ["src/auth.ts"],
    };
    assert.strictEqual(validateRequiredFields(finding).length, 0);
  });

  it("reports missing canonical_id", () => {
    const finding = {
      category: "security",
      title: "Issue",
      severity: "S1",
      effort: "E2",
      files: ["src/auth.ts"],
    };
    assert.ok(validateRequiredFields(finding).includes("canonical_id"));
  });

  it("reports multiple missing fields", () => {
    const finding = { title: "Issue" };
    const missing = validateRequiredFields(finding);
    assert.ok(missing.includes("canonical_id"));
    assert.ok(missing.includes("severity"));
  });
});

describe("validate-canon-schema: enum validation", () => {
  const VALID_SEVERITY = ["S0", "S1", "S2", "S3"];
  const VALID_EFFORT = ["E0", "E1", "E2", "E3"];
  const VALID_STATUS = ["CONFIRMED", "SUSPECTED", "NEW", "TRACKED_ELSEWHERE"];

  function isValidEnum(value: string, validValues: string[]): boolean {
    return validValues.includes(value);
  }

  it("accepts valid severity S0-S3", () => {
    for (const s of VALID_SEVERITY) {
      assert.strictEqual(isValidEnum(s, VALID_SEVERITY), true);
    }
  });

  it("rejects invalid severity", () => {
    assert.strictEqual(isValidEnum("S4", VALID_SEVERITY), false);
  });

  it("accepts valid effort E0-E3", () => {
    for (const e of VALID_EFFORT) {
      assert.strictEqual(isValidEnum(e, VALID_EFFORT), true);
    }
  });

  it("accepts valid status values", () => {
    for (const s of VALID_STATUS) {
      assert.strictEqual(isValidEnum(s, VALID_STATUS), true);
    }
  });

  it("rejects invalid status", () => {
    assert.strictEqual(isValidEnum("UNKNOWN", VALID_STATUS), false);
  });
});

describe("validate-canon-schema: detectAltIdFormat", () => {
  const ALT_ID_PATTERNS = [
    { pattern: /^F-\d{3}$/, name: "Security (F-XXX)" },
    { pattern: /^PERF-\d{3}$/, name: "Performance (PERF-XXX)" },
    { pattern: /^CANON-R-\d{3}$/, name: "Refactoring (CANON-R-XXX)" },
  ];

  function detectAltIdFormat(id: string): string {
    for (const alt of ALT_ID_PATTERNS) {
      if (alt.pattern.test(id)) return alt.name;
    }
    return "Unknown";
  }

  it("detects F-XXX security format", () => {
    assert.strictEqual(detectAltIdFormat("F-001"), "Security (F-XXX)");
  });

  it("detects PERF-XXX format", () => {
    assert.strictEqual(detectAltIdFormat("PERF-042"), "Performance (PERF-XXX)");
  });

  it("returns Unknown for unrecognized format", () => {
    assert.strictEqual(detectAltIdFormat("RANDOM-123"), "Unknown");
  });
});
