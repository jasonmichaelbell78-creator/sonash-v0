"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService, type DailyLog } from "@/lib/firestore-service"
import { Loader2 } from "lucide-react"
import { JournalSidebar, JournalFilterType } from "@/components/journal/journal-sidebar"
import { EntryFeed } from "@/components/journal/entry-feed"
import { JournalEntry } from "@/components/journal/entry-card"

export default function JournalPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [filter, setFilter] = useState<JournalFilterType>('all')

    useEffect(() => {
        async function fetchAllData() {
            if (!user) return

            try {
                // Fetch both collections in parallel
                const [logsRes, inventoryRes] = await Promise.all([
                    FirestoreService.getHistory(user.uid),
                    FirestoreService.getInventoryEntries(user.uid, 50)
                ])

                const logs = logsRes.entries.flatMap((log: DailyLog) => {
                    const entries: JournalEntry[] = []

                    // 1. The Daily Check-in (Mood/Stats)
                    entries.push({
                        id: `${log.id}_checkin`,
                        type: 'daily-log',
                        date: new Date(log.dateId + 'T12:00:00'),
                        data: log
                    })

                    // 2. The Notepad Entry (Text Content) - treated as separate log
                    if (log.content && log.content.trim().length > 0) {
                        entries.push({
                            id: `${log.id}_notepad`,
                            type: 'notepad',
                            date: new Date(log.dateId + 'T12:05:00'), // Slightly after check-in
                            data: { ...log, type: 'notepad' } // Pass data but override type for rendering
                        })
                    }

                    return entries
                }) as JournalEntry[]

                const inventory = inventoryRes.entries.map((item: { id: string; type: string; createdAt?: { toDate: () => Date }; data: Record<string, unknown> }) => ({
                    id: item.id,
                    type: item.type, // 'spot-check' | 'night-review' | 'gratitude'
                    date: item.createdAt?.toDate() || new Date(),
                    data: item.data
                })) as JournalEntry[]

                // Merge and sort
                const all = [...logs, ...inventory].sort((a, b) => b.date.getTime() - a.date.getTime())
                setEntries(all)
            } catch (error) {
                console.error("Failed to fetch journal", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [user])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <div className="container max-w-6xl py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar (Desktop) */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <JournalSidebar
                        activeFilter={filter}
                        onFilterChange={setFilter}
                        className="sticky top-20"
                    />
                </aside>

                {/* Mobile Filter (Horizontal) */}
                <div className="lg:hidden">
                    <JournalSidebar
                        activeFilter={filter}
                        onFilterChange={setFilter}
                    />
                </div>

                {/* Main Feed */}
                <main className="flex-1">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold font-handlee text-slate-900">
                            Recovery Repository
                        </h1>
                        <p className="text-slate-500">
                            Your secure history of logs, spot checks, and reviews.
                        </p>
                    </div>

                    <EntryFeed entries={entries} filter={filter} />
                </main>
            </div>
        </div>
    )
}
