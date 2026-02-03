#!/usr/bin/env node
/**
 * Document Placement Validation Script
 *
 * Checks documentation files are in correct locations according to tier system.
 *
 * Checks:
 * - Documents in correct tier directory
 * - Plans in docs/plans/
 * - Archives in docs/archive/
 * - Templates in docs/templates/
 * - Archive candidates (completed plans, old session handoffs)
 * - Cleanup candidates (near-empty files, old drafts)
 *
 * Usage: node scripts/check-doc-placement.js [options] [files...]
 *
 * Options:
 *   --output <file>   Output JSONL file (default: stdout)
 *   --verbose         Show detailed logging
 *   --quiet           Only output errors
 *   --json            Output as JSON array instead of JSONL
 *
 * Exit codes:
 *   0 - All placements correct
 *   1 - Placement issues found
 *   2 - Script error
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const QUIET = args.includes("--quiet");
const JSON_OUTPUT = args.includes("--json");
const outputIdx = args.indexOf("--output");
const OUTPUT_FILE = outputIdx === -1 ? null : args[outputIdx + 1];
const fileArgs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--output");

// Tier definitions with expected locations
const TIER_DEFINITIONS = {
  1: {
    name: "Canonical",
    locations: ["ROADMAP.md", "README.md", "ARCHITECTURE.md"],
    patterns: [/^ROADMAP\.md$/, /^README\.md$/, /^ARCHITECTURE\.md$/],
  },
  2: {
    name: "Foundation",
    locations: ["docs/"],
    patterns: [
      /^docs\/[^/]+\.md$/,
      /^DOCUMENTATION_STANDARDS\.md$/,
      /^AI_WORKFLOW\.md$/,
      /^SECURITY\.md$/,
      /^DEVELOPMENT\.md$/,
    ],
  },
  3: {
    name: "Planning",
    locations: ["docs/plans/", ".planning/"],
    patterns: [/PLAN|ROADMAP|PROJECT_STATUS/i],
  },
  4: {
    name: "Reference",
    locations: ["docs/"],
    patterns: [/PROCESS|CHECKLIST|WORKFLOW|STANDARDS/i],
  },
  5: {
    name: "Guide",
    locations: ["docs/guides/", "docs/templates/"],
    patterns: [/GUIDE|HOW.?TO|TUTORIAL/i],
  },
};

// Expected locations for specific file types
const EXPECTED_LOCATIONS = {
  plan: {
    pattern: /PLAN\.md$/i,
    expected: ["docs/plans/", ".planning/"],
    message: "Plan documents should be in docs/plans/ or .planning/",
  },
  archive: {
    pattern: /^(archive-|archived-|\.archive)$/i,
    expected: ["docs/archive/"],
    message: "Archived documents should be in docs/archive/",
  },
  template: {
    pattern: /TEMPLATE\.md$/i,
    expected: ["docs/templates/"],
    message: "Template documents should be in docs/templates/",
  },
  audit: {
    pattern: /audit-\d{4}-\d{2}-\d{2}/i,
    expected: ["docs/audits/"],
    message: "Audit documents should be in docs/audits/",
  },
};

// Stale thresholds by tier (days)
const STALE_THRESHOLDS = {
  1: 60, // Tier 1 (Canonical): >60 days
  2: 90, // Tier 2 (Foundation): >90 days
  3: 120, // Tier 3+ (Planning/Reference/Guides): >120 days
  4: 120,
  5: 120,
};

/**
 * Get git last modified date for a file
 * Falls back to filesystem mtime if git command fails (e.g., untracked files)
 */
