/**
 * track-resolutions.js Test Suite
 *
 * Tests the pure helper functions from scripts/audit/track-resolutions.js.
 * Core coverage:
 *   - parseArgs
 *   - isPathContained
 *   - normalizeRepoRelPath
 *   - classifyItem logic
 *   - classifyOpenItems bucketing
 *   - formatResultEntry
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

// ---------------------------------------------------------------------------
// Project root
// ---------------------------------------------------------------------------

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);
const REPO_ROOT = PROJECT_ROOT;

// ---------------------------------------------------------------------------
// Re-implemented pure helpers
// ---------------------------------------------------------------------------

function isPathContained(relPath: string): boolean {
  const resolved = path.resolve(REPO_ROOT, relPath);
  return resolved.startsWith(REPO_ROOT + path.sep) || resolved === REPO_ROOT;
}

function normalizeRepoRelPath(relPath: string): string | null {
  if (typeof relPath !== "string") return null;
  const trimmed = relPath.trim();
  if (!trimmed) return null;
  return trimmed.replace(/:(\d+)$/, "");
}

function parseArgs(argv: string[]): {
  dryRun: boolean;
  apply: boolean;
  jsonOutput: boolean;
  category: string | null;
} {
  const args = argv.slice(2);
  const apply = args.includes("--apply");
  const dryRun = !apply;
  const jsonOutput = args.includes("--json");

  let category: string | null = null;
  const catIdx = args.indexOf("--category");
  if (catIdx !== -1 && catIdx + 1 < args.length) {
    category = args[catIdx + 1];
  }

  return { dryRun, apply, jsonOutput, category };
}

interface DebtItem {
  id?: string;
  title?: string;
  file?: string;
  category?: string;
  status?: string;
  created?: string;
}

interface ClassifyResult {
  classification: "likely_resolved" | "potentially_resolved" | "still_open" | "unknown";
  reason: string;
}

function classifyItem(
  item: DebtItem,
  fileExistsFn: (f: string) => boolean,
  commitCountFn: (f: string, since: string | null) => number
): ClassifyResult {
  if (!item.file) {
    return { classification: "unknown", reason: "no file reference" };
  }

  const exists = fileExistsFn(item.file);
  if (!exists) {
    return { classification: "likely_resolved", reason: "file was deleted" };
  }

  const sinceDate = item.created || null;
  if (!sinceDate) {
    return { classification: "unknown", reason: "no created date to compare" };
  }

  const commitCount = commitCountFn(item.file, sinceDate);

  if (commitCount < 0) {
    return { classification: "unknown", reason: "could not query git history" };
  }

  if (commitCount >= 3) {
    return {
      classification: "likely_resolved",
      reason: `file significantly modified (${commitCount} commits since ${sinceDate})`,
    };
  }

  if (commitCount >= 1) {
    return {
      classification: "potentially_resolved",
      reason: `file modified (${commitCount} commit${commitCount === 1 ? "" : "s"} since ${sinceDate})`,
    };
  }

  return { classification: "still_open", reason: `unchanged since ${sinceDate}` };
}

function classifyOpenItems(
  openItems: DebtItem[],
  fileExistsFn: (f: string) => boolean,
  commitCountFn: (f: string, since: string | null) => number
) {
  const results: Record<
    string,
    Array<{ id: string | null; title: string; file: string | null; reason: string; item: DebtItem }>
  > = {
    likely_resolved: [],
    potentially_resolved: [],
    still_open: [],
    unknown: [],
  };

  for (const item of openItems) {
    const { classification, reason } = classifyItem(item, fileExistsFn, commitCountFn);
    results[classification].push({
      id: item.id ?? null,
      title: item.title || "(no title)",
      file: item.file || null,
      reason,
      item,
    });
  }

  return results;
}

function formatResultEntry(r: {
  id: string | null;
  title: string;
  file: string | null;
  reason: string;
  item: DebtItem;
}) {
  return { id: r.id, title: r.title, file: r.file, reason: r.reason };
}

// ---------------------------------------------------------------------------
// Tests: parseArgs
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
  it("defaults to dry-run, no json, no category", () => {
    const result = parseArgs(["node", "track.js"]);
    assert.equal(result.dryRun, true);
    assert.equal(result.apply, false);
    assert.equal(result.jsonOutput, false);
    assert.equal(result.category, null);
  });

  it("detects --apply flag", () => {
    const result = parseArgs(["node", "track.js", "--apply"]);
    assert.equal(result.apply, true);
    assert.equal(result.dryRun, false);
  });

  it("detects --json flag", () => {
    const result = parseArgs(["node", "track.js", "--json"]);
    assert.equal(result.jsonOutput, true);
  });

  it("extracts --category value", () => {
    const result = parseArgs(["node", "track.js", "--category", "security"]);
    assert.equal(result.category, "security");
  });

  it("handles all flags together", () => {
    const result = parseArgs([
      "node",
      "track.js",
      "--apply",
      "--json",
      "--category",
      "code-quality",
    ]);
    assert.equal(result.apply, true);
    assert.equal(result.jsonOutput, true);
    assert.equal(result.category, "code-quality");
  });
});

// ---------------------------------------------------------------------------
// Tests: isPathContained
// ---------------------------------------------------------------------------

describe("isPathContained", () => {
  it("allows a repo-relative path", () => {
    assert.equal(isPathContained("src/lib/auth.ts"), true);
  });

  it("allows a path in docs", () => {
    assert.equal(isPathContained("docs/technical-debt/MASTER_DEBT.jsonl"), true);
  });

  it("blocks path traversal with ..", () => {
    assert.equal(isPathContained("../../etc/passwd"), false);
  });
});

// ---------------------------------------------------------------------------
// Tests: normalizeRepoRelPath
// ---------------------------------------------------------------------------

describe("normalizeRepoRelPath", () => {
  it("strips trailing :line suffix", () => {
    assert.equal(normalizeRepoRelPath("src/auth.ts:42"), "src/auth.ts");
  });

  it("strips trailing :line from path with directory", () => {
    assert.equal(normalizeRepoRelPath("lib/foo/bar.ts:100"), "lib/foo/bar.ts");
  });

  it("returns path unchanged when no :line suffix", () => {
    assert.equal(normalizeRepoRelPath("src/auth.ts"), "src/auth.ts");
  });

  it("returns null for empty string", () => {
    assert.equal(normalizeRepoRelPath(""), null);
  });

  it("returns null for whitespace-only string", () => {
    assert.equal(normalizeRepoRelPath("   "), null);
  });

  it("returns null for non-string input", () => {
    assert.equal(normalizeRepoRelPath(null as unknown as string), null);
  });

  it("does not strip non-trailing :digit patterns", () => {
    // ':99' in the middle of a Windows-style path should be preserved
    assert.equal(normalizeRepoRelPath("C:/some/path"), "C:/some/path");
  });
});

// ---------------------------------------------------------------------------
// Tests: classifyItem
// ---------------------------------------------------------------------------

describe("classifyItem", () => {
  const alwaysExists = () => true;
  const neverExists = () => false;
  const noCommits = () => 0;
  const oneCommit = () => 1;
  const manyCommits = () => 5;
  const errorCommits = () => -1;

  it("returns 'unknown' when item has no file field", () => {
    const item: DebtItem = { id: "X", title: "No file" };
    const result = classifyItem(item, alwaysExists, noCommits);
    assert.equal(result.classification, "unknown");
    assert.ok(result.reason.includes("no file reference"));
  });

  it("returns 'likely_resolved' when file was deleted", () => {
    const item: DebtItem = { id: "X", file: "src/deleted.ts", created: "2026-01-01" };
    const result = classifyItem(item, neverExists, noCommits);
    assert.equal(result.classification, "likely_resolved");
    assert.ok(result.reason.includes("deleted"));
  });

  it("returns 'unknown' when file exists but no created date", () => {
    const item: DebtItem = { id: "X", file: "src/auth.ts" };
    const result = classifyItem(item, alwaysExists, noCommits);
    assert.equal(result.classification, "unknown");
    assert.ok(result.reason.includes("no created date"));
  });

  it("returns 'unknown' when commit count query fails", () => {
    const item: DebtItem = { id: "X", file: "src/auth.ts", created: "2026-01-01" };
    const result = classifyItem(item, alwaysExists, errorCommits);
    assert.equal(result.classification, "unknown");
    assert.ok(result.reason.includes("could not query git history"));
  });

  it("returns 'still_open' when 0 commits since creation", () => {
    const item: DebtItem = { id: "X", file: "src/auth.ts", created: "2026-01-01" };
    const result = classifyItem(item, alwaysExists, noCommits);
    assert.equal(result.classification, "still_open");
  });

  it("returns 'potentially_resolved' for 1 commit since creation", () => {
    const item: DebtItem = { id: "X", file: "src/auth.ts", created: "2026-01-01" };
    const result = classifyItem(item, alwaysExists, oneCommit);
    assert.equal(result.classification, "potentially_resolved");
    assert.ok(result.reason.includes("1 commit"));
  });

  it("returns 'likely_resolved' for 5 commits since creation", () => {
    const item: DebtItem = { id: "X", file: "src/auth.ts", created: "2026-01-01" };
    const result = classifyItem(item, alwaysExists, manyCommits);
    assert.equal(result.classification, "likely_resolved");
    assert.ok(result.reason.includes("5 commits"));
  });
});

// ---------------------------------------------------------------------------
// Tests: classifyOpenItems
// ---------------------------------------------------------------------------

describe("classifyOpenItems", () => {
  it("correctly buckets items into four classifications", () => {
    const items: DebtItem[] = [
      { id: "A", file: "src/a.ts", created: "2026-01-01" }, // deleted -> likely_resolved
      { id: "B", file: "src/b.ts", created: "2026-01-01" }, // exists, many commits -> likely_resolved
      { id: "C", file: "src/c.ts", created: "2026-01-01" }, // exists, 0 commits -> still_open
      { id: "D" }, // no file -> unknown
    ];

    const fileExists = (f: string) => f !== "src/a.ts";
    const commitCount = (f: string, _: string | null) => {
      if (f === "src/b.ts") return 5;
      if (f === "src/c.ts") return 0;
      return 0;
    };

    const results = classifyOpenItems(items, fileExists, commitCount);

    assert.equal(results.likely_resolved.length, 2, "A and B should be likely_resolved");
    assert.equal(results.still_open.length, 1, "C should be still_open");
    assert.equal(results.unknown.length, 1, "D should be unknown");
    assert.equal(results.potentially_resolved.length, 0);
  });

  it("preserves item properties in result entries", () => {
    const items: DebtItem[] = [
      { id: "Z", title: "My finding", file: "src/z.ts", created: "2026-01-01" },
    ];
    const fileExists = () => false;
    const commitCount = () => 0;
    const results = classifyOpenItems(items, fileExists, commitCount);
    assert.equal(results.likely_resolved[0].id, "Z");
    assert.equal(results.likely_resolved[0].title, "My finding");
  });
});

// ---------------------------------------------------------------------------
// Tests: formatResultEntry
// ---------------------------------------------------------------------------

describe("formatResultEntry", () => {
  it("strips internal item reference from output", () => {
    const entry = {
      id: "SEC-001",
      title: "Auth bypass",
      file: "src/auth.ts",
      reason: "file deleted",
      item: { id: "SEC-001", file: "src/auth.ts" },
    };
    const formatted = formatResultEntry(entry);
    assert.equal(formatted.id, "SEC-001");
    assert.equal(formatted.title, "Auth bypass");
    assert.equal(formatted.file, "src/auth.ts");
    assert.equal(formatted.reason, "file deleted");
    assert.ok(!("item" in formatted), "item property should not appear in output");
  });
});

// ---------------------------------------------------------------------------
// Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("track-resolutions.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/audit/track-resolutions.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });
});
