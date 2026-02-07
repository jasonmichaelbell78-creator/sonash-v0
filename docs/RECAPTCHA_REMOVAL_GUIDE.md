# reCAPTCHA & App Check - Complete Removal and Fresh Setup Guide

**Document Version:** 1.0 **Document Tier:** 2 (Active Reference) **Status:**
Deferred - App Check blocking critical functionality **Target:** Future
implementation after M1-M3 stabilization **Last Updated:** 2026-01-15

---

## Purpose

Complete removal and fresh implementation guide for Firebase App Check with
reCAPTCHA Enterprise. Use this when App Check is blocking legitimate users or
when setting up from scratch.

**Related:** [APPCHECK_SETUP.md](./APPCHECK_SETUP.md) - Standard setup guide

---

## Quick Start

**To remove App Check:**

1. Remove App Check imports from `lib/firebase.ts`
2. Remove `enforceAppCheck` from Cloud Functions
3. Disable App Check in Firebase Console
4. Delete reCAPTCHA keys in Google Cloud Console

**To re-implement App Check:**

1. Create new reCAPTCHA Enterprise key
2. Register in Firebase App Check (Monitor mode first)
3. Update environment variables and code
4. Test for 1 week before enforcing

---

## Current Situation

App Check with reCAPTCHA Enterprise is causing persistent authentication
failures that block users from accessing the application. This guide provides
complete removal instructions and a detailed plan for fresh implementation when
ready.

---

## Part 1: Complete Removal

> [!CAUTION] This will completely disable App Check bot protection. Only do this
> if App Check is blocking legitimate users.

### Step 1: Remove from Local Codebase

#### 1.1 Update Firebase Configuration File

**File:** [`lib/firebase.ts`](../lib/firebase.ts)

1. Remove the import for App Check:

   ```diff
   - import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"
   ```

2. Delete the entire `initializeAppCheckIfConfigured` function (lines 27-65)

3. Remove the App Check initialization call from `initializeFirebase`:

   ```diff
   const initializeFirebase = () => {
     // ... existing code ...
     _app = getApps().length === 0 ? initializeApp(config) : getApps()[0]

   -  // Initialize App Check
   -  initializeAppCheckIfConfigured(_app)

     _auth = getAuth(_app)
     _db = getFirestore(_app)
   }
   ```

#### 1.2 Remove Environment Variables

**File:** `.env.local` (in project root)

Delete these lines:

```diff
- # App Check Configuration - SoNash Production v2
- NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lcb_DMsAAAAANmWHkDXquqVRh2ZE1IhXZRrvkRA
```

**File:** `.env.production` (if exists)

Delete the same lines if present.

#### 1.3 Update Cloud Functions

**Directory:** `functions/src`

Find all Cloud Functions and remove App Check enforcement:

1. Search for `consumeAppCheckToken`:

   ```bash
   grep -r "consumeAppCheckToken" functions/src
   ```

2. For each function, change:

   ```diff
   export const myFunction = onCall(
     {
   -    enforceAppCheck: true,
   -    consumeAppCheckToken: true,
     },
     async (request) => {
       // function code...
     }
   );
   ```

3. Or remove the entire options object if App Check was the only configuration:

   ```diff
   - export const myFunction = onCall(
   -   { enforceAppCheck: true, consumeAppCheckToken: true },
   -   async (request) => { ... }
   - );
   + export const myFunction = onCall(async (request) => { ... });
   ```

#### 1.4 Uninstall App Check Package (Optional)

```bash
npm uninstall firebase/app-check
```

**Note:** This package is part of the main `firebase` package, so this may not
be necessary.

---

### Step 2: Remove from Firebase Console

#### 2.1 Disable App Check in Firebase Console

