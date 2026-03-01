"use strict";
/**
 * Tests for write-invocation.ts — validates InvocationRecord writing to invocations.jsonl.
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
const { writeInvocation } = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-invocation.js"));
// ---- Test helpers -----------------------------------------------------------
let tmpDir;
function makeValidInvocationData(overrides) {
    return {
        id: "inv-test-001",
        date: "2026-02-28",
        schema_version: 1,
        completeness: "full",
        completeness_missing: [],
        origin: { type: "pr-review", tool: "write-invocation.ts" },
        skill: "pr-review",
        type: "skill",
        success: true,
        duration_ms: 1500,
        context: { pr: 100, trigger: "manual" },
        ...overrides,
    };
}
// ---- Tests ------------------------------------------------------------------
(0, node_test_1.describe)("writeInvocation", () => {
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "invocation-test-"));
    });
    (0, node_test_1.afterEach)(() => {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        catch {
            // cleanup best-effort
        }
    });
    (0, node_test_1.test)("writes a valid invocation record to invocations.jsonl", () => {
        const data = makeValidInvocationData();
        const result = writeInvocation(tmpDir, data);
        strict_1.default.equal(result.id, "inv-test-001");
        strict_1.default.equal(result.skill, "pr-review");
        const filePath = path.join(tmpDir, "data/ecosystem-v2/invocations.jsonl");
        strict_1.default.ok(fs.existsSync(filePath), "invocations.jsonl should be created");
        const content = fs.readFileSync(filePath, "utf8").trim();
        const parsed = JSON.parse(content);
        strict_1.default.equal(parsed.id, "inv-test-001");
        strict_1.default.equal(parsed.skill, "pr-review");
    });
    (0, node_test_1.test)("auto-ID uses timestamp-based format", () => {
        const data = makeValidInvocationData();
        delete data.id;
        const before = Date.now();
        const result = writeInvocation(tmpDir, data);
        const after = Date.now();
        strict_1.default.ok(typeof result.id === "string" && result.id.startsWith("inv-"), "ID should start with inv-");
        const timestamp = Number.parseInt(result.id.replace("inv-", ""), 10);
        strict_1.default.ok(timestamp >= before && timestamp <= after, "timestamp should be within test window");
    });
    (0, node_test_1.test)("auto-date uses current date", () => {
        const data = makeValidInvocationData();
        delete data.date;
        const result = writeInvocation(tmpDir, data);
        const today = new Date().toISOString().slice(0, 10);
        strict_1.default.equal(result.date, today, "date should be today");
    });
    (0, node_test_1.test)("rejects invalid data (missing skill name)", () => {
        const data = makeValidInvocationData();
        delete data.skill;
        strict_1.default.throws(() => writeInvocation(tmpDir, data), (err) => err.name === "ZodError");
    });
    (0, node_test_1.test)("rejects invalid type value", () => {
        const data = makeValidInvocationData({ type: "invalid-type" });
        strict_1.default.throws(() => writeInvocation(tmpDir, data), (err) => err.name === "ZodError");
    });
    (0, node_test_1.test)("creates invocations.jsonl if not exists", () => {
        const filePath = path.join(tmpDir, "data/ecosystem-v2/invocations.jsonl");
        strict_1.default.ok(!fs.existsSync(filePath), "file should not exist initially");
        writeInvocation(tmpDir, makeValidInvocationData());
        strict_1.default.ok(fs.existsSync(filePath), "invocations.jsonl should be created");
    });
    (0, node_test_1.test)("multiple invocations append correctly", () => {
        writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-001", skill: "pr-review" }));
        writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-002", skill: "pr-retro" }));
        writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-003", skill: "code-reviewer", type: "agent" }));
        const filePath = path.join(tmpDir, "data/ecosystem-v2/invocations.jsonl");
        const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
        strict_1.default.equal(lines.length, 3, "should have 3 records");
        const first = JSON.parse(lines[0]);
        const second = JSON.parse(lines[1]);
        const third = JSON.parse(lines[2]);
        strict_1.default.equal(first.skill, "pr-review");
        strict_1.default.equal(second.skill, "pr-retro");
        strict_1.default.equal(third.skill, "code-reviewer");
        strict_1.default.equal(third.type, "agent");
    });
    (0, node_test_1.test)("supports agent and team types", () => {
        const agentResult = writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-a1", type: "agent", skill: "code-reviewer" }));
        strict_1.default.equal(agentResult.type, "agent");
        const teamResult = writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-t1", type: "team", skill: "dev-team" }));
        strict_1.default.equal(teamResult.type, "team");
    });
    (0, node_test_1.test)("records error state correctly", () => {
        const data = makeValidInvocationData({
            id: "inv-err",
            success: false,
            error: "Timeout after 30s",
        });
        const result = writeInvocation(tmpDir, data);
        strict_1.default.equal(result.success, false);
        strict_1.default.equal(result.error, "Timeout after 30s");
    });
});
