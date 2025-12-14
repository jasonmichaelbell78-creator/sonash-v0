"use client"

import { motion } from "framer-motion"
import { BookOpen, Heart, Sparkles, PenLine } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
    type: "journal" | "meetings" | "history"
    action?: {
        label: string
        href: string
    }
}

const emptyStateContent = {
    journal: {
        icon: PenLine,
        title: "Your story starts here",
        message: "Every journey of recovery begins with a single step. Take a moment to reflect on your day — there's no wrong way to start.",
        encouragement: "You're showing up for yourself, and that matters.",
    },
    meetings: {
        icon: Heart,
        title: "Find your community",
        message: "Connection is a powerful part of recovery. When you're ready, there are people waiting to welcome you.",
        encouragement: "You don't have to do this alone.",
    },
    history: {
        icon: BookOpen,
        title: "A blank page awaits",
        message: "Your journal history will appear here as you write. Each entry is a milestone on your journey.",
        encouragement: "Start today — future you will thank you.",
    },
}

export function EmptyState({ type, action }: EmptyStateProps) {
    const content = emptyStateContent[type]
    const Icon = content.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            {/* Icon with gentle animation */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative mb-6"
            >
                <div className="w-20 h-20 rounded-full bg-amber-100/50 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-amber-700/60" strokeWidth={1.5} />
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="w-5 h-5 text-amber-500/40" />
                </motion.div>
            </motion.div>

            {/* Title */}
            <h3 className="font-heading text-xl text-amber-900 mb-3">
                {content.title}
            </h3>

            {/* Message */}
            <p className="font-body text-amber-800/70 max-w-xs mb-4 leading-relaxed">
                {content.message}
            </p>

            {/* Encouragement */}
            <p className="font-handwriting text-lg text-amber-700/50 italic mb-6">
                {content.encouragement}
            </p>

            {/* Action button */}
            {action && (
                <Link
                    href={action.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 hover:bg-amber-200 
                     text-amber-900 rounded-full font-body font-medium text-sm
                     transition-colors shadow-sm hover:shadow"
                >
                    {action.label}
                </Link>
            )}
        </motion.div>
    )
}
