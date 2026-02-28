/**
 * Schema validation tests for all 5 JSONL entity types.
 *
 * Verifies that Zod schemas correctly accept valid records and reject
 * records with missing required fields or invalid values.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json (works from both source and dist-tests)
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const schemas = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas/index.js")
) as {
  BaseRecord: { parse: (v: unknown) => unknown };
  ReviewRecord: { parse: (v: unknown) => unknown };
  RetroRecord: { parse: (v: unknown) => unknown };
  DeferredItemRecord: { parse: (v: unknown) => unknown };
  InvocationRecord: { parse: (v: unknown) => unknown };
  WarningRecord: { parse: (v: unknown) => unknown };
  SCHEMA_MAP: Record<string, unknown>;
};

const {
  BaseRecord,
  ReviewRecord,
  RetroRecord,
  DeferredItemRecord,
  InvocationRecord,
  WarningRecord,
  SCHEMA_MAP,
} = schemas;

// =========================================================
// Shared fixture helpers
// =========================================================

function validBase() {
  return {
    id: "test-001",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review", pr: 42 },
  };
}

// =========================================================
// BaseRecord
// =========================================================

describe("BaseRecord", () => {
  test("parses a valid base record", () => {
    const result = BaseRecord.parse(validBase()) as { id: string };
    assert.equal(result.id, "test-001");
  });

  test("rejects missing id", () => {
    const data = { ...validBase(), id: undefined };
    assert.throws(() => BaseRecord.parse(data), { name: "ZodError" });
  });

  test("rejects invalid date format", () => {
    const data = { ...validBase(), date: "28-02-2026" };
    assert.throws(() => BaseRecord.parse(data), { name: "ZodError" });
  });

  test("rejects invalid completeness tier", () => {
    const data = { ...validBase(), completeness: "mega" };
    assert.throws(() => BaseRecord.parse(data), { name: "ZodError" });
  });

  test("rejects invalid origin type", () => {
    const data = { ...validBase(), origin: { type: "unknown-source" } };
    assert.throws(() => BaseRecord.parse(data), { name: "ZodError" });
  });
});

// =========================================================
// ReviewRecord
// =========================================================

describe("ReviewRecord", () => {
  test("parses a valid full review record", () => {
    const data = {
      ...validBase(),
      title: "PR #42 Review",
      pr: 42,
      source: "qodo",
      total: 10,
      fixed: 8,
      deferred: 1,
      rejected: 1,
      patterns: ["error-handling"],
      severity_breakdown: { critical: 0, major: 2, minor: 5, trivial: 3 },
    };
    const result = ReviewRecord.parse(data) as { id: string; title: string };
    assert.equal(result.title, "PR #42 Review");
  });

  test("parses a minimal stub review record", () => {
    const data = { ...validBase(), completeness: "stub" };
    const result = ReviewRecord.parse(data) as { id: string };
    assert.equal(result.id, "test-001");
  });

  test("rejects missing required base field (schema_version)", () => {
    const data = { ...validBase(), schema_version: undefined };
    assert.throws(() => ReviewRecord.parse(data), { name: "ZodError" });
  });

  test("rejects invalid date format", () => {
    const data = { ...validBase(), date: "not-a-date" };
    assert.throws(() => ReviewRecord.parse(data), { name: "ZodError" });
  });
});

// =========================================================
// RetroRecord
// =========================================================

describe("RetroRecord", () => {
  test("parses a valid full retro record", () => {
    const data = {
      ...validBase(),
      pr: 42,
      session: "session-001",
      top_wins: ["good error handling"],
      top_misses: ["missed edge case"],
      process_changes: ["add pre-commit check"],
      score: 7.5,
      metrics: { total_findings: 10, fix_rate: 0.8, pattern_recurrence: 2 },
    };
    const result = RetroRecord.parse(data) as { score: number };
    assert.equal(result.score, 7.5);
  });

  test("rejects missing origin", () => {
    const { origin: _origin, ...data } = validBase();
    assert.throws(() => RetroRecord.parse(data), { name: "ZodError" });
  });
});

// =========================================================
// DeferredItemRecord
// =========================================================

describe("DeferredItemRecord", () => {
  test("parses a valid deferred item", () => {
    const data = {
      ...validBase(),
      review_id: "review-001",
      finding: "Missing null check in auth handler",
      reason: "Low priority",
      severity: "S2",
      status: "open",
    };
    const result = DeferredItemRecord.parse(data) as { finding: string };
    assert.equal(result.finding, "Missing null check in auth handler");
  });

  test("rejects missing required field (finding)", () => {
    const data = {
      ...validBase(),
      review_id: "review-001",
      // finding is missing
    };
    assert.throws(() => DeferredItemRecord.parse(data), { name: "ZodError" });
  });

  test("rejects invalid completeness tier", () => {
    const data = {
      ...validBase(),
      completeness: "invalid-tier",
      review_id: "review-001",
      finding: "test",
    };
    assert.throws(() => DeferredItemRecord.parse(data), { name: "ZodError" });
  });
});

// =========================================================
// InvocationRecord
// =========================================================

describe("InvocationRecord", () => {
  test("parses a valid invocation record", () => {
    const data = {
      ...validBase(),
      skill: "code-reviewer",
      type: "agent",
      duration_ms: 5000,
      success: true,
    };
    const result = InvocationRecord.parse(data) as { skill: string };
    assert.equal(result.skill, "code-reviewer");
  });

  test("rejects invalid origin type", () => {
    const data = {
      ...validBase(),
      origin: { type: "bad-type" },
      skill: "test",
      type: "skill",
      success: true,
    };
    assert.throws(() => InvocationRecord.parse(data), { name: "ZodError" });
  });
});

// =========================================================
// WarningRecord
// =========================================================

describe("WarningRecord", () => {
  test("parses a valid warning record", () => {
    const data = {
      ...validBase(),
      category: "data-integrity",
      message: "Duplicate record detected",
      severity: "warning",
      lifecycle: "new",
    };
    const result = WarningRecord.parse(data) as { category: string };
    assert.equal(result.category, "data-integrity");
  });

  test("rejects missing required field (message)", () => {
    const data = {
      ...validBase(),
      category: "test",
      // message is missing
      severity: "info",
    };
    assert.throws(() => WarningRecord.parse(data), { name: "ZodError" });
  });

  test("rejects invalid date format", () => {
    const data = {
      ...validBase(),
      date: "2026/02/28",
      category: "test",
      message: "test",
      severity: "info",
    };
    assert.throws(() => WarningRecord.parse(data), { name: "ZodError" });
  });
});

// =========================================================
// SCHEMA_MAP
// =========================================================

describe("SCHEMA_MAP", () => {
  test("has exactly 5 entries", () => {
    assert.equal(Object.keys(SCHEMA_MAP).length, 5);
  });

  test("has correct keys", () => {
    const keys = Object.keys(SCHEMA_MAP).sort();
    assert.deepEqual(keys, ["deferred-items", "invocations", "retros", "reviews", "warnings"]);
  });

  test("each entry is a Zod schema with parse method", () => {
    for (const [key, schema] of Object.entries(SCHEMA_MAP)) {
      assert.equal(
        typeof (schema as { parse?: unknown }).parse,
        "function",
        `SCHEMA_MAP["${key}"] should have a parse method`
      );
    }
  });
});
