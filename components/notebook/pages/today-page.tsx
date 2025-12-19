"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { intervalToDuration, subDays, startOfDay, format } from "date-fns"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import MoodSparkline from "../visualizations/mood-sparkline"
import { AuthErrorBanner } from "@/components/status/auth-error-banner"
import { logger, maskIdentifier } from "@/lib/logger"
import { getTodayDateId, formatDateForDisplay } from "@/lib/utils/date-utils"
import { toDate } from "@/lib/types/firebase-types"
import { STORAGE_KEYS, DEBOUNCE_DELAYS, buildPath } from "@/lib/constants"
import { NotebookModuleId } from "../notebook-types"
import { DailyQuoteCard } from "../features/daily-quote-card"
import CompactMeetingCountdown from "@/components/widgets/compact-meeting-countdown"
import { useJournal } from "@/hooks/use-journal"

interface TodayPageProps {
  nickname: string
  onNavigate: (id: NotebookModuleId) => void
}

export default function TodayPage({ nickname, onNavigate }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState<boolean | null>(null)
  const [used, setUsed] = useState<boolean | null>(null)
  const [journalEntry, setJournalEntry] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveComplete, setSaveComplete] = useState(false)
  const [weekStats, setWeekStats] = useState({ daysLogged: 0, streak: 0 })
  // Use ref instead of state to prevent re-triggering effects
  const isEditingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Track pending save data to avoid race conditions
  const pendingSaveRef = useRef<{
    journalEntry: string
    mood: string | null
    cravings: boolean | null
    used: boolean | null
  } | null>(null)
  // Track if a save is already scheduled
  const saveScheduledRef = useRef(false)
  // Track if user has interacted - prevents save on mount
  const hasUserInteractedRef = useRef(false)

  const { user, profile } = useAuth()
  const { addEntry } = useJournal()
  const referenceDate = useMemo(() => new Date(), [])

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
                // Preserve null state if values don't exist in old data
                if (data.cravings !== undefined) setCravings(data.cravings)
                if (data.used !== undefined) setUsed(data.used)

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

      // Save check-in entry only when user has actively chosen values
      // mood OR (cravings is explicitly set AND used is explicitly set)
      const hasCheckInData = dataToSave.mood !== null ||
        (dataToSave.cravings !== null && dataToSave.used !== null)

      if (hasCheckInData) {
        await addEntry('check-in', {
          mood: dataToSave.mood,
          cravings: dataToSave.cravings ?? false,
          used: dataToSave.used ?? false,
        })
      }

      // Save daily-log entry (notepad content)
      if (dataToSave.journalEntry.trim()) {
        await addEntry('daily-log', {
          content: dataToSave.journalEntry,
          wordCount: dataToSave.journalEntry.split(/\s+/).filter(Boolean).length,
        })
      }

      setSaveComplete(true)
      // Hide "Saved" message after 2 seconds
      setTimeout(() => setSaveComplete(false), 2000)
    } catch (error) {
      logger.error("Autosave failed", { userId: maskIdentifier(user.uid), error })
      toast.error("We couldn't save today's notes. Please check your connection.")
    } finally {
      setIsSaving(false)
    }
  }, [referenceDate, user, addEntry])

  // Auto-save effect: marks data as dirty and schedules a save
  // The timer only starts once per change batch, not reset on every keystroke
  useEffect(() => {
    if (!user) return

    // Update the pending save data
    pendingSaveRef.current = { journalEntry, mood, cravings, used }

    // If a save is already scheduled, don't schedule another
    // This prevents timer reset on every keystroke
    if (saveScheduledRef.current) return

    // Don't save if user hasn't interacted yet (prevents save on mount)
    if (!hasUserInteractedRef.current) return

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

  // Calculate clean time dynamically with minutes
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
    const hours = duration.hours ?? 0
    const minutes = duration.minutes ?? 0

    const parts = []

    // Build parts with graduated text sizes
    if (years > 0) {
      parts.push({
        text: years === 1 ? "1 Year" : `${years} Years`,
        size: "text-3xl md:text-4xl"
      })
    }
    if (months > 0) {
      parts.push({
        text: months === 1 ? "1 Month" : `${months} Months`,
        size: "text-2xl md:text-3xl"
      })
    }
    if (days > 0) {
      parts.push({
        text: days === 1 ? "1 Day" : `${days} Days`,
        size: "text-xl md:text-2xl"
      })
    }

    // Always show minutes for ALL users
    const totalMinutes = hours * 60 + minutes
    parts.push({
      text: totalMinutes === 1 ? "1 Minute" : `${totalMinutes} Minutes`,
      size: "text-lg md:text-xl"
    })

    if (parts.length === 0) return null

    return parts
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
      <div className="mb-6 pt-2">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="font-heading text-xl md:text-2xl text-amber-900 font-bold mb-1">
              {dateString}
            </p>
            <p className="font-handlee text-amber-900/60 text-sm">
              One day at a time, {nickname || "friend"}.
            </p>
          </div>
          {/* Top-right widget - Next Closest Meeting */}
          <div className="flex items-end">
            <CompactMeetingCountdown />
          </div>
        </div>
      </div>

      <AuthErrorBanner />

      {/* Two column layout for larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Clean time tracker */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-2">Tracker – Clean time</h2>
            {cleanTimeDisplay ? (
              <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
                {cleanTimeDisplay.map((part, index) => (
                  <span key={index} className="text-center">
                    <span className={`font-heading ${part.size} text-amber-900 font-bold`}>
                      {part.text}
                    </span>
                    {index < cleanTimeDisplay.length - 1 && (
                      <span className="text-amber-900/40 mx-1">•</span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-heading text-2xl md:text-3xl text-amber-900 text-center">
                Tap to set clean date
              </p>
            )}
            {cleanTimeDisplay ? (
              <p className="font-body text-sm text-amber-900/60 mt-1">Keep coming back.</p>
            ) : (
              <p className="font-body text-sm text-amber-900/60 mt-1 cursor-pointer hover:underline">
                You haven't set your clean date yet.
              </p>
            )}
          </div>


          {/* Daily Inspiration (from DB) */}
          <DailyQuoteCard />

          {/* Today's Reading - Direct external links */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-3">Today's Reading</h2>
            <div className="flex gap-3">
              <a
                href="https://www.aa.org/daily-reflections"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-sky-100 hover:bg-sky-200 text-sky-900 px-4 py-3 rounded-lg font-body text-center transition-colors shadow-sm"
              >
                AA Daily Reflection ↗
              </a>
              <a
                href="https://na.org/daily-meditations/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-3 rounded-lg font-body text-center transition-colors shadow-sm"
              >
                NA Just For Today ↗
              </a>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-3">Weekly Stats</h2>
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-amber-900/70">Days logged this week</span>
                <span className="font-heading text-3xl text-amber-900 font-bold">{weekStats.daysLogged} / 7</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                <span className="font-body text-amber-900/70">Current streak</span>
                <span className="font-heading text-3xl text-amber-900 font-bold">{weekStats.streak} {weekStats.streak === 1 ? 'day' : 'days'}</span>
              </div>
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
                  onClick={() => { hasUserInteractedRef.current = true; setMood(m.id) }}
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

            {/* Active selection buttons */}
            <div className="space-y-3 pl-1">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Cravings?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { hasUserInteractedRef.current = true; setCravings(false) }}
                    aria-label="No cravings"
                    aria-pressed={cravings === false}
                    className={`px-4 py-1.5 rounded-lg font-body text-sm transition-all ${cravings === false
                      ? "bg-green-100 text-green-800 ring-2 ring-green-400 font-bold"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => { hasUserInteractedRef.current = true; setCravings(true) }}
                    aria-label="Yes cravings"
                    aria-pressed={cravings === true}
                    className={`px-4 py-1.5 rounded-lg font-body text-sm transition-all ${cravings === true
                      ? "bg-amber-200 text-amber-900 ring-2 ring-amber-400 font-bold"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Used?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { hasUserInteractedRef.current = true; setUsed(false) }}
                    aria-label="Did not use"
                    aria-pressed={used === false}
                    className={`px-4 py-1.5 rounded-lg font-body text-sm transition-all ${used === false
                      ? "bg-green-100 text-green-800 ring-2 ring-green-400 font-bold"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => { hasUserInteractedRef.current = true; setUsed(true) }}
                    aria-label="Used"
                    aria-pressed={used === true}
                    className={`px-4 py-1.5 rounded-lg font-body text-sm transition-all ${used === true
                      ? "bg-red-200 text-red-900 ring-2 ring-red-400 font-bold"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Notepad */}
          <div className="relative group">
            <h2 className="font-heading text-lg text-amber-900/90 mb-2">Recovery Notepad</h2>

            <div className="relative min-h-[400px] w-full rounded-xl overflow-hidden shadow-sm border border-amber-200/60"
              style={{ backgroundColor: '#fdfbf7' }}
            >
              {/* Topbinding/Yellow Header */}
              <div className="h-12 bg-yellow-200 border-b border-yellow-300 flex items-center px-4">
                <span className="font-handlee text-yellow-800/60 text-sm font-bold tracking-widest uppercase">Quick Notes & Numbers</span>
              </div>

              {/* Lined Paper Background */}
              <div className="absolute inset-0 top-12 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)',
                  backgroundSize: '100% 2rem',
                  marginTop: '0.5rem'
                }}
              />

              {/* Red Margin Line */}
              <div className="absolute left-10 top-12 bottom-0 w-px bg-red-300/40 pointer-events-none" />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={journalEntry}
                onChange={(e) => { hasUserInteractedRef.current = true; setJournalEntry(e.target.value) }}
                onFocus={(e) => {
                  isEditingRef.current = true
                  if (journalEntry && e.target.selectionStart !== journalEntry.length) {
                    const len = journalEntry.length
                    e.target.setSelectionRange(len, len)
                    e.target.scrollTop = e.target.scrollHeight
                  }
                }}
                onBlur={() => (isEditingRef.current = false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.stopPropagation()
                }}
                placeholder="Jot down numbers, thoughts, or reminders..."
                className="w-full h-full min-h-[350px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-slate-800 leading-[2rem] p-4 pl-14 pt-2"
                style={{
                  fontFamily: 'var(--font-handlee), cursive',
                  lineHeight: '2rem'
                }}
                spellCheck={false}
              />
              {/* Save indicator */}
              <div className="absolute bottom-2 right-4 text-xs font-body italic">
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
        </div>
      </div>

      {/* Bottom navigation hint */}
      <div className="flex items-center justify-center pt-8">
        <p className="font-body text-sm text-amber-900/50 text-center">Swipe left for more →</p>
      </div>
    </div>
  )
}
