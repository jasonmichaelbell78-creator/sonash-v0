# SoNash ROADMAP.md Full Inventory

**Generated:** 2026-01-24 | **Last Updated:** 2026-01-27 **Source:** ROADMAP.md
v3.9 **Total Items:** 396

---

## Purpose

This document provides a complete inventory of all 396 items from ROADMAP.md
v3.9, organized by milestone. It serves as the authoritative reference for item
IDs, titles, feature groups, status, effort estimates, and priorities, enabling
cross-pass analysis validation and progress tracking.

---

## Summary Statistics by Milestone

| Milestone                 | Status    | Total Items | Complete | Active | Planned | Missing Effort | Missing Priority |
| ------------------------- | --------- | ----------- | -------- | ------ | ------- | -------------- | ---------------- |
| Operational Visibility    | Active    | 47          | 32       | 7      | 8       | 3              | 0                |
| M1.5 - Quick Wins         | Paused    | 30          | 1        | 3      | 26      | 8              | 0                |
| M1.6 - Admin Panel        | Paused    | 25          | 0        | 0      | 25      | 12             | 0                |
| M2 - Architecture         | Optional  | 72          | 6        | 1      | 65      | 35             | 8                |
| M3 - Meetings             | Planned   | 6           | 0        | 0      | 6       | 0              | 0                |
| M4 - Expansion            | Planned   | 12          | 0        | 0      | 12      | 12             | 4                |
| M4.5 - Security & Privacy | Planned   | 13          | 0        | 0      | 13      | 0              | 0                |
| M5 - Offline + Steps      | Planned   | 23          | 0        | 0      | 23      | 0              | 0                |
| M6 - Journaling + Safety  | Planned   | 26          | 0        | 0      | 26      | 0              | 0                |
| M7 - Fellowship Suite     | Planned   | 79          | 0        | 0      | 79      | 2              | 0                |
| M8 - Speakers             | Planned   | 3           | 0        | 0      | 3       | 0              | 0                |
| M9 - Native App           | Planned   | 15          | 0        | 0      | 15      | 0              | 0                |
| M10 - Monetization        | Research  | 12          | 0        | 0      | 12      | 12             | 6                |
| Desktop/Web               | Planned   | 18          | 0        | 0      | 18      | 0              | 0                |
| Process & Tooling         | Mixed     | 8           | 1        | 0      | 7       | 5              | 0                |
| Feature Decisions         | Reference | 7           | 2        | 0      | 5       | 7              | 0                |
| **TOTAL**                 | -         | **396**     | **42**   | **11** | **343** | **96**         | **18**           |

---

## Completion Summary

- **Complete:** 42 items (10.6%)
- **Active/In Progress:** 11 items (2.8%)
- **Planned/Pending:** 343 items (86.6%)

---

## Full Item Inventory (Sorted by Milestone)

### Operational Visibility (47 items)

| ID              | Title                                             | Feature Group           | Status   | Effort | Priority |
| --------------- | ------------------------------------------------- | ----------------------- | -------- | ------ | -------- |
| OV-A1           | Wire Sentry client in app/layout.tsx              | Track A - Sentry        | Complete | E1     | P0       |
| OV-A2           | Configure Sentry Cloud Function env vars          | Track A - Sentry        | Complete | E0     | P0       |
| OV-A3           | Admin Errors Tab displays real data               | Track A - Sentry        | Complete | E2     | P0       |
| OV-A3.1         | Add user correlation to Errors Tab                | Track A - Sentry        | Complete | E1     | P0       |
| OV-A4           | Build Admin Logs Tab with GCP deep links          | Track A - Sentry        | Complete | E2     | P0       |
| OV-A5           | Fix Dashboard Tab - adminGetDashboardStats        | Track A - Fixes         | Complete | E1     | P0       |
| OV-A6           | Users Tab - Initial population with pagination    | Track A - Fixes         | Complete | E2     | P0       |
| OV-A7           | Stacked Tabs UI - Replace horizontal scroll       | Track A - Fixes         | Complete | E1     | P0       |
| OV-A8           | Create user privilege types infrastructure        | Track A - Privileges    | Complete | E2     | P0       |
| OV-A9           | Grant privileges in Admin Users screen            | Track A - Privileges    | Complete | E1     | P0       |
| OV-A10          | Cleanup Old Sessions job                          | Track A - Jobs          | Complete | E1     | P0       |
| OV-A11          | Cleanup Orphaned Storage Files job                | Track A - Jobs          | Complete | E1     | P0       |
| OV-A12          | Generate Usage Analytics job                      | Track A - Jobs          | Complete | E1     | P0       |
| OV-A13          | Prune Security Events job                         | Track A - Jobs          | Complete | E1     | P0       |
| OV-A14          | Health Check Notifications job                    | Track A - Jobs          | Complete | E1     | P0       |
| OV-A15          | Password Reset Button in Users Tab                | Track A - Firebase      | Complete | E1     | P1       |
| OV-A16          | Storage Stats in Dashboard                        | Track A - Firebase      | Complete | E1     | P1       |
| OV-A17          | Rate Limit Viewer in Dashboard                    | Track A - Firebase      | Complete | E1     | P1       |
| OV-A18          | Collection Document Counts in Dashboard           | Track A - Firebase      | Complete | E1     | P1       |
| OV-A19          | User Analytics Tab                                | Track A-P2              | Planned  | 3-4hr  | P1       |
| OV-A20          | Job Results Detailed Viewer                       | Track A-P2              | Planned  | 2-3hr  | P1       |
| OV-A21          | Sentry Error to User Correlation                  | Track A-P2              | Planned  | 2-3hr  | P1       |
| OV-A22          | GCP Cloud Logging Query Builder                   | Track A-P2              | Planned  | 3-4hr  | P1       |
| OV-A23          | Error JSON Export with Timeframe Selection        | Track A - Phase 3       | Complete | E1     | P1       |
| OV-A24          | Auto-Refresh Tabs on Switch                       | Track A - Phase 3       | Complete | E1     | P1       |
| OV-A25          | Soft-Delete Users with 30-Day Retention           | Track A - Phase 3       | Complete | E2     | P1       |
| OV-B1           | Create /dev route with auth gate                  | Track B - Dev Dashboard | Planned  | 2hr    | P1       |
| OV-B2           | PERF-001 Lighthouse audit script                  | Track B - Dev Dashboard | Planned  | 2hr    | P1       |
| OV-B3           | Lighthouse Dashboard Tab                          | Track B - Dev Dashboard | Planned  | 3hr    | P1       |
| OV-B4           | Doc Sync Tab                                      | Track B - Dev Dashboard | Planned  | 1hr    | P1       |
| OV-B5           | Testing Integration Tab                           | Track B - Dev Dashboard | Planned  | 4-6hr  | P1       |
| OV-B6           | Audit Threshold Monitoring                        | Track B - Dev Dashboard | Planned  | 2hr    | P1       |
| OV-B7           | PERF-002 Lighthouse CI integration                | Track B - Dev Dashboard | Planned  | 2hr    | P1       |
| OV-B8           | PERF-003 Firestore history storage                | Track B - Dev Dashboard | Planned  | 2hr    | P1       |
| OV-B9-B11       | Error, Session, Override tabs                     | Track B - Dev Dashboard | Planned  | 4hr    | P2       |
| OV-C1           | User Analytics Tab - Admin Panel                  | Track C - UI/UX         | Planned  | 3-4hr  | P2       |
| OV-C2           | Monitoring Consolidation                          | Track C - UI/UX         | Planned  | 4-6hr  | P2       |
| OV-FE-1         | ADMIN-FE-1 Move error knowledge base to Firestore | Future Enhancements     | Planned  | E2     | P2       |
| OV-FE-2         | ADMIN-FE-2 Query GCP Cloud Logging API directly   | Future Enhancements     | Planned  | E3     | P2       |
| OV-FE-3         | SEC-LOG-1 Sensitive log persistence review        | Future Enhancements     | Planned  | E2     | P2       |
| OV-TEST-LOGS    | Logs Tab UI Tests (24 tests)                      | Track A-Test            | Complete | -      | P0       |
| OV-TEST-PRIV-BE | Privileges Backend Tests (16 tests)               | Track A-Test            | Partial  | -      | P0       |
| OV-TEST-PRIV-FE | Privileges Frontend Tests (14 tests)              | Track A-Test            | Partial  | -      | P0       |
| OV-TEST-JOBS    | Background Jobs Tests (30 tests)                  | Track A-Test            | Active   | -      | P0       |
| OV-TEST-SEC     | Security Testing (10 tests)                       | Track A-Test            | Partial  | -      | P0       |
| OV-TEST-INT     | Integration Tests (26 tests)                      | Track A-Test            | Complete | -      | P0       |
| OV-TEST-PERF    | Performance Tests (5 tests)                       | Track A-Test            | Complete | -      | P0       |

