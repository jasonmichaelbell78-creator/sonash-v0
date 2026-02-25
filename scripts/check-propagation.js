#!/usr/bin/env node
/**
 * Propagation Check — Detect duplicate functions modified in some files but not others.
 *
 * When a function is fixed in file A but an identical copy exists in file B,
 * this script catches the propagation miss. Recommended 8x across PRs #366-#388,
 * finally automated in Session #185.
 *
 * Usage:
 *   node scripts/check-propagation.js              # Check staged vs upstream
 *   node scripts/check-propagation.js --staged     # Check staged files only
 *   node scripts/check-propagation.js --verbose    # Show all matches
 *
 * Exit codes:
 *   0 = no propagation misses (or only warnings)
 *   1 = propagation misses found (blocking)
 *
 * Integration: Called from .husky/pre-push as a warning check.
 */

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB — skip huge files
const SEARCH_DIRS = ["scripts/", ".claude/skills/", ".claude/hooks/"];
const IGNORE_DIRS = ["node_modules", ".git", "docs/archive", "__tests__"];
const VERBOSE = process.argv.includes("--verbose");
const STAGED_ONLY = process.argv.includes("--staged");
const BLOCKING = process.argv.includes("--blocking");

// ---- Known security/pattern propagation rules ----
// These catch non-function patterns that historically cause multi-round review churn.
// Each rule: { name, pattern (regex for grep -nE), description, recommended }
// Added per PR #391 retro: path-containment and statSync→lstatSync caused ~2.5 avoidable rounds.
const KNOWN_PATTERN_RULES = [
  {
    name: "statSync-without-lstat",
    // Matches statSync( but not lstatSync(
    searchPattern: String.raw`\bstatSync\s*\(`,
    excludeFilePattern: /lstatSync/,
    description: "statSync without symlink check — use lstatSync + isSymbolicLink() guard",
    recommended: "Replace statSync() with lstatSync() and add isSymbolicLink() skip",
  },
  {
    name: "path-resolve-without-containment",
    // Matches path.resolve( or resolve( in contexts without a containment check nearby
    searchPattern: String.raw`path\.resolve\s*\(`,
    // Files that also contain validatePathInDir or startsWith( are likely guarded
    excludeFilePattern: /validatePathInDir|\.startsWith\s*\(/,
    description: "path.resolve() without path containment guard",
    recommended: "Add validatePathInDir() or startsWith(allowedDir) check after path.resolve()",
  },
];

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
    const msg = err instanceof Error ? err.message : String(err);
    // Exit code 1 with empty stderr = no changes; anything else is a real error
    if (msg.includes("no upstream") || msg.includes("unknown revision")) {
      if (VERBOSE) console.log("  No upstream configured — skipping propagation check.");
      return new Map();
    }
    console.warn(`  ⚠️ git diff failed: ${msg.slice(0, 200)}`);
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
  if (IGNORE_DIRS.some((d) => file.includes(d))) return true;
  if (file.includes(".test.") || file.includes(".spec.")) return true;
  try {
    const stat = lstatSync(file);
    if (stat.isSymbolicLink()) return true;
    return stat.size > MAX_FILE_SIZE;
  } catch {
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

  for (const searchDir of SEARCH_DIRS) {
    try {
      const output = execFileSync(
        "git",
        ["grep", "-nE", definitionPattern, "--", `${searchDir}**/*.js`, `${searchDir}**/*.mjs`],
        { encoding: "utf8", maxBuffer: 5 * 1024 * 1024, cwd: process.cwd() }
      );
      for (const line of output.trim().split("\n").filter(Boolean)) {
        const parsed = parseGrepLine(line);
        if (parsed) results.push(parsed);
      }
    } catch {
      // grep returns exit code 1 when no matches — ignore
    }
  }
  return results;
}

/**
 * Main analysis: find propagation misses.
 */
function analyze() {
  const changedFiles = getChangedFiles();

  if (changedFiles.size === 0) {
    if (VERBOSE) console.log("  No JS file changes detected in target directories.");
    return { misses: [], total: 0 };
  }

  // Collect all changed file paths for exclusion
  const changedPaths = new Set(changedFiles.keys());

  // Collect all function names across all changed files
  const allFuncNames = new Map(); // funcName -> Set<files that changed it>
  for (const [filePath, funcNames] of changedFiles) {
    for (const name of funcNames) {
      if (!allFuncNames.has(name)) {
        allFuncNames.set(name, new Set());
      }
      allFuncNames.get(name).add(filePath);
    }
  }

  if (VERBOSE) {
    console.log(
      `  Analyzing ${changedFiles.size} changed files, ${allFuncNames.size} function names`
    );
  }

  const misses = [];

  for (const [funcName, changedIn] of allFuncNames) {
    const allMatches = searchForFunction(funcName);

    // Filter to files NOT in the changed set
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

  // ---- Pattern-based propagation checks ----
  // Check known risky patterns in changed files and warn if similar files lack fixes
  const patternWarnings = checkKnownPatterns(changedPaths);

  return { misses, total: allFuncNames.size, patternWarnings };
}

/**
 * Check known security/quality patterns across changed files.
 * If a changed file fixes a known pattern (e.g., statSync→lstatSync),
 * warn about sibling files in the same directory that still have the old pattern.
 */
function checkKnownPatterns(changedPaths) {
  const warnings = [];

  for (const rule of KNOWN_PATTERN_RULES) {
    // Search all target dirs for the risky pattern
    const matches = [];
    for (const searchDir of SEARCH_DIRS) {
      try {
        const output = execFileSync(
          "git",
          ["grep", "-lE", rule.searchPattern, "--", `${searchDir}**/*.js`, `${searchDir}**/*.mjs`],
          { encoding: "utf8", maxBuffer: 5 * 1024 * 1024, cwd: process.cwd() }
        );
        for (const file of output.trim().split("\n").filter(Boolean)) {
          if (shouldSkipMatch(file)) continue;
          matches.push(file.replace(/^\.\//, ""));
        }
      } catch {
        // grep returns exit code 1 when no matches
      }
    }

    // Dedup matches across SEARCH_DIRS
    const uniqueMatches = [...new Set(matches)];

    if (uniqueMatches.length === 0) continue;

    // Filter out files that have the exclude pattern (already guarded)
    // Read working-tree content (not HEAD) to see current state during pre-push
    const unguardedFiles = rule.excludeFilePattern
      ? uniqueMatches.filter((file) => {
          try {
            const content = readFileSync(file, "utf8");
            return !rule.excludeFilePattern.test(content);
          } catch {
            return true; // If we can't read it, flag it
          }
        })
      : uniqueMatches;

    if (unguardedFiles.length === 0) continue;

    // Only warn if at least one changed file is among the matches (implies developer
    // is working in this area and may have fixed some but not all)
    const changedInArea = unguardedFiles.some((f) => changedPaths.has(f));
    const unchangedFiles = unguardedFiles.filter((f) => !changedPaths.has(f));

    if (changedInArea && unchangedFiles.length > 0) {
      warnings.push({
        rule: rule.name,
        description: rule.description,
        recommended: rule.recommended,
        unchangedFiles,
      });
    } else if (VERBOSE && unguardedFiles.length > 0) {
      console.log(
        `  [${rule.name}] ${unguardedFiles.length} files with pattern (no overlap with changes)`
      );
    }
  }

  return warnings;
}

// ---- Main ----
const { misses, total, patternWarnings } = analyze();

const hasPatternWarnings = patternWarnings.length > 0;

if (misses.length === 0 && !hasPatternWarnings) {
  if (total > 0) {
    console.log(`  ✅ Propagation check passed (${total} functions, no duplicates missed)`);
  }
  process.exit(0);
}

// Report function-level misses
if (misses.length > 0) {
  console.log(`  ⚠️ Propagation check: ${misses.length} potential miss(es) found`);
  console.log("");

  for (const miss of misses) {
    console.log(`  Function: ${miss.funcName}`);
    console.log(`    Modified in: ${miss.changedIn.join(", ")}`);
    console.log(`    Also exists in (NOT modified):`);
    for (const m of miss.missedIn) {
      console.log(`      - ${m.file}:${m.line}  ${m.content.substring(0, 80)}`);
    }
    console.log("");
  }

  console.log("  Action: Review the above files — if the same function was copy-pasted,");
  console.log("  propagate your fix to all copies. If they're independent, ignore this warning.");
  console.log("");
}

// Report pattern-based warnings
if (hasPatternWarnings) {
  console.log(`  ⚠️ Known pattern propagation: ${patternWarnings.length} pattern(s) need review`);
  console.log("");

  for (const pw of patternWarnings) {
    console.log(`  Pattern: ${pw.rule}`);
    console.log(`    ${pw.description}`);
    console.log(`    Files still using old pattern:`);
    for (const f of pw.unchangedFiles) {
      console.log(`      - ${f}`);
    }
    console.log(`    Recommended: ${pw.recommended}`);
    console.log("");
  }
}

process.exit(BLOCKING ? 1 : 0);
