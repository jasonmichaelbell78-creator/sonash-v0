#!/usr/bin/env node
/**
 * Phase Completion Checklist - AUTOMATED GATE
 *
 * Run this BEFORE marking any phase/milestone complete.
 * This script enforces the mandatory deliverable audit.
 *
 * Usage:
 *   node scripts/phase-complete-check.js                    # Interactive mode
 *   node scripts/phase-complete-check.js --auto             # Fully automated (CI)
 *   node scripts/phase-complete-check.js --plan <path>      # Check specific plan
 *
 * Exit codes:
 *   0 = All checks passed, safe to mark complete
 *   1 = Checks failed, do NOT mark complete
 */

import { execSync } from "node:child_process";
import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

// Parse command line arguments
const args = process.argv.slice(2);
const isAutoMode = args.includes("--auto");
const planIndex = args.indexOf("--plan");

// Validate --plan flag has a valid value
let rawPlanPath = null;
if (planIndex !== -1) {
  const nextArg = args[planIndex + 1];
  // Check: value exists, not another flag, not empty
  if (!nextArg || nextArg.startsWith("--") || nextArg.trim() === "") {
    console.error("Error: --plan requires a path argument");
    console.error("Usage: node scripts/phase-complete-check.js --plan <path>");
    process.exit(1);
  }
  rawPlanPath = nextArg;
}

// Security: Validate --plan path is within project root
const projectRoot = process.cwd();
let planPath = null;
const planWasProvided = Boolean(rawPlanPath); // Track if --plan explicitly requested
if (rawPlanPath) {
  // Reject absolute paths
  if (path.isAbsolute(rawPlanPath)) {
    console.error("Error: --plan path must be relative to project root");
    process.exit(1);
  }
  const resolvedPlan = path.resolve(projectRoot, rawPlanPath);
  const rel = path.relative(projectRoot, resolvedPlan);
  // Reject paths that escape project root or reference root itself
  // Use regex for traversal detection (Review #53)
  if (rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
    console.error("Error: --plan path must be a file within project root");
    process.exit(1);
  }
  planPath = resolvedPlan;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Close readline interface to prevent script hanging
 */
function closeRl() {
  try {
    rl.close();
  } catch {
    // ignore - already closed
  }
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().startsWith("y"));
    });
  });
}

/**
 * Extract deliverables from a plan document
 * Looks for patterns like:
 * - [x] or - [ ] followed by text (checkboxes)
 * - Files mentioned in tables with Status columns
 * - Acceptance Criteria sections
 */
function extractDeliverablesFromPlan(planContent) {
  const deliverables = [];

  // Extract file paths mentioned (e.g., path/to/file.md or path\to\file.md on Windows)
  // Note: Includes backslashes for Windows path support
  const filePathRegex = /(?:^|\s)([a-zA-Z0-9_\-./\\]+\.(md|js|ts|tsx|json|yml|yaml|sh))/gm;
  const matches = planContent.match(filePathRegex) || [];

  for (const match of matches) {
    // Normalize path: trim whitespace, convert backslashes to forward slashes
    const filePath = match.trim().replace(/\\/g, "/");
    // Skip obvious non-deliverables
    if (
      !filePath.includes("node_modules") &&
      !filePath.includes("example") &&
      !filePath.startsWith("http") &&
      filePath.length > 3
    ) {
      deliverables.push({
        type: "file",
        path: filePath,
        required: true,
      });
    }
  }

  // Deduplicate
  const seen = new Set();
  return deliverables.filter((d) => {
    if (seen.has(d.path)) return false;
    seen.add(d.path);
    return true;
  });
}

/**
 * Check if relative path indicates path traversal
 * @param {string} rel - Relative path
 * @returns {boolean} True if path traversal detected
 */
function isPathTraversal(rel) {
  return rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel);
}

/**
 * Check archive directory for a file
 * @param {object} deliverable - Deliverable object with path
 * @param {string} projectRoot - Project root directory
 * @returns {{found: boolean, reason?: string}} Archive check result
 */
