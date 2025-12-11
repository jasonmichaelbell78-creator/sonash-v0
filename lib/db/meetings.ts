import { db } from "../firebase"
import { collection, query, where, getDocs, doc, setDoc, orderBy, writeBatch } from "firebase/firestore"
import { logger } from "../logger"

export interface Meeting {
    id: string
    name: string
    type: "AA" | "NA" | "Smart" | "Al-Anon"
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

            // Sort by time explicitly
            return meetings.sort((a, b) => a.time.localeCompare(b.time))
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
            // Sort by day then time
            const dayOrder = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7 }
            return meetings.sort((a, b) => {
                const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0)
                if (dayDiff !== 0) return dayDiff
                return a.time.localeCompare(b.time)
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

        // A mix of meetings across the week
        const seedData: Meeting[] = [
            // Mondays
            { id: "mon_1", name: "East Side Early Risers", type: "AA", day: "Monday", time: "07:00", address: "123 Main St", neighborhood: "East Nashville" },
            { id: "mon_2", name: "Downtown Lunch Bunch", type: "NA", day: "Monday", time: "12:00", address: "456 Broadway", neighborhood: "Downtown" },
            { id: "mon_3", name: "West End Serenity", type: "AA", day: "Monday", time: "19:00", address: "789 West End Ave", neighborhood: "West End" },

            // Tuesdays
            { id: "tue_1", name: "Design for Living", type: "AA", day: "Tuesday", time: "18:30", address: "500 Woodland St", neighborhood: "East Nashville" },
            { id: "tue_2", name: "Recovery First", type: "NA", day: "Tuesday", time: "20:00", address: "100 Demonbreun", neighborhood: "Gulch" },

            // Wednesdays (Today in dev env usually)
            { id: "wed_1", name: "Primary Purpose", type: "AA", day: "Wednesday", time: "07:00", address: "123 Main St", neighborhood: "East Nashville" },
            { id: "wed_2", name: "Mid-Day Reprieve", type: "AA", day: "Wednesday", time: "12:00", address: "Public Library", neighborhood: "Downtown" },
            { id: "wed_3", name: "Freedom Group", type: "NA", day: "Wednesday", time: "19:30", address: "Community Center", neighborhood: "Germantown" },
            { id: "wed_4", name: "Candlelight Meeting", type: "AA", day: "Wednesday", time: "22:00", address: "Old Church", neighborhood: "12 South" },

            // Thursdays
            { id: "thu_1", name: "Big Book Study", type: "AA", day: "Thursday", time: "19:00", address: "University Center", neighborhood: "Belmont" },

            // Fridays
            { id: "fri_1", name: "TGIF Group", type: "AA", day: "Friday", time: "18:00", address: "Coffee Shop Backroom", neighborhood: "Sylvan Park" },
            { id: "fri_2", name: "Late Night NA", type: "NA", day: "Friday", time: "23:00", address: "Recovery Hall", neighborhood: "Antioch" },
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
