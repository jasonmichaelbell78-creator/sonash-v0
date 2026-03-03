/* eslint-disable no-undef */

/**
 * Scoring utilities for Hook Ecosystem Audit.
 *
 * Provides score computation, grading, trend analysis, and composite scoring
 * for multi-category health audits.
 */

'use strict';

/**
 * Score a metric value against benchmark thresholds.
 *
 * @param {number} value - The measured value (0-100 for percentages, raw for counts)
 * @param {{ good: number, average: number, poor: number, direction: string }} bench
 * @param {"higher-is-better"|"lower-is-better"} direction
 * @returns {{ score: number, rating: "good"|"average"|"poor" }}
 */
// eslint-disable-next-line complexity -- audit checker with many branches
function scoreMetric(value, bench, direction) {
  const dir = bench.direction || direction || 'higher-is-better';

  let rating;
  if (dir === 'higher-is-better') {
    if (value >= bench.good) rating = 'good';
    else if (value >= bench.average) rating = 'average';
    else rating = 'poor';
  } else {
    // lower-is-better
    if (value <= bench.good) rating = 'good';
    else if (value <= bench.average) rating = 'average';
    else rating = 'poor';
  }

  // Map rating to 0-100 score
  let score;
  if (dir === 'higher-is-better') {
    if (value >= bench.good) {
      // good → 90-100
      const range = 100 - bench.good;
      score = range > 0 ? 90 + Math.round(((value - bench.good) / range) * 10) : 100;
    } else if (value >= bench.average) {
      // average → 70-89
      const range = bench.good - bench.average;
      score = range > 0 ? 70 + Math.round(((value - bench.average) / range) * 19) : 80;
    } else {
      // poor → 0-69
      const range = bench.average - bench.poor;
      const base = range > 0 ? Math.round(((value - bench.poor) / range) * 69) : 35;
      score = Math.max(0, base);
    }
  } else {
    // lower-is-better
    if (value <= bench.good) {
      // good → 90-100
      score = 100;
    } else if (value <= bench.average) {
      const range = bench.average - bench.good;
      score = range > 0 ? 70 + Math.round(((bench.average - value) / range) * 19) : 80;
    } else {
      const range = bench.poor - bench.average;
      const base = range > 0 ? Math.round(((bench.poor - value) / range) * 69) : 35;
      score = Math.max(0, Math.min(69, base));
    }
  }

  return { score: Math.min(100, Math.max(0, score)), rating };
}

/**
 * Convert a numeric score (0-100) to a letter grade.
 * @param {number} score
 * @returns {string} "A"-"F"
 */
function computeGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate a sparkline string from a series of numeric scores.
 * @param {number[]} values
 * @returns {string}
 */
function sparkline(values) {
  if (!values || values.length === 0) return '';
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => chars[Math.min(7, Math.floor(((v - min) / range) * 7))]).join('');
}

/**
 * Compute trend direction and delta from a series of values.
 * @param {number[]} values - ordered oldest to newest
 * @returns {{ direction: "up"|"down"|"stable", delta: number, sparkline: string }}
 */
function computeTrend(values) {
  if (!values || values.length < 2) {
    return { direction: 'stable', delta: 0, sparkline: sparkline(values || []) };
  }

  const recent = values[values.length - 1];
  const previous = values[values.length - 2];
  const delta = recent - previous;

  let direction;
  if (Math.abs(delta) <= 2) direction = 'stable';
  else if (delta > 0) direction = 'up';
  else direction = 'down';

  return { direction, delta: Math.round(delta), sparkline: sparkline(values) };
}

/**
 * Compute a weighted composite score across all categories.
 *
 * @param {Record<string, { score: number, rating: string }>} categoryScores
 * @param {Record<string, number>} weights - must sum to 1.0
 * @returns {{ score: number, grade: string, breakdown: Record<string, number> }}
 */
function compositeScore(categoryScores, weights) {
  let totalWeight = 0;
  let weightedSum = 0;
  const breakdown = {};

  for (const [cat, weight] of Object.entries(weights)) {
    const catScore = categoryScores[cat];
    if (catScore && typeof catScore.score === 'number') {
      weightedSum += catScore.score * weight;
      totalWeight += weight;
      breakdown[cat] = catScore.score;
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { score, grade: computeGrade(score), breakdown };
}

/**
 * Compute a rough impact score for a finding, used when one isn't explicitly set.
 * @param {{ severity: string, frequency?: number, blastRadius?: number }} finding
 * @returns {number} 0-100
 */
function impactScore(finding) {
  const base = finding.severity === 'error' ? 70 : finding.severity === 'warning' ? 45 : 20;
  const freqBonus = Math.min(20, Math.floor((finding.frequency || 1) * 2));
  const radiusBonus = Math.min(10, (finding.blastRadius || 1) * 2);
  return Math.min(100, base + freqBonus + radiusBonus);
}

module.exports = {
  scoreMetric,
  computeGrade,
  sparkline,
  computeTrend,
  compositeScore,
  impactScore,
};