1. Go to
   [Firebase Console - App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Click on "SoNash Web" (your web app)
3. Click the three-dot menu (⋮) next to "reCAPTCHA Enterprise"
4. Select **"Unregister"** or **"Remove"**
5. Confirm the removal

> [!WARNING] This will immediately stop requiring App Check tokens for all
> Firebase services.

---

### Step 3: Remove from Google Cloud Console

#### 3.1 Delete reCAPTCHA Enterprise Keys

1. Go to
   [Google Cloud Console - reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha?project=sonash-app)
2. Find the key `SoNash Production v2` (ID:
   `6Lcb_DMsAAAAANmWHkDXquqVRh2ZE1IhXZRrvkRA`)
3. Click the three-dot menu (⋮) → **Delete**
4. Confirm deletion
5. Repeat for any other reCAPTCHA keys you want to remove

#### 3.2 Remove Secret from Firebase Functions

```bash
firebase functions:secrets:destroy RECAPTCHA_SECRET_KEY
```

When prompted, confirm the deletion.

#### 3.3 Disable reCAPTCHA Enterprise API (Optional)

> [!NOTE] Only do this if you're absolutely sure you won't use it again.

1. Go to
   [Google Cloud APIs](https://console.cloud.google.com/apis/dashboard?project=sonash-app)
2. Search for "reCAPTCHA Enterprise API"
3. Click the API name
4. Click **"Disable API"**
5. Confirm

---

### Step 4: Clean Up and Test Locally

#### 4.1 Rebuild the Application

```bash
npm run build
```

Check for any build errors related to App Check.

#### 4.2 Test Locally

```bash
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000)
2. Test authentication (sign up, sign in, sign out)
3. Test Cloud Functions (create journal entry, etc.)
4. Check browser console for errors

---

### Step 5: Deploy to Production

#### 5.1 Commit and Push Changes

```bash
git add lib/firebase.ts .env.local functions/src
git commit -m "Remove App Check and reCAPTCHA (blocking users)"
git push origin main
```

#### 5.2 Deploy to Firebase

```bash
npm run build
firebase deploy
```

This will deploy:

- Updated frontend (without App Check initialization)
- Updated Cloud Functions (without App Check enforcement)
- Updated Firestore rules (if any changes)

#### 5.3 Verify Production

1. Visit [https://sonash-app.web.app](https://sonash-app.web.app)
2. Test authentication in multiple browsers
3. Test Cloud Functions
4. Monitor
   [Firebase Console - Functions Logs](https://console.firebase.google.com/project/sonash-app/functions/logs)
5. Check for any errors

---

### Step 6: Update Documentation

Update these files to reflect App Check removal:

#### 6.1 README.md

```diff
- **Security**: reCAPTCHA v3, App Check, Firestore Rules, Rate Limiting
+ **Security**: Firestore Rules, Rate Limiting
```

#### 6.2 ROADMAP.md

```diff
- ✅ Firebase App Check with reCAPTCHA v3
+ ⏸️ Firebase App Check with reCAPTCHA (deferred - see recaptcha_removal_guide.md)
```

#### 6.3 docs/SECURITY.md

Add a note that App Check is temporarily disabled and link to this guide.

---

## Part 2: Fresh Implementation Guide (Future)

> [!IMPORTANT] Only proceed with this when:
>
> - M1-M3 milestones are complete and stable
> - You have time to properly debug issues
> - You're prepared for potential downtime

---

### Overview

This is a **complete from-scratch** implementation that avoids all previous
configuration issues.

**Estimated Time:** 4-6 hours  
**Complexity:** High  
**Risk:** Medium (can affect all users)

---

### Phase 1: Create New reCAPTCHA Keys

#### Step 1.1: Go to reCAPTCHA Enterprise Console

1. Visit
   [Google Cloud Console - reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha?project=sonash-app)
2. Click **"Create Key"**

#### Step 1.2: Configure the Key

**Settings:**

- **Display name:** `SoNash Production v3`
- **Platform type:** `Website`
- **Domains:** (Add all three)
  - `sonash-app.web.app`
  - `sonash-app.firebaseapp.com`
  - `localhost` (for local testing)

**reCAPTCHA Type:**

- Select **"Score-based (reCAPTCHA v3)"**
  - This is invisible and doesn't require user interaction
  - Provides a risk score (0.0- 1.0)
  - Better user experience than v2 checkbox

**Security Settings:**

- **Enable WAF (Web Application Firewall):** Optional
- **Challenge Security Preference:** Standard

#### Step 1.3: Save and Copy Keys

After clicking **"Create"**:

1. **Copy the Site Key** (starts with `6L...`)
   - Save to a secure note: "reCAPTCHA Site Key v3"

2. **Copy the API Key / Secret Key**
   - Save to a secure note: "reCAPTCHA Secret Key v3"

> [!CAUTION] Never commit the secret key to Git. It must only be stored in
> Firebase Functions secrets.

---

### Phase 2: Enable reCAPTCHA Enterprise API

#### Step 2.1: Enable the API

1. Go to
   [Google Cloud APIs Library](https://console.cloud.google.com/apis/library/recaptchaenterprise.googleapis.com?project=sonash-app)
2. Click **"Enable"**
3. Wait for activation (usually instant)

#### Step 2.2: Verify API is Active

1. Go to
   [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard?project=sonash-app)
2. Search for "reCAPTCHA Enterprise API"
3. Status should show **"Enabled"**

---

### Phase 3: Configure Firebase App Check

#### Step 3.1: Register App Check in Firebase Console

1. Go to
   [Firebase Console - App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Click on your web app: **"SoNash Web"**
3. Select **"reCAPTCHA Enterprise"** as the provider
4. Paste your **Site Key** (from Phase 1, Step 1.3)
5. Click **"Save"**

#### Step 3.2: Set Enforcement Mode

> [!WARNING] Start with "Monitor Mode" to avoid breaking production.

**For each Firebase service:**

- **Firestore**: Set to **"Monitor"** (logs violations, doesn't block)
- **Cloud Functions**: Set to **"Monitor"**
- **Cloud Storage**: Set to **"Monitor"** (if used)

**After 1 week of monitoring:**

- Review logs for false positives
- If clean, switch to **"Enforce"** mode

---

### Phase 4: Update Local Environment

#### Step 4.1: Add Environment Variable

**File:** `.env.local`

```bash
# App Check Configuration - v3 Fresh Implementation
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6L[your-new-site-key-here]
```

**File:** `.env.production` (create if doesn't exist)

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6L[your-new-site-key-here]
```

#### Step 4.2: Add Debug Token for Local Development

1. Run the app locally:

   ```bash
   npm run dev
   ```

2. Open browser console
3. Firebase will log a debug token: `App Check debug token: xxxxxxxx`
4. Copy this token

5. Add to Firebase Console:
   - Go to
     [Firebase Console - App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
   - Click **"Manage debug tokens"**
   - Click **"Add debug token"**
   - Paste the token
   - Add description: "Local development - [Your Name]"
   - Click **"Save"**

6. Add to `.env.local`:

   ```bash
   NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

---

### Phase 5: Update Code

#### Step 5.1: Update Firebase Initialization

**File:** [`lib/firebase.ts`](../lib/firebase.ts)

```typescript
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ... existing validateEnv and getFirebaseConfig ...

const initializeAppCheckIfConfigured = (app: FirebaseApp) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn(
      "⚠️ App Check not configured: Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY. " +
        "Requests to protected Firebase resources may fail in production."
    );
    return;
  }

  try {
    // Development: Enable debug token
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN
    ) {
      // @ts-expect-error - Firebase global for debug mode
      self.FIREBASE_APPCHECK_DEBUG_TOKEN =
        process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
      console.log("✅ App Check debug token enabled (development only)");
    }

    // Initialize App Check with reCAPTCHA v3
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });

    console.log("✅ App Check initialized successfully");
  } catch (error) {
    console.error("❌ App Check initialization failed:", error);
    // Non-fatal: App will work but without bot protection
  }
};

