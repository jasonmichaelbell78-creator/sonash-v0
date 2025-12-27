/**
 * Migration Script: Add dayIndex field to existing meetings
 * 
 * This script adds the dayIndex field (0=Sunday through 6=Saturday) to all
 * existing meeting documents in Firestore. This field is required for proper
 * week-order sorting in pagination queries.
 * 
 * Run with: npx tsx scripts/migrate-meetings-dayindex.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Day name to index mapping (0=Sunday, 1=Monday, ..., 6=Saturday)
const DAY_TO_INDEX: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
};

async function migrateMeetings() {
    console.log('🚀 Starting migration: Adding dayIndex to meetings...\n');

    // Initialize Firebase Admin SDK
    // NOTE: You'll need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
    // or provide serviceAccountKey.json in the project root
    try {
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
        initializeApp({
            credential: cert(serviceAccountPath),
        });
        console.log('✅ Firebase Admin initialized\n');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin. Make sure serviceAccountKey.json exists.');
        console.error('   Download it from Firebase Console > Project Settings > Service Accounts\n');
        process.exit(1);
    }

    const db = getFirestore();
    const meetingsRef = db.collection('meetings');

    try {
        // Get all meetings
        const snapshot = await meetingsRef.get();
        console.log(`📊 Found ${snapshot.size} meetings to migrate\n`);

        if (snapshot.empty) {
            console.log('⚠️  No meetings found in Firestore. Nothing to migrate.');
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // Use batched writes for efficiency (max 500 per batch)
        const batchSize = 500;
        let batch = db.batch();
        let operationCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Skip if dayIndex already exists
            if (typeof data.dayIndex === 'number') {
                skippedCount++;
                console.log(`⏭️  Skipped ${doc.id}: dayIndex already exists (${data.dayIndex})`);
                continue;
            }

            // Validate day field
            if (!data.day || typeof data.day !== 'string') {
                errorCount++;
                console.error(`❌ Error ${doc.id}: Missing or invalid 'day' field`);
                continue;
            }

            // Get dayIndex from day name
            const dayIndex = DAY_TO_INDEX[data.day];
            if (dayIndex === undefined) {
                errorCount++;
                console.error(`❌ Error ${doc.id}: Invalid day name "${data.day}"`);
                continue;
            }

            // Add to batch
            batch.update(doc.ref, { dayIndex });
            operationCount++;
            successCount++;

            console.log(`✅ Queued ${doc.id}: ${data.day} → dayIndex: ${dayIndex}`);

            // Commit batch if we've reached the limit
            if (operationCount >= batchSize) {
                await batch.commit();
                console.log(`\n💾 Committed batch of ${operationCount} updates\n`);
                batch = db.batch();
                operationCount = 0;
            }
        }

        // Commit any remaining operations
        if (operationCount > 0) {
            await batch.commit();
            console.log(`\n💾 Committed final batch of ${operationCount} updates\n`);
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Successfully migrated: ${successCount}`);
        console.log(`⏭️  Skipped (already migrated): ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📊 Total processed: ${snapshot.size}`);
        console.log('='.repeat(60));

        if (errorCount > 0) {
            console.log('\n⚠️  Some meetings had errors. Please review the log above.');
            process.exit(1);
        } else {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📌 Next steps:');
            console.log('   1. Deploy the new Firestore index:');
            console.log('      firebase deploy --only firestore:indexes');
            console.log('   2. Test pagination in the app');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error);
        process.exit(1);
    }
}

// Run migration
migrateMeetings()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
