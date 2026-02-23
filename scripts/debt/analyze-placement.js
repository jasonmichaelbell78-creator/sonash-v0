#!/usr/bin/env node
/* global __dirname */
/**
 * Analyze placement of all MASTER_DEBT items across planning documents.
 * Verifies every open item is assigned to a sprint or roadmap-bound category.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const MASTER = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const SPRINT_DIR = path.join(ROOT, "docs/technical-debt/logs");
const ROADMAP = path.join(ROOT, "ROADMAP.md");
const GRAND_PLAN = path.join(ROOT, "docs/technical-debt/GRAND_PLAN_V2.md");
const INDEX = path.join(ROOT, "docs/technical-debt/INDEX.md");
const SESSION = path.join(ROOT, "SESSION_CONTEXT.md");

// 1. Load MASTER_DEBT
const items = fs
  .readFileSync(MASTER, "utf8")
  .trim()
  .split("\n")
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

// 2. Load sprint assignments
const sprintFiles = fs
  .readdirSync(SPRINT_DIR)
  .filter((f) => f.startsWith("sprint-") && f.endsWith("-ids.json"));
const sprintMap = {};
const sprintCounts = {};
for (const f of sprintFiles) {
  const name = f.replace("-ids.json", "");
  const data = JSON.parse(fs.readFileSync(path.join(SPRINT_DIR, f), "utf8"));
  const ids = Array.isArray(data) ? data : data.ids || [];
  sprintCounts[name] = ids.length;
  for (const id of ids) sprintMap[id] = name;
}

// 3. Extract DEBT-XXXX references from planning docs
function extractDebtIds(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const content = fs.readFileSync(filePath, "utf8");
  const ids = new Set();
  const re = /DEBT-\d+/g;
  let match;
  while ((match = re.exec(content)) !== null) ids.add(match[0]);
  return ids;
}

const roadmapIds = extractDebtIds(ROADMAP);
const gpIds = extractDebtIds(GRAND_PLAN);
const indexIds = extractDebtIds(INDEX);
const sessionIds = extractDebtIds(SESSION);

// 4. Roadmap-bound categories
const ROADMAP_CATS = new Set(["security", "enhancements", "performance"]);

// 5. Classify each item
const placementStats = {};
const unplacedItems = [];
const statusCounts = {};
const categoryPlacement = {};

for (const item of items) {
  statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;

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

  // Simplified placement key
  let simplified;
  if (placements.length === 0) {
    simplified = "UNPLACED";
    unplacedItems.push(item);
  } else if (placements[0] === "resolved/fp") {
    simplified = "Resolved/FP";
  } else if (placements.some((p) => p.startsWith("sprint:"))) {
    const sprint = placements.find((p) => p.startsWith("sprint:")).split(":")[1];
    const extras = placements.filter((p) => p !== "sprint:" + sprint && p !== "roadmap-category");
    simplified = "Sprint (" + sprint + ")" + (extras.length ? " + " + extras.join(", ") : "");
  } else if (placements.includes("roadmap-category")) {
    const extras = placements.filter((p) => p !== "roadmap-category");
    simplified =
      "Roadmap-bound (" + item.category + ")" + (extras.length ? " + " + extras.join(", ") : "");
  } else {
    simplified = placements.join(" + ");
  }

  placementStats[simplified] = (placementStats[simplified] || 0) + 1;

  // Category-level tracking
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
  } else if (placements.length === 0) {
    categoryPlacement[cat].unplaced++;
  }
}

// 6. Output
console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║         MASTER_DEBT PLACEMENT ANALYSIS — Full Audit            ║");
console.log("╚══════════════════════════════════════════════════════════════════╝");
console.log("");
console.log("Total MASTER_DEBT items:", items.length);
console.log("");

console.log("━━━ Status Breakdown ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
Object.entries(statusCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log("  " + k.padEnd(18) + v.toString().padStart(5)));

console.log("");
console.log("━━━ Placement Locations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(
  "  Sprint files:       " +
    Object.keys(sprintMap).length +
    " items across " +
    sprintFiles.length +
    " sprints"
);
console.log(
  "  Roadmap categories: " +
    items.filter(
      (i) =>
        ROADMAP_CATS.has(i.category) && i.status !== "RESOLVED" && i.status !== "FALSE_POSITIVE"
    ).length +
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
Object.entries(categoryPlacement)
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

Object.entries(sprintCounts)
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
const totalSprint = Object.values(sprintCounts).reduce((a, b) => a + b, 0);
console.log("  " + "─".repeat(60));
console.log("  " + "TOTAL".padEnd(15) + totalSprint.toString().padStart(4) + " items");

console.log("");
console.log("━━━ Coverage Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const openItems = items.filter((i) => i.status !== "RESOLVED" && i.status !== "FALSE_POSITIVE");
const inSprint = openItems.filter((i) => sprintMap[i.id]);
const inRoadmap = openItems.filter((i) => ROADMAP_CATS.has(i.category) && !sprintMap[i.id]);
const bothSprintAndRoadmap = openItems.filter(
  (i) => ROADMAP_CATS.has(i.category) && sprintMap[i.id]
);
const unplaced = openItems.filter((i) => !sprintMap[i.id] && !ROADMAP_CATS.has(i.category));

console.log("  Open items:                  " + openItems.length);
console.log("  In sprints:                  " + inSprint.length);
console.log("    (also roadmap-category):   " + bothSprintAndRoadmap.length);
console.log("  Roadmap-only (not sprint):   " + inRoadmap.length);
console.log("  Unplaced:                    " + unplaced.length);
console.log(
  "  Coverage:                    " +
    (((inSprint.length + inRoadmap.length) / openItems.length) * 100).toFixed(1) +
    "%"
);

if (unplaced.length > 0) {
  console.log("");
  console.log("━━━ UNPLACED ITEMS (" + unplaced.length + ") ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  unplaced.slice(0, 25).forEach((item) => {
    console.log(
      "  " +
        item.id.padEnd(12) +
        "[" +
        (item.category || "?").padEnd(20) +
        "] " +
        (item.title || "").substring(0, 50)
    );
  });
  if (unplaced.length > 25) console.log("  ... and " + (unplaced.length - 25) + " more");
} else {
  console.log("");
  console.log("  *** ALL OPEN ITEMS ARE PLACED — 100% coverage ***");
}

// Check for orphaned sprint IDs (in sprint but not in MASTER_DEBT)
const masterIds = new Set(items.map((i) => i.id));
const orphanedSprintIds = Object.keys(sprintMap).filter((id) => !masterIds.has(id));
if (orphanedSprintIds.length > 0) {
  console.log("");
  console.log(
    "━━━ ORPHANED SPRINT IDS (" +
      orphanedSprintIds.length +
      ") — in sprint file but not in MASTER_DEBT ━━━"
  );
  orphanedSprintIds.slice(0, 20).forEach((id) => {
    console.log("  " + id + " in " + sprintMap[id]);
  });
  if (orphanedSprintIds.length > 20)
    console.log("  ... and " + (orphanedSprintIds.length - 20) + " more");
}
