#!/usr/bin/env node
/* global __dirname */
/**
 * place-unassigned-debt.js
 *
 * Finds all open DEBT items in MASTER_DEBT.jsonl that are NOT in any sprint file
 * and NOT in roadmap-bound categories (security/enhancements/performance),
 * then assigns them to the appropriate sprint based on their `file` field.
 */

const fs = require("fs");
const path = require("path");
const { safeWriteFile } = require("./lib/security-helpers");

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

// Root-level config file extensions/names that go to sprint-10
const ROOT_CONFIG_PATTERNS = [
  /^[^/]+\.(json|js|cjs|mjs|ts|yaml|yml|toml|config\..*)$/,
  /^\.(?!claude|github|husky)[^/]*$/, // dotfiles at root (not .claude/.github/.husky dirs)
  /^(package\.json|tsconfig.*|next\.config.*|tailwind\.config.*|postcss\.config.*|firebase\.json|\.eslintrc.*|\.prettierrc.*|jest\.config.*|vitest\.config.*)$/,
];

/**
 * Determine which sprint group an item belongs to based on its file field.
 */
function getSprintGroup(filePath) {
  if (!filePath || filePath === "unknown" || filePath === "") {
    return "cross-cutting";
  }

  // Normalize path separators
  const f = filePath.replace(/\\/g, "/");

  // scripts/
  if (f.startsWith("scripts/")) return "scripts";

  // tests/
  if (f.startsWith("tests/") || f.startsWith("__tests__/") || f.startsWith("test/")) return "tests";

  // components/, app/, lib/, functions/, hooks/, types/
  if (f.startsWith("components/")) return "app-components";
  if (f.startsWith("app/")) return "app-components";
  if (f.startsWith("lib/")) return "app-components";
  if (f.startsWith("functions/")) return "app-components";
  if (f.startsWith("hooks/")) return "app-components";
  if (f.startsWith("types/")) return "app-components";
  if (f.startsWith("styles/")) return "app-components";

  // docs/ or .claude/
  if (f.startsWith("docs/")) return "docs-claude";
  if (f.startsWith(".claude/")) return "docs-claude";

  // .github/ or .husky/
  if (f.startsWith(".github/")) return "github-husky-config";
  if (f.startsWith(".husky/")) return "github-husky-config";

  // Root-level config files (no directory prefix, or single-level)
  if (!f.includes("/")) {
    return "github-husky-config";
  }

  // Anything else is cross-cutting
  return "cross-cutting";
}

