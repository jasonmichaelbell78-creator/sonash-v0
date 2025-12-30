/**
 * Account Linking Utilities
 * 
 * Allows anonymous users to convert their accounts to permanent ones
 * (email/password or Google OAuth) while preserving all existing data.
 * 
 * Firebase account linking preserves the UID, so all user data remains
 * accessible after linking.
 */

import {
    User,
    EmailAuthProvider,
    GoogleAuthProvider,
    linkWithCredential,
    linkWithPopup,
    signInWithPopup,
    AuthError,
} from "firebase/auth";
import { auth } from "../firebase";
import { updateUserProfile } from "../db/users";
import { logger, maskIdentifier } from "../logger";
import { retryCloudFunction } from "../utils/retry";
import { getRecaptchaToken } from "../recaptcha";

/**
 * Result type for account linking operations
 */
export type LinkResult =
    | { success: true; user: User; warning?: string }
    | { success: false; error: LinkError };

/**
 * Structured error type for account linking
 */
export interface LinkError {
    code: string;
    message: string;
    userMessage: string;
    recoverable: boolean;
}

/**
 * Check if the current user is anonymous
 */
export function isAnonymousUser(user: User | null): boolean {
    return user?.isAnonymous ?? false;
}

/**
 * Check if account linking is possible for the current user
 * Linking is only possible for authenticated anonymous users
 */
export function canLinkAccount(user: User | null): boolean {
    return user !== null && user.isAnonymous;
}

/**
 * Get the number of days since account creation
 * Used for gentle prompts after 7 days
 */
export function getDaysSinceAccountCreation(user: User | null): number {
    if (!user?.metadata?.creationTime) return 0;

    const creationDate = new Date(user.metadata.creationTime);
    const now = new Date();
    const diffMs = now.getTime() - creationDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Map Firebase auth error codes to user-friendly messages
 */
function mapErrorToUserMessage(error: AuthError): LinkError {
    const code = error.code || "unknown";

    const errorMap: Record<string, { message: string; recoverable: boolean }> = {
        "auth/credential-already-in-use": {
            message: "This email or Google account is already linked to another user. Try signing in instead.",
            recoverable: true,
        },
        "auth/email-already-in-use": {
            message: "This email is already registered. Try signing in instead.",
            recoverable: true,
        },
        "auth/requires-recent-login": {
            message: "Your session has expired. Please refresh the page and try again.",
            recoverable: true,
        },
        "auth/popup-closed-by-user": {
            message: "Sign-in was cancelled.",
            recoverable: true,
        },
        "auth/network-request-failed": {
            message: "Network error. Please check your connection and try again.",
            recoverable: true,
        },
        "auth/invalid-email": {
            message: "Please enter a valid email address.",
            recoverable: true,
        },
        "auth/weak-password": {
            message: "Password should be at least 6 characters.",
            recoverable: true,
        },
        "auth/popup-blocked": {
            message: "Pop-up was blocked. Please allow pop-ups for this site.",
            recoverable: true,
        },
        "auth/operation-not-allowed": {
            message: "This sign-in method is not enabled. Please contact support.",
            recoverable: false,
        },
    };

    const mapped = errorMap[code] || {
        message: "Something went wrong. Please try again.",
        recoverable: false,
    };

    return {
        code,
        message: error.message,
        userMessage: mapped.message,
        recoverable: mapped.recoverable,
    };
}

/**
 * Link anonymous account with email and password
 * 
 * @param email - User's email address
 * @param password - User's chosen password
 * @returns LinkResult with success status
 */
export async function linkWithEmail(
    email: string,
    password: string
): Promise<LinkResult> {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            error: {
                code: "no-user",
                message: "No user is currently signed in",
                userMessage: "Please refresh the page and try again.",
                recoverable: true,
            },
        };
    }

    if (!currentUser.isAnonymous) {
        return {
            success: false,
            error: {
                code: "not-anonymous",
                message: "User is not anonymous",
                userMessage: "Your account is already linked.",
                recoverable: false,
            },
        };
    }

    try {
        const credential = EmailAuthProvider.credential(email, password);
        const result = await linkWithCredential(currentUser, credential);

        // Update profile with email
        await updateUserProfile(result.user.uid, {
            email: result.user.email,
        });

        logger.info("Account linked with email", {
            userId: maskIdentifier(result.user.uid),
        });

        return { success: true, user: result.user };
    } catch (error) {
        const authError = error as AuthError;

        // Handle existing email - offer migration
        if (authError.code === "auth/email-already-in-use") {
            logger.info("Email already in use, attempting migration", {
                anonymousUserId: maskIdentifier(currentUser.uid),
            });

            try {
                // Step 1: Sign in with email/password to get target UID
                const { signInWithCredential } = await import("firebase/auth");
                const signInCredential = EmailAuthProvider.credential(email, password);
                const signInResult = await signInWithCredential(auth, signInCredential);
                const targetUid = signInResult.user.uid;
                const anonymousUid = currentUser.uid;

                logger.info("Signed in to existing email account", {
                    userId: maskIdentifier(targetUid),
                });

                // Step 2: Migrate anonymous data
                // Get reCAPTCHA token for bot protection
                const recaptchaToken = await getRecaptchaToken('migrate_user_data');

                const { getFunctions, httpsCallable } = await import("firebase/functions");
                const functions = getFunctions();
                const migrateData = httpsCallable(functions, "migrateAnonymousUserData");

                // Retry migration with exponential backoff for network failures
                const migrationResult = await retryCloudFunction(
                    migrateData,
                    {
                        anonymousUid,
                        targetUid,
                        recaptchaToken // Include for server-side verification
                    },
                    { maxRetries: 3, functionName: 'migrateAnonymousUserData' }
                );

                logger.info("Migration successful", {
                    migratedItems: (migrationResult.data as { migratedItems: unknown }).migratedItems,
                });

                return { success: true, user: signInResult.user };
            } catch (migrationError) {
                logger.error("Migration or sign-in failed", {
                    error: String(migrationError),
                });

                return {
                    success: false,
                    error: {
                        code: "migration-failed",
                        message: "Failed to migrate data",
                        userMessage: "This email is already registered. Your anonymous data could not be merged. Please sign in directly.",
                        recoverable: true,
                    },
                };
            }
        }

        // Other errors
        logger.error("Failed to link account with email", {
            userId: maskIdentifier(currentUser.uid),
            errorCode: authError.code,
        });
        return {
            success: false,
            error: mapErrorToUserMessage(authError),
        };
    }
}

