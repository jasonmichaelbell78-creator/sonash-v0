/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tdms-pc-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "pipeline-correctness.js");

describe("pipeline-correctness checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "pipeline_correctness");
    });
  });

  describe("happy path — pipeline scripts with correct ordering", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      const debtDir = path.join(tmpDir, "docs", "technical-debt");
      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.mkdirSync(debtDir, { recursive: true });
      // consolidate-all.js with all pipeline phases
      const consolidateAll = [
        '"use strict";',
        "// Pipeline: extract -> normalize -> dedup -> views",
        "const steps = [",
        "  require('./extract-audits'),",
        "  require('./extract-reviews'),",
        "  require('./extract-sonarcloud'),",
        "  require('./normalize-all'),",
        "  require('./dedup-multi-pass'),",
        "  require('./generate-views'),",
        "];",
        "module.exports = { steps };",
      ].join("\n");
      fs.writeFileSync(path.join(scriptsDir, "consolidate-all.js"), consolidateAll);
      // Create stub pipeline scripts
      [
        "extract-audits",
        "extract-reviews",
        "extract-sonarcloud",
        "normalize-all",
        "dedup-multi-pass",
        "generate-views",
      ].forEach((name) => {
        fs.writeFileSync(
          path.join(scriptsDir, `${name}.js`),
          `"use strict";\nmodule.exports = {};\n`
        );
      });
      // Data flow files
      fs.writeFileSync(path.join(debtDir, "raw-items.jsonl"), "");
      fs.writeFileSync(path.join(debtDir, "MASTER_DEBT.jsonl"), "");
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "pipeline_correctness");
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

  describe("missing pipeline scripts", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw when pipeline scripts are absent", () => {
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

  describe("partial pipeline — some phases missing", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      // consolidate-all.js missing some phases
      fs.writeFileSync(
        path.join(scriptsDir, "consolidate-all.js"),
        '"use strict";\n// Only extract, no normalize/dedup\nconst extract = require("./extract-audits");\nmodule.exports = { extract };\n'
      );
      fs.writeFileSync(
        path.join(scriptsDir, "extract-audits.js"),
        '"use strict";\nmodule.exports = {};\n'
      );
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on partial pipeline", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for partial pipeline", () => {
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

    it("all findings have id, severity, message", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(typeof f.id === "string" && f.id.length > 0);
        assert.ok(["error", "warning", "info"].includes(f.severity));
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
