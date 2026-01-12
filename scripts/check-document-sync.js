#!/usr/bin/env node
/**
 * Document Template-Instance Sync Checker
 *
 * Validates that template-derived documents are properly synchronized.
 * Reads DOCUMENT_DEPENDENCIES.md to identify template-instance pairs,
 * then checks for common sync issues.
 *
 * Usage: node scripts/check-document-sync.js [options]
 *
 * Options:
 *   --verbose    Show detailed output
 *   --json       Output as JSON
 *   --fix        Auto-fix simple issues (placeholder detection)
 *
 * Exit codes: 0 = all synced, 1 = sync issues found, 2 = error
 */

import { readFileSync, existsSync, realpathSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const JSON_OUTPUT = args.includes("--json");
const FIX = args.includes("--fix");

// Block unimplemented --fix flag to prevent false confidence
if (FIX) {
  console.error("❌ --fix flag is not implemented yet");
  console.error("   Refusing to run to avoid giving false confidence that issues were fixed");
  console.error("   Please fix issues manually by editing the affected files");
  process.exit(2);
}

const DEPS_FILE = join(ROOT, "docs", "DOCUMENT_DEPENDENCIES.md");

/**
 * Parse DOCUMENT_DEPENDENCIES.md to extract template-instance pairs
 */
function parseDocumentDependencies() {
  if (!existsSync(DEPS_FILE)) {
    console.error("❌ DOCUMENT_DEPENDENCIES.md not found");
    process.exit(2);
  }

  const content = readFileSync(DEPS_FILE, "utf-8");
  const pairs = [];

  // Extract only Section 1 (Multi-AI Audit Plan Templates) to prevent false matches
  // from other sections like Core Document Templates
  const section1Match = content.match(/### 1\. Multi-AI Audit Plan Templates([\s\S]*?)(?=###|$)/);
  if (!section1Match) {
    console.error(
      '⚠️  Could not find "Multi-AI Audit Plan Templates" section in DOCUMENT_DEPENDENCIES.md'
    );
    return pairs;
  }

  const section1Content = section1Match[1];

  // Extract Multi-AI Audit Plan templates (table format)
  // Fixed ReDoS: bounded quantifiers {1,500} prevent exponential backtracking
  // Sync status column increased to {1,100} to accommodate longer descriptions
  const tableRegex =
    /\|\s*\*\*([^*]{1,200})\*\*\s*\|\s*([^|]{1,500})\s*\|\s*([^|]{1,200})\s*\|\s*([^|]{1,50})\s*\|\s*([^|]{1,100})\s*\|/g;
  let match;

  while ((match = tableRegex.exec(section1Content)) !== null) {
    const [, template, instance, location, lastSynced, syncStatus] = match;

    // Skip header rows
    if (template.includes("Template") || template.includes("---")) continue;

    // Construct path and validate it stays within ROOT (prevent path traversal)
    const constructedPath = join(ROOT, location.trim(), instance.trim());
    let validatedPath;

    try {
      // Resolve to absolute path and verify it's within ROOT
      validatedPath = realpathSync(constructedPath);
      const normalizedRoot = realpathSync(ROOT);
      const rel = relative(normalizedRoot, validatedPath);

      // If path escapes ROOT, it will start with '..'
      if (rel.startsWith("..")) {
        console.error(`⚠️  Skipping path outside repository: ${constructedPath}`);
        continue;
      }
    } catch (error) {
      // File doesn't exist yet - validate constructed path manually
      const normalizedRoot = realpathSync(ROOT);
      const normalizedPath = join(normalizedRoot, location.trim(), instance.trim());
      const rel = relative(normalizedRoot, normalizedPath);

      // If path escapes ROOT, it will start with '..'
      if (rel.startsWith("..")) {
        console.error(`⚠️  Skipping path outside repository: ${constructedPath}`);
        continue;
      }
      validatedPath = normalizedPath;
    }

    pairs.push({
      template: template.trim(),
      instance: instance.trim(),
      location: location.trim(),
      lastSynced: lastSynced.trim(),
      syncStatus: syncStatus.trim(),
      fullPath: validatedPath,
    });
  }

  return pairs;
}

/**
 * Check for placeholder patterns that should have been replaced
 */
function checkPlaceholders(filePath) {
  if (!existsSync(filePath)) {
    return { error: "File not found", placeholders: [] };
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  // Pattern 1: [e.g., ...] - example placeholders (bounded to prevent ReDoS)
  const examplePattern = /\[e\.g\.,\s*[^\]]{1,200}\]/g;
  // Pattern 2: [X] - placeholder values
  const valuePlaceholder = /\[X\]/g;
  // Pattern 3: [Project Name] - generic placeholders (bounded to prevent ReDoS)
  // Note: [TODO] matches exact placeholder, NOT checklist items like "[ ] TODO: fix"
  const genericPlaceholder = /\[(Project Name|GITHUB_REPO_URL|Repository|Framework|TODO)\]/gi;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Reset regex lastIndex to prevent state leak across iterations
    examplePattern.lastIndex = 0;
    valuePlaceholder.lastIndex = 0;
    genericPlaceholder.lastIndex = 0;

    let match;
    while ((match = examplePattern.exec(line)) !== null) {
      issues.push({
        line: lineNum,
        type: "example_placeholder",
        text: match[0],
        severity: "CRITICAL",
      });
    }

    while ((match = valuePlaceholder.exec(line)) !== null) {
      issues.push({
        line: lineNum,
        type: "value_placeholder",
        text: match[0],
        severity: "CRITICAL",
      });
    }

    while ((match = genericPlaceholder.exec(line)) !== null) {
      issues.push({
        line: lineNum,
        type: "generic_placeholder",
        text: match[0],
        severity: "MAJOR",
      });
    }
  });

  return { placeholders: issues };
}