// ... rest of file unchanged ...
```

**Key Changes:**

- Use `ReCaptchaV3Provider` instead of `ReCaptchaEnterpriseProvider`
- Better error logging
- Debug token only in development

---

### Phase 6: Update Cloud Functions

#### Step 6.1: Set Secret in Firebase Functions

```bash
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
```

When prompted, paste your **Secret Key** from Phase 1, Step 1.3.

#### Step 6.2: Update Function Configuration

**File:** `functions/src/journal.ts` (example)

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const saveJournalEntry = onCall(
  {
    // Start with optional enforcement (Monitor Mode)
    enforceAppCheck: false, // Set to true later
    consumeAppCheckToken: false, // Set to true later
  },
  async (request) => {
    // Your function code...
  }
);
```

**After 1 week of monitoring:**

```typescript
{
  enforceAppCheck: true,
  consumeAppCheckToken: true,
}
```

---

### Phase 7: Test Thoroughly

#### Step 7.1: Local Testing

```bash
npm run dev
```

**Test Checklist:**

- [ ] App loads without errors
- [ ] Console shows "App Check initialized successfully"
- [ ] User sign-up works
- [ ] User sign-in works
- [ ] Cloud Functions work (journal save, etc.)
- [ ] No "App Check token" errors in console

#### Step 7.2: Build and Deploy

```bash
npm run build
firebase deploy
```

#### Step 7.3: Production Testing

**Immediate Tests:**