### M1.5 - Quick Wins (30 items)

| ID             | Title                                       | Feature Group     | Status   | Effort  | Priority |
| -------------- | ------------------------------------------- | ----------------- | -------- | ------- | -------- |
| M15-CANON-0107 | Missing security headers                    | Audit Backlog     | Planned  | E0      | P0       |
| M15-CANON-0108 | No Firebase Storage rules                   | Audit Backlog     | Planned  | E0      | P0       |
| M15-CANON-0103 | Fix docs:check false positives              | Audit Backlog     | Planned  | E1      | P1       |
| M15-CANON-0104 | Add scripts to session start                | Audit Backlog     | Planned  | E0      | P1       |
| M15-CANON-0105 | Add CANON validation to CI                  | Audit Backlog     | Planned  | E1      | P1       |
| M15-CANON-0106 | Add npm commands for scripts                | Audit Backlog     | Planned  | E0      | P2       |
| M15-LEGACY-001 | Retrofit SSR-safe localStorage              | Audit Backlog     | Planned  | E1      | P2       |
| M15-REFAC-001  | Extract admin.ts/jobs.ts helpers            | Audit Backlog     | Planned  | E2      | P2       |
| M15-CANON-0101 | Missing Quick Start sections                | Audit Backlog     | Planned  | E2      | P2       |
| M15-CANON-0102 | Missing AI Instructions sections            | Audit Backlog     | Planned  | E1      | P2       |
| M15-SAST       | Research SAST Tool Integration              | Research          | Planned  | E1+E2   | P1       |
| M15-001        | Settings page UI                            | UX Features       | Active   | -       | P1       |
| M15-002        | Profile management                          | UX Features       | Active   | -       | P1       |
| M15-003        | Clean date picker improvements              | UX Features       | Active   | -       | P1       |
| M15-004        | Expanded Onboarding Wizard                  | P0 - Critical UX  | Planned  | 8-13 SP | P0       |
| M15-005        | Sponsor Personalization System              | P0 - Critical UX  | Planned  | 8-13 SP | P0       |
| M15-006        | Stage-of-Recovery Selector                  | P0 - Critical UX  | Planned  | 4 SP    | P0       |
| M15-007        | User Documentation & Help System            | P1 - High Value   | Planned  | 5-8 SP  | P1       |
| M15-008        | Sober Fun Ideas Generator                   | P1 - High Value   | Planned  | 3 SP    | P1       |
| M15-009        | Meetings Starting Soon Filter               | P1 - High Value   | Planned  | 3 SP    | P1       |
| M15-010        | Too Tired Mode                              | P2 - Nice to Have | Planned  | 3 SP    | P2       |
| M15-011        | Disguised App Icon + Name                   | P2 - Nice to Have | Planned  | 5 SP    | P2       |
| M15-EFF-001    | Add npm run dev:offline Script              | Engineering       | Planned  | S       | P1       |
| M15-EFF-003    | Add scripts/doctor.js Environment Validator | Engineering       | Planned  | S       | P1       |
| M15-EFF-005    | Cache npm ci in CI Workflow                 | Engineering       | Planned  | S       | P1       |
| M15-AUTO-001   | Wire Session-Start Scripts                  | Process           | Complete | S       | P1       |
| M15-AUTO-002   | Add npm audit to Pre-Push                   | Process           | Planned  | S       | P1       |
| M15-AUTO-003   | Integrate Sentry with Logger                | Process           | Planned  | S       | P1       |
| M15-TEST-001   | Add redactSensitiveUrl Tests                | Testing           | Planned  | S       | P1       |
| M15-TEST-002   | Add Cloud Functions Validation Tests        | Testing           | Planned  | M       | P1       |

### M1.6 - Admin Panel + UX (25 items)

| ID        | Title                                            | Feature Group           | Status  | Effort | Priority |
| --------- | ------------------------------------------------ | ----------------------- | ------- | ------ | -------- |
| M16-P4-1  | adminGetSentryErrorSummary Cloud Function        | Phase 4 - Sentry        | Planned | E1     | P0       |
| M16-P4-2  | Error summary card on Dashboard                  | Phase 4 - Sentry        | Planned | E1     | P0       |
| M16-P4-3  | Errors tab with recent errors                    | Phase 4 - Sentry        | Planned | E2     | P0       |
| M16-P4-4  | Deep links to Sentry for each error              | Phase 4 - Sentry        | Planned | E1     | P0       |
| M16-P4-5  | User ID correlation (link to user detail)        | Phase 4 - Sentry        | Planned | E1     | P1       |
| M16-P5-1  | Recent security events display                   | Phase 5 - GCP           | Planned | E2     | P1       |
| M16-P5-2  | Deep link to GCP Cloud Logging Console           | Phase 5 - GCP           | Planned | E1     | P1       |
| M16-P5-3  | Verify log retention configured (90+ days)       | Phase 5 - GCP           | Planned | E0     | P1       |
| M16-P5-4  | Log sink for long-term archival                  | Phase 5 - GCP           | Planned | E2     | P2       |
| M16-P55-1 | Display local resources in Growth tab            | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-2 | Category filtering (8 categories)                | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-3 | Search/filter by resource name or services       | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-4 | Map view with Nearby feature                     | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-5 | Resource detail cards                            | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-6 | Call and Get Directions quick actions            | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-7 | Sort by distance                                 | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-8 | Resources tab in Admin Panel                     | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P55-9 | CRUD operations for local resources              | Phase 5.5 - Resources   | Planned | -      | P1       |
| M16-P6-1  | Settings panel for Quick Actions customization   | Phase 6 - Quick Actions | Planned | -      | P1       |
| M16-P6-2  | Action selection (choose which actions to show)  | Phase 6 - Quick Actions | Planned | -      | P1       |
| M16-P6-3  | Action ordering (drag-and-drop)                  | Phase 6 - Quick Actions | Planned | -      | P1       |
| M16-P6-4  | Custom phone numbers (sponsor, support contacts) | Phase 6 - Quick Actions | Planned | -      | P1       |
| M16-P6-5  | Save preferences to user profile                 | Phase 6 - Quick Actions | Planned | -      | P1       |
| M16-FUT-1 | Batch Operations (multi-select users)            | Future Enhancements     | Planned | M      | P2       |
| M16-FUT-2 | Dark Mode for Admin Panel                        | Future Enhancements     | Planned | S      | P2       |

