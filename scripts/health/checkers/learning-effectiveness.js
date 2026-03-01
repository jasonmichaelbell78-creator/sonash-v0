/* eslint-disable no-undef */

/**
 * Learning Effectiveness Health Checker
 *
 * Metrics: effectiveness, automation_coverage, failing_patterns, learned_count, critical_success
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR } = require("../lib/utils");

const BENCHMARKS = {
  effectiveness: { good: 85, average: 75, poor: 60 },
  automation_coverage: { good: 40, average: 25, poor: 10 },
  failing_patterns: { good: 0, average: 5, poor: 10 },
  learned_count: { good: 20, average: 10, poor: 5 },
  critical_success: { good: 95, average: 85, poor: 70 },
};

function checkLearningEffectiveness() {
  const metrics = {};

  const metricsPath = path.join(ROOT_DIR, "docs", "LEARNING_METRICS.md");
  let content;
  try {
    content = fs.readFileSync(metricsPath, "utf8");
  } catch {
    return { metrics: {}, no_data: true };
  }

  const effectivenessMatch = content.match(/Learning Effectiveness\s*\|\s*([\d.]+)%/);
  const failingMatch = content.match(/Patterns Failing\s*\|\s*(\d+)/);
  const automationMatch = content.match(/Automation Coverage\s*\|\s*([\d.]+)%/);
  const learnedMatch = content.match(/Patterns Learned\s*\|\s*(\d+)/);
  const criticalMatch = content.match(/Critical Pattern Success\s*\|\s*([\d.]+)%/);

  const effectiveness = effectivenessMatch ? parseFloat(effectivenessMatch[1]) : null;
  const failing = failingMatch ? parseInt(failingMatch[1], 10) : 0;
  const automationCoverage = automationMatch ? parseFloat(automationMatch[1]) : null;
  const learned = learnedMatch ? parseInt(learnedMatch[1], 10) : 0;
  const criticalSuccess = criticalMatch ? parseFloat(criticalMatch[1]) : null;

  if (effectiveness !== null) {
    metrics.effectiveness = {
      value: effectiveness,
      ...scoreMetric(effectiveness, BENCHMARKS.effectiveness, "higher-is-better"),
      benchmark: BENCHMARKS.effectiveness,
    };
  }

  if (automationCoverage !== null) {
    metrics.automation_coverage = {
      value: automationCoverage,
      ...scoreMetric(automationCoverage, BENCHMARKS.automation_coverage, "higher-is-better"),
      benchmark: BENCHMARKS.automation_coverage,
    };
  }

  metrics.failing_patterns = {
    value: failing,
    ...scoreMetric(failing, BENCHMARKS.failing_patterns),
    benchmark: BENCHMARKS.failing_patterns,
  };

  metrics.learned_count = {
    value: learned,
    ...scoreMetric(learned, BENCHMARKS.learned_count, "higher-is-better"),
    benchmark: BENCHMARKS.learned_count,
  };

  if (criticalSuccess !== null) {
    metrics.critical_success = {
      value: criticalSuccess,
      ...scoreMetric(criticalSuccess, BENCHMARKS.critical_success, "higher-is-better"),
      benchmark: BENCHMARKS.critical_success,
    };
  }

  const hasData = Object.keys(metrics).length > 0;
  return { metrics, no_data: !hasData };
}

module.exports = { checkLearningEffectiveness };
