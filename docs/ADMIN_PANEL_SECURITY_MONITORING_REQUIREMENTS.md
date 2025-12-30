# Admin Panel Security & Monitoring Requirements

**Created:** 2025-12-30
**Related:** SoNash Admin Panel Enhancement v1.4 (M1.6)
**Context:** reCAPTCHA optional implementation & network compatibility fixes

---

## Overview

This document outlines security monitoring and logging requirements for the SoNash Admin Panel (Phases 4 & 5). These requirements emerged from implementing optional reCAPTCHA verification to support corporate networks that block Google reCAPTCHA.

---

## Background: reCAPTCHA Optional Implementation

### The Problem
- Corporate networks (hospitals, treatment centers, sober living facilities) often block Google reCAPTCHA Enterprise
- Users on these networks couldn't use the app (all writes returned 400 errors)
- Recovery apps MUST work in treatment facilities where users need them most

### The Solution (Option A: Optional reCAPTCHA)
- Made reCAPTCHA tokens optional in backend verification
- Log `RECAPTCHA_MISSING_TOKEN` (WARNING) when tokens absent
- Maintain all other security layers (auth, rate limiting, validation, authorization)
- Still verify reCAPTCHA tokens when present (~80-90% of users)

### Security Trade-offs
**Still Protected By:**
- ✅ Firebase Authentication (required)
- ✅ Rate limiting (10 req/min writes, 5 req/5min migrations)
- ✅ Input validation (Zod schemas)
- ✅ Authorization (user can only write own data)
- ✅ Server-side timestamps

**Lost Protection:**
- ⚠️ reCAPTCHA bot detection when token missing (10-20% of users)

---

## Required Admin Panel Features

### 🎯 Phase 4: Error Tracking Enhancement

#### reCAPTCHA Monitoring Dashboard

**Widget: "reCAPTCHA Health"**

Display metrics:
```typescript
{
  totalRequests: number;           // Last 24h
  requestsWithToken: number;       // Successful reCAPTCHA verifications
  requestsWithoutToken: number;    // Missing tokens (WARNING events)
  missingTokenRate: number;        // % of requests without tokens
  averageScore: number;            // Average reCAPTCHA score (0.0-1.0)
  lowScoreRejections: number;      // Requests rejected for low score
  networkBlockedEstimate: number;  // Estimated blocked by network
}
```

**Alert Thresholds:**
- 🟢 Normal: <10% missing tokens
- 🟡 Warning: 10-20% missing tokens (monitor)
- 🔴 Critical: >20% missing tokens (investigate)

**Actions:**
- View recent `RECAPTCHA_MISSING_TOKEN` events
- Filter by userId to identify affected users
- Export for analysis

---

#### Security Event Trends

**Widget: "Security Events Timeline"**

Chart showing:
```typescript
type SecurityTrendData = {
  timestamp: Date;
  eventCounts: {
    AUTH_FAILURE: number;
    RATE_LIMIT_EXCEEDED: number;
    RECAPTCHA_MISSING_TOKEN: number;
    RECAPTCHA_LOW_SCORE: number;
    RECAPTCHA_INVALID_TOKEN: number;
    VALIDATION_FAILURE: number;
    AUTHORIZATION_FAILURE: number;
  };
}[];
```

**Features:**
- 24h/7d/30d views
- Spike detection (>3σ above baseline)
- Click event type → drill down to logs
- Export CSV for analysis

**Spike Alerts:**
- Sudden increase in `RECAPTCHA_MISSING_TOKEN` → possible reCAPTCHA Enterprise outage
- Sudden increase in `RATE_LIMIT_EXCEEDED` → possible DDoS or scraping
- Sudden increase in `RECAPTCHA_LOW_SCORE` → bot attack

---

### 🎯 Phase 5: Logs Tab Enhancement

#### Quick Filters

Add pre-configured filters for security events:

```typescript
const QUICK_FILTERS = [
  {
    label: "Missing reCAPTCHA Tokens",
    query: 'jsonPayload.securityEvent.type="RECAPTCHA_MISSING_TOKEN"',
    severity: "WARNING",
    description: "Requests without reCAPTCHA (corporate networks)"
  },
  {
    label: "Bot Detection Failures",
    query: 'jsonPayload.securityEvent.type="RECAPTCHA_LOW_SCORE"',
    severity: "WARNING",
    description: "Requests with suspicious reCAPTCHA scores"
  },
  {
    label: "Rate Limit Violations",
    query: 'jsonPayload.securityEvent.type="RATE_LIMIT_EXCEEDED"',
    severity: "WARNING",
    description: "Users hitting rate limits"
  },
  {
    label: "Failed Authentication",
    query: 'jsonPayload.securityEvent.type="AUTH_FAILURE"',
    severity: "ERROR",
    description: "Unauthenticated access attempts"
  },
  {
    label: "All Security Warnings",
    query: 'jsonPayload.securityEvent AND severity="WARNING"',
    severity: "WARNING",
    description: "All security warnings (24h)"
  }
];
```

#### Security Event Detail View

When clicking a log entry, show:

```typescript
interface SecurityEventDetail {
  // Event Identification
  type: SecurityEventType;
  timestamp: Date;
  functionName: string;
  severity: "INFO" | "WARNING" | "ERROR";

  // User Context
  userId?: string;              // Hashed (SHA-256, 12 chars)
  userEmail?: string;           // If available (from Cloud Function)

  // Event Details
  message: string;
  metadata?: {
    action?: string;           // reCAPTCHA action
    score?: number;            // reCAPTCHA score
    attemptedUserId?: string;  // For AUTHORIZATION_FAILURE
    [key: string]: unknown;
  };

  // Context
  ipAddress?: string;           // If available
  userAgent?: string;           // If available

  // Actions
  actions: {
    viewUser: () => void;       // Open user detail drawer
    viewRelatedEvents: () => void; // Filter logs by userId
    exportDetails: () => void;  // Export as JSON
  };
}
```

