/**
 * Type guards and helpers for Firebase types
 */

import { Timestamp } from "firebase/firestore";

/**
 * Type guard to check if a value is a Firestore Timestamp
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is a Firestore Timestamp
 *
 * @example
 * if (isFirestoreTimestamp(profile.cleanStart)) {
 *   const date = profile.cleanStart.toDate()
 * }
 */
export function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return (
    value !== null &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function" &&
    "seconds" in value &&
    "nanoseconds" in value
  );
}

/**
 * Safely converts a Timestamp-like value to a Date object
 *
 * Handles Firestore Timestamps, Date objects, and date strings
 *
 * @param {unknown} value - Value to convert
 * @returns {Date | null} Date object or null if conversion fails
 *
 * @example
 * const date = toDate(profile.cleanStart)
 * if (date) {
 *   console.log(date.toISOString())
 * }
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (isFirestoreTimestamp(value)) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}
