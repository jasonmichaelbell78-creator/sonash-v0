#!/usr/bin/env node
/**
 * Propagation Check — Detect duplicate functions modified in some files but not others.
 *
 * When a function is fixed in file A but an identical copy exists in file B,
 * this script catches the propagation miss. Recommended 8x across PRs #366-#388,
 * finally automated in Session #185.
 *
 * Two detection modes:
 *   Mode A: Function-name diffing via extractModifiedFunctions (orthogonal to registry)
 *   Mode B: Registry-based pattern detection using propagation-patterns.json
 *
 * Usage:
 *   node scripts/check-propagation.js              # Check staged vs upstream
 *   node scripts/check-propagation.js --staged     # Check staged files only
 *   node scripts/check-propagation.js --verbose    # Show all matches
 *   node scripts/check-propagation.js --blocking   # Exit 1 on misses
 *   node scripts/check-propagation.js --json       # JSON output
 *
 * Exit codes:
 *   0 = no propagation misses (or only warnings)
 *   1 = propagation misses found (blocking)
 *
 * Integration: Called from .husky/pre-push as a warning check.
 */

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { sanitizeError } from "./lib/sanitize-error.js";

// ---- CJS interop: load shared propagation registry loader ----
const require = createRequire(import.meta.url);
const {
  loadRegistry,
  matchPatterns,
  findMisses,
  loadBaseline,
  isBaselined,
  PERF_BUDGET_MS,
} = require("./lib/load-propagation-registry");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- Skip mechanism (Step 7) ----
if (process.env.SKIP_PROPAGATION) {
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ skipped: true, reason: "SKIP_PROPAGATION" }));
  } else {
    console.log("  Propagation check skipped (SKIP_PROPAGATION is set)");
  }
  process.exit(0);
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB — skip huge files
const SEARCH_DIRS = [
  "scripts/",
  ".claude/skills/",
  ".claude/hooks/",
  "lib/",
  "app/",
  "components/",
];
const IGNORE_DIRS = ["node_modules", ".git", "docs/archive", "__tests__"];
const VERBOSE = process.argv.includes("--verbose");
const STAGED_ONLY = process.argv.includes("--staged");
const BLOCKING = process.argv.includes("--blocking");
const JSON_OUTPUT = process.argv.includes("--json");

// ---- Load registry and baseline via shared module ----
const registry = loadRegistry({ verbose: VERBOSE });
const baselineEntries = loadBaseline({ verbose: VERBOSE });

/** Normalize path separators for cross-platform comparison */
const toPosixPath = (filePath) => String(filePath).replaceAll("\\", "/");

/** Convert repo-relative paths into an FS-friendly path */
const toFsPath = (filePath) =>
  process.platform === "win32" ? String(filePath).replaceAll("/", "\\") : String(filePath);

/** POSIX-safe dirname — works on normalized forward-slash paths */
const posixDirname = (filePath) => {
  // Strip trailing slashes (safe: no regex DoS risk on bounded file paths)
  const s = toPosixPath(filePath).replace(/\/+$/, "");
  const idx = s.lastIndexOf("/");
  return idx <= 0 ? "." : s.slice(0, idx);
};

// Minimum function name length to avoid noise from common names
const MIN_FUNC_NAME_LENGTH = 6;
// Common utility names to skip (too generic to be meaningful duplicates)
const GENERIC_NAMES = new Set([
  "render",
  "update",
  "delete",
  "create",
  "handle",
  "format",
  "parse",
  "validate",
  "process",
  "check",
  "get",
  "set",
  "load",
  "save",
  "read",
  "write",
  "init",
  "reset",
  "close",
  "open",
  "start",
  "stop",
  "run",
  "test",
  "main",
  "setup",
  "cleanup",
  "destroy",
  "remove",
  "add",
  "find",
  "filter",
  "map",
  "reduce",
  "forEach",
  "sort",
  "compare",
  "merge",
  "clone",
  "copy",
  "move",
  "exists",
  "ensure",
  "resolve",
  "reject",
  "catch",
  "then",
  "finally",
  "emit",
  "on",
  "off",
  "log",
  "warn",
  "error",
  "info",
  "debug",
  "trace",
]);

/**
 * Get the list of changed files and their diffs.
 * Returns Map<filePath, diffContent>
 */
