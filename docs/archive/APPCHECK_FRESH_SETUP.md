# App Check Fresh Setup Guide

## Clean Slate Setup for Firebase App Check with reCAPTCHA Enterprise

Follow these steps in order to set up App Check from scratch.

---

## Step 1: Clean Up Old Configuration

### 1.1 Remove App from Firebase App Check

1. Go to [Firebase Console → App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Find "SoNash" web app
3. If there's a way to unregister/remove the providers (reCAPTCHA or reCAPTCHA Enterprise), do so
4. If you can't remove providers individually, we'll just overwrite them in the next steps

### 1.2 Delete Old reCAPTCHA Key

1. Go to [Google Cloud Console → reCAPTCHA](https://console.cloud.google.com/security/recaptcha?project=sonash-app)
2. Find "SoNash-v2" key (ID: `6LflyDksAAAAAJcSHrwTjdoWf5ixj9OHX_wCwS3G`)
3. Click the three-dot menu (⋮) → **Delete**
4. Confirm deletion

---

## Step 2: Create New reCAPTCHA Enterprise Key

### 2.1 Create the Key

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

### 2.2 Save the Site Key

After creation, you'll see:
- **Site key** (starts with `6L...`) - COPY THIS
- The key should NOT show "Incomplete" status (if it does, that's OK, it will complete on first use)

---

## Step 3: Register App in Firebase App Check

### 3.1 Register with reCAPTCHA Enterprise

1. Go to [Firebase Console → App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Find "SoNash" web app
3. Click to configure providers
4. Select **"reCAPTCHA Enterprise"** (NOT the regular "reCAPTCHA")
5. **reCAPTCHA Enterprise site key**: Paste the site key from Step 2.2
6. **Token time to live**: Leave as default (1 hour)
7. Click **"Save"**

### 3.2 Verify Registration

- You should see "reCAPTCHA Enterprise" with status "Registered" ✓
- The site key should match what you copied in Step 2.2

---

## Step 4: Update Environment Variables

### 4.1 Update .env.production

Update the site key in `.env.production`:

```bash
# App Check (reCAPTCHA Enterprise)
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=<YOUR_NEW_SITE_KEY_FROM_STEP_2.2>
```

### 4.2 Verify Other Environment Variables

Make sure these are still correct:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDGvM5kFwkgSTUS1Tbwt0piuhk9bcCeY7Q
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sonash-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sonash-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sonash-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=236021751794
NEXT_PUBLIC_FIREBASE_APP_ID=1:236021751794:web:8d54964dbe6d9288bf956b
```

---

## Step 5: Verify Code Configuration

### 5.1 Check lib/firebase.ts

Verify the code uses `ReCaptchaEnterpriseProvider`:

```typescript
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from "firebase/app-check"

// ...later in the file...

// Initialize App Check with ReCaptchaEnterpriseProvider
_appCheck = initializeAppCheck(_app, {
  provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
})
```

**This should already be correct** from the previous commit.

### 5.2 Check Cloud Functions

Verify all Cloud Functions have App Check enforcement enabled in `functions/src/index.ts`:

```typescript
export const saveDailyLog = onCall<DailyLogData>(
  {
    // ... other options
  },
  async (request) => {
    const { data, app, auth } = request;

    // App Check verification
    if (!app) {
      throw new HttpsError("failed-precondition", "App Check verification failed");
    }
    // ... rest of function
  }
);
```

**This should already be correct** from previous work.

---

## Step 6: Test in Development (Optional)

### 6.1 Create Debug Token

1. Go to [Firebase Console → App Check](https://console.firebase.google.com/project/sonash-app/appcheck)
2. Click **"Apps"** tab
3. Find "SoNash" web app
4. In the **"App Check Debug Tokens"** section (might be under "overflow menu")
5. Click **"Manage debug tokens"**
6. Add a debug token for local development
7. Copy the token

### 6.2 Add Debug Token to .env.local (if testing locally)

```bash
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=<YOUR_DEBUG_TOKEN>
```

**For now, we'll skip local testing and go straight to production deployment.**

---

## Step 7: Deploy and Test

### 7.1 Commit Environment Variable Change

```bash
git add .env.production
git commit -m "chore: Update reCAPTCHA Enterprise site key for fresh App Check setup"
git push
```

### 7.2 Deploy

The PR will rebuild automatically. Once deployed:

1. Open the app in your browser
2. Open DevTools Console
3. Look for App Check initialization messages
4. Try to perform an action that calls a Cloud Function (e.g., save a journal entry)

### 7.3 Expected Behavior

**Success indicators:**
- No App Check errors in console
- Cloud Function calls succeed
- reCAPTCHA key status changes from "Incomplete" to "Complete" (if it was incomplete)

**If you still see errors:**
- Note the exact error message
- Check the Network tab for failed requests
- Share the error details for further troubleshooting

---

## Troubleshooting Checklist

If it still doesn't work after fresh setup:

- [ ] Verify the site key in `.env.production` matches the key in Firebase App Check
- [ ] Verify the site key in Firebase App Check matches the key in Google Cloud Console
- [ ] Check that all your domains are added to the reCAPTCHA key in Google Cloud Console
- [ ] Verify reCAPTCHA Enterprise API is enabled in Google Cloud Console
- [ ] Check browser console for specific error messages
- [ ] Check Cloud Functions logs for App Check verification failures
- [ ] Try in an incognito window to rule out browser cache issues
- [ ] Verify the code is using `ReCaptchaEnterpriseProvider` (not v3)

---

## Notes

- **DO NOT** remove the Firebase API key or any other Firebase config - only update the App Check reCAPTCHA site key
- The fresh setup keeps all existing Firebase services (Auth, Firestore, Functions) unchanged
- App Check is an additional security layer - your app will work without it, but it provides bot protection
- The key will show "Incomplete" until it receives its first successful token request - this is normal

---

**Ready to start?** Follow Steps 1-7 in order, and let me know if you hit any issues along the way!
