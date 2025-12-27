/**
 * Migration Script: Legacy Firestore to Unified Journal
 * 
 * Migrates data from:
 * - /users/{uid}/daily_logs -> journal entries (check-in, daily-log)
 * - /users/{uid}/inventoryEntries -> journal entries (spot-check, night-review, gratitude)
 * 
 * Usage: Run with ts-node or from Firebase Functions
 *   npx ts-node scripts/migrate-to-journal.ts
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin (uses service account or emulator)
if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

interface MigrationStats {
    dailyLogsProcessed: number;
    inventoryEntriesProcessed: number;
    journalEntriesCreated: number;
    errors: string[];
}

/**
 * Migrate all legacy data for a specific user
 */
async function migrateUserData(userId: string, stats: MigrationStats) {
    console.log(`\nMigrating user: ${userId}`);

    // We no longer skip the user entirely if they have *some* migrated entries.
    // Instead, we check each entry individually for 'migrationId'.
    // This allows resuming a partial migration.

    // 1. Migrate daily_logs
    const dailyLogsRef = db.collection(`users/${userId}/daily_logs`);
    const dailyLogsSnapshot = await dailyLogsRef.get();

    for (const doc of dailyLogsSnapshot.docs) {
        try {
            const data = doc.data();
            const dateLabel = doc.id; // daily_logs use YYYY-MM-DD as doc ID

            // Create check-in entry if has mood/cravings/used
            if (data.mood || data.cravings || data.used) {
                // Idempotency check 
                const migrationId = `daily_logs_${doc.id}`;
                const existingEntry = await db.collection(`users/${userId}/journal`)
                    .where('migrationId', '==', migrationId)
                    .limit(1)
                    .get();

                if (existingEntry.empty) {
                    await db.collection(`users/${userId}/journal`).doc(migrationId).set({
                        userId,
                        type: 'check-in',
                        data: {
                            mood: data.mood || null,
                            cravings: data.cravings || false,
                            used: data.used || false,
                        },
                        dateLabel,
                        isPrivate: true,
                        isSoftDeleted: false,
                        searchableText: '',
                        tags: ['check-in', data.mood ? `mood-${data.mood}` : null].filter(Boolean),
                        hasCravings: data.cravings || false,
                        hasUsed: data.used || false, // duplicate field for query convenience
                        mood: data.mood || null,
                        createdAt: data.createdAt || Timestamp.now(),
                        updatedAt: Timestamp.now(),
                        migratedFrom: 'daily_logs',
                        migrationId,
                    }, { merge: true });
                    stats.journalEntriesCreated++;
                }
            }

            // Create daily-log entry if has content
            if (data.content && data.content.trim()) {
                // Idempotency check
                const migrationId = `daily_logs_content_${doc.id}`;
                const existingEntry = await db.collection(`users/${userId}/journal`)
                    .where('migrationId', '==', migrationId)
                    .limit(1)
                    .get();

                if (existingEntry.empty) {
                    await db.collection(`users/${userId}/journal`).doc(migrationId).set({
                        userId,
                        type: 'daily-log',
                        data: {
                            content: data.content,
                            wordCount: data.content.split(/\s+/).filter(Boolean).length,
                        },
                        dateLabel,
                        isPrivate: true,
                        isSoftDeleted: false,
                        searchableText: data.content.toLowerCase(),
                        tags: ['daily-log'],
                        createdAt: data.createdAt || Timestamp.now(),
                        updatedAt: Timestamp.now(),
                        migratedFrom: 'daily_logs',
                        migrationId,
                    }, { merge: true });
                    stats.journalEntriesCreated++;
                }
            }

            stats.dailyLogsProcessed++;
        } catch (error) {
            stats.errors.push(`daily_logs/${doc.id}: ${error}`);
        }
    }

    // 2. Migrate inventoryEntries
    const inventoryRef = db.collection(`users/${userId}/inventoryEntries`);
    const inventorySnapshot = await inventoryRef.get();

    for (const doc of inventorySnapshot.docs) {
        try {
            const data = doc.data();
            const createdAt = data.createdAt || Timestamp.now();

            // Convert timestamp to dateLabel using UTC to prevent timezone issues
            let dateLabel: string;
            if (createdAt.toDate) {
                const date = createdAt.toDate();
                dateLabel = date.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
            } else {
                dateLabel = new Date().toISOString().split('T')[0];
            }

            const entryType = data.type; // spot-check, night-review, gratitude

            // Idempotency check
            const migrationId = `inventoryEntries_${doc.id}`;
            const existingEntry = await db.collection(`users/${userId}/journal`)
                .where('migrationId', '==', migrationId)
                .limit(1)
                .get();

            if (existingEntry.empty) {
                await db.collection(`users/${userId}/journal`).doc(migrationId).set({
                    userId,
                    type: entryType,
                    data: data.data || {},
                    dateLabel,
                    isPrivate: true,
                    isSoftDeleted: false,
                    searchableText: generateSearchableText(entryType, data.data || {}),
                    tags: [entryType, ...(data.tags || [])],
                    createdAt,
                    updatedAt: Timestamp.now(),
                    migratedFrom: 'inventoryEntries',
                    migrationId,
                }, { merge: true });

                stats.journalEntriesCreated++;
            }

            stats.inventoryEntriesProcessed++;
        } catch (error) {
            stats.errors.push(`inventoryEntries/${doc.id}: ${error}`);
        }
    }
}

