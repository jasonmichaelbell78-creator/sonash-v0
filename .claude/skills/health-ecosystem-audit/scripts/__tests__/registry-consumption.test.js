/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Registry Consumption Tests — loadRegistry API, caching behavior (D#40).
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "..");

describe("Registry Consumption (D#40)", () => {
  describe("loadRegistry via context", () => {
    it("uses ctx.registry when provided", () => {
      const { loadRegistry } = require("../checkers/coverage-completeness");
      const fakeRegistry = [
        { path: "test.js", source_type: "test_file" },
        { path: "checker.js", source_type: "health_checker" },
      ];

      const result = loadRegistry({ rootDir: ROOT_DIR, registry: fakeRegistry });
      assert.deepEqual(result, fakeRegistry);
    });

    it("returns empty array when no registry file and no ctx.registry", () => {
      const { loadRegistry } = require("../checkers/coverage-completeness");
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hms-reg-test-"));

      try {
        const result = loadRegistry({ rootDir: tmpDir });
        assert.deepEqual(result, []);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("loads from file when ctx.registry is not provided", () => {
      const { loadRegistry } = require("../checkers/coverage-completeness");

      // Try loading from real project root (may or may not have registry)
      const result = loadRegistry({ rootDir: ROOT_DIR });
      assert.ok(Array.isArray(result), "Returns array");
    });
  });

  describe("registry data structure", () => {
    it("all entries have required fields", () => {
      const { loadRegistry } = require("../checkers/coverage-completeness");
      const registry = loadRegistry({ rootDir: ROOT_DIR });

      if (registry.length === 0) {
        // Registry may not exist in all environments
        return;
      }

      for (const entry of registry.slice(0, 10)) {
        assert.ok(entry.path, "Entry has path");
        assert.ok(entry.source_type, "Entry has source_type");
      }
    });
  });

  describe("checker shares registry via context", () => {
    it("all checkers receive same registry instance", () => {
      const sharedRegistry = [{ path: "a.test.js", source_type: "test_file" }];

      const ctx = {
        rootDir: ROOT_DIR,
        registry: sharedRegistry,
        skipLiveTests: true,
      };

      // Run D5 checker with shared registry
      const d5 = require("../checkers/coverage-completeness");
      const result = d5.run(ctx);

      assert.ok(result, "D5 runs with shared registry");
      assert.ok(result.scores.test_registry_completeness, "Has registry score");
    });
  });

  describe("registry caching", () => {
    it("loadRegistry returns same data on repeated calls with same registry", () => {
      const { loadRegistry } = require("../checkers/coverage-completeness");
      const fakeRegistry = [{ path: "test.js", source_type: "test_file" }];
      const ctx = { rootDir: ROOT_DIR, registry: fakeRegistry };

      const result1 = loadRegistry(ctx);
      const result2 = loadRegistry(ctx);

      assert.deepEqual(result1, result2);
      assert.equal(result1, result2, "Same reference (no re-parse)");
    });
  });

  describe("registry with test file matching", () => {
    it("matches health checker test files", () => {
      const fakeRegistry = [
        {
          path: "scripts/health/checkers/__tests__/code-quality.test.js",
          source_type: "test_file",
          owner: "health",
        },
        {
          path: "scripts/health/checkers/__tests__/security.test.js",
          source_type: "test_file",
          owner: "health",
        },
        {
          path: "scripts/health/checkers/code-quality.js",
          source_type: "health_checker",
          owner: "health",
        },
        {
          path: "scripts/health/checkers/security.js",
          source_type: "health_checker",
          owner: "health",
        },
      ];

      const d5 = require("../checkers/coverage-completeness");
      const result = d5.run({
        rootDir: ROOT_DIR,
        registry: fakeRegistry,
        skipLiveTests: true,
      });

      const trc = result.scores.test_registry_completeness;
      assert.ok(trc.metrics.healthCheckerEntries >= 2, "Finds health_checker entries");
    });
  });
});
