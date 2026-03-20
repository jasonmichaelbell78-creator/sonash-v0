#!/usr/bin/env node
/* global __dirname */
/**
 * Cyclomatic Complexity Pre-Push Check (with baseline support)
 *
 * Runs ESLint's built-in `complexity` rule (threshold: 15) on changed .js/.mjs
 * files relative to the merge base (origin/main). Violations are filtered
 * against a baseline in known-debt-baseline.json so that only NEW violations or
 * regressions (CC > baselined value) block the push.
 *
 * Usage: node scripts/check-cyclomatic-cc.js [--threshold=N] [--all] [--update-baseline]
 *
 * Options:
 *   --threshold=N       Set complexity threshold (default: 15)
 *   --all               Check all tracked .js/.mjs files, not just changed ones
 *   --update-baseline   Record current violations into known-debt-baseline.json
 *
 * Baseline mode:
 *   When a baseline exists (baselines["cyclomatic-complexity"] in
 *   known-debt-baseline.json), only regressions are reported. Known debt is
 *   suppressed. Use --update-baseline to snapshot the current state after
 *   fixing violations.
 *
 * Exit codes:
 *   0 = No new violations (or no regressions with baseline)
 *   1 = New violations or regressions found
 *   2 = Script error
 */

const { readFileSync, existsSync, statSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const { join, relative, isAbsolute, extname } = require("node:path");

const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Error sanitization — use shared lib, with minimal fallback
// Pattern: sanitize-error.js — never log raw error.message
// ---------------------------------------------------------------------------
let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/sanitize-error"));
} catch {
  /* eslint-disable no-control-regex -- intentional: strip control chars in fallback */
  sanitizeError = (err) =>
    String(err ?? "")
      .replaceAll(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 500);
  /* eslint-enable no-control-regex */
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

function getArgValue(name, defaultVal) {
  const prefix = `--${name}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  if (arg) return arg.slice(prefix.length);
  return defaultVal;
}

const THRESHOLD = Number.parseInt(getArgValue("threshold", "15"), 10);
const CHECK_ALL = args.includes("--all");
const UPDATE_BASELINE = args.includes("--update-baseline");
const BASELINE_PATH = join(ROOT, ".claude", "state", "known-debt-baseline.json");

if (Number.isNaN(THRESHOLD) || THRESHOLD < 1) {
  console.error("[check-cyc-cc] Invalid threshold value. Must be a positive integer.");
  process.exit(2);
}

// Load safe-fs for safe writes
let safeWriteFileSync;
try {
  ({ safeWriteFileSync } = require("./lib/safe-fs"));
} catch {
  safeWriteFileSync = () => {
    console.error("[check-cyc-cc] safe-fs unavailable — cannot write baseline");
    process.exit(2);
  };
}

// ---------------------------------------------------------------------------
// Git: resolve base ref and get changed files
// ---------------------------------------------------------------------------
function resolveBaseRef() {
  // Try upstream first, then origin/main, then origin/master
  try {
    execFileSync("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], {
      encoding: "utf-8",
      timeout: 5000,
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return "@{u}";
  } catch {
    // No upstream set
  }
  const candidates = ["origin/main", "origin/master", "main", "master"];
  for (const candidate of candidates) {
    try {
      execFileSync("git", ["rev-parse", "--verify", candidate], {
        encoding: "utf-8",
        timeout: 5000,
        cwd: ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      });
      return candidate;
    } catch {
      // Try next candidate
    }
  }
  return null;
}

function getChangedFiles() {
  if (CHECK_ALL) {
    try {
      const output = execFileSync("git", ["ls-files", "--cached", "*.js", "*.mjs"], {
        encoding: "utf-8",
        timeout: 10000,
        cwd: ROOT,
      });
      return output.trim().split("\n").filter(Boolean);
    } catch (err) {
      console.error("[check-cyc-cc] Failed to list files:", sanitizeError(err));
      return [];
    }
  }

  const baseRef = resolveBaseRef();
  if (!baseRef) {
    console.warn("[check-cyc-cc] Could not resolve base ref. Skipping.");
    return [];
  }

  // Get merge base for accurate diff
  try {
    const mergeBase = execFileSync("git", ["merge-base", "HEAD", baseRef], {
      encoding: "utf-8",
      timeout: 5000,
      cwd: ROOT,
    }).trim();

    const output = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=ACMR", `${mergeBase}..HEAD`],
      { encoding: "utf-8", timeout: 10000, cwd: ROOT }
    );
    return output.trim().split("\n").filter(Boolean);
  } catch {
    // Fallback: simple diff
    try {
      const output = execFileSync(
        "git",
        ["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}...HEAD`],
        { encoding: "utf-8", timeout: 10000, cwd: ROOT }
      );
      return output.trim().split("\n").filter(Boolean);
    } catch (err) {
      console.error("[check-cyc-cc] Git diff failed:", sanitizeError(err));
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// File filtering (mirrors pre-push hook exclusions)
// ---------------------------------------------------------------------------
const EXCLUDED_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /node_modules\//,
  /dist\//,
  /\.next\//,
  /tests\//,
  /eslint-plugin-sonash\//,
  /\.claude\/hooks\/backup\//,
  /\.claude\/state\//,
  /docs\/archive\//,
  /scripts\/reviews\/dist\//,
  /\.planning\//,
];

