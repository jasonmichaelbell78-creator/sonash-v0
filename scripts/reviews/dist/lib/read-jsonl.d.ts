import { z } from "zod";
/**
 * Result of reading and validating a JSONL file.
 */
export interface ReadResult<T> {
    valid: T[];
    warnings: string[];
}
/**
 * Read a JSONL file and validate each record against a Zod schema.
 *
 * Returns all valid records and warning messages for invalid ones.
 * Never throws -- always returns results even if all records are malformed
 * or the file is missing.
 *
 * @param filePath - Path to the JSONL file
 * @param schema - Zod schema to validate each record against
 * @param options - Optional configuration
 * @param options.quiet - If true, suppress console.warn output
 * @returns Object with valid records and warning messages
 */
export declare function readValidatedJsonl<T>(filePath: string, schema: z.ZodType<T>, options?: {
    quiet?: boolean;
}): ReadResult<T>;
