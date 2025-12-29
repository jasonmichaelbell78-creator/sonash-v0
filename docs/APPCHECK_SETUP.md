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

### 1. Register App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sonash-app**
3. Navigate to **Build** > **App Check**
4. Click **Get started**
5. Select **Web** apps
6. Choose **reCAPTCHA v3** as the provider
7. Register your app

### 2. Get ReCaptcha V3 Site Key

After registering, Firebase will provide you with a **reCAPTCHA v3 site key**.

Copy this key - you'll need it for the environment variable.

### 3. Configure Production Environment Variable

Add the following environment variable to your production deployment (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key_here
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
| `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | **YES** | Production | ReCaptcha V3 site key from Firebase Console |
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
- This is expected behavior for ReCaptcha v3
- Badge can be hidden with CSS if needed (see ReCaptcha terms of service)

## References

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [ReCaptcha v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [App Check Web Setup](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- [App Check Debug Provider](https://firebase.google.com/docs/app-check/web/debug-provider)
