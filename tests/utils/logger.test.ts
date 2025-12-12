import { describe, it, mock, beforeEach, afterEach } from "node:test"
import assert from "node:assert"
import { logger, maskIdentifier } from "../../lib/logger"

describe("logger", () => {
  describe("maskIdentifier", () => {
    it("masks long identifiers showing first 3 and last 2 chars", () => {
      const result = maskIdentifier("abc123def456")
      assert.strictEqual(result, "abc…56")
    })

    it("returns short strings unchanged", () => {
      const result = maskIdentifier("short")
      assert.strictEqual(result, "short")
    })

    it("handles exactly 6 character strings unchanged", () => {
      const result = maskIdentifier("sixsix")
      assert.strictEqual(result, "sixsix")
    })

    it("masks 7+ character strings", () => {
      const result = maskIdentifier("sevench")
      assert.strictEqual(result, "sev…ch")
    })

    it("returns [unknown] for null", () => {
      const result = maskIdentifier(null)
      assert.strictEqual(result, "[unknown]")
    })

    it("returns [unknown] for undefined", () => {
      const result = maskIdentifier(undefined)
      assert.strictEqual(result, "[unknown]")
    })

    it("returns [unknown] for empty string", () => {
      const result = maskIdentifier("")
      assert.strictEqual(result, "[unknown]")
    })
  })

  describe("logger.info/warn/error", () => {
    let originalLog: typeof console.log
    let originalWarn: typeof console.warn
    let originalError: typeof console.error
    let capturedLogs: unknown[]

    beforeEach(() => {
      capturedLogs = []
      originalLog = console.log
      originalWarn = console.warn
      originalError = console.error

      console.log = (...args: unknown[]) => capturedLogs.push({ type: "log", args })
      console.warn = (...args: unknown[]) => capturedLogs.push({ type: "warn", args })
      console.error = (...args: unknown[]) => capturedLogs.push({ type: "error", args })
    })

    afterEach(() => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    })

    it("logger.info logs message with info level", () => {
      logger.info("Test message")
      assert.strictEqual(capturedLogs.length, 1)
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      assert.strictEqual(log.type, "log")
      const payload = log.args[0] as { level: string; message: string }
      assert.strictEqual(payload.level, "info")
      assert.strictEqual(payload.message, "Test message")
    })

    it("logger.warn logs message with warn level", () => {
      logger.warn("Warning message")
      assert.strictEqual(capturedLogs.length, 1)
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      assert.strictEqual(log.type, "warn")
      const payload = log.args[0] as { level: string; message: string }
      assert.strictEqual(payload.level, "warn")
    })

    it("logger.error logs message with error level", () => {
      logger.error("Error message")
      assert.strictEqual(capturedLogs.length, 1)
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      assert.strictEqual(log.type, "error")
      const payload = log.args[0] as { level: string; message: string }
      assert.strictEqual(payload.level, "error")
    })

    it("redacts sensitive keys in nested objects", () => {
      // Note: redaction happens when iterating over object keys, not top-level context keys
      logger.info("Auth event", { data: { password: "secret123", user: "john" } })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { data: { password: string; user: string } } }
      assert.strictEqual(payload.context.data.password, "[REDACTED]")
      assert.strictEqual(payload.context.data.user, "john")
    })

    it("redacts token-like strings", () => {
      logger.info("Token used", { value: "abc123def456xyz789" })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { value: string } }
      // Token-like strings (12+ chars, alphanumeric) get partially redacted
      assert.ok(payload.context.value.includes("[REDACTED]"), "Should contain [REDACTED]")
      assert.strictEqual(payload.context.value, "abc1…[REDACTED]")
    })

    it("preserves short strings (not identifier-like)", () => {
      logger.info("Status", { status: "loading" })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { status: string } }
      assert.strictEqual(payload.context.status, "loading")
    })

    it("preserves error messages (contain spaces/punctuation)", () => {
      logger.info("Error occurred", { message: "Network request failed with status 404" })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { message: string } }
      assert.strictEqual(payload.context.message, "Network request failed with status 404")
    })

    it("redacts nested sensitive keys within objects", () => {
      // Note: sanitizeContext processes values with redactValue, which checks keys
      // within objects for sensitive patterns. Top-level key names are not checked.
      logger.info("Auth data", {
        nested: { idToken: "token123", password: "secret", user: "test" },
        data: "safe"
      })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { nested: { idToken: string; password: string; user: string }; data: string } }
      // Keys containing sensitive patterns within nested objects are redacted
      assert.strictEqual(payload.context.nested.idToken, "[REDACTED]")
      assert.strictEqual(payload.context.nested.password, "[REDACTED]")
      assert.strictEqual(payload.context.nested.user, "test")
      assert.strictEqual(payload.context.data, "safe")
    })

    it("handles arrays in context", () => {
      logger.info("Items", { items: ["safe", "abc123def456xyz789"] })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { items: string[] } }
      assert.strictEqual(payload.context.items[0], "safe")
      assert.ok(payload.context.items[1].includes("[REDACTED]"))
    })

    it("handles Error objects in context", () => {
      const error = new Error("Something went wrong")
      logger.error("Failed", { error })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { error: { name: string; message: string } } }
      assert.strictEqual(payload.context.error.name, "Error")
      assert.strictEqual(payload.context.error.message, "Something went wrong")
    })

    it("handles null and undefined in context", () => {
      logger.info("Data", { nullVal: null, undefVal: undefined })
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { context: { nullVal: null; undefVal: undefined } }
      assert.strictEqual(payload.context.nullVal, null)
      assert.strictEqual(payload.context.undefVal, undefined)
    })

    it("includes timestamp in ISO format", () => {
      logger.info("Test")
      const log = capturedLogs[0] as { type: string; args: unknown[] }
      const payload = log.args[0] as { timestamp: string }
      assert.ok(payload.timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
    })
  })
})
