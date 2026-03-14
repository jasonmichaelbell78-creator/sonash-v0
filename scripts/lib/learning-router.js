/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * learning-router.js - Learning-to-Automation Router
 *
 * Routes discovered patterns/learnings into automated enforcement scaffolds.
 * Any skill that identifies a pattern calls this router to scaffold the
 * appropriate enforcement mechanism (verified-pattern, hook-gate, lint-rule,
 * or CLAUDE.md annotation).
 *
 * Part of Data Effectiveness Audit (Wave 2.1)
 *
 * @module lib/learning-router
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// ---------------------------------------------------------------------------
// Dependency imports with fallbacks
// ---------------------------------------------------------------------------

const safeFs = require(path.join(__dirname, "safe-fs.js"));
const { isSafeToWrite, withLock, safeAppendFileSync } = safeFs;

// Import sanitizeError from security-helpers (CommonJS), with inline fallback
let sanitizeError;
try {
  ({ sanitizeError } = require(path.join(__dirname, "security-helpers.js")));
} catch {
  // Fallback: minimal sanitization
  sanitizeError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    return message
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]")
      .replace(/[A-Z]:\\[^\s]+/gi, "[PATH]");
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ROUTES_PATH = path.join(PROJECT_ROOT, ".claude", "state", "learning-routes.jsonl");
const SCHEMA_VERSION = 1;
const VALID_TYPES = ["code", "process", "behavioral"];
const VALID_SEVERITIES = ["critical", "high", "medium", "low"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a pattern string into a filesystem-safe slug.
 *
 * @param {string} text - Pattern text to slugify
 * @returns {string} Lowercase slug with hyphens, max 60 chars
 */
function slugify(text) {
  if (!text || typeof text !== "string") return "unnamed";
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // non-alphanum -> hyphen  // S5852: safe — no backtracking risk in character class
      .replace(/^-+|-+$/g, "") // strip leading/trailing hyphens  // S5852: safe — no backtracking risk in anchored alternation
      .slice(0, 60) || "unnamed"
  );
}

/**
 * Generate a deterministic ID for a learning based on type + pattern.
 * Used for deduplication.
 *
 * @param {object} learning
 * @returns {string} 12-char hex ID
 */
function generateId(learning) {
  const key = `${learning.type}::${learning.pattern}`;
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 12);
}

/**
 * Validate a learning object has all required fields with correct types.
 *
 * @param {object} learning
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLearning(learning) {
  const errors = [];

  if (!learning || typeof learning !== "object") {
    return { valid: false, errors: ["Learning must be a non-null object"] };
  }

  if (!learning.type || typeof learning.type !== "string") {
    errors.push("'type' is required and must be a string");
  } else if (!VALID_TYPES.includes(learning.type)) {
    errors.push(`'type' must be one of: ${VALID_TYPES.join(", ")} (got '${learning.type}')`);
  }

  if (!learning.pattern || typeof learning.pattern !== "string") {
    errors.push("'pattern' is required and must be a string");
  }

  if (!learning.source || typeof learning.source !== "string") {
    errors.push("'source' is required and must be a string");
  }

  if (!learning.severity || typeof learning.severity !== "string") {
    errors.push("'severity' is required and must be a string");
  } else if (!VALID_SEVERITIES.includes(learning.severity)) {
    errors.push(
      `'severity' must be one of: ${VALID_SEVERITIES.join(", ")} (got '${learning.severity}')`
    );
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Scaffold functions
// ---------------------------------------------------------------------------

/**
 * Scaffold a verified-pattern entry + lint rule skeleton for code-type learnings.
 *
 * @param {object} learning - Validated learning object
 * @returns {object} Scaffold result with type, entry, targetFile, status
 */
function scaffoldVerifiedPattern(learning) {
  return {
    type: "verified-pattern",
    entry: {
      pattern: learning.pattern,
      regex: "TODO: define regex",
      severity: learning.severity,
      fileGlobs: ["**/*.js", "**/*.ts"],
      autofix: null,
      source: learning.source,
      addedBy: "learning-router",
      addedAt: new Date().toISOString(),
    },
    targetFile: "scripts/config/verified-patterns.json",
    status: "scaffolded",
  };
}

