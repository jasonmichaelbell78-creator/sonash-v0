# App Check Setup Guide

## Critical: App Check is Required for Production

As of PR1, all journal and inventory Cloud Functions require App Check verification. **The app will not function without proper App Check configuration.**

## Errors Without App Check

If App Check is not configured, you'll see these errors in production:
```
POST /saveDailyLog 400 (Bad Request)
POST /saveJournalEntry 400 (Bad Request)
POST /saveInventoryEntry 400 (Bad Request)
FirebaseError: App Check verification failed. Please refresh the page.
```

## Setup Instructions

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

## Environment Variables Summary

| Variable | Required | Environment | Description |
|----------|----------|-------------|-------------|
| `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | **YES** | Production | ReCaptcha Enterprise site key from Google Cloud Console |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` | No | Development | Debug token for local testing |

## Architecture Notes

### Client-Side (lib/firebase.ts)

App Check is initialized with the Firebase app:
- **Production:** Uses `ReCaptchaV3Provider` with the configured site key
- **Development:** Uses debug token if provided, otherwise shows warning
- Automatic token refresh enabled for seamless user experience

### Server-Side (functions/src/index.ts)

All Cloud Functions have `requireAppCheck: true`:
- `saveDailyLog` - Requires App Check
- `saveJournalEntry` - Requires App Check
- `saveInventoryEntry` - Requires App Check
- `softDeleteJournalEntry` - Requires App Check

## Security Benefits

App Check provides protection against:
- ✅ Unauthorized API access from non-web clients
- ✅ Abuse from bots and scrapers
- ✅ Rate limit circumvention
- ✅ Replay attacks

## Troubleshooting

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

## References

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [ReCaptcha Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [App Check Web Setup with ReCaptcha Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [App Check Debug Provider](https://firebase.google.com/docs/app-check/web/debug-provider)
