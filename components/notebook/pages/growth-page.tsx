"use client"

import { motion } from "framer-motion"
import { Zap, Moon, Heart, Book, List, AlertCircle, Plus, Mic } from "lucide-react"

interface GrowthPageProps {
    onNavigate?: (moduleId: string) => void
}

export default function GrowthPage({ onNavigate }: GrowthPageProps) {
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
        <div className="h-full flex flex-col gap-6 overflow-y-auto pb-20 no-scrollbar">

            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="font-handlee text-3xl text-amber-900">Growth & Recovery</h1>
                <p className="text-amber-900/60 text-sm font-handlee">
                    Maintenance is the key to progress.
                </p>
            </div>

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
                        <span className="text-xs font-bold text-amber-900/40 uppercase tracking-widest">Daily Maintenance</span>
                        <div className="h-px flex-1 bg-amber-900/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Spot Check Card */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 bg-white p-4 rounded-xl border border-amber-900/10 shadow-sm flex flex-col items-start gap-3 relative overflow-hidden group"
                            onClick={() => { }}
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap className="w-16 h-16 text-amber-500" />
                            </div>
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-amber-900">Spot Check</h3>
                                <p className="text-xs text-amber-900/60 leading-tight mt-1">
                                    Agitated? Pause and check exactly why.
                                </p>
                            </div>
                        </motion.button>

                        {/* Night Review Card */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col items-start gap-3 relative overflow-hidden group"
                            onClick={() => { }}
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Moon className="w-16 h-16 text-indigo-300" />
                            </div>
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-indigo-50">Night Review</h3>
                                <p className="text-xs text-indigo-200/60 leading-tight mt-1">
                                    Was I kind? Was I honest? A simple daily close.
                                </p>
                            </div>
                        </motion.button>

                        {/* Gratitude List (Full Width) */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="col-span-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-900/10 shadow-sm flex items-center gap-4 group"
                            onClick={() => { }}
                        >
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold text-emerald-900">Gratitude List</h3>
                                <p className="text-xs text-emerald-900/60">Shift your perspective.</p>
                            </div>
                            <Plus className="w-5 h-5 text-emerald-900/30 group-hover:text-emerald-900 transition-colors" />
                        </motion.button>
                    </div>
                </section>

                {/* TRACK 2: STEP WORK */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-amber-900/10" />
                        <span className="text-xs font-bold text-amber-900/40 uppercase tracking-widest">The Steps</span>
                        <div className="h-px flex-1 bg-amber-900/10" />
                    </div>

                    <div className="space-y-3">
                        {/* Step 4 Book */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ x: 4 }}
                            className="w-full bg-white p-4 rounded-xl border-l-4 border-l-blue-500 border-y border-r border-gray-100 shadow-sm flex items-start gap-4"
                        >
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Book className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800">Step 4 Inventory</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Resentments • Fears • Sexual Conduct • Harms
                                </p>
                            </div>
                        </motion.button>

                        {/* Step 8 List */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ x: 4 }}
                            className="w-full bg-white p-4 rounded-xl border-l-4 border-l-amber-500 border-y border-r border-gray-100 shadow-sm flex items-start gap-4"
                        >
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                <List className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800">Step 8 List</h3>
                                <p className="text-xs text-gray-500 mt-1">
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
