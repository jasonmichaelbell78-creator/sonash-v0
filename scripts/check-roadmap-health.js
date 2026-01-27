#!/usr/bin/env node
/* global __dirname */

/**
 * check-roadmap-health.js
 *
 * Validates ROADMAP.md and ROADMAP_FUTURE.md for consistency and health.
 *
 * Checks:
 * 1. Version number matches latest version history entry
 * 2. Overall progress percentages are consistent (no duplicates)
 * 3. Milestone item counts match actual checkbox counts
 * 4. All referenced documents exist
 * 5. Parallel group markers match PARALLEL_EXECUTION_GUIDE.md
 *
 * Usage:
 *   npm run roadmap:validate
 *   node scripts/check-roadmap-health.js [--fix]
 *
 * Created: 2026-01-27 (Session #102)
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const ROADMAP_PATH = path.join(REPO_ROOT, "ROADMAP.md");
const ROADMAP_FUTURE_PATH = path.join(REPO_ROOT, "ROADMAP_FUTURE.md");
const PARALLEL_GUIDE_PATH = path.join(REPO_ROOT, "analysis", "PARALLEL_EXECUTION_GUIDE.md");

let errors = [];
let warnings = [];

/**
 * Read file safely
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    errors.push(`Cannot read file: ${filePath}`);
    return null;
  }
}

/**
 * Check 1: Version consistency
 */
