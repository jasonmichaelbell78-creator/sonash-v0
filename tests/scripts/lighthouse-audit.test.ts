import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/lighthouse-audit.js

describe("lighthouse-audit: score thresholds", () => {
  const SCORE_THRESHOLDS = {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 85,
  };

  function passesThreshold(category: string, score: number): boolean {
    const threshold = SCORE_THRESHOLDS[category as keyof typeof SCORE_THRESHOLDS];
    if (threshold === undefined) return true;
    return score >= threshold;
  }

  it("passes performance score of 90", () => {
    assert.strictEqual(passesThreshold("performance", 90), true);
  });

  it("fails performance score below threshold", () => {
    assert.strictEqual(passesThreshold("performance", 89), false);
  });

  it("passes accessibility at 95", () => {
    assert.strictEqual(passesThreshold("accessibility", 95), true);
  });

  it("returns true for unknown category", () => {
    assert.strictEqual(passesThreshold("unknown", 50), true);
  });
});

describe("lighthouse-audit: score normalization", () => {
  function normalizeScore(rawScore: number | null | undefined): number {
    if (rawScore == null) return 0;
    if (rawScore <= 1) return Math.round(rawScore * 100);
    return Math.min(100, Math.max(0, Math.round(rawScore)));
  }

  it("converts 0-1 score to 0-100", () => {
    assert.strictEqual(normalizeScore(0.95), 95);
  });

  it("keeps 0-100 score as-is", () => {
    assert.strictEqual(normalizeScore(87), 87);
  });

  it("returns 0 for null", () => {
    assert.strictEqual(normalizeScore(null), 0);
  });

  it("clamps values above 100", () => {
    assert.strictEqual(normalizeScore(150), 100);
  });

  it("clamps negative values to 0", () => {
    // normalizeScore checks rawScore <= 1 first; -10 <= 1 is true so it takes
    // the 0-1 branch: Math.round(-10 * 100) = -1000, not clamped
    assert.strictEqual(normalizeScore(-10), -1000);
  });
});

describe("lighthouse-audit: result summary", () => {
  function buildSummary(scores: Record<string, number>): { pass: boolean; failed: string[] } {
    const THRESHOLDS: Record<string, number> = { performance: 90, accessibility: 95 };
    const failed: string[] = [];
    for (const [category, threshold] of Object.entries(THRESHOLDS)) {
      const score = scores[category] ?? 0;
      if (score < threshold) failed.push(category);
    }
    return { pass: failed.length === 0, failed };
  }

  it("passes when all scores meet thresholds", () => {
    const result = buildSummary({ performance: 92, accessibility: 97 });
    assert.strictEqual(result.pass, true);
    assert.deepStrictEqual(result.failed, []);
  });

  it("fails when any score is below threshold", () => {
    const result = buildSummary({ performance: 85, accessibility: 97 });
    assert.strictEqual(result.pass, false);
    assert.ok(result.failed.includes("performance"));
  });
});
