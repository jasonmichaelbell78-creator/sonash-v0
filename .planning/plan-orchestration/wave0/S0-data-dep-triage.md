# S0 Triage: Data Quality, SonarCloud Finding, Dependency Vulnerability

**Date:** 2026-03-24 **Auditor:** security-auditor agent **Scope:** DEBT-1293,
DEBT-4399, DEBT-7544

---

## Item 1: DEBT-1293 — Soft-deleted entries sent to client

**Disposition:** DEFER (downgrade to S1) **Fix complexity:** S (small)

### Evidence

The Firestore query in `hooks/use-journal.ts:285-289` fetches journal entries
without filtering on `isSoftDeleted`:

```typescript
const q = query(
  collection(db, `users/${user.uid}/journal`),
  orderBy("createdAt", "desc"),
  limit(QUERY_LIMITS.JOURNAL_MAX)
);
```

The comment on line 282 explicitly says: "Using simple query without where
clause to avoid composite index requirement." However, the composite index
already exists in `firestore.indexes.json` (lines 3-16) for `isSoftDeleted` +
`createdAt` on the `journal` collection. The index was deployed but the query
was never updated.

Filtering happens client-side in `processJournalDoc` (line 179):
`if (data.isSoftDeleted === true) return null;`

This means soft-deleted entries traverse the network, are received by the
Firebase SDK, stored in the local IndexedDB cache, and are visible in the
browser DevTools Network tab before being discarded.

### Risk assessment

**Mitigating factors:**

1. Firestore rules (`firestore.rules:33-41`) restrict reads to the document
   owner (`allow read: if isOwner(userId)`). Only the user who created the
   entries can see them -- an attacker cannot read another user's soft-deleted
   entries.

2. Journal entries live under `/users/{userId}/journal/` -- the subcollection
   path is scoped to the authenticated user. There is no cross-user exposure.

3. The soft-deleted entries contain the same data the user originally wrote. The
   user already has access to this data by design (it's their own journal).

4. The `QUERY_LIMITS.JOURNAL_MAX` (100) bounds the total documents fetched,
   limiting bandwidth waste.

**Remaining concerns:**

- A user who soft-deletes a journal entry expects it to be "gone." Seeing it in
  DevTools Network traffic violates that expectation (privacy UX).
- Bandwidth waste: soft-deleted entries count toward the 100-entry limit,
  meaning users with many deletions see fewer active entries.
- The composite index already exists, so the fix is trivial: add
  `where("isSoftDeleted", "==", false)` to the query and import `where`.

### Risk if deferred

Low. The data is only accessible to the authenticated owner. No cross-user
exposure. No data the user hasn't already seen. The main impact is a broken UX
promise ("deleted" content still traversable in DevTools) and minor bandwidth
overhead. This is S1 at most, not S0.

---

## Item 2: DEBT-4399 — Hard-coded password (SonarCloud rule typescript:S2068)

**Disposition:** FALSE POSITIVE **Fix complexity:** N/A

### Evidence

The SonarCloud finding points to `lib/utils/errors.ts:69`. Line 69 is the JSDoc
comment `*/` closing the `getFirebaseErrorMessage` function documentation. The
surrounding code (lines 70-84) is a Record mapping Firebase error codes to
user-friendly messages:

```typescript
const errorMessages: Record<string, string> = {
  "auth/wrong-password": "Incorrect password",
  "auth/weak-password": "Password should be at least 6 characters",
  // ...
};
```

SonarCloud's S2068 rule pattern-matches on string literals containing "password"
in both the key and value. These are:

- Firebase error code strings used as dictionary keys (`"auth/wrong-password"`)
- User-facing error messages (`"Incorrect password"`)

There is no actual credential, secret, or hard-coded password anywhere in this
file. The word "password" appears solely in error code identifiers and display
strings.

The project already has a SonarCloud exclusion for S2068 in test files
(`sonar-project.properties:47-48`), but the exclusion targets `tests/**/*.ts`
only, not `lib/**/*.ts`. The `lib/utils/errors.ts` file is not covered by the
exclusion.

### Risk if deferred

None. This is a static analysis false positive. No credential is exposed.

### Recommendation

Add a SonarCloud exclusion for this specific file, or add an inline `// NOSONAR`
comment on the relevant lines. Alternatively, extend the existing `fp3`
multicriteria to cover `lib/utils/errors.ts`.

---

## Item 3: DEBT-7544 — fast-xml-parser DoS vulnerability

**Disposition:** DEFER (downgrade to S2) **Fix complexity:** S (already resolved
by override)

### Evidence

**Dependency chain:** `firebase-admin@13.7.0` -> `@google-cloud/storage@7.19.0`
-> `fast-xml-parser`

**Current state:** The `package.json` overrides section (line 211) already pins
`fast-xml-parser` to version `5.5.7`:

```json
"overrides": {
  "fast-xml-parser": "5.5.7",
}
```

The `npm ls fast-xml-parser` output confirms version `5.5.7 overridden` is
installed. The `npm audit` output reports **0 vulnerabilities**.

The two referenced GHSAs are:

- GHSA-jmr7-xgp7-cmfj: Entity expansion DoS
- GHSA-m7jm-9gc2-mpf2: Regex injection

Both affect fast-xml-parser versions < 4.4.1. Version 5.5.7 is well above the
patched range for both advisories.

**Exploitability in context:** Even if a vulnerable version were present, the
fast-xml-parser dependency is used by `@google-cloud/storage` for parsing XML
responses from Google Cloud Storage API. SoNash does not:

- Accept user-uploaded XML
- Parse XML from user input anywhere in the application
- Expose the XML parser to untrusted data

The XML parsed by this library comes exclusively from Google Cloud Storage API
responses (trusted source).

### Risk if deferred

Effectively none. The vulnerability is already mitigated by the npm override to
v5.5.7. The `npm audit` confirms 0 vulnerabilities. The parser processes only
trusted Google API responses, not user input. This item can be closed as
resolved.

---

## Summary

| Item      | Original Severity | Disposition    | Recommended Severity | Action                           |
| --------- | ----------------- | -------------- | -------------------- | -------------------------------- |
| DEBT-1293 | S0                | DEFER          | S1                   | Add `where` clause (trivial)     |
| DEBT-4399 | S0                | FALSE POSITIVE | Closed               | Add SonarCloud exclusion         |
| DEBT-7544 | S0                | DEFER          | Closed               | Already resolved by npm override |

**Net result:** Zero items require immediate S0 action. DEBT-1293 is a
legitimate improvement (S1) with a trivial fix. DEBT-4399 and DEBT-7544 can be
closed.
