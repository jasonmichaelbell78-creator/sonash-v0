"use strict";
/**
 * generate-claude-antipatterns.ts — CLAUDE.md Section 4 auto-updater
 *
 * PIPE-07: Updates the auto-managed region of CLAUDE.md Section 4 with
 * the top 6 anti-patterns by recurrence count from reviews.jsonl.
 *
 * Uses marker comments:
 *   <!-- AUTO-ANTIPATTERNS-START -->
 *   <!-- AUTO-ANTIPATTERNS-END -->
 *
 * On first run, wraps the existing "Top 5" table with markers.
 * On subsequent runs, replaces content between markers.
 *
 * CRITICAL: Preserves all content outside markers. Does not change
 * line count significantly (CLAUDE.md must stay ~120 lines).
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
exports.generateAntiPatternsTable = generateAntiPatternsTable;
exports.updateClaudeMd = updateClaudeMd;
exports.main = main;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const read_jsonl_1 = require("./read-jsonl");
const review_1 = require("./schemas/review");
const promote_patterns_1 = require("./promote-patterns");
// Walk up from __dirname until we find package.json
function findProjectRoot(startDir) {
    let dir = startDir;
    for (;;) {
        try {
            if (fs.existsSync(path.join(dir, "package.json")))
                return dir;
        }
        catch {
            // existsSync race condition
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            throw new Error("Could not find project root");
        dir = parent;
    }
}
const START_MARKER = "<!-- AUTO-ANTIPATTERNS-START -->";
const END_MARKER = "<!-- AUTO-ANTIPATTERNS-END -->";
/**
 * Generate a markdown table of top anti-patterns matching CLAUDE.md Section 4 format.
 *
 * @param patterns - RecurrenceResult array sorted by count descending
 * @param maxPatterns - Maximum patterns to include (default 6)
 * @returns Markdown table string
 */
function generateAntiPatternsTable(patterns, maxPatterns = 6) {
    const top = patterns.slice(0, maxPatterns);
    if (top.length === 0) {
        return "| Pattern | Rule |\n| --- | --- |\n| (none detected) | No recurring patterns found above threshold |";
    }
    const rows = top.map((p) => {
        // Create a concise rule description from the pattern
        const name = p.pattern.replaceAll("-", " ").replaceAll(/\b\w/g, (ch) => ch.toUpperCase());
        const rule = `Recurring (${p.count}x, ${p.distinctPRs.size} PRs) -- review and add enforcement`;
        return `| ${name} | ${rule} |`;
    });
    return [
        "| Pattern            | Rule                                                                         |",
        "| ------------------ | ---------------------------------------------------------------------------- |",
        ...rows,
    ].join("\n");
}
/**
 * Update CLAUDE.md with the auto-generated anti-patterns table.
 *
 * On first run: wraps the existing table in Section 4 with markers.
 * On subsequent runs: replaces content between markers.
 *
 * @param projectRoot - Project root directory
 * @param patterns - RecurrenceResult array sorted by count descending
 * @param dryRun - If true, returns the new content without writing
 * @returns The updated content string
 */
function updateClaudeMd(projectRoot, patterns, dryRun = false) {
    const claudePath = path.join(projectRoot, "CLAUDE.md");
    let content;
    try {
        content = fs.readFileSync(claudePath, "utf8");
    }
    catch {
        throw new Error("CLAUDE.md not found at " + claudePath);
    }
    const newTable = generateAntiPatternsTable(patterns);
    // Ensure markers exist (wrap on first run), then always replace between them.
    if (!content.includes(START_MARKER) && !content.includes(END_MARKER)) {
        content = wrapExistingTableWithMarkers(content);
    }
    const startIdx = content.indexOf(START_MARKER);
    const endIdx = content.indexOf(END_MARKER);
    if (startIdx === -1 || endIdx === -1) {
        throw new Error("Unmatched AUTO-ANTIPATTERNS markers in CLAUDE.md");
    }
    if (endIdx < startIdx)
        throw new Error("Invalid AUTO-ANTIPATTERNS marker order");
    const before = content.slice(0, startIdx + START_MARKER.length);
    const after = content.slice(endIdx);
    content = before + "\n" + newTable + "\n" + after;
    if (!dryRun) {
        writeClaudeMdSafe(claudePath, content);
    }
    return content;
}
/**
 * First-run helper: finds the existing "Top 5" table in Section 4 and wraps it with markers.
 */
