/**
 * Tests for lib/db/collections.ts
 *
 * CANON-0077, CANON-0080: Typed Firestore collection helpers
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  COLLECTIONS,
  buildUserPath,
} from '../lib/db/collections';

describe('collections utilities', () => {
  describe('COLLECTIONS constants', () => {
    it('defines root collection names', () => {
      assert.strictEqual(COLLECTIONS.MEETINGS, 'meetings');
      assert.strictEqual(COLLECTIONS.DAILY_QUOTES, 'daily_quotes');
      assert.strictEqual(COLLECTIONS.SLOGANS, 'slogans');
      assert.strictEqual(COLLECTIONS.SOBER_LIVING, 'sober_living');
      assert.strictEqual(COLLECTIONS.GLOSSARY, 'recovery_glossary');
      assert.strictEqual(COLLECTIONS.LIBRARY, 'library');
      assert.strictEqual(COLLECTIONS.USERS, 'users');
      assert.strictEqual(COLLECTIONS.RATE_LIMITS, 'rate_limits');
    });

    it('generates user subcollection paths', () => {
      const userId = 'test-user-123';

      assert.strictEqual(
        COLLECTIONS.userJournal(userId),
        'users/test-user-123/journal'
      );
      assert.strictEqual(
        COLLECTIONS.userDailyLogs(userId),
        'users/test-user-123/daily_logs'
      );
      assert.strictEqual(
        COLLECTIONS.userInventory(userId),
        'users/test-user-123/inventory'
      );
      assert.strictEqual(
        COLLECTIONS.userWorksheets(userId),
        'users/test-user-123/worksheets'
      );
    });
  });

  describe('buildUserPath', () => {
    const userId = 'user-456';

    it('builds journal path', () => {
      const path = buildUserPath(userId, 'journal');
      assert.strictEqual(path, 'users/user-456/journal');
    });

    it('builds daily_logs path', () => {
      const path = buildUserPath(userId, 'daily_logs');
      assert.strictEqual(path, 'users/user-456/daily_logs');
    });

    it('builds inventory path', () => {
      const path = buildUserPath(userId, 'inventory');
      assert.strictEqual(path, 'users/user-456/inventory');
    });

    it('builds worksheets path', () => {
      const path = buildUserPath(userId, 'worksheets');
      assert.strictEqual(path, 'users/user-456/worksheets');
    });
  });
});
