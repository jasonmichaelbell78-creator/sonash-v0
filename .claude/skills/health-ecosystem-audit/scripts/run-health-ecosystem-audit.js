#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Health Ecosystem Audit — Main Orchestrator
 *
 * Runs all 6 domain checkers (25 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-health-ecosystem-audit.js                  # Full audit with JSON output
 *   node run-health-ecosystem-audit.js --summary        # Compact summary only
 *   node run-health-ecosystem-audit.js --batch          # Suppress state writes
 *   node run-health-ecosystem-audit.js --skip-live-tests  # Skip D5 live test execution
 *   node run-health-ecosystem-audit.js --save-baseline  # Save current scores as baseline
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
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) {
        return dir;
      }
    } catch {
      // continue
    }
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return process.cwd();
}

const ROOT_DIR = findProjectRoot();
const args = process.argv.slice(2);
const isSummaryMode = args.includes("--summary");
const isBatchMode = args.includes("--batch");
const skipLiveTests = args.includes("--skip-live-tests");

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

// Load test registry once for all checkers (D#40)
let registry = [];
try {
  const registryPath = path.join(ROOT_DIR, "data", "ecosystem-v2", "test-registry.jsonl");
  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, "utf8");
    registry = content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
} catch {
  console.error("  [warn] Could not load test registry");
}

