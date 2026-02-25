/* eslint-disable no-undef */

/**
 * Internal benchmarks for Doc Ecosystem Audit — 16 categories.
 *
 * Each benchmark defines good/average/poor thresholds.
 * Direction: "higher-is-better" for percentages, "lower-is-better" for counts.
 *
 * Domain weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%
 */

"use strict";

const BENCHMARKS = {
  // ── Domain 1: Index & Registry Health (20%) ────────────────────────────────
  index_filesystem_sync: {
    sync_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  index_metadata_accuracy: {
    accuracy_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  orphaned_documents: {
    referenced_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 2: Link & Reference Integrity (25%) ────────────────────────────
  internal_link_health: {
    valid_pct: { good: 95, average: 85, poor: 65, direction: "higher-is-better" },
  },
  cross_doc_dependency_accuracy: {
    passing_pct: { good: 95, average: 80, poor: 60, direction: "higher-is-better" },
  },
  anchor_reference_validity: {
    valid_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  image_asset_references: {
    valid_pct: { good: 95, average: 85, poor: 65, direction: "higher-is-better" },
  },

  // ── Domain 3: Content Quality & Compliance (20%) ──────────────────────────
  header_frontmatter_compliance: {
    compliant_pct: { good: 90, average: 75, poor: 55, direction: "higher-is-better" },
  },
  formatting_consistency: {
    consistent_pct: { good: 85, average: 70, poor: 50, direction: "higher-is-better" },
  },
  content_freshness: {
    fresh_pct: { good: 80, average: 60, poor: 40, direction: "higher-is-better" },
  },

  // ── Domain 4: Generation Pipeline Health (20%) ─────────────────────────────
  docs_index_correctness: {
    health_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  doc_optimizer_pipeline: {
    integrity_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
  precommit_doc_checks: {
    present_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },

  // ── Domain 5: Coverage & Completeness (15%) ────────────────────────────────
  documentation_coverage: {
    coverage_pct: { good: 80, average: 60, poor: 40, direction: "higher-is-better" },
  },
  agent_doc_references: {
    valid_pct: { good: 95, average: 85, poor: 65, direction: "higher-is-better" },
  },
  readme_onboarding: {
    completeness_pct: { good: 90, average: 70, poor: 50, direction: "higher-is-better" },
  },
};

/**
 * Category weights for composite score calculation.
 * D1: 20%, D2: 25%, D3: 20%, D4: 20%, D5: 15%
 */
const CATEGORY_WEIGHTS = {
  // Domain 1: Index & Registry Health (20%)
  index_filesystem_sync: 0.07,
  index_metadata_accuracy: 0.07,
  orphaned_documents: 0.06,

  // Domain 2: Link & Reference Integrity (25%)
  internal_link_health: 0.07,
  cross_doc_dependency_accuracy: 0.06,
  anchor_reference_validity: 0.06,
  image_asset_references: 0.06,

  // Domain 3: Content Quality & Compliance (20%)
  header_frontmatter_compliance: 0.07,
  formatting_consistency: 0.07,
  content_freshness: 0.06,

  // Domain 4: Generation Pipeline Health (20%)
  docs_index_correctness: 0.07,
  doc_optimizer_pipeline: 0.07,
  precommit_doc_checks: 0.06,

  // Domain 5: Coverage & Completeness (15%)
  documentation_coverage: 0.05,
  agent_doc_references: 0.05,
  readme_onboarding: 0.05,
};

module.exports = { BENCHMARKS, CATEGORY_WEIGHTS };
