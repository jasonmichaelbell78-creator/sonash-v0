
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Meeting {
    id: string
    name: string
    type: string
    day: string
    time: string
    address: string
    neighborhood: string
}

function parseTime(timeStr: string): string {
    // Convert 7:30 PM to 19:30
    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return timeStr; // Return as is if not matching expected format

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

async function importMeetings() {
    const csvPath = path.join(process.cwd(), "SoNash_Meetings__cleaned.csv");
    const rawData = fs.readFileSync(csvPath, "utf-8");
    const lines = rawData.split("\n");

    // Skip header
    const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

    console.log(`Found ${dataLines.length} meetings to import.`);

    const batchSize = 500;
    let batch = writeBatch(db);
    let count = 0;
    let totalImported = 0;

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        // Simple CSV split (assuming no commas in fields for now, or handle quotes if simple split fails)
        // The file has standard format, let's try regex for quoted CSV or simple split if quotes aren't used for commas
        // "New,New Horizons" is in line 123. We need a regex splitter.
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Actually, let's use a simpler regex that handles the commas inside quotes
        // Split by comma, but ignore commas inside quotes
        const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

        // Better regex for CSV splitting
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ''));

        if (cols.length < 7) {
            console.warn(`Skipping invalid line ${i + 2}: ${line}`);
            continue;
        }

        const [fellowship, day, time, name, location, address, region] = cols;

        const meetingId = `csv_${i}`;
        const meeting: Meeting = {
            id: meetingId,
            type: fellowship,
            day: day,
            time: parseTime(time),
            name: name,
            address: location ? `${location}, ${address}` : address,
            neighborhood: region
        };

        const docRef = doc(collection(db, "meetings"), meetingId);
        batch.set(docRef, meeting);
        count++;
        totalImported++;

        if (count >= batchSize) {
            await batch.commit();
            console.log(`Committed batch of ${count} meetings.`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${count} meetings.`);
    }

    console.log(`Successfully imported ${totalImported} meetings.`);
}

importMeetings().catch(console.error);
