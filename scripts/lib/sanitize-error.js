/**
 * Error Sanitization Utility
 *
 * Addresses recurring Qodo compliance findings:
 * - Generic: Secure Error Handling
 * - Generic: Secure Logging Practices
 *
 * Purpose: Prevent leakage of sensitive system information through error messages
 * while providing sufficient detail for internal debugging.
 *
 * @module lib/sanitize-error
 */

/**
 * Patterns that may indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
  // File paths that might expose system structure
  /\/home\/[^/\s]+/gi, // Linux home directories
  /\/Users\/[^/\s]+/gi, // macOS home directories
  /C:\\Users\\[^\\]+/gi, // Windows user directories
  /\/etc\/[^\s]+/gi, // System config paths
  /\/var\/[^\s]+/gi, // Variable data paths

  // Credentials and secrets
  /password[=:]\s*\S+/gi, // Password assignments
  /api[_-]?key[=:]\s*\S+/gi, // API keys
  /token[=:]\s*\S+/gi, // Tokens
  /secret[=:]\s*\S+/gi, // Secrets
  /Bearer\s+[A-Za-z0-9._-]+/gi, // Bearer tokens

  // Connection strings
  /mongodb(\+srv)?:\/\/[^\s]+/gi, // MongoDB
  /postgres(ql)?:\/\/[^\s]+/gi, // PostgreSQL
  /mysql:\/\/[^\s]+/gi, // MySQL
  /redis:\/\/[^\s]+/gi, // Redis

  // Environment variables with sensitive data
  /process\.env\.[A-Z_]+/gi,

  // IP addresses (internal - RFC 1918 private ranges)
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  /\b(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g,

  // URLs that might contain sensitive endpoints
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[^\s]*/gi,
];

/**
 * Replacement text for sanitized content
 */
const REDACTED = "[REDACTED]";

/**
 * Sanitize an error message to remove potentially sensitive information.
 *
 * @param {unknown} error - The error to sanitize (Error object or any value)
 * @param {object} options - Configuration options
 * @param {boolean} [options.preserveStackInDev=true] - Keep stack traces in development
 * @param {boolean} [options.verbose=false] - Return full message in trusted contexts
 * @returns {string} - Sanitized error message safe for logging
 */
export function sanitizeError(error, options = {}) {
  const {
    preserveStackInDev = true, // Reserved for future: preserve stack in dev mode
    verbose = false,
  } = options;

  // Extract message from various error types
  let message;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else {
    message = String(error);
  }

  // In verbose/dev mode with explicit opt-in, return original
  if (verbose && process.env.NODE_ENV === "development") {
    return message;
  }

  // Sanitize sensitive patterns
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, REDACTED);
  }

  return sanitized;
}

/**
 * Sanitize error for JSON output (e.g., API responses, structured logs).
 *
 * @param {unknown} error - The error to sanitize
 * @param {object} options - Configuration options
 * @returns {object} - Sanitized error object
 */
export function sanitizeErrorForJson(error, options = {}) {
  const message = sanitizeError(error, options);

  return {
    error: true,
    message,
    // Include error name/type if available, but not stack
    type: error instanceof Error ? error.name : "Error",
  };
}

/**
 * Create a safe error logger that automatically sanitizes messages.
 *
 * @param {string} prefix - Prefix for log messages (e.g., script name)
 * @returns {object} - Logger object with error, warn methods
 */
export function createSafeLogger(prefix = "") {
  const formatPrefix = prefix ? `[${prefix}] ` : "";

  return {
    error: (msg, error) => {
      const errorMsg = error ? `: ${sanitizeError(error)}` : "";
      console.error(`${formatPrefix}${msg}${errorMsg}`);
    },
    warn: (msg, error) => {
      const errorMsg = error ? `: ${sanitizeError(error)}` : "";
      console.warn(`${formatPrefix}${msg}${errorMsg}`);
    },
    info: (msg) => {
      console.log(`${formatPrefix}${msg}`);
    },
  };
}

/**
 * Safe error handler for try-catch blocks.
 * Returns a sanitized message and handles non-Error throws.
 *
 * @param {unknown} error - The caught error
 * @returns {string} - Sanitized error message
 */
export function safeErrorMessage(error) {
  return sanitizeError(error);
}

// CommonJS compatibility for scripts that don't use ES modules
export default {
  sanitizeError,
  sanitizeErrorForJson,
  createSafeLogger,
  safeErrorMessage,
};
