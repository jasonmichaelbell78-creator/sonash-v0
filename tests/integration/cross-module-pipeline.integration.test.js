/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Integration Test: Cross-Module Pipeline Data Contracts
 *
 * Verifies that output from module A is valid input for module B.
 * NOT unit tests -- these test the DATA HANDOFF between pipeline stages.
 *
 * Covers: TEST-03 (integration tier)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const ECOSYSTEM_DIR = path.join(ROOT, "data", "ecosystem-v2");
const REVIEWS_FILE = path.join(ECOSYSTEM_DIR, "reviews.jsonl");
const MANIFEST_FILE = path.join(ECOSYSTEM_DIR, "enforcement-manifest.jsonl");
const DEFERRED_FILE = path.join(ECOSYSTEM_DIR, "deferred-items.jsonl");

/**
 * Parse a JSONL file into an array of objects.
 */
function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe("Integration: Cross-module pipeline data contracts", { timeout: 15000 }, () => {
  describe("Review writer output feeds consolidation", () => {
    it("review records have fields consolidation expects", () => {
      const reviews = readJsonl(REVIEWS_FILE);
      assert.ok(reviews.length > 0, "Must have review records");

      // Consolidation (run-consolidation.js) reads: id, patterns, title, learnings
      // Sample a few records to verify the contract
      const sample = [
        reviews[0],
        reviews[Math.floor(reviews.length / 2)],
        reviews[reviews.length - 1],
      ];

      for (const record of sample) {
        assert.ok(
          typeof record.id === "number" || typeof record.id === "string",
          `Record must have id, got: ${typeof record.id}`
        );
        assert.ok(record.date, "Record must have date");
        // source may be null for retro-generated records; consolidation uses id/patterns/title
        assert.ok(record.date !== undefined, "Record must have date field");
        // patterns is the key field consolidation uses for extraction
        // It may be an array, null, or undefined (stub/retro records)
        if (record.patterns !== undefined && record.patterns !== null) {
          assert.ok(
            Array.isArray(record.patterns),
            `patterns must be array when present, got: ${typeof record.patterns}`
          );
        }
      }
    });

    it("review records have completeness metadata for downstream filtering", () => {
      const reviews = readJsonl(REVIEWS_FILE);
      // completeness field is used by downstream scripts to filter partial/stub records
      const withCompleteness = reviews.filter((r) => r.completeness);
      assert.ok(
        withCompleteness.length > reviews.length * 0.5,
        `At least 50% of records should have completeness, got ${withCompleteness.length}/${reviews.length}`
      );
    });
  });

  describe("Consolidation output feeds promotion", () => {
    it("enforcement manifest has fields promotion pipeline expects", () => {
      const entries = readJsonl(MANIFEST_FILE);
      assert.ok(entries.length > 0, "Manifest must have entries");

      // promote-patterns.ts reads: pattern_id, pattern_name, status, mechanisms
      for (const entry of entries.slice(0, 5)) {
        assert.ok(entry.pattern_id, "Manifest entry must have pattern_id");
        assert.ok(entry.pattern_name, "Manifest entry must have pattern_name");
        assert.ok(entry.status, "Manifest entry must have status");
        // mechanisms is a key-value object describing enforcement methods per mechanism type
        if (entry.mechanisms !== undefined) {
          assert.ok(
            typeof entry.mechanisms === "object" && entry.mechanisms !== null,
            `mechanisms must be object, got: ${typeof entry.mechanisms}`
          );
        }
      }
    });

    it("manifest has high pattern_id uniqueness (>90%)", () => {
      const entries = readJsonl(MANIFEST_FILE);
      const ids = entries.map((e) => e.pattern_id);
      const unique = new Set(ids);
      // Some patterns may have versioned entries; uniqueness should be >90%
      const uniqueRatio = unique.size / ids.length;
      assert.ok(
        uniqueRatio > 0.9,
        `Expected >90% unique pattern_ids, got ${(uniqueRatio * 100).toFixed(1)}% (${unique.size}/${ids.length})`
      );
    });
  });

  describe("Health checkers read ecosystem data", () => {
    it("debt-health checker returns structured result", () => {
      const checkerPath = path.join(ROOT, "scripts", "health", "checkers", "debt-health.js");
      assert.ok(fs.existsSync(checkerPath), "debt-health checker must exist");

      // Import and run the checker
      const { checkDebtHealth } = require(checkerPath);
      const result = checkDebtHealth();

      // Health checker contract: returns object with metrics
      assert.ok(result, "Checker must return a result");
      assert.ok(typeof result === "object", "Result must be an object");
      assert.ok(result.metrics, "Result must have metrics property");
      assert.ok(typeof result.metrics === "object", "metrics must be an object");
    });

    it("ecosystem-integration checker returns structured result", () => {
      const checkerPath = path.join(
        ROOT,
        "scripts",
        "health",
        "checkers",
        "ecosystem-integration.js"
      );
      assert.ok(fs.existsSync(checkerPath), "ecosystem-integration checker must exist");

      const { checkEcosystemIntegration } = require(checkerPath);
      const result = checkEcosystemIntegration();

      assert.ok(result, "Checker must return a result");
      assert.ok(result.metrics, "Result must have metrics property");
    });
  });

  describe("Deferred items lifecycle integration", () => {
    it("deferred items have lifecycle state fields", () => {
      if (!fs.existsSync(DEFERRED_FILE)) {
        // Skip if no deferred items exist yet (valid project state)
        return;
      }
      const items = readJsonl(DEFERRED_FILE);
      assert.ok(items.length > 0, "Deferred items file must have entries");

      // Deferred items contract: id, review_id, status, severity
      for (const item of items.slice(0, 5)) {
        assert.ok(item.id, "Deferred item must have id");
        assert.ok(item.review_id, "Deferred item must have review_id for traceability");
        assert.ok(item.status, "Deferred item must have lifecycle status");
      }
    });

    it("deferred items reference valid review ids", () => {
      if (!fs.existsSync(DEFERRED_FILE)) {
        return;
      }
      const items = readJsonl(DEFERRED_FILE);
      const reviews = readJsonl(REVIEWS_FILE);
      const reviewIds = new Set(reviews.map((r) => String(r.id)));

      // Extract the numeric review ID from deferred item IDs like "123-deferred-1"
      for (const item of items) {
        const reviewId = String(item.review_id);
        // review_id should match an actual review
        assert.ok(
          reviewIds.has(reviewId),
          `Deferred item ${item.id} references review_id ${reviewId} which does not exist in reviews.jsonl`
        );
      }
    });
  });
});