function wrapExistingTableWithMarkers(content) {
    const tableHeaderPattern = "| Pattern            | Rule";
    const tableIdx = content.indexOf(tableHeaderPattern);
    if (tableIdx === -1) {
        throw new Error("Could not find the anti-patterns table in CLAUDE.md Section 4");
    }
    const tail = content.slice(tableIdx);
    const lines = tail.split("\n");
    let consumedLines = 0;
    let sawSeparator = false;
    for (const line of lines) {
        if (consumedLines === 0) {
            consumedLines++;
            continue;
        }
        if (line.startsWith("|")) {
            if (/^\|\s*-+/.test(line))
                sawSeparator = true;
            consumedLines++;
            continue;
        }
        if (sawSeparator)
            break;
        consumedLines++;
        break;
    }
    const existingTable = lines.slice(0, consumedLines).join("\n").trimEnd();
    const tableEnd = tableIdx + existingTable.length + (tail.startsWith(existingTable + "\n") ? 1 : 0);
    const before = content.slice(0, tableIdx).trimEnd();
    const after = content.slice(tableEnd);
    return (before +
        "\n" +
        START_MARKER +
        "\n" +
        existingTable +
        "\n" +
        END_MARKER +
        "\n" +
        after.trimStart());
}
/** Symlink guard: returns false if path is a symlink (blocks symlink-based write redirection). */
function isSafeToWrite(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return true;
        return !fs.lstatSync(filePath).isSymbolicLink();
    }
    catch {
        // If we can't stat an existing file, fail closed
        return false;
    }
}
/** Write CLAUDE.md with a warning on failure instead of throwing. */
function writeClaudeMdSafe(claudePath, content) {
    if (!isSafeToWrite(claudePath)) {
        console.warn("[generate-claude-antipatterns] Warning: CLAUDE.md is a symlink, skipping write");
        return;
    }
    const tmpPath = `${claudePath}.tmp-${process.pid}-${Date.now()}`;
    try {
        fs.writeFileSync(tmpPath, content, "utf8");
        try {
            fs.renameSync(tmpPath, claudePath);
        }
        catch {
            // Cross-device / platform fallback: re-check safety before writing target
            if (!isSafeToWrite(claudePath)) {
                console.warn("[generate-claude-antipatterns] Warning: CLAUDE.md became unsafe (symlink), skipping write");
                return;
            }
            fs.copyFileSync(tmpPath, claudePath);
        }
    }
    catch (err) {
        console.warn(`[generate-claude-antipatterns] Warning: Could not write CLAUDE.md: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally {
        try {
            if (fs.existsSync(tmpPath))
                fs.unlinkSync(tmpPath);
        }
        catch {
            /* best-effort cleanup */
        }
    }
}
/**
 * CLI entry point.
 */
function main(args) {
    const dryRun = args.includes("--dry-run");
    const projectRoot = findProjectRoot(__dirname);
    console.log("=== Generate CLAUDE.md Anti-Patterns ===");
    console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);
    console.log("");
    // Load reviews and detect recurrence
    const reviewsPath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
    const { valid: reviews } = (0, read_jsonl_1.readValidatedJsonl)(reviewsPath, review_1.ReviewRecord, {
        quiet: true,
    });
    // Use lower thresholds for anti-pattern detection (top patterns by recurrence)
    const recurring = (0, promote_patterns_1.detectRecurrence)(reviews, 1, 1);
    console.log(`Total recurring patterns: ${recurring.length}`);
    // Generate table
    const table = generateAntiPatternsTable(recurring);
    console.log("\n--- Generated Table ---");
    console.log(table);
    if (dryRun) {
        console.log("\n[DRY RUN] CLAUDE.md not modified.");
    }
    else {
        updateClaudeMd(projectRoot, recurring);
        console.log("\nCLAUDE.md Section 4 updated.");
    }
}
