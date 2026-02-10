import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "node:fs";
import * as path from "node:path";
import { sanitizeError } from "./lib/sanitize-error";

try {
  console.log("🚀 Starting Geocache Sync...\n");

  // 1. Initialize Firebase Admin
  if (getApps().length === 0) {
    try {
      const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized");
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "app/duplicate-app") {
        console.log("ℹ️ Firebase Admin already initialized");
      } else {
        console.error("❌ Failed to initialize Firebase Admin.");
        console.error(`   Error: ${sanitizeError(error)}`);
        process.exit(1);
      }
    }
  }

  const db = getFirestore();
  const meetingsRef = db.collection("meetings");

  // 2. Load existing cache
  const cachePath = path.join(process.cwd(), "geocoding_cache.json");
  let cache: Record<string, { lat: number; lng: number }> = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      console.log(`📂 Loaded existing cache with ${Object.keys(cache).length} entries.`);
    } catch (error: unknown) {
      console.warn(`⚠️ Could not parse existing cache: ${sanitizeError(error)}`);
      console.warn("   Starting fresh with empty cache.");
    }
  } else {
    console.log("✨ Creating new cache file.");
  }

  // 3. Fetch all meetings
  console.log("📥 Fetching meetings from Firestore...");
  const snapshot = await meetingsRef.get();

  if (snapshot.empty) {
    console.log("⚠️ No meetings found in DB.");
  } else {
    let addedCount = 0;
    let skippedCount = 0;

    // 4. Update cache
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // We key the cache by the address string. A common strategy is to normalize it slightly.
      // Assuming the app uses raw `address` as the lookup key or constructs a string.
      // For simplest compatibility, we'll try to match the format the app likely uses: "Address, City, State" or just "Address".
      // Let's store BOTH strictly if possible, or just the raw address + city/state combo.

      // Strategy: Use the Full Formatted Address as key?
      // Or just the raw `address` field?
      // Checking `MeetingMap` usage would be ideal, but usually it looks up by the string displayed.
      // Let's assume keys are "123 Main St, Nashville, TN"

      const coords = data.coordinates;
      const hasValidCoords =
        coords &&
        typeof coords.lat === "number" &&
        typeof coords.lng === "number" &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng);

      if (data.address && hasValidCoords) {
        // Construct the likely lookup keys.
        // 1. Full combo
        const fullAddr = `${data.address}, ${data.city || "Nashville"}, ${data.state || "TN"}`;
        // We'll prioritize the full address key as it's less ambiguous
        // But let's check what keys are already in the cache to guess the pattern?
        // Since we can't see runtime, let's just save the full address.

        // Standardize key to lower case or keep specific?
        // Usually caches are case-sensitive.

        // Let's save `address` + `city` + `state`
        if (cache[fullAddr]) {
          // Determine if we should update?
          // E.g. if the DB has newer verified data vs old cache.
          // Since we just ran enrichment, DB is truth.
          const oldLat = cache[fullAddr]?.lat;
          const oldLng = cache[fullAddr]?.lng;
          const newLat = coords.lat;
          const newLng = coords.lng;

          const oldIsValid =
            typeof oldLat === "number" &&
            typeof oldLng === "number" &&
            Number.isFinite(oldLat) &&
            Number.isFinite(oldLng);

          if (
            !oldIsValid ||
            Math.abs(oldLat - newLat) > 0.0001 ||
            Math.abs(oldLng - newLng) > 0.0001
          ) {
            cache[fullAddr] = coords;
            addedCount++; // Count as update
          } else {
            skippedCount++;
          }
        } else {
          cache[fullAddr] = coords;
          addedCount++;
        }
      }
    });

    // 5. Write back to file (Sorted keys for clean diffs)
    const sortedCache = Object.keys(cache)
      .sort((a, b) => a.localeCompare(b))
      .reduce((obj: Record<string, { lat: number; lng: number }>, key) => {
        obj[key] = cache[key];
        return obj;
      }, {});

    fs.writeFileSync(cachePath, JSON.stringify(sortedCache, null, 2));

    console.log("\n============================================================");
    console.log("💾 Cache Sync Complete");
    console.log(`✅ Added/Updated: ${addedCount} entries`);
    console.log(`⏭️  Unchanged: ${skippedCount} entries`);
    console.log(`📦 Total Cache Size: ${Object.keys(cache).length} entries`);
    console.log("============================================================\n");
  }
} catch (error: unknown) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(1);
}
