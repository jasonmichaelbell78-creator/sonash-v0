#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * TDMS Ecosystem Audit — Main Orchestrator
 *
 * Runs all 5 domain checkers (16 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-tdms-ecosystem-audit.js           # Full audit with JSON output
 *   node run-tdms-ecosystem-audit.js --check   # Quick check (exit code 0/1)
 *   node run-tdms-ecosystem-audit.js --summary # Compact summary only
 *
 * Output: v2 JSON to stdout, progress to stderr.
 */

"use strict";

let fs, path;
try {
  fs = require("node:fs");
  path = require("node:path");
} catch (err) {
  const code = err instanceof Error && err.code ? err.code : "UNKNOWN";
  console.error(`Fatal: failed to load core Node.js modules (${code})`);
  process.exit(1);
}

// Symlink guard
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", "..", "..", "hooks", "lib", "symlink-guard")
  ));
} catch {
  console.error("  [warn] symlink-guard unavailable; disabling state writes");
  isSafeToWrite = () => false;
}

// Find project root
function findProjectRoot() {
  let dir = __dirname;
  const fsRoot = path.parse(dir).root;
  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return process.cwd();
}

const ROOT_DIR = findProjectRoot();
const args = process.argv.slice(2);
const isCheckMode = args.includes("--check");
const isSummaryMode = args.includes("--summary");

// ============================================================================
// LOAD MODULES
// ============================================================================

let compositeScore,
  impactScore,
  computeTrend,
  CATEGORY_WEIGHTS,
  createStateManager,
  createPatchGenerator;
try {
  ({ compositeScore, impactScore, computeTrend } = require("./lib/scoring"));
  ({ CATEGORY_WEIGHTS } = require("./lib/benchmarks"));
  ({ createStateManager } = require("./lib/state-manager"));
  ({ createPatchGenerator } = require("./lib/patch-generator"));
} catch (err) {
  const code = err instanceof Error && err.code ? err.code : "UNKNOWN";
  console.error(`Fatal: failed to load audit modules (${code})`);
  process.exit(1);
}

const stateManager = createStateManager(ROOT_DIR, isSafeToWrite);
const patchGenerator = createPatchGenerator(ROOT_DIR);

// Load checkers
let checkers;
try {
  checkers = [
    require("./checkers/pipeline-correctness"),
    require("./checkers/data-quality-dedup"),
    require("./checkers/file-io-safety"),
    require("./checkers/roadmap-integration"),
    require("./checkers/metrics-reporting"),
  ];
} catch (err) {
  const code = err instanceof Error && err.code ? err.code : "UNKNOWN";
  console.error(`Fatal: failed to load checker modules (${code})`);
  process.exit(1);
}

// ============================================================================
// DOMAIN LABELS
// ============================================================================

const DOMAIN_LABELS = {
  pipeline_correctness: "D1: Pipeline Correctness",
  data_quality_dedup: "D2: Data Quality & Deduplication",
  file_io_safety: "D3: File I/O & Safety",
  roadmap_integration: "D4: Roadmap Integration",
  metrics_reporting: "D5: Metrics & Reporting",
};

const CATEGORY_LABELS = {
  script_execution_order: "Script Execution Order",
  data_flow_integrity: "Data Flow Integrity",
  intake_pipeline: "Intake Pipeline",
  dedup_algorithm_health: "Dedup Algorithm Health",
  schema_compliance: "Schema Compliance",
  content_hash_integrity: "Content Hash Integrity",
  id_uniqueness_referential: "ID Uniqueness & Referential Integrity",
  error_handling_coverage: "Error Handling Coverage",
  master_deduped_sync: "Master-Deduped Sync",
  backup_atomicity: "Backup & Atomicity",
  track_assignment_rules: "Track Assignment Rules",
  roadmap_debt_cross_ref: "ROADMAP-DEBT Cross-Reference",
  sprint_file_alignment: "Sprint File Alignment",
  view_generation_accuracy: "View Generation Accuracy",
  metrics_dashboard_correctness: "Metrics Dashboard Correctness",
  audit_trail_completeness: "Audit Trail Completeness",
};

