# Firebase App Check & reCAPTCHA Configuration Problem - Need Expert Advice

> ⚠️ **ARCHIVED - DO NOT COPY-PASTE**: This document is archived and outdated. The reCAPTCHA configuration described here has been replaced by App Check.
> - See [APPCHECK_SETUP.md](../APPCHECK_SETUP.md) for current setup
> - Code snippets here may not reflect current implementation
> - Configuration values shown are placeholders/redacted

## Background

I'm working on a Next.js application (SoNash Recovery Notebook) using Firebase services including Authentication, Firestore, and Cloud Functions. I'm trying to implement Firebase App Check for security but encountering persistent errors.

## Current Configuration

### Firebase Setup
- **Project ID**: sonash-app
- **Platform**: Next.js with static export
- **Firebase Services**: Auth (anonymous sign-in), Firestore, Cloud Functions
- **App Check**: Enabled with server-side enforcement on all Cloud Functions

### reCAPTCHA Configuration
- **Site Key**: `<RECAPTCHA_SITE_KEY>` (redacted)
- **Key Type**: reCAPTCHA **v3** (NOT Enterprise)
- **Created From**: Google Cloud Console reCAPTCHA admin panel
- **Key Name in Console**: "v3 SoNash Recovery Notebook"
- **Banner Visible**: "Migrate keys... to Google Cloud Platform to access the latest reCAPTCHA features"

### Firebase App Check Configuration
- **Attestation Provider Shown**: "reCAPTCHA Enterprise" (with checkmark - currently registered)
- **Other Option Available**: "reCAPTCHA" (with + icon - not currently selected)
- **Status**: Registered

### Client-Side Code (lib/firebase.ts)
```typescript
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from "firebase/app-check"

// Initialize App Check with ReCaptchaV3Provider (production and development)
_appCheck = initializeAppCheck(_app, {
  provider: new ReCaptchaV3Provider(recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
})
```

### Server-Side Code (Cloud Functions)
All 5 Cloud Functions have:
```typescript
export const myFunction = onCall<DataType>(
  {
    // ... other options
  },
  async (request) => {
    const { data, app, auth } = request;

    // App Check verification
    if (!app) {
      throw new HttpsError("failed-precondition", "App Check verification failed");
    }
    // ... function logic
  }
);
```

## Troubleshooting History

### Phase 1: Initial API Key Problem (RESOLVED ✅)
**Symptoms**:
- 400 errors on `exchangeDebugToken`
- 400 errors on `accounts:signUp` (anonymous sign-in)
- All App Check and authentication failures

**Root Cause**: Firebase API key had a typo (number '5' where letter 'S' should be)

**Resolution**: Corrected the API key in `.env.production`

**Result**: Anonymous sign-in started working, basic app functionality restored

### Phase 2: App Check Re-enablement
**Action Taken**: After API key fix, re-enabled App Check on both client and server

**Changes Made**:
1. Uncommented App Check initialization in `lib/firebase.ts`
2. Re-enabled `requireAppCheck: true` on all Cloud Functions
3. Removed debug token flag from production environment

### Phase 3: Provider Type Discovery (CURRENT ISSUE ❌)
**Symptoms After Re-enablement**:
```
POST https://www.google.com/recaptcha/enterprise/clr?k=<RECAPTCHA_SITE_KEY> 400
AppCheck: ReCAPTCHA error
```

**Discovery**:
- Code was initially using `ReCaptchaEnterpriseProvider`
- But the actual reCAPTCHA key is **v3** (not Enterprise)
- Firebase App Check console shows "reCAPTCHA Enterprise" as the registered attestation provider

**Action Taken**: Changed code from `ReCaptchaEnterpriseProvider` to `ReCaptchaV3Provider`

**Current State**: Still getting errors (presumably due to mismatch)

## The Core Problem

### The Mismatch
1. **Firebase App Check Backend**: Configured for "reCAPTCHA Enterprise" attestation provider
2. **Actual reCAPTCHA Key**: v3 (not Enterprise)
3. **Client Code**: Now uses `ReCaptchaV3Provider` (matches the key type)
4. **Result**: Configuration mismatch causing failures

### What I CANNOT Do
- **Cannot remove "reCAPTCHA Enterprise" from App Check via UI**: The three-dot menu next to the registered app does NOT provide an option to remove/unregister the attestation provider (I've confirmed this multiple times - it's not there)

