/**
 * Secure Cloud Function Caller
 *
 * CANON-0076, CANON-0078: Consolidates reCAPTCHA token injection and retry logic
 *
 * Provides a single entry point for calling Cloud Functions with:
 * - Automatic reCAPTCHA token generation
 * - Exponential backoff retry for network failures
 * - Type-safe function calls
 * - Shared action constants
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { retryCloudFunction } from "@/lib/utils/retry";
import { logger } from "@/lib/logger";
import { getCloudFunctionErrorMessage, isCloudFunctionError } from "@/lib/utils/callable-errors";

/**
 * CANON-0078: Shared reCAPTCHA action constants
 * All action strings in one place for consistency and type safety
 */
export const RECAPTCHA_ACTIONS = {
  // Journal operations
  SAVE_JOURNAL_ENTRY: "save_journal_entry",
  DELETE_JOURNAL_ENTRY: "delete_journal_entry",

  // Daily log operations
  SAVE_DAILY_LOG: "save_daily_log",

  // Inventory operations
  SAVE_INVENTORY: "save_inventory",

  // Auth operations
  LINK_ACCOUNT: "link_account",
} as const;

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS];

/**
 * Options for calling secure Cloud Functions
 */
export interface CallSecureFunctionOptions {
  /**
   * reCAPTCHA action for bot protection
   * Use constants from RECAPTCHA_ACTIONS
   */
  action: RecaptchaAction;

  /**
   * Maximum retry attempts for network failures (default: 3)
   */
  maxRetries?: number;

  /**
   * Whether to include reCAPTCHA token (default: true)
   * Only set false for functions that don't require reCAPTCHA
   */
  includeRecaptcha?: boolean;
}

/**
 * Result from secure Cloud Function call
 */
export interface SecureFunctionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call a Cloud Function with automatic reCAPTCHA token injection and retry logic
 *
 * @param functionName - The name of the Cloud Function to call
 * @param payload - The data to send to the function
 * @param options - Configuration options
 * @returns Promise with typed result data
 *
 * @example
 * ```ts
 * // Simple call with automatic reCAPTCHA
 * const result = await callSecureFunction<{ entryId: string }>(
 *   'saveJournalEntry',
 *   { userId, type, data },
 *   { action: RECAPTCHA_ACTIONS.SAVE_JOURNAL_ENTRY }
 * );
 *
 * if (result.success) {
 *   console.log('Entry ID:', result.data?.entryId);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function callSecureFunction<TResponse = unknown, TPayload = Record<string, unknown>>(
  functionName: string,
  payload: TPayload,
  options: CallSecureFunctionOptions
): Promise<SecureFunctionResult<TResponse>> {
  const { action, maxRetries = 3, includeRecaptcha = true } = options;

  try {
    // Get reCAPTCHA token if required
    let recaptchaToken: string | undefined;
    if (includeRecaptcha) {
      try {
        recaptchaToken = await getRecaptchaToken(action);
      } catch (recaptchaError) {
        // Log warning with error type only (not full error to avoid leaking details)
        logger.warn("Failed to get reCAPTCHA token", {
          action,
          errorType:
            recaptchaError instanceof Error
              ? recaptchaError.constructor.name
              : typeof recaptchaError,
        });

        // SECURITY: In production, fail-closed - don't allow requests without reCAPTCHA
        // In development/emulator, allow graceful degradation for local testing
        if (process.env.NODE_ENV === "production") {
          return {
            success: false,
            error: "Security verification failed. Please refresh the page and try again.",
          };
        }
        // Non-production: Server MUST still validate and may reject - this is defense in depth
      }
    }

    // Prepare payload with optional reCAPTCHA token
    const fullPayload = {
      ...payload,
      ...(recaptchaToken && { recaptchaToken }),
    };

    // Get Firebase Functions instance
    const functions = getFunctions();
    const cloudFunction = httpsCallable<typeof fullPayload, TResponse>(functions, functionName);

    // Call with retry logic
    const result = (await retryCloudFunction(cloudFunction, fullPayload, {
      maxRetries,
      functionName,
    })) as HttpsCallableResult<TResponse>;

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    // Use centralized error handler for sanitized, user-friendly messages
    const errorMessage = getCloudFunctionErrorMessage(error, {
      defaultMessage: "The operation could not be completed. Please try again.",
    });

    // Log error metadata without exposing raw error objects (security best practice)
    logger.error(`Cloud Function call failed: ${functionName}`, {
      action,
      errorCode: isCloudFunctionError(error) ? error.code : "unknown",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Type-safe wrapper for specific Cloud Functions
 * Creates a pre-configured caller for a specific function
 *
 * @example
 * ```ts
 * const saveJournalEntry = createSecureFunctionCaller<
 *   { entryId: string },
 *   { userId: string; type: string; data: unknown }
 * >('saveJournalEntry', RECAPTCHA_ACTIONS.SAVE_JOURNAL_ENTRY);
 *
 * // Later:
 * const result = await saveJournalEntry({ userId, type, data });
 * ```
 */
export function createSecureFunctionCaller<TResponse, TPayload>(
  functionName: string,
  action: RecaptchaAction,
  defaultOptions: Partial<Omit<CallSecureFunctionOptions, "action">> = {}
) {
  return async (payload: TPayload): Promise<SecureFunctionResult<TResponse>> => {
    return callSecureFunction<TResponse, TPayload>(functionName, payload, {
      action,
      ...defaultOptions,
    });
  };
}