/**
 * Scaffold a hook gate stub for process-type learnings.
 *
 * @param {object} learning - Validated learning object
 * @returns {object} Scaffold result with type, script, targetFile, status
 */
function scaffoldHookGate(learning) {
  const slug = slugify(learning.pattern);
  return {
    type: "hook-gate",
    script:
      `#!/usr/bin/env node\n` +
      `// Hook gate: ${learning.pattern}\n` +
      `// Source: ${learning.source}\n` +
      `// TODO: Implement check logic\n` +
      `process.exit(0); // placeholder\n`,
    targetFile: `scripts/hooks/check-${slug}.js`,
    status: "scaffolded",
  };
}

/**
 * Scaffold an ESLint/Semgrep rule skeleton for code-type learnings.
 *
 * @param {object} learning - Validated learning object
 * @returns {object} Scaffold result with type, rule, targetFile, status
 */
function scaffoldLintRule(learning) {
  const slug = slugify(learning.pattern);
  return {
    type: "lint-rule",
    rule: {
      meta: {
        type: "problem",
        docs: {
          description: learning.pattern,
          category: "Best Practices",
        },
        schema: [],
      },
      create: "/* TODO: implement rule logic */",
    },
    targetFile: `eslint-rules/${slug}.js`,
    status: "scaffolded",
  };
}

/**
 * Scaffold a CLAUDE.md annotation + proxy metric definition for behavioral learnings.
 *
 * @param {object} learning - Validated learning object
 * @returns {object} Scaffold result with type, annotation, proxyMetric, targetFile, status
 */
function scaffoldClaudeMdAnnotation(learning) {
  return {
    type: "claude-md-annotation",
    annotation: `[BEHAVIORAL: proxy metric] ${learning.pattern}`,
    proxyMetric: `${learning.pattern} violation count in session logs`,
    targetFile: "CLAUDE.md",
    status: "scaffolded",
  };
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Check whether a learning has already been routed (preventing double-scaffolding).
 * Reads learning-routes.jsonl and checks for existing entries with same ID.
 *
 * @param {object} learning - Learning to check
 * @param {object} [options]
 * @param {string} [options.routesPath] - Override JSONL path for testing
 * @returns {{ isDuplicate: boolean, existingEntry?: object }}
 */
function deduplicateCheck(learning, options) {
  const routesPath = options?.routesPath || DEFAULT_ROUTES_PATH;
  const id = generateId(learning);

  let content;
  try {
    content = fs.readFileSync(routesPath, "utf-8");
  } catch (err) {
    // File doesn't exist or is unreadable — no duplicates possible
    const errCode = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (errCode !== "ENOENT") {
      process.stderr.write(
        `[learning-router] WARNING: Could not read routes file: ${sanitizeError(err)}\n`
      );
    }
    return { isDuplicate: false };
  }

  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.id === id) {
        return { isDuplicate: true, existingEntry: entry };
      }
    } catch {
      // Skip malformed lines
    }
  }

  return { isDuplicate: false };
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/**
 * Log a routing decision to .claude/state/learning-routes.jsonl.
 *
 * Schema: { id, timestamp, date, schema_version, learning, route, scaffold, status }
 *
 * @param {object} learning - The learning that was routed
 * @param {object} result - The scaffold result
 * @param {object} [options]
 * @param {string} [options.routesPath] - Override JSONL path for testing
 */
function trackRouting(learning, result, options) {
  const routesPath = options?.routesPath || DEFAULT_ROUTES_PATH;
  const absPath = path.resolve(routesPath);

  // Ensure parent directory exists
  try {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
  } catch (err) {
    process.stderr.write(
      `[learning-router] WARNING: Could not create state directory: ${sanitizeError(err)}\n`
    );
    return;
  }

  // Verify safe to write
  if (!isSafeToWrite(absPath)) {
    process.stderr.write(`[learning-router] ERROR: Refusing to write to unsafe path\n`);
    return;
  }

  const now = new Date();
  const entry = {
    id: generateId(learning),
    timestamp: now.toISOString(),
    date: now.toISOString().split("T")[0],
    schema_version: SCHEMA_VERSION,
    learning: {
      type: learning.type,
      pattern: learning.pattern,
      source: learning.source,
      severity: learning.severity,
    },
    route: result.type,
    scaffold: {
      targetFile: result.targetFile,
      status: result.status,
    },
    status: "scaffolded",
  };

  const line = JSON.stringify(entry) + "\n";

  try {
    withLock(absPath, () => {
      safeAppendFileSync(absPath, line);
    });
  } catch (err) {
    process.stderr.write(
      `[learning-router] ERROR: Failed to track routing: ${sanitizeError(err)}\n`
    );
  }
}

