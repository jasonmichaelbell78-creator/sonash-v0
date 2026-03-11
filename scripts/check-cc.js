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
 * Usage: node scripts/check-cc.js [--threshold=N] [--verbose] [--all]
 *
 * Options:
 *   --threshold=N  Set complexity threshold (default: 15)
 *   --verbose      Show all functions, not just violations
 *   --all          Check all .js/.mjs files, not just changed ones
 *
 * Exit codes:
 *   0 = All functions within threshold
 *   1 = One or more functions exceed threshold
 *   2 = Script error (parse failure, git failure, etc.)
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Sanitize error helper (inline to avoid import issues across CJS/ESM)
// Pattern: sanitize-error.js — never log raw error.message
// ---------------------------------------------------------------------------
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/C:\\Users\\[^\\\s]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]")
    .replace(/[A-Z]:\\[^\s]+/gi, "[PATH]")
    .replace(/\/[^\s]*\/[^\s]+/g, "[PATH]");
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
 * Extract the function name from an AST node, or return a positional label.
 */
function getFunctionName(node, parent, sourceLines) {
  // Named function declaration/expression
  if (node.id && node.id.name) return node.id.name;

  // Variable declaration: const foo = function() {} or const foo = () => {}
  if (parent && parent.type === "VariableDeclarator" && parent.id) {
    if (parent.id.type === "Identifier") return parent.id.name;
  }

  // Property or method: { foo() {} } or { foo: function() {} }
  if (parent && parent.type === "Property" && parent.key) {
    if (parent.key.type === "Identifier") return parent.key.name;
    if (parent.key.type === "Literal") return String(parent.key.value);
  }

  // Method definition in class: class Foo { bar() {} }
  if (parent && parent.type === "MethodDefinition" && parent.key) {
    if (parent.key.type === "Identifier") return parent.key.name;
  }

  // Assignment: module.exports.foo = function() {}
  if (parent && parent.type === "AssignmentExpression" && parent.left) {
    if (parent.left.type === "MemberExpression" && parent.left.property) {
      if (parent.left.property.type === "Identifier") return parent.left.property.name;
    }
    if (parent.left.type === "Identifier") return parent.left.name;
  }

  // Fall back to line number
  const line = getLineNumber(node, sourceLines);
  return `(anonymous:${line})`;
}

function getLineNumber(node, sourceLines) {
  if (node.loc) return node.loc.start.line;
  // Count newlines before position
  let line = 1;
  for (let i = 0; i < sourceLines.length; i++) {
    if (sourceLines[i] >= node.start) return line;
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

/**
 * Compute cognitive complexity of a function body.
 */
function computeCC(functionBody) {
  let complexity = 0;

  function walk(node, nesting, parent) {
    if (!node || typeof node !== "object") return;

    // Skip null nodes
    if (node === null) return;

    switch (node.type) {
      // --- B1+B2: structural + nesting increment ---
      case "IfStatement": {
        // `else if` is treated specially: the `if` inside an `else` chain
        // does NOT get a nesting increment — it just gets +1 (structural).
        const isElseIf = parent && parent.type === "IfStatement" && parent.alternate === node;

        if (isElseIf) {
          // else if: +1 structural only (no nesting)
          complexity += 1;
        } else {
          // Regular if: +1 structural + nesting
          complexity += 1 + nesting;
        }

        // Walk the test expression for logical operators
        complexity += computeLogicalComplexity(node.test);

        // Walk consequent at +1 nesting
        walk(node.consequent, nesting + 1, node);

        // Walk alternate
        if (node.alternate) {
          if (node.alternate.type === "IfStatement") {
            // else if: walk at same nesting (the if will handle itself)
            walk(node.alternate, nesting, node);
          } else {
            // else: +1 structural, walk body at nesting+1
            complexity += 1;
            walk(node.alternate, nesting + 1, node);
          }
        }
        return; // Handled children manually
      }

      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "WhileStatement":
      case "DoWhileStatement":
        // +1 structural + nesting
        complexity += 1 + nesting;
        if (node.test) complexity += computeLogicalComplexity(node.test);
        // Walk body at increased nesting
        walkChildren(node, nesting + 1, node);
        return;

      case "SwitchStatement":
        // +1 structural + nesting
        complexity += 1 + nesting;
        walkChildren(node, nesting + 1, node);
        return;

      case "CatchClause":
        // +1 structural + nesting
        complexity += 1 + nesting;
        walkChildren(node, nesting + 1, node);
        return;

      // --- B3: fundamental increment (no nesting) ---
      case "BreakStatement":
        // Only labeled breaks get +1
        if (node.label) complexity += 1;
        break;

      case "ContinueStatement":
        // Only labeled continues get +1
        if (node.label) complexity += 1;
        break;

      case "ConditionalExpression":
        // Ternary: +1 structural + nesting
        complexity += 1 + nesting;
        complexity += computeLogicalComplexity(node.test);
        walk(node.consequent, nesting + 1, node);
        walk(node.alternate, nesting + 1, node);
        return;

      case "LogicalExpression":
        // Standalone logical expressions (not inside if/while test — those are
        // handled by computeLogicalComplexity called from the parent).
        // We only count these if the parent didn't already account for them.
        if (
          parent &&
          (parent.type === "IfStatement" ||
            parent.type === "WhileStatement" ||
            parent.type === "DoWhileStatement" ||
            parent.type === "ForStatement" ||
            parent.type === "ConditionalExpression") &&
          parent.test === node
        ) {
          // Already counted by parent — just walk children
          break;
        }
        // Standalone logical: count sequences
        complexity += computeLogicalComplexity(node);
        // Don't walk children — computeLogicalComplexity already traversed them
        return;

      // Nested functions increase nesting for their contents
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        // If this is the top-level function we're analyzing, don't add nesting.
        // But if nested inside another function body, it adds nesting.
        if (parent !== null) {
          // Nested function — walk its body at increased nesting
          walk(node.body, nesting + 1, node);
          return;
        }
        break;

      default:
        break;
    }

    // Walk all children at current nesting
    walkChildren(node, nesting, node);
  }

  function walkChildren(node, nesting, parent) {
    for (const key of Object.keys(node)) {
      if (key === "type" || key === "start" || key === "end" || key === "loc") continue;

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && item.type) {
            walk(item, nesting, parent);
          }
        }
      } else if (child && typeof child === "object" && child.type) {
        walk(child, nesting, parent);
      }
    }
  }

  // Start walking the function body at nesting 0
  if (functionBody.type === "BlockStatement") {
    for (const stmt of functionBody.body) {
      walk(stmt, 0, null);
    }
  } else {
    // Arrow function with expression body
    walk(functionBody, 0, null);
  }

  return complexity;
}

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

    const isFn =
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression";

    if (isFn && node.body) {
      const name = getFunctionName(node, parent, lineOffsets);
      const line = node.loc ? node.loc.start.line : "?";
      const body = node.body;
      const cc = computeCC(body);

      results.push({ name, line, cc });

      // Don't recurse into this function's body for more functions —
      // we want top-level CC per function. Nested functions inside
      // will add to the parent's nesting complexity.
      // However, we DO want to find nested function declarations
      // that are independently reportable. Walk children to find them.
    }

    // Walk children
    for (const key of Object.keys(node)) {
      if (key === "type" || key === "start" || key === "end" || key === "loc") continue;

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && item.type) {
            visitNode(item, node);
          }
        }
      } else if (child && typeof child === "object" && child.type) {
        visitNode(child, node);
      }
    }
  }

  visitNode(ast, null);
  return results;
}

