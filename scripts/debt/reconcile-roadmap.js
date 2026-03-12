#!/usr/bin/env node
/* global __dirname */
/**
 * reconcile-roadmap.js - Step 9: Reconcile ROADMAP.md with TDMS
 *
 * Sub-steps:
 *   9a: Replace CANON-XXXX references with DEBT-XXXX IDs
 *   9b: Print summary of all changes
 *
 * Usage:
 *   node scripts/debt/reconcile-roadmap.js [--write] [--verbose]
 *
 * Default is dry-run. Use --write to modify ROADMAP.md (creates .bak backup).
 */

const fs = require("node:fs");
const path = require("node:path");
const { safeWriteFileSync } = require("../lib/safe-fs");

// --- Paths ---
const ROOT = path.join(__dirname, "../..");
const ROADMAP_PATH = path.join(ROOT, "ROADMAP.md");
const ROADMAP_BAK = path.join(ROOT, "ROADMAP.md.bak");
const MAPPING_PATH = path.join(ROOT, "docs/technical-debt/LEGACY_ID_MAPPING.json");
// --- CLI args ---
const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");
const verbose = args.has("--verbose");

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
 * Collect all CANON-XXXX matches in a single line and process them in reverse
 * order (to preserve string indices during replacement).
 * Returns { line, replacedEntries, unmappedEntries }.
 * @param {string} line
 * @param {Map<string, string>} canonMap
 * @param {number} lineNumber - 1-based line number for detail records
 * @returns {{ line: string, replacedEntries: Array<[string, string]>, unmappedEntries: string[], details: Array<{line: number, canon: string, debt: string|null}> }}
 */
function processCanonRefsInLine(line, canonMap, lineNumber) {
  const canonRefPattern = /CANON-(\d{4})/g;
  /** @type {Array<{full: string, index: number}>} */
  const matches = [];
  let match;
  while ((match = canonRefPattern.exec(line)) !== null) {
    matches.push({ full: match[0], index: match.index });
  }

  /** @type {Array<[string, string]>} */
  const replacedEntries = [];
  /** @type {string[]} */
  const unmappedEntries = [];
  /** @type {Array<{line: number, canon: string, debt: string|null}>} */
  const details = [];

  // Process matches in reverse order to preserve indices during replacement
  for (let j = matches.length - 1; j >= 0; j--) {
    const m = matches[j];
    const canonId = m.full;
    const debtId = canonMap.get(canonId);

    if (debtId) {
      line = line.substring(0, m.index) + debtId + line.substring(m.index + canonId.length);
      replacedEntries.push([canonId, debtId]);
      details.push({ line: lineNumber, canon: canonId, debt: debtId });
    } else {
      unmappedEntries.push(canonId);
      details.push({ line: lineNumber, canon: canonId, debt: null });
    }
  }

  return { line, replacedEntries, unmappedEntries, details };
}

/**
 * Replace all CANON-XXXX references in the roadmap text.
 * Returns { text, replaced, unmapped, details, skippedFenced }.
 * @param {string} text
 * @param {Map<string, string>} canonMap
 * @returns {{ text: string, replaced: Map<string, string>, unmapped: string[], details: Array<{line: number, canon: string, debt: string|null}>, skippedFenced: number }}
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
  let inFence = false;
  let skippedFenced = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track fenced code blocks — skip replacements inside them
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
    }
    if (inFence) {
      // Don't count the opening fence line itself (already toggled above)
      canonRefPattern.lastIndex = 0;
      if (canonRefPattern.test(line)) {
        skippedFenced++;
      }
      continue;
    }

    const result = processCanonRefsInLine(line, canonMap, i + 1);

    if (result.replacedEntries.length === 0 && result.unmappedEntries.length === 0) {
      continue;
    }

    lines[i] = result.line;
    for (const [canonId, debtId] of result.replacedEntries) {
      replaced.set(canonId, debtId);
    }
    for (const canonId of result.unmappedEntries) {
      unmappedSet.add(canonId);
    }
    details.push(...result.details);
  }

  return {
    text: lines.join("\n"),
    replaced,
    unmapped: [...unmappedSet].sort(),
    details,
    skippedFenced,
  };
}

// --- Load all required files ---

function loadRequiredFiles() {
  const files = [
    { path: ROADMAP_PATH, name: "ROADMAP.md" },
    { path: MAPPING_PATH, name: "LEGACY_ID_MAPPING.json" },
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
  if (!fullMapping) process.exit(1);
  return { fullMapping };
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
    safeWriteFileSync(ROADMAP_PATH, finalText, "utf8");
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
  const { fullMapping } = parseJsonFiles(contents);

  // 9a: Replace CANON -> DEBT IDs
  console.log("--- Step 9a: Replace CANON -> DEBT IDs ---\n");
  const canonMap = buildCanonMap(fullMapping);
  console.log(`CANON entries in mapping: ${canonMap.size}`);
  const result9a = replaceCanonIds(contents["ROADMAP.md"], canonMap);
  console.log(`Unique CANON IDs replaced: ${result9a.replaced.size}`);
  console.log(`Unmapped CANON IDs: ${result9a.unmapped.length}`);
  if (verbose) printVerbose9a(result9a);

  // 9b: Summary
  console.log("\n--- Step 9b: Summary ---\n");
  const totalReplacements = result9a.details.filter((d) => d.debt).length;
  console.log(`Total CANON references replaced: ${totalReplacements}`);
  console.log(`Unique CANON IDs mapped: ${result9a.replaced.size}`);
  console.log(`Unmapped CANON IDs: ${result9a.unmapped.length}`);
  console.log(`CANON references skipped (inside code fences): ${result9a.skippedFenced}`);

  // Diff summary
  console.log("\n--- Diff Summary ---\n");
  if (totalReplacements > 0) {
    console.log(`Changes staged: ${totalReplacements} CANON->DEBT replacement(s)`);
  } else {
    console.log("No changes to apply.");
  }

  if (writeMode) writeChanges(result9a.text);
  else console.log("\nDry-run complete. Use --write to apply changes.");

  if (result9a.unmapped.length > 0) {
    console.log(`\nWARNING: ${result9a.unmapped.length} CANON IDs have no mapping.`);
  }
}

main();
