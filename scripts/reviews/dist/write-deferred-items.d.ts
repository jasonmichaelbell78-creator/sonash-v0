/**
 * CLI and library for auto-creating DeferredItemRecords from review findings.
 *
 * Library: createDeferredItems(projectRoot, reviewId, items, date)
 * CLI: node dist/write-deferred-items.js --review-id rev-N --date YYYY-MM-DD --items '[...]'
 */
import { type DeferredItemRecordType } from "./lib/schemas/deferred-item";
/** Input shape for each deferred item */
export interface DeferredItemInput {
    finding: string;
    reason?: string;
    severity?: string;
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
export declare function createDeferredItems(projectRoot: string, reviewId: string, items: DeferredItemInput[], date: string): DeferredItemRecordType[];
