/**
 * TypeScript re-export of sanitize-error.js
 * Provides type-safe access to error sanitization utilities
 */

// Re-export named exports from the JS module
export {
  sanitizeError,
  sanitizeErrorForJson,
  createSafeLogger,
  safeErrorMessage,
} from "./sanitize-error.js";
