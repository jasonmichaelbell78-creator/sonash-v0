# SoNash Admin Panel Enhancement

**Version:** v1.0  
**Created:** 2024-12-22  
**Status:** In Progress  
**Owner:** Jason  

---

## Executive Summary

Enhance the existing SoNash admin panel (`/admin` route) with operational monitoring capabilities including a system dashboard, enhanced user lookup, error tracking, logging visibility, and background job monitoring.

**Approach:** Build custom within existing Next.js app, extending the current tab-based admin pattern with shadcn/ui components.

---

## Current State Assessment

### Existing Admin Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Admin route (`/app/admin/`) | ✅ Exists | Client-side protected via Firebase custom claims |
| Tab navigation | ✅ Exists | 8 tabs currently (Meetings, Sober Living, Quotes, etc.) |
| `AdminCrudTable<T>` | ✅ Exists | Reusable CRUD component |
| Cloud Functions auth | ✅ Exists | `requireAdmin()` helper in place |
| Firestore rules | ✅ Exists | `isAdmin()` function defined |
| Sentry integration | ✅ Exists | Initialized in Cloud Functions |
| `logSecurityEvent()` | ✅ Exists | Writes to GCP Cloud Logging |
| Users tab | ✅ Exists | Basic user list (to be enhanced) |

### Identified Gaps

| Gap | Impact | Resolution Phase |
|-----|--------|------------------|
| No system health visibility | Can't tell if services are down | Phase 1 |
| No user activity metrics | Don't know engagement levels | Phase 1 |
| Basic user lookup only | Can't debug user-specific issues | Phase 2 |
| No scheduled job monitoring | Jobs could fail silently | Phase 3 |
| Errors only in Sentry UI | Context switching to debug | Phase 4 |
| Logs only in GCP Console | No in-app log access | Phase 5 |
| `cleanupOldRateLimits` not scheduled | Rate limit docs accumulate | Phase 3 |
| No `lastActive` tracking | Can't measure active users | Phase 1 |

---

## Architecture

### New Tab Structure

```
Admin Panel Tabs (Updated Order)
├── Dashboard      ← NEW (Phase 1)
├── Users          ← ENHANCED (Phase 2)
├── Errors         ← NEW (Phase 4)
├── Logs           ← NEW (Phase 5)
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
   │Firestore│ │Firestore│ │ Sentry  │ │Firestore│ │Firestore│
   │ Counts  │ │ /users  │ │   API   │ │  admin  │ │  admin  │
   │+ Health │ │+ Logs   │ │         │ │  _logs  │ │  _jobs  │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### New Firestore Collections

```
/admin_logs/{auto-id}
├── timestamp: Timestamp
├── event: string (e.g., "AUTH_FAILURE", "RATE_LIMIT_EXCEEDED")
├── level: "info" | "warn" | "error"
├── userId: string (hashed)
├── details: string
└── source: string (function name)

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

| File | Type | Purpose |
|------|------|---------|
| `components/admin/dashboard-tab.tsx` | Component | Dashboard UI |

### Modified Files

| File | Changes |
|------|---------|
| `functions/src/admin.ts` | Add `adminHealthCheck`, `adminGetDashboardStats` |
| `functions/src/index.ts` | Export new functions (if needed) |
| `components/admin/admin-tabs.tsx` | Add Dashboard tab (first position) |
| Auth provider / firebase.ts | Add `lastActive` timestamp updates |
| `firestore.indexes.json` | Add indexes for queries |

### Cloud Functions

#### `adminHealthCheck`
```typescript
// Returns: { firestore: boolean, auth: boolean, timestamp: string }
// Tests connectivity to Firestore and Auth services
```

#### `adminGetDashboardStats`
```typescript
// Returns:
// - activeUsers: { last24h, last7d, last30d }
// - totalUsers: number
// - recentSignups: Array<{ id, nickname, createdAt, authProvider }>
// - recentLogs: Array<{ id, event, level, timestamp, details }>
// - jobStatuses: Array<{ id, name, lastRunStatus, lastRun }>
// - generatedAt: string
```

