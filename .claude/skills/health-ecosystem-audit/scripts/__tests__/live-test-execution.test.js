/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Live Test Execution Tests — D5 live test parsing, skip-flag behavior.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "..");

describe("Live Test Execution (D5)", () => {
  let checker;

  it("loads coverage-completeness checker", () => {
    checker = require("../checkers/coverage-completeness");
    assert.ok(checker);
    assert.equal(checker.DOMAIN, "coverage_completeness");
  });

  describe("with --skip-live-tests", () => {
    let result;

    it("runs without executing npm test", () => {
      result = checker.run({
        rootDir: ROOT_DIR,
        registry: [],
        skipLiveTests: true,
      });
      assert.ok(result);
    });

    it("produces test_coverage_verification score", () => {
      const tcv = result.scores.test_coverage_verification;
      assert.ok(tcv, "Has test_coverage_verification score");
      assert.ok(typeof tcv.score === "number");
      assert.ok(tcv.score >= 0 && tcv.score <= 100);
    });

    it("marks liveTestRun as false in metrics", () => {
      const metrics = result.scores.test_coverage_verification.metrics;
      assert.equal(metrics.liveTestRun, false, "liveTestRun should be false when skipped");
    });

    it("includes skip info finding", () => {
      const skipFinding = result.findings.find(
        (f) => f.id === "HMS-520" && f.message.includes("skipped")
      );
      assert.ok(skipFinding, "Should have skip info finding");
      assert.equal(skipFinding.severity, "info");
    });
  });

  describe("checker_success_aggregation", () => {
    it("returns valid score", () => {
      const result = checker.run({
        rootDir: ROOT_DIR,
        registry: [],
        skipLiveTests: true,
      });

      const csa = result.scores.checker_success_aggregation;
      assert.ok(csa);
      assert.ok(typeof csa.score === "number");
      assert.ok(csa.metrics.totalCheckers > 0, "Should find health checkers");
    });
  });

  describe("external_tool_availability", () => {
    it("returns valid score", () => {
      const result = checker.run({
        rootDir: ROOT_DIR,
        registry: [],
        skipLiveTests: true,
      });

      const eta = result.scores.external_tool_availability;
      assert.ok(eta);
      assert.ok(typeof eta.score === "number");
    });
  });

  describe("test_registry_completeness", () => {
    it("handles empty registry", () => {
      const result = checker.run({
        rootDir: ROOT_DIR,
        registry: [],
        skipLiveTests: true,
      });

      const trc = result.scores.test_registry_completeness;
      assert.ok(trc);
      assert.ok(typeof trc.score === "number");
    });

    it("handles populated registry", () => {
      const fakeRegistry = [
        {
          path: "scripts/health/checkers/code-quality.js",
          source_type: "health_checker",
          owner: "health",
        },
        {
          path: "scripts/health/checkers/__tests__/code-quality.test.js",
          source_type: "test_file",
          owner: "health",
        },
      ];

      const result = checker.run({
        rootDir: ROOT_DIR,
        registry: fakeRegistry,
        skipLiveTests: true,
      });

      const trc = result.scores.test_registry_completeness;
      assert.ok(trc);
      assert.ok(trc.metrics.registryEntries > 0);
    });
  });
});
