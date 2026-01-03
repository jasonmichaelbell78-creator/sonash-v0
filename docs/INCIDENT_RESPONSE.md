# Incident Response Runbook

**Last Updated:** 2026-01-03
**Document Tier:** 2 (Active Reference)
**Status:** Active

---

## Purpose

Documented procedures for responding to security incidents, cost spikes, and service outages in the SoNash application.

---

## Quick Start

**On detecting an incident:**
1. Classify severity (P0-P3) using table below
2. For P0-P1: Start timer, notify stakeholders immediately
3. Follow response procedure for incident type
4. Document timeline as you work
5. Complete post-incident review within 48 hours

---

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Cost Spike Response](#cost-spike-response)
3. [Security Event Response](#security-event-response)
4. [Service Outage Response](#service-outage-response)
5. [Post-Incident Review](#post-incident-review)

---

## Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **P0 - Critical** | Data breach, $500+ cost spike, full outage | Immediate (< 15 min) |
| **P1 - High** | Security event pattern, $100+ cost spike | < 1 hour |
| **P2 - Medium** | Unusual error rates, $50+ cost spike | < 4 hours |
| **P3 - Low** | Minor anomalies, single failed requests | Next business day |

---

## Cost Spike Response

### Severity Triggers

- **$50 alert**: Investigate during business hours
- **$100 alert**: Immediate investigation required
- **$500+ alert**: Emergency response

### Immediate Actions (< 5 minutes)

1. **Check Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com) → Usage
   - Identify which service is spiking (Firestore reads/writes, Functions invocations)

2. **Check Cloud Functions Logs**
   ```bash
   # View recent function invocations
   firebase functions:log --only saveDailyLog
   ```

3. **Look for Attack Patterns**
   - Same user ID with >100 requests/hour
   - Many different user IDs in rapid succession (bot farm)
   - Requests from unusual geographic regions

### Containment Actions

#### Option A: Disable Cloud Function (5 min fix)

```bash
# Temporarily disable the function
firebase functions:delete saveDailyLog --force
```

#### Option B: Emergency Firestore Rules (2 min fix)

Deploy restrictive rules that allow only reads:

```javascript
// firestore.rules (emergency mode)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads, block all writes
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

```bash
firebase deploy --only firestore:rules
```

#### Option C: Block Suspicious Users

If you identify specific malicious user IDs:

```typescript
// Add to Cloud Function temporarily
const BLOCKED_USERS = ['uid1', 'uid2', 'uid3'];

if (BLOCKED_USERS.includes(userId)) {
    throw new HttpsError('permission-denied', 'Account suspended');
}
```

### Recovery Steps

1. Investigate root cause (see logs analysis below)
2. Deploy fix to Cloud Function
3. Re-enable function with fix applied
4. Monitor for 24 hours

---

## Security Event Response

### Monitoring Security Logs

Security events are logged to GCP Cloud Logging. Search patterns:

```
# All security events
jsonPayload.securityEvent.type!=""

# Auth failures
jsonPayload.securityEvent.type="AUTH_FAILURE"

# Rate limit violations
jsonPayload.securityEvent.type="RATE_LIMIT_EXCEEDED"

# App Check failures (potential bots)
jsonPayload.securityEvent.type="APP_CHECK_FAILURE"

# Authorization failures (malicious access attempts)
jsonPayload.securityEvent.type="AUTHORIZATION_FAILURE"
```

### Response by Event Type

#### AUTH_FAILURE (Severity: Low-Medium)

- **Normal:** Occasional failures from session expiry
- **Suspicious:** >10 failures from same IP in 1 hour
- **Action:** Monitor; if pattern persists, investigate IP source

#### RATE_LIMIT_EXCEEDED (Severity: Medium)

- **Normal:** Rare, user misclicking rapidly
- **Suspicious:** Same user hitting limit repeatedly
- **Action:** Check if user is scripting; consider temporary block

#### APP_CHECK_FAILURE (Severity: High)

- **Normal:** Should be zero in production
- **Suspicious:** Any occurrence = potential bot/attack
- **Action:** Investigate immediately; may indicate API key theft

#### AUTHORIZATION_FAILURE (Severity: Critical)

- **Normal:** Should never occur
- **Suspicious:** ANY occurrence = active attack attempt
- **Action:** Immediately block userHash; investigate source

---

## Service Outage Response

### Symptoms

- Sentry alerts spike
- Users report errors
- Cloud Function health check fails

### Diagnosis

1. **Check Firebase Status**
   - [Firebase Status Dashboard](https://status.firebase.google.com/)

2. **Check Cloud Function Health**
   ```bash
   firebase functions:log --only saveDailyLog
   ```

3. **Check Sentry for Error Patterns**
   - Group errors by error type
   - Look for common stack trace

### Common Issues & Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 429 errors | Rate limiter cold start | Wait for warm-up; increase memory |
| 500 errors | Firestore connection | Check Firestore health |
| Timeout | Function taking >60s | Increase timeout or optimize |
| Memory errors | Memory limit exceeded | Increase memory allocation |

---

## Post-Incident Review

After every P0-P1 incident, complete within 48 hours:

### Incident Report Template

```markdown
## Incident Report: [Title]

**Date:** YYYY-MM-DD
**Severity:** P0/P1/P2
**Duration:** X hours
**Impact:** [Users affected, data lost, cost incurred]

### Timeline
- HH:MM - Incident detected
- HH:MM - Response initiated
- HH:MM - Containment achieved
- HH:MM - Resolution deployed

### Root Cause
[What actually caused the incident]

### What Went Well
- [Things that worked]

### What Went Poorly
- [Things that didn't work]

### Action Items
- [ ] [Preventive measure 1]
- [ ] [Preventive measure 2]

### Lessons Learned
[Key takeaways]
```

---

## Emergency Contacts

| Role | Contact | When to Escalate |
|------|---------|------------------|
| Firebase Support | [Console Support](https://console.firebase.google.com/support) | P0 incidents, billing disputes |
| GCP Billing | [Billing Support](https://cloud.google.com/support) | Cost spike >$500 |

---

## Appendix: Useful Commands

```bash
# View recent Cloud Function logs
firebase functions:log --only saveDailyLog

# Deploy updated security rules
firebase deploy --only firestore:rules

# Delete a problematic function
firebase functions:delete functionName

# View billing export (if configured)
bq query --use_legacy_sql=false 'SELECT * FROM billing_export LIMIT 100'
```

---

## AI Instructions

When helping with incident response:
1. First identify incident severity (P0-P3) based on impact
2. For cost spikes, immediately check Firebase Console usage
3. Never share or log user credentials or PII in incident reports
4. Recommend post-incident review for all P0-P1 incidents
5. Reference this document's procedures rather than improvising

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-01-03 | Added Tier 2 sections (Purpose, Quick Start, AI Instructions, Version History) |
| 1.0 | 2025-12-13 | Initial creation |
