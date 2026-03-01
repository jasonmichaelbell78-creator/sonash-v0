/**
 * JSONL-to-markdown renderer for review records.
 *
 * Reads data/ecosystem-v2/reviews.jsonl and produces human-readable markdown.
 *
 * Usage:
 *   node dist/render-reviews-to-md.js              # stdout
 *   node dist/render-reviews-to-md.js --output f   # write to file
 *   node dist/render-reviews-to-md.js --filter-pr 399
 *   node dist/render-reviews-to-md.js --last 5
 */
import { type ReviewRecordType } from "./lib/schemas/review";
/**
 * Render a single ReviewRecord as a markdown section.
 *
 * Handles partial/stub records gracefully: renders available fields,
 * skips null fields, notes completeness tier if not "full".
 */
export declare function renderReviewRecord(record: ReviewRecordType): string;
/**
 * Render multiple ReviewRecords as a single markdown document.
 */
export declare function renderReviewsToMarkdown(records: ReviewRecordType[]): string;
