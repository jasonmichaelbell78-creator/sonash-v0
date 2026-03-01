"use strict";
/**
 * CLI and library for auto-creating DeferredItemRecords from review findings.
 *
 * Library: createDeferredItems(projectRoot, reviewId, items, date)
 * CLI: node dist/write-deferred-items.js --review-id rev-N --date YYYY-MM-DD --items '[...]'
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
exports.createDeferredItems = createDeferredItems;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
const deferred_item_1 = require("./lib/schemas/deferred-item");
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
 * Create DeferredItemRecords from review findings and append to deferred-items.jsonl.
 *
 * Each item gets a unique ID derived from the parent review ID: `{reviewId}-deferred-{N}`.
 *
 * @param projectRoot - Absolute path to project root
 * @param reviewId - Parent review ID (e.g., "rev-399")
 * @param items - Array of deferred findings
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of validated records that were written
 */
function createDeferredItems(projectRoot, reviewId, items, date) {
    var _a, _b;
    if (items.length === 0)
        return [];
    if (!/^rev-\d+(?:-[a-z0-9]+)?$/.test(reviewId)) {
        throw new Error(`Invalid reviewId format: ${reviewId}`);
    }
    const filePath = path.resolve(projectRoot, "data/ecosystem-v2/deferred-items.jsonl");
    const created = [];
    // Scan existing items to prevent duplicate IDs on reruns
    let startIndex = 1;
    try {
        const existing = fs.readFileSync(filePath, "utf8");
        let maxExisting = 0;
        for (const line of existing.split("\n")) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line);
                const id = typeof parsed.id === "string" ? parsed.id : "";
                const escapedId = reviewId.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw `\$&`);
                const m = new RegExp("^" + escapedId + String.raw `-deferred-(\d+)$`).exec(id);
                if (m) {
                    const n = Number.parseInt(m[1], 10);
                    if (n > maxExisting)
                        maxExisting = n;
                }
            }
            catch {
                // ignore malformed lines
            }
        }
        startIndex = maxExisting + 1;
    }
    catch {
        // file doesn't exist yet — start at 1
    }
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const record = {
            id: `${reviewId}-deferred-${startIndex + i}`,
            date,
            schema_version: 1,
            completeness: "full",
            completeness_missing: [],
            origin: {
                type: "pr-review",
                tool: "write-deferred-items.ts",
            },
            review_id: reviewId,
            finding: item.finding,
            reason: (_a = item.reason) !== null && _a !== void 0 ? _a : null,
            severity: (_b = item.severity) !== null && _b !== void 0 ? _b : null,
            status: "open",
            defer_count: 1,
            promoted_to_debt: false,
        };
        // Validate with Zod -- throws ZodError on failure
        const validated = deferred_item_1.DeferredItemRecord.parse(record);
        // Write using appendRecord (handles locking, symlink guard, mkdir)
        (0, write_jsonl_1.appendRecord)(filePath, validated, deferred_item_1.DeferredItemRecord);
        created.push(validated);
    }
    return created;
}
// ---- CLI entry point --------------------------------------------------------
function main() {
    const args = process.argv.slice(2);
    const reviewIdIdx = args.indexOf("--review-id");
    const dateIdx = args.indexOf("--date");
    const itemsIdx = args.indexOf("--items");
    if (reviewIdIdx === -1 ||
        reviewIdIdx + 1 >= args.length ||
        dateIdx === -1 ||
        dateIdx + 1 >= args.length ||
        itemsIdx === -1 ||
        itemsIdx + 1 >= args.length) {
        console.error("Usage: write-deferred-items --review-id rev-N --date YYYY-MM-DD --items '[...]'");
        process.exit(1);
    }
    const reviewId = args[reviewIdIdx + 1];
    const date = args[dateIdx + 1];
    let items;
    try {
        const parsed = JSON.parse(args[itemsIdx + 1]);
        if (!Array.isArray(parsed)) {
            console.error("Error: --items must be a valid JSON array");
            process.exit(1);
        }
        items = parsed;
    }
    catch {
        console.error("Error: --items must be valid JSON array");
        process.exit(1);
    }
    const projectRoot = findProjectRoot(__dirname);
    try {
        const records = createDeferredItems(projectRoot, reviewId, items, date);
        console.log(`Created ${records.length} deferred item(s) for ${reviewId} in deferred-items.jsonl`);
    }
    catch (err) {
        if (err instanceof Error) {
            console.error(`Validation error: ${err.message}`);
        }
        else {
            console.error("Unknown error");
        }
        process.exit(1);
    }
}
// Only run CLI when executed directly (not imported)
if (require.main === module) {
    main();
}
