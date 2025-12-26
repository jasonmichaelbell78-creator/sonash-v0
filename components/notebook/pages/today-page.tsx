"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useCelebration } from "@/components/celebrations/celebration-provider"
import { FirestoreService } from "@/lib/firestore-service"
import { intervalToDuration, subDays, startOfDay, format, differenceInDays, startOfWeek } from "date-fns"
import { toast } from "sonner"
import MoodSparkline from "../visualizations/mood-sparkline"
import { AuthErrorBanner } from "@/components/status/auth-error-banner"
import { logger, maskIdentifier } from "@/lib/logger"
import { getTodayDateId, formatDateForDisplay } from "@/lib/utils/date-utils"
import { toDate } from "@/lib/types/firebase-types"
import { STORAGE_KEYS, DEBOUNCE_DELAYS, buildPath } from "@/lib/constants"
import { NotebookModuleId } from "../notebook-types"
import { DailyQuoteCard } from "../features/daily-quote-card"
import { RecoveryNotepad } from "../features/recovery-notepad"
import CompactMeetingCountdown from "@/components/widgets/compact-meeting-countdown"
import { db } from "@/lib/firebase"
import { TodayPageSkeleton } from "./today-page-skeleton"
import { QuickActionsFab } from "../features/quick-actions-fab"
import { EnhancedMoodSelector } from "../features/enhanced-mood-selector"
import { SmartPrompt } from "../features/smart-prompt"
import { OfflineIndicator } from "@/components/status/offline-indicator"
import { useSmartPrompts } from "../hooks/use-smart-prompts"
import { useScrollToSection } from "../hooks/use-scroll-to-section"

interface TodayPageProps {
  nickname: string
  onNavigate: (id: NotebookModuleId) => void
}

/**
 * Render the Today page UI including the recovery notepad, mood check-in, HALT check, clean-time tracker, weekly stats, and related prompts and controls.
 *
 * @param nickname - User display name shown in the page greeting (falls back to "friend" when empty)
 * @param onNavigate - Callback invoked to navigate to a NotebookModuleId (used by the quick actions FAB)
 * @returns The Today page React element containing all interactive controls and layout for daily check-ins and notes
 */
