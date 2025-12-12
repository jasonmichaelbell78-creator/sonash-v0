import { db } from "../firebase"
import { collection, query, where, getDocs, doc, setDoc, orderBy, writeBatch } from "firebase/firestore"
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
    time: string // "07:00" 24h format
    address: string
    neighborhood: string
    coordinates?: { lat: number; lng: number }
}

export const MeetingsService = {
    // Get meetings for a specific day
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
            return []
        }
    },

    // Get all meetings (for the list view)
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
            return []
        }
    },

    // Dev util to clear meetings
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

    // Seed the database with some sample Nashville meetings (Mock Data)
    async seedInitialMeetings() {
        const batch = writeBatch(db)

        // A mix of meetings across the week with Nashville coordinates
        const seedData: Meeting[] = [
            // Mondays
            { id: "mon_1", name: "East Side Early Risers", type: "AA", day: "Monday", time: "07:00", address: "123 Main St", neighborhood: "East Nashville", coordinates: { lat: 36.1745, lng: -86.7679 } },
            { id: "mon_2", name: "Downtown Lunch Bunch", type: "NA", day: "Monday", time: "12:00", address: "456 Broadway", neighborhood: "Downtown", coordinates: { lat: 36.1627, lng: -86.7816 } },
            { id: "mon_3", name: "West End Serenity", type: "AA", day: "Monday", time: "19:00", address: "789 West End Ave", neighborhood: "West End", coordinates: { lat: 36.1496, lng: -86.8140 } },

            // Tuesdays
            { id: "tue_1", name: "Design for Living", type: "AA", day: "Tuesday", time: "18:30", address: "500 Woodland St", neighborhood: "East Nashville", coordinates: { lat: 36.1750, lng: -86.7660 } },
            { id: "tue_2", name: "Recovery First", type: "NA", day: "Tuesday", time: "20:00", address: "100 Demonbreun", neighborhood: "Gulch", coordinates: { lat: 36.1522, lng: -86.7870 } },

            // Wednesdays (Today in dev env usually)
            { id: "wed_1", name: "Primary Purpose", type: "AA", day: "Wednesday", time: "07:00", address: "123 Main St", neighborhood: "East Nashville", coordinates: { lat: 36.1745, lng: -86.7679 } },
            { id: "wed_2", name: "Mid-Day Reprieve", type: "AA", day: "Wednesday", time: "12:00", address: "Public Library", neighborhood: "Downtown", coordinates: { lat: 36.1619, lng: -86.7781 } },
            { id: "wed_3", name: "Freedom Group", type: "NA", day: "Wednesday", time: "19:30", address: "Community Center", neighborhood: "Germantown", coordinates: { lat: 36.1813, lng: -86.7949 } },
            { id: "wed_4", name: "Candlelight Meeting", type: "AA", day: "Wednesday", time: "22:00", address: "Old Church", neighborhood: "12 South", coordinates: { lat: 36.1289, lng: -86.7874 } },

            // Thursdays
            { id: "thu_1", name: "Big Book Study", type: "AA", day: "Thursday", time: "19:00", address: "University Center", neighborhood: "Belmont", coordinates: { lat: 36.1320, lng: -86.7980 } },

            // Fridays
            { id: "fri_1", name: "TGIF Group", type: "AA", day: "Friday", time: "18:00", address: "Coffee Shop Backroom", neighborhood: "Sylvan Park", coordinates: { lat: 36.1375, lng: -86.8568 } },
            { id: "fri_2", name: "Late Night NA", type: "NA", day: "Friday", time: "23:00", address: "Recovery Hall", neighborhood: "Antioch", coordinates: { lat: 36.0605, lng: -86.6717 } },
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
