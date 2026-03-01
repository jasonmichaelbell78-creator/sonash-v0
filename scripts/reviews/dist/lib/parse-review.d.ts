/**
 * Markdown-to-v2-record parser for review archives.
 *
 * Handles all observed archive formats:
 * - Heading-based: #### Review #N: Title (YYYY-MM-DD)
 * - Em-dash variant: #### Review #N -- Title (YYYY-MM-DD)
 * - Table-only: | #N | date | title | (REVIEWS_101-136.md)
 *
 * Exports: parseArchiveFile, parseTableArchive, toV2ReviewRecord,
 *          KNOWN_SKIPPED_IDS, KNOWN_DUPLICATE_IDS
 */
import { type ReviewRecordType } from "./schemas/review";
export interface ParsedEntry {
    reviewNumber: number;
    date: string | null;
    title: string;
    rawLines: string[];
    sourceFile: string;
}
/**
 * Review IDs that were never assigned (numbering skips, batch consolidations).
 * 64 total. Verified via git log -S "#### Review #N".
 * Source: scripts/check-review-archive.js
 */
export declare const KNOWN_SKIPPED_IDS: Set<number>;
/**
 * Review IDs that legitimately appear in two archive files with different content.
 * PR #383 R5-R8 originally assigned these IDs, then different reviews for
 * PRs #384/#389/#394 were also assigned the same numbers.
 */
export declare const KNOWN_DUPLICATE_IDS: Set<number>;
/**
 * Parse heading-based review entries from a markdown archive file.
 *
 * Matches headers like:
 *   #### Review #42: Title (2026-01-15)
 *   ### Review #42 -- Title (2026-01-15)
 *   ## Review #42: Title
 *
 * Tracks code fences to avoid matching inside code blocks.
 * Deduplicates within-file by reviewNumber, keeping the entry with the most rawLines.
 */
export declare function parseArchiveFile(filePath: string, content: string): ParsedEntry[];
/**
 * Parse table-format review entries (e.g., REVIEWS_101-136.md).
 *
 * Matches rows like: | #105 | 2026-01-20 | Security review |
 * Produces minimal ParsedEntry objects (stub-tier candidates).
 */
export declare function parseTableArchive(filePath: string, content: string): ParsedEntry[];
/**
 * Extract PR number from raw markdown content.
 * Looks for: **PR:** #N, PR #N, pr/N
 * Returns null for branch names (non-numeric).
 */
export declare function extractPR(raw: string): number | null;
/**
 * Extract total item count from raw markdown content.
 * Looks for: **Total:** N, **Items:** N, N total, N items
 */
export declare function extractTotal(raw: string): number | null;
/**
 * Extract a labeled count (fixed, deferred, rejected) from raw markdown.
 * Looks for: **Label:** N, Label: N, Label N
 */
export declare function extractCount(raw: string, label: string): number | null;
/**
 * Extract pattern names from bullet lists under **Patterns** or **Key Patterns** sections.
 */
export declare function extractPatterns(raw: string): string[];
/**
 * Extract learnings from bullet lists under **Learnings** or **Key Learnings** sections.
 */
export declare function extractLearnings(raw: string): string[];
/**
 * Extract severity breakdown from raw markdown content.
 * Handles both "N LABEL" format (e.g., "2 Critical") and "Label: N" format.
 * Uses string-based parsing to avoid regex backtracking issues.
 */
export declare function extractSeverity(raw: string): {
    critical: number;
    major: number;
    minor: number;
    trivial: number;
} | null;
/**
 * Convert a ParsedEntry to a validated v2 ReviewRecord.
 *
 * - ID format: rev-{reviewNumber} (stable, idempotent)
 * - Completeness: full/partial/stub based on extracted fields
 * - Validates output against ReviewRecord Zod schema
 */
export declare function toV2ReviewRecord(entry: ParsedEntry): ReviewRecordType;
