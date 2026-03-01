/**
 * Idempotent backfill orchestrator for PR review archives.
 *
 * Reads all 13 archive files + active log + v1 state, resolves overlaps,
 * applies data corrections (BKFL-04/05/06), and writes validated v2 JSONL.
 *
 * Run: cd scripts/reviews && npx tsc && node dist/backfill-reviews.js
 */
import { type ParsedEntry } from "./lib/parse-review";
import { type ReviewRecordType } from "./lib/schemas/review";
import { type RetroRecordType } from "./lib/schemas/retro";
export declare function parseAllSources(projectRoot: string): Map<number, ParsedEntry[]>;
export interface ResolutionResult {
    records: ReviewRecordType[];
    overlapsResolved: number;
    duplicatesDisambiguated: number;
    skippedIds: number;
    missingIds: number[];
}
export declare function resolveOverlaps(byNumber: Map<number, ParsedEntry[]>): ResolutionResult;
export interface RetroExtraction {
    pr: number;
    date: string;
    sourceFile: string;
    rawContent: string;
}
export declare function extractRetros(projectRoot: string): RetroExtraction[];
export declare function buildRetroRecords(retros: RetroExtraction[], reviewsByPR: Map<number, ReviewRecordType>): {
    records: RetroRecordType[];
    missingReviewCount: number;
};
export declare function migrateV1Records(v1Path: string, existingIds: Set<number>): {
    records: ReviewRecordType[];
    migrated: number;
    skipped: number;
};
export declare function checkConsolidationCounter(consolidationPath: string, actualCount: number): {
    expected: number | null;
    actual: number;
    match: boolean;
};
export declare function applyPatternCorrections(records: ReviewRecordType[]): {
    applied: number;
    flagged: number;
};
export declare function runBackfill(): Promise<void>;
