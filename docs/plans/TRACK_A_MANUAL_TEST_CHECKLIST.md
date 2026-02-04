# Track A Manual Testing Checklist

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Status:** Active
**Last Updated:** 2026-02-04
<!-- prettier-ignore-end -->

**Time Required:** ~30-45 minutes

**Prerequisites:** Deployed app URL and admin account credentials

---

## Before You Start

1. Open your browser
2. Go to your deployed app URL (e.g., `https://your-app.web.app`)
3. Sign in with your **admin account**
4. Navigate to `/admin` (e.g., `https://your-app.web.app/admin`)
5. You should see the Admin Panel with tabs across the top

**Your App URL:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ (fill this in)

---

## Test 1: Analytics Tab (A19)

### Steps:

1. [ ] Click the **"Analytics"** tab in the admin panel
2. [ ] Look at the top section - you should see 3-4 cards showing:
   - **DAU** (Daily Active Users) - a number
   - **WAU** (Weekly Active Users) - a number
   - **MAU** (Monthly Active Users) - a number
3. [ ] Each card should have a small trend arrow (up, down, or sideways)
4. [ ] Scroll down - look for a **"Feature Usage"** section
5. [ ] Click the **refresh button** (circular arrow icon) in the top right
6. [ ] The data should reload (you may see a brief loading spinner)
7. [ ] Resize your browser window to be narrow (like a phone) - the cards should
       stack vertically

### What to Report:

- [ ] **PASS** - All metrics load, refresh works, layout adjusts on resize
- [ ] **FAIL** - Note what's broken: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Test 2: Jobs Tab with History (A20)

### Steps:

1. [ ] Click the **"Jobs"** tab in the admin panel
2. [ ] You should see a list of job cards (cleanup sessions, health checks,
       etc.)
3. [ ] Find any job card and click the **expand button** (down arrow or ">"
       icon)
4. [ ] A history panel should slide open showing past runs
5. [ ] Look for badges that say either:
   - **"Manual"** (with a person icon) - jobs you triggered
   - **"Scheduled"** (with a clock icon) - automatic jobs
6. [ ] Look for status badges:
   - **Green "Success"** badges
   - **Red "Failed"** badges (if any)
7. [ ] If there's a **"Download"** or **"Export"** button, click it
8. [ ] A JSON file should download to your computer

### What to Report:

- [ ] **PASS** - Jobs list loads, history expands, badges display correctly
- [ ] **FAIL** - Note what's broken: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Test 3: Errors Tab with User Correlation (A21)

### Steps:

1. [ ] Click the **"Errors"** tab in the admin panel
2. [ ] Look for a section called **"User Correlation"** or similar
3. [ ] If there are errors listed, look for a **user hash** - this looks like:
   - A short code like `a1b2c3d4e5f6` (12 characters)
   - It should be clickable (underlined or button-style)
4. [ ] Click on a user hash
5. [ ] A **modal (popup window)** should appear showing:
   - User activity timeline
   - List of actions that user took
6. [ ] Click the **X** or **Close** button to close the modal
7. [ ] If there's a **"View Full Profile"** link, click it
8. [ ] You should be taken to the Users tab with that user selected

### What to Report:

- [ ] **PASS** - User hashes display, modal opens with activity, navigation
      works
- [ ] **FAIL** - Note what's broken: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- [ ] **N/A** - No errors in system to test with

---

## Test 4: Logs Tab Query Builder (A22)

### Steps:

1. [ ] Click the **"Logs"** tab in the admin panel
2. [ ] Find the **search box** at the top
3. [ ] Type `admin` in the search box
4. [ ] The logs list should filter to show only logs containing "admin"
5. [ ] Find the **type filter dropdown** (might say "All Types" or similar)
6. [ ] Click it and select a category like **"AUTH"** or **"SECURITY"**
7. [ ] The list should filter to show only that type
8. [ ] Clear the search and filters
9. [ ] Find the **"Export"** or **"Download"** button
10. [ ] Click it - a JSON file should download
11. [ ] Open the downloaded file in a text editor to verify it has log data

### What to Report:

- [ ] **PASS** - Search filters work, type dropdown works, export downloads
- [ ] **FAIL** - Note what's broken: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Test 5: Security Checks

### Steps:

1. [ ] **Open browser Developer Tools** (Right-click > Inspect, or press F12)
2. [ ] Click the **"Network"** tab in Developer Tools
3. [ ] Refresh the admin page
4. [ ] Look through the network requests - search for any that contain:
   - Full email addresses
   - Full user IDs (long strings like `abc123def456...`)
   - Real names
5. [ ] **You should NOT see any of these** - only hashed/anonymized data

### Open a New Browser Tab (Incognito/Private):

6. [ ] Open a new **incognito/private** browser window
7. [ ] Go to your app's `/admin` page WITHOUT logging in
8. [ ] You should see a **"Not authorized"** or login prompt
9. [ ] You should NOT be able to see the admin panel

### What to Report:

- [ ] **PASS** - No PII visible in network, unauthorized access blocked
- [ ] **FAIL** - Note what's broken: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Test 6: Empty States

### Steps (if you have a fresh/test environment):

1. [ ] If Analytics has no data, check that it shows a friendly message (not an
       error)
2. [ ] If a Job has no history, expanding it should say "No runs recorded" or
       similar
3. [ ] If Logs search finds nothing, it should say "No results" not crash

### What to Report:

- [ ] **PASS** - Empty states show friendly messages
- [ ] **FAIL** - Shows error or crashes: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- [ ] **N/A** - Could not test (have existing data)

---

## Summary

| Test                  | Status                        | Notes |
| --------------------- | ----------------------------- | ----- |
| Test 1: Analytics Tab | [ ] PASS / [ ] FAIL           |       |
| Test 2: Jobs Tab      | [ ] PASS / [ ] FAIL           |       |
| Test 3: Errors Tab    | [ ] PASS / [ ] FAIL           |       |
| Test 4: Logs Tab      | [ ] PASS / [ ] FAIL           |       |
| Test 5: Security      | [ ] PASS / [ ] FAIL           |       |
| Test 6: Empty States  | [ ] PASS / [ ] FAIL / [ ] N/A |       |

**Overall Result:** [ ] ALL PASS / [ ] SOME FAILURES

**Tester Name:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Date Tested:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Browser Used:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## If Something Fails

1. Take a screenshot of the issue
2. Note the exact steps that caused the problem
3. Check the browser console (F12 > Console tab) for red error messages
4. Report the issue with:
   - What you expected to happen
   - What actually happened
   - Any error messages you saw
