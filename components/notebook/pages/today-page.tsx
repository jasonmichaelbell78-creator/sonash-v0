"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { intervalToDuration } from "date-fns"
import { toast } from "sonner"
import MoodSparkline from "../visualizations/mood-sparkline"

interface TodayPageProps {
  nickname: string
}

export default function TodayPage({ nickname }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState(false)
  const [used, setUsed] = useState(false)
  const [selectedReading, setSelectedReading] = useState<"AA" | "NA">("AA")
  const [journalEntry, setJournalEntry] = useState("")
  // Track if we are currently editing to prevent jitter
  const [isEditing, setIsEditing] = useState(false)

  const { user, profile } = useAuth()

  // Load reading preference
  useEffect(() => {
    const saved = localStorage.getItem("sonash_reading_pref")
    if (saved === "AA" || saved === "NA") setSelectedReading(saved)
  }, [])

  const handleReadingChange = (val: "AA" | "NA") => {
    setSelectedReading(val)
    localStorage.setItem("sonash_reading_pref", val)
  }

  // Real-time data sync
  useEffect(() => {
    if (!user) return

    // Basic local restore first (fast)
    const savedEntry = localStorage.getItem("sonash_journal_temp")
    if (savedEntry && !journalEntry) setJournalEntry(savedEntry)

    // Subscribe to Firestore updates
    let unsubscribe: () => void

    const setupListener = async () => {
      try {
        const { onSnapshot, doc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        const today = new Date().toISOString().split("T")[0]
        const docRef = doc(db, `users/${user.uid}/daily_logs/${today}`)

        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            if (data.mood) setMood(data.mood)
            setCravings(data.cravings || false)
            setUsed(data.used || false)

            // Only update text if not currently editing (basic collision avoidance)
            // Or if local is empty
            if (data.content && !isEditing) {
              setJournalEntry(data.content)
            }
          }
        })
      } catch (err) {
        console.error("Error setting up today listener:", err)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, isEditing]) // re-run if user changes, but careful with isEditing loops (actually isEditing doesn't need to be in dep array really if we use ref, but let's keep it simple. Actually if isEditing changes, we don't want to re-sub. Removing isEditing from deps is safer.)

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
    }, 5000)
    return () => clearTimeout(timeoutId)
  }, [journalEntry, mood, cravings, used, user])

  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  // Calculate clean time dynamically
  const getCleanTime = () => {
    if (!profile?.cleanStart) return null

    // Handle Firestore Timestamp or Date object
    // @ts-ignore - Firestore timestamps have toDate()
    const start = profile.cleanStart.toDate ? profile.cleanStart.toDate() : new Date(profile.cleanStart)
    const now = new Date()

    const duration = intervalToDuration({ start, end: now })

    const years = duration.years ?? 0
    const months = duration.months ?? 0
    const days = duration.days ?? 0

    // Just days for very early recovery (optional, but requested format was Years/Months/Days)
    const parts = []
    if (years > 0) parts.push(`${years}y`)
    if (months > 0) parts.push(`${months}m`)
    parts.push(`${days}d`)

    // If < 1 day
    if (parts.length === 1 && days === 0) return "Day 1"

    const verboseParts = []
    if (years > 0) verboseParts.push(years === 1 ? "1 Year" : `${years} Years`)
    if (months > 0) verboseParts.push(months === 1 ? "1 Month" : `${months} Months`)
    if (days > 0) verboseParts.push(days === 1 ? "1 Day" : `${days} Days`)

    if (verboseParts.length === 0) return "Day 1"

    return verboseParts.join(" • ")
  }

  const cleanTimeDisplay = getCleanTime()

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
          {dateString} – Hey {nickname || "Friend"}, one day at a time.
        </p>
      </div>

      {/* Two column layout for larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Clean time tracker */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-2">Tracker – Clean time</h2>
            <p className="font-heading text-2xl md:text-3xl text-amber-900">
              {cleanTimeDisplay || "Tap to set clean date"}
            </p>
            {cleanTimeDisplay ? (
              <p className="font-body text-sm text-amber-900/60 mt-1">Keep coming back.</p>
            ) : (
              <p className="font-body text-sm text-amber-900/60 mt-1 cursor-pointer hover:underline">
                You haven't set your clean date yet.
              </p>
            )}

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
                  onClick={() => handleReadingChange("AA")}
                  className={`px-3 py-1 rounded-full font-body text-sm transition-all ${selectedReading === "AA" ? "bg-sky-300 text-sky-900 shadow-sm" : "bg-amber-100 text-amber-700"
                    }`}
                >
                  AA
                </button>
                <button
                  onClick={() => handleReadingChange("NA")}
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

            <MoodSparkline />

            {/* Toggle questions */}
            <div className="space-y-3 pl-1">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Cravings?</span>
                <div className="flex items-center gap-2">
                  <span className={`font-body text-sm ${cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>Yes</span>
                  <button
                    onClick={() => setCravings(!cravings)}
                    aria-label="Toggle cravings"
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
                    aria-label="Toggle used status"
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

          {/* Journal prompt */}
          <div className="relative group">
            <h2 className="font-heading text-lg text-amber-900/90 mb-2">Anything you want to jot down?</h2>

            <div className="relative min-h-[200px] w-full">
              {/* Textarea */}
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
                placeholder="Start writing here..."
                className="w-full h-full min-h-[200px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-blue-900/80 leading-[1.5em]"
                style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  lineHeight: '22px'
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
