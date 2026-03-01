/**
 * Integration tests for backfill-reviews.ts — the backfill orchestrator.
 *
 * Tests overlap resolution, skip-list exclusion, completeness tiers,
 * v1 migration merge, retro extraction with BKFL-04 metrics,
 * BKFL-05 consolidation counter, BKFL-06 pattern corrections,
 * and idempotency.
 *
 * Uses mock data — does NOT read real archive files.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json (works from both source and dist)
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

/* eslint-disable @typescript-eslint/no-require-imports */
const backfill = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/backfill-reviews.js")
) as {
  resolveOverlaps: (byNumber: Map<number, ParsedEntry[]>) => {
    records: ReviewRecordType[];
    overlapsResolved: number;
    duplicatesDisambiguated: number;
    skippedIds: number;
    missingIds: number[];
  };
  migrateV1Records: (
    v1Path: string,
    existingIds: Set<number>
  ) => { records: ReviewRecordType[]; migrated: number; skipped: number };
  buildRetroRecords: (
    retros: RetroExtraction[],
    reviewsByPR: Map<number, ReviewRecordType>
  ) => { records: RetroRecordType[]; missingReviewCount: number };
  extractRetros: (projectRoot: string) => RetroExtraction[];
  checkConsolidationCounter: (
    consolidationPath: string,
    actualCount: number
  ) => { expected: number | null; actual: number; match: boolean };
  applyPatternCorrections: (records: ReviewRecordType[]) => { applied: number; flagged: number };
};

const parseReview = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/parse-review.js")
) as {
  KNOWN_SKIPPED_IDS: Set<number>;
  KNOWN_DUPLICATE_IDS: Set<number>;
  toV2ReviewRecord: (entry: ParsedEntry) => ReviewRecordType;
};
/* eslint-enable @typescript-eslint/no-require-imports */

const {
  resolveOverlaps,
  migrateV1Records,
  buildRetroRecords,
  checkConsolidationCounter,
  applyPatternCorrections,
} = backfill;

const { KNOWN_SKIPPED_IDS, KNOWN_DUPLICATE_IDS } = parseReview;

// ---- Types ------------------------------------------------------------------

interface ParsedEntry {
  reviewNumber: number;
  date: string | null;
  title: string;
  rawLines: string[];
  sourceFile: string;
}

interface ReviewRecordType {
  id: string;
  date: string;
  schema_version: number;
  completeness: string;
  completeness_missing: string[];
  origin: { type: string; tool?: string; session?: string };
  title: string | null;
  pr: number | null;
  source: string | null;
  total: number | null;
  fixed: number | null;
  deferred: number | null;
  rejected: number | null;
  patterns: string[] | null;
  learnings: string[] | null;
  severity_breakdown: {
    critical: number;
    major: number;
    minor: number;
    trivial: number;
  } | null;
  per_round_detail: unknown[] | null;
  rejection_analysis: unknown[] | null;
  ping_pong_chains: unknown[] | null;
}

interface RetroRecordType {
  id: string;
  date: string;
  schema_version: number;
  completeness: string;
  completeness_missing: string[];
  origin: { type: string; pr?: number; tool?: string };
  pr: number | null;
  session: string | null;
  top_wins: string[] | null;
  top_misses: string[] | null;
  process_changes: string[] | null;
  score: number | null;
  metrics: {
    total_findings: number;
    fix_rate: number;
    pattern_recurrence: number;
  } | null;
}

interface RetroExtraction {
  pr: number;
  date: string;
  sourceFile: string;
  rawContent: string;
}

// ---- Helpers ----------------------------------------------------------------

function makeEntry(reviewNumber: number, opts: Partial<ParsedEntry> = {}): ParsedEntry {
  return {
    reviewNumber,
    date: opts.date ?? "2026-01-15",
    title: opts.title ?? `Review ${reviewNumber}`,
    rawLines: opts.rawLines ?? [
      `**PR:** #${reviewNumber + 100}`,
      `**Total:** 10`,
      `**Fixed:** 8`,
      `**Deferred:** 1`,
    ],
    sourceFile: opts.sourceFile ?? "docs/archive/REVIEWS_1-40.md",
  };
}

// =========================================================
// 1. Overlap resolution
// =========================================================

