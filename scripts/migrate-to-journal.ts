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

    // 1. Migrate daily_logs
    const dailyLogsRef = db.collection(`users/${userId}/daily_logs`);
    const dailyLogsSnapshot = await dailyLogsRef.get();

    for (const doc of dailyLogsSnapshot.docs) {
        try {
            const data = doc.data();
            const dateLabel = doc.id; // daily_logs use YYYY-MM-DD as doc ID

            // Create check-in entry if has mood/cravings/used
            if (data.mood || data.cravings || data.used) {
                await db.collection(`users/${userId}/journal`).add({
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
                    hasUsed: data.used || false,
                    mood: data.mood || null,
                    createdAt: data.createdAt || Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    migratedFrom: 'daily_logs',
                });
                stats.journalEntriesCreated++;
            }

            // Create daily-log entry if has content
            if (data.content && data.content.trim()) {
                await db.collection(`users/${userId}/journal`).add({
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
                });
                stats.journalEntriesCreated++;
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

            // Convert timestamp to dateLabel
            let dateLabel: string;
            if (createdAt.toDate) {
                dateLabel = createdAt.toDate().toLocaleDateString('en-CA');
            } else {
                dateLabel = new Date().toLocaleDateString('en-CA');
            }

            const entryType = data.type; // spot-check, night-review, gratitude

            await db.collection(`users/${userId}/journal`).add({
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
            });

            stats.journalEntriesCreated++;
            stats.inventoryEntriesProcessed++;
        } catch (error) {
            stats.errors.push(`inventoryEntries/${doc.id}: ${error}`);
        }
    }
}

/**
 * Generate searchable text from entry data
 */
function generateSearchableText(type: string, data: any): string {
    const parts: string[] = [];

    switch (type) {
        case 'spot-check':
            parts.push(data.action || '');
            parts.push(...(data.feelings || []));
            parts.push(...(data.absolutes || []));
            break;
        case 'night-review':
            parts.push(data.step4_gratitude || '');
            parts.push(data.step4_surrender || '');
            if (data.step3_reflections) {
                Object.values(data.step3_reflections).forEach((v: any) => parts.push(String(v || '')));
            }
            break;
        case 'gratitude':
            parts.push(...(data.items || []));
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

    // Get all users
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    console.log(`Found ${usersSnapshot.size} users to migrate`);

    for (const userDoc of usersSnapshot.docs) {
        await migrateUserData(userDoc.id, stats);
    }

    console.log('\n=== Migration Complete ===');
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
