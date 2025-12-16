"use client"

import { format } from "date-fns"
import { motion } from "framer-motion"
import { BookOpen, Zap, Moon, Heart, Calendar } from "lucide-react"

export interface JournalEntry {
    id: string
    type: 'daily-log' | 'spot-check' | 'night-review' | 'gratitude' | 'notepad'
    date: Date // Unified date object
    title?: string // Optional title
    data: any // The raw data payload
}

interface EntryCardProps {
    entry: JournalEntry
    onClick?: () => void
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
    const formattedDate = format(entry.date, "MMM d, yyyy • h:mm a")

    const getIcon = () => {
        switch (entry.type) {
            case 'daily-log': return <BookOpen className="w-4 h-4 text-blue-500" />
            case 'spot-check': return <Zap className="w-4 h-4 text-amber-500" />
            case 'night-review': return <Moon className="w-4 h-4 text-indigo-400" />
            case 'gratitude': return <Heart className="w-4 h-4 text-emerald-500" />
            case 'notepad': return <BookOpen className="w-4 h-4 text-yellow-600" />
            default: return <Calendar className="w-4 h-4 text-slate-400" />
        }
    }

    const getCardStyles = () => {
        switch (entry.type) {
            case 'daily-log': return "border-l-4 border-l-blue-500 bg-white"
            case 'spot-check': return "border-l-4 border-l-amber-500 bg-amber-50/30"
            case 'night-review': return "border-l-4 border-l-indigo-500 bg-slate-900 border-slate-800 text-slate-200"
            case 'gratitude': return "border-l-4 border-l-emerald-500 bg-emerald-50/30"
            case 'notepad': return "border-l-4 border-l-yellow-400 bg-yellow-50"
            default: return "bg-white"
        }
    }

    const renderContent = () => {
        switch (entry.type) {
            case 'daily-log':
                return (
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-blue-900">Daily Check-in</div>
                        <div className="flex gap-2">
                            {entry.data.mood && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                                    Mood: {entry.data.mood}
                                </span>
                            )}
                            {entry.data.cravings && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                    Cravings
                                </span>
                            )}
                            {entry.data.used && (
                                <span className="text-xs bg-red-900 text-white px-2 py-0.5 rounded-full">
                                    Relapse
                                </span>
                            )}
                        </div>
                    </div>
                )
            case 'notepad':
                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-yellow-800 font-handlee">Recovery Notepad</div>
                        <div className="line-clamp-4 text-sm text-slate-700 font-handlee leading-relaxed bg-yellow-100/50 p-2 rounded border border-yellow-200/50">
                            {entry.data.content || "No content."}
                        </div>
                    </div>
                )
            case 'spot-check':
                const feelings = entry.data.feelings?.join(", ") || "No feelings listed"
                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-amber-900">
                            Spot Check
                        </div>
                        <div className="text-xs text-amber-700/80">
                            Feelings: {feelings}
                        </div>
                        {entry.data.action && (
                            <div className="text-xs italic text-amber-800/70 mt-1 line-clamp-1">
                                "{entry.data.action}"
                            </div>
                        )}
                    </div>
                )
            case 'night-review':
                return (
                    <div className="space-y-1 text-slate-300">
                        <div className="text-sm font-medium text-indigo-200">
                            Nightly Inventory
                        </div>
                        <div className="text-xs flex gap-3 text-slate-500">
                            <span>Step 1 done</span>
                            <span>Step 2 done</span>
                        </div>
                        {entry.data.gratitude && (
                            <div className="text-xs italic text-emerald-400/80 mt-1 line-clamp-1">
                                Grateful for: {entry.data.gratitude}
                            </div>
                        )}
                    </div>
                )
            case 'gratitude':
                // Assuming data is string or object? Let's handle simple string for now based on previous simple tool usage
                // Wait, gratitude is usually part of night review or a separate thing.
                // The firestore service used `type: 'gratitude'` but structure `data: { items: ... }` or just text?
                // I'll assume it's just text or an object. Let's look safe.
                const content = typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data)
                return (
                    <div className="text-sm text-emerald-800">
                        {content}
                    </div>
                )
            default:
                return null
        }
    }

    const isNightMode = entry.type === 'night-review'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg shadow-sm border ${getCardStyles()} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-full ${isNightMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    {getIcon()}
                </div>
                <span className={`text-xs font-medium ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formattedDate}
                </span>
            </div>
            {renderContent()}
        </motion.div>
    )
}