function getChangedFiles() {
  try {
    let diffOutput;
    if (STAGED_ONLY) {
      diffOutput = execFileSync("git", ["diff", "--cached", "-U3", "--diff-filter=ACMR"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
    } else {
      // Compare current branch vs upstream
      diffOutput = execFileSync("git", ["diff", "@{u}...HEAD", "-U3", "--diff-filter=ACMR"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
    }
    return parseDiff(diffOutput);
  } catch (err) {
    const msg = sanitizeError(err);
    // Exit code 1 with empty stderr = no changes; anything else is a real error
    if (msg.includes("no upstream") || msg.includes("unknown revision")) {
      if (VERBOSE) console.log("  No upstream configured — skipping propagation check.");
      return new Map();
    }
    console.warn(`  [propagation] git diff failed: ${msg.slice(0, 200)}`);
    return new Map();
  }
}

/**
 * Parse unified diff output into a map of file -> changed function names.
 */
function parseDiff(diffOutput) {
  const files = new Map();
  const fileDiffs = diffOutput.split(/^diff --git /m).filter(Boolean);

  for (const fileDiff of fileDiffs) {
    const fileMatch = fileDiff.match(/^a\/(.+?) b\/(.+?)$/m);
    if (!fileMatch) continue;

    const filePath = fileMatch[2];
    // Only check JS files in our target directories
    if (!filePath.endsWith(".js") && !filePath.endsWith(".mjs")) continue;
    if (!SEARCH_DIRS.some((dir) => filePath.startsWith(dir))) continue;

    const funcNames = extractModifiedFunctions(fileDiff);
    if (funcNames.size > 0) {
      files.set(filePath, funcNames);
    }
  }
  return files;
}

/**
 * Extract function names from diff hunks (only from modified lines).
 */
function extractModifiedFunctions(diffContent) {
  const funcNames = new Set();

  // Patterns to match function definitions in added/modified lines
  const patterns = [
    // function declarations: function loadJsonl(
    /^\+.*\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm,
    // const/let/var assignments: const loadJsonl = function/arrow
    /^\+.*\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\(|async\s)/gm,
    // Method definitions in objects/classes: loadJsonl(args) { or loadJsonl: function
    /^\+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/gm,
    // Export function: export function loadJsonl(
    /^\+.*\bexport\s+(?:default\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm,
  ];

  for (const pattern of patterns) {
    for (const match of diffContent.matchAll(pattern)) {
      const name = match[1];
      if (name.length >= MIN_FUNC_NAME_LENGTH && !GENERIC_NAMES.has(name)) {
        funcNames.add(name);
      }
    }
  }

  // Also extract function names from removed lines (context for what was changed)
  const removePatterns = [
    /^-.*\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm,
    /^-.*\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\(|async\s)/gm,
  ];
  for (const pattern of removePatterns) {
    for (const match of diffContent.matchAll(pattern)) {
      const name = match[1];
      if (name.length >= MIN_FUNC_NAME_LENGTH && !GENERIC_NAMES.has(name)) {
        funcNames.add(name);
      }
    }
  }

  return funcNames;
}

/**
 * Escape a string for safe use in a RegExp / grep -E pattern.
 */
function escapeForRegex(str) {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Check if a grep match line should be skipped (ignore dirs, test files, large files).
 */
function shouldSkipMatch(file) {
  const normalized = toPosixPath(file);
  if (IGNORE_DIRS.some((d) => normalized.includes(d))) return true;
  if (normalized.includes(".test.") || normalized.includes(".spec.")) return true;
  try {
    const stat = lstatSync(toFsPath(normalized));
    if (stat.isSymbolicLink()) return true;
    return stat.size > MAX_FILE_SIZE;
  } catch {
    // File unreadable — skip it (logged in verbose mode for diagnostics)
    if (VERBOSE) console.warn(`  [skip-match] unable to stat ${normalized}`);
    return true;
  }
}

/**
 * Parse a grep output line into { file, line, content } or null if invalid.
 */
function parseGrepLine(line) {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;
  const file = line.substring(0, colonIdx);
  if (shouldSkipMatch(file)) return null;
  const secondColon = line.indexOf(":", colonIdx + 1);
  const lineNum = secondColon > colonIdx ? line.substring(colonIdx + 1, secondColon) : "?";
  const content = secondColon > colonIdx ? line.substring(secondColon + 1).trim() : "";
  return { file, line: lineNum, content };
}

/**
 * Search for a function name in the codebase, excluding certain directories.
 * Returns array of { file, line, content } matches.
 */
function searchForFunction(funcName) {
  const results = [];
  const safeName = escapeForRegex(funcName);
  const definitionPattern = String.raw`(function[[:space:]]+${safeName}[[:space:]]*\(|(const|let|var)[[:space:]]+${safeName}[[:space:]]*=|[^a-zA-Z0-9_$]${safeName}[[:space:]]*\([^)]*\)[[:space:]]*\{)`;
  const globs = SEARCH_DIRS.flatMap((d) => [`:(glob)${d}**/*.js`, `:(glob)${d}**/*.mjs`]);

  try {
    const output = execFileSync("git", ["grep", "-nE", "-e", definitionPattern, "--", ...globs], {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
      cwd: process.cwd(),
    });
    for (const line of output.trim().split("\n").filter(Boolean)) {
      const parsed = parseGrepLine(line);
      if (parsed) results.push(parsed);
    }
  } catch (err) {
    // grep returns exit code 1 when no matches — only ignore that case
    if (err && typeof err === "object" && "status" in err && err.status !== 1) {
      const msg = sanitizeError(err);
      if (BLOCKING) {
        console.error(`  [func-search] git grep failed for ${funcName}: ${msg}`);
        process.exit(1);
      }
      if (VERBOSE) console.warn(`  [func-search] git grep failed for ${funcName}: ${msg}`);
    }
  }
  return results;
}

/**
 * Build glob patterns for git grep from a registry entry's searchGlob array.
 * Converts glob strings (e.g., "scripts/**\/*.js") into git pathspecs.
 */
function registryGlobsToPathspecs(searchGlobs) {
  const specs = [];
  for (const g of searchGlobs) {
    specs.push(`:(glob)${g}`);
  }
  return specs;
}

/**
 * Search for files matching a registry pattern across its declared searchGlob dirs.
 * Returns deduplicated array of file paths (repo-relative, POSIX).
 */
function findPatternMatchFiles(patternEntry) {
  const matches = [];
  const globs = registryGlobsToPathspecs(patternEntry.searchGlob);

  // patternAbsence mode: need ALL files in scope (not just ones matching a pattern)
  if (patternEntry.missDetection === "patternAbsence") {
    return findAllFilesForGlobs(globs, patternEntry.id);
  }

  // antiPattern mode: use git grep to find files containing the anti-pattern
  try {
    const output = execFileSync(
      "git",
      ["grep", "-lP", "-e", patternEntry.antiPattern || patternEntry.pattern, "--", ...globs],
      {
        encoding: "utf8",
        maxBuffer: 5 * 1024 * 1024,
        cwd: process.cwd(),
      }
    );
    for (const file of output.trim().split("\n").filter(Boolean)) {
      const normalized = toPosixPath(file.replace(/^\.\//, ""));
      if (!shouldSkipMatch(normalized)) matches.push(normalized);
    }
  } catch (err) {
    if (!err || typeof err !== "object" || !("status" in err) || err.status !== 1) {
      if (VERBOSE) {
        console.warn(
          `  [pattern-search] git grep failed for ${patternEntry.id}: ${sanitizeError(err)}`
        );
      }
    }
    if (err && typeof err === "object" && "status" in err && err.status === 2) {
      return findPatternMatchFilesFallback(patternEntry);
    }
  }

  return [...new Set(matches)];
}

function findAllFilesForGlobs(globs, patternId) {
  const matches = [];
  try {
    const output = execFileSync("git", ["ls-files", "--", ...globs], {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
      cwd: process.cwd(),
    });
    for (const file of output.trim().split("\n").filter(Boolean)) {
      const normalized = toPosixPath(file.replace(/^\.\//, ""));
      if (!shouldSkipMatch(normalized)) matches.push(normalized);
    }
  } catch (err) {
    if (VERBOSE) {
      console.warn(
        `  [pattern-search] git ls-files failed for ${patternId}: ${sanitizeError(err)}`
      );
    }
  }
  return [...new Set(matches)];
}

/**
 * Fallback: scan files without git grep -P by listing files then reading them.
 */
function findPatternMatchFilesFallback(patternEntry) {
  const matches = [];
  const globs = registryGlobsToPathspecs(patternEntry.searchGlob);
  const regexStr = patternEntry.antiPattern || patternEntry.pattern;

  let regex;
  try {
    regex = new RegExp(regexStr);
  } catch {
    return [];
  }

  // Get file list from git
  let files = [];
  try {
    const output = execFileSync("git", ["ls-files", "--", ...globs], {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
      cwd: process.cwd(),
    });
    files = output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }

  for (const rawFile of files) {
    const file = toPosixPath(rawFile.replace(/^\.\//, ""));
    if (shouldSkipMatch(file)) continue;
    try {
      const content = readFileSync(toFsPath(file), "utf8");
      regex.lastIndex = 0;
      if (regex.test(content)) {
        matches.push(file);
      }
    } catch {
      // Skip unreadable files
    }
  }

  return [...new Set(matches)];
}

/**
 * Check known patterns using the shared registry.
 * For each registry entry, find files matching its antiPattern/pattern,
 * then use findMisses() from the shared module for miss detection.
 * Filter via isBaselined() using the shared baseline loader.
 */
function checkKnownPatterns(changedPaths) {
  const warnings = [];
  const posixChangedPaths = new Set(
    [...changedPaths].map((p) => toPosixPath(String(p).replace(/^\.\//, "")))
  );

  for (const entry of registry) {
    // Skip entries with no antiPattern for antiPattern mode (nothing to detect)
    if (entry.missDetection === "antiPattern" && !entry.antiPattern) continue;

    // Find all files in the pattern's scope
    const matchedFiles = findPatternMatchFiles(entry);
    if (matchedFiles.length === 0) continue;

    // Use shared findMisses for miss detection (reads file content, checks regex)
    // findMisses expects absolute paths, so convert
    const cwd = process.cwd();
    const absolutePaths = matchedFiles.map((f) => join(cwd, toFsPath(f)));
    const rawMisses = findMisses(entry, absolutePaths, { verbose: VERBOSE });

    // Convert back to repo-relative POSIX paths
    const missFiles = rawMisses.map((m) => toPosixPath(m.file).replace(toPosixPath(cwd) + "/", ""));

    if (missFiles.length === 0) continue;

    // Use directory overlap — a fixed file won't appear in matches anymore
    // (pattern removed), so check if any changed file shares a directory with miss files
    const missDirs = new Set(missFiles.map((f) => toPosixPath(posixDirname(f))));
    const changedInArea = [...posixChangedPaths].some((f) =>
      missDirs.has(toPosixPath(posixDirname(f)))
    );
    const unchangedFiles = missFiles.filter((f) => !posixChangedPaths.has(f));

    if (changedInArea && unchangedFiles.length > 0) {
      warnings.push({
        rule: entry.id,
        description: entry.description,
        severity: entry.severity,
        recommended: entry.source || "",
        unchangedFiles,
      });
    } else if (VERBOSE && missFiles.length > 0) {
      console.log(
        `  [${entry.id}] ${missFiles.length} files with pattern (no overlap with changes)`
      );
    }
  }

  return warnings;
}

function collectFuncNames(changedFiles) {
  const allFuncNames = new Map();
  for (const [filePath, funcNames] of changedFiles) {
    for (const name of funcNames) {
      if (!allFuncNames.has(name)) {
        allFuncNames.set(name, new Set());
      }
      allFuncNames.get(name).add(filePath);
    }
  }
  return allFuncNames;
}

function detectTriggeredPatterns() {
  try {
    const diffArgs = STAGED_ONLY
      ? ["diff", "--cached", "-U0", "--diff-filter=ACMR"]
      : ["diff", "@{u}...HEAD", "-U0", "--diff-filter=ACMR"];
    const rawDiff = execFileSync("git", diffArgs, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const addedLines = rawDiff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    return matchPatterns(addedLines, registry);
  } catch {
    return [];
  }
}

/**
 * Main analysis: find propagation misses.
 */
function analyze() {
  const startTime = Date.now();
  const changedFiles = getChangedFiles();

  if (changedFiles.size === 0) {
    if (VERBOSE) console.log("  No JS file changes detected in target directories.");
    return {
      misses: [],
      total: 0,
      patternWarnings: [],
      triggeredPatterns: [],
      duration_ms: Date.now() - startTime,
    };
  }

  // ---- Mode A: Function-name diffing ----
  const changedPaths = new Set(changedFiles.keys());
  const allFuncNames = collectFuncNames(changedFiles);

  if (VERBOSE) {
    console.log(
      `  Analyzing ${changedFiles.size} changed files, ${allFuncNames.size} function names`
    );
  }

  const misses = [];

  for (const [funcName, changedIn] of allFuncNames) {
    const allMatches = searchForFunction(funcName);
    const missedFiles = allMatches.filter((m) => {
      const normalized = m.file.replace(/^\.\//, "");
      return !changedPaths.has(normalized);
    });

    if (missedFiles.length > 0) {
      misses.push({
        funcName,
        changedIn: [...changedIn],
        missedIn: missedFiles,
      });
    }
  }

  // ---- Mode B: Registry-based pattern checks ----
  const triggeredPatterns = detectTriggeredPatterns();
  const patternWarnings = checkKnownPatterns(changedPaths);
  const duration_ms = Date.now() - startTime;

  if (VERBOSE && duration_ms > PERF_BUDGET_MS) {
    console.warn(`  [perf] Propagation check took ${duration_ms}ms (budget: ${PERF_BUDGET_MS}ms)`);
  }

  return { misses, total: allFuncNames.size, patternWarnings, triggeredPatterns, duration_ms };
}

// ---- Main ----
const { misses, total, patternWarnings, triggeredPatterns, duration_ms } = analyze();

// Filter out baselined violations using shared isBaselined()
const newMisses = misses
  .map((m) => ({
    ...m,
    missedIn: m.missedIn.filter(
      (loc) => !isBaselined(baselineEntries, "function", m.funcName, loc.file)
    ),
  }))
  .filter((m) => m.missedIn.length > 0);
const newPatternWarnings = patternWarnings
  .map((pw) => ({
    ...pw,
    unchangedFiles: pw.unchangedFiles.filter(
      (f) => !isBaselined(baselineEntries, "pattern", pw.rule, f)
    ),
  }))
  .filter((pw) => pw.unchangedFiles.length > 0);

const suppressedMissesCount = misses.reduce((acc, m) => {
  const suppressed = m.missedIn.filter((loc) =>
    isBaselined(baselineEntries, "function", m.funcName, loc.file)
  ).length;
  return acc + suppressed;
}, 0);
const suppressedPatternCount = patternWarnings.reduce((acc, pw) => {
  const suppressed = pw.unchangedFiles.filter((f) =>
    isBaselined(baselineEntries, "pattern", pw.rule, f)
  ).length;
  return acc + suppressed;
}, 0);
const baselinedCount = suppressedMissesCount + suppressedPatternCount;
const hasPatternWarnings = newPatternWarnings.length > 0;
const blocked =
  BLOCKING && (newMisses.length > 0 || newPatternWarnings.some((pw) => pw.severity === "BLOCK"));

// ---- Step 8: JSON output ----
if (JSON_OUTPUT) {
  const output = {
    modeA: {
      functionsChecked: total,
      misses: newMisses.map((m) => ({
        funcName: m.funcName,
        changedIn: m.changedIn,
        missedIn: m.missedIn.map((loc) => ({ file: loc.file, line: loc.line })),
      })),
    },
    modeB: {
      triggered: triggeredPatterns,
      misses: newPatternWarnings.flatMap((pw) =>
        pw.unchangedFiles.map((f) => ({
          patternId: pw.rule,
          file: f,
          severity: pw.severity || "WARN",
        }))
      ),
    },
    blocked,
    baselineSuppressed: baselinedCount,
    duration_ms,
  };
  console.log(JSON.stringify(output, null, 2));
  process.exit(blocked ? 1 : 0);
}

// ---- Human-readable output ----
if (newMisses.length === 0 && !hasPatternWarnings) {
  if (total > 0) {
    const baselineNote = baselinedCount > 0 ? `, ${baselinedCount} baselined` : "";
    console.log(
      `  Propagation check passed (${total} functions, no new duplicates missed${baselineNote})`
    );
  } else {
    console.log("  Propagation check passed");
  }
  process.exit(0);
}

// Report function-level misses (new only)
if (newMisses.length > 0) {
  console.log(`  Propagation check: ${newMisses.length} potential miss(es) found`);
  console.log("");

  for (const miss of newMisses) {
    console.log(`  Function: ${miss.funcName}`);
    console.log(`    Modified in: ${miss.changedIn.join(", ")}`);
    console.log(`    Also exists in (NOT modified):`);
    for (const m of miss.missedIn) {
      console.log(`      - ${m.file}:${m.line}`);
    }
    console.log("");
  }

  console.log("  Action: Review the above files — if the same function was copy-pasted,");
  console.log("  propagate your fix to all copies. If they're independent, ignore this warning.");
  console.log("");
}

// Report pattern-based warnings (new only)
if (hasPatternWarnings) {
  console.log(`  Known pattern propagation: ${newPatternWarnings.length} pattern(s) need review`);
  console.log("");

  for (const pw of newPatternWarnings) {
    console.log(`  Pattern: ${pw.rule} [${pw.severity}]`);
    console.log(`    ${pw.description}`);
    console.log(`    Files still using old pattern:`);
    for (const f of pw.unchangedFiles) {
      console.log(`      - ${f}`);
    }
    if (pw.recommended) {
      console.log(`    Source: ${pw.recommended}`);
    }
    console.log("");
  }
}

if (baselinedCount > 0 && VERBOSE) {
  console.log(`  ${baselinedCount} known violation(s) suppressed by baseline`);
  console.log("");
}

process.exit(blocked ? 1 : 0);
