/**
 * Tests for lib/utils/secure-caller.ts
 *
 * CANON-0076, CANON-0078: Consolidated reCAPTCHA and Cloud Function calling
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  RECAPTCHA_ACTIONS,
  type RecaptchaAction,
  type CallSecureFunctionOptions,
  type SecureFunctionResult,
} from '../lib/utils/secure-caller';

describe('secure-caller utilities', () => {
  describe('RECAPTCHA_ACTIONS constants', () => {
    it('defines SAVE_JOURNAL_ENTRY action', () => {
      assert.strictEqual(RECAPTCHA_ACTIONS.SAVE_JOURNAL_ENTRY, 'save_journal_entry');
    });

    it('defines DELETE_JOURNAL_ENTRY action', () => {
      assert.strictEqual(RECAPTCHA_ACTIONS.DELETE_JOURNAL_ENTRY, 'delete_journal_entry');
    });

    it('defines SAVE_DAILY_LOG action', () => {
      assert.strictEqual(RECAPTCHA_ACTIONS.SAVE_DAILY_LOG, 'save_daily_log');
    });

    it('defines SAVE_INVENTORY action', () => {
      assert.strictEqual(RECAPTCHA_ACTIONS.SAVE_INVENTORY, 'save_inventory');
    });

    it('defines LINK_ACCOUNT action', () => {
      assert.strictEqual(RECAPTCHA_ACTIONS.LINK_ACCOUNT, 'link_account');
    });

    it('has consistent snake_case format for all actions', () => {
      const actions = Object.values(RECAPTCHA_ACTIONS);
      actions.forEach((action) => {
        assert.match(action, /^[a-z_]+$/, `Action "${action}" should be snake_case`);
      });
    });
  });

  describe('Type definitions', () => {
    it('RecaptchaAction type includes all action values', () => {
      // Type assertion tests
      const action1: RecaptchaAction = 'save_journal_entry';
      const action2: RecaptchaAction = 'delete_journal_entry';
      const action3: RecaptchaAction = 'save_daily_log';

      assert.strictEqual(action1, RECAPTCHA_ACTIONS.SAVE_JOURNAL_ENTRY);
      assert.strictEqual(action2, RECAPTCHA_ACTIONS.DELETE_JOURNAL_ENTRY);
      assert.strictEqual(action3, RECAPTCHA_ACTIONS.SAVE_DAILY_LOG);
    });

    it('CallSecureFunctionOptions has required action field', () => {
      const options: CallSecureFunctionOptions = {
        action: RECAPTCHA_ACTIONS.SAVE_JOURNAL_ENTRY,
      };

      assert.strictEqual(options.action, 'save_journal_entry');
    });

    it('CallSecureFunctionOptions accepts optional fields', () => {
      const options: CallSecureFunctionOptions = {
        action: RECAPTCHA_ACTIONS.SAVE_JOURNAL_ENTRY,
        maxRetries: 5,
        includeRecaptcha: false,
      };

      assert.strictEqual(options.maxRetries, 5);
      assert.strictEqual(options.includeRecaptcha, false);
    });

    it('SecureFunctionResult represents success state', () => {
      const result: SecureFunctionResult<{ id: string }> = {
        success: true,
        data: { id: 'test-123' },
      };

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data?.id, 'test-123');
      assert.strictEqual(result.error, undefined);
    });

    it('SecureFunctionResult represents error state', () => {
      const result: SecureFunctionResult<{ id: string }> = {
        success: false,
        error: 'Something went wrong',
      };

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.data, undefined);
      assert.strictEqual(result.error, 'Something went wrong');
    });
  });
});
