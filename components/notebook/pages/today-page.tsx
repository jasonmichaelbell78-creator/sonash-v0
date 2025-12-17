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
import { STORAGE_KEYS, DEBOUNCE_DELAYS, buildPath } from "@/lib/constants"
import { NotebookModuleId } from "../notebook-types"
import { DailyQuoteCard } from "../features/daily-quote-card"
import CompactMeetingCountdown from "@/components/widgets/compact-meeting-countdown"

interface TodayPageProps {
  nickname: string
  onNavigate: (id: NotebookModuleId) => void
}

export default function TodayPage({ nickname, onNavigate }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState(false)
  const [used, setUsed] = useState(false)
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
        <div className="flex justify-between items-start">
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
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {cleanTimeDisplay.map((part, index) => (
                  <span key={index}>
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
              <p className="font-heading text-2xl md:text-3xl text-amber-900">
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

          {/* Recovery Notepad */}
          <div className="relative group">
            <h2 className="font-heading text-lg text-amber-900/90 mb-2">Recovery Notepad</h2>

            <div className="relative min-h-[300px] w-full rounded-xl overflow-hidden shadow-sm border border-amber-200/60"
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
                onChange={(e) => setJournalEntry(e.target.value)}
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
                className="w-full h-full min-h-[250px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-slate-800 leading-[2rem] p-4 pl-14 pt-2"
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

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => onNavigate('history')}
              className="font-heading text-amber-900/60 hover:text-amber-900 text-sm border-b border-amber-900/30 hover:border-amber-900 transition-colors"
            >
              My Journal History →
            </button>
            <p className="font-body text-sm text-amber-900/50 text-right">Swipe left for more →</p>
          </div>
        </div>
      </div>
    </div>
  )
}
