#!/usr/bin/env node
/* global __dirname */
/**
 * Bulk-assign roadmap_ref to MASTER_DEBT.jsonl items
 *
 * Phase 18 implementation: Assigns roadmap_ref based on category and file path mapping
 *
 * Mapping Rules:
 *   - security (any file) → Track-S
 *   - performance (any file) → Track-P
 *   - process (any file) → Track-D
 *   - refactoring (any file) → M2.3-REF
 *   - documentation (any file) → M1.5
 *   - code-quality by file path:
 *     - scripts/ → Track-E
 *     - .claude/ → Track-E
 *     - .github/ → Track-D
 *     - tests/ → Track-T
 *     - functions/ → M2.2
 *     - components/, lib/, app/, hooks/ → M2.1
 *     - docs/ → M1.5
 *     - default → M2.1
 *
 * Usage: node scripts/debt/assign-roadmap-refs.js [options]
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying file
 *   --verbose    Show each item assignment
 *   --report     Generate detailed assignment report
 */

const fs = require("node:fs");
const path = require("node:path");
const { safeWriteFileSync, writeMasterDebtSync } = require("../lib/safe-fs");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const BACKUP_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl.bak");

// Parse command line arguments
function parseArgs(args) {
  const parsed = { dryRun: false, verbose: false, report: false };
  for (const arg of args) {
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--verbose") parsed.verbose = true;
    else if (arg === "--report") parsed.report = true;
  }
  return parsed;
}

// Normalize existing roadmap_ref values to standard format
function normalizeRoadmapRef(ref) {
  if (!ref) return null;

  const normalizations = {
    "Track P": "Track-P",
    "Track D": "Track-D",
    "Track B": "Track-B",
    "Track T": "Track-T",
    "Track E": "Track-E",
    "Track S": "Track-S",
    "M2.1 Code Quality": "M2.1",
    // Keep specific DEBT/CANON refs but note they should be track-level
    // These were incorrectly assigned to individual items
  };

  return normalizations[ref] || ref;
}

// Determine roadmap_ref based on category and file path
function getTrackAssignment(item) {
  const category = item.category;
  const filePath = item.file || "";

  // Category-based assignments (take priority)
  switch (category) {
    case "security":
      return "Track-S";
    case "performance":
      return "Track-P";
    case "process":
      return "Track-D";
    case "refactoring":
      return "M2.3-REF";
    case "documentation":
      return "M1.5";
  }

  // code-quality: assignment based on file path
  if (category === "code-quality") {
    // Scripts and automation
    if (filePath.startsWith("scripts/")) return "Track-E";
    if (filePath.startsWith(".claude/")) return "Track-E";

    // CI/CD and GitHub
    if (filePath.startsWith(".github/")) return "Track-D";

    // Testing
    if (filePath.startsWith("tests/") || filePath.startsWith("__tests__/")) return "Track-T";

    // Backend/Functions
    if (filePath.startsWith("functions/")) return "M2.2";

    // Frontend code quality
    if (
      filePath.startsWith("components/") ||
      filePath.startsWith("lib/") ||
      filePath.startsWith("app/") ||
      filePath.startsWith("hooks/")
    ) {
      return "M2.1";
    }

    // Documentation
    if (filePath.startsWith("docs/")) return "M1.5";

    // Default for code-quality without clear path
    return "M2.1";
  }

  // Fallback for any unhandled category
  return "M2.1";
}

/**
 * Generate a detailed assignment report as markdown
 *
 * @param {object} stats - Assignment statistics
 * @param {Array<[string, number]>} sortedTracks - Track assignments sorted by count
 * @param {boolean} dryRun - If true, skip writing the file
 */
