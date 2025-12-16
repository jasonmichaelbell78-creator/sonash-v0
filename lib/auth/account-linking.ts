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

/**
 * Result type for account linking operations
 */
export type LinkResult =
    | { success: true; user: User }
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
            // Google account is already linked to another user (e.g., on a different device)
            // Instead of showing an error, sign in to that existing account
            logger.info("Google account already linked, signing in to existing account", {
                anonymousUserId: maskIdentifier(currentUser.uid),
            });

            try {
                // Sign in with Google to the existing account
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);

                logger.info("Signed in to existing Google account", {
                    userId: maskIdentifier(result.user.uid),
                });

                return { success: true, user: result.user };
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
