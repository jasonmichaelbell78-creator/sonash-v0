---
title: "Re-enable Firebase App Check after platform issue is resolved"
labels: enhancement, security, blocked
---

## Context

App Check was disabled across both client and server due to a Firebase platform issue where the App Check API returns 400 errors for both ReCaptcha Enterprise tokens AND whitelisted debug tokens.

**Firebase Support Ticket:** Filed 2025-12-29 (ticket number TBD - update when received)

**Current Status:**
- ✅ Client-side: App Check initialization disabled in `lib/firebase.ts`
- ✅ Server-side: App Check enforcement disabled in all 5 Cloud Functions (`functions/src/index.ts`)
- ✅ App remains secure via: Authentication + Rate Limiting + Input Validation + Authorization

## Re-Enablement Checklist

### Prerequisites
- [ ] Firebase support resolves the App Check API platform issue
- [ ] Confirm both ReCaptcha Enterprise AND debug tokens work
- [ ] Verify in development environment first

### Code Changes Required

#### 1. Client-Side (`lib/firebase.ts`)
- [ ] Uncomment App Check imports (line 4-6)
- [ ] Uncomment `_appCheck` variable declaration (line 28-29)
- [ ] Uncomment App Check initialization block (lines 45-78)
- [ ] Update JSDoc to remove "disabled" notes
- [ ] Update `getFirebase()` return to include `_appCheck`

#### 2. Server-Side (`functions/src/index.ts`)
- [ ] Re-enable App Check in `saveDailyLog` (line 77: set `requireAppCheck: true`)
- [ ] Re-enable App Check in `saveJournalEntry` (line 168: set `requireAppCheck: true`)
- [ ] Re-enable App Check in `softDeleteJournalEntry` (line 262: set `requireAppCheck: true`)
- [ ] Re-enable App Check in `saveInventoryEntry` (line 359: set `requireAppCheck: true`)
- [ ] Uncomment App Check verification in `migrateAnonymousUserData` (lines 486-490)
- [ ] Update function documentation to remove "DISABLED" notes

#### 3. Environment Variables
- [ ] Verify `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` in `.env.production`
- [ ] Remove `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true` if still present
- [ ] Update debug tokens in Firebase Console for development

#### 4. Testing
- [ ] Test ReCaptcha Enterprise token exchange in production
- [ ] Test debug token exchange in development
- [ ] Test anonymous authentication flow
- [ ] Test all Cloud Function calls (save, delete, migrate)
- [ ] Monitor for 400 errors in console

#### 5. Deployment
- [ ] Deploy client changes (Next.js build)
- [ ] Deploy server changes (Cloud Functions)
- [ ] Monitor Sentry for App Check errors
- [ ] Monitor Firebase Console for usage

## Related Documentation

- **Re-implementation Plan:** `docs/recaptcha_removal_guide.md` (8-phase plan)
- **Roadmap:** `ROADMAP.md` (M1 - Security Hardening, line 222)
- **Migration Analysis:** `SUPABASE_MIGRATION_ANALYSIS.md` (Section on App Check)

## Timeline

**Target:** After M1-M3 stabilization (per ROADMAP.md)
**Blocker:** Firebase support ticket resolution

## Notes

- Do NOT re-enable until Firebase confirms the platform issue is resolved
- Test thoroughly in development before enabling in production
- Consider gradual rollout with feature flag if available
- Monitor error rates closely after re-enablement

---

**Commits that disabled App Check:**
- Client: `2aa00cc` (`fix: Disable client-side App Check initialization`)
- Server: `d02a216` (`fix: Disable App Check in migrateAnonymousUserData for consistency`)
- Earlier: `cf9ec12` (`fix: Disable App Check - Firebase platform issue (support ticket filed)`)
- Docs: `9aa042e` (`docs: Clean up unused App Check imports and update documentation`)