/**
 * Link anonymous account with Google OAuth
 * 
 * @returns LinkResult with success status
 */
export async function linkWithGoogle(): Promise<LinkResult> {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            error: {
                code: "no-user",
                message: "No user is currently signed in",
                userMessage: "Please refresh the page and try again.",
                recoverable: true,
            },
        };
    }

    if (!currentUser.isAnonymous) {
        return {
            success: false,
            error: {
                code: "not-anonymous",
                message: "User is not anonymous",
                userMessage: "Your account is already linked.",
                recoverable: false,
            },
        };
    }

    try {
        const provider = new GoogleAuthProvider();
        const result = await linkWithPopup(currentUser, provider);

        // Update profile with email from Google
        await updateUserProfile(result.user.uid, {
            email: result.user.email,
        });

        logger.info("Account linked with Google", {
            userId: maskIdentifier(result.user.uid),
        });

        return { success: true, user: result.user };
    } catch (error) {
        const authError = error as AuthError;

        // Popup closed is not really an error, just user cancellation
        if (authError.code === "auth/popup-closed-by-user") {
            // User cancelled - not an error, just log for debugging
            logger.info("Google linking popup closed by user", {});
        } else if (authError.code === "auth/credential-already-in-use") {
            // Google account is already linked to another user
            // BEFORE switching accounts, migrate anonymous data
            logger.info("Google account already linked, migrating data before sign-in", {
                anonymousUserId: maskIdentifier(currentUser.uid),
            });

            try {
                // Step 1: Sign in with Google to get the target user ID
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const targetUid = result.user.uid;
                const anonymousUid = currentUser.uid;

                logger.info("Signed in to existing Google account", {
                    userId: maskIdentifier(targetUid),
                });

                // Step 2: Migrate anonymous data to target account
                // Get reCAPTCHA token for bot protection
                const recaptchaToken = await getRecaptchaToken('migrate_user_data');

                const { getFunctions, httpsCallable } = await import("firebase/functions");
                const functions = getFunctions();
                const migrateData = httpsCallable(functions, "migrateAnonymousUserData");

                try {
                    const migrationResult = await retryCloudFunction(
                        migrateData,
                        {
                            anonymousUid,
                            targetUid,
                            recaptchaToken // Include for server-side verification
                        },
                        { maxRetries: 3, functionName: 'migrateAnonymousUserData' }
                    );

                    logger.info("Migration successful", {
                        anonymousUid: maskIdentifier(anonymousUid),
                        targetUid: maskIdentifier(targetUid),
                        migratedItems: (migrationResult.data as { migratedItems: unknown }).migratedItems,
                    });

                    // Success! Data preserved
                    return { success: true, user: result.user };
                } catch (migrationError) {
                    logger.error("Migration failed", {
                        error: String(migrationError),
                    });

                    // Migration failed - stay signed into target account but warn user
                    return {
                        success: true,
                        user: result.user,
                        warning: "Some data may not have transferred. Please check your journal.",
                    };
                }
            } catch (signInError) {
                logger.error("Failed to sign in to existing Google account", {
                    errorCode: (signInError as AuthError).code,
                });

                return {
                    success: false,
                    error: {
                        code: "sign-in-failed",
                        message: "Failed to sign in to existing account",
                        userMessage: "Unable to sign in. Please try refreshing the page and signing in directly.",
                        recoverable: true,
                    },
                };
            }
        } else {
            logger.error("Failed to link account with Google", {
                userId: maskIdentifier(currentUser.uid),
                errorCode: authError.code,
            });
        }

        return {
            success: false,
            error: mapErrorToUserMessage(authError),
        };
    }
}

/**
 * Check if prompt should be shown (after 7 days)
 */
export function shouldShowLinkPrompt(user: User | null): boolean {
    if (!canLinkAccount(user)) return false;
    return getDaysSinceAccountCreation(user) >= 7;
}
