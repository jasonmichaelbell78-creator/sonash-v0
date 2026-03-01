"use strict";
/**
 * CLI and library for tracking skill/agent invocations in invocations.jsonl.
 *
 * Library: writeInvocation(projectRoot, data)
 * CLI: node dist/write-invocation.js --data '{"skill":"pr-review","type":"skill",...}'
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeInvocation = writeInvocation;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
const invocation_1 = require("./lib/schemas/invocation");
const write_jsonl_1 = require("./lib/write-jsonl");
// Walk up from startDir until we find package.json (works from both source and dist)
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
/**
 * Write a validated InvocationRecord to invocations.jsonl.
 *
 * Auto-assigns id as `inv-{timestamp}` if no id provided.
 * Auto-assigns date as today (YYYY-MM-DD) if no date provided.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Invocation data (id and date auto-assigned if missing)
 * @returns The validated record that was written
 */
function writeInvocation(projectRoot, data) {
    var _a, _b;
    const recordData = {
        ...data,
        id: (_a = data.id) !== null && _a !== void 0 ? _a : `inv-${Date.now()}-${process.pid}-${Math.random().toString(16).slice(2, 10)}`,
        date: (_b = data.date) !== null && _b !== void 0 ? _b : new Date().toISOString().slice(0, 10),
    };
    const validated = invocation_1.InvocationRecord.parse(recordData);
    // Resolve target file
    const filePath = path.resolve(projectRoot, "data/ecosystem-v2/invocations.jsonl");
    // Write using appendRecord (handles locking, symlink guard, mkdir)
    (0, write_jsonl_1.appendRecord)(filePath, validated, invocation_1.InvocationRecord);
    return validated;
}
// ---- CLI entry point --------------------------------------------------------
function main() {
    const args = process.argv.slice(2);
    const dataIdx = args.indexOf("--data");
    if (dataIdx === -1 || dataIdx + 1 >= args.length) {
        console.error("Usage: write-invocation --data '{...}'");
        process.exit(1);
    }
    let data;
    try {
        data = JSON.parse(args[dataIdx + 1]);
    }
    catch {
        console.error("Error: --data must be valid JSON");
        process.exit(1);
    }
    const projectRoot = findProjectRoot(__dirname);
    try {
        const record = writeInvocation(projectRoot, data);
        console.log(`Tracked invocation ${record.id} (${record.skill})`);
    }
    catch (err) {
        console.error(`Validation error: ${err instanceof Error ? err.message : "invocation record failed schema validation"}`);
        process.exit(1);
    }
}
// Only run CLI when executed directly (not imported)
if (require.main === module) {
    main();
}
