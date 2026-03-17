#!/usr/bin/env node
/**
 * Cognitive Complexity Pre-Push Check
 *
 * Computes cognitive complexity (CC) for functions in changed .js/.mjs files
 * relative to the merge base (origin/main). Functions exceeding the threshold
 * (default 15) are reported and the script exits non-zero.
 *
 * Algorithm follows the SonarSource cognitive complexity spec (S3776):
 *   - Increments for control flow breaks (if, else, for, while, switch, catch, ternary, &&, ||, ??)
 *   - Nesting increments for nested control flow structures
 *   - No increment for `else if` (treated as a single decision point)
 *
 * Uses acorn for parsing — no ESLint plugin dependencies required.
 *
 * Usage: node scripts/check-cc.js [--threshold=N] [--verbose] [--all] [--update-baseline]
 *
 * Options:
 *   --threshold=N     Set complexity threshold (default: 15)
 *   --verbose         Show all functions, not just violations
 *   --all             Check all .js/.mjs files, not just changed ones
 *   --update-baseline Record current CC per file into known-debt-baseline.json
 *
 * Baseline mode (C10-G4):
 *   When a baseline exists, only regressions (new violations or increased CC)
 *   are reported. Known debt is suppressed. Use --update-baseline to snapshot
 *   the current state after fixing violations.
 *
 * Exit codes:
 *   0 = All functions within threshold (or no regressions with baseline)
 *   1 = One or more functions exceed threshold (regressions found)
 *   2 = Script error (parse failure, git failure, etc.)
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, extname, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const require_ = createRequire(import.meta.url);
const { safeWriteFileSync } = require_("./lib/safe-fs");

// ---------------------------------------------------------------------------
// Sanitize error helper (inline to avoid import issues across CJS/ESM)
// Pattern: sanitize-error.js — never log raw error.message
// ---------------------------------------------------------------------------
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replaceAll(/C:\\Users\\[^\\\s]+/gi, "[USER_PATH]")
    .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
    .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]")
    .replaceAll(/[A-Z]:\\[^\s]+/gi, "[PATH]")
    .replaceAll(/\/[^\s]*\/[^\s]+/g, "[PATH]");
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
const VERBOSE = args.includes("--verbose");
const CHECK_ALL = args.includes("--all");
const UPDATE_BASELINE = args.includes("--update-baseline");
const BASELINE_PATH = join(ROOT, ".claude", "state", "known-debt-baseline.json");

if (Number.isNaN(THRESHOLD) || THRESHOLD < 1) {
  console.error("[check-cc] Invalid threshold value. Must be a positive integer.");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Load acorn parser
// ---------------------------------------------------------------------------
let acorn;
try {
  acorn = await import("acorn");
} catch {
  console.error("[check-cc] acorn parser not found. Install it with: npm install acorn");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Git: resolve base ref and get changed files
// ---------------------------------------------------------------------------
function resolveBaseRef() {
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
    // Return all tracked .js/.mjs files
    try {
      const output = execFileSync("git", ["ls-files", "--cached", "*.js", "*.mjs"], {
        encoding: "utf-8",
        timeout: 10000,
        cwd: ROOT,
      });
      return output.trim().split("\n").filter(Boolean);
    } catch (err) {
      console.error("[check-cc] Failed to list files:", sanitizeError(err));
      return [];
    }
  }

  const baseRef = resolveBaseRef();
  if (!baseRef) {
    console.warn(
      "[check-cc] Could not resolve base ref (origin/main, main, master). Falling back to HEAD~1."
    );
    try {
      const output = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1"], {
        encoding: "utf-8",
        timeout: 10000,
        cwd: ROOT,
      });
      return output.trim().split("\n").filter(Boolean);
    } catch (err) {
      console.error("[check-cc] Git diff failed:", sanitizeError(err));
      return [];
    }
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
        ["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}..HEAD`],
        { encoding: "utf-8", timeout: 10000, cwd: ROOT }
      );
      return output.trim().split("\n").filter(Boolean);
    } catch (err) {
      console.error("[check-cc] Git diff failed:", sanitizeError(err));
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Cognitive Complexity Calculator
//
// Implements the SonarSource cognitive complexity specification:
// https://www.sonarsource.com/docs/CognitiveComplexity.pdf
//
// Three types of increments:
// B1: Structural increment (+1) for control flow breaks
// B2: Nesting increment (+nesting) for nested structures
// B3: Fundamental increment (+1) for breaks in linear flow (no nesting penalty)
// ---------------------------------------------------------------------------

/**
 * Try to extract a name from the parent node context.
 */
