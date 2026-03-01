import { z } from "zod";
/**
 * Append a validated record to a JSONL file.
 *
 * Validates the record against the provided Zod schema before writing.
 * Uses safe-fs.js withLock for advisory locking and isSafeToWrite for
 * symlink guards. Lets ZodError propagate to caller on validation failure.
 *
 * @param filePath - Absolute path to the JSONL file
 * @param record - The record to append
 * @param schema - Zod schema to validate the record against
 */
export declare function appendRecord<T>(filePath: string, record: T, schema: z.ZodType<T>): void;
