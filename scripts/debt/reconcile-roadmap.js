#!/usr/bin/env node
/* global __dirname */
/**
 * reconcile-roadmap.js - Step 9: Reconcile ROADMAP.md with TDMS
 *
 * Sub-steps:
 *   9a: Replace CANON-XXXX references with DEBT-XXXX IDs
 *   9b: Update Grand Plan section with summary pointing to GRAND_PLAN_V2.md
 *   9c: Print summary of all changes
 *
 * Usage:
 *   node scripts/debt/reconcile-roadmap.js [--write] [--verbose]
 *
 * Default is dry-run. Use --write to modify ROADMAP.md (creates .bak backup).
 */

const fs = require("node:fs");
const path = require("node:path");

// --- Paths ---
const ROOT = path.join(__dirname, "../..");
const ROADMAP_PATH = path.join(ROOT, "ROADMAP.md");
const ROADMAP_BAK = path.join(ROOT, "ROADMAP.md.bak");
const MAPPING_PATH = path.join(ROOT, "docs/technical-debt/LEGACY_ID_MAPPING.json");
const METRICS_PATH = path.join(ROOT, "docs/technical-debt/metrics.json");
const MANIFEST_PATH = path.join(ROOT, "docs/technical-debt/logs/grand-plan-manifest.json");

// --- CLI args ---
const args = process.argv.slice(2);
const writeMode = args.includes("--write");
const verbose = args.includes("--verbose");

// --- Helpers ---

/**
 * Safely read a file. Returns null on failure.
 * @param {string} filePath
 * @returns {string|null}
 */
function safeReadFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read ${filePath}: ${msg}`);
    return null;
  }
}

/**
 * Safely parse JSON. Returns null on failure.
 * @param {string} content
 * @param {string} label
 * @returns {object|null}
 */
function safeParseJSON(content, label) {
  try {
    return JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to parse ${label}: ${msg}`);
    return null;
  }
}

/**
 * Build CANON-XXXX -> DEBT-XXXX mapping from the legacy ID mapping file.
 * Only extracts entries whose key matches /^CANON-\d{4}$/.
 * @param {object} fullMapping
 * @returns {Map<string, string>}
 */
function buildCanonMap(fullMapping) {
  const canonMap = new Map();
  const canonPattern = /^CANON-\d{4}$/;
  for (const [key, value] of Object.entries(fullMapping)) {
    if (canonPattern.test(key)) {
      canonMap.set(key, value);
    }
  }
  return canonMap;
}

// --- Step 9a: Replace CANON -> DEBT IDs ---

/**
 * Replace all CANON-XXXX references in the roadmap text.
 * Returns { text, replaced, unmapped, details }.
 * @param {string} text
 * @param {Map<string, string>} canonMap
 * @returns {{ text: string, replaced: Map<string, string>, unmapped: string[], details: Array<{line: number, canon: string, debt: string|null}> }}
 */
function replaceCanonIds(text, canonMap) {
  const lines = text.split("\n");
  /** @type {Map<string, string>} */
  const replaced = new Map();
  /** @type {Set<string>} */
  const unmappedSet = new Set();
  /** @type {Array<{line: number, canon: string, debt: string|null}>} */
  const details = [];

  const canonRefPattern = /CANON-(\d{4})/g;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match;
    // Reset lastIndex for each line
    canonRefPattern.lastIndex = 0;

    // Collect all matches first to avoid mutation during iteration
    /** @type {Array<{full: string, index: number}>} */
    const matches = [];
    while ((match = canonRefPattern.exec(line)) !== null) {
      matches.push({ full: match[0], index: match.index });
    }

    if (matches.length === 0) {
      continue;
    }

    // Process matches in reverse order to preserve indices
    for (let j = matches.length - 1; j >= 0; j--) {
      const m = matches[j];
      const canonId = m.full;
      const debtId = canonMap.get(canonId);

      if (debtId) {
        // Replace this occurrence
        line = line.substring(0, m.index) + debtId + line.substring(m.index + canonId.length);
        replaced.set(canonId, debtId);
        details.push({ line: i + 1, canon: canonId, debt: debtId });
      } else {
        unmappedSet.add(canonId);
        details.push({ line: i + 1, canon: canonId, debt: null });
      }
    }

    lines[i] = line;
  }

  return {
    text: lines.join("\n"),
    replaced,
    unmapped: [...unmappedSet].sort(),
    details,
  };
}

