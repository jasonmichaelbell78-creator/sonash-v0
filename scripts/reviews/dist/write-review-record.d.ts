/**
 * CLI and programmatic interface for writing validated ReviewRecords to reviews.jsonl.
 *
 * Usage:
 *   npx tsc && node dist/write-review-record.js --data '{"pr":399,...}'
 *
 * Validates input against ReviewRecord schema, auto-assigns ID if missing,
 * and appends to data/ecosystem-v2/reviews.jsonl.
 */
import { ReviewRecord } from "./lib/schemas/review";
/**
 * Read reviews.jsonl and determine the next auto-assigned review ID.
 * Returns "rev-1" if the file is empty or missing.
 */
export declare function getNextReviewId(projectRoot: string): string;
/**
 * Write a validated ReviewRecord to reviews.jsonl.
 *
 * If data has no `id` field, auto-assigns the next rev-N ID.
 * Validates against ReviewRecord schema before writing.
 * Throws ZodError on validation failure.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Record data (id optional -- will be auto-assigned)
 * @returns The validated record that was written
 */
export declare function writeReviewRecord(projectRoot: string, data: Record<string, unknown>): ReturnType<typeof ReviewRecord.parse>;
