/**
 * Completeness helpers for JSONL records.
 *
 * hasField() distinguishes between "field is null" (valid data) and
 * "field is in completeness_missing" (data was never captured).
 *
 * validateCompleteness() checks that a record's tier requirements are met.
 */
/**
 * Check whether a field is considered "present" on a record.
 *
 * Returns false only when the field is listed in completeness_missing.
 * A field with a null value that is NOT in completeness_missing returns true,
 * because null is a valid captured value (e.g., "we checked and there was nothing").
 *
 * @param record - Record with optional completeness_missing array
 * @param field - Field name to check
 * @returns true if the field is not in completeness_missing
 */
export declare function hasField(record: {
    completeness_missing?: string[];
}, field: string): boolean;
/**
 * Validate that a record's completeness tier requirements are met.
 *
 * Given a mapping of tier -> required field names, checks that none of the
 * required fields for the record's tier (and all lower tiers) appear in
 * completeness_missing.
 *
 * @param record - Record with completeness tier and optional missing fields
 * @param requiredForTier - Mapping of tier name to required field names
 * @returns Array of violation messages (empty = valid)
 */
export declare function validateCompleteness(record: {
    completeness: string;
    completeness_missing?: string[];
}, requiredForTier: Record<string, string[]>): string[];
