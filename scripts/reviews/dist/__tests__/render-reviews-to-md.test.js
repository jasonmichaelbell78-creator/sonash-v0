"use strict";
/**
 * Unit tests for render-reviews-to-md.ts
 *
 * Tests the renderReviewRecord() and renderReviewsToMarkdown() functions.
 * Uses inline test data matching the ReviewRecord schema.
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
// Walk up from __dirname until we find package.json
function findProjectRoot(startDir) {
    let dir = startDir;
    for (;;) {
        if (fs.existsSync(path.join(dir, "package.json")))
            return dir;
        const parent = path.dirname(dir);
        if (parent === dir)
            throw new Error("Could not find project root");
        dir = parent;
    }
}
const PROJECT_ROOT = findProjectRoot(__dirname);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderReviewRecord, renderReviewsToMarkdown } = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/render-reviews-to-md.js"));
// =========================================================
// Test fixtures
// =========================================================
function makeFullRecord(overrides = {}) {
    return {
        id: "rev-1",
        date: "2026-02-28",
        schema_version: 1,
        completeness: "full",
        completeness_missing: [],
        origin: { type: "pr-review", tool: "test" },
        title: "Test Review",
        pr: 399,
        source: "manual",
        total: 10,
        fixed: 7,
        deferred: 2,
        rejected: 1,
        severity_breakdown: { critical: 1, major: 3, minor: 4, trivial: 2 },
        patterns: ["missing-error-handling", "no-input-validation"],
        learnings: ["Always validate inputs", "Add try-catch around I/O"],
        ...overrides,
    };
}
function makePartialRecord(overrides = {}) {
    return {
        id: "rev-2",
        date: "2026-02-27",
        schema_version: 1,
        completeness: "partial",
        completeness_missing: ["severity_breakdown", "learnings"],
        origin: { type: "pr-review", tool: "test" },
        title: "Partial Review",
        pr: 400,
        source: "automated",
        total: 5,
        fixed: 3,
        deferred: 2,
        rejected: 0,
        ...overrides,
    };
}
function makeStubRecord(overrides = {}) {
    return {
        id: "rev-3",
        date: "2026-02-26",
        schema_version: 1,
        completeness: "stub",
        completeness_missing: [
            "title",
            "pr",
            "total",
            "fixed",
            "deferred",
            "rejected",
            "severity_breakdown",
            "patterns",
            "learnings",
        ],
        origin: { type: "backfill", tool: "test" },
        ...overrides,
    };
}
// =========================================================
// Tests
// =========================================================
(0, node_test_1.describe)("renderReviewRecord", () => {
    (0, node_test_1.test)("full record renders all sections", () => {
        const md = renderReviewRecord(makeFullRecord());
        // Heading
        strict_1.default.ok(md.includes("### Review rev-1: Test Review"), "Should have heading");
        // Date and PR
        strict_1.default.ok(md.includes("**Date:** 2026-02-28"), "Should have date");
        strict_1.default.ok(md.includes("**PR:** #399"), "Should have PR");
        strict_1.default.ok(md.includes("**Source:** manual"), "Should have source");
        // Stats table
        strict_1.default.ok(md.includes("| Total | Fixed | Deferred | Rejected |"), "Should have stats header");
        strict_1.default.ok(md.includes("| 10 | 7 | 2 | 1 |"), "Should have stats row");
        // Severity breakdown
        strict_1.default.ok(md.includes("**Severity Breakdown:**"), "Should have severity section");
        strict_1.default.ok(md.includes("| 1 | 3 | 4 | 2 |"), "Should have severity values");
        // Patterns
        strict_1.default.ok(md.includes("**Patterns:**"), "Should have patterns section");
        strict_1.default.ok(md.includes("- missing-error-handling"), "Should list pattern");
        strict_1.default.ok(md.includes("- no-input-validation"), "Should list second pattern");
        // Learnings
        strict_1.default.ok(md.includes("**Learnings:**"), "Should have learnings section");
        strict_1.default.ok(md.includes("- Always validate inputs"), "Should list learning");
    });
    (0, node_test_1.test)("partial record renders available fields, skips nulls", () => {
        const md = renderReviewRecord(makePartialRecord());
        // Completeness note
        strict_1.default.ok(md.includes("**Completeness:** partial"), "Should note partial completeness");
        strict_1.default.ok(md.includes("severity_breakdown, learnings"), "Should list missing fields");
        // Available fields rendered
        strict_1.default.ok(md.includes("### Review rev-2: Partial Review"), "Should have heading");
        strict_1.default.ok(md.includes("| 5 | 3 | 2 | 0 |"), "Should have stats");
        // Missing fields NOT rendered
        strict_1.default.ok(!md.includes("**Severity Breakdown:**"), "Should skip severity breakdown");
        strict_1.default.ok(!md.includes("**Learnings:**"), "Should skip learnings");
    });
    (0, node_test_1.test)("stub record renders minimal info with completeness note", () => {
        const md = renderReviewRecord(makeStubRecord());
        // Completeness note
        strict_1.default.ok(md.includes("**Completeness:** stub"), "Should note stub completeness");
        // Heading with (untitled) since no title
        strict_1.default.ok(md.includes("### Review rev-3: (untitled)"), "Should show (untitled) for missing title");
        // Date rendered
        strict_1.default.ok(md.includes("**Date:** 2026-02-26"), "Should have date");
        // No stats table (total is null/missing)
        strict_1.default.ok(!md.includes("| Total |"), "Should not have stats table");
        // No patterns or learnings
        strict_1.default.ok(!md.includes("**Patterns:**"), "Should not have patterns");
        strict_1.default.ok(!md.includes("**Learnings:**"), "Should not have learnings");
    });
});
(0, node_test_1.describe)("renderReviewsToMarkdown", () => {
    (0, node_test_1.test)("empty array produces 'No reviews found' message", () => {
        const md = renderReviewsToMarkdown([]);
        strict_1.default.equal(md, "No reviews found.\n");
    });
    (0, node_test_1.test)("multiple records render in order", () => {
        const records = [
            makeFullRecord({ id: "rev-1", title: "First Review" }),
            makePartialRecord({ id: "rev-2", title: "Second Review" }),
        ];
        const md = renderReviewsToMarkdown(records);
        const firstIdx = md.indexOf("First Review");
        const secondIdx = md.indexOf("Second Review");
        strict_1.default.ok(firstIdx >= 0, "Should contain first review");
        strict_1.default.ok(secondIdx >= 0, "Should contain second review");
        strict_1.default.ok(firstIdx < secondIdx, "First should come before second");
        // Should have separator
        strict_1.default.ok(md.includes("---"), "Should have separator between records");
    });
    (0, node_test_1.test)("single record renders without separator", () => {
        const md = renderReviewsToMarkdown([makeFullRecord()]);
        // Split by --- and check we only have the record, not multiple separators
        const parts = md.split("\n---\n");
        strict_1.default.equal(parts.length, 1, "Single record should not have separator");
    });
});
(0, node_test_1.describe)("CLI filtering", () => {
    // These tests verify the filter logic works correctly by testing the
    // renderReviewsToMarkdown function with pre-filtered data (simulating CLI behavior)
    (0, node_test_1.test)("--filter-pr filters correctly", () => {
        const records = [
            makeFullRecord({ id: "rev-1", pr: 399 }),
            makeFullRecord({ id: "rev-2", pr: 400 }),
            makeFullRecord({ id: "rev-3", pr: 399 }),
        ];
        // Simulate --filter-pr 399
        const filtered = records.filter((r) => r.pr === 399);
        const md = renderReviewsToMarkdown(filtered);
        strict_1.default.ok(md.includes("rev-1"), "Should include rev-1 (pr 399)");
        strict_1.default.ok(!md.includes("rev-2"), "Should not include rev-2 (pr 400)");
        strict_1.default.ok(md.includes("rev-3"), "Should include rev-3 (pr 399)");
    });
    (0, node_test_1.test)("--last N limits output", () => {
        const records = [
            makeFullRecord({ id: "rev-1", title: "First" }),
            makeFullRecord({ id: "rev-2", title: "Second" }),
            makeFullRecord({ id: "rev-3", title: "Third" }),
        ];
        // Simulate --last 2
        const lastTwo = records.slice(-2);
        const md = renderReviewsToMarkdown(lastTwo);
        strict_1.default.ok(!md.includes("rev-1"), "Should not include first record");
        strict_1.default.ok(md.includes("rev-2"), "Should include second record");
        strict_1.default.ok(md.includes("rev-3"), "Should include third record");
    });
});
