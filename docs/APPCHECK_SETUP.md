# App Check Setup Guide

**Last Updated:** 2026-01-03
**Document Tier:** 2 (Active Reference)
**Status:** Active

---

## Purpose

This guide covers Firebase App Check configuration for the SoNash application. App Check provides protection against unauthorized API access, bots, and abuse by verifying that requests originate from legitimate app instances.

**Critical:** As of PR1, all journal and inventory Cloud Functions require App Check verification. **The app will not function without proper App Check configuration.**

---

## Quick Start

1. Create a ReCaptcha Enterprise key in [Google Cloud Console](https://console.cloud.google.com/security/recaptcha)
2. Register the key in [Firebase App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
3. Set `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` in production environment
4. Deploy and verify - no "App Check verification failed" errors

---

## Table of Contents

1. [Errors Without App Check](#errors-without-app-check)
2. [Standard Setup Instructions](#standard-setup-instructions)
3. [Fresh Setup (Clean Slate)](#fresh-setup-clean-slate)
4. [Environment Variables](#environment-variables)
5. [Architecture Notes](#architecture-notes)
6. [Security Benefits](#security-benefits)
7. [Troubleshooting](#troubleshooting)
8. [References](#references)

---

## Errors Without App Check

If App Check is not configured, you'll see these errors in production:

```
POST /saveDailyLog 400 (Bad Request)
POST /saveJournalEntry 400 (Bad Request)
POST /saveInventoryEntry 400 (Bad Request)
FirebaseError: App Check verification failed. Please refresh the page.
```

---

## Standard Setup Instructions

### 1. Create ReCaptcha Enterprise Key in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/security/recaptcha)
2. Select your project: **sonash-app**
3. Click **Create Key**
4. Configure the key:
   - **Display name**: SoNash (or your preferred name)
   - **Platform type**: Website
   - **Domains**: Add your production domain(s) and Firebase domains:
     - `sonash-app.web.app`
     - `sonash-app.firebaseapp.com`
     - `localhost` (for local development)
   - **reCAPTCHA type**: Score-based (v3-style)
5. Click **Create**
6. Copy the **Site Key** (starts with `6L...`) - you'll need it for the environment variable

### 2. Register App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sonash-app**
3. Navigate to **Build** > **App Check**
4. Click **Get started** (if not already configured)
5. Select your **Web** app
6. Choose **reCAPTCHA Enterprise** as the provider
7. Select the ReCaptcha Enterprise key you created in step 1
8. Click **Save**

### 3. Configure Production Environment Variable

Add the following environment variable to your production deployment (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=your_recaptcha_enterprise_site_key_here
```

**Important:** This MUST be set in your production environment or all Cloud Function calls will fail.

### 4. Configure Development Environment (Optional)

For local development, you can use App Check debug tokens:

1. In Firebase Console > App Check, go to **Manage debug tokens**
2. Click **Add debug token**
3. Give it a name (e.g., "Local Development")
4. Copy the generated token
5. Add to your `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=your_debug_token_here
```

**Note:** Debug tokens should NEVER be used in production.

### 5. Verify Setup

After configuration, test by:
1. Opening the app in production
2. Navigating to a page that saves data (journal, daily log, etc.)
3. Check browser console - you should NOT see "App Check verification failed" errors
4. Verify data saves successfully

---

## Fresh Setup (Clean Slate)

Use this section when troubleshooting persistent App Check issues or setting up from scratch.

### Step 1: Clean Up Old Configuration

#### 1.1 Remove App from Firebase App Check

1. Go to [Firebase Console → App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Find "SoNash" web app
3. If there's a way to unregister/remove the providers (reCAPTCHA or reCAPTCHA Enterprise), do so
4. If you can't remove providers individually, the next steps will overwrite them

#### 1.2 Delete Old reCAPTCHA Key (if applicable)

1. Go to [Google Cloud Console → reCAPTCHA](https://console.cloud.google.com/security/recaptcha?project=sonash-app)
2. Find any old keys that are no longer needed
3. Click the three-dot menu (⋮) → **Delete**
4. Confirm deletion

### Step 2: Create New reCAPTCHA Enterprise Key

1. In [Google Cloud Console → reCAPTCHA](https://console.cloud.google.com/security/recaptcha?project=sonash-app)
2. Click **"+ Create Key"**
3. Configure:
   - **Display name**: `SoNash-Production`
   - **Platform type**: Select **"Website"**
   - **reCAPTCHA type**: Select **"Score-based (recommended)"**
   - **Domains**: Add all your domains:
     - `localhost` (for local development)
     - `sonash-app.web.app` (Firebase Hosting)
     - `sonash-app.firebaseapp.com` (Firebase Hosting alternate)
     - Any other production domains (Vercel, custom domain, etc.)
4. Click **"Create"**
5. Copy the **Site key** (starts with `6L...`)

### Step 3: Register App in Firebase App Check

1. Go to [Firebase Console → App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Find "SoNash" web app
3. Click to configure providers
4. Select **"reCAPTCHA Enterprise"** (NOT the regular "reCAPTCHA")
5. **reCAPTCHA Enterprise site key**: Paste the site key from Step 2
6. **Token time to live**: Leave as default (1 hour)
7. Click **"Save"**

Verify: You should see "reCAPTCHA Enterprise" with status "Registered" ✓

### Step 4: Update Environment Variables

Set the App Check site key in your environment configuration:

- **Local development:** Use a gitignored `.env.local` file
- **Production deploy:** Set via your hosting/CI environment variables (recommended)

```bash
# App Check (reCAPTCHA Enterprise)
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=<YOUR_NEW_SITE_KEY>
```

> ⚠️ **Do not commit `.env*` files to version control.** Use environment variables in your hosting platform.

### Step 5: Verify Code Configuration

Check `lib/firebase.ts` uses `ReCaptchaEnterpriseProvider`:

```typescript
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"

_appCheck = initializeAppCheck(_app, {
  provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
})
```

### Step 6: Deploy and Test

1. Set environment variable in your hosting/CI platform (do **not** commit `.env*` files)
2. Deploy the application
3. Open DevTools Console
4. Perform an action that calls a Cloud Function
5. Verify no App Check errors appear

---

## Environment Variables

| Variable | Required | Environment | Description |
|----------|----------|-------------|-------------|
| `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | **YES** | Production | ReCaptcha Enterprise site key from Google Cloud Console |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` | No | Development | Debug token for local testing |

---

## Architecture Notes

### Client-Side (lib/firebase.ts)

App Check is initialized with the Firebase app:
- **Production:** Uses `ReCaptchaEnterpriseProvider` with the configured site key
- **Development:** Uses debug token if provided, otherwise shows warning
- Automatic token refresh enabled for seamless user experience

### Server-Side (functions/src/index.ts)

All Cloud Functions have `requireAppCheck: true`:
- `saveDailyLog` - Requires App Check
- `saveJournalEntry` - Requires App Check
- `saveInventoryEntry` - Requires App Check
- `softDeleteJournalEntry` - Requires App Check

---

## Security Benefits

App Check provides protection against:
- ✅ Unauthorized API access from non-web clients
- ✅ Abuse from bots and scrapers
- ✅ Rate limit circumvention
- ✅ Replay attacks

---

## Troubleshooting

### Troubleshooting Checklist

If App Check isn't working after setup:

- [ ] Verify the production App Check site key is set in your hosting/CI environment variables (do **not** store production keys in tracked `.env.*` files)
- [ ] For local development, verify the key (or debug token) is set in a gitignored `.env.local`
- [ ] Verify the site key in Firebase App Check matches the key in Google Cloud Console
- [ ] Check that all your domains are added to the reCAPTCHA key in Google Cloud Console
- [ ] Verify reCAPTCHA Enterprise API is enabled in Google Cloud Console
- [ ] Check browser console for specific error messages
- [ ] Check Cloud Functions logs for App Check verification failures
- [ ] Try in an incognito window to rule out browser cache issues
- [ ] Verify the code is using `ReCaptchaEnterpriseProvider` (not v3)

### Error: "App Check verification failed"

- ✅ Verify `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` is set in production
- ✅ Check the site key matches the one in Firebase Console
- ✅ Ensure App Check is enabled for your app in Firebase Console

### Error: "Missing NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"

- This warning appears in development when no App Check configuration is present
- Add debug token for local development or configure ReCaptcha site key

### ReCaptcha badge appearing on page

- This is expected behavior for ReCaptcha Enterprise (score-based)
- Badge can be hidden with CSS if needed (see ReCaptcha terms of service)

### Error: "AppCheck: ReCAPTCHA error" or 400 Bad Request

- Verify you're using ReCaptcha **Enterprise** (not v3) in Google Cloud Console
- Check that your production domain is in the allowed domains list
- Ensure `lib/firebase.ts` uses `ReCaptchaEnterpriseProvider` (not `ReCaptchaV3Provider`)
- Try toggling ON "Disable domain verification" in the key settings temporarily to test

---

## AI Instructions

When helping with App Check issues:
1. First check if `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` is set
2. Verify `lib/firebase.ts` uses `ReCaptchaEnterpriseProvider`
3. Check Cloud Functions logs for verification failures
4. If persistent issues, recommend "Fresh Setup" section

---

## References

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [ReCaptcha Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [App Check Web Setup with ReCaptcha Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [App Check Debug Provider](https://firebase.google.com/docs/app-check/web/debug-provider)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-01-03 | Merged APPCHECK_FRESH_SETUP.md; added Tier 2 sections (Purpose, TOC, AI Instructions, Version History) |
| 1.0 | 2025-12-XX | Initial creation |
