"use client";

import { motion } from "framer-motion";
import { Quote as QuoteIcon, Sparkles } from "lucide-react";
import { useDailyQuote } from "@/hooks/use-daily-quote";

/**
 * Daily Quote Card - displays a rotating recovery quote
 * Changes daily based on the current date
 *
 * CANON-0023: Uses shared useDailyQuote hook for consolidated fetch logic
 */
export default function DailyQuoteCard() {
  const { quote, loading } = useDailyQuote();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-amber-50/90 to-amber-100/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-amber-200/50"
      >
        <div className="flex items-center justify-center gap-2 text-amber-600/50">
          <QuoteIcon className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-medium">Loading quote...</span>
        </div>
      </motion.div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-gradient-to-br from-amber-50/95 to-amber-100/95 backdrop-blur-sm rounded-lg p-4 shadow-md border border-amber-200/60 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Sparkle icon */}
      <Sparkles className="absolute top-2 right-2 w-5 h-5 text-amber-400/60" />

      {/* Quote text */}
      <div className="pr-6">
        <QuoteIcon className="w-4 h-4 text-amber-400/70 mb-2" />
        <p className="font-handlee text-sm leading-relaxed text-amber-900 italic">"{quote.text}"</p>
        <p className="font-handlee text-xs text-amber-700/70 mt-2 text-right">
          — {quote.author || "Unknown"}
          {quote.source && <span className="text-amber-600/60 font-normal"> ({quote.source})</span>}
        </p>
      </div>

      {/* "Daily Quote" label */}
      <div className="absolute bottom-1 left-3 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
        <span className="text-[10px] uppercase tracking-wider font-medium text-amber-600/50">
          Daily Quote
        </span>
      </div>
    </motion.div>
  );
}
