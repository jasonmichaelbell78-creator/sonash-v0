# S0 App Check Cluster -- Triage Assessment

**Date:** 2026-03-24 **Auditor:** security-auditor agent **Items:** DEBT-0774,
DEBT-0853, DEBT-0855, DEBT-0864

---

## Disposition: DEFER (downgrade from S0 to S2)

These 4 entries are **1 root issue** with 4 duplicate records from different
audit sources. The actual risk is significantly lower than S0 because
compensating controls are in place.

---

## Evidence

### What is disabled

1. **Client-side App Check initialization** (`lib/firebase.ts:57-91`) -- the
   entire `initializeAppCheck()` block is commented out. The import of
   `initializeAppCheck` and `ReCaptchaEnterpriseProvider` is commented out on
   line 5. Only the type import remains.

2. **Server-side App Check verification** (`functions/src/index.ts`) -- all 4
   user-facing callable functions pass `requireAppCheck: false`:
   - `saveDailyLog` (line 84)
   - `saveJournalEntry` (line 170)
   - `softDeleteJournalEntry` (line 269)
   - `saveInventoryEntry` (line 363)

3. **Migration function** (`functions/src/index.ts:507-512`) -- App Check
   verification is commented out in a `/* */` block.

4. **Admin functions** (`functions/src/admin.ts`) -- do NOT use
   `withSecurityChecks()` at all. They use a separate `requireAdmin()` helper
   that checks auth + admin claim + rate limiting but never checks
   `request.app`.

### What IS active (compensating controls)

The security posture is significantly stronger than "no App Check" suggests:

1. **reCAPTCHA Enterprise is fully operational.** All 4 user-facing callable
   functions specify a `recaptchaAction` in their `withSecurityChecks()`
   options. The client sends reCAPTCHA tokens (confirmed in
   `lib/firestore-service.ts`, `hooks/use-journal.ts`,
   `lib/auth/account-linking.ts`). The reCAPTCHA script is loaded in
   `app/layout.tsx` (line 88). Server-side verification happens in
   `functions/src/recaptcha-verify.ts` with score threshold 0.5, action
   matching, and token validity checks.

2. **Authentication is required.** `withSecurityChecks()` rejects
   unauthenticated requests at line 353. Every function requires `request.auth`.

3. **Firestore rules block direct writes.** `journal`, `daily_logs`,
   `inventoryEntries` all have `allow create, update: if false`. Even if someone
   bypasses Cloud Functions, Firestore rules prevent direct writes.

4. **Zod validation** is active on all callable functions.

5. **Rate limiting** (Firestore-backed, fail-closed) is active on all callable
   functions, including IP-based limiting support.

6. **userId authorization** is active -- users cannot write to other users'
   data.

7. **Admin functions** are gated by `request.auth.token.admin === true` custom
   claim check, which cannot be set by clients.

### The migration function is weaker

`migrateAnonymousUserData` does NOT use `withSecurityChecks()` -- it implements
its own inline security checks. reCAPTCHA is optional for this function (logs a
warning but continues without it, lines 517-531). This is documented as
intentional for network-blocking edge cases during account linking. The
migration is still protected by auth + rate limiting (5/5min) + Zod validation +
authorization (caller must be the target user).

---

## Dedup Analysis

All 4 entries describe the same root issue: App Check is disabled.

| ID        | Severity                | Source                 | Distinction                                    |
| --------- | ----------------------- | ---------------------- | ---------------------------------------------- |
| DEBT-0774 | S3 (already downgraded) | CANON-0043 review      | Describes both client + server disable         |
| DEBT-0853 | S0                      | CANON-0001 review      | "Bot/device attestation disabled on callables" |
| DEBT-0855 | S0                      | Tier-2 dedup output    | "App Check disabled on all CF + client init"   |
| DEBT-0864 | S0                      | Legacy audit migration | "Re-enable App Check on Cloud Functions"       |

**Verdict:** 1 root issue, 4 duplicate records. DEBT-0774 was already correctly
downgraded to S3 by a prior review. DEBT-0853, DEBT-0855, and DEBT-0864 should
be consolidated into 1 item and downgraded.

