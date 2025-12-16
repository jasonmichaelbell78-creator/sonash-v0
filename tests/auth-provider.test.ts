/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { ensureAnonymousSession, refreshTodayLogForUser } from "../components/providers/auth-provider"

envDefaults()

function envDefaults() {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "test-value"
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "test-value"
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "test-value"
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "test-value"
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "test-value"
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "test-value"
}

let todayLog: any
let todayLogError: string | null
let profileError: string | null
let loading: boolean

beforeEach(() => {
  todayLog = null
  todayLogError = null
  profileError = null
  loading = true
})

test("refreshTodayLogForUser updates state when service succeeds", async () => {
  const firestoreService = {
    getTodayLog: async (_userId: string) => ({ log: { mood: "ok" }, error: null }),
  }

  await refreshTodayLogForUser(
    firestoreService as any,
    "user-1",
    (log) => {
      todayLog = log
    },
    (message) => {
      todayLogError = message
    }
  )

  assert.deepEqual(todayLog, { mood: "ok" })
  assert.equal(todayLogError, null)
})

test("refreshTodayLogForUser surfaces errors", async () => {
  const firestoreService = {
    getTodayLog: async (_userId: string) => ({ log: null, error: new Error("fail") }),
  }

  await refreshTodayLogForUser(
    firestoreService as any,
    "user-1",
    (log) => {
      todayLog = log
    },
    (message) => {
      todayLogError = message
    }
  )

  assert.equal(todayLog, null)
  assert.equal(todayLogError, "Failed to load today's log")
})

test("ensureAnonymousSession stores error state when sign-in fails", async () => {
  const authInstance = {} as any
  const failingSignIn = async () => {
    throw new Error("network")
  }

  await ensureAnonymousSession(
    authInstance,
    (value) => {
      loading = value
    },
    failingSignIn as any
  )

  assert.equal(loading, false)
})
