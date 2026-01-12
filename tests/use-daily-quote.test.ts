/**
 * Tests for useDailyQuote hook utilities
 * CANON-0023, CANON-0051, CANON-0073: Consolidated daily quote fetching
 *
 * Note: The hook itself requires React rendering context.
 * These tests verify the hook module is properly structured.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import hook to verify module structure
import { useDailyQuote, type UseDailyQuoteResult } from '../hooks/use-daily-quote';

describe('useDailyQuote module', () => {
  it('exports useDailyQuote hook function', () => {
    assert.strictEqual(typeof useDailyQuote, 'function');
  });

  it('hook function has expected name', () => {
    assert.strictEqual(useDailyQuote.name, 'useDailyQuote');
  });

  describe('UseDailyQuoteResult type', () => {
    it('is properly typed with quote, loading, and refresh', () => {
      // Type assertion test - this verifies the type structure at compile time
      const mockResult: UseDailyQuoteResult = {
        quote: null,
        loading: true,
        refresh: () => {},
      };

      assert.strictEqual(mockResult.quote, null);
      assert.strictEqual(mockResult.loading, true);
      assert.strictEqual(typeof mockResult.refresh, 'function');
    });

    it('allows Quote object in quote property', () => {
      const mockResult: UseDailyQuoteResult = {
        quote: {
          id: 'test-id',
          text: 'Test quote',
          author: 'Test Author',
        },
        loading: false,
        refresh: () => {},
      };

      assert.strictEqual(mockResult.quote?.text, 'Test quote');
      assert.strictEqual(mockResult.quote?.author, 'Test Author');
    });
  });
});
