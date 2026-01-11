/**
 * Firestore-Based Rate Limiter
 *
 * Unlike in-memory rate limiting, this persists across function instances
 * and cold starts, making it effective for horizontal scaling.
 *
 * How it works:
 * 1. Stores rate limit data in Firestore collection: rate_limits/{userId}_{operation}
 * 2. Document contains array of request timestamps
 * 3. Cleans up expired timestamps before checking limit
 * 4. Uses Firestore transactions to prevent race conditions
 */

import * as admin from "firebase-admin";

interface RateLimitConfig {
    points: number;      // Max requests allowed
    duration: number;    // Time window in seconds
}

interface RateLimitDocument {
    timestamps: number[];  // Array of Unix timestamps (milliseconds)
    lastCleanup: number;   // Last time old timestamps were removed
}

export class FirestoreRateLimiter {
    private config: RateLimitConfig;
    private collectionName: string;

    constructor(config: RateLimitConfig) {
        this.config = config;
        this.collectionName = "rate_limits";
    }

    /**
     * Check and consume a rate limit point by user ID
     * @throws Error if rate limit exceeded
     */
    async consume(userId: string, operation: string = "default"): Promise<void> {
        return this.consumeByKey(`user_${userId}`, operation);
    }

    /**
     * Check and consume a rate limit point by IP address
     * CANON-0036: Secondary rate limiter keyed by IP to prevent account cycling attacks
     * @throws Error if rate limit exceeded
     */
    async consumeByIp(ipAddress: string, operation: string = "default"): Promise<void> {
        // Normalize IP address:
        // - Remove brackets from IPv6 (e.g., [::1] -> ::1)
        // - For IPv4 with port (e.g., 192.168.1.1:8080), remove the port
        // - For IPv6, keep the full address (ports are outside brackets)
        // SonarQube S5850: Explicitly group regex alternatives with anchors
        let normalizedIp = ipAddress.replaceAll(/(^\[)|(\]$)/g, ''); // Remove IPv6 brackets

        // Port extraction logic for IPv4 addresses only:
        // IPv4 with port looks like: 192.168.1.1:8080
        // IPv6 looks like: 2001:0db8:85a3::8a2e:0370:7334
        // IPv4-mapped IPv6 looks like: ::ffff:192.168.1.1
        const lastColonIndex = normalizedIp.lastIndexOf(':');
        if (lastColonIndex > -1) {
            const ipCandidate = normalizedIp.substring(0, lastColonIndex);
            // Only strip port for pure IPv4 addresses (contains dots, no colons in IP part)
            // This correctly handles:
            // - IPv4 with port (e.g., "1.2.3.4:8080") -> "1.2.3.4"
            // - IPv6 (e.g., "::1") -> unchanged
            // - IPv4-mapped IPv6 (e.g., "::ffff:1.2.3.4") -> unchanged
            if (ipCandidate.includes('.') && !ipCandidate.includes(':')) {
                normalizedIp = ipCandidate;
            }
        }

        return this.consumeByKey(`ip_${normalizedIp || ipAddress}`, operation);
    }

    /**
     * Internal: Check and consume by arbitrary key
     * @throws Error if rate limit exceeded
     */
    private async consumeByKey(key: string, operation: string = "default"): Promise<void> {
        const db = admin.firestore();
        const docId = `${key}_${operation}`;
        const docRef = db.collection(this.collectionName).doc(docId);

        const now = Date.now();
        const windowStart = now - (this.config.duration * 1000);

        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);

                let timestamps: number[] = [];

                if (doc.exists) {
                    const data = doc.data() as RateLimitDocument;
                    // Filter out expired timestamps (outside the time window)
                    timestamps = (data.timestamps || []).filter(ts => ts > windowStart);
                }

                // Check if adding this request would exceed the limit
                if (timestamps.length >= this.config.points) {
                    const oldestTimestamp = Math.min(...timestamps);
                    const secondsUntilReset = Math.ceil((oldestTimestamp + this.config.duration * 1000 - now) / 1000);

                    // SECURITY: Log detailed info server-side, but don't reveal timing to client
                    console.warn(`Rate limit exceeded for ${docId}:`, {
                        requests: timestamps.length,
                        limit: this.config.points,
                        secondsUntilReset,
                        operation
                    });

                    // Generic client-facing error message (prevents timing attacks)
                    throw new Error("Too many requests. Please try again later.");
                }

                // Add current timestamp
                timestamps.push(now);

                // Write back to Firestore
                transaction.set(docRef, {
                    timestamps,
                    lastCleanup: now
                } as RateLimitDocument, { merge: true });
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes("Rate limit exceeded")) {
                throw error; // Re-throw rate limit errors
            }
            // SECURITY: Fail-closed strategy
            // During Firestore outages or errors, DENY requests rather than allowing
            // unrestricted access. This prevents abuse during infrastructure issues.
            console.error("Rate limiter error (request DENIED for safety):", error);
            throw new Error(
                "Service temporarily unavailable due to high demand. Please try again in a few moments."
            );
        }
    }

    /**
     * Reset rate limit for a user (admin utility)
     */
    async reset(userId: string, operation: string = "default"): Promise<void> {
        const db = admin.firestore();
        const docId = `${userId}_${operation}`;
        const docRef = db.collection(this.collectionName).doc(docId);

        await docRef.delete();
    }

    /**
     * Get current usage for a user
     */
    async getUsage(userId: string, operation: string = "default"): Promise<{
        used: number;
        limit: number;
        resetsIn: number;
    }> {
        const db = admin.firestore();
        const docId = `${userId}_${operation}`;
        const docRef = db.collection(this.collectionName).doc(docId);

        const doc = await docRef.get();
        const now = Date.now();
        const windowStart = now - (this.config.duration * 1000);

        if (!doc.exists) {
            return {
                used: 0,
                limit: this.config.points,
                resetsIn: 0
            };
        }

        const data = doc.data() as RateLimitDocument;
        const validTimestamps = (data.timestamps || []).filter(ts => ts > windowStart);

        let resetsIn = 0;
        if (validTimestamps.length > 0) {
            const oldestTimestamp = Math.min(...validTimestamps);
            resetsIn = Math.ceil((oldestTimestamp + this.config.duration * 1000 - now) / 1000);
        }

        return {
            used: validTimestamps.length,
            limit: this.config.points,
            resetsIn
        };
    }
}

/**
 * Cleanup job: Remove old rate limit documents
 * Should be run periodically (e.g., daily via Cloud Scheduler)
 */
export async function cleanupOldRateLimits(): Promise<number> {
    const db = admin.firestore();
    const collectionRef = db.collection("rate_limits");

    // Delete documents older than 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const querySnapshot = await collectionRef
        .where("lastCleanup", "<", cutoff)
        .limit(500)  // Batch size
        .get();

    const batch = db.batch();
    let count = 0;

    querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
    });

    if (count > 0) {
        await batch.commit();
    }

    return count;
}
