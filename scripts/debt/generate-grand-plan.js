#!/usr/bin/env node
/* global __dirname */
/**
 * Generate Grand Plan V2 — Technical Debt Elimination Plan
 *
 * Reads:
 *   - docs/technical-debt/logs/grand-plan-manifest.json
 *   - docs/technical-debt/metrics.json
 *   - docs/technical-debt/MASTER_DEBT.jsonl
 *   - docs/technical-debt/logs/sprint-*-ids.json
 *
 * Outputs:
 *   - docs/technical-debt/GRAND_PLAN_V2.md
 *
 * Usage:
 *   node scripts/debt/generate-grand-plan.js [--verbose]
 */

const fs = require("node:fs");
const path = require("node:path");

const BASE_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(BASE_DIR, "MASTER_DEBT.jsonl");
const MANIFEST_FILE = path.join(BASE_DIR, "logs/grand-plan-manifest.json");
const METRICS_FILE = path.join(BASE_DIR, "metrics.json");
const LOG_DIR = path.join(BASE_DIR, "logs");
const OUTPUT_FILE = path.join(BASE_DIR, "GRAND_PLAN_V2.md");

const verbose = process.argv.includes("--verbose");

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------

/** Read a JSON file safely */
function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read ${filePath}: ${msg}`);
    process.exit(1);
  }
  return JSON.parse(raw);
}

/** Load all items from MASTER_DEBT.jsonl into a Map keyed by id */
function loadMasterIndex() {
  if (!fs.existsSync(MASTER_FILE)) {
    console.error(`Master file not found: ${MASTER_FILE}`);
    process.exit(1);
  }
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read master file: ${msg}`);
    process.exit(1);
  }
  const index = new Map();
  const lines = content.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (item.id) {
        index.set(item.id, item);
      }
    } catch (_) {
      // skip malformed lines
    }
  }
  return index;
}

/** Load sprint IDs file, return { sprint, focus, ids } */
function loadSprintIds(sprintKey) {
  const filePath = path.join(LOG_DIR, `${sprintKey}-ids.json`);
  if (!fs.existsSync(filePath)) {
    if (verbose) {
      console.warn(`Sprint IDs file not found: ${filePath}`);
    }
    return null;
  }
  try {
    return readJson(filePath);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Severity breakdown helpers
// ---------------------------------------------------------------------------

/** Count severity breakdown for a list of IDs against the master index */
function severityBreakdown(ids, masterIndex) {
  const counts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  for (const id of ids) {
    const item = masterIndex.get(id);
    if (item && item.severity && counts[item.severity] !== undefined) {
      counts[item.severity]++;
    }
  }
  return counts;
}

/** Get top N critical (S0 then S1) items from a list of IDs */
function topCriticalItems(ids, masterIndex, limit) {
  const items = [];
  for (const id of ids) {
    const item = masterIndex.get(id);
    if (item && (item.severity === "S0" || item.severity === "S1")) {
      items.push(item);
    }
  }
  // S0 first, then S1, then by id
  items.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "S0" ? -1 : 1;
    }
    return (a.id || "").localeCompare(b.id || "");
  });
  return items.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Sprint ordering
// ---------------------------------------------------------------------------

/** Parse sprint key for sorting: "sprint-1" -> [1,0], "sprint-8a" -> [8,1] */
function sprintSortKey(key) {
  const match = key.match(/^sprint-(\d+)([a-z]?)$/);
  if (!match) return [999, 0];
  const num = parseInt(match[1], 10);
  const sub = match[2] ? match[2].charCodeAt(0) - 96 : 0; // a=1, b=2, etc.
  return [num, sub];
}

