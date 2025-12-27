import * as React from "react"
import { JournalEntry } from "@/types/journal"
import { X } from "lucide-react"

interface EntryDetailDialogProps {
    entry: JournalEntry | null
    onClose: () => void
}

export function EntryDetailDialog({ entry, onClose }: EntryDetailDialogProps) {
    if (!entry) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 capitalize">{entry.type.replace('-', ' ')}</h3>
                        <p className="text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-handlee text-lg">
                    {entry.type === 'mood' && entry.data && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center">
                            <span className="text-4xl block mb-2">{entry.data?.mood ?? '😐'}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feeling (Intensity: {entry.data?.intensity ?? 5}/10)</span>
                            {entry.data?.note && <p className="mt-2 text-sm text-slate-600">{entry.data.note}</p>}
                        </div>
                    )}

                    {entry.type === 'gratitude' && entry.data?.items && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
                            <ul className="list-disc pl-5">
                                {entry.data.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {entry.type === 'inventory' && entry.data && (
                        <div className="space-y-4">
                            <div><span className="font-bold">Resentments:</span> {entry.data?.resentments ?? 'N/A'}</div>
                            <div><span className="font-bold">Dishonesty:</span> {entry.data?.dishonesty ?? 'N/A'}</div>
                            <div><span className="font-bold">Apologies:</span> {entry.data?.apologies ?? 'N/A'}</div>
                            <div><span className="font-bold">Successes:</span> {entry.data?.successes ?? 'N/A'}</div>
                        </div>
                    )}

                    {(entry.type === 'free-write' || entry.type === 'meeting-note') && entry.data && (
                        <>
                            {entry.data?.title && <h4 className="font-bold text-xl mb-2 font-heading">{entry.data.title}</h4>}
                            {entry.data?.content ?? ''}
                        </>
                    )}

                    {entry.type === 'spot-check' && entry.data && (
                        <div className="space-y-2">
                            <div><span className="font-bold">Feelings:</span> {entry.data?.feelings?.join(', ') ?? 'N/A'}</div>
                            <div><span className="font-bold">Absolutes:</span> {entry.data?.absolutes?.join(', ') ?? 'N/A'}</div>
                            {entry.data?.action && <div><span className="font-bold">Action:</span> {entry.data.action}</div>}
                        </div>
                    )}

                    {entry.type === 'daily-log' && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-widest text-slate-500 font-bold">
                                <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">Mood: {entry.data.mood || 'n/a'}</span>
                                <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">Cravings: {entry.data.cravings === null ? 'n/a' : entry.data.cravings ? 'yes' : 'no'}</span>
                                <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1">Used: {entry.data.used === null ? 'n/a' : entry.data.used ? 'yes' : 'no'}</span>
                            </div>
                            {entry.data.note && <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-handlee text-lg">{entry.data.note}</p>}
                        </div>
                    )}

                    {entry.type === 'step-1-worksheet' && entry.data && (() => {
                        // Cast to Record for dynamic property access
                        const worksheetData = entry.data as unknown as Record<string, unknown>

                        return (
                            <div className="space-y-6">
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                    <h4 className="font-bold text-green-900 mb-2">📗 Step 1 Worksheet</h4>
                                    <p className="text-sm text-green-800">Powerlessness • Unmanageability • Acceptance</p>
                                </div>

                                {/* Concept 1: Powerlessness over Amount */}
                                <div className="space-y-3">
                                    <h5 className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-200 pb-1">Concept 1: Powerlessness over Amount</h5>
                                    {renderWorksheetField(worksheetData, 'concept1_q1_examples', 'concept1_q1_results', '1.1 Tried to stop drinking/drugging')}
                                    {renderWorksheetField(worksheetData, 'concept1_q2_examples', 'concept1_q2_results', '1.2 Tried to limit/control by dosage')}
                                    {renderWorksheetField(worksheetData, 'concept1_q3_examples', 'concept1_q3_results', '1.3 Tried to limit by switching drinks')}
                                    {renderWorksheetField(worksheetData, 'concept1_q4_examples', 'concept1_q4_results', '1.4 Tried to limit by time restrictions')}
                                    {renderWorksheetArray(worksheetData, 'concept1_q5', '1.5 Blackouts/memory loss')}
                                </div>

                                {/* Concept 2: Powerlessness over Bad Results */}
                                <div className="space-y-3">
                                    <h5 className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-200 pb-1">Concept 2: Powerlessness over Bad Results</h5>
                                    {renderWorksheetField(worksheetData, 'concept2_q1_examples', 'concept2_q1_results', '2.1 Tried to drink without bad results')}
                                    {renderWorksheetField(worksheetData, 'concept2_q2_examples', 'concept2_q2_results', '2.2 Tried to limit health effects')}
                                    {renderWorksheetField(worksheetData, 'concept2_q3_examples', 'concept2_q3_results', '2.3 Other control attempts')}
                                </div>

                                {/* Concept 3: Unmanageability */}
                                <div className="space-y-3">
                                    <h5 className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-200 pb-1">Concept 3: Unmanageability</h5>
                                    {renderWorksheetArray(worksheetData, 'concept3_q1', '3.1 What brought me to AA')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q2', '3.2 Crisis that would have occurred')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q3', '3.3 Effect on self-esteem')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q4', '3.4 Physical fights')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q5', '3.5 Lost job/promotion')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q6', '3.6 Lost relationships')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q7', '3.7 Hospitalizations')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q8', '3.8 Depression/suicide')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q9', '3.9 Effect on life goals')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q10', '3.10 Health effects')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q11', '3.11 Danger to life')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q12', '3.12 Objections from loved ones')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q13', '3.13 Physical abuse')}
                                    {renderWorksheetArray(worksheetData, 'concept3_q14', '3.14 Effects while sober')}
                                </div>

                                {/* Conclusions */}
                                <div className="space-y-3">
                                    <h5 className="font-bold text-amber-900 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">Conclusions</h5>
                                    {renderWorksheetArray(worksheetData, 'conclusion_q1', '4.1 Why I can\'t use safely')}
                                    {renderWorksheetString(worksheetData, 'conclusion_q2', '4.2 Admitting vs accepting')}
                                    {renderWorksheetString(worksheetData, 'conclusion_q3', '4.3 Am I an alcoholic?')}
                                    {renderWorksheetArray(worksheetData, 'conclusion_q4', '4.4 Reasons to continue in AA')}
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}

