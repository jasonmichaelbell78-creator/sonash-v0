# Testing Plan

**Document Version:** 1.0 **Document Tier:** 2 (Active Reference) **Status:**
Active **Last Updated:** 2026-01-20

---

## Purpose

Comprehensive testing guidance for the SoNash application, including manual
testing checklists, automated test recommendations, and phase-specific testing
for code review fixes.

> **UI Testing:** For automated UI testing with the `/test-suite` skill (smoke
> tests, feature protocols, security & performance checks), see
> [TESTING_USER_MANUAL.md](plans/TESTING_USER_MANUAL.md). That system covers 27
> feature protocols with 195+ test steps across 5 phases.

---

## 📌 Important: Keep This Document Current

> **ROADMAP REQUIREMENT**: When new features are added to this testing plan,
> ROADMAP.md must also be updated to reflect the new testing coverage. This
> ensures the roadmap accurately tracks what features have testing guidance.
>
> **Update Trigger**: Any additions to the "Quick Manual Testing" section or new
> phase testing sections should be cross-referenced in ROADMAP.md under the
> relevant milestone.

---

## Quick Start

**Run automated tests:**

```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run lint                # Lint check
```

**Manual testing:**

1. Start dev server: `npm run dev`
2. Start emulators (optional): `firebase emulators:start`
3. Follow checklists in "Quick Manual Testing" section below

---

## Table of Contents

