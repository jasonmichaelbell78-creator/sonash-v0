# Track A - Comprehensive Testing Checklist

## Overview

This checklist covers all testing required for Track A: Admin Panel & Background
Jobs.

**Session:** #72 **Date:** 2026-01-16 **Branch:**
`claude/complete-track-a-jZCcz`

---

## 1. Admin Panel - Logs Tab (A4)

### 1.1 UI Rendering

- [ ] Logs tab appears in admin panel system tabs
- [ ] Logs tab icon (FileText) displays correctly
- [ ] Tab switching works between all system tabs

### 1.2 GCP Deep Links

- [ ] "All Logs" link opens GCP Cloud Logging
- [ ] "Errors Only" link filters to ERROR severity
- [ ] "Warnings" link filters to WARNING+ severity
- [ ] "Security Events" link filters to security event types
- [ ] "Auth Events" link filters to AUTH\* event types
- [ ] "Admin Actions" link filters to ADMIN\* event types
- [ ] Links include correct project ID (sonash-app)
- [ ] Links include 24-hour time range filter

### 1.3 Log Display

- [ ] Logs load on tab mount
- [ ] Loading state displays during fetch
- [ ] Error state displays on fetch failure
- [ ] Empty state displays when no logs
- [ ] Logs display in descending timestamp order

### 1.4 Log Filtering

- [ ] "All" filter shows all logs
- [ ] "ERROR" filter shows only errors
- [ ] "WARNING" filter shows only warnings
- [ ] "INFO" filter shows only info
- [ ] Filter buttons highlight when active

### 1.5 Log Row Expansion

- [ ] Clicking row expands/collapses
- [ ] Expanded view shows event type
- [ ] Expanded view shows full message
- [ ] Expanded view shows metadata (if present)
- [ ] ChevronDown/Right icons update on expand

### 1.6 Summary Cards

- [ ] Error count displays correctly
- [ ] Warning count displays correctly
- [ ] Info count displays correctly
- [ ] Counts update when logs refresh

### 1.7 Refresh Functionality

- [ ] Refresh button triggers new fetch
- [ ] Refresh button shows spinner during load
- [ ] Data updates after refresh

---

## 2. User Privilege System (A8-A9)

### 2.1 Backend Functions

#### adminGetPrivilegeTypes

- [ ] Returns default types (free, premium, admin) when no custom types
- [ ] Returns custom types from Firestore when configured
- [ ] Requires admin authentication
- [ ] Handles errors gracefully

#### adminSavePrivilegeType

- [ ] Creates new privilege type
- [ ] Updates existing privilege type
- [ ] Prevents modifying "admin" type
- [ ] Sets isDefault correctly (unsets others)
- [ ] Logs action to security_logs

#### adminDeletePrivilegeType

- [ ] Deletes custom privilege type
- [ ] Prevents deleting "admin", "premium", "free"
- [ ] Logs action to security_logs

#### adminSetUserPrivilege

- [ ] Sets user privilege type in Firestore
- [ ] Sets custom claims for admin privilege
- [ ] Removes admin claims when changing from admin
- [ ] Validates privilege type exists
- [ ] Logs action to security_logs

### 2.2 Frontend UI

- [ ] Privilege types load on user detail open
- [ ] Privilege selector displays current privilege
- [ ] Selector shows all available privilege types
- [ ] Save button disabled when no change
- [ ] Save button enabled when privilege changed
- [ ] Confirmation dialog appears before save
- [ ] Extra confirmation for admin privilege grant
- [ ] Loading state during save
- [ ] Error reverts selection
- [ ] Success updates local state
- [ ] "This user has admin access" note shows for admins

---

## 3. Background Jobs (A10-A14)

### 3.1 Jobs Tab Integration

- [ ] All new jobs appear in Jobs tab
- [ ] Job names display correctly
- [ ] Run Now button triggers each job
- [ ] Job status updates after run
- [ ] Error states display for failed jobs

### 3.2 A10: Cleanup Old Sessions

- [ ] Job runs without error
- [ ] Deletes documents older than 30 days
- [ ] Respects batch limit (100 per user)
- [ ] Logs success with count
- [ ] Updates admin_jobs document

### 3.3 A11: Cleanup Orphaned Storage Files

- [ ] Job runs without error
- [ ] Checks user-uploads/ prefix
- [ ] Deletes files for non-existent users
- [ ] Only deletes orphaned files >7 days old
- [ ] Logs success with checked/deleted counts
- [ ] Updates admin_jobs document

