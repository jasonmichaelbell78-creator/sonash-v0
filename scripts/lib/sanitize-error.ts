/**
 * TypeScript re-export of sanitize-error.js
 * Provides type-safe access to error sanitization utilities
 */

// Import from the JS module
import sanitizeErrorModule from "./sanitize-error.js";

/**
 * Sanitize an error message to remove potentially sensitive information.
 * Strips home directories, credentials, connection strings, and internal IPs.
 */
export function sanitizeError(error: unknown): string {
  return sanitizeErrorModule.sanitizeError(error);
}

/**
 * Sanitize error for JSON output (e.g., API responses, structured logs).
 */
export function sanitizeErrorForJson(error: unknown): {
  error: boolean;
  message: string;
  type: string;
} {
  return sanitizeErrorModule.sanitizeErrorForJson(error);
}

/**
 * Create a safe error logger that automatically sanitizes messages.
 */
export function createSafeLogger(prefix?: string): {
  error: (msg: string, error?: unknown) => void;
  warn: (msg: string, error?: unknown) => void;
  info: (msg: string) => void;
} {
  return sanitizeErrorModule.createSafeLogger(prefix);
}

/**
 * Safe error handler for try-catch blocks.
 * Returns a sanitized message and handles non-Error throws.
 */
export function safeErrorMessage(error: unknown): string {
  return sanitizeErrorModule.safeErrorMessage(error);
}

export default {
  sanitizeError,
  sanitizeErrorForJson,
  createSafeLogger,
  safeErrorMessage,
};
