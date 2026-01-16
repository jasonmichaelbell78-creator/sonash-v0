#!/usr/bin/env node
/**
 * Cross-Document Dependency Checker (BLOCKING)
 *
 * Purpose: Ensures cross-document dependencies are maintained when commits are made.
 * When a document is modified that has dependencies, this script blocks the commit
 * unless the dependent documents are also staged.
 *
 * Exit Codes:
 *   0 - No dependency issues found
 *   1 - Dependency issues found (blocking)
 *   2 - Error during execution
 *
 * Usage:
 *   node scripts/check-cross-doc-deps.js              # Check staged files
 *   node scripts/check-cross-doc-deps.js --verbose    # Show all checks
 *   node scripts/check-cross-doc-deps.js --dry-run    # Check without blocking
 *
 * Reference: docs/DOCUMENT_DEPENDENCIES.md#cross-document-update-triggers
 *
 * Created: Session #69 (2026-01-16)
 */

const { execFileSync } = require("child_process");
const path = require("path");

// Parse arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const dryRun = args.includes("--dry-run");

// TTY-aware colors (Review #157 - avoid raw escape codes in non-TTY output)
const useColors = process.stdout.isTTY;
const colors = {
  red: useColors ? "\x1b[31m" : "",
  green: useColors ? "\x1b[32m" : "",
  yellow: useColors ? "\x1b[33m" : "",
  blue: useColors ? "\x1b[34m" : "",
  cyan: useColors ? "\x1b[36m" : "",
  reset: useColors ? "\x1b[0m" : "",
  bold: useColors ? "\x1b[1m" : "",
};

function log(message, color = "") {
  console.log(color ? `${color}${message}${colors.reset}` : message);
}

function logVerbose(message) {
  if (verbose) {
    log(`  [verbose] ${message}`, colors.cyan);
  }
}

/**
 * Cross-document dependency rules
 * Based on docs/DOCUMENT_DEPENDENCIES.md#cross-document-update-triggers
 */
const dependencyRules = [
  {
    trigger: "ROADMAP.md",
    dependents: ["SESSION_CONTEXT.md"],
    reason: "Session context reflects current roadmap focus",
    checkDiff: false, // Any change to ROADMAP triggers this
  },
  {
    trigger: "package.json",
    dependents: ["DEVELOPMENT.md"],
    reason: "All scripts should be documented",
    checkDiff: true, // Only check if 'scripts' section changed
    diffPattern: /"scripts"/,
  },
  {
    trigger: ".husky/",
    dependents: ["docs/TRIGGERS.md", "DEVELOPMENT.md"],
    reason: "Hook documentation must be complete",
    checkDiff: false,
  },
  {
    trigger: ".claude/hooks/",
    dependents: ["docs/TRIGGERS.md", "DEVELOPMENT.md"],
    reason: "Hook documentation must be complete",
    checkDiff: false,
  },
  {
    trigger: ".claude/commands/",
    dependents: [".claude/COMMAND_REFERENCE.md"],
    reason: "Skill/command registry must be complete",
    checkDiff: false,
  },
  {
    trigger: ".claude/skills/",
    dependents: [".claude/COMMAND_REFERENCE.md"],
    reason: "Skill/command registry must be complete",
    checkDiff: false,
  },
];

/**
 * Get list of staged files from git
 */
function getStagedFiles() {
  try {
    // Use execFileSync with args array for security consistency (Review #157)
    const output = execFileSync("git", ["diff", "--cached", "--name-only"], {
      encoding: "utf-8",
    });
    return output
      .trim()
      .split("\n")
      .filter((f) => f.length > 0);
  } catch (_error) {
    log("Error: Could not get staged files from git", colors.red);
    process.exit(2);
  }
}

/**
 * Check if a diff pattern exists in staged changes for a file
 */
function checkDiffPattern(file, pattern) {
  try {
    // Use execFileSync with args array to prevent command injection (SEC-001, SEC-010)
    // Use -- separator to prevent option injection from filenames starting with - (Review #158)
    const diff = execFileSync("git", ["diff", "--cached", "--unified=0", "--", file], {
      encoding: "utf-8",
    });
    return pattern.test(diff);
  } catch (error) {
    // Log unexpected errors for debugging (Review #157)
    // Safe error message extraction (Review #158)
    if (verbose) {
      const message = error instanceof Error ? error.message : String(error);
      logVerbose(`Failed to check diff pattern for ${file}: ${message}`);
    }
    return false;
  }
}

/**
 * Check if any staged file matches a trigger pattern
 * Improved path matching to prevent false positives (Review #158)
 */