/**
 * Generate searchable text from entry data
 */
function generateSearchableText(type: string, data: Record<string, unknown>): string {
    const parts: string[] = [];
    const isPrimitive = (val: unknown): val is string | number => typeof val === 'string' || typeof val === 'number';

    switch (type) {
        case 'spot-check':
            if (typeof data.action === 'string') parts.push(data.action);
            if (Array.isArray(data.feelings)) parts.push(...data.feelings.filter(isPrimitive).map(String));
            if (Array.isArray(data.absolutes)) parts.push(...data.absolutes.filter(isPrimitive).map(String));
            break;
        case 'night-review':
            if (typeof data.step4_gratitude === 'string') parts.push(data.step4_gratitude);
            if (typeof data.step4_surrender === 'string') parts.push(data.step4_surrender);
            if (data.step3_reflections && typeof data.step3_reflections === 'object' && data.step3_reflections !== null) {
                Object.values(data.step3_reflections).forEach((v: unknown) => {
                    if (isPrimitive(v)) parts.push(String(v || ''));
                });
            }
            break;
        case 'gratitude':
            if (Array.isArray(data.items)) parts.push(...data.items.filter(isPrimitive).map(String));
            break;
    }

    return parts.filter(Boolean).join(' ').toLowerCase().trim();
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('Starting migration to unified journal...\n');

    const stats: MigrationStats = {
        dailyLogsProcessed: 0,
        inventoryEntriesProcessed: 0,
        journalEntriesCreated: 0,
        errors: [],
    };

    // Process users in batches to prevent memory exhaustion
    const BATCH_SIZE = 100;
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    let totalUsers = 0;
    let hasMore = true;

    while (hasMore) {
        // Get next batch of users
        let query = db.collection('users').limit(BATCH_SIZE);
        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const usersSnapshot = await query.get();

        if (usersSnapshot.empty) {
            hasMore = false;
            break;
        }

        console.log(`\nProcessing batch of ${usersSnapshot.size} users (total so far: ${totalUsers})...`);

        for (const userDoc of usersSnapshot.docs) {
            try {
                await migrateUserData(userDoc.id, stats);
                totalUsers++;
            } catch (error) {
                console.error(`❌ Error migrating user ${userDoc.id}:`, error);
                // Continue to next user
            }
        }

        lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
        hasMore = usersSnapshot.size === BATCH_SIZE;
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Total users processed: ${totalUsers}`);
    console.log(`Daily logs processed: ${stats.dailyLogsProcessed}`);
    console.log(`Inventory entries processed: ${stats.inventoryEntriesProcessed}`);
    console.log(`Journal entries created: ${stats.journalEntriesCreated}`);

    if (stats.errors.length > 0) {
        console.log(`\nErrors (${stats.errors.length}):`);
        stats.errors.forEach(e => console.log(`  - ${e}`));
    }
}

// Run if called directly
runMigration().catch(console.error);