### User Activity Tracking

Add to auth state listener:
```typescript
if (user && !user.isAnonymous) {
  updateDoc(doc(db, "users", user.uid), {
    lastActive: serverTimestamp()
  }).catch(console.warn);
}
```

### Verification Checklist

- [ ] Cloud Functions compile without errors
- [ ] Dashboard tab appears first in admin panel
- [ ] Health check shows green for all services
- [ ] User counts display correctly
- [ ] Recent signups list populates
- [ ] No console errors on load
- [ ] `lastActive` updates on app load

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

| File | Type | Purpose |
|------|------|---------|
| `components/admin/user-detail-drawer.tsx` | Component | Slide-out user detail panel |

### Modified Files

| File | Changes |
|------|---------|
| `components/admin/users-tab.tsx` | Add search, click-to-detail, enhanced UI |
| `functions/src/admin.ts` | Add `adminGetUserDetail`, `adminUpdateUser`, `adminDisableUser` |

### Cloud Functions

#### `adminGetUserDetail`
```typescript
// Input: { uid: string }
// Returns:
// - profile: User document data
// - recentActivity: Merged & sorted daily_logs + journal_entries (last 30)
// - stats: { totalJournalEntries, totalCheckIns, streakDays }
```

#### `adminUpdateUser`
```typescript
// Input: { uid: string, updates: { adminNotes?: string, ... } }
// Allows admin to update specific user fields
```

#### `adminDisableUser`
```typescript
// Input: { uid: string, disabled: boolean }
// Sets disabled flag + revokes refresh tokens
```

### UI Components

**Search Bar:**
- Text input with dropdown: "Search by Email / UID / Nickname"
- Debounced search (300ms)
- Results update table in real-time

**User Detail Drawer:**
- Slide-out panel (right side)
- Sections: Profile, Activity Timeline, Account Actions, Admin Notes
- Activity timeline with infinite scroll

### Verification Checklist

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

- [ ] Jobs registry in Firestore
- [ ] Job wrapper for status tracking
- [ ] Jobs tab UI
- [ ] Manual trigger capability
- [ ] Schedule `cleanupOldRateLimits` in Cloud Scheduler

### New Files

| File | Type | Purpose |
|------|------|---------|
| `components/admin/jobs-tab.tsx` | Component | Jobs monitoring UI |
| `functions/src/jobs.ts` | Functions | Job wrapper + scheduled functions |

### Modified Files

| File | Changes |
|------|---------|
| `functions/src/index.ts` | Export scheduled functions |
| `components/admin/admin-tabs.tsx` | Add Jobs tab |

### Job Wrapper Pattern

```typescript
async function runJob(jobId: string, jobFn: () => Promise<void>) {
  const jobRef = db.doc(`admin_jobs/${jobId}`);
  const startTime = Date.now();
  
  await jobRef.update({ 
    lastRunStatus: 'running', 
    lastRun: FieldValue.serverTimestamp() 
  });
  
  try {
    await jobFn();
    await jobRef.update({
      lastRunStatus: 'success',
      lastRunDuration: Date.now() - startTime,
      lastError: null
    });
  } catch (error) {
    await jobRef.update({
      lastRunStatus: 'failed',
      lastRunDuration: Date.now() - startTime,
      lastError: error.message
    });
    throw error;
  }
}
```

### Jobs to Register

| Job ID | Name | Schedule | Description |
|--------|------|----------|-------------|
| `cleanupOldRateLimits` | Cleanup Rate Limits | Daily 3 AM CT | Removes expired rate limit documents |

### Verification Checklist

- [ ] Jobs tab displays all registered jobs
- [ ] Status badges show correct colors
- [ ] Last run time displays correctly
- [ ] Manual trigger works
- [ ] Failed jobs show error message
- [ ] Cloud Scheduler configured for `cleanupOldRateLimits`

---

## Phase 4: Error Tracking (Sentry Integration)

**Status:** ⏳ Planned  
**Priority:** High  
**Effort:** Medium  
**Value:** High — catch issues before users report  

