/* eslint-disable no-undef */

/**
 * Internal benchmarks for Script Ecosystem Audit — 18 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" for percentages, "lower-is-better" for counts.
 *
 * Domain weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Module System & Consistency (20%) ─────────────────────────
  cjs_esm_consistency: {
    consistency_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  shebang_entry_point: {
    valid_entry_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  nodejs_api_compatibility: {
    clean_pct: { good: 95, average: 85, poor: 70, direction: "higher-is-better" },
  },

  // ── Domain 2: Safety & Error Handling (25%) ─────────────────────────────
  file_io_safety: {
    coverage_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  error_sanitization: {
    sanitize_usage_pct: { good: 80, average: 50, poor: 20, direction: "higher-is-better" },
  },
  path_traversal_guards: {
    compliance_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  exec_safety: {
    safe_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  security_helper_usage: {
    usage_pct: { good: 80, average: 50, poor: 25, direction: "higher-is-better" },
  },

  // ── Domain 3: Registration & Reachability (20%) ─────────────────────────
  package_json_coverage: {
    reachable_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  cross_script_dependencies: {
    valid_pct: { good: 95, average: 85, poor: 70, direction: "higher-is-better" },
  },
  shared_lib_utilization: {
    utilization_pct: { good: 80, average: 60, poor: 35, direction: "higher-is-better" },
  },

  // ── Domain 4: Code Quality (20%) ────────────────────────────────────────
  documentation_headers: {
    documented_pct: { good: 85, average: 65, poor: 40, direction: "higher-is-better" },
  },
  consistent_patterns: {
    consistency_pct: { good: 85, average: 70, poor: 50, direction: "higher-is-better" },
  },
  dead_code: {
    used_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  complexity: {
    acceptable_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },

  // ── Domain 5: Testing & Reliability (15%) ───────────────────────────────
  test_coverage: {
    coverage_pct: { good: 70, average: 45, poor: 20, direction: "higher-is-better" },
  },
  test_freshness: {
    fresh_pct: { good: 85, average: 65, poor: 40, direction: "higher-is-better" },
  },
  error_path_testing: {
    error_test_pct: { good: 70, average: 45, poor: 20, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 20%, D2: 25%, D3: 20%, D4: 20%, D5: 15%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Module System & Consistency (20%)
  cjs_esm_consistency: 0.07,
  shebang_entry_point: 0.07,
  nodejs_api_compatibility: 0.06,

  // Domain 2: Safety & Error Handling (25%)
  file_io_safety: 0.05,
  error_sanitization: 0.05,
  path_traversal_guards: 0.05,
  exec_safety: 0.05,
  security_helper_usage: 0.05,

  // Domain 3: Registration & Reachability (20%)
  package_json_coverage: 0.07,
  cross_script_dependencies: 0.07,
  shared_lib_utilization: 0.06,

  // Domain 4: Code Quality (20%)
  documentation_headers: 0.05,
  consistent_patterns: 0.05,
  dead_code: 0.05,
  complexity: 0.05,

  // Domain 5: Testing & Reliability (15%)
  test_coverage: 0.05,
  test_freshness: 0.05,
  error_path_testing: 0.05,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS };
