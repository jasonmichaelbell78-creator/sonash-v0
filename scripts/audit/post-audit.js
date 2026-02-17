#!/usr/bin/env node
/* global __dirname */
/**
 * Post-Audit Automation Script
 *
 * Runs automatically after any audit to handle TDMS intake pipeline.
 * Orchestrates the full post-audit workflow: intake, views, metrics, and index.
 *
 * Usage: node scripts/audit/post-audit.js <audit-output.jsonl> [--skip-commit]
 *
 * Steps:
 *   1. Validate the JSONL file exists and has valid JSON lines
 *   2. Run TDMS intake (scripts/debt/intake-audit.js)
 *   3. Run views regeneration (scripts/debt/generate-views.js)
 *   4. Run metrics regeneration (scripts/debt/generate-metrics.js)
 *   5. Run results index (scripts/audit/generate-results-index.js)
 *   6. Log summary of what was done
 *
 * Exit codes:
 *   0 = all steps passed
 *   1 = input error or any step failed
 *   2 = write error
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse command-line arguments
 * @returns {{ inputFile: string | null, skipCommit: boolean }}
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const skipCommit = args.includes("--skip-commit");
  const inputFile = args.find((arg) => !arg.startsWith("--")) || null;
  return { inputFile, skipCommit };
}

/**
 * Validate that the JSONL file exists and every line is valid JSON.
 * Returns an object with validation results.
 *
 * @param {string} filePath - absolute or relative path to the JSONL file
 * @returns {{ valid: boolean, lineCount: number, errors: string[] }}
 */
function validateJsonlFile(filePath) {
  const errors = [];

  if (!fs.existsSync(filePath)) {
    return { valid: false, lineCount: 0, errors: [`File not found: ${filePath}`] };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, lineCount: 0, errors: [`Failed to read file: ${msg}`] };
  }

  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    return { valid: false, lineCount: 0, errors: ["File is empty (no JSON lines found)"] };
  }

  for (let i = 0; i < lines.length; i++) {
    try {
      JSON.parse(lines[i]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Line ${i + 1}: ${msg}`);
    }
  }

  return { valid: errors.length === 0, lineCount: lines.length, errors };
}

/**
 * Run a pipeline step via execFileSync, capturing success/failure.
 * Uses execFileSync with args array to prevent command injection (SEC-001/S4721).
 *
 * @param {string} label - human-readable step name
 * @param {string} cmd - executable to run (e.g. process.execPath)
 * @param {string[]} args - arguments array
 * @returns {{ label: string, passed: boolean, error: string | null }}
 */
function runStep(label, cmd, args) {
  const displayCmd = [cmd, ...args].join(" ");
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  STEP: ${label}`);
  console.log(`  CMD:  ${displayCmd}`);
  console.log("=".repeat(60));

  try {
    execFileSync(cmd, args, { stdio: "inherit", cwd: REPO_ROOT });
    console.log(`  -> ${label}: PASSED`);
    return { label, passed: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  -> ${label}: FAILED`);
    console.error(`     Error: ${msg}`);
    return { label, passed: false, error: msg };
  }
}

/**
 * Print the final summary table showing which steps passed/failed.
 *
 * @param {Array<{ label: string, passed: boolean, error: string | null }>} results
 */
function printSummary(results) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("  POST-AUDIT SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    const icon = result.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${result.label}`);
    if (!result.passed && result.error) {
      console.log(`         ${result.error.split("\n")[0].substring(0, 120)}`);
    }
  }

  console.log("");
  console.log(`  Total: ${results.length} steps | Passed: ${passed} | Failed: ${failed}`);
  console.log("=".repeat(60));
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/**
 * Resolve and validate the input file path:
 *  - resolve symlinks via realpathSync
 *  - refuse symlinked inputs (lstatSync)
 *  - verify containment within REPO_ROOT
 *
 * Exits the process on any validation failure.
 * @param {string} inputFile - raw CLI argument
 * @returns {string} resolvedInput - validated absolute path
 */
function validateInputPath(inputFile) {
  const resolvedInput = path.resolve(inputFile);

  let repoReal;
  let inputReal;
  try {
    repoReal = fs.realpathSync(REPO_ROOT);
    inputReal = fs.realpathSync(resolvedInput);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: Failed to resolve input path: ${msg}`);
    process.exit(1);
  }

  try {
    const st = fs.lstatSync(resolvedInput);
    if (st.isSymbolicLink()) {
      console.error(`Error: Refusing to process symlinked input file: ${resolvedInput}`);
      process.exit(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: Unable to stat input file: ${msg}`);
    process.exit(1);
  }

  const rel = path.relative(repoReal, inputReal);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    console.error(`Error: Input file must be within the repository root.`);
    console.error(`  Input:     ${inputReal}`);
    console.error(`  Repo root: ${repoReal}`);
    process.exit(1);
  }

  return resolvedInput;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { inputFile, skipCommit } = parseArgs();

  if (!inputFile) {
    console.error("Error: Missing required argument: path to audit output JSONL file");
    console.error("");
    console.error("Usage: node scripts/audit/post-audit.js <audit-output.jsonl> [--skip-commit]");
    process.exit(1);
  }

  const resolvedInput = validateInputPath(inputFile);

  console.log("Post-Audit Pipeline");
  console.log("=".repeat(60));
  console.log(`  Input file:   ${resolvedInput}`);
  console.log(`  Repo root:    ${REPO_ROOT}`);
  console.log(`  Skip commit:  ${skipCommit}`);
  console.log("=".repeat(60));

  // --- Step 0: Validate JSONL ------------------------------------------------
  console.log("\nValidating JSONL input...");
  const validation = validateJsonlFile(resolvedInput);

  if (!validation.valid && validation.lineCount === 0) {
    // Fatal: file missing, unreadable, or empty — nothing to pipeline
    console.error("Validation failed:");
    for (const e of validation.errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  if (validation.errors.length > 0) {
    console.error(`Validation failed: ${validation.errors.length} invalid JSON line(s):`);
    for (const e of validation.errors.slice(0, 10)) {
      console.error(`  - ${e}`);
    }
    if (validation.errors.length > 10) {
      console.error(`  ... and ${validation.errors.length - 10} more`);
    }
    process.exit(1);
  }

  console.log(`Validated: ${validation.lineCount} JSON lines found.`);

  // --- Pipeline steps --------------------------------------------------------
  const results = [];

  results.push(
    // Step 1: TDMS intake
    runStep("TDMS Intake", process.execPath, [
      path.join(REPO_ROOT, "scripts/debt/intake-audit.js"),
      resolvedInput,
    ]),
    // Step 2: Regenerate views
    runStep("Generate Views", process.execPath, [
      path.join(REPO_ROOT, "scripts/debt/generate-views.js"),
    ]),
    // Step 3: Regenerate metrics
    runStep("Generate Metrics", process.execPath, [
      path.join(REPO_ROOT, "scripts/debt/generate-metrics.js"),
    ]),
    // Step 4: Regenerate results index
    runStep("Generate Results Index", process.execPath, [
      path.join(REPO_ROOT, "scripts/audit/generate-results-index.js"),
    ])
  );

  // --- Summary ---------------------------------------------------------------
  printSummary(results);

  if (skipCommit) {
    console.log("\n  --skip-commit flag set: skipping git operations.");
  }

  const anyFailed = results.some((r) => !r.passed);
  if (anyFailed) {
    console.log("\nSome steps failed. Review the output above for details.");
    process.exit(1);
  }

  console.log("\nAll post-audit steps completed successfully.");
  process.exit(0);
}

main();