/**
 * Check for broken relative links
 */
function checkBrokenLinks(filePath) {
  if (!existsSync(filePath)) {
    return { error: "File not found", brokenLinks: [] };
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  // Markdown link pattern: [text](path) - bounded to prevent ReDoS
  const linkPattern = /\[([^\]]{1,200})\]\(([^)]{1,500})\)/g;

  // Get normalized root for path traversal validation
  const normalizedRoot = realpathSync(ROOT);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Reset regex lastIndex to prevent state leak
    linkPattern.lastIndex = 0;

    let match;

    while ((match = linkPattern.exec(line)) !== null) {
      const [, text, path] = match;

      // Skip external URLs and non-file URI schemes
      if (
        path.startsWith("http://") ||
        path.startsWith("https://") ||
        path.startsWith("mailto:") ||
        path.startsWith("tel:") ||
        path.startsWith("data:")
      ) {
        continue;
      }

      // Skip anchors
      if (path.startsWith("#")) continue;

      // Check relative paths
      const fileDir = dirname(filePath);
      const targetPath = join(fileDir, path.split("#")[0]); // Remove anchor

      // Validate path stays within ROOT (prevent path traversal)
      try {
        const resolvedTarget = realpathSync(targetPath);
        const rel = relative(normalizedRoot, resolvedTarget);

        // If path escapes ROOT, it will start with '..'
        if (rel.startsWith("..")) {
          if (VERBOSE) {
            console.error(`⚠️  Skipping link outside repository: ${path} (line ${lineNum})`);
          }
          continue;
        }
      } catch (error) {
        // File doesn't exist - validate constructed path manually
        const rel = relative(normalizedRoot, targetPath);

        // If path escapes ROOT, it will start with '..'
        if (rel.startsWith("..")) {
          if (VERBOSE) {
            console.error(`⚠️  Skipping link outside repository: ${path} (line ${lineNum})`);
          }
          continue;
        }

        // Path is within ROOT but doesn't exist - report as broken link
        issues.push({
          line: lineNum,
          type: "broken_link",
          text: `[${text}](${path})`,
          path: path,
          severity: "MAJOR",
        });
        continue;
      }

      // If we reach here, realpathSync succeeded, so file exists and is within ROOT
      // No need for additional existsSync check
    }
  });

  return { brokenLinks: issues };
}

/**
 * Check if last synced date is stale (>90 days)
 */
function checkStaleness(lastSyncedStr) {
  // Parse date like "2026-01-08"
  const match = lastSyncedStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    // Surface parse error instead of silently treating as "not stale"
    return {
      isStale: true,
      parseError: true,
      daysSinceSync: null,
      reason: `Unable to parse date: "${lastSyncedStr}" (expected YYYY-MM-DD format)`,
    };
  }

  const [, year, month, day] = match;
  const lastSynced = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const now = new Date();
  const daysDiff = Math.floor((now - lastSynced) / (1000 * 60 * 60 * 24));

  return {
    isStale: daysDiff > 90,
    parseError: false,
    daysSinceSync: daysDiff,
    reason: daysDiff > 90 ? `${daysDiff} days since last sync (>90 day threshold)` : null,
  };
}

/**
 * Main validation logic
 */
