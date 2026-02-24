/* eslint-disable no-undef */

/**
 * Internal benchmarks for TDMS Ecosystem Audit — 16 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" unless noted otherwise.
 *
 * Domain weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Pipeline Correctness (20%) ────────────────────────────────
  script_execution_order: {
    order_score: { good: 95, average: 85, poor: 70, direction: "higher-is-better" },
  },
  data_flow_integrity: {
    connected_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  intake_pipeline: {
    compliance_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },

  // ── Domain 2: Data Quality & Deduplication (25%) ────────────────────────
  dedup_algorithm_health: {
    accuracy_pct: { good: 85, average: 70, poor: 50, direction: "higher-is-better" },
  },
  schema_compliance: {
    valid_pct: { good: 98, average: 90, poor: 75, direction: "higher-is-better" },
  },
  content_hash_integrity: {
    match_pct: { good: 99, average: 95, poor: 85, direction: "higher-is-better" },
  },
  id_uniqueness_referential: {
    integrity_pct: { good: 99, average: 95, poor: 85, direction: "higher-is-better" },
  },

  // ── Domain 3: File I/O & Safety (20%) ───────────────────────────────────
  error_handling_coverage: {
    protected_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  master_deduped_sync: {
    sync_pct: { good: 99, average: 90, poor: 70, direction: "higher-is-better" },
  },
  backup_atomicity: {
    atomic_pct: { good: 85, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 4: Roadmap Integration (15%) ─────────────────────────────────
  track_assignment_rules: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  roadmap_debt_cross_ref: {
    linked_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  sprint_file_alignment: {
    aligned_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },

  // ── Domain 5: Metrics & Reporting (20%) ─────────────────────────────────
  view_generation_accuracy: {
    accuracy_pct: { good: 98, average: 90, poor: 75, direction: "higher-is-better" },
  },
  metrics_dashboard_correctness: {
    correct_pct: { good: 95, average: 85, poor: 70, direction: "higher-is-better" },
  },
  audit_trail_completeness: {
    complete_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 20%, D2: 25%, D3: 20%, D4: 15%, D5: 20%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Pipeline Correctness (20%)
  script_execution_order: 0.07,
  data_flow_integrity: 0.07,
  intake_pipeline: 0.06,

  // Domain 2: Data Quality & Deduplication (25%)
  dedup_algorithm_health: 0.07,
  schema_compliance: 0.07,
  content_hash_integrity: 0.06,
  id_uniqueness_referential: 0.05,

  // Domain 3: File I/O & Safety (20%)
  error_handling_coverage: 0.07,
  master_deduped_sync: 0.07,
  backup_atomicity: 0.06,

  // Domain 4: Roadmap Integration (15%)
  track_assignment_rules: 0.05,
  roadmap_debt_cross_ref: 0.05,
  sprint_file_alignment: 0.05,

  // Domain 5: Metrics & Reporting (20%)
  view_generation_accuracy: 0.07,
  metrics_dashboard_correctness: 0.07,
  audit_trail_completeness: 0.06,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS };
