#!/usr/bin/env node

/**
 * Ecosystem Health Check Runner
 *
 * Executes health check scripts, computes composite score,
 * and outputs formatted results.
 *
 * Usage:
 *   node scripts/health/run-health-check.js               # Full check, text output
 *   node scripts/health/run-health-check.js --quick        # Fast subset only
 *   node scripts/health/run-health-check.js --json         # JSON output
 *   node scripts/health/run-health-check.js --dimension=ID # Drill into dimension
 */

"use strict";

const { computeCompositeScore } = require("./lib/composite");
const { getDimensionDetail, DIMENSIONS } = require("./lib/dimensions");
const { computeGrade } = require("./lib/scoring");

// All 11 checkers
const { checkCodeQuality } = require("./checkers/code-quality");
const { checkSecurity } = require("./checkers/security");
const { checkDebtHealth } = require("./checkers/debt-health");
const { checkTestCoverage } = require("./checkers/test-coverage");
const { checkLearningEffectiveness } = require("./checkers/learning-effectiveness");
const { checkHookPipeline } = require("./checkers/hook-pipeline");
const { checkSessionManagement } = require("./checkers/session-management");
const { checkDocumentation } = require("./checkers/documentation");
const { checkPatternEnforcement } = require("./checkers/pattern-enforcement");
const { checkEcosystemIntegration } = require("./checkers/ecosystem-integration");
const { checkDataEffectiveness } = require("./checkers/data-effectiveness");

const ALL_CHECKERS = {
  "code-quality": { fn: checkCodeQuality, quick: true, label: "Code Quality" },
  security: { fn: checkSecurity, quick: true, label: "Security" },
  "debt-health": { fn: checkDebtHealth, quick: true, label: "Debt Health" },
  "test-coverage": { fn: checkTestCoverage, quick: true, label: "Test Coverage" },
  "learning-effectiveness": {
    fn: checkLearningEffectiveness,
    quick: false,
    label: "Learning Effectiveness",
  },
  "hook-pipeline": { fn: checkHookPipeline, quick: false, label: "Hook Pipeline" },
  "session-management": { fn: checkSessionManagement, quick: false, label: "Session Management" },
  documentation: { fn: checkDocumentation, quick: false, label: "Documentation" },
  "pattern-enforcement": {
    fn: checkPatternEnforcement,
    quick: false,
    label: "Pattern Enforcement",
  },
  "ecosystem-integration": {
    fn: checkEcosystemIntegration,
    quick: false,
    label: "Ecosystem Integration",
  },
  "data-effectiveness": {
    fn: checkDataEffectiveness,
    quick: false,
    label: "Data Effectiveness",
  },
};

function main() {
  const args = process.argv.slice(2);
  const isQuick = args.includes("--quick");
  const isJson = args.includes("--json");
  const dimensionArg = args.find((a) => a.startsWith("--dimension="));
  const dimensionId = dimensionArg ? dimensionArg.split("=")[1] : null;

  const mode = isQuick ? "quick" : "full";
  console.error(`Ecosystem Health Check (${mode} mode)`);
  console.error("=".repeat(40));

  // Run checkers
  const checkerResults = {};
  for (const [name, checker] of Object.entries(ALL_CHECKERS)) {
    if (isQuick && !checker.quick) {
      console.error(`  Skipping ${checker.label} (quick mode)`);
      continue;
    }

    console.error(`  Running ${checker.label}...`);
    try {
      checkerResults[name] = checker.fn();
    } catch (err) {
      console.error(
        `  [error] ${checker.label} failed: ${(err instanceof Error ? err.message : String(err)) || err}`
      );
      checkerResults[name] = { metrics: {}, no_data: true };
    }
  }

  // Compute composite
  const composite = computeCompositeScore(checkerResults);

  // Handle dimension drill-down
  if (dimensionId) {
    const detail = getDimensionDetail(dimensionId, checkerResults);
    if (!detail) {
      console.error(`Unknown dimension: ${dimensionId}`);
      console.error(`Available: ${DIMENSIONS.map((d) => d.id).join(", ")}`);
      process.exit(1);
    }

    if (isJson) {
      console.log(JSON.stringify(detail, null, 2));
    } else {
      console.log("");
      console.log(`Dimension: ${detail.dimension.name} (${detail.dimension.id})`);
      console.log(`Category: ${detail.dimension.category}`);
      console.log(`Score: ${detail.grade} (${detail.score}/100)`);
      console.log(`Description: ${detail.dimension.description}`);
      console.log("");

      if (detail.no_data) {
        console.log("  No data available for this dimension.");
      } else {
        console.log("  Metrics:");
        for (const [key, metric] of Object.entries(detail.metrics)) {
          const benchmark = metric.benchmark || {};
          console.log(
            `    ${key.padEnd(25)} ${String(metric.value).padStart(6)}  ${metric.rating.padEnd(8)} (score: ${metric.score})`
          );
          if (benchmark.good !== undefined) {
            console.log(
              `      benchmark: good=${benchmark.good} avg=${benchmark.average} poor=${benchmark.poor}`
            );
          }
        }
      }
    }
    return;
  }

  // Build output
  const output = {
    timestamp: new Date().toISOString(),
    mode,
    score: composite.score,
    grade: composite.grade,
    categoryScores: composite.categoryScores,
    dimensionScores: composite.dimensionScores,
    checkerResults,
  };

  if (isJson) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Text output
  console.log("");
  console.log("Ecosystem Health Report");
  console.log("=======================");
  console.log(`Composite: ${composite.grade} (${composite.score}/100)`);
  console.log("");
  console.log("Category Scores:");

  const sortedCats = Object.entries(composite.categoryScores).sort(
    ([, a], [, b]) => (b.score ?? 0) - (a.score ?? 0)
  );

  for (const [cat, data] of sortedCats) {
    const noData = data.no_data ? " (no data)" : "";
    const scoreStr = data.no_data ? "--" : String(data.score).padStart(3);
    console.log(`  ${cat.padEnd(22)} ${(data.grade || "-").padEnd(2)} (${scoreStr})${noData}`);
  }

  // Show dimensions with issues (score < 70)
  const problemDims = Object.entries(composite.dimensionScores)
    .filter(([, d]) => !d.no_data && d.score < 70)
    .sort(([, a], [, b]) => a.score - b.score);

  if (problemDims.length > 0) {
    console.log("");
    console.log("Dimensions with issues:");
    for (const [dimId, data] of problemDims) {
      const dim = DIMENSIONS.find((d) => d.id === dimId);
      const name = dim ? dim.name : dimId;
      console.log(`  ${name.padEnd(25)} ${data.grade}  (${data.score})`);
    }
  }

  console.log("");
  console.log(
    `Mode: ${mode} | Checkers: ${Object.keys(checkerResults).length}/${Object.keys(ALL_CHECKERS).length}`
  );
}

main();
