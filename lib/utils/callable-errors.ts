/**
 * Cloud Function Error Handling Utilities
 *
 * Consolidates duplicated error handling for Firebase Cloud Functions.
 * CANON-0006, CANON-0066, CANON-0087: Extract error handling utility.
 *
 * @module lib/utils/callable-errors
 */

/**
 * Error structure returned by Firebase Cloud Functions (httpsCallable).
 * Firebase wraps errors with a `code` property for error classification.
 */
export interface CloudFunctionError {
  code?: string;
  message?: string;
  details?: unknown;
}

/**
 * Type guard to check if an error is a CloudFunctionError.
 * Validates that error has a string `code` property starting with 'functions/'.
 */
export function isCloudFunctionError(error: unknown): error is CloudFunctionError {
  if (error === null || typeof error !== 'object') {
    return false;
  }
  const obj = error as Record<string, unknown>;
  return (
    typeof obj.code === 'string' &&
    obj.code.startsWith('functions/')
  );
}

/**
 * User-friendly error messages for Cloud Function error codes.
 * Keeps technical details server-side while providing helpful guidance to users.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'functions/resource-exhausted':
    'Too many requests. Please wait a moment and try again.',
  'functions/unauthenticated':
    'Please sign in to continue.',
  'functions/permission-denied':
    'You do not have permission to perform this action.',
  'functions/invalid-argument':
    'Invalid data. Please check your input and try again.',
  'functions/not-found':
    'The requested item was not found.',
  'functions/failed-precondition':
    'Security verification failed. Please refresh the page.',
  'functions/unavailable':
    'Service temporarily unavailable. Please try again in a moment.',
  'functions/internal':
    'Something went wrong. Please try again.',
  'functions/cancelled':
    'The operation was cancelled. Please try again.',
  'functions/deadline-exceeded':
    'The operation took too long. Please try again.',
};

/**
 * Default error message when the error code is not recognized.
 */
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

/**
 * Options for error handling customization.
 */
export interface HandleErrorOptions {
  /**
   * Custom error messages keyed by Cloud Function error code.
   * Overrides the default messages.
   */
  customMessages?: Record<string, string>;

  /**
   * Default message to use when the error code is not recognized.
   * Overrides the default generic message.
   */
  defaultMessage?: string;

  /**
   * Operation context for logging (e.g., 'save journal', 'delete entry').
   */
  operation?: string;
}

/**
 * Extracts a user-friendly error message from a Cloud Function error.
 *
 * @param error - The error caught from httpsCallable
 * @param options - Optional customization for error messages
 * @returns A user-friendly error message string
 *
 * @example
 * ```ts
 * try {
 *   await saveJournalEntry(data);
 * } catch (error) {
 *   const message = getCloudFunctionErrorMessage(error, {
 *     customMessages: {
 *       'functions/resource-exhausted': 'You\'re saving too quickly. Wait 60 seconds.'
 *     },
 *     defaultMessage: 'Could not save your entry. Please try again.'
 *   });
 *   return { success: false, error: message };
 * }
 * ```
 */
export function getCloudFunctionErrorMessage(
  error: unknown,
  options: HandleErrorOptions = {}
): string {
  const { customMessages = {}, defaultMessage = DEFAULT_ERROR_MESSAGE } = options;

  if (isCloudFunctionError(error) && error.code) {
    // Check custom messages first
    const customMessage = customMessages[error.code];
    if (customMessage) {
      return customMessage;
    }

    // For validation errors (invalid-argument), only use server message if it
    // looks like a safe, user-friendly validation message (not stack trace or internal info)
    if (error.code === 'functions/invalid-argument' && error.message) {
      const msg = error.message;
      // Only allow messages that look like validation feedback:
      // - Short (<150 chars), no stack indicators, no internal paths
      const isSafeMessage = (
        msg.length < 150 &&
        !msg.includes('at ') &&
        !msg.includes('Error:') &&
        !msg.includes('/') &&
        !msg.includes('\\') &&
        !msg.includes('node_modules')
      );
      if (isSafeMessage) {
        return msg;
      }
      // Fall through to default message for unsafe messages
    }

    // Fall back to default messages for known error codes
    const defaultMsg = ERROR_MESSAGES[error.code];
    if (defaultMsg) {
      return defaultMsg;
    }
  }

  // Fall back to Error.message if available
  if (error instanceof Error && error.message) {
    // Don't expose internal error messages - use default
    // Unless it looks like a user-friendly message (no stack trace indicators)
    const msg = error.message;
    if (!msg.includes('at ') && !msg.includes('Error:') && msg.length < 200) {
      return msg;
    }
  }

  return defaultMessage;
}

/**
 * Handles Cloud Function errors with logging and message extraction.
 *
 * This is the primary error handler for Cloud Function calls.
 * It logs errors for debugging and returns user-friendly messages.
 *
 * @param error - The error caught from httpsCallable
 * @param options - Optional customization for error messages
 * @returns Object with success: false and error message
 *
 * @example
 * ```ts
 * try {
 *   await httpsCallable(functions, 'saveJournalEntry')(data);
 *   return { success: true };
 * } catch (error) {
 *   return handleCloudFunctionError(error, {
 *     operation: 'save journal entry',
 *     defaultMessage: 'Could not save your journal entry.'
 *   });
 * }
 * ```
 */
export function handleCloudFunctionError(
  error: unknown,
  options: HandleErrorOptions = {}
): { success: false; error: string } {
  const { operation = 'operation' } = options;
  const errorMessage = getCloudFunctionErrorMessage(error, options);

  // Log for debugging (development only - production logs go through logger)
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ Cloud Function error during ${operation}:`, error);
    if (isCloudFunctionError(error)) {
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }
  }

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Checks if the error is a rate limit error.
 *
 * @param error - The error to check
 * @returns true if the error indicates rate limiting
 */
export function isRateLimitError(error: unknown): boolean {
  return (
    isCloudFunctionError(error) &&
    error.code === 'functions/resource-exhausted'
  );
}

/**
 * Checks if the error is an authentication error.
 *
 * @param error - The error to check
 * @returns true if the error indicates authentication failure
 */
export function isAuthError(error: unknown): boolean {
  return (
    isCloudFunctionError(error) &&
    error.code === 'functions/unauthenticated'
  );
}

/**
 * Checks if the error is a security/App Check error.
 *
 * @param error - The error to check
 * @returns true if the error indicates a security check failure
 */
export function isSecurityError(error: unknown): boolean {
  return (
    isCloudFunctionError(error) &&
    error.code === 'functions/failed-precondition'
  );
}

/**
 * Checks if the error is a validation error.
 *
 * @param error - The error to check
 * @returns true if the error indicates invalid input
 */
export function isValidationError(error: unknown): boolean {
  return (
    isCloudFunctionError(error) &&
    error.code === 'functions/invalid-argument'
  );
}

/**
 * Checks if the error is a not-found error.
 *
 * @param error - The error to check
 * @returns true if the error indicates resource not found
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    isCloudFunctionError(error) &&
    error.code === 'functions/not-found'
  );
}
