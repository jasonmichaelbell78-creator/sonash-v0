#!/usr/bin/env node
/**
 * add-false-positive.js - Add new entries to the FALSE_POSITIVES.jsonl database
 *
 * Usage:
 *   node scripts/add-false-positive.js --pattern "regex" --category "security|code|documentation|performance|schema" --reason "why this is a false positive"
 *   node scripts/add-false-positive.js --interactive
 *   node scripts/add-false-positive.js --list
 *   node scripts/add-false-positive.js --list --category security
 *
 * Options:
 *   --pattern     Regex pattern to match false positive (required unless --list or --interactive)
 *   --category    Category: security, code, documentation, performance, schema, refactoring, process
 *   --reason      Explanation of why this is a false positive
 *   --source      Optional source reference (e.g., "AI_REVIEW_LEARNINGS_LOG.md#review-103")
 *   --expires     Optional expiration date (YYYY-MM-DD) for temporary false positives
 *   --list        List all false positives (optionally filtered by --category)
 *   --interactive Interactive mode for adding entries
 */

import node_fs from "node:fs";
import node_path from "node:path";
import node_url from "node:url";
import node_readline from "node:readline";

const __filename = node_url.fileURLToPath(import.meta.url);
const __dirname = node_path.dirname(__filename);

const FP_FILE = node_path.join(__dirname, "..", "docs", "audits", "FALSE_POSITIVES.jsonl");

const VALID_CATEGORIES = [
  "security",
  "code",
  "documentation",
  "performance",
  "schema",
  "refactoring",
  "process",
];

/**
 * Validate that a string is a valid regex pattern
 * @param {string} pattern - The pattern to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateRegexPattern(pattern) {
  if (!pattern || typeof pattern !== "string") {
    return { valid: false, error: "Pattern must be a non-empty string" };
  }
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Invalid regex: ${err.message}` };
  }
}

/**
 * Heuristic check for potentially unsafe regex patterns (ReDoS protection)
 * Prevents common catastrophic backtracking patterns
 * @param {string} pattern - Regex pattern to check
 * @returns {boolean} True if pattern appears unsafe
 */
function isLikelyUnsafeRegex(pattern) {
  if (typeof pattern !== "string") return true;
  // Length limit to prevent very large patterns
  if (pattern.length > 500) return true;
  // Nested quantifiers like (a+)+, (.*)+, ([\s\S]*)* etc.
  if (/\((?:[^()]|\\.){0,200}[+*?](?:[^()]|\\.){0,200}\)[+*?]/.test(pattern)) return true;
  // Extremely broad dot-star with additional quantifiers
  if (/(?:\.\*|\[\s\S\]\*)[+*?]/.test(pattern)) return true;
  return false;
}

/**
 * Validate that a string is a valid YYYY-MM-DD date
 * @param {string} dateStr - The date string to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateDateFormat(dateStr) {
  if (!dateStr) return { valid: true }; // Optional field
  if (typeof dateStr !== "string") {
    return { valid: false, error: "Date must be a string" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, error: "Date must be in YYYY-MM-DD format" };
  }
  const timestamp = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  if (Number.isNaN(timestamp)) {
    return { valid: false, error: "Invalid date value" };
  }
  return { valid: true };
}

/**
 * Load false positives from JSONL file with fault-tolerant parsing
 * Skips malformed lines instead of crashing
 * @returns {Array<Object>} Array of false positive entries
 */
function loadFalsePositives() {
  if (!node_fs.existsSync(FP_FILE)) {
    return [];
  }
  const content = node_fs.readFileSync(FP_FILE, "utf8");
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch {
        const truncated = line.length > 80 ? line.slice(0, 80) + "..." : line;
        console.warn(`⚠️  Skipping invalid JSONL at ${FP_FILE}:${idx + 1}`);
        console.warn(`   Raw: ${truncated}`);
        return null;
      }
    })
    .filter(Boolean);
}

