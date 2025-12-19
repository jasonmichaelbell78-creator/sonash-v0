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
            case "free-write":
            case "meeting-note":
                return "bg-[#fff9c4] w-full max-w-md rotate-[-0.5deg] shadow-sm p-4 text-sm"
            case "inventory":
                return "bg-white w-full shadow-md p-6 border-l-4 border-[var(--journal-ribbon-purple)] rotate-[0.5deg]"
            case "spot-check":
                return "bg-amber-50 w-full shadow-sm p-4 border-l-4 border-amber-500"
            case "night-review":
                return "bg-indigo-50 w-full shadow-md p-6 border-l-4 border-indigo-500"
            case "daily-log":
                return "bg-gradient-to-br from-sky-50 to-sky-100 w-full max-w-xs p-4 rounded-2xl shadow-md border-2 border-sky-200/50 rotate-[1deg]"
            default:
                return "bg-white w-full shadow-md p-4 rotate-[-0.5deg]"
        }
    }

    // Helper to get mood emoji
    const getMoodEmoji = (mood: string) => {
        const moodMap: Record<string, string> = {
            'struggling': '😟',
            'okay': '😐',
            'hopeful': '🙂',
            'great': '😊'
        }
        return moodMap[mood] || '😐'
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
                <div className="text-[10px] text-amber-900/50 font-sans mb-1 uppercase tracking-wider text-right">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>

                {/* Content based on Type */}
                {entry.type === 'mood' && (
                    <>
                        <div className="text-5xl mb-1 drop-shadow-sm">{getMoodEmoji(entry.data.mood)}</div>
                        <div className="text-[10px] font-black text-red-800/60 uppercase tracking-widest font-sans border-t border-b border-red-800/30 px-2 py-0.5 mt-1">Feeling</div>
                        <div className="text-[9px] text-red-800/50 mt-1 font-sans">{entry.data.mood}</div>
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
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-heading text-sm text-amber-900/80">{entry.data.title || 'Note'}</h4>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap font-handlee text-amber-900 line-clamp-6 text-sm">
                            {entry.data.content}
                        </p>
                    </div>
                )}

                {entry.type === 'daily-log' && (
                    <div className="w-full relative">
                        {/* Decorative badge icon in corner */}
                        <div className="absolute -top-2 -right-2 text-3xl opacity-20">
                            {entry.data.used === true ? '⚠️' : entry.data.cravings === true ? '⚡' : '✓'}
                        </div>
                        
                        <h4 className="font-heading text-sm mb-3 text-sky-900/90 flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            Check-In
                        </h4>
                        <div className="flex flex-col gap-1.5 text-xs font-sans">
                            {entry.data.cravings !== null && entry.data.cravings !== undefined && (
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full font-medium ${entry.data.cravings ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
                                        {entry.data.cravings ? '⚡ Cravings: Yes' : '✓ Cravings: No'}
                                    </span>
                                </div>
                            )}
                            {entry.data.used !== null && entry.data.used !== undefined && (
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full font-medium ${entry.data.used ? 'bg-red-100 border border-red-300 text-red-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
                                        {entry.data.used ? '⚠️ Used: Yes' : '✓ Used: No'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {entry.type === 'spot-check' && (
                    <div className="space-y-2">
                        <h3 className="font-heading text-lg text-amber-900">Spot Check</h3>
                        {entry.data.feelings && entry.data.feelings.length > 0 && (
                            <div className="text-sm">
                                <span className="font-semibold">Feelings:</span> {entry.data.feelings.join(', ')}
                            </div>
                        )}
                        {entry.data.action && (
                            <p className="text-sm italic line-clamp-2">{entry.data.action}</p>
                        )}
                    </div>
                )}

                {entry.type === 'night-review' && (
                    <div className="space-y-2">
                        <h3 className="font-heading text-lg text-indigo-900">Night Review</h3>
                        {entry.data.gratitude && (
                            <p className="text-sm italic line-clamp-2">Gratitude: {entry.data.gratitude}</p>
                        )}
                        <div className="text-xs text-indigo-700">Click to view full review</div>
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
