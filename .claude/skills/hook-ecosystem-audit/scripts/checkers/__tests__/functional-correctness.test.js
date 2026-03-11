/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hea-fc-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "functional-correctness.js");

describe("functional-correctness checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "functional_correctness");
    });
  });

  describe("happy path — hooks with proper structure", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const hooksDir = path.join(tmpDir, ".claude", "hooks");
      fs.mkdirSync(hooksDir, { recursive: true });
      // Well-structured hook
      const goodHook = [
        "/* eslint-disable */",
        '"use strict";',
        "const data = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');",
        "try {",
        "  process.stdout.write(JSON.stringify({ result: 'ok' }));",
        "  process.exit(0);",
        "} catch (e) {",
        "  process.exit(1);",
        "}",
      ].join("\n");
      fs.writeFileSync(path.join(hooksDir, "good-hook.js"), goodHook);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "functional_correctness");
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

  describe("empty hooks directory", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, ".claude", "hooks"), { recursive: true });
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on empty hooks directory", () => {
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

  describe("malformed hook file — syntax error", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const hooksDir = path.join(tmpDir, ".claude", "hooks");
      fs.mkdirSync(hooksDir, { recursive: true });
      fs.writeFileSync(path.join(hooksDir, "broken.js"), "{ this is not valid js }{{{");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on malformed hook content", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for malformed input", () => {
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

    it("all finding IDs match HEA-NNN format", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(/^HEA-\d+$/.test(f.id), `finding.id "${f.id}" must match HEA-NNN`);
        assert.ok(["error", "warning", "info"].includes(f.severity));
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
