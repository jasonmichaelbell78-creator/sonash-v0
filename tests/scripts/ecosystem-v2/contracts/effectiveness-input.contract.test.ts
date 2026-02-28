/**
 * Contract: reviews.jsonl + deferred-items.jsonl -> Effectiveness Analyzer
 *
 * Validates that review and deferred-item data can be consumed by the
 * effectiveness analyzer for computing fix rates, severity tracking, etc.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

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
  ReviewRecord: { parse: (v: unknown) => Record<string, unknown> };
  DeferredItemRecord: { parse: (v: unknown) => Record<string, unknown> };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const completenessLib = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/completeness.js")
) as {
  hasField: (record: { completeness_missing?: string[] }, field: string) => boolean;
};

const { ReviewRecord, DeferredItemRecord } = schemas;
const { hasField } = completenessLib;

function loadFixture(name: string): Record<string, unknown> {
  const filePath = path.join(PROJECT_ROOT, "test/fixtures/ecosystem-v2", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

describe("Contract: JSONL -> Effectiveness Analyzer", () => {
  const fullReview = ReviewRecord.parse(loadFixture("review-full.json"));
  const partialReview = ReviewRecord.parse(loadFixture("review-partial.json"));
  const stubReview = ReviewRecord.parse(loadFixture("review-stub.json"));
  const fullDeferred = DeferredItemRecord.parse(loadFixture("deferred-item-full.json"));
  const partialDeferred = DeferredItemRecord.parse(loadFixture("deferred-item-partial.json"));
  const stubDeferred = DeferredItemRecord.parse(loadFixture("deferred-item-stub.json"));

  test("full review has total/fixed/deferred fields for computation", () => {
    assert.ok(hasField(fullReview as { completeness_missing?: string[] }, "total"));
    assert.ok(hasField(fullReview as { completeness_missing?: string[] }, "fixed"));
    assert.ok(hasField(fullReview as { completeness_missing?: string[] }, "deferred"));
    assert.equal(typeof fullReview.total, "number");
    assert.equal(typeof fullReview.fixed, "number");
    assert.equal(typeof fullReview.deferred, "number");
  });

  test("partial review has total/fixed/deferred for basic metrics", () => {
    assert.ok(hasField(partialReview as { completeness_missing?: string[] }, "total"));
    assert.equal(typeof partialReview.total, "number");
    assert.equal(typeof partialReview.fixed, "number");
  });

  test("full deferred has severity and status for tracking", () => {
    assert.ok(hasField(fullDeferred as { completeness_missing?: string[] }, "severity"));
    assert.ok(hasField(fullDeferred as { completeness_missing?: string[] }, "status"));
    assert.equal(typeof fullDeferred.severity, "string");
    assert.equal(typeof fullDeferred.status, "string");
  });

  test("hasField() correctly identifies computable metrics on full records", () => {
    assert.ok(hasField(fullReview as { completeness_missing?: string[] }, "severity_breakdown"));
    const breakdown = fullReview.severity_breakdown as {
      critical: number;
      major: number;
      minor: number;
      trivial: number;
    };
    const totalFromBreakdown =
      breakdown.critical + breakdown.major + breakdown.minor + breakdown.trivial;
    assert.equal(totalFromBreakdown, fullReview.total);
  });

  test("partial/stub reviews: consumer must check hasField before computing", () => {
    // Stub review has no total/fixed fields
    const stubHasTotal = hasField(stubReview as { completeness_missing?: string[] }, "total");
    assert.equal(stubHasTotal, false);

    // Consumer pattern: check hasField, skip computation if false
    const computeFixRate = (record: Record<string, unknown>): number | null => {
      if (
        !hasField(record as { completeness_missing?: string[] }, "total") ||
        !hasField(record as { completeness_missing?: string[] }, "fixed")
      ) {
        return null;
      }
      const total = record.total as number;
      if (total === 0) return 0;
      return (record.fixed as number) / total;
    };

    assert.equal(computeFixRate(fullReview), 0.625);
    assert.ok(computeFixRate(partialReview) !== null);
    assert.equal(computeFixRate(stubReview), null);
  });

  test("partial deferred without severity doesn't produce NaN", () => {
    const hasSeverity = hasField(
      partialDeferred as { completeness_missing?: string[] },
      "severity"
    );
    assert.equal(hasSeverity, false);

    // Consumer pattern: severity-based weighting should handle missing data
    const severityWeight: Record<string, number> = { S0: 4, S1: 3, S2: 2, S3: 1 };
    const weight =
      hasSeverity && typeof partialDeferred.severity === "string"
        ? (severityWeight[partialDeferred.severity as string] ?? 0)
        : 0;
    assert.equal(typeof weight, "number");
    assert.ok(!Number.isNaN(weight));
  });

  test("stub deferred has required fields for basic tracking", () => {
    assert.ok(typeof stubDeferred.review_id === "string");
    assert.ok(typeof stubDeferred.finding === "string");
    assert.ok(typeof stubDeferred.status === "string");
  });
});
