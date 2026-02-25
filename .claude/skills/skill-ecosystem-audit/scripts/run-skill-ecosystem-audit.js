#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Skill Ecosystem Audit — Main Orchestrator
 *
 * Runs all 5 domain checkers (21 categories), computes composite health score,
 * generates patch suggestions, saves state for trending, and outputs v2 JSON.
 *
 * Usage:
 *   node run-skill-ecosystem-audit.js           # Full audit with JSON output
 *   node run-skill-ecosystem-audit.js --check   # Quick check (exit code 0/1)
 *   node run-skill-ecosystem-audit.js --summary # Compact summary only
 *   node run-skill-ecosystem-audit.js --batch   # Suppress state writes (for iterative fixing)
 *   node run-skill-ecosystem-audit.js --save-baseline  # Save current scores as baseline
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
    require("./checkers/structural-compliance"),
    require("./checkers/cross-reference-integrity"),
    require("./checkers/coverage-consistency"),
    require("./checkers/staleness-drift"),
    require("./checkers/agent-orchestration"),
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
  structural_compliance: "D1: Structural Compliance",
  cross_reference_integrity: "D2: Cross-Reference Integrity",
  coverage_consistency: "D3: Coverage & Consistency",
  staleness_drift: "D4: Staleness & Drift",
  agent_orchestration: "D5: Agent Orchestration Health",
};

const CATEGORY_LABELS = {
  frontmatter_schema: "Frontmatter Schema",
  step_continuity: "Step Continuity",
  section_structure: "Section Structure",
  bloat_score: "Bloat Score",
  skill_to_skill_refs: "Skill-to-Skill References",
  skill_to_script_refs: "Skill-to-Script References",
  skill_to_template_refs: "Skill-to-Template References",
  evidence_citation_validity: "Evidence Citation Validity",
  dependency_chain_health: "Dependency Chain Health",
  scope_boundary_clarity: "Scope Boundary Clarity",
  trigger_accuracy: "Trigger Accuracy",
  output_format_consistency: "Output Format Consistency",
  skill_registry_sync: "Skill Registry Sync",
  version_history_currency: "Version History Currency",
  dead_skill_detection: "Dead Skill Detection",
  pattern_reference_sync: "Pattern Reference Sync",
  inline_code_duplication: "Inline Code Duplication",
  agent_prompt_consistency: "Agent Prompt Consistency",
  agent_skill_alignment: "Agent-Skill Alignment",
  parallelization_correctness: "Parallelization Correctness",
  team_config_health: "Team Config Health",
};

const CATEGORY_DOMAIN_MAP = {
  frontmatter_schema: "structural_compliance",
  step_continuity: "structural_compliance",
  section_structure: "structural_compliance",
  bloat_score: "structural_compliance",
  skill_to_skill_refs: "cross_reference_integrity",
  skill_to_script_refs: "cross_reference_integrity",
  skill_to_template_refs: "cross_reference_integrity",
  evidence_citation_validity: "cross_reference_integrity",
  dependency_chain_health: "cross_reference_integrity",
  scope_boundary_clarity: "coverage_consistency",
  trigger_accuracy: "coverage_consistency",
  output_format_consistency: "coverage_consistency",
  skill_registry_sync: "coverage_consistency",
  version_history_currency: "staleness_drift",
  dead_skill_detection: "staleness_drift",
  pattern_reference_sync: "staleness_drift",
  inline_code_duplication: "staleness_drift",
  agent_prompt_consistency: "agent_orchestration",
  agent_skill_alignment: "agent_orchestration",
  parallelization_correctness: "agent_orchestration",
  team_config_health: "agent_orchestration",
};

// ============================================================================
// RUN AUDIT
// ============================================================================

console.error("Skill Ecosystem Audit v1.0");
console.error("==========================");

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

// Deduplicate findings that reference the same file/issue from different domains
function deduplicateFindings(findings) {
  const bestFindings = new Map();
  const unkeyedFindings = [];

  for (const f of findings) {
    const rawText = f.patchTarget || f.details || f.message || "";
    const fileMatch = String(rawText).match(/([\w./-]+\.(?:md|js))\b/);
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
  const skipReason = isBatchMode ? "batch mode" : isCheckMode ? "check mode" : "summary mode";
  console.error(
    `  [state] State write skipped (${skipReason} \u2014 run without mode flags for final save)`
  );
} else {
  const saved = stateManager.appendEntry(stateEntry);
  if (saved) {
    console.error("  [state] Saved to skill-ecosystem-audit-history.jsonl");
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