const CATEGORY_DOMAIN_MAP = {
  script_execution_order: "pipeline_correctness",
  data_flow_integrity: "pipeline_correctness",
  intake_pipeline: "pipeline_correctness",
  dedup_algorithm_health: "data_quality_dedup",
  schema_compliance: "data_quality_dedup",
  content_hash_integrity: "data_quality_dedup",
  id_uniqueness_referential: "data_quality_dedup",
  error_handling_coverage: "file_io_safety",
  master_deduped_sync: "file_io_safety",
  backup_atomicity: "file_io_safety",
  track_assignment_rules: "roadmap_integration",
  roadmap_debt_cross_ref: "roadmap_integration",
  sprint_file_alignment: "roadmap_integration",
  view_generation_accuracy: "metrics_reporting",
  metrics_dashboard_correctness: "metrics_reporting",
  audit_trail_completeness: "metrics_reporting",
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("TDMS Ecosystem Audit v1.0");
console.error("=========================");

const allFindings = [];
const allScores = {};
const domainResults = {};

for (const checker of checkers) {
  const domainName = checker.DOMAIN;
  console.error(`  [run] ${DOMAIN_LABELS[domainName] || domainName}...`);

  try {
    const result = checker.run({ rootDir: ROOT_DIR });
    domainResults[domainName] = result;

    for (const [cat, score] of Object.entries(result.scores)) {
      allScores[cat] = score;
    }

    for (const finding of result.findings) {
      finding.impactScore = finding.impactScore ?? impactScore(finding);

      if (finding.patchType) {
        finding.patchable = true;
        finding.patch = patchGenerator.generate(finding);
      }

      allFindings.push(finding);
    }

    const categoryCount = Object.keys(result.scores).length;
    const findingCount = result.findings.length;
    console.error(`    \u2713 ${categoryCount} categories, ${findingCount} findings`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`    \u2717 ${domainName} failed: ${msg}`);

    allFindings.push({
      id: `TEA-DOMAIN-FAIL-${domainName}`,
      category: "audit_runtime",
      domain: domainName,
      severity: "error",
      message: `Domain checker failed: ${DOMAIN_LABELS[domainName] || domainName}`,
      details: msg.slice(0, 500),
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
  }
}

allFindings.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));

// ============================================================================
// COMPUTE COMPOSITE SCORE
// ============================================================================

const composite = compositeScore(allScores, CATEGORY_WEIGHTS);
console.error(`\n  Composite: ${composite.grade} (${composite.score}/100)`);

// ============================================================================
// COMPUTE TRENDS
// ============================================================================

const trends = { composite: null, per_category: {} };

const compositeHistory = stateManager.getCompositeHistory(10);
if (compositeHistory.length > 0) {
  const allValues = [...compositeHistory, composite.score];
  trends.composite = computeTrend(allValues);
}

for (const [cat, score] of Object.entries(allScores)) {
  const catHistory = stateManager.getCategoryHistory(cat, 10);
  if (catHistory.length > 0) {
    const allValues = [...catHistory, score.score];
    trends.per_category[cat] = computeTrend(allValues);
  }
}

// ============================================================================
// COMPUTE SUMMARY
// ============================================================================

const summary = { errors: 0, warnings: 0, info: 0 };
for (const finding of allFindings) {
  const key =
    finding.severity === "error" ? "errors" : finding.severity === "warning" ? "warnings" : "info";
  summary[key]++;
}

const patchableCount = allFindings.filter((f) => f.patchable).length;

// ============================================================================
// BUILD CATEGORIES OUTPUT
// ============================================================================

const categoriesOutput = {};
for (const [cat, score] of Object.entries(allScores)) {
  const domain = CATEGORY_DOMAIN_MAP[cat] || "unknown";
  const catFindings = allFindings.filter((f) => f.category === cat);
  const trend = trends.per_category[cat] || null;

  categoriesOutput[cat] = {
    label: CATEGORY_LABELS[cat] || cat,
    domain,
    domainLabel: DOMAIN_LABELS[domain] || domain,
    score: score.score,
    rating: score.rating,
    metrics: score.metrics || {},
    findings: catFindings,
    trend: trend
      ? { direction: trend.direction, delta: trend.delta, sparkline: trend.sparkline }
      : null,
  };
}

// ============================================================================
// BUILD RESULT
// ============================================================================

const result = {
  version: 2,
  timestamp: new Date().toISOString(),
  healthScore: { score: composite.score, grade: composite.grade, breakdown: composite.breakdown },
  categories: categoriesOutput,
  findings: allFindings,
  trends: {
    composite: trends.composite
      ? {
          current: composite.score,
          delta: trends.composite.delta,
          sparkline: trends.composite.sparkline,
          direction: trends.composite.direction,
        }
      : null,
    per_category: trends.per_category,
  },
  summary,
  patchableCount,
  domainScores: {},
};

for (const [domain, label] of Object.entries(DOMAIN_LABELS)) {
  const domainCats = Object.entries(CATEGORY_DOMAIN_MAP)
    .filter(([, d]) => d === domain)
    .map(([cat]) => cat);
  const domainScoresList = domainCats
    .map((cat) => allScores[cat]?.score)
    .filter((v) => typeof v === "number");
  const domainAvg =
    domainScoresList.length > 0
      ? Math.round(domainScoresList.reduce((a, b) => a + b, 0) / domainScoresList.length)
      : 0;
  result.domainScores[domain] = { label, score: domainAvg, categories: domainCats.length };
}

// ============================================================================
// SAVE STATE
// ============================================================================

const stateEntry = {
  timestamp: result.timestamp,
  healthScore: result.healthScore,
  categories: {},
  summary: result.summary,
};

for (const [cat, data] of Object.entries(categoriesOutput)) {
  stateEntry.categories[cat] = { score: data.score, rating: data.rating };
}

const saved = stateManager.appendEntry(stateEntry);
if (saved) {
  console.error("  [state] Saved to tdms-ecosystem-audit-history.jsonl");
} else {
  console.error("  [state] Failed to save state (symlink guard or write error)");
}

// ============================================================================
// OUTPUT
// ============================================================================

if (isCheckMode) {
  const exitCode = summary.errors > 0 ? 1 : 0;
  console.error(`\n  Check result: ${summary.errors} errors, ${summary.warnings} warnings`);
  process.exit(exitCode);
} else if (isSummaryMode) {
  const summaryOutput = {
    grade: composite.grade,
    score: composite.score,
    errors: summary.errors,
    warnings: summary.warnings,
    info: summary.info,
    patches: patchableCount,
    domains: result.domainScores,
  };
  console.log(JSON.stringify(summaryOutput, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}

console.error(
  `\n  Done: ${allFindings.length} findings (${summary.errors}E/${summary.warnings}W/${summary.info}I), ${patchableCount} patches`
);
