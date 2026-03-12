/**
 * Hook Pipeline Health Checker
 *
 * Metrics: warnings_7d, overrides_7d, false_positive_pct, noise_ratio,
 *          commit_failures_7d, overrides_24h, warnings_24h,
 *          no_reason_pct, last_hook_passed, override_trend,
 *          top_warning_type, top_failed_check
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeParse, safeReadLines, runCommandSafe } = require("../lib/utils");

const BENCHMARKS = {
  warnings_7d: { good: 0, average: 5, poor: 15 },
  overrides_7d: { good: 0, average: 2, poor: 5 },
  false_positive_pct: { good: 0, average: 30, poor: 60 },
  noise_ratio: { good: 0, average: 5, poor: 15 },
  commit_failures_7d: { good: 0, average: 3, poor: 8 },
  overrides_24h: { good: 0, average: 1, poor: 3 },
  warnings_24h: { good: 0, average: 3, poor: 8 },
  no_reason_pct: { good: 0, average: 1, poor: 5 },
  last_hook_passed: { good: 100, average: 50, poor: 0 },
  override_trend: { good: 0, average: 2, poor: 5 },
  top_warning_type: { good: 0, average: 3, poor: 8 },
  top_failed_check: { good: 0, average: 2, poor: 5 },
};

function checkHookPipeline() {
  const metrics = {};
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const cutoff7d = now - 7 * DAY_MS;
  const cutoff24h = now - DAY_MS;

  // Hook warnings log
  const warningsLogPath = path.join(ROOT_DIR, ".claude", "state", "hook-warnings-log.jsonl");
  const warningLines = safeReadLines(warningsLogPath);
  const allWarnings = warningLines.map((l) => safeParse(l)).filter(Boolean);

  const warnings7d = allWarnings.filter((w) => {
    const t = new Date(w.timestamp).getTime();
    return !Number.isNaN(t) && t > cutoff7d;
  });
  const warnings24h = allWarnings.filter((w) => {
    const t = new Date(w.timestamp).getTime();
    return !Number.isNaN(t) && t > cutoff24h;
  });

  metrics.warnings_7d = {
    value: warnings7d.length,
    ...scoreMetric(warnings7d.length, BENCHMARKS.warnings_7d),
    benchmark: BENCHMARKS.warnings_7d,
  };
  metrics.warnings_24h = {
    value: warnings24h.length,
    ...scoreMetric(warnings24h.length, BENCHMARKS.warnings_24h),
    benchmark: BENCHMARKS.warnings_24h,
  };

  // Top warning type
  const warningsByType = {};
  for (const w of warnings7d) {
    const key = `${w.hook || "unknown"}:${w.type || "unknown"}`;
    warningsByType[key] = (warningsByType[key] || 0) + 1;
  }
  let topWarningCount = 0;
  for (const count of Object.values(warningsByType)) {
    if (count > topWarningCount) topWarningCount = count;
  }
  metrics.top_warning_type = {
    value: topWarningCount,
    ...scoreMetric(topWarningCount, BENCHMARKS.top_warning_type),
    benchmark: BENCHMARKS.top_warning_type,
  };

  // Override log
  const overridePath = path.join(ROOT_DIR, ".claude", "override-log.jsonl");
  const overrideLines = safeReadLines(overridePath);
  const allOverrides = overrideLines.map((l) => safeParse(l)).filter(Boolean);

  const overrides7d = allOverrides.filter((o) => {
    const t = new Date(o.timestamp).getTime();
    return !Number.isNaN(t) && t > cutoff7d;
  });
  const overrides24h = allOverrides.filter((o) => {
    const t = new Date(o.timestamp).getTime();
    return !Number.isNaN(t) && t > cutoff24h;
  });

  metrics.overrides_7d = {
    value: overrides7d.length,
    ...scoreMetric(overrides7d.length, BENCHMARKS.overrides_7d),
    benchmark: BENCHMARKS.overrides_7d,
  };
  metrics.overrides_24h = {
    value: overrides24h.length,
    ...scoreMetric(overrides24h.length, BENCHMARKS.overrides_24h),
    benchmark: BENCHMARKS.overrides_24h,
  };

  // No-reason percentage
  const noReasonEntries = overrides7d.filter(
    (e) => !e.reason || e.reason === "No reason" || e.reason === "No reason provided"
  );
  const noReasonPct =
    overrides7d.length > 0 ? Math.round((noReasonEntries.length / overrides7d.length) * 100) : 0;
  metrics.no_reason_pct = {
    value: noReasonPct,
    ...scoreMetric(noReasonPct, BENCHMARKS.no_reason_pct),
    benchmark: BENCHMARKS.no_reason_pct,
  };

  // False positive ratio
  let fpRatio;
  if (warnings7d.length === 0) {
    fpRatio = overrides7d.length > 0 ? 100 : 0;
  } else {
    fpRatio = Math.round((overrides7d.length / warnings7d.length) * 100);
  }
  metrics.false_positive_pct = {
    value: fpRatio,
    ...scoreMetric(fpRatio, BENCHMARKS.false_positive_pct),
    benchmark: BENCHMARKS.false_positive_pct,
  };

  // Commit failures
  const failuresPath = path.join(ROOT_DIR, ".claude", "state", "commit-failures.jsonl");
  const failureLines = safeReadLines(failuresPath);
  const allFailures = failureLines.map((l) => safeParse(l)).filter(Boolean);
  const failures7d = allFailures.filter((f) => {
    const t = new Date(f.timestamp).getTime();
    return !Number.isNaN(t) && t > cutoff7d;
  });

  metrics.commit_failures_7d = {
    value: failures7d.length,
    ...scoreMetric(failures7d.length, BENCHMARKS.commit_failures_7d),
    benchmark: BENCHMARKS.commit_failures_7d,
  };

  // Top failed check
  const failuresByCheck = {};
  for (const f of failures7d) {
    const key = String(f.failedCheck || "unknown");
    failuresByCheck[key] = (failuresByCheck[key] || 0) + 1;
  }
  let topFailedCount = 0;
  for (const count of Object.values(failuresByCheck)) {
    if (count > topFailedCount) topFailedCount = count;
  }
  metrics.top_failed_check = {
    value: topFailedCount,
    ...scoreMetric(topFailedCount, BENCHMARKS.top_failed_check),
    benchmark: BENCHMARKS.top_failed_check,
  };

  // Noise ratio from git log
  let noiseRatio = 0;
  try {
    const since7d = new Date(cutoff7d).toISOString().split("T")[0];
    const logResult = runCommandSafe("git", ["log", "--oneline", `--since=${since7d}`], {
      timeout: 10000,
    });
    const logLines = (logResult.output || "").trim().split("\n").filter(Boolean);
    const totalCommits = logLines.length;
    const noisePattern = /\bchore:.*(?:update (?:hook|fetch)|rotate|housekeeping.*state)/i;
    const noiseCommits = logLines.filter((l) => noisePattern.test(l)).length;
    noiseRatio = totalCommits > 0 ? Math.round((noiseCommits / totalCommits) * 100) : 0;
  } catch {
    // non-fatal
  }
  metrics.noise_ratio = {
    value: noiseRatio,
    ...scoreMetric(noiseRatio, BENCHMARKS.noise_ratio),
    benchmark: BENCHMARKS.noise_ratio,
  };

  // Last hook passed
  const hookOutputPath = path.join(ROOT_DIR, ".git", "hook-output.log");
  let hookPassedVal = 100;
  try {
    const hookOutput = fs.readFileSync(hookOutputPath, "utf8");
    hookPassedVal = hookOutput.includes("All pre-commit checks passed") ? 100 : 0;
  } catch {
    hookPassedVal = 50; // unknown
  }
  metrics.last_hook_passed = {
    value: hookPassedVal,
    ...scoreMetric(hookPassedVal, BENCHMARKS.last_hook_passed, "higher-is-better"),
    benchmark: BENCHMARKS.last_hook_passed,
  };

  // Override trend (simple: 7d count as proxy)
  metrics.override_trend = {
    value: overrides7d.length,
    ...scoreMetric(overrides7d.length, BENCHMARKS.override_trend),
    benchmark: BENCHMARKS.override_trend,
  };

  return { metrics, no_data: false };
}

module.exports = { checkHookPipeline };
