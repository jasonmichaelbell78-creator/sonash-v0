"use client"

import * as React from "react"
import { EntryCard } from "./entry-card"
import { JournalEntry, JournalEntryType } from "@/types/journal"
import { format } from "date-fns"
import { useJournal, getRelativeDateLabel } from "@/hooks/use-journal"
import { Loader2 } from "lucide-react"
import { EntryDetailDialog } from "./entry-detail-dialog"




export function Timeline({ filter }: { filter?: string | null }) {
    const { entries, loading } = useJournal()
    const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null)

    // Map ribbon IDs to Entry Types
    const filterMapping: Record<string, JournalEntryType[]> = {
        'crisis': ['spot-check'],
        'gratitude': ['gratitude'],
        'daily': ['mood'],
        'notes': ['free-write', 'meeting-note'],
        'inventory': ['inventory']
    }

    const filteredEntries = React.useMemo(() => {
        if (!filter) return entries
        const targetTypes = filterMapping[filter]
        if (!targetTypes) return entries
        return entries.filter(e => targetTypes.includes(e.type))
    }, [entries, filter])

    // Grouping Logic (Re-implemented here to support dynamic filtering)
    const groupedEntries = React.useMemo(() => {
        const groups: Record<string, JournalEntry[]> = {}
        filteredEntries.forEach(entry => {
            const label = getRelativeDateLabel(entry.dateLabel)
            if (!groups[label]) groups[label] = []
            groups[label].push(entry)
        })
        return groups
    }, [filteredEntries])

    // Sort groups
    const sortedGroupKeys = React.useMemo(() => {
        return Object.keys(groupedEntries).sort((a, b) => {
            if (a === 'Today') return -1
            if (b === 'Today') return 1
            if (a === 'Yesterday') return -1
            if (b === 'Yesterday') return 1
            return new Date(b).getTime() - new Date(a).getTime()
        })
    }, [groupedEntries])

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--journal-ribbon-blue)] opacity-50" />
            </div>
        )
    }

    if (Object.keys(groupedEntries).length === 0) {
        return (
            <div className="text-center py-20 opacity-60 font-handlee text-xl text-[var(--journal-text)]">
                {filter ? "No entries found for this section." : "The pages are waiting for your story..."}
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 pb-20">
            {sortedGroupKeys.map((label) => {
                const entries = groupedEntries[label];
                return (
                    <div key={label} className="relative">
                        {/* Sticky Date Header looking like a handwritten separation */}
                        <div className="sticky top-0 z-10 py-2 mb-4 bg-[#f0eadd]/95">
                            <h2 className="font-heading text-2xl text-[var(--journal-ribbon-blue)] opacity-80 inline-block border-b-2 border-[var(--journal-ribbon-blue)]/20 px-4">
                                {label}
                            </h2>
                        </div>

                        <div className="pl-4 border-l-2 border-[var(--journal-line)]/50 ml-4 space-y-4">
                            {entries.map((entry, idx) => (
                                <EntryCard
                                    key={entry.id}
                                    entry={entry}
                                    index={idx}
                                    onClick={() => setSelectedEntry(entry)}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}

            {/* Detail Dialog */}
            <EntryDetailDialog
                entry={selectedEntry}
                onClose={() => setSelectedEntry(null)}
            />

        </div>
    )
}
