"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"

interface TodayPageProps {
  nickname: string
}

export default function TodayPage({ nickname }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState(false)
  const [used, setUsed] = useState(false)
  const [selectedReading, setSelectedReading] = useState<"AA" | "NA">("AA")
  const [journalEntry, setJournalEntry] = useState("")

  const { user } = useAuth()

  // Load saved data on mount
  useEffect(() => {
    // Basic local restore first (fast)
    const savedEntry = localStorage.getItem("sonash_journal_temp")
    if (savedEntry) setJournalEntry(savedEntry)

    // Then try to fetch from cloud if user exists
    if (user) {
      FirestoreService.getTodayLog(user.uid).then((log) => {
        if (log) {
          if (log.content) setJournalEntry(log.content)
          if (log.mood) setMood(log.mood)
          setCravings(log.cravings)
          setUsed(log.used)
        }
      })
    }
  }, [user])

  // Auto-save effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Always save locally first as backup
      localStorage.setItem("sonash_journal_temp", journalEntry)

      // Save to cloud if user is logged in
      if (user) {
        FirestoreService.saveDailyLog(user.uid, {
          date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
          content: journalEntry,
          mood: mood,
          cravings: cravings,
          used: used
        })
      }
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [journalEntry, mood, cravings, used, user])

  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  // We'll use the variable name defined in layout.tsx via CSS variable usually,
  // but to be safe and explicit with Tailwind using arbitrary values or the class if globally mapped.
  // Inspection of globals.css would confirm, but usually `font-caveat` works if configured.
  // Based on layout.tsx: variable: "--font-caveat".
  // So `font-[family-name:var(--font-caveat)]` is the Next.js way.

  const moods = [
    { id: "struggling", emoji: "😟", label: "Struggling", color: "text-red-500" },
    { id: "okay", emoji: "😐", label: "Okay", color: "text-orange-500" },
    { id: "hopeful", emoji: "🙂", label: "Hopeful", color: "text-lime-500" },
    { id: "great", emoji: "😊", label: "Great", color: "text-green-500" },
  ]

  return (
    <div className="h-full overflow-y-auto pr-2 pb-8 scrollbar-hide">
      {/* Header */}
      <div className="mb-6">
        <p className="font-body text-lg text-amber-900/80 underline decoration-amber-900/30">
          {dateString} – Hey {nickname}, one day at a time.
        </p>
      </div>

      {/* Two column layout for larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Clean time tracker */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-2">Tracker – Clean time</h2>
            <p className="font-heading text-2xl md:text-3xl text-amber-900">1 year · 2 months · 5 days</p>
            <p className="font-body text-sm text-amber-900/60 mt-1">... and 13 minutes so far today</p>
            <p className="font-body text-sm text-amber-900/50 mt-2 flex items-center gap-1 cursor-pointer hover:text-amber-700 transition-colors">
              <span className="inline-block rotate-45">↑</span>
              Tap here if something happened today
            </p>
          </div>

          {/* Today's reading */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="font-heading text-xl text-amber-900/90">Today's Reading</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedReading("AA")}
                  className={`px-3 py-1 rounded-full font-body text-sm transition-all ${selectedReading === "AA" ? "bg-sky-300 text-sky-900 shadow-sm" : "bg-amber-100 text-amber-700"
                    }`}
                >
                  AA
                </button>
                <button
                  onClick={() => setSelectedReading("NA")}
                  className={`px-3 py-1 rounded-full font-body text-sm transition-all ${selectedReading === "NA" ? "bg-amber-400 text-amber-900 shadow-sm" : "bg-amber-100 text-amber-700"
                    }`}
                >
                  NA
                </button>
              </div>
            </div>

            {/* Sticky note style reading card */}
            <div
              className="bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02] cursor-pointer"
              style={{
                boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
                transform: "rotate(-1deg)",
              }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400/80 shadow-inner backdrop-blur-sm" />
              <p className="font-heading text-lg text-amber-900 text-center mb-3 pt-2">
                Serenity is found in the moment.
              </p>
              <button className="block mx-auto bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded font-body text-amber-900 text-sm transition-colors">
                Open full reading
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Check-in */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-3">Check-In: How are you doing today?</h2>
            <div className="flex justify-between gap-2 mb-4">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${mood === m.id
                    ? "bg-amber-100 scale-110 shadow-sm ring-1 ring-amber-200"
                    : "hover:bg-amber-50"
                    }`}
                >
                  <span className="text-2xl md:text-3xl filter drop-shadow-sm">{m.emoji}</span>
                  <span className="font-body text-xs text-amber-900/70 mt-1">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Toggle questions */}
            <div className="space-y-3 pl-1">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Cravings?</span>
                <div className="flex items-center gap-2">
                  <span className={`font-body text-sm ${cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>Yes</span>
                  <button
                    onClick={() => setCravings(!cravings)}
                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-amber-300/50 ${cravings ? "bg-amber-400" : "bg-gray-300"
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${cravings ? "translate-x-6" : "translate-x-0"
                        }`}
                    />
                  </button>
                  <span className={`font-body text-sm ${!cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>No</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Used?</span>
                <div className="flex items-center gap-2">
                  <span className={`font-body text-sm ${used ? "text-red-700 font-bold" : "text-amber-900/40"}`}>Yes</span>
                  <button
                    onClick={() => setUsed(!used)}
                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-red-300/50 ${used ? "bg-red-400" : "bg-gray-300"
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${used ? "translate-x-6" : "translate-x-0"
                        }`}
                    />
                  </button>
                  <span className={`font-body text-sm ${!used ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>No</span>
                </div>
              </div>
            </div>
          </div>

          {/* Journal prompt - REPLACED WITH TEXTAREA */}
          <div className="relative group">
            <h2 className="font-heading text-lg text-amber-900/90 mb-2">Anything you want to jot down?</h2>

            <div className="relative min-h-[200px] w-full">
              {/* Textarea */}
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Start writing here..."
                className="w-full h-full min-h-[200px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-blue-900/80 leading-[1.5em]"
                style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  lineHeight: '22px' // Matches the background lines in notebook-shell roughly
                }}
                spellCheck={false}
              />
              {/* Optional: Save indicator */}
              <div className="absolute -bottom-6 right-0 text-xs text-amber-900/40 font-body italic">
                {journalEntry ? "Saved locally" : "Autosaves as you type"}
              </div>
            </div>
          </div>

          {/* Navigation hint */}
          <div className="flex items-center justify-between pt-4">
            <a href="/history" className="font-heading text-amber-900/60 hover:text-amber-900 text-sm border-b border-amber-900/30 hover:border-amber-900 transition-colors">
              My Journal History →
            </a>
            <p className="font-body text-sm text-amber-900/50 text-right">Swipe left for more →</p>
          </div>
        </div>
      </div>
    </div>
  )
}
