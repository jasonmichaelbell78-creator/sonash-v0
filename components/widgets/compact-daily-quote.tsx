"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { QuotesService, Quote } from "@/lib/db/quotes"
import { logger } from "@/lib/logger"

/**
 * Compact Daily Quote - Minimal version for top-right header
 * Just shows first few words as a hint
 */
export default function CompactDailyQuote() {
    const [quote, setQuote] = useState<Quote | null>(null)

    useEffect(() => {
        async function fetchQuote() {
            try {
                const allQuotes = await QuotesService.getAllQuotes()
                if (allQuotes.length === 0) return

                const todayQuote = QuotesService.getQuoteForToday(allQuotes)
                setQuote(todayQuote)
            } catch (error) {
                logger.error("Error fetching daily quote", { error })
            }
        }

        fetchQuote()
    }, [])

    if (!quote) return null

    // Get first 30 characters of quote as preview
    const preview = quote.text.length > 30
        ? quote.text.substring(0, 30) + "..."
        : quote.text

    return (
        <div className="flex items-center gap-1.5 text-amber-900/50 hover:text-amber-900/70 transition-colors cursor-pointer group max-w-xs">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-handlee text-xs italic truncate">"{preview}"</span>
        </div>
    )
}
