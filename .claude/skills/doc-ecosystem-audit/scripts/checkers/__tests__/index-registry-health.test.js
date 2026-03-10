/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// Helper: create a temp directory with controlled contents
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dea-irh-"));
}

function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Resolve the checker relative to this test file
const CHECKER_PATH = path.join(__dirname, "..", "index-registry-health.js");

describe("index-registry-health checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.ok(checker.DOMAIN.length > 0);
    });
  });

  describe("happy path — well-synced index", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      // Create docs/ directory
      fs.mkdirSync(path.join(tmpDir, "docs"), { recursive: true });
      // Create two doc files
      fs.writeFileSync(path.join(tmpDir, "docs", "guide.md"), "# Guide\nContent here.\n");
      fs.writeFileSync(path.join(tmpDir, "docs", "api.md"), "# API Reference\nContent here.\n");
      // Create DOCUMENTATION_INDEX.md referencing both
      const indexContent = [
        "# Documentation Index",
        "",
        "| Title | Path | Description |",
        "| --- | --- | --- |",
        "| [Guide](docs/guide.md) | docs/guide.md | The main guide |",
        "| [API](docs/api.md) | docs/api.md | API reference |",
      ].join("\n");
      fs.writeFileSync(path.join(tmpDir, "DOCUMENTATION_INDEX.md"), indexContent);
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, and scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "index_registry_health");
      assert.ok(Array.isArray(result.findings));
      assert.ok(result.scores && typeof result.scores === "object");
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

    it("findings have required schema fields", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(typeof f.id === "string", "finding.id must be string");
        assert.ok(typeof f.severity === "string", "finding.severity must be string");
        assert.ok(typeof f.message === "string", "finding.message must be string");
        assert.ok(/^DEA-\d+$/.test(f.id), `finding.id "${f.id}" must match DEA-NNN`);
      }
    });
  });

  describe("empty/missing DOCUMENTATION_INDEX.md", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"), { recursive: true });
    });
    after(() => removeTempDir(tmpDir));

    it("returns score of 0 for index_filesystem_sync when index is missing", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const syncScore = result.scores.index_filesystem_sync;
      assert.ok(syncScore !== undefined);
      assert.equal(syncScore.score, 0);
    });

    it("adds DEA-100 finding for missing index", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const ids = result.findings.map((f) => f.id);
      assert.ok(ids.includes("DEA-100"), "Expected DEA-100 finding for missing index");
    });
  });

  describe("malformed index content", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      // Write a DOCUMENTATION_INDEX.md with no valid links
      fs.writeFileSync(
        path.join(tmpDir, "DOCUMENTATION_INDEX.md"),
        "# Index\nNo links here, just text.\n\x00\xff\xfe"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on malformed index content", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("returns valid result structure even with malformed content", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.ok(Array.isArray(result.findings));
      assert.ok(typeof result.scores === "object");
    });
  });

  describe("scoring boundary: perfect sync", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, "docs"));
      fs.writeFileSync(path.join(tmpDir, "docs", "readme.md"), "# Readme\n");
      fs.writeFileSync(
        path.join(tmpDir, "DOCUMENTATION_INDEX.md"),
        "| [Readme](docs/readme.md) | docs/readme.md | readme |"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("score is in [0, 100] when index and disk are provided", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const syncScore = result.scores.index_filesystem_sync;
      assert.ok(
        syncScore.score >= 0 && syncScore.score <= 100,
        `Expected score in [0,100], got ${syncScore.score}`
      );
    });
  });

  describe("stale index entry — file missing on disk", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      // Index references a file that does not exist
      fs.writeFileSync(
        path.join(tmpDir, "DOCUMENTATION_INDEX.md"),
        "| [Ghost](docs/ghost.md) | docs/ghost.md | missing |"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("adds DEA-101 finding for index entry with missing file", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const ids = result.findings.map((f) => f.id);
      assert.ok(ids.includes("DEA-101"), "Expected DEA-101 for file missing on disk");
    });

    it("sync score is reduced when files are missing", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const syncScore = result.scores.index_filesystem_sync;
      assert.ok(syncScore.score < 100, "Sync score should be < 100 when file is missing");
    });
  });
});