### 3.4 A12: Generate Usage Analytics

- [ ] Job runs without error
- [ ] Calculates active users (24h)
- [ ] Calculates new users (24h)
- [ ] Calculates journal entries from security_logs
- [ ] Calculates check-ins from security_logs
- [ ] Stores data in analytics_daily/{date}
- [ ] Logs success with stats
- [ ] Updates admin_jobs document

### 3.5 A13: Prune Security Events

- [ ] Job runs without error
- [ ] Deletes events older than 90 days
- [ ] Uses batch deletion (500 limit)
- [ ] Handles large volumes with pagination
- [ ] Logs success with deleted count
- [ ] Updates admin_jobs document

### 3.6 A14: Health Check Notifications

- [ ] Job runs without error
- [ ] Checks error rate (6 hours)
- [ ] Checks failed jobs (24 hours)
- [ ] Checks user activity (6 hours)
- [ ] Checks Firestore connectivity
- [ ] Stores result in system/health
- [ ] Status: healthy/warning/critical
- [ ] Logs result with severity matching status
- [ ] Updates admin_jobs document

---

## 4. Security Testing

### 4.1 Authentication

- [ ] All admin functions reject unauthenticated requests
- [ ] All admin functions reject non-admin users
- [ ] Custom claims checked correctly

### 4.2 Authorization

- [ ] Can't modify other user's privilege
- [ ] Can't delete built-in privilege types
- [ ] Can't modify admin privilege type definition

### 4.3 Input Validation

- [ ] Limit parameter clamped to MAX_LIMIT
- [ ] Required fields validated
- [ ] Invalid privilege type IDs rejected

### 4.4 Audit Logging

- [ ] Security events stored in Firestore
- [ ] Events include user ID, action, metadata
- [ ] WARNING/ERROR events captured

---

## 5. Integration Testing

### 5.1 End-to-End Flow: Logs Tab

1. [ ] Login as admin
2. [ ] Navigate to admin panel
3. [ ] Click Logs tab
4. [ ] Verify logs load
5. [ ] Click GCP deep link
6. [ ] Verify GCP opens with correct query
7. [ ] Click a log row
8. [ ] Verify expansion works
9. [ ] Filter by severity
10. [ ] Verify filter works

### 5.2 End-to-End Flow: User Privileges

1. [ ] Login as admin
2. [ ] Navigate to Users tab
3. [ ] Search for test user
4. [ ] Click user row
5. [ ] Verify privilege selector loads
6. [ ] Change privilege to "premium"
7. [ ] Confirm dialog
8. [ ] Verify save succeeds
9. [ ] Refresh page
10. [ ] Verify privilege persisted

### 5.3 End-to-End Flow: Background Jobs

1. [ ] Login as admin
2. [ ] Navigate to Jobs tab
3. [ ] Click "Run Now" on each job
4. [ ] Verify job completes
5. [ ] Verify status updates
6. [ ] Check Firestore for expected documents

---

## 6. Performance Testing

### 6.1 Logs Tab

- [ ] Logs load within 3 seconds
- [ ] Filtering is instant (client-side)
- [ ] No memory leaks on repeated refresh

### 6.2 Background Jobs

- [ ] Jobs complete within timeout
- [ ] Batch operations don't exceed limits
- [ ] No Firestore quota errors

---

## 7. Error Handling

### 7.1 Network Failures

- [ ] Logs tab shows error on network failure
- [ ] Privilege save shows error on failure
- [ ] Jobs show failure status

### 7.2 Invalid States

- [ ] Empty logs collection handled
- [ ] Missing user document handled
- [ ] Invalid privilege type handled

---

## Test Execution Summary

| Category            | Total   | Passed | Failed | Skipped |
| ------------------- | ------- | ------ | ------ | ------- |
| Logs Tab            | 24      |        |        |         |
| Privileges Backend  | 16      |        |        |         |
| Privileges Frontend | 14      |        |        |         |
| Background Jobs     | 30      |        |        |         |
| Security            | 10      |        |        |         |
| Integration         | 20      |        |        |         |
| Performance         | 5       |        |        |         |
| Error Handling      | 6       |        |        |         |
| **TOTAL**           | **125** |        |        |         |

---

## Sign-off

- [ ] All critical tests passed
- [ ] No security issues found
- [ ] Performance within acceptable limits
- [ ] Ready for production deployment

**Tested by:** **\*\***\_\_\_**\*\*** **Date:** **\*\***\_\_\_**\*\***
**Approved by:** **\*\***\_\_\_**\*\***
