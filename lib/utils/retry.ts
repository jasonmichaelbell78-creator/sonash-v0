/**
 * Retry Utility with Exponential Backoff
 *
 * Provides retry logic for transient failures in Cloud Function calls.
 * Implements exponential backoff with configurable max retries.
 *
 * @module lib/utils/retry
 *
 * @example
 * import { retryWithBackoff } from '@/lib/utils/retry'
 *
 * const result = await retryWithBackoff(
 *   () => httpsCallable(functions, 'myFunction')(data),
 *   { maxRetries: 3, functionName: 'myFunction' }
 * )
 */

import { TIMEOUTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * Error codes that should trigger a retry (transient failures)
 */
const RETRYABLE_ERROR_CODES = [
    'unavailable',           // Network/server temporarily unavailable
    'deadline-exceeded',     // Request timeout
    'internal',              // Internal server error
    'functions/unavailable',
    'functions/deadline-exceeded',
    'functions/internal',
];

/**
 * Error codes that should NOT trigger a retry (permanent failures)
 */
const NON_RETRYABLE_ERROR_CODES = [
    'unauthenticated',
    'permission-denied',
    'invalid-argument',
    'not-found',
    'already-exists',
    'resource-exhausted',    // Rate limiting - should not retry
    'failed-precondition',   // App Check failure
    'functions/unauthenticated',
    'functions/permission-denied',
    'functions/invalid-argument',
    'functions/not-found',
    'functions/already-exists',
    'functions/resource-exhausted',
    'functions/failed-precondition',
];

interface RetryOptions {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxRetries?: number;

    /**
     * Base delay in ms for exponential backoff (default: from TIMEOUTS.RETRY_DELAY_BASE)
     */
    baseDelayMs?: number;

    /**
     * Function name for logging purposes
     */
    functionName?: string;

    /**
     * Callback invoked before each retry attempt
     */
    onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Check if an error is retryable based on its error code
 */
function isRetryableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as { code?: string };
    const code = err.code?.toLowerCase();

    if (!code) return false;

    // Explicitly non-retryable errors
    if (NON_RETRYABLE_ERROR_CODES.some(c => code.includes(c.toLowerCase()))) {
        return false;
    }

    // Explicitly retryable errors
    if (RETRYABLE_ERROR_CODES.some(c => code.includes(c.toLowerCase()))) {
        return true;
    }

    // Default: don't retry unknown errors
    return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a Cloud Function call with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retries are exhausted
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => {
 *     const fn = httpsCallable(functions, 'saveJournalEntry');
 *     return await fn(data);
 *   },
 *   { maxRetries: 3, functionName: 'saveJournalEntry' }
 * );
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelayMs = TIMEOUTS.RETRY_DELAY_BASE,
        functionName = 'CloudFunction',
        onRetry,
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: unknown) {
            lastError = error;

            // Don't retry if this is the last attempt
            if (attempt === maxRetries) {
                logger.error(`${functionName} failed after ${maxRetries + 1} attempts`, { error });
                throw error;
            }

            // Don't retry if error is not retryable
            if (!isRetryableError(error)) {
                logger.warn(`${functionName} failed with non-retryable error`, { error });
                throw error;
            }

            // Calculate exponential backoff delay: baseDelay * 2^attempt
            // Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 4s
            const delayMs = baseDelayMs * Math.pow(2, attempt);

            logger.warn(`${functionName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`, {
                error,
                attempt: attempt + 1,
                maxRetries: maxRetries + 1,
                delayMs,
            });

            // Invoke retry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, error);
            }

            // Wait before retrying
            await sleep(delayMs);
        }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError;
}

/**
 * Wrapper for Firebase Cloud Function calls with automatic retry
 *
 * @param callableFn - The Firebase httpsCallable function
 * @param data - The data to pass to the function
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 *
 * @example
 * import { getFunctions, httpsCallable } from 'firebase/functions';
 *
 * const functions = getFunctions();
 * const saveEntry = httpsCallable(functions, 'saveJournalEntry');
 *
 * const result = await retryCloudFunction(
 *   saveEntry,
 *   { type: 'gratitude', data: { ... } },
 *   { maxRetries: 3, functionName: 'saveJournalEntry' }
 * );
 */
export async function retryCloudFunction<RequestData, ResponseData>(
    callableFn: (data: RequestData) => Promise<{ data: ResponseData }>,
    data: RequestData,
    options: RetryOptions = {}
): Promise<{ data: ResponseData }> {
    return retryWithBackoff(() => callableFn(data), options);
}
