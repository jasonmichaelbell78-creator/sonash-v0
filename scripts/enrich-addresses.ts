import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "node:fs";
import * as path from "node:path";
import { sanitizeError } from "./lib/sanitize-error";

// --- CONFIGURATION ---
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "SonashMeetingFinder/1.0 (dev-project-migration)"; // Required by OSM TOS
const DELAY_MS = 1100; // > 1 second to be safe and respectful
// ---------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  console.log("🚀 Starting Address Enrichment (OSM/Nominatim)...\n");

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
        console.error(error);
        process.exit(1);
      }
    }
  }

  const db = getFirestore();
  const meetingsRef = db.collection("meetings");

  // 2. Fetch meetings that need enrichment
  // User requested to check ALL addresses, regardless of current zip
  const snapshot = await meetingsRef.get();

  if (snapshot.empty) {
    console.log("⚠️ No meetings found.");
    process.exit(0);
  }
  // Process all documents that have a valid address
  const toProcess = snapshot.docs.filter((doc) => {
    const data = doc.data();
    // Only skip if address is missing entirely
    return data.address && data.address.length > 5;
  });

  console.log(
    `📊 Found ${toProcess.length} meetings needing enrichment (out of ${snapshot.size} total).`
  );
  console.log(
    `⏳ Estimated time: ~${Math.ceil((toProcess.length * DELAY_MS) / 1000 / 60)} minutes\n`
  );

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const failedLog: Array<{ id: string }> = [];

  // Helper to clean address for OSM
  const cleanAddress = (addr: string) => {
    // 0. Handle "Duplicate" pattern: "123 Main St, 123 Main St" or "Facility, 123 Main St"
    if (addr.includes(",")) {
      const parts = addr.split(",").map((p) => p.trim());
      // If we have 2+ parts, try to find the "real" address part
      // Heuristic: The part that starts with a number is likely the street address
      const addressPart = parts.find((p) => /^\d/.test(p));
      if (addressPart) {
        // Just use the address part, ignoring the facility name/duplicate
        addr = addressPart;
      }
    }

    // 1. Remove Facility Names (assume address starts with a number)
    // matches "Facility Name, 123 Main" -> "123 Main"
    const firstDigitIndex = addr.search(/\d/);
    if (firstDigitIndex > -1) {
      addr = addr.substring(firstDigitIndex);
    }

    return addr
      .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "") // Remove unit info
      .replace(/[,.]/g, "") // Remove commas/dots
      .replace(/\s+/g, " ")
      .trim();
  };

  // 3. Process sequentially with delay
  for (const [index, doc] of toProcess.entries()) {
    const meeting = doc.data();
    const rawAddress = meeting.address;

    // Skip if really no address data
    if (!rawAddress || rawAddress.trim().length < 5) {
      console.log(`[${index + 1}/${toProcess.length}] ⏭️  Skipped (Invalid address): ID ${doc.id}`);
      skippedCount++;
      continue;
    }

    const streetClean = cleanAddress(rawAddress);
    const currentCity = meeting.city || "Nashville";
    const neighborhood = meeting.neighborhood;

    // Search Strategy:
    const queries = [];

    // 1. Neighborhood as City (High Priority)
    // Many records have actual city (e.g. Madison, Antioch) in the neighborhood field
    if (neighborhood && neighborhood !== "Nashville" && neighborhood.length > 2) {
      queries.push(`${streetClean}, ${neighborhood}, TN, USA`);
    }

    // 2. Precise with current database city + 3. Fallback
    queries.push(`${streetClean}, ${currentCity}, TN, USA`, `${streetClean}, TN, USA`);

    let found = false;

    for (const query of queries) {
      if (found) break; // Stop if previous query worked

      try {
        // Rate limit wait
        await delay(DELAY_MS);

        // Fetch from Nominatim
        const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`;

        const response = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
          address?: Record<string, string>;
        }>;

        if (results && results.length > 0) {
          const result = results[0];
          const addr = result.address;
          if (!addr) continue; // Skip if no address details returned

          // Extract fields
          const newZip = addr.postcode;
          // OSM returns variable admin levels
          const newCity =
            addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || currentCity;
          const lat = Number.parseFloat(result.lat);
          const lon = Number.parseFloat(result.lon);

          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            // Update Firestore — enrich coordinates even without zip
            const updateFields: Record<string, unknown> = {
              city: newCity,
              coordinates: { lat, lng: lon },
            };
            if (newZip) updateFields.zip = newZip;
            await doc.ref.update(updateFields);

            console.log(`[${index + 1}/${toProcess.length}] ✅ Enriched: ID ${doc.id}`);
            console.log(
              `   └-> ${newCity}${newZip ? `, ${newZip}` : ""} @ [${lat.toFixed(5)}, ${lon.toFixed(5)}]`
            );
            successCount++;
            found = true;
          }
        }
      } catch (error) {
        console.error(`   💥 Error during geocode query:`, sanitizeError(error));
      }
    }

    if (!found) {
      console.log(`[${index + 1}/${toProcess.length}] ❌ Not Found: ID ${doc.id}`);
      failCount++;
      failedLog.push({ id: doc.id });
    }
  }

  // Write failures to file
  if (failedLog.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, "enrichment_failures.json"),
      JSON.stringify(failedLog, null, 2)
    );
    console.log(`\n📝 Wrote ${failedLog.length} failures to scripts/enrichment_failures.json`);
  }

  console.log("\n============================================================");
  console.log("🎉 Enrichment Complete");
  console.log(`✅ Updated: ${successCount}`);
  console.log(`❌ Failed/Not Found: ${failCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log("============================================================\n");
} catch (error: unknown) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(1);
}
