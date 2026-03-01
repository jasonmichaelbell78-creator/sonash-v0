/* eslint-disable no-undef */

/**
 * Documentation Health Checker
 *
 * Metrics: staleness_days, misplaced_docs, broken_links,
 *          crossdoc_issues, canon_issues, doc_count,
 *          freshness_score, coverage_estimate
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, runCommandSafe } = require("../lib/utils");

const BENCHMARKS = {
  staleness_days: { good: 3, average: 7, poor: 14 },
  misplaced_docs: { good: 0, average: 2, poor: 5 },
  broken_links: { good: 0, average: 3, poor: 10 },
  crossdoc_issues: { good: 0, average: 1, poor: 3 },
  canon_issues: { good: 0, average: 2, poor: 5 },
  doc_count: { good: 20, average: 10, poor: 5 },
  freshness_score: { good: 90, average: 70, poor: 50 },
  coverage_estimate: { good: 80, average: 60, poor: 40 },
};

function checkDocumentation() {
  const metrics = {};

  // SESSION_CONTEXT.md staleness
  const sessionContextPath = path.join(ROOT_DIR, "docs", "SESSION_CONTEXT.md");
  let stalenessDays = 30;
  try {
    const stats = fs.statSync(sessionContextPath);
    stalenessDays = Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24));
  } catch {
    // File doesn't exist - heavily stale
  }
  metrics.staleness_days = {
    value: stalenessDays,
    ...scoreMetric(stalenessDays, BENCHMARKS.staleness_days),
    benchmark: BENCHMARKS.staleness_days,
  };

  // CANON validation
  let canonIssues = 0;
  const canonResult = runCommandSafe("npm", ["run", "validate:canon"], { timeout: 60000 });
  const canonOutput = `${canonResult.output || ""}\n${canonResult.stderr || ""}`;
  if (!canonResult.success) {
    const m = canonOutput.match(/(\d+)\s+issue/i);
    canonIssues = m ? parseInt(m[1], 10) : 1;
  }
  metrics.canon_issues = {
    value: canonIssues,
    ...scoreMetric(canonIssues, BENCHMARKS.canon_issues),
    benchmark: BENCHMARKS.canon_issues,
  };

  // Cross-doc dependencies
  let crossdocIssues = 0;
  const crossdocResult = runCommandSafe("npm", ["run", "crossdoc:check"], { timeout: 60000 });
  const crossdocOutput = `${crossdocResult.output || ""}\n${crossdocResult.stderr || ""}`;
  if (!crossdocResult.success && crossdocOutput.includes("Missing")) {
    const m = crossdocOutput.match(/(\d+)\s+(?:missing|issue)/i);
    crossdocIssues = m ? parseInt(m[1], 10) : 1;
  }
  metrics.crossdoc_issues = {
    value: crossdocIssues,
    ...scoreMetric(crossdocIssues, BENCHMARKS.crossdoc_issues),
    benchmark: BENCHMARKS.crossdoc_issues,
  };

  // Doc placement
  let misplaced = 0;
  const placementResult = runCommandSafe("npm", ["run", "docs:placement"], { timeout: 60000 });
  const placementOutput = `${placementResult.output || ""}\n${placementResult.stderr || ""}`;
  if (!placementResult.success) {
    const m = placementOutput.match(/(\d+)\s+misplaced/i);
    misplaced = m ? parseInt(m[1], 10) : 0;
  }
  metrics.misplaced_docs = {
    value: misplaced,
    ...scoreMetric(misplaced, BENCHMARKS.misplaced_docs),
    benchmark: BENCHMARKS.misplaced_docs,
  };

  // External links
  let brokenLinks = 0;
  const linksResult = runCommandSafe("npm", ["run", "docs:external-links"], { timeout: 60000 });
  const linksOutput = `${linksResult.output || ""}\n${linksResult.stderr || ""}`;
  if (!linksResult.success) {
    const m = linksOutput.match(/(\d+)\s+broken/i);
    brokenLinks = m ? parseInt(m[1], 10) : 0;
  }
  metrics.broken_links = {
    value: brokenLinks,
    ...scoreMetric(brokenLinks, BENCHMARKS.broken_links),
    benchmark: BENCHMARKS.broken_links,
  };

  // Doc count (estimate from docs/ directory)
  let docCount = 0;
  try {
    const docsDir = path.join(ROOT_DIR, "docs");
    const countFiles = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith(".md")) docCount++;
          if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
        }
      } catch {
        // skip unreadable dirs
      }
    };
    countFiles(docsDir);
  } catch {
    // docs dir missing
  }
  metrics.doc_count = {
    value: docCount,
    ...scoreMetric(docCount, BENCHMARKS.doc_count, "higher-is-better"),
    benchmark: BENCHMARKS.doc_count,
  };

  // Freshness score (composite)
  const freshnessScore = Math.max(0, 100 - stalenessDays * 5);
  metrics.freshness_score = {
    value: freshnessScore,
    ...scoreMetric(freshnessScore, BENCHMARKS.freshness_score, "higher-is-better"),
    benchmark: BENCHMARKS.freshness_score,
  };

  // Coverage estimate
  const coverageEst = Math.min(100, Math.round((docCount / 25) * 100));
  metrics.coverage_estimate = {
    value: coverageEst,
    ...scoreMetric(coverageEst, BENCHMARKS.coverage_estimate, "higher-is-better"),
    benchmark: BENCHMARKS.coverage_estimate,
  };

  return { metrics, no_data: false };
}

module.exports = { checkDocumentation };
