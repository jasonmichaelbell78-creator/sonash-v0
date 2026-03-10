/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests for all 7 schema files in scripts/reviews/lib/schemas/
 *
 * Each schema is tested with:
 *   - Valid minimal input that should pass
 *   - Valid full input that should pass
 *   - Invalid inputs that should fail (missing required fields, bad enum values,
 *     empty strings, null where not allowed, wrong types)
 *
 * Schemas are loaded via the compiled dist (barrel index.js).
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const distSchemasPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  BaseRecord,
  CompletenessTier,
  Origin,
  ReviewRecord,
  RetroRecord,
  DeferredItemRecord,
  InvocationRecord,
  WarningRecord,
  SCHEMA_MAP,
} = require(path.join(distSchemasPath, "index.js")) as {
  BaseRecord: { parse: (v: unknown) => unknown; safeParse: (v: unknown) => { success: boolean } };
  CompletenessTier: {
    parse: (v: unknown) => unknown;
    safeParse: (v: unknown) => { success: boolean };
  };
  Origin: { parse: (v: unknown) => unknown; safeParse: (v: unknown) => { success: boolean } };
  ReviewRecord: { parse: (v: unknown) => unknown; safeParse: (v: unknown) => { success: boolean } };
  RetroRecord: { parse: (v: unknown) => unknown; safeParse: (v: unknown) => { success: boolean } };
  DeferredItemRecord: {
    parse: (v: unknown) => unknown;
    safeParse: (v: unknown) => { success: boolean };
  };
  InvocationRecord: {
    parse: (v: unknown) => unknown;
    safeParse: (v: unknown) => { success: boolean };
  };
  WarningRecord: {
    parse: (v: unknown) => unknown;
    safeParse: (v: unknown) => { success: boolean };
  };
  SCHEMA_MAP: Record<string, { safeParse: (v: unknown) => { success: boolean } }>;
};

// =========================================================
// Shared base record fixture
// =========================================================

function validBase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "test-001",
    date: "2026-01-15",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review" },
    ...overrides,
  };
}

// =========================================================
// 1. shared.ts — CompletenessTier
// =========================================================

describe("CompletenessTier", () => {
  test("accepts full", () => {
    assert.equal(CompletenessTier.safeParse("full").success, true);
  });

  test("accepts partial", () => {
    assert.equal(CompletenessTier.safeParse("partial").success, true);
  });

  test("accepts stub", () => {
    assert.equal(CompletenessTier.safeParse("stub").success, true);
  });

  test("rejects unknown value", () => {
    assert.equal(CompletenessTier.safeParse("complete").success, false);
  });

  test("rejects null", () => {
    assert.equal(CompletenessTier.safeParse(null).success, false);
  });
});

// =========================================================
// 2. shared.ts — Origin
// =========================================================

describe("Origin", () => {
  test("accepts minimal valid origin", () => {
    assert.equal(Origin.safeParse({ type: "pr-review" }).success, true);
  });

  test("accepts all origin types", () => {
    for (const type of ["pr-review", "pr-retro", "backfill", "migration", "manual"] as const) {
      assert.equal(Origin.safeParse({ type }).success, true);
    }
  });

  test("accepts optional fields", () => {
    const full = { type: "pr-review", pr: 123, round: 1, session: "s-01", tool: "my-tool" };
    assert.equal(Origin.safeParse(full).success, true);
  });

  test("rejects unknown type", () => {
    assert.equal(Origin.safeParse({ type: "automated" }).success, false);
  });

  test("rejects missing type", () => {
    assert.equal(Origin.safeParse({ pr: 123 }).success, false);
  });

  test("rejects negative PR number", () => {
    assert.equal(Origin.safeParse({ type: "pr-review", pr: -1 }).success, false);
  });

  test("rejects null origin", () => {
    assert.equal(Origin.safeParse(null).success, false);
  });
});

// =========================================================
// 3. shared.ts — BaseRecord
// =========================================================

