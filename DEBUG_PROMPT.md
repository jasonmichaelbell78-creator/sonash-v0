# Firebase App Check Debugging Request

**Role:** You are a Senior Firebase & Next.js Architect. I need you to diagnose a persistent `HTTP 400` error with Firebase App Check in a local development environment.

**Objective:** We are trying to verify that a Cloud Function (`saveDailyLog`) correctly enforces App Check using a **Debug Token** in a local Next.js environment.

---

## 🏗️ Technical Stack
*   **Framework:** Next.js 14+ (App Router)
*   **Backend:** Firebase Functions (v2, Node.js 24)
*   **Database:** Firestore
*   **Security:** Firebase App Check (reCAPTCHA Enterprise provider)
*   **Local Env:** `npm run dev` (localhost:3000/3001)

---

## ❌ The Problem
We have configured App Check with a **Debug Token** for local development.
1.  The Client initializes App Check successfully and logs the debug token.
2.  However, the internal call to `exchangeDebugToken` fails with **HTTP 400**.
3.  Consequently, calls to the Cloud Function (which enforces `consumeAppCheckToken: true`) fail with **HTTP 400**.

**Error Log (Browser Console):**
```text
[error] POST https://content-firebaseappcheck.googleapis.com/v1/projects/sonash-app/apps/1:236021751794:web:d5d2fed46a8ff918bf956b:exchangeDebugToken?key=AIzaSyAu8u12YDUsTsgVGkigxuffXB5k532JbsQ 400 (Bad Request)

FirebaseError: AppCheck: Fetch server returned an HTTP error status. HTTP status: 400. (appCheck/fetch-status-error).
```

---

## ✅ What We Have Verified (The "Known Goods")
1.  **Project ID Match:** The Firebase Console Project ID is `sonash-app`. The `.env.local` matches this exactly.
2.  **Web App Match:** The `appId` in `.env.local` (`1:236021751794:web:d5d2fed46a8ff918bf956b`) matches the Web App ID in the Firebase Console.
3.  **Token Registration:** The specific debug token (`ED97...NAME-THIS-TOKEN`) has been added to the **App Check > Apps > [My Web App] > Manage debug tokens** menu in the Firebase Console. This has been deleted and re-added multiple times.
4.  **Environment Variables:** We discovered and fixed a "trailing space" issue in the `.env.local` values. The current values are clean:
    ```bash
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=sonash-app
    NEXT_PUBLIC_FIREBASE_APP_ID=1:236021751794:web:d5d2fed46a8ff918bf956b
    NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=ED97F576-7B68-4735-A766-7FAAC2916CCE
    ```
5.  **Client Initialization Verification:** The browser console explicitly prints:
    ```text
    App Check debug token: ED97F576-7B68-4735-A766-7FAAC2916CCE
    ✅ Firebase App Check initialized
    ```
6.  **Hard Reset:** We have killed all node processes, deleted `.next` cache, and restarted the dev server.

---

## 💻 The Code

**Client Initialization (`lib/firebase.ts`):**
```typescript
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN) {
  // @ts-expect-error - Firebase sets this globally for dev
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN
}

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(siteKey),
  isTokenAutoRefreshEnabled: true,
})
```

**Cloud Function (`functions/src/index.ts`):**
```typescript
export const saveDailyLog = onCall<DailyLogData>(
    {
        consumeAppCheckToken: true, // Enforces validation
    },
    async (request) => {
        // Function logic...
    }
);
```

---

## ❓ The Ask
We believe we have covered the "obvious" (token mismatch, wrong project). Please analyze this scenario for **non-obvious** or **edge-case** reasons why `exchangeDebugToken` would return a **400 Bad Request**.

**Please provide your analysis in this exact format:**

### 1. Potential Root Cause A
*   **Explanation:** [Why this causes a 400 even if the token seems correct]
*   **Verification Step:** [Exact command or place to check]

### 2. Potential Root Cause B
*   **Explanation:** ...
*   **Verification Step:** ...

### 3. Potential Root Cause C
*   **Explanation:** ...
*   **Verification Step:** ...

*(Focus specifically on API Key restrictions, App Check enforcement settings, or obscure "zombie" state issues).*
