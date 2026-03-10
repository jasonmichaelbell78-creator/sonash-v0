/* eslint-disable no-undef */

/**
 * Internal benchmarks for Health Ecosystem Audit — 25 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" unless noted otherwise.
 *
 * Domain weights: D1=22%, D2=18%, D3=20%, D4=18%, D5=12%, D6=10%
 *
 * Staleness guard: HMS_STALENESS_HOURS env var overrides the default 24h
 * threshold for benchmark data freshness (D#20, D#52).
 */

"use strict";

/** Default staleness threshold in hours (overridable via HMS_STALENESS_HOURS) */
const DEFAULT_STALENESS_HOURS = 24;

function getStalenessHours() {
  const envVal = process.env.HMS_STALENESS_HOURS;
  if (envVal !== undefined && envVal !== "") {
    const parsed = Number(envVal);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_STALENESS_HOURS;
}

const BENCHMARKS = {
  // -- Domain 1: Checker Infrastructure & Reliability (22%) ------------------
  command_execution_robustness: {
    timeout_coverage_pct: { good: 90, average: 70, poor: 40, direction: "higher-is-better" },
    fallback_coverage_pct: { good: 80, average: 60, poor: 30, direction: "higher-is-better" },
  },
  file_io_safety: {
    guarded_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  benchmark_configuration: {
    drift_count: { good: 0, average: 2, poor: 5 },
  },
  edge_case_handling: {
    handled_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  error_propagation: {
    explicit_pct: { good: 90, average: 70, poor: 45, direction: "higher-is-better" },
  },

  // -- Domain 2: Scoring Pipeline Integrity (18%) ----------------------------
  composite_weight_validation: {
    weight_sum_deviation: { good: 0.001, average: 0.01, poor: 0.05 },
  },
  missing_data_handling: {
    graceful_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
  },
  metric_direction_consistency: {
    consistent_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  category_to_dimension_mapping: {
    valid_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },

  // -- Domain 3: Data Persistence & Concurrency (20%) ------------------------
  jsonl_append_atomicity: {
    safe_write_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
  },
  file_rotation_cleanup: {
    unbounded_count: { good: 0, average: 1, poor: 3 },
  },
  schema_validation: {
    valid_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  timestamp_consistency: {
    valid_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  corrupt_entry_detection: {
    handled_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
  },

  // -- Domain 4: Consumer Integration & Versioning (18%) ---------------------
  output_schema_versioning: {
    breaking_changes: { good: 0, average: 1, poor: 3 },
  },
  health_check_timeout_consistency: {
    consistent_pct: { good: 100, average: 80, poor: 60, direction: "higher-is-better" },
  },
  duplicate_logic_detection: {
    drift_count: { good: 0, average: 1, poor: 3 },
  },
  downstream_error_handling: {
    handled_pct: { good: 90, average: 70, poor: 45, direction: "higher-is-better" },
  },

  // -- Domain 5: Coverage & Completeness (12%) -------------------------------
  checker_success_aggregation: {
    success_pct: { good: 100, average: 80, poor: 60, direction: "higher-is-better" },
  },
  external_tool_availability: {
    declared_pct: { good: 90, average: 70, poor: 40, direction: "higher-is-better" },
  },
  test_coverage_verification: {
    pass_rate_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
    coverage_pct: { good: 65, average: 50, poor: 30, direction: "higher-is-better" },
  },
  test_registry_completeness: {
    registered_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },

  // -- Domain 6: Mid-Session Alert System (10%) ------------------------------
  cooldown_state_management: {
    healthy_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
  },
  warning_lifecycle_consistency: {
    consistent_pct: { good: 100, average: 85, poor: 60, direction: "higher-is-better" },
  },
  score_degradation_detection: {
    accurate_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 22%, D2: 18%, D3: 20%, D4: 18%, D5: 12%, D6: 10%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Checker Infrastructure & Reliability (22%)
  command_execution_robustness: 0.05,
  file_io_safety: 0.05,
  benchmark_configuration: 0.04,
  edge_case_handling: 0.04,
  error_propagation: 0.04,

  // Domain 2: Scoring Pipeline Integrity (18%)
  composite_weight_validation: 0.05,
  missing_data_handling: 0.05,
  metric_direction_consistency: 0.04,
  category_to_dimension_mapping: 0.04,

  // Domain 3: Data Persistence & Concurrency (20%)
  jsonl_append_atomicity: 0.04,
  file_rotation_cleanup: 0.04,
  schema_validation: 0.04,
  timestamp_consistency: 0.04,
  corrupt_entry_detection: 0.04,

  // Domain 4: Consumer Integration & Versioning (18%)
  output_schema_versioning: 0.05,
  health_check_timeout_consistency: 0.05,
  duplicate_logic_detection: 0.04,
  downstream_error_handling: 0.04,

  // Domain 5: Coverage & Completeness (12%)
  checker_success_aggregation: 0.03,
  external_tool_availability: 0.03,
  test_coverage_verification: 0.03,
  test_registry_completeness: 0.03,

  // Domain 6: Mid-Session Alert System (10%)
  cooldown_state_management: 0.04,
  warning_lifecycle_consistency: 0.03,
  score_degradation_detection: 0.03,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS, getStalenessHours, DEFAULT_STALENESS_HOURS };