function getGitLastModified(filePath) {
  try {
    // Use execFileSync with args array to prevent shell injection
    const result = execFileSync("git", ["log", "-1", "--format=%ci", "--", filePath], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (result.trim()) {
      return new Date(result.trim());
    }
  } catch {
    // Git command failed - fall through to mtime fallback
  }
  // Fallback to filesystem modification time for untracked/new files
  try {
    return statSync(filePath).mtime;
  } catch {
    return null;
  }
}

/**
 * Count words in content
 */
function countWords(content) {
  // Remove code blocks
  const withoutCode = content.replaceAll(/```[\s\S]*?```/g, "");
  // Remove markdown syntax
  const text = withoutCode
    .replaceAll(/[#*_`[\]()]/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

/**
 * Determine the tier of a document
 * TODO: Refactor to reduce cognitive complexity (currently 23, target 15)
 */
function determineTier(filePath) {
  const fileName = basename(filePath);
  const relativePath = relative(ROOT, filePath).replaceAll(/\\/g, "/");

  // Check explicit file matches first
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (def.locations && def.locations.includes(fileName)) {
      return Number.parseInt(tier, 10);
    }
  }

  // Check path patterns
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (def.patterns) {
      for (const pattern of def.patterns) {
        if (pattern.test(relativePath) || pattern.test(fileName)) {
          return Number.parseInt(tier, 10);
        }
      }
    }
    if (def.locations) {
      for (const loc of def.locations) {
        if (relativePath.startsWith(loc)) {
          return Number.parseInt(tier, 10);
        }
      }
    }
  }

  return 4; // Default to Reference
}

/**
 * Check if file is in expected location
 */
function checkFileLocation(filePath) {
  const findings = [];
  const relativePath = relative(ROOT, filePath).replaceAll(/\\/g, "/");
  const fileName = basename(filePath);

  for (const [type, config] of Object.entries(EXPECTED_LOCATIONS)) {
    if (config.pattern.test(fileName)) {
      const inExpectedLocation = config.expected.some((loc) => relativePath.startsWith(loc));

      if (!inExpectedLocation) {
        findings.push({
          id: `DOC-LIFECYCLE-LOC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          category: "documentation",
          severity: "S2",
          effort: "E1",
          confidence: "HIGH",
          verified: "TOOL_VALIDATED",
          file: relativePath,
          line: 1,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} file in wrong location`,
          description: config.message,
          recommendation: `Move to ${config.expected[0]}`,
          evidence: [`Current: ${relativePath}`, `Expected: ${config.expected.join(" or ")}`],
          cross_ref: "placement_check",
        });
      }
    }
  }

  return findings;
}

/**
 * Check for archive candidates
 * TODO: Refactor to reduce cognitive complexity (currently 16, target 15)
 */
function checkArchiveCandidate(filePath, content) {
  const findings = [];
  const relativePath = relative(ROOT, filePath).replaceAll(/\\/g, "/");
  const fileName = basename(filePath);

  // Skip if already in archive
  if (relativePath.includes("archive/")) {
    return findings;
  }

  // Check for completed plans
  if (/PLAN\.md$/i.test(fileName)) {
    const hasCompleted =
      /status[:\s]*completed/i.test(content) ||
      /\[x\]\s*all/i.test(content) ||
      /100%\s*complete/i.test(content);

    if (hasCompleted) {
      findings.push({
        id: `DOC-LIFECYCLE-ARC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        category: "documentation",
        severity: "S3",
        effort: "E1",
        confidence: "MEDIUM",
        verified: "TOOL_VALIDATED",
        file: relativePath,
        line: 1,
        title: "Completed plan - archive candidate",
        description: "This plan appears to be completed and should be archived",
        recommendation: `Run: node scripts/archive-doc.js "${relativePath}"`,
        evidence: [
          "Status indicates completed",
          "Plan documents should be archived after completion",
        ],
        cross_ref: "archive_check",
      });
    }
  }

  // Check for old session handoffs
  if (/SESSION.*HANDOFF|HANDOFF.*SESSION/i.test(fileName)) {
    const gitDate = getGitLastModified(filePath);
    if (gitDate) {
      const daysSinceModified = Math.floor(
        (Date.now() - gitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceModified > 30) {
        findings.push({
          id: `DOC-LIFECYCLE-OLD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          category: "documentation",
          severity: "S3",
          effort: "E1",
          confidence: "MEDIUM",
          verified: "TOOL_VALIDATED",
          file: relativePath,
          line: 1,
          title: "Old session handoff - archive candidate",
          description: `Session handoff is ${daysSinceModified} days old (>30 days threshold)`,
          recommendation: `Run: node scripts/archive-doc.js "${relativePath}"`,
          evidence: [
            `Last modified: ${gitDate.toISOString().split("T")[0]}`,
            `Days old: ${daysSinceModified}`,
          ],
          cross_ref: "archive_check",
        });
      }
    }
  }

  // Check for old audit results
  if (/audit-\d{4}-\d{2}-\d{2}/i.test(fileName)) {
    const gitDate = getGitLastModified(filePath);
    if (gitDate) {
      const daysSinceModified = Math.floor(
        (Date.now() - gitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceModified > 60) {
        findings.push({
          id: `DOC-LIFECYCLE-AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          category: "documentation",
          severity: "S3",
          effort: "E1",
          confidence: "MEDIUM",
          verified: "TOOL_VALIDATED",
          file: relativePath,
          line: 1,
          title: "Old audit result - archive candidate",
          description: `Audit result is ${daysSinceModified} days old (>60 days threshold). Content may already be in MASTER_DEBT.jsonl.`,
          recommendation: `Run: node scripts/archive-doc.js "${relativePath}"`,
          evidence: [
            `Last modified: ${gitDate.toISOString().split("T")[0]}`,
            `Days old: ${daysSinceModified}`,
          ],
          cross_ref: "archive_check",
        });
      }
    }
  }

  return findings;
}

/**
 * Check for cleanup candidates
 */
function checkCleanupCandidate(filePath, content) {
  const findings = [];
  const relativePath = relative(ROOT, filePath).replaceAll(/\\/g, "/");
  const fileName = basename(filePath);

  // Skip archives and templates
  if (relativePath.includes("archive/") || relativePath.includes("templates/")) {
    return findings;
  }

  // Check for near-empty files (< 50 words)
  const wordCount = countWords(content);
  if (wordCount < 50) {
    findings.push({
      id: `DOC-LIFECYCLE-EMPTY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      category: "documentation",
      severity: "S2",
      effort: "E1",
      confidence: "HIGH",
      verified: "TOOL_VALIDATED",
      file: relativePath,
      line: 1,
      title: "Near-empty document",
      description: `Document has only ${wordCount} words (< 50 word minimum)`,
      recommendation: "Expand content or delete if not needed",
      evidence: [`Word count: ${wordCount}`, "Documents under 50 words are considered stubs"],
      cross_ref: "cleanup_check",
    });
  }

  // Check for draft files > 60 days old
  if (/DRAFT|WIP|TODO/i.test(fileName) || /status[:\s]*draft/i.test(content)) {
    const gitDate = getGitLastModified(filePath);
    if (gitDate) {
      const daysSinceModified = Math.floor(
        (Date.now() - gitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceModified > 60) {
        findings.push({
          id: `DOC-LIFECYCLE-DRAFT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          category: "documentation",
          severity: "S2",
          effort: "E2",
          confidence: "MEDIUM",
          verified: "TOOL_VALIDATED",
          file: relativePath,
          line: 1,
          title: "Stale draft document",
          description: `Draft document is ${daysSinceModified} days old (>60 days threshold)`,
          recommendation: "Complete, archive, or delete the draft",
          evidence: [
            `Last modified: ${gitDate.toISOString().split("T")[0]}`,
            `Days old: ${daysSinceModified}`,
            "Draft documents should be completed or removed within 60 days",
          ],
          cross_ref: "cleanup_check",
        });
      }
    }
  }

  // Check for temp/test files
  if (/^(temp|test|tmp|scratch|delete|remove)/i.test(fileName)) {
    findings.push({
      id: `DOC-LIFECYCLE-TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      category: "documentation",
      severity: "S2",
      effort: "E0",
      confidence: "HIGH",
      verified: "TOOL_VALIDATED",
      file: relativePath,
      line: 1,
      title: "Temporary file detected",
      description: `File name suggests this is a temporary file: ${fileName}`,
      recommendation: "Delete the temporary file or rename if needed permanently",
      evidence: [`File name: ${fileName}`, "Temporary files should not be committed"],
      cross_ref: "cleanup_check",
    });
  }

  return findings;
}

/**
 * Check document staleness
 */
function checkStaleness(filePath, content) {
  const findings = [];
  const relativePath = relative(ROOT, filePath).replaceAll(/\\/g, "/");

  // Skip archives
  if (relativePath.includes("archive/")) {
    return findings;
  }

  const tier = determineTier(filePath);
  const threshold = STALE_THRESHOLDS[tier] || 120;

  // Get last modified date from git
  const gitDate = getGitLastModified(filePath);
  if (gitDate) {
    const daysSinceModified = Math.floor((Date.now() - gitDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceModified > threshold) {
      findings.push({
        id: `DOC-LIFECYCLE-STALE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        category: "documentation",
        severity: tier <= 2 ? "S1" : "S2",
        effort: "E2",
        confidence: "HIGH",
        verified: "TOOL_VALIDATED",
        file: relativePath,
        line: 1,
        title: `Stale Tier ${tier} document`,
        description: `Document is ${daysSinceModified} days old (>${threshold} days threshold for Tier ${tier})`,
        recommendation: "Review and update the document or mark as intentionally stable",
        evidence: [
          `Last modified: ${gitDate.toISOString().split("T")[0]}`,
          `Days old: ${daysSinceModified}`,
          `Tier ${tier} threshold: ${threshold} days`,
        ],
        cross_ref: "freshness_check",
      });
    }
  }

  return findings;
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    // Skip directories we can't read (permissions, etc.)
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (
      (entry[0] === "." && entry !== ".planning") ||
      entry === "node_modules" ||
      entry === "out" ||
      entry === "dist"
    ) {
      continue;
    }

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (extname(entry) === ".md") {
        files.push(fullPath);
      }
    } catch {
      // Skip files we can't stat
    }
  }

  return files;
}

/**
 * Check a single document
 */
function checkDocument(filePath) {
  const findings = [];

  try {
    const content = readFileSync(filePath, "utf-8");

    if (VERBOSE) {
      console.log(`  Checking: ${relative(ROOT, filePath)}`);
    }

    // Run all checks
    findings.push(
      ...checkFileLocation(filePath),
      ...checkArchiveCandidate(filePath, content),
      ...checkCleanupCandidate(filePath, content),
      ...checkStaleness(filePath, content)
    );
  } catch (err) {
    if (!QUIET) {
      console.warn(`Warning: Could not check ${relative(ROOT, filePath)}: ${sanitizeError(err)}`);
    }
  }

  return findings;
}

/**
 * Main function
 * TODO: Refactor to reduce cognitive complexity (currently 19, target 15)
 */
function main() {
  if (!QUIET) {
    console.log("📁 Checking documentation placement and lifecycle...\n");
  }

  // Determine files to check
  const filesToCheck =
    fileArgs.length > 0 ? fileArgs.filter((f) => existsSync(f)) : findMarkdownFiles(ROOT);

  if (filesToCheck.length === 0) {
    console.log("No markdown files found to check.");
    process.exit(0);
  }

  if (!QUIET) {
    console.log(`Checking ${filesToCheck.length} file(s)...\n`);
  }

  // Check all files
  const allFindings = [];
  for (const file of filesToCheck) {
    const findings = checkDocument(file);
    allFindings.push(...findings);
  }

  // Output results
  if (OUTPUT_FILE) {
    const output = JSON_OUTPUT
      ? JSON.stringify(allFindings, null, 2)
      : allFindings.map((f) => JSON.stringify(f)).join("\n");

    writeFileSync(OUTPUT_FILE, output + "\n");

    if (!QUIET) {
      console.log(`\n📄 Results written to: ${OUTPUT_FILE}`);
    }
  } else if (JSON_OUTPUT) {
    console.log(JSON.stringify(allFindings, null, 2));
  } else if (allFindings.length > 0) {
    console.log("\n📋 JSONL Findings:\n");
    for (const finding of allFindings) {
      console.log(JSON.stringify(finding));
    }
  }

  // Group findings by type for summary
  const locationIssues = allFindings.filter((f) => f.title.includes("location"));
  const archiveCandidates = allFindings.filter((f) => f.title.includes("archive"));
  const cleanupCandidates = allFindings.filter(
    (f) => f.title.includes("empty") || f.title.includes("draft") || f.title.includes("Temporary")
  );
  const staleIssues = allFindings.filter((f) => f.title.includes("Stale"));

  // Summary
  if (!QUIET) {
    console.log("\n─".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`   Files checked: ${filesToCheck.length}`);
    console.log(`   Total findings: ${allFindings.length}`);
    console.log(`     - Location issues: ${locationIssues.length}`);
    console.log(`     - Archive candidates: ${archiveCandidates.length}`);
    console.log(`     - Cleanup candidates: ${cleanupCandidates.length}`);
    console.log(`     - Stale documents: ${staleIssues.length}`);

    if (allFindings.length === 0) {
      console.log("\n✅ All documentation placements are correct!");
    } else {
      console.log(`\n❌ ${allFindings.length} placement/lifecycle issue(s) found.`);
    }
  }

  process.exit(allFindings.length > 0 ? 1 : 0);
}

// Run main function
try {
  main();
} catch (error) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(2);
}
