/**
 * promote-patterns.ts — Merged promotion pipeline
 *
 * Detects patterns recurring N>=3 times across M>=2 distinct PRs from reviews.jsonl,
 * promotes them to CODE_PATTERNS.md with dedup, and generates enforcement rule skeletons.
 *
 * PIPE-05 (merged promotion), PIPE-06 (auto rule generation)
 *
 * Does NOT modify run-consolidation.js — both coexist during transition.
 */
import { type ReviewRecordType } from "./schemas/review";
/** Result of recurrence detection for a single pattern. */
export interface RecurrenceResult {
    pattern: string;
    count: number;
    distinctPRs: Set<number>;
    reviewIds: string[];
}
/** Enforcement rule skeleton matching check-pattern-compliance.js format. */
export interface RuleSkeleton {
    id: string;
    pattern: string;
    message: string;
    fix: string;
    fileTypes: string[];
    severity: string;
}
/** Result of the full promotion pipeline. */
export interface PromotionResult {
    promoted: RecurrenceResult[];
    skipped: RecurrenceResult[];
    ruleSkeletons: RuleSkeleton[];
    alreadyPromoted: string[];
}
/**
 * Detect patterns recurring N>=minOccurrences times across M>=minDistinctPRs distinct PRs.
 *
 * Normalizes pattern strings to lowercase for comparison.
 * Returns results sorted by count descending.
 */
export declare function detectRecurrence(reviews: ReviewRecordType[], minOccurrences?: number, minDistinctPRs?: number): RecurrenceResult[];
/**
 * Filter out patterns already present in CODE_PATTERNS.md.
 * Checks against existing headings and table rows using fuzzy matching.
 */
export declare function filterAlreadyPromoted(patterns: RecurrenceResult[], codePatternsContent: string): {
    newPatterns: RecurrenceResult[];
    alreadyPromoted: string[];
};
/**
 * Categorize a pattern into one of: Security, JavaScript/TypeScript, Bash/Shell,
 * CI/Automation, Documentation, General.
 *
 * Uses keyword-based matching similar to run-consolidation.js categorizePatterns.
 */
export declare function categorizePattern(pattern: string): string;
/**
 * Generate an enforcement rule skeleton for check-pattern-compliance.js.
 */
export declare function generateRuleSkeleton(result: RecurrenceResult, usedIds?: Set<string>): RuleSkeleton;
/**
 * Full promotion pipeline orchestrator.
 *
 * 1. Reads reviews.jsonl
 * 2. Detects recurrence
 * 3. Filters already-promoted
 * 4. Promotes to CODE_PATTERNS.md
 * 5. Generates rule skeletons
 * 6. Updates consolidation state
 */
export declare function promotePatterns(options: {
    projectRoot?: string;
    dryRun?: boolean;
    minOccurrences?: number;
    minPRs?: number;
}): PromotionResult;
/**
 * CLI entry point -- called when script is run directly.
 */
export declare function main(args: string[]): void;