---

### 🎯 Admin Configuration

#### reCAPTCHA Settings Panel

**Location:** Dashboard → Settings → Security

```typescript
interface RecaptchaConfig {
  // Threshold Configuration
  minScore: number;              // Default: 0.5, Range: 0.0-1.0

  // Monitoring
  alertOnHighMissingRate: boolean;  // Alert if >20% missing
  alertOnLowScoreSpike: boolean;    // Alert if sudden increase

  // Enforcement (Future)
  requireTokenForActions: string[]; // Future: specific actions that REQUIRE token
  stricterRateLimitWithoutToken: boolean; // Future: 5 req/min instead of 10
}
```

**UI:**
```
┌─ reCAPTCHA Configuration ────────────────────────────┐
│                                                       │
│  Minimum Score Threshold: [====|====] 0.5            │
│  (0.0 = Very Likely Bot ← → 1.0 = Very Likely Human)│
│                                                       │
│  ☑ Alert when missing token rate exceeds 20%        │
│  ☑ Alert on sudden low-score spikes (>3σ)           │
│                                                       │
│  Current Stats (Last 24h):                           │
│  • Total Requests: 1,247                             │
│  • With reCAPTCHA: 1,089 (87.3%)                     │
│  • Without reCAPTCHA: 158 (12.7%) ✓ Normal           │
│  • Low Score Rejections: 3 (0.2%)                    │
│                                                       │
│  [Save Changes]                                      │
└───────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 4: Error Tracking (Sentry Integration)

- [ ] Add `RECAPTCHA_MISSING_TOKEN` to Sentry issue filters
- [ ] Create reCAPTCHA Health widget on Dashboard
- [ ] Implement Security Event Trends chart
- [ ] Add spike detection alerting
- [ ] Create reCAPTCHA monitoring queries in GCP

### Phase 5: Logs Tab

- [ ] Add Quick Filters for security events
- [ ] Implement Security Event Detail View
- [ ] Add "View Related Events" action
- [ ] Create Export functionality for investigations
- [ ] Add real-time log streaming (optional)

### Future Enhancements

- [ ] reCAPTCHA Settings panel in admin
- [ ] Configurable MIN_SCORE threshold
- [ ] Optional stricter rate limits for no-token requests
- [ ] IP-based pattern detection
- [ ] Automated bot blocking (careful - could block treatment centers)

---

## GCP Cloud Logging Queries

### Recent Missing reCAPTCHA Tokens
```
resource.type="cloud_function"
jsonPayload.securityEvent.type="RECAPTCHA_MISSING_TOKEN"
timestamp>="2025-12-30T00:00:00Z"
```

### Missing Token Rate (Last 24h)
```
resource.type="cloud_function"
(jsonPayload.securityEvent.type="RECAPTCHA_MISSING_TOKEN" OR
 jsonPayload.securityEvent.type="RECAPTCHA_SUCCESS")
timestamp>="2025-12-29T00:00:00Z"
```

### Low Score Rejections
```
resource.type="cloud_function"
jsonPayload.securityEvent.type="RECAPTCHA_LOW_SCORE"
timestamp>="2025-12-30T00:00:00Z"
```

### User-Specific Security Events
```
resource.type="cloud_function"
jsonPayload.securityEvent.userId="[HASHED_USER_ID]"
severity>="WARNING"
```

---

## Monitoring Best Practices

### Daily Checks
1. Review reCAPTCHA missing token rate (Dashboard widget)
2. Check for security event spikes (Trends chart)
3. Review Sentry errors related to authentication

### Weekly Reviews
1. Analyze missing token patterns (time of day, user segments)
2. Review rate limit violations (legitimate vs. abuse)
3. Assess reCAPTCHA score distribution

### Monthly Audits
1. Export security logs for compliance
2. Review and adjust MIN_SCORE if needed
3. Analyze bot detection effectiveness
4. Update rate limiting strategies if abuse detected

---

## Security Incident Response

### High Missing Token Rate (>20%)

**Possible Causes:**
1. reCAPTCHA Enterprise API outage
2. Network-wide blocking (ISP, country)
3. Client-side bug preventing token generation

**Response:**
1. Check Google Cloud Status Dashboard
2. Review recent frontend deployments
3. Check for errors in browser console (Sentry)
4. Consider temporary rate limit adjustments

### Sudden Low Score Spike

**Possible Causes:**
1. Bot attack targeting the app
2. Scraping attempt
3. Legitimate traffic from new user segment

**Response:**
1. Review affected userIds (are they new accounts?)
2. Check IP patterns (single source or distributed?)
3. Temporarily tighten MIN_SCORE if confirmed attack
4. Add temporary rate limit overrides for affected IPs

---

## Related Documentation

- [SoNash Admin Panel Enhancement v1.4](../docs/archive/SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)
- [Sentry Integration Guide](../docs/SENTRY_INTEGRATION_GUIDE.md)
- [Security Architecture](../docs/SECURITY.md)
- [Server-Side Security](../docs/SERVER_SIDE_SECURITY.md)
- [Incident Response](../docs/INCIDENT_RESPONSE.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-30 | Initial document created after implementing optional reCAPTCHA |
