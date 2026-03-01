/**
 * Deduplicate review-sourced entries in MASTER_DEBT.jsonl by content_hash.
 *
 * - Entries with identical content_hash are collapsed to the one with the lowest DEBT-NNNN ID.
 * - Non-review-sourced entries pass through untouched.
 * - Entries without content_hash are always kept.
 * - After writing MASTER_DEBT.jsonl, copies to raw/deduped.jsonl (MEMORY.md sync rule).
 * - Idempotent: running on already-deduped data produces identical output.
 */
export interface DebtItem {
    id: string;
    content_hash?: string;
    source?: string;
    title?: string;
    [key: string]: unknown;
}
export interface DedupResult {
    kept: DebtItem[];
    removed: DebtItem[];
    flagged: DebtItem[];
}
export declare function dedupReviewSourced(items: DebtItem[], logger?: (msg: string) => void): DedupResult;
