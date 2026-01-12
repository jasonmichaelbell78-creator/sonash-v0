"use client";

import { Loader2 } from "lucide-react";
import { useDailyQuote } from "@/hooks/use-daily-quote";

/**
 * Daily Quote Card (Notebook variant) - Sticky note style quote display
 *
 * CANON-0023: Uses shared useDailyQuote hook for consolidated fetch logic
 */
export function DailyQuoteCard() {
  const { quote, loading } = useDailyQuote();

  if (loading) {
    return (
      <div
        className="bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02] flex items-center justify-center min-h-[100px]"
        style={{
          boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
          transform: "rotate(-1deg)",
        }}
      >
        <Loader2 className="w-5 h-5 text-amber-900/30 animate-spin" />
      </div>
    );
  }

  if (!quote)
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
          Serenity is found in the moment.
        </p>
        <p className="font-body text-xs text-amber-700/60 text-center mt-2 italic">
          Daily inspiration (Default)
        </p>
      </div>
    );

  return (
    <div
      className="bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02]"
      style={{
        boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
        transform: "rotate(-1deg)",
      }}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400/80 shadow-inner backdrop-blur-sm" />
      <p className="font-heading text-lg text-amber-900 text-center pt-2">"{quote.text}"</p>
      <p className="font-body text-xs text-amber-700/60 text-center mt-2">
        — {quote.author || "Unknown"}
      </p>
    </div>
  );
}
