/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * learning-router.test.js - Tests for the Learning-to-Automation Router
 * Part of Data Effectiveness Audit (Wave 2.1)
 *
 * Uses node:test (project convention).
 * FUNCTIONAL tests: each test calls the actual functions and verifies
 * return values and file contents, not just string checks.
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..", "..");

// Import module under test
const {
  route,
  scaffoldVerifiedPattern,
  scaffoldHookGate,
  scaffoldLintRule,
  scaffoldClaudeMdAnnotation,
  deduplicateCheck,
  slugify,
  generateId,
  validateLearning,
  SCHEMA_VERSION,
  VALID_TYPES,
  VALID_SEVERITIES,
} = require(path.resolve(projectRoot, "scripts", "lib", "learning-router.js"));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a temp directory for test fixtures.
 * @returns {string} Absolute path to temp dir
 */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "learning-router-test-"));
}

/**
 * Clean up a temp directory recursively.
 * @param {string} dir
 */
function cleanTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Create a standard test learning object.
 * @param {object} overrides - Fields to override
 * @returns {object} Learning object
 */
function makeLearning(overrides) {
  return {
    type: "code",
    pattern: "Always wrap file reads in try-catch",
    source: "code-reviewer",
    severity: "high",
    ...overrides,
  };
}

/**
 * Read all entries from a JSONL file.
 * @param {string} filePath
 * @returns {object[]} Parsed entries
 */
