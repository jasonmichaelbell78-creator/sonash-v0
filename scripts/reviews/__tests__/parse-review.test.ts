/**
 * Tests for parse-review.ts — the markdown-to-v2-record parser.
 *
 * Uses inline markdown strings as test fixtures (NOT reading real archive files).
 * Covers heading parsing, table parsing, field extraction, completeness tiers,
 * and known-ID sets.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json (works from both source and dist)
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

/* eslint-disable @typescript-eslint/no-require-imports */
const parseReview = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/parse-review.js")) as {
  parseArchiveFile: (
    filePath: string,
    content: string
  ) => Array<{
    reviewNumber: number;
    date: string | null;
    title: string;
    rawLines: string[];
    sourceFile: string;
  }>;
  parseTableArchive: (
    filePath: string,
    content: string
  ) => Array<{
    reviewNumber: number;
    date: string | null;
    title: string;
    rawLines: string[];
    sourceFile: string;
  }>;
  toV2ReviewRecord: (entry: {
    reviewNumber: number;
    date: string | null;
    title: string;
    rawLines: string[];
    sourceFile: string;
  }) => Record<string, unknown>;
  extractPR: (raw: string) => number | null;
  extractTotal: (raw: string) => number | null;
  extractCount: (raw: string, label: string) => number | null;
  extractPatterns: (raw: string) => string[];
  extractLearnings: (raw: string) => string[];
  extractSeverity: (
    raw: string
  ) => { critical: number; major: number; minor: number; trivial: number } | null;
  KNOWN_SKIPPED_IDS: Set<number>;
  KNOWN_DUPLICATE_IDS: Set<number>;
};

const {
  parseArchiveFile,
  parseTableArchive,
  toV2ReviewRecord,
  extractPR,
  extractTotal,
  extractCount,
  extractPatterns,
  extractLearnings,
  extractSeverity,
  KNOWN_SKIPPED_IDS,
  KNOWN_DUPLICATE_IDS,
} = parseReview;

// Also load ReviewRecord schema for validation tests
const schemas = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/schemas/index.js")) as {
  ReviewRecord: { parse: (v: unknown) => unknown };
};
const { ReviewRecord } = schemas;
/* eslint-enable @typescript-eslint/no-require-imports */

// =========================================================
// 1. Heading parser tests
// =========================================================

describe("parseArchiveFile (heading parser)", () => {
  test("parses #### Review #42: Title (2026-01-15) format", () => {
    const content = `
#### Review #42: Security Audit (2026-01-15)

**PR:** #389
**Total:** 12
**Fixed:** 8
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 42);
    assert.equal(entries[0].date, "2026-01-15");
    assert.equal(entries[0].title, "Security Audit");
    assert.equal(entries[0].sourceFile, "test.md");
  });

  test("parses em-dash variant: #### Review #42 -- Title (2026-01-15)", () => {
    const content = `
#### Review #42 -- Security Audit (2026-01-15)

Some content here.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 42);
    assert.equal(entries[0].date, "2026-01-15");
    assert.equal(entries[0].title, "Security Audit");
  });

  test("parses header without date", () => {
    const content = `
#### Review #42: Security Audit

Content without date.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 42);
    assert.equal(entries[0].date, null);
    assert.equal(entries[0].title, "Security Audit");
  });

  test("parses ## Review #N (double-hash) variant", () => {
    const content = `
## Review #10: Early Format (2025-12-01)

Old-style heading.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 10);
    assert.equal(entries[0].date, "2025-12-01");
  });

  test("parses ### Review #N (triple-hash) variant", () => {
    const content = `
### Review #25: Mid Format (2026-01-05)

Another style.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 25);
  });

  test("excludes content inside code fences", () => {
    const content = `
#### Review #1: Real Review (2026-01-01)

Some content.

\`\`\`markdown
# Review #999: This is inside a code block
#### Review #998: Also inside code block
\`\`\`

More content for Review #1.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 1);
    // Ensure code block content is NOT parsed as a separate entry
    const hasCodeBlockReview = entries.some(
      (e) => e.reviewNumber === 999 || e.reviewNumber === 998
    );
    assert.equal(hasCodeBlockReview, false);
  });

  test("deduplicates within-file by reviewNumber, keeping most content", () => {
    const content = `
#### Review #21: First Occurrence (2026-01-01)

Short content.

#### Review #21: Second Occurrence (2026-01-01)

Much longer content here.
This has more lines.
And even more information.
Additional details about the review.

#### Review #21: Third Occurrence (2026-01-01)

Medium content.
Some extra lines.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 21);
    // Should keep the one with the most content (second occurrence)
    assert.ok(entries[0].rawLines.join("\n").includes("Much longer content"));
  });

  test("parses multiple entries from same file", () => {
    const content = `
#### Review #1: First (2026-01-01)

Content A.

#### Review #2: Second (2026-01-02)

Content B.

#### Review #3: Third (2026-01-03)

Content C.
`;
    const entries = parseArchiveFile("test.md", content);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].reviewNumber, 1);
    assert.equal(entries[1].reviewNumber, 2);
    assert.equal(entries[2].reviewNumber, 3);
  });
});

