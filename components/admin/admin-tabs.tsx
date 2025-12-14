"use client"

/**
 * Admin Tabs Component
 * 
 * Tabbed interface for managing different content types.
 * New tabs added as features launch.
 */

import { useState } from "react"
import { MeetingsTab } from "./meetings-tab"

type TabId = "meetings" | "sober-living"

interface Tab {
    id: TabId
    label: string
    icon: string
}

const tabs: Tab[] = [
    { id: "meetings", label: "Meetings", icon: "📍" },
    { id: "sober-living", label: "Sober Living", icon: "🏠" },
]

export function AdminTabs() {
    const [activeTab, setActiveTab] = useState<TabId>("meetings")

    return (
        <div>
            {/* Tab navigation */}
            <div className="flex border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === "meetings" && <MeetingsTab />}
                {activeTab === "sober-living" && (
                    <div className="text-gray-500 text-center py-12">
                        Sober Living tab coming soon
                    </div>
                )}
            </div>
        </div>
    )
}
