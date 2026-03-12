/**
 * Dimension mapping for Health Check drill-down
 *
 * Maps 13 dimensions into 8 categories with checker field references.
 * Each dimension provides detail-level access into individual metrics.
 */

"use strict";

/**
 * 13 health dimensions mapped to 8 categories
 */
const DIMENSIONS = [
  {
    id: "ts-health",
    name: "TypeScript Health",
    category: "Code Quality",
    checkerField: "code-quality",
    metricKeys: ["ts_errors", "eslint_errors"],
    description: "TypeScript compilation errors and type safety",
  },
  {
    id: "eslint-compliance",
    name: "ESLint Compliance",
    category: "Code Quality",
    checkerField: "code-quality",
    metricKeys: ["eslint_warnings", "eslint_errors", "pattern_violations", "circular_deps"],
    description: "Linting rules compliance and code style consistency",
  },
  {
    id: "pattern-enforcement",
    name: "Pattern Enforcement",
    category: "Learning & Patterns",
    checkerField: "pattern-enforcement",
    metricKeys: ["repeat_offenders", "outdated_patterns", "hotspot_files", "sync_issues"],
    description: "Code pattern compliance and enforcement effectiveness",
  },
  {
    id: "vulnerability-status",
    name: "Vulnerability Status",
    category: "Security",
    checkerField: "security",
    metricKeys: ["critical_vulns", "high_vulns", "audit_status", "secret_exposure"],
    description: "Security vulnerabilities and audit status",
  },
  {
    id: "debt-aging",
    name: "Debt Aging",
    category: "Technical Debt",
    checkerField: "debt-health",
    metricKeys: ["s0_count", "s1_count", "avg_age_days", "total_open"],
    description: "Technical debt item counts and aging",
  },
  {
    id: "debt-velocity",
    name: "Debt Velocity",
    category: "Technical Debt",
    checkerField: "debt-health",
    metricKeys: ["resolution_rate", "intake_30d", "resolved_30d", "net_flow"],
    description: "Rate of debt creation vs resolution",
  },
  {
    id: "test-pass-rate",
    name: "Test Pass Rate",
    category: "Testing",
    checkerField: "test-coverage",
    metricKeys: ["pass_rate", "failed_count", "error_count", "staleness_days"],
    description: "Test suite health and pass rates",
  },
  {
    id: "learning-effectiveness",
    name: "Learning Effectiveness",
    category: "Learning & Patterns",
    checkerField: "learning-effectiveness",
    metricKeys: [
      "effectiveness",
      "automation_coverage",
      "failing_patterns",
      "learned_count",
      "critical_success",
    ],
    description: "How well patterns are being learned and automated",
  },
  {
    id: "hook-pipeline-health",
    name: "Hook Pipeline Health",
    category: "Infrastructure",
    checkerField: "hook-pipeline",
    metricKeys: [
      "warnings_7d",
      "overrides_7d",
      "false_positive_pct",
      "noise_ratio",
      "commit_failures_7d",
      "overrides_24h",
      "warnings_24h",
      "no_reason_pct",
      "last_hook_passed",
    ],
    description: "Pre-commit hook reliability and false positive rates",
  },
  {
    id: "session-management",
    name: "Session Management",
    category: "Infrastructure",
    checkerField: "session-management",
    metricKeys: ["uncommitted_files", "stale_branch_days", "session_gap_hours"],
    description: "Working tree cleanliness and session hygiene",
  },
  {
    id: "documentation-freshness",
    name: "Documentation Freshness",
    category: "Documentation",
    checkerField: "documentation",
    metricKeys: [
      "staleness_days",
      "misplaced_docs",
      "broken_links",
      "crossdoc_issues",
      "canon_issues",
    ],
    description: "Documentation currency and structural health",
  },
  {
    id: "review-quality",
    name: "Review Quality",
    category: "Process & Workflow",
    checkerField: "ecosystem-integration",
    metricKeys: ["avg_fix_ratio", "avg_rounds", "review_count"],
    description: "Code review effectiveness and churn",
  },
  {
    id: "workflow-compliance",
    name: "Workflow Compliance",
    category: "Process & Workflow",
    checkerField: "ecosystem-integration",
    metricKeys: ["ci_failures", "sonar_issues", "velocity_avg", "reviews_missing"],
    description: "CI/CD health and integration completeness",
  },
];

/**
 * Get detailed metrics for a specific dimension from checker results
 * @param {string} dimensionId - Dimension ID (e.g., 'ts-health')
 * @param {Object} checkerResults - Raw output from all checkers keyed by checker name
 * @returns {{ dimension: Object, metrics: Object, score: number, grade: string }|null}
 */
function getDimensionDetail(dimensionId, checkerResults) {
  const dim = DIMENSIONS.find((d) => d.id === dimensionId);
  if (!dim) return null;

  const checkerData = checkerResults[dim.checkerField];
  if (!checkerData || checkerData.no_data) {
    return {
      dimension: dim,
      metrics: {},
      score: 0,
      grade: "F",
      no_data: true,
    };
  }

  const metrics = {};
  let totalScore = 0;
  let metricCount = 0;

  for (const key of dim.metricKeys) {
    const metric = checkerData.metrics[key];
    if (metric) {
      metrics[key] = metric;
      if (typeof metric.score === "number") {
        totalScore += metric.score;
        metricCount++;
      }
    }
  }

  const avgScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
  const { computeGrade } = require("./scoring");

  return {
    dimension: dim,
    metrics,
    score: avgScore,
    grade: computeGrade(avgScore),
  };
}

module.exports = { DIMENSIONS, getDimensionDetail };
