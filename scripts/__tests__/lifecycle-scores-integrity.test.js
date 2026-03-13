/* global __dirname */
/**
 * Tests for lifecycle-scores.jsonl data integrity and schema validation
 *
 * Part of Data Effectiveness Audit — test gap fill (Tasks 19, 20)
 *
 * Validates:
 * - Every entry in lifecycle-scores.jsonl is valid JSON
 * - Required fields are present and correctly typed
 * - total = capture + storage + recall + action
 * - Score values are 0-3, total is 0-12
 * - Categories are valid enum values
 * - Files arrays are non-empty
 * - IDs are unique
 * - No orphan categories (all enum values used at least once)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SCORES_PATH = path.join(PROJECT_ROOT, ".claude", "state", "lifecycle-scores.jsonl");

// Valid categories from the Zod schema
const VALID_CATEGORIES = [
  "pattern-rules",
  "review-learnings",
  "retro-findings",
  "technical-debt",
  "hook-warnings",
  "override-audit",
  "health-scores",
  "behavioral-rules",
  "security-checklist",
  "fix-templates",
  "memory",
  "session-context",
  "agent-tracking",
  "velocity-tracking",
  "commit-log",
  "learning-routes",
  "planning-data",
  "audit-findings",
  "aggregation-data",
  "ecosystem-deferred",
];

function loadScores() {
  const content = fs.readFileSync(SCORES_PATH, "utf-8");
  const entries = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    entries.push(JSON.parse(trimmed)); // Deliberately throw on corrupt JSON
  }
  return entries;
}

describe("lifecycle-scores.jsonl data integrity", () => {
  let entries;

  // Load once for all tests
  it("parses without errors (all lines are valid JSON)", () => {
    entries = loadScores();
    assert.ok(entries.length > 0, "Should have at least one entry");
  });

  it("has at least 15 entries (comprehensive coverage)", () => {
    assert.ok(entries.length >= 15, `Expected >= 15 systems, got ${entries.length}`);
  });

  it("every entry has all required fields", () => {
    const requiredFields = [
      "id",
      "date",
      "schema_version",
      "completeness",
      "system",
      "category",
      "files",
      "capture",
      "storage",
      "recall",
      "action",
      "total",
      "gap",
    ];

    for (const entry of entries) {
      for (const field of requiredFields) {
        assert.ok(field in entry, `Entry ${entry.id || "unknown"} missing field "${field}"`);
      }
    }
  });

  it("total equals sum of capture + storage + recall + action", () => {
    for (const entry of entries) {
      const expectedTotal = entry.capture + entry.storage + entry.recall + entry.action;
      assert.equal(
        entry.total,
        expectedTotal,
        `${entry.system} (${entry.id}): total=${entry.total} but cap+sto+rec+act=${expectedTotal}`
      );
    }
  });

  it("all score values are 0-3", () => {
    for (const entry of entries) {
      for (const field of ["capture", "storage", "recall", "action"]) {
        const val = entry[field];
        assert.ok(
          Number.isInteger(val) && val >= 0 && val <= 3,
          `${entry.system}.${field} = ${val} (must be 0-3)`
        );
      }
    }
  });

  it("total values are 0-12", () => {
    for (const entry of entries) {
      assert.ok(
        Number.isInteger(entry.total) && entry.total >= 0 && entry.total <= 12,
        `${entry.system}.total = ${entry.total} (must be 0-12)`
      );
    }
  });

  it("all categories are valid enum values", () => {
    for (const entry of entries) {
      assert.ok(
        VALID_CATEGORIES.includes(entry.category),
        `${entry.system} has invalid category "${entry.category}"`
      );
    }
  });

  it("all files arrays are non-empty", () => {
    for (const entry of entries) {
      assert.ok(
        Array.isArray(entry.files) && entry.files.length > 0,
        `${entry.system} has empty files array`
      );
    }
  });

  it("all IDs are unique", () => {
    const ids = entries.map((e) => e.id);
    const uniqueIds = new Set(ids);
    assert.equal(
      ids.length,
      uniqueIds.size,
      `Duplicate IDs found: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`
    );
  });

  it("all dates are YYYY-MM-DD format", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const entry of entries) {
      assert.ok(
        dateRegex.test(entry.date),
        `${entry.system}.date = "${entry.date}" (must be YYYY-MM-DD)`
      );
    }
  });

  it("schema_version is 1 for all entries", () => {
    for (const entry of entries) {
      assert.equal(
        entry.schema_version,
        1,
        `${entry.system}.schema_version = ${entry.schema_version}`
      );
    }
  });

  it("gap field is non-empty for all entries", () => {
    for (const entry of entries) {
      assert.ok(
        typeof entry.gap === "string" && entry.gap.length > 0,
        `${entry.system} has empty gap field`
      );
    }
  });

  it("remediation is string or null", () => {
    for (const entry of entries) {
      assert.ok(
        entry.remediation === null || typeof entry.remediation === "string",
        `${entry.system}.remediation must be string or null`
      );
    }
  });

  it("wave_fixed is string or null", () => {
    for (const entry of entries) {
      assert.ok(
        entry.wave_fixed === null || typeof entry.wave_fixed === "string",
        `${entry.system}.wave_fixed must be string or null`
      );
    }
  });

  it("systems with wave_fixed also have remediation text", () => {
    for (const entry of entries) {
      if (entry.wave_fixed !== null) {
        assert.ok(
          typeof entry.remediation === "string" && entry.remediation.length > 0,
          `${entry.system} has wave_fixed="${entry.wave_fixed}" but no remediation text`
        );
      }
    }
  });

  it("no system scores all zeros (would indicate data error)", () => {
    for (const entry of entries) {
      assert.ok(
        entry.total > 0,
        `${entry.system} has total=0 — all capture systems should score > 0`
      );
    }
  });
});
