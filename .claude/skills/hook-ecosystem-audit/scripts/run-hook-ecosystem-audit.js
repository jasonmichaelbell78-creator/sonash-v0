#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Hook Ecosystem Audit — Main Orchestrator
 *
 * Runs all 6 domain checkers (19 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-hook-ecosystem-audit.js           # Full audit with JSON output
 *   node run-hook-ecosystem-audit.js --check   # Quick check (exit code 0/1)
 *   node run-hook-ecosystem-audit.js --summary # Compact summary only
 *   node run-hook-ecosystem-audit.js --batch   # Suppress state writes (for iterative fixing)
 *   node run-hook-ecosystem-audit.js --save-baseline  # Save current scores as baseline
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
const isBatchMode = args.includes("--batch");

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
    require("./checkers/config-health"),
    require("./checkers/code-quality-security"),
    require("./checkers/precommit-pipeline"),
    require("./checkers/functional-correctness"),
    require("./checkers/state-integration"),
    require("./checkers/cicd-pipeline"),
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
  config_health: "D1: Hook Configuration Health",
  code_quality_security: "D2: Code Quality & Security",
  precommit_pipeline: "D3: Pre-commit Pipeline",
  functional_correctness: "D4: Functional Correctness",
  state_integration: "D5: State & Integration",
  cicd_pipeline: "D6: CI/CD Pipeline Health",
};

const CATEGORY_LABELS = {
  settings_file_alignment: "Settings-File Alignment",
  event_coverage_matchers: "Event Coverage & Matchers",
  global_local_consistency: "Global-Local Consistency",
  error_handling_sanitization: "Error Handling & Sanitization",
  security_patterns: "Security Patterns",
  code_hygiene: "Code Hygiene",
  regex_safety: "Regex Safety",
  stage_ordering_completeness: "Stage Ordering & Completeness",
  bypass_override_controls: "Bypass & Override Controls",
  gate_effectiveness: "Gate Effectiveness",
  test_coverage: "Test Coverage",
  output_protocol_compliance: "Output Protocol Compliance",
  behavioral_accuracy: "Behavioral Accuracy",
  state_file_health: "State File Health",
  cross_hook_dependencies: "Cross-Hook Dependencies",
  compaction_resilience: "Compaction Resilience",
  workflow_script_alignment: "Workflow↔Script Alignment",
  bot_config_freshness: "Bot Configuration Freshness",
  ci_cache_effectiveness: "CI Cache Effectiveness",
};

const CATEGORY_DOMAIN_MAP = {
  settings_file_alignment: "config_health",
  event_coverage_matchers: "config_health",
  global_local_consistency: "config_health",
  error_handling_sanitization: "code_quality_security",
  security_patterns: "code_quality_security",
  code_hygiene: "code_quality_security",
  regex_safety: "code_quality_security",
  stage_ordering_completeness: "precommit_pipeline",
  bypass_override_controls: "precommit_pipeline",
  gate_effectiveness: "precommit_pipeline",
  test_coverage: "functional_correctness",
  output_protocol_compliance: "functional_correctness",
  behavioral_accuracy: "functional_correctness",
  state_file_health: "state_integration",
  cross_hook_dependencies: "state_integration",
  compaction_resilience: "state_integration",
  workflow_script_alignment: "cicd_pipeline",
  bot_config_freshness: "cicd_pipeline",
  ci_cache_effectiveness: "cicd_pipeline",
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("Hook Ecosystem Audit v1.1");
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
      id: `HEA-DOMAIN-FAIL-${domainName}`,
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

// Deduplicate findings that reference the same file/issue from different domains
function deduplicateFindings(findings) {
  const seen = new Map(); // key -> finding
  const deduped = [];

  for (const f of findings) {
    // Generate a dedup key from the core issue (file + core message)
    const fileMatch = (f.details || f.message || "").match(/([a-zA-Z0-9_-]+\.js)/);
    const file = fileMatch ? fileMatch[1] : "";
    const key = file ? `${file}:${f.severity}` : null;

    if (key && seen.has(key)) {
      // Merge: keep the higher-impact finding, note the duplicate
      const existing = seen.get(key);
      if ((f.impactScore || 0) > (existing.impactScore || 0)) {
        existing._supersededBy = f.id;
        deduped[deduped.indexOf(existing)] = f;
        seen.set(key, f);
      }
      // Skip the lower-impact duplicate
    } else {
      if (key) seen.set(key, f);
      deduped.push(f);
    }
  }

  return deduped;
}

const dedupedFindings = deduplicateFindings(allFindings);
const removedCount = allFindings.length - dedupedFindings.length;
if (removedCount > 0) {
  console.error(`  [dedup] Removed ${removedCount} duplicate finding(s)`);
}
allFindings.length = 0;
allFindings.push(...dedupedFindings);

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
    console.error(`  [baseline] \u26a0\ufe0f ${regressions.length} regression(s) from baseline:`);
    for (const r of regressions) {
      console.error(
        `    ${CATEGORY_LABELS[r.cat] || r.cat}: ${r.from} \u2192 ${r.to} (-${r.from - r.to})`
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
  console.error(
    "  [batch] State write skipped (batch mode \u2014 run without --batch for final save)"
  );
} else {
  const saved = stateManager.appendEntry(stateEntry);
  if (saved) {
    console.error("  [state] Saved to hook-ecosystem-audit-history.jsonl");
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
