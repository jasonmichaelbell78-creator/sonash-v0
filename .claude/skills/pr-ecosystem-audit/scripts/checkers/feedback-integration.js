/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Feedback Loop & Integration Checker — Categories 12-15
 *
 * 12. Feedback Loop Closure
 * 13. Cross-PR Pattern Recurrence
 * 14. External Tool Configuration
 * 15. Cross-System Integration
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { BENCHMARKS } = require("../lib/benchmarks");

const DOMAIN = "feedback_integration";

/**
 * Run all feedback & integration checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const debtItems = loadJsonl(path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl"));
  const reviewsJsonl = loadJsonl(path.join(rootDir, "docs", "data", "reviews.jsonl"));
  const learnings = safeReadFile(path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md"));

  scores.feedback_loop_closure = checkFeedbackLoopClosure(
    debtItems,
    reviewsJsonl,
    learnings,
    findings
  );
  scores.cross_pr_pattern_recurrence = checkCrossPrPatternRecurrence(
    reviewsJsonl,
    learnings,
    findings
  );
  scores.external_tool_configuration = checkExternalToolConfiguration(
    rootDir,
    reviewsJsonl,
    findings
  );
  scores.cross_system_integration = checkCrossSystemIntegration(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 12: Feedback Loop Closure ─────────────────────────────────────

/**
 * Parse learnings text to find action items mentioned 2+ times across retro sections.
 */
function findRepeatOffenders(learnings) {
  const actionItemMentions = {};
  const retroSections =
    learnings.match(/### (?:PR #\d+ Retrospective|Process Improvements)[\s\S]*?(?=###|$)/gi) || [];

  for (const section of retroSections) {
    const actionItems = section.match(/[-*]\s+\*\*([^\n]+?)\*\*/g) || [];
    for (const item of actionItems) {
      const clean = item
        .replace(/[-*\s*]+/g, "")
        .toLowerCase()
        .slice(0, 60);
      actionItemMentions[clean] = (actionItemMentions[clean] || 0) + 1;
    }
  }

  return Object.entries(actionItemMentions)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Compute average days-to-resolve for items that have both created and resolved_date.
 */
function computeAvgDaysToResolve(resolvedItems) {
  if (resolvedItems.length === 0) return 0;

  let totalDays = 0;
  let validCount = 0;

  for (const item of resolvedItems) {
    if (item.created && item.resolved_date) {
      const created = new Date(item.created);
      const resolved = new Date(item.resolved_date);
      if (!isNaN(created.getTime()) && !isNaN(resolved.getTime())) {
        totalDays += (resolved - created) / (1000 * 60 * 60 * 24);
        validCount++;
      }
    }
  }

  return validCount > 0 ? Math.round(totalDays / validCount) : 0;
}

/**
 * Push findings for repeat-offender action items and low closure rates.
 */
function pushFeedbackLoopFindings(
  findings,
  repeatOffenders,
  r1,
  closureRate,
  resolvedRetro,
  openRetro,
  totalActionItems,
  avgDaysToResolve,
  bench
) {
  if (repeatOffenders.length > 0) {
    findings.push({
      id: "PEA-1201",
      category: "feedback_loop_closure",
      domain: DOMAIN,
      severity: repeatOffenders.length >= 3 ? "error" : "warning",
      message: `${repeatOffenders.length} repeat-offender action items (recommended 2+ times without implementation)`,
      details: repeatOffenders.map((r) => `"${r.name}" (${r.count}x)`).join(", "),
      impactScore: repeatOffenders.length >= 3 ? 94 : 70,
      frequency: repeatOffenders.reduce((sum, r) => sum + r.count, 0),
      blastRadius: 4,
      patchType: "debt_entry",
      patchImpact: "Create S1 DEBT entries for repeat offenders to force implementation",
    });
  }

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-1202",
      category: "feedback_loop_closure",
      domain: DOMAIN,
      severity: r1.rating === "poor" ? "error" : "warning",
      message: `Retro action item closure rate at ${closureRate}% (${resolvedRetro.length} resolved, ${openRetro.length} open)`,
      details: `Average time-to-implementation: ${avgDaysToResolve} days. Benchmark: good=${bench.closure_rate_pct.good}%`,
      impactScore: r1.rating === "poor" ? 80 : 55,
      frequency: totalActionItems,
      blastRadius: 3,
    });
  }
}

