/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Scoring Pipeline Integrity — Domain 2 (D2)
 *
 * 4 categories:
 *   1. composite_weight_validation — Weights sum to 1.0, correct per-category
 *   2. missing_data_handling — no_data vs zero vs NaN
 *   3. metric_direction_consistency — higher/lower-is-better correctness
 *   4. category_to_dimension_mapping — 13 dimensions map to correct fields
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[scoring-pipeline] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "scoring_pipeline";
const MAX_FILE_SIZE = 1 * 1024 * 1024;

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const healthLibDir = path.join(rootDir, "scripts", "health", "lib");
  const scoringPath = path.join(healthLibDir, "scoring.js");
  const compositePath = path.join(healthLibDir, "composite.js");
  const dimensionsPath = path.join(healthLibDir, "dimensions.js");

  const scoringContent = safeReadFile(scoringPath);
  const compositeContent = safeReadFile(compositePath);
  const dimensionsContent = safeReadFile(dimensionsPath);

  scores.composite_weight_validation = checkWeightValidation(
    compositePath,
    compositeContent,
    findings
  );
  scores.missing_data_handling = checkMissingDataHandling(
    scoringContent,
    compositeContent,
    findings
  );
  scores.metric_direction_consistency = checkDirectionConsistency(rootDir, findings);
  scores.category_to_dimension_mapping = checkDimensionMapping(
    dimensionsContent,
    compositeContent,
    findings
  );

  return { domain: DOMAIN, findings, scores };
}

// -- Category 1: Composite Weight Validation ---------------------------------

function checkWeightValidation(compositePath, compositeContent, findings) {
  const bench = BENCHMARKS.composite_weight_validation;

  if (!compositeContent) {
    findings.push({
      id: "HMS-200",
      category: "composite_weight_validation",
      domain: DOMAIN,
      severity: "error",
      message: "composite.js not found or empty",
      details: "Cannot validate category weights without composite scoring module.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: { weightSum: 0, deviation: 1 } };
  }

  // Extract weight values
  const weightBlock = compositeContent.match(/CATEGORY_WEIGHTS\s*=\s*\{([^}]+)\}/s);
  let weightSum = 0;
  let weightCount = 0;

  if (weightBlock) {
    const nums = weightBlock[1].match(/:\s*(0\.\d+)/g);
    if (nums) {
      for (const n of nums) {
        weightSum += parseFloat(n.replace(/^:\s*/, ""));
        weightCount++;
      }
    }
  }

  const deviation = Math.abs(weightSum - 1.0);

  if (deviation > 0.01) {
    findings.push({
      id: "HMS-201",
      category: "composite_weight_validation",
      domain: DOMAIN,
      severity: "error",
      message: `Category weights sum to ${weightSum.toFixed(4)} (deviation: ${deviation.toFixed(4)})`,
      details: `Expected weights to sum to 1.0. ${weightCount} categories found. Composite score will be skewed.`,
      impactScore: 85,
      frequency: 1,
      blastRadius: 4,
      patchType: "fix_weight",
      patchTarget: compositePath,
    });
  }

  const result = scoreMetric(deviation, bench.weight_sum_deviation, "lower-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      weightSum: Math.round(weightSum * 1000) / 1000,
      weightCount,
      deviation: Math.round(deviation * 1000) / 1000,
    },
  };
}

// -- Category 2: Missing Data Handling ---------------------------------------

