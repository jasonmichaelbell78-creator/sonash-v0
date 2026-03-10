/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sia-seh-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "safety-error-handling.js");

describe("safety-error-handling checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "safety_error_handling");
    });
  });

  describe("happy path — safe scripts with error handling", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      // Safe script with proper error handling and path containment
      const safeScript = [
        '"use strict";',
        "const fs = require('node:fs');",
        "const path = require('node:path');",
        "function safeRead(filePath) {",
        "  try {",
        "    const rel = path.relative(process.cwd(), filePath);",
        "    if (/^\\.\\.(?:[\\\\/]|$)/.test(rel)) throw new Error('Path traversal detected');",
        "    return fs.readFileSync(filePath, 'utf8');",
        "  } catch (e) {",
        "    process.stderr.write(String(e));",
        "    return null;",
        "  }",
        "}",
        "module.exports = { safeRead };",
      ].join("\n");
      fs.writeFileSync(path.join(scriptsDir, "safe-script.js"), safeScript);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "safety_error_handling");
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

  describe("scripts with unsafe patterns", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      // Unsafe: using exec without sanitization, logging raw errors
      const unsafeScript = [
        '"use strict";',
        "const { exec } = require('child_process');",
        "const userInput = process.argv[2];",
        "exec('ls ' + userInput);",
        "try { } catch(e) { console.log(e.message); }",
      ].join("\n");
      fs.writeFileSync(path.join(scriptsDir, "unsafe.js"), unsafeScript);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on unsafe scripts", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] even for unsafe scripts", () => {
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
      const scriptsDir = path.join(tmpDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(scriptsDir, "test.js"), "const x = require('foo');\n");
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
