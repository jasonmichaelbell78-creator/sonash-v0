
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Nominatim Config
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SonashApp_Migration/1.0 (jason@example.com)'; // Replace with real email if possible

async function retryFailures() {
    console.log('🚀 Starting Retry for Failed Addresses...\n');

    // 1. Initialize Firebase
    if (getApps().length === 0) {
        try {
            const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log('✅ Firebase Admin initialized');
        } catch (error: any) {
            console.error('❌ Failed to initialize Firebase Admin:', error);
            process.exit(1);
        }
    }

    const db = getFirestore();
    const meetingsRef = db.collection('meetings');

    // 2. Load the failures log to get IDs
    const failuresPath = path.join(__dirname, 'enrichment_failures.json');
    if (!fs.existsSync(failuresPath)) {
        console.error('❌ No failure log found at:', failuresPath);
        process.exit(1);
    }

    const failures = JSON.parse(fs.readFileSync(failuresPath, 'utf8'));
    console.log(`📂 Loaded ${failures.length} failed/skipped records to retry.`);

    // 3. Helper to clean address (Same robust logic as enrich-addresses.ts)
    const cleanAddress = (addr: string) => {
        if (addr.includes(',')) {
            const parts = addr.split(',').map(p => p.trim());
            const addressPart = parts.find(p => /^\d/.test(p));
            if (addressPart) {
                addr = addressPart;
            }
        }
        const firstDigitIndex = addr.search(/\d/);
        if (firstDigitIndex > -1) {
            addr = addr.substring(firstDigitIndex);
        }
        return addr
            .replace(/(?:apt|suite|unit|ste|#)\.?\s*[\w-]+/gi, '')
            .replace(/[,.]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

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

        // Use the LATEST address from DB (in case user fixed it manually in Admin UI)
        const currentAddress = data.address; // Should be the fixed version
        const streetClean = cleanAddress(currentAddress);
        const currentCity = data.city || 'Nashville';
        const neighborhood = data.neighborhood;

        console.log(`[${index + 1}/${failures.length}] 🔄 Retrying ID: ${docId} | Addr: "${currentAddress}" -> "${streetClean}"`);

        const queries = [];
        if (neighborhood && neighborhood !== 'Nashville' && neighborhood.length > 2) {
            queries.push(`${streetClean}, ${neighborhood}, TN, USA`);
        }
        queries.push(`${streetClean}, ${currentCity}, TN, USA`);
        queries.push(`${streetClean}, TN, USA`);

        let found = false;

        for (const query of queries) {
            if (found) break;

            try {
                // Rate limit - Increased to 2500ms to avoid OpenStreetMap rate limiting
                await new Promise(resolve => setTimeout(resolve, 2500));

                const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`;
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': USER_AGENT,
                        'Referer': 'https://sonash.app' // Good practice for OSM
                    }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

                const results = await response.json() as any[];

                if (results && results.length > 0) {
                    const result = results[0];
                    const addrInfo = result.address; // Might need detailed 'addressdetails=1' if using reverse param, but standard search returns basics

                    // Note: 'search' endpoint JSON result structure usually has 'lat', 'lon', 'display_name'. 
                    // To get decomposed address (zip, city) reliably, we usually need '&addressdetails=1'.
                    // Let's ensure we fetch details if we want new zip.
                    // Actually, let's just use the coordinates found and maybe update zip/city if we can extract them?
                    // Nominatim 'search' output with 'addressdetails=1' is best.

                    // Let's refine the fetch URL slightly to be sure we get address parts
                    // (The previous script might have relied on implicit structure or just coordinates)
                    // If we just want coordinates, result.lat/lon is enough.

                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);

                    await docRef.update({
                        coordinates: { lat, lng: lon }
                    });

                    console.log(`   ✅ Success! Found: [${lat}, ${lon}]`);
                    successCount++;
                    found = true;
                } else {
                    // Log empty result key for debugging
                    console.log(`   🔸 No results for: "${query}"`);
                }
            } catch (error: any) {
                console.error(`   ⚠️ Error querying: "${query}"`);
                console.error(`      Error details: ${error.message}`);
            }
        }

        if (!found) {
            console.log(`   ❌ Still not found.`);
            failCount++;
        }
    }

    console.log('\n============================================================');
    console.log('🎉 Retry Complete');
    console.log(`✅ Fixed/Updated: ${successCount}`);
    console.log(`❌ Still Failed: ${failCount}`);
    console.log('============================================================\n');
}

retryFailures().catch(console.error);
