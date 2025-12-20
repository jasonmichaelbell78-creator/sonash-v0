"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutGrid, BookOpen, Zap, Moon, Heart } from "lucide-react"

export type JournalFilterType = 'all' | 'daily-log' | 'spot-check' | 'night-review' | 'gratitude'

interface JournalSidebarProps {
    activeFilter: JournalFilterType
    onFilterChange: (filter: JournalFilterType) => void
    className?: string
}

export function JournalSidebar({ activeFilter, onFilterChange, className }: JournalSidebarProps) {
    const filters = [
        { id: 'all', label: 'All Entries', icon: LayoutGrid, color: "text-slate-500" },
        { id: 'daily-log', label: 'Daily Logs', icon: BookOpen, color: "text-blue-500" },
        { id: 'spot-check', label: 'Spot Checks', icon: Zap, color: "text-amber-500" },
        { id: 'night-review', label: 'Night Review', icon: Moon, color: "text-indigo-400" },
        { id: 'gratitude', label: 'Gratitude', icon: Heart, color: "text-emerald-500" },
    ] as const

    return (
        <div className={cn("space-y-4 py-4", className)}>
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-slate-900">
                    Recovery Hub
                </h2>
                <div className="space-y-1">
                    {filters.map((filter) => (
                        <Button
                            key={filter.id}
                            variant={activeFilter === filter.id ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start",
                                activeFilter === filter.id ? "bg-slate-100 font-medium" : "font-normal"
                            )}
                            onClick={() => onFilterChange(filter.id as JournalFilterType)}
                        >
                            <filter.icon className={cn("mr-2 h-4 w-4", filter.color)} />
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Future Expansion: Step Work */}
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-slate-500 uppercase">
                    Steps (Coming Soon)
                </h2>
                <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start font-normal" disabled aria-disabled="true">
                        Step 4 Inventory
                    </Button>
                    <Button variant="ghost" className="w-full justify-start font-normal" disabled aria-disabled="true">
                        Step 8/9 Amends
                    </Button>
                </div>
            </div>
        </div>
    )
}