// =========================================================
// 2. Table parser tests
// =========================================================

describe("parseTableArchive (table parser)", () => {
  test("parses table row with #N format", () => {
    const content = `
| ID | Date | Title |
| --- | --- | --- |
| #105 | 2026-01-20 | Security review |
`;
    const entries = parseTableArchive("table.md", content);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 105);
    assert.equal(entries[0].date, "2026-01-20");
    assert.equal(entries[0].title, "Security review");
  });

  test("parses multiple table rows", () => {
    const content = `
| ID | Date | Title |
| --- | --- | --- |
| #101 | 2026-01-15 | Auth review |
| #102 | 2026-01-16 | API review |
| #103 | 2026-01-17 | DB review |
`;
    const entries = parseTableArchive("table.md", content);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].reviewNumber, 101);
    assert.equal(entries[1].reviewNumber, 102);
    assert.equal(entries[2].reviewNumber, 103);
  });

  test("skips separator and header rows", () => {
    const content = `
| ID | Date | Title |
| --- | --- | --- |
| #110 | 2026-01-20 | Real entry |
`;
    const entries = parseTableArchive("table.md", content);
    // Should only have the data row, not the header or separator
    assert.equal(entries.length, 1);
    assert.equal(entries[0].reviewNumber, 110);
  });

  test("produces entries with empty rawLines (stub-tier candidates)", () => {
    const content = `
| #120 | 2026-01-25 | Stub entry |
`;
    const entries = parseTableArchive("table.md", content);
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0].rawLines, []);
  });
});

// =========================================================
// 3. Field extractor tests
// =========================================================

describe("extractPR", () => {
  test('extracts from "**PR:** #389"', () => {
    assert.equal(extractPR("**PR:** #389"), 389);
  });

  test('returns null for "**PR:** feature/auth" (branch name)', () => {
    assert.equal(extractPR("**PR:** feature/auth"), null);
  });

  test('extracts from "PR #42"', () => {
    assert.equal(extractPR("Some text PR #42 more text"), 42);
  });

  test('extracts from "pr/123"', () => {
    assert.equal(extractPR("Linked to pr/123"), 123);
  });

  test("returns null when no PR found", () => {
    assert.equal(extractPR("No PR reference here"), null);
  });
});

describe("extractTotal", () => {
  test('extracts from "**Total:** 12"', () => {
    assert.equal(extractTotal("**Total:** 12"), 12);
  });

  test('extracts from "**Items:** 5"', () => {
    assert.equal(extractTotal("**Items:** 5"), 5);
  });

  test('extracts from "15 total"', () => {
    assert.equal(extractTotal("Found 15 total issues"), 15);
  });

  test("returns null when no total found", () => {
    assert.equal(extractTotal("No total here"), null);
  });
});

