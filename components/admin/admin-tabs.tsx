"use client"

import { MeetingsTab } from "./meetings-tab"
import { SoberLivingTab } from "./sober-living-tab"
import { QuotesTab } from "./quotes-tab"
import { GlossaryTab } from "./glossary-tab"
import { UsersTab } from "./users-tab"
import { Home, Users, Quote, Book } from "lucide-react"

interface AdminTabsProps {
    activeTab: string
    setActiveTab: (tab: string) => void
}

export function AdminTabs({ activeTab, setActiveTab }: AdminTabsProps) {
    const tabs = [
        { id: "meetings", label: "Meetings", icon: Users },
        { id: "sober-living", label: "Sober Living", icon: Home },
        { id: "quotes", label: "Daily Quotes", icon: Quote },
        { id: "glossary", label: "Glossary", icon: Book },
        { id: "users", label: "Users", icon: Users },
    ]

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-amber-200/60 pb-1 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                ${activeTab === tab.id
                                    ? "bg-[#fdfbf7] text-amber-900 border border-amber-200 border-b-transparent -mb-[1px] relative z-10"
                                    : "text-amber-900/50 hover:text-amber-800 hover:bg-amber-100/50"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "meetings" && <MeetingsTab />}
                {activeTab === "sober-living" && <SoberLivingTab />}
                {activeTab === "quotes" && <QuotesTab />}
                {activeTab === "glossary" && <GlossaryTab />}
                {activeTab === "users" && <UsersTab />}
            </div>
        </div>
    )
}

