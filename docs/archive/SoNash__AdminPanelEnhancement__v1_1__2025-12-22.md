# SoNash Admin Panel Enhancement

**Version:** v1.1  
**Created:** 2025-12-22  
**Updated:** 2025-12-22  
**Status:** In Progress  
**Owner:** Jason  
**Location:** `/docs/SoNash__AdminPanelEnhancement__v1_1__2025-12-22.md`

---

## Changelog

| Version | Date       | Changes                                                                                                                                                 |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0    | 2025-12-22 | Initial specification                                                                                                                                   |
| v1.1    | 2025-12-22 | Incorporated Qodo PR review feedback: switched to GCP Logging for audit trails, hybrid Sentry approach for errors, added explicit security requirements |

---

## Executive Summary

Enhance the existing SoNash admin panel (`/admin` route) with operational
monitoring capabilities including a system dashboard, enhanced user lookup,
error tracking, logging visibility, and background job monitoring.

**Approach:** Build custom within existing Next.js app, extending the current
tab-based admin pattern with shadcn/ui components. Leverage existing specialized
tools (Sentry, GCP Cloud Logging) rather than rebuilding their UIs.

---

## Current State Assessment

### Existing Admin Infrastructure

| Component                   | Status    | Notes                                                   |
| --------------------------- | --------- | ------------------------------------------------------- |
| Admin route (`/app/admin/`) | ✅ Exists | Client-side protected via Firebase custom claims        |
| Tab navigation              | ✅ Exists | 8 tabs currently (Meetings, Sober Living, Quotes, etc.) |
| `AdminCrudTable<T>`         | ✅ Exists | Reusable CRUD component                                 |
| Cloud Functions auth        | ✅ Exists | `requireAdmin()` helper in place                        |
| Firestore rules             | ✅ Exists | `isAdmin()` function defined                            |
| Sentry integration          | ✅ Exists | Initialized in Cloud Functions                          |
| `logSecurityEvent()`        | ✅ Exists | Writes to GCP Cloud Logging (immutable)                 |
| Users tab                   | ✅ Exists | Basic user list (to be enhanced)                        |

### Identified Gaps

| Gap                                  | Impact                           | Resolution Phase |
| ------------------------------------ | -------------------------------- | ---------------- |
| No system health visibility          | Can't tell if services are down  | Phase 1          |
| No user activity metrics             | Don't know engagement levels     | Phase 1          |
| Basic user lookup only               | Can't debug user-specific issues | Phase 2          |
| No scheduled job monitoring          | Jobs could fail silently         | Phase 3          |
| Errors only in Sentry UI             | Context switching to debug       | Phase 4          |
| Logs only in GCP Console             | No quick access from admin       | Phase 5          |
| `cleanupOldRateLimits` not scheduled | Rate limit docs accumulate       | Phase 3          |
| No `lastActive` tracking             | Can't measure active users       | Phase 1          |

---

## Architecture

### New Tab Structure

```
Admin Panel Tabs (Updated Order)
├── Dashboard      ← NEW (Phase 1)
├── Users          ← ENHANCED (Phase 2)
├── Errors         ← NEW (Phase 4) - Summary + Sentry deep links
├── Logs           ← NEW (Phase 5) - Recent events + GCP deep links
├── Jobs           ← NEW (Phase 3)
├── Meetings       (existing)
├── Sober Living   (existing)
├── Quotes         (existing)
├── Slogans        (existing)
├── Links          (existing)
├── Prayers        (existing)
└── Glossary       (existing)
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL                              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │Dashboard │  Users   │  Errors  │   Logs   │   Jobs   │       │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘       │
└───────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Firestore│ │Firestore│ │ Sentry  │ │  GCP    │ │Firestore│
   │ Counts  │ │ /users  │ │   API   │ │ Cloud   │ │  admin  │
   │+ Health │ │+ Logs   │ │ Summary │ │ Logging │ │  _jobs  │
   │         │ │         │ │+ Links  │ │ + Links │ │         │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### New Firestore Collections

```
/admin_jobs/{jobId}
├── name: string
├── description: string
├── schedule: string (human-readable)
├── cronExpression: string
├── lastRun: Timestamp | null
├── lastRunStatus: "success" | "failed" | "running" | "unknown"
├── lastRunDuration: number (ms) | null
├── lastError: string | null
├── nextRun: Timestamp | null
└── enabled: boolean

