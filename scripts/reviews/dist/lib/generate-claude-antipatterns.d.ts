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
import { type RecurrenceResult } from "./promote-patterns";
/**
 * Generate a markdown table of top anti-patterns matching CLAUDE.md Section 4 format.
 *
 * @param patterns - RecurrenceResult array sorted by count descending
 * @param maxPatterns - Maximum patterns to include (default 6)
 * @returns Markdown table string
 */
export declare function generateAntiPatternsTable(patterns: RecurrenceResult[], maxPatterns?: number): string;
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
export declare function updateClaudeMd(projectRoot: string, patterns: RecurrenceResult[], dryRun?: boolean): string;
/**
 * CLI entry point.
 */
export declare function main(args: string[]): void;
