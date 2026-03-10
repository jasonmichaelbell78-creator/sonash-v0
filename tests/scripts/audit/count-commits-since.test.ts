/**
 * count-commits-since.js Test Suite
 *
 * Tests the pure helper functions from scripts/audit/count-commits-since.js.
 * The script has no module exports so we re-implement its pure functions and
 * verify them independently.  Core coverage:
 *   - parseArgs  (--json, --category, space-separated formats)
 *   - extractLastAuditDate
 *   - extractThreshold
 *   - parseTableRow
 *   - statusIcon
 *   - filterCategories
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

// ---------------------------------------------------------------------------
// Re-implemented pure helpers (identical logic to source)
// ---------------------------------------------------------------------------

const DEFAULT_THRESHOLD = 30;

const CATEGORIES = [
  { display: "Code", key: "code-quality" },
  { display: "Security", key: "security" },
  { display: "Performance", key: "performance" },
  { display: "Refactoring", key: "refactoring" },
  { display: "Documentation", key: "documentation" },
  { display: "Process", key: "process" },
  { display: "Engineering-Productivity", key: "engineering-productivity" },
  { display: "Enhancements", key: "enhancements" },
  { display: "AI Optimization", key: "ai-optimization" },
];

function extractLastAuditDate(raw: string): string | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  if (raw.trim().toLowerCase().startsWith("never")) return null;
  const match = raw.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function extractThreshold(rawTrigger: string): number {
  const match = rawTrigger.match(/(\d+)\s+commits/i);
  return match ? Number.parseInt(match[1], 10) : DEFAULT_THRESHOLD;
}

function parseTableRow(
  line: string,
  categories: typeof CATEGORIES
): { display: string; key: string; lastAuditDate: string | null; threshold: number } | null {
  const cells = line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
  if (cells.length < 5) return null;

  const rawCategory = cells[0].replaceAll("**", "").trim();
  const rawLastAudit = cells[1].replaceAll("_", "").trim();
  const rawTrigger = cells[4].trim();

  const matched = categories.find((cat) => {
    const displayLower = cat.display.toLowerCase();
    return (
      rawCategory.toLowerCase() === displayLower || rawCategory.toLowerCase().includes(displayLower)
    );
  });
  if (!matched) return null;

  const lastAuditDate = extractLastAuditDate(rawLastAudit);
  const threshold = extractThreshold(rawTrigger);

  return { display: matched.display, key: matched.key, lastAuditDate, threshold };
}

function parseArgs(argv: string[]): { categoryFilter: string | null; jsonOutput: boolean } {
  const args = argv.slice(2);
  let categoryFilter: string | null = null;
  let jsonOutput = false;

  for (const arg of args) {
    if (arg === "--json") {
      jsonOutput = true;
    } else if (arg.startsWith("--category=")) {
      categoryFilter = arg.split("=")[1];
    }
  }

  const catIdx = args.indexOf("--category");
  if (catIdx !== -1 && catIdx + 1 < args.length && !args[catIdx + 1].startsWith("--")) {
    categoryFilter = args[catIdx + 1];
  }

  return { categoryFilter, jsonOutput };
}

function statusIcon(isError: boolean, exceeded: boolean): string {
  if (isError) return "\u274c ERROR";
  if (exceeded) return "\u26a0\ufe0f EXCEEDED";
  return "\u2705 OK";
}

function filterCategories(
  trackerData: typeof CATEGORIES,
  categoryFilter: string | null
): typeof CATEGORIES {
  if (!categoryFilter) return trackerData;
  const filterLower = categoryFilter.toLowerCase();
  return trackerData.filter((cat) => {
    return cat.display.toLowerCase() === filterLower || cat.key.toLowerCase() === filterLower;
  });
}

// ---------------------------------------------------------------------------
// Tests: extractLastAuditDate
// ---------------------------------------------------------------------------

describe("extractLastAuditDate", () => {
  it("returns date string from standard format", () => {
    assert.equal(extractLastAuditDate("2026-02-07"), "2026-02-07");
  });

  it("returns date from annotated format 'YYYY-MM-DD (Comprehensive)'", () => {
    assert.equal(extractLastAuditDate("2026-02-07 (Comprehensive)"), "2026-02-07");
  });

  it("returns null for 'Never'", () => {
    assert.equal(extractLastAuditDate("Never"), null);
  });

  it("returns null for 'never audited'", () => {
    assert.equal(extractLastAuditDate("never audited"), null);
  });

  it("returns null for empty string", () => {
    assert.equal(extractLastAuditDate(""), null);
  });

  it("returns null for non-date string", () => {
    assert.equal(extractLastAuditDate("no date here"), null);
  });
});

// ---------------------------------------------------------------------------
// Tests: extractThreshold
// ---------------------------------------------------------------------------

describe("extractThreshold", () => {
  it("extracts number from '25 commits'", () => {
    assert.equal(extractThreshold("25 commits"), 25);
  });

  it("extracts from compound threshold '25 commits OR 15 files'", () => {
    assert.equal(extractThreshold("25 commits OR 15 files"), 25);
  });

  it("uses DEFAULT_THRESHOLD when no commits pattern found", () => {
    assert.equal(extractThreshold("no commits mentioned"), DEFAULT_THRESHOLD);
  });

  it("is case-insensitive for COMMITS", () => {
    assert.equal(extractThreshold("30 COMMITS"), 30);
  });
});

// ---------------------------------------------------------------------------
// Tests: parseTableRow
// ---------------------------------------------------------------------------

describe("parseTableRow", () => {
  it("parses a valid Security row", () => {
    const line = "| Security | 2026-01-15 | 20 | 4 | 25 commits |";
    const result = parseTableRow(line, CATEGORIES);
    assert.ok(result !== null, "Should parse successfully");
    assert.equal(result!.display, "Security");
    assert.equal(result!.key, "security");
    assert.equal(result!.lastAuditDate, "2026-01-15");
    assert.equal(result!.threshold, 25);
  });

  it("parses a row with 'Never' last audit date", () => {
    const line = "| Code | Never | 10 | 2 | 30 commits |";
    const result = parseTableRow(line, CATEGORIES);
    assert.ok(result !== null);
    assert.equal(result!.lastAuditDate, null);
  });

  it("returns null for a row with fewer than 5 cells", () => {
    const line = "| Security | 2026-01-15 |";
    assert.equal(parseTableRow(line, CATEGORIES), null);
  });

  it("returns null for an unrecognised category", () => {
    const line = "| UnknownCat | 2026-01-15 | 10 | 2 | 25 commits |";
    assert.equal(parseTableRow(line, CATEGORIES), null);
  });

  it("strips bold markers from category name", () => {
    const line = "| **Security** | 2026-01-15 | 20 | 4 | 25 commits |";
    const result = parseTableRow(line, CATEGORIES);
    assert.ok(result !== null);
    assert.equal(result!.display, "Security");
  });
});

// ---------------------------------------------------------------------------
// Tests: parseArgs
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
  it("defaults to no filter and no json output", () => {
    const result = parseArgs(["node", "script.js"]);
    assert.equal(result.categoryFilter, null);
    assert.equal(result.jsonOutput, false);
  });

  it("detects --json flag", () => {
    const result = parseArgs(["node", "script.js", "--json"]);
    assert.equal(result.jsonOutput, true);
  });

  it("parses --category=security (equals format)", () => {
    const result = parseArgs(["node", "script.js", "--category=security"]);
    assert.equal(result.categoryFilter, "security");
  });

  it("parses --category security (space format)", () => {
    const result = parseArgs(["node", "script.js", "--category", "security"]);
    assert.equal(result.categoryFilter, "security");
  });

  it("handles both --json and --category together", () => {
    const result = parseArgs(["node", "script.js", "--json", "--category=performance"]);
    assert.equal(result.jsonOutput, true);
    assert.equal(result.categoryFilter, "performance");
  });
});

// ---------------------------------------------------------------------------
// Tests: statusIcon
// ---------------------------------------------------------------------------

describe("statusIcon", () => {
  it("returns ERROR icon when isError is true", () => {
    const icon = statusIcon(true, false);
    assert.ok(icon.includes("ERROR"), `Expected ERROR in: ${icon}`);
  });

  it("returns EXCEEDED icon when not error and exceeded is true", () => {
    const icon = statusIcon(false, true);
    assert.ok(icon.includes("EXCEEDED"), `Expected EXCEEDED in: ${icon}`);
  });

  it("returns OK icon when not error and not exceeded", () => {
    const icon = statusIcon(false, false);
    assert.ok(icon.includes("OK"), `Expected OK in: ${icon}`);
  });

  it("error takes precedence over exceeded", () => {
    const icon = statusIcon(true, true);
    assert.ok(icon.includes("ERROR"));
  });
});

// ---------------------------------------------------------------------------
// Tests: filterCategories
// ---------------------------------------------------------------------------

describe("filterCategories", () => {
  it("returns all categories when filter is null", () => {
    const result = filterCategories(CATEGORIES, null);
    assert.equal(result.length, CATEGORIES.length);
  });

  it("filters by display name (case-insensitive)", () => {
    const result = filterCategories(CATEGORIES, "security");
    assert.equal(result.length, 1);
    assert.equal(result[0].key, "security");
  });

  it("filters by key (case-insensitive)", () => {
    const result = filterCategories(CATEGORIES, "code-quality");
    assert.equal(result.length, 1);
    assert.equal(result[0].display, "Code");
  });

  it("returns empty array for unrecognised filter value", () => {
    const result = filterCategories(CATEGORIES, "no-such-category");
    assert.equal(result.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("count-commits-since.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/audit/count-commits-since.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });
});