### M2 - Architecture Refactor (72 items)

| ID          | Title                                                    | Feature Group             | Status   | Effort | Priority |
| ----------- | -------------------------------------------------------- | ------------------------- | -------- | ------ | -------- |
| M2-MON-1    | Performance monitoring (page load, API latency)          | Deferred Monitoring       | Planned  | -      | P2       |
| M2-MON-2    | User analytics baseline (DAU, retention)                 | Deferred Monitoring       | Planned  | -      | P2       |
| M2-MON-3    | Alert thresholds defined                                 | Deferred Monitoring       | Planned  | -      | P2       |
| M2-INC-P1-1 | GCP budget alerts with Slack/Discord                     | Incident Response Phase 1 | Planned  | 2-3hr  | P1       |
| M2-INC-P1-2 | Log-based metrics for security events                    | Incident Response Phase 1 | Planned  | -      | P1       |
| M2-INC-P1-3 | Sentry alert rules for error rate spikes                 | Incident Response Phase 1 | Planned  | -      | P1       |
| M2-INC-P2-1 | Hot-loadable blocklist in Firestore                      | Incident Response Phase 2 | Planned  | 3-4hr  | P2       |
| M2-INC-P2-2 | Emergency response scripts                               | Incident Response Phase 2 | Planned  | -      | P2       |
| M2-INC-P2-3 | Incident timeline extractor                              | Incident Response Phase 2 | Planned  | -      | P2       |
| M2-INC-P2-4 | Admin panel UI for blocklist                             | Incident Response Phase 2 | Planned  | -      | P2       |
| M2-JOB-1    | Refresh Cache/Indexes job                                | Deferred Background Jobs  | Planned  | -      | P3       |
| M2-JOB-2    | Database Backup Verification job                         | Deferred Background Jobs  | Planned  | -      | P3       |
| M2-SC-PR3   | PR 3: Major Code Quality (~220 issues)                   | SonarCloud Deferred       | Planned  | E3     | P2       |
| M2-SC-PR4   | PR 4: Medium/Minor Priority (~1,095 issues)              | SonarCloud Deferred       | Planned  | E3     | P3       |
| M2-SC-PR5   | PR 5: Security Hotspots (97 hotspots)                    | SonarCloud Deferred       | Planned  | E2     | P2       |
| M2-TOOL-1   | Prettier - Code formatting                               | Developer Tooling         | Complete | -      | P0       |
| M2-TOOL-2   | ESLint - Code linting                                    | Developer Tooling         | Complete | -      | P0       |
| M2-TOOL-3   | madge - Circular dependency detection                    | Developer Tooling         | Complete | -      | P0       |
| M2-TOOL-4   | Pattern Compliance - Anti-pattern detection              | Developer Tooling         | Complete | -      | P0       |
| M2-TOOL-5   | Delta Review Process                                     | Developer Tooling         | Complete | -      | P0       |
| M2-TOOL-6   | Cross-Platform Testing                                   | Developer Tooling         | Planned  | -      | P2       |
| M2-TOOL-7   | knip - Unused export detection                           | Developer Tooling         | Planned  | -      | P2       |
| M2-TOOL-8   | ESLint Import Boundary Rules                             | Developer Tooling         | Planned  | -      | P2       |
| M2-TOOL-9   | Automated Metrics Dashboard                              | Developer Tooling         | Planned  | -      | P2       |
| M2-DEP-1    | recharts 2.x to 3.x migration                            | Dependency Maintenance    | Planned  | -      | P2       |
| M2-DEP-2    | tailwind-merge 2.x to 3.x migration                      | Dependency Maintenance    | Planned  | -      | P2       |
| M2-DEP-3    | react-resizable-panels 2.x to 4.x migration              | Dependency Maintenance    | Planned  | -      | P2       |
| M2-DEP-4    | lucide-react update                                      | Dependency Maintenance    | Planned  | -      | P2       |
| M2-DEP-5    | Add LICENSE file to project                              | Dependency Maintenance    | Planned  | -      | P3       |
| M2-CTX-1    | File-Size Filtering in pattern-check.js                  | Context Optimization      | Complete | E0     | P1       |
| M2-CTX-2    | Shared Path Validation Utility                           | Context Optimization      | Active   | E0     | P1       |
| M2-CTX-3    | Hook Redundancy Analysis                                 | Context Optimization      | Planned  | E0     | P1       |
| M2-CTX-4    | Create codebase-explorer Agent                           | Agent Infrastructure      | Planned  | E2     | P1       |
| M2-CTX-5    | Refactor code-reviewer Skill for Parallelization         | Agent Infrastructure      | Planned  | E2     | P1       |
| M2-CTX-6    | Create agent-router Agent                                | Agent Infrastructure      | Planned  | E1     | P2       |
| M2-CTX-7    | Extract Shared Utilities                                 | Agent Infrastructure      | Planned  | E1     | P2       |
| M2-CTX-8    | Build documentation-enforcement Agent                    | Advanced Optimization     | Planned  | E2     | P3       |
| M2-CTX-9    | Audit All 42 Skills for Parallelization                  | Advanced Optimization     | Planned  | E3     | P3       |
| M2-CTX-10   | Create context-optimizer Agent                           | Advanced Optimization     | Planned  | E2     | P3       |
| M2-DD-1     | Bundle Size Analysis Tab                                 | Dev Dashboard Future      | Planned  | M      | P1       |
| M2-DD-2     | CI/CD Pipeline Status                                    | Dev Dashboard Future      | Planned  | S      | P1       |
| M2-DD-3     | Deployment History                                       | Dev Dashboard Future      | Planned  | S      | P1       |
| M2-DD-4     | Test Coverage Dashboard                                  | Dev Dashboard Future      | Planned  | M      | P2       |
| M2-DD-5     | Dependency Security Tab                                  | Dev Dashboard Future      | Planned  | S      | P2       |
| M2-DD-6     | API Latency Metrics                                      | Dev Dashboard Future      | Planned  | M      | P2       |
| M2-DD-7     | Database Stats                                           | Dev Dashboard Future      | Planned  | S      | P2       |
| M2-DD-8     | Health Check Endpoint                                    | Dev Dashboard Future      | Planned  | S      | P1       |
| M2-DD-9     | Feature Flags Management                                 | Dev Dashboard Future      | Planned  | M      | P2       |
| M2-DD-10    | Cost Monitoring                                          | Dev Dashboard Future      | Planned  | M      | P2       |
| M2-SEC-1    | Manual reCAPTCHA Enterprise Implementation               | Security Hardening        | Active   | -      | P1       |
| M2-SEC-2    | Re-enable Firebase App Check                             | Security Hardening        | Planned  | E2     | P0       |
| M2-DATA-1   | Retry Geocoding for 50 Meeting Addresses                 | Data Quality              | Planned  | E0     | P2       |
| M2-DATA-2   | Revert to next/font/google for Font Optimization         | Data Quality              | Planned  | E0     | P3       |
| M2-CQ-1     | Prettier Formatting (518 files)                          | Code Quality              | Planned  | E0     | P2       |
| M2-CQ-2     | Unused devDependencies removal                           | Code Quality              | Planned  | E0     | P3       |
| M2-CQ-3     | Unlisted dependencies                                    | Code Quality              | Planned  | E0     | P2       |
| M2-CQ-4     | Duplicate exports fix                                    | Code Quality              | Planned  | E0     | P3       |
| M2-CQ-5     | Pattern Compliance - Dev Utility Scripts (79 violations) | Code Quality              | Planned  | E2     | P4       |
| M2-EFF-006  | Add Correlation IDs to Logger                            | Observability             | Planned  | M      | P2       |
| M2-EFF-007  | Add Network Status to Logs                               | Observability             | Planned  | M      | P2       |
| M2-EFF-008  | Create Smoke Test Script                                 | Observability             | Planned  | M      | P2       |
| M2-EFF-009  | Add Bug Report GitHub Template                           | Observability             | Planned  | M      | P2       |
| M2-EFF-010  | Implement Offline Queue (CRITICAL)                       | Offline Support           | Planned  | L      | P0       |
| M2-EFF-011  | Add Offline Tests                                        | Offline Support           | Planned  | L      | P2       |
| M2-EFF-012  | Network Failure Error Handling Tests                     | Offline Support           | Planned  | M      | P2       |
| M2-PERF-003 | Historical Score Tracking                                | Lighthouse                | Planned  | M      | P2       |
| M2-PERF-004 | Performance Budgets                                      | Lighthouse                | Planned  | S      | P2       |
| M2-PERF-005 | Development Dashboard Integration                        | Lighthouse                | Planned  | L      | P2       |
| M2-PERF-006 | PWA Audit Baseline                                       | Lighthouse                | Planned  | S      | P2       |
| M2-ARCH-1   | Component library consolidation                          | Architecture              | Planned  | -      | P2       |
| M2-ARCH-2   | State management standardization                         | Architecture              | Planned  | -      | P2       |
| M2-ARCH-3   | API abstraction layer                                    | Architecture              | Planned  | -      | P2       |

