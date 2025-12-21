/**
 * Celebration Types and Configuration
 * 
 * Defines event types and intensity levels for celebration animations
 */

export type CelebrationType =
    | 'daily-complete'
    | 'first-entry'
    | 'week-milestone'
    | 'month-milestone'
    | 'year-milestone'
    | 'meeting-attended'
    | 'inventory-complete'
    | 'halt-check'
    | 'seven-days'  // 1 week clean
    | 'thirty-days' // 1 month clean
    | 'sixty-days'  // 2 months clean
    | 'ninety-days' // 3 months clean
    | 'six-months'
    | 'one-year'

export type CelebrationIntensity = 'subtle' | 'medium' | 'high'

export interface CelebrationEvent {
    type: CelebrationType
    intensity: CelebrationIntensity
    message?: string
    daysClean?: number
    customData?: Record<string, unknown>
}

/**
 * Maps celebration types to their default intensity levels
 */
export const CELEBRATION_INTENSITY_MAP: Record<CelebrationType, CelebrationIntensity> = {
    'daily-complete': 'subtle',
    'first-entry': 'medium',
    'week-milestone': 'medium',
    'month-milestone': 'high',
    'year-milestone': 'high',
    'meeting-attended': 'subtle',
    'inventory-complete': 'subtle',
    'halt-check': 'subtle',
    'seven-days': 'medium',
    'thirty-days': 'high',
    'sixty-days': 'high',
    'ninety-days': 'high',
    'six-months': 'high',
    'one-year': 'high',
}

/**
 * Default messages for each celebration type
 */
export const CELEBRATION_MESSAGES: Record<CelebrationType, string> = {
    'daily-complete': 'You made it through today! 🎉',
    'first-entry': 'Great start on your recovery journey! ✨',
    'week-milestone': "That's a whole week! Keep going! 🌟",
    'month-milestone': 'A full month clean! Amazing work! 🏆',
    'year-milestone': 'One year of sobriety! Incredible! 🎊',
    'meeting-attended': 'Meeting attendance recorded 📝',
    'inventory-complete': 'Inventory complete! Well done! ✅',
    'halt-check': 'Self-check completed 💚',
    'seven-days': '7 days clean! One week strong! 💪',
    'thirty-days': '30 days clean! One month milestone! 🌙',
    'sixty-days': '60 days clean! Two months strong! ⭐',
    'ninety-days': '90 days clean! Three months! 🔥',
    'six-months': '6 months clean! Half a year! 🎯',
    'one-year': '1 year clean! A full year of recovery! 🏆',
}

/**
 * Particle counts for each intensity level
 */
export const PARTICLE_COUNTS: Record<CelebrationIntensity, number> = {
    subtle: 0,     // No confetti
    medium: 50,    // Moderate confetti
    high: 150,     // Heavy confetti
}

/**
 * Recovery-themed color palette for celebrations
 */
export const CELEBRATION_COLORS = {
    primary: '#10b981',   // Green (growth, recovery)
    secondary: '#3b82f6', // Blue (serenity, calm)
    accent: '#f59e0b',    // Amber (hope, warmth)
    highlight: '#ec4899', // Pink (love, support)
    special: '#8b5cf6',   // Purple (spirituality)
}
