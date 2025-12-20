"use client"

import { useRef } from "react"
import { Loader2 } from "lucide-react"

/**
 * Props for RecoveryNotepad component
 */
interface RecoveryNotepadProps {
    /** Current value of the notepad */
    value: string
    /** Callback when value changes */
    onChange: (value: string) => void
    /** Callback when notepad receives focus */
    onFocus?: () => void
    /** Callback when notepad loses focus */
    onBlur?: () => void
    /** Whether content is currently being saved */
    isSaving?: boolean
    /** Whether save just completed */
    saveComplete?: boolean
    /** Placeholder text */
    placeholder?: string
}

/**
 * Styled notepad textarea with lined paper aesthetic.
 * Used for quick notes and thoughts on the Today page.
 * 
 * @example
 * <RecoveryNotepad
 *   value={journalEntry}
 *   onChange={setJournalEntry}
 *   onFocus={() => isEditingRef.current = true}
 *   onBlur={() => isEditingRef.current = false}
 *   isSaving={isSaving}
 *   saveComplete={saveComplete}
 * />
 */
export function RecoveryNotepad({
    value,
    onChange,
    onFocus,
    onBlur,
    isSaving = false,
    saveComplete = false,
    placeholder = "Jot down numbers, thoughts, or reminders...",
}: RecoveryNotepadProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        onFocus?.()
        // Position cursor at end of text on focus
        if (value && e.target.selectionStart !== value.length) {
            const len = value.length
            e.target.setSelectionRange(len, len)
            e.target.scrollTop = e.target.scrollHeight
        }
    }

    return (
        <div className="relative group">
            <h2 className="font-heading text-lg text-amber-900/90 mb-2">Recovery Notepad</h2>

            <div
                className="relative min-h-[400px] w-full rounded-xl overflow-hidden shadow-sm border border-amber-200/60"
                style={{ backgroundColor: '#fdfbf7' }}
                role="region"
                aria-label="Recovery notepad for quick notes"
            >
                {/* Yellow Header */}
                <div className="h-12 bg-yellow-200 border-b border-yellow-300 flex items-center px-4">
                    <span className="font-handlee text-yellow-800/60 text-sm font-bold tracking-widest uppercase">
                        Quick Notes & Numbers
                    </span>
                </div>

                {/* Lined Paper Background */}
                <div
                    className="absolute inset-0 top-12 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)',
                        backgroundSize: '100% 2rem',
                        marginTop: '0.5rem'
                    }}
                    aria-hidden="true"
                />

                {/* Red Margin Line */}
                <div
                    className="absolute left-10 top-12 bottom-0 w-px bg-red-300/40 pointer-events-none"
                    aria-hidden="true"
                />

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={onBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.stopPropagation()
                    }}
                    placeholder={placeholder}
                    aria-label="Recovery notes"
                    className="w-full h-full min-h-[350px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-slate-800 leading-[2rem] p-4 pl-14 pt-2"
                    style={{
                        fontFamily: 'var(--font-handlee), cursive',
                        lineHeight: '2rem'
                    }}
                    spellCheck={false}
                />

                {/* Save indicator */}
                <div
                    className="absolute bottom-2 right-4 text-xs font-body italic"
                    role="status"
                    aria-live="polite"
                >
                    {isSaving ? (
                        <span className="text-amber-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            Saving...
                        </span>
                    ) : saveComplete ? (
                        <span className="text-green-600 font-bold">✓ Saved</span>
                    ) : null}
                </div>
            </div>

            <div className="flex justify-end">
                <p className="text-xs font-body text-amber-900/50 italic">Auto-saved</p>
            </div>
        </div>
    )
}