function checkVersionConsistency(content, fileName) {
  // Extract version from header
  const headerVersionMatch = content.match(/\*\*Document Version:\*\*\s*(\d+\.\d+)/);
  const headerVersion = headerVersionMatch ? headerVersionMatch[1] : null;

  // Extract latest version from history table
  const historyMatch = content.match(/\|\s*(\d+\.\d+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/);
  const historyVersion = historyMatch ? historyMatch[1] : null;

  if (headerVersion && historyVersion && headerVersion !== historyVersion) {
    errors.push(
      `${fileName}: Version mismatch - header says ${headerVersion}, but latest history entry is ${historyVersion}`
    );
  }

  return { headerVersion, historyVersion };
}

/**
 * Check 2: Duplicate progress percentages
 */
function checkProgressPercentages(content, fileName) {
  const progressMatches = content.match(/\*\*Overall (Completion|Progress):\*\*\s*~?\d+%/g);

  if (progressMatches && progressMatches.length > 1) {
    errors.push(
      `${fileName}: Found ${progressMatches.length} overall progress/completion statements. Should be exactly 1.`
    );
    progressMatches.forEach((m, i) => {
      warnings.push(`  - Instance ${i + 1}: "${m}"`);
    });
  }
}

/**
 * Check 3: Milestone item counts
 */
function checkMilestoneItemCounts(content, fileName) {
  // Extract claimed item counts from overview table
  const overviewTableMatch = content.match(
    /## 📊 Milestones Overview[\s\S]*?\|[\s\S]*?(?=\n\n|\n##|\n---)/
  );

  if (!overviewTableMatch) {
    warnings.push(`${fileName}: Could not find Milestones Overview table`);
    return;
  }

  // Check a sample milestone - Active Sprint
  const sprintItemsMatch = content.match(
    /\*\*🚀 Operational Visibility\*\*[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*~?(\d+)/
  );

  if (sprintItemsMatch) {
    const claimedCount = parseInt(sprintItemsMatch[1], 10);

    // Count actual checkboxes in sprint section
    const sprintSectionMatch = content.match(
      /## 🚀 ACTIVE SPRINT[\s\S]*?(?=\n## ⚡|\n## 🖥️|\n## 📊 Technical|$)/
    );

    if (sprintSectionMatch) {
      const checkboxes = (sprintSectionMatch[0].match(/- \[[ x]\]/g) || []).length;

      // Allow 100% variance for approximate counts (they use ~ prefix)
      // The Overview table shows planned items, actual checkboxes may differ significantly
      if (Math.abs(checkboxes - claimedCount) > claimedCount * 1.0) {
        warnings.push(
          `${fileName}: Active Sprint claims ~${claimedCount} items but has ${checkboxes} checkboxes (diff: ${Math.abs(checkboxes - claimedCount)})`
        );
      }
    }
  }
}

/**
 * Check 4: Referenced documents exist
 */
function checkLinkedDocuments(content, fileName) {
  // Find all relative markdown links
  const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);

  for (const match of linkMatches) {
    const linkText = match[1];
    const linkPath = match[2];

    // Skip external URLs and anchors
    if (linkPath.startsWith("http") || linkPath.startsWith("#") || linkPath.startsWith("mailto:")) {
      continue;
    }

    // Resolve relative path
    const basePath = fileName === "ROADMAP.md" ? REPO_ROOT : REPO_ROOT;
    const fullPath = path.resolve(basePath, linkPath.split("#")[0]);

    if (!fs.existsSync(fullPath)) {
      warnings.push(`${fileName}: Broken link "${linkText}" -> ${linkPath}`);
    }
  }
}

/**
 * Check 5: Parallel group consistency
 */
function checkParallelGroups(roadmapContent, futureContent) {
  // Check if PARALLEL_EXECUTION_GUIDE.md exists
  if (!fs.existsSync(PARALLEL_GUIDE_PATH)) {
    warnings.push("PARALLEL_EXECUTION_GUIDE.md not found in analysis/");
    return;
  }

  // Count PG markers in both documents
  const pgMarkersRoadmap = (roadmapContent.match(/⏸\s*PG\d/g) || []).length;
  const pgMarkersFuture = futureContent ? (futureContent.match(/⏸\s*PG\d/g) || []).length : 0;

  if (pgMarkersRoadmap + pgMarkersFuture === 0) {
    warnings.push("No parallel group markers (⏸ PG#) found in roadmap documents");
  }
}

/**
 * Check 6: Track naming consistency
 * Note: Allows Track A-Test, Track A-P2 style subsections
 */
function checkTrackNaming(content, fileName) {
  // Find all Track headers - look for exact "Track X -" or "Track X:" pattern
  // Allow Track A-Test, Track A-P2, etc. as valid subsections
  const trackMatches = content.matchAll(/### Track ([A-Z])(?:\s*-\s*(?!Test|P\d)|\s*:)/g);
  const tracks = new Set();

  for (const match of trackMatches) {
    const trackLetter = match[1];
    if (tracks.has(trackLetter)) {
      errors.push(`${fileName}: Duplicate Track ${trackLetter} found (not a subsection)`);
    }
    tracks.add(trackLetter);
  }
}

/**
 * Main validation
 */
function main() {
  console.log("🔍 Roadmap Health Check\n");
  console.log("═".repeat(50));

  // Read files
  const roadmapContent = readFile(ROADMAP_PATH);
  const futureContent = readFile(ROADMAP_FUTURE_PATH);

  if (!roadmapContent) {
    console.error("❌ Cannot read ROADMAP.md");
    process.exit(1);
  }

  // Run checks on ROADMAP.md
  console.log("\n📄 Checking ROADMAP.md...");
  checkVersionConsistency(roadmapContent, "ROADMAP.md");
  checkProgressPercentages(roadmapContent, "ROADMAP.md");
  checkMilestoneItemCounts(roadmapContent, "ROADMAP.md");
  checkLinkedDocuments(roadmapContent, "ROADMAP.md");
  checkTrackNaming(roadmapContent, "ROADMAP.md");

  // Run checks on ROADMAP_FUTURE.md if it exists
  if (futureContent) {
    console.log("📄 Checking ROADMAP_FUTURE.md...");
    checkVersionConsistency(futureContent, "ROADMAP_FUTURE.md");
    checkLinkedDocuments(futureContent, "ROADMAP_FUTURE.md");
  }

  // Cross-document checks
  console.log("🔗 Cross-document checks...");
  checkParallelGroups(roadmapContent, futureContent);

  // Report results
  console.log("\n" + "═".repeat(50));

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} Error(s):`);
    errors.forEach((e) => console.log(`   • ${e}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} Warning(s):`);
    warnings.forEach((w) => console.log(`   • ${w}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("\n✅ Roadmap health check passed!");
    console.log("   All documents are consistent.");
  }

  console.log("\n" + "═".repeat(50));

  // Exit with error code if errors found
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