function main() {
  // 1. Read all sprint files and collect all assigned IDs
  const sprintFiles = fs.readdirSync(LOGS_DIR).filter((f) => /^sprint-.*-ids\.json$/.test(f));
  const allAssignedIds = new Set();
  const sprintData = {}; // sprint name -> { data, ids (Set), filePath }

  for (const file of sprintFiles) {
    const filePath = path.join(LOGS_DIR, file);
    const rel = path.relative(LOGS_DIR, filePath);
    if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const sprintName = data.sprint;
      const ids = new Set(data.ids || []);

      sprintData[sprintName] = { data, ids, filePath };
      for (const id of ids) {
        allAssignedIds.add(id);
      }
    } catch (err) {
      console.error(`Error reading ${file}: ${err.message}`);
    }
  }

  console.log(
    `Loaded ${sprintFiles.length} sprint files with ${allAssignedIds.size} total assigned IDs`
  );

  // 2. Read MASTER_DEBT.jsonl and find unplaced items
  const lines = fs.readFileSync(DEBT_PATH, "utf8").trim().split("\n");
  const unplacedItems = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      const id = item.id;

      // Skip if already assigned
      if (allAssignedIds.has(id)) continue;

      // Skip roadmap-bound categories
      if (EXCLUDED_CATEGORIES.has(item.category)) continue;

      // Skip resolved/closed/false-positive items
      if (
        item.status === "RESOLVED" ||
        item.status === "CLOSED" ||
        item.status === "FALSE_POSITIVE"
      )
        continue;

      unplacedItems.push(item);
    } catch (err) {
      // Skip malformed lines
    }
  }

  console.log(
    `Found ${unplacedItems.length} unplaced items (excluding security/enhancements/performance)`
  );

  // 3. Group unplaced items by sprint group
  const groupedItems = {};
  for (const group of Object.keys(SPRINT_GROUPS)) {
    groupedItems[group] = [];
  }

  for (const item of unplacedItems) {
    const group = getSprintGroup(item.file);
    groupedItems[group].push(item.id);
  }

  // Print group summary
  console.log("\nItems by group:");
  for (const [group, items] of Object.entries(groupedItems)) {
    if (items.length > 0) {
      console.log(`  ${group}: ${items.length}`);
    }
  }

  // 4. Place items into sprint files
  const placements = {}; // sprint -> count of newly added

  for (const [group, itemIds] of Object.entries(groupedItems)) {
    if (itemIds.length === 0) continue;

    // Build the full list of sprints for this group, including any needed overflow
    const sprints = [...SPRINT_GROUPS[group]];
    let remaining = [...itemIds];

    let sprintIdx = 0;
    while (remaining.length > 0) {
      // If we've exhausted known sprints, create a new overflow sub-sprint
      if (sprintIdx >= sprints.length) {
        const base = GROUP_BASE[group];
        // Find next available suffix
        const existingSuffixes = sprints
          .filter((s) => s.startsWith(`sprint-${base}`))
          .map((s) => s.replace(`sprint-${base}`, ""));
        let nextSuffix = "";
        for (const suf of SUFFIXES) {
          if (!existingSuffixes.includes(suf)) {
            nextSuffix = suf;
            break;
          }
        }
        if (!nextSuffix) {
          console.warn(`WARNING: Exhausted all suffix slots for group '${group}'`);
          break;
        }
        const newSprint = `sprint-${base}${nextSuffix}`;
        sprints.push(newSprint);
        console.log(`  Created overflow sprint: ${newSprint}`);
      }

      const sprintName = sprints[sprintIdx];
      sprintIdx++;

      if (COMPLETE_SPRINTS.has(sprintName)) continue;

      // Get or initialize sprint data
      if (!sprintData[sprintName]) {
        const focus = SPRINT_FOCUS[sprintName] || SPRINT_FOCUS[sprints[0]] || group;
        sprintData[sprintName] = {
          data: { sprint: sprintName, focus, ids: [] },
          ids: new Set(),
          filePath: path.join(LOGS_DIR, `${sprintName}-ids.json`),
        };
      }

      const sd = sprintData[sprintName];
      const currentCount = sd.ids.size;
      const capacity = MAX_PER_SPRINT - currentCount;

      if (capacity <= 0) continue;

      const toAdd = remaining.splice(0, capacity);
      for (const id of toAdd) {
        sd.ids.add(id);
      }
      placements[sprintName] = (placements[sprintName] || 0) + toAdd.length;
    }
  }

  // 5. Write updated sprint files
  for (const [sprintName, sd] of Object.entries(sprintData)) {
    if (COMPLETE_SPRINTS.has(sprintName)) continue;
    if (!placements[sprintName]) continue;

    // Rebuild the data object with sorted IDs
    const sortedIds = [...sd.ids].sort((a, b) => {
      const numA = parseInt(a.replace("DEBT-", ""), 10);
      const numB = parseInt(b.replace("DEBT-", ""), 10);
      return numA - numB;
    });

    // Preserve existing extra fields (like severity, name)
    const output = { ...sd.data, ids: sortedIds };
    safeWriteFile(sd.filePath, JSON.stringify(output, null, 2) + "\n", { allowOverwrite: true });
  }

  // 6. Print summary
  console.log("\n=== Placement Summary ===");
  let totalPlaced = 0;
  for (const [sprint, count] of Object.entries(placements).sort()) {
    const sd = sprintData[sprint];
    console.log(`  ${sprint}: +${count} (now ${sd.ids.size}/${MAX_PER_SPRINT})`);
    totalPlaced += count;
  }
  console.log(`\nTotal items placed: ${totalPlaced}`);
}

main();
