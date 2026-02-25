#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Doc Ecosystem Audit — Main Orchestrator
 *
 * Runs all 5 domain checkers (16 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-doc-ecosystem-audit.js           # Full audit with JSON output
 *   node run-doc-ecosystem-audit.js --check   # Quick check (exit code 0/1)
 *   node run-doc-ecosystem-audit.js --summary # Compact summary only
 *   node run-doc-ecosystem-audit.js --batch   # Suppress state writes (for iterative fixing)
 *   node run-doc-ecosystem-audit.js --save-baseline  # Save current scores as baseline
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

// Symlink guard
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(path.join(ROOT_DIR, "hooks", "lib", "symlink-guard")));
} catch {
  console.error("  [warn] symlink-guard unavailable; disabling state writes");
  isSafeToWrite = () => false;
}
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
    require("./checkers/index-registry-health"),
    require("./checkers/link-reference-integrity"),
    require("./checkers/content-quality"),
    require("./checkers/generation-pipeline"),
    require("./checkers/coverage-completeness"),
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
  index_registry_health: "D1: Index & Registry Health",
  link_reference_integrity: "D2: Link & Reference Integrity",
  content_quality: "D3: Content Quality & Compliance",
  generation_pipeline: "D4: Generation Pipeline Health",
  coverage_completeness: "D5: Coverage & Completeness",
};

const CATEGORY_LABELS = {
  index_filesystem_sync: "Index-Filesystem Sync",
  index_metadata_accuracy: "Index Metadata Accuracy",
  orphaned_documents: "Orphaned Documents",
  internal_link_health: "Internal Link Health",
  cross_doc_dependency_accuracy: "Cross-Doc Dependency Accuracy",
  anchor_reference_validity: "Anchor Reference Validity",
  image_asset_references: "Image Asset References",
  header_frontmatter_compliance: "Header & Frontmatter Compliance",
  formatting_consistency: "Formatting Consistency",
  content_freshness: "Content Freshness",
  docs_index_correctness: "Docs Index Correctness",
  doc_optimizer_pipeline: "Doc Optimizer Pipeline",
  precommit_doc_checks: "Pre-commit Doc Checks",
  documentation_coverage: "Documentation Coverage",
  agent_doc_references: "Agent Doc References",
  readme_onboarding: "README & Onboarding",
};

const CATEGORY_DOMAIN_MAP = {
  index_filesystem_sync: "index_registry_health",
  index_metadata_accuracy: "index_registry_health",
  orphaned_documents: "index_registry_health",
  internal_link_health: "link_reference_integrity",
  cross_doc_dependency_accuracy: "link_reference_integrity",
  anchor_reference_validity: "link_reference_integrity",
  image_asset_references: "link_reference_integrity",
  header_frontmatter_compliance: "content_quality",
  formatting_consistency: "content_quality",
  content_freshness: "content_quality",
  docs_index_correctness: "generation_pipeline",
  doc_optimizer_pipeline: "generation_pipeline",
  precommit_doc_checks: "generation_pipeline",
  documentation_coverage: "coverage_completeness",
  agent_doc_references: "coverage_completeness",
  readme_onboarding: "coverage_completeness",
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("Doc Ecosystem Audit v1.0");
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
      id: `DEA-DOMAIN-FAIL-${domainName}`,
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
  const bestFindings = new Map();
  const unkeyedFindings = [];

  for (const f of findings) {
    const rawText = f.patchTarget || f.details || f.message || "";
    const fileMatch = String(rawText).match(/([\w./-]+\.(?:md|js|json|ya?ml))\b/);
    const file = fileMatch ? fileMatch[1] : "";
    const key = file ? `${file}:${f.severity}:${f.category}` : null;

    if (!key) {
      unkeyedFindings.push(f);
      continue;
    }

    const existing = bestFindings.get(key);
    if (!existing || (f.impactScore || 0) > (existing.impactScore || 0)) {
      bestFindings.set(key, f);
    }
  }

  return [...unkeyedFindings, ...bestFindings.values()];
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

const shouldWriteState = !isBatchMode && !isCheckMode && !isSummaryMode;

if (!shouldWriteState) {
  console.error(
    `  [state] Write skipped (${isBatchMode ? "batch mode" : isCheckMode ? "check mode" : "summary mode"})`
  );
} else {
  const saved = stateManager.appendEntry(stateEntry);
  if (saved) {
    console.error("  [state] Saved to doc-ecosystem-audit-history.jsonl");
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
