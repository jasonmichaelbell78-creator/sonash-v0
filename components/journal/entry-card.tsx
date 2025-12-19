"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Paperclip, Pin } from "lucide-react"

import { JournalEntry } from "@/types/journal"

interface EntryCardProps {
    entry: JournalEntry
    index: number
    onClick?: () => void
}

export function EntryCard({ entry, index, onClick }: EntryCardProps) {
    // Variant styles
    const getStyles = (type: string) => {
        switch (type) {
            case "mood":
                return "bg-transparent aspect-square w-24 rotate-[-6deg] flex flex-col items-center justify-center border-4 border-dashed border-red-800/40 shadow-none opacity-90 mix-blend-multiply"
            case "gratitude":
                return "bg-[#fff9c4] w-full max-w-sm rotate-[1deg] shadow-sm p-4 text-sm font-handlee"
            case "inventory":
                return "bg-white w-full shadow-md p-6 border-l-4 border-[var(--journal-ribbon-purple)] rotate-[0.5deg]"
            default: // daily, note, etc.
                return "bg-white w-full shadow-md p-4 rotate-[-0.5deg]"
        }
    }

    // Decoration (Tape, Clip, Pin)
    const renderDecoration = (type: string) => {
        switch (type) {
            case "mood":
                return null // No tape for stamp
            // Tape
            case "gratitude":
                return (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <Pin className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-sm" />
                    </div>
                )
            case "inventory":
                return (
                    <div className="absolute -top-3 right-4">
                        <Paperclip className="w-6 h-6 text-zinc-400 rotate-12" />
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, rotate: -5 }}
            animate={{ opacity: 1, x: 0, rotate: entry.type === 'mood' ? -2 : entry.type === 'gratitude' ? 1 : 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            onClick={onClick}
            className={cn("relative mb-6 cursor-pointer", (entry.type !== 'mood' && entry.type !== 'gratitude') && "w-full")}
        >
            <div className={cn("relative transition-transform hover:scale-[1.01] duration-300", getStyles(entry.type))}>
                {renderDecoration(entry.type)}

                {/* Date - subtle (using createdAt timestamp) */}
                <div className="text-[10px] text-gray-400 font-sans mb-1 uppercase tracking-wider text-right">
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Content based on Type */}
                {entry.type === 'mood' && (
                    <>
                        <div className="text-5xl mb-1 text-red-800/80 drop-shadow-sm font-rock-salt">{entry.data.mood}</div>
                        <div className="text-[10px] font-black text-red-800/60 uppercase tracking-widest font-sans border-t border-b border-red-800/30 px-2 py-0.5 mt-1">Feeling</div>
                        {entry.data.note && <div className="text-[8px] text-red-800/50 mt-1 max-w-[80px] truncate">{entry.data.note}</div>}
                    </>
                )}

                {entry.type === 'gratitude' && (
                    <div className="w-full">
                        <h4 className="font-heading text-lg mb-2 text-[var(--journal-text)]">Gratitude</h4>
                        <ul className="list-disc pl-4 text-sm font-handlee text-[var(--journal-text)]">
                            {entry.data.items.slice(0, 3).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {(entry.type === 'free-write' || entry.type === 'meeting-note') && (
                    <>
                        <h3 className="font-heading text-lg mb-2 text-[var(--journal-text)]">{entry.data.title}</h3>
                        <p className="leading-relaxed whitespace-pre-wrap font-handlee text-[var(--journal-text)] line-clamp-4">
                            {entry.data.content}
                        </p>
                    </>
                )}

                {entry.type === 'spot-check' && (
                    <div className="w-full">
                        <h3 className="font-heading text-lg mb-2 text-[var(--journal-text)]">Spot Check</h3>
                        <div className="text-sm font-handlee text-[var(--journal-text)]">
                            {entry.data.feelings?.slice(0, 3).join(', ')}
                        </div>
                        {entry.data.action && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.data.action}</p>
                        )}
                    </div>
                )}

                {entry.type === 'night-review' && (
                    <div className="w-full text-center py-2">
                        <h3 className="font-heading text-lg text-[var(--journal-text)]">Night Review</h3>
                        <div className="text-xs text-slate-500 font-sans mt-1">Click to review</div>
                    </div>
                )}

                {entry.type === 'check-in' && (
                    <div className="w-full">
                        <h3 className="font-heading text-lg mb-2 text-[var(--journal-text)]">Daily Check-In</h3>
                        <div className="flex gap-2 text-sm">
                            {entry.data.mood && <span>Mood: {entry.data.mood}</span>}
                            {entry.data.cravings && <span className="text-amber-600">Cravings</span>}
                            {entry.data.used && <span className="text-red-600">Used</span>}
                        </div>
                    </div>
                )}

                {entry.type === 'daily-log' && (
                    <div className="w-full">
                        <h3 className="font-heading text-lg mb-2 text-[var(--journal-text)]">Recovery Notes</h3>
                        <p className="leading-relaxed whitespace-pre-wrap font-handlee text-[var(--journal-text)] line-clamp-4">
                            {entry.data.content}
                        </p>
                    </div>
                )}

                {entry.type === 'inventory' && (
                    <div className="w-full text-center py-2">
                        <h3 className="font-heading text-lg text-[var(--journal-text)]">Nightly Inventory</h3>
                        <div className="text-xs text-slate-500 font-sans mt-1">Click to review</div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