function readJsonlEntries(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

// ===========================================================================
// 1. Route dispatch tests
// ===========================================================================

describe("route() dispatch by type", () => {
  let tempDir;
  let routesPath;

  beforeEach(() => {
    tempDir = makeTempDir();
    routesPath = path.join(tempDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("routes code-type learning to verified-pattern scaffold", () => {
    const learning = makeLearning({ type: "code" });
    const result = route(learning, { routesPath });

    assert.equal(result.action, "scaffolded");
    assert.equal(result.scaffold.type, "verified-pattern");
    assert.equal(result.scaffold.targetFile, "scripts/config/verified-patterns.json");
    assert.equal(result.scaffold.status, "scaffolded");
    // Code learnings also include a lint rule
    assert.ok(result.scaffold.lintRule, "lintRule should be defined");
    assert.equal(result.scaffold.lintRule.type, "lint-rule");
  });

  it("routes process-type learning to hook-gate scaffold", () => {
    const learning = makeLearning({ type: "process" });
    const result = route(learning, { routesPath });

    assert.equal(result.action, "scaffolded");
    assert.equal(result.scaffold.type, "hook-gate");
    assert.ok(
      result.scaffold.script.includes("#!/usr/bin/env node"),
      "script should contain shebang"
    );
    assert.ok(result.scaffold.script.includes(learning.pattern), "script should contain pattern");
    assert.match(result.scaffold.targetFile, /^scripts\/hooks\/check-.*\.js$/);
    assert.equal(result.scaffold.status, "scaffolded");
  });

  it("routes behavioral-type learning to claude-md-annotation scaffold", () => {
    const learning = makeLearning({ type: "behavioral" });
    const result = route(learning, { routesPath });

    assert.equal(result.action, "scaffolded");
    assert.equal(result.scaffold.type, "claude-md-annotation");
    assert.ok(
      result.scaffold.annotation.includes("[BEHAVIORAL: proxy metric]"),
      "annotation should contain behavioral tag"
    );
    assert.ok(
      result.scaffold.annotation.includes(learning.pattern),
      "annotation should contain pattern"
    );
    assert.ok(
      result.scaffold.proxyMetric.includes(learning.pattern),
      "proxyMetric should contain pattern"
    );
    assert.equal(result.scaffold.targetFile, "CLAUDE.md");
    assert.equal(result.scaffold.status, "scaffolded");
  });
});

// ===========================================================================
// 2. Invalid input tests
// ===========================================================================

describe("route() input validation", () => {
  let tempDir;
  let routesPath;

  beforeEach(() => {
    tempDir = makeTempDir();
    routesPath = path.join(tempDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("throws on unknown type", () => {
    const learning = makeLearning({ type: "unknown" });
    assert.throws(() => route(learning, { routesPath }), /Invalid learning/);
  });

  it("throws on missing required fields (empty object)", () => {
    assert.throws(() => route({}, { routesPath }), /Invalid learning/);
  });

  it("throws on null input", () => {
    assert.throws(() => route(null, { routesPath }), /Invalid learning/);
  });

  it("throws on missing pattern", () => {
    const learning = makeLearning({ pattern: undefined });
    assert.throws(() => route(learning, { routesPath }), /'pattern'/);
  });

  it("throws on missing source", () => {
    const learning = makeLearning({ source: undefined });
    assert.throws(() => route(learning, { routesPath }), /'source'/);
  });

  it("throws on invalid severity", () => {
    const learning = makeLearning({ severity: "extreme" });
    assert.throws(() => route(learning, { routesPath }), /'severity'/);
  });
});

// ===========================================================================
// 3. Scaffold content tests
// ===========================================================================

describe("scaffoldVerifiedPattern()", () => {
  it("produces entry with all required fields", () => {
    const learning = makeLearning({ type: "code", severity: "critical" });
    const result = scaffoldVerifiedPattern(learning);

    assert.equal(result.type, "verified-pattern");
    assert.equal(result.status, "scaffolded");
    assert.equal(result.targetFile, "scripts/config/verified-patterns.json");

    // Verify entry shape
    const entry = result.entry;
    assert.equal(entry.pattern, learning.pattern);
    assert.equal(entry.regex, "TODO: define regex");
    assert.equal(entry.severity, "critical");
    assert.deepEqual(entry.fileGlobs, ["**/*.js", "**/*.ts"]);
    assert.equal(entry.autofix, null);
    assert.equal(entry.source, learning.source);
    assert.equal(entry.addedBy, "learning-router");
    assert.equal(typeof entry.addedAt, "string");
    // Verify addedAt is a valid ISO date string
    assert.equal(new Date(entry.addedAt).toISOString(), entry.addedAt);
  });
});

describe("scaffoldHookGate()", () => {
  it("produces valid script with proper header", () => {
    const learning = makeLearning({ type: "process" });
    const result = scaffoldHookGate(learning);

    assert.equal(result.type, "hook-gate");
    assert.equal(result.status, "scaffolded");

    // Script content checks
    assert.ok(result.script.includes("#!/usr/bin/env node"), "has shebang");
    assert.ok(result.script.includes(`Hook gate: ${learning.pattern}`), "has hook gate comment");
    assert.ok(result.script.includes(`Source: ${learning.source}`), "has source comment");
    assert.ok(result.script.includes("TODO: Implement check logic"), "has TODO marker");
    assert.ok(result.script.includes("process.exit(0);"), "has placeholder exit");

    // Target file uses slugified pattern
    assert.match(result.targetFile, /^scripts\/hooks\/check-[\w-]+\.js$/);
  });
});

describe("scaffoldLintRule()", () => {
  it("produces valid ESLint-shaped rule object", () => {
    const learning = makeLearning({ type: "code" });
    const result = scaffoldLintRule(learning);

    assert.equal(result.type, "lint-rule");
    assert.equal(result.status, "scaffolded");

    // Rule shape
    const rule = result.rule;
    assert.equal(rule.meta.type, "problem");
    assert.equal(rule.meta.docs.description, learning.pattern);
    assert.equal(rule.meta.docs.category, "Best Practices");
    assert.deepEqual(rule.meta.schema, []);
    assert.ok(rule.create.includes("TODO"), "create should have TODO");

    // Target file
    assert.match(result.targetFile, /^eslint-rules\/[\w-]+\.js$/);
  });
});

describe("scaffoldClaudeMdAnnotation()", () => {
  it("produces annotation with behavioral tag and proxy metric", () => {
    const learning = makeLearning({
      type: "behavioral",
      pattern: "Ask before implementing",
    });
    const result = scaffoldClaudeMdAnnotation(learning);

    assert.equal(result.type, "claude-md-annotation");
    assert.equal(result.status, "scaffolded");
    assert.equal(result.annotation, "[BEHAVIORAL: proxy metric] Ask before implementing");
    assert.equal(result.proxyMetric, "Ask before implementing violation count in session logs");
    assert.equal(result.targetFile, "CLAUDE.md");
  });
});

// ===========================================================================
// 4. Deduplication tests
// ===========================================================================

describe("deduplication", () => {
  let tempDir;
  let routesPath;

  beforeEach(() => {
    tempDir = makeTempDir();
    routesPath = path.join(tempDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("detects duplicate when same pattern routed twice via route()", () => {
    const learning = makeLearning({ type: "code" });

    // First call succeeds
    const result1 = route(learning, { routesPath });
    assert.equal(result1.action, "scaffolded");

    // Second call with same learning is detected as duplicate
    const result2 = route(learning, { routesPath });
    assert.equal(result2.action, "skipped");
    assert.equal(result2.reason, "duplicate");
    assert.ok(result2.existingEntry, "existingEntry should be defined");
    assert.equal(result2.existingEntry.id, generateId(learning));
  });

  it("returns isDuplicate: false for empty/missing routes file", () => {
    const learning = makeLearning();
    const nonExistentPath = path.join(tempDir, "does-not-exist.jsonl");
    const result = deduplicateCheck(learning, { routesPath: nonExistentPath });

    assert.equal(result.isDuplicate, false);
  });

  it("treats different patterns as non-duplicate", () => {
    const learning1 = makeLearning({ pattern: "Pattern A" });
    const learning2 = makeLearning({ pattern: "Pattern B" });

    route(learning1, { routesPath });
    const result2 = route(learning2, { routesPath });

    assert.equal(result2.action, "scaffolded");
  });

  it("treats same pattern with different type as non-duplicate", () => {
    const learning1 = makeLearning({ type: "code", pattern: "Same pattern" });
    const learning2 = makeLearning({
      type: "process",
      pattern: "Same pattern",
    });

    route(learning1, { routesPath });
    const result2 = route(learning2, { routesPath });

    assert.equal(result2.action, "scaffolded");
  });
});

// ===========================================================================
// 5. Tracking tests
// ===========================================================================

describe("trackRouting()", () => {
  let tempDir;
  let routesPath;

  beforeEach(() => {
    tempDir = makeTempDir();
    routesPath = path.join(tempDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("creates learning-routes.jsonl with correct entry after route()", () => {
    const learning = makeLearning({ type: "code" });
    route(learning, { routesPath });

    // Verify file exists and has content
    assert.ok(fs.existsSync(routesPath), "routes file should exist");
    const entries = readJsonlEntries(routesPath);
    assert.equal(entries.length, 1);
  });

  it("tracked entry has all required schema fields", () => {
    const learning = makeLearning({ type: "process" });
    route(learning, { routesPath });

    const entries = readJsonlEntries(routesPath);
    assert.equal(entries.length, 1);

    const entry = entries[0];

    // Required fields per schema
    assert.equal(typeof entry.id, "string");
    assert.equal(entry.id.length, 12);
    assert.equal(typeof entry.timestamp, "string");
    assert.equal(new Date(entry.timestamp).toISOString(), entry.timestamp);
    assert.equal(typeof entry.date, "string");
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(entry.schema_version, SCHEMA_VERSION);
    assert.ok(entry.learning, "learning field should be defined");
    assert.equal(entry.learning.type, "process");
    assert.equal(entry.learning.pattern, learning.pattern);
    assert.equal(entry.learning.source, learning.source);
    assert.equal(entry.learning.severity, learning.severity);
    assert.equal(typeof entry.route, "string");
    assert.ok(entry.scaffold, "scaffold field should be defined");
    assert.equal(typeof entry.scaffold.targetFile, "string");
    assert.equal(entry.scaffold.status, "scaffolded");
    assert.equal(entry.status, "scaffolded");
  });

  it("appends multiple entries for different learnings", () => {
    const learning1 = makeLearning({ type: "code", pattern: "Pattern one" });
    const learning2 = makeLearning({
      type: "behavioral",
      pattern: "Pattern two",
    });

    route(learning1, { routesPath });
    route(learning2, { routesPath });

    const entries = readJsonlEntries(routesPath);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].learning.pattern, "Pattern one");
    assert.equal(entries[1].learning.pattern, "Pattern two");
  });
});

// ===========================================================================
// 6. Idempotency test
// ===========================================================================

describe("idempotency", () => {
  let tempDir;
  let routesPath;

  beforeEach(() => {
    tempDir = makeTempDir();
    routesPath = path.join(tempDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("routing same learning twice produces identical file state", () => {
    const learning = makeLearning({ type: "code" });

    route(learning, { routesPath });
    const contentsAfterFirst = fs.readFileSync(routesPath, "utf-8");

    route(learning, { routesPath });
    const contentsAfterSecond = fs.readFileSync(routesPath, "utf-8");

    // File should be unchanged after second (duplicate) call
    assert.equal(contentsAfterSecond, contentsAfterFirst);

    const entries = readJsonlEntries(routesPath);
    assert.equal(entries.length, 1);
  });
});

// ===========================================================================
// 7. Slug generation tests
// ===========================================================================

describe("slugify()", () => {
  it("converts spaces to hyphens", () => {
    assert.equal(slugify("wrap file reads"), "wrap-file-reads");
  });

  it("removes special characters", () => {
    assert.equal(slugify("use try/catch (always)"), "use-try-catch-always");
  });

  it("handles all-special-chars input", () => {
    assert.equal(slugify("!!!"), "unnamed");
  });

  it("handles empty/null input", () => {
    assert.equal(slugify(""), "unnamed");
    assert.equal(slugify(null), "unnamed");
    assert.equal(slugify(undefined), "unnamed");
  });

  it("truncates to 60 characters", () => {
    const longText =
      "a very long pattern description that goes on and on and on and on and should be truncated";
    const result = slugify(longText);
    assert.ok(result.length <= 60, `slug length ${result.length} should be <= 60`);
  });

  it("produces valid filenames (lowercase, alphanumeric + hyphens)", () => {
    const result = slugify("Use STRICT Mode! For ALL files.");
    assert.match(result, /^[a-z0-9-]+$/);
  });
});

// ===========================================================================
// 8. Validation helper tests
// ===========================================================================

describe("validateLearning()", () => {
  it("accepts a valid learning", () => {
    const learning = makeLearning();
    const result = validateLearning(learning);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it("rejects null", () => {
    const result = validateLearning(null);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0, "should have errors");
  });

  it("rejects string input", () => {
    const result = validateLearning("not an object");
    assert.equal(result.valid, false);
  });

  it("collects all validation errors at once", () => {
    const result = validateLearning({});
    assert.equal(result.valid, false);
    // Should have errors for type, pattern, source, severity
    assert.ok(result.errors.length >= 4, `expected >= 4 errors, got ${result.errors.length}`);
  });

  it("accepts all valid types", () => {
    for (const type of VALID_TYPES) {
      const result = validateLearning(makeLearning({ type }));
      assert.equal(result.valid, true, `type '${type}' should be valid`);
    }
  });

  it("accepts all valid severities", () => {
    for (const severity of VALID_SEVERITIES) {
      const result = validateLearning(makeLearning({ severity }));
      assert.equal(result.valid, true, `severity '${severity}' should be valid`);
    }
  });
});

// ===========================================================================
// 9. generateId tests
// ===========================================================================

describe("generateId()", () => {
  it("is deterministic for the same learning", () => {
    const learning = makeLearning();
    assert.equal(generateId(learning), generateId(learning));
  });

  it("differs for different patterns", () => {
    const id1 = generateId(makeLearning({ pattern: "A" }));
    const id2 = generateId(makeLearning({ pattern: "B" }));
    assert.notEqual(id1, id2);
  });

  it("differs for different types", () => {
    const id1 = generateId(makeLearning({ type: "code" }));
    const id2 = generateId(makeLearning({ type: "process" }));
    assert.notEqual(id1, id2);
  });

  it("returns a 12-character hex string", () => {
    const id = generateId(makeLearning());
    assert.match(id, /^[0-9a-f]{12}$/);
  });
});
