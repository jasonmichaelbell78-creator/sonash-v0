/**
 * Client-side security validation for Firestore operations
 *
 * ⚠️ SECURITY WARNING ⚠️
 * These validations run ONLY in the browser and can be bypassed with developer tools.
 * They provide:
 * - Defense-in-depth (catch bugs during development)
 * - User experience (immediate feedback on invalid operations)
 * - Attack surface reduction (stops casual attacks)
 *
 * They DO NOT provide:
 * - Protection against determined attackers
 * - Server-side enforcement
 * - Guaranteed security
 *
 * For production security, you MUST:
 * 1. Use Firestore Security Rules (server-side enforcement)
 * 2. Implement Cloud Functions for complex authorization
 * 3. Add Firebase App Check for bot protection
 *
 * See: docs/SERVER_SIDE_SECURITY.md for implementation guide
 */

export interface UserScopeOptions {
  userId: string;
  targetUserId?: string;
  resource?: string;
}

/**
 * Validate Firebase user ID format
 *
 * Prevents:
 * - Path traversal attacks (../, ./, etc.)
 * - SQL injection patterns ('; DROP TABLE, etc.)
 * - Special characters that could break queries
 *
 * Allows: Alphanumeric, hyphens, underscores (Firebase UID standard)
 */
const isValidUserId = (userId: string): boolean => {
  // Check for empty/whitespace
  if (!userId || !userId.trim()) {
    return false;
  }

  // Firebase UIDs are typically 28 characters, but allow up to 128 for flexibility
  if (userId.length > 128) {
    return false;
  }

  // Only allow alphanumeric, hyphens, and underscores
  // This prevents path traversal and injection attacks
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) {
    return false;
  }

  // Prevent path traversal patterns
  if (userId.includes("..") || userId.includes("./") || userId.includes("/.")) {
    return false;
  }

  return true;
};

/**
 * Assert that the current user has permission to access a resource
 *
 * ⚠️ This is client-side only! See file header for security warnings.
 *
 * @param options - Scope validation options
 * @throws {Error} If user ID is invalid or scope check fails
 *
 * @example
 * // Check user can access their own data
 * assertUserScope({ userId: currentUser.uid })
 *
 * @example
 * // Check user can access a specific resource
 * assertUserScope({
 *   userId: currentUser.uid,
 *   targetUserId: resourceOwnerId,
 *   resource: 'daily log'
 * })
 */
export const assertUserScope = ({ userId, targetUserId, resource }: UserScopeOptions) => {
  if (!userId) {
    throw new Error("Firestore access requires a user id");
  }

  if (!isValidUserId(userId)) {
    throw new Error(
      "Firestore access rejected: invalid user id format. " +
        "User IDs must be alphanumeric with hyphens/underscores only."
    );
  }

  if (targetUserId && targetUserId !== userId) {
    throw new Error(
      `Access to another user's data is not allowed${resource ? ` for ${resource}` : ""}`
    );
  }
};

/**
 * Validate that a Firestore path belongs to the specified user
 *
 * Prevents prefix attacks where "users/abc123evil" passes a check for "users/abc123"
 *
 * ⚠️ This is client-side only! See file header for security warnings.
 *
 * @param userId - The authenticated user's ID
 * @param path - The Firestore document path to validate
 * @throws {Error} If path doesn't belong to user
 *
 * @example
 * validateUserDocumentPath("abc123", "users/abc123")              // ✅ Valid
 * validateUserDocumentPath("abc123", "users/abc123/daily_logs/1") // ✅ Valid
 * validateUserDocumentPath("abc123", "users/abc123evil")          // ❌ Throws
 * validateUserDocumentPath("abc123", "users/other")               // ❌ Throws
 */
export const validateUserDocumentPath = (userId: string, path: string) => {
  const userPrefix = `users/${userId}`;

  // Path must be exactly "users/{userId}" or start with "users/{userId}/"
  // This prevents prefix attacks like "users/user123evil" when userId is "user123"
  const isExactMatch = path === userPrefix;
  const isSubpath = path.startsWith(`${userPrefix}/`);

  if (!isExactMatch && !isSubpath) {
    throw new Error("Firestore access is limited to the signed-in user's document");
  }

  // Additional check: Ensure no path traversal after user prefix
  if (path.includes("../") || path.includes("/./")) {
    throw new Error("Path traversal detected in Firestore path");
  }
};
