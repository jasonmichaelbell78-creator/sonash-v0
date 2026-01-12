/**
 * Tests for lib/utils/time-rotation.ts
 *
 * CANON-0017, CANON-0065: Time-of-day rotation utilities
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getTimeOfDay,
  getTodayDateString,
  getTimeOfDayIndex,
  getDayOfYear,
  getRotationIndex,
  getRotatedItemForNow,
  type SchedulableItem,
} from '../lib/utils/time-rotation';

describe('time-rotation utilities', () => {
  describe('getTimeOfDay', () => {
    it('returns a valid time of day string', () => {
      const result = getTimeOfDay();
      assert.ok(['morning', 'afternoon', 'evening'].includes(result));
    });
  });

  describe('getTimeOfDayIndex', () => {
    it('returns 0 for morning', () => {
      assert.strictEqual(getTimeOfDayIndex('morning'), 0);
    });

    it('returns 1 for afternoon', () => {
      assert.strictEqual(getTimeOfDayIndex('afternoon'), 1);
    });

    it('returns 2 for evening', () => {
      assert.strictEqual(getTimeOfDayIndex('evening'), 2);
    });
  });

  describe('getDayOfYear', () => {
    it('returns 1 for January 1st', () => {
      const jan1 = new Date(2026, 0, 1);
      assert.strictEqual(getDayOfYear(jan1), 1);
    });

    it('returns 32 for February 1st', () => {
      const feb1 = new Date(2026, 1, 1);
      assert.strictEqual(getDayOfYear(feb1), 32);
    });

    it('returns 365 for December 31st in non-leap year', () => {
      const dec31 = new Date(2025, 11, 31);
      assert.strictEqual(getDayOfYear(dec31), 365);
    });
  });

  describe('getRotationIndex', () => {
    it('returns 0 for empty pool', () => {
      assert.strictEqual(getRotationIndex(0), 0);
    });

    it('returns index within pool size bounds', () => {
      const poolSize = 10;
      const index = getRotationIndex(poolSize);
      assert.ok(index >= 0 && index < poolSize);
    });

    it('returns consistent results for same date', () => {
      const date = new Date(2026, 5, 15, 10, 0, 0); // June 15, 2026 at 10 AM
      const index1 = getRotationIndex(100, date);
      const index2 = getRotationIndex(100, date);
      assert.strictEqual(index1, index2);
    });
  });

  describe('getRotatedItemForNow', () => {
    const baseItems: SchedulableItem[] = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
    ];

    it('returns null for empty array', () => {
      const result = getRotatedItemForNow([]);
      assert.strictEqual(result, null);
    });

    it('returns item from pool for non-scheduled items', () => {
      const result = getRotatedItemForNow(baseItems);
      assert.ok(result !== null);
      assert.ok(baseItems.some((item) => item.id === result?.id));
    });

    it('prioritizes exact scheduled item (date + time of day)', () => {
      const today = getTodayDateString();
      const timeOfDay = getTimeOfDay();

      const items: SchedulableItem[] = [
        { id: '1' },
        { id: 'scheduled', scheduledDate: today, scheduledTimeOfDay: timeOfDay },
        { id: '3' },
      ];

      const result = getRotatedItemForNow(items);
      assert.strictEqual(result?.id, 'scheduled');
    });

    it('prioritizes scheduled item for today (any time) over rotation', () => {
      const today = getTodayDateString();

      const items: SchedulableItem[] = [
        { id: '1' },
        { id: 'today-any', scheduledDate: today },
        { id: '3' },
      ];

      const result = getRotatedItemForNow(items);
      assert.strictEqual(result?.id, 'today-any');
    });

    it('excludes scheduled items from general pool', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

      const items: SchedulableItem[] = [
        { id: '1' },
        { id: 'future-scheduled', scheduledDate: tomorrowStr },
        { id: '3' },
      ];

      // Run multiple times - future scheduled should never be selected
      for (let i = 0; i < 10; i++) {
        const result = getRotatedItemForNow(items);
        assert.notStrictEqual(result?.id, 'future-scheduled');
      }
    });

    it('falls back to first item if all are scheduled', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

      const items: SchedulableItem[] = [
        { id: 'first', scheduledDate: tomorrowStr },
        { id: 'second', scheduledDate: tomorrowStr },
      ];

      const result = getRotatedItemForNow(items);
      assert.strictEqual(result?.id, 'first');
    });
  });

  describe('getTodayDateString', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
