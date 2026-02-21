#!/usr/bin/env node
/* global __dirname */
/**
 * sprint-complete.js - Archive a completed sprint
 *
 * Usage: node scripts/debt/sprint-complete.js <sprint-id> [--force] [--carry-to <sprint-id>]
 *
 * Exit codes:
 *   0 = completed successfully
 *   1 = items remaining (no --force)
 *   2 = error
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const LOGS_DIR = path.join(ROOT, "docs/technical-debt/logs");
const MASTER_DEBT_PATH = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");

/** Sprint execution order */
const SPRINT_ORDER = [
  "4",
  "5",
  "6",
  "7",
  "8a",
  "8b",
  "8c",
  "8d",
  "9a",
  "9b",
  "10",
  "11a",
  "11b",
  "11c",
  "12a",
  "12b",
];

/**
 * Normalize sprint id: "sprint-4" -> "4", "4" -> "4"
 */
function normalizeId(raw) {
  return raw.replace(/^sprint-/, "");
}

/**
 * Get the canonical sprint key: "4" -> "sprint-4"
 */
function sprintKey(id) {
  return `sprint-${id}`;
}

/**
 * Return the next sprint in execution order, or null if last.
 */
function nextSprint(id) {
  const idx = SPRINT_ORDER.indexOf(id);
  if (idx === -1 || idx === SPRINT_ORDER.length - 1) return null;
  return SPRINT_ORDER[idx + 1];
}

/**
 * Read and parse a JSON file. Returns null on failure.
 */
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Write a JSON file with 2-space indent.
 */
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/**
 * Load MASTER_DEBT.jsonl into an array of objects.
 */
function loadMasterDebt() {
  try {
    const raw = fs.readFileSync(MASTER_DEBT_PATH, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim());
    const items = [];
    for (const line of lines) {
      try {
        items.push(JSON.parse(line));
      } catch {
        /* skip malformed */
      }
    }
    return items;
  } catch (err) {
    return [];
  }
}

/**
 * Parse CLI arguments.
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { sprintId: null, force: false, carryTo: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--force") {
      result.force = true;
    } else if (args[i] === "--carry-to" && i + 1 < args.length) {
      result.carryTo = normalizeId(args[++i]);
    } else if (!args[i].startsWith("--")) {
      result.sprintId = normalizeId(args[i]);
    }
  }

  return result;
}

/**
 * Compute severity breakdown from an array of debt items.
 */
function severityBreakdown(items) {
  const counts = {};
  for (const item of items) {
    const sev = item.severity || "unknown";
    counts[sev] = (counts[sev] || 0) + 1;
  }
  return counts;
}

/**
 * Compute category breakdown from an array of debt items.
 */
