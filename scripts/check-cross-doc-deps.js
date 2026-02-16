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

const { execFileSync } = require("node:child_process");
const { loadConfigWithRegex } = require("./config/load-config");

// Parse arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const dryRun = args.includes("--dry-run");
const trivialMode = args.includes("--trivial");

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
 * Single source of truth: scripts/config/doc-dependencies.json
 * Reference: docs/DOCUMENT_DEPENDENCIES.md#cross-document-update-triggers
 */
let dependencyRules = [];
try {
  const cfg = loadConfigWithRegex("doc-dependencies", ["diffPattern"]);
  dependencyRules = Array.isArray(cfg.rules) ? cfg.rules : [];
} catch (configErr) {
  const msg = configErr instanceof Error ? configErr.message : String(configErr);
  log(`Error: failed to load doc dependency rules: ${msg}`, colors.red);
  process.exit(2);
}

if (dependencyRules.length === 0) {
  log(
    "Warning: No dependency rules loaded from config. Check doc-dependencies.json.",
    colors.yellow
  );
  if (!dryRun) {
    log("Error: cross-doc dependency enforcement disabled due to empty rules.", colors.red);
    process.exit(2);
  }
}

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
  } catch {
    log("Error: Could not get staged files from git", colors.red);
    process.exit(2);
  }
}

/**
 * Get staged files filtered by git diff-filter (A=added, D=deleted, M=modified, etc.)
 * Used by rules with gitFilter to only trigger on specific change types.
 */
