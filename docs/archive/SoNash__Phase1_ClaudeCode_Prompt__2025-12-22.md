# SoNash Admin Panel Enhancement - Phase 1: Dashboard + Foundations

## OVERVIEW

I need you to implement the Dashboard tab for the admin panel, plus set up
foundational pieces for future phases. This is Phase 1 of a larger admin panel
enhancement.

**Key Security Requirements:**

- All admin Cloud Functions MUST call `requireAdmin(request)` as first operation
- All admin Cloud Functions MUST have `enforceAppCheck: true`
- Dashboard data MUST NOT expose PII (emails, full profiles, etc.)
- New Firestore collections MUST have admin-only rules

---

## TASK 1: Firestore Rules Update (firestore.rules)

Add these rules for the new admin collections:

```javascript
// Add these inside your rules_version = '2' / service cloud.firestore block:

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

## TASK 2: Cloud Functions (functions/src/admin.ts)

Add these two new callable functions to the existing admin.ts file:

```typescript
// Add to existing imports if not present
import { FieldValue } from "firebase-admin/firestore";

/**
 * Health check endpoint for admin dashboard
 * Security: Requires admin claim, enforces App Check
 */
export const adminHealthCheck = onCall(
  {
    enforceAppCheck: true,
    consumeAppCheckToken: false,
  },
  async (request) => {
    // SECURITY: Admin check must be first operation
    requireAdmin(request);

    const checks = {
      firestore: false,
      auth: false,
      timestamp: new Date().toISOString(),
    };

    try {
      // Test Firestore connectivity
      await db.collection("_health").doc("ping").set({
        lastCheck: FieldValue.serverTimestamp(),
      });
      checks.firestore = true;
    } catch (e) {
      console.error("Firestore health check failed:", e);
    }

    try {
      // Test Auth connectivity (just verify we can access it)
      await admin.auth().getUser(request.auth!.uid);
      checks.auth = true;
    } catch (e) {
      console.error("Auth health check failed:", e);
    }

    return checks;
  }
);

/**
 * Get dashboard statistics for admin panel
 * Security: Requires admin claim, enforces App Check
 * Privacy: Returns counts and minimal profile data (no emails/PII)
 */
export const adminGetDashboardStats = onCall(
  {
    enforceAppCheck: true,
    consumeAppCheckToken: false,
  },
  async (request) => {
    // SECURITY: Admin check must be first operation
    requireAdmin(request);

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Run queries in parallel for performance
      const [
        activeUsers24h,
        activeUsers7d,
        activeUsers30d,
        totalUsersSnapshot,
        recentSignupsSnapshot,
      ] = await Promise.all([
        db.collection("users").where("lastActive", ">", last24h).count().get(),
        db.collection("users").where("lastActive", ">", last7d).count().get(),
        db.collection("users").where("lastActive", ">", last30d).count().get(),
        db.collection("users").count().get(),
        db.collection("users").orderBy("createdAt", "desc").limit(10).get(),
      ]);

      // Get job statuses if they exist
      let jobStatuses: Array<{
        id: string;
        name: string;
        lastRunStatus: string;
        lastRun: any;
      }> = [];
      try {
        const jobsSnapshot = await db.collection("admin_jobs").get();
        jobStatuses = jobsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          lastRunStatus: doc.data().lastRunStatus || "unknown",
          lastRun: doc.data().lastRun?.toDate?.()?.toISOString() || null,
        }));
      } catch (e) {
        // Jobs collection may not exist yet - that's fine
      }

      // PRIVACY: Only return nickname and auth provider, NOT email or other PII
      const recentSignups = recentSignupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        nickname: doc.data().nickname || "Anonymous",
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        authProvider: doc.data().authProvider || "unknown",
      }));

      return {
        activeUsers: {
          last24h: activeUsers24h.data().count,
          last7d: activeUsers7d.data().count,
          last30d: activeUsers30d.data().count,
        },
        totalUsers: totalUsersSnapshot.data().count,
        recentSignups,
        jobStatuses,
        generatedAt: now.toISOString(),
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new HttpsError("internal", "Failed to fetch dashboard statistics");
    }
  }
);
```

**Important:** Make sure these are exported in `functions/src/index.ts` if
admin.ts exports aren't already re-exported there.

---

## TASK 3: Dashboard Tab Component (components/admin/dashboard-tab.tsx)

Create a new file `components/admin/dashboard-tab.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Users,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Loader2,
  Server,
  Database,
  Shield,
} from "lucide-react";

interface HealthStatus {
  firestore: boolean;
  auth: boolean;
  timestamp: string;
}

interface DashboardStats {
  activeUsers: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  totalUsers: number;
  recentSignups: Array<{
    id: string;
    nickname: string;
    createdAt: string | null;
    authProvider: string;
  }>;
  jobStatuses: Array<{
    id: string;
    name: string;
    lastRunStatus: string;
    lastRun: string | null;
  }>;
  generatedAt: string;
}

