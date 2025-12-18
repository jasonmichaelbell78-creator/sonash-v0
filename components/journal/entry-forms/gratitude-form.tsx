"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Save, Plus, Trash2 } from "lucide-react"
import { useJournal } from "@/hooks/use-journal"
import { toast } from "sonner"

interface GratitudeFormProps {
    onClose: () => void
    onSuccess: () => void
}

export function GratitudeForm({ onClose, onSuccess }: GratitudeFormProps) {
    const { addEntry } = useJournal()
    const [items, setItems] = React.useState<string[]>(["", "", ""])
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items]
        newItems[index] = value
        setItems(newItems)
    }

    const addItem = () => {
        setItems([...items, ""])
    }

    const removeItem = (index: number) => {
        if (items.length <= 1) return // Keep at least one
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Filter out empty items
        const validItems = items.map(i => i.trim()).filter(i => i.length > 0)

        if (validItems.length === 0) return

        try {
            setIsSubmitting(true)
            await addEntry('gratitude', { items: validItems })
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Failed to add gratitude entry:", error)
            toast.error("Failed to save gratitude list. Please try again.")
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

                <h2 className="font-heading text-2xl text-[var(--journal-ribbon-green)] text-center mb-6 flex items-center justify-center gap-2">
                    Gratitude List
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider text-center">
                            I am grateful for...
                        </label>

                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="font-handlee text-[var(--journal-text)]/50 w-6 text-right">
                                    {index + 1}.
                                </span>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleItemChange(index, e.target.value)}
                                    className="flex-1 p-2 rounded-md bg-white/50 border border-[var(--journal-line)]/30 focus:border-[var(--journal-ribbon-green)] focus:ring-1 focus:ring-[var(--journal-ribbon-green)] outline-none font-handlee text-lg"
                                    placeholder="Something good..."
                                    autoFocus={index === 0}
                                />
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-[var(--journal-text)]/30 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addItem}
                            className="w-full py-2 border-2 border-dashed border-[var(--journal-text)]/20 rounded-md text-[var(--journal-text)]/50 hover:text-[var(--journal-text)] hover:border-[var(--journal-text)]/40 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || items.every(i => !i.trim())}
                            className="flex items-center gap-2 bg-[var(--journal-ribbon-green)] text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save List'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    )
}
