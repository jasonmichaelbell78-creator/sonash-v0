/**
 * Error handling utilities for consistent error processing across the app
 * CANON-0010: Error type guards
 */

import { FirebaseError } from "firebase/app";

/**
 * Type guard to check if an error is a Firebase error
 * @param error - The error to check
 * @returns True if the error is a FirebaseError
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as FirebaseError).code === "string" &&
    typeof (error as FirebaseError).message === "string"
  );
}

/**
 * Extract a user-friendly error message from any error type
 * @param error - The error to extract message from
 * @param fallback - Fallback message if extraction fails
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  // Firebase errors
  if (isFirebaseError(error)) {
    return getFirebaseErrorMessage(error);
  }

  // Standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // String errors
  if (typeof error === "string") {
    return error;
  }

  // Object with message property
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  // Fallback
  return fallback;
}

/**
 * Convert Firebase error codes to user-friendly messages
 * @param error - The Firebase error
 * @returns User-friendly error message
 */
function getFirebaseErrorMessage(error: FirebaseError): string {
  const errorMessages: Record<string, string> = {
    // Auth errors
    "auth/user-not-found": "No account found with this email address",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/weak-password": "Password should be at least 6 characters",
    "auth/invalid-email": "Invalid email address",
    "auth/user-disabled": "This account has been disabled",
    "auth/too-many-requests": "Too many failed attempts. Please try again later",
    "auth/network-request-failed": "Network error. Please check your connection",
    "auth/popup-closed-by-user": "Sign-in popup was closed",
    "auth/cancelled-popup-request": "Sign-in cancelled",
    "auth/requires-recent-login": "Please sign in again to complete this action",

    // Firestore errors
    "firestore/permission-denied": "You do not have permission to perform this action",
    "firestore/unavailable": "Service temporarily unavailable. Please try again",
    "firestore/not-found": "Document not found",
    "firestore/already-exists": "Document already exists",
    "firestore/resource-exhausted": "Quota exceeded. Please try again later",
    "firestore/cancelled": "Operation was cancelled",
    "firestore/data-loss": "Unrecoverable data loss or corruption",
    "firestore/deadline-exceeded": "Operation timed out",
    "firestore/failed-precondition": "Operation rejected due to invalid state",
    "firestore/internal": "Internal server error",
    "firestore/invalid-argument": "Invalid data provided",
    "firestore/unauthenticated": "Please sign in to continue",

    // Storage errors
    "storage/unauthorized": "You do not have permission to access this file",
    "storage/canceled": "Upload was cancelled",
    "storage/unknown": "An unknown storage error occurred",
    "storage/object-not-found": "File not found",
    "storage/bucket-not-found": "Storage bucket not found",
    "storage/project-not-found": "Project not found",
    "storage/quota-exceeded": "Storage quota exceeded",
    "storage/unauthenticated": "Please sign in to upload files",
    "storage/invalid-checksum": "File upload failed. Please try again",
    "storage/retry-limit-exceeded": "Maximum retry time exceeded. Please try again",

    // Functions errors
    "functions/cancelled": "Operation was cancelled",
    "functions/unknown": "An unknown error occurred",
    "functions/invalid-argument": "Invalid request data",
    "functions/deadline-exceeded": "Request timed out",
    "functions/not-found": "Function not found",
    "functions/already-exists": "Resource already exists",
    "functions/permission-denied": "Permission denied",
    "functions/resource-exhausted": "Resource quota exceeded",
    "functions/failed-precondition": "Operation rejected",
    "functions/aborted": "Operation aborted",
    "functions/out-of-range": "Operation out of valid range",
    "functions/unimplemented": "Operation not implemented",
    "functions/internal": "Internal server error",
    "functions/unavailable": "Service temporarily unavailable",
    "functions/data-loss": "Data loss or corruption",
    "functions/unauthenticated": "Please sign in to continue",
  };

  return errorMessages[error.code] || error.message || "An unexpected error occurred";
}

/**
 * Check if an error indicates a permission/authentication issue
 * @param error - The error to check
 * @returns True if the error is auth-related
 */
export function isAuthError(error: unknown): boolean {
  if (!isFirebaseError(error)) return false;

  const authCodes = [
    "auth/unauthenticated",
    "firestore/unauthenticated",
    "firestore/permission-denied",
    "functions/unauthenticated",
    "functions/permission-denied",
    "storage/unauthenticated",
    "storage/unauthorized",
  ];

  return authCodes.includes(error.code);
}

/**
 * Check if an error indicates a network issue
 * @param error - The error to check
 * @returns True if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!isFirebaseError(error)) {
    // Check for standard network errors
    if (error instanceof Error) {
      return (
        error.message.includes("network") ||
        error.message.includes("offline") ||
        error.message.includes("timeout")
      );
    }
    return false;
  }

  const networkCodes = [
    "auth/network-request-failed",
    "firestore/unavailable",
    "functions/unavailable",
    "functions/deadline-exceeded",
  ];

  return networkCodes.includes(error.code);
}