function checkFeedbackLoopClosure(debtItems, reviewsJsonl, learnings, findings) {
  const bench = BENCHMARKS.feedback_loop_closure;

  // Find retro action items in TDMS
  const retroDebtItems = debtItems.filter((d) => d.source_id && d.source_id.includes("pr-retro"));
  const resolvedRetro = retroDebtItems.filter(
    (d) => d.status === "resolved" || d.status === "done"
  );
  const openRetro = retroDebtItems.filter((d) => d.status !== "resolved" && d.status !== "done");

  const repeatOffenders = findRepeatOffenders(learnings);

  const totalActionItems = Math.max(1, retroDebtItems.length + repeatOffenders.length);
  const closureRate = Math.round((resolvedRetro.length / totalActionItems) * 100);
  const avgDaysToResolve = computeAvgDaysToResolve(resolvedRetro);

  const r1 = scoreMetric(closureRate, bench.closure_rate_pct, "higher-is-better");
  const r2 = scoreMetric(repeatOffenders.length, bench.repeat_offender_count, "lower-is-better");
  const r3 = scoreMetric(avgDaysToResolve, bench.time_to_implement_days, "lower-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  pushFeedbackLoopFindings(
    findings,
    repeatOffenders,
    r1,
    closureRate,
    resolvedRetro,
    openRetro,
    totalActionItems,
    avgDaysToResolve,
    bench
  );

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      closureRate,
      repeatOffenders: repeatOffenders.length,
      openItems: openRetro.length,
      resolvedItems: resolvedRetro.length,
      avgDaysToResolve,
    },
  };
}

// ── Category 13: Cross-PR Pattern Recurrence ───────────────────────────────

/**
 * Build a map of pattern names to the set of PRs they appear in.
 */
function collectPatternsByPr(reviewsJsonl) {
  const patternsByPr = {};
  for (const review of reviewsJsonl) {
    const pr = review.pr_number || review.pr;
    if (!pr) continue;
    const patterns = review.patterns || [];
    for (const p of patterns) {
      const name = typeof p === "string" ? p : p.name || p.pattern || "";
      if (name) {
        if (!patternsByPr[name]) patternsByPr[name] = new Set();
        patternsByPr[name].add(String(pr));
      }
    }
  }
  return patternsByPr;
}

/**
 * Compute false-positive metrics from the last 30 reviews, grouped by source.
 */
function computeFalsePositiveMetrics(reviewsJsonl) {
  let totalItems = 0;
  let rejectedItems = 0;
  const bySource = {};

  for (const review of reviewsJsonl.slice(-30)) {
    const source = review.source || "unknown";
    if (!bySource[source]) bySource[source] = { total: 0, rejected: 0 };
    if (review.items_total) {
      totalItems += review.items_total;
      bySource[source].total += review.items_total;
    }
    if (review.items_rejected) {
      rejectedItems += review.items_rejected;
      bySource[source].rejected += review.items_rejected;
    }
  }

  const falsePositiveRate = totalItems > 0 ? Math.round((rejectedItems / totalItems) * 100) : 0;
  return { totalItems, rejectedItems, bySource, falsePositiveRate };
}

/**
 * Push a finding when recurring patterns are detected across 3+ PRs.
 */