function validateDocumentSync() {
  const pairs = parseDocumentDependencies();

  if (pairs.length === 0) {
    console.error("⚠️  No template-instance pairs found in DOCUMENT_DEPENDENCIES.md");
    return { pairs: [], issues: 0, success: true };
  }

  const results = [];
  let totalIssues = 0;

  for (const pair of pairs) {
    const result = {
      template: pair.template,
      instance: pair.instance,
      location: pair.location,
      lastSynced: pair.lastSynced,
      syncStatus: pair.syncStatus,
      issues: [],
    };

    // Check 1: Placeholder detection
    const placeholderCheck = checkPlaceholders(pair.fullPath);
    if (placeholderCheck.error) {
      result.issues.push({
        type: "file_missing",
        severity: "CRITICAL",
        message: `Instance file not found: ${pair.fullPath}`,
      });
      totalIssues++;
    } else if (placeholderCheck.placeholders.length > 0) {
      result.issues.push({
        type: "placeholders",
        severity: "CRITICAL",
        count: placeholderCheck.placeholders.length,
        details: placeholderCheck.placeholders,
      });
      totalIssues += placeholderCheck.placeholders.length;
    }

    // Check 2: Broken links
    const linkCheck = checkBrokenLinks(pair.fullPath);
    if (!linkCheck.error && linkCheck.brokenLinks.length > 0) {
      result.issues.push({
        type: "broken_links",
        severity: "MAJOR",
        count: linkCheck.brokenLinks.length,
        details: linkCheck.brokenLinks,
      });
      totalIssues += linkCheck.brokenLinks.length;
    }

    // Check 3: Staleness
    const stalenessCheck = checkStaleness(pair.lastSynced);
    if (stalenessCheck.isStale) {
      result.issues.push({
        type: stalenessCheck.parseError ? "invalid_last_synced" : "stale",
        severity: stalenessCheck.parseError ? "MAJOR" : "MINOR",
        message: stalenessCheck.reason,
        daysSinceSync: stalenessCheck.daysSinceSync,
      });
      totalIssues++;
    }

    results.push(result);
  }

  return {
    pairs: results,
    totalPairs: pairs.length,
    issueCount: totalIssues,
    success: totalIssues === 0,
  };
}

/**
 * Output formatting
 */
function formatOutput(results) {
  if (JSON_OUTPUT) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log("\n🔍 Document Template-Instance Sync Check\n");
  console.log(`Checked ${results.totalPairs} template-instance pair(s)\n`);

  if (results.success) {
    console.log("✅ All documents are in sync");
    console.log(`   No placeholders, broken links, or stale sync dates found\n`);
    return;
  }

  console.log(`⚠️  Found ${results.issueCount} issue(s):\n`);

  for (const pair of results.pairs) {
    if (pair.issues.length === 0) continue;

    console.log(`📄 ${pair.instance}`);
    console.log(`   Template: ${pair.template}`);
    console.log(`   Location: ${pair.location}`);
    console.log(`   Last Synced: ${pair.lastSynced}\n`);

    for (const issue of pair.issues) {
      const icon = issue.severity === "CRITICAL" ? "❌" : issue.severity === "MAJOR" ? "⚠️" : "ℹ️";

      if (issue.type === "placeholders") {
        console.log(`   ${icon} PLACEHOLDERS: ${issue.count} placeholder(s) need replacement`);
        if (VERBOSE) {
          issue.details.forEach((p) => {
            console.log(`      Line ${p.line}: ${p.text}`);
          });
        }
      } else if (issue.type === "broken_links") {
        console.log(`   ${icon} BROKEN LINKS: ${issue.count} broken link(s) found`);
        if (VERBOSE) {
          issue.details.forEach((l) => {
            console.log(`      Line ${l.line}: ${l.path}`);
          });
        }
      } else if (issue.type === "stale") {
        console.log(`   ${icon} STALE: ${issue.message}`);
      } else if (issue.type === "file_missing") {
        console.log(`   ${icon} MISSING: ${issue.message}`);
      }
    }
    console.log();
  }

  console.log("Run with --verbose for detailed line numbers");
  console.log("See docs/DOCUMENT_DEPENDENCIES.md for sync protocols\n");
}

/**
 * Main execution
 */
try {
  const results = validateDocumentSync();
  formatOutput(results);
  process.exit(results.success ? 0 : 1);
} catch (error) {
  console.error("❌ Error during document sync check:", error.message);
  if (VERBOSE) {
    console.error(error.stack);
  }
  process.exit(2);
}
