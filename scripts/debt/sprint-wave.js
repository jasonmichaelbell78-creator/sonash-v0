#!/usr/bin/env node
/* global __dirname */
/**
 * Compute wave assignments for team-based sprint work.
 *
 * Usage: node scripts/debt/sprint-wave.js <sprint-id> [--batch N] [--json]
 *
 * Arguments:
 *   sprint-id   e.g. "sprint-4" or just "4" (script normalizes)
 *   --batch N   items per category per wave (default: 5)
 *   --json      machine-readable JSON output
 *
 * Reads:
 *   docs/technical-debt/logs/sprint-{id}-ids.json   (sprint manifest)
 *   docs/technical-debt/MASTER_DEBT.jsonl            (item details)
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const DEBT_DIR = path.join(ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_ORDER = { S0: 0, S1: 1, S2: 2, S3: 3 };

/** Normalize sprint arg: "4" -> "sprint-4", "sprint-4" -> "sprint-4" */
function normalizeSprintId(raw) {
  if (/^sprint-/i.test(raw)) return raw.toLowerCase();
  return `sprint-${raw}`;
}

/** Parse CLI args */
function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.error("Usage: node scripts/debt/sprint-wave.js <sprint-id> [--batch N] [--json]");
    process.exit(1);
  }

  const result = { sprintId: normalizeSprintId(args[0]), batch: 5, json: false };

  result.json = args.includes("--json");

  const batchIdx = args.indexOf("--batch");
  if (batchIdx !== -1 && batchIdx + 1 < args.length) {
    const n = Number.parseInt(args[batchIdx + 1], 10);
    if (Number.isNaN(n) || n < 1) {
      console.error("Error: --batch must be a positive integer");
      process.exit(1);
    }
    result.batch = n;
  }

  return result;
}

/** Read and parse the sprint manifest */
function loadSprintManifest(sprintId) {
  const manifestPath = path.join(DEBT_DIR, "logs", `${sprintId}-ids.json`);
  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const data = JSON.parse(raw);
    return data.ids || [];
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`Error: Sprint manifest not found: ${manifestPath}`);
      process.exit(1);
    }
    console.error(`Error reading sprint manifest: ${String(err).slice(0, 200)}`);
    process.exit(1);
  }
}

/** Load MASTER_DEBT.jsonl into a Map keyed by id */
function loadMasterDebt() {
  const map = new Map();
  let raw;
  try {
    raw = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    console.error(`Error reading MASTER_DEBT.jsonl: ${String(err).slice(0, 200)}`);
    process.exit(1);
  }

  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const item = JSON.parse(trimmed);
      if (item.id) map.set(item.id, item);
    } catch {
      // skip malformed lines
    }
  }
  return map;
}

/** Map raw category to a team fixer group */
function toFixerGroup(category) {
  const cat = (category || "").toLowerCase();
  if (cat === "security" || cat === "process") return "security";
  if (cat === "performance") return "performance";
  // code-quality, refactoring, docs, and everything else
  return "codequality";
}

/** Sort items by severity (S0 first) */
function bySeverity(a, b) {
  const sa = SEVERITY_ORDER[a.severity] ?? 99;
  const sb = SEVERITY_ORDER[b.severity] ?? 99;
  return sa - sb;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Resolve sprint IDs to unresolved items, sorted by severity */
function resolveUnresolvedItems(sprintIds, master) {
  const unresolvedStatuses = new Set(["VERIFIED", "NEW"]);
  const items = [];
  for (const id of sprintIds) {
    const item = master.get(id);
    if (!item) continue;
    if (!unresolvedStatuses.has((item.status || "").toUpperCase())) continue;
    items.push(item);
  }
  items.sort(bySeverity);
  return items;
}

/** Group items by fixer team */
function buildFixerGroups(items) {
  const groups = new Map();
  for (const item of items) {
    const group = toFixerGroup(item.category);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  return groups;
}

/** Build wave 1 assignments from fixer groups */
function buildWaveAssignments(groups, batch) {
  const assignments = {};
  let totalWaveItems = 0;
  const groupOrder = ["security", "performance", "codequality"];

  for (const groupName of groupOrder) {
    const groupItems = groups.get(groupName);
    if (!groupItems || groupItems.length === 0) continue;

    const wave1 = groupItems.slice(0, batch);
    assignments[groupName] = {
      items: wave1.map((it) => ({
        id: it.id,
        file: it.file || "",
        line: it.line || 0,
        title: it.title || "",
        severity: it.severity || "S3",
        category: it.category || "",
        description: it.description || "",
      })),
      count: wave1.length,
    };
    totalWaveItems += wave1.length;
  }

  return { assignments, totalWaveItems, groupOrder };
}

/** Format wave assignments as text output */
function formatWaveText(
  opts,
  totalRemaining,
  assignments,
  groupOrder,
  totalWaveItems,
  estimatedWaves
) {
  console.log(`Wave 1 for ${opts.sprintId} (${totalRemaining} remaining)\n`);

  for (const groupName of groupOrder) {
    const assignment = assignments[groupName];
    if (!assignment) continue;

    console.log(`  ${groupName} (${assignment.count} items):`);
    for (const it of assignment.items) {
      const loc = it.line ? `${it.file}:${it.line}` : it.file;
      const suffix = loc ? ` \u2014 ${loc}` : "";
      console.log(`    ${it.id} [${it.severity}] ${it.title}${suffix}`);
    }
    console.log("");
  }

  console.log(`Total: ${totalWaveItems} items | Estimated waves: ${estimatedWaves}`);
}

function main() {
  const opts = parseArgs(process.argv);
  const sprintIds = loadSprintManifest(opts.sprintId);
  const master = loadMasterDebt();

  const items = resolveUnresolvedItems(sprintIds, master);
  const groups = buildFixerGroups(items);
  const { assignments, totalWaveItems, groupOrder } = buildWaveAssignments(groups, opts.batch);

  const totalRemaining = items.length;
  const estimatedWaves = totalRemaining > 0 ? Math.ceil(totalRemaining / (totalWaveItems || 1)) : 0;

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          sprintId: opts.sprintId,
          totalRemaining,
          wave: 1,
          assignments,
          totalWaveItems,
          remainingAfterWave: totalRemaining - totalWaveItems,
          estimatedWaves,
        },
        null,
        2
      )
    );
  } else {
    formatWaveText(opts, totalRemaining, assignments, groupOrder, totalWaveItems, estimatedWaves);
  }
}

main();
