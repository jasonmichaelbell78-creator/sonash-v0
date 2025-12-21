import { describe, it } from "node:test"
import assert from "node:assert"
import { buildPath, FIRESTORE_COLLECTIONS, RATE_LIMITS } from "../../lib/constants"

describe("constants", () => {
  describe("buildPath", () => {
    describe("userDoc", () => {
      it("builds correct user document path", () => {
        const path = buildPath.userDoc("user123")
        assert.strictEqual(path, "users/user123")
      })

      it("preserves special characters in userId (validation happens elsewhere)", () => {
        // buildPath doesn't validate - that's assertUserScope's job
        const path = buildPath.userDoc("user-with_chars")
        assert.strictEqual(path, "users/user-with_chars")
      })
    })

    describe("dailyLog", () => {
      it("builds correct daily log path", () => {
        const path = buildPath.dailyLog("user123", "2024-01-15")
        assert.strictEqual(path, "users/user123/daily_logs/2024-01-15")
      })

      it("handles various date formats", () => {
        const path = buildPath.dailyLog("abc", "2024-12-31")
        assert.strictEqual(path, "users/abc/daily_logs/2024-12-31")
      })
    })

    describe("dailyLogsCollection", () => {
      it("builds correct collection path", () => {
        const path = buildPath.dailyLogsCollection("user123")
        assert.strictEqual(path, "users/user123/daily_logs")
      })
    })
  })

  describe("FIRESTORE_COLLECTIONS", () => {
    it("has expected collection names", () => {
      assert.strictEqual(FIRESTORE_COLLECTIONS.USERS, "users")
      assert.strictEqual(FIRESTORE_COLLECTIONS.DAILY_LOGS, "daily_logs")
      assert.strictEqual(FIRESTORE_COLLECTIONS.MEETINGS, "meetings")
      assert.strictEqual(FIRESTORE_COLLECTIONS.CONTACTS, "contacts")
      assert.strictEqual(FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES, "journalEntries")
    })
  })

  describe("RATE_LIMITS", () => {
    it("has reasonable save rate limit", () => {
      assert.strictEqual(RATE_LIMITS.SAVE_DAILY_LOG.MAX_CALLS, 10)
      assert.strictEqual(RATE_LIMITS.SAVE_DAILY_LOG.WINDOW_MS, 60000)
    })

    it("has stricter auth rate limit", () => {
      assert.strictEqual(RATE_LIMITS.AUTH.MAX_CALLS, 5)
      assert.strictEqual(RATE_LIMITS.AUTH.WINDOW_MS, 60000)
    })

    it("has higher read rate limit", () => {
      assert.strictEqual(RATE_LIMITS.READ.MAX_CALLS, 30)
      assert.strictEqual(RATE_LIMITS.READ.WINDOW_MS, 60000)
    })
  })
})
