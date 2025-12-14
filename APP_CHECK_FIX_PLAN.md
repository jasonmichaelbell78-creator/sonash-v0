# App Check Remediation Plan

Based on the consensus from **5 external AI experts** (Gemini, ChatGPT, GitHub Co-pilot, Claude, Jules), here is the prioritized action plan to fix the App Check 400 Error.

## 🚨 Top Probability: API Key Restrictions
**All FIVE models identified this as the likely root cause.**
The error `400 Bad Request` on `exchangeDebugToken` often happens because the API Key used (`AIza...`) is not authorized to call the App Check API.

### Steps to Fix
1.  Go to **[Google Cloud Console > APIs & Credentials](https://console.cloud.google.com/apis/credentials?project=sonash-app)**.
2.  Find the API Key matching your `.env.local` (`AIza...`).
3.  Click **Edit** (Pencil icon).
4.  **Check API Restrictions:**
    *   If "Restrict key" is selected, scroll through the dropdown.
    *   Ensure **Firebase App Check API** is checked.
    *   Ensure **Token Service API** is checked.
5.  **Check Application Restrictions:**
    *   If "HTTP referrers" is selected, ensure you have:
        *   `http://localhost:3000/*`
        *   `http://localhost:3001/*`
        *   `http://127.0.0.1:3000/*`

## ➕ Additional Check: Project-Level API Status
**Jules added this critical check.**
Even if the *Key* allows it, the *Project* might not have the API enabled.

### Steps to Fix
1.  Go to **[Google Cloud Console > Enabled APIs & Services](https://console.cloud.google.com/apis/dashboard?project=sonash-app)**.
2.  Click **+ ENABLE APIS AND SERVICES** (top of screen).
3.  Search for **Firebase App Check API**.
4.  If it says "ENABLE", click it. (If it says "MANAGE", it's already on).

## ⚠️ Secondary: Provider Mismatch
**Claude and Co-pilot highlighted this.**
If the infrastructure settings above are correct, check the provider type.

### Steps to Fix
1.  Go to **[Firebase Console > App Check](https://console.firebase.google.com/project/sonash-app/appcheck/apps)**.
2.  Look at the "Attestation provider" column.
    *   Does it say **reCAPTCHA Enterprise**? (Matches our code).
    *   Or **reCAPTCHA v3**? (Mismatch).
3.  If mismatch, register for Enterprise in the console.

---

## 🚦 Execution Order
1.  **API Key Permissions** (Most likely).
2.  **Enabled APIs Status** (Quick check).
3.  **Provider Mismatch**.