describe("BaseRecord", () => {
  test("accepts a minimal valid base record", () => {
    assert.equal(BaseRecord.safeParse(validBase()).success, true);
  });

  test("defaults completeness_missing to empty array when not provided", () => {
    const data = validBase();
    delete data.completeness_missing;
    const result = BaseRecord.safeParse(data);
    assert.equal(result.success, true);
  });

  test("rejects empty id", () => {
    assert.equal(BaseRecord.safeParse(validBase({ id: "" })).success, false);
  });

  test("rejects malformed date", () => {
    assert.equal(BaseRecord.safeParse(validBase({ date: "15-01-2026" })).success, false);
    assert.equal(BaseRecord.safeParse(validBase({ date: "2026/01/15" })).success, false);
  });

  test("rejects non-positive schema_version", () => {
    assert.equal(BaseRecord.safeParse(validBase({ schema_version: 0 })).success, false);
    assert.equal(BaseRecord.safeParse(validBase({ schema_version: -1 })).success, false);
  });

  test("rejects invalid completeness tier", () => {
    assert.equal(BaseRecord.safeParse(validBase({ completeness: "complete" })).success, false);
  });

  test("rejects missing origin", () => {
    const data = validBase();
    delete data.origin;
    assert.equal(BaseRecord.safeParse(data).success, false);
  });
});

// =========================================================
// 4. review.ts — ReviewRecord
// =========================================================

describe("ReviewRecord", () => {
  test("accepts a minimal review (just base fields)", () => {
    assert.equal(ReviewRecord.safeParse(validBase()).success, true);
  });

  test("accepts a full review with all optional fields", () => {
    const full = validBase({
      title: "Security Audit",
      pr: 389,
      source: "manual",
      total: 12,
      fixed: 8,
      deferred: 2,
      rejected: 0,
      patterns: ["missing-error-handling"],
      learnings: ["Always validate inputs"],
      severity_breakdown: { critical: 1, major: 3, minor: 4, trivial: 4 },
    });
    assert.equal(ReviewRecord.safeParse(full).success, true);
  });

  test("accepts null for nullable fields", () => {
    const record = validBase({ title: null, pr: null, total: null, patterns: null });
    assert.equal(ReviewRecord.safeParse(record).success, true);
  });

  test("rejects negative PR number", () => {
    assert.equal(ReviewRecord.safeParse(validBase({ pr: -5 })).success, false);
  });

  test("rejects negative total", () => {
    assert.equal(ReviewRecord.safeParse(validBase({ total: -1 })).success, false);
  });

  test("rejects invalid severity_breakdown (missing keys)", () => {
    const bad = validBase({ severity_breakdown: { critical: 1, major: 2 } });
    assert.equal(ReviewRecord.safeParse(bad).success, false);
  });

  test("rejects non-array patterns field", () => {
    assert.equal(ReviewRecord.safeParse(validBase({ patterns: "not-an-array" })).success, false);
  });
});

// =========================================================
// 5. retro.ts — RetroRecord
// =========================================================

describe("RetroRecord", () => {
  test("accepts a minimal retro (just base fields)", () => {
    assert.equal(RetroRecord.safeParse(validBase()).success, true);
  });

  test("accepts a full retro with all optional fields", () => {
    const full = validBase({
      pr: 400,
      session: "session-42",
      top_wins: ["No regressions"],
      top_misses: ["Slow turnaround"],
      process_changes: ["Add automated checks"],
      score: 8.5,
      metrics: { total_findings: 10, fix_rate: 0.9, pattern_recurrence: 2 },
    });
    assert.equal(RetroRecord.safeParse(full).success, true);
  });

  test("rejects score out of range (> 10)", () => {
    assert.equal(RetroRecord.safeParse(validBase({ score: 11 })).success, false);
  });

  test("rejects score out of range (< 0)", () => {
    assert.equal(RetroRecord.safeParse(validBase({ score: -1 })).success, false);
  });

  test("rejects metrics with invalid fix_rate (> 1)", () => {
    const bad = validBase({ metrics: { total_findings: 5, fix_rate: 1.5, pattern_recurrence: 0 } });
    assert.equal(RetroRecord.safeParse(bad).success, false);
  });

  test("accepts null score", () => {
    assert.equal(RetroRecord.safeParse(validBase({ score: null })).success, true);
  });
});