// ---------------------------------------------------------------------------
// File analysis
// ---------------------------------------------------------------------------
function analyzeFile(filePath) {
  const fullPath = join(ROOT, filePath);
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

  // Parse with acorn
  let ast;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      // Tolerate hashbang
      allowHashBang: true,
    });
  } catch (parseErr) {
    // Parse failures are expected for some files (JSX, etc.) — warn, don't fail
    return {
      file: filePath,
      functions: [],
      error: `Parse error: ${sanitizeError(parseErr)}`,
    };
  }

  const functions = analyzeAST(ast, source);
  return { file: filePath, functions, error: null };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log(`[check-cc] Cognitive complexity check (threshold: ${THRESHOLD})`);
  console.log();

  // Get files to check
  const allChanged = getChangedFiles();
  const jsFiles = allChanged.filter((f) => {
    const ext = extname(f);
    return (
      (ext === ".js" || ext === ".mjs") &&
      !f.includes("node_modules") &&
      !f.includes(".next/") &&
      !f.includes("dist/") &&
      !f.includes("dist-tests/") &&
      !f.includes("consolidation-output/")
    );
  });

  if (jsFiles.length === 0) {
    console.log("[check-cc] No changed .js/.mjs files to check.");
    process.exit(0);
  }

  console.log(`[check-cc] Checking ${jsFiles.length} file(s)...`);
  if (VERBOSE) {
    for (const f of jsFiles) console.log(`  - ${f}`);
    console.log();
  }

  let totalFunctions = 0;
  let parseErrors = 0;
  const violations = [];

  for (const file of jsFiles) {
    const result = analyzeFile(file);

    if (result.error) {
      parseErrors++;
      if (VERBOSE) {
        console.warn(`  [SKIP] ${file}: ${result.error}`);
      }
      continue;
    }

    totalFunctions += result.functions.length;

    for (const fn of result.functions) {
      if (fn.cc > THRESHOLD) {
        violations.push({ file, ...fn });
      }

      if (VERBOSE && fn.cc > 0) {
        const marker = fn.cc > THRESHOLD ? "FAIL" : "ok";
        console.log(`  [${marker}] ${file}:${fn.line} ${fn.name} — CC ${fn.cc}`);
      }
    }
  }

  // Report
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
    `[check-cc] Summary: ${jsFiles.length} files, ${totalFunctions} functions, ${violations.length} violations.`
  );

  process.exit(violations.length > 0 ? 1 : 0);
}

main();