describe("extractCount", () => {
  test('extracts "**Fixed:** 3" for label "fixed"', () => {
    assert.equal(extractCount("**Fixed:** 3", "fixed"), 3);
  });

  test('extracts "Deferred: 2" for label "deferred"', () => {
    assert.equal(extractCount("Deferred: 2", "deferred"), 2);
  });

  test('extracts "**Rejected:** 1" for label "rejected"', () => {
    assert.equal(extractCount("**Rejected:** 1", "rejected"), 1);
  });

  test("returns null when label not found", () => {
    assert.equal(extractCount("Nothing here", "fixed"), null);
  });
});

describe("extractPatterns", () => {
  test("extracts bullet items under **Patterns** heading", () => {
    const raw = `
**Patterns:**
- Missing error handling
- Inconsistent naming
- Unused imports
`;
    const patterns = extractPatterns(raw);
    assert.equal(patterns.length, 3);
    assert.ok(patterns.includes("Missing error handling"));
    assert.ok(patterns.includes("Inconsistent naming"));
    assert.ok(patterns.includes("Unused imports"));
  });

  test("extracts inline patterns after **Patterns:**", () => {
    const raw = "**Patterns:** error handling; naming conventions; dead code";
    const patterns = extractPatterns(raw);
    assert.equal(patterns.length, 3);
    assert.ok(patterns.includes("error handling"));
  });

  test("returns empty array when no patterns section", () => {
    const patterns = extractPatterns("No patterns section here");
    assert.deepEqual(patterns, []);
  });
});

describe("extractLearnings", () => {
  test("extracts bullet items under **Learnings** heading", () => {
    const raw = `
**Learnings:**
- Always validate inputs
- Use TypeScript strict mode
`;
    const learnings = extractLearnings(raw);
    assert.equal(learnings.length, 2);
    assert.ok(learnings.includes("Always validate inputs"));
  });

  test("extracts bullet items under **Key Learnings** heading", () => {
    const raw = `
**Key Learnings:**
- Check for null before access
`;
    const learnings = extractLearnings(raw);
    assert.equal(learnings.length, 1);
  });
});

describe("extractSeverity", () => {
  test('parses "N Label" format', () => {
    const raw = "2 Critical, 5 Major, 3 Minor, 1 Trivial";
    const severity = extractSeverity(raw);
    assert.notEqual(severity, null);
    assert.equal(severity!.critical, 2);
    assert.equal(severity!.major, 5);
    assert.equal(severity!.minor, 3);
    assert.equal(severity!.trivial, 1);
  });

  test('parses "Label: N" format', () => {
    const raw = "Critical: 1, Major: 3, Minor: 2, Trivial: 0";
    const severity = extractSeverity(raw);
    assert.notEqual(severity, null);
    assert.equal(severity!.critical, 1);
    assert.equal(severity!.major, 3);
    assert.equal(severity!.minor, 2);
    assert.equal(severity!.trivial, 0);
  });

  test("returns null when no severity data found", () => {
    const severity = extractSeverity("No severity information here");
    assert.equal(severity, null);
  });
});

// =========================================================
// 4. toV2ReviewRecord tests
// =========================================================

