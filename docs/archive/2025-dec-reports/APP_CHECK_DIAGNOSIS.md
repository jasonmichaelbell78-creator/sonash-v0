<!-- TDMS: All actionable findings from this report have been ingested into
     MASTER_DEBT.jsonl. This file is archived for historical reference only.
     Do not add new findings here — use the TDMS intake process. -->

# Firebase App Check Debugging Analysis

## Executive Summary

Based on the error `POST .../exchangeDebugToken 400 (Bad Request)` and the
verification steps you have already taken, the issue is almost certainly
unrelated to your local code or the specific debug token value. The error
indicates that the Firebase App Check backend rejected the request parameters or
the request context.

The most likely culprits are **Google Cloud API Key restrictions** or the **App
Check API status** in the Google Cloud Console.

---

### 1. Potential Root Cause A: API Key Restrictions (Most Likely)

- **Explanation:** The `exchangeDebugToken` endpoint is a Google API endpoint.
  It requires a valid API Key passed via the `key` query parameter (visible in
  your error log as `key=AIza...`).
  - If your API Key in the Google Cloud Console has **API Restrictions** enabled
    (i.e., "Restrict key" is selected), and the **Firebase App Check API** is
    _not_ in the list of allowed APIs, the request will fail.
  - If your API Key has **Application Restrictions** (e.g., HTTP Referrers), and
    `localhost` or `localhost:3000` is not explicitly whitelisted, it might be
    rejected. Note that for `exchangeDebugToken`, strict referrer checks
    sometimes fail if the request originates from a non-standard local context
    or if the browser policy hides the referrer.
- **Verification Step:**
  1.  Go to **Google Cloud Console** > **APIs & Services** > **Credentials**.
  2.  Click on the API Key matching `NEXT_PUBLIC_FIREBASE_API_KEY`.
  3.  Check **API restrictions**: If "Restrict key" is selected, ensure
      **Firebase App Check API** is in the list. If it is missing, add it and
      save.
  4.  Check **Application restrictions**: Temporarily set to **None** to test.
      If it works, re-add `localhost` and `127.0.0.1` carefully.

### 2. Potential Root Cause B: Firebase App Check API Not Enabled

- **Explanation:** The App Check service relies on the underlying "Firebase App
  Check API" being enabled in your Google Cloud project. If this API is
  disabled, all calls to its endpoints (including debug token exchange) will
  fail, often with a 400 or 403 error.
- **Verification Step:**
  1.  Go to **Google Cloud Console** > **APIs & Services** > **Enabled APIs &
      services**.
  2.  Click **+ ENABLE APIS AND SERVICES**.
  3.  Search for **"Firebase App Check API"**.
  4.  If it is not enabled, click **Enable**. Wait 1-2 minutes for propagation.

### 3. Potential Root Cause C: "Zombie" Token or Project/App Mismatch

- **Explanation:** While you verified the `.env` file, it is possible the _App
  ID_ (`1:2360...`) belongs to a different Firebase project than the one you are
  viewing in the console, or the Debug Token was added to a _different_ Web App
  within the same project (e.g., if you have multiple "Web" apps defined).
  - A 400 error can occur if the `app_id` in the URL path
    (`.../apps/1:2360.../exchangeDebugToken`) does not match the project that
    owns the Debug Token, or if the API key belongs to a different project
    entirely.
- **Verification Step:**
  1.  Open `lib/firebase.ts` (or your config file) and manually hardcode the
      values from the Firebase Console (Project Settings > General > Your Apps)
      just for a moment to bypass any `.env` caching issues.
  2.  Ensure you are looking at the **exact same App ID** in the Firebase
      Console under **App Check > Apps**. It is common to have a "Staging" and
      "Prod" web app and add the token to the wrong one.

### 4. Potential Root Cause D: System Time Skew (Edge Case)

- **Explanation:** Security token exchanges are extremely sensitive to
  timestamps. If your local development machine's clock is out of sync with
  Google's servers by more than a minute or two, the request generation (which
  often includes timestamps) or validation may fail with a 400 or 401.
- **Verification Step:**
  1.  Check your system time against a standard time server (e.g.,
      [time.is](https://time.is)).
  2.  If there is a drift, resync your system clock.

---

### Recommended Immediate Action

Start with **Root Cause A**. In 90% of cases where `exchangeDebugToken` fails
with a 400 immediately upon initialization, it is because the API Key is
restricted and lacks permission to call the App Check API.
