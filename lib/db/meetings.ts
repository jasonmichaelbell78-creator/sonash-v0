import { db } from "../firebase"
import { collection, query, where, getDocs, doc, writeBatch, limit, startAfter, orderBy, QueryDocumentSnapshot } from "firebase/firestore"
import { logger } from "../logger"
import { DAY_ORDER } from "../constants"

/**
 * Parse time string to minutes since midnight for robust sorting
 * Handles both 24-hour format ("07:00", "19:30") and 12-hour format ("7:00 AM", "7:30 PM")
 */
function timeToMinutes(timeStr: string): number {
    try {
        // Remove whitespace
        const cleaned = timeStr.trim()

        // Check if 12-hour format (contains AM/PM)
        const is12Hour = /AM|PM/i.test(cleaned)

        if (is12Hour) {
            // Parse 12-hour format
            const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
            if (!match) return 0

            let hours = parseInt(match[1], 10)
            const minutes = parseInt(match[2], 10)
            const period = match[3].toUpperCase()

            // Convert to 24-hour
            if (period === 'PM' && hours !== 12) hours += 12
            if (period === 'AM' && hours === 12) hours = 0

            return hours * 60 + minutes
        } else {
            // Parse 24-hour format
            const parts = cleaned.split(':')
            if (parts.length !== 2) return 0

            const hours = parseInt(parts[0], 10)
            const minutes = parseInt(parts[1], 10)

            if (isNaN(hours) || isNaN(minutes)) return 0
            return hours * 60 + minutes
        }
    } catch {
        return 0 // Fallback for invalid formats
    }
}

export interface Meeting {
    id: string
    name: string
    type: "AA" | "NA" | "CA" | "Smart" | "Al-Anon"
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
    dayIndex: number // 0=Sunday, 1=Monday, ..., 6=Saturday (for proper week-order sorting)
    time: string // "07:00" 24h format
    address: string // Street address (e.g. "123 Main St")
    city?: string // Default: "Nashville"
    state?: string // Default: "TN"
    zip?: string
    neighborhood: string
    coordinates?: { lat: number; lng: number }
    [key: string]: unknown
}

export interface MeetingsPaginatedResult {
    meetings: Meeting[]
    lastDoc: QueryDocumentSnapshot | null
    hasMore: boolean
    totalFetched: number
}

