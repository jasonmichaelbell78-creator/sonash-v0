#!/usr/bin/env node
/* global __dirname */
/**
 * Step 7: Categorize & Assign — Technical Debt Resolution Plan
 *
 * Reads MASTER_DEBT.jsonl, categorizes all open items (VERIFIED/NEW) into
 * either Grand Plan sprints or Roadmap milestones, and writes manifests.
 *
 * Usage:
 *   node scripts/debt/categorize-and-assign.js [--write] [--verbose]
 *
 * Default is dry-run (no files written).
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("../lib/sanitize-error.js");

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, "../..");
const DEBT_DIR = path.join(ROOT, "docs/technical-debt");
const LOGS_DIR = path.join(DEBT_DIR, "logs");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const MANIFEST_FILE = path.join(LOGS_DIR, "grand-plan-manifest.json");

// ── Constants ──────────────────────────────────────────────────────────────
const ROADMAP_CATEGORIES = new Set(["security", "enhancements", "performance"]);
const GRAND_PLAN_CATEGORIES = new Set([
  "code-quality",
  "documentation",
  "process",
  "refactoring",
  "engineering-productivity",
  "ai-optimization",
]);
const COMPLETE_SPRINTS = new Set(["sprint-1", "sprint-2", "sprint-3"]);
const MAX_SPRINT_SIZE = 200;

const ROADMAP_DEFAULTS = {
  security: "Track-S",
  enhancements: "M3-M10",
  performance: "M2",
};

// ── CLI parsing ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { write: false, verbose: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--write") opts.write = true;
    else if (arg === "--verbose") opts.verbose = true;
  }
  return opts;
}

const readJsonl = require("../lib/read-jsonl");
const { safeWriteFileSync, safeRenameSync } = require("../lib/safe-fs");

// ── File I/O helpers ───────────────────────────────────────────────────────
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Failed to read JSON ${path.basename(filePath)}:`, sanitizeError(err));
    return null;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmpPath = filePath + ".tmp";
    safeWriteFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    try {
      safeRenameSync(tmpPath, filePath);
    } catch {
      // Windows may fail rename if dest exists; remove dest first then retry
      try {
        fs.rmSync(filePath, { force: true });
      } catch {
        /* ignore */
      }
      safeRenameSync(tmpPath, filePath);
    }
  } catch (err) {
    console.error(`Failed to write ${path.basename(filePath)}:`, sanitizeError(err));
    process.exit(1);
  }
}

// ── Build lookup of existing sprint assignments ────────────────────────────
function buildExistingAssignments(manifest) {
  const map = new Map(); // id → sprint key
  if (!manifest || !manifest.sprints) return map;
  for (const [sprintKey, sprintData] of Object.entries(manifest.sprints)) {
    const ids = sprintData.ids || [];
    for (const id of ids) {
      map.set(id, sprintKey);
    }
  }
  return map;
}

// ── Determine sprint bucket for a file path ────────────────────────────────
function getSprintBucketForPath(filePath) {
  if (!filePath || filePath === "N/A" || filePath === "") return 12;
  const norm = path.posix.normalize(filePath.replaceAll("\\", "/"));
  if (/(^|\/)\.\.(\/|$)/.test(norm)) return 12;
  if (norm.startsWith("scripts/")) return 8;
  if (norm.startsWith(".claude/") || norm.startsWith("docs/")) return 9;
  if (norm.startsWith(".github/") || norm.startsWith(".husky/") || isRootConfigFile(norm)) {
    return 10;
  }
  // components/, app/, lib/, functions/, hooks/, types/ → Sprint 11
  return 11;
}

function isRootConfigFile(filePath) {
  // Root-level config: no directory separator, ends in .json or .yml/.yaml
  if (filePath.includes("/")) return false;
  return /\.(json|yml|yaml)$/i.test(filePath);
}

// ── Categorize a single item ───────────────────────────────────────────────
function categorizeItem(item) {
  if (ROADMAP_CATEGORIES.has(item.category)) {
    return { type: "roadmap", category: item.category };
  }
  if (GRAND_PLAN_CATEGORIES.has(item.category)) {
    return { type: "grand-plan", category: item.category };
  }
  // Default unknown categories to grand-plan
  return { type: "grand-plan", category: item.category || "unknown" };
}

