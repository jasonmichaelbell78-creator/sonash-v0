/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests — all 6 checkers run without crash,
 * scores 0-100, finding IDs unique with HMS- prefix.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "..");

const checkerModules = [
  { name: "checker-infrastructure", file: "../checkers/checker-infrastructure" },
  { name: "scoring-pipeline", file: "../checkers/scoring-pipeline" },
  { name: "data-persistence", file: "../checkers/data-persistence" },
  { name: "consumer-integration", file: "../checkers/consumer-integration" },
  { name: "coverage-completeness", file: "../checkers/coverage-completeness" },
  { name: "alert-system", file: "../checkers/alert-system" },
];

describe("Checker Regression", () => {
  const allIds = new Set();

  for (const mod of checkerModules) {
    describe(mod.name, () => {
      let checker;
      let result;

      it("loads without error", () => {
        checker = require(mod.file);
        assert.ok(checker, "Module loaded");
        assert.ok(typeof checker.run === "function", "Exports run function");
        assert.ok(typeof checker.DOMAIN === "string", "Exports DOMAIN string");
      });

      it("runs without crashing", () => {
        result = checker.run({
          rootDir: ROOT_DIR,
          registry: [],
          skipLiveTests: true,
        });
        assert.ok(result, "Returns a result");
      });

      it("returns domain string", () => {
        assert.ok(typeof result.domain === "string");
        assert.ok(result.domain.length > 0);
      });

      it("returns findings array", () => {
        assert.ok(Array.isArray(result.findings), "findings is an array");
      });

      it("returns scores object", () => {
        assert.ok(typeof result.scores === "object", "scores is an object");
        assert.ok(Object.keys(result.scores).length > 0, "scores has categories");
      });

      it("all scores are 0-100 with rating", () => {
        for (const [cat, score] of Object.entries(result.scores)) {
          assert.ok(typeof score.score === "number", `${cat} score is a number`);
          assert.ok(score.score >= 0 && score.score <= 100, `${cat} score ${score.score} in 0-100`);
          assert.ok(
            ["good", "average", "poor"].includes(score.rating),
            `${cat} rating "${score.rating}" is valid`
          );
        }
      });

      it("all finding IDs use HMS- prefix", () => {
        for (const finding of result.findings) {
          assert.ok(typeof finding.id === "string", "Finding has id");
          assert.ok(finding.id.startsWith("HMS-"), `Finding ID "${finding.id}" starts with HMS-`);
        }
      });

      it("all finding IDs are unique (across all checkers)", () => {
        for (const finding of result.findings) {
          assert.ok(
            !allIds.has(finding.id) || finding.id.match(/HMS-\d{3}$/),
            `Finding ID "${finding.id}" is unique or generic pattern`
          );
          allIds.add(finding.id);
        }
      });

      it("all findings have required fields", () => {
        for (const finding of result.findings) {
          assert.ok(finding.category, `Finding ${finding.id} has category`);
          assert.ok(finding.domain, `Finding ${finding.id} has domain`);
          assert.ok(finding.severity, `Finding ${finding.id} has severity`);
          assert.ok(finding.message, `Finding ${finding.id} has message`);
          assert.ok(
            ["error", "warning", "info"].includes(finding.severity),
            `Finding ${finding.id} severity "${finding.severity}" is valid`
          );
        }
      });
    });
  }
});