// Helper functions for rendering Step 1 Worksheet data
function renderWorksheetField(data: Record<string, unknown>, examplesKey: string, resultsKey: string, label: string) {
    // Runtime type guards to validate data
    const examplesRaw = data[examplesKey]
    const resultsRaw = data[resultsKey]

    const examples = Array.isArray(examplesRaw) && examplesRaw.every(item => typeof item === 'string')
        ? examplesRaw as string[]
        : []
    const results = Array.isArray(resultsRaw) && resultsRaw.every(item => typeof item === 'string')
        ? resultsRaw as string[]
        : []

    // Handle mismatched array lengths by using the longer one
    const maxLength = Math.max(examples.length, results.length)
    if (maxLength === 0) return null

    // Check if there's any actual content
    const contentExists = Array.from({ length: maxLength }).some((_, i) =>
        examples[i]?.trim() || results[i]?.trim()
    )
    if (!contentExists) return null

    return (
        <div className="text-sm pl-3 border-l-2 border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            {Array.from({ length: maxLength }).map((_, i) => {
                const example = examples[i]
                const result = results[i]

                if (!example?.trim() && !result?.trim()) {
                    return null
                }

                return (
                    <div key={i} className="ml-2 mb-2 text-xs">
                        {example?.trim() && <p className="text-slate-600"><span className="font-semibold">Example:</span> {example}</p>}
                        {result?.trim() && <p className="text-slate-500"><span className="font-semibold">Result:</span> {result}</p>}
                    </div>
                )
            })}
        </div>
    )
}

function renderWorksheetArray(data: Record<string, unknown>, key: string, label: string) {
    // Runtime type guard to validate data is an array of strings
    const raw = data[key]
    const values = Array.isArray(raw) && raw.every(item => typeof item === 'string')
        ? raw as string[]
        : []

    const filledValues = values.filter(v => v.trim())
    if (filledValues.length === 0) return null

    return (
        <div className="text-sm pl-3 border-l-2 border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            {filledValues.map((value, i) => (
                <p key={i} className="ml-2 text-slate-600 text-xs mb-1">• {value}</p>
            ))}
        </div>
    )
}

function renderWorksheetString(data: Record<string, unknown>, key: string, label: string) {
    // Runtime type guard to validate data is a string
    const raw = data[key]
    const value = typeof raw === 'string' ? raw : ''

    if (!value.trim()) return null

    return (
        <div className="text-sm pl-3 border-l-2 border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            <p className="ml-2 text-slate-600 text-xs">{value}</p>
        </div>
    )
}
