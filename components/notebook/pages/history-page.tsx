"use client"

import { useAuth } from "@/components/providers/auth-provider"

import { Calendar, Clock, ChevronRight } from "lucide-react"

export default function HistoryPage() {
    const { user } = useAuth()

    // Placeholder for history data - eventually this will pull from Firestore
    const historyEntries = [
        { id: 1, date: "Today", preview: "Just starting my journey...", mood: "😊" },
        { id: 2, date: "Yesterday", preview: "Had a tough moment but verified meetings.", mood: "😐" },
    ]

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h1 className="font-heading text-2xl text-amber-900">My Journal History</h1>
                <p className="font-body text-amber-900/60 text-sm">Your past entries and progress.</p>
            </div>

            <div className="flex-1 -mr-4 pr-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-3 pb-8">
                    {historyEntries.map((entry) => (
                        <button
                            key={entry.id}
                            className="w-full text-left bg-white/50 hover:bg-white/80 border border-amber-200/50 hover:border-amber-300 rounded-lg p-3 transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="font-heading text-amber-900 font-bold">{entry.date}</span>
                                </div>
                                <span className="text-lg">{entry.mood}</span>
                            </div>
                            <p className="font-handlee text-amber-900/80 line-clamp-2 text-sm">
                                "{entry.preview}"
                            </p>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-[10px] text-amber-700/40 font-medium bg-amber-100/30 px-2 py-0.5 rounded-full">
                                    3:45 PM
                                </span>
                                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
                            </div>
                        </button>
                    ))}

                    <div className="p-4 text-center border-2 border-dashed border-amber-900/10 rounded-lg mt-4">
                        <p className="font-body text-amber-900/40 text-sm italic">
                            Older entries will appear here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
