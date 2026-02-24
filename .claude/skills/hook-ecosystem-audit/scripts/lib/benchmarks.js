/* eslint-disable no-undef */

/**
 * Internal benchmarks for Hook Ecosystem Audit — 16 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" unless noted otherwise.
 *
 * Domain weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Hook Configuration Health (20%) ────────────────────────────
  settings_file_alignment: {
    alignment_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  event_coverage_matchers: {
    coverage_pct: { good: 90, average: 75, poor: 50, direction: "higher-is-better" },
    validity_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  global_local_consistency: {
    conflict_count: { good: 0, average: 1, poor: 3 },
  },

  // ── Domain 2: Code Quality & Security (25%) ──────────────────────────────
  error_handling_sanitization: {
    coverage_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
    sanitize_usage_pct: { good: 80, average: 50, poor: 20, direction: "higher-is-better" },
  },
  security_patterns: {
    compliance_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  code_hygiene: {
    issues_count: { good: 0, average: 3, poor: 8 },
  },
  regex_safety: {
    unsafe_count: { good: 0, average: 1, poor: 3 },
  },

  // ── Domain 3: Pre-commit Pipeline (20%) ──────────────────────────────────
  stage_ordering_completeness: {
    stages_present_pct: { good: 95, average: 85, poor: 70, direction: "higher-is-better" },
  },
  bypass_override_controls: {
    controlled_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  gate_effectiveness: {
    blocking_pct: { good: 90, average: 80, poor: 65, direction: "higher-is-better" },
  },

  // ── Domain 4: Functional Correctness (20%) ───────────────────────────────
  test_coverage: {
    coverage_pct: { good: 85, average: 65, poor: 40, direction: "higher-is-better" },
  },
  output_protocol_compliance: {
    compliance_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  behavioral_accuracy: {
    accuracy_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },

  // ── Domain 5: State & Integration (15%) ──────────────────────────────────
  state_file_health: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  cross_hook_dependencies: {
    issues_count: { good: 0, average: 2, poor: 5 },
  },
  compaction_resilience: {
    layers_covered_pct: { good: 100, average: 75, poor: 50, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 20%, D2: 25%, D3: 20%, D4: 20%, D5: 15%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Hook Configuration Health (20%)
  settings_file_alignment: 0.07,
  event_coverage_matchers: 0.07,
  global_local_consistency: 0.06,

  // Domain 2: Code Quality & Security (25%)
  error_handling_sanitization: 0.07,
  security_patterns: 0.07,
  code_hygiene: 0.06,
  regex_safety: 0.05,

  // Domain 3: Pre-commit Pipeline (20%)
  stage_ordering_completeness: 0.07,
  bypass_override_controls: 0.07,
  gate_effectiveness: 0.06,

  // Domain 4: Functional Correctness (20%)
  test_coverage: 0.07,
  output_protocol_compliance: 0.07,
  behavioral_accuracy: 0.06,

  // Domain 5: State & Integration (15%)
  state_file_health: 0.05,
  cross_hook_dependencies: 0.05,
  compaction_resilience: 0.05,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS };
