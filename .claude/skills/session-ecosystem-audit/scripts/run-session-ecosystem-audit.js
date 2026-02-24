#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Session Ecosystem Audit — Main Orchestrator
 *
 * Runs all 5 domain checkers (16 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-session-ecosystem-audit.js           # Full audit with JSON output
 *   node run-session-ecosystem-audit.js --check   # Quick check (exit code 0/1)
 *   node run-session-ecosystem-audit.js --summary # Compact summary only
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

const { compositeScore, impactScore, computeTrend } = require("./lib/scoring");
const { CATEGORY_WEIGHTS } = require("./lib/benchmarks");
const { createStateManager } = require("./lib/state-manager");
const { createPatchGenerator } = require("./lib/patch-generator");

const stateManager = createStateManager(ROOT_DIR, isSafeToWrite);
const patchGenerator = createPatchGenerator(ROOT_DIR);

// Load checkers
const checkers = [
  require("./checkers/lifecycle-management"),
  require("./checkers/state-persistence"),
  require("./checkers/compaction-resilience"),
  require("./checkers/cross-session-safety"),
  require("./checkers/integration-config"),
];

// ============================================================================
// DOMAIN LABELS
// ============================================================================

const DOMAIN_LABELS = {
  lifecycle_management: "D1: Session Lifecycle Management",
  state_persistence: "D2: State Persistence & Handoff",
  compaction_resilience: "D3: Compaction Resilience",
  cross_session_safety: "D4: Cross-Session Safety",
  integration_config: "D5: Integration & Configuration",
};

const CATEGORY_LABELS = {
  session_begin_completeness: "Session Begin Completeness",
  session_end_completeness: "Session End Completeness",
  session_counter_accuracy: "Session Counter Accuracy",
  session_doc_freshness: "Session Documentation Freshness",
  handoff_file_schema: "Handoff File Schema",
  commit_log_integrity: "Commit Log Integrity",
  task_state_file_health: "Task State File Health",
  session_notes_quality: "Session Notes Quality",
  layer_a_commit_tracker: "Layer A: Commit Tracker",
  layer_c_precompact_save: "Layer C: Pre-Compaction Save",
  layer_d_gap_detection: "Layer D: Gap Detection",
  restore_output_quality: "Restore Output Quality",
  begin_end_balance: "Begin/End Balance",
  multi_session_validation: "Multi-Session Validation",
  hook_registration_alignment: "Hook Registration Alignment",
  state_file_management: "State File Management",
};

const CATEGORY_DOMAIN_MAP = {
  session_begin_completeness: "lifecycle_management",
  session_end_completeness: "lifecycle_management",
  session_counter_accuracy: "lifecycle_management",
  session_doc_freshness: "lifecycle_management",
  handoff_file_schema: "state_persistence",
  commit_log_integrity: "state_persistence",
  task_state_file_health: "state_persistence",
  session_notes_quality: "state_persistence",
  layer_a_commit_tracker: "compaction_resilience",
  layer_c_precompact_save: "compaction_resilience",
  layer_d_gap_detection: "compaction_resilience",
  restore_output_quality: "compaction_resilience",
  begin_end_balance: "cross_session_safety",
  multi_session_validation: "cross_session_safety",
  hook_registration_alignment: "integration_config",
  state_file_management: "integration_config",
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("Session Ecosystem Audit v1.0");
console.error("============================");

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
      id: `SEA-DOMAIN-FAIL-${domainName}`,
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
  console.error("  [state] Saved to session-ecosystem-audit-history.jsonl");
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
