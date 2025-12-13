/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"

const envVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
]

envVars.forEach((key) => {
  process.env[key] = process.env[key] || "test-value"
})

let setDocCalls: any[][]
let validateCalls: any[][]
let getDocReturn: any
let getDocsReturn: any

const mockDeps = () => ({
  db: {},
  assertUserScope: (_: any) => {
    validateCalls.push(["scope"])
  },
  validateUserDocumentPath: (_userId: string, path: string) => {
    validateCalls.push(["path", path])
  },
  collection: (_db: unknown, path: string) => ({ path }),
  doc: (_db: unknown, path: string) => ({ path }),
  setDoc: (...args: any[]) => {
    setDocCalls.push(args)
    return Promise.resolve()
  },
  getDoc: () => Promise.resolve(getDocReturn),
  getDocs: () => Promise.resolve(getDocsReturn),
  query: (...args: any[]) => ({ queryArgs: args }),
  orderBy: (...args: any[]) => ({ orderArgs: args }),
  limit: (value: number) => ({ limit: value }),
  serverTimestamp: () => "timestamp",
  logger: { 
    info: () => undefined,
    warn: () => undefined, 
    error: () => undefined 
  },
})

beforeEach(() => {
  setDocCalls = []
  validateCalls = []
  getDocReturn = { exists: () => false, data: () => ({}) }
  getDocsReturn = { docs: [] }
})

test("saves merged daily log with generated date id", async () => {
  const { createFirestoreService } = await import("../lib/firestore-service")
  const service = createFirestoreService(mockDeps() as any)

  await service.saveDailyLog("user123", { content: "Test note" })

  assert.equal(setDocCalls.length, 1)
  const [docRef, payload, options] = setDocCalls[0]
  assert.deepEqual(docRef, { path: "users/user123/daily_logs/" + payload.id })
  assert.equal(payload.updatedAt, "timestamp")
  assert.equal(options.merge, true)
  assert.ok(validateCalls.some(([key]) => key === "scope"))
  assert.ok(validateCalls.some(([, path]) => path === `users/user123/daily_logs/${payload.id}`))
})

test("returns today's log when snapshot exists", async () => {
  const { createFirestoreService } = await import("../lib/firestore-service")
  getDocReturn = { exists: () => true, data: () => ({ mood: "great" }) }
  const service = createFirestoreService(mockDeps() as any)

  const result = await service.getTodayLog("abc")

  assert.deepEqual(result, { log: { mood: "great" }, error: null })
})

test("maps history documents with ids", async () => {
  const { createFirestoreService } = await import("../lib/firestore-service")
  getDocsReturn = {
    docs: [
      { id: "2024-01-02", data: () => ({ content: "note" }) },
      { id: "2024-01-01", data: () => ({ content: "yesterday" }) },
    ],
  }
  const service = createFirestoreService(mockDeps() as any)

  const result = await service.getHistory("abc")

  assert.deepEqual(result.entries, [
    { id: "2024-01-02", content: "note" },
    { id: "2024-01-01", content: "yesterday" },
  ])
  assert.equal(result.error, null)
})
