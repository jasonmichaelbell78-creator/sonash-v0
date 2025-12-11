import assert from "node:assert/strict"
import { test, describe } from "node:test"
import {
  getTodayDateId,
  formatDateForDisplay,
  parseDateId,
  isValidDateId,
} from "../../lib/utils/date-utils"

describe("date-utils", () => {
  test("getTodayDateId returns YYYY-MM-DD format", () => {
    const dateId = getTodayDateId()
    assert.match(dateId, /^\d{4}-\d{2}-\d{2}$/)
  })

  test("getTodayDateId returns consistent format multiple calls", () => {
    const id1 = getTodayDateId()
    const id2 = getTodayDateId()
    assert.equal(id1, id2, "Should return same date ID when called immediately")
  })

  test("formatDateForDisplay returns readable format", () => {
    const testDate = new Date("2025-12-11T12:00:00Z")
    const formatted = formatDateForDisplay(testDate)

    // Should contain day name, month, and day number
    assert.ok(formatted.includes("Dec") || formatted.includes("December"))
    assert.ok(formatted.includes("11"))
  })

  test("formatDateForDisplay uses current date when no argument", () => {
    const formatted = formatDateForDisplay()
    assert.ok(formatted.length > 0, "Should return non-empty string")
    assert.match(formatted, /[A-Z][a-z]+, [A-Z][a-z]+ \d+/)
  })

  test("parseDateId converts YYYY-MM-DD to Date", () => {
    const date = parseDateId("2025-12-11")
    assert.ok(date instanceof Date)
    assert.equal(date.getUTCFullYear(), 2025)
    assert.equal(date.getUTCMonth(), 11) // December (0-indexed)
    assert.equal(date.getUTCDate(), 11)
  })

  test("parseDateId handles UTC correctly", () => {
    const date = parseDateId("2025-01-01")
    // Should be midnight UTC
    assert.equal(date.getUTCHours(), 0)
    assert.equal(date.getUTCMinutes(), 0)
    assert.equal(date.getUTCSeconds(), 0)
  })

  test("isValidDateId accepts valid YYYY-MM-DD format", () => {
    assert.ok(isValidDateId("2025-12-11"))
    assert.ok(isValidDateId("2024-01-01"))
    assert.ok(isValidDateId("1999-12-31"))
  })

  test("isValidDateId rejects invalid formats", () => {
    assert.equal(isValidDateId("12/11/2025"), false)
    assert.equal(isValidDateId("2025-1-1"), false)
    assert.equal(isValidDateId("2025-12-1"), false)
    assert.equal(isValidDateId("25-12-11"), false)
    assert.equal(isValidDateId("not-a-date"), false)
    assert.equal(isValidDateId(""), false)
  })

  test("roundtrip: getTodayDateId -> parseDateId", () => {
    const dateId = getTodayDateId()
    const parsed = parseDateId(dateId)

    // Should successfully parse
    assert.ok(parsed instanceof Date)
    assert.ok(!isNaN(parsed.getTime()))

    // Re-formatting should give same date ID
    const roundtrip = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
    }).format(parsed)
    assert.equal(roundtrip, dateId)
  })
})