### M3 - Meetings & Location (6 items)

| ID    | Title                          | Feature Group | Status  | Effort | Priority |
| ----- | ------------------------------ | ------------- | ------- | ------ | -------- |
| M3-F1 | Meeting Proximity Detection    | F1            | Planned | 21 SP  | P1       |
| M3-F2 | Meeting Notes                  | F2            | Planned | 13 SP  | P1       |
| M3-F3 | Calendar Integration           | F3            | Planned | 26 SP  | P1       |
| M3-F4 | Virtual Meeting Support        | F4            | Planned | 13 SP  | P1       |
| M3-F5 | Enhanced Meeting Data          | F5            | Planned | 11 SP  | P1       |
| M3-F6 | Celebrate Recovery Integration | F6            | Planned | 13 SP  | P1       |

### M4 - Feature Expansion (12 items)

| ID           | Title                           | Feature Group      | Status  | Effort | Priority |
| ------------ | ------------------------------- | ------------------ | ------- | ------ | -------- |
| M4-001       | Multiple sobriety dates         | Potential Features | Planned | -      | P2       |
| M4-002       | Tone/language settings          | Potential Features | Planned | -      | P2       |
| M4-003       | Craving countdown timer         | Potential Features | Planned | -      | P2       |
| M4-004       | Auto-carry-forward task nudges  | Potential Features | Planned | -      | P2       |
| M4-HALT-P2-1 | Pattern detection analytics     | HALT Phase 2       | Planned | -      | P2       |
| M4-HALT-P2-2 | Weekly/monthly HALT summaries   | HALT Phase 2       | Planned | -      | P2       |
| M4-HALT-P2-3 | Correlation analysis with mood  | HALT Phase 2       | Planned | -      | P2       |
| M4-HALT-P3-1 | Predictive alerts               | HALT Phase 3       | Planned | -      | P2       |
| M4-HALT-P3-2 | Context-aware suggestions       | HALT Phase 3       | Planned | -      | P2       |
| M4-HALT-P3-3 | Reminder system for HALT checks | HALT Phase 3       | Planned | -      | P2       |
| M4-HALT-P4-1 | Anonymous aggregate insights    | HALT Phase 4       | Planned | -      | P2       |
| M4-HALT-P4-2 | AI-powered coping strategies    | HALT Phase 4       | Planned | -      | P2       |

### M4.5 - Security & Privacy (13 items)

| ID    | Title                                      | Feature Group   | Status  | Effort | Priority |
| ----- | ------------------------------------------ | --------------- | ------- | ------ | -------- |
| T4.1  | Tab-level PIN passcode                     | F1 - Encryption | Planned | E2     | P0       |
| T4.2  | PBKDF2 key derivation                      | F1 - Encryption | Planned | E1     | P0       |
| T4.3  | AES-256-GCM encryption engine              | F1 - Encryption | Planned | E2     | P0       |
| T4.4  | Encrypt ALL step work and inventories      | F1 - Encryption | Planned | E2     | P0       |
| T4.6  | Recovery key generation (12-word mnemonic) | F1 - Encryption | Planned | E1     | P0       |
| T4.7  | DEK/KEK key wrapping architecture          | F1 - Encryption | Planned | E2     | P0       |
| T4.9  | Auto-lock timeout                          | F1 - Encryption | Planned | E1     | P0       |
| F4.1  | Offline Queue Trust Indicator              | F2 - Privacy    | Planned | E1     | P1       |
| F4.5  | Guest Mode (sandboxed demo)                | F2 - Privacy    | Planned | E2     | P1       |
| F4.7  | Selective Sync                             | F2 - Privacy    | Planned | E2     | P1       |
| F4.10 | Nuclear Option (account deletion)          | F2 - Privacy    | Planned | E2     | P1       |
| F4.12 | No-Tracking Dashboard                      | F2 - Privacy    | Planned | E1     | P1       |
| F4.14 | Snapshot Protection                        | F2 - Privacy    | Planned | E1     | P2       |

### M5 - Offline + Steps (23 items)

