/**
 * Seed Meetings Script (Admin SDK)
 * 
 * Imports meetings from CSV file into Firestore using Admin SDK.
 * Usage: npx tsx scripts/seed-meetings.ts
 */

import admin from "firebase-admin"
import { readFileSync } from "fs"
import { join } from "path"
import { sanitizeError } from "./lib/sanitize-error.js"

// Initialize Firebase Admin
const serviceAccountPath = join(process.cwd(), "firebase-service-account.json")
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

interface Meeting {
    id: string
    name: string
    type: string
    day: string
    time: string
    address: string
    neighborhood: string
    coordinates?: {
        lat: number
        lng: number
    }
}

function parseTime(timeStr: string): string {
    // Convert 7:30 PM to 19:30
    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return timeStr

    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const period = match[3].toUpperCase()

    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    return `${hours.toString().padStart(2, '0')}:${minutes}`
}

// Load Geocoding Cache
const cachePath = join(process.cwd(), "geocoding_cache.json")
const geocodingCache: Record<string, { lat: number, lng: number }> =
    JSON.parse(readFileSync(cachePath, "utf-8"))

async function importMeetings() {
    const csvPath = join(process.cwd(), "SoNash_Meetings__cleaned.csv")
    const rawData = readFileSync(csvPath, "utf-8")
    const lines = rawData.split("\n")

    // Skip header
    const dataLines = lines.slice(1).filter(l => l.trim().length > 0)

    console.log(`Found ${dataLines.length} meetings to import.`)

    const batchSize = 500
    let batch = db.batch()
    let count = 0
    let totalImported = 0

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]

        // CSV split handling quotes
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ''))

        if (cols.length < 7) {
            console.warn(`Skipping invalid line ${i + 2}: ${line}`)
            continue
        }

        const [fellowship, day, time, name, location, address, region] = cols

        // Construct cache key: "Address, City, TN"
        const cacheKey = `${address}, ${region}, TN`
        const coordinates = geocodingCache[cacheKey] || geocodingCache[`${address}, ${region}`]

        if (!coordinates) {
            // console.warn(`Missing coordinates for: ${cacheKey}`)
        }

        const meetingId = `csv_${i}`
        const meeting: Meeting = {
            id: meetingId,
            name: name,
            type: fellowship,
            day: day,
            time: parseTime(time),
            address: location ? `${location}, ${address}` : address,
            neighborhood: region
        }

        if (coordinates) {
            meeting.coordinates = { lat: coordinates.lat, lng: coordinates.lng }
        }

        const docRef = db.collection("meetings").doc(meetingId)
        batch.set(docRef, meeting)
        count++
        totalImported++

        if (count >= batchSize) {
            await batch.commit()
            console.log(`Committed batch of ${count} meetings.`)
            batch = db.batch()
            count = 0
        }
    }

    if (count > 0) {
        await batch.commit()
        console.log(`Committed final batch of ${count} meetings.`)
    }

    console.log(`✅ Successfully imported ${totalImported} meetings.`)
    process.exit(0)
}

importMeetings().catch(error => {
    // Use sanitizeError to avoid exposing sensitive paths
    console.error("❌ Import failed:", sanitizeError(error))
    process.exit(1)
})
