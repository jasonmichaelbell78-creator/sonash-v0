#!/usr/bin/env node
/**
 * Propagation-Audit Pre-Commit Gate
 *
 * Purpose: When a security/safety fix is staged, greps sibling files in the
 * same directory for the same pattern and warns if siblings exist but are not
 * staged. This catches "fix one file, miss the duplicate" propagation errors
 * that historically cause multi-round review churn.
 *
 * Patterns checked:
 *   - sanitizeError (error sanitization helper)
 *   - safeWriteFileSync / safeWrite (safe filesystem writes)
 *   - isSafeToWrite (symlink guard before writes)
 *   - lstatSync (TOCTOU / symlink guards)
 *   - validatePathInDir / path containment (path traversal guards)
 *   - refuseSymlink (symlink rejection helpers)
 *
 * Usage:
 *   node scripts/check-propagation-staged.js                # Normal mode
 *   node scripts/check-propagation-staged.js --verbose      # Show all matches
 *   node scripts/check-propagation-staged.js --blocking     # Exit 1 on misses
 *   node scripts/check-propagation-staged.js --staged-files "a.js b.js" --all-files "a.js b.js c.js"
 *                                                           # Override file lists (for testing)
 *
 * Exit codes:
 *   0 = no propagation misses (or warnings only in non-blocking mode)
 *   1 = propagation misses found (blocking mode only)
 *   2 = script error
 *
 * Version History:
 * | Version | Date       | Changes                          |
 * |---------|------------|----------------------------------|
 * | 1.0     | 2026-03-18 | Initial implementation (retro)   |
 */

const { execFileSync } = require("node:child_process");
const { readdirSync, readFileSync, lstatSync } = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Sanitize error helper (inline — CLAUDE.md Section 5: sanitizeError pattern)
// ---------------------------------------------------------------------------
let sanitizeError;
try {
  sanitizeError = require("./lib/sanitize-error");
} catch {
  sanitizeError = (err) => {
    const name = err instanceof Error ? err.name : "Error";
    let code = null;
    try {
      code = err && typeof err === "object" && "code" in err ? String(err.code) : null;
    } catch { code = null; }
    return code ? `${name} (${code})` : name;
  };
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const BLOCKING = args.includes("--blocking");

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
// Security pattern definitions
// ---------------------------------------------------------------------------
const SECURITY_PATTERNS = [
  {
    id: "sanitize-error",
    label: "sanitizeError",
    // Match function calls or imports of sanitizeError
    regex: /\bsanitizeError\s*\(/,
  },
  {
    id: "safe-write",
    label: "safeWriteFileSync",
    regex: /\bsafeWriteFileSync\s*\(/,
  },
  {
    id: "symlink-guard",
    label: "isSafeToWrite",
    regex: /\bisSafeToWrite\s*\(/,
  },
  {
    id: "lstat-guard",
    label: "lstatSync",
    regex: /\blstatSync\s*\(/,
  },
  {
    id: "path-containment",
    label: "validatePathInDir",
    regex: /\bvalidatePathInDir\s*\(/,
  },
  {
    id: "refuse-symlink",
    label: "refuseSymlink",
    regex: /\brefuseSymlink\w*\s*\(/,
  },
];

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
        return !(/^\.\.(?:[\\/]|$)/.test(rel)) && !path.isAbsolute(f);
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
// Main analysis
// ---------------------------------------------------------------------------

/**
 * Run the propagation check.
 * @param {object} options - Override options (for testing)
 * @param {string} [options.baseDir] - Project root directory
 * @returns {{ warnings: Array<{pattern: string, stagedFile: string, siblingFile: string}>, stagedCount: number }}
 */
/**
 * Check a staged file against security patterns and find unstaged siblings with the same pattern.
 */
function checkStagedFilePatterns(absStaged, stagedFile, baseDir, stagedSet, warnings) {
  for (const pattern of SECURITY_PATTERNS) {
    if (!fileContainsPattern(absStaged, pattern.regex)) continue;

    const siblings = getSiblingFiles(stagedFile, baseDir);

    for (const sibling of siblings) {
      if (stagedSet.has(sibling)) continue;

      const absSibling = path.resolve(baseDir, sibling);
      if (fileContainsPattern(absSibling, pattern.regex)) {
        warnings.push({
          pattern: pattern.label,
          patternId: pattern.id,
          stagedFile,
          siblingFile: sibling,
        });
      }
    }
  }
}

function runCheck(options = {}) {
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
  const stagedFilesRaw = Array.isArray(options.stagedFiles) ? options.stagedFiles : getStagedFiles();
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

  if (jsStaged.length === 0) {
    if (VERBOSE) console.log("[propagation-staged] No JS/TS files staged.");
    return { warnings: [], stagedCount: 0 };
  }

  const stagedSet = new Set(jsStaged.map((f) => f.replaceAll("\\", "/")));
  const warnings = [];

  for (const stagedFile of jsStaged) {
    const absStaged = path.resolve(baseDir, stagedFile);
    checkStagedFilePatterns(absStaged, stagedFile, baseDir, stagedSet, warnings);
  }

  return { warnings, stagedCount: jsStaged.length };
}

// ---------------------------------------------------------------------------
// Output and exit
// ---------------------------------------------------------------------------

function main() {
  try {
    const { warnings, stagedCount } = runCheck();

    if (stagedCount === 0) {
      console.log("[propagation-staged] No JS/TS files staged — skipping.");
      process.exit(0);
    }

    if (warnings.length === 0) {
      console.log(`[propagation-staged] Checked ${stagedCount} staged file(s) — no propagation misses.`);
      process.exit(0);
    }

    // Group warnings by pattern for cleaner output
    const grouped = new Map();
    for (const w of warnings) {
      const key = `${w.pattern}:${w.stagedFile}`;
      if (!grouped.has(key)) {
        grouped.set(key, { pattern: w.pattern, stagedFile: w.stagedFile, siblings: [] });
      }
      grouped.get(key).siblings.push(w.siblingFile);
    }

    console.log(`[propagation-staged] ${warnings.length} propagation miss(es) detected:`);
    console.log();
    for (const [, group] of grouped) {
      console.log(`  Pattern: ${group.pattern}`);
      console.log(`  Staged:  ${group.stagedFile}`);
      for (const sib of group.siblings) {
        console.log(`  Propagation miss: ${group.pattern} found in ${group.stagedFile} but sibling ${sib} also has it and isn't staged`);
      }
      console.log();
    }

    if (BLOCKING) {
      console.log("[propagation-staged] BLOCKING: Stage sibling files or review them before committing.");
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

// Export for testing
module.exports = { runCheck, fileContainsPattern, getSiblingFiles, SECURITY_PATTERNS };

// Run if executed directly
if (require.main === module) {
  main();
}
