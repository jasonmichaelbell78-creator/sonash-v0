/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dea-cq-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "content-quality.js");

describe("content-quality checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "content_quality");
    });
  });

  describe("happy path — high quality docs", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"), { recursive: true });
      // Well-structured docs with headings and content
      const goodDoc = [
        "# Well Structured Document",
        "",
        "## Introduction",
        "",
        "This document has good structure and meaningful content.",
        "It contains multiple paragraphs with substantial information.",
        "",
        "## Details",
        "",
        "More content goes here with proper headings and organized sections.",
      ].join("\n");
      fs.writeFileSync(path.join(tmpDir, "docs", "good-doc.md"), goodDoc);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "content_quality");
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

  describe("empty docs directory", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when docs/ is absent", () => {
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

  describe("poor quality docs — empty files", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"));
      fs.writeFileSync(path.join(tmpDir, "docs", "empty.md"), "");
      fs.writeFileSync(path.join(tmpDir, "docs", "stub.md"), "# Title\n");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on empty or stub files", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are still in [0, 100] for poor quality input", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(
          val.score >= 0 && val.score <= 100,
          `Score for ${key} out of range: ${val.score}`
        );
      }
    });
  });

  describe("malformed content — binary-like data", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"));
      // Write non-UTF8 content
      fs.writeFileSync(path.join(tmpDir, "docs", "corrupt.md"), Buffer.from([0xff, 0xfe, 0x00]));
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on malformed file content", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });
  });

  describe("finding ID format", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"));
      fs.writeFileSync(path.join(tmpDir, "docs", "bad.md"), "");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("all finding IDs match DEA-NNN format", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(/^DEA-\d+$/.test(f.id), `finding.id "${f.id}" must match DEA-NNN`);
        assert.ok(
          ["error", "warning", "info"].includes(f.severity),
          `Invalid severity: ${f.severity}`
        );
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
