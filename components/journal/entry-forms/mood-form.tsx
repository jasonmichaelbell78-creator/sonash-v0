"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Save } from "lucide-react"
import { useJournal } from "@/hooks/use-journal"
import { toast } from "sonner"

interface MoodFormProps {
    onClose: () => void
    onSuccess: () => void
}

const MOOD_OPTIONS = [
    { emoji: "🤩", label: "Great" },
    { emoji: "😃", label: "Good" },
    { emoji: "😌", label: "Calm" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😕", label: "Uneasy" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😤", label: "Angry" },
]

export function MoodForm({ onClose, onSuccess }: MoodFormProps) {
    const { addEntry } = useJournal()
    const [mood, setMood] = React.useState<string | null>(null)
    const [intensity, setIntensity] = React.useState(5)
    const [note, setNote] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mood) return

        try {
            setIsSubmitting(true)
            await addEntry('mood', { mood, intensity, note })
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Failed to add mood entry:", error)
            toast.error("Failed to save mood entry. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
            <div className="bg-[#f0eadd] w-full max-w-lg rounded-lg shadow-2xl p-6 relative pointer-events-auto border-2 border-[var(--journal-line)]/20 flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--journal-text)]/50 hover:text-[var(--journal-text)] transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="font-heading text-2xl text-[var(--journal-ribbon-blue)] text-center mb-6">
                    Mood Check-in
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
                    {/* Mood Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
                            How are you feeling?
                        </label>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {MOOD_OPTIONS.map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => setMood(option.emoji)}
                                    className={`
                                        w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all
                                        ${mood === option.emoji
                                            ? 'bg-[var(--journal-ribbon-blue)] text-white scale-110 shadow-lg'
                                            : 'bg-white/50 hover:bg-white hover:scale-105'
                                        }
                                    `}
                                    title={option.label}
                                >
                                    {option.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Intensity Slider */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider flex justify-between">
                            <span>Intensity</span>
                            <span>{intensity}/10</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className="w-full accent-[var(--journal-ribbon-blue)] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-[var(--journal-text)]/50 font-handlee">
                            <span>Mild</span>
                            <span>Overwhelming</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider">
                            Note (Optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Why do you feel this way?"
                            className="w-full h-32 p-3 rounded-md bg-white/50 border border-[var(--journal-line)]/30 focus:border-[var(--journal-ribbon-blue)] focus:ring-1 focus:ring-[var(--journal-ribbon-blue)] outline-none resize-none font-handlee text-lg"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={!mood || isSubmitting}
                            className="flex items-center gap-2 bg-[var(--journal-ribbon-blue)] text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    )
}
