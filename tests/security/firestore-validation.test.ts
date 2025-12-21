import { describe, it } from "node:test"
import assert from "node:assert"
import {
  assertUserScope,
  validateUserDocumentPath,
} from "../../lib/security/firestore-validation"

describe("firestore-validation", () => {
  describe("assertUserScope", () => {
    it("allows valid user id", () => {
      assert.doesNotThrow(() => {
        assertUserScope({ userId: "abc123" })
      })
    })

    it("allows alphanumeric with dashes and underscores", () => {
      assert.doesNotThrow(() => {
        assertUserScope({ userId: "user_123-abc" })
      })
    })

    it("throws when userId is empty", () => {
      assert.throws(
        () => assertUserScope({ userId: "" }),
        /requires a user id/
      )
    })

    it("throws when userId contains invalid characters", () => {
      assert.throws(
        () => assertUserScope({ userId: "user@evil.com" }),
        /invalid user id format/
      )
    })

    it("throws when userId contains path traversal", () => {
      assert.throws(
        () => assertUserScope({ userId: "../admin" }),
        /invalid user id format/
      )
    })

    it("throws when userId contains spaces", () => {
      assert.throws(
        () => assertUserScope({ userId: "user name" }),
        /invalid user id format/
      )
    })

    it("throws when userId contains slashes", () => {
      assert.throws(
        () => assertUserScope({ userId: "user/other" }),
        /invalid user id format/
      )
    })

    it("allows when targetUserId matches userId", () => {
      assert.doesNotThrow(() => {
        assertUserScope({ userId: "user123", targetUserId: "user123" })
      })
    })

    it("throws when targetUserId differs from userId", () => {
      assert.throws(
        () => assertUserScope({ userId: "user123", targetUserId: "other456" }),
        /another user's data/
      )
    })

    it("includes resource name in cross-user error", () => {
      assert.throws(
        () =>
          assertUserScope({
            userId: "user123",
            targetUserId: "other456",
            resource: "daily_logs",
          }),
        /another user's data.*daily_logs/
      )
    })
  })

  describe("validateUserDocumentPath", () => {
    it("allows path starting with users/{userId}", () => {
      assert.doesNotThrow(() => {
        validateUserDocumentPath("user123", "users/user123/daily_logs/2024-01-01")
      })
    })

    it("allows exact user document path", () => {
      assert.doesNotThrow(() => {
        validateUserDocumentPath("user123", "users/user123")
      })
    })

    it("throws for path to different user", () => {
      assert.throws(
        () => validateUserDocumentPath("user123", "users/other456/daily_logs/2024-01-01"),
        /limited to the signed-in user's document/
      )
    })

    it("throws for path not starting with users/", () => {
      assert.throws(
        () => validateUserDocumentPath("user123", "admin/settings"),
        /limited to the signed-in user's document/
      )
    })

    it("throws for path with prefix attack", () => {
      // Attacker tries: users/user123evil where their ID is user123
      assert.throws(
        () => validateUserDocumentPath("user123", "users/user123evil/data"),
        /limited to the signed-in user's document/
      )
    })

    it("handles empty path", () => {
      assert.throws(
        () => validateUserDocumentPath("user123", ""),
        /limited to the signed-in user's document/
      )
    })
  })
})
