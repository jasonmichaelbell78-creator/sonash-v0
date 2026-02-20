/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Effectiveness Metrics Checker — Categories 16-18
 *
 * 16. Review Cycle Efficiency
 * 17. Agent Utilization Effectiveness
 * 18. Template & Reference Quality
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { BENCHMARKS, INDUSTRY_BENCHMARKS } = require("../lib/benchmarks");

const DOMAIN = "effectiveness_metrics";

/**
 * Run all effectiveness metrics checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const reviewsJsonl = loadJsonl(path.join(rootDir, "docs", "data", "reviews.jsonl"));
  const metricsJsonl = loadJsonl(path.join(rootDir, "docs", "data", "review-metrics.jsonl"));
  const learnings = safeReadFile(path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md"));
  const fixTemplates = safeReadFile(path.join(rootDir, "docs", "agent_docs", "FIX_TEMPLATES.md"));
  const codePatterns = safeReadFile(path.join(rootDir, "docs", "agent_docs", "CODE_PATTERNS.md"));

  scores.review_cycle_efficiency = checkReviewCycleEfficiency(
    reviewsJsonl,
    metricsJsonl,
    learnings,
    findings
  );
  scores.agent_utilization_effectiveness = checkAgentUtilization(reviewsJsonl, learnings, findings);
  scores.template_reference_quality = checkTemplateReferenceQuality(
    rootDir,
    fixTemplates,
    codePatterns,
    learnings,
    findings
  );

  return { domain: DOMAIN, findings, scores };
}

// ── Category 16: Review Cycle Efficiency ───────────────────────────────────

/**
 * Gather per-PR round counts from review records.
 * @returns {{ roundCounts: number[], avgRounds: number }}
 */
function gatherPrRoundCounts(reviewsJsonl) {
  const prRounds = {};
  for (const review of reviewsJsonl) {
    const pr = review.pr_number || review.pr;
    if (!pr) continue;
    prRounds[pr] = (prRounds[pr] || 0) + 1;
  }

  const roundCounts = Object.values(prRounds);
  const avgRounds =
    roundCounts.length > 0
      ? Math.round((roundCounts.reduce((a, b) => a + b, 0) / roundCounts.length) * 10) / 10
      : 0;

  return { roundCounts, avgRounds };
}

/**
 * Compute average fix ratio from metrics JSONL entries.
 */
function computeAvgFixRatio(metricsJsonl) {
  if (metricsJsonl.length === 0) return 0;

  const ratios = metricsJsonl
    .map((m) => m.fix_ratio || m.fixRatio)
    .filter((v) => typeof v === "number");

  return ratios.length > 0
    ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100
    : 0;
}

/**
 * Compute churn percentage from learnings text.
 */
function computeChurnPct(learnings) {
  const churnMatches = learnings.match(/avoidable.*?(\d+)%/gi) || [];
  if (churnMatches.length === 0) return 0;

  const churnValues = churnMatches.map((m) => {
    const numMatch = m.match(/(\d+)%/);
    return numMatch ? parseInt(numMatch[1], 10) : 0;
  });
  return Math.round(churnValues.reduce((a, b) => a + b, 0) / churnValues.length);
}

/**
 * Build a by-source breakdown from the most recent reviews.
 */
function buildBySourceBreakdown(reviewsJsonl) {
  const bySource = {};
  for (const review of reviewsJsonl.slice(-30)) {
    const source = review.source || "unknown";
    if (!bySource[source]) bySource[source] = { count: 0, items: 0 };
    bySource[source].count++;
    bySource[source].items += review.items_total || 0;
  }
  return bySource;
}

/**
 * Push cycle-efficiency findings based on scored metrics.
 */