/_health/ping
└── lastCheck: Timestamp (used by health check)
```

**Note:** Security/audit logs remain in GCP Cloud Logging (immutable,
compliant). We do NOT create a Firestore `admin_logs` collection for security
events — this was removed per security review.

### Firestore Rules for New Collections

Add to `firestore.rules`:

```javascript
// Admin jobs registry - read by admins, write only by Cloud Functions
match /admin_jobs/{jobId} {
  allow read: if isAdmin();
  allow write: if false; // Only Cloud Functions can write
}

// Health check document - admin only
match /_health/{docId} {
  allow read, write: if isAdmin();
}
```

---

## Security Requirements

### Admin Protection Layers

| Layer                    | Implementation                      | Status                  |
| ------------------------ | ----------------------------------- | ----------------------- |
| Client-side auth check   | `tokenResult.claims.admin === true` | ✅ Exists               |
| Cloud Function check     | `requireAdmin(request)`             | ✅ Exists               |
| Firestore rules          | `isAdmin()` function                | ✅ Exists               |
| Middleware (server-side) | Next.js middleware                  | ⚠️ Recommended addition |

### Cloud Function Security Requirements

**All new admin Cloud Functions MUST:**

1. Call `requireAdmin(request)` as first operation
2. Enforce App Check (`enforceAppCheck: true`)
3. Return only non-sensitive aggregated data
4. Hash/redact any user identifiers in responses
5. Log admin actions via `logSecurityEvent()`

### Audit Trail Requirements

**Security events MUST be logged to GCP Cloud Logging (immutable), NOT
Firestore.**

- Existing `logSecurityEvent()` already writes to GCP Cloud Logging ✅
- Configure log retention: 90+ days minimum for compliance
- Create log sink for long-term archival if needed

### Data Privacy

| Data Type        | Handling                              |
| ---------------- | ------------------------------------- |
| User IDs in logs | SHA-256 hashed, truncated to 12 chars |
| User activity    | Only accessible to admins             |
| Error details    | Sensitive data redacted               |
| Admin actions    | Full audit trail in GCP Cloud Logging |

---

## Implementation Phases

---

## Phase 1: Dashboard + Foundations

**Status:** 🔄 In Progress  
**Priority:** High  
**Effort:** Medium  
**Value:** High — instant system visibility

### Objectives

- [ ] System health at a glance (Firestore, Auth, Functions status)
- [ ] Active user metrics (24h, 7d, 30d)
- [ ] Recent signups list
- [ ] Background jobs status overview
- [ ] Foundation for future phases (collections, tracking)

### New Files

| File                                 | Type      | Purpose      |
| ------------------------------------ | --------- | ------------ |
| `components/admin/dashboard-tab.tsx` | Component | Dashboard UI |

### Modified Files

| File                              | Changes                                          |
| --------------------------------- | ------------------------------------------------ |
| `functions/src/admin.ts`          | Add `adminHealthCheck`, `adminGetDashboardStats` |
| `functions/src/index.ts`          | Export new functions (if needed)                 |
| `components/admin/admin-tabs.tsx` | Add Dashboard tab (first position)               |
| Auth provider / firebase.ts       | Add `lastActive` timestamp updates               |
| `firestore.indexes.json`          | Add indexes for queries                          |
| `firestore.rules`                 | Add rules for `/_health` and `/admin_jobs`       |

### Cloud Functions

**Security:** Both functions MUST call `requireAdmin(request)` and enforce App
Check.

#### `adminHealthCheck`

```typescript
// Returns: { firestore: boolean, auth: boolean, timestamp: string }
// Tests connectivity to Firestore and Auth services
// MUST: enforceAppCheck: true, call requireAdmin(request)
// MUST NOT: Return sensitive configuration or user data
```

#### `adminGetDashboardStats`

```typescript
// Returns:
// - activeUsers: { last24h, last7d, last30d } (counts only)
// - totalUsers: number
// - recentSignups: Array<{ id, nickname, createdAt, authProvider }> (no PII)
// - jobStatuses: Array<{ id, name, lastRunStatus, lastRun }>
// - generatedAt: string
// MUST: enforceAppCheck: true, call requireAdmin(request)
// MUST NOT: Return emails, full user profiles, or sensitive data
```

### User Activity Tracking

Add to auth state listener:

```typescript
if (user && !user.isAnonymous) {
  updateDoc(doc(db, "users", user.uid), {
    lastActive: serverTimestamp(),
  }).catch(console.warn);
}
```

### Verification Checklist

- [ ] Cloud Functions compile without errors
- [ ] Both functions call `requireAdmin()`
- [ ] Dashboard tab appears first in admin panel
- [ ] Health check shows green for all services
- [ ] User counts display correctly (no PII exposed)
- [ ] Recent signups list populates (nicknames only)
- [ ] No console errors on load
- [ ] `lastActive` updates on app load
- [ ] Firestore rules deployed for new collections

---

## Phase 2: Enhanced User Lookup

**Status:** ⏳ Planned  
**Priority:** High  
**Effort:** Medium  
**Value:** High — "what's happening with this user?"

### Objectives

- [ ] Search users by email, UID, or nickname
- [ ] User detail drawer with full profile
- [ ] Activity timeline (daily logs, journal entries)
- [ ] Account actions (disable, export data)
- [ ] Admin notes field

### New Files

| File                                      | Type      | Purpose                     |
| ----------------------------------------- | --------- | --------------------------- |
| `components/admin/user-detail-drawer.tsx` | Component | Slide-out user detail panel |

### Modified Files

| File                             | Changes                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `components/admin/users-tab.tsx` | Add search, click-to-detail, enhanced UI                        |
| `functions/src/admin.ts`         | Add `adminGetUserDetail`, `adminUpdateUser`, `adminDisableUser` |

### Cloud Functions

**Security:** All functions MUST call `requireAdmin(request)` and log admin
actions.

#### `adminGetUserDetail`

```typescript
// Input: { uid: string }
// Returns:
// - profile: User document data
// - recentActivity: Merged & sorted daily_logs + journal_entries (last 30)
// - stats: { totalJournalEntries, totalCheckIns, streakDays }
// MUST: Log this admin action via logSecurityEvent()
```

#### `adminUpdateUser`

```typescript
// Input: { uid: string, updates: { adminNotes?: string, ... } }
// Allows admin to update specific user fields
// MUST: Log this admin action via logSecurityEvent()
```

#### `adminDisableUser`

```typescript
// Input: { uid: string, disabled: boolean }
// Sets disabled flag + revokes refresh tokens
// MUST: Log this admin action via logSecurityEvent()
```

### Verification Checklist

- [ ] All functions call `requireAdmin()`
- [ ] Admin actions logged to GCP Cloud Logging
- [ ] Search returns correct results for email, UID, nickname
- [ ] User detail drawer opens on row click
- [ ] Activity timeline loads and paginates
- [ ] Disable/enable user works
- [ ] Admin notes save correctly
- [ ] Export user data generates valid JSON

---

## Phase 3: Background Jobs Monitoring

**Status:** ⏳ Planned  
**Priority:** Medium  
**Effort:** Low  
**Value:** Medium — peace of mind on scheduled tasks

### Objectives

- [ ] Jobs registry in Firestore (`/admin_jobs`)
- [ ] Job wrapper for status tracking
- [ ] Jobs tab UI
- [ ] Manual trigger capability
- [ ] Schedule `cleanupOldRateLimits` in Cloud Scheduler

### New Files

| File                            | Type      | Purpose                           |
| ------------------------------- | --------- | --------------------------------- |
| `components/admin/jobs-tab.tsx` | Component | Jobs monitoring UI                |
| `functions/src/jobs.ts`         | Functions | Job wrapper + scheduled functions |

### Modified Files

| File                              | Changes                    |
| --------------------------------- | -------------------------- |
| `functions/src/index.ts`          | Export scheduled functions |
| `components/admin/admin-tabs.tsx` | Add Jobs tab               |

### Job Wrapper Pattern

```typescript
async function runJob(jobId: string, jobFn: () => Promise<void>) {
  const jobRef = db.doc(`admin_jobs/${jobId}`);
  const startTime = Date.now();

  await jobRef.update({
    lastRunStatus: "running",
    lastRun: FieldValue.serverTimestamp(),
  });

  try {
    await jobFn();
    await jobRef.update({
      lastRunStatus: "success",
      lastRunDuration: Date.now() - startTime,
      lastError: null,
    });
    logSecurityEvent("JOB_SUCCESS", {
      jobId,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    await jobRef.update({
      lastRunStatus: "failed",
      lastRunDuration: Date.now() - startTime,
      lastError: error.message,
    });
    logSecurityEvent("JOB_FAILURE", { jobId, error: error.message });
    throw error;
  }
}
```

### Jobs to Register

| Job ID                 | Name                | Schedule      | Description                          |
| ---------------------- | ------------------- | ------------- | ------------------------------------ |
| `cleanupOldRateLimits` | Cleanup Rate Limits | Daily 3 AM CT | Removes expired rate limit documents |

### Verification Checklist

- [ ] Jobs tab displays all registered jobs
- [ ] Status badges show correct colors
- [ ] Last run time displays correctly
- [ ] Manual trigger works (calls `requireAdmin()`)
- [ ] Failed jobs show error message
- [ ] Cloud Scheduler configured for `cleanupOldRateLimits`
- [ ] Job runs logged to GCP Cloud Logging

---

## Phase 4: Error Tracking (Sentry Integration)

**Status:** ⏳ Planned  
**Priority:** High  
**Effort:** Low-Medium  
**Value:** High — catch issues before users report

### Approach: Hybrid Summary + Deep Links

**Do NOT rebuild Sentry's UI.** Instead:

1. Show a summary card with error count and last 5 errors (plain English)
2. Provide deep links to Sentry for full details
3. Correlate user IDs for cross-referencing

### Objectives

- [ ] Error summary card on Dashboard (count + trend)
- [ ] Errors tab with recent errors in plain English
- [ ] Deep links to Sentry for each error
- [ ] User ID correlation (link to user detail if available)

### New Files

| File                              | Type      | Purpose                            |
| --------------------------------- | --------- | ---------------------------------- |
| `components/admin/errors-tab.tsx` | Component | Error summary UI with Sentry links |
| `lib/sentry-admin.ts`             | Utility   | Sentry API client (summary only)   |
| `lib/error-translations.ts`       | Utility   | Error code → plain English mapping |

### Modified Files

| File                              | Changes                                                |
| --------------------------------- | ------------------------------------------------------ |
| `components/admin/admin-tabs.tsx` | Add Errors tab                                         |
| `.env.local`                      | Add `SENTRY_API_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |

### Error Translation Map

```typescript
const ERROR_TRANSLATIONS: Record<string, string> = {
  "auth/invalid-credential":
    "User entered wrong password or account doesn't exist",
  "permission-denied":
    "User tried to access data they don't have permission for",
  unauthenticated: "User's session expired or they weren't logged in",
  "resource-exhausted": "Rate limit hit — too many requests",
  "deadline-exceeded":
    "Request took too long (slow connection or overloaded function)",
  "not-found": "Requested data doesn't exist",
  "already-exists": "Tried to create something that already exists",
  internal: "Something went wrong on our end",
  unavailable: "Service temporarily unavailable",
};
```

### UI Design

| Element            | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| Error Count Card   | "12 errors in last 24h" with trend indicator                      |
| Recent Errors List | Last 5-10 errors with plain English description                   |
| Each Error Row     | Time, What Happened, User (if available), "View in Sentry →" link |
| Sentry Deep Link   | Opens Sentry issue page directly                                  |

### Sentry API (Minimal)

```typescript
// lib/sentry-admin.ts
export async function fetchErrorSummary(hours = 24) {
  const response = await fetch(
    `https://sentry.io/api/0/projects/${ORG}/${PROJECT}/issues/?statsPeriod=${hours}h&query=is:unresolved`,
    { headers: { Authorization: `Bearer ${SENTRY_API_TOKEN}` } }
  );
  const issues = await response.json();
  return {
    count: issues.length,
    recent: issues.slice(0, 10).map((issue) => ({
      id: issue.id,
      title: issue.title,
      count: issue.count,
      lastSeen: issue.lastSeen,
      link: issue.permalink,
    })),
  };
}
```

### Verification Checklist

- [ ] Sentry API connection works
- [ ] Error count displays on dashboard
- [ ] Errors tab shows recent errors with translations
- [ ] Deep links open correct Sentry issue
- [ ] User correlation works (when user ID available)

---

## Phase 5: System Logs (GCP Cloud Logging Integration)

**Status:** ⏳ Planned  
**Priority:** Medium  
**Effort:** Low  
**Value:** Medium — quick access to recent events

### Approach: Recent Events + Deep Links

**Do NOT rebuild GCP Cloud Logging UI.** Instead:

1. Show recent security events (last 20-50)
2. Provide filtered deep link to GCP Console for full logs
3. Ensure structured logging is in place

### Objectives

- [ ] Recent security events display (from existing `logSecurityEvent()`)
- [ ] Deep link to GCP Cloud Logging Console (pre-filtered)
- [ ] Verify log retention is configured (90+ days)
- [ ] Optional: Create log sink for long-term archival

### Implementation Notes

Your existing `logSecurityEvent()` already writes to GCP Cloud Logging. This
phase is about:

1. **Visibility:** Adding a Logs tab that shows recent events
2. **Access:** Providing a quick link to GCP Console
3. **Retention:** Ensuring logs are kept long enough for compliance

### New Files

| File                            | Type      | Purpose                     |
| ------------------------------- | --------- | --------------------------- |
| `components/admin/logs-tab.tsx` | Component | Recent logs + GCP deep link |

### GCP Console Deep Link

```typescript
const GCP_LOGS_URL = `https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_function%22%0Aresource.labels.function_name%3D%22logSecurityEvent%22;project=${PROJECT_ID}`;
```

### UI Design

| Element             | Description                                        |
| ------------------- | -------------------------------------------------- |
| Recent Events List  | Last 20 security events from Cloud Functions       |
| Event Row           | Time, Event Type, Level badge, Details (truncated) |
| "View All in GCP →" | Deep link to GCP Cloud Logging Console             |
| Filter Hint         | Show the GCP query string so admins can modify     |

### Cloud Function for Recent Logs

```typescript
// Optional: Fetch recent logs from Cloud Logging API
// Or: Write last N events to a small Firestore collection for quick display
// Recommendation: Start with just the deep link, add API fetch if needed
```

### Verification Checklist

- [ ] Logs tab displays recent security events
- [ ] Deep link opens GCP Console with correct filter
- [ ] Log retention configured in GCP (90+ days)
- [ ] Structured logging includes all required fields

---

## Environment Variables

### New Variables Required

| Variable           | Phase | Purpose                             |
| ------------------ | ----- | ----------------------------------- |
| `SENTRY_API_TOKEN` | 4     | Sentry API access for error summary |
| `SENTRY_ORG`       | 4     | Sentry organization slug            |
| `SENTRY_PROJECT`   | 4     | Sentry project slug                 |

---

## Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "lastActive", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "createdAt", "order": "DESCENDING" }]
    }
  ]
}
```

