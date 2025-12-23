"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useCelebration } from "@/components/celebrations/celebration-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { intervalToDuration, subDays, startOfDay, format, differenceInDays } from "date-fns"
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
import { db } from "@/lib/firebase"

interface TodayPageProps {
  nickname: string
  onNavigate: (id: NotebookModuleId) => void
}

export default function TodayPage({ nickname, onNavigate: _onNavigate }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState<boolean | null>(null)
  const [used, setUsed] = useState<boolean | null>(null)
  const [journalEntry, setJournalEntry] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveComplete, setSaveComplete] = useState(false)
  const [hasTouched, setHasTouched] = useState(false)
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
  // Track last journal content to detect meaningful changes
  const lastJournalContentRef = useRef<string>("")
  // Prevent concurrent journal saves
  const journalSaveInProgressRef = useRef(false)
  // Track if we've already celebrated this session to avoid duplicates
  const celebratedThisSessionRef = useRef(false)

  const { user, profile } = useAuth()
  const { celebrate } = useCelebration()
  const referenceDate = useMemo(() => new Date(), [])
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false)

  const createJournalDailyLog = useCallback(async (data: { journalEntry: string; mood: string | null; cravings: boolean | null; used: boolean | null }) => {
    if (!user) return

    // Create content signature to check for meaningful changes
    const currentContent = JSON.stringify({
      mood: data.mood,
      cravings: data.cravings,
      used: data.used,
      note: data.journalEntry
    })

    // Only create journal entry if content has meaningfully changed AND we're not already saving
    if (currentContent === lastJournalContentRef.current || journalSaveInProgressRef.current) {
      return
    }

    journalSaveInProgressRef.current = true

    try {
      // Save mood as separate stamp entry
      if (data.mood) {
        await FirestoreService.saveNotebookJournalEntry(user.uid, {
          type: 'mood',
          data: {
            mood: data.mood,
            intensity: 5,
          },
        })
      }

      // Save cravings/used as separate check-in sticker
      if (data.cravings !== null || data.used !== null) {
        await FirestoreService.saveNotebookJournalEntry(user.uid, {
          type: 'daily-log',
          data: {
            cravings: data.cravings ?? null,
            used: data.used ?? null,
          },
        })
      }

      // Save notes as separate sticky note entry
      if (data.journalEntry && data.journalEntry.trim()) {
        await FirestoreService.saveNotebookJournalEntry(user.uid, {
          type: 'free-write',
          data: {
            title: 'Recovery Notepad',
            content: data.journalEntry,
          },
        })
      }

      // Update last saved content only after successful save
      lastJournalContentRef.current = currentContent
    } catch (error) {
      logger.error("Failed to create journal entries", {
        userId: maskIdentifier(user.uid),
        error,
      })
    } finally {
      journalSaveInProgressRef.current = false
    }
  }, [user])

  // Handler for "I Made It Through Today" button
  const handleMadeItThrough = useCallback(async () => {
    if (!user || hasCelebratedToday) return

    try {
      // Trigger celebration animation
      celebrate('made-it-through-today')

      // Save to journal
      await FirestoreService.saveNotebookJournalEntry(user.uid, {
        type: 'free-write',
        data: {
          title: 'I Made It Through Today!',
          content: 'Celebrated making it through a difficult day',
        },
      })

      // Mark as celebrated and persist to localStorage
      setHasCelebratedToday(true)
      const celebrationKey = `made-it-through-${getTodayDateId(referenceDate)}`
      localStorage.setItem(celebrationKey, new Date().toISOString())

      toast.success("🎉 You did it! One day at a time.")
    } catch (error) {
      logger.error("Failed to save celebration", {
        userId: maskIdentifier(user.uid),
        error
      })
      toast.error("Couldn't save your celebration, but you still made it through!")
    }
  }, [user, hasCelebratedToday, celebrate, referenceDate])

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
                // Do not pre-fill mood/cravings/used; keep neutral by default

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

      // Save to cloud (daily_logs collection - for Today tab persistence)
      await FirestoreService.saveDailyLog(user.uid, saveData)

      // Celebrate daily check-in completion (only once per session)
      if (!celebratedThisSessionRef.current && dataToSave.mood && (dataToSave.cravings !== null || dataToSave.used !== null)) {
        celebrate('daily-complete')
        celebratedThisSessionRef.current = true
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
  }, [user, celebrate])

  // Auto-save effect: marks data as dirty and schedules a save
  // The timer only starts once per change batch, not reset on every keystroke
  useEffect(() => {
    if (!user || !hasTouched) return

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
  }, [journalEntry, mood, cravings, used, user, performSave, hasTouched])

  // Separate effect to save to journal when mood, cravings, or used changes
  // This runs independently of the auto-save for notes
  useEffect(() => {
    if (!user || !hasTouched) return
    if (!mood && cravings === null && used === null) return // Nothing selected yet

    // Debounce journal saves separately to avoid duplicates during rapid changes
    const journalTimeoutId = setTimeout(() => {
      createJournalDailyLog({
        journalEntry,
        mood,
        cravings,
        used
      })
    }, 2000) // Longer delay for journal saves

    return () => clearTimeout(journalTimeoutId)
  }, [mood, cravings, used, user, hasTouched, journalEntry, createJournalDailyLog])

  // Reset toggles to neutral when tab/page loses visibility or on unmount
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setMood(null)
        setCravings(null)
        setUsed(null)
        setHasTouched(false)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      handleVisibility()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  // Calculate weekly stats (days logged and streak)
  useEffect(() => {
    if (!user) return

    async function calculateWeeklyStats() {
      if (!user) return // Guard against null user

      try {
        const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore")

        // Get last 7 days of logs
        const sevenDaysAgo = subDays(startOfDay(new Date()), 7)
        const sevenDaysAgoId = format(sevenDaysAgo, 'yyyy-MM-dd')

        const logsRef = collection(db, `users/${user.uid}/daily_logs`)
        const q = query(
          logsRef,
          where('date', '>=', sevenDaysAgoId),
          orderBy('date', 'desc')
        )

        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(doc => ({
          date: doc.data().date,
          ...doc.data()
        }))

        // Count unique days with logs in last 7 days
        const uniqueDays = new Set(logs.map(log => log.date))
        const daysLogged = uniqueDays.size

        // Calculate current streak (consecutive days from today backwards)
        let streak = 0
        let checkDate = new Date()

        while (true) {
          const dateId = format(startOfDay(checkDate), 'yyyy-MM-dd')
          if (uniqueDays.has(dateId)) {
            streak++
            checkDate = subDays(checkDate, 1)
          } else {
            break
          }
        }

        setWeekStats({ daysLogged, streak })
      } catch (error) {
        logger.error("Failed to calculate weekly stats", {
          userId: maskIdentifier(user.uid),
          error
        })
      }
    }

    calculateWeeklyStats()
  }, [user])

  // Check if already celebrated today (prevent spam)
  useEffect(() => {
    if (!user) return
    const celebrationKey = `made-it-through-${getTodayDateId(referenceDate)}`
    const hasCelebrated = localStorage.getItem(celebrationKey)
    if (hasCelebrated) {
      setHasCelebratedToday(true)
    }
  }, [user, referenceDate])

  // Check for milestone celebrations based on clean time
  useEffect(() => {
    if (!profile?.cleanStart) return

    const start = toDate(profile.cleanStart)
    if (!start) return

    const now = new Date()
    const totalDays = differenceInDays(now, start)

    // Define milestones with their day counts
    const milestones = [
      { days: 7, type: 'seven-days' as const },
      { days: 30, type: 'thirty-days' as const },
      { days: 60, type: 'sixty-days' as const },
      { days: 90, type: 'ninety-days' as const },
      { days: 180, type: 'six-months' as const },
      { days: 365, type: 'one-year' as const },
    ]

    // Check each milestone
    for (const milestone of milestones) {
      if (totalDays === milestone.days) {
        const milestoneKey = `milestone_${milestone.days}_${user?.uid}`
        const hasShown = localStorage.getItem(milestoneKey)

        if (!hasShown) {
          // Celebrate this milestone!
          celebrate(milestone.type, { daysClean: milestone.days })
          localStorage.setItem(milestoneKey, new Date().toISOString())
        }
        break // Only celebrate one milestone at a time
      }
    }
  }, [profile, celebrate, user])


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



    // Always show hours if > 0
    if (hours > 0) {
      parts.push({
        text: hours === 1 ? "1 Hour" : `${hours} Hours`,
        size: "text-xl md:text-2xl"
      })
    }

    // Always show minutes (just minutes, not hours converted to minutes)
    if (minutes > 0) {
      parts.push({
        text: minutes === 1 ? "1 Minute" : `${minutes} Minutes`,
        size: "text-lg md:text-xl"
      })
    }

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
                    <span className={`font-heading-alt ${part.size} text-amber-900`}>
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
                <span className="data-display text-3xl text-amber-900">{weekStats.daysLogged} / 7</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                <span className="font-body text-amber-900/70">Current streak</span>
                <span className="data-display text-3xl text-amber-900">{weekStats.streak} {weekStats.streak === 1 ? 'day' : 'days'}</span>
              </div>
            </div>
          </div>

          {/* "I Made It Through Today" Button */}
          <div>
            <button
              onClick={handleMadeItThrough}
              disabled={hasCelebratedToday}
              className={`w-full py-6 px-4 rounded-xl font-heading text-2xl transition-all shadow-lg ${hasCelebratedToday
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl active:scale-95'
                }`}
            >
              {hasCelebratedToday ? (
                <span className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Celebrated!</span>
                </span>
              ) : (
                <span>🎉 I Made It Through Today!</span>
              )}
            </button>
            {!hasCelebratedToday && (
              <p className="text-xs font-body text-amber-900/60 text-center mt-2">
                Tap to celebrate making it through a tough day
              </p>
            )}
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
                  onClick={() => {
                    setMood(m.id)
                    setHasTouched(true)
                  }}
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

            {/* Toggle questions - Only show after mood is selected */}
            {mood && (
              <div className="space-y-3 pl-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg text-amber-900/80">Cravings?</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setCravings(false); setHasTouched(true) }}
                      aria-label="No cravings"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${cravings === false
                        ? "bg-green-100 border-2 border-green-400 text-green-900 font-bold shadow-sm"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => { setCravings(true); setHasTouched(true) }}
                      aria-label="Yes cravings"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${cravings === true
                        ? "bg-amber-100 border-2 border-amber-400 text-amber-900 font-bold shadow-sm"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg text-amber-900/80">Used?</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setUsed(false); setHasTouched(true) }}
                      aria-label="No used"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${used === false
                        ? "bg-green-100 border-2 border-green-400 text-green-900 font-bold shadow-sm"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => { setUsed(true); setHasTouched(true) }}
                      aria-label="Yes used"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${used === true
                        ? "bg-red-100 border-2 border-red-400 text-red-900 font-bold shadow-sm"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message when mood not selected */}
            {!mood && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900/70 font-body text-center">
                  👆 Select your mood above to continue check-in
                </p>
              </div>
            )}
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
                onChange={(e) => {
                  setJournalEntry(e.target.value)
                  setHasTouched(true)
                }}
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

            <div className="flex justify-end">
              <p className="text-xs font-body text-amber-900/50 italic">Auto-saved</p>
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
