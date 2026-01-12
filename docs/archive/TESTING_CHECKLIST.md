# SoNash Testing Checklist

**Last Updated:** December 18, 2025

## Test Results Summary

**Automated Tests:** ✅ 89/91 passing (97.8%)

- ✅ Security validation tests
- ✅ Date utilities
- ✅ Firebase type guards
- ✅ Logger with PII redaction
- ✅ Rate limiter
- ⚠️ 2 Firebase initialization failures (require emulator setup)

**Recent Improvements:**

- ✅ Debug console.logs removed from firestore-service.ts (commit 251c7c5)
- ✅ Toast error notifications added to 6 journal components (commit 39818ac)
- ✅ Firestore composite index verified (isSoftDeleted + createdAt)

---

## Quick Start: Manual Testing

### 1. Basic App Functionality

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

---

## 2. Core Features Testing

### Journal Page (New System - Dec 2025)

**Entry Creation:**

- [x] Floating pen button opens entry creator menu
- [x] Mood form saves successfully
- [x] Gratitude form saves successfully
- [x] Inventory form saves (simple 4-question version)
- [x] Free-write form saves successfully
- [x] Toast error notifications appear on failures (not silent console errors)

**Timeline Display:**

- [x] Timeline loads all entries (no pagination)
- [x] Entries grouped by "Today", "Yesterday", "Older"
- [x] Entry cards show type, date, preview text
- [x] Click entry card opens detail view

**Ribbon Navigation:**

- [x] Ribbon shows all entry types
- [x] Clicking ribbon filters timeline by type
- [x] "All" button shows all entries

**Lock Screen:**

- [x] Anonymous users see lock screen
- [x] "Unlock" button triggers anonymous auth
- [x] After auth, journal becomes accessible

**Known Issues:**

- ⚠️ Simple inventory form needs replacement with full NightReviewCard (4 steps)
- ⚠️ Deep Search page not yet built (mood/craving separation)
- ⚠️ Recovery Notepad not integrated with journal system

### Today Page (Daily Journal)

- [ ] Opens on click
- [ ] Mood selection works (1-10 scale)
- [ ] Gratitude text area accepts input
- [ ] Spot-check questions render
- [ ] Night review saves
- [ ] Data persists after page refresh

### Resources Page (Meeting Finder)

- [ ] Meetings list loads
- [ ] Search box filters results
- [ ] Day filter works (Mon-Sun)
- [ ] Type filter works (Open/Closed/etc)
- [ ] Pagination: "Load More" button appears
- [ ] Pagination: Loads 50 items at a time
- [ ] **Geolocation**: "Nearest" sort option appears
- [ ] **Geolocation**: Browser permission prompt works
- [ ] **Geolocation**: Distance shown on cards (if location granted)
- [ ] **Directions**: "Get Directions" button opens Google Maps

### Growth Page

- [ ] Step 4 inventory tools accessible
- [ ] Gratitude card works
- [ ] Night review form saves
- [ ] Spot check saves

### History Page

- [ ] Past journal entries load
- [ ] Can click to view old entry
- [ ] Entries sorted by date (newest first)

---

## 3. Admin Panel Testing

### Access Control

- [ ] Navigate to `/admin` (must be logged in)
- [ ] **WITHOUT admin claim**: Shows "Not authorized" message
- [ ] **WITH admin claim**: Shows admin dashboard

### Meetings Tab (Cloud Functions CRUD)

- [ ] Can view all meetings
- [ ] Can add new meeting
- [ ] Can edit existing meeting
- [ ] Can delete meeting
- [ ] Changes reflect in Meeting Finder immediately

### Sober Living Tab

- [ ] Can view sober living facilities
- [ ] Can add new facility
- [ ] Can edit facility
- [ ] Can delete facility

### Quotes Tab

- [ ] Can view daily quotes
- [ ] Can add new quote
- [ ] Can edit quote
- [ ] Can delete quote

---

## 4. Security & Performance

### Rate Limiting

- [ ] Open browser DevTools → Network tab
- [ ] Save journal entry 15 times rapidly
- [ ] Should see rate limit error after ~10 attempts
- [ ] Wait 60 seconds, can save again

### XSS Protection

- [ ] Try entering `<script>alert('xss')</script>` in text fields
- [ ] Text should be escaped/sanitized (no alert popup)

### Privacy

- [ ] Check browser DevTools → Application → Cookies
- [ ] No PII (email, name) stored in cookies
- [ ] User IDs should be Firebase anonymous IDs

---

## 5. Widgets (New Features)

### Quote Card Widget

- [ ] Displays daily quote on Today page
- [ ] Quote changes daily
- [ ] Card is compact and styled correctly

### Meeting Countdown Widget

- [ ] Shows next upcoming meeting
- [ ] Countdown timer updates
- [ ] Pulls from real Firestore data
- [ ] Shows correct meeting details

---

## 6. Mobile Responsiveness

- [ ] Test on mobile viewport (DevTools → Toggle Device Toolbar)
- [ ] Notebook opens/closes smoothly
- [ ] Touch interactions work
- [ ] Text is readable (not too small)
- [ ] No horizontal scrolling

---

## 7. Error Handling

### Network Errors

- [ ] Disconnect internet
- [ ] Try to save journal
- [ ] Should see user-friendly error message
- [ ] Reconnect, can save successfully

### Invalid Data

- [ ] Try to save empty journal entry
- [ ] Should validate or show helpful message

---

## 8. Browser Compatibility

Test in:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

---

## Known Issues (Skip These)

1. **Auth Provider Test Failure** - Requires Firebase emulator, safe to skip
2. **Daily Log Save Test** - Requires Firebase emulator, safe to skip
3. **Node.js Engine Warning** - Package.json requires Node 22, we have 24 (newer
   is fine)

---

## Firebase Emulator Testing (Optional - Advanced)

If you want to test Cloud Functions locally:

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start dev server
npm run dev

# Terminal 3: Run tests against emulator
npm test
```

**Emulator Features:**

- Local Firestore database (no production data affected)
- Local Auth (create test users)
- Local Functions (test admin operations)
- Emulator UI: http://localhost:4000

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All manual tests above pass
- [ ] No console errors in production build
- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] Cloud Functions deployed
- [ ] SSL certificate valid
- [ ] Domain DNS configured

---

## Testing Status

**Last Updated:** December 17, 2025  
**Tested By:** ********\_********  
**Environment:** Development / Staging / Production  
**Overall Status:** ⚠️ Needs Testing

### Test Coverage

- Automated: 97.8% (89/91 tests passing)
- Manual: 0% (awaiting first pass)
- E2E: Not yet implemented

---

## Notes

Add any issues or observations here:

-
-
-
