#!/usr/bin/env node
/* global __dirname */
/**
 * Analyze placement of all MASTER_DEBT items across planning documents.
 * Verifies every open item is assigned to a sprint or roadmap-bound category.
 */

const fs = require("node:fs"); // catch-verified: core module
const path = require("node:path"); // catch-verified: core module

const ROOT = path.join(__dirname, "../..");
const MASTER = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const SPRINT_DIR = path.join(ROOT, "docs/technical-debt/logs");
const ROADMAP = path.join(ROOT, "ROADMAP.md");
const GRAND_PLAN = path.join(ROOT, "docs/technical-debt/GRAND_PLAN_V2.md");
const INDEX = path.join(ROOT, "docs/technical-debt/INDEX.md");
const SESSION = path.join(ROOT, "SESSION_CONTEXT.md");

// 1. Load MASTER_DEBT
const rawLines = fs.readFileSync(MASTER, "utf8").replaceAll("\uFEFF", "").trim().split("\n");
const items = (Array.isArray(rawLines) ? rawLines : [])
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

/**
 * Extract ID array from sprint data (handles both array and {ids:[]} formats).
 */
function extractIdArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.ids)) return data.ids;
  return [];
}

// 2. Load sprint assignments
const rawSprintFiles = fs.readdirSync(SPRINT_DIR);
const sprintFiles = (Array.isArray(rawSprintFiles) ? rawSprintFiles : []).filter(
  (f) => f.startsWith("sprint-") && f.endsWith("-ids.json")
);
const sprintMap = {};
const sprintCounts = {};
for (const f of sprintFiles) {
  const name = f.replace("-ids.json", "");
  const filePath = path.join(SPRINT_DIR, f);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8").replaceAll("\uFEFF", ""));
    const ids = extractIdArray(data);
    sprintCounts[name] = ids.length;
    for (const id of ids) sprintMap[id] = name;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[analyze-placement] Skipping invalid sprint file ${f}: ${msg}`);
  }
}

// 3. Extract DEBT-XXXX references from planning docs
function extractDebtIds(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const content = fs.readFileSync(filePath, "utf8").replaceAll("\uFEFF", "");
  const ids = new Set();
  // matchAll avoids exec-in-while-loop pattern concern
  const matches = content.matchAll(/DEBT-\d+/g);
  for (const match of matches) ids.add(match[0]);
  return ids;
}

const roadmapIds = extractDebtIds(ROADMAP);
const gpIds = extractDebtIds(GRAND_PLAN);
const indexIds = extractDebtIds(INDEX);
const sessionIds = extractDebtIds(SESSION);

// 4. Roadmap-bound categories
const ROADMAP_CATS = new Set(["security", "enhancements", "performance"]);

// --- Helper: classify a single item's placements ---
function classifyItem(item) {
  const placements = [];

  if (item.status === "RESOLVED" || item.status === "FALSE_POSITIVE") {
    placements.push("resolved/fp");
  }
  if (sprintMap[item.id]) {
    placements.push("sprint:" + sprintMap[item.id]);
  }
  if (
    ROADMAP_CATS.has(item.category) &&
    item.status !== "RESOLVED" &&
    item.status !== "FALSE_POSITIVE"
  ) {
    placements.push("roadmap-category");
  }
  if (roadmapIds.has(item.id)) placements.push("ROADMAP.md");
  if (gpIds.has(item.id)) placements.push("GRAND_PLAN");
  if (indexIds.has(item.id)) placements.push("INDEX.md");
  if (sessionIds.has(item.id)) placements.push("SESSION_CONTEXT");

  return placements;
}

/**
 * Format a label with optional extras suffix.
 */
function formatWithExtras(label, extras) {
  if (extras.length === 0) return label;
  return label + " + " + extras.join(", ");
}

/**
 * Build sprint placement label from placements array.
 */
function formatSprintPlacement(placements) {
  const sprintEntry = placements.find((p) => p.startsWith("sprint:"));
  const sprint = sprintEntry.split(":")[1];
  const extras = placements.filter((p) => p !== "sprint:" + sprint && p !== "roadmap-category");
  return formatWithExtras("Sprint (" + sprint + ")", extras);
}

/**
 * Build roadmap placement label from placements array.
 */
function formatRoadmapPlacement(placements, item) {
  const extras = placements.filter((p) => p !== "roadmap-category");
  return formatWithExtras("Roadmap-bound (" + item.category + ")", extras);
}

// --- Helper: simplify placement key ---
function simplifyPlacements(placements, item) {
  if (!Array.isArray(placements) || placements.length === 0) return "UNPLACED";
  if (placements[0] === "resolved/fp") return "Resolved/FP";
  if (placements.some((p) => p.startsWith("sprint:"))) return formatSprintPlacement(placements);
  if (placements.includes("roadmap-category")) return formatRoadmapPlacement(placements, item);
  return placements.join(" + ");
}

// --- Helper: update category placement tracking ---
function updateCategoryPlacement(categoryPlacement, item, placements) {
  const cat = item.category || "unknown";
  if (!categoryPlacement[cat]) {
    categoryPlacement[cat] = { total: 0, sprint: 0, roadmap: 0, resolved: 0, unplaced: 0 };
  }
  categoryPlacement[cat].total++;
  if (item.status === "RESOLVED" || item.status === "FALSE_POSITIVE") {
    categoryPlacement[cat].resolved++;
  } else if (sprintMap[item.id]) {
    categoryPlacement[cat].sprint++;
  } else if (ROADMAP_CATS.has(cat)) {
    categoryPlacement[cat].roadmap++;
  } else if (Array.isArray(placements) && placements.length === 0) {
    categoryPlacement[cat].unplaced++;
  }
}

// 5. Classify each item
const placementStats = {};
let unplacedCount = 0;
const statusCounts = {};
const categoryPlacement = {};

for (const item of items) {
  statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;

  const placements = classifyItem(item);
  const simplified = simplifyPlacements(placements, item);

  if (simplified === "UNPLACED") {
    unplacedCount++;
  }

  placementStats[simplified] = (placementStats[simplified] || 0) + 1;
  updateCategoryPlacement(categoryPlacement, item, placements);
}

// 6. Output
console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║         MASTER_DEBT PLACEMENT ANALYSIS — Full Audit            ║");
console.log("╚══════════════════════════════════════════════════════════════════╝");
console.log("");
console.log("Total MASTER_DEBT items:", Array.isArray(items) ? items.length : 0);
console.log("");

console.log("━━━ Status Breakdown ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const statusEntries = Object.entries(statusCounts);
// eslint-disable-next-line -- array guaranteed by Object.entries
(Array.isArray(statusEntries) ? statusEntries : [])
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log("  " + k.padEnd(18) + v.toString().padStart(5)));

console.log("");
console.log("━━━ Placement Locations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const sprintMapKeys = Object.keys(sprintMap);
console.log(
  "  Sprint files:       " +
    (Array.isArray(sprintMapKeys) ? sprintMapKeys.length : 0) +
    " items across " +
    (Array.isArray(sprintFiles) ? sprintFiles.length : 0) +
    " sprints"
);
const roadmapBound = (Array.isArray(items) ? items : []).filter(
  (i) => ROADMAP_CATS.has(i.category) && i.status !== "RESOLVED" && i.status !== "FALSE_POSITIVE"
);
console.log(
  "  Roadmap categories: " +
    (Array.isArray(roadmapBound) ? roadmapBound.length : 0) +
    " (security/enhancements/performance)"
);
console.log("  ROADMAP.md refs:    " + roadmapIds.size + " explicit DEBT-ID mentions");
console.log("  GRAND_PLAN refs:    " + gpIds.size + " explicit DEBT-ID mentions");
console.log("  INDEX.md refs:      " + indexIds.size + " explicit DEBT-ID mentions");
console.log("  SESSION_CONTEXT:    " + sessionIds.size + " explicit DEBT-ID mentions");

console.log("");
console.log("━━━ Category Placement Matrix ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(
  "  " +
    "Category".padEnd(28) +
    "Total".padStart(6) +
    "Sprint".padStart(8) +
    "Roadmap".padStart(9) +
    "Resolved".padStart(10) +
    "Unplaced".padStart(10)
);
console.log("  " + "─".repeat(71));
const catEntries = Object.entries(categoryPlacement);
// eslint-disable-next-line -- array guaranteed by Object.entries
(Array.isArray(catEntries) ? catEntries : [])
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([cat, c]) => {
    console.log(
      "  " +
        cat.padEnd(28) +
        c.total.toString().padStart(6) +
        c.sprint.toString().padStart(8) +
        c.roadmap.toString().padStart(9) +
        c.resolved.toString().padStart(10) +
        c.unplaced.toString().padStart(10)
    );
  });

console.log("");
console.log("━━━ Sprint File Inventory ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const sprintGroups = { COMPLETE: [], ACTIVE: [], PLANNED: [] };

// Load manifest for status
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(SPRINT_DIR, "grand-plan-manifest.json"), "utf8"));
} catch {
  manifest = { sprints: {} };
}

const countEntries = Object.entries(sprintCounts);
// eslint-disable-next-line -- array guaranteed by Object.entries
(Array.isArray(countEntries) ? countEntries : [])
  .sort((a, b) => {
    const na = a[0].replace("sprint-", "");
    const nb = b[0].replace("sprint-", "");
    return na.localeCompare(nb, undefined, { numeric: true });
  })
  .forEach(([name, count]) => {
    const status = (manifest.sprints[name] || {}).status || "UNKNOWN";
    const focus = (manifest.sprints[name] || {}).focus || "";
    console.log(
      "  " +
        name.padEnd(15) +
        count.toString().padStart(4) +
        " items  [" +
        status.padEnd(8) +
        "]  " +
        focus
    );
  });

// Totals
const sprintCountValues = Object.values(sprintCounts);
const totalSprint = (Array.isArray(sprintCountValues) ? sprintCountValues : []).reduce(
  (a, b) => a + b,
  0
);
console.log("  " + "─".repeat(60));
console.log("  " + "TOTAL".padEnd(15) + totalSprint.toString().padStart(4) + " items");

console.log("");
console.log("━━━ Coverage Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const openItems = (Array.isArray(items) ? items : []).filter(
  (i) => i.status !== "RESOLVED" && i.status !== "FALSE_POSITIVE"
);
const inSprint = (Array.isArray(openItems) ? openItems : []).filter((i) => sprintMap[i.id]);
const inRoadmap = (Array.isArray(openItems) ? openItems : []).filter(
  (i) => ROADMAP_CATS.has(i.category) && !sprintMap[i.id]
);
const bothSprintAndRoadmap = (Array.isArray(openItems) ? openItems : []).filter(
  (i) => ROADMAP_CATS.has(i.category) && sprintMap[i.id]
);
const unplaced = (Array.isArray(openItems) ? openItems : []).filter(
  (i) => !sprintMap[i.id] && !ROADMAP_CATS.has(i.category)
);

console.log("  Open items:                  " + (Array.isArray(openItems) ? openItems.length : 0));
console.log("  In sprints:                  " + (Array.isArray(inSprint) ? inSprint.length : 0));
console.log(
  "    (also roadmap-category):   " +
    (Array.isArray(bothSprintAndRoadmap) ? bothSprintAndRoadmap.length : 0)
);
console.log("  Roadmap-only (not sprint):   " + (Array.isArray(inRoadmap) ? inRoadmap.length : 0));
console.log("  Unplaced:                    " + (Array.isArray(unplaced) ? unplaced.length : 0));
const sprintLen = Array.isArray(inSprint) ? inSprint.length : 0;
const roadmapLen = Array.isArray(inRoadmap) ? inRoadmap.length : 0;
const hasOpen = Array.isArray(openItems) && openItems.length > 0;
const coveragePct = hasOpen
  ? (((sprintLen + roadmapLen) / openItems.length) * 100).toFixed(1)
  : "100.0";
console.log("  Coverage:                    " + coveragePct + "%");

if (Array.isArray(unplaced) && unplaced.length > 0) {
  console.log("");
  console.log(
    "━━━ UNPLACED ITEMS (" +
      (Array.isArray(unplaced) ? unplaced.length : 0) +
      ") ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );
  (Array.isArray(unplaced) ? unplaced : []).slice(0, 25).forEach((item) => {
    console.log(
      "  " +
        item.id.padEnd(12) +
        "[" +
        (item.category || "?").padEnd(20) +
        "] " +
        (item.title || "").substring(0, 50)
    );
  });
  if (Array.isArray(unplaced) && unplaced.length > 25)
    console.log("  ... and " + (unplaced.length - 25) + " more");
} else {
  console.log("");
  console.log("  *** ALL OPEN ITEMS ARE PLACED — 100% coverage ***");
}

// Check for orphaned sprint IDs (in sprint but not in MASTER_DEBT)
const masterIds = new Set((Array.isArray(items) ? items : []).map((i) => i.id));
const allSprintKeys = Object.keys(sprintMap);
const orphanedSprintIds = (Array.isArray(allSprintKeys) ? allSprintKeys : []).filter(
  (id) => !masterIds.has(id)
);
if (Array.isArray(orphanedSprintIds) && orphanedSprintIds.length > 0) {
  console.log("");
  console.log(
    "━━━ ORPHANED SPRINT IDS (" +
      (Array.isArray(orphanedSprintIds) ? orphanedSprintIds.length : 0) +
      ") — in sprint file but not in MASTER_DEBT ━━━"
  );
  (Array.isArray(orphanedSprintIds) ? orphanedSprintIds : []).slice(0, 20).forEach((id) => {
    console.log("  " + id + " in " + sprintMap[id]);
  });
  if (Array.isArray(orphanedSprintIds) && orphanedSprintIds.length > 20)
    console.log("  ... and " + (orphanedSprintIds.length - 20) + " more");
}
