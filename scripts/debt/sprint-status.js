#!/usr/bin/env node
/* global __dirname */
/**
 * sprint-status.js — TDMS Sprint Dashboard
 *
 * Gathers data from multiple TDMS sources and outputs a sprint status summary.
 *
 * Usage: node scripts/debt/sprint-status.js [--json]
 *   Default: human-readable dashboard
 *   --json:  machine-readable JSON
 *
 * Exit codes:
 *   0 = healthy
 *   1 = stale docs detected
 *   2 = sync drift detected
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");

const ROOT = path.join(__dirname, "../..");
const { sanitizeError } = require("../lib/sanitize-error.js");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const PATHS = {
  manifest: path.join(ROOT, "docs/technical-debt/logs/grand-plan-manifest.json"),
  activeSprint: path.join(ROOT, ".claude/state/active-sprint.json"),
  master: path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl"),
  deduped: path.join(ROOT, "docs/technical-debt/raw/deduped.jsonl"),
  metrics: path.join(ROOT, "docs/technical-debt/metrics.json"),
  roadmap: path.join(ROOT, "ROADMAP.md"),
  viewsBySeverity: path.join(ROOT, "docs/technical-debt/views/by-severity.md"),
  sprintLogsDir: path.join(ROOT, "docs/technical-debt/logs"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe JSON file read — returns null on any error */
function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    // Ignore: safe fallback — missing file or malformed JSON returns null to caller
    return null;
  }
}

/** Safe text file read — returns null on any error */
function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    // Ignore: safe fallback — missing or unreadable file returns null to caller
    return null;
  }
}

/** Parse a JSONL file into an array of objects. Skips malformed lines. */
function readJsonlSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const items = [];
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        items.push(JSON.parse(trimmed));
      } catch {
        console.warn(`  WARN: skipping malformed JSONL line in ${path.basename(filePath)}`);
      }
    }
    return items;
  } catch {
    // Ignore: safe fallback — missing or unreadable file returns empty array to caller
    return [];
  }
}

/** Get file mtime safely — returns null on error */
function getFileMtime(filePath) {
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    // Ignore: safe fallback — file does not exist or is inaccessible
    return null;
  }
}

/** Discover all sprint-*-ids.json files */
function discoverSprintIdFiles() {
  const files = [];
  try {
    const entries = fs.readdirSync(PATHS.sprintLogsDir);
    const pattern = /^sprint-[^-]+-ids\.json$/;
    for (const entry of entries) {
      if (pattern.test(entry)) {
        files.push(path.join(PATHS.sprintLogsDir, entry));
      }
    }
  } catch {
    // Ignore: sprint logs directory missing — return empty array as safe fallback
  }
  return files;
}

/** Extract sprint id from a sprint-*-ids.json filename */
function sprintIdFromFile(filePath) {
  const base = path.basename(filePath);
  const match = base.match(/^(sprint-[^-]+(?:-[a-z])?)-ids\.json$/);
  return match ? match[1] : null;
}

