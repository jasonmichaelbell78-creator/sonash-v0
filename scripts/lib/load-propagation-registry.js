/* global __dirname */
/**
 * Shared Propagation Pattern Registry Loader
 *
 * Consumed by both check-propagation-staged.js (pre-commit) and
 * check-propagation.js (pre-push). Provides pattern loading, diff-based
 * matching, and miss detection against the canonical registry at
 * scripts/config/propagation-patterns.json.
 *
 * @module lib/load-propagation-registry
 */

const { readFileSync } = require("node:fs");
const path = require("node:path");

let sanitizeError;
try {
  sanitizeError = require("./sanitize-error");
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

const REGISTRY_PATH = path.join(__dirname, "..", "config", "propagation-patterns.json");

// Performance budget: 2 seconds (per D16)
const PERF_BUDGET_MS = 2000;

/**
 * Load the pattern registry from disk.
 * Returns an array of validated pattern entries.
 * Handles missing/corrupt file gracefully (returns empty array).
 *
 * @param {object} [options]
 * @param {string} [options.registryPath] - Override path (for testing)
 * @param {boolean} [options.verbose] - Log warnings
 * @returns {Array<object>} Array of pattern entries
 */
function loadRegistry(options = {}) {
  const filePath = options.registryPath || REGISTRY_PATH;
  const verbose = options.verbose || false;

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.patterns)) {
      if (verbose)
        console.warn("[propagation-registry] Invalid registry format — expected { patterns: [] }");
      return [];
    }

    // Validate each entry
    const valid = [];
    for (const entry of parsed.patterns) {
      if (!entry || typeof entry !== "object") continue;
      if (!entry.id || !entry.description || !entry.pattern || !Array.isArray(entry.searchGlob)) {
        if (verbose)
          console.warn(`[propagation-registry] Skipping invalid entry: ${entry.id || "unknown"}`);
        continue;
      }
      if (!["BLOCK", "WARN"].includes(entry.severity)) {
        if (verbose)
          console.warn(
            `[propagation-registry] Invalid severity for ${entry.id}: ${entry.severity}`
          );
        continue;
      }
      valid.push({
        id: entry.id,
        description: entry.description,
        pattern: entry.pattern,
        antiPattern: entry.antiPattern || null,
        searchGlob: entry.searchGlob,
        severity: entry.severity,
        missDetection: entry.missDetection || "antiPattern",
        source: entry.source || "",
      });
    }

    return valid;
  } catch (err) {
    if (verbose) console.warn(`[propagation-registry] Failed to load: ${sanitizeError(err)}`);
    return [];
  }
}

/**
 * Match diff lines against registry patterns.
 * Returns array of pattern IDs that were triggered by the diff.
 *
 * @param {string[]} diffLines - Lines from git diff output (added lines only, with + prefix)
 * @param {Array<object>} registry - Loaded registry entries
 * @returns {string[]} Array of triggered pattern IDs
 */
function matchPatterns(diffLines, registry) {
  const triggered = [];

  for (const entry of registry) {
    let regex;
    try {
      regex = new RegExp(entry.pattern);
    } catch {
      continue; // Skip invalid regex
    }

    for (const line of diffLines) {
      // Strip the leading + from diff lines
      const content = line.startsWith("+") ? line.slice(1) : line;
      if (regex.test(content)) {
        triggered.push(entry.id);
        break; // One match per pattern is enough
      }
    }
  }

  return triggered;
}

/**
 * Find files with propagation misses for a given pattern entry.
 *
 * For "antiPattern" mode: returns files where antiPattern regex matches.
 * For "patternAbsence" mode: returns files where pattern regex does NOT match.
 *
 * @param {object} patternEntry - Registry entry
 * @param {string[]} files - Array of absolute file paths to scan
 * @param {object} [options]
 * @param {boolean} [options.verbose] - Log warnings
 * @returns {Array<{file: string, mode: string}>} Array of files with misses
 */
function findMisses(patternEntry, files, options = {}) {
  const verbose = options.verbose || false;
  const misses = [];
  const mode = patternEntry.missDetection || "antiPattern";

  if (mode === "antiPattern" && !patternEntry.antiPattern) {
    return []; // No antiPattern defined, nothing to check
  }

  let checkRegex;
  try {
    checkRegex = new RegExp(
      mode === "antiPattern" ? patternEntry.antiPattern : patternEntry.pattern
    );
  } catch {
    if (verbose) console.warn(`[propagation-registry] Invalid regex for ${patternEntry.id}`);
    return [];
  }

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, "utf8");
      checkRegex.lastIndex = 0;
      const matches = checkRegex.test(content);

      if (mode === "antiPattern" && matches) {
        // File has the bad pattern
        misses.push({ file: filePath, mode: "antiPattern" });
      } else if (mode === "patternAbsence" && !matches) {
        // File lacks the good pattern
        misses.push({ file: filePath, mode: "patternAbsence" });
      }
    } catch (err) {
      if (verbose)
        console.warn(`[propagation-registry] Cannot read ${filePath}: ${sanitizeError(err)}`);
    }
  }

  return misses;
}

/**
 * Load baseline entries from known-propagation-baseline.json.
 * Returns array of { type, key, file } objects.
 *
 * @param {object} [options]
 * @param {string} [options.baselinePath] - Override path (for testing)
 * @param {boolean} [options.verbose] - Log warnings
 * @returns {Array<object>}
 */
function loadBaseline(options = {}) {
  const filePath =
    options.baselinePath || path.join(__dirname, "..", "config", "known-propagation-baseline.json");
  const verbose = options.verbose || false;

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
    return rawEntries
      .filter(
        (e) =>
          e &&
          typeof e === "object" &&
          typeof e.type === "string" &&
          typeof e.key === "string" &&
          typeof e.file === "string"
      )
      .map((e) => ({ ...e, file: e.file.replaceAll("\\", "/") }));
  } catch (err) {
    if (verbose) console.warn(`[propagation-baseline] Failed to load: ${sanitizeError(err)}`);
    return [];
  }
}

/**
 * Check if a specific miss is baselined.
 *
 * @param {Array<object>} baseline - Loaded baseline entries
 * @param {string} type - "function" or "pattern"
 * @param {string} key - Pattern ID or function name
 * @param {string} file - File path (will be normalized to forward slashes)
 * @returns {boolean}
 */
function isBaselined(baseline, type, key, file) {
  const normalizedFile = file.replaceAll("\\", "/");
  return baseline.some((e) => e.type === type && e.key === key && e.file === normalizedFile);
}

module.exports = {
  loadRegistry,
  matchPatterns,
  findMisses,
  loadBaseline,
  isBaselined,
  PERF_BUDGET_MS,
};
