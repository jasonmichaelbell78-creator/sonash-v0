/**
 * CJS wrapper for sanitize-error.js (ESM)
 *
 * Allows CommonJS scripts to use the canonical sanitizeError implementation
 * instead of maintaining inline copies.
 *
 * Usage: const { sanitizeError } = require("./sanitize-error.cjs");
 */

// Re-implement the canonical logic for CJS consumers.
// This must stay in sync with sanitize-error.js — any changes there
// should be reflected here.

const SENSITIVE_PATTERNS = [
  /\/home\/[^/\s]+/gi,
  /\/Users\/[^/\s]+/gi,
  /C:\\Users\\[^\\]+/gi,
  /\/etc\/[^\s]+/gi,
  /\/var\/[^\s]+/gi,
  /(?:"?(?:password|api[_-]?key|token|secret|credential|auth)"?\s*[=:]\s*)"([^"\\]|\\.)+"/gi,
  /(?:"?(?:password|api[_-]?key|token|secret|credential|auth)"?\s*[=:]\s*)'[^']+'/gi,
  /(?:"?(?:password|api[_-]?key|token|secret|credential|auth)"?\s*[=:]\s*)[^\s"',;)\]}]{2,}/gi,
  /Bearer\s+[A-Z0-9._-]+/gi,
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /postgres(ql)?:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,
  /process\.env\.[A-Z_]+/gi,
  /\b(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g,
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[^\s]*/gi,
];

const REDACTED = "[REDACTED]";

function sanitizeError(error, options = {}) {
  const { verbose = false } = options;

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

  if (verbose && process.env.NODE_ENV === "development") {
    return message;
  }

  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, REDACTED);
  }

  return sanitized;
}

function sanitizeErrorForJson(error, options = {}) {
  const message = sanitizeError(error, options);
  return {
    error: true,
    message,
    type: error instanceof Error ? error.name : "Error",
  };
}

function createSafeLogger(prefix = "") {
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

function safeErrorMessage(error) {
  return sanitizeError(error);
}

module.exports = {
  sanitizeError,
  sanitizeErrorForJson,
  createSafeLogger,
  safeErrorMessage,
};
