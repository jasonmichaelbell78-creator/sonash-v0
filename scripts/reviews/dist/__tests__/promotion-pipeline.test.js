"use strict";
/**
 * Tests for the promotion pipeline: promote-patterns.ts
 *
 * Uses inline test data, not production files.
 * Covers: detectRecurrence, filterAlreadyPromoted, categorizePattern,
 *         generateRuleSkeleton, and full pipeline integration.
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
// Import compiled module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const promoteModule = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/promote-patterns.js"));
// Helper to create mock review records matching ReviewRecord shape
function mockReview(id, pr, patterns, overrides = {}) {
    return {
        id,
        date: "2026-01-15",
        schema_version: 1,
        completeness: "partial",
        completeness_missing: [],
        origin: { type: "pr-review", pr: pr !== null && pr !== void 0 ? pr : undefined },
        title: `Review ${id}`,
        pr,
        source: "test",
        total: 10,
        fixed: null,
        deferred: null,
        rejected: null,
        patterns,
        learnings: null,
        severity_breakdown: null,
        per_round_detail: null,
        rejection_analysis: null,
        ping_pong_chains: null,
        ...overrides,
    };
}
(0, node_test_1.describe)("detectRecurrence", () => {
    (0, node_test_1.test)("returns patterns meeting both thresholds", () => {
        const reviews = [
            mockReview("rev-1", 100, ["path-traversal", "error-handling"]),
            mockReview("rev-2", 101, ["path-traversal", "xss"]),
            mockReview("rev-3", 102, ["path-traversal", "error-handling"]),
            mockReview("rev-4", 103, ["error-handling"]),
        ];
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 2);
        // Both have count=3, sorted alphabetically: error-handling before path-traversal
        strict_1.default.equal(results[0].pattern, "error-handling");
        strict_1.default.equal(results[0].count, 3);
        strict_1.default.equal(results[0].distinctPRs.size, 3);
        strict_1.default.equal(results[1].pattern, "path-traversal");
        strict_1.default.equal(results[1].count, 3);
    });
    (0, node_test_1.test)("ignores patterns below threshold", () => {
        const reviews = [
            mockReview("rev-1", 100, ["path-traversal"]),
            mockReview("rev-2", 101, ["xss"]),
        ];
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 0);
    });
    (0, node_test_1.test)("counts distinct PRs correctly (same pattern in multiple reviews for same PR = 1 PR)", () => {
        const reviews = [
            mockReview("rev-1", 100, ["path-traversal"]),
            mockReview("rev-2", 100, ["path-traversal"]), // same PR as rev-1
            mockReview("rev-3", 101, ["path-traversal"]),
            mockReview("rev-4", 102, ["path-traversal"]),
        ];
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].pattern, "path-traversal");
        strict_1.default.equal(results[0].count, 4);
        strict_1.default.equal(results[0].distinctPRs.size, 3); // PRs 100, 101, 102
    });
    (0, node_test_1.test)("handles reviews with null/empty patterns", () => {
        const reviews = [
            mockReview("rev-1", 100, ["path-traversal"]),
            mockReview("rev-2", 101, []),
            mockReview("rev-3", 102, ["path-traversal"]),
            { ...mockReview("rev-4", 103, []), patterns: null },
            mockReview("rev-5", 104, ["path-traversal"]),
        ];
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].pattern, "path-traversal");
        strict_1.default.equal(results[0].count, 3);
    });
    (0, node_test_1.test)("normalizes pattern strings to lowercase", () => {
        const reviews = [
            mockReview("rev-1", 100, ["Path-Traversal"]),
            mockReview("rev-2", 101, ["path-traversal"]),
            mockReview("rev-3", 102, ["PATH-TRAVERSAL"]),
        ];
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].pattern, "path-traversal");
        strict_1.default.equal(results[0].count, 3);
    });
    (0, node_test_1.test)("requires minimum distinct PRs (excludes null PRs from count)", () => {
        const reviews = [
            mockReview("rev-1", null, ["path-traversal"]),
            mockReview("rev-2", null, ["path-traversal"]),
            mockReview("rev-3", 100, ["path-traversal"]),
        ];
        // 3 occurrences but only 1 distinct PR -- fails minDistinctPRs=2
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 0);
    });
    (0, node_test_1.test)("sorts results by count descending", () => {
        const reviews = [
            mockReview("rev-1", 100, ["xss", "path-traversal"]),
            mockReview("rev-2", 101, ["xss", "path-traversal"]),
            mockReview("rev-3", 102, ["xss", "path-traversal"]),
            mockReview("rev-4", 103, ["xss"]),
            mockReview("rev-5", 104, ["xss"]),
        ];
        const results = promoteModule.detectRecurrence(reviews, 3, 2);
        strict_1.default.equal(results.length, 2);
        strict_1.default.equal(results[0].pattern, "xss");
        strict_1.default.equal(results[0].count, 5);
        strict_1.default.equal(results[1].pattern, "path-traversal");
        strict_1.default.equal(results[1].count, 3);
    });
});
(0, node_test_1.describe)("filterAlreadyPromoted", () => {
    (0, node_test_1.test)("filters out patterns already in CODE_PATTERNS.md", () => {
        const patterns = [
            {
                pattern: "path traversal",
                count: 5,
                distinctPRs: new Set([100, 101]),
                reviewIds: ["rev-1", "rev-2"],
            },
            {
                pattern: "new-pattern",
                count: 3,
                distinctPRs: new Set([100, 101]),
                reviewIds: ["rev-1", "rev-2"],
            },
        ];
        const codePatternsContent = `
## Security
### Path Traversal
Some content about path traversal...
`;
        const result = promoteModule.filterAlreadyPromoted(patterns, codePatternsContent);
        strict_1.default.equal(result.newPatterns.length, 1);
        strict_1.default.equal(result.newPatterns[0].pattern, "new-pattern");
        strict_1.default.equal(result.alreadyPromoted.length, 1);
        strict_1.default.equal(result.alreadyPromoted[0], "path traversal");
    });
    (0, node_test_1.test)("handles empty CODE_PATTERNS content (all patterns are new)", () => {
        const patterns = [
            {
                pattern: "new-pattern",
                count: 3,
                distinctPRs: new Set([100, 101]),
                reviewIds: ["rev-1"],
            },
        ];
        const result = promoteModule.filterAlreadyPromoted(patterns, "");
        strict_1.default.equal(result.newPatterns.length, 1);
        strict_1.default.equal(result.alreadyPromoted.length, 0);
    });
});
(0, node_test_1.describe)("categorizePattern", () => {
    (0, node_test_1.test)("maps security-related patterns to Security", () => {
        strict_1.default.equal(promoteModule.categorizePattern("path-traversal"), "Security");
        strict_1.default.equal(promoteModule.categorizePattern("xss injection"), "Security");
        strict_1.default.equal(promoteModule.categorizePattern("prototype pollution"), "Security");
        strict_1.default.equal(promoteModule.categorizePattern("symlink guard"), "Security");
    });
    (0, node_test_1.test)("maps error-handling to JavaScript/TypeScript", () => {
        strict_1.default.equal(promoteModule.categorizePattern("error-handling"), "JavaScript/TypeScript");
        strict_1.default.equal(promoteModule.categorizePattern("try-catch missing"), "JavaScript/TypeScript");
    });
    (0, node_test_1.test)("maps shell/bash to Bash/Shell", () => {
        strict_1.default.equal(promoteModule.categorizePattern("bash script"), "Bash/Shell");
        strict_1.default.equal(promoteModule.categorizePattern("cross-platform"), "Bash/Shell");
    });
    (0, node_test_1.test)("maps CI-related to CI/Automation", () => {
        strict_1.default.equal(promoteModule.categorizePattern("github-actions workflow"), "CI/Automation");
        strict_1.default.equal(promoteModule.categorizePattern("pre-commit hook"), "CI/Automation");
    });
    (0, node_test_1.test)("maps documentation to Documentation", () => {
        strict_1.default.equal(promoteModule.categorizePattern("markdown link broken"), "Documentation");
    });
    (0, node_test_1.test)("maps unknown patterns to General", () => {
        strict_1.default.equal(promoteModule.categorizePattern("some-random-pattern"), "General");
    });
});
(0, node_test_1.describe)("generateRuleSkeleton", () => {
    (0, node_test_1.test)("produces valid rule object with all required fields", () => {
        const result = {
            pattern: "path-traversal",
            count: 5,
            distinctPRs: new Set([100, 101, 102]),
            reviewIds: ["rev-1", "rev-2", "rev-3"],
        };
        const skeleton = promoteModule.generateRuleSkeleton(result);
        strict_1.default.ok(skeleton.id.startsWith("path-traversal"), `id should start with 'path-traversal', got '${skeleton.id}'`);
        strict_1.default.equal(skeleton.pattern, "TODO_REGEX");
        strict_1.default.equal(skeleton.message, "path-traversal");
        strict_1.default.ok(skeleton.fix.includes("5x recurrence"));
        strict_1.default.ok(skeleton.fix.includes("3 PRs"));
        strict_1.default.deepEqual(skeleton.fileTypes, [".js", ".ts"]);
        strict_1.default.equal(skeleton.severity, "error"); // 5 >= 5 threshold
    });
    (0, node_test_1.test)("sets severity to warning for count < 5", () => {
        const result = {
            pattern: "minor-issue",
            count: 3,
            distinctPRs: new Set([100, 101]),
            reviewIds: ["rev-1", "rev-2", "rev-3"],
        };
        const skeleton = promoteModule.generateRuleSkeleton(result);
        strict_1.default.equal(skeleton.severity, "warning");
    });
    (0, node_test_1.test)("generates slug-based id from pattern name", () => {
        const result = {
            pattern: "Error Handling: Missing Try/Catch",
            count: 4,
            distinctPRs: new Set([100, 101]),
            reviewIds: ["rev-1"],
        };
        const skeleton = promoteModule.generateRuleSkeleton(result);
        strict_1.default.ok(skeleton.id.startsWith("error-handling-missing-try-catch"), `id should start with slug, got '${skeleton.id}'`);
    });
    (0, node_test_1.test)("truncates long pattern ids to 40 chars", () => {
        const result = {
            pattern: "this-is-a-very-long-pattern-name-that-exceeds-the-forty-character-limit-for-ids",
            count: 3,
            distinctPRs: new Set([100, 101]),
            reviewIds: ["rev-1"],
        };
        const skeleton = promoteModule.generateRuleSkeleton(result);
        // ID is base (up to 40 chars) + hash suffix (7 chars: "-" + 6 hex)
        strict_1.default.ok(skeleton.id.length <= 47, `id length ${skeleton.id.length} should be <= 47`);
    });
});
(0, node_test_1.describe)("Integration: full pipeline with mock reviews", () => {
    (0, node_test_1.test)("detects recurring patterns and generates correct promotions", () => {
        // Create reviews with overlapping patterns across multiple PRs
        const reviews = [
            mockReview("rev-1", 100, ["path-traversal", "error-handling", "xss"]),
            mockReview("rev-2", 101, ["path-traversal", "error-handling"]),
            mockReview("rev-3", 102, ["path-traversal", "error-handling", "xss"]),
            mockReview("rev-4", 103, ["xss"]),
            mockReview("rev-5", 104, ["one-off-pattern"]),
        ];
        // Step 1: Detect recurrence
        const recurring = promoteModule.detectRecurrence(reviews, 3, 2);
        // Should find path-traversal (3x, 3 PRs), error-handling (3x, 3 PRs), xss (3x, 3 PRs)
        strict_1.default.equal(recurring.length, 3);
        const patternNames = new Set(recurring.map((r) => r.pattern));
        strict_1.default.ok(patternNames.has("path-traversal"));
        strict_1.default.ok(patternNames.has("error-handling"));
        strict_1.default.ok(patternNames.has("xss"));
        // one-off-pattern should NOT be included (only 1 occurrence)
        strict_1.default.ok(!patternNames.has("one-off-pattern"));
        // Step 2: Filter already promoted (simulating path-traversal already in CODE_PATTERNS)
        const codePatternsContent = `
## Security
### Path Traversal
This pattern is already documented.
`;
        const filtered = promoteModule.filterAlreadyPromoted(recurring, codePatternsContent);
        strict_1.default.equal(filtered.newPatterns.length, 2);
        strict_1.default.equal(filtered.alreadyPromoted.length, 1);
        strict_1.default.equal(filtered.alreadyPromoted[0], "path-traversal");
        // Step 3: Categorize the new patterns
        for (const p of filtered.newPatterns) {
            const category = promoteModule.categorizePattern(p.pattern);
            if (p.pattern === "error-handling") {
                strict_1.default.equal(category, "JavaScript/TypeScript");
            }
            else if (p.pattern === "xss") {
                strict_1.default.equal(category, "Security");
            }
        }
        // Step 4: Generate rule skeletons
        const skeletons = filtered.newPatterns.map((p) => promoteModule.generateRuleSkeleton(p));
        strict_1.default.equal(skeletons.length, 2);
        for (const s of skeletons) {
            strict_1.default.ok(s.id);
            strict_1.default.equal(s.pattern, "TODO_REGEX");
            strict_1.default.ok(s.message);
            strict_1.default.ok(s.fix);
            strict_1.default.ok(Array.isArray(s.fileTypes));
            strict_1.default.ok(s.severity);
        }
    });
});
// ============================================================
// generate-claude-antipatterns.ts tests
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-require-imports
const antiPatternsModule = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/generate-claude-antipatterns.js"));
(0, node_test_1.describe)("generateAntiPatternsTable", () => {
    (0, node_test_1.test)("produces correct markdown table with top 6", () => {
        const patterns = [
            { pattern: "path-traversal", count: 10, distinctPRs: new Set([1, 2, 3]), reviewIds: ["r1"] },
            { pattern: "error-handling", count: 8, distinctPRs: new Set([1, 2]), reviewIds: ["r2"] },
            { pattern: "xss", count: 7, distinctPRs: new Set([1, 2, 3]), reviewIds: ["r3"] },
            { pattern: "regex-dos", count: 5, distinctPRs: new Set([1, 2]), reviewIds: ["r4"] },
            { pattern: "prototype-pollution", count: 4, distinctPRs: new Set([1]), reviewIds: ["r5"] },
            { pattern: "symlink-guard", count: 3, distinctPRs: new Set([1, 2]), reviewIds: ["r6"] },
            { pattern: "should-not-appear", count: 2, distinctPRs: new Set([1]), reviewIds: ["r7"] },
        ];
        const table = antiPatternsModule.generateAntiPatternsTable(patterns);
        // Should have header + separator + 6 rows (not 7)
        const lines = table.split("\n");
        strict_1.default.equal(lines.length, 8); // header + separator + 6 data rows
        // First data row should be path-traversal
        strict_1.default.ok(lines[2].includes("Path Traversal"));
        // 7th pattern should NOT appear
        strict_1.default.ok(!table.includes("Should Not Appear"));
    });
    (0, node_test_1.test)("handles empty patterns", () => {
        const table = antiPatternsModule.generateAntiPatternsTable([]);
        strict_1.default.ok(table.includes("(none detected)"));
    });
});
(0, node_test_1.describe)("updateClaudeMd", () => {
    (0, node_test_1.test)("adds markers on first run if missing (dry-run, fixture CLAUDE.md)", () => {
        const tmpRoot = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-claude-md-"));
        fs.writeFileSync(path.join(tmpRoot, "CLAUDE.md"), [
            "# AI Context & Rules",
            "",
            "## 1. Stack Versions",
            "",
            "## 4. Critical Anti-Patterns",
            "",
            "| Pattern            | Rule                                                                         |",
            "| ------------------ | ---------------------------------------------------------------------------- |",
            "| Error sanitization | Use sanitize-error.js                                                        |",
            "",
            "## 5. Coding Standards",
            "",
        ].join("\n"), "utf8");
        const result = antiPatternsModule.updateClaudeMd(tmpRoot, [
            {
                pattern: "test-pattern",
                count: 5,
                distinctPRs: new Set([1, 2]),
                reviewIds: ["r1"],
            },
        ], true);
        strict_1.default.ok(result.includes("<!-- AUTO-ANTIPATTERNS-START -->"));
        strict_1.default.ok(result.includes("<!-- AUTO-ANTIPATTERNS-END -->"));
        strict_1.default.ok(result.includes("## 1. Stack Versions"));
        strict_1.default.ok(result.includes("## 5. Coding Standards"));
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    });
    (0, node_test_1.test)("replaces content between markers on subsequent runs (dry-run, fixture CLAUDE.md)", () => {
        const tmpRoot = fs.mkdtempSync(path.join(PROJECT_ROOT, ".tmp-claude-md-"));
        fs.writeFileSync(path.join(tmpRoot, "CLAUDE.md"), [
            "## 4. Critical Anti-Patterns",
            "",
            "<!-- AUTO-ANTIPATTERNS-START -->",
            "| Pattern | Rule |",
            "| --- | --- |",
            "| Old Pattern | old rule |",
            "<!-- AUTO-ANTIPATTERNS-END -->",
            "",
        ].join("\n"), "utf8");
        const result = antiPatternsModule.updateClaudeMd(tmpRoot, [
            {
                pattern: "first-pattern",
                count: 5,
                distinctPRs: new Set([1, 2]),
                reviewIds: ["r1"],
            },
        ], true);
        strict_1.default.ok(result.includes("<!-- AUTO-ANTIPATTERNS-START -->"));
        strict_1.default.ok(result.includes("<!-- AUTO-ANTIPATTERNS-END -->"));
        strict_1.default.ok(!result.includes("Old Pattern"));
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    });
});
// ============================================================
// generate-fix-template-stubs.ts tests
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fixTemplateModule = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/generate-fix-template-stubs.js"));
(0, node_test_1.describe)("generateFixTemplateStub", () => {
    (0, node_test_1.test)("produces correctly numbered stub", () => {
        const pattern = {
            pattern: "path-traversal",
            count: 5,
            distinctPRs: new Set([100, 101, 102]),
            reviewIds: ["rev-1", "rev-2"],
        };
        const stub = fixTemplateModule.generateFixTemplateStub(pattern, 46);
        strict_1.default.ok(stub.includes("### Template 46: Path Traversal"));
        strict_1.default.ok(stub.includes("**Pattern:** Path Traversal"));
        strict_1.default.ok(stub.includes("[TODO: fill in]"));
        strict_1.default.ok(stub.includes("// TODO: add fix example"));
        strict_1.default.ok(stub.includes("5x recurrence across 3 PRs"));
        strict_1.default.ok(stub.includes("#100"));
    });
    (0, node_test_1.test)("handles pattern with no PRs", () => {
        const pattern = {
            pattern: "some-issue",
            count: 3,
            distinctPRs: new Set(),
            reviewIds: ["rev-1"],
        };
        const stub = fixTemplateModule.generateFixTemplateStub(pattern, 99);
        strict_1.default.ok(stub.includes("### Template 99:"));
        strict_1.default.ok(stub.includes("0 PRs"));
        strict_1.default.ok(stub.includes("N/A"));
    });
});
(0, node_test_1.describe)("appendFixTemplateStubs", () => {
    (0, node_test_1.test)("skips patterns already in FIX_TEMPLATES.md (dry-run)", () => {
        // "readFileSync without try/catch" is Template 1 in FIX_TEMPLATES.md
        const patterns = [
            {
                pattern: "readfilesync without try/catch",
                count: 5,
                distinctPRs: new Set([1, 2]),
                reviewIds: ["r1"],
            },
            {
                pattern: "totally-new-pattern-xyz",
                count: 3,
                distinctPRs: new Set([1, 2]),
                reviewIds: ["r2"],
            },
        ];
        const result = fixTemplateModule.appendFixTemplateStubs(PROJECT_ROOT, patterns, true // dry-run
        );
        // The first pattern should be skipped (already exists in FIX_TEMPLATES.md)
        strict_1.default.ok(result.skipped.includes("readfilesync without try/catch"));
        // The second pattern should be generated
        strict_1.default.ok(result.generated.includes("totally-new-pattern-xyz"));
    });
});
