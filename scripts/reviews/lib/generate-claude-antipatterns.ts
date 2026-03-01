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

import * as fs from "node:fs";
import * as path from "node:path";
import { readValidatedJsonl } from "./read-jsonl";
import { ReviewRecord } from "./schemas/review";
import { detectRecurrence, type RecurrenceResult } from "./promote-patterns";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
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
export function generateAntiPatternsTable(patterns: RecurrenceResult[], maxPatterns = 6): string {
  const top = patterns.slice(0, maxPatterns);

  if (top.length === 0) {
    return "| Pattern | Rule |\n| --- | --- |\n| (none detected) | No recurring patterns found above threshold |";
  }

  const rows = top.map((p) => {
    // Create a concise rule description from the pattern
    const name = p.pattern.replaceAll("-", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
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
export function updateClaudeMd(
  projectRoot: string,
  patterns: RecurrenceResult[],
  dryRun = false
): string {
  const claudePath = path.join(projectRoot, "CLAUDE.md");
  let content: string;
  try {
    content = fs.readFileSync(claudePath, "utf8");
  } catch {
    throw new Error("CLAUDE.md not found at " + claudePath);
  }

  const newTable = generateAntiPatternsTable(patterns);

  const startIdx = content.indexOf(START_MARKER);
  const endIdx = content.indexOf(END_MARKER);

  if (startIdx === -1 && endIdx === -1) {
    // First run: wrap the existing table with markers
    content = wrapExistingTableWithMarkers(content);
  } else if (startIdx !== -1 && endIdx !== -1) {
    if (endIdx < startIdx) throw new Error("Invalid AUTO-ANTIPATTERNS marker order");
    // Markers exist -- replace content between them
    const before = content.slice(0, startIdx + START_MARKER.length);
    const after = content.slice(endIdx);
    content = before + "\n" + newTable + "\n" + after;
  } else {
    throw new Error("Unmatched AUTO-ANTIPATTERNS markers in CLAUDE.md");
  }

  if (!dryRun) {
    writeClaudeMdSafe(claudePath, content);
  }

  return content;
}

/**
 * First-run helper: finds the existing "Top 5" table in Section 4 and wraps it with markers.
 */
function wrapExistingTableWithMarkers(content: string): string {
  const tableHeaderPattern = "| Pattern            | Rule";
  const tableIdx = content.indexOf(tableHeaderPattern);
  if (tableIdx === -1) {
    throw new Error("Could not find the anti-patterns table in CLAUDE.md Section 4");
  }

  // Find the end of the table (next blank line or section)
  let tableEnd = tableIdx;
  const lines = content.slice(tableIdx).split("\n");
  let lineOffset = 0;
  for (const line of lines) {
    lineOffset += line.length + 1;
    // Table rows start with |, so stop at first non-table line after header
    if (lineOffset > 10 && !line.startsWith("|")) {
      tableEnd = tableIdx + lineOffset - line.length - 1;
      break;
    }
  }

  const before = content.slice(0, tableIdx);
  const existingTable = content.slice(tableIdx, tableEnd).trimEnd();
  const after = content.slice(tableEnd);

  return before + START_MARKER + "\n" + existingTable + "\n" + END_MARKER + after;
}

/** Write CLAUDE.md with a warning on failure instead of throwing. */
function writeClaudeMdSafe(claudePath: string, content: string): void {
  try {
    fs.writeFileSync(claudePath, content, "utf8");
  } catch (err) {
    console.warn(
      `[generate-claude-antipatterns] Warning: Could not write CLAUDE.md: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * CLI entry point.
 */
export function main(args: string[]): void {
  const dryRun = args.includes("--dry-run");
  const projectRoot = findProjectRoot(__dirname);

  console.log("=== Generate CLAUDE.md Anti-Patterns ===");
  console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);
  console.log("");

  // Load reviews and detect recurrence
  const reviewsPath = path.join(projectRoot, "data", "ecosystem-v2", "reviews.jsonl");
  const { valid: reviews } = readValidatedJsonl(reviewsPath, ReviewRecord, {
    quiet: true,
  });

  // Use lower thresholds for anti-pattern detection (top patterns by recurrence)
  const recurring = detectRecurrence(reviews, 1, 1);
  console.log(`Total recurring patterns: ${recurring.length}`);

  // Generate table
  const table = generateAntiPatternsTable(recurring);
  console.log("\n--- Generated Table ---");
  console.log(table);

  if (dryRun) {
    console.log("\n[DRY RUN] CLAUDE.md not modified.");
  } else {
    updateClaudeMd(projectRoot, recurring);
    console.log("\nCLAUDE.md Section 4 updated.");
  }
}
