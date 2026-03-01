"use strict";
/**
 * Unit tests for MASTER_DEBT.jsonl deduplication logic.
 *
 * Tests the pure dedupReviewSourced() function with mock data.
 * No file I/O -- validates core dedup algorithm only.
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
// Import compiled dedup module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dedupReviewSourced } = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/dedup-debt.js"));
// =========================================================
// Test helpers
// =========================================================
function makeEntry(id, source, contentHash, title) {
    const entry = {
        id,
        source,
    };
    if (contentHash !== undefined)
        entry.content_hash = contentHash;
    if (title !== undefined)
        entry.title = title;
    return entry;
}
// =========================================================
// Tests
// =========================================================
(0, node_test_1.describe)("dedupReviewSourced", () => {
    (0, node_test_1.test)("basic dedup: 3 entries, 2 sharing content_hash, keeps lower ID", () => {
        const items = [
            makeEntry("DEBT-0042", "review", "hash-abc", "Finding A"),
            makeEntry("DEBT-0100", "review", "hash-def", "Finding B"),
            makeEntry("DEBT-0187", "review", "hash-abc", "Finding A duplicate"),
        ];
        const result = dedupReviewSourced(items);
        strict_1.default.equal(result.kept.length, 2, "should keep 2 entries");
        strict_1.default.equal(result.removed.length, 1, "should remove 1 duplicate");
        const keptIds = new Set(result.kept.map((i) => i.id));
        strict_1.default.ok(keptIds.has("DEBT-0042"), "should keep DEBT-0042 (lower ID)");
        strict_1.default.ok(keptIds.has("DEBT-0100"), "should keep DEBT-0100 (unique hash)");
        strict_1.default.equal(result.removed[0].id, "DEBT-0187", "should remove DEBT-0187 (higher ID)");
    });
    (0, node_test_1.test)("non-review entries are preserved untouched", () => {
        const items = [
            makeEntry("DEBT-0001", "sonarcloud", "hash-aaa", "SC finding"),
            makeEntry("DEBT-0002", "audit", "hash-bbb", "Audit finding"),
            makeEntry("DEBT-0003", "review", "hash-ccc", "Review finding"),
            makeEntry("DEBT-0004", "review", "hash-ccc", "Review duplicate"),
        ];
        const result = dedupReviewSourced(items);
        strict_1.default.equal(result.kept.length, 3, "should keep 3 entries (2 non-review + 1 review)");
        strict_1.default.equal(result.removed.length, 1, "should remove 1 duplicate");
        const keptIds = new Set(result.kept.map((i) => i.id));
        strict_1.default.ok(keptIds.has("DEBT-0001"), "sonarcloud entry preserved");
        strict_1.default.ok(keptIds.has("DEBT-0002"), "audit entry preserved");
        strict_1.default.ok(keptIds.has("DEBT-0003"), "kept lower-ID review entry");
    });
    (0, node_test_1.test)("entries without content_hash are always kept", () => {
        const items = [
            makeEntry("DEBT-0010", "review", undefined, "No hash entry"),
            makeEntry("DEBT-0011", "review", "hash-xxx", "Has hash"),
            makeEntry("DEBT-0012", "review", undefined, "Another no hash"),
        ];
        const result = dedupReviewSourced(items);
        strict_1.default.equal(result.kept.length, 3, "all 3 entries should be kept");
        strict_1.default.equal(result.removed.length, 0, "no entries removed");
    });
    (0, node_test_1.test)("idempotency: running on already-clean data produces identical output", () => {
        const items = [
            makeEntry("DEBT-0001", "sonarcloud", "hash-aaa", "SC finding"),
            makeEntry("DEBT-0010", "review", "hash-bbb", "Review 1"),
            makeEntry("DEBT-0020", "review", "hash-ccc", "Review 2"),
        ];
        const firstPass = dedupReviewSourced(items);
        strict_1.default.equal(firstPass.removed.length, 0, "first pass: no duplicates");
        const secondPass = dedupReviewSourced(firstPass.kept);
        strict_1.default.equal(secondPass.removed.length, 0, "second pass: no duplicates");
        strict_1.default.deepStrictEqual(firstPass.kept.map((i) => i.id), secondPass.kept.map((i) => i.id), "output identical between passes");
    });
    (0, node_test_1.test)("output is sorted by DEBT-NNNN ID regardless of input order", () => {
        const items = [
            makeEntry("DEBT-0300", "review", "hash-ccc", "C"),
            makeEntry("DEBT-0100", "sonarcloud", "hash-aaa", "A"),
            makeEntry("DEBT-0200", "review", "hash-bbb", "B"),
        ];
        const result = dedupReviewSourced(items);
        const ids = result.kept.map((i) => i.id);
        strict_1.default.deepStrictEqual(ids, ["DEBT-0100", "DEBT-0200", "DEBT-0300"], "sorted by ID");
    });
    (0, node_test_1.test)("title-based near-duplicates are flagged but not removed", () => {
        const items = [
            makeEntry("DEBT-0050", "review", "hash-111", "Same title here"),
            makeEntry("DEBT-0060", "review", "hash-222", "Same title here"),
            makeEntry("DEBT-0070", "review", "hash-333", "Different title"),
        ];
        const result = dedupReviewSourced(items);
        strict_1.default.equal(result.kept.length, 3, "all entries kept (different hashes)");
        strict_1.default.equal(result.removed.length, 0, "none removed");
        strict_1.default.equal(result.flagged.length, 2, "2 entries flagged as title-based near-duplicates");
        const flaggedIds = result.flagged
            .map((i) => i.id)
            .sort((a, b) => a.localeCompare(b));
        strict_1.default.deepStrictEqual(flaggedIds, ["DEBT-0050", "DEBT-0060"]);
    });
    (0, node_test_1.test)("pr-review and pr-deferred sources are treated as review-sourced", () => {
        const items = [
            makeEntry("DEBT-0010", "pr-review", "hash-same", "Finding"),
            makeEntry("DEBT-0020", "pr-deferred", "hash-same", "Finding dup"),
            makeEntry("DEBT-0030", "pr-review-366-r2", "hash-same", "Finding dup 2"),
        ];
        const result = dedupReviewSourced(items);
        strict_1.default.equal(result.kept.length, 1, "only lowest ID kept");
        strict_1.default.equal(result.removed.length, 2, "2 duplicates removed");
        strict_1.default.equal(result.kept[0].id, "DEBT-0010", "kept lowest ID");
    });
    (0, node_test_1.test)("multiple duplicate groups are each resolved independently", () => {
        const items = [
            makeEntry("DEBT-0010", "review", "hash-A", "Group A"),
            makeEntry("DEBT-0020", "review", "hash-B", "Group B"),
            makeEntry("DEBT-0030", "review", "hash-A", "Group A dup"),
            makeEntry("DEBT-0040", "review", "hash-B", "Group B dup"),
            makeEntry("DEBT-0050", "review", "hash-A", "Group A dup 2"),
        ];
        const result = dedupReviewSourced(items);
        strict_1.default.equal(result.kept.length, 2, "2 kept (one per hash group)");
        strict_1.default.equal(result.removed.length, 3, "3 duplicates removed");
        const keptIds = result.kept.map((i) => i.id);
        strict_1.default.deepStrictEqual(keptIds, ["DEBT-0010", "DEBT-0020"]);
    });
});
