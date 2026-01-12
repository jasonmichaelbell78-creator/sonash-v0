# Server-Side Security Implementation Guide

**Last Updated:** 2026-01-03 **Document Tier:** 2 (Active Reference) **Status:**
🟡 RECOMMENDED BEFORE PUBLIC LAUNCH **Priority:** P0 - Prevents financial
disaster ($10K+ monthly bills) and data breaches

---

## Purpose

This document provides copy-paste implementation examples for hardening SoNash's
security before production launch. It covers:

- Firebase App Check (bot protection)
- Cloud Functions rate limiting
- Server-side authorization
- Security testing procedures

**Related:** [SECURITY.md](./SECURITY.md),
[INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

---

## Quick Start

1. **App Check:** Install, configure, enable in Firebase Console
2. **Rate Limiting:** Deploy Cloud Functions with rate limiters
3. **Authorization:** Move validation to server-side
4. **Testing:** Run bypass attempt tests
5. **Monitoring:** Set up billing alerts

---

## Table of Contents

1. [Current Security Gaps](#current-security-gaps)
2. [Firebase App Check (Bot Protection)](#firebase-app-check)
3. [Cloud Functions Rate Limiting](#cloud-functions-rate-limiting)
4. [Server-Side Authorization](#server-side-authorization)
5. [Implementation Checklist](#implementation-checklist)
6. [Cost Estimates](#cost-estimates)

---

## Current Security Gaps

### ⚠️ What's Missing Today

1. **Client-Side Rate Limiting Only**
   - Current: Rate limits in `lib/utils/rate-limiter.ts` run in browser
   - Risk: Can be bypassed by disabling JavaScript
   - Impact: Malicious user could make 1000+ writes/second → $10K+ Firebase bill

2. **Client-Side Validation Only**
   - Current: All validation in `lib/security/firestore-validation.ts` runs in
     browser
   - Risk: Can be bypassed with Chrome DevTools
   - Impact: User can read/write any data, not just their own

3. **No Bot Protection**
   - Current: No Firebase App Check integration
   - Risk: Bots can hit API endpoints directly
   - Impact: DDoS attacks, fake accounts, spam

4. **No Audit Trail**
   - Current: No server-side logging of security events
   - Risk: Can't detect attacks until damage is done
   - Impact: No visibility into malicious activity

---

## Firebase App Check

**Purpose:** Verify requests come from your legitimate app, not bots or scrapers

**Cost:** Free tier: 500K verifications/month, then $0.50 per 10K

### Step 1: Install Firebase App Check

```bash
npm install firebase/app-check
```

### Step 2: Configure App Check (Client-Side)

Create `lib/app-check.ts`:

```typescript
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { app } from "./firebase";

// Enable App Check with reCAPTCHA Enterprise
export const initAppCheck = () => {
  if (typeof window === "undefined") return;

  // For local development, use debug token
  if (process.env.NODE_ENV === "development") {
    // Set debug token in Firebase Console -> App Check -> Debug tokens
    // @ts-ignore - Firebase sets this globally for dev
    self.FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
  }

  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY!
    ),
    isTokenAutoRefreshEnabled: true, // Refresh tokens automatically
  });

  return appCheck;
};
```

### Step 3: Initialize in Root Layout

In `app/layout.tsx`:

```typescript
"use client"

import { useEffect } from 'react'
import { initAppCheck } from '@/lib/app-check'

export default function RootLayout({ children }) {
  useEffect(() => {
    initAppCheck()
  }, [])

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### Step 4: Enable in Firebase Console

1. Go to Firebase Console → App Check
2. Click "Register" for your web app
3. Select "reCAPTCHA Enterprise"
4. Get your site key from
   [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=your_site_key_here
   ```

### Step 5: Enforce in Firestore Rules

In `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow requests with valid App Check tokens
    function hasValidAppCheck() {
      return request.auth != null && request.app != null;
    }

    match /users/{userId} {
      allow read, write: if hasValidAppCheck() && request.auth.uid == userId;

      match /daily_logs/{logId} {
        allow read, write: if hasValidAppCheck() && request.auth.uid == userId;
      }
    }
  }
}
```

**Result:** Bots without valid App Check tokens are rejected by Firebase, not
your client code.

---

## Cloud Functions Rate Limiting

**Purpose:** Enforce rate limits on the server, impossible to bypass

**Cost:** Free tier: 2M invocations/month, then $0.40 per million

### Step 1: Install Firebase Functions

```bash
npm install -g firebase-tools
firebase init functions
cd functions
npm install firebase-admin express express-rate-limit
```

### Step 2: Create Rate-Limited Proxy

Create `functions/src/index.ts`:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import rateLimit from "express-rate-limit";

admin.initializeApp();
const db = admin.firestore();

// Rate limiter: 10 requests per minute per user
const dailyLogLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  keyGenerator: (req) => req.body.userId || req.ip, // Rate limit by user ID
  handler: (req, res) => {
    res.status(429).json({
      error: "Rate limit exceeded. Please wait before trying again.",
      retryAfter: 60,
    });
  },
});

/**
 * Server-side save daily log endpoint with rate limiting
 *
 * Usage from client:
 * await fetch('https://us-central1-YOUR_PROJECT.cloudfunctions.net/saveDailyLog', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ userId, data }),
 * })
 */
export const saveDailyLog = functions
  .runWith({ enforceAppCheck: true }) // Require App Check token
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Apply rate limiting
    await new Promise((resolve) => dailyLogLimiter(req, res, resolve));

    try {
      const { userId, data } = req.body;

      // Verify auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Ensure user can only write their own data
      if (decodedToken.uid !== userId) {
        res
          .status(403)
          .json({ error: "Forbidden: Cannot write another user's data" });
        return;
      }

      // Validate data structure (server-side validation!)
      if (!data || typeof data !== "object") {
        res.status(400).json({ error: "Invalid data format" });
        return;
      }

      // Save to Firestore
      const today = new Date().toISOString().split("T")[0];
      const docRef = db
        .collection("users")
        .doc(userId)
        .collection("daily_logs")
        .doc(today);

      await docRef.set(
        {
          ...data,
          id: today,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving daily log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
```

### Step 3: Deploy Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Step 4: Update Client to Use Cloud Function

In `lib/firestore-service.ts`:

```typescript
async saveDailyLog(userId: string, data: Partial<DailyLog>) {
  ensureValidUser(userId)
  deps.assertUserScope({ userId })

  // Use Cloud Function instead of direct Firestore write
  const USE_CLOUD_FUNCTION = process.env.NEXT_PUBLIC_USE_CLOUD_FUNCTIONS === 'true'

  if (USE_CLOUD_FUNCTION) {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) throw new Error("Must be authenticated")

    const token = await user.getIdToken()
    const endpoint = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL + '/saveDailyLog'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, data }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save')
    }

    return
  }

  // Fallback to direct Firestore (for development)
  // ... existing direct Firestore code ...
}
```

**Result:** Rate limiting enforced on server. Bypassing client code does
nothing.

---

## Server-Side Authorization

**Purpose:** Complex authorization logic that can't be expressed in Firestore
rules

### Example: Multi-User Resource Access

```typescript
export const shareJournalEntry = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated"
      );
    }

    const { entryId, shareWithUserId } = data;
    const ownerId = context.auth.uid;

    // Verify entry belongs to caller
    const entryRef = db
      .collection("users")
      .doc(ownerId)
      .collection("daily_logs")
      .doc(entryId);
    const entry = await entryRef.get();

    if (!entry.exists) {
      throw new functions.https.HttpsError("not-found", "Entry not found");
    }

    // Check if target user exists
    const targetUser = await admin.auth().getUser(shareWithUserId);
    if (!targetUser) {
      throw new functions.https.HttpsError(
        "not-found",
        "Target user not found"
      );
    }

    // Create share record
    await db.collection("shared_entries").add({
      ownerId,
      entryId,
      sharedWith: shareWithUserId,
      sharedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
```

---

## Implementation Checklist

Before launching to production, complete these steps:

### Phase 1: Bot Protection (Week 1)

- [ ] Install Firebase App Check
- [ ] Get reCAPTCHA Enterprise site key
- [ ] Add App Check initialization to client
- [ ] Update Firestore rules to enforce App Check
- [ ] Test with debug token in development
- [ ] Deploy to production

### Phase 2: Rate Limiting (Week 2)

- [ ] Set up Firebase Functions project
- [ ] Implement rate-limited Cloud Functions
- [ ] Add auth token verification
- [ ] Deploy Cloud Functions
- [ ] Update client to use Cloud Functions
- [ ] Test rate limiting with burst requests
- [ ] Monitor Cloud Functions metrics

### Phase 3: Server-Side Validation (Week 3)

- [ ] Move validation logic to Cloud Functions
- [ ] Add server-side Zod schema validation
- [ ] Implement audit logging
- [ ] Add monitoring alerts (Sentry/LogRocket)
- [ ] Test with malicious payloads
- [ ] Document security model

### Phase 4: Monitoring (Week 4)

- [ ] Set up Firebase Performance Monitoring
- [ ] Add Cloud Functions metrics dashboard
- [ ] Configure billing alerts ($50, $100, $500 thresholds)
- [ ] Set up security event logging
- [ ] Create incident response runbook

---

## Cost Estimates

### Current Costs (No Server-Side Security)

- **Firestore:** ~$5-10/month for normal usage
- **Authentication:** Free (anonymous auth)
- **Risk:** $10,000+ if attacked

### With App Check + Cloud Functions

- **Firestore:** ~$5-10/month (unchanged)
- **App Check:** Free for up to 500K/month (~16K/day)
- **Cloud Functions:**
  - Free tier: 2M invocations/month
  - Estimated: $5-15/month for typical SoNash usage
  - Spike protection: Set billing limit to prevent runaway costs
- **reCAPTCHA Enterprise:** Free for up to 1M assessments/month
- **Total:** ~$15-30/month
- **Risk Reduction:** 99%+ (attacker would need to bypass reCAPTCHA + App Check)

### ROI Analysis

- **Cost:** $15-30/month
- **Risk Prevented:** $10,000+ potential bill from attack
- **ROI:** 333x - 666x return on investment
- **Recommendation:** **IMPLEMENT IMMEDIATELY**

---

## Testing Your Security

### Test 1: App Check Bypass Attempt

```bash
# Try to write to Firestore without App Check token
curl -X POST https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default)/documents/users/test \
  -H "Content-Type: application/json" \
  -d '{"fields": {"nickname": {"stringValue": "hacker"}}}'

# Expected: 401 Unauthorized (App Check missing)
```

### Test 2: Rate Limit Bypass Attempt

```bash
# Try to make 100 requests in 1 second
for i in {1..100}; do
  curl -X POST https://your-cloud-function.net/saveDailyLog &
done

# Expected: First 10 succeed, rest get 429 Too Many Requests
```

### Test 3: Authorization Bypass Attempt

```javascript
// Try to write to another user's data
const maliciousWrite = await setDoc(
  doc(db, "users", "VICTIM_USER_ID", "daily_logs", "today"),
  {
    hacked: true,
  }
);

// Expected: Permission denied (Firestore rules reject)
```

---

## Migration Strategy

### Option A: Big Bang (Recommended)

1. Implement all features in staging environment
2. Test thoroughly for 1 week
3. Deploy to production in single release
4. Monitor for 48 hours
5. Rollback plan: Disable Cloud Functions, keep direct Firestore

### Option B: Gradual Rollout

1. Week 1: Deploy App Check (non-blocking, monitoring only)
2. Week 2: Enable App Check enforcement
3. Week 3: Deploy Cloud Functions (behind feature flag)
4. Week 4: Migrate 10% of traffic to Cloud Functions
5. Week 5: Migrate 100% of traffic

**Recommendation:** Option A (Big Bang) - Security shouldn't be gradual

---

## Emergency Response

### If You See Unusual Firestore Bill

1. **Immediate (< 5 minutes)**

   ```bash
   # Disable public access to Firestore
   firebase firestore:rules:disable
   ```

2. **Short-term (< 1 hour)**
   - Review Firebase Console → Usage tab
   - Identify attacking IP addresses
   - Add IP blocks in Cloud Armor (if using)
   - Check for leaked API keys on GitHub

3. **Long-term (< 1 day)**
   - Implement server-side rate limiting
   - Rotate Firebase API keys
   - Add Firebase App Check
   - Set up billing alerts

---

## Questions?

- **Firebase Docs:** https://firebase.google.com/docs/app-check
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **Firestore Security:**
  https://firebase.google.com/docs/firestore/security/rules-conditions

---

## AI Instructions

When helping with server-side security:

1. App Check issues: Check APPCHECK_SETUP.md first
2. Rate limiting: Verify Cloud Functions are deployed with proper limits
3. Never expose API keys or secrets in client code
4. Always recommend server-side validation over client-side only
5. Reference this doc's Implementation Checklist for launch readiness

---

## Version History

| Version | Date       | Changes                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------ |
| 1.1     | 2026-01-03 | Added Tier 2 sections (Purpose, Quick Start, AI Instructions, Version History) |
| 1.0     | 2025-12-12 | Initial creation                                                               |