describe("toV2ReviewRecord", () => {
  test("full entry produces completeness: full", () => {
    const entry = {
      reviewNumber: 42,
      date: "2026-01-15",
      title: "Security Audit",
      rawLines: [
        "**PR:** #389",
        "**Total:** 12",
        "**Fixed:** 8",
        "**Deferred:** 2",
        "**Patterns:**",
        "- Missing validation",
        "**Learnings:**",
        "- Always check inputs",
      ],
      sourceFile: "REVIEWS_42-60.md",
    };
    const record = toV2ReviewRecord(entry);
    assert.equal(record.completeness, "full");
    assert.equal(record.id, "rev-42");
    assert.equal(record.date, "2026-01-15");
    assert.equal(record.title, "Security Audit");
    assert.equal(record.pr, 389);
    assert.equal(record.total, 12);
    assert.equal(record.fixed, 8);
  });

  test("entry missing pr and patterns produces completeness: partial", () => {
    const entry = {
      reviewNumber: 100,
      date: "2026-01-20",
      title: "Quick Review",
      rawLines: ["**Total:** 5", "Some content without PR or patterns."],
      sourceFile: "REVIEWS_61-100.md",
    };
    const record = toV2ReviewRecord(entry);
    assert.equal(record.completeness, "partial");
    assert.ok((record.completeness_missing as string[]).includes("pr"));
    assert.ok((record.completeness_missing as string[]).includes("patterns"));
  });

  test("minimal entry (only ID + date) produces completeness: stub", () => {
    const entry = {
      reviewNumber: 120,
      date: "2026-01-25",
      title: "",
      rawLines: [],
      sourceFile: "REVIEWS_101-136.md",
    };
    const record = toV2ReviewRecord(entry);
    assert.equal(record.completeness, "stub");
  });

  test("ID format is rev-{number}", () => {
    const entry = {
      reviewNumber: 256,
      date: "2026-02-01",
      title: "Test",
      rawLines: [],
      sourceFile: "test.md",
    };
    const record = toV2ReviewRecord(entry);
    assert.equal(record.id, "rev-256");
    assert.equal(typeof record.id, "string");
  });

  test("output passes ReviewRecord.parse() (Zod validation)", () => {
    const entry = {
      reviewNumber: 1,
      date: "2026-01-01",
      title: "Validation Test",
      rawLines: ["**PR:** #100", "**Total:** 8", "**Fixed:** 5", "**Deferred:** 1"],
      sourceFile: "test.md",
    };
    const record = toV2ReviewRecord(entry);
    // This should not throw -- the record should be valid
    const parsed = ReviewRecord.parse(record) as Record<string, unknown>;
    assert.equal(parsed.id, "rev-1");
  });

  test("fallback date for missing date", () => {
    const entry = {
      reviewNumber: 50,
      date: null,
      title: "No Date Review",
      rawLines: [],
      sourceFile: "test.md",
    };
    const record = toV2ReviewRecord(entry);
    assert.equal(record.date, "1970-01-01");
  });

  test("origin is set correctly", () => {
    const entry = {
      reviewNumber: 1,
      date: "2026-01-01",
      title: "Test",
      rawLines: [],
      sourceFile: "test.md",
    };
    const record = toV2ReviewRecord(entry);
    assert.equal((record.origin as Record<string, unknown>).type, "backfill");
    assert.equal((record.origin as Record<string, unknown>).tool, "backfill-reviews.ts");
  });
});

// =========================================================
// 5. Known IDs tests
// =========================================================

describe("KNOWN_SKIPPED_IDS", () => {
  test("contains 64 entries", () => {
    assert.equal(KNOWN_SKIPPED_IDS.size, 64);
  });

  test("contains known skipped ID #41", () => {
    assert.ok(KNOWN_SKIPPED_IDS.has(41));
  });

  test("contains known skipped ID #64", () => {
    assert.ok(KNOWN_SKIPPED_IDS.has(64));
  });

  test("does not contain valid review IDs", () => {
    assert.ok(!KNOWN_SKIPPED_IDS.has(1));
    assert.ok(!KNOWN_SKIPPED_IDS.has(42));
    assert.ok(!KNOWN_SKIPPED_IDS.has(100));
  });
});

describe("KNOWN_DUPLICATE_IDS", () => {
  test("contains exactly [366, 367, 368, 369]", () => {
    assert.equal(KNOWN_DUPLICATE_IDS.size, 4);
    assert.ok(KNOWN_DUPLICATE_IDS.has(366));
    assert.ok(KNOWN_DUPLICATE_IDS.has(367));
    assert.ok(KNOWN_DUPLICATE_IDS.has(368));
    assert.ok(KNOWN_DUPLICATE_IDS.has(369));
  });

  test("does not contain other IDs", () => {
    assert.ok(!KNOWN_DUPLICATE_IDS.has(365));
    assert.ok(!KNOWN_DUPLICATE_IDS.has(370));
  });
});
