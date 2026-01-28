# ROADMAP Effort Estimates - Missing Items

**Generated:** 2026-01-24 | **Last Updated:** 2026-01-27 **Estimator:** Claude
Code **Total Items Estimated:** 96

---

## Purpose

This document provides effort estimates for 96 ROADMAP items that were
previously missing estimation data. Using a standardized E0-E3 effort scale,
these estimates enable capacity planning, milestone sizing validation, and
identification of overloaded milestones requiring splitting.

---

## Effort Scale Reference

| Code | Story Points | Time      | Criteria                                            |
| ---- | ------------ | --------- | --------------------------------------------------- |
| E0   | 1-2 SP       | 1-2 hours | Config change, text update, toggle, single-line fix |
| E1   | 3-5 SP       | 1 day     | Single component, one API endpoint, simple feature  |
| E2   | 8-13 SP      | 2-3 days  | Multiple components, API + UI, moderate complexity  |
| E3   | 21+ SP       | 1 week+   | Cross-system, R&D required, new infrastructure      |

---

## Effort Estimates by Milestone

### Operational Visibility (3 items)

| ID     | Title                            | Estimate | Justification                                                            |
| ------ | -------------------------------- | -------- | ------------------------------------------------------------------------ |
| OV-A19 | User Analytics Tab               | E2       | Multiple data queries, visualization components, admin panel integration |
| OV-A20 | Job Results Detailed Viewer      | E1       | Single UI component displaying existing job data                         |
| OV-A21 | Sentry Error to User Correlation | E1       | Linking existing data between two systems                                |

### M1.5 - Quick Wins (8 items)

| ID      | Title                            | Estimate | Justification                                         |
| ------- | -------------------------------- | -------- | ----------------------------------------------------- |
| M15-001 | Settings page UI                 | E2       | Multiple form sections, state management, persistence |
| M15-002 | Profile management               | E2       | Form UI + validation + backend integration            |
| M15-003 | Clean date picker improvements   | E1       | Enhancement to existing component                     |
| M15-004 | Expanded Onboarding Wizard       | E2       | Multi-step wizard with 8-13 SP listed = E2            |
| M15-005 | Sponsor Personalization System   | E2       | Configuration UI + storage with 8-13 SP listed = E2   |
| M15-006 | Stage-of-Recovery Selector       | E1       | Simple selector with 4 SP listed = E1                 |
| M15-007 | User Documentation & Help System | E2       | Content + search + navigation with 5-8 SP = E2        |
| M15-008 | Sober Fun Ideas Generator        | E1       | Content display with 3 SP = E1                        |

### M1.6 - Admin Panel (12 items)

| ID        | Title                                            | Estimate | Justification                                       |
| --------- | ------------------------------------------------ | -------- | --------------------------------------------------- |
| M16-P55-1 | Display local resources in Growth tab            | E1       | Data fetching + list display                        |
| M16-P55-2 | Category filtering (8 categories)                | E1       | Filter UI component                                 |
| M16-P55-3 | Search/filter by resource name or services       | E1       | Search input + filtering logic                      |
| M16-P55-4 | Map view with Nearby feature                     | E2       | Map integration + geolocation requires external API |
| M16-P55-5 | Resource detail cards                            | E1       | Single presentational component                     |
| M16-P55-6 | Call and Get Directions quick actions            | E1       | Native link handlers                                |
| M16-P55-7 | Sort by distance                                 | E1       | Sorting function with geolocation                   |
| M16-P55-8 | Resources tab in Admin Panel                     | E1       | Tab addition + data table                           |
| M16-P55-9 | CRUD operations for local resources              | E2       | Full CRUD with forms, validation, Cloud Functions   |
| M16-P6-1  | Settings panel for Quick Actions customization   | E2       | Custom settings UI with persistence                 |
| M16-P6-2  | Action selection (choose which actions to show)  | E1       | Checkbox/toggle list                                |
| M16-P6-3  | Action ordering (drag-and-drop)                  | E2       | Drag-and-drop implementation requires complex state |
| M16-P6-4  | Custom phone numbers (sponsor, support contacts) | E1       | Form field + validation                             |
| M16-P6-5  | Save preferences to user profile                 | E1       | Profile update integration                          |

