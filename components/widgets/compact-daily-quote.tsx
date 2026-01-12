"use client"

import { Sparkles } from "lucide-react"
import { useDailyQuote } from "@/hooks/use-daily-quote"

/**
 * Compact Daily Quote - Minimal version for top-right header
 * Just shows first few words as a hint
 *
 * CANON-0023: Uses shared useDailyQuote hook for consolidated fetch logic
 */
export default function CompactDailyQuote() {
    const { quote } = useDailyQuote()

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
