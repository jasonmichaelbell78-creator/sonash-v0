# Admin Panel Security & Monitoring Requirements

**Document Version**: 2.0 **Created**: 2025-12-30 **Last Updated**: 2026-01-02
**Status**: PLANNING **Overall Completion**: 0% (0/11 tasks complete) **Target
Completion**: Q1 2026

---

## 📋 Purpose & Scope

### What This Document Covers

This document outlines security monitoring and logging requirements for the
SoNash Admin Panel (Phases 4 & 5). These requirements emerged from implementing
optional reCAPTCHA verification to support corporate networks that block Google
reCAPTCHA.

**Primary Goal**: Enable admins to monitor security events, track reCAPTCHA
health, and respond to security incidents through the admin panel.

**Scope**:

- ✅ **In Scope**:
  - reCAPTCHA monitoring dashboard
  - Security event trends visualization
  - Quick filters for security logs
  - Security event detail views
  - Admin configuration for reCAPTCHA
- ❌ **Out of Scope**:
  - Automated bot blocking
  - IP-based pattern detection
  - Real-time log streaming (deferred)

**Related To**:

- [M1.6 Admin Panel Phase 4](../ROADMAP.md#phase-4-error-tracking-sentry-integration-90-complete) -
  Error Tracking
- [M1.6 Admin Panel Phase 5](../ROADMAP.md#phase-5-system-logs-gcp-integration-in-sprint) -
  Logs Tab
- [SoNash Admin Panel Enhancement v1.4](./archive/SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)

---

## Quick Start

1. Review the implementation phases overview
2. Check current phase status
3. Follow phase-specific requirements

---

## 🗺️ STATUS DASHBOARD

| Task/Phase                  | ID   | Description                                     | Status       | Est. Hours | Dependencies |
| --------------------------- | ---- | ----------------------------------------------- | ------------ | ---------- | ------------ |
| **Phase 4: Error Tracking** |      |                                                 |              |            |              |
| Sentry Filter               | T4.1 | Add `RECAPTCHA_MISSING_TOKEN` to Sentry filters | **PENDING**  | 0.5h       | None         |
| reCAPTCHA Widget            | T4.2 | Create reCAPTCHA Health widget on Dashboard     | **PENDING**  | 2h         | T4.1         |
| Security Trends             | T4.3 | Implement Security Event Trends chart           | **PENDING**  | 3h         | T4.2         |
| Spike Detection             | T4.4 | Add spike detection alerting                    | **PENDING**  | 2h         | T4.3         |
| GCP Queries                 | T4.5 | Create reCAPTCHA monitoring queries             | **PENDING**  | 1h         | None         |
| **Phase 5: Logs Tab**       |      |                                                 |              |            |              |
| Quick Filters               | T5.1 | Add Quick Filters for security events           | **PENDING**  | 1.5h       | None         |
| Event Detail                | T5.2 | Implement Security Event Detail View            | **PENDING**  | 2h         | T5.1         |
| Related Events              | T5.3 | Add "View Related Events" action                | **PENDING**  | 1h         | T5.2         |
| Export                      | T5.4 | Create Export functionality                     | **PENDING**  | 1h         | T5.2         |
| **Future**                  |      |                                                 |              |            |              |
| Settings Panel              | TF.1 | reCAPTCHA Settings panel in admin               | **DEFERRED** | 2h         | T4.2         |
| Stricter Limits             | TF.2 | Stricter rate limits for no-token requests      | **DEFERRED** | 1h         | TF.1         |

**Progress Summary**:

- **Completed**: 0 tasks (0%)
- **In Progress**: 0 tasks
- **Blocked**: 9 tasks (waiting for M1.6 Phase 4-5 to start)
- **Deferred**: 2 tasks (future enhancements)

---

## 🎯 Background: reCAPTCHA Optional Implementation

### The Problem

- Corporate networks (hospitals, treatment centers, sober living facilities)
  often block Google reCAPTCHA Enterprise
- Users on these networks couldn't use the app (all writes returned 400 errors)
- Recovery apps MUST work in treatment facilities where users need them most

### The Solution (Option A: Optional reCAPTCHA)

- Made reCAPTCHA tokens optional in backend verification
- Log `RECAPTCHA_MISSING_TOKEN` (WARNING) when tokens absent
- Maintain all other security layers (auth, rate limiting, validation,
  authorization)
- Still verify reCAPTCHA tokens when present (~80-90% of users)

### Security Trade-offs

| Protection Layer        | Status      | Notes                                    |
| ----------------------- | ----------- | ---------------------------------------- |
| Firebase Authentication | ✅ Required | All requests authenticated               |
| Rate Limiting           | ✅ Active   | 10 req/min writes, 5 req/5min migrations |
| Input Validation        | ✅ Active   | Zod schemas                              |
| Authorization           | ✅ Active   | User can only write own data             |
| Server-side Timestamps  | ✅ Active   | Prevents timestamp manipulation          |
| reCAPTCHA Bot Detection | ⚠️ Optional | Missing for ~10-20% of users             |

---

## 📋 Requirements

### Phase 4: Error Tracking Enhancement

#### reCAPTCHA Monitoring Dashboard

**Widget: "reCAPTCHA Health"**

Display metrics:

```typescript
{
  totalRequests: number; // Last 24h
  requestsWithToken: number; // Successful reCAPTCHA verifications
  requestsWithoutToken: number; // Missing tokens (WARNING events)
  missingTokenRate: number; // % of requests without tokens
  averageScore: number; // Average reCAPTCHA score (0.0-1.0)
  lowScoreRejections: number; // Requests rejected for low score
  networkBlockedEstimate: number; // Estimated blocked by network
}
```

**Alert Thresholds:**

- 🟢 Normal: <10% missing tokens
- 🟡 Warning: 10-20% missing tokens (monitor)
- 🔴 Critical: >20% missing tokens (investigate)

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

- Sudden increase in `RECAPTCHA_MISSING_TOKEN` → possible reCAPTCHA Enterprise
  outage
- Sudden increase in `RATE_LIMIT_EXCEEDED` → possible DDoS or scraping
- Sudden increase in `RECAPTCHA_LOW_SCORE` → bot attack

---

### Phase 5: Logs Tab Enhancement

#### Quick Filters

Pre-configured filters for security events:

```typescript
const QUICK_FILTERS = [
  {
    label: "Missing reCAPTCHA Tokens",
    query: 'jsonPayload.securityEvent.type="RECAPTCHA_MISSING_TOKEN"',
    severity: "WARNING",
    description: "Requests without reCAPTCHA (corporate networks)",
  },
  {
    label: "Bot Detection Failures",
    query: 'jsonPayload.securityEvent.type="RECAPTCHA_LOW_SCORE"',
    severity: "WARNING",
    description: "Requests with suspicious reCAPTCHA scores",
  },
  {
    label: "Rate Limit Violations",
    query: 'jsonPayload.securityEvent.type="RATE_LIMIT_EXCEEDED"',
    severity: "WARNING",
    description: "Users hitting rate limits",
  },
  {
    label: "Failed Authentication",
    query: 'jsonPayload.securityEvent.type="AUTH_FAILURE"',
    severity: "ERROR",
    description: "Unauthenticated access attempts",
  },
  {
    label: "All Security Warnings",
    query: 'jsonPayload.securityEvent AND severity="WARNING"',
    severity: "WARNING",
    description: "All security warnings (24h)",
  },
];
```

#### Security Event Detail View

```typescript
interface SecurityEventDetail {
  // Event Identification
  type: SecurityEventType;
  timestamp: Date;
  functionName: string;
  severity: "INFO" | "WARNING" | "ERROR";

  // User Context
  userId?: string; // Hashed (SHA-256, 12 chars)
  userEmail?: string; // If available

  // Event Details
  message: string;
  metadata?: {
    action?: string; // reCAPTCHA action
    score?: number; // reCAPTCHA score
    attemptedUserId?: string; // For AUTHORIZATION_FAILURE
    [key: string]: unknown;
  };

  // Actions
  actions: {
    viewUser: () => void; // Open user detail drawer
    viewRelatedEvents: () => void; // Filter logs by userId
    exportDetails: () => void; // Export as JSON
  };
}
```

---

### Admin Configuration (Future)

#### reCAPTCHA Settings Panel

**Location:** Dashboard → Settings → Security

```typescript
interface RecaptchaConfig {
  minScore: number; // Default: 0.5, Range: 0.0-1.0
  alertOnHighMissingRate: boolean; // Alert if >20% missing
  alertOnLowScoreSpike: boolean; // Alert if sudden increase
  stricterRateLimitWithoutToken: boolean; // Future: 5 req/min instead of 10
}
```

**UI Mockup:**

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
│                                                       │
│  [Save Changes]                                      │
└───────────────────────────────────────────────────────┘
```

---

## 🔍 GCP Cloud Logging Queries

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

## 📊 Monitoring Best Practices

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

## 🚨 Security Incident Response

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

## 📚 Related Documentation

- [SoNash Admin Panel Enhancement v1.4](./archive/SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)
- [Sentry Integration Guide](./SENTRY_INTEGRATION_GUIDE.md)
- [Security Architecture](./SECURITY.md)
- [Server-Side Security](./SERVER_SIDE_SECURITY.md)

---

## 🗓️ Version History

| Version | Date       | Changes                                      | Author           |
| ------- | ---------- | -------------------------------------------- | ---------------- |
| 2.0     | 2026-01-02 | Standardized structure per Phase 4 migration | Claude           |
| 1.0     | 2025-12-30 | Initial document created                     | Development Team |

---

## 🤖 AI Instructions

**For AI Assistants implementing these requirements:**

1. **Read this entire document** before implementing any feature
2. **Reference M1.6 Admin Panel spec** for UI patterns
3. **Follow Phase 4-5 order** - Error tracking before logs
4. **Use existing GCP queries** as starting point
5. **Maintain security context** - Never expose raw user IDs
6. **Test alert thresholds** with realistic data
7. **Update status dashboard** as tasks complete

**When implementing:**

```bash
# 1. Implement the feature
# 2. Update this document (check off task)
# 3. Commit with descriptive message
git add docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md
git commit -m "docs: Update Security Monitoring Requirements - completed task [ID]"
```

---

## 📝 Update Triggers

**Update this document when:**

- ✅ Task status changes
- ✅ New security event types added
- ✅ Alert thresholds adjusted
- ✅ GCP queries modified
- ✅ Incident response procedures updated

---

**END OF DOCUMENT**