### M2 - Architecture (35 items)

| ID          | Title                                           | Estimate | Justification                              |
| ----------- | ----------------------------------------------- | -------- | ------------------------------------------ |
| M2-MON-1    | Performance monitoring (page load, API latency) | E2       | Instrumentation across multiple components |
| M2-MON-2    | User analytics baseline (DAU, retention)        | E2       | Analytics pipeline + dashboard             |
| M2-MON-3    | Alert thresholds defined                        | E1       | Configuration + documentation              |
| M2-INC-P1-2 | Log-based metrics for security events           | E1       | GCP metric configuration                   |
| M2-INC-P1-3 | Sentry alert rules for error rate spikes        | E0       | Sentry dashboard configuration             |
| M2-INC-P2-2 | Emergency response scripts                      | E2       | Multiple scripts with error handling       |
| M2-INC-P2-3 | Incident timeline extractor                     | E2       | Data aggregation across multiple sources   |
| M2-INC-P2-4 | Admin panel UI for blocklist                    | E1       | Simple CRUD UI for blocklist entries       |
| M2-JOB-1    | Refresh Cache/Indexes job                       | E1       | Scheduled Cloud Function                   |
| M2-JOB-2    | Database Backup Verification job                | E1       | Scheduled verification script              |
| M2-TOOL-1   | Prettier - Code formatting                      | E0       | Already complete, config only              |
| M2-TOOL-2   | ESLint - Code linting                           | E0       | Already complete, config only              |
| M2-TOOL-3   | madge - Circular dependency detection           | E0       | Already complete, config only              |
| M2-TOOL-4   | Pattern Compliance - Anti-pattern detection     | E0       | Already complete                           |
| M2-TOOL-5   | Delta Review Process                            | E0       | Already complete, process definition       |
| M2-TOOL-6   | Cross-Platform Testing                          | E2       | Test infrastructure across OS/browsers     |
| M2-TOOL-7   | knip - Unused export detection                  | E1       | Tool integration + config                  |
| M2-TOOL-8   | ESLint Import Boundary Rules                    | E1       | ESLint plugin configuration                |
| M2-TOOL-9   | Automated Metrics Dashboard                     | E2       | Dashboard with data aggregation            |
| M2-DEP-1    | recharts 2.x to 3.x migration                   | E2       | Breaking changes across chart components   |
| M2-DEP-2    | tailwind-merge 2.x to 3.x migration             | E1       | Dependency update with minor changes       |
| M2-DEP-3    | react-resizable-panels 2.x to 4.x migration     | E1       | API changes in panel components            |
| M2-DEP-4    | lucide-react update                             | E0       | Minor version update                       |
| M2-DEP-5    | Add LICENSE file to project                     | E0       | Single file creation                       |
| M2-SEC-1    | Manual reCAPTCHA Enterprise Implementation      | E2       | External API integration + UI              |
| M2-ARCH-1   | Component library consolidation                 | E3       | Cross-system refactoring of UI components  |
| M2-ARCH-2   | State management standardization                | E3       | Architectural changes across entire app    |
| M2-ARCH-3   | API abstraction layer                           | E3       | New infrastructure layer                   |

### M4 - Feature Expansion (12 items)