function filterJsFiles(files) {
  return files.filter((f) => {
    const ext = extname(f);
    if (ext !== ".js" && ext !== ".mjs") return false;
    return !EXCLUDED_PATTERNS.some((pat) => pat.test(f));
  });
}

// ---------------------------------------------------------------------------
// ESLint runner — invoke ESLint with complexity rule
// ---------------------------------------------------------------------------
const BATCH_SIZE = 30; // Avoid command-line length limits on Windows

/**
 * Extract a violation record from an ESLint complexity message.
 * Returns null if the message is not a complexity violation above threshold.
 */
function parseComplexityMessage(msg, filePath) {
  if (msg.ruleId !== "complexity") return null;

  const ccMatch = msg.message.match(/complexity of (\d+)/);
  const cc = ccMatch ? Number.parseInt(ccMatch[1], 10) : 0;
  if (cc <= THRESHOLD) return null;

  const nameMatch = msg.message.match(
    /(?:Function|Method|Arrow function|Generator function)\s+'([^']+)'/
  );
  const name = nameMatch ? nameMatch[1] : "(anonymous)";

  return { file: filePath, line: msg.line || 0, name, cc };
}

/**
 * Parse ESLint JSON results into violation records.
 */
function parseEslintJsonResults(results) {
  const violations = [];
  for (const fileResult of results) {
    if (!fileResult.messages || fileResult.messages.length === 0) continue;

    const filePath = relative(ROOT, fileResult.filePath).replaceAll("\\", "/");
    for (const msg of fileResult.messages) {
      const violation = parseComplexityMessage(msg, filePath);
      if (violation) violations.push(violation);
    }
  }
  return violations;
}

/**
 * Run ESLint on a batch of files and return violations.
 */
