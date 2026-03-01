"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
// Walk up from __dirname until we find package.json (works from both source and dist)
function findProjectRoot(startDir) {
    let dir = startDir;
    for (;;) {
        try {
            if (fs.existsSync(path.join(dir, "package.json")))
                return dir;
        }
        catch {
            // existsSync race condition -- continue walking
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            throw new Error("Could not find project root");
        dir = parent;
    }
}
const PROJECT_ROOT = findProjectRoot(__dirname);
/* eslint-disable @typescript-eslint/no-require-imports */
const backfill = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/backfill-reviews.js"));
const parseReview = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/parse-review.js"));
/* eslint-enable @typescript-eslint/no-require-imports */
const { resolveOverlaps, migrateV1Records, buildRetroRecords, checkConsolidationCounter, applyPatternCorrections, } = backfill;
const { KNOWN_SKIPPED_IDS, KNOWN_DUPLICATE_IDS } = parseReview;
// ---- Helpers ----------------------------------------------------------------
function makeEntry(reviewNumber, opts = {}) {
    var _a, _b, _c, _d;
    return {
        reviewNumber,
        date: (_a = opts.date) !== null && _a !== void 0 ? _a : "2026-01-15",
        title: (_b = opts.title) !== null && _b !== void 0 ? _b : `Review ${reviewNumber}`,
        rawLines: (_c = opts.rawLines) !== null && _c !== void 0 ? _c : [
            `**PR:** #${reviewNumber + 100}`,
            `**Total:** 10`,
            `**Fixed:** 8`,
            `**Deferred:** 1`,
        ],
        sourceFile: (_d = opts.sourceFile) !== null && _d !== void 0 ? _d : "docs/archive/REVIEWS_1-40.md",
    };
}
// =========================================================
// 1. Overlap resolution
// =========================================================
(0, node_test_1.describe)("Overlap resolution", () => {
    (0, node_test_1.test)("single entry per ID produces one record", () => {
        const byNumber = new Map();
        byNumber.set(1, [makeEntry(1)]);
        byNumber.set(2, [makeEntry(2)]);
        const result = resolveOverlaps(byNumber);
        strict_1.default.equal(result.records.length, 2);
        strict_1.default.equal(result.overlapsResolved, 0);
    });
    (0, node_test_1.test)("duplicate entries — keeps richer one", () => {
        const byNumber = new Map();
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
        strict_1.default.equal(result.records.length, 1);
        strict_1.default.equal(result.overlapsResolved, 1);
    });
    (0, node_test_1.test)("KNOWN_DUPLICATE_IDS produce two records with -a/-b suffixes", () => {
        const byNumber = new Map();
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
        strict_1.default.equal(result.records.length, 2);
        strict_1.default.equal(result.duplicatesDisambiguated, 1);
        const ids = result.records
            .map((r) => r.id)
            .sort((a, b) => a.localeCompare(b));
        strict_1.default.deepEqual(ids, ["rev-366-a", "rev-366-b"]);
        // Verify origin.session is set for disambiguation
        for (const record of result.records) {
            strict_1.default.ok(record.origin.session, "origin.session should be set");
        }
    });
});
// =========================================================
// 2. Known-skipped exclusion
// =========================================================
(0, node_test_1.describe)("Known-skipped exclusion", () => {
    (0, node_test_1.test)("KNOWN_SKIPPED_IDS produce no output records", () => {
        const byNumber = new Map();
        byNumber.set(41, [makeEntry(41)]);
        byNumber.set(64, [makeEntry(64)]);
        byNumber.set(1, [makeEntry(1)]); // Not skipped
        const result = resolveOverlaps(byNumber);
        strict_1.default.equal(result.records.length, 1);
        strict_1.default.equal(result.records[0].id, "rev-1");
    });
    (0, node_test_1.test)("all 64 known-skipped IDs are in the set", () => {
        strict_1.default.equal(KNOWN_SKIPPED_IDS.size, 64);
        strict_1.default.ok(KNOWN_SKIPPED_IDS.has(41));
        strict_1.default.ok(KNOWN_SKIPPED_IDS.has(349));
        strict_1.default.ok(!KNOWN_SKIPPED_IDS.has(1));
    });
});
// =========================================================
// 3. Completeness tier distribution
// =========================================================
(0, node_test_1.describe)("Completeness tier distribution", () => {
    (0, node_test_1.test)("heading entry with full data -> full tier", () => {
        const entry = makeEntry(10, {
            rawLines: ["**PR:** #42", "**Total:** 12", "**Fixed:** 8", "**Deferred:** 2"],
        });
        const byNumber = new Map();
        byNumber.set(10, [entry]);
        const result = resolveOverlaps(byNumber);
        strict_1.default.equal(result.records[0].completeness, "full");
    });
    (0, node_test_1.test)("table entry with no content -> stub tier", () => {
        const entry = {
            reviewNumber: 105,
            date: "2026-01-20",
            title: "Security review",
            rawLines: [],
            sourceFile: "docs/archive/REVIEWS_101-136.md",
        };
        const byNumber = new Map();
        byNumber.set(105, [entry]);
        const result = resolveOverlaps(byNumber);
        strict_1.default.equal(result.records[0].completeness, "stub");
    });
    (0, node_test_1.test)("entry with title and total but no PR -> partial tier", () => {
        const entry = makeEntry(20, {
            rawLines: ["**Total:** 5"],
        });
        const byNumber = new Map();
        byNumber.set(20, [entry]);
        const result = resolveOverlaps(byNumber);
        strict_1.default.equal(result.records[0].completeness, "partial");
    });
});
// =========================================================
// 4. V1 migration merge
// =========================================================
(0, node_test_1.describe)("V1 migration merge", () => {
    (0, node_test_1.test)("v1 records not in archives are included", () => {
        let tmpDir;
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
            const existingIds = new Set([1, 2, 3]);
            const result = migrateV1Records(v1Path, existingIds);
            strict_1.default.equal(result.migrated, 1);
            strict_1.default.equal(result.skipped, 0);
            strict_1.default.equal(result.records[0].id, "rev-999");
            strict_1.default.equal(result.records[0].origin.type, "migration");
        }
        finally {
            if (tmpDir)
                fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)("v1 records already in archives are skipped", () => {
        let tmpDir;
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
            const existingIds = new Set([1]);
            const result = migrateV1Records(v1Path, existingIds);
            strict_1.default.equal(result.migrated, 0);
            strict_1.default.equal(result.skipped, 1);
        }
        finally {
            if (tmpDir)
                fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
// =========================================================
// 5. Retro extraction with BKFL-04 metrics
// =========================================================
(0, node_test_1.describe)("Retro extraction with BKFL-04 metrics", () => {
    (0, node_test_1.test)("retro record has metrics when associated review exists", () => {
        const retros = [
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
        const reviewsByPR = new Map();
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
        strict_1.default.equal(result.records.length, 1);
        strict_1.default.equal(result.missingReviewCount, 0);
        const retro = result.records[0];
        strict_1.default.ok(retro.metrics, "metrics should be populated");
        strict_1.default.equal(retro.metrics.total_findings, 282);
        strict_1.default.ok(retro.metrics.fix_rate >= 0 && retro.metrics.fix_rate <= 1);
        strict_1.default.equal(retro.metrics.pattern_recurrence, 0);
    });
    (0, node_test_1.test)("retro record extracts metrics from content when no associated review", () => {
        const retros = [
            {
                pr: 999,
                date: "2026-02-28",
                sourceFile: "test.md",
                rawContent: ["| Total items | 50 |", "| Fixed | 40 |"].join("\n"),
            },
        ];
        const reviewsByPR = new Map();
        const result = buildRetroRecords(retros, reviewsByPR);
        strict_1.default.equal(result.records.length, 1);
        strict_1.default.ok(result.records[0].metrics, "metrics from content");
        strict_1.default.equal(result.records[0].metrics.total_findings, 50);
        strict_1.default.equal(result.records[0].metrics.fix_rate, 0.8);
    });
    (0, node_test_1.test)("retro without metrics data has null metrics and increments missing count", () => {
        const retros = [
            {
                pr: 888,
                date: "2026-02-28",
                sourceFile: "test.md",
                rawContent: "No metrics here at all",
            },
        ];
        const reviewsByPR = new Map();
        const result = buildRetroRecords(retros, reviewsByPR);
        strict_1.default.equal(result.records.length, 1);
        strict_1.default.equal(result.records[0].metrics, null);
        strict_1.default.equal(result.missingReviewCount, 1);
    });
});
// =========================================================
// 6. Idempotency
// =========================================================
(0, node_test_1.describe)("Idempotency", () => {
    (0, node_test_1.test)("resolving same input twice produces identical output", () => {
        const byNumber = new Map();
        byNumber.set(1, [makeEntry(1)]);
        byNumber.set(2, [makeEntry(2)]);
        byNumber.set(366, [
            makeEntry(366, { sourceFile: "docs/archive/REVIEWS_347-369.md" }),
            makeEntry(366, { sourceFile: "docs/archive/REVIEWS_358-388.md" }),
        ]);
        const result1 = resolveOverlaps(byNumber);
        const result2 = resolveOverlaps(byNumber);
        strict_1.default.deepEqual(result1.records.map((r) => r.id), result2.records.map((r) => r.id));
        strict_1.default.equal(JSON.stringify(result1.records), JSON.stringify(result2.records));
    });
});
// =========================================================
// 7. BKFL-05: Consolidation counter
// =========================================================
(0, node_test_1.describe)("BKFL-05: Consolidation counter", () => {
    (0, node_test_1.test)("reports mismatch when expected != actual", () => {
        let tmpDir;
        try {
            tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-test-"));
            const consolPath = path.join(tmpDir, "consolidation.json");
            fs.writeFileSync(consolPath, JSON.stringify({ lastConsolidatedReview: 406 }));
            const result = checkConsolidationCounter(consolPath, 411);
            strict_1.default.equal(result.expected, 406);
            strict_1.default.equal(result.actual, 411);
            strict_1.default.equal(result.match, false);
        }
        finally {
            if (tmpDir)
                fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)("reports match when expected == actual", () => {
        let tmpDir;
        try {
            tmpDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-test-"));
            const consolPath = path.join(tmpDir, "consolidation.json");
            fs.writeFileSync(consolPath, JSON.stringify({ lastConsolidatedReview: 406 }));
            const result = checkConsolidationCounter(consolPath, 406);
            strict_1.default.equal(result.match, true);
        }
        finally {
            if (tmpDir)
                fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)("handles missing file gracefully", () => {
        const result = checkConsolidationCounter("/nonexistent/file.json", 100);
        strict_1.default.equal(result.expected, null);
        strict_1.default.equal(result.match, false);
    });
});
// =========================================================
// 8. BKFL-06: Pattern corrections
// =========================================================
(0, node_test_1.describe)("BKFL-06: Pattern corrections", () => {
    (0, node_test_1.test)("removes numeric-only patterns", () => {
        const records = [
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
        strict_1.default.equal(result.applied, 2);
        strict_1.default.deepEqual(records[0].patterns, ["valid pattern"]);
    });
    (0, node_test_1.test)("removes short patterns (< 3 chars)", () => {
        const records = [
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
        strict_1.default.equal(result.applied, 1);
        strict_1.default.deepEqual(records[0].patterns, ["ok pattern"]);
    });
    (0, node_test_1.test)("nullifies empty pattern array and updates completeness_missing", () => {
        const records = [
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
        strict_1.default.equal(records[0].patterns, null);
        strict_1.default.ok(records[0].completeness_missing.includes("patterns"));
    });
    (0, node_test_1.test)("flags patterns #5 and #13 for investigation", () => {
        const result = applyPatternCorrections([]);
        strict_1.default.equal(result.flagged, 2);
    });
});
