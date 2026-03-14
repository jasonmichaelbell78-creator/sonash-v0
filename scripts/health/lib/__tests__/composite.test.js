/* eslint-disable no-undef */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { computeCompositeScore, CATEGORY_WEIGHTS, CHECKER_TO_CATEGORY } = require(
  path.join(__dirname, "..", "composite.js")
);

function makeAllGoodResults() {
  return {
    "code-quality": {
      no_data: false,
      metrics: {
        ts_errors: { score: 100, value: 0 },
        eslint_errors: { score: 100, value: 0 },
        eslint_warnings: { score: 90, value: 2 },
        pattern_violations: { score: 100, value: 0 },
        circular_deps: { score: 100, value: 0 },
        ts_strict_coverage: { score: 100, value: 100 },
        lint_fix_ratio: { score: 100, value: 0 },
        code_style_score: { score: 97, value: 97 },
      },
    },
    security: {
      no_data: false,
      metrics: {
        critical_vulns: { score: 100, value: 0 },
        high_vulns: { score: 100, value: 0 },
        audit_status: { score: 100, value: 100 },
        secret_exposure: { score: 100, value: 0 },
      },
    },
    "debt-health": {
      no_data: false,
      metrics: {
        s0_count: { score: 100, value: 0 },
        s1_count: { score: 100, value: 0 },
        total_open: { score: 100, value: 5 },
        avg_age_days: { score: 100, value: 10 },
        resolution_rate: { score: 100, value: 60 },
        intake_30d: { score: 100, value: 2 },
        resolved_30d: { score: 100, value: 5 },
        net_flow: { score: 100, value: -3 },
      },
    },
    "test-coverage": {
      no_data: false,
      metrics: {
        pass_rate: { score: 100, value: 100 },
        failed_count: { score: 100, value: 0 },
        error_count: { score: 100, value: 0 },
        staleness_days: { score: 100, value: 0 },
      },
    },
    "learning-effectiveness": {
      no_data: false,
      metrics: {
        effectiveness: { score: 100, value: 90 },
        automation_coverage: { score: 100, value: 45 },
        failing_patterns: { score: 100, value: 0 },
        learned_count: { score: 100, value: 25 },
        critical_success: { score: 100, value: 97 },
      },
    },
    "hook-pipeline": {
      no_data: false,
      metrics: {
        warnings_7d: { score: 100, value: 0 },
        overrides_7d: { score: 100, value: 0 },
        false_positive_pct: { score: 100, value: 0 },
        noise_ratio: { score: 100, value: 0 },
        commit_failures_7d: { score: 100, value: 0 },
        overrides_24h: { score: 100, value: 0 },
        warnings_24h: { score: 100, value: 0 },
        no_reason_pct: { score: 100, value: 0 },
        last_hook_passed: { score: 100, value: 100 },
        override_trend: { score: 100, value: 0 },
        top_warning_type: { score: 100, value: 0 },
        top_failed_check: { score: 100, value: 0 },
      },
    },
    "session-management": {
      no_data: false,
      metrics: {
        uncommitted_files: { score: 100, value: 0 },
        stale_branch_days: { score: 100, value: 0 },
        session_gap_hours: { score: 100, value: 0 },
      },
    },
    documentation: {
      no_data: false,
      metrics: {
        staleness_days: { score: 100, value: 1 },
        misplaced_docs: { score: 100, value: 0 },
        broken_links: { score: 100, value: 0 },
        crossdoc_issues: { score: 100, value: 0 },
        canon_issues: { score: 100, value: 0 },
        doc_count: { score: 100, value: 30 },
        freshness_score: { score: 100, value: 95 },
        coverage_estimate: { score: 100, value: 80 },
      },
    },
    "pattern-enforcement": {
      no_data: false,
      metrics: {
        repeat_offenders: { score: 100, value: 0 },
        outdated_patterns: { score: 100, value: 0 },
        hotspot_files: { score: 100, value: 0 },
        sync_issues: { score: 100, value: 0 },
      },
    },
    "ecosystem-integration": {
      no_data: false,
      metrics: {
        avg_fix_ratio: { score: 100, value: 0.1 },
        avg_rounds: { score: 100, value: 1 },
        review_count: { score: 100, value: 5 },
        ci_failures: { score: 100, value: 0 },
        sonar_issues: { score: 100, value: 0 },
        velocity_avg: { score: 100, value: 6 },
        reviews_missing: { score: 100, value: 0 },
        churn_pct: { score: 100, value: 5 },
      },
    },
    "data-effectiveness": {
      no_data: false,
      metrics: {
        avg_lifecycle_score: { score: 100, value: 10 },
        below_threshold_pct: { score: 100, value: 0 },
        recall_coverage: { score: 100, value: 100 },
        action_coverage: { score: 100, value: 60 },
        orphan_count: { score: 100, value: 0 },
      },
    },
  };
}

