"use client"

import { useState, useEffect } from "react"
import { QuotesService, type Quote } from "@/lib/db/quotes"
import { Loader2 } from "lucide-react"

export function DailyQuoteCard() {
    const [quote, setQuote] = useState<Quote | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                // Fetch all quotes and pick one for today
                // In a real production app with thousands of quotes, we'd query for a specific ID or use a Cloud Function
                // For MVP, client-side rotation is fine
                const allQuotes = await QuotesService.getAllQuotes()
                const todayQuote = QuotesService.getQuoteForToday(allQuotes)
                setQuote(todayQuote)
            } catch (error) {
                console.error("Failed to fetch quote", error)
            } finally {
                setLoading(false)
            }
        }
        fetchQuote()
    }, [])

    if (loading) {
        return (
            <div className="bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02] flex items-center justify-center min-h-[100px]"
                style={{
                    boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
                    transform: "rotate(-1deg)",
                }}>
                <Loader2 className="w-5 h-5 text-amber-900/30 animate-spin" />
            </div>
        )
    }

    if (!quote) return (
        <div className="bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02]"
            style={{
                boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
                transform: "rotate(-1deg)",
            }}
        >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400/80 shadow-inner backdrop-blur-sm" />
            <p className="font-heading text-lg text-amber-900 text-center pt-2">
                Serenity is found in the moment.
            </p>
            <p className="font-body text-xs text-amber-700/60 text-center mt-2 italic">
                Daily inspiration (Default)
            </p>
        </div>
    )

    return (
        <div
            className="bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02]"
            style={{
                boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
                transform: "rotate(-1deg)",
            }}
        >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400/80 shadow-inner backdrop-blur-sm" />
            <p className="font-heading text-lg text-amber-900 text-center pt-2">
                "{quote.text}"
            </p>
            <p className="font-body text-xs text-amber-700/60 text-center mt-2">
                — {quote.author || "Unknown"}
            </p>
        </div>
    )
}