function runEslintBatch(filePaths) {
  const eslintArgs = [
    "--no-config-lookup",
    "--rule",
    `complexity: [2, ${THRESHOLD}]`,
    "--parser-options=ecmaVersion:2025",
    "--format=json",
    "--",
    ...filePaths.map((f) => f.replaceAll("\\", "/")),
  ];

  // Resolve the ESLint binary directly (avoids npx shell wrapper + Windows .cmd issues).
  let eslintBin;
  try {
    const eslintPkgDir = join(require.resolve("eslint", { paths: [ROOT] }), "..", "..");
    eslintBin = join(eslintPkgDir, "bin", "eslint.js");
  } catch (resolveErr) {
    console.error("[check-cyc-cc] ESLint not found:", sanitizeError(resolveErr));
    return { violations: null, error: "ESLint package not installed" };
  }

  let output = "";
  try {
    output = execFileSync(process.execPath, [eslintBin, ...eslintArgs], {
      encoding: "utf-8",
      timeout: 120000,
      cwd: ROOT,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    if (err && typeof err.stdout === "string" && err.stdout.length > 0) {
      output = err.stdout;
    } else {
      console.error("[check-cyc-cc] ESLint error:", sanitizeError(err));
      return { violations: null, error: sanitizeError(err) };
    }
  }

  try {
    const results = JSON.parse(output);
    return { violations: parseEslintJsonResults(results), error: null };
  } catch {
    return { violations: parseTextOutput(output), error: null };
  }
}

function runEslintComplexity(files) {
  if (files.length === 0) return { violations: [], error: null };

  const allViolations = [];
  const absolutePaths = files.map((f) => join(ROOT, f));

  // Batch to avoid command-line length limits
  for (let i = 0; i < absolutePaths.length; i += BATCH_SIZE) {
    const batch = absolutePaths.slice(i, i + BATCH_SIZE);
    const result = runEslintBatch(batch);
    if (result.error) {
      return { violations: null, error: result.error };
    }
    allViolations.push(...result.violations);
  }

  return { violations: allViolations, error: null };
}

/**
 * Fallback: parse ESLint text output for complexity violations.
 */
function parseTextOutput(output) {
  const violations = [];
  const lines = (output || "").split("\n");

  for (const line of lines) {
    // Match lines like: "path/file.js:10:5: ... complexity of N ..."
    const match = line.match(/^(.+?):(\d+):\d+:\s.*complexity of (\d+)/);
    if (match) {
      const filePath = relative(ROOT, match[1]).replaceAll("\\", "/");
      const lineNum = Number.parseInt(match[2], 10);
      const cc = Number.parseInt(match[3], 10);

      // Try to extract function name
      const nameMatch = line.match(
        /(?:Function|Method|Arrow function|Generator function)\s+'([^']+)'/
      );
      const name = nameMatch ? nameMatch[1] : "(anonymous)";

      if (cc > THRESHOLD) {
        violations.push({ file: filePath, line: lineNum, name, cc });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Baseline support
// ---------------------------------------------------------------------------
function readBaseline() {
  try {
    const data = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    return data?.baselines?.["cyclomatic-complexity"] || {};
  } catch {
    return {};
  }
}

function writeBaseline(violations) {
  let data;
  try {
    data = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  } catch {
    data = { schema_version: 1, updated: "", baselines: {} };
  }

  // Record per-file: { "file": { "maxCC": N, "functions": { "name": CC } } }
  // For simplicity, store max CC per file (same as cognitive CC baseline)
  const ccByFile = {};
  for (const v of violations) {
    if (!ccByFile[v.file] || v.cc > ccByFile[v.file]) {
      ccByFile[v.file] = v.cc;
    }
  }

  data.generated = new Date().toISOString();
  if (!data.baselines) data.baselines = {};
  data.baselines["cyclomatic-complexity"] = ccByFile;
  safeWriteFileSync(BASELINE_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(
    `[check-cyc-cc] Baseline updated: ${Object.keys(ccByFile).length} file(s) with ${violations.length} violation(s) recorded.`
  );
}

function filterByBaseline(violations) {
  const baseline = readBaseline();
  const baselineKeys = Object.keys(baseline);

  if (baselineKeys.length === 0) return violations;

  const filtered = violations.filter((v) => {
    const baselineCC = baseline[v.file];
    if (baselineCC === undefined) return true; // New file — always report
    return v.cc > baselineCC; // Only report if CC increased past baseline
  });

  const suppressed = violations.length - filtered.length;
  if (suppressed > 0) {
    console.log(`[check-cyc-cc] ${suppressed} known-debt violation(s) suppressed by baseline.`);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------
function printReport(violations, totalFiles) {
  console.log();

  if (violations.length > 0) {
    console.log(
      `[check-cyc-cc] ${violations.length} function(s) exceed cyclomatic complexity threshold of ${THRESHOLD}:`
    );
    console.log();
    for (const v of violations) {
      console.log(`  FAIL  ${v.file}:${v.line}  ${v.name}  CC=${v.cc}  (threshold: ${THRESHOLD})`);
    }
    console.log();
    console.log(`[check-cyc-cc] Tip: Extract helper functions to reduce branching.`);
  } else {
    console.log(`[check-cyc-cc] All functions within cyclomatic complexity threshold.`);
  }

  console.log(
    `[check-cyc-cc] Summary: ${totalFiles} files checked, ${violations.length} violations.`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log(`[check-cyc-cc] Cyclomatic complexity check (threshold: ${THRESHOLD})`);
  console.log();

  const allFiles = getChangedFiles();
  const jsFiles = filterJsFiles(allFiles);

  if (jsFiles.length === 0) {
    console.log("[check-cyc-cc] No changed .js/.mjs files to check.");
    process.exit(0);
  }

  if (!CHECK_ALL && jsFiles.length > 50) {
    console.error(`[check-cyc-cc] Too many files (${jsFiles.length} > 50). Split the push.`);
    process.exit(1);
  }

  console.log(`[check-cyc-cc] Checking ${jsFiles.length} file(s)...`);

  const { violations, error } = runEslintComplexity(jsFiles);

  if (error) {
    console.error(`[check-cyc-cc] Fatal ESLint error: ${error}`);
    process.exit(2);
  }

  if (UPDATE_BASELINE) {
    writeBaseline(violations);
    printReport(violations, jsFiles.length);
    process.exit(0);
  }

  const reportedViolations = filterByBaseline(violations);
  printReport(reportedViolations, jsFiles.length);
  process.exit(reportedViolations.length > 0 ? 1 : 0);
}

main();
