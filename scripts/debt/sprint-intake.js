#!/usr/bin/env node
/* global __dirname */
/**
 * TDMS Sprint Intake — finds unplaced MASTER_DEBT items and assigns to sprints
 *
 * Usage: node scripts/debt/sprint-intake.js [--dry-run|--apply] [--json]
 *   --dry-run  (default) Shows placement plan without writing
 *   --apply    Writes changes to sprint manifest files
 *   --json     Machine-readable JSON output
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const LOGS_DIR = path.join(ROOT, "docs/technical-debt/logs");
const MASTER_PATH = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const MANIFEST_PATH = path.join(LOGS_DIR, "grand-plan-manifest.json");

// --- CLI args ---
const args = process.argv.slice(2);
const applyMode = args.includes("--apply");
const jsonMode = args.includes("--json");

// --- Focus directory mapping ---
// Each entry: [prefixTest, primarySprint, overflowSprint]
const FOCUS_MAP = [
  { test: (f) => f.startsWith("scripts/"), sprint: "sprint-1", overflow: "sprint-8a" },
  { test: (f) => f.startsWith("components/"), sprint: "sprint-2", overflow: "sprint-8b" },
  {
    test: (f) => f.startsWith("docs/") || f.startsWith(".claude/"),
    sprint: "sprint-3",
    overflow: "sprint-8c",
  },
  { test: (f) => /^(?:lib|hooks|app|styles|types)\//.test(f), sprint: "sprint-4", overflow: null },
  {
    test: (f) => f.startsWith(".github/") || f.startsWith(".husky/"),
    sprint: "sprint-5",
    overflow: null,
  },
  { test: (f) => f.startsWith("functions/"), sprint: "sprint-6", overflow: null },
  { test: (f) => f.startsWith("tests/"), sprint: "sprint-7", overflow: null },
];

/**
 * Safely read and parse a JSON file. Returns null on failure.
 */
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Safely write JSON to a file with 2-space indent.
 */
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Step 1: Collect all assigned DEBT IDs from sprint-*-ids.json files.
 */
function collectAssignedIds() {
  const assigned = new Set();
  let files;
  try {
    files = fs.readdirSync(LOGS_DIR);
  } catch {
    return assigned;
  }
  const pattern = /^sprint-.*-ids\.json$/;
  for (const file of files) {
    if (!pattern.test(file)) continue;
    const data = readJSON(path.join(LOGS_DIR, file));
    if (data && Array.isArray(data.ids)) {
      for (const id of data.ids) {
        assigned.add(id);
      }
    }
  }
  return assigned;
}

/**
 * Step 2: Read MASTER_DEBT.jsonl and return items with status VERIFIED or NEW.
 */
function readMasterDebt() {
  const items = [];
  let raw;
  try {
    raw = fs.readFileSync(MASTER_PATH, "utf8");
  } catch {
    return items;
  }
  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const item = JSON.parse(trimmed);
      if (item.status === "VERIFIED" || item.status === "NEW") {
        items.push(item);
      }
    } catch {
      // skip malformed lines
    }
  }
  return items;
}

/**
 * Step 3: Read grand-plan-manifest to check sprint statuses.
 */
function readManifest() {
  const data = readJSON(MANIFEST_PATH);
  if (!data || !data.sprints) {
    return { sprints: {} };
  }
  return data;
}

/**
 * Step 4: Determine target sprint for a file path.
 * Returns { sprint, method } or { sprint: null, method: "manual" }.
 */
function resolveTarget(filePath, manifest) {
  if (!filePath) {
    return { sprint: null, method: "manual" };
  }

  // Normalize backslashes to forward slashes and reject path traversal
  const normalized = filePath.replace(/\\/g, "/");
  if (/^\.\.(?:[/\\]|$)/.test(normalized)) {
    return { sprint: null, method: "manual" };
  }

  for (const entry of FOCUS_MAP) {
    if (entry.test(normalized)) {
      const primary = entry.sprint;
      const sprintInfo = manifest.sprints[primary];
      if (sprintInfo && sprintInfo.status === "COMPLETE" && entry.overflow) {
        return { sprint: entry.overflow, method: "auto" };
      }
      return { sprint: primary, method: "auto" };
    }
  }

  return { sprint: null, method: "manual" };
}

/**
 * Build human-readable label for a sprint target.
 */
function sprintLabel(sprintName, manifest) {
  const info = manifest.sprints[sprintName];
  if (info && info.focus) {
    return `${sprintName} (${info.focus})`;
  }
  return sprintName;
}

/**
 * Apply placements: update sprint-*-ids.json and grand-plan-manifest.json.
 */