// ── Split oversized sprints into sub-sprints ───────────────────────────────
function splitOversizedSprints(sprintBuckets) {
  const result = new Map();
  for (const [sprintNum, ids] of sprintBuckets.entries()) {
    if (ids.length <= MAX_SPRINT_SIZE) {
      result.set(String(sprintNum), ids);
    } else {
      const chunks = [];
      for (let i = 0; i < ids.length; i += MAX_SPRINT_SIZE) {
        chunks.push(ids.slice(i, i + MAX_SPRINT_SIZE));
      }
      const suffixes = "abcdefghijklmnopqrstuvwxyz";
      for (let c = 0; c < chunks.length; c++) {
        const key = `${sprintNum}${suffixes[c] || c}`;
        result.set(key, chunks[c]);
      }
    }
  }
  return result;
}

// ── Sprint focus descriptions ──────────────────────────────────────────────
const SPRINT_FOCUS = {
  8: "scripts/ overflow",
  9: ".claude/ and docs/",
  10: ".github/, .husky/, root config files",
  11: "components/, app/, lib/, functions/, hooks/, types/",
  12: "Cross-cutting items (no specific file)",
};

function getFocusForSprint(key) {
  const numMatch = key.match(/^(\d+)/);
  if (!numMatch) return "Mixed";
  const num = Number.parseInt(numMatch[1], 10);
  return SPRINT_FOCUS[num] || `Sprint ${key}`;
}

// ── Classify open items into roadmap/sprint buckets ────────────────────────
function classifyOpenItems(openItems, existingAssignments) {
  const roadmapBound = { security: [], enhancements: [], performance: [] };
  const newSprintBuckets = new Map(); // sprintNum → [ids]
  const keptInExisting = new Map(); // "sprint-N" → [ids] for sprints 4-7
  for (let s = 4; s <= 7; s++) keptInExisting.set(`sprint-${s}`, []);

  let keptInComplete = 0;

  for (const item of openItems) {
    const cat = categorizeItem(item);

    if (cat.type === "roadmap") {
      roadmapBound[cat.category].push(item.id);
      continue;
    }

    const existingSprint = existingAssignments.get(item.id);

    if (existingSprint && COMPLETE_SPRINTS.has(existingSprint)) {
      keptInComplete++;
      continue;
    }

    if (existingSprint && /^sprint-[4-7]$/.test(existingSprint)) {
      keptInExisting.get(existingSprint).push(item.id);
      continue;
    }

    const bucket = getSprintBucketForPath(item.file);
    if (!newSprintBuckets.has(bucket)) newSprintBuckets.set(bucket, []);
    newSprintBuckets.get(bucket).push(item.id);
  }

  return { roadmapBound, newSprintBuckets, keptInExisting, keptInComplete };
}

// ── Main logic ─────────────────────────────────────────────────────────────
function run() {
  const opts = parseArgs(process.argv);
  const items = readJsonl(MASTER_FILE);
  const manifest = readJsonSafe(MANIFEST_FILE) || { sprints: {} };
  const existingAssignments = buildExistingAssignments(manifest);

  // Filter open items
  const openItems = items.filter((it) => it.status === "VERIFIED" || it.status === "NEW");

  // Collect existing sprint-N-ids.json data for sprints 4-7
  const existingSprintFiles = {};
  for (let s = 4; s <= 7; s++) {
    const spFile = path.join(LOGS_DIR, `sprint-${s}-ids.json`);
    const data = readJsonSafe(spFile);
    if (data) existingSprintFiles[`sprint-${s}`] = data;
  }

  // Classify items into buckets
  const { roadmapBound, newSprintBuckets, keptInExisting, keptInComplete } = classifyOpenItems(
    openItems,
    existingAssignments
  );

  // Split oversized new sprints
  const finalNewSprints = splitOversizedSprints(newSprintBuckets);

  // ── Build updated manifest ─────────────────────────────────────────────
  const updatedManifest = buildManifest(
    manifest,
    keptInExisting,
    finalNewSprints,
    roadmapBound,
    openItems.length,
    keptInComplete
  );

  // ── Print summary ──────────────────────────────────────────────────────
  printSummary(
    updatedManifest,
    keptInExisting,
    finalNewSprints,
    roadmapBound,
    openItems.length,
    opts
  );

  if (!opts.write) {
    console.log("\n[DRY RUN] No files written. Use --write to apply changes.");
    return;
  }

  // ── Write files ────────────────────────────────────────────────────────
  writeManifest(updatedManifest);
  writeSprintIdFiles(keptInExisting, finalNewSprints, existingSprintFiles);
  console.log("\n[WRITE] All files updated successfully.");
}