| ID         | Title                               | Feature Group               | Status  | Effort | Priority |
| ---------- | ----------------------------------- | --------------------------- | ------- | ------ | -------- |
| F1.0       | App-wide speech-to-text             | F0 - Input Infrastructure   | Planned | E2     | P1       |
| T1.2       | Custom mutation queue (Dexie.js)    | F1 - Offline Infrastructure | Planned | E2     | P0       |
| T1.3       | Sync worker with exponential retry  | F1 - Offline Infrastructure | Planned | E2     | P0       |
| T1.4       | IndexedDB setup via Dexie.js        | F1 - Offline Infrastructure | Planned | E2     | P0       |
| T1.6       | Storage quota management            | F1 - Offline Infrastructure | Planned | E1     | P1       |
| T1.11      | Multi-device conflict detection UI  | F1 - Offline Infrastructure | Planned | E2     | P1       |
| T1.12      | Conflict resolution strategies      | F1 - Offline Infrastructure | Planned | E2     | P1       |
| T2.2       | sharedPackets collection            | F1 - Offline Infrastructure | Planned | E2     | P0       |
| T2.8       | SyncState per device tracking       | F1 - Offline Infrastructure | Planned | E1     | P1       |
| T2.12      | Soft delete pattern for offline     | F1 - Offline Infrastructure | Planned | E1     | P1       |
| T7.1       | Feature flag for offline rollout    | F1 - Offline Infrastructure | Planned | E1     | P1       |
| T7.2       | PR strategy (types incremental)     | F1 - Offline Infrastructure | Planned | E1     | P1       |
| T7.8       | Unit tests for conflict scenarios   | F1 - Offline Infrastructure | Planned | E2     | P1       |
| T7.9       | Firebase emulator integration tests | F1 - Offline Infrastructure | Planned | E2     | P1       |
| F1.2       | Step Work Worksheets (Steps 2-9)    | F2 - Step Work              | Planned | E3     | P1       |
| F1.2b      | Step Work Worksheets (Steps 11-12)  | F2 - Step Work              | Planned | E2     | P1       |
| M5-STEP-1  | 10th Step Inventory Tool            | F2 - Step Work              | Planned | E2     | P1       |
| M5-STEP-2  | Inventory Templates                 | F2 - Step Work              | Planned | E2     | P1       |
| F1.3       | Interactive step tools              | F3 - Step Enhancements      | Planned | E2     | P1       |
| F5.1       | Tag as Inventory                    | F3 - Step Enhancements      | Planned | E1     | P1       |
| M5-AMENDS  | Amends Tracker                      | F3 - Step Enhancements      | Planned | E2     | P1       |
| F1.4       | I'm Stuck button                    | F4 - Step Context           | Planned | E1     | P1       |
| M5-PATTERN | Pattern Recognition                 | F4 - Step Context           | Planned | E3     | P2       |

### M6 - Journaling + Safety (26 items)

| ID         | Title                                 | Feature Group     | Status  | Effort | Priority |
| ---------- | ------------------------------------- | ----------------- | ------- | ------ | -------- |
| F5.2       | Pattern Matcher (bundled)             | F1 - Journaling   | Planned | E3     | P1       |
| F5.4       | Gratitude Mosaic                      | F1 - Journaling   | Planned | E2     | P1       |
| F5.5       | Time Capsule (On This Day)            | F1 - Journaling   | Planned | E2     | P1       |
| F5.6       | The Wave (Urge Log)                   | F1 - Journaling   | Planned | E2     | P1       |
| F5.9       | Rant Room (audio journal)             | F1 - Journaling   | Planned | E2     | P1       |
| F5.10      | Unsent Letter                         | F1 - Journaling   | Planned | E2     | P1       |
| F5.11      | Dynamic Prompts                       | F1 - Journaling   | Planned | E2     | P1       |
| F5.12      | Meeting Takeaways                     | F1 - Journaling   | Planned | E1     | P1       |
| F5.14      | Brain Dump                            | F1 - Journaling   | Planned | E1     | P1       |
| F9.1       | One Action                            | F1 - Journaling   | Planned | E2     | P1       |
| F9.2       | Bookends (AM/PM routine)              | F1 - Journaling   | Planned | E2     | P1       |
| F9.6       | Pause Protocol                        | F1 - Journaling   | Planned | E1     | P1       |
| F9.7       | Habit Stacker                         | F1 - Journaling   | Planned | E2     | P1       |
| F9.10      | Sleep Hygiene (Wind-Down)             | F1 - Journaling   | Planned | E2     | P1       |
| F7.6       | 30-Day Retrospective                  | F1 - Journaling   | Planned | E2     | P1       |
| F6.5       | Crisis Decision Tree                  | F1 - Journaling   | Planned | E2     | P0       |
| M6-PRAYER  | Prayer Library                        | F1 - Journaling   | Planned | E1     | P1       |
| F10.1      | The Lifeline (emergency)              | F2 - Safety       | Planned | E2     | P0       |
| F10.2      | The Guardrails (trauma gates)         | F2 - Safety       | Planned | E2     | P0       |
| F10.3      | Harm Reduction Locker                 | F2 - Safety       | Planned | E2     | P0       |
| F10.4      | Compassionate U-Turn (relapse)        | F2 - Safety       | Planned | E2     | P1       |
| F12.10     | Intake Interview                      | F3 - Onboarding   | Planned | E2     | P1       |
| F12.11     | Slow Rollout                          | F3 - Onboarding   | Planned | E1     | P1       |
| M6-MED-1   | Daily Meditation                      | Existing Features | Planned | E2     | P1       |
| M6-MED-2   | Guided Meditation                     | Existing Features | Planned | E2     | P1       |
| M6-LICENSE | Content Licensing (AA/NA permissions) | Dependencies      | Planned | -      | P0       |

### M7 - Fellowship Suite (79 items)

