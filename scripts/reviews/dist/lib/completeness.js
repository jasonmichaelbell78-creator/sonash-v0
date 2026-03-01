"use strict";
/**
 * Completeness helpers for JSONL records.
 *
 * hasField() distinguishes between "field is null" (valid data) and
 * "field is in completeness_missing" (data was never captured).
 *
 * validateCompleteness() checks that a record's tier requirements are met.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasField = hasField;
exports.validateCompleteness = validateCompleteness;
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
function hasField(record, field) {
    if (!record.completeness_missing) {
        return true;
    }
    return !record.completeness_missing.includes(field);
}
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
function validateCompleteness(record, requiredForTier) {
    const violations = [];
    const requiredFields = requiredForTier[record.completeness];
    if (!requiredFields) {
        return violations;
    }
    for (const field of requiredFields) {
        if (!hasField(record, field)) {
            violations.push(`Field "${field}" is required for tier "${record.completeness}" but is in completeness_missing`);
        }
    }
    return violations;
}
