/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Integration Tests — full audit with --summary, validate v2 JSON output.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT_PATH = path.resolve(__dirname, "..", "run-health-ecosystem-audit.js");
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..");

describe("Health Ecosystem Audit Integration", () => {
  describe("--summary mode", () => {
    let output;
    let parsed;

    it("runs successfully with --summary --batch --skip-live-tests", () => {
      output = execFileSync("node", [SCRIPT_PATH, "--summary", "--batch", "--skip-live-tests"], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 5 * 1024 * 1024,
      });
      assert.ok(output, "Produces output");
    });

    it("produces valid JSON", () => {
      parsed = JSON.parse(output);
      assert.ok(parsed, "Parsed successfully");
    });

    it("has grade field (A-F)", () => {
      assert.ok(
        ["A", "B", "C", "D", "F"].includes(parsed.grade),
        `Grade "${parsed.grade}" is valid`
      );
    });

    it("has numeric score 0-100", () => {
      assert.ok(typeof parsed.score === "number");
      assert.ok(parsed.score >= 0 && parsed.score <= 100);
    });

    it("has error/warning/info counts", () => {
      assert.ok(typeof parsed.errors === "number");
      assert.ok(typeof parsed.warnings === "number");
      assert.ok(typeof parsed.info === "number");
    });

    it("has patches count", () => {
      assert.ok(typeof parsed.patches === "number");
    });

    it("has 6 domains in output", () => {
      assert.ok(parsed.domains, "Has domains");
      assert.equal(Object.keys(parsed.domains).length, 6);
    });

    it("all domains have score and label", () => {
      for (const [domain, data] of Object.entries(parsed.domains)) {
        assert.ok(typeof data.score === "number", `${domain} has score`);
        assert.ok(typeof data.label === "string", `${domain} has label`);
        assert.ok(typeof data.categories === "number", `${domain} has categories count`);
      }
    });
  });

  describe("full output mode", () => {
    let fullOutput;
    let fullParsed;

    it("runs successfully with --batch --skip-live-tests", () => {
      fullOutput = execFileSync("node", [SCRIPT_PATH, "--batch", "--skip-live-tests"], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      assert.ok(fullOutput);
    });

    it("produces valid v2 JSON", () => {
      fullParsed = JSON.parse(fullOutput);
      assert.equal(fullParsed.version, 2);
    });

    it("has healthScore with score, grade, breakdown", () => {
      assert.ok(fullParsed.healthScore);
      assert.ok(typeof fullParsed.healthScore.score === "number");
      assert.ok(typeof fullParsed.healthScore.grade === "string");
      assert.ok(typeof fullParsed.healthScore.breakdown === "object");
    });

    it("has categories object with 25 entries", () => {
      assert.ok(fullParsed.categories);
      const catCount = Object.keys(fullParsed.categories).length;
      assert.equal(catCount, 25, `Expected 25 categories, got ${catCount}`);
    });

    it("each category has label, domain, score, rating", () => {
      for (const [cat, data] of Object.entries(fullParsed.categories)) {
        assert.ok(data.label, `${cat} has label`);
        assert.ok(data.domain, `${cat} has domain`);
        assert.ok(typeof data.score === "number", `${cat} has score`);
        assert.ok(data.rating, `${cat} has rating`);
      }
    });

    it("has findings array", () => {
      assert.ok(Array.isArray(fullParsed.findings));
    });

    it("findings sorted by impactScore descending", () => {
      const impacts = fullParsed.findings.map((f) => f.impactScore || 0);
      for (let i = 1; i < impacts.length; i++) {
        assert.ok(
          impacts[i] <= impacts[i - 1],
          `Finding ${i} impact ${impacts[i]} <= previous ${impacts[i - 1]}`
        );
      }
    });

    it("all findings use HMS- prefix", () => {
      for (const finding of fullParsed.findings) {
        assert.ok(finding.id.startsWith("HMS-"), `Finding ID "${finding.id}" has HMS- prefix`);
      }
    });

    it("has summary with error/warning/info counts", () => {
      assert.ok(fullParsed.summary);
      assert.ok(typeof fullParsed.summary.errors === "number");
      assert.ok(typeof fullParsed.summary.warnings === "number");
      assert.ok(typeof fullParsed.summary.info === "number");
    });

    it("has domainScores with all 6 domains", () => {
      assert.ok(fullParsed.domainScores);
      assert.equal(Object.keys(fullParsed.domainScores).length, 6);
    });

    it("has timestamp in ISO format", () => {
      assert.ok(fullParsed.timestamp);
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(fullParsed.timestamp), "Timestamp is ISO format");
    });
  });
});
