/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Pattern Lifecycle & Enforcement Checker — Categories 8-11
 *
 * 8.  Pattern Discovery → Automation
 * 9.  Pattern Enforcement Coverage
 * 10. Consolidation Pipeline Health
 * 11. Automation Coverage Gap
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[pattern-lifecycle] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { execFileSync } = safeRequire("node:child_process");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "pattern_lifecycle";

/**
 * Run all pattern lifecycle checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Load shared data
  const codePatterns = safeReadFile(path.join(rootDir, "docs", "agent_docs", "CODE_PATTERNS.md"));
  const fixTemplates = safeReadFile(path.join(rootDir, "docs", "agent_docs", "FIX_TEMPLATES.md"));
  const patternChecker = safeReadFile(path.join(rootDir, "scripts", "check-pattern-compliance.js"));
  const learnings = safeReadFile(path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md"));
  const consolidationJson = safeReadJson(
    path.join(rootDir, ".claude", "state", "consolidation.json")
  );
  const reviewsJsonl = loadJsonl(path.join(rootDir, ".claude", "state", "reviews.jsonl"));

  scores.pattern_discovery_automation = checkPatternDiscoveryAutomation(
    codePatterns,
    patternChecker,
    learnings,
    fixTemplates,
    findings
  );
  scores.pattern_enforcement_coverage = checkPatternEnforcementCoverage(
    rootDir,
    patternChecker,
    reviewsJsonl,
    findings
  );
  scores.consolidation_pipeline_health = checkConsolidationPipelineHealth(
    rootDir,
    consolidationJson,
    reviewsJsonl,
    findings
  );
  scores.automation_coverage_gap = checkAutomationCoverageGap(
    codePatterns,
    patternChecker,
    fixTemplates,
    learnings,
    findings
  );

  return { domain: DOMAIN, findings, scores };
}

// ── Category 8: Pattern Discovery → Automation ─────────────────────────────

function checkPatternDiscoveryAutomation(
  codePatterns,
  patternChecker,
  learnings,
  fixTemplates,
  findings
) {
  const bench = BENCHMARKS.pattern_discovery_automation;

  // Count patterns in CODE_PATTERNS.md
  const patternHeaders = codePatterns.match(/^##+ .+/gm) || [];
  const documentedPatterns = patternHeaders.length;

  // Count patterns referenced in check-pattern-compliance.js
  // Look for pattern names, rule IDs, or check functions
  const automatedMatches =
    patternChecker.match(/check[A-Z]\w+|"[a-z-]+":\s*{|pattern.*?name/gi) || [];
  const automatedPatterns = new Set(automatedMatches).size;

  // Count templates in FIX_TEMPLATES.md
  const templateHeaders = fixTemplates.match(/^##+ Template \d+/gim) || [];
  const templateCount = templateHeaders.length;

  // Count automation candidates mentioned in retros
  const automationCandidates = (learnings.match(/automation candidate/gi) || []).length;
  const recurringPatterns = (learnings.match(/recurring pattern/gi) || []).length;

  // Pipeline completion: discovered → documented → automated
  const discoveredTotal = Math.max(1, documentedPatterns + automationCandidates);
  const automatedPct = Math.round((automatedPatterns / discoveredTotal) * 100);
  const pipelineCompletion = Math.round(
    (documentedPatterns > 0 ? 33 : 0) +
      (automatedPatterns > 0 ? 33 : 0) +
      (templateCount > 0 ? 34 : 0)
  );

  const r1 = scoreMetric(automatedPct, bench.automated_pct, "higher-is-better");
  const r2 = scoreMetric(pipelineCompletion, bench.pipeline_completion_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-801",
      category: "pattern_discovery_automation",
      domain: DOMAIN,
      severity: r1.rating === "poor" ? "error" : "warning",
      message: `Only ${automatedPct}% of discovered patterns are automated (${automatedPatterns}/${discoveredTotal})`,
      details: `Documented patterns: ${documentedPatterns}, automated: ${automatedPatterns}, templates: ${templateCount}, retro candidates: ${automationCandidates}`,
      impactScore: r1.rating === "poor" ? 85 : 60,
      frequency: discoveredTotal,
      blastRadius: 4,
      patchType: "pattern_rule",
      patchImpact: "Increase automation coverage to reduce manual review burden",
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      documentedPatterns,
      automatedPatterns,
      templateCount,
      automationCandidates,
      automatedPct,
      pipelineCompletion,
    },
  };
}

// ── Category 9: Pattern Enforcement Coverage ───────────────────────────────

/** Run pattern compliance script and count violations from output. */
function countEnforcementIssues(rootDir) {
  try {
    execFileSync("node", [path.join(rootDir, "scripts", "check-pattern-compliance.js")], {
      cwd: rootDir,
      encoding: "utf8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return 0;
  } catch (err) {
    const output = `${(err.stdout || "").toString()}\n${(err.stderr || "").toString()}`;
    const violations = output.match(/\[(?:error|warning)\]/gi) || [];
    if (violations.length === 0) return 1;
    return violations.length;
  }
}

/** Read warned-files.json and compute warn→block graduation rate. */
function computeGraduationRate(rootDir) {
  const warnedFilesPath = path.join(rootDir, ".claude", "state", "warned-files.json");
  try {
    if (!fs.existsSync(warnedFilesPath)) return 50;
    const warned = JSON.parse(fs.readFileSync(warnedFilesPath, "utf8"));
    const total = Object.keys(warned).length;
    if (total <= 1) return 50; // Too few entries to compute meaningful rate
    const graduated = Object.values(warned).filter(
      (v) => typeof v === "object" && v.blocked === true
    ).length;
    return total > 0 ? Math.round((graduated / total) * 100) : 50;
  } catch {
    return 50; // Unknown state
  }
}

/** Tally rejected vs total items from recent reviews to derive false-positive %. */
function computeFalsePositiveRate(recentReviews) {
  let totalItems = 0;
  let rejectedItems = 0;
  for (const review of recentReviews) {
    // Skip retros — they track different semantics (rounds, not review items)
    if (review.type === "retrospective") continue;
    // JSONL uses 'total' and 'rejected' (not 'items_total'/'items_rejected')
    const t = review.total ?? review.items_total ?? 0;
    const r = review.rejected ?? review.items_rejected ?? 0;
    if (t > 0) {
      totalItems += t;
      rejectedItems += r;
    }
  }
  return {
    totalItems,
    rejectedItems,
    falsePositivePct: totalItems > 0 ? Math.round((rejectedItems / totalItems) * 100) : 0,
  };
}

/** Check whether the Husky pre-commit hook references pattern/compliance. */
function isPatternHookActive(rootDir) {
  const huskyPreCommit = path.join(rootDir, ".husky", "pre-commit");
  try {
    if (!fs.existsSync(huskyPreCommit)) return false;
    const hookContent = fs.readFileSync(huskyPreCommit, "utf8");
    return hookContent.includes("pattern") || hookContent.includes("compliance");
  } catch {
    return false;
  }
}

function checkPatternEnforcementCoverage(rootDir, patternChecker, reviewsJsonl, findings) {
  const bench = BENCHMARKS.pattern_enforcement_coverage;

  const enforcementIssues = countEnforcementIssues(rootDir);
  const graduationRate = computeGraduationRate(rootDir);

  const recentReviews = reviewsJsonl.slice(-20);
  const { totalItems, rejectedItems, falsePositivePct } = computeFalsePositiveRate(recentReviews);

  const hookActive = isPatternHookActive(rootDir);
  const enforcementPct = hookActive ? (enforcementIssues === 0 ? 90 : 70) : 40;

  const r1 = scoreMetric(enforcementPct, bench.enforcement_pct, "higher-is-better");
  const r2 = scoreMetric(falsePositivePct, bench.false_positive_pct, "lower-is-better");
  const r3 = scoreMetric(graduationRate, bench.graduation_rate, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  if (!hookActive) {
    findings.push({
      id: "PEA-901",
      category: "pattern_enforcement_coverage",
      domain: DOMAIN,
      severity: "warning",
      message: "Pattern compliance check not found in pre-commit hooks",
      details:
        "Without pre-commit enforcement, pattern violations only surface during PR review (later in the cycle).",
      impactScore: 65,
      frequency: 1,
      blastRadius: 3,
    });
  }

  if (falsePositivePct > bench.false_positive_pct.average) {
    findings.push({
      id: "PEA-902",
      category: "pattern_enforcement_coverage",
      domain: DOMAIN,
      severity: "warning",
      message: `False positive rate at ${falsePositivePct}% across recent reviews (${rejectedItems}/${totalItems} items rejected)`,
      details:
        "High false positive rates waste review cycles. Consider updating Qodo suppression config or pattern rules.",
      impactScore: 55,
      frequency: recentReviews.length,
      blastRadius: 2,
      patchType: "qodo_config",
      patchImpact: "Reduce false positive noise in reviews",
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { enforcementPct, falsePositivePct, graduationRate, hookActive, enforcementIssues },
  };
}

// ── Category 10: Consolidation Pipeline Health ─────────────────────────────

/** Extract the numeric ID from the last consolidated review record. */
function extractLastConsolidatedId(consolidationJson) {
  if (!consolidationJson || !consolidationJson.lastConsolidatedReview) return 0;
  const match = String(consolidationJson.lastConsolidatedReview).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Count reviews whose numeric ID exceeds lastConsolidatedId. */
function countPendingReviews(reviewsJsonl, lastConsolidatedId) {
  let pending = 0;
  for (const review of reviewsJsonl) {
    // Only count actual reviews (numeric IDs), not retros (string IDs like "retro-379")
    if (typeof review.id !== "number") continue;
    if (review.id > lastConsolidatedId) {
      pending++;
    }
  }
  return pending;
}

/** Count unreviewed rule headers in suggested-rules.md. */
function countUnreviewedRules(rootDir) {
  const suggestedRulesPath = path.join(rootDir, "consolidation-output", "suggested-rules.md");
  try {
    if (!fs.existsSync(suggestedRulesPath)) return 0;
    const content = fs.readFileSync(suggestedRulesPath, "utf8");
    const rules = content.match(/^##+ /gm) || [];
    return rules.length;
  } catch {
    return 0;
  }
}

/**
 * Check if CODE_PATTERNS.md was auto-updated by consolidation.
 * Looks for the version history entry that matches consolidation number.
 * Returns { autoUpdated, lastUpdateDate, patternsAutoAdded }.
 */
function checkCodePatternsAutoUpdate(rootDir, consolidationJson) {
  const codePatternsPath = path.join(rootDir, "docs", "agent_docs", "CODE_PATTERNS.md");
  try {
    if (!fs.existsSync(codePatternsPath)) {
      return { autoUpdated: false, lastUpdateDate: null, patternsAutoAdded: 0 };
    }
    const content = fs.readFileSync(codePatternsPath, "utf8");

    // Look for auto-update markers in version history table rows
    // Matches: | 3.7 | 2026-02-27 | **CONSOLIDATION #2:** Auto-added 6 patterns ...
    // Target the specific consolidation number from state to avoid false positives
    const targetNumber =
      consolidationJson && typeof consolidationJson.consolidationNumber === "number"
        ? consolidationJson.consolidationNumber
        : null;
    if (!targetNumber) {
      return { autoUpdated: false, lastUpdateDate: null, patternsAutoAdded: 0 };
    }

    // Match the exact consolidation row and extract date + auto-added count
    const rowRe = new RegExp(
      String.raw`\|\s*[\d.]+\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|[^\n]*\*\*CONSOLIDATION\s+#${targetNumber}:\*\*\s*Auto-added\s+(\d+)`,
      "i"
    );
    const rowMatch = content.match(rowRe);
    if (rowMatch) {
      return {
        autoUpdated: true,
        lastUpdateDate: rowMatch[1] || null,
        patternsAutoAdded: Number.parseInt(rowMatch[2], 10),
        consolidationRef: targetNumber,
      };
    }

    return { autoUpdated: false, lastUpdateDate: null, patternsAutoAdded: 0 };
  } catch {
    return { autoUpdated: false, lastUpdateDate: null, patternsAutoAdded: 0 };
  }
}

/**
 * Count rule stubs in suggested-rules.md and compare against patterns in check-pattern-compliance.js.
 * Returns { suggestedRules, adoptedRules, adoptionPct }.
 */
function measureRuleAdoptionRate(rootDir) {
  const suggestedRulesPath = path.join(rootDir, "consolidation-output", "suggested-rules.md");
  const compliancePath = path.join(rootDir, "scripts", "check-pattern-compliance.js");

  let suggestedIds = [];
  let complianceIds = [];

  try {
    if (fs.existsSync(suggestedRulesPath)) {
      const content = fs.readFileSync(suggestedRulesPath, "utf8");
      const idMatches = content.matchAll(/id:\s*"([\w-]+)"/g);
      suggestedIds = [...idMatches].map((m) => m[1]);
    }
  } catch {
    // skip
  }

  try {
    if (fs.existsSync(compliancePath)) {
      const content = fs.readFileSync(compliancePath, "utf8");
      const idMatches = content.matchAll(/\bid:\s*['"]([\w-]+)['"]/g);
      complianceIds = [...idMatches].map((m) => m[1]);
    }
  } catch {
    // skip
  }

  const suggestedSet = new Set(suggestedIds);
  const complianceSet = new Set(complianceIds);
  let adopted = 0;
  for (const id of suggestedSet) {
    if (complianceSet.has(id)) adopted++;
  }

  const total = suggestedSet.size;
  const adoptionPct = total > 0 ? Math.round((adopted / total) * 100) : 100;

  return { suggestedRules: total, adoptedRules: adopted, adoptionPct };
}

function checkConsolidationPipelineHealth(rootDir, consolidationJson, reviewsJsonl, findings) {
  const bench = BENCHMARKS.consolidation_pipeline_health;

  const lastConsolidatedId = extractLastConsolidatedId(consolidationJson);
  const pendingReviews = countPendingReviews(reviewsJsonl, lastConsolidatedId);
  const unreviewed = countUnreviewedRules(rootDir);

  // Rule adoption rate: compare suggested-rules.md against check-pattern-compliance.js
  const ruleAdoption = measureRuleAdoptionRate(rootDir);
  const ruleAdoptionPct = ruleAdoption.adoptionPct;

  // CODE_PATTERNS.md auto-update status
  const autoUpdate = checkCodePatternsAutoUpdate(rootDir, consolidationJson);

  const r1 = scoreMetric(pendingReviews, bench.pending_reviews, "lower-is-better");
  const r2 = scoreMetric(ruleAdoptionPct, bench.rule_adoption_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-1001",
      category: "consolidation_pipeline_health",
      domain: DOMAIN,
      severity: pendingReviews > 10 ? "error" : "warning",
      message: `${pendingReviews} reviews pending consolidation (last consolidated: #${lastConsolidatedId})`,
      details:
        "Consolidation aggregates review patterns into actionable rules. Run `npm run consolidation:run` to process pending reviews.",
      impactScore: pendingReviews > 10 ? 70 : 45,
      frequency: 1,
      blastRadius: 2,
    });
  }

  if (!autoUpdate.autoUpdated && consolidationJson && consolidationJson.consolidationNumber > 0) {
    findings.push({
      id: "PEA-1002",
      category: "consolidation_pipeline_health",
      domain: DOMAIN,
      severity: "warning",
      message: "CODE_PATTERNS.md not auto-updated by consolidation pipeline",
      details:
        "Consolidation completed but didn't auto-add patterns to CODE_PATTERNS.md. " +
        "This step was automated in Session #193 — check that run-consolidation.js includes appendToCodePatterns().",
      impactScore: 50,
      frequency: 1,
      blastRadius: 2,
    });
  }

  if (ruleAdoption.suggestedRules > 0 && ruleAdoptionPct < 30) {
    findings.push({
      id: "PEA-1003",
      category: "consolidation_pipeline_health",
      domain: DOMAIN,
      severity: "warning",
      message: `Only ${ruleAdoption.adoptedRules}/${ruleAdoption.suggestedRules} suggested rules adopted into compliance checker (${ruleAdoptionPct}%)`,
      details:
        "suggested-rules.md contains patterns identified by consolidation that should be added to check-pattern-compliance.js. " +
        "Review the suggested rules and integrate the most impactful ones.",
      impactScore: 55,
      frequency: ruleAdoption.suggestedRules,
      blastRadius: 3,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      pendingReviews,
      lastConsolidatedId,
      unreviewed,
      ruleAdoptionPct,
      suggestedRules: ruleAdoption.suggestedRules,
      adoptedRules: ruleAdoption.adoptedRules,
      codePatternsAutoUpdated: autoUpdate.autoUpdated,
      codePatternsLastUpdate: autoUpdate.lastUpdateDate,
      patternsAutoAdded: autoUpdate.patternsAutoAdded,
    },
  };
}

// ── Category 11: Automation Coverage Gap ───────────────────────────────────

function checkAutomationCoverageGap(
  codePatterns,
  patternChecker,
  fixTemplates,
  learnings,
  findings
) {
  const bench = BENCHMARKS.automation_coverage_gap;

  // Count total known patterns from all sources
  const patternSources = {
    codePatterns: (codePatterns.match(/^##+ .+/gm) || []).length,
    fixTemplates: (fixTemplates.match(/^##+ Template \d+/gim) || []).length,
    retroPatterns: (learnings.match(/Pattern \d+:/gi) || []).length,
    knownChurnPatterns: (learnings.match(/### Pattern \d+:/gi) || []).length,
  };

  const totalKnown = Object.values(patternSources).reduce((a, b) => a + b, 0);

  // Count automated patterns (in check-pattern-compliance.js)
  // Pattern rules are defined as objects with `id: "..."` in ANTI_PATTERNS array
  const automatedIds = [...patternChecker.matchAll(/\bid:\s*['"]([\w-]+)['"]/g)].map((m) => m[1]);
  const automatedCount = new Set(automatedIds).size;

  const gapPct =
    totalKnown > 0 ? Math.round(((totalKnown - automatedCount) / totalKnown) * 100) : 100;

  const r1 = scoreMetric(gapPct, bench.gap_pct, "lower-is-better");

  const avgScore = r1.score;

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-1101",
      category: "automation_coverage_gap",
      domain: DOMAIN,
      severity: r1.rating === "poor" ? "error" : "warning",
      message: `Automation gap at ${gapPct}% — ${automatedCount} automated of ${totalKnown} known patterns`,
      details: `Sources: CODE_PATTERNS (${patternSources.codePatterns}), FIX_TEMPLATES (${patternSources.fixTemplates}), retro patterns (${patternSources.retroPatterns}), known churn (${patternSources.knownChurnPatterns})`,
      impactScore: r1.rating === "poor" ? 80 : 55,
      frequency: totalKnown,
      blastRadius: 4,
      patchType: "pattern_rule",
      patchImpact: "Close automation gap by adding pattern rules for top unautomated patterns",
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { totalKnown, automatedCount, gapPct, ...patternSources },
  };
}

// ── Utilities ──────────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadJsonl(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return [];
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((l) => l.trim().length > 0);
    let skipped = 0;
    const results = [];
    for (const line of lines) {
      try {
        results.push(JSON.parse(line));
      } catch {
        skipped++;
      }
    }
    if (skipped > 0) {
      console.error(`  [warn] ${skipped} corrupt line(s) skipped in ${path.basename(filePath)}`);
    }
    return results;
  } catch {
    return [];
  }
}

module.exports = { run, DOMAIN };
