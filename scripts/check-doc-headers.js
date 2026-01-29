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
 * Override: SKIP_DOC_HEADER_CHECK=1 to bypass (use sparingly)
 *
 * Reference: docs/DOCUMENTATION_INDEX.md for tier definitions
 *
 * Created: Session #115 (2026-01-29)
 * Security: Review #217 - error handling, basename checks, override implementation
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Review #217 R4: Resolve from git repo root for path safety and subdirectory support
let REPO_ROOT = "";
try {
  REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
} catch {
  // Not in a git repository - use cwd as fallback
  REPO_ROOT = process.cwd();
}

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

/**
 * Safely extract error message (Review #217: pattern compliance)
 */
function getErrorMessage(err) {
  return err instanceof Error ? err.message : String(err);
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

/**
 * Check if file is exempt from header requirements
 * Review #217: Test both full path AND basename to handle nested files like docs/README.md
 */
function isExempt(filePath) {
  const basename = path.basename(filePath);
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(filePath) || pattern.test(basename));
}

function checkDocumentHeaders(filePath) {
  const errors = [];
  const warnings = [];

  try {
    // Review #217 R4: Construct absolute path from repo root for subdirectory support
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);

    // Review #217 R5: Resolve symlinks before containment check to prevent reading outside repo
    const realRepoRoot = fs.realpathSync(REPO_ROOT);
    const realAbsolutePath = fs.realpathSync(absolutePath);

    // Review #217 R4/R5: Path containment validation to prevent path traversal and symlink bypass
    // Use regex pattern to avoid false positives like "..hidden.md"
    const rel = path.relative(realRepoRoot, realAbsolutePath);
    if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      return { errors: [`Path outside repository: ${filePath}`], warnings: [] };
    }

    const content = fs.readFileSync(realAbsolutePath, "utf8");
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
    // Review #217: Safe error message extraction
    return { errors: [`Could not read file: ${getErrorMessage(err)}`], warnings: [] };
  }
}

/**
 * Get staged .md files from git
 * Review #217: Log error and exit instead of silent failure
 * Review #217 R5: Use -z flag for NUL-delimited output to handle filenames with spaces
 */
function getStagedFiles(filter = "A") {
  try {
    // A = Added, M = Modified, AM = both
    // -z flag outputs NUL-delimited paths for safe parsing of filenames with spaces
    const result = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=" + filter, "-z"],
      { encoding: "utf8" }
    );
    return result
      .split("\0")
      .map((f) => f.trim())
      .filter((f) => f !== "" && f.toLowerCase().endsWith(".md"));
  } catch (err) {
    log(
      `\n❌ Error getting staged files. Is git installed and are you in a git repository?`,
      colors.red
    );
    log(`   ${getErrorMessage(err)}`, colors.red);
    process.exit(2);
  }
}

function main() {
  // Review #217: Implement documented SKIP_DOC_HEADER_CHECK override
  if (process.env.SKIP_DOC_HEADER_CHECK === "1") {
    log("⏭️  SKIP_DOC_HEADER_CHECK=1 set; skipping document header validation.", colors.yellow);
    process.exit(0);
  }

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
