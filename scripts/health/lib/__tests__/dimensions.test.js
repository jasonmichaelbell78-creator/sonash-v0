/* eslint-disable no-undef */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { DIMENSIONS, getDimensionDetail } = require(path.join(__dirname, "..", "dimensions.js"));

// Minimal valid checker results fixture
function makeCheckerResults(overrides) {
  const base = {
    "code-quality": {
      no_data: false,
      metrics: {
        ts_errors: { score: 100, rating: "good", value: 0 },
        eslint_errors: { score: 100, rating: "good", value: 0 },
        eslint_warnings: { score: 90, rating: "good", value: 2 },
        pattern_violations: { score: 100, rating: "good", value: 0 },
        circular_deps: { score: 100, rating: "good", value: 0 },
      },
    },
    security: {
      no_data: false,
      metrics: {
        critical_vulns: { score: 100, rating: "good", value: 0 },
        high_vulns: { score: 90, rating: "good", value: 1 },
        audit_status: { score: 100, rating: "good", value: 100 },
        secret_exposure: { score: 100, rating: "good", value: 0 },
      },
    },
    "debt-health": {
      no_data: false,
      metrics: {
        s0_count: { score: 100, value: 0 },
        s1_count: { score: 100, value: 0 },
        avg_age_days: { score: 100, value: 15 },
        total_open: { score: 100, value: 5 },
        resolution_rate: { score: 100, value: 60 },
        intake_30d: { score: 100, value: 2 },
        resolved_30d: { score: 100, value: 5 },
        net_flow: { score: 100, value: -3 },
      },
    },
    "test-coverage": {
      no_data: false,
      metrics: {
        pass_rate: { score: 100, value: 99 },
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
  };
  return { ...base, ...overrides };
}

describe("DIMENSIONS", () => {
  it("exports an array", () => {
    assert.ok(Array.isArray(DIMENSIONS));
  });

  it("has exactly 14 dimensions", () => {
    assert.equal(DIMENSIONS.length, 14);
  });

  it("each dimension has required fields: id, name, category, checkerField, metricKeys", () => {
    for (const dim of DIMENSIONS) {
      assert.ok(typeof dim.id === "string", `dim.id missing on ${JSON.stringify(dim)}`);
      assert.ok(typeof dim.name === "string", `dim.name missing on ${dim.id}`);
      assert.ok(typeof dim.category === "string", `dim.category missing on ${dim.id}`);
      assert.ok(typeof dim.checkerField === "string", `dim.checkerField missing on ${dim.id}`);
      assert.ok(Array.isArray(dim.metricKeys), `dim.metricKeys not array on ${dim.id}`);
    }
  });

  it("all dimension ids are unique", () => {
    const ids = DIMENSIONS.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe("getDimensionDetail", () => {
  it("returns null for unknown dimension id", () => {
    assert.equal(getDimensionDetail("non-existent", makeCheckerResults()), null);
  });

  it("returns no_data=true when checker has no_data=true", () => {
    const results = makeCheckerResults({ "code-quality": { no_data: true, metrics: {} } });
    const detail = getDimensionDetail("ts-health", results);
    assert.ok(detail !== null);
    assert.equal(detail.no_data, true);
    assert.equal(detail.score, 0);
    assert.equal(detail.grade, "F");
  });

  it("returns no_data=true when checker is missing entirely", () => {
    const detail = getDimensionDetail("ts-health", {});
    assert.ok(detail !== null);
    assert.equal(detail.no_data, true);
  });

  it("returns score in [0, 100] and valid grade for ts-health dimension", () => {
    const detail = getDimensionDetail("ts-health", makeCheckerResults());
    assert.ok(detail !== null);
    assert.ok(detail.score >= 0 && detail.score <= 100);
    assert.ok(["A", "B", "C", "D", "F"].includes(detail.grade));
  });

  it("includes only metric keys defined for the dimension", () => {
    const detail = getDimensionDetail("ts-health", makeCheckerResults());
    assert.ok("ts_errors" in detail.metrics);
    assert.ok("eslint_errors" in detail.metrics);
    // pattern_violations belongs to eslint-compliance, not ts-health
    assert.ok(!("pattern_violations" in detail.metrics));
  });

  it("returns score=0 when checker metrics object is empty", () => {
    const results = makeCheckerResults({
      "code-quality": { no_data: false, metrics: {} },
    });
    const detail = getDimensionDetail("ts-health", results);
    assert.ok(detail !== null);
    assert.equal(detail.score, 0);
  });

  it("computes average score from matching metric keys", () => {
    const results = makeCheckerResults({
      "code-quality": {
        no_data: false,
        metrics: {
          ts_errors: { score: 60, value: 8 },
          eslint_errors: { score: 80, value: 2 },
        },
      },
    });
    const detail = getDimensionDetail("ts-health", results);
    assert.ok(detail !== null);
    // avg(60, 80) = 70
    assert.equal(detail.score, 70);
  });

  it("returns dimension object in result", () => {
    const detail = getDimensionDetail("vulnerability-status", makeCheckerResults());
    assert.ok(detail !== null && "dimension" in detail);
    assert.equal(detail.dimension.id, "vulnerability-status");
  });
});