function applyPlacements(placements, manifest) {
  // Group placements by target sprint
  const grouped = {};
  for (const p of placements) {
    if (!p.target) continue;
    if (!grouped[p.target]) grouped[p.target] = [];
    grouped[p.target].push(p);
  }

  for (const [sprintName, items] of Object.entries(grouped)) {
    const idsFile = path.join(LOGS_DIR, `${sprintName}-ids.json`);
    let sprintData = readJSON(idsFile);

    if (!sprintData) {
      // Create minimal structure if file doesn't exist
      sprintData = {
        sprint: sprintName,
        focus: (manifest.sprints[sprintName] && manifest.sprints[sprintName].focus) || sprintName,
        ids: [],
        severity: {},
        name: (manifest.sprints[sprintName] && manifest.sprints[sprintName].focus) || sprintName,
      };
    }

    if (!Array.isArray(sprintData.ids)) {
      sprintData.ids = [];
    }
    if (!sprintData.severity) {
      sprintData.severity = {};
    }

    for (const item of items) {
      if (!sprintData.ids.includes(item.id)) {
        sprintData.ids.push(item.id);
      }
      // Update severity counts
      const sev = item.severity || "S3";
      sprintData.severity[sev] = (sprintData.severity[sev] || 0) + 1;
    }

    writeJSON(idsFile, sprintData);

    // Update item count in manifest
    if (manifest.sprints[sprintName]) {
      manifest.sprints[sprintName].items = sprintData.ids.length;
    }
  }

  // Update manifest coverage
  if (manifest.coverage) {
    const manualCount = placements.filter((p) => !p.target).length;
    const autoCount = placements.filter((p) => p.target).length;
    manifest.coverage.placed_grand_plan = (manifest.coverage.placed_grand_plan || 0) + autoCount;
    manifest.coverage.unplaced = (manifest.coverage.unplaced || 0) - autoCount + manualCount;
    if (manifest.coverage.unplaced < 0) manifest.coverage.unplaced = 0;
  }

  manifest.generated = new Date().toISOString();
  writeJSON(MANIFEST_PATH, manifest);
}

// --- Main ---
function main() {
  const assignedSet = collectAssignedIds();
  const masterItems = readMasterDebt();
  const manifest = readManifest();

  // Find unplaced items
  const unplaced = masterItems.filter((item) => item.id && !assignedSet.has(item.id));

  // Determine placements
  const placements = unplaced.map((item) => {
    const { sprint, method } = resolveTarget(item.file, manifest);
    return {
      id: item.id,
      file: item.file || null,
      severity: item.severity || "S3",
      title: item.title || item.description || "",
      target: sprint,
      method,
    };
  });

  // Build summary counts
  const summary = {};
  for (const p of placements) {
    const key = p.target || "manual";
    summary[key] = (summary[key] || 0) + 1;
  }

  // Apply if requested
  if (applyMode && placements.length > 0) {
    applyPlacements(placements, manifest);
  }

  // --- Output ---
  if (jsonMode) {
    const output = {
      unplaced: unplaced.length,
      placements: placements.map((p) => ({
        id: p.id,
        file: p.file,
        severity: p.severity,
        target: p.target,
        method: p.method,
      })),
      summary,
      applied: applyMode,
    };
    process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  } else {
    console.log("TDMS Sprint Intake");
    console.log(`  ${unplaced.length} unplaced items found\n`);

    if (unplaced.length === 0) {
      console.log("  All items are already placed. Nothing to do.");
      return;
    }

    // Group by target for display
    const grouped = {};
    const manual = [];
    for (const p of placements) {
      if (p.target) {
        if (!grouped[p.target]) grouped[p.target] = [];
        grouped[p.target].push(p);
      } else {
        manual.push(p);
      }
    }

    if (Object.keys(grouped).length > 0) {
      console.log("  Auto-placement:");
      const sortedSprints = Object.keys(grouped).sort();
      for (const sprintName of sortedSprints) {
        const items = grouped[sprintName];
        const label = sprintLabel(sprintName, manifest);
        console.log(`    ${label}: ${items.length} item${items.length === 1 ? "" : "s"}`);
        for (const item of items) {
          const fileStr = item.file || "(no file)";
          const titleStr = item.title ? ` ${item.title}` : "";
          const truncTitle = titleStr.length > 60 ? titleStr.slice(0, 57) + "..." : titleStr;
          console.log(`      ${item.id} [${item.severity}]${truncTitle} \u2014 ${fileStr}`);
        }
      }
      console.log();
    }

    if (manual.length > 0) {
      console.log(
        `  Manual placement needed: ${manual.length} item${manual.length === 1 ? "" : "s"}`
      );
      for (const item of manual) {
        const titleStr = item.title ? ` ${item.title}` : "";
        const truncTitle = titleStr.length > 60 ? titleStr.slice(0, 57) + "..." : titleStr;
        console.log(
          `    ${item.id} [${item.severity}]${truncTitle} \u2014 (needs manual assignment)`
        );
      }
      console.log();
    }

    if (applyMode) {
      console.log("  Changes applied.");
    } else {
      console.log("  Run with --apply to write changes.");
    }
  }
}

main();
