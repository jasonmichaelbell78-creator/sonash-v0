/**
 * reCAPTCHA Enterprise Verification Utility
 *
 * Verifies reCAPTCHA tokens from the frontend using Google's
 * reCAPTCHA Enterprise API.
 *
 * @module functions/src/recaptcha-verify
 */

import { HttpsError } from "firebase-functions/v2/https";
import { logSecurityEvent } from "./security-logger";

/**
 * Minimum acceptable score for reCAPTCHA tokens (0.0-1.0)
 * 0.0 = very likely a bot, 1.0 = very likely a human
 *
 * Default: 0.5 (balanced - catches most bots without false positives)
 * Adjust based on your security/UX needs:
 * - 0.3 = More permissive (fewer false positives, more bots slip through)
 * - 0.7 = More strict (fewer bots, more false positives)
 */
const MIN_SCORE = 0.5;

/**
 * Expected reCAPTCHA actions for different operations
 * Used to prevent token reuse attacks
 */
export const RECAPTCHA_ACTIONS = {
    SAVE_DAILY_LOG: 'save_daily_log',
    SAVE_JOURNAL: 'save_journal_entry',
    DELETE_JOURNAL: 'delete_journal_entry',
    SAVE_INVENTORY: 'save_inventory',
    MIGRATE_DATA: 'migrate_user_data',
} as const;

interface RecaptchaAssessment {
    tokenProperties: {
        valid: boolean;
        action: string;
        hostname: string;
        invalidReason?: string;
    };
    riskAnalysis: {
        score: number;
        reasons: string[];
    };
}

/**
 * Verify a reCAPTCHA Enterprise token
 *
 * @param token - The reCAPTCHA token from the frontend
 * @param expectedAction - The expected action name
 * @param userId - User ID for logging (optional)
 * @throws HttpsError if verification fails
 */
export async function verifyRecaptchaToken(
    token: string,
    expectedAction: string,
    userId?: string
): Promise<void> {
    // Get project ID and site key from environment
    const projectId = process.env.GCLOUD_PROJECT;
    const siteKey = process.env.RECAPTCHA_SITE_KEY;

    if (!projectId || !siteKey) {
        logSecurityEvent(
            "RECAPTCHA_CONFIG_ERROR",
            "verifyRecaptchaToken",
            "reCAPTCHA Enterprise not configured",
            { userId, captureToSentry: true }
        );
        throw new HttpsError(
            "failed-precondition",
            "reCAPTCHA verification is not configured"
        );
    }

    if (!token) {
        logSecurityEvent(
            "RECAPTCHA_MISSING_TOKEN",
            "verifyRecaptchaToken",
            "No reCAPTCHA token provided",
            { userId, metadata: { expectedAction } }
        );
        throw new HttpsError(
            "invalid-argument",
            "reCAPTCHA token is required"
        );
    }

    try {
        // Call reCAPTCHA Enterprise API using Google Auth
        // Cloud Functions automatically use the service account for authentication
        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            throw new Error('Failed to get access token');
        }

        const apiUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.token}`,
            },
            body: JSON.stringify({
                event: {
                    token,
                    expectedAction,
                    siteKey,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logSecurityEvent(
                "RECAPTCHA_API_ERROR",
                "verifyRecaptchaToken",
                `reCAPTCHA API returned ${response.status}`,
                {
                    userId,
                    metadata: {
                        status: response.status,
                        error: errorText,
                        expectedAction,
                    },
                    captureToSentry: true,
                }
            );
            throw new HttpsError(
                "internal",
                "reCAPTCHA verification failed"
            );
        }

        const assessment: RecaptchaAssessment = await response.json();

        // Check if token is valid
        if (!assessment.tokenProperties.valid) {
            logSecurityEvent(
                "RECAPTCHA_INVALID_TOKEN",
                "verifyRecaptchaToken",
                "Invalid reCAPTCHA token",
                {
                    userId,
                    metadata: {
                        reason: assessment.tokenProperties.invalidReason,
                        expectedAction,
                    },
                }
            );
            throw new HttpsError(
                "invalid-argument",
                "Invalid reCAPTCHA token. Please refresh and try again."
            );
        }

        // Check if action matches
        if (assessment.tokenProperties.action !== expectedAction) {
            logSecurityEvent(
                "RECAPTCHA_ACTION_MISMATCH",
                "verifyRecaptchaToken",
                "reCAPTCHA action mismatch",
                {
                    userId,
                    metadata: {
                        expected: expectedAction,
                        actual: assessment.tokenProperties.action,
                    },
                }
            );
            throw new HttpsError(
                "permission-denied",
                "reCAPTCHA verification failed"
            );
        }

        // Check score (bot detection)
        const score = assessment.riskAnalysis.score;
        if (score < MIN_SCORE) {
            logSecurityEvent(
                "RECAPTCHA_LOW_SCORE",
                "verifyRecaptchaToken",
                `reCAPTCHA score too low: ${score}`,
                {
                    userId,
                    metadata: {
                        score,
                        minScore: MIN_SCORE,
                        expectedAction,
                        reasons: assessment.riskAnalysis.reasons,
                    },
                }
            );
            throw new HttpsError(
                "permission-denied",
                "Bot activity detected. Please try again."
            );
        }

        // Success - log for monitoring
        logSecurityEvent(
            "RECAPTCHA_SUCCESS",
            "verifyRecaptchaToken",
            "reCAPTCHA verification successful",
            {
                userId,
                severity: "INFO",
                metadata: {
                    score,
                    action: expectedAction,
                },
            }
        );
    } catch (error) {
        // Re-throw HttpsErrors directly
        if (error instanceof HttpsError) {
            throw error;
        }

        // Log unexpected errors
        logSecurityEvent(
            "RECAPTCHA_UNEXPECTED_ERROR",
            "verifyRecaptchaToken",
            "Unexpected error during reCAPTCHA verification",
            {
                userId,
                metadata: {
                    error: String(error),
                    expectedAction,
                },
                captureToSentry: true,
            }
        );

        throw new HttpsError(
            "internal",
            "reCAPTCHA verification failed unexpectedly"
        );
    }
}
