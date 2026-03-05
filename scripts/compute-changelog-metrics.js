#!/usr/bin/env node
/**
 * Compute Changelog Metrics — auto-compute review metrics from reviews.jsonl.
 *
 * Prevents manual calculation errors (PR #414 had 3/8 wrong).
 * Reads from data/ecosystem-v2/reviews.jsonl and computes per-PR and aggregate metrics.
 *
 * Usage:
 *   node scripts/compute-changelog-metrics.js --pr 395
 *   node scripts/compute-changelog-metrics.js --range 378-416
 *   node scripts/compute-changelog-metrics.js --all
 *
 * Output: total findings, fixed, deferred, rejected, fix rate, per-source breakdown.
 *
 * Exit codes: 0 = success, 1 = no data found, 2 = error
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const REVIEWS_PATH = join(ROOT, "data", "ecosystem-v2", "reviews.jsonl");

// Parse args
const args = process.argv.slice(2);
const prArg = args.find((a) => a.startsWith("--pr"));
const rangeArg = args.find((a) => a.startsWith("--range"));
const allFlag = args.includes("--all");
const jsonFlag = args.includes("--json");

function parseReviews() {
  try {
    const content = readFileSync(REVIEWS_PATH, "utf-8").replace(/^\uFEFF/, "");
    const lines = content.trim().split("\n").filter(Boolean);
    const records = [];
    for (const line of lines) {
      try {
        records.push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }
    return records;
  } catch (err) {
    console.error(`Error reading ${REVIEWS_PATH}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}

function filterByPR(records, prNum) {
  return records.filter((r) => r.pr === prNum);
}

function filterByRange(records, start, end) {
  return records.filter((r) => r.pr >= start && r.pr <= end);
}

function computeMetrics(records) {
  let totalFindings = 0;
  let totalFixed = 0;
  let totalDeferred = 0;
  let totalRejected = 0;
  const perSource = {};
  const perPR = {};

  for (const r of records) {
    const pr = r.pr ?? "unknown";
    const source = r.source ?? "unknown";
    const total = r.total ?? 0;
    const fixed = r.fixed ?? 0;
    const deferred = r.deferred ?? 0;
    const rejected = r.rejected ?? 0;

    totalFindings += total;
    totalFixed += fixed;
    totalDeferred += deferred;
    totalRejected += rejected;

    if (!perSource[source]) {
      perSource[source] = { total: 0, fixed: 0, deferred: 0, rejected: 0 };
    }
    perSource[source].total += total;
    perSource[source].fixed += fixed;
    perSource[source].deferred += deferred;
    perSource[source].rejected += rejected;

    if (!perPR[pr]) {
      perPR[pr] = { total: 0, fixed: 0, deferred: 0, rejected: 0, rounds: 0 };
    }
    perPR[pr].total += total;
    perPR[pr].fixed += fixed;
    perPR[pr].deferred += deferred;
    perPR[pr].rejected += rejected;
    perPR[pr].rounds++;
  }

  const fixRate = totalFindings > 0 ? (totalFixed / totalFindings).toFixed(2) : "N/A";

  return { totalFindings, totalFixed, totalDeferred, totalRejected, fixRate, perSource, perPR };
}

function printMetrics(metrics) {
  if (jsonFlag) {
    console.log(JSON.stringify(metrics, null, 2));
    return;
  }

  console.log("\n📊 Review Metrics Summary");
  console.log("═".repeat(50));
  console.log(`  Total findings:  ${metrics.totalFindings}`);
  console.log(`  Fixed:           ${metrics.totalFixed}`);
  console.log(`  Deferred:        ${metrics.totalDeferred}`);
  console.log(`  Rejected:        ${metrics.totalRejected}`);
  console.log(`  Fix rate:        ${metrics.fixRate}`);

  const sources = Object.keys(metrics.perSource);
  if (sources.length > 0) {
    console.log("\n  Per-Source Breakdown:");
    for (const src of sources) {
      const s = metrics.perSource[src];
      const rate = s.total > 0 ? (s.fixed / s.total).toFixed(2) : "N/A";
      console.log(`    ${src || "(unknown)"}: ${s.total} total, ${s.fixed} fixed, ${s.deferred} deferred, ${s.rejected} rejected (${rate})`);
    }
  }

  const prs = Object.keys(metrics.perPR).sort((a, b) => Number(a) - Number(b));
  if (prs.length > 0) {
    console.log("\n  Per-PR Breakdown:");
    for (const pr of prs) {
      const p = metrics.perPR[pr];
      const rate = p.total > 0 ? (p.fixed / p.total).toFixed(2) : "N/A";
      console.log(`    PR #${pr}: ${p.total} total, ${p.fixed} fixed, ${p.deferred} deferred, ${p.rejected} rejected (rate: ${rate}, ${p.rounds} review records)`);
    }
  }

  console.log("");
}

// Main
const allRecords = parseReviews();
let filtered;

if (prArg) {
  const prVal = prArg.includes("=") ? prArg.split("=")[1] : args[args.indexOf(prArg) + 1];
  const prNum = parseInt(prVal, 10);
  if (isNaN(prNum)) {
    console.error("Error: --pr requires a number");
    process.exit(2);
  }
  filtered = filterByPR(allRecords, prNum);
} else if (rangeArg) {
  const rangeVal = rangeArg.includes("=") ? rangeArg.split("=")[1] : args[args.indexOf(rangeArg) + 1];
  const parts = rangeVal.split("-");
  if (parts.length !== 2) {
    console.error("Error: --range requires format N-M (e.g., --range 378-416)");
    process.exit(2);
  }
  const start = parseInt(parts[0], 10);
  const end = parseInt(parts[1], 10);
  if (isNaN(start) || isNaN(end)) {
    console.error("Error: --range values must be numbers");
    process.exit(2);
  }
  filtered = filterByRange(allRecords, start, end);
} else if (allFlag) {
  filtered = allRecords;
} else {
  console.log("Usage: node scripts/compute-changelog-metrics.js --pr N | --range N-M | --all [--json]");
  process.exit(0);
}

if (filtered.length === 0) {
  console.log("No review records found for the specified filter.");
  process.exit(1);
}

const metrics = computeMetrics(filtered);
printMetrics(metrics);
