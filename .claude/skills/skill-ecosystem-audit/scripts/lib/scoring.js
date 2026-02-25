/* eslint-disable no-undef */

/**
 * Scoring utilities for Skill Ecosystem Audit
 *
 * Provides metric scoring, grade calculation, sparkline generation,
 * trend computation, and composite score aggregation.
 *
 * Forked from hook-ecosystem-audit/scripts/lib/scoring.js — same logic,
 * re-exported here so the skill audit is self-contained.
 */

"use strict";

/**
 * Score a metric against good/average/poor benchmarks.
 * @param {number} value - The metric value
 * @param {{ good: number, average: number, poor: number }} benchmark
 * @param {'lower-is-better'|'higher-is-better'} direction
 * @returns {{ score: number, rating: 'good'|'average'|'poor' }}
 */
function scoreMetric(value, benchmark, direction = "lower-is-better") {
  if (typeof value !== "number" || isNaN(value)) {
    return { score: 0, rating: "poor" };
  }

  let rating;
  let score;

  if (direction === "lower-is-better") {
    if (value <= benchmark.good) {
      rating = "good";
      score = 100;
    } else if (value <= benchmark.average) {
      rating = "average";
      const range = benchmark.average - benchmark.good;
      const offset = value - benchmark.good;
      score = range > 0 ? Math.round(80 - (offset / range) * 20) : 80;
    } else {
      rating = "poor";
      const range = benchmark.poor - benchmark.average;
      const offset = value - benchmark.average;
      score = range > 0 ? Math.max(0, Math.round(60 - (offset / range) * 60)) : 0;
    }
  } else {
    // higher-is-better
    if (value >= benchmark.good) {
      rating = "good";
      score = 100;
    } else if (value >= benchmark.average) {
      rating = "average";
      const range = benchmark.good - benchmark.average;
      const offset = value - benchmark.average;
      score = range > 0 ? Math.round(80 + (offset / range) * 20) : 80;
    } else {
      rating = "poor";
      const range = benchmark.average - benchmark.poor;
      const offset = value - benchmark.poor;
      score = range > 0 ? Math.max(0, Math.round((offset / range) * 60)) : 0;
    }
  }

  return { score: Math.max(0, Math.min(100, score)), rating };
}

/**
 * Compute letter grade from 0-100 score.
 * @param {number} score
 * @returns {'A'|'B'|'C'|'D'|'F'}
 */
function computeGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Generate sparkline string from values array.
 * @param {number[]} values
 * @returns {string}
 */
function sparkline(values) {
  if (!values || values.length === 0) return "";
  const min = values.reduce((a, b) => (b < a ? b : a), values[0] ?? 0);
  const max = values.reduce((a, b) => (b > a ? b : a), values[0] ?? 0);
  const range = max - min || 1;
  const chars = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
  return values.map((v) => chars[Math.min(7, Math.floor(((v - min) / range) * 7))]).join("");
}

/**
 * Compute trend direction and magnitude from historical values.
 * @param {number[]} values - Historical values (oldest first)
 * @param {number} windowSize - Number of recent entries to consider
 * @returns {{ direction: 'improving'|'declining'|'stable', delta: number, deltaPercent: number, sparkline: string }|null}
 */
function computeTrend(values, windowSize = 5) {
  if (!values || values.length < 2) return null;

  const recent = values.slice(-windowSize);
  if (recent.length < 2) return null;

  const first = recent[0];
  const last = recent[recent.length - 1];
  const delta = last - first;
  const deltaPercent =
    first !== 0 ? Math.round((delta / first) * 100) : delta !== 0 ? (delta > 0 ? 100 : -100) : 0;

  let direction;
  if (Math.abs(deltaPercent) < 5) {
    direction = "stable";
  } else if (delta > 0) {
    direction = "improving";
  } else {
    direction = "declining";
  }

  return { direction, delta, deltaPercent, sparkline: sparkline(recent) };
}

/**
 * Compute weighted composite score from category scores.
 * @param {Object<string, { score: number }>} categoryScores
 * @param {Object<string, number>} weights
 * @returns {{ score: number, grade: string, breakdown: Object }}
 */
function compositeScore(categoryScores, weights) {
  let totalWeight = 0;
  let weightedSum = 0;
  const breakdown = {};

  for (const [cat, weight] of Object.entries(weights)) {
    const catScore = categoryScores[cat];
    if (catScore && typeof catScore.score === "number") {
      weightedSum += catScore.score * weight;
      totalWeight += weight;
      breakdown[cat] = {
        score: catScore.score,
        weight,
        contribution: Math.round(catScore.score * weight),
      };
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { score, grade: computeGrade(score), breakdown };
}

/**
 * Compute impact score for a finding (severity x frequency x blast-radius).
 * @param {{ severity: string, frequency?: number, blastRadius?: number }} finding
 * @returns {number} 0-100 impact score
 */
function impactScore(finding) {
  const severityWeights = { error: 1.0, warning: 0.6, info: 0.3 };
  const sevWeight = severityWeights[finding.severity] || 0.3;
  const freq = Math.min(1.0, (finding.frequency || 1) / 10);
  const blast = Math.min(1.0, (finding.blastRadius || 1) / 5);

  return Math.round(sevWeight * 40 + freq * 30 + blast * 30);
}

module.exports = {
  scoreMetric,
  computeGrade,
  sparkline,
  computeTrend,
  compositeScore,
  impactScore,
};