| ID           | Title                           | Estimate | Justification                                  |
| ------------ | ------------------------------- | -------- | ---------------------------------------------- |
| M4-001       | Multiple sobriety dates         | E2       | Schema change + UI for multiple dates          |
| M4-002       | Tone/language settings          | E1       | Settings UI + text content switching           |
| M4-003       | Craving countdown timer         | E1       | Timer component + notification                 |
| M4-004       | Auto-carry-forward task nudges  | E1       | Background job + simple UI nudge               |
| M4-HALT-P2-1 | Pattern detection analytics     | E2       | Data analysis pipeline                         |
| M4-HALT-P2-2 | Weekly/monthly HALT summaries   | E2       | Aggregation + visualization                    |
| M4-HALT-P2-3 | Correlation analysis with mood  | E2       | Statistical analysis + visualization           |
| M4-HALT-P3-1 | Predictive alerts               | E3       | ML/rule-based prediction requires R&D          |
| M4-HALT-P3-2 | Context-aware suggestions       | E3       | AI/ML component for contextual recommendations |
| M4-HALT-P3-3 | Reminder system for HALT checks | E1       | Notification scheduling                        |
| M4-HALT-P4-1 | Anonymous aggregate insights    | E2       | Aggregation pipeline + privacy considerations  |
| M4-HALT-P4-2 | AI-powered coping strategies    | E3       | AI integration requires new infrastructure     |

### M6 - Journaling + Safety (1 item)

| ID         | Title                                 | Estimate | Justification                            |
| ---------- | ------------------------------------- | -------- | ---------------------------------------- |
| M6-LICENSE | Content Licensing (AA/NA permissions) | E1       | Legal/administrative task, not technical |

### M7 - Fellowship Suite (2 items)

| ID      | Title                       | Estimate | Justification                          |
| ------- | --------------------------- | -------- | -------------------------------------- |
| M7-NASH | Nashville meeting proximity | E2       | Geolocation + meeting data integration |
| M7-LIB  | Recovery Library            | E2       | Content management + search + display  |

### M9 - Native App (1 item)

| ID     | Title                                 | Estimate | Justification                                            |
| ------ | ------------------------------------- | -------- | -------------------------------------------------------- |
| M9-TBD | Additional native engagement features | E3       | Placeholder for native-specific features, assume complex |

### M10 - Monetization (12 items)

| ID          | Title                               | Estimate | Justification                                   |
| ----------- | ----------------------------------- | -------- | ----------------------------------------------- |
| M10-MODEL-1 | Premium Features (Ethical Freemium) | E3       | Payment infrastructure + feature gating         |
| M10-MODEL-2 | Donation Model                      | E2       | Payment integration for donations               |
| M10-MODEL-3 | B2B Licensing                       | E3       | Enterprise features + licensing infrastructure  |
| M10-MODEL-4 | Hybrid Approach (Recommended)       | E3       | Combination of multiple monetization strategies |
| F4.11       | Shoulder Surf Blur                  | E2       | Privacy UI overlay implementation               |
| T3.14       | Queue compaction                    | E2       | Offline queue optimization                      |
| F11.2       | Reclaiming City map                 | E3       | Full mapping feature with user data             |
| F11.3       | Digital Coffee Table                | E3       | Social sharing platform feature                 |
| F11.4       | Warm Handoff B2B                    | E3       | B2B integration with treatment centers          |
| F11.5       | The Mirror AI companion             | E3       | AI-powered companion requires ML infrastructure |
| F11.7       | Family Bridge                       | E3       | Multi-user communication platform               |
| F11.9       | Service Exchange                    | E3       | Marketplace-style feature                       |

### Process & Tooling (5 items)

| ID     | Title                          | Estimate | Justification                           |
| ------ | ------------------------------ | -------- | --------------------------------------- |
| PT-001 | Session Activity Monitor       | E1       | Dev dashboard tab with activity display |
| PT-002 | Error & Tracing Viewer         | E2       | Log aggregation + display               |
| PT-003 | Override Audit Trail           | E1       | Audit log display                       |
| PT-004 | Document Sync Status           | E1       | Status dashboard component              |
| PT-005 | Cross-Document Dependency Map  | E0       | Already complete                        |
| PT-006 | Pre-Commit Hook Integration    | E1       | Git hook configuration                  |
| PT-007 | Pre-Push Hook Integration      | E1       | Git hook configuration                  |
| PT-008 | CI/CD Integration for doc sync | E1       | GitHub Actions workflow                 |