describe("Overlap resolution", () => {
  test("single entry per ID produces one record", () => {
    const byNumber = new Map<number, ParsedEntry[]>();
    byNumber.set(1, [makeEntry(1)]);
    byNumber.set(2, [makeEntry(2)]);

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records.length, 2);
    assert.equal(result.overlapsResolved, 0);
  });

  test("duplicate entries — keeps richer one", () => {
    const byNumber = new Map<number, ParsedEntry[]>();
    const sparse = makeEntry(50, { rawLines: ["sparse"] });
    const rich = makeEntry(50, {
      rawLines: [
        "**PR:** #150",
        "**Total:** 10",
        "**Fixed:** 8",
        "**Deferred:** 1",
        "lots of content here",
      ],
    });
    byNumber.set(50, [sparse, rich]);

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records.length, 1);
    assert.equal(result.overlapsResolved, 1);
  });

  test("KNOWN_DUPLICATE_IDS produce two records with -a/-b suffixes", () => {
    const byNumber = new Map<number, ParsedEntry[]>();
    const entryA = makeEntry(366, {
      sourceFile: "docs/archive/REVIEWS_347-369.md",
      title: "PR #383 R5",
    });
    const entryB = makeEntry(366, {
      sourceFile: "docs/archive/REVIEWS_358-388.md",
      title: "PR #384 R1",
    });
    byNumber.set(366, [entryA, entryB]);

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records.length, 2);
    assert.equal(result.duplicatesDisambiguated, 1);

    const ids = result.records
      .map((r: ReviewRecordType) => r.id)
      .sort((a, b) => a.localeCompare(b));
    assert.deepEqual(ids, ["rev-366-a", "rev-366-b"]);

    // Verify origin.session is set for disambiguation
    for (const record of result.records) {
      assert.ok(record.origin.session, "origin.session should be set");
    }
  });
});

// =========================================================
// 2. Known-skipped exclusion
// =========================================================

describe("Known-skipped exclusion", () => {
  test("KNOWN_SKIPPED_IDS produce no output records", () => {
    const byNumber = new Map<number, ParsedEntry[]>();
    byNumber.set(41, [makeEntry(41)]);
    byNumber.set(64, [makeEntry(64)]);
    byNumber.set(1, [makeEntry(1)]); // Not skipped

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].id, "rev-1");
  });

  test("all 64 known-skipped IDs are in the set", () => {
    assert.equal(KNOWN_SKIPPED_IDS.size, 64);
    assert.ok(KNOWN_SKIPPED_IDS.has(41));
    assert.ok(KNOWN_SKIPPED_IDS.has(349));
    assert.ok(!KNOWN_SKIPPED_IDS.has(1));
  });
});

// =========================================================
// 3. Completeness tier distribution
// =========================================================

describe("Completeness tier distribution", () => {
  test("heading entry with full data -> full tier", () => {
    const entry = makeEntry(10, {
      rawLines: ["**PR:** #42", "**Total:** 12", "**Fixed:** 8", "**Deferred:** 2"],
    });
    const byNumber = new Map<number, ParsedEntry[]>();
    byNumber.set(10, [entry]);

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records[0].completeness, "full");
  });

  test("table entry with no content -> stub tier", () => {
    const entry: ParsedEntry = {
      reviewNumber: 105,
      date: "2026-01-20",
      title: "Security review",
      rawLines: [],
      sourceFile: "docs/archive/REVIEWS_101-136.md",
    };
    const byNumber = new Map<number, ParsedEntry[]>();
    byNumber.set(105, [entry]);

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records[0].completeness, "stub");
  });

  test("entry with title and total but no PR -> partial tier", () => {
    const entry = makeEntry(20, {
      rawLines: ["**Total:** 5"],
    });
    const byNumber = new Map<number, ParsedEntry[]>();
    byNumber.set(20, [entry]);

    const result = resolveOverlaps(byNumber);
    assert.equal(result.records[0].completeness, "partial");
  });
});

// =========================================================
// 4. V1 migration merge
// =========================================================