// Load checkers
let checkers;
try {
  checkers = [
    require("./checkers/checker-infrastructure"),
    require("./checkers/scoring-pipeline"),
    require("./checkers/data-persistence"),
    require("./checkers/consumer-integration"),
    require("./checkers/coverage-completeness"),
    require("./checkers/alert-system"),
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
  checker_infrastructure: "D1: Checker Infrastructure & Reliability",
  scoring_pipeline: "D2: Scoring Pipeline Integrity",
  data_persistence: "D3: Data Persistence & Concurrency",
  consumer_integration: "D4: Consumer Integration & Versioning",
  coverage_completeness: "D5: Coverage & Completeness",
  alert_system: "D6: Mid-Session Alert System",
};

const CATEGORY_LABELS = {
  command_execution_robustness: "Command Execution Robustness",
  file_io_safety: "File I/O Safety",
  benchmark_configuration: "Benchmark Configuration",
  edge_case_handling: "Edge Case Handling",
  error_propagation: "Error Propagation",
  composite_weight_validation: "Composite Weight Validation",
  missing_data_handling: "Missing Data Handling",
  metric_direction_consistency: "Metric Direction Consistency",
  category_to_dimension_mapping: "Category-to-Dimension Mapping",
  jsonl_append_atomicity: "JSONL Append Atomicity",
  file_rotation_cleanup: "File Rotation & Cleanup",
  schema_validation: "Schema Validation",
  timestamp_consistency: "Timestamp Consistency",
  corrupt_entry_detection: "Corrupt Entry Detection",
  output_schema_versioning: "Output Schema Versioning",
  health_check_timeout_consistency: "Health Check Timeout Consistency",
  duplicate_logic_detection: "Duplicate Logic Detection",
  downstream_error_handling: "Downstream Error Handling",
  checker_success_aggregation: "Checker Success Aggregation",
  external_tool_availability: "External Tool Availability",
  test_coverage_verification: "Test Coverage Verification",
  test_registry_completeness: "Test Registry Completeness",
  cooldown_state_management: "Cooldown State Management",
  warning_lifecycle_consistency: "Warning Lifecycle Consistency",
  score_degradation_detection: "Score Degradation Detection",
};

const CATEGORY_DOMAIN_MAP = {
  command_execution_robustness: "checker_infrastructure",
  file_io_safety: "checker_infrastructure",
  benchmark_configuration: "checker_infrastructure",
  edge_case_handling: "checker_infrastructure",
  error_propagation: "checker_infrastructure",
  composite_weight_validation: "scoring_pipeline",
  missing_data_handling: "scoring_pipeline",
  metric_direction_consistency: "scoring_pipeline",
  category_to_dimension_mapping: "scoring_pipeline",
  jsonl_append_atomicity: "data_persistence",
  file_rotation_cleanup: "data_persistence",
  schema_validation: "data_persistence",
  timestamp_consistency: "data_persistence",
  corrupt_entry_detection: "data_persistence",
  output_schema_versioning: "consumer_integration",
  health_check_timeout_consistency: "consumer_integration",
  duplicate_logic_detection: "consumer_integration",
  downstream_error_handling: "consumer_integration",
  checker_success_aggregation: "coverage_completeness",
  external_tool_availability: "coverage_completeness",
  test_coverage_verification: "coverage_completeness",
  test_registry_completeness: "coverage_completeness",
  cooldown_state_management: "alert_system",
  warning_lifecycle_consistency: "alert_system",
  score_degradation_detection: "alert_system",
};

// ============================================================================
// CHECKER TIMEOUTS (D#41)
// ============================================================================

const CHECKER_TIMEOUTS = {
  checker_infrastructure: 10000,
  scoring_pipeline: 10000,
  data_persistence: 10000,
  consumer_integration: 10000,
  coverage_completeness: 120000, // D5 gets 2min+ for live tests (D#41)
  alert_system: 10000,
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("Health Ecosystem Audit v1.0");
console.error("==========================");
if (skipLiveTests) {
  console.error("  [mode] --skip-live-tests: D5 will skip live npm test execution");
}

const allFindings = [];
const allScores = {};
const domainResults = {};

for (const checker of checkers) {
  const domainName = checker.DOMAIN;
  const timeout = CHECKER_TIMEOUTS[domainName] || 10000;
  console.error(
    `  [run] ${DOMAIN_LABELS[domainName] || domainName} (timeout: ${timeout / 1000}s)...`
  );

  try {
    const result = checker.run({
      rootDir: ROOT_DIR,
      registry,
      skipLiveTests,
    });
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
    console.error(`    \u2717 ${domainName} failed: ${msg.slice(0, 200)}`);

    allFindings.push({
      id: `HMS-DOMAIN-FAIL-${domainName}`,
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
// BASELINE COMPARISON
// ============================================================================

const baseline = stateManager.loadBaseline();
if (baseline) {
  const regressions = [];
  for (const [cat, score] of Object.entries(allScores)) {
    const baselineScore = baseline.categories?.[cat]?.score;
    if (typeof baselineScore === "number" && score.score < baselineScore - 5) {
      regressions.push({ cat, from: baselineScore, to: score.score });
    }
  }
  if (regressions.length > 0) {
    console.error(`  [baseline] ${regressions.length} regression(s) from baseline:`);
    for (const r of regressions) {
      console.error(
        `    ${CATEGORY_LABELS[r.cat] || r.cat}: ${r.from} -> ${r.to} (-${r.from - r.to})`
      );
    }
  } else {
    console.error("  [baseline] No regressions from baseline");
  }
}

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
// BUILD CATEGORIES OUTPUT (D#35: sorted by score ascending, worst first)
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

if (isBatchMode) {
  console.error("  [batch] State write skipped (batch mode -- run without --batch for final save)");
} else {
  const saved = stateManager.appendEntry(stateEntry);
  if (saved) {
    console.error("  [state] Saved to health-ecosystem-audit-history.jsonl");
  } else {
    console.error("  [state] Failed to save state (symlink guard or write error)");
  }
}

if (args.includes("--save-baseline")) {
  const baselineSaved = stateManager.saveBaseline(stateEntry);
  if (baselineSaved) {
    console.error("  [baseline] Saved current scores as baseline");
  } else {
    console.error("  [baseline] Failed to save baseline");
  }
}

// ============================================================================
// OUTPUT
// ============================================================================

if (isSummaryMode) {
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
