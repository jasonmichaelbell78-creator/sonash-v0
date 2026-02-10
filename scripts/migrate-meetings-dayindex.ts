/**
 * Migration Script: Add dayIndex field to existing meetings
 *
 * This script adds the dayIndex field (0=Sunday through 6=Saturday) to all
 * existing meeting documents in Firestore. This field is required for proper
 * week-order sorting in pagination queries.
 *
 * Run with: npx tsx scripts/migrate-meetings-dayindex.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "node:path";
import * as fs from "node:fs";
import { sanitizeError } from "./lib/sanitize-error.js";

// Day name to index mapping (0=Sunday, 1=Monday, ..., 6=Saturday)
// Day name to index mapping (0=Sunday, 1=Monday, ..., 6=Saturday)
const DAY_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Initialize Firebase Admin SDK, allowing re-initialization
 */
function initFirebaseAdmin(): void {
  try {
    const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized\n");
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "app/duplicate-app") {
      console.log("ℹ️ Firebase Admin already initialized; continuing...\n");
      return;
    }
    console.error(
      "❌ Failed to initialize Firebase Admin. Make sure firebase-service-account.json exists."
    );
    console.error("   This file should be in the project root.\n");
    console.error("Error details:", sanitizeError(error));
    process.exit(1);
  }
}

/**
 * Resolve dayIndex for a single meeting document.
 * Returns the dayIndex number, or null with a logged error/skip message.
 */
function resolveDayIndex(
  doc: FirebaseFirestore.QueryDocumentSnapshot,
  stats: { skippedCount: number; errorCount: number }
): number | null {
  const data = doc.data();

  if (typeof data.dayIndex === "number") {
    stats.skippedCount++;
    console.log(`⏭️  Skipped ${doc.id}: dayIndex already exists (${data.dayIndex})`);
    return null;
  }

  if (!data.day || typeof data.day !== "string") {
    stats.errorCount++;
    console.error(`❌ Error ${doc.id}: Missing or invalid 'day' field`);
    return null;
  }

  const dayIndex = DAY_TO_INDEX[data.day.toLowerCase()];
  if (dayIndex === undefined) {
    stats.errorCount++;
    console.error(`❌ Error ${doc.id}: Invalid day name "${data.day}"`);
    return null;
  }

  return dayIndex;
}

/**
 * Print migration summary and exit
 */
function printSummary(
  successCount: number,
  skippedCount: number,
  errorCount: number,
  total: number
): void {
  console.log("\n" + "=".repeat(60));
  console.log("📋 Migration Summary:");
  console.log("=".repeat(60));
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`⏭️  Skipped (already migrated): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${total}`);
  console.log("=".repeat(60));

  if (errorCount > 0) {
    console.log("\n⚠️  Some meetings had errors. Please review the log above.");
    process.exit(1);
  }

  console.log("\n🎉 Migration completed successfully!");
  console.log("\n📌 Next steps:");
  console.log("   1. Deploy the new Firestore index:");
  console.log("      firebase deploy --only firestore:indexes");
  console.log("   2. Test pagination in the app");
}

// Run migration
try {
  console.log("🚀 Starting migration: Adding dayIndex to meetings...\n");

  initFirebaseAdmin();

  const db = getFirestore();
  const meetingsRef = db.collection("meetings");
  const snapshot = await meetingsRef.get();
  console.log(`📊 Found ${snapshot.size} meetings to migrate\n`);

  if (snapshot.empty) {
    console.log("⚠️  No meetings found in Firestore. Nothing to migrate.");
  } else {
    let successCount = 0;
    const stats = { skippedCount: 0, errorCount: 0 };
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      const dayIndex = resolveDayIndex(doc, stats);
      if (dayIndex === null) continue;

      batch.update(doc.ref, { dayIndex });
      operationCount++;
      console.log(`✅ Queued ${doc.id}: ${doc.data().day} → dayIndex: ${dayIndex}`);

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

    printSummary(successCount, stats.skippedCount, stats.errorCount, snapshot.size);
  }

  process.exit(0);
} catch (error) {
  console.error("Unexpected error:", sanitizeError(error));
  process.exit(1);
}