- [ ] Visit [https://sonash-app.web.app](https://sonash-app.web.app)
- [ ] Test in Chrome (desktop)
- [ ] Test in Firefox (desktop)
- [ ] Test in Safari (desktop/mobile)
- [ ] Test in Chrome (mobile)
- [ ] Test authentication in all browsers
- [ ] Test Cloud Functions in all browsers

**Monitor for 24 Hours:**

- [ ] Check
      [Firebase Console - Functions Logs](https://console.firebase.google.com/project/sonash-app/functions/logs)
      for errors
- [ ] Check
      [App Check Metrics](https://console.firebase.google.com/project/sonash-app/appcheck)
      for token success rate
- [ ] Monitor user reports

**After 1 Week:**

- [ ] Review App Check metrics
- [ ] Check for false positives (legitimate users blocked)
- [ ] If clean, enable enforcement in Cloud Functions

---

### Phase 8: Enable Enforcement (After 1 Week)

#### Step 8.1: Update Cloud Functions

Change all functions from:

```typescript
{
  enforceAppCheck: false,
  consumeAppCheckToken: false,
}
```

To:

```typescript
{
  enforceAppCheck: true,
  consumeAppCheckToken: true,
}
```

#### Step 8.2: Deploy Updated Functions

```bash
firebase deploy --only functions
```

#### Step 8.3: Switch Firebase Console to Enforce Mode

1. Go to
   [Firebase Console - App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. For each service:
   - Change from **"Monitor"** → **"Enforce"**
3. Click **"Save"**

---

## Troubleshooting Common Issues

### Issue 1: "400 Bad Request" on Cloud Functions

**Cause:** App Check token is invalid or missing

**Solutions:**

1. Check browser console for App Check initialization errors
2. Verify Site Key is correct in `.env.local` and Firebase Console
3. Verify reCAPTCHA Enterprise API is enabled
4. Check domains are whitelisted in reCAPTCHA Console
5. Clear browser cache and cookies
6. Test in incognito mode

### Issue 2: "App Check Error" in Console

**Cause:** reCAPTCHA script failed to load or execute

**Solutions:**

1. Check browser ad-blocker is disabled
2. Verify domains are correct in reCAPTCHA Console
3. Check network tab for failed reCAPTCHA script loads
4. Try different browser

### Issue 3: Works Locally but Not in Production

**Cause:** Environment variable not set in production build

**Solutions:**

1. Verify `.env.production` exists and has correct Site Key
2. Rebuild: `npm run build`
3. Redeploy: `firebase deploy`
4. Check Vercel/hosting provider environment variables (if not using Firebase
   Hosting)

### Issue 4: Users Cannot Sign Up/Sign In

**Cause:** App Check enforcement too strict

**Solutions:**

1. Temporarily disable enforcement:
   - In Cloud Functions: Set `enforceAppCheck: false`
   - In Firebase Console: Set to "Monitor" mode
2. Review App Check metrics for patterns
3. Consider lowering the score threshold
4. Check for regional issues (some countries block reCAPTCHA)

---

## Rollback Plan

If fresh implementation fails:

### Emergency Rollback

```bash
# 1. Disable App Check in Firebase Console (Monitor Mode)
# 2. Update Cloud Functions
git revert HEAD
git push origin main

# 3. Deploy
firebase deploy

# 4. Monitor recovery
```

---

## Success Metrics

After full deployment, monitor these metrics:

| Metric                       | Target      | Red Flag       |
| ---------------------------- | ----------- | -------------- |
| App Check token success rate | > 95%       | < 90%          |
| Sign-up completion rate      | No change   | > 10% drop     |
| Cloud Function error rate    | < 1%        | > 5%           |
| User support tickets         | No increase | > 20% increase |

---

## Resources

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [Firebase Functions v2 - App Check](https://firebase.google.com/docs/functions/callable-reference#app-check)
- [SoNash Security Documentation](./SECURITY.md)

---

## Notes

- **Priority:** P2 - Defer until M3+ unless bot abuse becomes a problem
- **Estimated Implementation Time:** 4-6 hours
- **Risk Level:** Medium - can affect all users if misconfigured
- **Dependencies:** None (fully optional security enhancement)

---

## AI Instructions

When helping with App Check/reCAPTCHA issues:

1. First determine if user wants removal or fresh setup
2. For removal: Follow Part 1 exactly in order
3. For fresh setup: Use Monitor mode first, never enforce immediately
4. Always recommend 1-week monitoring period before enforcement
5. If issues arise, emergency rollback plan is at end of doc

---

## Version History

| Version | Date       | Changes                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------ |
| 1.1     | 2026-01-03 | Added Tier 2 sections (Purpose, Quick Start, AI Instructions, Version History) |
| 1.0     | 2025-12-23 | Initial creation                                                               |