export const MeetingsService = {
    /**
     * Get meetings for a specific day
     * @param day - Full day name (e.g., "Monday")
     * @returns Array of meetings sorted by time
     */
    async getMeetingsByDay(day: string): Promise<Meeting[]> {
        try {
            // Basic query index logic might be needed for compound queries (day + time)
            // For now, sorting by time client-side might be safer until index is built,
            // but let's try server-side sort if we can.
            const meetingsRef = collection(db, "meetings")
            const q = query(
                meetingsRef,
                where("day", "==", day)
                // orderBy("time", "asc") // Requires index, might fail first time. Let's do client sort for safety if index missing.
            )

            const snapshot = await getDocs(q)
            const meetings = snapshot.docs.map(d => d.data() as Meeting)

            // Sort by time using proper time parsing (handles both 24h and 12h formats)
            return meetings.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        } catch (error) {
            logger.error("Error fetching meetings", { error, day })
            // Throw instead of returning empty array so UI can show proper error message
            throw new Error(`Failed to load meetings for ${day}. Please check your connection and try again.`)
        }
    },

    /**
     * Get all meetings (DEPRECATED)
     * Use getAllMeetingsPaginated for better performance on large datasets.
     * @deprecated
     */
    async getAllMeetings(): Promise<Meeting[]> {
        try {
            const meetingsRef = collection(db, "meetings")
            const snapshot = await getDocs(meetingsRef)
            const meetings = snapshot.docs.map(d => d.data() as Meeting)
            // Sort by day then time (using proper time parsing)
            return meetings.sort((a, b) => {
                const dayDiff = (DAY_ORDER[a.day] || 0) - (DAY_ORDER[b.day] || 0)
                if (dayDiff !== 0) return dayDiff
                return timeToMinutes(a.time) - timeToMinutes(b.time)
            })
        } catch (error) {
            logger.error("Error fetching all meetings", { error })
            // Throw instead of returning empty array so UI can show proper error message
            throw new Error("Failed to load meetings. Please check your connection and try again.")
        }
    },

    /**
     * Get all meetings with pagination (RECOMMENDED)
     * Queries Firestore using a composite index on [dayIndex, time] for correct week-order sorting.
     * 
     * @param pageSize - Number of items to fetch (default 50)
     * @param lastDocument - Last document from previous page (for cursor pagination)
     * @returns Paginated result with meetings and cursor
     */
    async getAllMeetingsPaginated(
        pageSize: number = 50,
        lastDocument?: QueryDocumentSnapshot
    ): Promise<MeetingsPaginatedResult> {
        try {
            const meetingsRef = collection(db, "meetings")

            // Build query with server-side ordering by dayIndex and time
            // dayIndex is numeric (0=Sunday, 1=Monday, ..., 6=Saturday) for proper week-order sorting
            // This requires a composite index on [dayIndex, time] defined in firestore.indexes.json
            let q = query(
                meetingsRef,
                orderBy("dayIndex", "asc"),
                orderBy("time", "asc"),
                limit(pageSize)
            )

            // If continuing from previous page, start after the last document
            if (lastDocument) {
                q = query(
                    meetingsRef,
                    orderBy("dayIndex", "asc"),
                    orderBy("time", "asc"),
                    startAfter(lastDocument),
                    limit(pageSize)
                )
            }

            const snapshot = await getDocs(q)
            const meetings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Meeting))

            // CRITICAL: Do NOT re-sort client-side in paginated queries!
            // Re-sorting breaks cursor-based pagination because the UI order diverges from
            // the server's cursor order, causing skipped or duplicated items across pages.
            // The query already returns meetings in correct week-order (Sun->Sat) via dayIndex.

            const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
            const hasMore = snapshot.docs.length === pageSize

            return {
                meetings,
                lastDoc,
                hasMore,
                totalFetched: meetings.length
            }
        } catch (error) {
            logger.error("Error fetching paginated meetings", { error })
            // Throw instead of returning empty result so UI can show proper error message
            throw new Error("Failed to load meetings. Please check your connection and try again.")
        }
    },

    /**
     * Dev utility to clear all meetings from the database
     * @returns true if successful
     */
    async clearAllMeetings() {
        try {
            const batch = writeBatch(db)
            const snapshot = await getDocs(collection(db, "meetings"))
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref)
            })
            await batch.commit()
            return true
        } catch (error) {
            logger.error("Error clearing meetings", { error })
            return false
        }
    },

    /**
     * Seed the database with sample Nashville meetings
     * Contains a mix of AA/NA meetings across the week with coordinates.
     * @returns true if successful
     */
    async seedInitialMeetings() {
        const batch = writeBatch(db)

        // A mix of meetings across the week with Nashville coordinates
        const seedData: Meeting[] = [
            // MONDAYS (dayIndex=1)
            { id: "mon_1", name: "East Side Early Risers", type: "AA", day: "Monday", dayIndex: 1, time: "07:00", address: "123 Main St", city: "Nashville", state: "TN", zip: "", neighborhood: "East Nashville", coordinates: { lat: 36.1745, lng: -86.7679 } },
            { id: "mon_2", name: "Downtown Lunch Bunch", type: "NA", day: "Monday", dayIndex: 1, time: "12:00", address: "456 Broadway", city: "Nashville", state: "TN", zip: "", neighborhood: "Downtown", coordinates: { lat: 36.1627, lng: -86.7816 } },
            { id: "mon_3", name: "West End Serenity", type: "AA", day: "Monday", dayIndex: 1, time: "19:00", address: "789 West End Ave", city: "Nashville", state: "TN", zip: "", neighborhood: "West End", coordinates: { lat: 36.1496, lng: -86.8140 } },
            { id: "mon_4", name: "Madison Recovery", type: "NA", day: "Monday", dayIndex: 1, time: "19:30", address: "500 Gallatin Pike", city: "Nashville", state: "TN", zip: "", neighborhood: "Madison", coordinates: { lat: 36.2510, lng: -86.7130 } },
            { id: "mon_5", name: "Green Hills Women", type: "AA", day: "Monday", dayIndex: 1, time: "18:00", address: "2000 Hillsboro Rd", city: "Nashville", state: "TN", zip: "", neighborhood: "Green Hills", coordinates: { lat: 36.1050, lng: -86.8150 } },

            // TUESDAYS (dayIndex=2)
            { id: "tue_1", name: "Design for Living", type: "AA", day: "Tuesday", dayIndex: 2, time: "18:30", address: "500 Woodland St", city: "Nashville", state: "TN", zip: "", neighborhood: "East Nashville", coordinates: { lat: 36.1750, lng: -86.7660 } },
            { id: "tue_2", name: "Recovery First", type: "NA", day: "Tuesday", dayIndex: 2, time: "20:00", address: "100 Demonbreun", city: "Nashville", state: "TN", zip: "", neighborhood: "Gulch", coordinates: { lat: 36.1522, lng: -86.7870 } },
            { id: "tue_3", name: "Sylvan Park Study", type: "AA", day: "Tuesday", dayIndex: 2, time: "19:00", address: "4200 Murphy Rd", city: "Nashville", state: "TN", zip: "", neighborhood: "Sylvan Park", coordinates: { lat: 36.1380, lng: -86.8450 } },
            { id: "tue_4", name: "Antioch New Life", type: "NA", day: "Tuesday", dayIndex: 2, time: "19:00", address: "5000 Bell Rd", city: "Nashville", state: "TN", zip: "", neighborhood: "Antioch", coordinates: { lat: 36.0500, lng: -86.6600 } },

            // WEDNESDAYS (dayIndex=3)
            { id: "wed_1", name: "Primary Purpose", type: "AA", day: "Wednesday", dayIndex: 3, time: "07:00", address: "123 Main St", city: "Nashville", state: "TN", zip: "", neighborhood: "East Nashville", coordinates: { lat: 36.1745, lng: -86.7679 } },
            { id: "wed_2", name: "Mid-Day Reprieve", type: "AA", day: "Wednesday", dayIndex: 3, time: "12:00", address: "Public Library", city: "Nashville", state: "TN", zip: "", neighborhood: "Downtown", coordinates: { lat: 36.1619, lng: -86.7781 } },
            { id: "wed_3", name: "Freedom Group", type: "NA", day: "Wednesday", dayIndex: 3, time: "19:30", address: "Community Center", city: "Nashville", state: "TN", zip: "", neighborhood: "Germantown", coordinates: { lat: 36.1813, lng: -86.7949 } },
            { id: "wed_4", name: "Candlelight Meeting", type: "AA", day: "Wednesday", dayIndex: 3, time: "22:00", address: "Old Church", city: "Nashville", state: "TN", zip: "", neighborhood: "12 South", coordinates: { lat: 36.1289, lng: -86.7874 } },
            { id: "wed_5", name: "Belmont Book Study", type: "AA", day: "Wednesday", dayIndex: 3, time: "18:00", address: "1900 Belmont Blvd", city: "Nashville", state: "TN", zip: "", neighborhood: "Belmont", coordinates: { lat: 36.1325, lng: -86.7950 } },

            // THURSDAYS (dayIndex=4)
            { id: "thu_1", name: "Big Book Study", type: "AA", day: "Thursday", dayIndex: 4, time: "19:00", address: "University Center", city: "Nashville", state: "TN", zip: "", neighborhood: "Belmont", coordinates: { lat: 36.1320, lng: -86.7980 } },
            { id: "thu_2", name: "Nations Newcomers", type: "NA", day: "Thursday", dayIndex: 4, time: "18:30", address: "5000 Centennial Blvd", city: "Nashville", state: "TN", zip: "", neighborhood: "The Nations", coordinates: { lat: 36.1600, lng: -86.8450 } },
            { id: "thu_3", name: "Downtown Speaker", type: "AA", day: "Thursday", dayIndex: 4, time: "20:00", address: "111 Broadway", city: "Nashville", state: "TN", zip: "", neighborhood: "Downtown", coordinates: { lat: 36.1600, lng: -86.7750 } },

            // FRIDAYS (dayIndex=5)
            { id: "fri_1", name: "TGIF Group", type: "AA", day: "Friday", dayIndex: 5, time: "18:00", address: "Coffee Shop Backroom", city: "Nashville", state: "TN", zip: "", neighborhood: "Sylvan Park", coordinates: { lat: 36.1375, lng: -86.8568 } },
            { id: "fri_2", name: "Late Night NA", type: "NA", day: "Friday", dayIndex: 5, time: "23:00", address: "Recovery Hall", city: "Nashville", state: "TN", zip: "", neighborhood: "Antioch", coordinates: { lat: 36.0605, lng: -86.6717 } },
            { id: "fri_3", name: "East Side Social", type: "AA", day: "Friday", dayIndex: 5, time: "19:00", address: "900 Gallatin Ave", city: "Nashville", state: "TN", zip: "", neighborhood: "East Nashville", coordinates: { lat: 36.1850, lng: -86.7550 } },

            // WEEKENDS (dayIndex: Saturday=6, Sunday=0)
            { id: "sat_1", name: "Weekend Warriors", type: "AA", day: "Saturday", dayIndex: 6, time: "10:00", address: "Centennial Park", city: "Nashville", state: "TN", zip: "", neighborhood: "West End", coordinates: { lat: 36.1480, lng: -86.8150 } },
            { id: "sat_2", name: "Saturday Night Live", type: "NA", day: "Saturday", dayIndex: 6, time: "20:00", address: "500 Woodland St", city: "Nashville", state: "TN", zip: "", neighborhood: "East Nashville", coordinates: { lat: 36.1750, lng: -86.7660 } },
            { id: "sun_1", name: "Spiritual Breakfast", type: "AA", day: "Sunday", dayIndex: 0, time: "09:00", address: "Community Center", city: "Nashville", state: "TN", zip: "", neighborhood: "Germantown", coordinates: { lat: 36.1780, lng: -86.7900 } },
            { id: "sun_2", name: "Sunday Serenity", type: "AA", day: "Sunday", dayIndex: 0, time: "18:00", address: "2000 Hillsboro Rd", city: "Nashville", state: "TN", zip: "", neighborhood: "Green Hills", coordinates: { lat: 36.1050, lng: -86.8150 } },
        ]

        try {
            seedData.forEach(meeting => {
                const docRef = doc(db, "meetings", meeting.id)
                batch.set(docRef, meeting)
            })

            await batch.commit()
            logger.info("Meetings seeded successfully")
            return true
        } catch (error) {
            logger.error("Error seeding meetings", { error })
            return false
        }
    }
}
