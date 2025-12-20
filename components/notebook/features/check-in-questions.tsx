"use client"

/**
 * Props for CheckInQuestions component
 */
interface CheckInQuestionsProps {
    /** Current cravings state */
    cravings: boolean | null
    /** Current used state */
    used: boolean | null
    /** Callback when cravings changes */
    onCravingsChange: (value: boolean) => void
    /** Callback when used changes */
    onUsedChange: (value: boolean) => void
}

/**
 * Yes/No toggle questions for daily check-in.
 * Fully accessible with ARIA labels and keyboard support.
 * 
 * @example
 * <CheckInQuestions
 *   cravings={cravings}
 *   used={used}
 *   onCravingsChange={(v) => { setCravings(v); setHasTouched(true) }}
 *   onUsedChange={(v) => { setUsed(v); setHasTouched(true) }}
 * />
 */
export function CheckInQuestions({
    cravings,
    used,
    onCravingsChange,
    onUsedChange,
}: CheckInQuestionsProps) {
    return (
        <div className="space-y-3 pl-1" role="group" aria-label="Daily check-in questions">
            {/* Cravings question */}
            <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80" id="cravings-label">
                    Cravings?
                </span>
                <div
                    className="flex items-center gap-3"
                    role="radiogroup"
                    aria-labelledby="cravings-label"
                >
                    <button
                        onClick={() => onCravingsChange(false)}
                        aria-label="No cravings"
                        aria-checked={cravings === false}
                        role="radio"
                        className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${cravings === false
                                ? "bg-green-100 border-2 border-green-400 text-green-900 font-bold shadow-sm"
                                : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        No
                    </button>
                    <button
                        onClick={() => onCravingsChange(true)}
                        aria-label="Yes cravings"
                        aria-checked={cravings === true}
                        role="radio"
                        className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${cravings === true
                                ? "bg-amber-100 border-2 border-amber-400 text-amber-900 font-bold shadow-sm"
                                : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Yes
                    </button>
                </div>
            </div>

            {/* Used question */}
            <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80" id="used-label">
                    Used?
                </span>
                <div
                    className="flex items-center gap-3"
                    role="radiogroup"
                    aria-labelledby="used-label"
                >
                    <button
                        onClick={() => onUsedChange(false)}
                        aria-label="No, did not use"
                        aria-checked={used === false}
                        role="radio"
                        className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${used === false
                                ? "bg-green-100 border-2 border-green-400 text-green-900 font-bold shadow-sm"
                                : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        No
                    </button>
                    <button
                        onClick={() => onUsedChange(true)}
                        aria-label="Yes, used"
                        aria-checked={used === true}
                        role="radio"
                        className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${used === true
                                ? "bg-red-100 border-2 border-red-400 text-red-900 font-bold shadow-sm"
                                : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    )
}