function categoryBreakdown(items) {
  const counts = {};
  for (const item of items) {
    const cat = item.category || "unknown";
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Recompute severity counts for a sprint ids file given the master debt items.
 */
function computeSprintSeverity(ids, debtMap) {
  const severity = {};
  for (const id of ids) {
    const item = debtMap.get(id);
    if (item) {
      const sev = item.severity || "unknown";
      severity[sev] = (severity[sev] || 0) + 1;
    }
  }
  return severity;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { sprintId, force, carryTo } = parseArgs(process.argv);

  if (!sprintId) {
    console.error(
      "Usage: node scripts/debt/sprint-complete.js <sprint-id> [--force] [--carry-to <sprint-id>]"
    );
    process.exit(2);
  }

  if (!SPRINT_ORDER.includes(sprintId)) {
    console.error(`Error: Unknown sprint "${sprintId}". Valid: ${SPRINT_ORDER.join(", ")}`);
    process.exit(2);
  }

  const key = sprintKey(sprintId);

  // 1. Load sprint manifest (ids file)
  const idsPath = path.join(LOGS_DIR, `${key}-ids.json`);
  const sprintManifest = readJSON(idsPath);
  if (!sprintManifest) {
    console.error(`Error: Could not load sprint manifest at ${idsPath}`);
    process.exit(2);
  }

  // 2. Load grand-plan-manifest.json
  const manifestPath = path.join(LOGS_DIR, "grand-plan-manifest.json");
  const manifest = readJSON(manifestPath);
  if (!manifest) {
    console.error(`Error: Could not load grand-plan-manifest.json at ${manifestPath}`);
    process.exit(2);
  }

  // 3. Validate sprint status is ACTIVE
  const sprintEntry = manifest.sprints && manifest.sprints[key];
  if (!sprintEntry) {
    console.error(`Error: Sprint "${key}" not found in grand-plan-manifest.json`);
    process.exit(2);
  }
  if (sprintEntry.status === "COMPLETE") {
    console.error(`Error: Sprint "${key}" is already COMPLETE`);
    process.exit(2);
  }
  if (sprintEntry.status !== "ACTIVE") {
    console.error(`Error: Sprint "${key}" status is "${sprintEntry.status}" (expected ACTIVE)`);
    process.exit(2);
  }

  // 4. Load MASTER_DEBT.jsonl and compute stats
  const allDebt = loadMasterDebt();
  if (!allDebt) {
    console.error(`Error: Could not load MASTER_DEBT.jsonl at ${MASTER_DEBT_PATH}`);
    process.exit(2);
  }

  const debtMap = new Map();
  for (const item of allDebt) {
    if (item.id) debtMap.set(item.id, item);
  }

  const sprintIds = new Set(sprintManifest.ids || []);
  const sprintItems = allDebt.filter((item) => sprintIds.has(item.id));

  const resolved = sprintItems.filter((item) => item.status === "RESOLVED");
  const falsePositive = sprintItems.filter((item) => item.status === "FALSE_POSITIVE");
  const remaining = sprintItems.filter(
    (item) => item.status === "VERIFIED" || item.status === "NEW"
  );

  const resolvedCount = resolved.length;
  const falsePositiveCount = falsePositive.length;
  const remainingCount = remaining.length;
  const totalItems = sprintItems.length;

  console.log(`Sprint ${key}: ${totalItems} items total`);
  console.log(`  Resolved: ${resolvedCount}`);
  console.log(`  False Positive: ${falsePositiveCount}`);
  console.log(`  Remaining: ${remainingCount}`);

  // 5. If remaining > 0 and no --force: warn and exit
  if (remainingCount > 0 && !force) {
    console.error(`\nError: ${remainingCount} items still remaining (VERIFIED/NEW).`);
    console.error("Use --force to complete anyway and carry items forward.");
    process.exit(1);
  }

  // 6. If remaining > 0 and --force: carry forward
  let carriedTo = null;
  if (remainingCount > 0 && force) {
    const targetId = carryTo || nextSprint(sprintId);
    if (!targetId) {
      console.error("Error: No next sprint to carry items to (last sprint in order).");
      console.error("Use --carry-to <sprint-id> to specify a target.");
      process.exit(2);
    }

    const targetKey = sprintKey(targetId);
    const targetIdsPath = path.join(LOGS_DIR, `${targetKey}-ids.json`);
    const targetManifest = readJSON(targetIdsPath);
    if (!targetManifest) {
      console.error(`Error: Could not load carry-to sprint manifest at ${targetIdsPath}`);
      process.exit(2);
    }

    // Append remaining IDs (deduplicate)
    const existingIds = new Set(targetManifest.ids || []);
    const remainingIds = remaining.map((item) => item.id);
    let addedCount = 0;
    for (const id of remainingIds) {
      if (!existingIds.has(id)) {
        targetManifest.ids.push(id);
        existingIds.add(id);
        addedCount++;
      }
    }

    // Recompute severity for carry-to sprint
    targetManifest.severity = computeSprintSeverity(targetManifest.ids, debtMap);

    // Write updated carry-to sprint ids file
    try {
      writeJSON(targetIdsPath, targetManifest);
    } catch (err) {
      console.error(`Error: Failed to write carry-to manifest: ${err.message}`);
      process.exit(2);
    }

    // Update carry-to sprint item count in grand-plan-manifest
    if (manifest.sprints[targetKey]) {
      manifest.sprints[targetKey].items = targetManifest.ids.length;
    }

    carriedTo = targetKey;
    console.log(`\nCarried ${addedCount} items forward to ${targetKey}`);
  }

  // 7. Set sprint status to COMPLETE in grand-plan-manifest.json
  manifest.sprints[key].status = "COMPLETE";
  try {
    writeJSON(manifestPath, manifest);
  } catch (err) {
    console.error(`Error: Failed to write grand-plan-manifest.json: ${err.message}`);
    process.exit(2);
  }

  // 8. Write completion log
  const completionLog = {
    sprint: key,
    completedAt: new Date().toISOString(),
    resolved: resolvedCount,
    falsePositive: falsePositiveCount,
    carriedForward: remainingCount,
    carriedTo: carriedTo,
    totalItems: totalItems,
    duration: null,
  };

  const completeLogPath = path.join(LOGS_DIR, `${key}-complete.json`);
  try {
    writeJSON(completeLogPath, completionLog);
  } catch (err) {
    console.error(`Error: Failed to write completion log: ${err.message}`);
    process.exit(2);
  }

  // 9. Write sprint report markdown
  const completionRate =
    totalItems > 0 ? Math.round(((resolvedCount + falsePositiveCount) / totalItems) * 100) : 0;

  const resolvedSeverity = severityBreakdown(resolved);
  const resolvedCategory = categoryBreakdown(resolved);
  const focus = sprintManifest.focus || sprintManifest.name || sprintEntry.focus || "";
  const dateStr = new Date().toISOString().split("T")[0];

  const carriedLine =
    remainingCount > 0 && carriedTo
      ? `| Carried Forward | ${remainingCount} (-> ${carriedTo}) |`
      : `| Carried Forward | 0 |`;

  let report = `# Sprint ${sprintId.replace(/^sprint-/, "")} Completion Report

**Completed:** ${dateStr}
**Focus:** ${focus}

## Summary
| Metric | Value |
|--------|-------|
| Total Items | ${totalItems} |
| Resolved | ${resolvedCount} |
| False Positive | ${falsePositiveCount} |
${carriedLine}
| Completion Rate | ${completionRate}% |

## Severity Breakdown (Resolved)
| Severity | Count |
|----------|-------|
`;

  // Sort severities: S0, S1, S2, S3, then any others
  const sevOrder = ["S0", "S1", "S2", "S3"];
  const sevKeys = Object.keys(resolvedSeverity).sort((a, b) => {
    const ai = sevOrder.indexOf(a);
    const bi = sevOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  for (const sev of sevKeys) {
    report += `| ${sev} | ${resolvedSeverity[sev]} |\n`;
  }

  report += `
## Category Breakdown (Resolved)
| Category | Count |
|----------|-------|
`;

  const catKeys = Object.keys(resolvedCategory).sort();
  for (const cat of catKeys) {
    report += `| ${cat} | ${resolvedCategory[cat]} |\n`;
  }

  const reportPath = path.join(LOGS_DIR, `${key}-report.md`);
  try {
    fs.writeFileSync(reportPath, report, "utf-8");
  } catch (err) {
    console.error(`Error: Failed to write sprint report: ${err.message}`);
    process.exit(2);
  }

  console.log(`\nSprint ${key} marked COMPLETE`);
  console.log(`  Completion log: ${completeLogPath}`);
  console.log(`  Report: ${reportPath}`);
  process.exit(0);
}

main();
