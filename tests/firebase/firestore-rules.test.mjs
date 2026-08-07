import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

let testEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: "demo-sonash",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

after(async () => {
  await testEnvironment?.cleanup();
});

test("users can access only their own profile", async () => {
  const userDb = testEnvironment.authenticatedContext("user-a").firestore();

  await assertSucceeds(userDb.doc("users/user-a").set({ nickname: "A" }));
  await assertFails(userDb.doc("users/user-b").get());
});

test("journal, daily-log, and inventory writes are Cloud Function-only", async () => {
  const userDb = testEnvironment.authenticatedContext("user-a").firestore();

  await assertFails(userDb.doc("users/user-a/journal/entry-1").set({ text: "x" }));
  await assertFails(userDb.doc("users/user-a/daily_logs/2026-08-07").set({ mood: "good" }));
  await assertFails(userDb.doc("users/user-a/inventoryEntries/entry-1").set({ text: "x" }));
});

test("owners may delete their recovery records but not another user's", async () => {
  const ownerDb = testEnvironment.authenticatedContext("user-a").firestore();

  await assertSucceeds(ownerDb.doc("users/user-a/journal/entry-2").delete());
  await assertFails(ownerDb.doc("users/user-b/journal/entry-2").delete());
});

test("public collections are readable but protected collections are not writable", async () => {
  const anonymousDb = testEnvironment.unauthenticatedContext().firestore();

  await assertSucceeds(anonymousDb.doc("meetings/meeting-1").get());
  await assertFails(anonymousDb.doc("meetings/meeting-1").set({ name: "Injected" }));
  await assertFails(anonymousDb.doc("rate_limits/ip-1").get());
});

test("admin claims are required for admin-managed public content", async () => {
  const userDb = testEnvironment.authenticatedContext("user-a").firestore();

  const adminDb = testEnvironment.authenticatedContext("admin-a", { admin: true }).firestore();

  await assertFails(userDb.doc("daily_quotes/quote-1").set({ text: "Nope" }));
  await assertSucceeds(adminDb.doc("daily_quotes/quote-1").set({ text: "Approved" }));
});
