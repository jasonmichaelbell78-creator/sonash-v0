/**
 * Placeholder tests for run-ecosystem-health.js (source not yet implemented)
 *
 * Since the source file does not exist yet, this test file re-implements the
 * core logic patterns that run-ecosystem-health.js is expected to expose,
 * and tests them in isolation. When the real module ships, these tests can be
 * updated to import from it directly.
 *
 * Covers:
 *   - Dashboard output format (score, grade, dimensions, warnings)
 *   - Dimension drill-down structure (id, name, category, score, metrics)
 *   - Warning integration (threshold triggers, severity classification)
 *   - Trend computation (direction, delta, window handling)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// =========================================================
// Re-implemented logic patterns
// =========================================================

// --- Dashboard output format ---

interface DimensionScore {
  id: string;
  name: string;
  category: string;
  score: number;
  grade: string;
  metrics: Record<string, number | null>;
  no_data?: boolean;
}

interface WarningEntry {
  dimension: string;
  severity: "info" | "warning" | "critical";
  message: string;
  threshold?: number;
  actual?: number;
}

interface DashboardOutput {
  timestamp: string;
  overall_score: number;
  overall_grade: string;
  dimensions: DimensionScore[];
  warnings: WarningEntry[];
  trend?: TrendResult;
}

function buildDashboardOutput(
  dimensions: DimensionScore[],
  warnings: WarningEntry[]
): DashboardOutput {
  const totalScore =
    dimensions.length > 0
      ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
      : 0;

  return {
    timestamp: new Date().toISOString(),
    overall_score: totalScore,
    overall_grade: scoreToGrade(totalScore),
    dimensions,
    warnings,
  };
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// --- Dimension drill-down structure ---

function buildDimensionScore(
  id: string,
  name: string,
  category: string,
  rawMetrics: Record<string, number | null>
): DimensionScore {
  const values = Object.values(rawMetrics).filter((v): v is number => v !== null);
  const score =
    values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const noData = values.length === 0;

  return {
    id,
    name,
    category,
    score,
    grade: scoreToGrade(score),
    metrics: rawMetrics,
    ...(noData ? { no_data: true } : {}),
  };
}

// --- Warning integration ---

function classifyWarning(
  actual: number,
  threshold: number,
  higherIsBetter: boolean
): "info" | "warning" | "critical" {
  const delta = higherIsBetter
    ? threshold - actual // how far below threshold
    : actual - threshold; // how far above threshold

  if (delta <= 0) return "info";
  if (delta <= threshold * 0.1) return "warning";
  return "critical";
}

function buildWarnings(
  dimensions: DimensionScore[],
  thresholds: Record<string, number>
): WarningEntry[] {
  const warnings: WarningEntry[] = [];
  for (const dim of dimensions) {
    const threshold = thresholds[dim.id];
    if (threshold === undefined) continue;
    if (dim.score < threshold) {
      warnings.push({
        dimension: dim.id,
        severity: classifyWarning(dim.score, threshold, true),
        message: `${dim.name} score (${dim.score}) is below threshold (${threshold})`,
        threshold,
        actual: dim.score,
      });
    }
  }
  return warnings;
}

// --- Trend computation ---

interface TrendResult {
  direction: "up" | "down" | "stable";
  delta: number;
  windowSize: number;
  previous: number | null;
  current: number;
}

function computeTrend(scores: number[], windowSize = 7): TrendResult {
  if (scores.length === 0) {
    return { direction: "stable", delta: 0, windowSize, previous: null, current: 0 };
  }

  const current = scores[scores.length - 1];
  const window = scores.slice(-windowSize);

  if (window.length < 2) {
    return { direction: "stable", delta: 0, windowSize, previous: null, current };
  }

  const previous = window[0];
  const delta = current - previous;
  const direction: TrendResult["direction"] =
    Math.abs(delta) < 1 ? "stable" : delta > 0 ? "up" : "down";

  return { direction, delta, windowSize, previous, current };
}

// =========================================================
// 1. Dashboard output format
// =========================================================

describe("dashboard output format", () => {
  it("output contains required top-level fields", () => {
    const dims: DimensionScore[] = [
      buildDimensionScore("code-quality", "Code Quality", "Quality", { linting: 85, coverage: 78 }),
    ];
    const output = buildDashboardOutput(dims, []);

    assert.ok(typeof output.timestamp === "string");
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(output.timestamp), "timestamp should be ISO format");
    assert.ok(typeof output.overall_score === "number");
    assert.ok(typeof output.overall_grade === "string");
    assert.ok(Array.isArray(output.dimensions));
    assert.ok(Array.isArray(output.warnings));
  });

  it("overall_score is the mean of all dimension scores", () => {
    const dims: DimensionScore[] = [
      buildDimensionScore("d1", "D1", "Cat", { a: 80 }),
      buildDimensionScore("d2", "D2", "Cat", { a: 60 }),
    ];
    const output = buildDashboardOutput(dims, []);
    assert.equal(output.overall_score, 70);
  });

  it("overall_score is 0 when no dimensions are provided", () => {
    const output = buildDashboardOutput([], []);
    assert.equal(output.overall_score, 0);
  });

  it("overall_grade reflects the score via grade boundaries", () => {
    const assertGrade = (score: number, expected: string): void => {
      const dims = [
        { id: "x", name: "X", category: "C", score, grade: scoreToGrade(score), metrics: {} },
      ];
      const output = buildDashboardOutput(dims, []);
      assert.equal(output.overall_grade, expected);
    };
    assertGrade(95, "A");
    assertGrade(85, "B");
    assertGrade(72, "C");
    assertGrade(65, "D");
    assertGrade(40, "F");
  });

  it("warnings array is forwarded unchanged into the output", () => {
    const w: WarningEntry = {
      dimension: "security",
      severity: "critical",
      message: "Score below threshold",
      threshold: 80,
      actual: 55,
    };
    const output = buildDashboardOutput([], [w]);
    assert.equal(output.warnings.length, 1);
    assert.equal(output.warnings[0].dimension, "security");
  });
});

// =========================================================
// 2. Dimension drill-down structure
// =========================================================

describe("dimension drill-down structure", () => {
  it("has required fields: id, name, category, score, grade, metrics", () => {
    const dim = buildDimensionScore("security", "Security", "Security", { ssl: 90, deps: 85 });
    assert.equal(dim.id, "security");
    assert.equal(dim.name, "Security");
    assert.equal(dim.category, "Security");
    assert.ok(typeof dim.score === "number");
    assert.ok(typeof dim.grade === "string");
    assert.ok(typeof dim.metrics === "object");
  });

  it("score is the mean of non-null metric values", () => {
    const dim = buildDimensionScore("d", "D", "C", { a: 80, b: 60, c: 100 });
    assert.equal(dim.score, 80);
  });

  it("null metrics are excluded from score computation", () => {
    const dim = buildDimensionScore("d", "D", "C", { a: 80, b: null, c: 60 });
    // mean of [80, 60] = 70
    assert.equal(dim.score, 70);
  });

  it("score is 0 when all metrics are null", () => {
    const dim = buildDimensionScore("d", "D", "C", { a: null, b: null });
    assert.equal(dim.score, 0);
  });

  it("sets no_data=true when all metrics are null", () => {
    const dim = buildDimensionScore("d", "D", "C", { a: null });
    assert.equal(dim.no_data, true);
  });

  it("does not set no_data when at least one metric has a value", () => {
    const dim = buildDimensionScore("d", "D", "C", { a: 75, b: null });
    assert.ok(!dim.no_data, "no_data should not be set when data exists");
  });

  it("grade matches the computed score", () => {
    const dim = buildDimensionScore("d", "D", "C", { a: 92 });
    assert.equal(dim.grade, "A");
    assert.equal(dim.score, 92);
  });
});

// =========================================================
// 3. Warning integration
// =========================================================

describe("warning integration", () => {
  it("classifyWarning returns info when actual meets or exceeds threshold (higher-is-better)", () => {
    assert.equal(classifyWarning(90, 80, true), "info");
    assert.equal(classifyWarning(80, 80, true), "info");
  });

  it("classifyWarning returns warning for a small shortfall (within 10% of threshold)", () => {
    // threshold=80, actual=75, delta=5 which is 6.25% of 80 -- warning
    assert.equal(classifyWarning(75, 80, true), "warning");
  });

  it("classifyWarning returns critical for a large shortfall (> 10% below threshold)", () => {
    // threshold=80, actual=55, delta=25 which is 31.25% of 80 -- critical
    assert.equal(classifyWarning(55, 80, true), "critical");
  });

  it("classifyWarning handles lower-is-better metrics", () => {
    // threshold=5 (max acceptable), actual=3 -- under threshold = info
    assert.equal(classifyWarning(3, 5, false), "info");
    // threshold=5, actual=10 -- exceeds threshold = critical
    assert.equal(classifyWarning(10, 5, false), "critical");
  });

  it("buildWarnings produces one warning per dimension below threshold", () => {
    const dims: DimensionScore[] = [
      buildDimensionScore("security", "Security", "Security", { a: 60 }),
      buildDimensionScore("testing", "Testing", "Testing", { a: 90 }),
    ];
    const warnings = buildWarnings(dims, { security: 80, testing: 80 });
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].dimension, "security");
  });

  it("buildWarnings produces no warnings when all dimensions meet thresholds", () => {
    const dims: DimensionScore[] = [
      buildDimensionScore("d1", "D1", "C", { a: 95 }),
      buildDimensionScore("d2", "D2", "C", { a: 88 }),
    ];
    const warnings = buildWarnings(dims, { d1: 80, d2: 80 });
    assert.deepEqual(warnings, []);
  });

  it("warning includes threshold and actual values", () => {
    const dims: DimensionScore[] = [buildDimensionScore("d", "D", "C", { a: 55 })];
    const warnings = buildWarnings(dims, { d: 80 });
    assert.equal(warnings[0].threshold, 80);
    assert.equal(warnings[0].actual, 55);
  });

  it("warning message includes dimension name and score", () => {
    const dims: DimensionScore[] = [
      buildDimensionScore("code-quality", "Code Quality", "C", { a: 50 }),
    ];
    const warnings = buildWarnings(dims, { "code-quality": 75 });
    assert.ok(warnings[0].message.includes("Code Quality"));
    assert.ok(warnings[0].message.includes("50"));
  });

  it("ignores dimensions not in the thresholds map", () => {
    const dims: DimensionScore[] = [buildDimensionScore("untracked", "Untracked", "C", { a: 10 })];
    const warnings = buildWarnings(dims, { "other-dim": 80 });
    assert.deepEqual(warnings, []);
  });
});

// =========================================================
// 4. Trend computation
// =========================================================

describe("trend computation", () => {
  it("returns stable with delta 0 for a single data point", () => {
    const trend = computeTrend([75]);
    assert.equal(trend.direction, "stable");
    assert.equal(trend.delta, 0);
    assert.equal(trend.previous, null);
    assert.equal(trend.current, 75);
  });

  it("returns stable and delta 0 for an empty series", () => {
    const trend = computeTrend([]);
    assert.equal(trend.direction, "stable");
    assert.equal(trend.delta, 0);
    assert.equal(trend.current, 0);
  });

  it("detects upward trend", () => {
    const trend = computeTrend([60, 65, 70, 75, 80]);
    assert.equal(trend.direction, "up");
    assert.ok(trend.delta > 0);
  });

  it("detects downward trend", () => {
    const trend = computeTrend([80, 75, 70, 65, 60]);
    assert.equal(trend.direction, "down");
    assert.ok(trend.delta < 0);
  });

  it("delta is current minus window-start value", () => {
    const trend = computeTrend([50, 60, 70, 80], 4);
    assert.equal(trend.delta, 30); // 80 - 50
    assert.equal(trend.current, 80);
    assert.equal(trend.previous, 50);
  });

  it("uses only the last windowSize entries", () => {
    // Long series with an early dip -- only the tail window matters
    const scores = [10, 10, 10, 70, 75, 80, 85, 90];
    const trend = computeTrend(scores, 5);
    // Window = [75, 80, 85, 90] -- no wait, last 5 = [75, 80, 85, 90] is 4 elements... last 5:
    // [70, 75, 80, 85, 90] -- previous=70, current=90, delta=20
    assert.equal(trend.direction, "up");
    assert.equal(trend.windowSize, 5);
  });

  it("windowSize is stored in the result", () => {
    const trend = computeTrend([70, 75, 80], 14);
    assert.equal(trend.windowSize, 14);
  });

  it("stable when delta is fractional (< 1)", () => {
    // Scores that differ by less than 1 unit
    const trend = computeTrend([75, 75, 75, 75]);
    assert.equal(trend.direction, "stable");
  });
});