function checkMissingDataHandling(scoringContent, compositeContent, findings) {
  const bench = BENCHMARKS.missing_data_handling;
  let totalChecks = 0;
  let gracefulChecks = 0;

  // Check scoring.js: does scoreMetric handle NaN/undefined?
  if (scoringContent) {
    totalChecks++;
    if (/isNaN|Number\.isNaN|typeof\s+value\s*!==\s*['"]number['"]/.test(scoringContent)) {
      gracefulChecks++;
    } else {
      findings.push({
        id: "HMS-210",
        category: "missing_data_handling",
        domain: DOMAIN,
        severity: "warning",
        message: "scoring.js scoreMetric does not check for NaN input",
        details: "NaN values will produce incorrect scores instead of returning no_data.",
        impactScore: 65,
        frequency: 1,
        blastRadius: 3,
      });
    }
  }

  // Check composite.js: does it handle no_data from checkers?
  if (compositeContent) {
    totalChecks++;
    if (/no_data/.test(compositeContent)) {
      gracefulChecks++;
    } else {
      findings.push({
        id: "HMS-211",
        category: "missing_data_handling",
        domain: DOMAIN,
        severity: "warning",
        message: "composite.js does not check for no_data from checkers",
        details: "Missing checkers will produce 0 scores instead of being excluded from composite.",
        impactScore: 70,
        frequency: 1,
        blastRadius: 3,
      });
    }

    // Check: does compositeScore skip no_data categories?
    totalChecks++;
    if (/no_data.*continue|skip.*no_data|!.*no_data/.test(compositeContent)) {
      gracefulChecks++;
    } else {
      findings.push({
        id: "HMS-212",
        category: "missing_data_handling",
        domain: DOMAIN,
        severity: "info",
        message: "composite.js may not skip no_data categories in weighted average",
        details: "Categories without data could drag down composite score.",
        impactScore: 45,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const gracefulPct = totalChecks > 0 ? Math.round((gracefulChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(gracefulPct, bench.graceful_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, gracefulChecks, gracefulPct },
  };
}

// -- Category 3: Metric Direction Consistency --------------------------------

function checkDirectionConsistency(rootDir, findings) {
  const bench = BENCHMARKS.metric_direction_consistency;
  let totalMetrics = 0;
  let consistentMetrics = 0;

  // Scan health checker files for scoreMetric calls and verify direction param
  const checkersDir = path.join(rootDir, "scripts", "health", "checkers");
  const checkerFiles = [];
  try {
    for (const name of fs.readdirSync(checkersDir)) {
      if (name.endsWith(".js") && !name.includes("__tests__")) {
        const resolved = path.join(checkersDir, name);
        const rel = path.relative(checkersDir, resolved);
        if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
        const content = safeReadFile(resolved);
        if (content) checkerFiles.push({ name, resolvedPath: resolved, content });
      }
    }
  } catch {
    // Directory not accessible
  }

  // Known metric names and their expected directions
  const knownDirections = {
    errors: "lower-is-better",
    warnings: "lower-is-better",
    violations: "lower-is-better",
    count: "lower-is-better",
    rate: "higher-is-better",
    coverage: "higher-is-better",
    score: "higher-is-better",
    pct: "higher-is-better",
    avg_age: "lower-is-better",
    staleness: "lower-is-better",
  };

  // Look for scoreMetric calls with direction parameter
  const scoreCallPattern = /scoreMetric\s*\([^,]+,\s*[^,]+,\s*["']([^"']+)["']\)/g;

  for (const file of checkerFiles) {
    for (const match of file.content.matchAll(scoreCallPattern)) {
      totalMetrics++;
      const direction = match[1];

      // Check if it looks correct based on context
      const context = file.content.slice(
        Math.max(0, match.index - 100),
        match.index + match[0].length
      );
      const metricName = context.match(/(\w+)\s*[,)]/)?.[1] || "";

      let expectedDirection = null;
      for (const [key, dir] of Object.entries(knownDirections)) {
        if (metricName.toLowerCase().includes(key)) {
          expectedDirection = dir;
          break;
        }
      }

      if (expectedDirection && direction !== expectedDirection) {
        findings.push({
          id: "HMS-220",
          category: "metric_direction_consistency",
          domain: DOMAIN,
          severity: "warning",
          message: `Possible direction mismatch in ${file.name}: "${direction}" for metric "${metricName}"`,
          details: `Expected "${expectedDirection}" based on metric name convention.`,
          impactScore: 60,
          frequency: 1,
          blastRadius: 3,
          patchType: "fix_direction",
          patchTarget: file.resolvedPath,
        });
      } else {
        consistentMetrics++;
      }
    }
  }

  const consistentPct =
    totalMetrics > 0 ? Math.round((consistentMetrics / totalMetrics) * 100) : 100;
  const result = scoreMetric(consistentPct, bench.consistent_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalMetrics, consistentMetrics, consistentPct },
  };
}

// -- Category 4: Category-to-Dimension Mapping -------------------------------

function checkDimensionMapping(dimensionsContent, compositeContent, findings) {
  const bench = BENCHMARKS.category_to_dimension_mapping;
  let totalMappings = 0;
  let validMappings = 0;

  if (!dimensionsContent || !compositeContent) {
    if (!dimensionsContent) {
      findings.push({
        id: "HMS-230",
        category: "category_to_dimension_mapping",
        domain: DOMAIN,
        severity: "error",
        message: "dimensions.js not found",
        details: "Cannot validate dimension-to-checker mapping without dimensions module.",
        impactScore: 75,
        frequency: 1,
        blastRadius: 4,
      });
    }
    return {
      score: 0,
      rating: "poor",
      metrics: { totalMappings: 0, validMappings: 0, validPct: 0 },
    };
  }

  // Extract checker field references from dimensions
  const checkerFieldPattern = /checkerField:\s*["']([^"']+)["']/g;
  const checkerFields = new Set();
  for (const match of dimensionsContent.matchAll(checkerFieldPattern)) {
    checkerFields.add(match[1]);
    totalMappings++;
  }

  // Extract checker names from composite CHECKER_TO_CATEGORY
  const checkerToCatPattern = /["']([^"']+)["']\s*:\s*["']([^"']+)["']/g;
  const compositeCheckers = new Set();
  const checkerSection = compositeContent.match(/CHECKER_TO_CATEGORY\s*=\s*\{([^}]+)\}/s);
  if (checkerSection) {
    for (const match of checkerSection[1].matchAll(checkerToCatPattern)) {
      compositeCheckers.add(match[1]);
    }
  }

  // Validate each dimension's checkerField exists in CHECKER_TO_CATEGORY
  for (const field of checkerFields) {
    if (compositeCheckers.has(field)) {
      validMappings++;
    } else {
      findings.push({
        id: "HMS-231",
        category: "category_to_dimension_mapping",
        domain: DOMAIN,
        severity: "warning",
        message: `Dimension references checker "${field}" not in CHECKER_TO_CATEGORY`,
        details: "Dimension drill-down will fail or show no data for this checker.",
        impactScore: 55,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const validPct = totalMappings > 0 ? Math.round((validMappings / totalMappings) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalMappings, validMappings, validPct },
  };
}

module.exports = { run, DOMAIN };