function getStagedFilesFiltered(filter) {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", `--diff-filter=${filter}`],
      {
        encoding: "utf-8",
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    return output
      .trim()
      .split("\n")
      .filter((f) => f.length > 0);
  } catch {
    return [];
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
 * Check if staged changes to a file are "trivial" (whitespace, comments, formatting only).
 * Used with --trivial flag to skip cross-doc enforcement for non-substantive changes.
 * Hook-quality fix: reduces false positives from typo fixes and formatting commits.
 */
// Cache trivial-change results to avoid redundant git diff calls (Review #315)
const trivialChangeCache = new Map();

function isTrivialChange(file) {
  const gitPath = file.replaceAll("\\", "/");
  if (trivialChangeCache.has(gitPath)) return trivialChangeCache.get(gitPath);

  let result = false;
  try {
    // Quick check: if whitespace-insensitive diff has no changes, it's formatting-only
    const wsDiff = execFileSync("git", ["diff", "--cached", "-w", "--unified=0", "--", gitPath], {
      encoding: "utf-8",
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    });
    const wsChangeLines = wsDiff
      .split("\n")
      .filter((line) => /^[+-]/.test(line) && !/^[+-]{3}/.test(line));
    if (wsChangeLines.length === 0) {
      result = true;
    } else {
      // Get only the changed lines (added/removed), excluding context
      const diff = execFileSync("git", ["diff", "--cached", "--unified=0", "--", gitPath], {
        encoding: "utf-8",
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });

      // Extract only actual change lines (+ and - prefixed, not headers)
      const changeLines = diff
        .split("\n")
        .filter((line) => /^[+-]/.test(line) && !/^[+-]{3}/.test(line))
        .map((line) => line.slice(1)); // strip the +/- prefix

      if (changeLines.length === 0) {
        result = true;
      } else {
        // A change is trivial if ALL changed lines are:
        // - empty or whitespace-only
        // - comments (JS/TS: //, shell/yaml: #, or block comment interior *)
        // - status badge updates, date updates, version bumps
        // Note: # means "comment" in .sh/.yml/.py but "heading" in .md
        const ext = gitPath.split(".").pop()?.toLowerCase();
        const hashIsComment =
          ext && ["sh", "bash", "zsh", "py", "rb", "yml", "yaml", "toml"].includes(ext);
        // Include \* for block comment interior lines (Review #315)
        const trivialPattern = hashIsComment
          ? /^\s*$|^\s*(?:\/\/|#|\/\*|\*\/|\*|<!--).*$|^\s*\*\*(?:Status|Last Updated|Document Version):\*\*\s/
          : /^\s*$|^\s*(?:\/\/|\/\*|\*\/|\*|<!--).*$|^\s*\*\*(?:Status|Last Updated|Document Version):\*\*\s/;
        result = changeLines.every((line) => trivialPattern.test(line));
      }
    }
  } catch {
    // If we can't determine, assume non-trivial (safer)
    result = false;
  }
  trivialChangeCache.set(gitPath, result);
  return result;
}

/**
 * Check if any staged file matches a trigger pattern
 * Improved path matching to prevent false positives (Review #158)
 * Normalized for cross-platform reliability (Review #160)
 */
function matchesTrigger(stagedFiles, trigger) {
  const isDirTrigger = trigger.endsWith("/");
  const isBareName = !trigger.includes("/");
  // Normalize trigger: backslash→forward, lowercase (Review #160)
  const normTrigger = trigger.replace(/\\/g, "/").toLowerCase();

  return stagedFiles.some((file) => {
    // Normalize file path for cross-platform matching (Review #160)
    const normFile = file.replace(/\\/g, "/").toLowerCase();

    // Handle directory triggers (ending with /)
    if (isDirTrigger) {
      return normFile.startsWith(normTrigger);
    }
    // Exact match first
    if (normFile === normTrigger) return true;
    // For bare names (no path separator), match at end of path
    return isBareName && normFile.endsWith(`/${normTrigger}`);
  });
}

/**
 * Check if dependent file is staged
 * Improved path matching to prevent false positives (Review #158)
 * Normalized for cross-platform reliability (Review #160)
 */
function isDependentStaged(stagedFiles, dependent) {
  const isBareName = !dependent.includes("/");
  // Normalize dependent: backslash→forward, lowercase (Review #160)
  const normDependent = dependent.replace(/\\/g, "/").toLowerCase();

  return stagedFiles.some((file) => {
    // Normalize file path for cross-platform matching (Review #160)
    const normFile = file.replace(/\\/g, "/").toLowerCase();
    // Exact match first
    if (normFile === normDependent) return true;
    // For bare names, match at end of path
    return isBareName && normFile.endsWith(`/${normDependent}`);
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

    // If rule has gitFilter, only fire when matching files have the specified change type
    // e.g., gitFilter: "AD" means only fire when files are Added or Deleted, not Modified
    if (rule.gitFilter) {
      const filteredFiles = getStagedFilesFiltered(rule.gitFilter);
      if (!matchesTrigger(filteredFiles, rule.trigger)) {
        logVerbose(
          `Rule skipped (gitFilter "${rule.gitFilter}" — no matching changes): ${rule.trigger}`
        );
        continue;
      }
    }

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

    // Hook-quality fix: In --trivial mode, skip enforcement if the trigger file
    // only has trivial changes (whitespace, comments, formatting, date bumps).
    // This prevents blocking commits for typo fixes and minor doc formatting.
    if (trivialMode) {
      const trigger = rule.trigger.replaceAll("\\", "/");
      const triggerFiles = stagedFiles
        .map((f) => f.replaceAll("\\", "/"))
        .filter(
          (f) =>
            f === trigger ||
            f.endsWith(`/${trigger}`) ||
            (trigger.endsWith("/") && f.startsWith(trigger))
        );
      const allTrivial = triggerFiles.length > 0 && triggerFiles.every(isTrivialChange);
      if (allTrivial) {
        logVerbose(`Rule skipped (trivial changes only): ${rule.trigger}`);
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
    const rawReason = process.env.SKIP_REASON;
    const reason = typeof rawReason === "string" ? rawReason.trim() : "";

    if (!reason) {
      log("❌ SKIP_REASON is required when overriding checks", colors.red);
      log(
        '   Usage: SKIP_REASON="your reason" SKIP_CROSS_DOC_CHECK=1 git commit ...',
        colors.yellow
      );
      log("   The audit trail is useless without a reason.", colors.red);
      process.exit(1);
    }

    if (/[\r\n]/.test(reason)) {
      log("❌ SKIP_REASON must be single-line (no CR/LF)", colors.red);
      process.exit(1);
    }

    if (
      [...reason].some((c) => {
        const code = c.charCodeAt(0);
        return code < 0x20 || code === 0x7f;
      })
    ) {
      log("❌ SKIP_REASON must not contain control characters", colors.red);
      process.exit(1);
    }

    if (reason.length > 500) {
      log("❌ SKIP_REASON is too long (max 500 chars)", colors.red);
      process.exit(1);
    }

    try {
      execFileSync(
        "node",
        ["scripts/log-override.js", "--quick", "--check=cross-doc", `--reason=${reason}`],
        { timeout: 3000, stdio: "pipe" }
      );
    } catch {
      /* non-blocking */
    }
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