---

## Real-World Exploitability Assessment

**What App Check prevents:** Automated bot/script calls to Cloud Functions from
non-browser clients. Without App Check, someone could call your callable
functions using `curl` or a script, as long as they have a valid Firebase auth
token.

**What an attacker would need even without App Check:**

1. A valid Firebase auth token (requires creating a real account or stealing
   one)
2. A valid reCAPTCHA Enterprise token with score >= 0.5 and correct action name
3. Data that passes Zod validation
4. They can only write to their own userId (authorization check)
5. They are rate-limited to 10 requests/minute

**Practical attack scenario:** An attacker creates a burner account, obtains a
reCAPTCHA token programmatically (possible but costly at scale with Enterprise),
and spams their own journal entries. The impact is: they fill their own account
with garbage data. There is no path to accessing or modifying other users' data.

**For a sobriety tracking app with a small user base:** The threat model does
not include sophisticated bot attacks or API abuse at scale. The reCAPTCHA
Enterprise layer provides equivalent bot detection to what App Check would add.
App Check's primary value would be defense-in-depth, not closing an exploitable
gap.

**Risk rating:** Low. reCAPTCHA Enterprise provides the same bot-detection
function that App Check would. Auth + authorization + rate limiting prevent any
meaningful abuse. The only scenario where App Check adds value over the current
controls is if reCAPTCHA Enterprise is somehow bypassed AND the attacker has
auth tokens.

---

## Fix Complexity: M (Medium)

Re-enabling App Check is not a simple flag flip. Prerequisites:

1. **Client-side:** Uncomment the `initializeAppCheck()` block in
   `lib/firebase.ts`. Requires the
   `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` env variable to be set (it
   already exists for reCAPTCHA).

2. **Server-side:** Change `requireAppCheck: false` to `true` (or remove it,
   since `true` is the default) on all 4 functions in `functions/src/index.ts`.
   Uncomment the App Check block in `migrateAnonymousUserData`.

3. **Testing required:** App Check has a 24-hour throttle on token issuance if
   misconfigured (the comments reference "waiting for throttle to clear",
   suggesting this was hit before). Incorrect enablement breaks ALL callable
   function calls for all users until the throttle clears.

4. **Debug token setup:** Development environments need
   `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` configured. The code already
   handles this (lines 66-77 in firebase.ts).

5. **Admin functions:** These use `requireAdmin()` which has no App Check
   integration. Adding App Check to admin functions would require either
   refactoring to use `withSecurityChecks()` or adding `request.app` checks to
   `requireAdmin()`. Lower priority since admin functions require a custom
   claim.

6. **Firebase Console:** App Check must be enabled in the Firebase Console for
   the project. The reCAPTCHA Enterprise provider must be registered.

**Estimated effort:** 1 session for the code changes, but requires careful
staging (enable client first, verify tokens flow, then enable server
enforcement) to avoid the 24-hour throttle scenario that caused the original
disable.

---

## Risk If Deferred

**Low.** The compensating controls (reCAPTCHA Enterprise + auth + authorization

- rate limiting + Firestore rules) provide equivalent protection for this
  application's threat model. App Check would add defense-in-depth but does not
  close an exploitable gap.

The only incremental risk is: if an attacker can bypass reCAPTCHA Enterprise
scoring AND has valid auth tokens, they could call functions from a non-browser
client. The impact would be limited to writing to their own data within rate
limits.

---

## Recommendation

1. **Downgrade DEBT-0853, DEBT-0855, DEBT-0864 from S0 to S2** (defense-in-depth
   hardening, not an exploitable vulnerability).
2. **Merge all 4 into a single tracking item** since they are the same issue.
3. **Schedule for a dedicated hardening session** with a staging plan:
   - Phase 1: Enable client-side App Check init, deploy, verify tokens appear
   - Phase 2: Enable server-side enforcement on 1 function, monitor for 24h
   - Phase 3: Roll out to all functions
4. **Do not block other work on this.** The current security posture is
   adequate.