export function DashboardTab() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [healthResult, statsResult] = await Promise.all([
        httpsCallable<void, HealthStatus>(functions, "adminHealthCheck")(),
        httpsCallable<void, DashboardStats>(
          functions,
          "adminGetDashboardStats"
        )(),
      ]);

      setHealth(healthResult.data);
      setStats(statsResult.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const StatusBadge = ({ ok }: { ok: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {ok ? "Healthy" : "Error"}
    </span>
  );

  const JobStatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      running: "bg-blue-100 text-blue-800",
      unknown: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.unknown}`}
      >
        {status}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            System Overview
          </h2>
          {lastRefresh && (
            <p className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error loading dashboard</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Firestore</span>
            </div>
            {health && <StatusBadge ok={health.firestore} />}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Auth</span>
            </div>
            {health && <StatusBadge ok={health.auth} />}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Functions</span>
            </div>
            {health && <StatusBadge ok={true} />}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalUsers}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Active (24h)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeUsers.last24h}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Active (7d)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeUsers.last7d}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Active (30d)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeUsers.last30d}
            </p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Signups & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Recent Signups
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.recentSignups.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">
                No recent signups
              </p>
            )}
            {stats?.recentSignups.map((user) => (
              <div
                key={user.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{user.nickname}</p>
                  <p className="text-xs text-gray-500">{user.authProvider}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTimeAgo(user.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Background Jobs */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Background Jobs
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.jobStatuses.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">
                No jobs configured yet
              </p>
            )}
            {stats?.jobStatuses.map((job) => (
              <div
                key={job.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{job.name}</p>
                  <p className="text-xs text-gray-500">
                    Last run: {formatTimeAgo(job.lastRun)}
                  </p>
                </div>
                <JobStatusBadge status={job.lastRunStatus} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## TASK 4: Update admin-tabs.tsx

Modify `components/admin/admin-tabs.tsx` to add Dashboard as the FIRST tab:

1. Import the new component at the top:

```tsx
import { DashboardTab } from "./dashboard-tab";
```

2. Add "Dashboard" as the first item in the tabs array/config (before Meetings,
   Sober Living, etc.)

3. Add the DashboardTab component to render when Dashboard tab is selected

The Dashboard tab should appear first in the tab order, before all existing
tabs.

---

## TASK 5: Add lastActive Tracking

We need users to have a `lastActive` timestamp that updates when they use the
app.

Find where the app initializes auth or where the AuthProvider tracks auth state
(likely in `lib/firebase.ts` or a context provider). Add logic to update the
user's `lastActive` field.

Look for the auth state change handler (onAuthStateChanged or similar) and add:

```typescript
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Inside the auth state change handler, when user is authenticated:
if (user && !user.isAnonymous) {
  // Update lastActive timestamp (non-blocking)
  const userRef = doc(db, "users", user.uid);
  updateDoc(userRef, {
    lastActive: serverTimestamp(),
  }).catch((err) => {
    // Don't block app initialization if this fails
    console.warn("Failed to update lastActive:", err);
  });
}
```

**Important:** This should be non-blocking (don't await it) so it doesn't slow
down app initialization.

---

## TASK 6: Create/Update Firestore Indexes

Create or update `firestore.indexes.json` to include:

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

If the file already exists, merge these indexes with existing ones.

---

## TASK 7: Export Functions (if needed)

Check `functions/src/index.ts` - if it doesn't already re-export everything from
admin.ts, make sure the new functions are exported:

```typescript
// If admin.ts exports aren't already re-exported, add:
export { adminHealthCheck, adminGetDashboardStats } from "./admin";
```

---

## VERIFICATION CHECKLIST

After implementation, verify:

1. [ ] Firestore rules include `/admin_jobs` and `/_health` with admin-only
       access
2. [ ] Cloud Functions compile: `cd functions && npm run build`
3. [ ] Both new functions have `requireAdmin(request)` as FIRST line after
       destructuring
4. [ ] Both new functions have `enforceAppCheck: true`
5. [ ] No TypeScript errors in components
6. [ ] Dashboard tab appears FIRST in admin panel tab order
7. [ ] Health check shows green status for all services
8. [ ] User counts display correctly
9. [ ] Recent signups list shows nicknames (NOT emails)
10. [ ] No console errors on dashboard load
11. [ ] `lastActive` updates when a user loads the app

---

## SECURITY NOTES

- The `adminHealthCheck` and `adminGetDashboardStats` functions contain
  `requireAdmin()` checks - do not remove these
- The dashboard intentionally does NOT show user emails - only nicknames and
  auth provider
- The `/_health/ping` document is only used for connectivity testing and
  contains no sensitive data
- Firestore rules must be deployed: `firebase deploy --only firestore:rules`

---

## OUTPUT

When complete, please provide:

1. List of files created/modified
2. Any errors encountered and how they were resolved
3. Confirmation that functions compile successfully
4. Screenshot or description of the dashboard tab rendering

Let me know when complete and show me any errors encountered.
