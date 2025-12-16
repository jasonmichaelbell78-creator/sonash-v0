"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { Calendar, Clock, ChevronRight, Zap, Moon, Heart, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toDate } from "@/lib/types/firebase-types"

type HistoryItem = {
    id: string
    type: 'daily-log' | 'spot-check' | 'night-review' | 'gratitude'
    date: Date
    title: string
    preview: string
    icon: any
    color: string
}

export default function HistoryPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<HistoryItem[]>([])

    useEffect(() => {
        if (!user) return

        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch both streams in parallel
                const [logsResult, inventoryResult] = await Promise.all([
                    FirestoreService.getHistory(user.uid),
                    FirestoreService.getInventoryEntries(user.uid)
                ])

                const combined: HistoryItem[] = []

                // Process Daily Logs
                logsResult.entries.forEach(log => {
                    const dateStr = log.date || (log as any).dateId // fallback
                    if (!dateStr) return

                    const dateParts = dateStr.split('-').map(Number)
                    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 9, 0)

                    combined.push({
                        id: `daily-${log.date}`, // use date as ID suffix since it's the doc ID
                        type: 'daily-log',
                        date: date,
                        title: "Daily Check-in",
                        preview: log.content || `Mood: ${log.mood || 'Not recorded'}`,
                        icon: Calendar,
                        color: "text-amber-600"
                    })
                })

                // Process Inventory Entries
                inventoryResult.entries.forEach((entry: any) => {
                    const date = (entry.createdAt ? toDate(entry.createdAt) : null) || new Date()
                    let title = "Entry"
                    let preview = "..."
                    let icon = Zap
                    let color = "text-amber-600"

                    if (entry.type === 'spot-check') {
                        title = "Spot Check"
                        icon = Zap
                        color = "text-orange-500"
                        const data = entry.data || {}
                        preview = data.action || (data.absolutes || []).join(', ') || "No action recorded"
                    } else if (entry.type === 'night-review') {
                        title = "Night Review"
                        icon = Moon
                        color = "text-indigo-500"
                        const data = entry.data || {}
                        if (data.version === 2 || data.gratitude) {
                            preview = data.gratitude ? `Grateful for: ${data.gratitude}` : (data.surrender ? `Surrendered: ${data.surrender}` : "Nightly inventory completed")
                        } else {
                            preview = data.tomorrowPlan ? `Plan: ${data.tomorrowPlan}` : "Review completed"
                        }
                    } else if (entry.type === 'gratitude') {
                        title = "Gratitude List"
                        icon = Heart
                        color = "text-emerald-500"
                        const data = entry.data || {}
                        const count = (data.items || []).length
                        preview = `${count} things to be grateful for`
                    }

                    combined.push({
                        id: `inv-${entry.id}`,
                        type: entry.type,
                        date: date,
                        title,
                        preview,
                        icon,
                        color
                    })
                })

                // Sort by date desc
                combined.sort((a, b) => b.date.getTime() - a.date.getTime())
                setItems(combined)
            } catch (error) {
                console.error("Failed to load history", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h1 className="font-heading text-2xl text-amber-900">My Journal</h1>
                <p className="font-body text-amber-900/60 text-sm">Your recovery journey, one day at a time.</p>
            </div>

            <div className="flex-1 -mr-4 pr-4 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-900/30" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-amber-900/10 rounded-xl">
                        <p className="font-handlee text-amber-900/40 text-lg">Your journal is waiting for you.</p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-8">
                        {items.map((entry) => (
                            <button
                                key={entry.id}
                                className="w-full text-left bg-white/50 hover:bg-white/80 border border-amber-200/50 hover:border-amber-300 rounded-lg p-3 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 mb-1">
                                        <entry.icon className={`w-3.5 h-3.5 ${entry.color}`} />
                                        <span className={`font-heading font-bold ${entry.color.replace('text-', 'text-opacity-80-')}`}>{entry.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-amber-900/40">
                                        <Clock className="w-3 h-3" />
                                        <span>{format(entry.date, "MMM d, h:mm a")}</span>
                                    </div>
                                </div>
                                <p className="font-handlee text-amber-900/80 line-clamp-2 text-sm pl-6">
                                    "{entry.preview}"
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