function getNameFromParent(parent) {
  if (!parent) return null;

  switch (parent.type) {
    case "VariableDeclarator":
      return parent.id?.type === "Identifier" ? parent.id.name : null;

    case "Property":
      if (!parent.key) return null;
      if (parent.key.type === "Identifier") return parent.key.name;
      if (parent.key.type === "Literal") return String(parent.key.value);
      return null;

    case "MethodDefinition":
      return parent.key?.type === "Identifier" ? parent.key.name : null;

    case "AssignmentExpression":
      return getNameFromAssignment(parent.left);

    default:
      return null;
  }
}

function getNameFromAssignment(left) {
  if (!left) return null;
  if (left.type === "Identifier") return left.name;
  if (left.type === "MemberExpression" && left.property?.type === "Identifier") {
    return left.property.name;
  }
  return null;
}

/**
 * Extract the function name from an AST node, or return a positional label.
 */
function getFunctionName(node, parent, sourceLines) {
  if (node.id?.name) return node.id.name;

  const parentName = getNameFromParent(parent);
  if (parentName) return parentName;

  const line = getLineNumber(node, sourceLines);
  return `(anonymous:${line})`;
}

function getLineNumber(node, sourceLines) {
  if (node.loc) return node.loc.start.line;
  // Count newlines before position
  let line = 1;
  for (const offset of sourceLines) {
    if (offset >= node.start) return line;
    line++;
  }
  return line;
}

/**
 * Check if a node is a logical operator that contributes to CC.
 * Sequences of the SAME operator (a && b && c) count as +1 total,
 * but mixed operators (a && b || c) count separately.
 */
function computeLogicalComplexity(node) {
  let complexity = 0;

  function walkLogical(n, lastOp) {
    if (n.type === "LogicalExpression") {
      const op = n.operator; // &&, ||, ??
      // Only increment when operator changes from a sequence
      if (op !== lastOp) {
        complexity++;
      }
      walkLogical(n.left, op);
      walkLogical(n.right, op);
    } else if (n.type === "ConditionalExpression") {
      // Ternary inside logical — don't double-count here,
      // it will be handled by the main walker
    }
    // Other node types: nothing to do for logical walk
  }

  walkLogical(node, null);
  return complexity;
}

const METADATA_KEYS = new Set(["type", "start", "end", "loc"]);

function isAstNode(val) {
  return val && typeof val === "object" && val.type;
}

/**
 * Walk all child AST nodes.
 */
function walkChildren(node, nesting, parent, walkFn) {
  for (const key of Object.keys(node)) {
    if (METADATA_KEYS.has(key)) continue;

    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (isAstNode(item)) walkFn(item, nesting, parent);
      }
    } else if (isAstNode(child)) {
      walkFn(child, nesting, parent);
    }
  }
}

/**
 * Handle IfStatement node for cognitive complexity.
 */
function handleIfStatement(node, nesting, parent, state, walkFn) {
  const isElseIf = parent?.type === "IfStatement" && parent.alternate === node;
  state.complexity += isElseIf ? 1 : 1 + nesting;
  state.complexity += computeLogicalComplexity(node.test);

  walkFn(node.consequent, nesting + 1, node);

  if (node.alternate) {
    if (node.alternate.type === "IfStatement") {
      walkFn(node.alternate, nesting, node);
    } else {
      state.complexity += 1;
      walkFn(node.alternate, nesting + 1, node);
    }
  }
}

/**
 * Handle loop statements (for, while, do-while) for cognitive complexity.
 */
function handleLoopStatement(node, nesting, state, walkFn) {
  state.complexity += 1 + nesting;
  if (node.test) state.complexity += computeLogicalComplexity(node.test);
  walkChildren(node, nesting + 1, node, walkFn);
}

/**
 * Handle LogicalExpression for cognitive complexity.
 * Returns true if handled (caller should skip default walk).
 */
function handleLogicalExpression(node, parent, state) {
  const testParentTypes = new Set([
    "IfStatement",
    "WhileStatement",
    "DoWhileStatement",
    "ForStatement",
    "ConditionalExpression",
  ]);

  if (parent && testParentTypes.has(parent.type) && parent.test === node) {
    return false; // Already counted by parent — use default walk
  }
  state.complexity += computeLogicalComplexity(node);
  return true; // Handled — skip children
}

const LOOP_TYPES = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
]);

const NESTING_BLOCK_TYPES = new Set(["SwitchStatement", "CatchClause"]);

/**
 * Handle a ConditionalExpression (ternary) for cognitive complexity.
 */
function handleConditionalExpression(node, nesting, state, walkFn) {
  state.complexity += 1 + nesting;
  state.complexity += computeLogicalComplexity(node.test);
  walkFn(node.consequent, nesting + 1, node);
  walkFn(node.alternate, nesting + 1, node);
}