function pushCycleEfficiencyFindings(findings, r1, churnPct, avgRounds, roundCounts, bench) {
  const industry = INDUSTRY_BENCHMARKS;

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-1601",
      category: "review_cycle_efficiency",
      domain: DOMAIN,
      severity: r1.rating === "poor" ? "error" : "warning",
      message: `Average ${avgRounds} rounds per PR across ${roundCounts.length} PRs`,
      details: `Benchmark: internal good=${bench.avg_rounds_per_pr.good}, industry (${industry.review_rounds.source}): good=${industry.review_rounds.benchmark.good}. Churn rate: ${churnPct}%`,
      impactScore: r1.rating === "poor" ? 80 : 55,
      frequency: roundCounts.length,
      blastRadius: 3,
    });
  }

  if (churnPct > bench.churn_pct.average) {
    findings.push({
      id: "PEA-1602",
      category: "review_cycle_efficiency",
      domain: DOMAIN,
      severity: churnPct > bench.churn_pct.poor ? "error" : "warning",
      message: `Review churn at ${churnPct}% — significant portion of rounds are avoidable`,
      details:
        "Churn = avoidable rounds caused by known patterns. Target: <10%. Key drivers: check retro Ping-Pong Chains and Known Churn Patterns.",
      impactScore: churnPct > 30 ? 85 : 60,
      frequency: roundCounts.length,
      blastRadius: 4,
    });
  }
}

function checkReviewCycleEfficiency(reviewsJsonl, metricsJsonl, learnings, findings) {
  const bench = BENCHMARKS.review_cycle_efficiency;

  const { roundCounts, avgRounds } = gatherPrRoundCounts(reviewsJsonl);
  const avgFixRatio = computeAvgFixRatio(metricsJsonl);
  const churnPct = computeChurnPct(learnings);
  const bySource = buildBySourceBreakdown(reviewsJsonl);

  const r1 = scoreMetric(avgRounds, bench.avg_rounds_per_pr, "lower-is-better");
  const r2 = scoreMetric(avgFixRatio, bench.fix_ratio, "lower-is-better");
  const r3 = scoreMetric(churnPct, bench.churn_pct, "lower-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  pushCycleEfficiencyFindings(findings, r1, churnPct, avgRounds, roundCounts, bench);

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { avgRounds, avgFixRatio, churnPct, prsAnalyzed: roundCounts.length, bySource },
  };
}

// ── Category 17: Agent Utilization Effectiveness ───────────────────────────

