'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Award, Medal } from 'lucide-react'

interface MilestoneModalProps {
    isOpen: boolean
    title: string
    message: string
    daysClean?: number
    onClose: () => void
    intensity?: 'medium' | 'high'
}

const MILESTONE_ICONS = {
    week: Star,
    month: Award,
    year: Trophy,
    default: Medal,
}

export function MilestoneModal({
    isOpen,
    title,
    message,
    daysClean,
    onClose,
    _intensity = 'high'
}: MilestoneModalProps) {
    const Icon = daysClean && daysClean >= 365
        ? MILESTONE_ICONS.year
        : daysClean && daysClean >= 30
            ? MILESTONE_ICONS.month
            : daysClean && daysClean >= 7
                ? MILESTONE_ICONS.week
                : MILESTONE_ICONS.default

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    {/* Modal content */}
                    <motion.div
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl relative overflow-hidden"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{
                            scale: [0, 1.1, 1],
                            rotate: [-10, 5, 0]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.34, 1.56, 0.64, 1] // Custom easing for bounce effect
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            {/* Icon */}
                            <motion.div
                                className="bg-white/20 rounded-full p-6 mb-6"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{
                                    scale: [0, 1.3, 1],
                                    rotate: [-180, 10, 0]
                                }}
                                transition={{
                                    delay: 0.2,
                                    duration: 0.6,
                                    ease: [0.34, 1.56, 0.64, 1] // Custom easing for bounce effect
                                }}
                            >
                                <Icon className="w-16 h-16 text-white" />
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className="text-4xl md:text-5xl font-bold text-white mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {title}
                            </motion.h2>

                            {/* Days clean (if provided) */}
                            {daysClean !== undefined && (
                                <motion.div
                                    className="bg-white/20 rounded-full px-6 py-3 mb-4"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <p className="text-2xl md:text-3xl font-bold text-white">
                                        {daysClean} Day{daysClean !== 1 ? 's' : ''} Clean
                                    </p>
                                </motion.div>
                            )}

                            {/* Message */}
                            <motion.p
                                className="text-xl md:text-2xl text-white/90 mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {message}
                            </motion.p>

                            {/* Close button */}
                            <motion.button
                                className="bg-white text-emerald-600 font-bold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                onClick={onClose}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Continue
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