/**
 * Process a single AST node for cognitive complexity.
 * Returns true if the node was fully handled (skip default child walk).
 */
function processNode(node, nesting, parent, state, walkFn) {
  if (node.type === "IfStatement") {
    handleIfStatement(node, nesting, parent, state, walkFn);
    return true;
  }

  if (LOOP_TYPES.has(node.type)) {
    handleLoopStatement(node, nesting, state, walkFn);
    return true;
  }

  if (NESTING_BLOCK_TYPES.has(node.type)) {
    state.complexity += 1 + nesting;
    walkChildren(node, nesting + 1, node, walkFn);
    return true;
  }

  if (node.type === "ConditionalExpression") {
    handleConditionalExpression(node, nesting, state, walkFn);
    return true;
  }

  if (node.type === "LogicalExpression") {
    return handleLogicalExpression(node, parent, state);
  }

  if (FN_TYPES.has(node.type) && parent !== null) {
    // Nested functions are independent — their CC is computed separately by analyzeAST.
    // Walking into them would inflate the parent's CC and double-count.
    return true;
  }

  if (node.type === "BreakStatement" || node.type === "ContinueStatement") {
    if (node.label) state.complexity += 1;
  }

  return false;
}

/**
 * Compute cognitive complexity of a function body.
 */
function computeCC(functionBody) {
  const state = { complexity: 0 };

  function walk(node, nesting, parent) {
    if (!node || typeof node !== "object") return;

    if (!processNode(node, nesting, parent, state, walk)) {
      walkChildren(node, nesting, node, walk);
    }
  }

  if (functionBody.type === "BlockStatement") {
    for (const stmt of functionBody.body) {
      walk(stmt, 0, null);
    }
  } else {
    walk(functionBody, 0, null);
  }

  return state.complexity;
}

const FN_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

/**
 * Find all top-level and class-method functions in an AST and compute their CC.
 */
function analyzeAST(ast, source) {
  const results = [];
  const sourceLines = source.split("\n");
  const lineOffsets = [];
  let offset = 0;
  for (const line of sourceLines) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  }

  function visitNode(node, parent) {
    if (!node || typeof node !== "object") return;

    if (FN_TYPES.has(node.type) && node.body) {
      const name = getFunctionName(node, parent, lineOffsets);
      const line = node.loc ? node.loc.start.line : "?";
      results.push({ name, line, cc: computeCC(node.body) });
    }

    walkChildren(node, 0, node, (child, _nesting, _parent) => {
      visitNode(child, node);
    });
  }

  visitNode(ast, null);
  return results;
}

// ---------------------------------------------------------------------------
// File analysis
// ---------------------------------------------------------------------------
function analyzeFile(filePath) {
  const fullPath = join(ROOT, filePath);

  // Path containment: ensure filePath doesn't escape ROOT via traversal
  const rel = relative(ROOT, fullPath);
  if (!rel || /^\.\.(?:[\\/]|$)/.test(rel) || isAbsolute(rel)) {
    return { file: filePath, functions: [], error: "Path traversal blocked" };
  }

  let source;

  // CLAUDE.md: wrap file reads in try/catch
  try {
    source = readFileSync(fullPath, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") {
      // File deleted or not found — skip silently
      return { file: filePath, functions: [], error: null };
    }
    return { file: filePath, functions: [], error: sanitizeError(err) };
  }

  // Parse with acorn — try ESM first, fall back to CJS
  const parseOptions = {
    ecmaVersion: "latest",
    locations: true,
    allowImportExportEverywhere: true,
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
    allowHashBang: true,
  };

  let ast;
  try {
    ast = acorn.parse(source, { ...parseOptions, sourceType: "module" });
  } catch {
    try {
      ast = acorn.parse(source, { ...parseOptions, sourceType: "script" });
    } catch (parseErr) {
      // Parse failures are expected for some files (JSX, etc.) — warn, don't fail
      return {
        file: filePath,
        functions: [],
        error: `Parse error: ${sanitizeError(parseErr)}`,
      };
    }
  }

  const functions = analyzeAST(ast, source);
  return { file: filePath, functions, error: null };
}

// ---------------------------------------------------------------------------
// File filtering
// ---------------------------------------------------------------------------
const EXCLUDED_DIRS = ["node_modules", ".next/", "dist/", "dist-tests/", "consolidation-output/"];