1. [Quick Manual Testing](#quick-manual-testing)
2. [Prerequisites](#prerequisites)
3. [Phase 1-4 Testing](#phase-1-critical-security-fixes) (Multi-AI Code Review)
4. [Integration Testing](#integration-testing-checklist)
5. [Performance Testing](#performance-testing)
6. [Security Audit](#security-audit-checklist)
7. [Automated Testing](#automated-testing-recommendations)

---

## Quick Manual Testing

### Test Results Summary

**Automated Tests:** ✅ 92/93 passing (98.9%)

- ✅ Security validation tests
- ✅ Date utilities
- ✅ Firebase type guards
- ✅ Logger with PII redaction
- ✅ Rate limiter
- ⚠️ 1 skipped test (requires specific setup)

### Basic App Functionality

#### Homepage/Desktop

- [ ] App loads at `http://localhost:3000`
- [ ] Notebook/desk visual renders correctly
- [ ] No console errors
- [ ] Sobriety chip displays
- [ ] Click on notebook opens it

#### Sign-in Flow

- [ ] Click "Sign in" opens modal
- [ ] Can sign in anonymously
- [ ] After sign-in, user state persists
- [ ] Can sign out

#### Onboarding (New Users)

- [ ] Clean date picker appears
- [ ] Can select fellowship (AA/NA/etc)
- [ ] Can enter nickname
- [ ] Saves to profile

### Core Features Testing

#### Journal Page

- [ ] Floating pen button opens entry creator menu
- [ ] Mood form saves successfully
- [ ] Gratitude form saves successfully
- [ ] Free-write form saves successfully
- [ ] Toast error notifications appear on failures
- [ ] Timeline loads all entries
- [ ] Entry cards show type, date, preview text
- [ ] Ribbon navigation filters by type

#### Today Page (Daily Journal)

- [ ] Opens on click
- [ ] Mood selection works (1-10 scale)
- [ ] Gratitude text area accepts input
- [ ] Night review saves
- [ ] Data persists after page refresh

#### Resources Page (Meeting Finder)

- [ ] Meetings list loads
- [ ] Search box filters results
- [ ] Day filter works (Mon-Sun)
- [ ] Pagination: "Load More" button appears
- [ ] Geolocation: Browser permission prompt works
- [ ] Directions: "Get Directions" button opens Google Maps

### Admin Panel Testing

- [ ] Navigate to `/admin` (must be logged in)
- [ ] **WITHOUT admin claim**: Shows "Not authorized" message
- [ ] **WITH admin claim**: Shows admin dashboard
- [ ] Meetings CRUD operations work
- [ ] Sober Living CRUD operations work
- [ ] Quotes CRUD operations work

### Security & Performance Checks

- [ ] Rate limiting: Save 15 times rapidly, should see error after ~10
- [ ] XSS: Enter `<script>alert('xss')</script>` - should be escaped
- [ ] Privacy: No PII stored in cookies

### Mobile Responsiveness

- [ ] Test on mobile viewport (DevTools → Toggle Device Toolbar)
- [ ] Touch interactions work
- [ ] Text is readable
- [ ] No horizontal scrolling

### Browser Compatibility

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

---

## Overview (Multi-AI Code Review Fixes)

This document also provides testing guidance for all fixes implemented across 4
phases of the multi-AI code review. Tests are organized by phase (Critical →
High → Medium → Low priority).

**Related Commits:**

- Phase 1: `e13f813` - Critical Security Fixes
- Phase 2: `3ca9212` - Scalability & Rate Limiting
- Phase 3: `08f6e9d` - Privacy & Error Handling
- Phase 4: `8ea0cf2` - Documentation & Cleanup

---

## Prerequisites

### Local Development Setup

1. **Firebase Emulators** (Required for safe testing):

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Start emulators (Firestore, Auth, Functions)
firebase emulators:start
```

2. **Environment Variables** - Ensure `.env.local` is configured:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... see README.md for full list
```

3. **Development Server**:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` with emulators running on `localhost:4000`
(Emulator UI).

---

## Phase 1: Critical Security Fixes

### 1.1 Admin Authentication Backdoor Removal

**What Changed:** `app/admin/page.tsx:36-50` Removed "Force allow for demo"
backdoor, restored proper admin claim verification.

**Test Case: Unauthorized Access Prevention**

```
Manual Test:
1. Clear browser cache/cookies
2. Navigate to /admin
3. Attempt to log in with regular (non-admin) user account

Expected Result:
✓ Should see "You are not an admin" message
✓ Should NOT gain access to admin panel
✓ Console should show: "User is not an admin"

Failure Case:
✗ If you see admin panel → SECURITY VULNERABILITY
```

**Test Case: Admin Claim Verification**

```
Manual Test (Firebase Emulator):
1. Open Firebase Emulator UI → Authentication
2. Create test user: test@example.com
3. Set custom claim: { "admin": true }
   (Use Auth emulator UI or Admin SDK)
4. Log in to /admin with test@example.com

Expected Result:
✓ Should successfully authenticate
✓ Should see admin dashboard with tabs
✓ Token should contain admin:true claim

Automated Test (Recommended):
// tests/admin-auth.test.ts
import { getAuth } from 'firebase/auth'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

test('admin page requires admin claim', async () => {
  const testEnv = await initializeTestEnvironment({...})
  const alice = testEnv.authenticatedContext('alice', { admin: true })
  const bob = testEnv.authenticatedContext('bob', { admin: false })

  // Alice should have access, Bob should not
  expect(alice.auth().currentUser.claims.admin).toBe(true)
  expect(bob.auth().currentUser.claims.admin).toBeUndefined()
})
```

### 1.2 Next.js Static Export Removal

**What Changed:** `next.config.mjs` Removed `output: 'export'` to restore SSR
and API routes.

**Test Case: Server-Side Rendering**

```
Manual Test:
1. npm run build
2. npm start (production build)
3. Visit pages and view page source (Ctrl+U)

Expected Result:
✓ HTML should contain fully-rendered content (not just <div id="root"></div>)
✓ No 404 errors in browser console
✓ Firebase SDK should initialize without errors

Build Test:
npm run build
# Should complete without errors
# Should NOT generate /out directory (static export)
```

### 1.3 Firebase Unsafe Type Assertions

**What Changed:** `lib/firebase.ts:116-130` Replaced `as FirebaseApp` casts with
proper `| undefined` types.

**Test Case: Server-Side Safety**

```
Manual Test:
1. Trigger a server-side render (SSR) that uses Firebase
   - Visit any page that calls Firestore in getServerSideProps
2. Check for TypeScript errors during build

Expected Result:
✓ No runtime errors about undefined Firebase instances
✓ TypeScript build succeeds without type errors
✓ Code properly handles undefined cases

Automated Test:
// tests/firebase-init.test.ts
import { db, auth } from '@/lib/firebase'

test('firebase exports handle undefined gracefully', () => {
  // On server-side, these might be undefined
  if (typeof window === 'undefined') {
    expect(db).toBeDefined() // or undefined depending on init
  } else {
    expect(db).toBeDefined()
    expect(auth).toBeDefined()
  }
})
```

### 1.4 Admin Operations via Cloud Functions

**What Changed:**

- Created `functions/src/admin.ts` with 6 Cloud Functions
- Updated `components/admin/meetings-tab.tsx` to use `httpsCallable()`

**Test Case: Server-Side Admin Validation**

````
Manual Test (Meetings CRUD):
1. Log in to /admin as admin user
2. Go to "Meetings" tab
3. Click "Add Meeting"
4. Fill form: Name="Test Meeting", Type="AA", Day="Monday", Time="19:00", Address="123 Test St", Neighborhood="Test Area"
5. Click "Save"
6. Verify meeting appears in list
7. Click edit icon, modify time to "20:00", save
8. Click delete icon, confirm deletion

Expected Result:
✓ All operations should succeed via Cloud Functions
✓ No direct Firestore writes from client
✓ Check browser Network tab → should see calls to:
  - adminSaveMeeting
  - adminDeleteMeeting
  - adminGetMeetings
✓ Firebase Emulator Logs should show function invocations

Failure Test (Non-Admin User):
1. Remove admin claim from user
2. Try to call adminSaveMeeting() directly via console:
   ```javascript
   const { getFunctions, httpsCallable } = require('firebase/functions')
   const functions = getFunctions()
   const save = httpsCallable(functions, 'adminSaveMeeting')
   save({ meeting: {...} })
````

Expected: Should throw "Unauthorized: admin access required"

```

**Test Case: Zod Schema Validation**
```

Manual Test (Invalid Data):

1. Open browser console on /admin
2. Attempt invalid Cloud Function call:

   ```javascript
   const { getFunctions, httpsCallable } = require("firebase/functions");
   const functions = getFunctions();
   const save = httpsCallable(functions, "adminSaveMeeting");

   // Invalid: missing required fields
   await save({ meeting: { name: "Test" } });
   ```

Expected Result: ✓ Should return Zod validation error ✓ Error message should
list missing fields (type, day, time, address, neighborhood) ✓ Meeting should
NOT be saved to Firestore

Automated Test: // tests/admin-functions.test.ts import { MeetingSchema } from
'@/lib/types/schemas'

test('meeting schema rejects invalid data', () => { expect(() =>
MeetingSchema.parse({ name: "Test" })).toThrow() expect(() =>
MeetingSchema.parse({ name: "Valid", type: "AA", day: "Monday", time: "19:00",
address: "123 St", neighborhood: "Area" })).not.toThrow() })

```

---

## Phase 2: High Priority - Scalability & Performance

### 2.1 Meeting Finder Pagination

**What Changed:**
- Added `getAllMeetingsPaginated()` to `lib/db/meetings.ts`
- Implemented infinite scroll in `components/notebook/pages/resources-page.tsx`

**Test Case: Pagination with 50-Item Pages**
```

Manual Test (Requires 100+ meetings):

1. Seed large dataset (script or manual):
   - Go to /admin → Meetings
   - Click "Seed Meetings" button multiple times to create 100+ meetings
2. Navigate to app → Today tab → Meeting Finder
3. Click "View All Meetings"

Expected Result: ✓ Initially loads 50 meetings ✓ "Load More" button appears at
bottom ✓ Clicking "Load More" fetches next 50 ✓ Button shows "Loading..." state
while fetching ✓ Button disappears when all meetings loaded ✓ No duplicate
meetings in list

Performance Check: ✓ Initial load should be fast (<2 seconds) ✓ Scroll should be
smooth (no jank) ✓ Network tab shows pagination queries with startAfter cursor

Failure Cases: ✗ If all meetings load at once → pagination not working ✗ If
duplicates appear → cursor logic broken ✗ If "Load More" never disappears →
hasMore flag broken

```

**Test Case: Cursor Persistence**
```

Manual Test:

1. Load first 50 meetings
2. Click "Load More" to get next 50
3. Open browser DevTools → Application → IndexedDB
4. Check Firebase cache for query cursors

Expected Result: ✓ Firestore queries should use startAfter() with document
snapshot ✓ Each pagination request should fetch exactly 50 items (unless fewer
remaining) ✓ Queries should be sequential (no parallel pagination)

Automated Test: // tests/meetings-pagination.test.ts import { MeetingsService }
from '@/lib/db/meetings'

test('pagination returns 50 items per page', async () => { const result1 = await
MeetingsService.getAllMeetingsPaginated(50)
expect(result1.meetings.length).toBeLessThanOrEqual(50)
expect(result1.hasMore).toBeDefined()

if (result1.hasMore && result1.lastDoc) { const result2 = await
MeetingsService.getAllMeetingsPaginated(50, result1.lastDoc)
expect(result2.meetings.length).toBeLessThanOrEqual(50) // Ensure no duplicates
const ids1 = result1.meetings.map(m => m.id) const ids2 = result2.meetings.map(m
=> m.id) expect(ids1.filter(id => ids2.includes(id))).toEqual([]) } })

```

### 2.2 Firestore-Based Rate Limiting

**What Changed:**
- Created `functions/src/firestore-rate-limiter.ts`
- Replaced `RateLimiterMemory` with `FirestoreRateLimiter` in `functions/src/index.ts`

**Test Case: Rate Limit Enforcement**
```

Manual Test (Rapid Requests):

1. Open /app → Today tab
2. Open browser console
3. Make rapid journal saves:
   ```javascript
   // Trigger 15 rapid saves (limit is 10/minute)
   for (let i = 0; i < 15; i++) {
     await fetch("/api/saveDailyLog", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ mood: "good", checkIn: true }),
     });
   }
   ```

Expected Result: ✓ First 10 requests succeed ✓ Requests 11-15 should fail with
"Rate limit exceeded" error ✓ Error should include wait time in seconds ✓ After
60 seconds, rate limit should reset

Firestore Check:

1. Open Firebase Emulator UI → Firestore
2. Check `/rate_limits` collection
3. Should see document: `{userId}_{operation}`
4. Document should contain:
   - `timestamps`: array of recent request timestamps
   - `lastCleanup`: last cleanup timestamp

Automated Test: // tests/rate-limiter.test.ts import { FirestoreRateLimiter }
from '@/functions/src/firestore-rate-limiter'

test('rate limiter enforces limits', async () => { const limiter = new
FirestoreRateLimiter({ points: 5, duration: 10 }) const userId = 'test-user'

// First 5 should succeed for (let i = 0; i < 5; i++) { await
expect(limiter.consume(userId)).resolves.not.toThrow() }

// 6th should fail await expect(limiter.consume(userId)).rejects.toThrow('Rate
limit exceeded')

// After window expires, should succeed again await new Promise(resolve =>
setTimeout(resolve, 11000)) await
expect(limiter.consume(userId)).resolves.not.toThrow() })

```

**Test Case: Persistence Across Function Instances**
```

Manual Test (Cold Start Simulation):

1. Make 5 rapid requests to saveDailyLog
2. Restart Firebase Functions emulator:
   ```bash
   # Kill emulator, restart
   firebase emulators:start
   ```
3. Immediately make 6 more requests

Expected Result: ✓ Rate limit should persist across restarts ✓ Requests should
fail if total exceeds limit within window ✓ Firestore should retain rate_limits
collection data

Verification:

- Check Firestore UI → rate_limits collection should survive restarts
- Unlike memory-based limiter, limits should NOT reset on cold start

```

**Test Case: Cleanup Scheduled Function**
```

Manual Test (if deployed):

1. Deploy cleanup function:
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions:cleanupOldRateLimits
   ```
2. Check GCP Cloud Scheduler → should see scheduled task for 3 AM daily
3. Manually trigger:
   ```bash
   gcloud scheduler jobs run cleanupOldRateLimits
   ```

Expected Result: ✓ Old rate limit documents (>7 days) should be deleted ✓ Recent
rate limits should be preserved ✓ Function logs should show deletion count

Note: This cleanup function prevents Firestore bloat over time.

```

---

## Phase 3: Medium Priority - Privacy & Error Handling

### 3.1 SHA-256 Privacy Hashing

**What Changed:** `functions/src/security-logger.ts:47-56`
Upgraded from bitwise hash to SHA-256 for GDPR/HIPAA compliance.

**Test Case: Hash Irreversibility**
```

Manual Test:

1. Trigger security event that logs userId:
   - Attempt admin login without admin claim
   - Check Firebase Function logs in emulator UI
2. Find log entry with hashed userId
3. Attempt to reverse hash (should be impossible)

Expected Result: ✓ Logs should show 12-character hash (e.g., "a1b2c3d4e5f6") ✓
Same userId should always produce same hash (consistency) ✓ Different userIds
should produce different hashes ✓ Hash should NOT be reversible to original
userId

Automated Test: // tests/security-logger.test.ts import { hashUserId } from
'@/functions/src/security-logger'

test('sha256 hashing is consistent and irreversible', () => { const userId =
'user123' const hash1 = hashUserId(userId) const hash2 = hashUserId(userId)

expect(hash1).toBe(hash2) // Consistency expect(hash1).toHaveLength(12) //
Truncated expect(hash1).not.toContain('user') // Not reversible

// Different inputs produce different hashes
expect(hashUserId('user456')).not.toBe(hash1) })

```

**Test Case: Collision Resistance**
```

Automated Test: // tests/hash-collisions.test.ts import { hashUserId } from
'@/functions/src/security-logger'

test('sha256 has low collision probability', () => { const hashes = new Set()
const testIds = Array.from({ length: 10000 }, (\_, i) => `user${i}`)

testIds.forEach(id => { const hash = hashUserId(id)
expect(hashes.has(hash)).toBe(false) // No collisions hashes.add(hash) })

expect(hashes.size).toBe(10000) // All unique })

```

### 3.2 Error Handling Improvements

**What Changed:** `lib/db/meetings.ts:86-89, 106-108`
Changed from returning empty arrays to throwing errors with user-friendly messages.

**Test Case: Network Failure Handling**
```

Manual Test (Offline Mode):

1. Open app → Today tab → Meeting Finder
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Select a day or click "View All"

Expected Result: ✓ Should show error message: "Failed to load meetings for
Monday. Please check your connection and try again." ✓ Should NOT show empty
list silently ✓ Should NOT show loading spinner indefinitely ✓ UI should provide
retry option

Recovery Test:

1. Re-enable network
2. Click retry button or refresh
3. Meetings should load successfully

```

**Test Case: Firestore Permission Errors**
```

Manual Test (if testing with production Firestore):

1. Temporarily modify firestore.rules to deny meeting reads:
   ```javascript
   match /meetings/{id} {
     allow read: if false; // Deny all
   }
   ```
2. Deploy rules: firebase deploy --only firestore:rules
3. Try to load meetings in app

Expected Result: ✓ Should catch permission error ✓ Should show user-friendly
error (not raw Firebase error) ✓ Should log detailed error to console for
debugging

Automated Test: // tests/error-handling.test.ts import { MeetingsService } from
'@/lib/db/meetings'

test('meetings service throws on failure', async () => { // Mock Firestore to
throw error jest.spyOn(global, 'getDocs').mockRejectedValue(new Error('Network
error'))

await expect(MeetingsService.getMeetingsByDay('Monday'))
.rejects.toThrow('Failed to load meetings for Monday') })

```

### 3.3 Date Function Consolidation

**What Changed:** `lib/firestore-service.ts`
Removed duplicate `getTodayLocalDateId()`, now uses `getTodayDateId()` from `lib/utils/date-utils.ts`.

**Test Case: Timezone Consistency**
```

Manual Test (Multiple Timezones):

1. Open browser DevTools → Settings → Sensors
2. Change timezone to "Los Angeles (PST)" → refresh app
3. Check Today page → note date ID in network requests
4. Change timezone to "New York (EST)" → refresh app
5. Check Today page → note date ID in network requests

Expected Result: ✓ Date IDs should use LOCAL timezone (not UTC) ✓ PST midnight
should create different date ID than EST midnight ✓ All components should use
same date format: YYYY-MM-DD ✓ Daily log document IDs should match display dates

Verification:

- Open Firestore → daily_logs collection
- Document IDs should be YYYY-MM-DD format
- Should match what user sees in UI

Automated Test: // tests/date-utils.test.ts import { getTodayDateId,
parseDateId, isValidDateId } from '@/lib/utils/date-utils'

test('date ID generation is consistent', () => { const dateId =
getTodayDateId(new Date('2025-12-16T10:30:00'))
expect(dateId).toBe('2025-12-16') expect(isValidDateId(dateId)).toBe(true)

const parsed = parseDateId(dateId) expect(parsed.getFullYear()).toBe(2025)
expect(parsed.getMonth()).toBe(11) // December = 11 (0-indexed)
expect(parsed.getDate()).toBe(16) })

test('all date functions use same format', () => { const date = new
Date('2025-12-16T10:30:00') const id1 = getTodayDateId(date)

// Should NOT have duplicate functions // lib/firestore-service.ts should import
from lib/utils/date-utils.ts expect(id1).toMatch(/^\d{4}-\d{2}-\d{2}$/) })

```

---

## Phase 4: Low Priority - Documentation & Cleanup

### 4.1 README Documentation

**What Changed:** Complete rewrite of Setup & Installation section with Firebase setup instructions.

**Test Case: New Developer Onboarding**
```

Manual Test (Fresh Setup):

1. Clone repo on new machine (or use VM)
2. Follow README.md step-by-step
3. Document any confusing steps or missing info

Expected Result: ✓ Should be able to set up project without external help ✓ All
prerequisites should be listed ✓ Environment variables should be documented ✓
Firebase emulator setup should be clear ✓ Deployment steps should work

Feedback Loop:

- If any steps are confusing, update README
- Add screenshots for complex steps
- Link to Firebase documentation where needed

```

### 4.2 Build Log Cleanup

**What Changed:** Added `*.log` to `.gitignore`

**Test Case: Git Status Clean**
```

Manual Test:

1. Run app: npm run dev
2. Generate logs (errors, Firebase logs, etc.)
3. Run: git status

Expected Result: ✓ Should NOT show .log files as untracked ✓ npm-debug.log,
yarn-error.log should be ignored ✓ Firebase emulator logs should be ignored

Verification: git status --ignored

# Should list .log files under "Ignored files"

```

---

## Integration Testing Checklist

### End-to-End Admin Workflow
```

1. Admin Login □ Log in to /admin with admin claim □ Verify all tabs load:
   Meetings, Sober Living, Quotes, Users

2. CRUD Operations □ Create new meeting via Cloud Function □ Edit meeting
   details □ Delete meeting □ Verify changes persist after page refresh

3. Rate Limiting □ Make 10+ rapid saves (should see rate limit error) □ Wait 60
   seconds, verify rate limit resets

4. Pagination □ Load 100+ meetings □ Verify "Load More" button works □ Verify
   all meetings load without duplicates

```

### End-to-End User Workflow
```

1. Anonymous Authentication □ Open app as new user □ Verify anonymous auth
   succeeds □ Check Firestore → users collection for new user

2. Daily Log □ Write journal entry on Today page □ Save entry (should succeed
   under rate limit) □ Refresh page, verify entry persists

3. Meeting Finder □ Browse meetings by day □ Switch to "View All" mode □ Load
   multiple pages via pagination □ Verify smooth scrolling and loading states

```

---

## Performance Testing

### Meeting Finder Load Time
```

Test Setup:

1. Seed 500+ meetings in Firestore
2. Open Chrome DevTools → Performance tab
3. Record page load

Expected Metrics: ✓ First Contentful Paint (FCP): <2s ✓ Largest Contentful Paint
(LCP): <3s ✓ Time to Interactive (TTI): <4s ✓ Pagination query: <500ms

Lighthouse Audit: npm run build && npm start

# Open Chrome DevTools → Lighthouse

# Run audit on /app/today

Target Scores:

- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

```

### Rate Limiter Performance
```

Load Test (using artillery.io or similar):

1. Install artillery: npm install -g artillery
2. Create test script:
   ```yaml
   config:
     target: "http://localhost:3000"
     phases:
       - duration: 60
         arrivalRate: 10
   scenarios:
     - name: "Save Daily Log"
       requests:
         - post:
             url: "/api/saveDailyLog"
             json:
               mood: "good"
               checkIn: true
   ```
3. Run: artillery run load-test.yml

Expected Result: ✓ Rate limiter should correctly throttle requests ✓ Firestore
writes should be atomic (no race conditions) ✓ Error responses should be
consistent

````

---

## Security Audit Checklist

### Admin Security
- [ ] Admin panel requires valid admin claim
- [ ] No hardcoded credentials or demo backdoors
- [ ] Cloud Functions verify admin claim server-side
- [ ] Zod validation rejects invalid input

### Firebase Security
- [ ] Firestore rules deny unauthorized access
- [ ] Rate limiting prevents abuse
- [ ] App Check enabled (reCAPTCHA Enterprise)
- [ ] User IDs are hashed in logs (SHA-256)

### Client-Side Security
- [ ] No sensitive data in localStorage
- [ ] Auth tokens properly refreshed
- [ ] HTTPS enforced in production
- [ ] Environment variables not exposed

---

## Automated Testing Recommendations

### Unit Tests (Vitest or Jest)
```typescript
// tests/unit/date-utils.test.ts
import { getTodayDateId, parseDateId } from '@/lib/utils/date-utils'

describe('Date Utilities', () => {
  test('getTodayDateId formats correctly', () => {
    const date = new Date('2025-12-16T10:30:00')
    expect(getTodayDateId(date)).toBe('2025-12-16')
  })
})

// tests/unit/meetings.test.ts
import { MeetingsService } from '@/lib/db/meetings'

describe('Meetings Service', () => {
  test('pagination returns correct page size', async () => {
    const result = await MeetingsService.getAllMeetingsPaginated(50)
    expect(result.meetings.length).toBeLessThanOrEqual(50)
  })
})
````

### Integration Tests (Cypress or Playwright)

```typescript
// tests/e2e/admin-auth.spec.ts
import { test, expect } from "@playwright/test";

test("admin login requires admin claim", async ({ page }) => {
  await page.goto("http://localhost:3000/admin");

  // Should redirect to login or show "not admin" message
  await expect(page.locator("text=Admin Panel")).not.toBeVisible();
});

// tests/e2e/meeting-finder.spec.ts
test("pagination loads more meetings", async ({ page }) => {
  await page.goto("http://localhost:3000/app/today");
  await page.click("text=Meeting Finder");
  await page.click("text=View All");

  const initialCount = await page
    .locator('[data-testid="meeting-item"]')
    .count();
  await page.click("text=Load More");
  await page.waitForLoadState("networkidle");

  const newCount = await page.locator('[data-testid="meeting-item"]').count();
  expect(newCount).toBeGreaterThan(initialCount);
});
```

---

## Regression Testing

Before deploying to production, verify:

### Critical Paths

- [ ] User registration/login flow works
- [ ] Daily log saves and persists
- [ ] Meeting finder loads and filters correctly
- [ ] Admin panel CRUD operations succeed
- [ ] Rate limiting enforces limits
- [ ] Pagination loads all meetings

### Edge Cases

- [ ] Offline mode shows proper errors
- [ ] Rate limit reset after window expires
- [ ] Timezone changes don't break date IDs
- [ ] Large datasets (500+ meetings) perform well
- [ ] Empty states display correctly

### Browser Compatibility

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Lighthouse audit scores >90
- [ ] No console errors or warnings
- [ ] Firebase security rules deployed
- [ ] Cloud Functions deployed and tested

### Post-Deployment Monitoring

- [ ] Monitor GCP Cloud Logging for errors
- [ ] Check Sentry for client-side errors (if enabled)
- [ ] Verify rate limiting in production logs
- [ ] Monitor Firestore read/write quotas
- [ ] Test admin panel on production

### Rollback Plan

If issues occur:

```bash
# Revert to previous version
git revert HEAD
npm run build
# Deploy previous Cloud Functions
firebase deploy --only functions
```

---

## Notes for Continuous Testing

1. **Firebase Emulator**: Always use emulators for local testing to avoid
   production data contamination
2. **Test Data Cleanup**: Clear emulator data between test runs:
   `firebase emulators:start --clear`
3. **Rate Limit Testing**: Reset rate limits manually in Firestore emulator UI
   if needed
4. **Pagination Testing**: Seed large datasets (100+ items) to properly test
   pagination
5. **Security Testing**: Never disable security checks "temporarily" - always
   test with full security enabled

---

## Success Criteria

All phases are considered successfully tested when:

✅ **Phase 1**: Admin panel requires proper authentication, no backdoors, Cloud
Functions enforce security ✅ **Phase 2**: Pagination handles 500+ meetings
smoothly, rate limiting prevents abuse ✅ **Phase 3**: Logs use SHA-256 hashing,
errors provide user-friendly messages, dates are consistent ✅ **Phase 4**:
README enables new developer setup, logs are ignored in git

---

## Contact & Support

For questions about this testing plan:

- Review related commits: `e13f813`, `3ca9212`, `08f6e9d`, `8ea0cf2`
- Check Firebase Emulator logs for detailed error traces
- Consult Firebase documentation:
  https://firebase.google.com/docs/emulator-suite

---

## AI Instructions

When helping with testing:

1. Use `/test-suite` skill (recommended) or `npm test` for local verification to
   check automated test status
2. For specific issues, check the relevant phase section (1-4)
3. Rate limiter issues: Check Phase 2
4. Security issues: Check Phase 1 and Security Audit section
5. Always recommend emulator testing before production deployment

---

## Version History

| Version | Date       | Changes                                                                  |
| ------- | ---------- | ------------------------------------------------------------------------ |
| 1.2     | 2026-01-03 | Merged TESTING_CHECKLIST.md; added Tier 2 sections, Quick Manual Testing |
| 1.1     | 2026-01-01 | Added Phase 3-4 testing guidance                                         |
| 1.0     | 2025-12-31 | Initial creation with Phase 1-2 testing                                  |