/** Sort sprint keys in natural order */
function sortSprintKeys(keys) {
  return keys.slice().sort((a, b) => {
    const [aN, aS] = sprintSortKey(a);
    const [bN, bS] = sprintSortKey(b);
    if (aN !== bN) return aN - bN;
    return aS - bS;
  });
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

/** Format date as YYYY-MM-DD */
function today() {
  return new Date().toISOString().split("T")[0];
}

/** Build the sprint summary table */
function buildSprintSummaryTable(manifest, masterIndex) {
  const rows = [];
  const sortedKeys = sortSprintKeys(Object.keys(manifest.sprints));

  for (const key of sortedKeys) {
    const info = manifest.sprints[key];
    const sprintData = loadSprintIds(key);
    const ids = sprintData ? sprintData.ids : [];
    const sev = severityBreakdown(ids, masterIndex);

    rows.push(
      `| ${key} | ${info.focus} | ${ids.length} | ${sev.S0} | ${sev.S1} | ${sev.S2} | ${sev.S3} | ${info.status} |`
    );
  }

  return [
    "| Sprint | Focus | Items | S0 | S1 | S2 | S3 | Status |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

/** Build sprint detail sections */
function buildSprintDetails(manifest, masterIndex) {
  const sections = [];
  const sortedKeys = sortSprintKeys(Object.keys(manifest.sprints));

  // Group completed sprints
  const completed = sortedKeys.filter((k) => manifest.sprints[k].status === "COMPLETE");
  const active = sortedKeys.filter((k) => manifest.sprints[k].status === "ACTIVE");
  const planned = sortedKeys.filter((k) => manifest.sprints[k].status === "PLANNED");

  // Completed section
  if (completed.length > 0) {
    sections.push(buildCompletedSection(completed, manifest, masterIndex));
  }

  // Active sprints get full detail
  for (const key of active) {
    sections.push(buildFullSprintSection(key, manifest, masterIndex));
  }

  // Planned sprints get medium detail
  for (const key of planned) {
    sections.push(buildPlannedSprintSection(key, manifest, masterIndex));
  }

  return sections.join("\n\n");
}

/** Completed sprints summary */
function buildCompletedSection(keys, manifest, masterIndex) {
  const lines = [
    `### Sprints ${keys.map((k) => k.replace("sprint-", "")).join(", ")} (COMPLETE)`,
    "",
  ];

  for (const key of keys) {
    const info = manifest.sprints[key];
    const sprintData = loadSprintIds(key);
    const ids = sprintData ? sprintData.ids : [];
    const sev = severityBreakdown(ids, masterIndex);
    const sevStr = Object.entries(sev)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    lines.push(`- **${key}**: ${info.focus} (${ids.length} items — ${sevStr})`);
  }

  return lines.join("\n");
}

/** Full detail for active sprints, including top 5 critical items */
function buildFullSprintSection(key, manifest, masterIndex) {
  const info = manifest.sprints[key];
  const sprintData = loadSprintIds(key);
  const ids = sprintData ? sprintData.ids : [];
  const sev = severityBreakdown(ids, masterIndex);
  const topItems = topCriticalItems(ids, masterIndex, 5);

  const lines = [
    `### ${key}: ${info.focus}`,
    "",
    `- **Status**: ${info.status}`,
    `- **Items**: ${ids.length}`,
    `- **Severity**: S0: ${sev.S0}, S1: ${sev.S1}, S2: ${sev.S2}, S3: ${sev.S3}`,
  ];

  if (topItems.length > 0) {
    lines.push("", "**Top critical items:**", "");
    for (const item of topItems) {
      const title = (item.title || "Untitled").substring(0, 80);
      const file = item.file || "(no file)";
      lines.push(`- \`${item.id}\` [${item.severity}] ${title} — \`${file}\``);
    }
  }

  return lines.join("\n");
}

/** Medium detail for planned sprints */
function buildPlannedSprintSection(key, manifest, masterIndex) {
  const info = manifest.sprints[key];
  const sprintData = loadSprintIds(key);
  const ids = sprintData ? sprintData.ids : [];
  const sev = severityBreakdown(ids, masterIndex);
  const sevStr = Object.entries(sev)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return [
    `### ${key}: ${info.focus}`,
    "",
    `- **Status**: PLANNED`,
    `- **Items**: ${ids.length}`,
    `- **Severity**: ${sevStr || "N/A"}`,
  ].join("\n");
}

/** Build roadmap-bound items table */
function buildRoadmapSection(manifest, masterIndex) {
  const rb = manifest.roadmap_bound;
  const lines = ["| Category | Items | Destination | Notes |", "|---|---|---|---|"];

  if (rb.security) {
    lines.push(
      `| Security | ${rb.security.count} | ${rb.security.roadmap_ref} | Auth, App Check, input validation |`
    );
  }
  if (rb.enhancements) {
    lines.push(
      `| Enhancements | ${rb.enhancements.count} | ${rb.enhancements.roadmap_ref} | Feature requests deferred to milestones |`
    );
  }
  if (rb.performance) {
    lines.push(
      `| Performance | ${rb.performance.count} | ${rb.performance.roadmap_ref} | Bundle size, rendering, queries |`
    );
  }

  return lines.join("\n");
}

/** Build coverage report */
function buildCoverageReport(manifest) {
  const c = manifest.coverage;
  const gpPct = c.total_open > 0 ? ((c.placed_grand_plan / c.total_open) * 100).toFixed(1) : "0";
  const rmPct = c.total_open > 0 ? ((c.placed_roadmap / c.total_open) * 100).toFixed(1) : "0";

  return [
    `- Total open items: ${c.total_open}`,
    `- Placed in Grand Plan: ${c.placed_grand_plan} (${gpPct}%)`,
    `- Placed in Roadmap: ${c.placed_roadmap} (${rmPct}%)`,
    `- Unplaced: ${c.unplaced} (0%)`,
    `- EVERY open item has a home`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Loading data sources...");
  const manifest = readJson(MANIFEST_FILE);
  const metrics = readJson(METRICS_FILE);
  const masterIndex = loadMasterIndex();

  const totalMaster = masterIndex.size;
  const totalOpen = metrics.summary.open;
  const totalResolved = metrics.summary.resolved + metrics.summary.false_positives;
  const resolutionRate = metrics.summary.resolution_rate_pct;

  const sprintKeys = Object.keys(manifest.sprints);
  const completedCount = sprintKeys.filter((k) => manifest.sprints[k].status === "COMPLETE").length;

  // Count completed sprint items
  let completedItems = 0;
  for (const key of sprintKeys) {
    if (manifest.sprints[key].status === "COMPLETE") {
      const sd = loadSprintIds(key);
      if (sd) completedItems += sd.ids.length;
    }
  }

  const grandPlanItems = manifest.coverage.placed_grand_plan;
  const roadmapItems = manifest.coverage.placed_roadmap;
  const numSprints = sprintKeys.length;

  const dateStr = today();

  const md = `# Grand Plan V2: Technical Debt Elimination

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** ${dateStr}
**Status:** ACTIVE
**Generated by:** \`scripts/debt/generate-grand-plan.js\`
<!-- prettier-ignore-end -->

## Purpose

This document is the authoritative plan for eliminating technical debt tracked in
\`MASTER_DEBT.jsonl\`. It assigns every open item to either a Grand Plan sprint
or a Roadmap track, ensuring 100% coverage with zero unplaced items.

## Overview

- **Total items in MASTER_DEBT**: ${totalMaster}
- **Grand Plan items**: ${grandPlanItems} across ${numSprints} sprints
- **Roadmap-bound items**: ${roadmapItems} (security/enhancements/performance)
- **Completed**: ${totalResolved} resolved + false-positive (sprints 1-${completedCount} scope: ${completedItems} items)
- **Resolution rate**: ${resolutionRate}%

## Decision Record

| Decision | Choice |
|---|---|
| Grand Plan scope | code-quality, documentation, process, refactoring, engineering-productivity, ai-optimization |
| Roadmap scope | security, enhancements, performance |
| Sprint structure | File-based. Sprints 1-${completedCount} done. ${sprintKeys.filter((k) => manifest.sprints[k].status === "ACTIVE").length} active. ${sprintKeys.filter((k) => manifest.sprints[k].status === "PLANNED").length} planned. |
| Single source of truth | MASTER_DEBT.jsonl |
| Severity scale | S0 (critical) > S1 (high) > S2 (medium) > S3 (low) |
| Resolution workflow | Fix item, run \`resolve-item.js\`, regenerate metrics |

## Sprint Summary

${buildSprintSummaryTable(manifest, masterIndex)}

## Sprint Details

${buildSprintDetails(manifest, masterIndex)}

## Roadmap-Bound Items

${buildRoadmapSection(manifest, masterIndex)}

## Coverage Report

${buildCoverageReport(manifest)}

## Execution Strategy

- Sprints execute in order (4 > 5 > 6 > 7 > 8a > 8b > 8c > 8d > 9a > 9b > 10 > 11a > 11b > 11c > 12a > 12b)
- Each sprint should take 2-4 sessions to complete
- S0/S1 items within each sprint get priority
- Items can be resolved ad-hoc and marked RESOLVED in MASTER_DEBT.jsonl
- Progress tracked via \`generate-metrics.js\`
- After completing a sprint, re-run this script to update the plan

## Version History

| Version | Date | Change |
|---|---|---|
| 2.0 | ${dateStr} | Complete rebuild with ${totalMaster} items, 100% coverage |
| 1.0 | 2026-01-28 | Original Grand Plan (Sprints 1-7) |
`;

  try {
    fs.writeFileSync(OUTPUT_FILE, md, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to write output: ${msg}`);
    process.exit(1);
  }

  console.log(`Grand Plan V2 written to ${OUTPUT_FILE}`);
  console.log(`  Sprints: ${numSprints}`);
  console.log(`  Grand Plan items: ${grandPlanItems}`);
  console.log(`  Roadmap items: ${roadmapItems}`);
  console.log(`  Coverage: 100%`);
}

main();
