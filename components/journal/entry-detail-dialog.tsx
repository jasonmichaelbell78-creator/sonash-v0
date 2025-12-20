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
                    {entry.type === 'mood' && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center">
                            <span className="text-4xl block mb-2">{entry.data.mood}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feeling (Intensity: {entry.data.intensity}/10)</span>
                            {entry.data.note && <p className="mt-2 text-sm text-slate-600">{entry.data.note}</p>}
                        </div>
                    )}

                    {entry.type === 'gratitude' && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
                            <ul className="list-disc pl-5">
                                {entry.data.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {entry.type === 'inventory' && (
                        <div className="space-y-4">
                            <div><span className="font-bold">Resentments:</span> {entry.data.resentments}</div>
                            <div><span className="font-bold">Dishonesty:</span> {entry.data.dishonesty}</div>
                            <div><span className="font-bold">Apologies:</span> {entry.data.apologies}</div>
                            <div><span className="font-bold">Successes:</span> {entry.data.successes}</div>
                        </div>
                    )}

                    {(entry.type === 'free-write' || entry.type === 'meeting-note') && (
                        <>
                            {entry.data.title && <h4 className="font-bold text-xl mb-2 font-heading">{entry.data.title}</h4>}
                            {entry.data.content}
                        </>
                    )}

                    {entry.type === 'spot-check' && (
                        <div className="space-y-2">
                            <div><span className="font-bold">Feelings:</span> {entry.data.feelings?.join(', ')}</div>
                            <div><span className="font-bold">Absolutes:</span> {entry.data.absolutes?.join(', ')}</div>
                            {entry.data.action && <div><span className="font-bold">Action:</span> {entry.data.action}</div>}
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
                </div>
            </div>
        </div>
    )
}
