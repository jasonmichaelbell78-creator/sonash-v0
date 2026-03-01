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
export declare function createDeferredItems(projectRoot: string, reviewId: string, items: DeferredItemInput[], date: string): DeferredItemRecordType[];