/** Format milliseconds into a human-readable age string */
function formatAge(ms) {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Pick N random items from an array (Fisher-Yates partial shuffle) */
function sampleRandom(arr, n) {
  if (arr.length <= n) return arr.slice();
  const copy = arr.slice();
  const result = [];
  for (let i = 0; i < n; i++) {
    const idx = randomInt(i, copy.length);
    // swap
    const tmp = copy[i];
    copy[i] = copy[idx];
    copy[idx] = tmp;
    result.push(copy[i]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------

/** Load all sprint ID files into a Map and a Set of all placed IDs */
function loadSprintIdData(sprintIdFiles) {
  const sprintIds = new Map();
  const allPlacedIds = new Set();
  for (const sprintIdFile of sprintIdFiles) {
    const data = readJsonSafe(sprintIdFile);
    if (!data || !Array.isArray(data.ids)) continue;
    const sid = data.sprint || sprintIdFromFile(sprintIdFile);
    if (sid) {
      sprintIds.set(sid, data.ids);
    }
    for (const id of data.ids) {
      allPlacedIds.add(id);
    }
  }
  return { sprintIds, allPlacedIds };
}

function gatherData() {
  const manifest = readJsonSafe(PATHS.manifest);
  if (!manifest) {
    throw new Error(`Unable to read manifest file: ${PATHS.manifest}`);
  }

  const activeSprint = readJsonSafe(PATHS.activeSprint);

  const masterItems = readJsonlSafe(PATHS.master);
  const masterById = new Map();
  for (const item of masterItems) {
    if (item.id) masterById.set(item.id, item);
  }

  const { sprintIds, allPlacedIds } = loadSprintIdData(discoverSprintIdFiles());

  const metrics = readJsonSafe(PATHS.metrics);

  const dedupedItems = readJsonlSafe(PATHS.deduped);
  const dedupedByHash = new Map();
  for (const item of dedupedItems) {
    if (item.content_hash) dedupedByHash.set(item.content_hash, item);
  }

  const roadmapText = readTextSafe(PATHS.roadmap);

  return {
    manifest,
    activeSprint,
    masterItems,
    masterById,
    sprintIds,
    allPlacedIds,
    metrics,
    dedupedItems,
    dedupedByHash,
    roadmapText,
  };
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

/** Resolve active sprint ID and focus from state file or manifest */
function resolveActiveSprintId(activeSprint, manifest) {
  if (activeSprint && activeSprint.id) {
    return { activeId: activeSprint.id, activeFocus: activeSprint.focus || null };
  }
  if (manifest && manifest.sprints) {
    for (const [sid, info] of Object.entries(manifest.sprints)) {
      if (info.status === "ACTIVE") {
        return { activeId: sid, activeFocus: info.focus || null };
      }
    }
  }
  return { activeId: null, activeFocus: null };
}

/** Count resolved and remaining-by-severity for a set of sprint IDs */
function countSprintIdStats(ids, masterById) {
  let resolved = 0;
  const severityCounts = { S0: 0, S1: 0, S2: 0, S3: 0 };
  for (const id of ids) {
    const item = masterById.get(id);
    if (!item) continue;
    if (item.status === "RESOLVED" || item.status === "FALSE_POSITIVE") {
      resolved++;
    } else {
      const sev = item.severity;
      if (sev && Object.hasOwn(severityCounts, sev)) {
        severityCounts[sev]++;
      }
    }
  }
  return { resolved, severityCounts };
}

function computeActiveSprintInfo(data) {
  const { manifest, activeSprint, masterById, sprintIds } = data;

  let { activeId, activeFocus } = resolveActiveSprintId(activeSprint, manifest);
  if (!activeId) return null;

  const ids = sprintIds.get(activeId) || [];
  const { resolved, severityCounts } = countSprintIdStats(ids, masterById);

  if (!activeFocus && manifest && manifest.sprints && manifest.sprints[activeId]) {
    activeFocus = manifest.sprints[activeId].focus || "";
  }

  return {
    id: activeId,
    focus: activeFocus || "",
    total: ids.length,
    resolved,
    remaining: ids.length - resolved,
    severity: severityCounts,
  };
}

/** Check if deduped.jsonl is in sync with MASTER_DEBT.jsonl via sampling */
function checkDedupedSynced(masterItems, dedupedByHash) {
  if (masterItems.length > 0 && dedupedByHash.size === 0) return false;
  if (masterItems.length === 0 || dedupedByHash.size === 0) return true;

  const sample = sampleRandom(masterItems, 20);
  let mismatches = 0;
  let checked = 0;
  for (const mItem of sample) {
    if (!mItem.content_hash) continue;
    const dItem = dedupedByHash.get(mItem.content_hash);
    if (!dItem) continue;
    checked++;
    if (dItem.severity !== mItem.severity || dItem.status !== mItem.status) {
      mismatches++;
    }
  }
  return checked === 0 || mismatches <= 2;
}

/** Check if metrics.json is stale relative to MASTER_DEBT.jsonl */
function checkMetricsStale(metrics, masterMtime) {
  if (!metrics) return { metricsStale: true, metricsAge: "missing" };
  if (!metrics.generated || !masterMtime) return { metricsStale: false, metricsAge: "unknown" };

  const gapMs = masterMtime.getTime() - new Date(metrics.generated).getTime();
  return {
    metricsStale: gapMs > 3600000,
    metricsAge: formatAge(Math.abs(gapMs)),
  };
}

/** Check if ROADMAP.md S0 table is stale vs actual S0 VERIFIED count */
function checkRoadmapS0Stale(masterItems, roadmapText) {
  let roadmapS0Actual = 0;
  for (const item of masterItems) {
    if (item.severity === "S0" && item.status === "VERIFIED") roadmapS0Actual++;
  }

  let roadmapS0Shown = 0;
  if (roadmapText) {
    const sectionMatch = roadmapText.match(
      /### S0 Critical Debt \(Immediate Action\)([\s\S]*?)(?=\n###\s|\n## )/
    );
    if (sectionMatch) {
      const tableRows = sectionMatch[1].match(/^\|\s*(?:~~)?DEBT-/gm);
      roadmapS0Shown = tableRows ? tableRows.length : 0;
    }
  }

  return {
    roadmapS0Stale: Boolean(roadmapText) && roadmapS0Shown !== roadmapS0Actual,
    roadmapS0Shown,
    roadmapS0Actual,
  };
}

/** Check if views/by-severity.md is stale relative to MASTER_DEBT.jsonl */
function checkViewsStale(masterMtime) {
  const viewsMtime = getFileMtime(PATHS.viewsBySeverity);
  if (!viewsMtime) return true;
  if (!masterMtime) return false;
  return masterMtime.getTime() > viewsMtime.getTime();
}

function computePipelineHealth(data) {
  const { masterItems, dedupedByHash, metrics, roadmapText } = data;
  const masterMtime = getFileMtime(PATHS.master);

  const dedupedSynced = checkDedupedSynced(masterItems, dedupedByHash);
  const { metricsStale, metricsAge } = checkMetricsStale(metrics, masterMtime);
  const { roadmapS0Stale, roadmapS0Shown, roadmapS0Actual } = checkRoadmapS0Stale(
    masterItems,
    roadmapText
  );
  const viewsStale = checkViewsStale(masterMtime);

  return {
    dedupedSynced,
    metricsStale,
    metricsAge,
    roadmapS0Stale,
    roadmapS0Shown,
    roadmapS0Actual,
    viewsStale,
  };
}

function computeUnplacedItems(data) {
  const { masterItems, allPlacedIds } = data;

  const unplaced = [];
  for (const item of masterItems) {
    if (!item.id) continue;
    if (item.status !== "VERIFIED" && item.status !== "NEW") continue;
    if (allPlacedIds.has(item.id)) continue;
    unplaced.push({
      id: item.id,
      title: item.title || "",
      severity: item.severity || "?",
      file: item.file || "",
      source: item.source || null,
    });
  }

  // Group by source for the summary
  const bySource = {};
  for (const placedItem of unplaced) {
    const src = placedItem.source || "unknown";
    bySource[src] = (bySource[src] || 0) + 1;
  }

  return {
    count: unplaced.length,
    bySource,
    items: unplaced,
  };
}

function computeAllSprints(data) {
  const { manifest, masterById, sprintIds } = data;

  if (!manifest || !manifest.sprints) return [];

  const results = [];

  for (const [sid, info] of Object.entries(manifest.sprints)) {
    const ids = sprintIds.get(sid) || [];
    const total = ids.length || info.items || 0;

    let resolved = 0;
    for (const sprintItemId of ids) {
      const item = masterById.get(sprintItemId);
      if (item && (item.status === "RESOLVED" || item.status === "FALSE_POSITIVE")) {
        resolved++;
      }
    }

    results.push({
      id: sid,
      status: info.status || "UNKNOWN",
      total,
      resolved,
      remaining: total - resolved,
    });
  }

  // Sort by natural sprint ordering
  results.sort((a, b) => {
    const aNum = Number.parseInt(a.id.replace(/^sprint-/, ""), 10) || 0;
    const bNum = Number.parseInt(b.id.replace(/^sprint-/, ""), 10) || 0;
    if (aNum !== bNum) return aNum - bNum;
    // sub-sprint letter comparison
    return a.id.localeCompare(b.id);
  });

  return results;
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatActiveSprintSection(as) {
  const lines = [];
  if (!as) {
    lines.push("--- No Active Sprint ---", "");
    return lines;
  }
  lines.push(
    `--- Active Sprint: ${as.id} ---`,
    `  Focus: ${as.focus}`,
    `  Progress: ${as.resolved}/${as.total} resolved (${as.remaining} remaining)`
  );
  const sevParts = [];
  for (const [sev, count] of Object.entries(as.severity)) {
    if (count > 0) sevParts.push(`${sev}: ${count}`);
  }
  if (sevParts.length > 0) {
    lines.push(`  Remaining by severity: ${sevParts.join(", ")}`);
  }
  lines.push("");
  return lines;
}

function formatPipelineSection(p) {
  return [
    "--- Pipeline Health ---",
    `  ${p.dedupedSynced ? "\u2705" : "\u274C"} Deduped synced: ${p.dedupedSynced}`,
    `  ${p.metricsStale ? "\u274C" : "\u2705"} Metrics freshness: ${p.metricsAge}${p.metricsStale ? " (STALE)" : ""}`,
    `  ${p.roadmapS0Stale ? "\u274C" : "\u2705"} ROADMAP S0: ${p.roadmapS0Shown} shown / ${p.roadmapS0Actual} actual${p.roadmapS0Stale ? " (STALE)" : ""}`,
    `  ${p.viewsStale ? "\u274C" : "\u2705"} Views freshness: ${p.viewsStale ? "STALE" : "OK"}`,
    "",
  ];
}

function formatUnplacedSection(u) {
  const lines = [`--- Unplaced Items: ${u.count} ---`];
  if (u.count > 0 && u.bySource) {
    const srcParts = Object.entries(u.bySource).map(([src, cnt]) => `${src}: ${cnt}`);
    lines.push(`  By source: ${srcParts.join(", ")}`);
    const showItems = u.items.slice(0, 10);
    for (const it of showItems) {
      lines.push(`  - ${it.id} [${it.severity}] ${it.title}`);
    }
    if (u.count > 10) {
      lines.push(`  ... and ${u.count - 10} more`);
    }
  }
  return lines;
}

const STATUS_ICONS = { COMPLETE: "\u2705", ACTIVE: "\uD83D\uDD35" };

function formatAllSprintsSection(allSprints) {
  const lines = ["", "--- All Sprints ---"];
  for (const s of allSprints) {
    const statusIcon = STATUS_ICONS[s.status] || "\u23F3";
    lines.push(
      `  ${statusIcon} ${s.id.padEnd(12)} ${s.status.padEnd(10)} ${s.resolved}/${s.total} resolved (${s.remaining} remaining)`
    );
  }
  lines.push("");
  return lines;
}

function formatDashboard(result) {
  const lines = ["", "=== TDMS Sprint Dashboard ===", `Generated: ${result.timestamp}`, ""];

  lines.push(...formatActiveSprintSection(result.activeSprint));
  lines.push(...formatPipelineSection(result.pipeline));
  lines.push(...formatUnplacedSection(result.unplacedItems));
  lines.push(...formatAllSprintsSection(result.allSprints));

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const jsonMode = process.argv.includes("--json");

  let data;
  try {
    data = gatherData();
  } catch (err) {
    const safeMsg = sanitizeError(err);
    process.stderr.write(`Error gathering data: ${safeMsg}\n`);
    process.exit(2);
  }

  const activeSprint = computeActiveSprintInfo(data);
  const pipeline = computePipelineHealth(data);
  const unplacedItems = computeUnplacedItems(data);
  const allSprints = computeAllSprints(data);

  const result = {
    activeSprint,
    pipeline,
    unplacedItems: {
      count: unplacedItems.count,
      bySource: unplacedItems.bySource,
      items: unplacedItems.items,
    },
    allSprints,
    timestamp: new Date().toISOString(),
  };

  // Determine exit code
  let exitCode = 0;
  if (!pipeline.dedupedSynced) {
    exitCode = 2;
  } else if (pipeline.metricsStale || pipeline.roadmapS0Stale || pipeline.viewsStale) {
    exitCode = 1;
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(formatDashboard(result));
  }

  process.exit(exitCode);
}

main();
