/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sia-cq-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "code-quality.js");

describe("code-quality checker (script-ecosystem)", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "code_quality");
    });
  });

  describe("happy path — clean scripts", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      // Well-written script
      const goodScript = [
        "/* eslint-disable @typescript-eslint/no-require-imports */",
        '"use strict";',
        "const fs = require('node:fs');",
        "const path = require('node:path');",
        "",
        "/**",
        " * Analyze project structure.",
        " * @param {string} rootDir",
        " */",
        "function analyze(rootDir) {",
        "  if (!rootDir) throw new Error('rootDir required');",
        "  return { ok: true };",
        "}",
        "",
        "module.exports = { analyze };",
      ].join("\n");
      fs.writeFileSync(path.join(scriptsDir, "analyze.js"), goodScript);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "code_quality");
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

  describe("no scripts", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when no scripts exist", () => {
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

  describe("low quality scripts", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      // No JSDoc, no strict mode, uses any/eval
      fs.writeFileSync(
        path.join(scriptsDir, "bad.js"),
        "var x = 1;\neval('bad');\nconsole.log('no strict mode');\n"
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on low quality scripts", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for low quality code", () => {
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
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

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
