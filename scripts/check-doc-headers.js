#!/usr/bin/env node
/**
 * Document Header Validation (BLOCKING for new docs)
 *
 * Purpose: Ensures new markdown documents have required headers per doc standards.
 * For Tier 3+ documents, requires: Document Version, Last Updated, Status
 *
 * Exit Codes:
 *   0 - All new docs have proper headers (or no new docs)
 *   1 - New docs missing required headers (blocking)
 *   2 - Error during execution
 *
 * Usage:
 *   node scripts/check-doc-headers.js              # Check staged NEW .md files
 *   node scripts/check-doc-headers.js --all        # Check all staged .md files
 *   node scripts/check-doc-headers.js --verbose    # Show all checks
 *
 * Reference: docs/DOCUMENTATION_INDEX.md for tier definitions
 *
 * Created: Session #115 (2026-01-29)
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Parse arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const checkAll = args.includes("--all");

// TTY-aware colors
const useColors = process.stdout.isTTY;
const colors = {
  red: useColors ? "\x1b[31m" : "",
  green: useColors ? "\x1b[32m" : "",
  yellow: useColors ? "\x1b[33m" : "",
  cyan: useColors ? "\x1b[36m" : "",
  reset: useColors ? "\x1b[0m" : "",
  bold: useColors ? "\x1b[1m" : "",
};

function log(message, color = "") {
  console.log(color ? `${color}${message}${colors.reset}` : message);
}

// Files/folders exempt from header requirements
const EXEMPT_PATTERNS = [
  /^README\.md$/i,
  /^CHANGELOG\.md$/i,
  /^LICENSE\.md$/i,
  /^node_modules\//,
  /^\.next\//,
  /^coverage\//,
  /^dist\//,
  /^\.git\//,
  /DOCUMENTATION_INDEX\.md$/,
  /\/archive\//i,
  // Auto-generated files
  /package-lock\.json/,
];

// Required header fields for Tier 3+ documents
const REQUIRED_HEADERS = [
  { pattern: /\*\*Document Version:\*\*|\*\*Version:\*\*/i, name: "Document Version" },
  { pattern: /\*\*Last Updated:\*\*|\*\*Updated:\*\*/i, name: "Last Updated" },
  { pattern: /\*\*Status:\*\*/i, name: "Status" },
];

// Optional but recommended
const RECOMMENDED_HEADERS = [
  { pattern: /\*\*Related:\*\*|\*\*See Also:\*\*/i, name: "Related/See Also" },
  { pattern: /\*\*Purpose:\*\*|^>\s*\*\*Purpose/m, name: "Purpose" },
];

function isExempt(filePath) {
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(filePath));
}

function checkDocumentHeaders(filePath) {
  const errors = [];
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const headerSection = content.slice(0, 2000); // Check first 2000 chars for headers

    // Check required headers
    for (const header of REQUIRED_HEADERS) {
      if (!header.pattern.test(headerSection)) {
        errors.push(`Missing required header: ${header.name}`);
      }
    }

    // Check recommended headers (warnings only)
    for (const header of RECOMMENDED_HEADERS) {
      if (!header.pattern.test(headerSection)) {
        warnings.push(`Consider adding: ${header.name}`);
      }
    }

    // Check for prettier-ignore block (recommended for header formatting)
    if (!headerSection.includes("prettier-ignore-start") && errors.length === 0) {
      warnings.push("Consider wrapping headers in <!-- prettier-ignore-start/end -->");
    }

    return { errors, warnings };
  } catch (err) {
    return { errors: [`Could not read file: ${err.message}`], warnings: [] };
  }
}

function getStagedFiles(filter = "A") {
  try {
    // A = Added, M = Modified, AM = both
    const result = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=" + filter],
      { encoding: "utf8" }
    );
    return result.split("\n").filter((f) => f.endsWith(".md") && f.trim() !== "");
  } catch {
    return [];
  }
}

function main() {
  log("\n📎 Document Header Validation\n");

  // Get staged files - new files only by default, all if --all
  const filter = checkAll ? "AM" : "A";
  const filterDesc = checkAll ? "new and modified" : "new";
  const stagedFiles = getStagedFiles(filter);

  if (stagedFiles.length === 0) {
    log(`✅ No ${filterDesc} .md files staged`, colors.green);
    process.exit(0);
  }

  // Filter out exempt files
  const filesToCheck = stagedFiles.filter((f) => !isExempt(f));

  if (filesToCheck.length === 0) {
    log(`✅ All ${filterDesc} .md files are exempt from header checks`, colors.green);
    process.exit(0);
  }

  if (verbose) {
    log(`Checking ${filesToCheck.length} ${filterDesc} .md file(s):\n`, colors.cyan);
  }

  let hasErrors = false;
  const results = [];

  for (const file of filesToCheck) {
    const { errors, warnings } = checkDocumentHeaders(file);
    results.push({ file, errors, warnings });

    if (errors.length > 0) {
      hasErrors = true;
    }
  }

  // Display results
  for (const { file, errors, warnings } of results) {
    if (errors.length > 0) {
      log(`\n❌ ${file}`, colors.red);
      for (const err of errors) {
        log(`   ${err}`, colors.red);
      }
      if (warnings.length > 0 && verbose) {
        for (const warn of warnings) {
          log(`   ⚠️ ${warn}`, colors.yellow);
        }
      }
    } else if (verbose) {
      log(`✅ ${file}`, colors.green);
      if (warnings.length > 0) {
        for (const warn of warnings) {
          log(`   ⚠️ ${warn}`, colors.yellow);
        }
      }
    }
  }

  if (hasErrors) {
    log("\n❌ Missing required document headers\n", colors.red);
    log("Required headers for new documents:", colors.bold);
    log("  <!-- prettier-ignore-start -->");
    log("  **Document Version:** 1.0");
    log("  **Last Updated:** YYYY-MM-DD");
    log("  **Status:** DRAFT | ACTIVE | DEPRECATED");
    log("  <!-- prettier-ignore-end -->\n");
    log("Override (use sparingly): SKIP_DOC_HEADER_CHECK=1 git commit ...\n");
    process.exit(1);
  }

  log(
    `\n✅ All ${filesToCheck.length} ${filterDesc} document(s) have required headers`,
    colors.green
  );
  process.exit(0);
}

main();
