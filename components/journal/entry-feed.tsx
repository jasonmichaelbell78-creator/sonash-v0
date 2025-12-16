"use client"

import { useState, useMemo } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EntryCard, JournalEntry } from "./entry-card"
import { JournalFilterType } from "./journal-sidebar"
import { format, isSameDay } from "date-fns"

interface EntryFeedProps {
    entries: JournalEntry[]
    filter: JournalFilterType
}

export function EntryFeed({ entries, filter }: EntryFeedProps) {
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredEntries = useMemo(() => {
        return entries
            .filter(entry => {
                // 1. Type Filter
                if (filter !== 'all' && entry.type !== filter) return false

                // 2. Search Filter (Basic text match)
                if (!searchQuery) return true

                const query = searchQuery.toLowerCase()
                const dataString = JSON.stringify(entry.data).toLowerCase()
                return dataString.includes(query)
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime())
    }, [entries, filter, searchQuery])

    // Group by Date for display
    const groupedEntries = useMemo(() => {
        const groups: { [key: string]: JournalEntry[] } = {}
        filteredEntries.forEach(entry => {
            const dateKey = format(entry.date, "yyyy-MM-dd")
            if (!groups[dateKey]) groups[dateKey] = []
            groups[dateKey].push(entry)
        })
        return groups
    }, [filteredEntries])

    if (filteredEntries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No entries found</h3>
                <p className="mt-1 text-sm">
                    {searchQuery ? "Try adjusting your search terms" : "Start your recovery journal today"}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            {/* Feed */}
            <div className="space-y-8">
                {Object.entries(groupedEntries).sort((a, b) => b[0].localeCompare(a[0])).map(([dateKey, daysEntries]) => {
                    const dateObj = new Date(dateKey + 'T12:00:00') // Force noon to avoid TZ shift issues for display
                    return (
                        <div key={dateKey} className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-[#fbf9f5] py-2 z-10">
                                {format(dateObj, "EEEE, MMMM do, yyyy")}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                {daysEntries.map(entry => (
                                    <EntryCard
                                        key={entry.id}
                                        entry={entry}
                                        onClick={() => setSelectedEntry(entry)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Detail Dialog */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 capitalize">{selectedEntry.type.replace('-', ' ')}</h3>
                                <p className="text-sm text-slate-500">{format(selectedEntry.date, "PPP p")}</p>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {/* Render logic can be reused or simplified here */}
                            {JSON.stringify(selectedEntry.data, null, 2)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
