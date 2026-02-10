import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { sanitizeError } from "./lib/sanitize-error";

// Nominatim Config
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "SonashApp_Migration/1.0 (jason@example.com)"; // Replace with real email if possible

try {
  console.log("🚀 Starting Retry for Failed Addresses...\n");

  // 1. Initialize Firebase
  if (getApps().length === 0) {
    try {
      const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized");
    } catch (error: unknown) {
      console.error("❌ Failed to initialize Firebase Admin:", sanitizeError(error));
      process.exit(1);
    }
  }

  const db = getFirestore();
  const meetingsRef = db.collection("meetings");

  // 2. Load the failures log to get IDs
  const failuresPath = path.join(__dirname, "enrichment_failures.json");
  if (!fs.existsSync(failuresPath)) {
    console.error("❌ No failure log found at:", failuresPath);
    process.exit(1);
  }

  const failures = JSON.parse(fs.readFileSync(failuresPath, "utf8"));
  console.log(`📂 Loaded ${failures.length} failed/skipped records to retry.`);

  // 3. Helper to clean address (Same robust logic as enrich-addresses.ts)
  const cleanAddress = (addr: string) => {
    if (addr.includes(",")) {
      const parts = addr.split(",").map((p) => p.trim());
      const addressPart = parts.find((p) => /^\d/.test(p));
      if (addressPart) {
        addr = addressPart;
      }
    }
    const firstDigitIndex = addr.search(/\d/);
    if (firstDigitIndex > -1) {
      addr = addr.substring(firstDigitIndex);
    }
    return addr
      .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, "")
      .replace(/[,.]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  /**
   * Build geocoding query strings for an address
   */
  function buildGeoQueries(streetClean: string, city: string, neighborhood?: string): string[] {
    const queries: string[] = [];
    if (neighborhood && neighborhood !== "Nashville" && neighborhood.length > 2) {
      queries.push(`${streetClean}, ${neighborhood}, TN, USA`);
    }
    queries.push(`${streetClean}, ${city}, TN, USA`, `${streetClean}, TN, USA`);
    return queries;
  }

  /**
   * Try geocoding a single query string. Returns {lat, lon} or null.
   */
  async function tryGeocode(query: string): Promise<{ lat: number; lon: number } | null> {
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`;
    const curlCommand = `curl -s -H "User-Agent: ${USER_AGENT}" -H "Referer: https://sonash.app" "${url}"`;
    const responseText = execSync(curlCommand, { encoding: "utf8", maxBuffer: 1024 * 1024 });

    const results = JSON.parse(responseText) as Array<{
      lat: string;
      lon: string;
      address?: Record<string, string>;
    }>;

    if (!results || results.length === 0) return null;

    return {
      lat: Number.parseFloat(results[0].lat),
      lon: Number.parseFloat(results[0].lon),
    };
  }

  /**
   * Retry geocoding for a single failure record. Returns true if resolved.
   */
  async function retryOneFailure(
    docRef: FirebaseFirestore.DocumentReference,
    data: FirebaseFirestore.DocumentData
  ): Promise<boolean> {
    const streetClean = cleanAddress(data.address);
    const queries = buildGeoQueries(streetClean, data.city || "Nashville", data.neighborhood);

    for (const query of queries) {
      try {
        const coords = await tryGeocode(query);
        if (coords) {
          await docRef.update({ coordinates: { lat: coords.lat, lng: coords.lon } });
          console.log(`   ✅ Success! Found: [${coords.lat}, ${coords.lon}]`);
          return true;
        }
        console.log(`   🔸 No results for: "${query}"`);
      } catch (error: unknown) {
        // Query intentionally omitted from logs to avoid exposing address data
        console.error(`   ⚠️ Error querying geocode API`);
        console.error(`      Error details: ${sanitizeError(error)}`);
      }
    }

    return false;
  }

  let successCount = 0;
  let failCount = 0;

  // 4. Loop through failures, fetch latest DB data, and retry
  for (const [index, failure] of failures.entries()) {
    const docId = failure.id;
    const docRef = meetingsRef.doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`[${index + 1}/${failures.length}] ❌ Doc ID not found in DB: ${docId}`);
      continue;
    }

    const data = docSnap.data();
    if (!data || !data.address) {
      console.log(`[${index + 1}/${failures.length}] ⚠️  Skipped (No address in DB): ID ${docId}`);
      continue;
    }

    const streetClean = cleanAddress(data.address);
    console.log(
      `[${index + 1}/${failures.length}] 🔄 Retrying ID: ${docId} | Addr: "${data.address}" -> "${streetClean}"`
    );

    const found = await retryOneFailure(docRef, data);
    if (found) {
      successCount++;
    } else {
      console.log(`   ❌ Still not found.`);
      failCount++;
    }
  }

  console.log("\n============================================================");
  console.log("🎉 Retry Complete");
  console.log(`✅ Fixed/Updated: ${successCount}`);
  console.log(`❌ Still Failed: ${failCount}`);
  console.log("============================================================\n");
} catch (error: unknown) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(1);
}
