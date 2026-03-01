"use strict";
/**
 * CLI and programmatic interface for writing validated ReviewRecords to reviews.jsonl.
 *
 * Usage:
 *   npx tsc && node dist/write-review-record.js --data '{"pr":399,...}'
 *
 * Validates input against ReviewRecord schema, auto-assigns ID if missing,
 * and appends to data/ecosystem-v2/reviews.jsonl.
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
exports.getNextReviewId = getNextReviewId;
exports.writeReviewRecord = writeReviewRecord;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const review_1 = require("./lib/schemas/review");
const write_jsonl_1 = require("./lib/write-jsonl");
// Walk up from startDir until we find package.json
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
 * Read reviews.jsonl and determine the next auto-assigned review ID.
 * Returns "rev-1" if the file is empty or missing.
 */
function getNextReviewId(projectRoot) {
    const filePath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
    let content;
    try {
        content = fs.readFileSync(filePath, "utf8").trim();
    }
    catch {
        // File doesn't exist or can't be read -- start at 1
        return "rev-1";
    }
    if (!content)
        return "rev-1";
    const lines = content.split("\n");
    let maxNum = 0;
    for (const line of lines) {
        const num = parseRevNumber(line);
        if (num > maxNum)
            maxNum = num;
    }
    return `rev-${maxNum + 1}`;
}
/** Parse a rev-N number from a JSONL line. Returns 0 if not parseable. */
function parseRevNumber(line) {
    if (!line.trim())
        return 0;
    try {
        const record = JSON.parse(line);
        if (!record.id)
            return 0;
        const match = /^rev-(\d+)(?:-|$)/.exec(record.id);
        if (!match)
            return 0;
        return Number.parseInt(match[1], 10);
    }
    catch {
        // Skip malformed lines
        return 0;
    }
}
/**
 * Write a validated ReviewRecord to reviews.jsonl.
 *
 * If data has no `id` field, auto-assigns the next rev-N ID.
 * Validates against ReviewRecord schema before writing.
 * Throws ZodError on validation failure.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Record data (id optional -- will be auto-assigned)
 * @returns The validated record that was written
 */
function writeReviewRecord(projectRoot, data) {
    var _a;
    const filePath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
    const recordData = {
        ...data,
        id: (_a = data.id) !== null && _a !== void 0 ? _a : getNextReviewId(projectRoot),
    };
    const validated = review_1.ReviewRecord.parse(recordData);
    // Append to JSONL file
    (0, write_jsonl_1.appendRecord)(filePath, validated, review_1.ReviewRecord);
    return validated;
}
// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    const dataIdx = args.indexOf("--data");
    if (dataIdx === -1 || dataIdx + 1 >= args.length) {
        console.error("Usage: write-review-record.js --data '{\"pr\":399,...}'");
        process.exit(1);
    }
    const rawJson = args[dataIdx + 1];
    try {
        const data = JSON.parse(rawJson);
        const projectRoot = findProjectRoot(__dirname);
        const record = writeReviewRecord(projectRoot, data);
        console.log(`Wrote review ${record.id} to reviews.jsonl`);
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            console.error(`Invalid JSON: ${err.message}`);
        }
        else if (err instanceof Error && err.name === "ZodError") {
            console.error(`Validation error:\n${err.message}`);
        }
        else if (err instanceof Error) {
            console.error(`Error: ${err.message}`);
        }
        else {
            console.error("Unknown error");
        }
        process.exit(1);
    }
}