// =========================================================
// 6. deferred-item.ts — DeferredItemRecord
// =========================================================

describe("DeferredItemRecord", () => {
  test("accepts a minimal deferred item", () => {
    const record = validBase({ review_id: "rev-100", finding: "Some finding" });
    assert.equal(DeferredItemRecord.safeParse(record).success, true);
  });

  test("accepts all valid status values", () => {
    for (const status of ["open", "resolved", "promoted", "wont-fix"] as const) {
      const r = validBase({ review_id: "rev-1", finding: "f", status });
      assert.equal(DeferredItemRecord.safeParse(r).success, true);
    }
  });

  test("accepts all valid severity values", () => {
    for (const severity of ["S0", "S1", "S2", "S3"] as const) {
      const r = validBase({ review_id: "rev-1", finding: "f", severity });
      assert.equal(DeferredItemRecord.safeParse(r).success, true);
    }
  });

  test("defaults status to 'open'", () => {
    const record = validBase({ review_id: "rev-1", finding: "finding" });
    const result = DeferredItemRecord.safeParse(record);
    assert.equal(result.success, true);
  });

  test("rejects empty review_id", () => {
    assert.equal(
      DeferredItemRecord.safeParse(validBase({ review_id: "", finding: "f" })).success,
      false
    );
  });

  test("rejects empty finding", () => {
    assert.equal(
      DeferredItemRecord.safeParse(validBase({ review_id: "rev-1", finding: "" })).success,
      false
    );
  });

  test("rejects missing review_id", () => {
    const data = validBase({ finding: "something" });
    assert.equal(DeferredItemRecord.safeParse(data).success, false);
  });

  test("rejects defer_count less than 1", () => {
    const r = validBase({ review_id: "rev-1", finding: "f", defer_count: 0 });
    assert.equal(DeferredItemRecord.safeParse(r).success, false);
  });

  test("rejects invalid status value", () => {
    const r = validBase({ review_id: "rev-1", finding: "f", status: "maybe" });
    assert.equal(DeferredItemRecord.safeParse(r).success, false);
  });

  test("rejects invalid resolved_date format", () => {
    const r = validBase({ review_id: "rev-1", finding: "f", resolved_date: "01/15/2026" });
    assert.equal(DeferredItemRecord.safeParse(r).success, false);
  });
});

// =========================================================
// 7. invocation.ts — InvocationRecord
// =========================================================

describe("InvocationRecord", () => {
  test("accepts a minimal invocation", () => {
    const r = validBase({ skill: "pr-review", type: "skill", success: true });
    assert.equal(InvocationRecord.safeParse(r).success, true);
  });

  test("accepts all valid type values", () => {
    for (const type of ["skill", "agent", "team"] as const) {
      const r = validBase({ skill: "my-skill", type, success: true });
      assert.equal(InvocationRecord.safeParse(r).success, true);
    }
  });

  test("accepts a full invocation with all optional fields", () => {
    const full = validBase({
      skill: "pr-review",
      type: "skill",
      success: true,
      duration_ms: 1500,
      error: null,
      context: { pr: 100, session: "s-01", trigger: "manual" },
    });
    assert.equal(InvocationRecord.safeParse(full).success, true);
  });

  test("rejects empty skill name", () => {
    assert.equal(
      InvocationRecord.safeParse(validBase({ skill: "", type: "skill", success: true })).success,
      false
    );
  });

  test("rejects missing skill", () => {
    const data = validBase({ type: "skill", success: true });
    assert.equal(InvocationRecord.safeParse(data).success, false);
  });

  test("rejects invalid type", () => {
    assert.equal(
      InvocationRecord.safeParse(validBase({ skill: "s", type: "cron", success: true })).success,
      false
    );
  });

  test("rejects missing success field", () => {
    const data = validBase({ skill: "s", type: "skill" });
    assert.equal(InvocationRecord.safeParse(data).success, false);
  });

  test("rejects negative duration_ms", () => {
    const r = validBase({ skill: "s", type: "skill", success: true, duration_ms: -100 });
    assert.equal(InvocationRecord.safeParse(r).success, false);
  });
});