### Objectives

- [ ] Fetch recent errors from Sentry API
- [ ] Plain English error translation layer
- [ ] Errors tab UI with filtering
- [ ] Link errors to affected users

### New Files

| File | Type | Purpose |
|------|------|---------|
| `components/admin/errors-tab.tsx` | Component | Error tracking UI |
| `lib/sentry-admin.ts` | Utility | Sentry API client |
| `lib/error-translations.ts` | Utility | Error code → plain English mapping |

### Modified Files

| File | Changes |
|------|---------|
| `components/admin/admin-tabs.tsx` | Add Errors tab |
| `.env.local` | Add `SENTRY_API_TOKEN` |

### Error Translation Map

```typescript
const ERROR_TRANSLATIONS: Record<string, string> = {
  'auth/invalid-credential': "User entered wrong password or account doesn't exist",
  'permission-denied': "User tried to access data they don't have permission for",
  'unauthenticated': "User's session expired or they weren't logged in",
  'resource-exhausted': "Rate limit hit — too many requests",
  'deadline-exceeded': "Request took too long (slow connection or overloaded function)",
  'not-found': "Requested data doesn't exist",
  'already-exists': "Tried to create something that already exists",
  'internal': "Something went wrong on our end",
  'unavailable': "Service temporarily unavailable",
  'failed-precondition': "Operation rejected due to system state",
};
```

### Sentry API Integration