// ── Build the updated manifest object ──────────────────────────────────────
function buildManifest(
  oldManifest,
  keptInExisting,
  newSprints,
  roadmapBound,
  totalOpen,
  keptInComplete
) {
  const sprints = {};

  // Preserve complete sprints 1-3 from old manifest
  for (const key of ["sprint-1", "sprint-2", "sprint-3"]) {
    if (oldManifest.sprints[key]) {
      sprints[key] = {
        status: "COMPLETE",
        items: oldManifest.sprints[key].ids
          ? oldManifest.sprints[key].ids.length
          : (oldManifest.sprints[key].items ?? 0),
        focus: getExistingFocus(key),
      };
    }
  }

  // Update sprints 4-7 with cleaned IDs
  for (let s = 4; s <= 7; s++) {
    const key = `sprint-${s}`;
    const ids = keptInExisting.get(key) || [];
    sprints[key] = {
      status: "ACTIVE",
      items: ids.length,
      focus: getExistingFocus(key),
    };
  }

  // Add new sprints 8+
  for (const [sprintKey, ids] of newSprints.entries()) {
    const manifestKey = `sprint-${sprintKey}`;
    sprints[manifestKey] = {
      status: "PLANNED",
      items: ids.length,
      focus: getFocusForSprint(sprintKey),
    };
  }

  // Compute coverage (include items still in complete sprints 1-3)
  const placedGrandPlan = keptInComplete + sumSprintItems(keptInExisting) + sumMapItems(newSprints);
  const placedRoadmap =
    roadmapBound.security.length +
    roadmapBound.enhancements.length +
    roadmapBound.performance.length;

  return {
    version: "2.0",
    generated: new Date().toISOString(),
    sprints,
    roadmap_bound: {
      security: { count: roadmapBound.security.length, roadmap_ref: "Track-S" },
      enhancements: { count: roadmapBound.enhancements.length, roadmap_ref: "M3-M10" },
      performance: { count: roadmapBound.performance.length, roadmap_ref: "M2" },
    },
    coverage: {
      total_open: totalOpen,
      placed_grand_plan: placedGrandPlan,
      placed_roadmap: placedRoadmap,
      unplaced: totalOpen - placedGrandPlan - placedRoadmap,
    },
  };
}

function getExistingFocus(key) {
  const focusMap = {
    "sprint-1": "scripts/ (core)",
    "sprint-2": "components/",
    "sprint-3": "docs/ + .claude/ + root .md",
    "sprint-4": "lib/ + hooks/ + app/ + styles/ + types/",
    "sprint-5": ".github/ + .husky/ + config files",
    "sprint-6": "functions/ + firestore.rules",
    "sprint-7": "tests/ + systemic",
  };
  return focusMap[key] || key;
}

function sumSprintItems(keptMap) {
  let total = 0;
  for (const ids of keptMap.values()) total += ids.length;
  return total;
}

function sumMapItems(sprintMap) {
  let total = 0;
  for (const ids of sprintMap.values()) total += ids.length;
  return total;
}

