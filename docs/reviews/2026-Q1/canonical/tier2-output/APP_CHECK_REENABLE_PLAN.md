# App Check Re-Enablement Plan

**Generated:** 2026-01-11 **Task:** 4.3.4 - Document App Check re-enablement
plan **Related CANON:** DEDUP-0001 (merged from CANON-0001, CANON-0043,
CANON-0069) **Severity:** S0 (Critical)

---

## Current Status

| Component                    | Status   | Location                               |
| ---------------------------- | -------- | -------------------------------------- |
| Client App Check init        | DISABLED | `lib/firebase.ts:5-78`                 |
| Server App Check enforcement | DISABLED | `functions/src/index.ts` (4 functions) |
| reCAPTCHA verification       | ACTIVE   | Server-side token validation works     |
| Rate limiting                | ACTIVE   | User-based throttling in place         |
| Authentication               | ACTIVE   | All endpoints require auth             |

**Risk Acceptance Status:** App Check disabled due to Firebase platform issue
(ticket filed 2025-12-29)

---

## Dependencies (Must Complete First)

Per Tier-2 aggregation analysis, App Check re-enablement depends on:

| Dep ID     | Title                               | Status  | Reason                             |
| ---------- | ----------------------------------- | ------- | ---------------------------------- |
| DEDUP-0003 | Make reCAPTCHA fail-closed          | PENDING | Compensating control must be solid |
| DEDUP-0004 | Complete rate limiting (IP + admin) | PENDING | Compensating control must be solid |

**Rationale:** CANON-0043 notes that risk acceptance is contingent on
compensating controls being in place. Before re-enabling App Check, we must
ensure reCAPTCHA and rate limiting are fully hardened.

---

## Prerequisites Checklist

### Firebase Platform

- [ ] Firebase support resolves App Check API platform issue
- [ ] Confirm ReCaptcha Enterprise tokens work (400 errors resolved)
- [ ] Confirm debug tokens work in development
- [ ] Verify in staging/development environment first

### Compensating Controls (DEDUP-0003, DEDUP-0004)

- [ ] reCAPTCHA fails closed when token missing (PR3)
- [ ] IP-based rate limiting implemented
- [ ] Admin endpoints protected with rate limiter

---

## Re-Enablement Steps

### Phase 1: Compensating Control Verification

```bash
# Verify reCAPTCHA fail-closed
npm test -- --grep "reCAPTCHA"

# Verify rate limiting
npm test -- --grep "rate limit"

# Check security wrapper
grep -n "requireAppCheck" functions/src/security-wrapper.ts
```

### Phase 2: Client-Side Changes (`lib/firebase.ts`)

1. **Uncomment App Check imports** (lines 4-6):

   ```typescript
   import {
     initializeAppCheck,
     ReCaptchaEnterpriseProvider,
     AppCheck,
   } from "firebase/app-check";
   ```

2. **Uncomment `_appCheck` variable** (lines 28-29):

   ```typescript
   let _appCheck: AppCheck | undefined;
   ```

3. **Uncomment initialization block** (lines 45-78):

   ```typescript
   if (
     typeof window !== "undefined" &&
     process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY
   ) {
     _appCheck = initializeAppCheck(_app, {
       provider: new ReCaptchaEnterpriseProvider(
         process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY
       ),
       isTokenAutoRefreshEnabled: true,
     });
   }
   ```

4. **Update JSDoc** to remove "disabled" notes

5. **Update `getFirebase()` return** to include `appCheck`

### Phase 3: Server-Side Changes (`functions/src/index.ts`)

| Function                   | Line     | Change                           |
| -------------------------- | -------- | -------------------------------- |
| `saveDailyLog`             | ~77      | Set `requireAppCheck: true`      |
| `saveJournalEntry`         | ~168     | Set `requireAppCheck: true`      |
| `softDeleteJournalEntry`   | ~262     | Set `requireAppCheck: true`      |
| `saveInventoryEntry`       | ~359     | Set `requireAppCheck: true`      |
| `migrateAnonymousUserData` | ~486-490 | Uncomment App Check verification |

### Phase 4: Environment Variables

1. **Verify production env**:

   ```bash
   # Check .env.production
   grep "APPCHECK" .env.production
   ```

2. **Expected values**:
   - `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` = valid site key
   - Remove any `DEBUG_TOKEN=true` in production

3. **Update Firebase Console**:
   - Refresh debug tokens for development
   - Verify app registration

### Phase 5: Testing

| Test                  | Command                | Expected                         |
| --------------------- | ---------------------- | -------------------------------- |
| Unit tests            | `npm test`             | All pass                         |
| Client token exchange | Manual test in browser | Token obtained                   |
| Server validation     | Call Cloud Function    | Success with token, fail without |
| Debug token (dev)     | Run locally            | Token accepted                   |
| Anonymous auth flow   | Test sign-in           | Works with App Check             |

### Phase 6: Deployment

1. **Deploy Cloud Functions first**:

   ```bash
   cd functions && npm run deploy
   ```

2. **Deploy client changes**:

   ```bash
   npm run build && npm run deploy
   ```

3. **Monitor**:
   - Sentry for App Check errors
   - Firebase Console for token usage
   - CloudWatch/GCP logs for 400 errors

---

## Rollback Plan

If App Check causes issues after re-enablement:

1. **Immediate (< 5 min)**: Set `requireAppCheck: false` in all functions,
   redeploy
2. **Client**: Comment out App Check init block
3. **Investigate**: Check Firebase Console, Sentry, server logs

---

## Timeline

| Milestone                | Target      | Dependencies       |
| ------------------------ | ----------- | ------------------ |
| DEDUP-0003 complete      | Week 1      | PR3 merged         |
| DEDUP-0004 complete      | Week 2      | PR4 merged         |
| Firebase issue resolved  | TBD         | Firebase support   |
| Dev testing              | After above | All three complete |
| Production re-enablement | Week 3+     | Testing complete   |

---

## Monitoring After Re-Enablement

### Metrics to Track

- App Check token success rate
- Cloud Function error rates (watch for 400s)
- Rate limiting trigger frequency
- Anonymous session creation rate

### Alerts to Configure

- App Check failure rate > 5%
- Cloud Function 400 errors > baseline
- Unusual traffic patterns

---

## Related Documentation

| Document                                       | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md` | GitHub issue template with checklist |
| `docs/APPCHECK_SETUP.md`                       | Full App Check setup guide           |
| `docs/RECAPTCHA_REMOVAL_GUIDE.md`              | 8-phase implementation plan          |
| `ROADMAP.md`                                   | M1 Security Hardening milestone      |

---

## Decision Record

**Decision:** App Check remains DISABLED until:

1. Firebase platform issue resolved (Firebase support ticket)
2. Compensating controls hardened (DEDUP-0003, DEDUP-0004)
3. Dev testing confirms tokens work

**Risk Mitigation:** App remains secure via:

- Authentication (all endpoints require auth)
- Rate limiting (per-user throttling)
- reCAPTCHA (server-side verification)
- Input validation (Zod schemas)

**Risk Level:** MEDIUM (acceptable with compensating controls)

---

**Document Version:** 1.0 **Next Task:** 4.3.5 - Archive
EIGHT_PHASE_REFACTOR_PLAN.md