function checkAgentUtilization(reviewsJsonl, learnings, findings) {
  const bench = BENCHMARKS.agent_utilization_effectiveness;

  // Check for parallel agent usage in reviews with 20+ items
  const largeReviews = reviewsJsonl.filter((r) => (r.items_total || 0) >= 20);
  let parallelUsed = 0;

  const agentKeywords = ["parallel agent", "code-reviewer agent", "specialist agent", "subagent"];
  for (const review of largeReviews) {
    const text = JSON.stringify(review).toLowerCase();
    if (agentKeywords.some((kw) => text.includes(kw))) {
      parallelUsed++;
    }
  }

  // Also check learnings log for agent evidence
  const agentMentions = (
    learnings.match(/parallel.*agent|agent.*parallel|code-reviewer agent/gi) || []
  ).length;

  const parallelPct =
    largeReviews.length > 0 ? Math.round((parallelUsed / largeReviews.length) * 100) : 100; // No large reviews = not applicable

  // Specialist match: check if agents were used for appropriate tasks
  const specialistKeywords = ["security", "performance", "accessibility", "testing"];
  let specialistMatch = 0;
  let specialistOpportunities = 0;

  for (const review of reviewsJsonl.slice(-20)) {
    const text = JSON.stringify(review).toLowerCase();
    for (const kw of specialistKeywords) {
      if (text.includes(kw)) {
        specialistOpportunities++;
        if (text.includes("agent") || text.includes("specialist")) {
          specialistMatch++;
        }
      }
    }
  }

  const specialistPct =
    specialistOpportunities > 0
      ? Math.round((specialistMatch / specialistOpportunities) * 100)
      : 80; // Default if no opportunities

  const r1 = scoreMetric(parallelPct, bench.parallel_usage_pct, "higher-is-better");
  const r2 = scoreMetric(specialistPct, bench.specialist_match_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (largeReviews.length > 0 && r1.rating !== "good") {
    findings.push({
      id: "PEA-1701",
      category: "agent_utilization_effectiveness",
      domain: DOMAIN,
      severity: "warning",
      message: `Parallel agents used in ${parallelPct}% of large reviews (${parallelUsed}/${largeReviews.length} reviews with 20+ items)`,
      details:
        "For reviews with 20+ items, parallel agents significantly reduce processing time and catch more issues.",
      impactScore: 50,
      frequency: largeReviews.length,
      blastRadius: 2,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { parallelPct, specialistPct, largeReviews: largeReviews.length, agentMentions },
  };
}

// ── Category 18: Template & Reference Quality ──────────────────────────────

/**
 * Compute how many days since the most recent date found in the text.
 * Returns the default (30) if no valid dates are found.
 */
function computeFreshnessDays(text) {
  const dateMatches = text.match(/\d{4}-\d{2}-\d{2}/g) || [];
  if (dateMatches.length === 0) return 30;

  const dates = dateMatches.map((d) => new Date(d)).filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return 30;

  const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())));
  return Math.round((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Count how many reference docs exist and are non-trivial (>100 bytes).
 */
function countAccessibleRefDocs(rootDir) {
  const refDocs = [
    {
      path: path.join(
        rootDir,
        ".claude",
        "skills",
        "pr-review",
        "reference",
        "SONARCLOUD_ENRICHMENT.md"
      ),
      name: "SonarCloud",
    },
    {
      path: path.join(
        rootDir,
        ".claude",
        "skills",
        "pr-review",
        "reference",
        "LEARNING_CAPTURE.md"
      ),
      name: "Learning Capture",
    },
    {
      path: path.join(
        rootDir,
        ".claude",
        "skills",
        "pr-review",
        "reference",
        "PARALLEL_AGENT_STRATEGY.md"
      ),
      name: "Parallel Agents",
    },
    {
      path: path.join(
        rootDir,
        ".claude",
        "skills",
        "pr-review",
        "reference",
        "TDMS_INTEGRATION.md"
      ),
      name: "TDMS Integration",
    },
  ];

  let accessibleDocs = 0;
  for (const doc of refDocs) {
    try {
      if (fs.existsSync(doc.path) && fs.statSync(doc.path).size > 100) {
        accessibleDocs++;
      }
    } catch {
      /* skip */
    }
  }

  return { accessibleDocs, totalRefDocs: refDocs.length };
}

function checkTemplateReferenceQuality(rootDir, fixTemplates, codePatterns, learnings, findings) {
  const bench = BENCHMARKS.template_reference_quality;

  // Count FIX_TEMPLATES entries
  const templateHeaders = fixTemplates.match(/^##+ Template \d+/gim) || [];
  const templateCount = templateHeaders.length;

  const freshnessDays = computeFreshnessDays(fixTemplates);

  // Coverage: check top churn patterns from retros against templates
  const knownPatterns = (learnings.match(/### Pattern \d+:/gi) || []).length;
  const coveragePct =
    knownPatterns > 0
      ? Math.min(100, Math.round((templateCount / knownPatterns) * 100))
      : templateCount > 0
        ? 80
        : 30;

  // Check reference docs accuracy
  const { accessibleDocs, totalRefDocs } = countAccessibleRefDocs(rootDir);
  const accuracyPct = Math.round((accessibleDocs / totalRefDocs) * 100);

  const r1 = scoreMetric(coveragePct, bench.coverage_pct, "higher-is-better");
  const r2 = scoreMetric(freshnessDays, bench.freshness_days, "lower-is-better");
  const r3 = scoreMetric(accuracyPct, bench.accuracy_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-1801",
      category: "template_reference_quality",
      domain: DOMAIN,
      severity: "warning",
      message: `FIX_TEMPLATES coverage at ${coveragePct}% (${templateCount} templates vs ${knownPatterns} known churn patterns)`,
      details:
        "Templates for top churn patterns prevent multi-round ping-pong by providing tested fix approaches.",
      impactScore: 55,
      frequency: knownPatterns,
      blastRadius: 3,
      patchType: "fix_template",
      patchImpact: "Add templates for uncovered churn patterns",
    });
  }

  if (freshnessDays > bench.freshness_days.average) {
    findings.push({
      id: "PEA-1802",
      category: "template_reference_quality",
      domain: DOMAIN,
      severity: "info",
      message: `FIX_TEMPLATES last updated ${freshnessDays} days ago`,
      details: `Benchmark: good=${bench.freshness_days.good} days, average=${bench.freshness_days.average} days`,
      impactScore: 30,
      frequency: 1,
      blastRadius: 1,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      templateCount,
      coveragePct,
      freshnessDays,
      accuracyPct,
      accessibleRefDocs: accessibleDocs,
      totalRefDocs,
    },
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

function loadJsonl(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return [];
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
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
