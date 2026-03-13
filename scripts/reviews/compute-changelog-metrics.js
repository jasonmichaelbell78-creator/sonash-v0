#!/usr/bin/env node
/* global __dirname */
/**
 * Compute changelog metrics from JSONL source data.
 * Usage: node compute-changelog-metrics.js [--pr NUM]
 * Reads retros.jsonl and reviews.jsonl, outputs stats for a PR or all recent PRs.
 *
 * Source: PR #414 retro — manually calculated wrong percentages in PR changelogs.
 * This utility auto-computes from source data to prevent arithmetic errors.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const RETROS = path.join(ROOT, "data/ecosystem-v2/retros.jsonl");
const REVIEWS = path.join(ROOT, "data/ecosystem-v2/reviews.jsonl");

function readJsonl(fp) {
  try {
    return fs
      .readFileSync(fp, "utf-8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

const args = process.argv.slice(2);
const prIdx = args.indexOf("--pr");
const prFilter = prIdx !== -1 ? parseInt(args[prIdx + 1], 10) : null;

if (prFilter !== null && Number.isNaN(prFilter)) {
  console.error("Invalid --pr value. Usage: node compute-changelog-metrics.js --pr 427");
  process.exit(1);
}

const retros = readJsonl(RETROS);
const reviews = readJsonl(REVIEWS);

// Filter retros
const filteredRetros = prFilter
  ? retros.filter((r) => r.pr === prFilter)
  : retros.filter((r) => r.completeness === "full").slice(-10);

if (filteredRetros.length === 0) {
  console.log(prFilter ? `No retro data found for PR #${prFilter}` : "No full retros found");
  process.exit(0);
}

console.log("=== Changelog Metrics (computed from source data) ===\n");

for (const r of filteredRetros) {
  const m = r.metrics || {};
  const actionItems = r.action_items || r.process_changes || [];
  const wins = r.top_wins || [];
  const misses = r.top_misses || [];

  // Find matching review records for this PR
  const prReviews = reviews.filter((rev) => rev.pr === r.pr);
  const totalFindings = prReviews.reduce((sum, rev) => sum + (rev.total || 0), 0);
  const totalFixed = prReviews.reduce((sum, rev) => sum + (rev.fixed || 0), 0);
  const totalDeferred = prReviews.reduce((sum, rev) => sum + (rev.deferred || 0), 0);
  const totalRejected = prReviews.reduce((sum, rev) => sum + (rev.rejected || 0), 0);
  const computedFixRate = totalFindings > 0 ? totalFixed / totalFindings : 0;

  console.log(`PR #${r.pr} (${r.date}) --- Score: ${r.score ?? "N/A"}/10`);
  console.log(`  [Retro metrics]`);
  console.log(
    `    Findings: ${m.total_findings ?? "N/A"} | Fix rate: ${m.fix_rate != null ? (m.fix_rate * 100).toFixed(1) + "%" : "N/A"} | Pattern recurrence: ${m.pattern_recurrence ?? "N/A"}`
  );
  console.log(
    `    Action items: ${actionItems.length} | Wins: ${wins.length} | Misses: ${misses.length}`
  );

  if (prReviews.length > 0) {
    console.log(`  [Review records] (${prReviews.length} rounds)`);
    console.log(
      `    Total findings: ${totalFindings} | Fixed: ${totalFixed} (${(computedFixRate * 100).toFixed(1)}%) | Deferred: ${totalDeferred} | Rejected: ${totalRejected}`
    );

    // Per-round breakdown
    for (const rev of prReviews) {
      const revTotal = rev.total || 0;
      const revFixed = rev.fixed || 0;
      const revRate = revTotal > 0 ? ((revFixed / revTotal) * 100).toFixed(1) : "N/A";
      console.log(
        `      ${rev.id || "?"}: ${revTotal} items, ${revFixed} fixed (${revRate}%), ${rev.deferred || 0} deferred, ${rev.rejected || 0} rejected`
      );
    }
  } else {
    console.log(`  [No review records found for this PR]`);
  }

  console.log();
}
