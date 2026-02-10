#!/usr/bin/env node
/**
 * sync-roadmap-refs.js - Check ROADMAP.md for valid DEBT-XXXX references
 *
 * TDMS Phase 8: Validates that DEBT-XXXX IDs in ROADMAP.md exist in MASTER_DEBT.jsonl
 *
 * Usage:
 *   node scripts/debt/sync-roadmap-refs.js --check-only  # Report only
 *   node scripts/debt/sync-roadmap-refs.js               # Report + suggest fixes
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");

const MASTER_DEBT_PATH = resolve(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const ROADMAP_PATH = resolve(ROOT, "ROADMAP.md");
const ROADMAP_FUTURE_PATH = resolve(ROOT, "ROADMAP_FUTURE.md");

// Parse command line args
const args = process.argv.slice(2);
const checkOnly = args.includes("--check-only");
const verbose = args.includes("--verbose") || args.includes("-v");

/**
 * Load all DEBT-XXXX IDs from MASTER_DEBT.jsonl
 */
function loadDebtIds() {
  if (!existsSync(MASTER_DEBT_PATH)) {
    if (verbose) console.log("ℹ️  MASTER_DEBT.jsonl not found - skipping check");
    return new Set();
  }

  const ids = new Set();
  try {
    let content;
    try {
      content = readFileSync(MASTER_DEBT_PATH, "utf8");
    } catch (readErr) {
      const errMsg = readErr instanceof Error ? readErr.message : String(readErr);
      console.error(`Failed to read MASTER_DEBT.jsonl: ${errMsg}`);
      process.exit(1);
    }
    const lines = content.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.id) {
          ids.add(String(item.id).trim().toUpperCase());
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error reading MASTER_DEBT.jsonl: ${errMsg}`);
    process.exit(1);
  }

  return ids;
}

/**
 * Find all DEBT-XXXX references in a file
 */
function findDebtRefs(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  const refs = [];
  try {
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch (readErr) {
      const errMsg = readErr instanceof Error ? readErr.message : String(readErr);
      console.error(`Failed to read ${filePath}: ${errMsg}`);
      return [];
    }
    const lines = content.split("\n");

    const debtPattern = /DEBT-\d{4,}/gi;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Use matchAll for stateless iteration (no need to reset lastIndex)
      for (const match of line.matchAll(debtPattern)) {
        refs.push({
          id: match[0].toUpperCase(),
          file: filePath,
          line: i + 1,
          context: line.trim().substring(0, 80),
        });
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error reading ${filePath}: ${errMsg}`);
  }

  return refs;
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Checking ROADMAP DEBT references...\n");

  // Load canonical debt IDs
  const validIds = loadDebtIds();

  if (validIds.size === 0) {
    console.log("ℹ️  No DEBT items in canonical source - nothing to validate");
    process.exit(0);
  }

  if (verbose) {
    console.log(`📋 Loaded ${validIds.size} DEBT IDs from MASTER_DEBT.jsonl\n`);
  }

  // Find all references in ROADMAP files
  const allRefs = [...findDebtRefs(ROADMAP_PATH), ...findDebtRefs(ROADMAP_FUTURE_PATH)];

  if (allRefs.length === 0) {
    console.log("ℹ️  No DEBT-XXXX references found in ROADMAP files");
    process.exit(0);
  }

  // Check each reference
  const orphaned = [];
  const valid = [];

  for (const ref of allRefs) {
    if (validIds.has(ref.id)) {
      valid.push(ref);
    } else {
      orphaned.push(ref);
    }
  }

  // Report results
  console.log(`📊 Results:`);
  console.log(`   Valid references: ${valid.length}`);
  console.log(`   Orphaned references: ${orphaned.length}\n`);

  if (orphaned.length > 0) {
    console.log("⚠️  Orphaned DEBT references (not in MASTER_DEBT.jsonl):\n");

    for (const ref of orphaned) {
      const relPath = ref.file.replace(ROOT + "/", "").replace(ROOT + "\\", "");
      console.log(`   ${ref.id} - ${relPath}:${ref.line}`);
      if (verbose) {
        console.log(`      ${ref.context}`);
      }
    }

    if (!checkOnly) {
      console.log("\n💡 Suggested actions:");
      console.log("   1. Add missing items to MASTER_DEBT.jsonl");
      console.log("   2. Or remove orphaned references from ROADMAP");
      console.log("   3. Or update IDs if they were renamed");
    }

    process.exit(1);
  }

  console.log("✅ All DEBT references are valid");
  process.exit(0);
}

main();
