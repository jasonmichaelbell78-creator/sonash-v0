"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface RibbonNavProps {
    activeTab: string | null
    onTabChange: (tab: string) => void
}

const ribbons = [
    { id: "crisis", color: "var(--journal-ribbon-red)", label: "Crisis", top: "10%" },
    { id: "gratitude", color: "var(--journal-ribbon-green)", label: "Gratitude", top: "25%" },
    { id: "daily", color: "var(--journal-ribbon-blue)", label: "Daily", top: "40%" },
    { id: "notes", color: "var(--journal-ribbon-yellow)", label: "Notes", top: "55%" },
    { id: "inventory", color: "var(--journal-ribbon-purple)", label: "Inventory", top: "70%" },
]

export function RibbonNav({ activeTab, onTabChange }: RibbonNavProps) {
    return (
        <div className="absolute right-0 top-0 h-full w-12 z-20 pointer-events-none">
            {ribbons.map((ribbon) => (
                <motion.button
                    key={ribbon.id}
                    className={cn(
                        "absolute right-0 h-10 w-14 pointer-events-auto flex items-center justify-start pl-2",
                        "shadow-[2px_2px_4px_rgba(0,0,0,0.3)] rounded-l-sm cursor-pointer border-y border-l border-white/10"
                    )}
                    style={{
                        backgroundColor: ribbon.color,
                        backgroundImage: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0,0,0,0.2) 3px,
                            transparent 4px
                        )`,
                        top: ribbon.top,
                        zIndex: activeTab === ribbon.id ? 30 : 20,
                    }}
                    initial={{ x: 10 }}
                    animate={{ x: activeTab === ribbon.id ? 0 : 10 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ x: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={() => onTabChange(ribbon.id)}
                >
                    {/* Fabric texture overlay */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `
                                linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.1) 100%),
                                url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h4v4H0z' fill='none'/%3E%3Cpath d='M0 0h1v1H0zM2 2h1v1H2z' fill='%23000' fill-opacity='0.1'/%3E%3C/svg%3E")
                            `
                        }}
                    />
                    {/* Label tooltip (could be fancy, simpler for now just visible on hover if we want, or rely on color + icon later. User didn't specify text on ribbon, but said 'Red=Crisis' etc. I'll stick to color for now or maybe a small sticking out text?) 
              For now keeping it simple: just the ribbon itself. 
          */}
                </motion.button>
            ))}
        </div>
    )
}