### What I HAVEN'T Tried Yet
1. **Clicking the "+" button** next to "reCAPTCHA" in Firebase App Check to add the v3 provider
2. **Firebase CLI** to modify App Check configuration programmatically
3. **Deleting the entire app registration** in App Check and re-registering with correct provider
4. **Creating an actual reCAPTCHA Enterprise key** and using that instead (go the other direction)

## Questions for AI Experts

### Primary Question
**Given this configuration mismatch, what is the correct solution?**

Should I:
1. Find a way to change Firebase App Check from "reCAPTCHA Enterprise" to "reCAPTCHA" (v3)?
2. Create an actual reCAPTCHA Enterprise key and use `ReCaptchaEnterpriseProvider` instead?
3. Is there a way that "reCAPTCHA Enterprise" in App Check can work with v3 keys?

### Specific Technical Questions

1. **App Check Attestation Provider Compatibility**:
   - Can Firebase App Check's "reCAPTCHA Enterprise" attestation provider work with reCAPTCHA v3 keys?
   - Or does "reCAPTCHA Enterprise" in App Check strictly require an actual Enterprise key?

2. **Client vs Server Provider Matching**:
   - Does the client-side provider class (`ReCaptchaV3Provider` vs `ReCaptchaEnterpriseProvider`) need to match the Firebase App Check attestation provider configuration?
   - Or is it only the key type that matters?

3. **How to Change App Check Configuration**:
   - If I click the "+" next to "reCAPTCHA" in App Check, will it let me switch providers or just add a second one?
   - Is there a Firebase CLI command to change the attestation provider?
   - Do I need to delete and re-register the entire app in App Check?

4. **Enterprise vs v3 Migration**:
   - If I upgrade from v3 to Enterprise, do I need to:
     - Create the Enterprise key in Google Cloud Console?
     - Register it somewhere specific?
     - Change environment variables?
   - Is there a migration guide for v3 → Enterprise?

5. **Error Interpretation**:
   - The error shows POST to `https://www.google.com/recaptcha/enterprise/clr?k=...` with 400 status
   - Does this confirm the client is trying to use a v3 key with Enterprise endpoints?
   - Or is this a different issue?

## Environment Details

### Dependencies (package.json)
```json
{
  "firebase": "^11.1.0",
  "firebase-admin": "^13.0.2",
  "firebase-functions": "^6.1.3"
}
```

### Environment Variables (.env.production)
```bash
# Values redacted for security - see .env.example for format
NEXT_PUBLIC_FIREBASE_API_KEY=<FIREBASE_API_KEY>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<FIREBASE_AUTH_DOMAIN>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<FIREBASE_PROJECT_ID>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<FIREBASE_STORAGE_BUCKET>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<FIREBASE_MESSAGING_SENDER_ID>
NEXT_PUBLIC_FIREBASE_APP_ID=<FIREBASE_APP_ID>

# App Check (reCAPTCHA site key - this is a v3 key)
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=<RECAPTCHA_SITE_KEY>
```

## What I Need

1. **Clear explanation** of the relationship between:
   - reCAPTCHA key type (v3 vs Enterprise)
   - Firebase App Check attestation provider selection
   - Client-side provider class used in code

2. **Step-by-step solution** to resolve the mismatch, considering:
   - I cannot use the 3-dot menu to remove the Enterprise provider
   - I need the app to work in production ASAP
   - I want to follow Firebase best practices

3. **Recommendation** on which direction to go:
   - Fix the configuration to use v3 everywhere?
   - Upgrade to Enterprise everywhere?

## Additional Context

- The app works perfectly WITHOUT App Check enabled (Auth + Rate Limiting + Input Validation + Authorization are all in place)
- App Check is desired for additional bot protection
- Budget is limited (prefer free tier solutions if possible)
- The app is already deployed and in use

## Screenshot Evidence Available

1. Google reCAPTCHA Console showing "v3 SoNash Recovery Notebook" with migration banner
2. Firebase App Check console showing "reCAPTCHA Enterprise" as registered attestation provider
3. Browser console showing 400 errors on Enterprise endpoint

---

**Please provide detailed technical guidance on how to resolve this configuration mismatch.** I'm looking for specific steps, not general advice. Thank you!
