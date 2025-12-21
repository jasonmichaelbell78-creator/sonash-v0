"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { EntryCard } from "./entry-card"
import { JournalEntry } from "@/types/journal"
import { JournalFilterType } from "./journal-sidebar"
import { format } from "date-fns"

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

                if (entry.type === 'mood') {
                    const moodMatch = entry.data.mood.toLowerCase().includes(query)
                    const noteMatch = entry.data.note?.toLowerCase().includes(query) || false
                    return moodMatch || noteMatch
                }

                if (entry.type === 'gratitude') {
                    return entry.data.items.some(item => item.toLowerCase().includes(query))
                }

                if (entry.type === 'inventory') {
                    const resentments = entry.data.resentments.toLowerCase().includes(query)
                    const dishonesty = entry.data.dishonesty.toLowerCase().includes(query)
                    const apologies = entry.data.apologies.toLowerCase().includes(query)
                    const successes = entry.data.successes.toLowerCase().includes(query)
                    return resentments || dishonesty || apologies || successes
                }

                if (entry.type === 'free-write' || entry.type === 'meeting-note') {
                    const titleMatch = entry.data.title.toLowerCase().includes(query)
                    const contentMatch = entry.data.content.toLowerCase().includes(query)
                    return titleMatch || contentMatch
                }

                if (entry.type === 'spot-check') {
                    const feelingsMatch = entry.data.feelings?.some(f => f.toLowerCase().includes(query)) || false
                    const actionMatch = entry.data.action?.toLowerCase().includes(query) || false
                    return feelingsMatch || actionMatch
                }

                if (entry.type === 'night-review') {
                    const gratMatch = entry.data.step4_gratitude?.toLowerCase().includes(query) || false
                    const surrMatch = entry.data.step4_surrender?.toLowerCase().includes(query) || false
                    return gratMatch || surrMatch
                }

                if (entry.type === 'check-in') {
                    return entry.data.mood?.toLowerCase().includes(query) || false
                }

                if (entry.type === 'daily-log') {
                    return entry.data.note?.toLowerCase().includes(query) || false
                }

                // Fall through for searchableText if available
                if ('searchableText' in entry && typeof entry.searchableText === 'string') {
                    return entry.searchableText.includes(query)
                }

                return false
            })
            .sort((a, b) => b.createdAt - a.createdAt)
    }, [entries, filter, searchQuery])

    // Group by Date for display
    const groupedEntries = useMemo(() => {
        const groups: { [key: string]: JournalEntry[] } = {}
        filteredEntries.forEach(entry => {
            const dateKey = entry.dateLabel // Use pre-computed label
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
                                        index={0}
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
                                <p className="text-sm text-slate-500">{new Date(selectedEntry.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-handlee text-lg">
                            {selectedEntry.type === 'mood' && (
                                <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center">
                                    <span className="text-4xl block mb-2">{selectedEntry.data.mood}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feeling (Intensity: {selectedEntry.data.intensity}/10)</span>
                                    {selectedEntry.data.note && <p className="mt-2 text-sm text-slate-600">{selectedEntry.data.note}</p>}
                                </div>
                            )}

                            {selectedEntry.type === 'gratitude' && (
                                <div>
                                    <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
                                    <ul className="list-disc pl-5">
                                        {selectedEntry.data.items.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedEntry.type === 'inventory' && (
                                <div className="space-y-4">
                                    <div><span className="font-bold">Resentments:</span> {selectedEntry.data.resentments}</div>
                                    <div><span className="font-bold">Dishonesty:</span> {selectedEntry.data.dishonesty}</div>
                                    <div><span className="font-bold">Apologies:</span> {selectedEntry.data.apologies}</div>
                                    <div><span className="font-bold">Successes:</span> {selectedEntry.data.successes}</div>
                                </div>
                            )}

                            {(selectedEntry.type === 'free-write' || selectedEntry.type === 'meeting-note') && (
                                <>
                                    {selectedEntry.data.title && <h4 className="font-bold text-xl mb-2 font-heading">{selectedEntry.data.title}</h4>}
                                    {selectedEntry.data.content}
                                </>
                            )}

                            {selectedEntry.type === 'spot-check' && (
                                <div className="space-y-2">
                                    <div><span className="font-bold">Feelings:</span> {selectedEntry.data.feelings?.join(', ')}</div>
                                    {selectedEntry.data.action && <div><span className="font-bold">Action:</span> {selectedEntry.data.action}</div>}
                                </div>
                            )}

                            {selectedEntry.type === 'night-review' && (
                                <div className="space-y-2">
                                    {selectedEntry.data.step4_gratitude && <div><span className="font-bold">Gratitude:</span> {selectedEntry.data.step4_gratitude}</div>}
                                    {selectedEntry.data.step4_surrender && <div><span className="font-bold">Surrender:</span> {selectedEntry.data.step4_surrender}</div>}
                                </div>
                            )}

                            {selectedEntry.type === 'check-in' && (
                                <div className="space-y-2">
                                    {selectedEntry.data.mood && <div><span className="font-bold">Mood:</span> {selectedEntry.data.mood}</div>}
                                    <div><span className="font-bold">Cravings:</span> {selectedEntry.data.cravings ? 'Yes' : 'No'}</div>
                                    <div><span className="font-bold">Used:</span> {selectedEntry.data.used ? 'Yes' : 'No'}</div>
                                </div>
                            )}

                            {selectedEntry.type === 'daily-log' && (
                                <div>
                                    <h4 className="font-bold text-xl mb-2 font-heading">Recovery Notes</h4>
                                    {selectedEntry.data.note}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