### Feature Decisions (7 items)

| ID     | Title                   | Estimate | Justification                                         |
| ------ | ----------------------- | -------- | ----------------------------------------------------- |
| FD-001 | Recovery Library        | E2       | Content management + display (decision tracking item) |
| FD-002 | HALT Check              | E1       | Feature already partially implemented                 |
| FD-003 | God Box                 | E1       | Simple storage + display feature                      |
| FD-004 | Complacency Detector    | E2       | Pattern detection + alerts                            |
| FD-005 | Tone Settings           | E1       | Configuration + text variations                       |
| FD-006 | Multiple Sobriety Dates | E2       | Schema + UI for multiple dates                        |
| FD-007 | Principle-Based Badges  | E2       | Achievement system + UI                               |

---

## Summary Statistics

### Distribution by Effort Level

| Level     | Count  | Percentage | Total SP Range  |
| --------- | ------ | ---------- | --------------- |
| E0        | 9      | 9.4%       | 9-18 SP         |
| E1        | 38     | 39.6%      | 114-190 SP      |
| E2        | 34     | 35.4%      | 272-442 SP      |
| E3        | 15     | 15.6%      | 315+ SP         |
| **Total** | **96** | **100%**   | **710-965+ SP** |

### Summary by Milestone

| Milestone              | E0  | E1  | E2  | E3  | Total Items | Estimated SP Range |
| ---------------------- | --- | --- | --- | --- | ----------- | ------------------ |
| Operational Visibility | 0   | 2   | 1   | 0   | 3           | 14-23              |
| M1.5 Quick Wins        | 0   | 3   | 5   | 0   | 8           | 49-79              |
| M1.6 Admin Panel       | 0   | 9   | 5   | 0   | 14          | 67-110             |
| M2 Architecture        | 6   | 9   | 11  | 3   | 29          | 157-260            |
| M4 Expansion           | 0   | 4   | 5   | 3   | 12          | 98-164             |
| M6 Journaling          | 0   | 1   | 0   | 0   | 1           | 3-5                |
| M7 Fellowship          | 0   | 0   | 2   | 0   | 2           | 16-26              |
| M9 Native App          | 0   | 0   | 0   | 1   | 1           | 21+                |
| M10 Monetization       | 0   | 0   | 4   | 8   | 12          | 200+               |
| Process & Tooling      | 1   | 5   | 1   | 0   | 7           | 24-40              |
| Feature Decisions      | 0   | 3   | 4   | 0   | 7           | 41-67              |

---

## Milestone Capacity Analysis

### Capacity Check (assuming 200 SP per milestone threshold)

| Milestone              | Total Items (with effort) | Estimated SP    | Status         |
| ---------------------- | ------------------------- | --------------- | -------------- |
| Operational Visibility | 47                        | ~180 SP         | OK             |
| M1.5 Quick Wins        | 30                        | ~165 SP         | OK             |
| M1.6 Admin Panel       | 25                        | ~145 SP         | OK             |
| M2 Architecture        | 72                        | ~350 SP         | **OVERLOADED** |
| M3 Meetings            | 6                         | 97 SP (defined) | OK             |
| M4 Expansion           | 12                        | ~130 SP         | OK             |
| M4.5 Security          | 13                        | ~95 SP          | OK             |
| M5 Offline + Steps     | 23                        | ~155 SP         | OK             |
| M6 Journaling + Safety | 26                        | ~170 SP         | OK             |
| M7 Fellowship Suite    | 79                        | ~350 SP         | **OVERLOADED** |
| M8 Speakers            | 3                         | 63 SP (defined) | OK             |
| M9 Native App          | 15                        | ~130 SP         | OK             |
| M10 Monetization       | 12                        | ~200 SP         | **AT LIMIT**   |
| Desktop/Web            | 18                        | ~130 SP         | OK             |
| Process & Tooling      | 8                         | ~40 SP          | OK             |
| Feature Decisions      | 7                         | ~50 SP          | OK             |

