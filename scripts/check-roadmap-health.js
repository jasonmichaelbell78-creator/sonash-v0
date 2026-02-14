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
  // Extract version from header — search first 4000 chars only (Review #315)
  // Handles: **Document Version:** 1.0, Document Version: 1.0, **Document Version** 1.0
  const headerSlice = content.slice(0, 4000);
  const headerVersionMatch = headerSlice.match(/Document Version\b[*:\s]{1,8}(\d+\.\d+)/im);
  const headerVersion = headerVersionMatch ? headerVersionMatch[1] : null;

  // Extract Version History section using string search to avoid complex regex (Review #315)
  // Find "## ... Version History" line, then extract until next ## or --- or EOF
  let historyVersion = null;
  const lines = content.split(/\r?\n/);
  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]) && /version history/i.test(lines[i])) {
      sectionStart = i;
      break;
    }
  }

  if (sectionStart >= 0) {
    // Scan section lines for first version table row
    for (let i = sectionStart + 1; i < lines.length; i++) {
      // Stop at next section header or horizontal rule
      if (/^##\s/.test(lines[i]) || /^---\s*$/.test(lines[i])) break;
      const rowMatch = lines[i].match(/^\|\s*(\d+\.\d+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/);
      if (rowMatch) {
        historyVersion = rowMatch[1];
        break;
      }
    }
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
  // P008 fix: optional bold, flexible colon placement
  const progressMatches = content.match(
    /\*{0,2}Overall\s+(?:Completion|Progress):?\*{0,2}\s*~?\d+%/gi
  );

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
function checkMilestoneItemCounts(_content, _fileName) {
  // NOTE: This check is disabled — the Overview table's last column is estimated HOURS,
  // not item count. Comparing hours to checkbox count is not meaningful.
  // Checkbox counts vary by task granularity (Review #213).
  // Kept as no-op stub so callers don't need updating.
}

/**
 * Check 4: Referenced documents exist
 */
function checkLinkedDocuments(content, fileName) {
  // Find all relative markdown links
  const linkMatches = content.matchAll(/\[([^\]]{1,2000})\]\(([^)]{1,2000})\)/g);

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
  if (futureContent) {
    console.log("📄 Checking ROADMAP_FUTURE.md...");
    checkVersionConsistency(futureContent, "ROADMAP_FUTURE.md");
    checkLinkedDocuments(futureContent, "ROADMAP_FUTURE.md");
  } else {
    console.warn("⚠️  Skipping ROADMAP_FUTURE.md checks; file not found or unreadable.");
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