describe("CATEGORY_WEIGHTS", () => {
  it("exports object with category name keys", () => {
    assert.ok(typeof CATEGORY_WEIGHTS === "object" && CATEGORY_WEIGHTS !== null);
    assert.ok("Code Quality" in CATEGORY_WEIGHTS);
    assert.ok("Security" in CATEGORY_WEIGHTS);
  });

  it("weights sum to approximately 1.0", () => {
    const total = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 0.01, `weights sum to ${total}, expected ~1.0`);
  });

  it("all weights are positive numbers", () => {
    for (const [cat, w] of Object.entries(CATEGORY_WEIGHTS)) {
      assert.ok(typeof w === "number" && w > 0, `weight for "${cat}" is not positive`);
    }
  });
});

describe("CHECKER_TO_CATEGORY", () => {
  it("maps all 11 checker names", () => {
    const checkers = [
      "code-quality",
      "security",
      "debt-health",
      "test-coverage",
      "learning-effectiveness",
      "hook-pipeline",
      "session-management",
      "documentation",
      "pattern-enforcement",
      "ecosystem-integration",
      "data-effectiveness",
    ];
    for (const name of checkers) {
      assert.ok(name in CHECKER_TO_CATEGORY, `"${name}" not in CHECKER_TO_CATEGORY`);
    }
  });

  it("all mapped categories exist in CATEGORY_WEIGHTS", () => {
    for (const [checker, cat] of Object.entries(CHECKER_TO_CATEGORY)) {
      assert.ok(cat in CATEGORY_WEIGHTS, `"${checker}" maps to unknown category "${cat}"`);
    }
  });
});

describe("computeCompositeScore", () => {
  it("returns score in [0, 100] and a valid grade", () => {
    const result = computeCompositeScore(makeAllGoodResults());
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(["A", "B", "C", "D", "F"].includes(result.grade));
  });

  it("returns high score when all checkers report score=100", () => {
    const result = computeCompositeScore(makeAllGoodResults());
    assert.ok(result.score >= 90, `expected >= 90, got ${result.score}`);
  });

  it("returns score=0 and grade=F when all checkers have no_data", () => {
    const noData = {};
    for (const name of Object.keys(makeAllGoodResults())) {
      noData[name] = { no_data: true, metrics: {} };
    }
    const result = computeCompositeScore(noData);
    assert.equal(result.score, 0);
    assert.equal(result.grade, "F");
  });

  it("returns categoryScores object with all 9 categories", () => {
    const result = computeCompositeScore(makeAllGoodResults());
    for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
      assert.ok(cat in result.categoryScores, `"${cat}" missing from categoryScores`);
    }
  });

  it("returns dimensionScores object with entries", () => {
    const result = computeCompositeScore(makeAllGoodResults());
    assert.ok(typeof result.dimensionScores === "object");
    assert.ok(Object.keys(result.dimensionScores).length > 0);
  });

  it("handles empty checker results gracefully (returns score=0)", () => {
    const result = computeCompositeScore({});
    assert.equal(result.score, 0);
  });

  it("ignores unknown checker names", () => {
    const results = makeAllGoodResults();
    results["totally-unknown"] = { no_data: false, metrics: { m: { score: 10, value: 1 } } };
    const result = computeCompositeScore(results);
    assert.ok(result.score >= 0 && result.score <= 100);
  });

  it("poor scores in one category lower the composite score", () => {
    const good = computeCompositeScore(makeAllGoodResults());
    const poor = makeAllGoodResults();
    poor["code-quality"] = {
      no_data: false,
      metrics: { ts_errors: { score: 0, value: 100 }, eslint_errors: { score: 0, value: 50 } },
    };
    const result = computeCompositeScore(poor);
    assert.ok(
      result.score < good.score,
      `poor code quality should lower score: ${result.score} vs ${good.score}`
    );
  });
});
