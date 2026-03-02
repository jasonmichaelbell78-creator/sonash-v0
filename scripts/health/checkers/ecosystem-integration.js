/* eslint-disable no-undef */

/**
 * Ecosystem Integration Health Checker
 *
 * Metrics: avg_fix_ratio, avg_rounds, review_count,
 *          ci_failures, sonar_issues, velocity_avg,
 *          reviews_missing, churn_pct
 */

"use strict";

const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeParse, safeReadLines, runCommandSafe } = require("../lib/utils");

const BENCHMARKS = {
  avg_fix_ratio: { good: 0.15, average: 0.25, poor: 0.35 },
  avg_rounds: { good: 2, average: 3, poor: 5 },
  review_count: { good: 5, average: 2, poor: 0 },
  ci_failures: { good: 0, average: 1, poor: 3 },
  sonar_issues: { good: 0, average: 1, poor: 3 },
  velocity_avg: { good: 5, average: 2, poor: 0 },
  reviews_missing: { good: 0, average: 1, poor: 5 },
  churn_pct: { good: 10, average: 20, poor: 35 },
};

function checkEcosystemIntegration() {
  const metrics = {};

  // Review quality from review-metrics.jsonl
  const metricsPath = path.join(ROOT_DIR, ".claude", "state", "review-metrics.jsonl");
  const lines = safeReadLines(metricsPath);
  const recent = lines
    .slice(-5)
    .map((l) => safeParse(l))
    .filter(Boolean);

  let avgFixRatio = 0;
  let avgRounds = 0;
  const reviewCount = recent.length;

  if (recent.length > 0) {
    const ratios = recent.map((e) => e.fix_ratio).filter((r) => typeof r === "number");
    avgFixRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;

    const roundsList = recent.map((e) => e.review_rounds || e.rounds || 0).filter((r) => r > 0);
    avgRounds =
      roundsList.length > 0 ? roundsList.reduce((a, b) => a + b, 0) / roundsList.length : 0;
  }

  metrics.avg_fix_ratio = {
    value: Math.round(avgFixRatio * 100) / 100,
    ...scoreMetric(avgFixRatio, BENCHMARKS.avg_fix_ratio),
    benchmark: BENCHMARKS.avg_fix_ratio,
  };

  metrics.avg_rounds = {
    value: Math.round(avgRounds * 10) / 10,
    ...scoreMetric(avgRounds, BENCHMARKS.avg_rounds),
    benchmark: BENCHMARKS.avg_rounds,
  };

  metrics.review_count = {
    value: reviewCount,
    ...scoreMetric(reviewCount, BENCHMARKS.review_count, "higher-is-better"),
    benchmark: BENCHMARKS.review_count,
  };

  // GitHub Actions status
  let ciFailures = 0;
  const ghResult = runCommandSafe(
    "gh",
    ["run", "list", "--limit", "5", "--json", "status,conclusion,name"],
    { timeout: 15000 }
  );
  if (ghResult.success && ghResult.output) {
    const runs = safeParse(ghResult.output, []);
    if (Array.isArray(runs)) {
      ciFailures = runs.filter((r) => r.conclusion === "failure").length;
    }
  }

  metrics.ci_failures = {
    value: ciFailures,
    ...scoreMetric(ciFailures, BENCHMARKS.ci_failures),
    benchmark: BENCHMARKS.ci_failures,
  };

  // SonarCloud
  let sonarIssues = 0;
  const sonarResult = runCommandSafe("npm", ["run", "sonar:check"], { timeout: 30000 });
  const sonarOutput = `${sonarResult.output || ""}\n${sonarResult.stderr || ""}`;
  if (!sonarResult.success && !/Missing script/i.test(sonarOutput)) {
    const m = /(\d+)\s+(?:issue|condition|failed)/i.exec(sonarOutput);
    sonarIssues = m ? Number.parseInt(m[1], 10) : 1;
  }

  metrics.sonar_issues = {
    value: sonarIssues,
    ...scoreMetric(sonarIssues, BENCHMARKS.sonar_issues),
    benchmark: BENCHMARKS.sonar_issues,
  };

  // Velocity from velocity-log.jsonl
  const velPath = path.join(ROOT_DIR, ".claude", "state", "velocity-log.jsonl");
  const velLines = safeReadLines(velPath);
  const velRecent = velLines
    .slice(-5)
    .map((l) => safeParse(l))
    .filter(Boolean);
  let velocityAvg = 0;
  if (velRecent.length > 0) {
    const completed = velRecent.map((e) => e.items_completed || 0);
    velocityAvg = completed.reduce((a, b) => a + b, 0) / completed.length;
  }

  metrics.velocity_avg = {
    value: Math.round(velocityAvg * 10) / 10,
    ...scoreMetric(velocityAvg, BENCHMARKS.velocity_avg, "higher-is-better"),
    benchmark: BENCHMARKS.velocity_avg,
  };

  // Reviews sync (missing reviews)
  let reviewsMissing = 0;
  const syncResult = runCommandSafe("npm", ["run", "reviews:sync-check"], { timeout: 30000 });
  const syncOutput = `${syncResult.output || ""}\n${syncResult.stderr || ""}`;
  if (!syncResult.success && !/Missing script/i.test(syncOutput)) {
    const m = /(\d+)\s+missing/i.exec(syncOutput);
    reviewsMissing = m ? Number.parseInt(m[1], 10) : 0;
  }

  metrics.reviews_missing = {
    value: reviewsMissing,
    ...scoreMetric(reviewsMissing, BENCHMARKS.reviews_missing),
    benchmark: BENCHMARKS.reviews_missing,
  };

  // Review churn
  let churnPct = 0;
  const churnResult = runCommandSafe("npm", ["run", "review:churn"], { timeout: 30000 });
  const churnOutput = `${churnResult.output || ""}\n${churnResult.stderr || ""}`;
  const churnMatch = /churn[:\s]+(\d+(?:\.\d+)?)\s*%/i.exec(churnOutput);
  if (churnMatch) {
    churnPct = Number.parseFloat(churnMatch[1]);
  }

  metrics.churn_pct = {
    value: churnPct,
    ...scoreMetric(churnPct, BENCHMARKS.churn_pct),
    benchmark: BENCHMARKS.churn_pct,
  };

  return { metrics, no_data: false };
}

module.exports = { checkEcosystemIntegration };
