"use strict";
/**
 * Tests for parse-review.ts — the markdown-to-v2-record parser.
 *
 * Uses inline markdown strings as test fixtures (NOT reading real archive files).
 * Covers heading parsing, table parsing, field extraction, completeness tiers,
 * and known-ID sets.
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
        if (fs.existsSync(path.join(dir, "package.json")))
            return dir;
        const parent = path.dirname(dir);
        if (parent === dir)
            throw new Error("Could not find project root");
        dir = parent;
    }
}
const PROJECT_ROOT = findProjectRoot(__dirname);
/* eslint-disable @typescript-eslint/no-require-imports */
const parseReview = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/parse-review.js"));
const { parseArchiveFile, parseTableArchive, toV2ReviewRecord, extractPR, extractTotal, extractCount, extractPatterns, extractLearnings, extractSeverity, KNOWN_SKIPPED_IDS, KNOWN_DUPLICATE_IDS, } = parseReview;
// Also load ReviewRecord schema for validation tests
const schemas = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas/index.js"));
const { ReviewRecord } = schemas;
/* eslint-enable @typescript-eslint/no-require-imports */
// =========================================================
// 1. Heading parser tests
// =========================================================
(0, node_test_1.describe)("parseArchiveFile (heading parser)", () => {
    (0, node_test_1.test)("parses #### Review #42: Title (2026-01-15) format", () => {
        const content = `
#### Review #42: Security Audit (2026-01-15)

**PR:** #389
**Total:** 12
**Fixed:** 8
`;
        const entries = parseArchiveFile("test.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 42);
        strict_1.default.equal(entries[0].date, "2026-01-15");
        strict_1.default.equal(entries[0].title, "Security Audit");
        strict_1.default.equal(entries[0].sourceFile, "test.md");
    });
    (0, node_test_1.test)("parses em-dash variant: #### Review #42 -- Title (2026-01-15)", () => {
        const content = `
#### Review #42 -- Security Audit (2026-01-15)

Some content here.
`;
        const entries = parseArchiveFile("test.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 42);
        strict_1.default.equal(entries[0].date, "2026-01-15");
        strict_1.default.equal(entries[0].title, "Security Audit");
    });
    (0, node_test_1.test)("parses header without date", () => {
        const content = `
#### Review #42: Security Audit

Content without date.
`;
        const entries = parseArchiveFile("test.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 42);
        strict_1.default.equal(entries[0].date, null);
        strict_1.default.equal(entries[0].title, "Security Audit");
    });
    (0, node_test_1.test)("parses ## Review #N (double-hash) variant", () => {
        const content = `
## Review #10: Early Format (2025-12-01)

Old-style heading.
`;
        const entries = parseArchiveFile("test.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 10);
        strict_1.default.equal(entries[0].date, "2025-12-01");
    });
    (0, node_test_1.test)("parses ### Review #N (triple-hash) variant", () => {
        const content = `
### Review #25: Mid Format (2026-01-05)

Another style.
`;
        const entries = parseArchiveFile("test.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 25);
    });
    (0, node_test_1.test)("excludes content inside code fences", () => {
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
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 1);
        // Ensure code block content is NOT parsed as a separate entry
        const hasCodeBlockReview = entries.some((e) => e.reviewNumber === 999 || e.reviewNumber === 998);
        strict_1.default.equal(hasCodeBlockReview, false);
    });
    (0, node_test_1.test)("deduplicates within-file by reviewNumber, keeping most content", () => {
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
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 21);
        // Should keep the one with the most content (second occurrence)
        strict_1.default.ok(entries[0].rawLines.join("\n").includes("Much longer content"));
    });
    (0, node_test_1.test)("parses multiple entries from same file", () => {
        const content = `
#### Review #1: First (2026-01-01)

Content A.

#### Review #2: Second (2026-01-02)

Content B.

#### Review #3: Third (2026-01-03)

Content C.
`;
        const entries = parseArchiveFile("test.md", content);
        strict_1.default.equal(entries.length, 3);
        strict_1.default.equal(entries[0].reviewNumber, 1);
        strict_1.default.equal(entries[1].reviewNumber, 2);
        strict_1.default.equal(entries[2].reviewNumber, 3);
    });
});
// =========================================================
// 2. Table parser tests
// =========================================================
(0, node_test_1.describe)("parseTableArchive (table parser)", () => {
    (0, node_test_1.test)("parses table row with #N format", () => {
        const content = `
| ID | Date | Title |
| --- | --- | --- |
| #105 | 2026-01-20 | Security review |
`;
        const entries = parseTableArchive("table.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 105);
        strict_1.default.equal(entries[0].date, "2026-01-20");
        strict_1.default.equal(entries[0].title, "Security review");
    });
    (0, node_test_1.test)("parses multiple table rows", () => {
        const content = `
| ID | Date | Title |
| --- | --- | --- |
| #101 | 2026-01-15 | Auth review |
| #102 | 2026-01-16 | API review |
| #103 | 2026-01-17 | DB review |
`;
        const entries = parseTableArchive("table.md", content);
        strict_1.default.equal(entries.length, 3);
        strict_1.default.equal(entries[0].reviewNumber, 101);
        strict_1.default.equal(entries[1].reviewNumber, 102);
        strict_1.default.equal(entries[2].reviewNumber, 103);
    });
    (0, node_test_1.test)("skips separator and header rows", () => {
        const content = `
| ID | Date | Title |
| --- | --- | --- |
| #110 | 2026-01-20 | Real entry |
`;
        const entries = parseTableArchive("table.md", content);
        // Should only have the data row, not the header or separator
        strict_1.default.equal(entries.length, 1);
        strict_1.default.equal(entries[0].reviewNumber, 110);
    });
    (0, node_test_1.test)("produces entries with empty rawLines (stub-tier candidates)", () => {
        const content = `
| #120 | 2026-01-25 | Stub entry |
`;
        const entries = parseTableArchive("table.md", content);
        strict_1.default.equal(entries.length, 1);
        strict_1.default.deepEqual(entries[0].rawLines, []);
    });
});
// =========================================================
// 3. Field extractor tests
// =========================================================
(0, node_test_1.describe)("extractPR", () => {
    (0, node_test_1.test)('extracts from "**PR:** #389"', () => {
        strict_1.default.equal(extractPR("**PR:** #389"), 389);
    });
    (0, node_test_1.test)('returns null for "**PR:** feature/auth" (branch name)', () => {
        strict_1.default.equal(extractPR("**PR:** feature/auth"), null);
    });
    (0, node_test_1.test)('extracts from "PR #42"', () => {
        strict_1.default.equal(extractPR("Some text PR #42 more text"), 42);
    });
    (0, node_test_1.test)('extracts from "pr/123"', () => {
        strict_1.default.equal(extractPR("Linked to pr/123"), 123);
    });
    (0, node_test_1.test)("returns null when no PR found", () => {
        strict_1.default.equal(extractPR("No PR reference here"), null);
    });
});
(0, node_test_1.describe)("extractTotal", () => {
    (0, node_test_1.test)('extracts from "**Total:** 12"', () => {
        strict_1.default.equal(extractTotal("**Total:** 12"), 12);
    });
    (0, node_test_1.test)('extracts from "**Items:** 5"', () => {
        strict_1.default.equal(extractTotal("**Items:** 5"), 5);
    });
    (0, node_test_1.test)('extracts from "15 total"', () => {
        strict_1.default.equal(extractTotal("Found 15 total issues"), 15);
    });
    (0, node_test_1.test)("returns null when no total found", () => {
        strict_1.default.equal(extractTotal("No total here"), null);
    });
});
(0, node_test_1.describe)("extractCount", () => {
    (0, node_test_1.test)('extracts "**Fixed:** 3" for label "fixed"', () => {
        strict_1.default.equal(extractCount("**Fixed:** 3", "fixed"), 3);
    });
    (0, node_test_1.test)('extracts "Deferred: 2" for label "deferred"', () => {
        strict_1.default.equal(extractCount("Deferred: 2", "deferred"), 2);
    });
    (0, node_test_1.test)('extracts "**Rejected:** 1" for label "rejected"', () => {
        strict_1.default.equal(extractCount("**Rejected:** 1", "rejected"), 1);
    });
    (0, node_test_1.test)("returns null when label not found", () => {
        strict_1.default.equal(extractCount("Nothing here", "fixed"), null);
    });
});
(0, node_test_1.describe)("extractPatterns", () => {
    (0, node_test_1.test)("extracts bullet items under **Patterns** heading", () => {
        const raw = `
**Patterns:**
- Missing error handling
- Inconsistent naming
- Unused imports
`;
        const patterns = extractPatterns(raw);
        strict_1.default.equal(patterns.length, 3);
        strict_1.default.ok(patterns.includes("Missing error handling"));
        strict_1.default.ok(patterns.includes("Inconsistent naming"));
        strict_1.default.ok(patterns.includes("Unused imports"));
    });
    (0, node_test_1.test)("extracts inline patterns after **Patterns:**", () => {
        const raw = "**Patterns:** error handling; naming conventions; dead code";
        const patterns = extractPatterns(raw);
        strict_1.default.equal(patterns.length, 3);
        strict_1.default.ok(patterns.includes("error handling"));
    });
    (0, node_test_1.test)("returns empty array when no patterns section", () => {
        const patterns = extractPatterns("No patterns section here");
        strict_1.default.deepEqual(patterns, []);
    });
});
(0, node_test_1.describe)("extractLearnings", () => {
    (0, node_test_1.test)("extracts bullet items under **Learnings** heading", () => {
        const raw = `
**Learnings:**
- Always validate inputs
- Use TypeScript strict mode
`;
        const learnings = extractLearnings(raw);
        strict_1.default.equal(learnings.length, 2);
        strict_1.default.ok(learnings.includes("Always validate inputs"));
    });
    (0, node_test_1.test)("extracts bullet items under **Key Learnings** heading", () => {
        const raw = `
**Key Learnings:**
- Check for null before access
`;
        const learnings = extractLearnings(raw);
        strict_1.default.equal(learnings.length, 1);
    });
});
(0, node_test_1.describe)("extractSeverity", () => {
    (0, node_test_1.test)('parses "N Label" format', () => {
        const raw = "2 Critical, 5 Major, 3 Minor, 1 Trivial";
        const severity = extractSeverity(raw);
        strict_1.default.notEqual(severity, null);
        strict_1.default.equal(severity.critical, 2);
        strict_1.default.equal(severity.major, 5);
        strict_1.default.equal(severity.minor, 3);
        strict_1.default.equal(severity.trivial, 1);
    });
    (0, node_test_1.test)('parses "Label: N" format', () => {
        const raw = "Critical: 1, Major: 3, Minor: 2, Trivial: 0";
        const severity = extractSeverity(raw);
        strict_1.default.notEqual(severity, null);
        strict_1.default.equal(severity.critical, 1);
        strict_1.default.equal(severity.major, 3);
        strict_1.default.equal(severity.minor, 2);
        strict_1.default.equal(severity.trivial, 0);
    });
    (0, node_test_1.test)("returns null when no severity data found", () => {
        const severity = extractSeverity("No severity information here");
        strict_1.default.equal(severity, null);
    });
});
// =========================================================
// 4. toV2ReviewRecord tests
// =========================================================
(0, node_test_1.describe)("toV2ReviewRecord", () => {
    (0, node_test_1.test)("full entry produces completeness: full", () => {
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
        strict_1.default.equal(record.completeness, "full");
        strict_1.default.equal(record.id, "rev-42");
        strict_1.default.equal(record.date, "2026-01-15");
        strict_1.default.equal(record.title, "Security Audit");
        strict_1.default.equal(record.pr, 389);
        strict_1.default.equal(record.total, 12);
        strict_1.default.equal(record.fixed, 8);
    });
    (0, node_test_1.test)("entry missing pr and patterns produces completeness: partial", () => {
        const entry = {
            reviewNumber: 100,
            date: "2026-01-20",
            title: "Quick Review",
            rawLines: ["**Total:** 5", "Some content without PR or patterns."],
            sourceFile: "REVIEWS_61-100.md",
        };
        const record = toV2ReviewRecord(entry);
        strict_1.default.equal(record.completeness, "partial");
        strict_1.default.ok(record.completeness_missing.includes("pr"));
        strict_1.default.ok(record.completeness_missing.includes("patterns"));
    });
    (0, node_test_1.test)("minimal entry (only ID + date) produces completeness: stub", () => {
        const entry = {
            reviewNumber: 120,
            date: "2026-01-25",
            title: "",
            rawLines: [],
            sourceFile: "REVIEWS_101-136.md",
        };
        const record = toV2ReviewRecord(entry);
        strict_1.default.equal(record.completeness, "stub");
    });
    (0, node_test_1.test)("ID format is rev-{number}", () => {
        const entry = {
            reviewNumber: 256,
            date: "2026-02-01",
            title: "Test",
            rawLines: [],
            sourceFile: "test.md",
        };
        const record = toV2ReviewRecord(entry);
        strict_1.default.equal(record.id, "rev-256");
        strict_1.default.equal(typeof record.id, "string");
    });
    (0, node_test_1.test)("output passes ReviewRecord.parse() (Zod validation)", () => {
        const entry = {
            reviewNumber: 1,
            date: "2026-01-01",
            title: "Validation Test",
            rawLines: ["**PR:** #100", "**Total:** 8", "**Fixed:** 5", "**Deferred:** 1"],
            sourceFile: "test.md",
        };
        const record = toV2ReviewRecord(entry);
        // This should not throw -- the record should be valid
        const parsed = ReviewRecord.parse(record);
        strict_1.default.equal(parsed.id, "rev-1");
    });
    (0, node_test_1.test)("fallback date for missing date", () => {
        const entry = {
            reviewNumber: 50,
            date: null,
            title: "No Date Review",
            rawLines: [],
            sourceFile: "test.md",
        };
        const record = toV2ReviewRecord(entry);
        strict_1.default.equal(record.date, "1970-01-01");
    });
    (0, node_test_1.test)("origin is set correctly", () => {
        const entry = {
            reviewNumber: 1,
            date: "2026-01-01",
            title: "Test",
            rawLines: [],
            sourceFile: "test.md",
        };
        const record = toV2ReviewRecord(entry);
        strict_1.default.equal(record.origin.type, "backfill");
        strict_1.default.equal(record.origin.tool, "backfill-reviews.ts");
    });
});
// =========================================================
// 5. Known IDs tests
// =========================================================
(0, node_test_1.describe)("KNOWN_SKIPPED_IDS", () => {
    (0, node_test_1.test)("contains 64 entries", () => {
        strict_1.default.equal(KNOWN_SKIPPED_IDS.size, 64);
    });
    (0, node_test_1.test)("contains known skipped ID #41", () => {
        strict_1.default.ok(KNOWN_SKIPPED_IDS.has(41));
    });
    (0, node_test_1.test)("contains known skipped ID #64", () => {
        strict_1.default.ok(KNOWN_SKIPPED_IDS.has(64));
    });
    (0, node_test_1.test)("does not contain valid review IDs", () => {
        strict_1.default.ok(!KNOWN_SKIPPED_IDS.has(1));
        strict_1.default.ok(!KNOWN_SKIPPED_IDS.has(42));
        strict_1.default.ok(!KNOWN_SKIPPED_IDS.has(100));
    });
});
(0, node_test_1.describe)("KNOWN_DUPLICATE_IDS", () => {
    (0, node_test_1.test)("contains exactly [366, 367, 368, 369]", () => {
        strict_1.default.equal(KNOWN_DUPLICATE_IDS.size, 4);
        strict_1.default.ok(KNOWN_DUPLICATE_IDS.has(366));
        strict_1.default.ok(KNOWN_DUPLICATE_IDS.has(367));
        strict_1.default.ok(KNOWN_DUPLICATE_IDS.has(368));
        strict_1.default.ok(KNOWN_DUPLICATE_IDS.has(369));
    });
    (0, node_test_1.test)("does not contain other IDs", () => {
        strict_1.default.ok(!KNOWN_DUPLICATE_IDS.has(365));
        strict_1.default.ok(!KNOWN_DUPLICATE_IDS.has(370));
    });
});
