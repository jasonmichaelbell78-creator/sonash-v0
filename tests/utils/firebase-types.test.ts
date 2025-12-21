import assert from "node:assert/strict"
import { test, describe } from "node:test"
import { isFirestoreTimestamp, toDate } from "../../lib/types/firebase-types"

describe("firebase-types", () => {
  describe("isFirestoreTimestamp", () => {
    test("returns true for valid Timestamp-like object", () => {
      const mockTimestamp = {
        seconds: 1702310400,
        nanoseconds: 0,
        toDate: () => new Date(1702310400000),
      }

      assert.ok(isFirestoreTimestamp(mockTimestamp))
    })

    test("returns false for null", () => {
      assert.equal(isFirestoreTimestamp(null), false)
    })

    test("returns false for undefined", () => {
      assert.equal(isFirestoreTimestamp(undefined), false)
    })

    test("returns false for plain Date object", () => {
      assert.equal(isFirestoreTimestamp(new Date()), false)
    })

    test("returns false for object without toDate method", () => {
      const notTimestamp = {
        seconds: 1702310400,
        nanoseconds: 0,
      }
      assert.equal(isFirestoreTimestamp(notTimestamp), false)
    })

    test("returns false for object without seconds", () => {
      const notTimestamp = {
        nanoseconds: 0,
        toDate: () => new Date(),
      }
      assert.equal(isFirestoreTimestamp(notTimestamp), false)
    })

    test("returns false for object without nanoseconds", () => {
      const notTimestamp = {
        seconds: 1702310400,
        toDate: () => new Date(),
      }
      assert.equal(isFirestoreTimestamp(notTimestamp), false)
    })

    test("returns false for object with non-function toDate", () => {
      const notTimestamp = {
        seconds: 1702310400,
        nanoseconds: 0,
        toDate: "not a function",
      }
      assert.equal(isFirestoreTimestamp(notTimestamp), false)
    })

    test("returns false for primitive types", () => {
      assert.equal(isFirestoreTimestamp(123), false)
      assert.equal(isFirestoreTimestamp("timestamp"), false)
      assert.equal(isFirestoreTimestamp(true), false)
    })
  })

  describe("toDate", () => {
    test("converts Timestamp-like object to Date", () => {
      const mockTimestamp = {
        seconds: 1702310400,
        nanoseconds: 0,
        toDate: () => new Date(1702310400000),
      }

      const result = toDate(mockTimestamp)
      assert.ok(result instanceof Date)
      assert.equal(result?.getTime(), 1702310400000)
    })

    test("returns Date object as-is", () => {
      const date = new Date("2025-12-11T12:00:00Z")
      const result = toDate(date)

      assert.ok(result instanceof Date)
      assert.equal(result?.getTime(), date.getTime())
    })

    test("converts ISO date string to Date", () => {
      const result = toDate("2025-12-11T12:00:00Z")

      assert.ok(result instanceof Date)
      assert.equal(result?.getUTCFullYear(), 2025)
      assert.equal(result?.getUTCMonth(), 11) // December (0-indexed)
      assert.equal(result?.getUTCDate(), 11)
    })

    test("converts timestamp number to Date", () => {
      const timestamp = 1702310400000
      const result = toDate(timestamp)

      assert.ok(result instanceof Date)
      assert.equal(result?.getTime(), timestamp)
    })

    test("returns null for null input", () => {
      assert.equal(toDate(null), null)
    })

    test("returns null for undefined input", () => {
      assert.equal(toDate(undefined), null)
    })

    test("returns null for invalid date string", () => {
      assert.equal(toDate("not a date"), null)
      assert.equal(toDate("invalid"), null)
    })

    test("returns null for NaN", () => {
      assert.equal(toDate(NaN), null)
    })

    test("returns null for empty string", () => {
      assert.equal(toDate(""), null)
    })

    test("handles various date string formats", () => {
      const formats = [
        "2025-12-11",
        "2025-12-11T12:00:00",
        "2025-12-11T12:00:00Z",
        "2025-12-11T12:00:00.000Z",
        "Dec 11, 2025",
      ]

      formats.forEach((format) => {
        const result = toDate(format)
        assert.ok(result instanceof Date, `Should parse format: ${format}`)
        assert.ok(!isNaN(result!.getTime()), `Should be valid date: ${format}`)
      })
    })

    test("handles Unix timestamps (seconds)", () => {
      const unixTimestamp = 1702310400 // Seconds
      const result = toDate(unixTimestamp)

      assert.ok(result instanceof Date)
      // JavaScript treats numbers < 10000 as year, so need milliseconds
      // This will be interpreted as year 1702310400 which is invalid
      // But the function should still return a Date object
    })

    test("handles negative timestamps", () => {
      const negativeTimestamp = -86400000 // 1 day before epoch
      const result = toDate(negativeTimestamp)

      assert.ok(result instanceof Date)
      assert.equal(result?.getTime(), negativeTimestamp)
    })

    test("handles future dates", () => {
      const futureDate = "2099-12-31T23:59:59Z"
      const result = toDate(futureDate)

      assert.ok(result instanceof Date)
      assert.equal(result?.getUTCFullYear(), 2099)
    })

    test("preserves timezone information", () => {
      const isoString = "2025-12-11T12:00:00Z"
      const result = toDate(isoString)

      assert.ok(result instanceof Date)
      assert.equal(result?.getUTCHours(), 12)
    })
  })
})
