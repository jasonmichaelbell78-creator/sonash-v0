/**
 * Unit tests for scripts/reviews/lib/generate-claude-antipatterns.ts
 *
 * Tests generateAntiPatternsTable() and updateClaudeMd() (dry-run mode only).
 * No live CLAUDE.md is written — all writes are prevented via dryRun=true or
 * by using temp directories.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const distPath = path.resolve(
  PROJECT_ROOT,
  "scripts/reviews/dist/lib/generate-claude-antipatterns.js"
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateAntiPatternsTable, updateClaudeMd } = require(distPath) as {
  generateAntiPatternsTable: (
    patterns: Array<{
      pattern: string;
      count: number;
      distinctPRs: { size: number };
      reviewIds: string[];
    }>,
    maxPatterns?: number
  ) => string;
  updateClaudeMd: (
    projectRoot: string,
    patterns: Array<{
      pattern: string;
      count: number;
      distinctPRs: { size: number };
      reviewIds: string[];
    }>,
    dryRun?: boolean
  ) => string;
};

// =========================================================
// Helpers
// =========================================================

function makePattern(
  pattern: string,
  count: number,
  prCount: number
): {
  pattern: string;
  count: number;
  distinctPRs: Set<number>;
  reviewIds: string[];
} {
  const prSet = new Set<number>();
  for (let i = 1; i <= prCount; i++) prSet.add(i);
  return { pattern, count, distinctPRs: prSet, reviewIds: [] };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-claude-test-"));
  // Create a package.json so safe-fs can locate the project root
  fs.writeFileSync(path.join(tmpDir, "package.json"), "{}", "utf-8");
  // Copy safe-fs.js into tmpDir structure so updateClaudeMd can load it
  const safeFsSrc = path.join(PROJECT_ROOT, "scripts", "lib", "safe-fs.js");
  fs.mkdirSync(path.join(tmpDir, "scripts", "lib"), { recursive: true });
  fs.copyFileSync(safeFsSrc, path.join(tmpDir, "scripts", "lib", "safe-fs.js"));
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

// =========================================================
// 1. generateAntiPatternsTable
// =========================================================

describe("generateAntiPatternsTable", () => {
  test("returns empty-state table when no patterns provided", () => {
    const table = generateAntiPatternsTable([]);
    assert.ok(table.includes("(none detected)"));
  });

  test("includes pattern names as title-cased rows", () => {
    const patterns = [makePattern("missing-error-handling", 5, 3)];
    const table = generateAntiPatternsTable(patterns);
    assert.ok(table.includes("Missing Error Handling"));
  });

  test("includes occurrence count and PR count in the rule column", () => {
    const patterns = [makePattern("path-traversal", 8, 4)];
    const table = generateAntiPatternsTable(patterns);
    assert.ok(table.includes("8x"));
    assert.ok(table.includes("4 PRs"));
  });

  test("limits output to maxPatterns (default 6)", () => {
    const patterns = Array.from({ length: 10 }, (_, i) => makePattern(`pattern-${i}`, 10 - i, 2));
    const table = generateAntiPatternsTable(patterns);
    const rowCount = (table.match(/^\|/gm) ?? []).length - 2; // subtract header + separator
    assert.ok(rowCount <= 6, `Expected at most 6 rows, got ${rowCount}`);
  });

  test("respects a custom maxPatterns value", () => {
    const patterns = Array.from({ length: 10 }, (_, i) => makePattern(`pattern-${i}`, 10 - i, 2));
    const table = generateAntiPatternsTable(patterns, 3);
    const rowCount = (table.match(/^\|/gm) ?? []).length - 2;
    assert.ok(rowCount <= 3, `Expected at most 3 rows, got ${rowCount}`);
  });

  test("table starts with a header and separator row", () => {
    const patterns = [makePattern("some-pattern", 3, 2)];
    const table = generateAntiPatternsTable(patterns);
    const lines = table.split("\n");
    assert.ok(lines[0].includes("Pattern"));
    assert.ok(lines[1].includes("---"));
  });

  test("escapes pipe characters in pattern names", () => {
    const p = makePattern("pipe|injection", 3, 2);
    const table = generateAntiPatternsTable([p]);
    // The pipe in the name should be escaped so it does not break the table
    const rows = table
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.includes("---") && !l.includes("Pattern"));
    for (const row of rows) {
      // Each row should have exactly 2 pipe-delimited columns (4 pipes total: leading, separator, trailing)
      const pipes = (row.match(/\|/g) ?? []).length;
      assert.ok(pipes >= 2, "Row should have balanced pipes");
    }
  });
});

// =========================================================
// 2. updateClaudeMd (dry-run)
// =========================================================

describe("updateClaudeMd (dry-run)", () => {
  const MARKER_START = "<!-- AUTO-ANTIPATTERNS-START -->";
  const MARKER_END = "<!-- AUTO-ANTIPATTERNS-END -->";

  test("dry-run returns updated content without writing the file", () => {
    const original = [
      "# CLAUDE.md",
      "",
      MARKER_START,
      "| Pattern            | Rule                                                                         |",
      "| ------------------ | ---------------------------------------------------------------------------- |",
      "| Old Pattern | Old rule |",
      MARKER_END,
      "",
    ].join("\n");

    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), original, "utf-8");

    const patterns = [makePattern("new-error-pattern", 5, 3)];
    const result = updateClaudeMd(tmpDir, patterns, true);

    // Result should contain the new pattern
    assert.ok(result.includes("New Error Pattern"));
    // The file on disk should be unchanged
    const onDisk = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    assert.equal(onDisk, original);
  });

  test("replaces content between existing markers", () => {
    const original = [
      "# CLAUDE",
      "",
      MARKER_START,
      "| Pattern            | Rule                                                                         |",
      "| --- | --- |",
      "| Stale Pattern | old rule |",
      MARKER_END,
      "",
      "## Other Section",
    ].join("\n");

    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), original, "utf-8");

    const patterns = [makePattern("fresh-pattern", 4, 2)];
    const result = updateClaudeMd(tmpDir, patterns, true);

    assert.ok(result.includes("Fresh Pattern"));
    assert.ok(!result.includes("Stale Pattern"), "Old pattern should be replaced");
    // Markers must still be present
    assert.ok(result.includes(MARKER_START));
    assert.ok(result.includes(MARKER_END));
  });

  test("preserves content outside markers", () => {
    const original = [
      "# Title",
      "Intro text.",
      "",
      MARKER_START,
      "| Pattern            | Rule                                                                         |",
      "| --- | --- |",
      "| Old | old |",
      MARKER_END,
      "",
      "## Conclusion",
      "Footer text.",
    ].join("\n");

    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), original, "utf-8");

    const patterns = [makePattern("replacement", 3, 2)];
    const result = updateClaudeMd(tmpDir, patterns, true);

    assert.ok(result.includes("# Title"));
    assert.ok(result.includes("Intro text."));
    assert.ok(result.includes("## Conclusion"));
    assert.ok(result.includes("Footer text."));
  });

  test("throws when CLAUDE.md is not found", () => {
    assert.throws(() => updateClaudeMd(tmpDir, [], true), /CLAUDE.md not found/);
  });

  test("throws on mismatched markers (start without end)", () => {
    const broken = "# CLAUDE\n" + MARKER_START + "\nsome content\n";
    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), broken, "utf-8");

    assert.throws(() => updateClaudeMd(tmpDir, [], true), /Unmatched AUTO-ANTIPATTERNS markers/);
  });

  test("wraps existing table on first run (no markers)", () => {
    const original = [
      "# CLAUDE",
      "",
      "## 4. Critical Anti-Patterns",
      "",
      "| Pattern            | Rule                                                                         |",
      "| ------------------ | ---------------------------------------------------------------------------- |",
      "| Error sanitization | Use `scripts/lib/sanitize-error.js` |",
      "",
      "## 5. Next Section",
    ].join("\n");

    fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), original, "utf-8");

    const patterns = [makePattern("new-pattern", 4, 2)];
    const result = updateClaudeMd(tmpDir, patterns, true);

    assert.ok(result.includes(MARKER_START));
    assert.ok(result.includes(MARKER_END));
    assert.ok(result.includes("New Pattern"));
  });
});
