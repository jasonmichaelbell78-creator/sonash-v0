#!/usr/bin/env node
/* global __dirname */
/**
 * place-unassigned-debt.js
 *
 * Finds all open DEBT items in MASTER_DEBT.jsonl that are NOT in any sprint file
 * and NOT in roadmap-bound categories (security/enhancements/performance),
 * then assigns them to the appropriate sprint based on their `file` field.
 */

let fs, path, safeWriteFile;
try {
  fs = require("node:fs");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load node:fs:", msg);
  process.exit(2);
}
try {
  path = require("node:path");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load node:path:", msg);
  process.exit(2);
}
try {
  ({ safeWriteFile } = require("./lib/security-helpers"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load security-helpers:", msg);
  process.exit(2);
}

const ROOT = path.resolve(__dirname, "..");
const DEBT_PATH = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const LOGS_DIR = path.join(ROOT, "docs/technical-debt/logs");

// Roadmap-bound categories to exclude
const EXCLUDED_CATEGORIES = new Set(["security", "enhancements", "performance"]);

// Complete sprints - do NOT touch
const COMPLETE_SPRINTS = new Set(["sprint-1", "sprint-2", "sprint-3"]);

const MAX_PER_SPRINT = 200;

// Sprint group definitions (ordered sub-sprints for overflow)
// Additional sub-sprints are created dynamically if all existing ones are full.
const SPRINT_GROUPS = {
  scripts: ["sprint-8a", "sprint-8b", "sprint-8c", "sprint-8d"],
  "docs-claude": ["sprint-9a", "sprint-9b"],
  "github-husky-config": ["sprint-10"],
  "app-components": ["sprint-11a", "sprint-11b", "sprint-11c"],
  tests: ["sprint-7"],
  "cross-cutting": ["sprint-12a", "sprint-12b"],
};

// Base sprint numbers for each group (used to generate overflow sub-sprints)
const GROUP_BASE = {
  scripts: 8,
  "docs-claude": 9,
  "github-husky-config": 10,
  "app-components": 11,
  tests: 7,
  "cross-cutting": 12,
};

// Suffix sequence for sub-sprints: a, b, c, ..., z
const SUFFIXES = "abcdefghijklmnopqrstuvwxyz".split("");

// Focus descriptions for each sprint (used when creating new data)
const SPRINT_FOCUS = {
  "sprint-7": "tests/ + systemic",
  "sprint-8a": "scripts/ overflow",
  "sprint-8b": "scripts/ overflow",
  "sprint-8c": "scripts/ overflow",
  "sprint-8d": "scripts/ overflow",
  "sprint-9a": ".claude/ and docs/",
  "sprint-9b": ".claude/ and docs/",
  "sprint-10": ".github/, .husky/, root config files",
  "sprint-11a": "components/, app/, lib/, functions/, hooks/, types/",
  "sprint-11b": "components/, app/, lib/, functions/, hooks/, types/",
  "sprint-11c": "components/, app/, lib/, functions/, hooks/, types/",
  "sprint-12a": "Cross-cutting items (no specific file)",
  "sprint-12b": "Cross-cutting items (no specific file)",
};

// Prefix-to-group mapping table (replaces chained if/else for lower complexity)
const PREFIX_TO_GROUP = [
  ["scripts/", "scripts"],
  ["tests/", "tests"],
  ["__tests__/", "tests"],
  ["test/", "tests"],
  ["components/", "app-components"],
  ["app/", "app-components"],
  ["lib/", "app-components"],
  ["functions/", "app-components"],
  ["hooks/", "app-components"],
  ["types/", "app-components"],
  ["styles/", "app-components"],
  ["docs/", "docs-claude"],
  [".claude/", "docs-claude"],
  [".github/", "github-husky-config"],
  [".husky/", "github-husky-config"],
];

/**
 * Look up sprint group from prefix table.
 * @returns {string|null} group name or null if no prefix matched
 */
function matchPrefixGroup(normalizedPath) {
  for (const [prefix, group] of PREFIX_TO_GROUP) {
    if (normalizedPath.startsWith(prefix)) return group;
  }
  return null;
}

/**
 * Determine which sprint group an item belongs to based on its file field.
 */
function getSprintGroup(filePath) {
  if (!filePath || filePath === "unknown" || filePath === "") {
    return "cross-cutting";
  }

  // Normalize path separators
  const f = filePath.replaceAll("\\", "/");

  const prefixMatch = matchPrefixGroup(f);
  if (prefixMatch) return prefixMatch;

  // Root-level config files (no directory prefix)
  if (!f.includes("/")) return "github-husky-config";

  // Anything else is cross-cutting
  return "cross-cutting";
}

/**
 * Load all sprint files from LOGS_DIR and build assigned ID sets.
 * Returns { sprintData, allAssignedIds, fileCount }.
 */
function loadSprintFiles() {
  const sprintFiles = fs.readdirSync(LOGS_DIR).filter((f) => /^sprint-.*-ids\.json$/.test(f));
  const allAssignedIds = new Set();
  const sprintData = {};

  for (const file of sprintFiles) {
    const filePath = path.join(LOGS_DIR, file);
    const rel = path.relative(LOGS_DIR, filePath);
    if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const sprintName =
        raw &&
        typeof raw === "object" &&
        !Array.isArray(raw) &&
        typeof raw.sprint === "string" &&
        raw.sprint.trim()
          ? raw.sprint.trim()
          : file.replace(/-ids\.json$/, "");
      const idList = Array.isArray(raw) ? raw : Array.isArray(raw?.ids) ? raw.ids : [];
      const ids = new Set(idList.filter((v) => typeof v === "string" && v));
      sprintData[sprintName] = {
        data: Array.isArray(raw) ? { sprint: sprintName, ids: [...ids] } : raw,
        ids,
        filePath,
      };
      for (const id of ids) allAssignedIds.add(id);
    } catch (err) {
      console.error(`Error reading ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { sprintData, allAssignedIds, fileCount: sprintFiles.length };
}

/**
 * Read MASTER_DEBT.jsonl and return items not assigned or excluded.
 */
function findUnplacedItems(allAssignedIds) {
  const lines = fs.readFileSync(DEBT_PATH, "utf8").trim().split("\n");
  const SKIP_STATUSES = new Set(["RESOLVED", "CLOSED", "FALSE_POSITIVE"]);
  const result = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (allAssignedIds.has(item.id)) continue;
      if (EXCLUDED_CATEGORIES.has(item.category)) continue;
      if (SKIP_STATUSES.has(item.status)) continue;
      result.push(item);
    } catch {
      // Skip malformed JSONL lines silently
    }
  }

  return result;
}

/**
 * Find the next available overflow suffix for a sprint group.
 */
function findNextSuffix(sprints, base) {
  const existing = new Set(
    sprints
      .filter((s) => s.startsWith(`sprint-${base}`))
      .map((s) => s.replace(`sprint-${base}`, ""))
  );
  for (const suf of SUFFIXES) {
    if (!existing.has(suf)) return suf;
  }
  return "";
}

/**
 * Place grouped item IDs into sprint slots, creating overflow sprints as needed.
 */
function placeItemsIntoSprints(groupedItems, sprintData) {
  const placements = {};

  for (const [group, itemIds] of Object.entries(groupedItems)) {
    if (itemIds.length === 0) continue;

    const sprints = [...SPRINT_GROUPS[group]];
    let remaining = [...itemIds];
    let sprintIdx = 0;

    while (remaining.length > 0) {
      if (sprintIdx >= sprints.length) {
        const nextSuffix = findNextSuffix(sprints, GROUP_BASE[group]);
        if (!nextSuffix) {
          console.warn(`WARNING: Exhausted all suffix slots for group '${group}'`);
          break;
        }
        const newSprint = `sprint-${GROUP_BASE[group]}${nextSuffix}`;
        sprints.push(newSprint);
        console.log(`  Created overflow sprint: ${newSprint}`);
      }

      const sprintName = sprints[sprintIdx++];
      if (COMPLETE_SPRINTS.has(sprintName)) continue;

      if (!sprintData[sprintName]) {
        const focus = SPRINT_FOCUS[sprintName] || SPRINT_FOCUS[sprints[0]] || group;
        sprintData[sprintName] = {
          data: { sprint: sprintName, focus, ids: [] },
          ids: new Set(),
          filePath: path.join(LOGS_DIR, `${sprintName}-ids.json`),
        };
      }

      const sd = sprintData[sprintName];
      const capacity = MAX_PER_SPRINT - sd.ids.size;
      if (capacity <= 0) continue;

      const toAdd = remaining.splice(0, capacity);
      for (const id of toAdd) sd.ids.add(id);
      placements[sprintName] = (placements[sprintName] || 0) + toAdd.length;
    }
  }

  return placements;
}

function main() {
  // 1. Load sprint files
  const { sprintData, allAssignedIds, fileCount } = loadSprintFiles();
  console.log(`Loaded ${fileCount} sprint files with ${allAssignedIds.size} total assigned IDs`);

  // 2. Find unplaced items
  const unplacedItems = findUnplacedItems(allAssignedIds);
  console.log(
    `Found ${unplacedItems.length} unplaced items (excluding security/enhancements/performance)`
  );

  // 3. Group by sprint group
  const groupedItems = {};
  for (const group of Object.keys(SPRINT_GROUPS)) groupedItems[group] = [];
  for (const item of unplacedItems) groupedItems[getSprintGroup(item.file)].push(item.id);

  console.log("\nItems by group:");
  for (const [group, items] of Object.entries(groupedItems)) {
    if (items.length > 0) console.log(`  ${group}: ${items.length}`);
  }

  // 4. Place items into sprints
  const placements = placeItemsIntoSprints(groupedItems, sprintData);

  // 5. Write updated sprint files
  for (const [sprintName, sd] of Object.entries(sprintData)) {
    if (COMPLETE_SPRINTS.has(sprintName) || !placements[sprintName]) continue;

    const sortedIds = [...sd.ids].sort((a, b) => {
      return (
        Number.parseInt(a.replace("DEBT-", ""), 10) - Number.parseInt(b.replace("DEBT-", ""), 10)
      );
    });
    const output = { ...sd.data, ids: sortedIds };
    safeWriteFile(sd.filePath, JSON.stringify(output, null, 2) + "\n", { allowOverwrite: true });
  }

  // 6. Print summary
  console.log("\n=== Placement Summary ===");
  let totalPlaced = 0;
  for (const [sprint, count] of Object.entries(placements).sort()) {
    console.log(`  ${sprint}: +${count} (now ${sprintData[sprint].ids.size}/${MAX_PER_SPRINT})`);
    totalPlaced += count;
  }
  console.log(`\nTotal items placed: ${totalPlaced}`);
}

main();
