"use client"

import * as React from "react"
import { Lock, Compass, Loader2 } from "lucide-react"
import { JournalLayout } from "./journal-layout"
import { Timeline } from "./timeline"
import { FloatingPen } from "./floating-pen"
import { RibbonNav } from "./ribbon-nav"
import { useAuth } from "@/components/providers/auth-provider"
import { LockScreen } from "./lock-screen"
import { signInAnonymously } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { EntryCreatorMenu } from "./entry-creator-menu"
import { MoodForm } from "./entry-forms/mood-form"
import { GratitudeForm } from "./entry-forms/gratitude-form"
import { InventoryForm } from "./entry-forms/inventory-form"
import { FreeWriteForm } from "./entry-forms/free-write-form"
import { DailyLogForm } from "./entry-forms/daily-log-form"
import { JournalEntryType } from "@/types/journal"
import { toast } from "sonner"


export default function JournalHub() {
    const { user, loading } = useAuth()
    const [activeFilter, setActiveFilter] = React.useState<string | null>(null)
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [activeEntryType, setActiveEntryType] = React.useState<JournalEntryType | null>(null)

    const handleUnlock = async () => {
        try {
            await signInAnonymously(auth)
        } catch (error) {
            console.error("Failed to sign in anonymously", error)
            toast.error("Failed to unlock journal. Please try again.")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0eadd] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--journal-ribbon-blue)] opacity-50" />
            </div>
        )
    }

    if (!user) {
        return <LockScreen onUnlock={handleUnlock} />
    }

    return (
        <JournalLayout>
            <RibbonNav
                activeTab={activeFilter}
                onTabChange={(tab) => setActiveFilter(activeFilter === tab ? null : tab)}
            />
            {/* Header */}
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--journal-line)]/50">
                <div>
                    <div className="flex items-center gap-2 text-[var(--journal-ribbon-red)] opacity-80 mb-1">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest font-sans font-bold">Private</span>
                    </div>
                    <h1 className="font-heading text-4xl md:text-5xl text-[var(--journal-text)]">
                        My Recovery Pages
                    </h1>
                </div>

                <button className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--journal-text)] opacity-60 hover:opacity-100">
                    <Compass className="w-6 h-6" />
                </button>
            </header>

            {/* Main Content */}
            <main className="min-h-[50vh]">
                <Timeline filter={activeFilter} />
            </main>

            {/* Entry Creation Flow */}
            <EntryCreatorMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onSelectType={(type) => {
                    setActiveEntryType(type)
                    setIsMenuOpen(false)
                }}
            />

            <FloatingPen onClick={() => setIsMenuOpen(true)} />

            {/* Forms */}
            {activeEntryType === 'mood' && (
                <MoodForm
                    onClose={() => setActiveEntryType(null)}
                    onSuccess={() => setActiveEntryType(null)}
                />
            )}

            {activeEntryType === 'gratitude' && (
                <GratitudeForm
                    onClose={() => setActiveEntryType(null)}
                    onSuccess={() => setActiveEntryType(null)}
                />
            )}

            {activeEntryType === 'inventory' && (
                <InventoryForm
                    onClose={() => setActiveEntryType(null)}
                    onSuccess={() => setActiveEntryType(null)}
                />
            )}

            {activeEntryType === 'daily-log' && (
                <DailyLogForm
                    onClose={() => setActiveEntryType(null)}
                    onSuccess={() => setActiveEntryType(null)}
                />
            )}

            {(activeEntryType === 'free-write' || activeEntryType === 'meeting-note') && (
                <FreeWriteForm
                    onClose={() => setActiveEntryType(null)}
                    onSuccess={() => setActiveEntryType(null)}
                />
            )}

        </JournalLayout>
    )
}