| ID           | Title                          | Feature Group            | Status  | Effort | Priority |
| ------------ | ------------------------------ | ------------------------ | ------- | ------ | -------- |
| T2.4         | Sponsor contact storage        | F1 - Sponsor Connection  | Planned | E1     | P1       |
| F2.1         | Sponsor Export + Redaction     | F1 - Sponsor Connection  | Planned | E2     | P1       |
| F2.2         | Hard Conversation Scripts      | F1 - Sponsor Connection  | Planned | E1     | P1       |
| F2.4         | Next Call Agenda               | F1 - Sponsor Connection  | Planned | E1     | P1       |
| F2.5         | Circle of Trust                | F1 - Sponsor Connection  | Planned | E2     | P1       |
| F2.6         | Sponsor Vetting Guide          | F1 - Sponsor Connection  | Planned | E1     | P1       |
| F2.8         | Relapse Autopsy Worksheet      | F1 - Sponsor Connection  | Planned | E2     | P1       |
| F2.9         | Shared Commitments             | F1 - Sponsor Connection  | Planned | E2     | P1       |
| F2.10        | Sponsor Prompt Library         | F1 - Sponsor Connection  | Planned | E1     | P1       |
| T9.9         | Sponsor link UX (QR pairing)   | F1 - Sponsor Connection  | Planned | E2     | P1       |
| M7-SPONSOR-1 | Sponsor contact quick-dial     | F1 - Sponsor Connection  | Planned | E1     | P1       |
| M7-SPONSOR-2 | Sponsor dashboard              | F1 - Sponsor Connection  | Planned | E2     | P1       |
| F5.8         | Service Points                 | F2 - Service             | Planned | E2     | P1       |
| F9.4         | Compassionate Milestones       | F3 - Engagement          | Planned | E2     | P1       |
| F9.5         | Share Pocket                   | F3 - Engagement          | Planned | E1     | P1       |
| F7.1         | Recovery Resume                | F4 - Exports             | Planned | E2     | P1       |
| F7.2         | Step Packets                   | F4 - Exports             | Planned | E2     | P1       |
| F7.4         | Emergency Wallet Card          | F4 - Exports             | Planned | E1     | P1       |
| F7.5         | Full Archive                   | F4 - Exports             | Planned | E2     | P1       |
| F7.7         | Clinical Hand-Off              | F4 - Exports             | Planned | E2     | P1       |
| F7.8         | Amends Ledger                  | F4 - Exports             | Planned | E2     | P1       |
| F7.10        | Service Log                    | F4 - Exports             | Planned | E1     | P1       |
| F7.11        | Incident Report                | F4 - Exports             | Planned | E2     | P1       |
| T5.2         | Client-side only PDF           | F4 - Exports             | Planned | E2     | P1       |
| T5.3         | EXIF stripping                 | F4 - Exports             | Planned | E1     | P1       |
| T5.5         | Preview screen before generate | F4 - Exports             | Planned | E1     | P1       |
| T5.6         | Sponsor packet builder UI      | F4 - Exports             | Planned | E2     | P1       |
| T5.7         | Watermark option               | F4 - Exports             | Planned | E1     | P1       |
| T5.8         | Web Share API                  | F4 - Exports             | Planned | E1     | P1       |
| F3.2         | Safe Spaces Map                | F5 - Nashville Advantage | Planned | E2     | P1       |
| F3.3         | My Sober Circuit               | F5 - Nashville Advantage | Planned | E2     | P1       |
| F3.4         | Meeting After Meeting          | F5 - Nashville Advantage | Planned | E1     | P1       |
| F3.5         | Broadway Escape Plan           | F5 - Nashville Advantage | Planned | E2     | P1       |
| F3.6         | Clubhouse Status Hub           | F5 - Nashville Advantage | Planned | E2     | P1       |
| F3.7         | First 72 Hours                 | F5 - Nashville Advantage | Planned | E2     | P1       |
| F3.8         | Sober-Friendly Events          | F5 - Nashville Advantage | Planned | E2     | P1       |
| M7-NASH      | Nashville meeting proximity    | F5 - Nashville Advantage | Planned | -      | P1       |
| F6.2         | Am I Doing This Right?         | F6 - Knowledge Base      | Planned | E1     | P1       |
| F6.3         | Smart Glossary                 | F6 - Knowledge Base      | Planned | E2     | P1       |
| F6.4         | Script Lab                     | F6 - Knowledge Base      | Planned | E2     | P1       |
| F6.6         | Daily Principle Deck           | F6 - Knowledge Base      | Planned | E1     | P1       |
| F6.7         | Anatomy of a Meeting           | F6 - Knowledge Base      | Planned | E2     | P1       |
| F6.8         | Normie Translator              | F6 - Knowledge Base      | Planned | E1     | P1       |
| F6.9         | Service Menu                   | F6 - Knowledge Base      | Planned | E1     | P1       |
| F6.10        | Fellowship Compass             | F6 - Knowledge Base      | Planned | E2     | P1       |
| F6.11        | Traditions in Real Life        | F6 - Knowledge Base      | Planned | E2     | P1       |
| F6.12        | Readiness Checkers             | F6 - Knowledge Base      | Planned | E1     | P1       |
| T9.5         | FlexSearch                     | F6 - Knowledge Base      | Planned | E2     | P1       |
| M7-STEPS     | Plain English Steps            | F6 - Knowledge Base      | Planned | E1     | P1       |
| M7-LIB       | Recovery Library               | F6 - Knowledge Base      | Planned | -      | P1       |
| F10.5        | The Canary                     | F7 - Safety              | Planned | E2     | P1       |
| F10.6        | Medical ID                     | F7 - Safety              | Planned | E1     | P1       |
| F10.7        | Never Use Alone                | F7 - Safety              | Planned | E1     | P1       |
| F10.8        | Exit Strategy Scripts          | F7 - Safety              | Planned | E2     | P1       |
| F10.9        | Detox Navigator                | F7 - Safety              | Planned | E2     | P1       |
| F8.1         | Rosetta Stone                  | F8 - Personalization     | Planned | E2     | P1       |
| F8.4         | Nudge Engine                   | F8 - Personalization     | Planned | E2     | P1       |
| F8.5         | Name Your Power                | F8 - Personalization     | Planned | E1     | P1       |
| F8.6         | The Focus                      | F8 - Personalization     | Planned | E2     | P1       |
| F8.7         | Notebook Aesthetics            | F8 - Personalization     | Planned | E2     | P1       |
| F8.8         | The Why Anchor                 | F8 - Personalization     | Planned | E1     | P1       |
| F8.9         | Accessibility Plus             | F8 - Personalization     | Planned | E2     | P1       |
| F8.10        | Red Line List                  | F8 - Personalization     | Planned | E2     | P1       |
| F8.11        | Sponsor Link Status            | F8 - Personalization     | Planned | E1     | P1       |
| M7-PHASE     | Journey Phase                  | F8 - Personalization     | Planned | E1     | P1       |
| M7-DASH      | Dashboard Builder              | F8 - Personalization     | Planned | E2     | P1       |
| T6.3         | Action event taxonomy          | F9 - Analytics           | Planned | E1     | P1       |
| T6.4         | Word count buckets             | F9 - Analytics           | Planned | E1     | P1       |
| T6.5         | Sync performance tracking      | F9 - Analytics           | Planned | E1     | P1       |
| T6.8         | 90-day retention               | F9 - Analytics           | Planned | E1     | P1       |
| T9.2         | Data retention policy          | F9 - Analytics           | Planned | E2     | P1       |
| T9.12        | Backup UX                      | F9 - Analytics           | Planned | E1     | P1       |
| M7-ANLY      | Analytics toggle               | F9 - Analytics           | Planned | E1     | P1       |
| F11.6        | Scroll of Life                 | F10 - Visionary          | Planned | E3     | P2       |
| F11.8        | 90-in-90 Passport              | F10 - Visionary          | Planned | E2     | P2       |
| F12.1        | Savings Ticker                 | F11 - Financial          | Planned | E2     | P1       |
| F12.2        | Wreckage List                  | F11 - Financial          | Planned | E2     | P1       |
| F12.7        | Sponsee CRM                    | F11 - Financial          | Planned | E2     | P1       |
| F12.8        | Speaker's Outline              | F11 - Financial          | Planned | E2     | P1       |

### M8 - Speaker Recordings (3 items)

| ID    | Title              | Feature Group | Status  | Effort | Priority |
| ----- | ------------------ | ------------- | ------- | ------ | -------- |
| M8-F1 | Speaker Library    | F1            | Planned | 26 SP  | P2       |
| M8-F2 | Personal Recording | F2            | Planned | 21 SP  | P2       |
| M8-F3 | Audio Player       | F3            | Planned | 16 SP  | P2       |

### M9 - Native App Features (15 items)

| ID     | Title                                 | Feature Group          | Status  | Effort | Priority |
| ------ | ------------------------------------- | ---------------------- | ------- | ------ | -------- |
| T8.1   | Capacitor wrapper (CRITICAL)          | F1 - Native Security   | Planned | E3     | P0       |
| T8.4   | Native biometrics (Face ID/Touch ID)  | F1 - Native Security   | Planned | E2     | P0       |
| T8.5   | Native secure storage                 | F1 - Native Security   | Planned | E2     | P0       |
| T4.10  | Biometric unlock                      | F1 - Deferred Native   | Planned | E2     | P1       |
| F4.4   | Stealth Mode                          | F1 - Deferred Native   | Planned | E2     | P1       |
| F5.4b  | Gratitude widget/shake                | F1 - Deferred Native   | Planned | E2     | P1       |
| F5.9b  | Voice tone analysis                   | F1 - Deferred Native   | Planned | E3     | P2       |
| F9.9   | Nashville Sound                       | F1 - Deferred Native   | Planned | E2     | P2       |
| F9.11  | Drive Time Companion                  | F1 - Deferred Native   | Planned | E3     | P2       |
| F12.4  | Stress Monitor                        | F2 - Native Health     | Planned | E2     | P2       |
| F12.5  | Sleep Truth                           | F2 - Native Health     | Planned | E2     | P2       |
| F12.6  | Movement as Medicine                  | F2 - Native Health     | Planned | E2     | P2       |
| F11.1  | SoNash Beacon                         | F3 - Native Engagement | Planned | E3     | P2       |
| T9.1   | Push notifications                    | F3 - Native Engagement | Planned | E2     | P1       |
| M9-TBD | Additional native engagement features | F3 - Native Engagement | Planned | -      | P3       |

