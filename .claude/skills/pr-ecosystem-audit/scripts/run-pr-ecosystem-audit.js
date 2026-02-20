#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * PR Ecosystem Audit — Main Orchestrator
 *
 * Runs all 5 domain checkers (18 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-pr-ecosystem-audit.js           # Full audit with JSON output
 *   node run-pr-ecosystem-audit.js --check   # Quick check (exit code 0/1)
 *   node run-pr-ecosystem-audit.js --summary # Compact summary only
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
  require("./checkers/process-compliance"),
  require("./checkers/data-state-health"),
  require("./checkers/pattern-lifecycle"),
  require("./checkers/feedback-integration"),
  require("./checkers/effectiveness-metrics"),
];

// ============================================================================
// DOMAIN LABELS
// ============================================================================

const DOMAIN_LABELS = {
  process_compliance: "D1: Process Compliance",
  data_state_health: "D2: Data & State Health",
  pattern_lifecycle: "D3: Pattern Lifecycle & Enforcement",
  feedback_integration: "D4: Feedback Loop & Integration",
  effectiveness_metrics: "D5: Effectiveness Metrics",
};

const CATEGORY_LABELS = {
  skill_invocation_fidelity: "Skill Invocation Fidelity",
  review_process_completeness: "Review Process Completeness",
  retro_quality_compliance: "Retro Quality & Compliance",
  learning_capture_integrity: "Learning Capture Integrity",
  state_file_consistency: "State File Consistency",
  archive_retention_health: "Archive & Retention Health",
  jsonl_sync_fidelity: "JSONL Sync Fidelity",
  pattern_discovery_automation: "Pattern Discovery → Automation",
  pattern_enforcement_coverage: "Pattern Enforcement Coverage",
  consolidation_pipeline_health: "Consolidation Pipeline Health",
  automation_coverage_gap: "Automation Coverage Gap",
  feedback_loop_closure: "Feedback Loop Closure",
  cross_pr_pattern_recurrence: "Cross-PR Pattern Recurrence",
  external_tool_configuration: "External Tool Configuration",
  cross_system_integration: "Cross-System Integration",
  review_cycle_efficiency: "Review Cycle Efficiency",
  agent_utilization_effectiveness: "Agent Utilization Effectiveness",
  template_reference_quality: "Template & Reference Quality",
};

const CATEGORY_DOMAIN_MAP = {
  skill_invocation_fidelity: "process_compliance",
  review_process_completeness: "process_compliance",
  retro_quality_compliance: "process_compliance",
  learning_capture_integrity: "process_compliance",
  state_file_consistency: "data_state_health",
  archive_retention_health: "data_state_health",
  jsonl_sync_fidelity: "data_state_health",
  pattern_discovery_automation: "pattern_lifecycle",
  pattern_enforcement_coverage: "pattern_lifecycle",
  consolidation_pipeline_health: "pattern_lifecycle",
  automation_coverage_gap: "pattern_lifecycle",
  feedback_loop_closure: "feedback_integration",
  cross_pr_pattern_recurrence: "feedback_integration",
  external_tool_configuration: "feedback_integration",
  cross_system_integration: "feedback_integration",
  review_cycle_efficiency: "effectiveness_metrics",
  agent_utilization_effectiveness: "effectiveness_metrics",
  template_reference_quality: "effectiveness_metrics",
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("PR Ecosystem Audit v1.0");
console.error("========================");

const allFindings = [];
const allScores = {};
const domainResults = {};

for (const checker of checkers) {
  const domainName = checker.DOMAIN;
  console.error(`  [run] ${DOMAIN_LABELS[domainName] || domainName}...`);

  try {
    const result = checker.run({ rootDir: ROOT_DIR });
    domainResults[domainName] = result;

    // Collect scores
    for (const [cat, score] of Object.entries(result.scores)) {
      allScores[cat] = score;
    }

    // Collect findings with computed impact scores
    for (const finding of result.findings) {
      finding.impactScore = finding.impactScore || impactScore(finding);

      // Generate patches for patchable findings
      if (finding.patchType) {
        finding.patchable = true;
        finding.patch = patchGenerator.generate(finding);
      }

      allFindings.push(finding);
    }

    const categoryCount = Object.keys(result.scores).length;
    const findingCount = result.findings.length;
    console.error(`    ✓ ${categoryCount} categories, ${findingCount} findings`);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error(`    ✗ ${domainName} failed: ${msg}`);

    allFindings.push({
      id: `PEA-DOMAIN-FAIL-${domainName}`,
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

// Sort findings by impact score (highest first)
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

// Composite trend
const compositeHistory = stateManager.getCompositeHistory(10);
if (compositeHistory.length > 0) {
  const allValues = [...compositeHistory, composite.score];
  trends.composite = computeTrend(allValues);
}

// Per-category trends
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

// Compute domain-level scores
for (const [domain, label] of Object.entries(DOMAIN_LABELS)) {
  const domainCats = Object.entries(CATEGORY_DOMAIN_MAP)
    .filter(([, d]) => d === domain)
    .map(([cat]) => cat);
  const domainScores = domainCats
    .map((cat) => allScores[cat]?.score)
    .filter((v) => typeof v === "number");
  const domainAvg =
    domainScores.length > 0
      ? Math.round(domainScores.reduce((a, b) => a + b, 0) / domainScores.length)
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
  console.error("  [state] Saved to pr-ecosystem-audit.jsonl");
} else {
  console.error("  [state] Failed to save state (symlink guard or write error)");
}

// ============================================================================
// OUTPUT
// ============================================================================

if (isCheckMode) {
  // Check mode: exit code reflects health
  const exitCode = summary.errors > 0 ? 1 : 0;
  console.error(`\n  Check result: ${summary.errors} errors, ${summary.warnings} warnings`);
  process.exit(exitCode);
} else if (isSummaryMode) {
  // Summary mode: compact output
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
  // Full output
  console.log(JSON.stringify(result, null, 2));
}

console.error(
  `\n  Done: ${allFindings.length} findings (${summary.errors}E/${summary.warnings}W/${summary.info}I), ${patchableCount} patches`
);
