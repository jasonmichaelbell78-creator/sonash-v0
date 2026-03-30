#!/usr/bin/env node
/**
 * Propagation-Audit Pre-Commit Gate (Registry-Based)
 *
 * Purpose: When a staged diff touches a security/safety pattern from the
 * canonical registry (scripts/config/propagation-patterns.json), scans files
 * matching the pattern's searchGlob for propagation misses. Replaces the
 * former hardcoded-pattern + same-directory-sibling approach with diff-based
 * triggering and glob-based scan targets.
 *
 * Detection flow:
 *   1. Parse `git diff --cached -U0` to extract added lines
 *   2. Match added lines against registry patterns (matchPatterns)
 *   3. For each triggered pattern, find files via `git ls-files` + searchGlob
 *   4. Run findMisses on those files (antiPattern or patternAbsence mode)
 *   5. Suppress baselined violations via known-propagation-baseline.json
 *   6. Respect per-pattern severity: BLOCK -> exit 2, WARN -> stderr + exit 0
 *
 * Usage:
 *   node scripts/check-propagation-staged.js                # Normal mode
 *   node scripts/check-propagation-staged.js --verbose      # Show all matches
 *   node scripts/check-propagation-staged.js --blocking     # Exit 1 on misses (legacy compat)
 *   node scripts/check-propagation-staged.js --json         # Machine-readable output
 *   node scripts/check-propagation-staged.js --staged-files "a.js b.js"
 *                                                           # Override file lists (for testing)
 *
 * Environment:
 *   SKIP_PROPAGATION_STAGED=1   Skip entirely (exit 0)
 *
 * Exit codes:
 *   0 = no propagation misses (or WARN-only findings)
 *   1 = propagation misses found (--blocking legacy mode)
 *   2 = BLOCK-severity miss found, or script error
 *
 * Version History:
 * | Version | Date       | Changes                                        |
 * |---------|------------|------------------------------------------------|
 * | 1.0     | 2026-03-18 | Initial implementation (retro)                 |
 * | 2.0     | 2026-03-30 | Registry-based refactor (Steps 3-5, 3-Layer)   |
 */

const { execFileSync } = require("node:child_process");
const { readdirSync, readFileSync, lstatSync } = require("node:fs");
const path = require("node:path");
const { minimatch } = require("minimatch");

// ---------------------------------------------------------------------------
// Sanitize error helper (CLAUDE.md Section 5: sanitizeError pattern)
// ---------------------------------------------------------------------------
let sanitizeError;
try {
  const mod = require("./lib/sanitize-error");
  sanitizeError = typeof mod.sanitizeError === "function" ? mod.sanitizeError : mod;
} catch {
  sanitizeError = (err) => {
    const name = err instanceof Error ? err.name : "Error";
    let code = null;
    try {
      code = err && typeof err === "object" && "code" in err ? String(err.code) : null;
    } catch {
      code = null;
    }
    return code ? `${name} (${code})` : name;
  };
}

// ---------------------------------------------------------------------------
// Shared registry loader
// ---------------------------------------------------------------------------
const {
  loadRegistry,
  matchPatterns,
  findMisses,
  loadBaseline,
  isBaselined,
  PERF_BUDGET_MS,
} = require("./lib/load-propagation-registry");

// ---------------------------------------------------------------------------
// Skip check (Step 4)
// ---------------------------------------------------------------------------
if (process.env.SKIP_PROPAGATION_STAGED) {
  if (require.main === module) {
    console.log("[propagation-staged] Skipped via SKIP_PROPAGATION_STAGED env var.");
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const BLOCKING = args.includes("--blocking");
const JSON_OUTPUT = args.includes("--json");

function getArgValue(name) {
  const prefix = `--${name}=`;
  const idx = args.findIndex((a) => a.startsWith(prefix));
  if (idx !== -1) return args[idx].slice(prefix.length);
  // Also check next-arg form: --name "value"
  const flagIdx = args.indexOf(`--${name}`);
  if (flagIdx !== -1 && flagIdx + 1 < args.length && !args[flagIdx + 1].startsWith("--")) {
    return args[flagIdx + 1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Load registry patterns as SECURITY_PATTERNS (backward-compat export)
// ---------------------------------------------------------------------------
const _registry = loadRegistry({ verbose: VERBOSE });
const SECURITY_PATTERNS = _registry.map((entry) => ({
  id: entry.id,
  label: entry.description,
  regex: (() => {
    try {
      return new RegExp(entry.pattern);
    } catch {
      return /(?!)/; // Never-match fallback
    }
  })(),
  severity: entry.severity,
  searchGlob: entry.searchGlob,
}));

// File extensions to check
const JS_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".tsx"]);

// Directories to skip
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "dist-tests",
  ".next",
  "out",
  "archive",
  "consolidation-output",
]);

// ---------------------------------------------------------------------------
// File listing helpers
// ---------------------------------------------------------------------------

/**
 * Get staged files from git, or from CLI override.
 * Returns array of repo-relative paths (forward slashes).
 */
function getStagedFiles() {
  const override = getArgValue("staged-files");
  if (override !== null) {
    return override
      .split(/\s+/)
      .filter(Boolean)
      .map((f) => f.replaceAll("\\", "/"))
      .filter((f) => {
        // Block path traversal in CLI-provided paths
        const rel = path.relative(".", f);
        return !/^\.\.(?:[\\/]|$)/.test(rel) && !path.isAbsolute(f);
      });
  }

  try {
    const output = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], {
      encoding: "utf8",
      timeout: 10000,
    });
    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((f) => f.replaceAll("\\", "/"));
  } catch (err) {
    if (VERBOSE) console.warn(`[propagation-staged] git diff failed: ${sanitizeError(err)}`);
    return [];
  }
}