### Overloaded Milestones (>200 SP)

#### M2 - Architecture (~350 SP)

**Recommendation:** Split into sub-milestones:

- M2.1: Code Quality & Tooling (~80 SP)
- M2.2: Monitoring & Incident Response (~100 SP)
- M2.3: Architecture Refactoring (~170 SP)

#### M7 - Fellowship Suite (~350 SP)

**Recommendation:** Split into sub-milestones:

- M7.1: Sponsor Features (~80 SP)
- M7.2: Export & Knowledge Base (~120 SP)
- M7.3: Nashville Advantage & Personalization (~150 SP)

---

## E2/E3 Justifications (Higher Effort Items)

### E3 Items (21+ SP each)

| ID           | Title                                 | Justification                                                                |
| ------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| M2-ARCH-1    | Component library consolidation       | Touches 50+ UI components across entire codebase, requires careful migration |
| M2-ARCH-2    | State management standardization      | Affects global state patterns, requires refactoring many components          |
| M2-ARCH-3    | API abstraction layer                 | New infrastructure layer between frontend and Firestore                      |
| M4-HALT-P3-1 | Predictive alerts                     | Requires ML or rule-based prediction engine, new data pipeline               |
| M4-HALT-P3-2 | Context-aware suggestions             | AI-driven recommendations need model training or integration                 |
| M4-HALT-P4-2 | AI-powered coping strategies          | LLM integration with privacy considerations                                  |
| M9-TBD       | Additional native engagement features | Native platform features require Capacitor plugins, platform-specific code   |
| M10-MODEL-1  | Premium Features (Ethical Freemium)   | Payment processing (Stripe), entitlement system, feature gating              |
| M10-MODEL-3  | B2B Licensing                         | Enterprise features, license management, admin portals                       |
| M10-MODEL-4  | Hybrid Approach                       | Combines multiple monetization methods                                       |
| F11.2        | Reclaiming City map                   | Full interactive map with user progress tracking                             |
| F11.3        | Digital Coffee Table                  | Social features, sharing, possibly real-time sync                            |
| F11.4        | Warm Handoff B2B                      | Integration with treatment center systems                                    |
| F11.5        | The Mirror AI companion               | AI chat or analysis feature                                                  |
| F11.7        | Family Bridge                         | Multi-user features with privacy boundaries                                  |
| F11.9        | Service Exchange                      | Marketplace-like platform features                                           |

### Notable E2 Items

| ID                   | Title                               | Justification                              |
| -------------------- | ----------------------------------- | ------------------------------------------ |
| M16-P55-4            | Map view with Nearby feature        | Google Maps API integration + geolocation  |
| M16-P55-9            | CRUD operations for local resources | Full backend + frontend with validation    |
| M16-P6-3             | Action ordering (drag-and-drop)     | Complex UI state management                |
| M2-SEC-1             | Manual reCAPTCHA Enterprise         | External API + UI integration              |
| M4-HALT-P2-1 to P2-3 | HALT analytics features             | Data aggregation + visualization pipelines |

---

## Notes

1. **Conservative Estimates**: When uncertain, estimates lean toward higher
   effort (E2 over E1)
2. **R&D Items**: All AI/ML features estimated as E3 due to research
   requirements
3. **Complete Items**: Items marked Complete retain E0 as they represent minimal
   ongoing effort
4. **Story Point Conversions**: Items with SP listed were converted to E-scale
   based on ranges:
   - 1-5 SP = E0-E1
   - 6-13 SP = E1-E2
   - 14-21 SP = E2-E3
   - 21+ SP = E3

---

_Generated by Claude Code on 2026-01-24_

---

## Version History

| Version | Date       | Author | Changes                                   |
| ------- | ---------- | ------ | ----------------------------------------- |
| 1.0     | 2026-01-24 | Claude | Initial effort estimates for 96 items     |
| 1.1     | 2026-01-27 | Claude | Added Purpose section and Version History |
