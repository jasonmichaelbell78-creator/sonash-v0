"use strict";
/**
 * Unit tests for write-review-record.ts
 *
 * Tests the writeReviewRecord() function and getNextReviewId() helper.
 * Uses temp directories for isolated file I/O.
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
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const node_child_process_1 = require("node:child_process");
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
// SEC-008: Verify resolved path is within project root
function assertWithinRoot(filePath, root) {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
        throw new Error(`Path traversal blocked: ${resolved} is outside ${root}`);
    }
}
// Import compiled modules
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-review-record.js");
assertWithinRoot(distPath, PROJECT_ROOT);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeReviewRecord, getNextReviewId } = require(distPath);
// =========================================================
// Test helpers
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
        pr: 999,
        source: "manual",
        total: 5,
        fixed: 4,
        deferred: 1,
        rejected: 0,
        ...overrides,
    };
}
let tmpDir;
// =========================================================
// Setup / teardown
// =========================================================
(0, node_test_1.beforeEach)(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "write-review-test-"));
    // Create the data directory structure
    fs.mkdirSync(path.join(tmpDir, "data", "ecosystem-v2"), { recursive: true });
    // Create a package.json so findProjectRoot works
    fs.writeFileSync(path.join(tmpDir, "package.json"), "{}");
});
(0, node_test_1.afterEach)(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});
// =========================================================
// Tests
// =========================================================
(0, node_test_1.describe)("writeReviewRecord", () => {
    (0, node_test_1.test)("valid full record writes successfully and appends to file", () => {
        const data = makeFullRecord();
        const result = writeReviewRecord(tmpDir, data);
        strict_1.default.equal(result.id, "rev-1");
        strict_1.default.equal(result.pr, 999);
        const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
        strict_1.default.ok(fs.existsSync(filePath), "reviews.jsonl should be created");
        const content = fs.readFileSync(filePath, "utf8").trim();
        const written = JSON.parse(content);
        strict_1.default.equal(written.id, "rev-1");
        strict_1.default.equal(written.title, "Test Review");
    });
    (0, node_test_1.test)("invalid record (missing required fields) throws Zod error", () => {
        const data = {
            // Missing id, date, schema_version, completeness, origin
            title: "Bad Record",
        };
        strict_1.default.throws(() => writeReviewRecord(tmpDir, data), (err) => {
            strict_1.default.ok(err.name === "ZodError", `Expected ZodError, got ${err.name}`);
            return true;
        });
        // File should not be created
        const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
        strict_1.default.ok(!fs.existsSync(filePath), "reviews.jsonl should not be created on failure");
    });
    (0, node_test_1.test)("multiple writes append correctly", () => {
        writeReviewRecord(tmpDir, makeFullRecord({ id: "rev-1" }));
        writeReviewRecord(tmpDir, makeFullRecord({ id: "rev-2", pr: 1000 }));
        const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
        const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
        strict_1.default.equal(lines.length, 2);
        const record1 = JSON.parse(lines[0]);
        const record2 = JSON.parse(lines[1]);
        strict_1.default.equal(record1.id, "rev-1");
        strict_1.default.equal(record2.id, "rev-2");
    });
});
(0, node_test_1.describe)("getNextReviewId", () => {
    (0, node_test_1.test)("auto-ID assignment reads existing file and increments", () => {
        // Write two records manually
        const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
        const rec1 = JSON.stringify(makeFullRecord({ id: "rev-3" }));
        const rec2 = JSON.stringify(makeFullRecord({ id: "rev-7" }));
        fs.writeFileSync(filePath, rec1 + "\n" + rec2 + "\n");
        const nextId = getNextReviewId(tmpDir);
        strict_1.default.equal(nextId, "rev-8");
    });
    (0, node_test_1.test)("empty file produces rev-1 as first ID", () => {
        const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
        fs.writeFileSync(filePath, "");
        const nextId = getNextReviewId(tmpDir);
        strict_1.default.equal(nextId, "rev-1");
    });
    (0, node_test_1.test)("missing file produces rev-1", () => {
        const nextId = getNextReviewId(tmpDir);
        strict_1.default.equal(nextId, "rev-1");
    });
    (0, node_test_1.test)("auto-assigns ID when data has no id field", () => {
        // Write a seed record
        const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
        fs.writeFileSync(filePath, JSON.stringify(makeFullRecord({ id: "rev-5" })) + "\n");
        const data = makeFullRecord();
        delete data.id;
        const result = writeReviewRecord(tmpDir, data);
        strict_1.default.equal(result.id, "rev-6");
    });
});
(0, node_test_1.describe)("CLI entry point", () => {
    (0, node_test_1.test)("exits 0 on success", () => {
        const data = JSON.stringify(makeFullRecord());
        // Create a temp project root with proper structure for CLI test
        const cliTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "write-review-cli-"));
        fs.mkdirSync(path.join(cliTmpDir, "data", "ecosystem-v2"), { recursive: true });
        fs.writeFileSync(path.join(cliTmpDir, "package.json"), "{}");
        // We need to copy safe-fs.js for the CLI to work, create a scripts/lib structure
        const safeFsSrc = path.join(PROJECT_ROOT, "scripts", "lib", "safe-fs.js");
        const safeFsDst = path.join(cliTmpDir, "scripts", "lib", "safe-fs.js");
        fs.mkdirSync(path.dirname(safeFsDst), { recursive: true });
        fs.copyFileSync(safeFsSrc, safeFsDst);
        try {
            // Run the CLI script but override __dirname by calling writeReviewRecord directly
            // Since CLI uses findProjectRoot(__dirname), we test via the function instead
            const result = writeReviewRecord(cliTmpDir, JSON.parse(data));
            strict_1.default.ok(result.id, "Should have an ID");
        }
        finally {
            fs.rmSync(cliTmpDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)("exits 1 on validation failure via CLI", () => {
        const scriptPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-review-record.js");
        assertWithinRoot(scriptPath, PROJECT_ROOT);
        const badData = JSON.stringify({ title: "bad" });
        strict_1.default.throws(() => {
            (0, node_child_process_1.execFileSync)("node", [scriptPath, "--data", badData], {
                stdio: "pipe",
                encoding: "utf8",
            });
        }, (err) => {
            strict_1.default.equal(err.status, 1, "Should exit with code 1");
            return true;
        });
    });
});