function checkArchiveForFile(deliverable, projectRoot) {
  const archiveRoot = path.join(projectRoot, "docs/archive");
  const isWithinArchive = (candidate) => {
    const resolved = path.resolve(candidate);
    const rel = path.relative(archiveRoot, resolved);
    return rel && !isPathTraversal(rel);
  };

  // Try exact relative path first
  const archivePathExact = path.join(archiveRoot, deliverable.path);
  try {
    if (isWithinArchive(archivePathExact)) {
      fs.statSync(archivePathExact);
      return { found: true, reason: "Archived" };
    }
  } catch {
    // Continue to basename fallback
  }

  // Fall back to basename-only check
  const archivePathBasename = path.join(archiveRoot, path.basename(deliverable.path));
  try {
    if (isWithinArchive(archivePathBasename)) {
      fs.statSync(archivePathBasename);
      return { found: true, reason: "Archived" };
    }
  } catch {
    // File not found
  }
  return { found: false };
}

/**
 * Normalize a deliverable path
 * @param {object} d - Deliverable object
 * @returns {object} Deliverable with normalized path
 */
function normalizeDeliverablePath(d) {
  return {
    ...d,
    path: d.path
      .replace(/\\/g, "/")
      .trim()
      .replace(/^\.\/+/, "")
      .replace(/^`(.+)`$/, "$1")
      .replace(/^"(.+)"$/, "$1")
      .replace(/^'(.+)'$/, "$1")
      .replace(/[)`"'.,;:]+$/g, ""),
  };
}

/**
 * Verify deliverable exists and has content
 * Security: Prevents path traversal by ensuring resolved path stays within projectRoot
 */
function verifyDeliverable(deliverable, projectRoot) {
  // Security: Reject absolute paths
  if (path.isAbsolute(deliverable.path)) {
    return { exists: false, valid: false, reason: "Invalid path (absolute paths not allowed)" };
  }

  const resolvedPath = path.resolve(projectRoot, deliverable.path);
  const rel = path.relative(projectRoot, resolvedPath);
  if (isPathTraversal(rel)) {
    return { exists: false, valid: false, reason: "Invalid path (outside project root)" };
  }

  let stat;
  try {
    stat = fs.statSync(resolvedPath);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Check if path already points to docs/archive
      const normalizedPath = deliverable.path.replace(/\\/g, "/");
      if (
        normalizedPath.startsWith("docs/archive/") ||
        normalizedPath.startsWith("./docs/archive/")
      ) {
        return { exists: false, valid: false, reason: "File not found (already in archive path)" };
      }
      // Check archive for file
      const archiveResult = checkArchiveForFile(deliverable, projectRoot);
      if (archiveResult.found) {
        return { exists: true, valid: true, reason: archiveResult.reason };
      }
      return { exists: false, valid: false, reason: "File not found" };
    }
    return { exists: false, valid: false, reason: "Error checking file status" };
  }

  try {
    if (stat.isFile()) {
      const content = fs.readFileSync(resolvedPath, "utf-8");
      if (content.trim().length < 10) {
        return { exists: true, valid: false, reason: "File exists but appears empty" };
      }
      return { exists: true, valid: true };
    }
    if (stat.isDirectory()) {
      const files = fs.readdirSync(resolvedPath);
      return files.length === 0
        ? { exists: true, valid: false, reason: "Directory exists but is empty" }
        : { exists: true, valid: true, reason: "Directory exists" };
    }
  } catch {
    return { exists: true, valid: false, reason: "File exists but could not be read" };
  }

  return { exists: false, valid: false, reason: "Unknown file type" };
}

/**
 * Create result for missing or unreadable plan file
 * @param {boolean} planWasProvided - Whether --plan was explicitly specified
 * @param {boolean} isAutoMode - Whether running in CI/auto mode
 * @param {string} warningMessage - Warning message to include
 * @returns {{passed: boolean, verified: number, missing: Array, warnings: Array}}
 */
function createPlanErrorResult(planWasProvided, isAutoMode, warningMessage) {
  const isFatal = planWasProvided || isAutoMode;
  return {
    passed: !isFatal,
    verified: 0,
    missing: [],
    warnings: [warningMessage],
  };
}

/**
 * Process a single deliverable verification result
 * @param {object} verifyResult - Result from verifyDeliverable
 * @param {object} deliverable - Deliverable being checked
 * @param {object} results - Results object to update
 */
function processDeliverableResult(verifyResult, deliverable, results) {
  if (verifyResult.exists && verifyResult.valid) {
    results.verified++;
  } else if (!verifyResult.exists) {
    results.missing.push(deliverable.path);
    if (deliverable.required) results.passed = false;
  } else {
    results.warnings.push(`${deliverable.path}: ${verifyResult.reason}`);
    if (deliverable.required) results.passed = false;
  }
}

/**
 * Run automated deliverable audit
 * @param {string|null} planPath - Path to plan file
 * @param {string} projectRoot - Project root directory
 * @param {boolean} isAutoMode - Whether running in CI/auto mode
 * @param {boolean} planWasProvided - Whether --plan was explicitly specified
 */
function runAutomatedDeliverableAudit(planPath, projectRoot, isAutoMode, planWasProvided) {
  console.log("");
  console.log("━━━ AUTOMATED DELIVERABLE AUDIT ━━━");
  console.log("");

  if (!planPath || !fs.existsSync(planPath)) {
    console.log("  ⚠️  No plan file specified or file not found");
    console.log("     Use --plan <path> to specify a plan document");
    return createPlanErrorResult(planWasProvided, isAutoMode, "Plan file not found");
  }

  // Log relative path to avoid exposing filesystem info in CI logs
  // Use regex for traversal detection (Review #53)
  const displayPlanPath = (() => {
    try {
      const rel = path.relative(projectRoot, planPath).replace(/\\/g, "/");
      return rel && !/^\.\.(?:[/\\]|$)/.test(rel) ? rel : path.basename(planPath);
    } catch {
      return path.basename(planPath);
    }
  })();
  console.log(`  📄 Analyzing: ${displayPlanPath}`);

  // Read plan file with error handling
  let planContent;
  try {
    planContent = fs.readFileSync(planPath, "utf-8");
  } catch (err) {
    console.log(`  ⚠️  Could not read plan file: ${err.code || "unknown error"}`);
    return createPlanErrorResult(planWasProvided, isAutoMode, "Unable to read plan file");
  }
  const deliverables = extractDeliverablesFromPlan(planContent);

  console.log(`  📋 Found ${deliverables.length} potential deliverables`);
  console.log("");

  const results = {
    passed: true,
    verified: 0,
    missing: [],
    warnings: [],
  };

  // Normalize paths: handle quotes, backticks, ./ prefix, trailing punctuation
  const normalizedDeliverables = deliverables
    .map(normalizeDeliverablePath)
    .filter((d) => d.path.length > 0)
    .filter((d) => !d.path.split("/").includes("..")); // Reject path traversal

  const MAX_CHECKS = 20;
  const wasTruncated = normalizedDeliverables.length > MAX_CHECKS;

  // In auto mode, check all deliverables; in interactive mode, limit to avoid noise
  const relevantDeliverables = isAutoMode
    ? normalizedDeliverables
    : normalizedDeliverables.slice(0, MAX_CHECKS);

  // In auto mode, log when checking many files (ensures CI knows we're thorough)
  if (isAutoMode && wasTruncated) {
    console.log(`  ⚠️  Plan references ${normalizedDeliverables.length} deliverables`);
    console.log("     Checking all in --auto mode (no truncation)");
  }

  for (const deliverable of relevantDeliverables) {
    const result = verifyDeliverable(deliverable, projectRoot);
    processDeliverableResult(result, deliverable, results);
  }

  console.log(`  ✅ Verified: ${results.verified} files exist`);

  if (results.missing.length > 0) {
    console.log(`  ⚠️  Missing (${results.missing.length}):`);
    results.missing.slice(0, 5).forEach((f) => console.log(`     - ${f}`));
    if (results.missing.length > 5) {
      console.log(`     ... and ${results.missing.length - 5} more`);
    }
  }

  if (results.warnings.length > 0) {
    console.log(`  ⚠️  Warnings (${results.warnings.length}):`);
    results.warnings.slice(0, 3).forEach((w) => console.log(`     - ${w}`));
  }

  console.log("");
  return results;
}

async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🔍 PHASE COMPLETION CHECKLIST - AUTOMATED GATE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("This checklist MUST pass before marking any phase complete.");
  console.log("");

  let allPassed = true;
  const failures = [];

  // 1. Automated checks
  console.log("━━━ AUTOMATED CHECKS ━━━");
  console.log("");

  // Helper to sanitize paths and control characters in output
  const sanitizeOutput = (output) => {
    if (!output) return "";
    return (
      String(output)
        // Normalize Windows CRLF to LF everywhere
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "")
        // Strip ANSI escape sequences (colors/cursor movement) to prevent terminal injection in CI logs
        // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping ANSI escape sequences for CI safety
        .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "") // eslint-disable-line no-control-regex
        // Strip OSC escape sequences (Operating System Commands like title changes)
        // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping OSC escape sequences for CI safety
        .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, "") // eslint-disable-line no-control-regex
        // Strip control chars while preserving safe whitespace (\t\n)
        // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex
        .replace(/\/home\/[^/\s]+/g, "[HOME]")
        .replace(/\/Users\/[^/\s]+/g, "[HOME]")
        // Handle any Windows drive letter, case-insensitive
        .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
    );
  };

  // Lint check - capture and sanitize output to avoid exposing paths
  // Note: Using stdio: 'pipe' for cross-platform compatibility (avoids shell-dependent 2>&1)
  // Using maxBuffer: 10MB to prevent buffer overflow on large output
  console.log("▶ Running ESLint...");
  try {
    const lintOutput = execSync("npm run lint", {
      encoding: "utf-8",
      stdio: "pipe",
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log(sanitizeOutput(lintOutput));
    console.log("  ✅ ESLint passed");
  } catch (err) {
    // ESLint failed - show sanitized output (err.stdout/stderr captured by stdio: 'pipe')
    if (err.stdout) console.log(sanitizeOutput(err.stdout));
    if (err.stderr) console.error(sanitizeOutput(err.stderr));
    console.log("  ❌ ESLint has errors");
    failures.push("ESLint errors must be fixed");
    allPassed = false;
  }

  // Test check - capture and sanitize output
  // Note: Using stdio: 'pipe' for cross-platform compatibility
  // Using maxBuffer: 10MB to prevent buffer overflow on large output
  console.log("▶ Running tests...");
  try {
    const testOutput = execSync("npm test", {
      encoding: "utf-8",
      stdio: "pipe",
      maxBuffer: 10 * 1024 * 1024,
    });
    // Only show summary, not full output (too verbose)
    // Use case-insensitive matching to catch PASS/FAIL/Tests: etc.
    const lines = testOutput.split("\n");
    const summaryLines = lines.filter((l) => {
      const lower = l.toLowerCase();
      return (
        lower.includes("tests") ||
        lower.includes("pass") ||
        lower.includes("fail") ||
        lower.includes("skip")
      );
    });
    if (summaryLines.length > 0) {
      console.log(sanitizeOutput(summaryLines.join("\n")));
    }
    console.log("  ✅ Tests passed");
  } catch (err) {
    // Tests failed - show sanitized error output (err.stdout/stderr captured by stdio: 'pipe')
    if (err.stdout) {
      const sanitized = sanitizeOutput(err.stdout);
      // Show last 20 lines to see failure info
      const lines = sanitized.split("\n").slice(-20);
      console.log(lines.join("\n"));
    }
    if (err.stderr) console.error(sanitizeOutput(err.stderr));
    console.log("  ❌ Tests failed");
    failures.push("Tests must pass");
    allPassed = false;
  }

  console.log("");

  // 2. Automated deliverable audit (if plan specified)
  const auditResult = runAutomatedDeliverableAudit(
    planPath,
    projectRoot,
    isAutoMode,
    planWasProvided
  );

  if (!auditResult.passed) {
    failures.push("Automated deliverable audit found missing files");
    allPassed = false;
  }

  // 3. Manual verification questions (skip in auto mode)
  if (isAutoMode) {
    console.log("━━━ AUTO MODE - SKIPPING MANUAL QUESTIONS ━━━");
    console.log("");
    console.log("  ⚠️  Running in --auto mode");
    console.log("     Manual verification questions skipped");
    console.log("     Only automated checks performed");
    console.log("");
    closeRl();
  } else {
    console.log("━━━ DELIVERABLE AUDIT (Manual Verification) ━━━");
    console.log("");
    console.log("Answer honestly - this protects quality:");
    console.log("");

    const questions = [
      {
        q: "Have you reviewed the original deliverables list for this phase? (y/n): ",
        fail: "Must review original deliverables before marking complete",
      },
      {
        q: "Does EVERY deliverable exist and work correctly? (y/n): ",
        fail: "All deliverables must exist and function",
      },
      {
        q: "Have you tested each script/feature with real data? (y/n): ",
        fail: "All deliverables must be tested",
      },
      {
        q: "Are acceptance criteria from the plan ALL met? (y/n): ",
        fail: "All acceptance criteria must be met",
      },
      {
        q: "Have you documented what was accomplished? (y/n): ",
        fail: "Work must be documented before completion",
      },
      {
        q: "Did you run npm run lint AND npm test before EVERY commit? (y/n): ",
        fail: "Lint and test must run before every commit",
      },
      {
        q: "Did you complete the Agent/Skill/MCP/Hook/Script audit (per /session-end)? (y/n): ",
        fail: "Agent/Skill/MCP audit must be completed - run /session-end",
      },
    ];

    for (const { q, fail } of questions) {
      const passed = await ask(q);
      if (!passed) {
        console.log(`  ❌ ${fail}`);
        failures.push(fail);
        allPassed = false;
      } else {
        console.log("  ✅ Confirmed");
      }
    }
    closeRl();
  } // end of !isAutoMode block

  console.log("");
  console.log("━━━ RESULT ━━━");
  console.log("");

  if (allPassed) {
    console.log("✅ ALL CHECKS PASSED");
    console.log("");
    console.log("You may now mark this phase as COMPLETE.");
    console.log("");
    process.exit(0);
  } else {
    console.log("❌ CHECKS FAILED - DO NOT MARK COMPLETE");
    console.log("");
    console.log("Issues to resolve:");
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    console.log("");
    console.log("Fix these issues, then run this check again.");
    console.log("");
    process.exit(1);
  }
}

// Export functions for testing
export { extractDeliverablesFromPlan, verifyDeliverable, runAutomatedDeliverableAudit };

// Only run main() when executed directly (not when imported for testing)
// Use pathToFileURL for cross-platform compatibility (Windows paths use backslashes)
// Wrap in try-catch for robust handling of edge cases (relative paths, symlinks, etc.)
let isMainModule = false;
try {
  isMainModule =
    !!process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
} catch {
  isMainModule = false;
}

if (isMainModule) {
  main().catch((err) => {
    // Sanitize error output - avoid exposing file paths, stack traces, and control characters
    // Use .split('\n')[0] to ensure only first line (no stack trace in String(err))
    // Strip control chars (ANSI escapes) to prevent log/terminal injection in CI
    const safeMessage = String(err?.message ?? err ?? "Unknown error")
      .split("\n")[0]
      .replace(/\r$/, "") // Strip trailing CR from Windows CRLF line endings
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
      .replace(/\/home\/[^/\s]+/g, "[HOME]")
      .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      // Handle any Windows drive letter, case-insensitive
      .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
    console.error("Script error:", safeMessage);
    closeRl();
    process.exit(1);
  });
}
