"use strict";
/**
 * Tests for write-deferred-items.ts — validates DeferredItemRecord creation.
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
const { createDeferredItems } = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-deferred-items.js"));
// ---- Test helpers -----------------------------------------------------------
let tmpDir;
// ---- Tests ------------------------------------------------------------------
(0, node_test_1.describe)("createDeferredItems", () => {
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "deferred-test-"));
    });
    (0, node_test_1.afterEach)(() => {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        catch {
            // cleanup best-effort
        }
    });
    (0, node_test_1.test)("creates correct number of deferred items", () => {
        const items = [
            { finding: "Missing error handling in auth" },
            { finding: "No input validation on POST endpoint" },
            { finding: "Unused import in utils" },
        ];
        const results = createDeferredItems(tmpDir, "rev-100", items, "2026-02-28");
        strict_1.default.equal(results.length, 3, "should create 3 deferred items");
    });
    (0, node_test_1.test)("IDs follow {reviewId}-deferred-{N} pattern", () => {
        const items = [{ finding: "Finding A" }, { finding: "Finding B" }];
        const results = createDeferredItems(tmpDir, "rev-42", items, "2026-02-28");
        strict_1.default.equal(results[0].id, "rev-42-deferred-1");
        strict_1.default.equal(results[1].id, "rev-42-deferred-2");
    });
    (0, node_test_1.test)("creates deferred-items.jsonl if file does not exist", () => {
        const filePath = path.join(tmpDir, "data/ecosystem-v2/deferred-items.jsonl");
        strict_1.default.ok(!fs.existsSync(filePath), "file should not exist initially");
        createDeferredItems(tmpDir, "rev-1", [{ finding: "Test finding" }], "2026-02-28");
        strict_1.default.ok(fs.existsSync(filePath), "deferred-items.jsonl should be created");
    });
    (0, node_test_1.test)("validates all fields correctly", () => {
        const items = [{ finding: "Missing auth", reason: "Low priority", severity: "S2" }];
        const results = createDeferredItems(tmpDir, "rev-50", items, "2026-02-28");
        const record = results[0];
        strict_1.default.equal(record.id, "rev-50-deferred-1");
        strict_1.default.equal(record.date, "2026-02-28");
        strict_1.default.equal(record.schema_version, 1);
        strict_1.default.equal(record.completeness, "full");
        strict_1.default.equal(record.review_id, "rev-50");
        strict_1.default.equal(record.finding, "Missing auth");
        strict_1.default.equal(record.reason, "Low priority");
        strict_1.default.equal(record.severity, "S2");
        strict_1.default.equal(record.status, "open");
        strict_1.default.equal(record.defer_count, 1);
        strict_1.default.equal(record.promoted_to_debt, false);
    });
    (0, node_test_1.test)("empty items array produces no records", () => {
        const results = createDeferredItems(tmpDir, "rev-99", [], "2026-02-28");
        strict_1.default.equal(results.length, 0, "should return empty array");
        const filePath = path.join(tmpDir, "data/ecosystem-v2/deferred-items.jsonl");
        strict_1.default.ok(!fs.existsSync(filePath), "file should not be created for empty items");
    });
    (0, node_test_1.test)("appends to existing file", () => {
        createDeferredItems(tmpDir, "rev-1", [{ finding: "First batch" }], "2026-02-28");
        createDeferredItems(tmpDir, "rev-2", [{ finding: "Second batch" }], "2026-02-28");
        const filePath = path.join(tmpDir, "data/ecosystem-v2/deferred-items.jsonl");
        const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
        strict_1.default.equal(lines.length, 2, "should have 2 records");
    });
    (0, node_test_1.test)("sets origin with type pr-review and tool name", () => {
        const results = createDeferredItems(tmpDir, "rev-10", [{ finding: "Origin test" }], "2026-02-28");
        const origin = results[0].origin;
        strict_1.default.equal(origin.type, "pr-review");
        strict_1.default.equal(origin.tool, "write-deferred-items.ts");
    });
    (0, node_test_1.test)("rejects invalid severity value", () => {
        strict_1.default.throws(() => createDeferredItems(tmpDir, "rev-bad", [{ finding: "Bad severity", severity: "critical" }], "2026-02-28"), (err) => err.name === "ZodError");
    });
});
