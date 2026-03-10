#!/usr/bin/env node
/* eslint-disable no-undef */
// @ts-check
"use strict";

/**
 * Generate test registry — scans for all 8 validation source types
 * and outputs data/ecosystem-v2/test-registry.jsonl
 *
 * Source types:
 *   test_file        — .test.js/.test.ts/.property.test.js files
 *   audit_checker    — ecosystem audit checker scripts
 *   test_protocol    — .protocol.json files for UI test suites
 *   skill_command    — skill SKILL.md files (invocable skills)
 *   npm_validator    — npm scripts that validate/check/lint
 *   gate_check       — CI workflow steps that enforce quality
 *   ci_step          — CI workflow steps (all)
 *   health_checker   — health monitoring checker scripts
 *
 * Usage:
 *   node scripts/generate-test-registry.js               # regenerate registry
 *   node scripts/generate-test-registry.js --check-coverage  # check for untested scripts
 */

const fs = require("node:fs");
const path = require("node:path");

let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/sanitize-error"));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.message : String(err)).slice(0, 200);
}

let safeWriteFileSync;
try {
  ({ safeWriteFileSync } = require("./lib/safe-fs"));
} catch {
  safeWriteFileSync = (p, d, o) => fs.writeFileSync(p, d, o);
}

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "ecosystem-v2", "test-registry.jsonl");
const BASELINE_PATH = path.join(ROOT, ".test-baseline.json");

/** @typedef {{ path: string, source_type: string, type: string, owner: string, target: string, description: string }} RegistryEntry */

/**
 * @param {string} relPath
 * @param {string} defaultType
 * @returns {string}
 */
function detectTestType(relPath, defaultType) {
  if (relPath.includes(".property.test.")) return "property";
  if (relPath.includes(".integration.test.")) return "integration";
  if (relPath.includes(".e2e.test.")) return "e2e";
  if (relPath.includes(".contract.test.")) return "contract";
  if (relPath.includes(".perf.test.")) return "performance";
  return defaultType;
}

/**
 * Extract base name from test filename, stripping test suffixes.
 * Fixed: handles .test.js, .property.test.js, .integration.test.js etc.
 * @param {string} fileName
 * @returns {string}
 */
function extractBaseName(fileName) {
  return fileName.replace(
    /\.(?:property|integration|e2e|contract|perf)?\.?test\.(?:js|ts|mjs)$/,
    ""
  );
}

/**
 * @param {string} absDir
 * @param {string} owner
 * @param {string} type
 * @returns {RegistryEntry[]}
 */
function scanDirForTests(absDir, owner, type) {
  if (!fs.existsSync(absDir)) return [];
  const entries = [];
  try {
    const files = readdirRecursive(absDir);
    for (const file of files) {
      if (!isTestFile(file)) continue;
      const relPath = path.relative(ROOT, file).replaceAll("\\", "/");
      const testType = detectTestType(relPath, type);
      const baseName = extractBaseName(path.basename(file));
      entries.push({
        path: relPath,
        source_type: "test_file",
        type: testType,
        owner,
        target: baseName,
        description: `${testType} test for ${baseName}`,
      });
    }
  } catch {
    // Directory not readable, skip
  }
  return entries;
}