/**
 * Get added lines from staged diff for pattern matching.
 * Returns array of added lines (with leading + stripped).
 * When --staged-files override is used, reads file contents instead.
 *
 * @param {string[]} stagedFiles - Repo-relative staged file paths
 * @param {string} baseDir - Project root
 * @returns {string[]} Array of added/content lines
 */
function getDiffAddedLines(stagedFiles, baseDir) {
  const override = getArgValue("staged-files");
  if (override !== null) {
    // In test/override mode: read full file contents as "added lines"
    const lines = [];
    for (const f of stagedFiles) {
      const absPath = path.resolve(baseDir, f);
      try {
        // CLAUDE.md Section 5: lstatSync symlink guard
        const stat = lstatSync(absPath);
        if (stat.isSymbolicLink()) continue;

        const content = readFileSync(absPath, "utf8");
        for (const line of content.split("\n")) {
          lines.push(line);
        }
      } catch (err) {
        if (VERBOSE) console.warn(`[propagation-staged] Cannot read ${f}: ${sanitizeError(err)}`);
      }
    }
    return lines;
  }

  try {
    const output = execFileSync("git", ["diff", "--cached", "-U0"], {
      encoding: "utf8",
      timeout: 10000,
    });
    // Extract only added lines (start with +, but not +++ header)
    return output
      .split("\n")
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
      .map((line) => line.slice(1)); // Strip leading +
  } catch (err) {
    if (VERBOSE) console.warn(`[propagation-staged] git diff -U0 failed: ${sanitizeError(err)}`);
    return [];
  }
}

/**
 * Find tracked files matching a set of globs using git ls-files.
 * Respects SKIP_DIRS exclusions and symlink guards.
 *
 * @param {string[]} globs - Array of glob patterns from registry searchGlob
 * @param {string} baseDir - Project root
 * @returns {string[]} Array of absolute file paths
 */
function findFilesForGlobs(globs, baseDir) {
  let allTracked;
  try {
    const output = execFileSync("git", ["ls-files", "--cached"], {
      encoding: "utf8",
      cwd: baseDir,
      timeout: 10000,
    });
    allTracked = output.trim().split("\n").filter(Boolean);
  } catch (err) {
    if (VERBOSE) console.warn(`[propagation-staged] git ls-files failed: ${sanitizeError(err)}`);
    return [];
  }

  const matched = [];
  for (const relFile of allTracked) {
    const normalized = relFile.replaceAll("\\", "/");

    // Skip excluded directories
    const parts = normalized.split("/");
    if (parts.some((p) => SKIP_DIRS.has(p))) continue;

    // Only JS/TS files
    if (!JS_EXTENSIONS.has(path.extname(normalized))) continue;

    // Check if file matches any of the globs
    let matchesGlob = false;
    for (const glob of globs) {
      if (minimatch(normalized, glob, { dot: true })) {
        matchesGlob = true;
        break;
      }
    }
    if (!matchesGlob) continue;

    const absPath = path.resolve(baseDir, normalized);

    // CLAUDE.md Section 5: symlink guard
    try {
      const stat = lstatSync(absPath);
      if (stat.isSymbolicLink()) continue;
    } catch {
      continue;
    }

    // CLAUDE.md Section 5: path traversal check
    const rel = path.relative(baseDir, absPath);
    if (/^\.\.(?:[\\/]|$)/.test(rel)) continue;

    matched.push(absPath);
  }

  return matched;
}

/**
 * List sibling files in the same directory as a given file.
 * Only returns JS/TS files. Skips symlinks and skip directories.
 * @param {string} filePath - Absolute or relative path
 * @param {string} baseDir - Base directory for resolution
 * @returns {string[]} Array of repo-relative sibling paths (forward slashes)
 */
