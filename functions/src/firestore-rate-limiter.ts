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
     * Check and consume a rate limit point
     * @throws Error if rate limit exceeded
     */
    async consume(userId: string, operation: string = "default"): Promise<void> {
        const db = admin.firestore();
        const docId = `${userId}_${operation}`;
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

                    throw new Error(
                        `Rate limit exceeded. ${timestamps.length}/${this.config.points} requests used. ` +
                        `Try again in ${secondsUntilReset} seconds.`
                    );
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