### M10 - Monetization + Future (12 items)

| ID          | Title                               | Feature Group  | Status   | Effort | Priority |
| ----------- | ----------------------------------- | -------------- | -------- | ------ | -------- |
| M10-MODEL-1 | Premium Features (Ethical Freemium) | Viable Options | Research | -      | P2       |
| M10-MODEL-2 | Donation Model                      | Viable Options | Research | -      | P2       |
| M10-MODEL-3 | B2B Licensing                       | Viable Options | Research | -      | P2       |
| M10-MODEL-4 | Hybrid Approach (Recommended)       | Viable Options | Research | -      | P1       |
| F4.11       | Shoulder Surf Blur                  | Deferred       | Research | -      | P3       |
| T3.14       | Queue compaction                    | Deferred       | Research | -      | P3       |
| F11.2       | Reclaiming City map                 | Deferred       | Research | -      | P3       |
| F11.3       | Digital Coffee Table                | Deferred       | Research | -      | P3       |
| F11.4       | Warm Handoff B2B                    | Deferred       | Research | -      | P3       |
| F11.5       | The Mirror AI companion             | Deferred       | Research | -      | P3       |
| F11.7       | Family Bridge                       | Deferred       | Research | -      | P3       |
| F11.9       | Service Exchange                    | Deferred       | Research | -      | P3       |

### Desktop/Web Enhancements (18 items)

| ID     | Title                              | Feature Group           | Status  | Effort | Priority |
| ------ | ---------------------------------- | ----------------------- | ------- | ------ | -------- |
| DW-001 | Split-screen views                 | Multi-Panel Layout      | Planned | E2     | P2       |
| DW-002 | Dashboard mode (4-panel grid)      | Multi-Panel Layout      | Planned | E2     | P2       |
| DW-003 | Resizable panels                   | Multi-Panel Layout      | Planned | E2     | P2       |
| DW-004 | Keyboard shortcuts (basic)         | Multi-Panel Layout      | Planned | E1     | P2       |
| DW-005 | Mood heat map (calendar view)      | Advanced Visualizations | Planned | E2     | P2       |
| DW-006 | Correlation matrix                 | Advanced Visualizations | Planned | E3     | P2       |
| DW-007 | Trend lines (multiple metrics)     | Advanced Visualizations | Planned | E2     | P2       |
| DW-008 | Word clouds from journal           | Advanced Visualizations | Planned | E2     | P2       |
| DW-009 | Export charts as PNG/SVG           | Advanced Visualizations | Planned | E1     | P2       |
| DW-010 | J/K Navigate timeline              | Keyboard Shortcuts      | Planned | E1     | P2       |
| DW-011 | Vim-style navigation               | Keyboard Shortcuts      | Planned | E2     | P3       |
| DW-012 | CSV/JSON/PDF export                | Export & Backup         | Planned | E2     | P2       |
| DW-013 | Automated cloud backup             | Export & Backup         | Planned | E2     | P2       |
| DW-014 | Sponsor report generation          | Export & Backup         | Planned | E2     | P2       |
| DW-015 | Full-text search                   | Search & Filter         | Planned | E2     | P1       |
| DW-016 | Advanced filters                   | Search & Filter         | Planned | E2     | P2       |
| DW-017 | Admin Panel mobile-friendly layout | Mobile Responsiveness   | Planned | E2     | P2       |
| DW-018 | On-call admin scenarios support    | Mobile Responsiveness   | Planned | E2     | P2       |

### Process & Tooling (8 items)

| ID     | Title                          | Feature Group         | Status   | Effort | Priority |
| ------ | ------------------------------ | --------------------- | -------- | ------ | -------- |
| PT-001 | Session Activity Monitor       | Development Dashboard | Planned  | -      | P1       |
| PT-002 | Error & Tracing Viewer         | Development Dashboard | Planned  | -      | P1       |
| PT-003 | Override Audit Trail           | Development Dashboard | Planned  | -      | P2       |
| PT-004 | Document Sync Status           | Development Dashboard | Planned  | -      | P1       |
| PT-005 | Cross-Document Dependency Map  | Cross-Document        | Complete | -      | P1       |
| PT-006 | Pre-Commit Hook Integration    | Doc Automation        | Planned  | -      | P3       |
| PT-007 | Pre-Push Hook Integration      | Doc Automation        | Planned  | -      | P2       |
| PT-008 | CI/CD Integration for doc sync | Doc Automation        | Planned  | -      | P1       |

### Feature Decisions Table (7 items)

| ID     | Title                   | Feature Group | Status       | Effort | Priority |
| ------ | ----------------------- | ------------- | ------------ | ------ | -------- |
| FD-001 | Recovery Library        | Decisions     | Approved     | -      | P0       |
| FD-002 | HALT Check              | Decisions     | Approved     | -      | P1       |
| FD-003 | God Box                 | Decisions     | Deferred     | -      | P3       |
| FD-004 | Complacency Detector    | Decisions     | Needs Review | -      | P2       |
| FD-005 | Tone Settings           | Decisions     | Needs Review | -      | P1       |
| FD-006 | Multiple Sobriety Dates | Decisions     | Needs Review | -      | P2       |
| FD-007 | Principle-Based Badges  | Decisions     | Approved     | -      | P2       |

---

## Items Missing Effort/Priority

### Missing Effort (96 items)