/** @returns {RegistryEntry[]} */
function scanSkillTestFiles() {
  const entries = [];
  const skillsDir = path.join(ROOT, ".claude", "skills");
  if (!fs.existsSync(skillsDir)) return entries;

  try {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const skill of skills) {
      if (!skill.isDirectory()) continue;
      // Skip worktrees directory
      if (skill.name === "worktrees") continue;
      const testsDir = path.join(skillsDir, skill.name, "scripts", "__tests__");
      if (!fs.existsSync(testsDir)) continue;
      try {
        const files = readdirRecursive(testsDir);
        for (const file of files) {
          if (!isTestFile(file)) continue;
          const relPath = path.relative(ROOT, file).replaceAll("\\", "/");
          const baseName = extractBaseName(path.basename(file));
          entries.push({
            path: relPath,
            source_type: "test_file",
            type: "unit",
            owner: skill.name,
            target: baseName,
            description: `${skill.name} test: ${baseName}`,
          });
        }
      } catch {
        // Skip unreadable
      }
    }
  } catch (err) {
    console.error(`[generate-test-registry] scanSkillTestFiles: ${sanitizeError(err)}`);
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanTestFiles() {
  // Comprehensive scan patterns covering all test directories
  const patterns = [
    // Co-located test directories
    { dir: "scripts/health/checkers/__tests__", owner: "health", type: "unit" },
    { dir: "scripts/health/lib/__tests__", owner: "health", type: "unit" },
    { dir: "scripts/health", owner: "health", type: "unit" }, // co-located .test.js files
    { dir: "scripts/reviews/__tests__", owner: "reviews", type: "unit" },
    // Centralized test directories
    { dir: "tests/hooks", owner: "hooks", type: "unit" },
    { dir: "tests/scripts/debt", owner: "debt", type: "unit" },
    { dir: "tests/scripts/lib", owner: "shared-lib", type: "unit" },
    { dir: "tests/scripts/audit", owner: "audit", type: "unit" },
    { dir: "tests/scripts/multi-ai", owner: "multi-ai", type: "unit" },
    { dir: "tests/scripts/planning", owner: "planning", type: "unit" },
    { dir: "tests/scripts/velocity", owner: "velocity", type: "unit" },
    { dir: "tests/scripts/secrets", owner: "secrets", type: "unit" },
    { dir: "tests/scripts/config", owner: "config", type: "unit" },
    { dir: "tests/scripts/tasks", owner: "tasks", type: "unit" },
    { dir: "tests/scripts/metrics", owner: "metrics", type: "unit" },
    { dir: "tests/scripts/health", owner: "health", type: "unit" },
    { dir: "tests/scripts/ecosystem-v2", owner: "ecosystem-v2", type: "unit" },
    { dir: "tests/scripts", owner: "scripts", type: "unit" }, // root-level script tests
    { dir: "tests/utils", owner: "utils", type: "unit" },
    { dir: "tests/security", owner: "security", type: "unit" },
    { dir: "tests/integration", owner: "integration", type: "integration" },
    { dir: "tests/e2e", owner: "e2e", type: "e2e" },
    { dir: "tests/perf", owner: "perf", type: "performance" },
    { dir: "tests", owner: "app", type: "unit" }, // root-level app tests
  ];

  const entries = [];
  for (const { dir, owner, type } of patterns) {
    entries.push(...scanDirForTests(path.join(ROOT, dir), owner, type));
  }
  entries.push(...scanSkillTestFiles());
  return entries;
}

/** @returns {RegistryEntry[]} */
function scanAuditCheckers() {
  const entries = [];
  const skillsDir = path.join(ROOT, ".claude", "skills");
  if (!fs.existsSync(skillsDir)) return entries;

  try {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const skill of skills) {
      if (!skill.isDirectory() || !skill.name.includes("ecosystem-audit")) continue;
      const checkersDir = path.join(skillsDir, skill.name, "scripts", "checkers");
      if (!fs.existsSync(checkersDir)) continue;
      try {
        const files = fs.readdirSync(checkersDir).filter((f) => f.endsWith(".js"));
        for (const file of files) {
          const relPath = `.claude/skills/${skill.name}/scripts/checkers/${file}`;
          entries.push({
            path: relPath,
            source_type: "audit_checker",
            type: "checker",
            owner: skill.name,
            target: file.replace(/\.js$/, ""),
            description: `${skill.name} domain checker: ${file.replace(/\.js$/, "")}`,
          });
        }
      } catch {
        // Skip
      }
    }
  } catch (err) {
    console.error(`[generate-test-registry] scanAuditCheckers: ${sanitizeError(err)}`);
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanTestProtocols() {
  const entries = [];
  const protocolGlobs = ["tests/**/*.protocol.json", ".claude/skills/**/*.protocol.json"];
  for (const pattern of protocolGlobs) {
    const dir = path.join(ROOT, pattern.split("*")[0]);
    if (!fs.existsSync(dir)) continue;
    try {
      const files = readdirRecursive(dir);
      for (const file of files) {
        if (!file.endsWith(".protocol.json")) continue;
        const relPath = path.relative(ROOT, file).replaceAll("\\", "/");
        const baseName = path.basename(file).replace(".protocol.json", "");
        entries.push({
          path: relPath,
          source_type: "test_protocol",
          type: "protocol",
          owner: "ui-testing",
          target: baseName,
          description: `UI test protocol: ${baseName}`,
        });
      }
    } catch {
      // Skip
    }
  }
  return entries;
}

/** @returns {RegistryEntry[]} */
function scanSkillCommands() {
  const entries = [];
  const skillsDir = path.join(ROOT, ".claude", "skills");
  if (!fs.existsSync(skillsDir)) return entries;

  try {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const skill of skills) {
      if (!skill.isDirectory()) continue;
      // Skip worktrees directory
      if (skill.name === "worktrees") continue;
      const skillMd = path.join(skillsDir, skill.name, "SKILL.md");
      if (!fs.existsSync(skillMd)) continue;
      entries.push({
        path: `.claude/skills/${skill.name}/SKILL.md`,
        source_type: "skill_command",
        type: "skill",
        owner: skill.name,
        target: skill.name,
        description: `Skill: ${skill.name}`,
      });
    }
  } catch (err) {
    console.error(`[generate-test-registry] scanSkillCommands: ${sanitizeError(err)}`);
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanNpmValidators() {
  const entries = [];
  const pkgPath = path.join(ROOT, "package.json");
  if (!fs.existsSync(pkgPath)) return entries;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const scripts = pkg.scripts || {};
    const validatorPatterns =
      /^(test|lint|check|validate|verify|audit|format|security|patterns|review|crossdoc|backlog|agents|hooks:test|docs:|roadmap:|skills:)/;
    for (const [name] of Object.entries(scripts)) {
      if (!validatorPatterns.test(name)) continue;
      entries.push({
        path: "package.json",
        source_type: "npm_validator",
        type: "npm-script",
        owner: "npm",
        target: name,
        description: `npm run ${name}`,
      });
    }
  } catch (err) {
    console.error(`[generate-test-registry] scanNpmValidators: ${sanitizeError(err)}`);
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanCiSteps() {
  const entries = [];
  const ciPath = path.join(ROOT, ".github", "workflows", "ci.yml");
  if (!fs.existsSync(ciPath)) return entries;

  try {
    const content = fs.readFileSync(ciPath, "utf8");
    // S5852 two-strikes: replaced regex with string parsing to avoid ReDoS risk
    const gatePatterns =
      /check|lint|test|validate|coverage|audit|format|pattern|compliance|verify/i;
    const lines = content.split("\n");
    let stepIndex = 0;
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (!trimmed.startsWith("- name:")) continue;
      const rawName = trimmed.slice("- name:".length).trim();
      if (!rawName || rawName.startsWith("|") || rawName.startsWith(">")) continue;
      stepIndex++;
      const name = rawName.replaceAll(/[\n\r]/g, " ");
      const isGate = gatePatterns.test(name);
      entries.push({
        path: ".github/workflows/ci.yml",
        source_type: isGate ? "gate_check" : "ci_step",
        type: isGate ? "gate" : "ci",
        owner: "ci",
        target: `${stepIndex}:${name}`,
        description: `CI step: ${name}`,
      });
    }
  } catch (err) {
    console.error(`[generate-test-registry] scanCiSteps: ${sanitizeError(err)}`);
  }

  return entries;
}

/** @returns {RegistryEntry[]} */
function scanHealthCheckers() {
  const entries = [];
  const checkersDir = path.join(ROOT, "scripts", "health", "checkers");
  if (!fs.existsSync(checkersDir)) return entries;

  try {
    const files = fs.readdirSync(checkersDir).filter((f) => f.endsWith(".js"));
    for (const file of files) {
      const relPath = `scripts/health/checkers/${file}`;
      entries.push({
        path: relPath,
        source_type: "health_checker",
        type: "checker",
        owner: "health",
        target: file.replace(/\.js$/, ""),
        description: `Health checker: ${file.replace(/\.js$/, "")}`,
      });
    }
  } catch (err) {
    console.error(`[generate-test-registry] scanHealthCheckers: ${sanitizeError(err)}`);
  }

  return entries;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function readdirRecursive(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== "fixtures" &&
        entry.name !== ".git" &&
        entry.name !== "dist" &&
        entry.name !== "dist-tests" &&
        entry.name !== "worktrees"
      ) {
        results.push(...readdirRecursive(fullPath));
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`[generate-test-registry] readdirRecursive(${dir}): ${sanitizeError(err)}`);
  }
  return results;
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isTestFile(filePath) {
  const name = path.basename(filePath);
  return /\.(?:property|integration|e2e|contract|perf)?\.?test\.(?:js|ts|mjs)$/.test(name);
}

// =========================================================
// --check-coverage: Test coverage gap detection (D#57, D#68)
// =========================================================

/**
 * Covered directory globs for script files that should have tests (D#64).
 * Convention-based: new directories auto-covered.
 */
const COVERED_GLOBS = [
  { base: "scripts", ext: ".js" },
  { base: ".claude/hooks", ext: ".js" },
  { base: ".claude/skills", ext: ".js" },
];

/**
 * Directories/patterns to exclude from coverage check.
 */
const COVERAGE_EXCLUDES = [
  "__tests__",
  "node_modules",
  "dist",
  "dist-tests",
  "fixtures",
  "worktrees",
  ".git",
];

/**
 * File patterns to exclude from coverage check (test files, build output, etc.)
 */
function shouldExcludeFromCoverage(relPath) {
  // Exclude test files themselves
  if (isTestFile(relPath)) return true;
  // Exclude dist/ build output under scripts/reviews/dist
  if (relPath.includes("scripts/reviews/dist/")) return true;
  // Exclude planning lib (duplicate of scripts/lib)
  if (relPath.includes("scripts/planning/lib/")) return true;
  // Exclude mcp server (external tool)
  if (relPath.includes("scripts/mcp/")) return true;
  // Exclude backup/legacy hooks (D#32: superseded versions in root hooks dir)
  // state-utils.js is a copy of lib/state-utils.js (tested via that path)
  if (relPath === ".claude/hooks/state-utils.js") return true;
  // gsd-check-update.js in hooks root is superseded by global/gsd-check-update.js
  if (relPath === ".claude/hooks/gsd-check-update.js") return true;
  // gsd-statusline.js in hooks root is superseded by global/statusline.js
  if (relPath === ".claude/hooks/gsd-statusline.js") return true;
  // gsd-context-monitor.js is a legacy hook not registered in settings.json
  if (relPath === ".claude/hooks/gsd-context-monitor.js") return true;
  return false;
}

/**
 * Scan all .js files in covered directories.
 * @returns {string[]} Relative paths of all source scripts
 */
function scanCoveredScripts() {
  const scripts = [];
  for (const { base, ext } of COVERED_GLOBS) {
    const absBase = path.join(ROOT, base);
    if (!fs.existsSync(absBase)) continue;
    const files = readdirRecursive(absBase);
    for (const file of files) {
      if (!file.endsWith(ext)) continue;
      const relPath = path.relative(ROOT, file).replaceAll("\\", "/");
      // Check directory exclusions
      const parts = relPath.split("/");
      if (parts.some((p) => COVERAGE_EXCLUDES.includes(p))) continue;
      if (shouldExcludeFromCoverage(relPath)) continue;
      scripts.push(relPath);
    }
  }
  return scripts;
}

/**
 * Check if a script has a corresponding test file.
 * Uses multiple matching strategies:
 *   1. Exact name match (script "foo.js" -> test target "foo")
 *   2. Test path contains script name (script "foo.js" -> test "foo.test.ts")
 *   3. Prefix-stripped match (script "check-foo.js" -> test target "foo")
 *   4. Suffix-stripped match (script "validate-foo.js" -> test target "foo")
 *
 * @param {string} scriptPath - Relative path like "scripts/foo.js"
 * @param {RegistryEntry[]} testEntries - All test_file entries from registry
 * @returns {boolean}
 */
function hasTest(scriptPath, testEntries) {
  const scriptName = path.basename(scriptPath, ".js");
  // Common prefixes that tests may omit
  const prefixStripped = scriptName
    .replace(/^check-/, "")
    .replace(/^validate-/, "")
    .replace(/^generate-/, "")
    .replace(/^run-/, "");

  for (const entry of testEntries) {
    if (entry.source_type !== "test_file") continue;
    // Strategy 1: exact name match
    if (entry.target === scriptName) return true;
    // Strategy 2: test path contains script name
    if (entry.path.includes(scriptName + ".test.")) return true;
    if (entry.path.includes(scriptName + ".property.test.")) return true;
    // Strategy 3: prefix-stripped match (check-docs-light -> docs-light)
    if (prefixStripped !== scriptName && entry.target === prefixStripped) return true;
    // Strategy 4: test target contains script name or vice versa
    if (entry.target.includes(scriptName) || scriptName.includes(entry.target)) {
      // Avoid false positives for very short names
      if (entry.target.length >= 5 || scriptName.length >= 5) return true;
    }
  }
  return false;
}

/**
 * Load and validate .test-baseline.json
 * @returns {{ entries: Array<{path: string, lines: number}> } | null}
 */
function loadBaseline() {
  try {
    if (!fs.existsSync(BASELINE_PATH)) return null;
    const content = fs.readFileSync(BASELINE_PATH, "utf8");
    const baseline = JSON.parse(content);
    if (!baseline || !Array.isArray(baseline.entries)) return null;
    return baseline;
  } catch (err) {
    console.error(`[generate-test-registry] Failed to load baseline: ${sanitizeError(err)}`);
    return null;
  }
}

/**
 * Auto-clean baseline entries for deleted scripts (D#80).
 * @param {{ version: number, description: string, created: string, entries: Array<{path: string, lines: number}> }} baseline
 * @returns {boolean} Whether baseline was modified
 */
function autoCleanBaseline(baseline) {
  const originalCount = baseline.entries.length;
  baseline.entries = baseline.entries.filter((entry) => {
    const absPath = path.join(ROOT, entry.path);
    return fs.existsSync(absPath);
  });
  const removed = originalCount - baseline.entries.length;
  if (removed > 0) {
    console.log(`  Baseline auto-cleaned: removed ${removed} entries for deleted scripts`);
    try {
      safeWriteFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8");
    } catch (err) {
      console.error(
        `[generate-test-registry] Failed to write cleaned baseline: ${sanitizeError(err)}`
      );
    }
    return true;
  }
  return false;
}

/**
 * Run --check-coverage mode.
 * Scans covered directories, compares against test inventory,
 * reads .test-baseline.json to exclude known gaps.
 * Exits non-zero if NEW untested files found (not in baseline).
 *
 * @param {RegistryEntry[]} registryEntries - Current registry entries
 * @returns {number} Exit code (0 = pass, 1 = new gaps found)
 */
function checkCoverage(registryEntries) {
  console.log("Test Coverage Completeness Check");
  console.log("================================\n");

  // 1. Scan all source scripts in covered directories
  const allScripts = scanCoveredScripts();
  console.log(`Scripts in covered directories: ${allScripts.length}`);

  // 2. Find scripts without tests
  const testEntries = registryEntries.filter((e) => e.source_type === "test_file");
  const untested = allScripts.filter((s) => !hasTest(s, testEntries));
  console.log(`Scripts without tests: ${untested.length}`);

  // 3. Load baseline and auto-clean deleted entries
  const baseline = loadBaseline();
  if (baseline) {
    autoCleanBaseline(baseline);
    const baselineSet = new Set(baseline.entries.map((e) => e.path));
    const newGaps = untested.filter((s) => !baselineSet.has(s));
    const knownGaps = untested.filter((s) => baselineSet.has(s));

    console.log(`Known gaps (in baseline): ${knownGaps.length}`);
    console.log(`NEW gaps (not in baseline): ${newGaps.length}\n`);

    if (newGaps.length > 0) {
      console.log("NEW untested scripts (not in .test-baseline.json):");
      for (const gap of newGaps.sort()) {
        let lines = 0;
        try {
          lines = fs.readFileSync(path.join(ROOT, gap), "utf8").split("\n").length;
        } catch {
          // ignore
        }
        console.log(`  ${gap} (${lines} lines)`);
      }
      console.log("\nTo fix: add tests for these scripts, or add them to .test-baseline.json");
      return 1;
    }

    console.log("PASS: No new untested scripts found.");
    if (knownGaps.length > 0) {
      console.log(`\nBaseline gaps remaining (${knownGaps.length}):`);
      for (const gap of knownGaps.sort().slice(0, 10)) {
        console.log(`  ${gap}`);
      }
      if (knownGaps.length > 10) {
        console.log(`  ... and ${knownGaps.length - 10} more`);
      }
    }
    return 0;
  }

  // No baseline file — all untested scripts are gaps
  if (untested.length > 0) {
    console.log("\nNo .test-baseline.json found. All untested scripts are gaps:");
    for (const gap of untested.sort()) {
      let lines = 0;
      try {
        lines = fs.readFileSync(path.join(ROOT, gap), "utf8").split("\n").length;
      } catch {
        // ignore
      }
      console.log(`  ${gap} (${lines} lines)`);
    }
    console.log("\nCreate .test-baseline.json to acknowledge known gaps.");
    return 1;
  }

  console.log("PASS: All scripts have tests.");
  return 0;
}

// =========================================================
// Main
// =========================================================

function main() {
  const args = process.argv.slice(2);
  const isCheckCoverage = args.includes("--check-coverage");

  try {
    const allEntries = [
      ...scanTestFiles(),
      ...scanAuditCheckers(),
      ...scanTestProtocols(),
      ...scanSkillCommands(),
      ...scanNpmValidators(),
      ...scanCiSteps(),
      ...scanHealthCheckers(),
    ];

    // Deduplicate by stable key
    const seen = new Set();
    const uniqueEntries = allEntries.filter((e) => {
      const key = `${e.source_type}::${e.path}::${e.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!isCheckCoverage) {
      // Ensure output directory exists
      const outDir = path.dirname(OUTPUT);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Write JSONL (symlink-guarded via safe-fs)
      const jsonl = uniqueEntries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      safeWriteFileSync(OUTPUT, jsonl, "utf8");

      // Summary
      const dupes = allEntries.length - uniqueEntries.length;
      const byType = {};
      for (const e of uniqueEntries) {
        byType[e.source_type] = (byType[e.source_type] || 0) + 1;
      }

      console.log(`Test registry generated: ${path.relative(ROOT, OUTPUT)}`);
      const dupeSuffix = dupes > 0 ? ` (${dupes} duplicates removed)` : "";
      console.log(`Total entries: ${uniqueEntries.length}${dupeSuffix}`);
      console.log("By source type:");
      for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count}`);
      }
    } else {
      // --check-coverage mode
      const exitCode = checkCoverage(uniqueEntries);
      process.exit(exitCode);
    }
  } catch (err) {
    console.error(`[generate-test-registry] ${sanitizeError(err)}`);
    process.exit(1);
  }
}

main();
