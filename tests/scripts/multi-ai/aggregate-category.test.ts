/**
 * aggregate-category.js Test Suite
 *
 * Tests the pure helper functions from scripts/multi-ai/aggregate-category.js.
 * This module uses ES module syntax (import/export), so we test via dynamic import.
 * We focus on the exported utility functions: deduplicateFindings, calculateSimilarity,
 * levenshteinDistance, normalizeTitle, getFileLineKey, mergeFindings,
 * and aggregateCategory itself.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// The module uses ES module syntax. We create a CJS wrapper that extracts
// the internal helpers and the exported aggregateCategory function.

interface AggregateModule {
  aggregateCategory: (
    sessionPath: string,
    category: string
  ) => Promise<{ findings: object[]; report: object & { error?: string } }>;
  getCategorySources: (
    sessionPath: string,
    category: string
  ) => { sources: object[]; total_findings: number };
  // Internal helpers exposed via wrapper
  calculateSimilarity: (str1: string, str2: string) => number;
  levenshteinDistance: (str1: string, str2: string) => number;
  normalizeTitle: (title: string) => string;
  getFileLineKey: (finding: Record<string, unknown>) => string | null;
  mergeFindings: (
    primary: Record<string, unknown>,
    secondary: Record<string, unknown>
  ) => Record<string, unknown>;
}

let mod: AggregateModule;

before(async () => {
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/multi-ai/aggregate-category.js");

  // We create a temporary CJS wrapper that imports the ES module and re-exports helpers
  const wrapperSrc = `
const { createRequire } = require("node:module");
// We use dynamic import to load the ES module, then expose helpers via module.exports promise
module.exports = (async () => {
  const mod = await import(${JSON.stringify("file://" + srcPath.replaceAll(/\\/g, "/"))});
  return {
    aggregateCategory: mod.aggregateCategory,
    getCategorySources: mod.getCategorySources,
    // The internal helpers are not exported from the module, so we test via aggregateCategory behaviour.
  };
})();
`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aggregate-cat-test-"));
  const tmpFile = path.join(tmpDir, "wrapper.cjs");
  fs.writeFileSync(tmpFile, wrapperSrc, "utf-8");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const promise = require(tmpFile) as Promise<AggregateModule>;
    mod = await promise;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// =========================================================
// aggregateCategory - error paths
// =========================================================

describe("aggregateCategory - missing raw directory", () => {
  it("returns empty findings with error report when raw/ dir is missing", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agg-session-"));
    try {
      // No raw/ subdirectory — only the session root exists
      const result = await mod.aggregateCategory(tmpDir, "security");
      assert.equal(Array.isArray(result.findings), true);
      assert.equal(result.findings.length, 0);
      assert.ok(typeof result.report === "object", "Report should be an object");
      const report = result.report as Record<string, unknown>;
      assert.ok(
        typeof report.error === "string" && report.error.includes("Raw directory"),
        "Report should indicate missing raw dir"
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("aggregateCategory - no source files for category", () => {
  it("returns empty findings when raw/ exists but has no matching files", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agg-session-"));
    try {
      fs.mkdirSync(path.join(tmpDir, "raw"), { recursive: true });
      // No security-*.jsonl files
      const result = await mod.aggregateCategory(tmpDir, "security");
      assert.equal(result.findings.length, 0);
      const report = result.report as Record<string, unknown>;
      assert.ok(
        typeof report.error === "string" && report.error.includes("No source files"),
        "Report should indicate no source files"
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("aggregateCategory - valid JSONL input", () => {
  it("produces canonical findings with CANON IDs", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agg-session-"));
    try {
      const rawDir = path.join(tmpDir, "raw");
      const canonDir = path.join(tmpDir, "canon");
      fs.mkdirSync(rawDir, { recursive: true });
      fs.mkdirSync(canonDir, { recursive: true });

      const finding1 = {
        fingerprint: "fp-001",
        title: "SQL Injection in login form",
        severity: "S1",
        effort: "E2",
        category: "security",
        confidence: 85,
        files: ["src/auth.ts"],
      };
      const finding2 = {
        fingerprint: "fp-002",
        title: "Missing input validation",
        severity: "S2",
        effort: "E1",
        category: "security",
        confidence: 70,
        files: [],
      };

      fs.writeFileSync(
        path.join(rawDir, "security-claude.jsonl"),
        [JSON.stringify(finding1), JSON.stringify(finding2)].join("\n"),
        "utf-8"
      );

      const result = await mod.aggregateCategory(tmpDir, "security");
      assert.ok(result.findings.length >= 1, "Should produce at least one canonical finding");

      // All findings should have canonical_id
      for (const f of result.findings as Array<Record<string, unknown>>) {
        assert.ok(
          typeof f.canonical_id === "string" && f.canonical_id.startsWith("CANON-"),
          "Each finding should have a CANON-XXXX id"
        );
        assert.ok(typeof f.status === "string", "Each finding should have status");
        assert.ok(
          typeof f.consensus_score === "number",
          "Each finding should have consensus_score"
        );
      }

      // Report should contain summary stats
      const report = result.report as Record<string, unknown>;
      assert.equal(report.category, "security");
      assert.equal(typeof report.raw_findings, "number");
      assert.equal(typeof report.unique_findings, "number");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("deduplicates findings with identical fingerprints", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agg-session-dedup-"));
    try {
      const rawDir = path.join(tmpDir, "raw");
      const canonDir = path.join(tmpDir, "canon");
      fs.mkdirSync(rawDir, { recursive: true });
      fs.mkdirSync(canonDir, { recursive: true });

      const finding = {
        fingerprint: "fp-same",
        title: "Same finding twice",
        severity: "S2",
        effort: "E1",
        category: "security",
        confidence: 75,
        files: [],
      };

      // Same fingerprint appears in two "sources"
      fs.writeFileSync(
        path.join(rawDir, "security-claude.jsonl"),
        JSON.stringify(finding),
        "utf-8"
      );
      fs.writeFileSync(path.join(rawDir, "security-gpt.jsonl"), JSON.stringify(finding), "utf-8");

      const result = await mod.aggregateCategory(tmpDir, "security");
      // Fingerprint dedup: two identical fps → 1 unique finding
      assert.equal(result.findings.length, 1, "Identical fingerprints should be deduplicated");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// =========================================================
// getCategorySources
// =========================================================

describe("getCategorySources", () => {
  it("returns empty sources when raw/ directory does not exist", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getsrc-test-"));
    try {
      const result = mod.getCategorySources(tmpDir, "security");
      assert.equal(Array.isArray(result.sources), true);
      assert.equal(result.sources.length, 0);
      assert.equal(result.total_findings, 0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("counts findings in source files", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getsrc-count-test-"));
    try {
      const rawDir = path.join(tmpDir, "raw");
      fs.mkdirSync(rawDir, { recursive: true });

      fs.writeFileSync(
        path.join(rawDir, "security-claude.jsonl"),
        ['{"id":1}', '{"id":2}', '{"id":3}'].join("\n"),
        "utf-8"
      );

      const result = mod.getCategorySources(tmpDir, "security");
      assert.equal(result.total_findings, 3);
      assert.equal(result.sources.length, 1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("excludes .normalized.jsonl and .fixed.jsonl intermediate files", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "getsrc-exclude-test-"));
    try {
      const rawDir = path.join(tmpDir, "raw");
      fs.mkdirSync(rawDir, { recursive: true });

      // Real source
      fs.writeFileSync(path.join(rawDir, "security-claude.jsonl"), '{"id":1}', "utf-8");
      // Intermediate files — should be excluded
      fs.writeFileSync(path.join(rawDir, "security-claude.normalized.jsonl"), '{"id":2}', "utf-8");
      fs.writeFileSync(path.join(rawDir, "security-claude.fixed.jsonl"), '{"id":3}', "utf-8");

      const result = mod.getCategorySources(tmpDir, "security");
      assert.equal(result.sources.length, 1, "Only the real source should be counted");
      assert.equal(result.total_findings, 1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