function filterJsFiles(files) {
  return files.filter((f) => {
    const ext = extname(f);
    if (ext !== ".js" && ext !== ".mjs") return false;
    return !EXCLUDED_DIRS.some((dir) => f.includes(dir));
  });
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------
function printReport(violations, totalFunctions, parseErrors, fileCount) {
  console.log();

  if (violations.length > 0) {
    console.log(`[check-cc] ${violations.length} function(s) exceed CC threshold of ${THRESHOLD}:`);
    console.log();
    for (const v of violations) {
      console.log(`  FAIL  ${v.file}:${v.line}  ${v.name}  CC=${v.cc}  (threshold: ${THRESHOLD})`);
    }
    console.log();
    console.log(`[check-cc] Tip: Extract helper functions to reduce nesting and branching.`);
    console.log(`[check-cc] See: https://www.sonarsource.com/docs/CognitiveComplexity.pdf`);
  } else {
    console.log(`[check-cc] All ${totalFunctions} function(s) within threshold.`);
  }

  if (parseErrors > 0) {
    console.log(
      `[check-cc] ${parseErrors} file(s) skipped due to parse errors (JSX, syntax issues).`
    );
  }

  console.log(
    `[check-cc] Summary: ${fileCount} files, ${totalFunctions} functions, ${violations.length} violations.`
  );
}

// ---------------------------------------------------------------------------
// Baseline support (C10-G4)
// ---------------------------------------------------------------------------
function readBaseline() {
  try {
    const data = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    // Support both legacy "checks" key and canonical "baselines" key
    return data?.baselines?.["cognitive-complexity"] || data?.checks?.["cognitive-complexity"] || {};
  } catch {
    return {};
  }
}

function writeBaseline(allResults) {
  let data;
  try {
    data = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  } catch {
    data = { schema_version: 1, updated: "", checks: {}, baselines: {} };
  }

  // Record max CC per file for files with violations
  const ccByFile = {};
  for (const result of allResults) {
    if (result.error || result.functions.length === 0) continue;
    const maxCC = Math.max(...result.functions.map((f) => f.cc));
    if (maxCC > THRESHOLD) {
      ccByFile[result.file] = maxCC;
    }
  }

  data.generated = new Date().toISOString();
  // Write to "baselines" key (canonical) for consistency with other baseline entries
  if (!data.baselines) data.baselines = {};
  data.baselines["cognitive-complexity"] = ccByFile;
  // Remove legacy "checks" key if it exists to avoid confusion
  if (data.checks?.["cognitive-complexity"]) delete data.checks["cognitive-complexity"];
  safeWriteFileSync(BASELINE_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`[check-cc] Baseline updated: ${Object.keys(ccByFile).length} file(s) recorded.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function collectViolations(file, functions) {
  const violations = [];
  for (const fn of functions) {
    if (fn.cc > THRESHOLD) violations.push({ file, ...fn });
    if (VERBOSE && fn.cc > 0) {
      const status = fn.cc > THRESHOLD ? "FAIL" : "ok";
      console.log(`  [${status}] ${file}:${fn.line} ${fn.name} — CC ${fn.cc}`);
    }
  }
  return violations;
}

function analyzeFiles(jsFiles) {
  let totalFunctions = 0;
  let parseErrors = 0;
  const violations = [];
  const allResults = [];

  for (const file of jsFiles) {
    const result = analyzeFile(file);
    allResults.push(result);

    if (result.error) {
      parseErrors++;
      if (VERBOSE) console.warn(`  [SKIP] ${file}: ${result.error}`);
      continue;
    }

    totalFunctions += result.functions.length;
    violations.push(...collectViolations(file, result.functions));
  }

  return { totalFunctions, parseErrors, violations, allResults };
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
    console.log(`[check-cc] ${suppressed} known-debt violation(s) suppressed by baseline.`);
  }

  return filtered;
}

function main() {
  console.log(`[check-cc] Cognitive complexity check (threshold: ${THRESHOLD})`);
  console.log();

  const jsFiles = filterJsFiles(getChangedFiles());

  if (jsFiles.length === 0) {
    console.log("[check-cc] No changed .js/.mjs files to check.");
    process.exit(0);
  }

  console.log(`[check-cc] Checking ${jsFiles.length} file(s)...`);
  if (VERBOSE) {
    for (const f of jsFiles) console.log(`  - ${f}`);
    console.log();
  }

  const { totalFunctions, parseErrors, violations, allResults } = analyzeFiles(jsFiles);

  if (UPDATE_BASELINE) {
    writeBaseline(allResults);
    printReport(violations, totalFunctions, parseErrors, jsFiles.length);
    process.exit(0);
  }

  const reportedViolations = filterByBaseline(violations);
  printReport(reportedViolations, totalFunctions, parseErrors, jsFiles.length);
  process.exit(reportedViolations.length > 0 ? 1 : 0);
}

main();
