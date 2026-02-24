/* eslint-disable no-undef */

/**
 * Internal benchmarks for Session Ecosystem Audit — 16 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" unless noted otherwise.
 *
 * Domain weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Session Lifecycle Management (20%) ────────────────────────
  session_begin_completeness: {
    coverage_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  session_end_completeness: {
    coverage_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  session_counter_accuracy: {
    accuracy_pct: { good: 99, average: 90, poor: 70, direction: "higher-is-better" },
  },
  session_doc_freshness: {
    freshness_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },

  // ── Domain 2: State Persistence & Handoff (25%) ─────────────────────────
  handoff_file_schema: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  commit_log_integrity: {
    valid_pct: { good: 98, average: 90, poor: 75, direction: "higher-is-better" },
  },
  task_state_file_health: {
    health_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  session_notes_quality: {
    quality_pct: { good: 85, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 3: Compaction Resilience (20%) ───────────────────────────────
  layer_a_commit_tracker: {
    health_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  layer_c_precompact_save: {
    completeness_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  layer_d_gap_detection: {
    detection_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  restore_output_quality: {
    quality_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },

  // ── Domain 4: Cross-Session Safety (15%) ────────────────────────────────
  begin_end_balance: {
    balance_pct: { good: 99, average: 90, poor: 70, direction: "higher-is-better" },
  },
  multi_session_validation: {
    validation_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },

  // ── Domain 5: Integration & Configuration (20%) ─────────────────────────
  hook_registration_alignment: {
    alignment_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  state_file_management: {
    managed_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 20%, D2: 25%, D3: 20%, D4: 15%, D5: 20%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Session Lifecycle Management (20%)
  session_begin_completeness: 0.05,
  session_end_completeness: 0.05,
  session_counter_accuracy: 0.05,
  session_doc_freshness: 0.05,

  // Domain 2: State Persistence & Handoff (25%)
  handoff_file_schema: 0.07,
  commit_log_integrity: 0.07,
  task_state_file_health: 0.06,
  session_notes_quality: 0.05,

  // Domain 3: Compaction Resilience (20%)
  layer_a_commit_tracker: 0.05,
  layer_c_precompact_save: 0.05,
  layer_d_gap_detection: 0.05,
  restore_output_quality: 0.05,

  // Domain 4: Cross-Session Safety (15%)
  begin_end_balance: 0.08,
  multi_session_validation: 0.07,

  // Domain 5: Integration & Configuration (20%)
  hook_registration_alignment: 0.1,
  state_file_management: 0.1,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS };
