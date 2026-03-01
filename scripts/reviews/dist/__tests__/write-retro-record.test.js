"use strict";
/**
 * Tests for write-retro-record.ts — validates RetroRecord writing to retros.jsonl.
 *
 * Uses temp directories for file isolation. Node.js built-in test runner.
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
const os = __importStar(require("node:os"));
// Walk up from __dirname until we find package.json
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeRetroRecord } = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-retro-record.js"));
// ---- Test helpers -----------------------------------------------------------
let tmpDir;
function makeValidRetroData(overrides) {
    return {
        id: "retro-pr-100",
        date: "2026-02-28",
        schema_version: 1,
        completeness: "full",
        completeness_missing: [],
        origin: { type: "pr-retro", tool: "write-retro-record.ts" },
        pr: 100,
        top_wins: ["Good test coverage"],
        top_misses: ["Slow CI"],
        process_changes: ["Add caching"],
        score: 7,
        metrics: { total_findings: 5, fix_rate: 0.8, pattern_recurrence: 1 },
        ...overrides,
    };
}
// ---- Tests ------------------------------------------------------------------
(0, node_test_1.describe)("writeRetroRecord", () => {
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "retro-test-"));
    });
    (0, node_test_1.afterEach)(() => {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        catch {
            // cleanup best-effort
        }
    });
    (0, node_test_1.test)("writes a valid retro record to retros.jsonl", () => {
        const data = makeValidRetroData();
        const result = writeRetroRecord(tmpDir, data);
        strict_1.default.equal(result.id, "retro-pr-100");
        strict_1.default.equal(result.pr, 100);
        const filePath = path.join(tmpDir, "data/ecosystem-v2/retros.jsonl");
        strict_1.default.ok(fs.existsSync(filePath), "retros.jsonl should be created");
        const content = fs.readFileSync(filePath, "utf8").trim();
        const parsed = JSON.parse(content);
        strict_1.default.equal(parsed.id, "retro-pr-100");
    });
    (0, node_test_1.test)("auto-assigns ID as retro-pr-{N} when no id provided", () => {
        const data = makeValidRetroData({ pr: 42 });
        delete data.id;
        const result = writeRetroRecord(tmpDir, data);
        strict_1.default.equal(result.id, "retro-pr-42");
    });
    (0, node_test_1.test)("rejects invalid data with ZodError", () => {
        const invalidData = {
            // missing required fields
            pr: 100,
        };
        strict_1.default.throws(() => writeRetroRecord(tmpDir, invalidData), (err) => err.name === "ZodError");
        // File should not exist since write failed
        const filePath = path.join(tmpDir, "data/ecosystem-v2/retros.jsonl");
        strict_1.default.ok(!fs.existsSync(filePath), "retros.jsonl should not be created on failure");
    });
    (0, node_test_1.test)("rejects invalid score (out of range)", () => {
        const data = makeValidRetroData({ score: 15 });
        strict_1.default.throws(() => writeRetroRecord(tmpDir, data), (err) => err.name === "ZodError");
    });
    (0, node_test_1.test)("appends multiple records", () => {
        writeRetroRecord(tmpDir, makeValidRetroData({ id: "retro-pr-1", pr: 1 }));
        writeRetroRecord(tmpDir, makeValidRetroData({ id: "retro-pr-2", pr: 2 }));
        const filePath = path.join(tmpDir, "data/ecosystem-v2/retros.jsonl");
        const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
        strict_1.default.equal(lines.length, 2, "should have 2 records");
        const first = JSON.parse(lines[0]);
        const second = JSON.parse(lines[1]);
        strict_1.default.equal(first.id, "retro-pr-1");
        strict_1.default.equal(second.id, "retro-pr-2");
    });
    (0, node_test_1.test)("creates directory structure if missing", () => {
        const data = makeValidRetroData();
        writeRetroRecord(tmpDir, data);
        const dirPath = path.join(tmpDir, "data/ecosystem-v2");
        strict_1.default.ok(fs.existsSync(dirPath), "data/ecosystem-v2 directory should be created");
    });
});