---

## Recommended: Add Server-Side Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const session = request.cookies.get("__session");
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
```

---

## Testing Strategy

### Unit Tests

| Component                | Test Cases                               |
| ------------------------ | ---------------------------------------- |
| `dashboard-tab.tsx`      | Loading state, error state, data display |
| `error-translations.ts`  | All error codes translate correctly      |
| `user-detail-drawer.tsx` | Opens/closes, displays data              |

### Integration Tests

| Flow           | Validation                            |
| -------------- | ------------------------------------- |
| Dashboard load | All stats populate, no errors         |
| User search    | Returns correct results               |
| Job status     | Reflects actual Cloud Scheduler state |
| Error display  | Matches Sentry data                   |

### Manual Testing Checklist

- [ ] Load dashboard with no users → shows zeros
- [ ] Load dashboard with users → shows correct counts
- [ ] Search for non-existent user → shows "no results"
- [ ] Trigger job manually → status updates
- [ ] Generate error → appears in Errors tab
- [ ] Deep links work (Sentry, GCP Console)

---

## Rollout Plan

| Phase                | Target   | Dependencies                        |
| -------------------- | -------- | ----------------------------------- |
| Phase 1: Dashboard   | Week 1   | None                                |
| Phase 2: User Lookup | Week 2   | Phase 1 (`lastActive` tracking)     |
| Phase 3: Jobs        | Week 2-3 | Phase 1 (jobs display on dashboard) |
| Phase 4: Errors      | Week 3   | Sentry API token                    |
| Phase 5: Logs        | Week 4   | GCP Console access configured       |

---

## Success Metrics

| Metric                 | Target                        | Measurement                |
| ---------------------- | ----------------------------- | -------------------------- |
| Time to identify issue | < 2 minutes                   | Manual timing              |
| Dashboard load time    | < 3 seconds                   | Performance monitoring     |
| Error visibility       | 100% of Cloud Function errors | Compare Sentry vs. summary |
| Job failure detection  | < 1 hour after failure        | Alert setup                |

---

## Open Questions / Parking Lot

| ID     | Question                                                | Priority | Status                    |
| ------ | ------------------------------------------------------- | -------- | ------------------------- |
| AP-001 | Should we add email alerts for job failures?            | M        | Deferred                  |
| AP-002 | Rate limiting on admin endpoints?                       | L        | Deferred                  |
| AP-003 | Admin action approval workflow for destructive actions? | L        | Deferred                  |
| AP-004 | Export all user data as ZIP for GDPR requests?          | M        | Deferred                  |
| AP-005 | Embed Sentry widget vs. API fetch?                      | L        | Deferred — start with API |

---

**End of Document**