function pushRecurrenceFinding(findings, recurring) {
  if (recurring.length > 0) {
    findings.push({
      id: "PEA-1301",
      category: "cross_pr_pattern_recurrence",
      domain: DOMAIN,
      severity: recurring.length > 3 ? "error" : "warning",
      message: `${recurring.length} patterns recurring across 3+ PRs`,
      details: recurring
        .slice(0, 5)
        .map((r) => `"${r.name}" (${r.prCount} PRs: ${r.prs.slice(0, 3).join(", ")})`)
        .join("; "),
      impactScore: recurring.length > 3 ? 85 : 60,
      frequency: recurring.reduce((sum, r) => sum + r.prCount, 0),
      blastRadius: 4,
      patchType: "pattern_rule",
      patternName: recurring[0]?.name,
      patchImpact: "Automate recurring pattern detection to prevent cross-PR recurrence",
    });
  }
}

function checkCrossPrPatternRecurrence(reviewsJsonl, learnings, findings) {
  const bench = BENCHMARKS.cross_pr_pattern_recurrence;

  const patternsByPr = collectPatternsByPr(reviewsJsonl);

  // Find patterns appearing in 3+ PRs
  const recurring = Object.entries(patternsByPr)
    .filter(([, prs]) => prs.size >= 3)
    .map(([name, prs]) => ({ name, prCount: prs.size, prs: [...prs] }))
    .sort((a, b) => b.prCount - a.prCount);

  const { totalItems, rejectedItems, bySource, falsePositiveRate } =
    computeFalsePositiveMetrics(reviewsJsonl);

  const r1 = scoreMetric(recurring.length, bench.recurring_unsuppressed, "lower-is-better");
  const r2 = scoreMetric(falsePositiveRate, bench.false_positive_rate_pct, "lower-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  pushRecurrenceFinding(findings, recurring);

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      recurringPatterns: recurring.length,
      falsePositiveRate,
      totalItems,
      rejectedItems,
      bySource,
    },
  };
}

// ── Category 14: External Tool Configuration ───────────────────────────────