// --- Step 9b: Update Grand Plan Section ---

/**
 * Build the replacement content for the Grand Plan section.
 * @param {object} metrics - From metrics.json
 * @param {object} manifest - From grand-plan-manifest.json
 * @returns {string}
 */
function buildGrandPlanSection(metrics, manifest) {
  const totalItems = metrics.summary.total;
  const sprintCount = Object.keys(manifest.sprints).length;

  // Calculate roadmap-bound items from manifest
  let roadmapBound = 0;
  if (manifest.roadmap_bound) {
    for (const cat of Object.values(manifest.roadmap_bound)) {
      roadmapBound += cat.count || 0;
    }
  }

  const resolutionRate = metrics.summary.resolution_rate_pct;

  const section = [
    "### GRAND PLAN: Technical Debt Elimination",
    "",
    "> **Authoritative document:** [GRAND_PLAN_V2.md](docs/technical-debt/GRAND_PLAN_V2.md)",
    "",
    "| Metric | Value |",
    "|---|---|",
    `| Total items | ${totalItems} |`,
    `| Grand Plan sprints | ${sprintCount} |`,
    `| Roadmap-bound items | ${roadmapBound} |`,
    `| Resolution rate | ${resolutionRate}% |`,
    "| Coverage | 100% |",
    "",
    "See GRAND_PLAN_V2.md for full sprint details and execution strategy.",
  ];

  return section.join("\n");
}

/**
 * Replace the Grand Plan section in the roadmap text.
 * Finds the heading and replaces content up to the next heading of same or higher level.
 * @param {string} text
 * @returns {{ text: string, found: boolean, startLine: number, endLine: number }}
 */
