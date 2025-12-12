/**
 * Type guards and utilities for Firebase types
 *
 * This module provides runtime type checking for Firebase-specific types,
 * eliminating the need for type gymnastics with 'as unknown' and multiple casts.
 */

import { Timestamp } from "firebase/firestore"

/**
 * Type guard to check if a value is a Firebase Timestamp
 *
 * @param value - The value to check
 * @returns true if value is a Firebase Timestamp
 *
 * @example
 * if (isFirebaseTimestamp(profile.cleanStart)) {
 *   const date = profile.cleanStart.toDate()
 * }
 */
export function isFirebaseTimestamp(value: unknown): value is Timestamp {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  )
}

/**
 * Parse a Firebase Timestamp to a JavaScript Date
 *
 * Handles multiple input formats:
 * - Firebase Timestamp (has toDate() method)
 * - ISO string ("2024-01-15T10:30:00.000Z")
 * - JavaScript Date
 * - null/undefined (returns null)
 *
 * @param value - The value to parse
 * @returns JavaScript Date or null if parsing fails
 *
 * @example
 * const cleanStart = parseFirebaseTimestamp(profile.cleanStart)
 * if (cleanStart) {
 *   const days = differenceInDays(new Date(), cleanStart)
 * }
 */
export function parseFirebaseTimestamp(value: unknown): Date | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null
  }

  // Handle Firebase Timestamp
  if (isFirebaseTimestamp(value)) {
    try {
      return value.toDate()
    } catch {
      return null
    }
  }

  // Handle Date object
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  // Handle string (ISO date)
  if (typeof value === "string") {
    try {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }

  // Unknown format
  return null
}

/**
 * Type guard to check if a value is a Firestore error
 *
 * @param error - The error to check
 * @returns true if error is a FirestoreError
 *
 * @example
 * catch (error) {
 *   if (isFirestoreError(error)) {
 *     if (error.code === 'permission-denied') {
 *       // Handle permission error
 *     }
 *   }
 * }
 */
export function isFirestoreError(error: unknown): error is { code: string; message: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  )
}

/**
 * Type guard to check if an error is a permission denied error
 *
 * @param error - The error to check
 * @returns true if error is a permission-denied FirestoreError
 */
export function isPermissionDenied(error: unknown): boolean {
  return isFirestoreError(error) && error.code === "permission-denied"
}

/**
 * Type guard to check if an error is a not-found error
 *
 * @param error - The error to check
 * @returns true if error is a not-found FirestoreError
 */
export function isNotFound(error: unknown): boolean {
  return isFirestoreError(error) && error.code === "not-found"
}

/**
 * Safely extract error message from unknown error
 *
 * @param error - The error to extract message from
 * @param fallback - Fallback message if extraction fails
 * @returns Error message string
 *
 * @example
 * catch (error) {
 *   toast.error(getErrorMessage(error, "Failed to save data"))
 * }
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    return error.message
  }

  if (isFirestoreError(error)) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return fallback
}
