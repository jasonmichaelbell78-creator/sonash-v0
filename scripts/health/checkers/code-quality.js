/**
 * Code Quality Health Checker
 *
 * Metrics: ts_errors, eslint_errors, eslint_warnings, pattern_violations,
 *          circular_deps, ts_strict_coverage, lint_fix_ratio, code_style_score
 */

"use strict";

const { scoreMetric } = require("../lib/scoring");
const { runCommandSafe } = require("../lib/utils");

const BENCHMARKS = {
  ts_errors: { good: 0, average: 5, poor: 20 },
  eslint_errors: { good: 0, average: 3, poor: 10 },
  eslint_warnings: { good: 0, average: 10, poor: 50 },
  pattern_violations: { good: 0, average: 3, poor: 10 },
  circular_deps: { good: 0, average: 2, poor: 5 },
  ts_strict_coverage: { good: 100, average: 90, poor: 70 },
  lint_fix_ratio: { good: 0, average: 5, poor: 15 },
  code_style_score: { good: 95, average: 85, poor: 70 },
};

function checkCodeQuality() {
  const metrics = {};

  // TypeScript errors
  let tsErrorCount = 0;
  let tsResult = runCommandSafe("npm", ["run", "type-check"], { timeout: 120000 });
  const tsCombined = `${tsResult.output || ""}\n${tsResult.stderr || ""}`;
  if (tsCombined.includes("Missing script")) {
    tsResult = runCommandSafe("npx", ["tsc", "--noEmit"], { timeout: 120000 });
  }
  const tsOutput = `${tsResult.output || ""}\n${tsResult.stderr || ""}`;
  if (!tsResult.success && !tsOutput.includes("Missing script")) {
    const m = /Found (\d+) error/i.exec(tsOutput);
    tsErrorCount = m ? Number.parseInt(m[1], 10) : 1;
  }
  const tsScore = scoreMetric(tsErrorCount, BENCHMARKS.ts_errors);
  metrics.ts_errors = { value: tsErrorCount, ...tsScore, benchmark: BENCHMARKS.ts_errors };

  // ESLint
  let eslintErrors = 0;
  let eslintWarnings = 0;
  const lintResult = runCommandSafe("npm", ["run", "lint"], { timeout: 120000 });
  const lintOutput = `${lintResult.output || ""}\n${lintResult.stderr || ""}`;
  if (!lintResult.success) {
    const errMatch = /(\d+) error/.exec(lintOutput);
    const warnMatch = /(\d+) warning/.exec(lintOutput);
    eslintErrors = errMatch ? Number.parseInt(errMatch[1], 10) : 0;
    eslintWarnings = warnMatch ? Number.parseInt(warnMatch[1], 10) : 0;
  }
  const errScore = scoreMetric(eslintErrors, BENCHMARKS.eslint_errors);
  metrics.eslint_errors = { value: eslintErrors, ...errScore, benchmark: BENCHMARKS.eslint_errors };

  const warnScore = scoreMetric(eslintWarnings, BENCHMARKS.eslint_warnings);
  metrics.eslint_warnings = {
    value: eslintWarnings,
    ...warnScore,
    benchmark: BENCHMARKS.eslint_warnings,
  };

  // Pattern violations
  let violations = 0;
  const patResult = runCommandSafe("npm", ["run", "patterns:check"], { timeout: 60000 });
  const patOutput = `${patResult.output || ""}\n${patResult.stderr || ""}`;
  if (!patResult.success && patOutput.includes("violation")) {
    const vm = /(\d+)\s+violation/i.exec(patOutput);
    violations = vm ? Number.parseInt(vm[1], 10) : 1;
  }
  const patScore = scoreMetric(violations, BENCHMARKS.pattern_violations);
  metrics.pattern_violations = {
    value: violations,
    ...patScore,
    benchmark: BENCHMARKS.pattern_violations,
  };

  // Circular dependencies
  let circularCount = 0;
  const circResult = runCommandSafe("npm", ["run", "deps:circular"], { timeout: 60000 });
  const circOutput = `${circResult.output || ""}\n${circResult.stderr || ""}`;
  const missingScript = /Missing script/i.test(circOutput);
  if (!missingScript && !circResult.success) {
    const cm = /(\d+)\s+circular/i.exec(circOutput);
    circularCount = cm ? Number.parseInt(cm[1], 10) : 1;
  }
  const circScore = scoreMetric(circularCount, BENCHMARKS.circular_deps);
  metrics.circular_deps = {
    value: circularCount,
    ...circScore,
    benchmark: BENCHMARKS.circular_deps,
  };

  // TS strict coverage (estimate based on errors)
  const strictCov = tsErrorCount === 0 ? 100 : Math.max(0, 100 - tsErrorCount * 2);
  const strictScore = scoreMetric(strictCov, BENCHMARKS.ts_strict_coverage, "higher-is-better");
  metrics.ts_strict_coverage = {
    value: strictCov,
    ...strictScore,
    benchmark: BENCHMARKS.ts_strict_coverage,
  };

  // Lint fix ratio (warnings + errors as % of a notional baseline)
  const totalLintIssues = eslintErrors + eslintWarnings;
  const lintFixScore = scoreMetric(totalLintIssues, BENCHMARKS.lint_fix_ratio);
  metrics.lint_fix_ratio = {
    value: totalLintIssues,
    ...lintFixScore,
    benchmark: BENCHMARKS.lint_fix_ratio,
  };

  // Code style score (composite of TS + lint health)
  const styleScore = Math.round(
    (metrics.ts_errors.score + metrics.eslint_errors.score + metrics.eslint_warnings.score) / 3
  );
  const styleResult = scoreMetric(styleScore, BENCHMARKS.code_style_score, "higher-is-better");
  metrics.code_style_score = {
    value: styleScore,
    ...styleResult,
    benchmark: BENCHMARKS.code_style_score,
  };

  return { metrics, no_data: false };
}

module.exports = { checkCodeQuality };
