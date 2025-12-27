/**
 * Migration Script: Split Address into Structured Fields
 * 
 * This script updates existing meetings to include city, state, and zip fields.
 * It assumes existing 'address' fields are street addresses and defaults location to Nashville, TN.
 * 
 * Run with: npx tsx scripts/migrate-addresses.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

async function migrateAddresses() {
    console.log('🚀 Starting address migration...\n');

    // Initialize Firebase Admin SDK
    try {
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized\n');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin.');
        console.error(error);
        process.exit(1);
    }

    const db = getFirestore();
    const meetingsRef = db.collection('meetings');

    try {
        const snapshot = await meetingsRef.get();
        console.log(`📊 Found ${snapshot.size} meetings to check\n`);

        if (snapshot.empty) {
            console.log('⚠️  No meetings found. Nothing to migrate.');
            return;
        }

        let successCount = 0;
        let skippedCount = 0;
        const batchSize = 500;
        let batch = db.batch();
        let operationCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Skip if already migrated (has city field)
            if (data.city && data.state) {
                skippedCount++;
                continue;
            }

            // Update with defaults
            batch.update(doc.ref, {
                city: 'Nashville',
                state: 'TN',
                zip: '', // Initialize as empty string so it exists
                // Preserve existing address as street address
            });

            operationCount++;
            console.log(`✅ Queued ${doc.id}: Adding Nashville, TN context`);

            if (operationCount >= batchSize) {
                await batch.commit();
                successCount += operationCount;
                console.log(`\n💾 Committed batch of ${operationCount} updates\n`);
                batch = db.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
            successCount += operationCount;
            console.log(`\n💾 Committed final batch of ${operationCount} updates\n`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Migrated: ${successCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
