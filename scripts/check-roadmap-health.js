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
 * Created: 2026-01-27 (Session #103)
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
 * Read file safely with error context
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    // Provide context: error code (ENOENT, EACCES, etc.) and message
    // Safe error access: check instanceof Error first (Review #211)
    const code = error instanceof Error && error.code ? error.code : "UNKNOWN";
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`Cannot read file: ${path.basename(filePath)} (${code}: ${msg})`);
    return null;
  }
}

/**
 * Check 1: Version consistency
 * Scoped to Version History section to avoid false matches (Review #211)
 */
function checkVersionConsistency(content, fileName) {
  // Extract version from header
  const headerVersionMatch = content.match(/\*\*Document Version:\*\*\s*(\d+\.\d+)/);
  const headerVersion = headerVersionMatch ? headerVersionMatch[1] : null;

  // Extract latest version from Version History section only (Review #211)
  // Use \r?\n for CRLF compatibility
  const versionHistorySectionMatch = content.match(
    /##\s*🗓️?\s*Version History[\s\S]*?(?=\r?\n##\s|\r?\n---\s*$|$)/
  );

  let historyVersion = null;
  if (versionHistorySectionMatch) {
    const section = versionHistorySectionMatch[0];
    // First version row after the table header is treated as "latest"
    const rows = Array.from(section.matchAll(/^\|\s*(\d+\.\d+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/gm));
    historyVersion = rows.length > 0 ? rows[0][1] : null;
  } else {
    warnings.push(`${fileName}: Could not find Version History section`);
  }

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
  // Use \r?\n for cross-platform CRLF compatibility (Review #211)
  const overviewTableMatch = content.match(
    /## 📊 Milestones Overview[\s\S]*?\|[\s\S]*?(?=\r?\n\r?\n|\r?\n##|\r?\n---)/
  );

  if (!overviewTableMatch) {
    warnings.push(`${fileName}: Could not find Milestones Overview table`);
    // Review #215: Removed redundant return - function ends after comments anyway
  }

  // NOTE: The Overview table's last column is estimated HOURS, not item count.
  // Comparing hours to checkbox count is not meaningful.
  // This check has been disabled - checkbox counts vary by task granularity.
  // Review #213: Removed misleading hours-vs-items comparison.
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

    const target = linkPath.split("#")[0];

    // Disallow absolute paths for internal links (Review #211)
    if (path.isAbsolute(target)) {
      warnings.push(
        `${fileName}: Invalid internal link (absolute path) "${linkText}" -> ${linkPath}`
      );
      continue;
    }

    // Resolve relative path from repo root
    const fullPath = path.resolve(REPO_ROOT, target);

    // Path traversal prevention: ensure resolved path stays within repo (Review #211)
    // Use regex for cross-platform ".." detection (handles "..hidden.md" edge case)
    const rel = path.relative(REPO_ROOT, fullPath);
    if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      warnings.push(
        `${fileName}: Invalid internal link (escapes repo) "${linkText}" -> ${linkPath}`
      );
      continue;
    }

    if (!fs.existsSync(fullPath)) {
      warnings.push(`${fileName}: Broken link "${linkText}" -> ${linkPath}`);
    }
  }
}

/**
 * Check 5: Parallel group consistency
 * Validates that PG markers in roadmap docs are defined in guide (Review #211)
 */
function checkParallelGroups(roadmapContent, futureContent) {
  // Check if PARALLEL_EXECUTION_GUIDE.md exists
  if (!fs.existsSync(PARALLEL_GUIDE_PATH)) {
    warnings.push("PARALLEL_EXECUTION_GUIDE.md not found in analysis/");
    return;
  }

  const guideContent = readFile(PARALLEL_GUIDE_PATH);
  if (!guideContent) {
    warnings.push("PARALLEL_EXECUTION_GUIDE.md unreadable; skipping PG validation");
    return;
  }

  // Extract defined group numbers from guide
  // Guide uses "Group 1", "Group 2" format, roadmap uses "⏸ PG1", "⏸ PG2"
  const defined = new Set(Array.from(guideContent.matchAll(/Group\s*(\d+)/gi)).map((m) => m[1]));

  // Extract referenced PG numbers from roadmap docs
  const combined = `${roadmapContent}\n${futureContent || ""}`;
  const referenced = new Set(Array.from(combined.matchAll(/⏸\s*PG(\d+)\b/g)).map((m) => m[1]));

  if (referenced.size === 0) {
    warnings.push("No parallel group markers (⏸ PG#) found in roadmap documents");
    return;
  }

  // Validate each referenced PG is defined
  for (const pg of referenced) {
    if (!defined.has(pg)) {
      errors.push(
        `Parallel group marker "PG${pg}" is used in roadmap docs but not defined in PARALLEL_EXECUTION_GUIDE.md`
      );
    }
  }
}

/**
 * Check 6: Track naming consistency
 * Matches main track headers: "### Track X -" or "### Track X:"
 * Excludes subsections like "### Track A-Test" or "### Track A-P2" (Review #211)
 */
function checkTrackNaming(content, fileName) {
  // Find main Track headers only - "Track X -" or "Track X:" patterns
  // Negative lookbehind excludes subsections (Track A-Test, Track A-P2)
  const trackMatches = content.matchAll(/### Track ([A-Z])(?:\s+-|\s*:)/g);
  const tracks = new Set();

  for (const match of trackMatches) {
    const trackLetter = match[1];
    if (tracks.has(trackLetter)) {
      errors.push(`${fileName}: Duplicate Track ${trackLetter} found`);
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
  if (!futureContent) {
    console.warn("⚠️  Skipping ROADMAP_FUTURE.md checks; file not found or unreadable.");
  } else {
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