```typescript
// lib/sentry-admin.ts
export async function fetchRecentErrors(hours = 24) {
  const response = await fetch(
    `https://sentry.io/api/0/projects/${ORG}/${PROJECT}/issues/?statsPeriod=${hours}h`,
    { headers: { Authorization: `Bearer ${SENTRY_API_TOKEN}` } }
  );
  return response.json();
}
```

### UI Columns

| Column | Description |
|--------|-------------|
| When | Relative time (e.g., "2 hours ago") |
| What Happened | Plain English translation |
| Technical Details | Expandable original error |
| Affected User | Link to user profile (if available) |
| Count | Occurrence frequency |
| Status | New / Investigating / Resolved |

### Verification Checklist

- [ ] Sentry API connection works
- [ ] Errors display with plain English descriptions
- [ ] Technical details expand correctly
- [ ] User links navigate to user detail
- [ ] Filtering by date range works
- [ ] Error counts are accurate

---

## Phase 5: System Logs

**Status:** ⏳ Planned  
**Priority:** Medium  
**Effort:** Higher  
**Value:** Medium — deep debugging capability  

### Objectives

- [ ] Write security events to Firestore (parallel to GCP)
- [ ] Logs tab with search and filtering
- [ ] Auto-cleanup of logs older than 7 days
- [ ] Log level filtering (info, warn, error)

### New Files

| File | Type | Purpose |
|------|------|---------|
| `components/admin/logs-tab.tsx` | Component | Logs viewer UI |

### Modified Files

| File | Changes |
|------|---------|
| `functions/src/index.ts` or logging utility | Parallel write to Firestore |
| `functions/src/jobs.ts` | Add `cleanupOldLogs` scheduled function |
| `components/admin/admin-tabs.tsx` | Add Logs tab |

### Firestore Log Entry Schema

```typescript
interface AdminLogEntry {
  id: string;           // Auto-generated
  timestamp: Timestamp;
  event: string;        // e.g., "AUTH_FAILURE", "ADMIN_ACTION"
  level: 'info' | 'warn' | 'error';
  userId: string;       // Hashed for privacy
  details: string;      // Additional context
  source: string;       // Function name
  metadata?: Record<string, any>;
}
```

### Log Writer Integration

```typescript
// Add to existing logSecurityEvent or create wrapper
async function logToFirestore(entry: Omit<AdminLogEntry, 'id'>) {
  await db.collection('admin_logs').add({
    ...entry,
    timestamp: FieldValue.serverTimestamp()
  });
}
```

### Cleanup Job

```typescript
export const cleanupOldLogs = onSchedule("0 4 * * *", async () => {
  await runJob('cleanupOldLogs', async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    
    const oldLogs = await db.collection('admin_logs')
      .where('timestamp', '<', cutoff)
      .limit(500)
      .get();
    
    const batch = db.batch();
    oldLogs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });
});
```

### UI Features

| Feature | Description |
|---------|-------------|
| Date Range Picker | Filter logs by time window |
| Level Filter | Checkboxes for info/warn/error |
| Event Type Filter | Dropdown of event types |
| Search | Free-text search in details |
| Auto-refresh | Toggle for live updates |
| Export | Download filtered logs as JSON |

### Verification Checklist

- [ ] Security events write to Firestore
- [ ] Logs tab displays entries
- [ ] All filters work correctly
- [ ] Search returns accurate results
- [ ] Cleanup job removes old entries
- [ ] Export generates valid JSON

---

## Security Considerations

### Admin Protection Layers

| Layer | Implementation | Status |
|-------|----------------|--------|
| Client-side auth check | `tokenResult.claims.admin === true` | ✅ Exists |
| Cloud Function check | `requireAdmin(request)` | ✅ Exists |
| Firestore rules | `isAdmin()` function | ✅ Exists |
| Middleware (server-side) | Next.js middleware | ⚠️ Recommended addition |

### Recommended: Add Server-Side Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for admin session cookie
    const session = request.cookies.get('__session');
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

### Data Privacy

| Data Type | Handling |
|-----------|----------|
| User IDs in logs | SHA-256 hashed, truncated to 12 chars |
| User activity | Only accessible to admins |
| Error details | Sensitive data redacted |
| Admin actions | Full audit trail |

---

## Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "lastActive", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "admin_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "admin_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "level", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Environment Variables

### New Variables Required

| Variable | Phase | Purpose |
|----------|-------|---------|
| `SENTRY_API_TOKEN` | 4 | Sentry API access for error fetching |
| `SENTRY_ORG` | 4 | Sentry organization slug |
| `SENTRY_PROJECT` | 4 | Sentry project slug |

---

## Testing Strategy

### Unit Tests

| Component | Test Cases |
|-----------|------------|
| `dashboard-tab.tsx` | Loading state, error state, data display |
| `error-translations.ts` | All error codes translate correctly |
| `user-detail-drawer.tsx` | Opens/closes, displays data |

### Integration Tests

| Flow | Validation |
|------|------------|
| Dashboard load | All stats populate, no errors |
| User search | Returns correct results |
| Job status | Reflects actual Cloud Scheduler state |
| Error display | Matches Sentry data |

### Manual Testing Checklist

- [ ] Load dashboard with no users → shows zeros
- [ ] Load dashboard with users → shows correct counts
- [ ] Search for non-existent user → shows "no results"
- [ ] Trigger job manually → status updates
- [ ] Generate error → appears in Errors tab
- [ ] Security event → appears in Logs tab

---

## Rollout Plan

| Phase | Target Date | Dependencies |
|-------|-------------|--------------|
| Phase 1: Dashboard | Week 1 | None |
| Phase 2: User Lookup | Week 2 | Phase 1 (`lastActive` tracking) |
| Phase 3: Jobs | Week 2-3 | Phase 1 (jobs display on dashboard) |
| Phase 4: Errors | Week 3 | Sentry API token |
| Phase 5: Logs | Week 4 | Phase 3 (log cleanup job) |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to identify issue | < 2 minutes | Manual timing |
| Dashboard load time | < 3 seconds | Performance monitoring |
| Error visibility | 100% of Cloud Function errors | Compare Sentry vs. Errors tab |
| Job failure detection | < 1 hour after failure | Alert setup |

---

## Open Questions / Parking Lot

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| AP-001 | Should we add email alerts for job failures? | M | Deferred |
| AP-002 | Rate limiting on admin endpoints? | L | Deferred |
| AP-003 | Admin action approval workflow for destructive actions? | L | Deferred |
| AP-004 | Export all user data as ZIP for GDPR requests? | M | Deferred |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2024-12-22 | Initial specification |

---

**End of Document**
