<!-- TDMS: All actionable findings from this report have been ingested into
     MASTER_DEBT.jsonl. This file is archived for historical reference only.
     Do not add new findings here — use the TDMS intake process. -->

# Billing Alerts Setup Guide

> **Purpose:** Configure GCP billing alerts to prevent runaway costs from
> attacks or bugs.

## Prerequisites

- Access to GCP Console (you must be a billing administrator)
- Firebase project linked to a GCP billing account

---

## Step 1: Access Billing Console

1. Go to [GCP Console](https://console.cloud.google.com)
2. Select your project (sonash-7ac00 or similar)
3. Navigate to **Billing** → **Budgets & alerts**

---

## Step 2: Create Budget Alerts

Click **Create Budget** and configure the following thresholds:

### Budget 1: Early Warning ($50)

| Field            | Value                |
| ---------------- | -------------------- |
| Name             | SoNash Early Warning |
| Budget type      | Specified amount     |
| Target amount    | $50                  |
| Alert thresholds | 50%, 90%, 100%       |
| Email recipients | Your email           |

### Budget 2: Concern Level ($100)

| Field            | Value                          |
| ---------------- | ------------------------------ |
| Name             | SoNash Concern                 |
| Target amount    | $100                           |
| Alert thresholds | 75%, 90%, 100%                 |
| Email recipients | Your email + secondary contact |

### Budget 3: Emergency ($500)

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| Name             | SoNash Emergency                     |
| Target amount    | $500                                 |
| Alert thresholds | 80%, 100%                            |
| Email recipients | All team members                     |
| Optional         | Enable Pub/Sub for automated actions |

---

## Step 3: Expected Costs

Under normal usage for SoNash:

| Service         | Expected Monthly Cost   |
| --------------- | ----------------------- |
| Firestore       | $5-10                   |
| Cloud Functions | $5-15                   |
| App Check       | Free (under 500K/month) |
| Authentication  | Free (anonymous auth)   |
| **Total**       | **$10-25/month**        |

---

## Step 4: Verify Configuration

1. Return to **Budgets & alerts** dashboard
2. Verify all three budgets appear with correct thresholds
3. Send a test notification (optional)

---

## Emergency Response

If you receive a $500+ alert:

1. **Immediately** check Firebase Console → Usage tab
2. Review Cloud Functions logs for unusual patterns
3. Consider temporarily disabling public access:
   ```bash
   # Emergency: disable all writes
   firebase firestore:rules:deploy --only firestore
   ```
   (with rules that block all writes)
4. Contact Firebase support if attack is ongoing

---

## Related Documentation

- [docs/INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Full incident response
  procedures
- [docs/SERVER_SIDE_SECURITY.md](./SERVER_SIDE_SECURITY.md) - Security
  implementation details

---

**Last Updated:** 2025-12-13