function saveFalsePositive(entry) {
  const existing = loadFalsePositives();
  const maxId = existing.reduce((max, fp) => {
    // Guard against malformed entries without id or non-string id
    if (!fp || typeof fp.id !== "string") return max;
    const match = fp.id.match(/^FP-(\d+)$/);
    if (!match) return max;
    const num = Number.parseInt(match[1], 10);
    return Number.isNaN(num) ? max : Math.max(num, max);
  }, 0);

  entry.id = `FP-${String(maxId + 1).padStart(3, "0")}`;
  entry.added = new Date().toISOString().split("T")[0];

  node_fs.appendFileSync(FP_FILE, JSON.stringify(entry) + "\n");
  return entry;
}

function listFalsePositives(categoryFilter) {
  const fps = loadFalsePositives();
  const filtered = categoryFilter ? fps.filter((fp) => fp.category === categoryFilter) : fps;

  if (filtered.length === 0) {
    console.log(
      categoryFilter
        ? `No false positives found for category: ${categoryFilter}`
        : "No false positives found"
    );
    return;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`FALSE POSITIVES DATABASE (${filtered.length} entries)`);
  console.log(`${"=".repeat(80)}\n`);

  const byCategory = {};
  for (const fp of filtered) {
    if (!byCategory[fp.category]) byCategory[fp.category] = [];
    byCategory[fp.category].push(fp);
  }

  for (const [category, entries] of Object.entries(byCategory)) {
    console.log(`\n## ${category.toUpperCase()} (${entries.length})\n`);
    for (const fp of entries) {
      console.log(`  ${fp.id}: ${fp.pattern}`);
      console.log(`       Reason: ${fp.reason}`);
      if (fp.source) console.log(`       Source: ${fp.source}`);
      if (fp.expires) console.log(`       Expires: ${fp.expires}`);
      console.log("");
    }
  }
}

async function interactiveMode() {
  const rl = node_readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  console.log("\n=== Add False Positive (Interactive Mode) ===\n");

  const pattern = await question("Pattern (regex): ");
  if (!pattern.trim()) {
    console.error("Error: Pattern is required");
    rl.close();
    process.exit(1);
  }

  // Validate pattern is valid regex
  const patternValidation = validateRegexPattern(pattern);
  if (!patternValidation.valid) {
    console.error(`Error: ${patternValidation.error}`);
    rl.close();
    process.exit(1);
  }

  // ReDoS protection
  if (isLikelyUnsafeRegex(pattern)) {
    console.error("Error: Pattern may cause ReDoS (nested quantifiers or unbounded repetition)");
    rl.close();
    process.exit(1);
  }

  console.log(`\nCategories: ${VALID_CATEGORIES.join(", ")}`);
  const category = await question("Category: ");
  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`Error: Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    rl.close();
    process.exit(1);
  }

  const reason = await question("Reason (why is this a false positive): ");
  if (!reason.trim()) {
    console.error("Error: Reason is required");
    rl.close();
    process.exit(1);
  }

  const source = await question(
    "Source reference (optional, e.g., AI_REVIEW_LEARNINGS_LOG.md#review-103): "
  );
  const expires = await question("Expiration date (optional, YYYY-MM-DD): ");

  rl.close();

  const entry = {
    pattern,
    category,
    reason,
    expires: expires.trim() || null,
  };
  if (source.trim()) entry.source = source.trim();

  const saved = saveFalsePositive(entry);
  console.log(`\n✅ Added false positive: ${saved.id}`);
  console.log(JSON.stringify(saved, null, 2));
}

// Value arguments that consume the next argument
const VALUE_ARGS = new Set(["--pattern", "--category", "--reason", "--source", "--expires"]);

/**
 * Process a single command-line argument
 * @param {string} arg - Current argument
 * @param {string|undefined} nextArg - Next argument (for value flags)
 * @param {object} parsed - Parsed arguments object
 * @returns {boolean} True if next arg was consumed
 */
function processArg(arg, nextArg, parsed) {
  // Handle boolean flags
  if (arg === "--list") {
    parsed.list = true;
    return false;
  }
  if (arg === "--interactive") {
    parsed.interactive = true;
    return false;
  }
  if (arg === "--help" || arg === "-h") {
    parsed.help = true;
    return false;
  }

  // Handle value flags
  if (VALUE_ARGS.has(arg)) {
    // Review #196: Reject missing values and avoid consuming the next flag as a value
    // Use --arg=value syntax if the value legitimately starts with '-'
    if (nextArg === undefined || nextArg.startsWith("-")) {
      throw new Error(`Missing value for ${arg} (use ${arg}=... if the value starts with '-')`);
    }
    const key = arg.slice(2); // Remove "--" prefix
    parsed[key] = nextArg;
    return true; // Consumed next arg
  }

  // Review #188: Support --key=value argument syntax
  if (arg.startsWith("--") && arg.includes("=")) {
    const [rawKey, ...rest] = arg.split("=");
    const value = rest.join("="); // Handle values that contain =
    if (VALUE_ARGS.has(rawKey)) {
      const key = rawKey.slice(2); // Remove -- prefix
      parsed[key] = value;
      return false; // Did not consume next arg
    }
  }

  // Review #186: Fail on unknown arguments to prevent silent failures
  if (arg.startsWith("-")) {
    throw new Error(`Unknown argument: ${arg}`);
  }

  // Review #187: Also fail on unexpected positional args to avoid silently ignoring user input
  throw new Error(`Unexpected positional argument: ${arg}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; ) {
    const consumed = processArg(args[i], args[i + 1], parsed);
    if (consumed) {
      i += 2; // Skip both current and next arg
    } else {
      i++; // Skip only current arg
    }
  }

  return parsed;
}