function generateAssignmentReport(stats, sortedTracks, dryRun) {
  const reportPath = path.join(DEBT_DIR, "roadmap-assignment-report.md");
  let report = `# Roadmap Reference Assignment Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total items: ${stats.total}\n`;
  report += `- Already assigned: ${stats.alreadyAssigned}\n`;
  report += `- Newly assigned: ${stats.newlyAssigned}\n\n`;
  report += `## By Track\n\n`;
  report += `| Track | Count |\n|-------|-------|\n`;
  for (const [track, count] of sortedTracks) {
    report += `| ${track} | ${count} |\n`;
  }
  report += `\n## Assignment Rules\n\n`;
  report += `| Category | File Pattern | Track |\n|----------|--------------|-------|\n`;
  report += `| security | * | Track-S |\n`;
  report += `| performance | * | Track-P |\n`;
  report += `| process | * | Track-D |\n`;
  report += `| refactoring | * | M2.3-REF |\n`;
  report += `| documentation | * | M1.5 |\n`;
  report += `| code-quality | scripts/ | Track-E |\n`;
  report += `| code-quality | .claude/ | Track-E |\n`;
  report += `| code-quality | .github/ | Track-D |\n`;
  report += `| code-quality | tests/ | Track-T |\n`;
  report += `| code-quality | functions/ | M2.2 |\n`;
  report += `| code-quality | components/, lib/, app/, hooks/ | M2.1 |\n`;
  report += `| code-quality | docs/ | M1.5 |\n`;
  report += `| code-quality | (default) | M2.1 |\n`;

  if (!dryRun) {
    safeWriteFileSync(reportPath, report, "utf8");
    console.log(`\n📝 Report saved to: ${reportPath}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  console.log("📊 TDMS Phase 18: Bulk Roadmap Reference Assignment");
  console.log("=".repeat(55));

  // Read file
  if (!fs.existsSync(MASTER_FILE)) {
    console.error("❌ MASTER_DEBT.jsonl not found");
    process.exit(2);
  }

  // Review #224: Wrap readFileSync in try/catch (existsSync doesn't guarantee read success)
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to read MASTER_DEBT.jsonl: ${errMsg}`);
    process.exit(2);
  }
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  // Review #224 Qodo R4: Handle empty input files gracefully
  if (lines.length === 0) {
    console.log("\n⚠️ MASTER_DEBT.jsonl is empty - nothing to process");
    process.exit(0);
  }

  // Track statistics
  const stats = {
    total: 0,
    alreadyAssigned: 0,
    newlyAssigned: 0,
    byTrack: {},
  };

  const updatedLines = [];

  for (const line of lines) {
    stats.total++;

    // Review #224: Wrap JSON.parse in try/catch for robustness
    let item;
    try {
      item = JSON.parse(line);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Invalid JSON at line ${stats.total}: ${errMsg}`);
      console.error(`   Line: ${line.slice(0, 200)}${line.length > 200 ? "..." : ""}`);
      process.exit(3);
    }

    // Check if already has roadmap_ref - normalize if needed
    if (item.roadmap_ref && item.roadmap_ref !== null) {
      const normalizedRef = normalizeRoadmapRef(item.roadmap_ref);
      if (normalizedRef !== item.roadmap_ref) {
        // Normalize the ref
        item.roadmap_ref = normalizedRef;
        stats.normalized = (stats.normalized || 0) + 1;
        updatedLines.push(JSON.stringify(item));
      } else {
        updatedLines.push(line);
      }
      stats.alreadyAssigned++;
      stats.byTrack[item.roadmap_ref] = (stats.byTrack[item.roadmap_ref] || 0) + 1;
      continue;
    }

    // Assign roadmap_ref
    const track = getTrackAssignment(item);
    item.roadmap_ref = track;
    stats.newlyAssigned++;
    stats.byTrack[track] = (stats.byTrack[track] || 0) + 1;

    if (opts.verbose) {
      console.log(`  ${item.id}: ${item.category} | ${item.file || "(no file)"} → ${track}`);
    }

    updatedLines.push(JSON.stringify(item));
  }

  console.log("\n📈 Assignment Statistics:");
  console.log(`  Total items: ${stats.total}`);
  console.log(`  Already assigned: ${stats.alreadyAssigned}`);
  console.log(`  Normalized: ${stats.normalized || 0}`);
  console.log(`  Newly assigned: ${stats.newlyAssigned}`);

  console.log("\n📊 By Track:");
  const sortedTracks = Object.entries(stats.byTrack).sort((a, b) => b[1] - a[1]);
  for (const [track, count] of sortedTracks) {
    console.log(`  ${track.padEnd(12)} ${count}`);
  }

  if (opts.report) {
    generateAssignmentReport(stats, sortedTracks, opts.dryRun);
  }

  if (opts.dryRun) {
    console.log("\n⚠️  DRY RUN - no changes made");
    console.log("   Run without --dry-run to apply changes");
  } else {
    // Qodo R14: Handle backup creation failures
    try {
      fs.copyFileSync(MASTER_FILE, BACKUP_FILE);
      console.log(`\n💾 Backup created: ${BACKUP_FILE}`);
    } catch (error_) {
      const errMsg = error_ instanceof Error ? error_.message : String(error_);
      console.error(`❌ Failed to create backup file: ${errMsg}`);
      process.exit(4);
    }

    // Central writer handles both MASTER_DEBT.jsonl and deduped.jsonl atomically
    try {
      const allItems = [];
      for (let i = 0; i < updatedLines.length; i++) {
        const line = updatedLines[i];
        if (!line || !line.trim()) continue;
        try {
          allItems.push(JSON.parse(line));
        } catch {
          console.error(
            `❌ Malformed JSONL at output line ${i + 1}; aborting write to prevent data loss.`
          );
          process.exit(4);
        }
      }
      writeMasterDebtSync(allItems);

      console.log("✅ MASTER_DEBT.jsonl updated successfully");
    } catch (error_) {
      const errMsg = error_ instanceof Error ? error_.message : String(error_);
      console.error(`❌ Failed to write MASTER_DEBT.jsonl: ${errMsg}`);
      process.exit(4);
    }
    console.log("\n📌 Next steps:");
    console.log("   1. Run: node scripts/debt/validate-schema.js");
    console.log("   2. Run: node scripts/debt/generate-views.js");
    console.log("   3. Run: node scripts/debt/generate-metrics.js");
  }
}

main();