function getSiblingFiles(filePath, baseDir) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
  const dir = path.dirname(absPath);

  // CLAUDE.md Section 5: wrap file reads in try/catch
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (err) {
    if (VERBOSE) console.warn(`[propagation-staged] Cannot read dir: ${sanitizeError(err)}`);
    return [];
  }

  const siblings = [];
  for (const entry of entries) {
    const ext = path.extname(entry);
    if (!JS_EXTENSIONS.has(ext)) continue;

    const entryPath = path.join(dir, entry);

    // Skip the file itself
    if (path.resolve(entryPath) === path.resolve(absPath)) continue;

    // Skip symlinks (CLAUDE.md Section 5: symlink guards)
    try {
      const stat = lstatSync(entryPath);
      if (stat.isSymbolicLink()) continue;
    } catch {
      continue;
    }

    // Convert to repo-relative path
    const rel = path.relative(baseDir, entryPath).replaceAll("\\", "/");

    // Skip files in excluded directories
    const parts = rel.split("/");
    if (parts.some((p) => SKIP_DIRS.has(p))) continue;

    siblings.push(rel);
  }

  return siblings;
}

/**
 * Check if a file contains a given pattern.
 * @param {string} filePath - Absolute path to file
 * @param {RegExp} regex - Pattern to search for
 * @returns {boolean}
 */
