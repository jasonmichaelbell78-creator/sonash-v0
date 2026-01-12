import { useState, useMemo } from "react"
import { logger } from "@/lib/logger"
import { getTodayDateId } from "@/lib/utils/date-utils"

interface UseSmartPromptsProps {
  mood: string | null
  cravings: boolean | null
  _used: boolean | null
  hasTouched: boolean
  haltCheck: {
    hungry: boolean
    angry: boolean
    lonely: boolean
    tired: boolean
  }
  haltSubmitted: boolean
  weekStats: {
    daysLogged: number
    streak: number
  }
}

interface SmartPromptState {
  showCheckInReminder: boolean
  showHaltSuggestion: boolean
  showNoCravingsStreak: boolean
  dismissedPrompts: Set<string>
  dismissPrompt: (promptId: string) => void
}

/**
 * Custom hook for managing smart prompt visibility and dismissed state
 * Persists dismissed prompts to localStorage with today's date as key
 */
export function useSmartPrompts({
  mood,
  cravings,
  _used,
  hasTouched,
  haltCheck,
  haltSubmitted,
  weekStats,
}: UseSmartPromptsProps): SmartPromptState {
  // Load dismissed prompts from localStorage on mount using lazy initializer
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(() => {
    const today = getTodayDateId(new Date())
    const storageKey = `dismissed-prompts-${today}`
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[]
        return new Set(parsed)
      } catch (error) {
        logger.warn("Failed to parse dismissed prompts from localStorage", { error })
      }
    }
    return new Set()
  })

  // Persist dismissed prompts to localStorage
  const dismissPrompt = (promptId: string) => {
    setDismissedPrompts(prev => {
      const updated = new Set(prev).add(promptId)

      // Persist to localStorage with today's date
      const today = getTodayDateId(new Date())
      const storageKey = `dismissed-prompts-${today}`
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)))

      return updated
    })
  }

  // Smart prompt: Evening check-in reminder (6 PM - 10 PM)
  const showCheckInReminder = useMemo(() => {
    if (dismissedPrompts.has('check-in-reminder')) return false
    const now = new Date()
    const hour = now.getHours()
    // Show reminder between 6 PM and 10 PM if not checked in
    return hour >= 18 && hour < 22 && !mood && !hasTouched
  }, [mood, hasTouched, dismissedPrompts])

  // Smart prompt: HALT suggestion when user is struggling
  const showHaltSuggestion = useMemo(() => {
    if (dismissedPrompts.has('halt-suggestion')) return false
    return mood === 'struggling' && !haltSubmitted && !Object.values(haltCheck).some(v => v)
  }, [mood, haltCheck, haltSubmitted, dismissedPrompts])

  // Smart prompt: Celebrate no-cravings streak (7+ days)
  const showNoCravingsStreak = useMemo(() => {
    if (dismissedPrompts.has('no-cravings-streak')) return false
    return weekStats.streak >= 7 && cravings === null && mood !== null
  }, [weekStats.streak, cravings, mood, dismissedPrompts])

  return {
    showCheckInReminder,
    showHaltSuggestion,
    showNoCravingsStreak,
    dismissedPrompts,
    dismissPrompt,
  }
}
