/**
 * Time-of-Day Rotation Utilities
 *
 * CANON-0017, CANON-0065: Extracted from quotes.ts and slogans.ts
 * to eliminate duplicate rotation logic.
 *
 * Provides:
 * - getTimeOfDay(): Determines current time period (morning/afternoon/evening)
 * - getRotatedItemForNow(): Generic rotation with scheduled date support
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

/**
 * Interface for items that support scheduled rotation
 */
export interface SchedulableItem {
  id: string;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTimeOfDay?: TimeOfDay;
  [key: string]: unknown;
}

/**
 * Get time of day based on current hour
 * - morning: 12 AM - 11:59 AM
 * - afternoon: 12 PM - 5:59 PM
 * - evening: 6 PM - 11:59 PM
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Get today's date string in YYYY-MM-DD format (local time)
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Convert time of day to numeric index for rotation calculations
 * morning=0, afternoon=1, evening=2
 */
export function getTimeOfDayIndex(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'morning':
      return 0;
    case 'afternoon':
      return 1;
    case 'evening':
      return 2;
  }
}

/**
 * Calculate day of year (1-366) for rotation seed
 */
export function getDayOfYear(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get rotation index for 3x daily rotation
 * Produces a unique index for each time period that cycles through the pool
 */
export function getRotationIndex(poolSize: number, date: Date = new Date()): number {
  if (poolSize <= 0) return 0;

  const dayOfYear = getDayOfYear(date);
  const timeOfDay = getTimeOfDay();
  const timeIndex = getTimeOfDayIndex(timeOfDay);

  // Create a unique seed for each time period (3 per day)
  const combinedSeed = dayOfYear * 3 + timeIndex;
  return combinedSeed % poolSize;
}

/**
 * Generic rotation function for items with optional scheduling support.
 *
 * Priority:
 * 1. Scheduled for today's date + specific time of day
 * 2. Scheduled for today's date (any time)
 * 3. Rotation based on time of day (morning/afternoon/evening)
 *
 * @param items - Array of items to select from
 * @returns The selected item for the current time, or null if array is empty
 *
 * @example
 * ```ts
 * const quotes = await QuotesService.getAllQuotes();
 * const todayQuote = getRotatedItemForNow(quotes);
 * ```
 */
export function getRotatedItemForNow<T extends SchedulableItem>(items: T[]): T | null {
  if (items.length === 0) return null;

  const todayStr = getTodayDateString();
  const timeOfDay = getTimeOfDay();

  // 1. Check for item scheduled for today + specific time of day
  const exactScheduled = items.find(
    (item) => item.scheduledDate === todayStr && item.scheduledTimeOfDay === timeOfDay
  );
  if (exactScheduled) return exactScheduled;

  // 2. Check for item scheduled for today (any time)
  const todayScheduled = items.find(
    (item) => item.scheduledDate === todayStr && !item.scheduledTimeOfDay
  );
  if (todayScheduled) return todayScheduled;

  // 3. Fallback to rotation based on time of day
  // Exclude scheduled items from general pool
  const generalPool = items.filter((item) => !item.scheduledDate);

  // If everything is scheduled, fall back to first item
  if (generalPool.length === 0) return items[0];

  const index = getRotationIndex(generalPool.length);
  return generalPool[index];
}
