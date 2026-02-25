/* eslint-disable no-undef */
/**
 * Scoring utilities for Doc Ecosystem Audit
 *
 * Provides metric scoring, grade calculation, sparkline generation,
 * trend computation, and composite score aggregation.
 *
 * Forked from hook-ecosystem-audit — same logic.
 */
"use strict";

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

function computeGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function sparkline(values) {
  if (!values || values.length === 0) return "";
  const min = values.reduce((a, b) => (b < a ? b : a), values[0] ?? 0);
  const max = values.reduce((a, b) => (b > a ? b : a), values[0] ?? 0);
  const range = max - min || 1;
  const chars = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
  return values.map((v) => chars[Math.min(7, Math.floor(((v - min) / range) * 7))]).join("");
}

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
  if (Math.abs(deltaPercent) < 5) direction = "stable";
  else if (delta > 0) direction = "improving";
  else direction = "declining";
  return { direction, delta, deltaPercent, sparkline: sparkline(recent) };
}

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