// ── Print summary ──────────────────────────────────────────────────────────
function printSummary(manifest, keptInExisting, newSprints, roadmapBound, totalOpen, opts) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Categorize & Assign — Step 7 Summary");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("── Grand Plan Sprints ──");
  printCompleteSprints(manifest);
  printActiveSprints(keptInExisting, opts);
  printNewSprints(newSprints, opts);

  console.log("\n── Roadmap-Bound Items ──");
  for (const [cat, ids] of Object.entries(roadmapBound)) {
    const ref = ROADMAP_DEFAULTS[cat];
    console.log(`  ${cat}: ${ids.length} items → ${ref}`);
    if (opts.verbose && ids.length > 0) {
      const overflow = ids.length > 10 ? ` ... (+${ids.length - 10} more)` : "";
      console.log(`    IDs: ${ids.slice(0, 10).join(", ")}${overflow}`);
    }
  }

  console.log("\n── Coverage ──");
  const cov = manifest.coverage;
  const pct =
    totalOpen > 0
      ? (((cov.placed_grand_plan + cov.placed_roadmap) / totalOpen) * 100).toFixed(1)
      : "0.0";
  console.log(`  Total open items:     ${cov.total_open}`);
  console.log(`  Placed (Grand Plan):  ${cov.placed_grand_plan}`);
  console.log(`  Placed (Roadmap):     ${cov.placed_roadmap}`);
  console.log(`  Unplaced:             ${cov.unplaced}`);
  console.log(`  Coverage:             ${pct}%`);
}

function printCompleteSprints(manifest) {
  for (const key of ["sprint-1", "sprint-2", "sprint-3"]) {
    const s = manifest.sprints[key];
    if (s) console.log(`  ${key}: ${s.items} items [COMPLETE] — ${s.focus}`);
  }
}

function printActiveSprints(keptInExisting, opts) {
  for (let s = 4; s <= 7; s++) {
    const key = `sprint-${s}`;
    const ids = keptInExisting.get(key) || [];
    console.log(`  ${key}: ${ids.length} items [ACTIVE] — ${getExistingFocus(key)}`);
    if (opts.verbose && ids.length > 0) {
      console.log(`    Sample: ${ids.slice(0, 5).join(", ")}${ids.length > 5 ? " ..." : ""}`);
    }
  }
}

function printNewSprints(newSprints, opts) {
  const sortedKeys = [...newSprints.keys()].sort((a, b) => {
    const na = Number.parseFloat(a);
    const nb = Number.parseFloat(b);
    if (na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
  for (const key of sortedKeys) {
    const ids = newSprints.get(key);
    const focus = getFocusForSprint(key);
    console.log(`  sprint-${key}: ${ids.length} items [PLANNED] — ${focus}`);
    if (opts.verbose && ids.length > 0) {
      console.log(`    Sample: ${ids.slice(0, 5).join(", ")}${ids.length > 5 ? " ..." : ""}`);
    }
  }
}

// ── Write manifest ─────────────────────────────────────────────────────────
function writeManifest(manifest) {
  writeJsonSafe(MANIFEST_FILE, manifest);
  console.log(`  Wrote: ${path.relative(ROOT, MANIFEST_FILE)}`);
}

// ── Write sprint ID files ──────────────────────────────────────────────────
function writeSprintIdFiles(keptInExisting, newSprints, existingSprintFiles) {
  // Update sprints 4-7
  for (let s = 4; s <= 7; s++) {
    const key = `sprint-${s}`;
    const ids = keptInExisting.get(key) || [];
    const existing = existingSprintFiles[key] || {};
    const data = {
      sprint: key,
      focus: getExistingFocus(key),
      ids: ids.sort(),
    };
    // Preserve severity if present in existing
    if (existing.severity) data.severity = existing.severity;
    if (existing.name) data.name = existing.name;
    const filePath = path.join(LOGS_DIR, `${key}-ids.json`);
    writeJsonSafe(filePath, data);
    console.log(`  Wrote: ${path.relative(ROOT, filePath)} (${ids.length} ids)`);
  }

  // Write new sprint files
  for (const [sprintKey, ids] of newSprints.entries()) {
    const fileName = `sprint-${sprintKey}-ids.json`;
    const filePath = path.join(LOGS_DIR, fileName);
    // Path containment check
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(LOGS_DIR))) {
      console.error(`  Skipping ${fileName}: path traversal detected`);
      continue;
    }
    const data = {
      sprint: `sprint-${sprintKey}`,
      focus: getFocusForSprint(sprintKey),
      ids: ids.sort(),
    };
    writeJsonSafe(filePath, data);
    console.log(`  Wrote: ${path.relative(ROOT, filePath)} (${ids.length} ids)`);
  }
}

// ── Entry point ────────────────────────────────────────────────────────────
try {
  run();
} catch (err) {
  console.error("Fatal error:", sanitizeError(err));
  process.exit(1);
}