// =========================================================
// 8. warning.ts — WarningRecord
// =========================================================

describe("WarningRecord", () => {
  test("accepts a minimal warning", () => {
    const r = validBase({ category: "coverage", message: "Coverage dropped", severity: "warning" });
    assert.equal(WarningRecord.safeParse(r).success, true);
  });

  test("accepts all valid severity values", () => {
    for (const severity of ["info", "warning", "error"] as const) {
      const r = validBase({ category: "c", message: "m", severity });
      assert.equal(WarningRecord.safeParse(r).success, true);
    }
  });

  test("accepts all valid lifecycle values", () => {
    for (const lifecycle of ["new", "acknowledged", "resolved", "stale"] as const) {
      const r = validBase({ category: "c", message: "m", severity: "info", lifecycle });
      assert.equal(WarningRecord.safeParse(r).success, true);
    }
  });

  test("defaults lifecycle to 'new'", () => {
    const r = validBase({ category: "c", message: "m", severity: "info" });
    const result = WarningRecord.safeParse(r);
    assert.equal(result.success, true);
  });

  test("rejects empty category", () => {
    assert.equal(
      WarningRecord.safeParse(validBase({ category: "", message: "m", severity: "info" })).success,
      false
    );
  });

  test("rejects empty message", () => {
    assert.equal(
      WarningRecord.safeParse(validBase({ category: "c", message: "", severity: "info" })).success,
      false
    );
  });

  test("rejects invalid severity", () => {
    assert.equal(
      WarningRecord.safeParse(validBase({ category: "c", message: "m", severity: "critical" }))
        .success,
      false
    );
  });

  test("rejects invalid lifecycle", () => {
    assert.equal(
      WarningRecord.safeParse(
        validBase({ category: "c", message: "m", severity: "info", lifecycle: "ignored" })
      ).success,
      false
    );
  });

  test("rejects invalid resolved_date format", () => {
    const r = validBase({
      category: "c",
      message: "m",
      severity: "info",
      resolved_date: "Jan 15 2026",
    });
    assert.equal(WarningRecord.safeParse(r).success, false);
  });

  test("accepts null resolved_date", () => {
    const r = validBase({ category: "c", message: "m", severity: "info", resolved_date: null });
    assert.equal(WarningRecord.safeParse(r).success, true);
  });
});

// =========================================================
// 9. schemas/index.ts — SCHEMA_MAP
// =========================================================

describe("SCHEMA_MAP", () => {
  test("contains all five expected keys", () => {
    const keys = Object.keys(SCHEMA_MAP);
    for (const expected of ["reviews", "retros", "deferred-items", "invocations", "warnings"]) {
      assert.ok(keys.includes(expected), `SCHEMA_MAP missing key: ${expected}`);
    }
  });

  test("each schema in SCHEMA_MAP has a safeParse method", () => {
    for (const [key, schema] of Object.entries(SCHEMA_MAP)) {
      assert.equal(typeof schema.safeParse, "function", `${key} schema missing safeParse`);
    }
  });

  test("reviews key maps to ReviewRecord (validates a review)", () => {
    const r = validBase();
    assert.equal(SCHEMA_MAP.reviews.safeParse(r).success, true);
  });

  test("invocations key maps to InvocationRecord", () => {
    const r = validBase({ skill: "pr-review", type: "skill", success: true });
    assert.equal(SCHEMA_MAP.invocations.safeParse(r).success, true);
  });
});