export default function TodayPage({ nickname, onNavigate }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState<boolean | null>(null)
  const [used, setUsed] = useState<boolean | null>(null)
  const [journalEntry, setJournalEntry] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveComplete, setSaveComplete] = useState(false)
  const [hasTouched, setHasTouched] = useState(false)
  const [weekStats, setWeekStats] = useState({ daysLogged: 0, streak: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showQuickMoodPrompt, setShowQuickMoodPrompt] = useState(false)

  // Use ref instead of state to prevent re-triggering effects
  const isEditingRef = useRef(false)
  const desktopTextareaRef = useRef<HTMLTextAreaElement>(null)
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null)
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
  const [haltCheck, setHaltCheck] = useState({
    hungry: false,
    angry: false,
    lonely: false,
    tired: false,
  })
  const [haltSubmitted, setHaltSubmitted] = useState(false)

  // Smart prompts with localStorage persistence
  const {
    showCheckInReminder,
    showHaltSuggestion,
    showNoCravingsStreak,
    dismissPrompt,
  } = useSmartPrompts({
    mood,
    cravings,
    _used: used,
    hasTouched,
    haltCheck,
    haltSubmitted,
    weekStats,
  })

  // Auto-scroll to mood selector when quick mood is triggered
  useScrollToSection({
    shouldScroll: showQuickMoodPrompt,
    target: { type: 'aria-label', value: 'Mood selection' },
    delay: 100,
  })

  // Calculate check-in progress
  const _checkInSteps = useMemo(() => {
    const steps = [
      { id: "mood", label: "Mood", completed: mood !== null },
      { id: "check", label: "Check", completed: cravings !== null && used !== null },
      { id: "halt", label: "HALT", completed: haltSubmitted || Object.values(haltCheck).some(v => v) },
    ]
    const currentStep = steps.filter(s => s.completed).length
    return { steps, currentStep, totalSteps: steps.length }
  }, [mood, cravings, used, haltCheck, haltSubmitted])

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

  // Handler for HALT check toggle
  const handleHaltToggle = (key: 'hungry' | 'angry' | 'lonely' | 'tired') => {
    setHaltCheck(prev => ({ ...prev, [key]: !prev[key] }))
    setHaltSubmitted(false) // Reset submitted state when user changes selection
  }

  // Handler for HALT check submission
  const handleHaltSubmit = useCallback(async () => {
    if (!user) return

    const checkedItems = Object.entries(haltCheck)
      .filter(([_, checked]) => checked)
      .map(([key]) => key)

    if (checkedItems.length === 0) {
      toast.info("No items selected - you're doing great!")
      return
    }

    try {
      await FirestoreService.saveNotebookJournalEntry(user.uid, {
        type: 'check-in',
        data: {
          checkType: 'halt',
          hungry: haltCheck.hungry,
          angry: haltCheck.angry,
          lonely: haltCheck.lonely,
          tired: haltCheck.tired,
          checkedCount: checkedItems.length,
        },
      })

      celebrate('halt-check')
      const suggestions: Record<string, string> = {
        hungry: "eat something healthy",
        angry: "talk to someone or journal",
        lonely: "reach out to a friend",
        tired: "rest and recharge",
      }
      const tips = checkedItems.map(item => suggestions[item]).join(", ")
      toast.success(`HALT check complete! Remember to ${tips}.`)

      setHaltSubmitted(true)
      setTimeout(() => {
        setHaltCheck({ hungry: false, angry: false, lonely: false, tired: false })
      }, 2000)
    } catch (error) {
      logger.error("Failed to save HALT check", {
        userId: maskIdentifier(user.uid),
        error
      })
      toast.error("Couldn't save HALT check. Please try again.")
    }
  }, [user, haltCheck, celebrate])

  // Initial loading state management
  useEffect(() => {
    if (user && profile) {
      // Set loading to false after a brief delay to show skeleton
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [user, profile])

  // Quick mood handler for FAB
  const handleQuickMood = useCallback(() => {
    setShowQuickMoodPrompt(true)
    // Auto-scroll handled by useScrollToSection hook
  }, [])

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
                  // Position cursor at end of text on load for both textareas
                  setTimeout(() => {
                    const len = data.content.length
                    if (desktopTextareaRef.current) {
                      desktopTextareaRef.current.setSelectionRange(len, len)
                    }
                    if (mobileTextareaRef.current) {
                      mobileTextareaRef.current.setSelectionRange(len, len)
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
      // Log detailed error information for debugging
      console.error('❌ Save failed with error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
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

        // Get start of current week (Sunday)
        const now = new Date()
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }) // 0 = Sunday
        const weekStartId = format(startOfDay(weekStart), 'yyyy-MM-dd')

        const logsRef = collection(db, `users/${user.uid}/daily_logs`)
        const q = query(
          logsRef,
          where('date', '>=', weekStartId),
          orderBy('date', 'desc')
        )

        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(doc => ({
          date: doc.data().date,
          ...doc.data()
        }))

        // Count unique days with logs in current week
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

  // Show loading skeleton
  if (isLoading) {
    return <TodayPageSkeleton />
  }

  return (
    <>
      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Quick actions FAB */}
      <QuickActionsFab onNavigate={onNavigate} onQuickMood={handleQuickMood} />

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

        {/* Smart Prompts */}
        {showCheckInReminder && (
          <SmartPrompt
            type="check-in-reminder"
            message="Evening check-in time! How was your day?"
            action={{
              label: "Check in now",
              onClick: handleQuickMood
            }}
            onDismiss={() => dismissPrompt('check-in-reminder')}
          />
        )}

        {showHaltSuggestion && (
          <SmartPrompt
            type="halt-suggestion"
            message="You're struggling today. A quick HALT check might help identify what you need."
            action={{
              label: "Do HALT check",
              onClick: () => {
                try {
                  // Find HALT Check heading by text content
                  const headings = Array.from(document.querySelectorAll('h2'))
                  const haltHeading = headings.find(h => h.textContent?.includes('HALT Check'))
                  const haltSection = haltHeading?.parentElement

                  if (haltSection) {
                    haltSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                } catch (error) {
                  // Gracefully degrade - log error but don't crash UI
                  console.warn('Could not scroll to HALT section:', error)
                }
              }
            }}
            onDismiss={() => dismissPrompt('halt-suggestion')}
          />
        )}

        {showNoCravingsStreak && (
          <SmartPrompt
            type="no-cravings-streak"
            message={`🎉 Amazing! You've logged ${weekStats.streak} days in a row. Your consistency is inspiring!`}
            onDismiss={() => dismissPrompt('no-cravings-streak')}
          />
        )}

        {/* Two column layout for larger screens, single column on mobile */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Left Column */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
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
            <div>
              <DailyQuoteCard />
            </div>

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

            {/* Recovery Notepad - DESKTOP ONLY (hidden on mobile) */}
            <div className="hidden md:block">
              <RecoveryNotepad
                textareaRef={desktopTextareaRef}
                journalEntry={journalEntry}
                onJournalChange={setJournalEntry}
                onTouched={() => setHasTouched(true)}
                isEditingRef={isEditingRef}
                isSaving={isSaving}
                saveComplete={saveComplete}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            {/* Check-in */}
            <div>
              <h2 className="font-heading text-xl text-amber-900/90 mb-3">Check-In: How are you doing today?</h2>
            <EnhancedMoodSelector
              value={mood}
              onChange={(newMood) => {
                setMood(newMood)
                setHasTouched(true)
                setShowQuickMoodPrompt(false)
              }}
              showKeyboardShortcuts={true}
            />

            <MoodSparkline />

            {/* Toggle questions - Only show after mood is selected */}
            {mood && (
              <div className="space-y-3 pl-1 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg text-amber-900/80">Cravings?</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setCravings(false); setHasTouched(true) }}
                      aria-label="No cravings"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 transform active:scale-95 ${cravings === false
                        ? "bg-green-100 border-2 border-green-400 text-green-900 font-bold shadow-md scale-105"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 hover:scale-105"
                        }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => { setCravings(true); setHasTouched(true) }}
                      aria-label="Yes cravings"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 transform active:scale-95 ${cravings === true
                        ? "bg-amber-100 border-2 border-amber-400 text-amber-900 font-bold shadow-md scale-105"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 hover:scale-105"
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
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 transform active:scale-95 ${used === false
                        ? "bg-green-100 border-2 border-green-400 text-green-900 font-bold shadow-md scale-105"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 hover:scale-105"
                        }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => { setUsed(true); setHasTouched(true) }}
                      aria-label="Yes used"
                      className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 transform active:scale-95 ${used === true
                        ? "bg-red-100 border-2 border-red-400 text-red-900 font-bold shadow-md scale-105"
                        : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 hover:scale-105"
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

          {/* HALT Check */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-2">HALT Check</h2>
            <p className="text-sm font-body text-amber-900/60 mb-3">
              Quick self-assessment to identify vulnerability
            </p>

            <div className="bg-white/50 rounded-lg p-4 space-y-3">
              {[
                { key: 'hungry' as const, label: 'Hungry?', icon: '🍽️', tip: 'When did you last eat? Grab a healthy snack.' },
                { key: 'angry' as const, label: 'Angry?', icon: '😤', tip: "What's bothering you. Call your sponsor." },
                { key: 'lonely' as const, label: 'Lonely?', icon: '🤝', tip: 'Reach out to someone. Attend a meeting.' },
                { key: 'tired' as const, label: 'Tired?', icon: '😴', tip: 'How much sleep did you get? Take a break.' },
              ].map(({ key, label, icon, tip }) => (
                <div key={key} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`halt-${key}`}
                    checked={haltCheck[key]}
                    onChange={() => handleHaltToggle(key)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded border-amber-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor={`halt-${key}`} className="font-handlee text-lg text-amber-900 flex items-center gap-2 cursor-pointer">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </label>
                    {haltCheck[key] && (
                      <p className="text-sm text-blue-700 italic mt-1 font-body">
                        💡 {tip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleHaltSubmit}
              disabled={Object.values(haltCheck).every(v => !v)}
              className="mt-3 w-full py-3 bg-blue-500 text-white rounded-lg font-handlee text-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              Complete HALT Check
            </button>

            {haltSubmitted && (
              <p className="text-xs text-green-600 text-center mt-2 font-body">
                ✓ Saved to journal
              </p>
            )}
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

          {/* Weekly Stats */}
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

          {/* Recovery Notepad - MOBILE ONLY (visible on mobile, hidden on desktop) */}
          <div className="block md:hidden">
            <RecoveryNotepad
              textareaRef={mobileTextareaRef}
              journalEntry={journalEntry}
              onJournalChange={setJournalEntry}
              onTouched={() => setHasTouched(true)}
              isEditingRef={isEditingRef}
              isSaving={isSaving}
              saveComplete={saveComplete}
            />
          </div>
        </div>
        </div>
        {/* Bottom navigation hint */}
        <div className="flex items-center justify-center pt-8">
          <p className="font-body text-sm text-amber-900/50 text-center">Swipe left for more →</p>
        </div>
      </div>
    </>
  )
}