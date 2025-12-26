"use client"

import { motion } from "framer-motion"
import { Book, List } from "lucide-react"
import SpotCheckCard from "@/components/growth/SpotCheckCard"
import NightReviewCard from "@/components/growth/NightReviewCard"
import GratitudeCard from "@/components/growth/GratitudeCard"
import DailySloganWidget from "@/components/growth/DailySloganWidget"
import Step1WorksheetCard from "@/components/growth/Step1WorksheetCard"

interface GrowthPageProps {
    onNavigate?: (moduleId: string) => void
}

export default function GrowthPage({ onNavigate: _onNavigate }: GrowthPageProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto pb-20 pr-4 no-scrollbar">

            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="font-heading text-2xl text-amber-900">🌱 Growth & Recovery</h1>
                <p className="font-body text-amber-900/60 text-sm">
                    Maintenance is the key to progress.
                </p>
            </div>

            {/* Daily Slogan */}
            <DailySloganWidget />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >

                {/* TRACK 1: DAILY MAINTENANCE */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-amber-900/10" />
                        <span className="text-xs font-body text-amber-900/40 uppercase tracking-widest">Daily Maintenance</span>
                        <div className="h-px flex-1 bg-amber-900/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Spot Check Card */}
                        <SpotCheckCard
                            variants={itemVariants}
                        // className="col-span-1" // Included in component default
                        />

                        {/* Night Review Card */}
                        <NightReviewCard variants={itemVariants} />

                        {/* Gratitude List (Full Width) */}
                        <GratitudeCard variants={itemVariants} className="col-span-2" />
                    </div>
                </section>

                {/* TRACK 2: STEP WORK */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-amber-900/10" />
                        <span className="text-xs font-body text-amber-900/40 uppercase tracking-widest">The Steps</span>
                        <div className="h-px flex-1 bg-amber-900/10" />
                    </div>

                    <div className="space-y-3">
                        {/* Step 1 Worksheet */}
                        <Step1WorksheetCard variants={itemVariants} />

                        {/* Step 4 Book */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ x: 4 }}
                            className="w-full bg-white/60 p-4 rounded-xl border-l-4 border-l-blue-400 border border-amber-100 shadow-sm flex items-start gap-4"
                        >
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Book className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-heading text-lg text-amber-900">Step 4 Inventory</h3>
                                <p className="font-body text-xs text-amber-900/60 mt-1">
                                    Resentments • Fears • Sexual Conduct • Harms
                                </p>
                            </div>
                        </motion.button>

                        {/* Step 8 List */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ x: 4 }}
                            className="w-full bg-white/60 p-4 rounded-xl border-l-4 border-l-amber-400 border border-amber-100 shadow-sm flex items-start gap-4"
                        >
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                <List className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-heading text-lg text-amber-900">Step 8 List</h3>
                                <p className="font-body text-xs text-amber-900/60 mt-1">
                                    Persons we had harmed, and became willing to make amends to them all.
                                </p>
                            </div>
                        </motion.button>
                    </div>
                </section>

            </motion.div>
        </div>
    )
}
