# Track A Admin Panel Testing Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Document Tier:** 3 (Working Document)
**Status:** Active
**Last Updated:** 2026-02-04
<!-- prettier-ignore-end -->

---

## Purpose

Comprehensive testing plan for Track A Admin Panel features (A1-A22), including
both automated and manual testing approaches. This plan covers:

- Previously skipped/incomplete tests from original Track A testing
- New A19-A22 feature testing
- Available tools and recommended installations

---

## Table of Contents

1. [Testing Infrastructure](#testing-infrastructure)
2. [Section A: Automated Tests](#section-a-automated-tests)
3. [Section B: Manual Tests](#section-b-manual-tests)
4. [Appendix: Skipped Tests from Original Checklist](#appendix-skipped-tests-from-original-checklist)

---

## Testing Infrastructure

### Currently Available Tools

| Tool                       | Type                   | Status     | Use Case                         |
| -------------------------- | ---------------------- | ---------- | -------------------------------- |
| Node.js Native Test Runner | Unit/Integration       | Installed  | `npm test` - runs all test files |
| Playwright MCP Server      | E2E Browser Automation | Available  | Browser interactions via MCP     |
| Firebase Emulators         | Backend Testing        | Configured | `firebase emulators:start`       |
| c8 Coverage                | Code Coverage          | Installed  | `npm run test:coverage`          |

### Recommended Installations

| Tool                         | Install Command                                       | Use Case                         | Priority |
| ---------------------------- | ----------------------------------------------------- | -------------------------------- | -------- |
| @playwright/test             | `npm i -D @playwright/test && npx playwright install` | Full E2E test suite              | HIGH     |
| @firebase/rules-unit-testing | `npm i -D @firebase/rules-unit-testing`               | Firestore security rules testing | MEDIUM   |
| msw (Mock Service Worker)    | `npm i -D msw`                                        | API mocking for component tests  | MEDIUM   |

---

## Section A: Automated Tests

These tests can be automated using the existing test infrastructure or the
Playwright MCP server.

### A1. Unit Tests (Node.js Test Runner)

#### A1.1 Admin Error Utils Tests (EXISTING - 24 tests passing)

```bash
npm test -- tests/utils/admin-error-utils.test.ts
```

- `redactSensitive()` - PII redaction
- `safeFormatDate()` - Date formatting
- `isValidSentryUrl()` - URL validation

#### A1.2 New Tests to Create: A19 User Analytics Functions

**File:** `tests/admin/user-analytics.test.ts`

```typescript
// Test: adminGetUserAnalytics returns expected structure
// Test: DAU/WAU/MAU calculations are accurate
// Test: Cohort retention data is properly formatted
// Test: Feature usage trends are calculated correctly
// Test: Function requires admin authentication
```

**Automatable:** YES - Can be tested against Firebase emulators

#### A1.3 New Tests to Create: A20 Job Run History

**File:** `tests/admin/job-run-history.test.ts`

```typescript
// Test: adminGetJobRunHistory returns paginated results
// Test: Filtering by jobId works correctly
// Test: Filtering by status (success/failed) works
// Test: Date range filtering works
// Test: Run history entries have correct structure
// Test: triggeredBy field differentiates manual vs scheduled
```

**Automatable:** YES - Can be tested against Firebase emulators

#### A1.4 New Tests to Create: A21 Error-User Correlation

**File:** `tests/admin/error-user-correlation.test.ts`

```typescript
// Test: adminGetErrorsWithUsers returns errors with user hashes
// Test: adminGetUserActivityByHash returns user timeline
// Test: adminFindUserByHash can lookup user from hash
// Test: User hash is consistent (same user = same hash)
// Test: Privacy: Full userId never exposed in responses
// Test: Functions require admin authentication
```

**Automatable:** YES - Requires seeded security_logs data

#### A1.5 Cloud Function Authorization Tests

**File:** `tests/admin/admin-auth.test.ts`

```typescript
// Test: All admin* functions reject unauthenticated requests
// Test: All admin* functions reject non-admin users
// Test: All admin* functions accept admin users
// Test: Rate limiting applies to admin functions
```

**Automatable:** YES - Using Firebase emulators with custom claims

---

### A2. Integration Tests (Playwright MCP)

These can be run using the Playwright MCP server for browser automation.

#### A2.1 Analytics Tab (A19)

| Test Case                           | Automation Approach                                      |
| ----------------------------------- | -------------------------------------------------------- |
| Tab loads without errors            | `mcp__playwright__browser_navigate` + `browser_snapshot` |
| DAU/WAU/MAU cards display values    | Snapshot check for metric cards                          |
| Retention table renders correctly   | Check for table structure                                |
| Feature usage section shows data    | Verify feature list exists                               |
| Refresh button triggers data reload | Click refresh, verify loading state                      |

**Playwright MCP Commands:**

```
1. browser_navigate to /admin
2. browser_click on "Analytics" tab
3. browser_snapshot to verify metrics
4. browser_click on refresh button
5. browser_wait_for loading to complete
```

#### A2.2 Jobs Tab with History (A20)

| Test Case                      | Automation Approach                   |
| ------------------------------ | ------------------------------------- |
| Jobs list loads                | Navigate + snapshot                   |
| Expand job shows history panel | Click expand, verify panel            |
| Status filter works            | Select filter, verify results         |
| Trigger type badges display    | Check for "Manual"/"Scheduled" badges |
| Export history downloads JSON  | Click download, verify file           |

**Playwright MCP Commands:**

```
1. browser_navigate to /admin
2. browser_click on "Jobs" tab
3. browser_snapshot to see job cards
4. browser_click on expand button for a job
5. browser_snapshot to verify history panel
6. browser_select_option for status filter
7. browser_click on download button
```

#### A2.3 Errors Tab with User Correlation (A21)

| Test Case                            | Automation Approach               |
| ------------------------------------ | --------------------------------- |
| Errors tab loads                     | Navigate + snapshot               |
| User Correlation section visible     | Snapshot check for section header |
| Error entries show user hash         | Verify hash format (12 chars)     |
| Click user hash opens activity modal | Click hash, verify modal          |
| Activity timeline displays events    | Check modal content               |

**Playwright MCP Commands:**

```
1. browser_navigate to /admin
2. browser_click on "Errors" tab
3. browser_snapshot for User Correlation section
4. browser_click on a user hash link
5. browser_snapshot to verify activity modal
6. browser_click on X to close modal
```

#### A2.4 Logs Tab Query Builder (A22)

| Test Case                         | Automation Approach                 |
| --------------------------------- | ----------------------------------- |
| Logs tab loads                    | Navigate + snapshot                 |
| Search input filters logs         | Type in search, verify filtering    |
| Type dropdown filters by category | Select type, verify results         |
| Export button downloads JSON      | Click export, verify download       |
| Date filter works                 | Select date range, verify filtering |

**Playwright MCP Commands:**

```
1. browser_navigate to /admin
2. browser_click on "Logs" tab
3. browser_type in search box
4. browser_snapshot to verify filtered results
5. browser_select_option for type filter
6. browser_click on export button
```

---

### A3. Automated Test Scripts

#### A3.1 Full Admin Panel Smoke Test Script

Create a script that uses Playwright MCP to verify all admin tabs load:

```bash
# scripts/admin-smoke-test.sh (conceptual - uses Playwright MCP)
# 1. Navigate to /admin
# 2. For each tab (Dashboard, Users, Analytics, Jobs, Errors, Logs, Meetings, etc.):
#    - Click tab
#    - Take snapshot
#    - Verify no error states
#    - Verify expected content exists
```

#### A3.2 Security Audit Automated Checks

```typescript
// tests/security/admin-access.test.ts
// Test: Direct URL to /admin without auth redirects
// Test: API calls without auth return 401/403
// Test: Admin functions log security events
// Test: Failed auth attempts are rate limited
```

---

## Section B: Manual Tests

These tests require human judgment or cannot be easily automated.

### B1. Visual/UX Testing

#### B1.1 Analytics Tab (A19)

| Test                 | Steps                              | Expected Result                                  | Status |
| -------------------- | ---------------------------------- | ------------------------------------------------ | ------ |
| Metric cards styling | 1. Open /admin → Analytics         | Cards have consistent amber theme, icons aligned | [ ]    |
| Trend indicators     | 2. Check trend icons               | Up/Down/Stable arrows display correctly          | [ ]    |
| Responsive layout    | 3. Resize browser window           | Cards reflow properly at breakpoints             | [ ]    |
| Empty state          | 4. Test with no data (new project) | Shows meaningful empty state message             | [ ]    |

#### B1.2 Jobs Tab History (A20)

| Test                      | Steps                           | Expected Result                           | Status |
| ------------------------- | ------------------------------- | ----------------------------------------- | ------ |
| Expandable cards          | 1. Click job card expand button | Smooth animation, panel slides down       | [ ]    |
| Status badges colors      | 2. Review success/failed badges | Green for success, red for failed         | [ ]    |
| Duration formatting       | 3. Check duration display       | Human-readable format (e.g., "2.3s")      | [ ]    |
| History timeline          | 4. View history with many runs  | Scrollable, most recent first             | [ ]    |
| Manual vs Scheduled icons | 5. Check trigger type badges    | User icon for manual, clock for scheduled | [ ]    |

#### B1.3 Errors Tab User Correlation (A21)

| Test                  | Steps                        | Expected Result                           | Status |
| --------------------- | ---------------------------- | ----------------------------------------- | ------ |
| User hash display     | 1. View error with user hash | 12-char hash format, clickable            | [ ]    |
| Activity modal        | 2. Click user hash           | Modal opens with full activity timeline   | [ ]    |
| Timeline chronology   | 3. Review activity list      | Events sorted newest first                | [ ]    |
| Navigate to Users tab | 4. Click "View Full Profile" | Navigates to Users tab with user selected | [ ]    |
| Privacy verification  | 5. Inspect network requests  | No full userId visible, only hashes       | [ ]    |

#### B1.4 Logs Tab Query Builder (A22)

| Test                   | Steps                         | Expected Result                               | Status |
| ---------------------- | ----------------------------- | --------------------------------------------- | ------ |
| Search responsiveness  | 1. Type in search box         | Debounced filtering, no lag                   | [ ]    |
| Type category dropdown | 2. Open type filter dropdown  | All categories present (AUTH, SECURITY, etc.) | [ ]    |
| Combined filters       | 3. Apply search + type filter | Both filters work together                    | [ ]    |
| Export filename        | 4. Download JSON export       | Filename includes date/time                   | [ ]    |
| GCP link buttons       | 5. Click "Open in GCP" links  | Opens correct Cloud Logging query             | [ ]    |

---

### B2. Functional Testing (Requires Production-like Data)

#### B2.1 Analytics Accuracy (A19)

| Test                  | Steps                                               | Expected Result               | Status                 |
| --------------------- | --------------------------------------------------- | ----------------------------- | ---------------------- | --- |
| DAU accuracy          | 1. Count distinct users active today in Firestore   | 2. Compare to DAU metric      | Values match           | [ ] |
| WAU accuracy          | 1. Count distinct users active this week            | 2. Compare to WAU metric      | Values match           | [ ] |
| MAU accuracy          | 1. Count distinct users active this month           | 2. Compare to MAU metric      | Values match           | [ ] |
| Retention calculation | 1. Manually calculate week-1 retention for a cohort | 2. Compare to displayed value | Values match within 1% | [ ] |

#### B2.2 Job History Accuracy (A20)

| Test                 | Steps                                             | Expected Result                  | Status                              |
| -------------------- | ------------------------------------------------- | -------------------------------- | ----------------------------------- | --- |
| History completeness | 1. Manually trigger a job                         | 2. Verify run appears in history | Entry created with correct metadata | [ ] |
| Error capture        | 1. Cause a job to fail (e.g., network disconnect) | 2. Check history entry           | Error message captured in history   | [ ] |
| Duration accuracy    | 1. Time a job manually                            | 2. Compare to recorded duration  | Within 500ms                        | [ ] |

#### B2.3 Error-User Correlation Accuracy (A21)

| Test                  | Steps                                 | Expected Result                        | Status                     |
| --------------------- | ------------------------------------- | -------------------------------------- | -------------------------- | --- |
| Hash consistency      | 1. Note hash for a user               | 2. Trigger another error for same user | Same hash appears          | [ ] |
| Activity completeness | 1. Perform multiple actions as a user | 2. Check activity timeline             | All actions appear         | [ ] |
| User lookup           | 1. Get hash from error                | 2. Use "Find User"                     | Correct user profile found | [ ] |

---

### B3. Security Testing (Manual Verification Required)

#### B3.1 Admin Authorization

| Test              | Steps                     | Expected Result                               | Status                         |
| ----------------- | ------------------------- | --------------------------------------------- | ------------------------------ | -------------------------- | --- |
| Non-admin access  | 1. Log in as regular user | 2. Navigate to /admin                         | "Not authorized" message shown | [ ]                        |
| Token expiry      | 1. Log in as admin        | 2. Wait for token to expire (1 hour)          | 3. Try admin action            | Re-authentication required | [ ] |
| Console API calls | 1. Open browser console   | 2. Try calling adminGetUserAnalytics directly | Fails with "Unauthorized"      | [ ]                        |

#### B3.2 Privacy Compliance

| Test               | Steps                                        | Expected Result                 | Status                                                            |
| ------------------ | -------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- | --- |
| PII in network tab | 1. Open Admin panel                          | 2. Inspect all Network requests | No full userIds, emails, or names in URLs/responses (only hashes) | [ ] |
| Console logging    | 1. Open browser console during admin actions | 2. Check logged data            | No PII logged to console                                          | [ ] |
| Export PII check   | 1. Export logs/errors JSON                   | 2. Search for email patterns    | No emails or personal data in exports                             | [ ] |

---

### B4. Edge Cases & Error Handling

#### B4.1 Empty States

| Test                 | Steps                           | Expected Result                  | Status                          |
| -------------------- | ------------------------------- | -------------------------------- | ------------------------------- | --- |
| No analytics data    | 1. New project with no users    | 2. Open Analytics tab            | Graceful empty state, not error | [ ] |
| No job history       | 1. Job that never ran           | 2. Expand history panel          | "No runs recorded" message      | [ ] |
| No errors with users | 1. No errors in security_logs   | 2. Open User Correlation section | Appropriate empty message       | [ ] |
| No matching logs     | 1. Search for non-existent term | 2. Check results                 | "No logs match your filters"    | [ ] |

#### B4.2 Large Data Handling

| Test                   | Steps                        | Expected Result        | Status                                  |
| ---------------------- | ---------------------------- | ---------------------- | --------------------------------------- | --- |
| Many job runs          | 1. Job with 100+ runs        | 2. View history        | Pagination works, no performance issues | [ ] |
| Many errors            | 1. 1000+ errors in system    | 2. Load Errors tab     | Reasonable load time (<3s)              | [ ] |
| Long activity timeline | 1. User with 200+ activities | 2. Open activity modal | Scrollable, performs well               | [ ] |

#### B4.3 Network Failure

| Test                   | Steps                    | Expected Result       | Status                         |
| ---------------------- | ------------------------ | --------------------- | ------------------------------ | ----------------------- | --- |
| Offline analytics load | 1. Go offline (DevTools) | 2. Open Analytics tab | Error message, retry option    | [ ]                     |
| Offline job trigger    | 1. Go offline            | 2. Try to trigger job | Error toast, job not triggered | [ ]                     |
| Network recovery       | 1. Go offline, get error | 2. Come back online   | 3. Click refresh               | Data loads successfully | [ ] |

---

### B5. Cross-Browser Testing

Test all admin features in:

| Browser          | A19 Analytics | A20 Jobs | A21 Errors | A22 Logs | Status |
| ---------------- | ------------- | -------- | ---------- | -------- | ------ |
| Chrome (latest)  | [ ]           | [ ]      | [ ]        | [ ]      |        |
| Firefox (latest) | [ ]           | [ ]      | [ ]        | [ ]      |        |
| Safari (latest)  | [ ]           | [ ]      | [ ]        | [ ]      |        |
| Edge (latest)    | [ ]           | [ ]      | [ ]        | [ ]      |        |

---

## Appendix: Skipped Tests from Original Checklist

These tests were marked as skipped in the original Track A testing and should
now be addressed:

### Privileges Backend (11 skipped)

| ID    | Test                                     | Automation Possible | Priority |
| ----- | ---------------------------------------- | ------------------- | -------- |
| PB-1  | adminGetPrivilegeTypes returns all types | YES                 | HIGH     |
| PB-2  | adminSavePrivilegeType creates new type  | YES                 | HIGH     |
| PB-3  | adminSavePrivilegeType updates existing  | YES                 | HIGH     |
| PB-4  | adminDeletePrivilegeType removes type    | YES                 | HIGH     |
| PB-5  | adminSetUserPrivilege grants privilege   | YES                 | HIGH     |
| PB-6  | adminSetUserPrivilege revokes privilege  | YES                 | HIGH     |
| PB-7  | Privilege changes log security event     | YES                 | HIGH     |
| PB-8  | Invalid privilege type rejected          | YES                 | MEDIUM   |
| PB-9  | Cannot delete system privilege types     | YES                 | MEDIUM   |
| PB-10 | Privilege expiry date enforcement        | YES                 | MEDIUM   |
| PB-11 | Cascade delete user privileges           | YES                 | LOW      |

### Privileges Frontend (4 skipped)

| ID   | Test                                        | Automation Possible | Priority |
| ---- | ------------------------------------------- | ------------------- | -------- |
| PF-1 | Privileges tab loads privilege types        | Playwright MCP      | HIGH     |
| PF-2 | Can create new privilege type               | Playwright MCP      | HIGH     |
| PF-3 | Can edit existing privilege type            | Playwright MCP      | HIGH     |
| PF-4 | Can delete privilege type with confirmation | Playwright MCP      | HIGH     |

### Error Handling (6 skipped)

| ID   | Test                                  | Automation Possible | Priority |
| ---- | ------------------------------------- | ------------------- | -------- |
| EH-1 | Network timeout shows error toast     | YES                 | HIGH     |
| EH-2 | Auth error triggers re-login          | Manual              | HIGH     |
| EH-3 | Rate limit error shows countdown      | YES                 | MEDIUM   |
| EH-4 | Validation error highlights field     | Playwright MCP      | MEDIUM   |
| EH-5 | Server error shows retry option       | Playwright MCP      | MEDIUM   |
| EH-6 | Partial failure shows which succeeded | Manual              | LOW      |

---

## Test Execution Checklist

### Pre-Testing Setup

- [ ] Start development server: `npm run dev`
- [ ] Start Firebase emulators: `firebase emulators:start`
- [ ] Seed test data if needed
- [ ] Ensure admin claim is set for test user

### Automated Tests Execution

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific admin tests (once created)
npm test -- tests/admin/
```

### Playwright MCP Integration Tests

Use the Playwright MCP tools to automate browser interactions:

1. `mcp__playwright__browser_navigate` - Navigate to pages
2. `mcp__playwright__browser_snapshot` - Capture page state
3. `mcp__playwright__browser_click` - Click elements
4. `mcp__playwright__browser_type` - Enter text
5. `mcp__playwright__browser_select_option` - Select dropdowns

---

## Version History

| Version | Date       | Changes                                        |
| ------- | ---------- | ---------------------------------------------- |
| 1.0     | 2026-02-04 | Initial creation for Track A Phase 2 (A19-A22) |
