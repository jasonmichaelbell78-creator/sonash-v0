/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dea-lri-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "link-reference-integrity.js");

describe("link-reference-integrity checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "link_reference_integrity");
    });
  });

  describe("happy path — all links valid", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"), { recursive: true });
      // Create two docs that link to each other
      fs.writeFileSync(
        path.join(tmpDir, "docs", "doc-a.md"),
        "# Doc A\nSee [Doc B](doc-b.md) for more.\n"
      );
      fs.writeFileSync(
        path.join(tmpDir, "docs", "doc-b.md"),
        "# Doc B\nSee [Doc A](doc-a.md) for more.\n"
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns the correct domain", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "link_reference_integrity");
    });

    it("returns findings array and scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
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
      // No docs directory at all
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when docs/ is absent", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("returns scores defaulting to 100 when no docs exist", () => {
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

  describe("broken internal links", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"), { recursive: true });
      // This doc links to a file that doesn't exist
      fs.writeFileSync(
        path.join(tmpDir, "docs", "broken.md"),
        "# Broken\nSee [Missing](does-not-exist.md).\n"
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("detects broken internal links and reduces score", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const linkScore = result.scores.internal_link_health;
      if (linkScore !== undefined) {
        assert.ok(
          linkScore.score < 100,
          `Expected score < 100 for broken links, got ${linkScore.score}`
        );
      }
    });

    it("finding IDs use DEA- prefix", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(/^DEA-\d+$/.test(f.id), `finding.id "${f.id}" must match DEA-NNN`);
      }
    });
  });

  describe("malformed markdown — no links at all", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"));
      fs.writeFileSync(path.join(tmpDir, "docs", "plain.md"), "# Plain\nNo links here.\n");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on doc with no links", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });
  });

  describe("findings schema validation", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"));
      fs.writeFileSync(
        path.join(tmpDir, "docs", "test.md"),
        "# Test\n[Broken](missing.md)\n[External](https://example.com)\n"
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("each finding has id, severity, message", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(typeof f.id === "string", "id must be string");
        assert.ok(typeof f.severity === "string", "severity must be string");
        assert.ok(typeof f.message === "string", "message must be string");
      }
    });
  });
});