describe("V1 migration merge", () => {
  test("v1 records not in archives are included", () => {
    let tmpDir: string | undefined;
    try {
      tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-test-"));
      const v1Path = path.join(tmpDir, "reviews.jsonl");
      const v1Record = {
        id: 999,
        date: "2026-02-28",
        title: "Recent review",
        source: "manual",
        pr: 500,
        patterns: [],
        fixed: 3,
        deferred: 0,
        rejected: 1,
        critical: 0,
        major: 1,
        minor: 2,
        trivial: 0,
        total: 5,
        learnings: ["learned something"],
      };
      fs.writeFileSync(v1Path, JSON.stringify(v1Record) + "\n");

      const existingIds = new Set<number>([1, 2, 3]);
      const result = migrateV1Records(v1Path, existingIds);

      assert.equal(result.migrated, 1);
      assert.equal(result.skipped, 0);
      assert.equal(result.records[0].id, "rev-999");
      assert.equal(result.records[0].origin.type, "migration");
    } finally {
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("v1 records already in archives are skipped", () => {
    let tmpDir: string | undefined;
    try {
      tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-test-"));
      const v1Path = path.join(tmpDir, "reviews.jsonl");
      const v1Record = {
        id: 1,
        date: "2026-01-01",
        title: "Old review",
        source: "manual",
        pr: null,
        patterns: [],
        fixed: 0,
        deferred: 0,
        rejected: 0,
        critical: 0,
        major: 0,
        minor: 0,
        trivial: 0,
        total: 0,
        learnings: [],
      };
      fs.writeFileSync(v1Path, JSON.stringify(v1Record) + "\n");

      const existingIds = new Set<number>([1]);
      const result = migrateV1Records(v1Path, existingIds);

      assert.equal(result.migrated, 0);
      assert.equal(result.skipped, 1);
    } finally {
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// =========================================================
// 5. Retro extraction with BKFL-04 metrics
// =========================================================

describe("Retro extraction with BKFL-04 metrics", () => {
  test("retro record has metrics when associated review exists", () => {
    const retros: RetroExtraction[] = [
      {
        pr: 383,
        date: "2026-02-21",
        sourceFile: "docs/archive/REVIEWS_358-388.md",
        rawContent: [
          "#### Review Cycle Summary",
          "| Total items | ~282 |",
          "| Fixed | ~192 |",
          "",
          "#### What Went Well",
          "- Fast turnaround",
          "- Good automation",
        ].join("\n"),
      },
    ];

    const reviewsByPR = new Map<number, ReviewRecordType>();
    reviewsByPR.set(383, {
      id: "rev-358",
      date: "2026-02-21",
      schema_version: 1,
      completeness: "full",
      completeness_missing: [],
      origin: { type: "backfill", tool: "backfill-reviews.ts" },
      title: "PR #383 R5",
      pr: 383,
      source: "docs/archive/REVIEWS_358-388.md",
      total: 282,
      fixed: 192,
      deferred: 67,
      rejected: 23,
      patterns: null,
      learnings: null,
      severity_breakdown: null,
      per_round_detail: null,
      rejection_analysis: null,
      ping_pong_chains: null,
    });

    const result = buildRetroRecords(retros, reviewsByPR);
    assert.equal(result.records.length, 1);
    assert.equal(result.missingReviewCount, 0);

    const retro = result.records[0];
    assert.ok(retro.metrics, "metrics should be populated");
    assert.equal(retro.metrics!.total_findings, 282);
    assert.ok(retro.metrics!.fix_rate >= 0 && retro.metrics!.fix_rate <= 1);
    assert.equal(retro.metrics!.pattern_recurrence, 0);
  });

  test("retro record extracts metrics from content when no associated review", () => {
    const retros: RetroExtraction[] = [
      {
        pr: 999,
        date: "2026-02-28",
        sourceFile: "test.md",
        rawContent: ["| Total items | 50 |", "| Fixed | 40 |"].join("\n"),
      },
    ];

    const reviewsByPR = new Map<number, ReviewRecordType>();
    const result = buildRetroRecords(retros, reviewsByPR);

    assert.equal(result.records.length, 1);
    assert.ok(result.records[0].metrics, "metrics from content");
    assert.equal(result.records[0].metrics!.total_findings, 50);
    assert.equal(result.records[0].metrics!.fix_rate, 0.8);
  });

  test("retro without metrics data has null metrics and increments missing count", () => {
    const retros: RetroExtraction[] = [
      {
        pr: 888,
        date: "2026-02-28",
        sourceFile: "test.md",
        rawContent: "No metrics here at all",
      },
    ];

    const reviewsByPR = new Map<number, ReviewRecordType>();
    const result = buildRetroRecords(retros, reviewsByPR);

    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].metrics, null);
    assert.equal(result.missingReviewCount, 1);
  });
});

// =========================================================
// 6. Idempotency
// =========================================================

describe("Idempotency", () => {
  test("resolving same input twice produces identical output", () => {
    const byNumber = new Map<number, ParsedEntry[]>();
    byNumber.set(1, [makeEntry(1)]);
    byNumber.set(2, [makeEntry(2)]);
    byNumber.set(366, [
      makeEntry(366, { sourceFile: "docs/archive/REVIEWS_347-369.md" }),
      makeEntry(366, { sourceFile: "docs/archive/REVIEWS_358-388.md" }),
    ]);

    const result1 = resolveOverlaps(byNumber);
    const result2 = resolveOverlaps(byNumber);

    assert.deepEqual(
      result1.records.map((r: ReviewRecordType) => r.id),
      result2.records.map((r: ReviewRecordType) => r.id)
    );
    assert.equal(JSON.stringify(result1.records), JSON.stringify(result2.records));
  });
});

// =========================================================
// 7. BKFL-05: Consolidation counter
// =========================================================

describe("BKFL-05: Consolidation counter", () => {
  test("reports mismatch when expected != actual", () => {
    let tmpDir: string | undefined;
    try {
      tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-test-"));
      const consolPath = path.join(tmpDir, "consolidation.json");
      fs.writeFileSync(consolPath, JSON.stringify({ lastConsolidatedReview: 406 }));

      const result = checkConsolidationCounter(consolPath, 411);
      assert.equal(result.expected, 406);
      assert.equal(result.actual, 411);
      assert.equal(result.match, false);
    } finally {
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("reports match when expected == actual", () => {
    let tmpDir: string | undefined;
    try {
      tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-test-"));
      const consolPath = path.join(tmpDir, "consolidation.json");
      fs.writeFileSync(consolPath, JSON.stringify({ lastConsolidatedReview: 406 }));

      const result = checkConsolidationCounter(consolPath, 406);
      assert.equal(result.match, true);
    } finally {
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("handles missing file gracefully", () => {
    const result = checkConsolidationCounter("/nonexistent/file.json", 100);
    assert.equal(result.expected, null);
    assert.equal(result.match, false);
  });
});

// =========================================================
// 8. BKFL-06: Pattern corrections
// =========================================================

describe("BKFL-06: Pattern corrections", () => {
  test("removes numeric-only patterns", () => {
    const records: ReviewRecordType[] = [
      {
        id: "rev-1",
        date: "2026-01-01",
        schema_version: 1,
        completeness: "partial",
        completeness_missing: [],
        origin: { type: "backfill" },
        title: "Test",
        pr: 1,
        source: null,
        total: 5,
        fixed: 3,
        deferred: 0,
        rejected: 0,
        patterns: ["valid pattern", "#5", "13"],
        learnings: null,
        severity_breakdown: null,
        per_round_detail: null,
        rejection_analysis: null,
        ping_pong_chains: null,
      },
    ];

    const result = applyPatternCorrections(records);
    assert.equal(result.applied, 2);
    assert.deepEqual(records[0].patterns, ["valid pattern"]);
  });

  test("removes short patterns (< 3 chars)", () => {
    const records: ReviewRecordType[] = [
      {
        id: "rev-2",
        date: "2026-01-01",
        schema_version: 1,
        completeness: "partial",
        completeness_missing: [],
        origin: { type: "backfill" },
        title: "Test",
        pr: 2,
        source: null,
        total: 5,
        fixed: 3,
        deferred: 0,
        rejected: 0,
        patterns: ["ok pattern", "ab"],
        learnings: null,
        severity_breakdown: null,
        per_round_detail: null,
        rejection_analysis: null,
        ping_pong_chains: null,
      },
    ];

    const result = applyPatternCorrections(records);
    assert.equal(result.applied, 1);
    assert.deepEqual(records[0].patterns, ["ok pattern"]);
  });

  test("nullifies empty pattern array and updates completeness_missing", () => {
    const records: ReviewRecordType[] = [
      {
        id: "rev-3",
        date: "2026-01-01",
        schema_version: 1,
        completeness: "stub",
        completeness_missing: [],
        origin: { type: "backfill" },
        title: null,
        pr: null,
        source: null,
        total: null,
        fixed: null,
        deferred: null,
        rejected: null,
        patterns: ["#5"],
        learnings: null,
        severity_breakdown: null,
        per_round_detail: null,
        rejection_analysis: null,
        ping_pong_chains: null,
      },
    ];

    applyPatternCorrections(records);
    assert.equal(records[0].patterns, null);
    assert.ok(records[0].completeness_missing.includes("patterns"));
  });

  test("flags patterns #5 and #13 for investigation", () => {
    const result = applyPatternCorrections([]);
    assert.equal(result.flagged, 2);
  });
});