function checkExternalToolConfiguration(rootDir, reviewsJsonl, findings) {
  const bench = BENCHMARKS.external_tool_configuration;

  // Check .qodo/pr-agent.toml
  const qodoPath = path.join(rootDir, ".qodo", "pr-agent.toml");
  let qodoSections = {
    pr_reviewer: false,
    pr_code_suggestions: false,
    pr_compliance_checker: false,
  };
  let staleRules = 0;

  try {
    if (fs.existsSync(qodoPath)) {
      const content = fs.readFileSync(qodoPath, "utf8");
      qodoSections.pr_reviewer = content.includes("[pr_reviewer]");
      qodoSections.pr_code_suggestions = content.includes("[pr_code_suggestions]");
      qodoSections.pr_compliance_checker = content.includes("[pr_compliance_checker]");

      // Check for stale suppression rules (patterns not seen in recent reviews)
      const suppressionLines = content.match(/ignore.*=.*\[.*\]/gi) || [];
      staleRules = Math.max(0, suppressionLines.length - 5); // Rough heuristic
    }
  } catch {
    /* no file */
  }

  const configuredSections = Object.values(qodoSections).filter(Boolean).length;
  const totalSections = Object.keys(qodoSections).length;
  const configCompleteness = Math.round((configuredSections / totalSections) * 100);

  // Suppression effectiveness: are rejected items decreasing?
  const recentRejections = reviewsJsonl
    .slice(-10)
    .reduce((sum, r) => sum + (r.items_rejected || 0), 0);
  const olderRejections = reviewsJsonl
    .slice(-20, -10)
    .reduce((sum, r) => sum + (r.items_rejected || 0), 0);
  const suppressionEffectiveness =
    olderRejections > 0
      ? Math.max(0, Math.round(((olderRejections - recentRejections) / olderRejections) * 100 + 50))
      : 70; // Default to average if no baseline

  const r1 = scoreMetric(configCompleteness, bench.config_completeness_pct, "higher-is-better");
  const r2 = scoreMetric(
    Math.min(100, suppressionEffectiveness),
    bench.suppression_effectiveness_pct,
    "higher-is-better"
  );
  const r3 = scoreMetric(staleRules, bench.stale_rules, "lower-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  if (configCompleteness < 100) {
    const missingSections = Object.entries(qodoSections)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    findings.push({
      id: "PEA-1401",
      category: "external_tool_configuration",
      domain: DOMAIN,
      severity: "warning",
      message: `Qodo pr-agent.toml missing ${totalSections - configuredSections} section(s): ${missingSections.join(", ")}`,
      details:
        "All 3 Qodo sections (pr_reviewer, pr_code_suggestions, pr_compliance_checker) need suppression rules to reduce noise.",
      impactScore: 55,
      frequency: 1,
      blastRadius: 2,
      patchType: "qodo_config",
      patchContent: missingSections.map((s) => `[${s}]\n# Add suppression rules here`).join("\n\n"),
      patchImpact: "Complete Qodo configuration to suppress known false positives",
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { configCompleteness, suppressionEffectiveness, staleRules, qodoSections },
  };
}

// ── Category 15: Cross-System Integration ──────────────────────────────────

function checkCrossSystemIntegration(rootDir, findings) {
  const bench = BENCHMARKS.cross_system_integration;

  // Check integration points
  const integrationPoints = {
    session_start_consolidation: false,
    session_end_retro_check: false,
    episodic_memory_usage: false,
    handoff_context: false,
    pre_commit_hooks: false,
  };

  // Check session-start.js for consolidation
  const sessionStartPath = path.join(rootDir, ".claude", "hooks", "session-start.js");
  try {
    if (fs.existsSync(sessionStartPath)) {
      const content = fs.readFileSync(sessionStartPath, "utf8");
      integrationPoints.session_start_consolidation = content.includes("consolidat");
    }
  } catch {
    /* no file */
  }

  // Check for pre-commit hooks
  const huskyPath = path.join(rootDir, ".husky", "pre-commit");
  try {
    integrationPoints.pre_commit_hooks = fs.existsSync(huskyPath);
  } catch {
    /* no file */
  }

  // Check for handoff.json
  const handoffPath = path.join(rootDir, ".claude", "state", "handoff.json");
  try {
    integrationPoints.handoff_context = fs.existsSync(handoffPath);
  } catch {
    /* no file */
  }

  // Check pr-review SKILL.md for episodic memory reference
  const prReviewSkill = path.join(rootDir, ".claude", "skills", "pr-review", "SKILL.md");
  try {
    if (fs.existsSync(prReviewSkill)) {
      const content = fs.readFileSync(prReviewSkill, "utf8");
      integrationPoints.episodic_memory_usage =
        content.includes("episodic") || content.includes("Episodic");
    }
  } catch {
    /* no file */
  }

  // Check session-end skill for retro verification
  const sessionEndSkill = path.join(rootDir, ".claude", "skills", "session-end");
  try {
    integrationPoints.session_end_retro_check = fs.existsSync(sessionEndSkill);
  } catch {
    /* no file */
  }

  const activePoints = Object.values(integrationPoints).filter(Boolean).length;
  const totalPoints = Object.keys(integrationPoints).length;
  const activePct = Math.round((activePoints / totalPoints) * 100);

  // Episodic memory usage — check if SKILL.md references it
  const episodicPct = integrationPoints.episodic_memory_usage ? 80 : 20;

  const r1 = scoreMetric(activePct, bench.integration_points_active_pct, "higher-is-better");
  const r2 = scoreMetric(episodicPct, bench.episodic_memory_usage_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (activePct < 80) {
    const missingPoints = Object.entries(integrationPoints)
      .filter(([, v]) => !v)
      .map(([k]) => k.replace(/_/g, " "));

    findings.push({
      id: "PEA-1501",
      category: "cross_system_integration",
      domain: DOMAIN,
      severity: "warning",
      message: `${totalPoints - activePoints} integration points inactive: ${missingPoints.join(", ")}`,
      details: `Active integration points: ${activePct}% (${activePoints}/${totalPoints})`,
      impactScore: 50,
      frequency: 1,
      blastRadius: 3,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { activePct, episodicPct, integrationPoints },
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
