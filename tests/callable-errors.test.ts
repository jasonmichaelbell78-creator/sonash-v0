/**
 * Tests for lib/utils/callable-errors.ts
 *
 * CANON-0006: Verifies consolidated Cloud Function error handling utility.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  CloudFunctionError,
  isCloudFunctionError,
  getCloudFunctionErrorMessage,
  handleCloudFunctionError,
  isRateLimitError,
  isAuthError,
  isSecurityError,
  isValidationError,
  isNotFoundError,
} from '../lib/utils/callable-errors';

describe('callable-errors utility', () => {
  describe('isCloudFunctionError', () => {
    it('returns true for objects with code property', () => {
      const error: CloudFunctionError = { code: 'functions/resource-exhausted' };
      assert.strictEqual(isCloudFunctionError(error), true);
    });

    it('returns true for objects with code and message', () => {
      const error: CloudFunctionError = {
        code: 'functions/invalid-argument',
        message: 'Validation failed',
      };
      assert.strictEqual(isCloudFunctionError(error), true);
    });

    it('returns false for null', () => {
      assert.strictEqual(isCloudFunctionError(null), false);
    });

    it('returns false for undefined', () => {
      assert.strictEqual(isCloudFunctionError(undefined), false);
    });

    it('returns false for plain strings', () => {
      assert.strictEqual(isCloudFunctionError('error'), false);
    });

    it('returns false for objects without code', () => {
      assert.strictEqual(isCloudFunctionError({ message: 'error' }), false);
    });

    it('returns false for plain Error instances', () => {
      assert.strictEqual(isCloudFunctionError(new Error('error')), false);
    });
  });

  describe('getCloudFunctionErrorMessage', () => {
    it('returns default message for rate limit errors', () => {
      const error: CloudFunctionError = { code: 'functions/resource-exhausted' };
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'Too many requests. Please wait a moment and try again.');
    });

    it('returns default message for auth errors', () => {
      const error: CloudFunctionError = { code: 'functions/unauthenticated' };
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'Please sign in to continue.');
    });

    it('returns default message for security errors', () => {
      const error: CloudFunctionError = { code: 'functions/failed-precondition' };
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'Security verification failed. Please refresh the page.');
    });

    it('returns server message for validation errors', () => {
      const error: CloudFunctionError = {
        code: 'functions/invalid-argument',
        message: 'Field "content" is required',
      };
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'Field "content" is required');
    });

    it('returns default invalid-argument message when no server message', () => {
      const error: CloudFunctionError = { code: 'functions/invalid-argument' };
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'Invalid data. Please check your input and try again.');
    });

    it('returns not-found message', () => {
      const error: CloudFunctionError = { code: 'functions/not-found' };
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'The requested item was not found.');
    });

    it('allows custom messages to override defaults', () => {
      const error: CloudFunctionError = { code: 'functions/resource-exhausted' };
      const message = getCloudFunctionErrorMessage(error, {
        customMessages: {
          'functions/resource-exhausted': 'Please wait 60 seconds.',
        },
      });
      assert.strictEqual(message, 'Please wait 60 seconds.');
    });

    it('uses custom default message for unknown codes', () => {
      const error: CloudFunctionError = { code: 'functions/unknown-code' };
      const message = getCloudFunctionErrorMessage(error, {
        defaultMessage: 'Something went wrong.',
      });
      assert.strictEqual(message, 'Something went wrong.');
    });

    it('returns default message for plain Error without leaking internals', () => {
      const error = new Error('Internal error at line 123');
      const message = getCloudFunctionErrorMessage(error);
      // Should return default message since error message looks like internal
      assert.strictEqual(message, 'An unexpected error occurred. Please try again.');
    });

    it('returns Error message if it looks user-friendly', () => {
      const error = new Error('Your session has expired');
      const message = getCloudFunctionErrorMessage(error);
      assert.strictEqual(message, 'Your session has expired');
    });

    it('returns default message for non-Error unknown errors', () => {
      const message = getCloudFunctionErrorMessage('string error');
      assert.strictEqual(message, 'An unexpected error occurred. Please try again.');
    });
  });

  describe('handleCloudFunctionError', () => {
    // Note: NODE_ENV is already set to 'test' by the test runner

    it('returns success: false with error message', () => {
      const error: CloudFunctionError = { code: 'functions/resource-exhausted' };
      const result = handleCloudFunctionError(error);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Too many requests. Please wait a moment and try again.');
    });

    it('allows operation context for logging', () => {
      const error: CloudFunctionError = { code: 'functions/unauthenticated' };
      const result = handleCloudFunctionError(error, { operation: 'save entry' });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Please sign in to continue.');
    });

    it('allows custom messages', () => {
      const error: CloudFunctionError = { code: 'functions/not-found' };
      const result = handleCloudFunctionError(error, {
        customMessages: {
          'functions/not-found': 'Entry was already deleted.',
        },
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Entry was already deleted.');
    });
  });

  describe('error type checkers', () => {
    it('isRateLimitError identifies rate limit errors', () => {
      assert.strictEqual(isRateLimitError({ code: 'functions/resource-exhausted' }), true);
      assert.strictEqual(isRateLimitError({ code: 'functions/unauthenticated' }), false);
      assert.strictEqual(isRateLimitError(new Error('rate limit')), false);
    });

    it('isAuthError identifies auth errors', () => {
      assert.strictEqual(isAuthError({ code: 'functions/unauthenticated' }), true);
      assert.strictEqual(isAuthError({ code: 'functions/resource-exhausted' }), false);
      assert.strictEqual(isAuthError(new Error('auth')), false);
    });

    it('isSecurityError identifies security errors', () => {
      assert.strictEqual(isSecurityError({ code: 'functions/failed-precondition' }), true);
      assert.strictEqual(isSecurityError({ code: 'functions/unauthenticated' }), false);
      assert.strictEqual(isSecurityError(new Error('security')), false);
    });

    it('isValidationError identifies validation errors', () => {
      assert.strictEqual(isValidationError({ code: 'functions/invalid-argument' }), true);
      assert.strictEqual(isValidationError({ code: 'functions/unauthenticated' }), false);
      assert.strictEqual(isValidationError(new Error('validation')), false);
    });

    it('isNotFoundError identifies not-found errors', () => {
      assert.strictEqual(isNotFoundError({ code: 'functions/not-found' }), true);
      assert.strictEqual(isNotFoundError({ code: 'functions/unauthenticated' }), false);
      assert.strictEqual(isNotFoundError(new Error('not found')), false);
    });
  });
});