function matchesTrigger(stagedFiles, trigger) {
  const isDirTrigger = trigger.endsWith("/");
  const isBareName = !trigger.includes("/");

  return stagedFiles.some((file) => {
    // Handle directory triggers (ending with /)
    if (isDirTrigger) {
      return file.startsWith(trigger);
    }
    // Exact match first
    if (file === trigger) return true;
    // For bare names (no path separator), match at end of path
    return isBareName && file.endsWith(`/${trigger}`);
  });
}

/**
 * Check if dependent file is staged
 * Improved path matching to prevent false positives (Review #158)
 */
function isDependentStaged(stagedFiles, dependent) {
  const isBareName = !dependent.includes("/");

  return stagedFiles.some((file) => {
    // Exact match first
    if (file === dependent) return true;
    // For bare names, match at end of path
    return isBareName && file.endsWith(`/${dependent}`);
  });
}

/**
 * Main check function
 */
function checkDependencies() {
  log(`\n${colors.bold}📎 Cross-Document Dependency Check${colors.reset}\n`);

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    log("No staged files to check.", colors.green);
    return 0;
  }

  logVerbose(`Staged files: ${stagedFiles.length}`);
  if (verbose) {
    stagedFiles.forEach((f) => logVerbose(`  - ${f}`));
  }

  const issues = [];
  const passed = [];

  for (const rule of dependencyRules) {
    // Check if trigger matches any staged file
    if (!matchesTrigger(stagedFiles, rule.trigger)) {
      logVerbose(`Rule skipped (no trigger match): ${rule.trigger}`);
      continue;
    }

    logVerbose(`Rule triggered: ${rule.trigger}`);

    // If rule requires diff check, verify the pattern exists
    if (rule.checkDiff) {
      const triggerFile = stagedFiles.find(
        (f) => f === rule.trigger || f.endsWith(`/${rule.trigger}`)
      );
      if (triggerFile && !checkDiffPattern(triggerFile, rule.diffPattern)) {
        logVerbose(`Rule skipped (diff pattern not found): ${rule.trigger}`);
        continue;
      }
    }

    // Check each dependent
    for (const dependent of rule.dependents) {
      if (isDependentStaged(stagedFiles, dependent)) {
        passed.push({
          trigger: rule.trigger,
          dependent,
          reason: rule.reason,
        });
        logVerbose(`Dependency satisfied: ${dependent}`);
      } else {
        issues.push({
          trigger: rule.trigger,
          dependent,
          reason: rule.reason,
        });
      }
    }
  }

  // Report results
  if (passed.length > 0 && verbose) {
    log("\n✅ Satisfied dependencies:", colors.green);
    passed.forEach((p) => {
      log(`   ${p.trigger} → ${p.dependent}`, colors.green);
    });
  }

  if (issues.length > 0) {
    log("\n❌ Missing dependent documents:", colors.red);
    log("", colors.reset);

    issues.forEach((issue) => {
      log(
        `   ${colors.yellow}${issue.trigger}${colors.reset} changed but ${colors.cyan}${issue.dependent}${colors.reset} is not staged`
      );
      log(`   └─ Reason: ${issue.reason}`, colors.reset);
      log("");
    });

    log(`${colors.bold}📋 Resolution Options:${colors.reset}`);
    log("");
    log("   1. Update the dependent documents and stage them:");
    issues.forEach((issue) => {
      log(`      ${colors.cyan}git add ${issue.dependent}${colors.reset}`);
    });
    log("");
    log("   2. If no changes are needed, create an empty commit note:");
    log(`      Add a comment in the dependent doc explaining why no update needed`);
    log("");
    log("   3. Override this check (use sparingly):");
    log(`      ${colors.yellow}SKIP_CROSS_DOC_CHECK=1 git commit ...${colors.reset}`);
    log("");
    log(`   📖 Reference: docs/DOCUMENT_DEPENDENCIES.md#cross-document-update-triggers`);
    log("");

    if (dryRun) {
      log(
        `${colors.yellow}[DRY RUN] Would block commit with ${issues.length} issue(s)${colors.reset}`
      );
      return 0;
    }

    return 1;
  }

  log("✅ All cross-document dependencies satisfied", colors.green);
  return 0;
}

// Run the check
try {
  // Allow override via environment variable
  if (process.env.SKIP_CROSS_DOC_CHECK === "1") {
    log("⚠️  Cross-document check skipped (SKIP_CROSS_DOC_CHECK=1)", colors.yellow);
    process.exit(0);
  }

  const exitCode = checkDependencies();
  process.exit(exitCode);
} catch (error) {
  // Safe error message extraction (Review #158)
  const message = error instanceof Error ? error.message : String(error);
  log(`Error: ${message}`, colors.red);
  process.exit(2);
}
