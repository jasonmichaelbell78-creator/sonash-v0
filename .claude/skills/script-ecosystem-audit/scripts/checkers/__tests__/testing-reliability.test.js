/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sia-tr-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "testing-reliability.js");

describe("testing-reliability checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "testing_reliability");
    });
  });

  describe("happy path — tests present with good coverage", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      const testsDir = path.join(scriptsDir, "__tests__");
      fs.mkdirSync(testsDir, { recursive: true });
      // Production script
      fs.writeFileSync(
        path.join(scriptsDir, "util.js"),
        '"use strict";\nmodule.exports = { add: (a, b) => a + b };\n'
      );
      // Corresponding test
      fs.writeFileSync(
        path.join(testsDir, "util.test.js"),
        [
          '"use strict";',
          "const { describe, it } = require('node:test');",
          "const assert = require('node:assert/strict');",
          "const { add } = require('../util.js');",
          "describe('add', () => {",
          "  it('adds numbers', () => assert.equal(add(1, 2), 3));",
          "});",
        ].join("\n")
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "testing_reliability");
      assert.ok(Array.isArray(result.findings));
      assert.ok(typeof result.scores === "object");
    });

    it("all scores are in [0, 100]", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(
          typeof val.score === "number" && val.score >= 0 && val.score <= 100,
          `Score for ${key} out of range: ${val.score}`
        );
      }
    });
  });

  describe("no tests at all", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(scriptsDir, "util.js"), '"use strict";\nmodule.exports = {};\n');
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw when no tests exist", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("returns valid result structure", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.ok(Array.isArray(result.findings));
      assert.ok(typeof result.scores === "object");
    });
  });

  describe("empty project", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on empty project", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100]", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("finding ID format", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("all finding IDs match SIA-NNN format", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(/^SIA-\d+$/.test(f.id), `finding.id "${f.id}" must match SIA-NNN`);
        assert.ok(["error", "warning", "info"].includes(f.severity));
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