function replaceGrandPlanSection(text, metrics, manifest) {
  const lines = text.split("\n");

  // Find the Grand Plan heading
  let startIdx = -1;
  let headingLevel = 0;
  const grandPlanPattern = /^(#{1,6})\s+.*GRAND PLAN.*Technical Debt/i;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(grandPlanPattern);
    if (match) {
      startIdx = i;
      headingLevel = match[1].length;
      break;
    }
  }

  if (startIdx === -1) {
    return { text, found: false, startLine: 0, endLine: 0 };
  }

  // Find the next heading of same or higher level (fewer or equal # chars)
  let endIdx = lines.length;
  const nextHeadingPattern = new RegExp(`^#{1,${headingLevel}}\\s`);
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (nextHeadingPattern.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  // Build replacement
  const newContent = buildGrandPlanSection(metrics, manifest);
  const newLines = newContent.split("\n");

  // Splice: remove from startIdx to endIdx (exclusive), insert newLines
  const before = lines.slice(0, startIdx);
  const after = lines.slice(endIdx);
  const result = [...before, ...newLines, "", ...after];

  return {
    text: result.join("\n"),
    found: true,
    startLine: startIdx + 1,
    endLine: endIdx,
  };
}

// --- Load all required files ---

function loadRequiredFiles() {
  const files = [
    { path: ROADMAP_PATH, name: "ROADMAP.md" },
    { path: MAPPING_PATH, name: "LEGACY_ID_MAPPING.json" },
    { path: METRICS_PATH, name: "metrics.json" },
    { path: MANIFEST_PATH, name: "grand-plan-manifest.json" },
  ];
  const contents = {};
  for (const f of files) {
    const content = safeReadFile(f.path);
    if (!content) process.exit(1);
    contents[f.name] = content;
  }
  return contents;
}

// --- Parse JSON files ---

function parseJsonFiles(contents) {
  const fullMapping = safeParseJSON(contents["LEGACY_ID_MAPPING.json"], "LEGACY_ID_MAPPING.json");
  const metrics = safeParseJSON(contents["metrics.json"], "metrics.json");
  const manifest = safeParseJSON(contents["grand-plan-manifest.json"], "grand-plan-manifest.json");
  if (!fullMapping || !metrics || !manifest) process.exit(1);
  return { fullMapping, metrics, manifest };
}

// --- Print verbose 9a details ---

function printVerbose9a(result9a) {
  if (result9a.replaced.size > 0) {
    console.log("\nReplacements:");
    for (const [canon, debt] of [...result9a.replaced.entries()].sort()) {
      console.log(`  ${canon} -> ${debt}`);
    }
  }
  if (result9a.unmapped.length > 0) {
    console.log("\nUnmapped (no DEBT-XXXX equivalent found):");
    for (const id of result9a.unmapped) console.log(`  ${id}`);
  }
  if (result9a.details.length > 0) {
    console.log("\nLine-by-line detail:");
    for (const d of result9a.details) {
      console.log(`  L${d.line}: ${d.canon} -> ${d.debt || "[UNMAPPED]"}`);
    }
  }
}

// --- Write changes to disk ---

function writeChanges(finalText) {
  console.log("\n--- Writing changes ---\n");
  try {
    fs.copyFileSync(ROADMAP_PATH, ROADMAP_BAK);
    console.log(`Backup created: ${ROADMAP_BAK}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to create backup: ${msg}`);
    process.exit(1);
  }
  try {
    fs.writeFileSync(ROADMAP_PATH, finalText, "utf8");
    console.log(`ROADMAP.md updated successfully.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to write ROADMAP.md: ${msg}`);
    process.exit(1);
  }
}

// --- Main ---

function main() {
  console.log("=== TDMS Step 9: Reconcile ROADMAP.md ===\n");
  console.log(`Mode: ${writeMode ? "WRITE" : "DRY-RUN"}\n`);

  const contents = loadRequiredFiles();
  const { fullMapping, metrics, manifest } = parseJsonFiles(contents);

  // 9a: Replace CANON -> DEBT IDs
  console.log("--- Step 9a: Replace CANON -> DEBT IDs ---\n");
  const canonMap = buildCanonMap(fullMapping);
  console.log(`CANON entries in mapping: ${canonMap.size}`);
  const result9a = replaceCanonIds(contents["ROADMAP.md"], canonMap);
  console.log(`Unique CANON IDs replaced: ${result9a.replaced.size}`);
  console.log(`Unmapped CANON IDs: ${result9a.unmapped.length}`);
  if (verbose) printVerbose9a(result9a);

  // 9b: Update Grand Plan Section
  console.log("\n--- Step 9b: Update Grand Plan Section ---\n");
  const result9b = replaceGrandPlanSection(result9a.text, metrics, manifest);
  if (result9b.found) {
    console.log(`Grand Plan section found at lines ${result9b.startLine}-${result9b.endLine}`);
    console.log("Replaced with summary pointing to GRAND_PLAN_V2.md");
  } else {
    console.log("WARNING: Grand Plan section not found in ROADMAP.md");
  }

  // 9c: Summary
  console.log("\n--- Step 9c: Summary ---\n");
  const totalReplacements = result9a.details.filter((d) => d.debt).length;
  console.log(`Total CANON references replaced: ${totalReplacements}`);
  console.log(`Unique CANON IDs mapped: ${result9a.replaced.size}`);
  console.log(`Unmapped CANON IDs: ${result9a.unmapped.length}`);
  console.log(`Grand Plan section updated: ${result9b.found ? "YES" : "NO"}`);

  if (writeMode) writeChanges(result9b.text);
  else console.log("\nDry-run complete. Use --write to apply changes.");

  if (result9a.unmapped.length > 0) {
    console.log(`\nWARNING: ${result9a.unmapped.length} CANON IDs have no mapping.`);
  }
}

main();
