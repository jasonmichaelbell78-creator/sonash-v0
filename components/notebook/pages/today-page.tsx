"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { intervalToDuration } from "date-fns"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import MoodSparkline from "../visualizations/mood-sparkline"
import { AuthErrorBanner } from "@/components/status/auth-error-banner"
import { logger, maskIdentifier } from "@/lib/logger"
import { getTodayDateId, formatDateForDisplay } from "@/lib/utils/date-utils"
import { toDate } from "@/lib/types/firebase-types"
import { STORAGE_KEYS, READING_PREFS, DEBOUNCE_DELAYS, buildPath } from "@/lib/constants"

interface TodayPageProps {
  nickname: string
}

export default function TodayPage({ nickname }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState(false)
  const [used, setUsed] = useState(false)
  const [selectedReading, setSelectedReading] = useState<"AA" | "NA">("AA")
  const [journalEntry, setJournalEntry] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveComplete, setSaveComplete] = useState(false)
  // Use ref instead of state to prevent re-triggering effects
  const isEditingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Track pending save data to avoid race conditions
  const pendingSaveRef = useRef<{
    journalEntry: string
    mood: string | null
    cravings: boolean
    used: boolean
  } | null>(null)
  // Track if a save is already scheduled
  const saveScheduledRef = useRef(false)

  const { user, profile } = useAuth()
  const referenceDate = useMemo(() => new Date(), [])

  // Load reading preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.READING_PREF)
    if (saved === READING_PREFS.AA || saved === READING_PREFS.NA) {
      setSelectedReading(saved as "AA" | "NA")
    }
  }, [])

  const handleReadingChange = (val: "AA" | "NA") => {
    setSelectedReading(val)
    localStorage.setItem(STORAGE_KEYS.READING_PREF, val)
  }

  // Real-time data sync
  useEffect(() => {
    if (!user) return

    // Basic local restore first (fast)
    const savedEntry = localStorage.getItem(STORAGE_KEYS.JOURNAL_TEMP)
    if (savedEntry && !journalEntry) setJournalEntry(savedEntry)

    // Subscribe to Firestore updates
    let unsubscribe: (() => void) | undefined
    let isMounted = true

    const setupListener = async () => {
      try {
        const { onSnapshot, doc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        const today = getTodayDateId(referenceDate)
        const docRef = doc(db, buildPath.dailyLog(user.uid, today))

        if (isMounted) {
          unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
              if (!isMounted) return // Guard against late callbacks

              if (docSnap.exists()) {
                const data = docSnap.data()
                if (data.mood) setMood(data.mood)
                setCravings(data.cravings || false)
                setUsed(data.used || false)

                // Only update text if not currently editing (collision avoidance)
                if (data.content && !isEditingRef.current) {
                  setJournalEntry(data.content)
                  // Position cursor at end of text on load
                  setTimeout(() => {
                    if (textareaRef.current) {
                      const len = data.content.length
                      textareaRef.current.setSelectionRange(len, len)
                    }
                  }, 0)
                }
              }
            },
            (error) => {
              logger.error("Error in today listener", {
                userId: maskIdentifier(user.uid),
                error,
              })
            }
          )
        }
      } catch (err) {
        logger.error("Error setting up today listener", {
          userId: maskIdentifier(user?.uid),
          error: err,
        })
      }
    }

    setupListener()

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [referenceDate, user, journalEntry]) // journalEntry added for exhaustive-deps; isEditingRef handles collision avoidance

  // Perform the actual save operation
  const performSave = useCallback(async () => {
    if (!user || !pendingSaveRef.current) return

    const dataToSave = pendingSaveRef.current
    pendingSaveRef.current = null
    saveScheduledRef.current = false

    setIsSaving(true)
    setSaveComplete(false)
    try {
      // Always save locally first as backup
      localStorage.setItem(STORAGE_KEYS.JOURNAL_TEMP, dataToSave.journalEntry)

      // DEBUG: Log what we're about to save
      // Don't include date - firestore-service generates it in YYYY-MM-DD format
      const saveData = {
        content: dataToSave.journalEntry,
        mood: dataToSave.mood,
        cravings: dataToSave.cravings,
        used: dataToSave.used,
      }
      console.log('💾 Attempting to save:', saveData)

      // Save to cloud
      await FirestoreService.saveDailyLog(user.uid, saveData)
      setSaveComplete(true)
      // Hide "Saved" message after 2 seconds
      setTimeout(() => setSaveComplete(false), 2000)
    } catch (error) {
      logger.error("Autosave failed", { userId: maskIdentifier(user.uid), error })
      toast.error("We couldn't save today's notes. Please check your connection.")
    } finally {
      setIsSaving(false)
    }
  }, [referenceDate, user])

  // Auto-save effect: marks data as dirty and schedules a save
  // The timer only starts once per change batch, not reset on every keystroke
  useEffect(() => {
    if (!user) return

    // Update the pending save data
    pendingSaveRef.current = { journalEntry, mood, cravings, used }

    // If a save is already scheduled, don't schedule another
    // This prevents timer reset on every keystroke
    if (saveScheduledRef.current) return

    saveScheduledRef.current = true
    const timeoutId = setTimeout(() => {
      performSave()
    }, DEBOUNCE_DELAYS.AUTO_SAVE)

    return () => {
      clearTimeout(timeoutId)
      saveScheduledRef.current = false
    }
  }, [journalEntry, mood, cravings, used, user, performSave])

  const dateString = formatDateForDisplay(referenceDate)

  // Calculate clean time dynamically
  const getCleanTime = () => {
    if (!profile?.cleanStart) return null

    // Handle Firestore Timestamp or Date object
    const start = toDate(profile.cleanStart)
    if (!start) return null

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

      <AuthErrorBanner />

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
            <div className="flex justify-between gap-2 mb-4" role="group" aria-label="Mood selection">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  aria-label={`Set mood to ${m.label}`}
                  aria-pressed={mood === m.id}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${mood === m.id
                    ? "bg-amber-100 scale-110 shadow-sm ring-1 ring-amber-200"
                    : "hover:bg-amber-50"
                    }`}
                >
                  <span className="text-2xl md:text-3xl filter drop-shadow-sm" aria-hidden="true">{m.emoji}</span>
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
                  <span className={`font-body text-sm ${!cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>No</span>
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
                  <span className={`font-body text-sm ${cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>Yes</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Used?</span>
                <div className="flex items-center gap-2">
                  <span className={`font-body text-sm ${!used ? "text-amber-900 font-bold" : "text-amber-900/40"}`}>No</span>
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
                  <span className={`font-body text-sm ${used ? "text-red-700 font-bold" : "text-amber-900/40"}`}>Yes</span>
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
                ref={textareaRef}
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                onFocus={(e) => {
                  isEditingRef.current = true
                  // If there's existing content and cursor is not already at end, jump to end
                  if (journalEntry && e.target.selectionStart !== journalEntry.length) {
                    const len = journalEntry.length
                    e.target.setSelectionRange(len, len)
                    // Scroll to bottom
                    e.target.scrollTop = e.target.scrollHeight
                  }
                }}
                onBlur={() => (isEditingRef.current = false)}
                onKeyDown={(e) => {
                  // Prevent Enter from resetting state
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                  }
                }}
                placeholder="Start writing here..."
                className="w-full h-full min-h-[200px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-blue-900/80 leading-[1.5em]"
                style={{
                  fontFamily: 'var(--font-caveat), cursive',
                  lineHeight: '22px'
                }}
                spellCheck={false}
              />
              {/* Save indicator */}
              <div className="absolute -bottom-6 right-0 text-xs font-body italic">
                {isSaving ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                ) : saveComplete ? (
                  <span className="text-green-600 font-bold">✓ Saved</span>
                ) : null}
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
