/**
 * Composite scoring engine for Health Check system
 *
 * Aggregates metrics from 10 checkers into 8 weighted categories
 * with 13 drill-down dimensions.
 */

"use strict";

const { compositeScore, computeGrade } = require("./scoring");
const { DIMENSIONS, getDimensionDetail } = require("./dimensions");

/**
 * Category weights (must sum to ~1.0)
 */
const CATEGORY_WEIGHTS = {
  "Code Quality": 0.18,
  Security: 0.15,
  "Technical Debt": 0.14,
  Infrastructure: 0.12,
  "Process & Workflow": 0.11,
  Testing: 0.1,
  "Learning & Patterns": 0.1,
  Documentation: 0.1,
};

/**
 * Map checker names to categories
 */
const CHECKER_TO_CATEGORY = {
  "code-quality": "Code Quality",
  security: "Security",
  "debt-health": "Technical Debt",
  "test-coverage": "Testing",
  "learning-effectiveness": "Learning & Patterns",
  "hook-pipeline": "Infrastructure",
  "session-management": "Infrastructure",
  documentation: "Documentation",
  "pattern-enforcement": "Learning & Patterns",
  "ecosystem-integration": "Process & Workflow",
};

/**
 * Compute composite score from all checker results
 * @param {Object} checkerResults - Raw output from all 10 checkers, keyed by checker name
 * @returns {{ score: number, grade: string, categoryScores: Object, dimensionScores: Object }}
 */
function computeCompositeScore(checkerResults) {
  // Aggregate metrics into categories
  const categoryMetrics = {};

  for (const [checkerName, result] of Object.entries(checkerResults)) {
    const category = CHECKER_TO_CATEGORY[checkerName];
    if (!category) continue;

    if (!categoryMetrics[category]) {
      categoryMetrics[category] = { scores: [], metrics: [], no_data: true };
    }

    if (result && !result.no_data && result.metrics) {
      categoryMetrics[category].no_data = false;
      for (const [metricName, metric] of Object.entries(result.metrics)) {
        if (typeof metric.score === "number") {
          categoryMetrics[category].scores.push(metric.score);
          categoryMetrics[category].metrics.push({
            name: metricName,
            ...metric,
          });
        }
      }
    }
  }

  // Compute category scores (average of all metric scores in category)
  const categoryScores = {};
  for (const [category] of Object.entries(CATEGORY_WEIGHTS)) {
    const catData = categoryMetrics[category];
    if (!catData || catData.no_data || catData.scores.length === 0) {
      categoryScores[category] = {
        score: 0,
        grade: "F",
        no_data: true,
        metrics: [],
      };
    } else {
      const avg = Math.round(catData.scores.reduce((a, b) => a + b, 0) / catData.scores.length);
      categoryScores[category] = {
        score: avg,
        grade: computeGrade(avg),
        metrics: catData.metrics,
      };
    }
  }

  // Compute weighted composite using scoring.js compositeScore
  // It automatically skips categories without valid scores (no_data)
  const result = compositeScore(categoryScores, CATEGORY_WEIGHTS);

  // Compute dimension scores
  const dimensionScores = {};
  for (const dim of DIMENSIONS) {
    const detail = getDimensionDetail(dim.id, checkerResults);
    if (detail) {
      dimensionScores[dim.id] = {
        score: detail.score,
        grade: detail.grade,
        detail: detail.metrics,
        no_data: detail.no_data || false,
      };
    }
  }

  return {
    score: result.score,
    grade: result.grade,
    categoryScores,
    dimensionScores,
  };
}

module.exports = { computeCompositeScore, CATEGORY_WEIGHTS, CHECKER_TO_CATEGORY };