| ID           | Milestone | Title                                            |
| ------------ | --------- | ------------------------------------------------ |
| M15-001      | M1.5      | Settings page UI                                 |
| M15-002      | M1.5      | Profile management                               |
| M15-003      | M1.5      | Clean date picker improvements                   |
| M16-P55-1    | M1.6      | Display local resources in Growth tab            |
| M16-P55-2    | M1.6      | Category filtering (8 categories)                |
| M16-P55-3    | M1.6      | Search/filter by resource name or services       |
| M16-P55-4    | M1.6      | Map view with Nearby feature                     |
| M16-P55-5    | M1.6      | Resource detail cards                            |
| M16-P55-6    | M1.6      | Call and Get Directions quick actions            |
| M16-P55-7    | M1.6      | Sort by distance                                 |
| M16-P55-8    | M1.6      | Resources tab in Admin Panel                     |
| M16-P55-9    | M1.6      | CRUD operations for local resources              |
| M16-P6-1     | M1.6      | Settings panel for Quick Actions customization   |
| M16-P6-2     | M1.6      | Action selection (choose which actions to show)  |
| M16-P6-3     | M1.6      | Action ordering (drag-and-drop)                  |
| M16-P6-4     | M1.6      | Custom phone numbers (sponsor, support contacts) |
| M16-P6-5     | M1.6      | Save preferences to user profile                 |
| M2-MON-1     | M2        | Performance monitoring (page load, API latency)  |
| M2-MON-2     | M2        | User analytics baseline (DAU, retention)         |
| M2-MON-3     | M2        | Alert thresholds defined                         |
| M2-INC-P1-2  | M2        | Log-based metrics for security events            |
| M2-INC-P1-3  | M2        | Sentry alert rules for error rate spikes         |
| M2-INC-P2-2  | M2        | Emergency response scripts                       |
| M2-INC-P2-3  | M2        | Incident timeline extractor                      |
| M2-INC-P2-4  | M2        | Admin panel UI for blocklist                     |
| M2-JOB-1     | M2        | Refresh Cache/Indexes job                        |
| M2-JOB-2     | M2        | Database Backup Verification job                 |
| M2-TOOL-1    | M2        | Prettier - Code formatting                       |
| M2-TOOL-2    | M2        | ESLint - Code linting                            |
| M2-TOOL-3    | M2        | madge - Circular dependency detection            |
| M2-TOOL-4    | M2        | Pattern Compliance - Anti-pattern detection      |
| M2-TOOL-5    | M2        | Delta Review Process                             |
| M2-TOOL-6    | M2        | Cross-Platform Testing                           |
| M2-TOOL-7    | M2        | knip - Unused export detection                   |
| M2-TOOL-8    | M2        | ESLint Import Boundary Rules                     |
| M2-TOOL-9    | M2        | Automated Metrics Dashboard                      |
| M2-DEP-1     | M2        | recharts 2.x to 3.x migration                    |
| M2-DEP-2     | M2        | tailwind-merge 2.x to 3.x migration              |
| M2-DEP-3     | M2        | react-resizable-panels 2.x to 4.x migration      |
| M2-DEP-4     | M2        | lucide-react update                              |
| M2-DEP-5     | M2        | Add LICENSE file to project                      |
| M2-SEC-1     | M2        | Manual reCAPTCHA Enterprise Implementation       |
| M2-ARCH-1    | M2        | Component library consolidation                  |
| M2-ARCH-2    | M2        | State management standardization                 |
| M2-ARCH-3    | M2        | API abstraction layer                            |
| M4-001       | M4        | Multiple sobriety dates                          |
| M4-002       | M4        | Tone/language settings                           |
| M4-003       | M4        | Craving countdown timer                          |
| M4-004       | M4        | Auto-carry-forward task nudges                   |
| M4-HALT-P2-1 | M4        | Pattern detection analytics                      |
| M4-HALT-P2-2 | M4        | Weekly/monthly HALT summaries                    |
| M4-HALT-P2-3 | M4        | Correlation analysis with mood                   |
| M4-HALT-P3-1 | M4        | Predictive alerts                                |
| M4-HALT-P3-2 | M4        | Context-aware suggestions                        |
| M4-HALT-P3-3 | M4        | Reminder system for HALT checks                  |
| M4-HALT-P4-1 | M4        | Anonymous aggregate insights                     |
| M4-HALT-P4-2 | M4        | AI-powered coping strategies                     |
| M6-LICENSE   | M6        | Content Licensing (AA/NA permissions)            |
| M7-NASH      | M7        | Nashville meeting proximity                      |
| M7-LIB       | M7        | Recovery Library                                 |
| M9-TBD       | M9        | Additional native engagement features            |
| M10-MODEL-1  | M10       | Premium Features (Ethical Freemium)              |
| M10-MODEL-2  | M10       | Donation Model                                   |
| M10-MODEL-3  | M10       | B2B Licensing                                    |
| M10-MODEL-4  | M10       | Hybrid Approach (Recommended)                    |
| F4.11        | M10       | Shoulder Surf Blur                               |
| T3.14        | M10       | Queue compaction                                 |
| F11.2        | M10       | Reclaiming City map                              |
| F11.3        | M10       | Digital Coffee Table                             |
| F11.4        | M10       | Warm Handoff B2B                                 |
| F11.5        | M10       | The Mirror AI companion                          |
| F11.7        | M10       | Family Bridge                                    |
| F11.9        | M10       | Service Exchange                                 |
| PT-001       | Process   | Session Activity Monitor                         |
| PT-002       | Process   | Error & Tracing Viewer                           |
| PT-003       | Process   | Override Audit Trail                             |
| PT-004       | Process   | Document Sync Status                             |
| PT-005       | Process   | Cross-Document Dependency Map                    |
| PT-006       | Process   | Pre-Commit Hook Integration                      |
| PT-007       | Process   | Pre-Push Hook Integration                        |
| PT-008       | Process   | CI/CD Integration for doc sync                   |
| FD-001       | Decisions | Recovery Library                                 |
| FD-002       | Decisions | HALT Check                                       |
| FD-003       | Decisions | God Box                                          |
| FD-004       | Decisions | Complacency Detector                             |
| FD-005       | Decisions | Tone Settings                                    |
| FD-006       | Decisions | Multiple Sobriety Dates                          |
| FD-007       | Decisions | Principle-Based Badges                           |

### Missing Priority (18 items)

| ID          | Milestone | Title                            |
| ----------- | --------- | -------------------------------- |
| M2-MON-1    | M2        | Performance monitoring           |
| M2-MON-2    | M2        | User analytics baseline          |
| M2-MON-3    | M2        | Alert thresholds defined         |
| M2-JOB-1    | M2        | Refresh Cache/Indexes job        |
| M2-JOB-2    | M2        | Database Backup Verification job |
| M2-ARCH-1   | M2        | Component library consolidation  |
| M2-ARCH-2   | M2        | State management standardization |
| M2-ARCH-3   | M2        | API abstraction layer            |
| M4-001      | M4        | Multiple sobriety dates          |
| M4-002      | M4        | Tone/language settings           |
| M4-003      | M4        | Craving countdown timer          |
| M4-004      | M4        | Auto-carry-forward task nudges   |
| M10-MODEL-1 | M10       | Premium Features                 |
| M10-MODEL-2 | M10       | Donation Model                   |
| M10-MODEL-3 | M10       | B2B Licensing                    |
| F4.11       | M10       | Shoulder Surf Blur               |
| T3.14       | M10       | Queue compaction                 |
| F11.2       | M10       | Reclaiming City map              |

---

## Appendix: Status Definitions

| Status       | Description                             |
| ------------ | --------------------------------------- |
| Complete     | Work finished and verified              |
| Active       | Currently being worked on               |
| Partial      | Some tests passing, work in progress    |
| Planned      | Scheduled for future work               |
| Paused       | Work suspended temporarily              |
| Research     | Exploratory/investigation phase         |
| Needs Review | Requires decision before proceeding     |
| Deferred     | Postponed indefinitely                  |
| Approved     | Decision made, ready for implementation |

---

## Appendix: Effort Scale

| Code | Description  | Time Estimate              |
| ---- | ------------ | -------------------------- |
| E0   | Trivial      | < 30 minutes               |
| E1   | Small        | 1-2 hours                  |
| E2   | Medium       | 3-8 hours                  |
| E3   | Large        | 1-3 days                   |
| S    | Small        | 1-2 hours                  |
| M    | Medium       | 3-8 hours                  |
| L    | Large        | 1-3 days                   |
| SP   | Story Points | Varies (see Agile Process) |

---

_Generated by Claude Code on 2026-01-24_

---

## Version History

| Version | Date       | Author | Changes                                   |
| ------- | ---------- | ------ | ----------------------------------------- |
| 1.0     | 2026-01-24 | Claude | Initial inventory of 396 items            |
| 1.1     | 2026-01-27 | Claude | Added Purpose section and Version History |