function fileContainsPattern(filePath, regex) {
  try {
    // CLAUDE.md Section 5: lstatSync symlink guard
    const stat = lstatSync(filePath);
    if (stat.isSymbolicLink()) return false;

    const content = readFileSync(filePath, "utf8");
    // Reset regex lastIndex in case it has global flag
    regex.lastIndex = 0;
    return regex.test(content);
  } catch (err) {
    if (VERBOSE) console.warn(`[propagation-staged] Cannot read file: ${sanitizeError(err)}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main analysis (registry-based)
// ---------------------------------------------------------------------------

/**
 * Run the propagation check using the canonical registry.
 *
 * @param {object} options - Override options (for testing)
 * @param {string} [options.baseDir] - Project root directory
 * @param {string[]} [options.stagedFiles] - Override staged files list
 * @returns {{
 *   warnings: Array<{pattern: string, patternId: string, stagedFile: string, siblingFile: string, severity: string}>,
 *   stagedCount: number,
 *   triggered: string[],
 *   misses: Array<{patternId: string, file: string, severity: string}>,
 *   blocked: boolean,
 *   duration_ms: number
 * }}
 */
function runCheck(options = {}) {
  const startTime = Date.now();

  let baseDir = options.baseDir;
  if (!baseDir) {
    try {
      baseDir = execFileSync("git", ["rev-parse", "--show-toplevel"], {
        encoding: "utf8",
        timeout: 5000,
      }).trim();
    } catch {
      baseDir = process.cwd();
    }
  }

  const stagedFilesRaw = Array.isArray(options.stagedFiles)
    ? options.stagedFiles
    : getStagedFiles();
  const stagedFiles = stagedFilesRaw
    .map((f) => String(f).replaceAll("\\", "/"))
    .filter((f) => {
      if (path.isAbsolute(f)) return false;
      const resolved = path.resolve(baseDir, f);
      const rel = path.relative(baseDir, resolved);
      if (/^\.\.(?:[\\/]|$)/.test(rel)) return false;
      // Reject symlinks to prevent reading outside the repo via link targets
      try {
        if (lstatSync(resolved).isSymbolicLink()) return false;
      } catch {
        return false;
      }
      return true;
    });

  // Filter to JS/TS files only
  const jsStaged = stagedFiles.filter((f) => JS_EXTENSIONS.has(path.extname(f)));

  const emptyResult = {
    warnings: [],
    stagedCount: 0,
    triggered: [],
    misses: [],
    blocked: false,
    duration_ms: Date.now() - startTime,
  };

  if (jsStaged.length === 0) {
    if (VERBOSE) console.log("[propagation-staged] No JS/TS files staged.");
    return emptyResult;
  }

  // -----------------------------------------------------------------------
  // Step 3a: Diff-based pattern triggering
  // -----------------------------------------------------------------------
  const diffLines = getDiffAddedLines(jsStaged, baseDir);
  const registry = loadRegistry({ verbose: VERBOSE });

  if (registry.length === 0) {
    if (VERBOSE) console.warn("[propagation-staged] Registry is empty — nothing to check.");
    return { ...emptyResult, stagedCount: jsStaged.length, duration_ms: Date.now() - startTime };
  }

  const triggeredIds = matchPatterns(diffLines, registry);

  if (triggeredIds.length === 0) {
    if (VERBOSE) console.log("[propagation-staged] No registry patterns triggered by diff.");
    return { ...emptyResult, stagedCount: jsStaged.length, duration_ms: Date.now() - startTime };
  }

  // -----------------------------------------------------------------------
  // Step 3b: For each triggered pattern, find scan targets via searchGlob
  // -----------------------------------------------------------------------
  const baseline = loadBaseline({ verbose: VERBOSE });
  const stagedSet = new Set(jsStaged.map((f) => f.replaceAll("\\", "/")));
  const allMisses = [];
  const warnings = []; // Legacy-compat warnings array

  for (const patternId of triggeredIds) {
    const entry = registry.find((e) => e.id === patternId);
    if (!entry) continue;

    // Find files matching this pattern's searchGlob
    const scanFiles = findFilesForGlobs(entry.searchGlob, baseDir);

    // Run miss detection
    const misses = findMisses(entry, scanFiles, { verbose: VERBOSE });

    for (const miss of misses) {
      const relFile = path.relative(baseDir, miss.file).replaceAll("\\", "/");

      // Step 3e: Suppress baselined violations
      if (isBaselined(baseline, "pattern", patternId, relFile)) {
        if (VERBOSE) {
          console.log(`[propagation-staged] Baselined: ${patternId} in ${relFile}`);
        }
        continue;
      }

      allMisses.push({
        patternId: entry.id,
        file: relFile,
        severity: entry.severity,
      });

      // Build legacy warnings shape — pick the first staged file as "source"
      const sourceStaged = jsStaged[0] || "(diff)";
      warnings.push({
        pattern: entry.description,
        patternId: entry.id,
        stagedFile: sourceStaged,
        siblingFile: relFile,
        severity: entry.severity,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Step 3f: Severity-based blocking
  // -----------------------------------------------------------------------
  const hasBlock = allMisses.some((m) => m.severity === "BLOCK");

  const duration_ms = Date.now() - startTime;

  // Step 7: Performance budget enforcement
  if (duration_ms > PERF_BUDGET_MS) {
    console.warn(
      `[propagation-staged] Performance warning: ${duration_ms}ms exceeded ${PERF_BUDGET_MS}ms budget`
    );
  }

  return {
    warnings,
    stagedCount: jsStaged.length,
    triggered: triggeredIds,
    misses: allMisses,
    blocked: hasBlock,
    duration_ms,
  };
}

// ---------------------------------------------------------------------------
// Output and exit
// ---------------------------------------------------------------------------

function main() {
  try {
    const result = runCheck();
    const { warnings, stagedCount, triggered, misses, blocked, duration_ms } = result;

    // --json output (Step 5)
    if (JSON_OUTPUT) {
      const jsonOut = {
        triggered,
        misses,
        blocked,
        duration_ms,
      };
      console.log(JSON.stringify(jsonOut, null, 2));
      if (blocked) process.exit(2);
      if (BLOCKING && misses.length > 0) process.exit(1);
      process.exit(0);
    }

    if (stagedCount === 0) {
      console.log("[propagation-staged] No JS/TS files staged — skipping.");
      process.exit(0);
    }

    if (triggered.length > 0 && VERBOSE) {
      console.log(`[propagation-staged] Triggered patterns: ${triggered.join(", ")}`);
    }

    if (warnings.length === 0) {
      console.log(
        `[propagation-staged] Checked ${stagedCount} staged file(s) — no propagation misses.`
      );
      process.exit(0);
    }

    // Group warnings by pattern for cleaner output
    const grouped = new Map();
    for (const w of warnings) {
      const key = `${w.patternId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          pattern: w.pattern,
          patternId: w.patternId,
          severity: w.severity,
          siblings: [],
        });
      }
      grouped.get(key).siblings.push(w.siblingFile);
    }

    console.log(`[propagation-staged] ${misses.length} propagation miss(es) detected:`);
    console.log();
    for (const [, group] of grouped) {
      const severityTag = group.severity === "BLOCK" ? "[BLOCK]" : "[WARN]";
      console.log(`  ${severityTag} Pattern: ${group.pattern}`);
      for (const sib of group.siblings) {
        console.log(`  Propagation miss: ${group.pattern} in ${sib}`);
      }
      console.log();
    }

    // Exit code logic: BLOCK-severity -> exit 2, --blocking legacy -> exit 1
    if (blocked) {
      console.log(
        "[propagation-staged] BLOCKING: BLOCK-severity propagation misses found. Fix before committing."
      );
      process.exit(2);
    } else if (BLOCKING && misses.length > 0) {
      console.log(
        "[propagation-staged] BLOCKING: Stage sibling files or review them before committing."
      );
      process.exit(1);
    } else {
      console.log("[propagation-staged] WARNING: Review sibling files for the same pattern.");
      process.exit(0);
    }
  } catch (err) {
    console.error(`[propagation-staged] Script error: ${sanitizeError(err)}`);
    process.exit(2);
  }
}

// Export for testing (backward-compatible shape)
module.exports = { runCheck, fileContainsPattern, getSiblingFiles, SECURITY_PATTERNS };

// Run if executed directly
if (require.main === module) {
  main();
}
