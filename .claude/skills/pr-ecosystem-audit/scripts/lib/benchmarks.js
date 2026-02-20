/* eslint-disable no-undef */

/**
 * Internal benchmarks for PR Ecosystem Audit — 18 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "lower-is-better" unless noted otherwise.
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Process Compliance ──────────────────────────────────────────
  skill_invocation_fidelity: {
    steps_completed_pct: { good: 95, average: 75, poor: 50, direction: "higher-is-better" },
    pre_checks_run_pct: { good: 90, average: 60, poor: 25, direction: "higher-is-better" },
  },
  review_process_completeness: {
    multi_pass_pct: { good: 90, average: 70, poor: 40, direction: "higher-is-better" },
    propagation_sweep_pct: { good: 80, average: 50, poor: 20, direction: "higher-is-better" },
    pre_push_gate_pct: { good: 90, average: 60, poor: 30, direction: "higher-is-better" },
  },
  retro_quality_compliance: {
    mandatory_sections_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
    action_items_tracked_pct: { good: 90, average: 60, poor: 30, direction: "higher-is-better" },
  },
  learning_capture_integrity: {
    field_completeness_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
    numbering_gaps: { good: 0, average: 2, poor: 5 },
  },

  // ── Domain 2: Data & State Health ─────────────────────────────────────────
  state_file_consistency: {
    sync_check_pass: { good: 0, average: 0, poor: 1 }, // 0 = passing
    orphaned_entries: { good: 0, average: 2, poor: 5 },
    schema_valid_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  archive_retention_health: {
    active_review_count: { good: 15, average: 20, poor: 30 },
    archive_accessible_pct: { good: 100, average: 90, poor: 70, direction: "higher-is-better" },
  },
  jsonl_sync_fidelity: {
    drift_count: { good: 0, average: 3, poor: 10 },
    corrupted_lines: { good: 0, average: 1, poor: 5 },
  },

  // ── Domain 3: Pattern Lifecycle & Enforcement ─────────────────────────────
  pattern_discovery_automation: {
    automated_pct: { good: 60, average: 35, poor: 15, direction: "higher-is-better" },
    pipeline_completion_pct: { good: 80, average: 50, poor: 20, direction: "higher-is-better" },
  },
  pattern_enforcement_coverage: {
    enforcement_pct: { good: 80, average: 55, poor: 30, direction: "higher-is-better" },
    false_positive_pct: { good: 5, average: 15, poor: 30 },
    graduation_rate: { good: 50, average: 25, poor: 5, direction: "higher-is-better" },
  },
  consolidation_pipeline_health: {
    pending_reviews: { good: 3, average: 8, poor: 15 },
    rule_adoption_pct: { good: 70, average: 40, poor: 15, direction: "higher-is-better" },
  },
  automation_coverage_gap: {
    gap_pct: { good: 20, average: 45, poor: 70 },
    trend_direction: { good: -5, average: 0, poor: 5 }, // negative = shrinking gap = good
  },

  // ── Domain 4: Feedback Loop & Integration ─────────────────────────────────
  feedback_loop_closure: {
    closure_rate_pct: { good: 80, average: 55, poor: 30, direction: "higher-is-better" },
    repeat_offender_count: { good: 0, average: 2, poor: 5 },
    time_to_implement_days: { good: 7, average: 21, poor: 60 },
  },
  cross_pr_pattern_recurrence: {
    recurring_unsuppressed: { good: 0, average: 3, poor: 8 },
    false_positive_rate_pct: { good: 10, average: 25, poor: 45 },
  },
  external_tool_configuration: {
    config_completeness_pct: { good: 100, average: 80, poor: 50, direction: "higher-is-better" },
    suppression_effectiveness_pct: {
      good: 90,
      average: 65,
      poor: 35,
      direction: "higher-is-better",
    },
    stale_rules: { good: 0, average: 2, poor: 5 },
  },
  cross_system_integration: {
    integration_points_active_pct: {
      good: 90,
      average: 65,
      poor: 40,
      direction: "higher-is-better",
    },
    episodic_memory_usage_pct: { good: 80, average: 50, poor: 20, direction: "higher-is-better" },
  },

  // ── Domain 5: Effectiveness Metrics ───────────────────────────────────────
  review_cycle_efficiency: {
    avg_rounds_per_pr: { good: 3, average: 5, poor: 8 },
    fix_ratio: { good: 0.15, average: 0.25, poor: 0.4 },
    churn_pct: { good: 10, average: 25, poor: 45 },
  },
  agent_utilization_effectiveness: {
    parallel_usage_pct: { good: 80, average: 50, poor: 20, direction: "higher-is-better" },
    specialist_match_pct: { good: 90, average: 65, poor: 35, direction: "higher-is-better" },
  },
  template_reference_quality: {
    coverage_pct: { good: 80, average: 55, poor: 30, direction: "higher-is-better" },
    freshness_days: { good: 7, average: 21, poor: 60 },
    accuracy_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * Pattern Lifecycle and Feedback & Integration get highest weights
 * because they measure whether the ecosystem is actually learning.
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Process Compliance (20%)
  skill_invocation_fidelity: 0.05,
  review_process_completeness: 0.05,
  retro_quality_compliance: 0.05,
  learning_capture_integrity: 0.05,

  // Domain 2: Data & State Health (15%)
  state_file_consistency: 0.05,
  archive_retention_health: 0.05,
  jsonl_sync_fidelity: 0.05,

  // Domain 3: Pattern Lifecycle (25%)
  pattern_discovery_automation: 0.08,
  pattern_enforcement_coverage: 0.07,
  consolidation_pipeline_health: 0.05,
  automation_coverage_gap: 0.05,

  // Domain 4: Feedback & Integration (25%)
  feedback_loop_closure: 0.08,
  cross_pr_pattern_recurrence: 0.07,
  external_tool_configuration: 0.05,
  cross_system_integration: 0.05,

  // Domain 5: Effectiveness Metrics (15%)
  review_cycle_efficiency: 0.05,
  agent_utilization_effectiveness: 0.05,
  template_reference_quality: 0.05,
};

/**
 * Industry/external benchmarks with citations.
 */
const INDUSTRY_BENCHMARKS = {
  review_rounds: {
    source: "Google Engineering Practices",
    benchmark: { good: 2, average: 3, poor: 5 },
    note: "Most changes should need only 1-2 rounds of review",
  },
  fix_ratio: {
    source: "DORA / Accelerate metrics",
    benchmark: { good: 0.1, average: 0.2, poor: 0.4 },
    note: "Review fix ratio should be <20% of total commits",
  },
  automation_coverage: {
    source: "Google Code Health team",
    benchmark: { good: 60, average: 30, poor: 10 },
    note: "Automated checks should catch 60%+ of common patterns",
  },
  feedback_loop_closure: {
    source: "Lean Software Development (Poppendieck)",
    benchmark: { good: 90, average: 70, poor: 40 },
    note: "Action items should be closed within 2 iterations",
  },
  false_positive_rate: {
    source: "Microsoft SARIF standard",
    benchmark: { good: 5, average: 15, poor: 30 },
    note: "Static analysis false positive rate should be <15%",
  },
  pattern_recurrence: {
    source: "IEEE Software Engineering Body of Knowledge",
    benchmark: { good: 0, average: 2, poor: 5 },
    note: "Known patterns should not recur after documented fix",
  },
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS, INDUSTRY_BENCHMARKS };