// ---------------------------------------------------------------------------
// Main router
// ---------------------------------------------------------------------------

/**
 * Route a learning by type to the appropriate enforcement scaffolding.
 *
 * Routing logic (per D13):
 * - code      -> scaffold verified-pattern entry + lint rule skeleton
 * - process   -> scaffold hook gate stub
 * - behavioral -> CLAUDE.md annotation + proxy metric definition
 *
 * @param {object} learning
 * @param {string} learning.type - 'code' | 'process' | 'behavioral'
 * @param {string} learning.pattern - Description of the pattern
 * @param {string} learning.source - Skill/script that identified it
 * @param {string} learning.severity - 'critical' | 'high' | 'medium' | 'low'
 * @param {object} [learning.evidence] - Supporting data
 * @param {object} [options]
 * @param {string} [options.routesPath] - Override JSONL path for testing
 * @returns {object} Routing result with enforcement action taken
 * @throws {Error} If learning validation fails
 */
function route(learning, options) {
  // 1. Validate input
  const validation = validateLearning(learning);
  if (!validation.valid) {
    throw new Error(`Invalid learning: ${validation.errors.join("; ")}`);
  }

  // 2. Check for duplicates with status-aware conflict resolution
  const dupCheck = deduplicateCheck(learning, options);
  if (dupCheck.isDuplicate) {
    const existingStatus = dupCheck.existingEntry?.status;

    if (existingStatus === "verified") {
      process.stderr.write(
        `[learning-router] INFO: Skipping pattern "${learning.pattern}" — existing enforcement verified\n`
      );
      return {
        action: "skipped",
        reason: "existing-enforcement-verified",
        existingEntry: dupCheck.existingEntry,
        id: generateId(learning),
      };
    }

    if (existingStatus === "enforced" || existingStatus === "scaffolded") {
      process.stderr.write(
        `[learning-router] INFO: Skipping pattern "${learning.pattern}" — enforcement already in pipeline (status: ${existingStatus})\n`
      );
      return {
        action: "skipped",
        reason: "enforcement-in-pipeline",
        existingEntry: dupCheck.existingEntry,
        id: generateId(learning),
      };
    }

    // Other statuses (e.g., "failed", "stale") — proceed with re-routing (widen scope)
    process.stderr.write(
      `[learning-router] INFO: Re-routing pattern "${learning.pattern}" — existing status "${existingStatus}" allows scope widening\n`
    );
  }

  // 3. Dispatch by type
  let scaffold;
  switch (learning.type) {
    case "code":
      scaffold = scaffoldVerifiedPattern(learning);
      // Code learnings also get a lint rule skeleton
      scaffold.lintRule = scaffoldLintRule(learning);
      scaffold.targetFiles = [scaffold.targetFile, scaffold.lintRule.targetFile];
      break;
    case "process":
      scaffold = scaffoldHookGate(learning);
      break;
    case "behavioral":
      scaffold = scaffoldClaudeMdAnnotation(learning);
      break;
    default:
      // This should not be reachable due to validation, but fail-safe
      throw new Error(`Unknown learning type: ${learning.type}`);
  }

  // 4. Track the routing decision
  trackRouting(learning, scaffold, options);

  return {
    action: "scaffolded",
    id: generateId(learning),
    scaffold,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  route,
  scaffoldVerifiedPattern,
  scaffoldHookGate,
  scaffoldLintRule,
  scaffoldClaudeMdAnnotation,
  trackRouting,
  deduplicateCheck,
  // Helpers (exported for testability)
  slugify,
  generateId,
  validateLearning,
  // Constants (exported for test assertions)
  SCHEMA_VERSION,
  VALID_TYPES,
  VALID_SEVERITIES,
};
