/* eslint-disable no-undef */

/**
 * Internal benchmarks for Skill Ecosystem Audit — 21 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" for percentages, "lower-is-better" for counts.
 *
 * Domain weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Structural Compliance (20%) ──────────────────────────────────
  frontmatter_schema: {
    valid_pct: { good: 95, average: 75, poor: 50, direction: "higher-is-better" },
  },
  step_continuity: {
    continuous_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  section_structure: {
    complete_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  bloat_score: {
    below_threshold_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 2: Cross-Reference Integrity (25%) ─────────────────────────────
  skill_to_skill_refs: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  skill_to_script_refs: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  skill_to_template_refs: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  evidence_citation_validity: {
    verifiable_pct: { good: 80, average: 60, poor: 30, direction: "higher-is-better" },
  },
  dependency_chain_health: {
    health_score: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 3: Coverage & Consistency (20%) ─────────────────────────────────
  scope_boundary_clarity: {
    clarity_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  trigger_accuracy: {
    match_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  output_format_consistency: {
    consistency_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  skill_registry_sync: {
    sync_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },

  // ── Domain 4: Staleness & Drift (15%) ──────────────────────────────────────
  version_history_currency: {
    current_pct: { good: 80, average: 60, poor: 30, direction: "higher-is-better" },
  },
  dead_skill_detection: {
    alive_pct: { good: 85, average: 65, poor: 40, direction: "higher-is-better" },
  },
  pattern_reference_sync: {
    archived_pct: { good: 90, average: 70, poor: 40, direction: "higher-is-better" },
  },
  inline_code_duplication: {
    unique_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 5: Agent Orchestration Health (20%) ─────────────────────────────
  agent_prompt_consistency: {
    compliant_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  agent_skill_alignment: {
    aligned_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  parallelization_correctness: {
    documented_pct: { good: 85, average: 65, poor: 40, direction: "higher-is-better" },
  },
  team_config_health: {
    valid_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 20%, D2: 25%, D3: 20%, D4: 15%, D5: 20%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Structural Compliance (20%)
  frontmatter_schema: 0.05,
  step_continuity: 0.05,
  section_structure: 0.05,
  bloat_score: 0.05,

  // Domain 2: Cross-Reference Integrity (25%)
  skill_to_skill_refs: 0.05,
  skill_to_script_refs: 0.05,
  skill_to_template_refs: 0.05,
  evidence_citation_validity: 0.05,
  dependency_chain_health: 0.05,

  // Domain 3: Coverage & Consistency (20%)
  scope_boundary_clarity: 0.05,
  trigger_accuracy: 0.05,
  output_format_consistency: 0.05,
  skill_registry_sync: 0.05,

  // Domain 4: Staleness & Drift (15%)
  version_history_currency: 0.04,
  dead_skill_detection: 0.04,
  pattern_reference_sync: 0.04,
  inline_code_duplication: 0.03,

  // Domain 5: Agent Orchestration Health (20%)
  agent_prompt_consistency: 0.05,
  agent_skill_alignment: 0.05,
  parallelization_correctness: 0.05,
  team_config_health: 0.05,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS };
