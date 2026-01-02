
import * as fs from 'fs';
import * as readline from 'readline';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch'; // Ensure request is installed or use global fetch if available (Node 18+)
import { sanitizeError } from './lib/sanitize-error';

// --- CONFIG ---
const CSV_FILE = "SoNash_Meetings__cleaned.csv";
const SERVICE_ACCOUNT_PATH = "./firebase-service-account.json";
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY; // Optional
const CACHE_FILE = "geocoding_cache.json";
const NOMINATIM_DELAY_MS = 1100; // Respect 1 req/sec policy

// --- FIREBASE INIT ---
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized");
    } catch {
        console.error("Error initializing Firebase Admin. Make sure firebase-service-account.json exists.");
        process.exit(1);
    }
}
const db = getFirestore();

// --- TYPES ---
interface Meeting {
    id: string;
    name: string;
    type: string;
    day: string;
    time: string;
    address: string;
    neighborhood: string;
    coordinates?: { lat: number, lng: number };
}

// --- GEOCODING CACHE ---
let geocodingCache: Record<string, { lat: number, lng: number }> = {};
if (fs.existsSync(CACHE_FILE)) {
    try {
        geocodingCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        console.log(`Loaded ${Object.keys(geocodingCache).length} cached locations.`);
    } catch {
        console.warn("Failed to load cache, starting fresh.");
    }
}

function saveCache() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(geocodingCache, null, 2));
}

// --- GEOCODING HELPERS ---
async function getCoordinates(address: string): Promise<{ lat: number, lng: number } | null> {
    if (geocodingCache[address]) {
        return geocodingCache[address];
    }

    if (GOOGLE_MAPS_KEY) {
        // Google Maps Geocoding
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
        try {
            const res = await fetch(url);
            const data: { status: string; results?: Array<{ geometry: { location: { lat: number; lng: number } } }> } = await res.json();
            if (data.status === 'OK' && data.results && data.results[0]) {
                const loc = data.results[0].geometry.location;
                geocodingCache[address] = loc;
                return loc;
            } else {
                console.error(`Google Geocode Error for ${address}: ${data.status}`);
            }
        } catch (e) {
            console.error("Google API Fetch Error:", e);
        }
    } else {
        // Nominatim Geocoding (OpenStreetMap)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        try {
            await new Promise(r => setTimeout(r, NOMINATIM_DELAY_MS)); // Rate limit
            const res = await fetch(url, { headers: { 'User-Agent': 'SonashApp/1.0' } });
            const data: Array<{ lat: string; lon: string }> = await res.json();
            if (data && data.length > 0) {
                const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                geocodingCache[address] = loc;
                process.stdout.write("."); // Progress dot
                return loc;
            } else {
                process.stdout.write("x"); // Miss
            }
        } catch (e) {
            console.error("Nominatim Fetch Error:", e);
        }
    }
    return null;
}

// --- PARSING & PROCESSING ---
// Naive CSV split that handles basic quotes if needed, but for now standard split is likely fine ensuring we handle the address column correctly.
// CSV Headers: Fellowship,Day,Time,Meeting Name,Location,Address,City/Region

async function processLine(line: string, index: number): Promise<Meeting | null> {
    const parts = line.split(',');
    // Simple parsing - adjust if CSV has commas inside quotes
    if (parts.length < 7) return null;

    const type = parts[0].trim();
    const day = parts[1].trim();
    const time = parts[2].trim(); // Needs conversion to 24h? App expects "19:00" usually
    const name = parts[3].trim();
    const locationName = parts[4].trim();
    const streetAddress = parts[5].trim();
    const city = parts[6].trim();

    // Standardize Time to HH:MM (24h)
    let time24 = time;
    if (time.toLowerCase().includes("pm") || time.toLowerCase().includes("am")) {
        // Basic converter
        const [timePart, modifier] = time.split(' ');
        const [hours, minutes] = timePart.split(':');
        if (modifier.toLowerCase() === 'pm' && hours !== '12') hours = String(parseInt(hours) + 12);
        if (modifier.toLowerCase() === 'am' && hours === '12') hours = '00';
        time24 = `${hours.padStart(2, '0')}:${(minutes || '00')}`;
    }

    const fullAddress = `${streetAddress}, ${city}, TN`;
    const coords = await getCoordinates(fullAddress);

    // Infer neighborhood from City/Region or Location if possible, else "Unknown"
    // Since we don't have a neighborhood column, we might leave it generic or inferred by geocoding response if using Google.
    // For now, let's just say "Nashville" or try to guess.
    let neighborhood = "Greater Nashville";
    if (locationName.includes("East")) neighborhood = "East Nashville";
    if (city.includes("Madison")) neighborhood = "Madison";
    if (city.includes("Antioch")) neighborhood = "Antioch";

    return {
        id: `real_${index}`,
        name: `${name} @ ${locationName}`,
        type,
        day,
        time: time24,
        address: fullAddress,
        neighborhood,
        coordinates: coords || undefined
    };
}

async function main() {
    console.log(`Starting Import... Mode: ${GOOGLE_MAPS_KEY ? "FAST (Google)" : "SLOW (Nominatim)"}`);

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const meetings: Meeting[] = [];
    let i = 0;

    // Read all lines first
    const lines: string[] = [];
    for await (const line of rl) {
        if (i === 0) { i++; continue; } // Skip header
        lines.push(line);
        i++;
    }

    console.log(`Found ${lines.length} meetings. Extracting unique addresses...`);

    // Process in chunks to save cache periodically
    const BATCH_SIZE = 10;
    for (let j = 0; j < lines.length; j += BATCH_SIZE) {
        const chunk = lines.slice(j, j + BATCH_SIZE);
        const promises = chunk.map((line, idx) => processLine(line, j + idx));
        const results = await Promise.all(promises);

        results.forEach(m => {
            if (m) meetings.push(m);
        });

        // Save cache every batch
        if (j % 50 === 0) {
            saveCache();
            console.log(`\nProcessed ${j}/${lines.length}...`);
        }
    }

    saveCache();
    console.log(`\nGeocoding complete. Uploading ${meetings.length} meetings to Firestore...`);

    // Upload to Firestore
    const WRITE_BATCH_SIZE = 400;
    const chunks = [];
    for (let k = 0; k < meetings.length; k += WRITE_BATCH_SIZE) {
        chunks.push(meetings.slice(k, k + WRITE_BATCH_SIZE));
    }

    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach(meeting => {
            const ref = db.collection('meetings').doc(meeting.id);
            batch.set(ref, meeting);
        });
        await batch.commit();
        process.stdout.write("^");
    }

    console.log("\nDone! Success.");
}

main().catch((error: unknown) => {
    console.error('❌ Unexpected error:', sanitizeError(error));
    process.exit(1);
});