function showHelp() {
  console.log(`
add-false-positive.js - Add entries to the FALSE_POSITIVES.jsonl database

Usage:
  node scripts/add-false-positive.js --pattern "regex" --category "security" --reason "explanation"
  node scripts/add-false-positive.js --interactive
  node scripts/add-false-positive.js --list [--category <category>]

Options:
  --pattern     Regex pattern to match (required for adding)
  --category    Category: ${VALID_CATEGORIES.join(", ")}
  --reason      Why this is a false positive
  --source      Optional source reference
  --expires     Optional expiration date (YYYY-MM-DD)
  --list        List all false positives
  --interactive Add entry interactively
  --help        Show this help

Examples:
  # Add a new false positive
  node scripts/add-false-positive.js \\
    --pattern "console\\.log.*debug" \\
    --category "code" \\
    --reason "Debug logs in development files are intentional"

  # List all security false positives
  node scripts/add-false-positive.js --list --category security

  # Interactive mode
  node scripts/add-false-positive.js --interactive
`);
}

try {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.list) {
    listFalsePositives(args.category);
    process.exit(0);
  }

  if (args.interactive) {
    await interactiveMode();
    process.exit(0);
  }

  // Command-line mode
  if (!args.pattern) {
    console.error("Error: --pattern is required");
    showHelp();
    process.exit(1);
  }

  // Validate pattern is valid regex
  const patternValidation = validateRegexPattern(args.pattern);
  if (!patternValidation.valid) {
    console.error(`Error: ${patternValidation.error}`);
    process.exit(1);
  }

  // ReDoS protection: reject patterns with nested quantifiers or unbounded repetition
  if (isLikelyUnsafeRegex(args.pattern)) {
    console.error("Error: Pattern may cause ReDoS (nested quantifiers or unbounded repetition)");
    process.exit(1);
  }

  if (!args.category || !VALID_CATEGORIES.includes(args.category)) {
    console.error(`Error: --category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    process.exit(1);
  }
  if (!args.reason) {
    console.error("Error: --reason is required");
    process.exit(1);
  }

  // Validate expires date format if provided
  const dateValidation = validateDateFormat(args.expires);
  if (!dateValidation.valid) {
    console.error(`Error: --expires ${dateValidation.error}`);
    process.exit(1);
  }

  const entry = {
    pattern: args.pattern,
    category: args.category,
    reason: args.reason,
    expires: args.expires || null,
  };
  if (args.source) entry.source = args.source;

  const saved = saveFalsePositive(entry);
  console.log(`✅ Added false positive: ${saved.id}`);
  console.log(JSON.stringify(saved, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
