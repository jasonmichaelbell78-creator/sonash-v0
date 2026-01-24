# Full Dependency Analysis

**Generated:** 2026-01-24 **Analyst:** Claude Code (Opus 4.5) **Sources:**

- ROADMAP.md v3.0
- analysis/full_inventory.md (396 items)
- analysis/pass3_dependencies.md (milestone-level analysis)
- analysis/effort_estimates.md (96 items with E0-E3 estimates)

---

## Summary

| Metric                          | Value         |
| ------------------------------- | ------------- |
| **Total items in inventory**    | 396           |
| **Key items analyzed**          | 85            |
| **Items with dependencies**     | 72            |
| **Circular dependencies found** | 0             |
| **Critical path length**        | 13 milestones |
| **Critical blocking items**     | 8             |
| **Parallelization groups**      | 7             |

---

## Critical Blocking Items

Items that block 5+ downstream items. These are project bottlenecks requiring
prioritized attention.

### Tier 1: Super Blockers (10+ items blocked)

| ID       | Title                            | Milestone | Blocks (Direct) | Total Cascade | Risk Level |
| -------- | -------------------------------- | --------- | --------------- | ------------- | ---------- |
| **T4.3** | AES-256-GCM encryption engine    | M4.5      | 12 items        | 60+ items     | CRITICAL   |
| **T1.2** | Custom mutation queue (Dexie.js) | M5        | 8 items         | 50+ items     | CRITICAL   |
| **T8.1** | Capacitor wrapper                | M9        | 14 items        | 15 items      | HIGH       |
| **T2.2** | sharedPackets collection         | M5        | 12 items        | 25+ items     | HIGH       |

### Tier 2: Major Blockers (5-9 items blocked)

| ID       | Title                        | Milestone | Blocks (Direct) | Total Cascade | Risk Level |
| -------- | ---------------------------- | --------- | --------------- | ------------- | ---------- |
| **T4.1** | Tab-level PIN passcode       | M4.5      | 6 items         | 40+ items     | HIGH       |
| **T4.2** | PBKDF2 key derivation        | M4.5      | 5 items         | 35+ items     | HIGH       |
| **T1.4** | IndexedDB setup via Dexie.js | M5        | 7 items         | 30+ items     | HIGH       |
| **F5.2** | Pattern Matcher (bundled)    | M6        | 5 items         | 8 items       | MEDIUM     |

### Tier 3: Moderate Blockers (3-4 items blocked)

| ID       | Title                        | Milestone | Blocks (Direct) | Notes                  |
| -------- | ---------------------------- | --------- | --------------- | ---------------------- |
| M2-SEC-2 | Re-enable Firebase App Check | M2        | 4 items         | Security prerequisite  |
| F10.1    | The Lifeline (emergency)     | M6        | 4 items         | Safety features depend |
| T5.2     | Client-side only PDF         | M7        | 4 items         | Export features depend |
| T9.5     | FlexSearch                   | M7        | 3 items         | Knowledge base search  |

---

## Dependency Chains Analysis

### Chain 1: Authentication & Security Foundation

**Path:** M0 -> M1 -> OVS -> M15 -> M3 -> M4 -> M4.5 (Security)

```
OV-A8 (user privilege types)
    └── OV-A9 (grant privileges)
            └── M16-P4-5 (user ID correlation)
                    └── All admin features requiring auth
```

**Impact:** ALL user features depend on authentication foundation **Risk:** LOW
(already complete through OVS)

### Chain 2: Encryption Infrastructure (CRITICAL PATH)

**Path:** M4 -> M4.5 -> M5 -> {M6, M7}

```
T4.1 (PIN passcode)
    └── T4.2 (PBKDF2 key derivation)
            └── T4.3 (AES-256-GCM encryption) **CRITICAL**
                    ├── T4.4 (Encrypt step work)
                    ├── T4.6 (Recovery key generation)
                    └── T4.7 (DEK/KEK key wrapping)
                            └── T4.9 (Auto-lock timeout)
                                    └── T1.2 (Offline queue) [M5]
                                            └── ALL M6/M7 journaling features
```

**Blocking Items Detail:**

| Item | Blocks                                         | Nature                 |
| ---- | ---------------------------------------------- | ---------------------- |
| T4.3 | T4.4, T4.6, T4.7, T1.2, all encrypted features | Core encryption engine |
| T4.7 | T4.9, all offline encrypted data               | Key management         |
| T1.2 | T1.3, T1.11, T1.12, T2.2, offline features     | Queue infrastructure   |

**Impact:** 60+ items across M5, M6, M7 blocked **Timeline Impact:** +8 weeks if
delayed **Mitigation:** Parallel R&D during M4

### Chain 3: Offline Infrastructure (CRITICAL PATH)

**Path:** M4.5 -> M5-F1 -> {M5-F2, M5-F3, M5-F4, M6-F1, M6-F2, M7-F1}

```
T1.2 (Custom mutation queue)
    ├── T1.3 (Sync worker)
    │       └── T7.8 (Unit tests)
    ├── T1.4 (IndexedDB setup)
    │       ├── T2.2 (sharedPackets) **KEY BLOCKER**
    │       │       └── F2.1 (Sponsor Export)
    │       │       └── F2.4 (Next Call Agenda)
    │       │       └── F2.5 (Circle of Trust)
    │       │       └── F7.7 (Clinical Hand-Off)
    │       ├── T2.8 (SyncState tracking)
    │       └── T2.12 (Soft delete pattern)
    └── T1.11 (Multi-device conflict UI)
            └── T1.12 (Conflict resolution)
```

**Impact:** 50+ items across M5, M6, M7 **Risk:** HIGH - offline infrastructure
complex **Mitigation:** Implement T2.2 early in M5 sequence

### Chain 4: Capacitor Native (Decision Gate)

**Path:** M8 -> M9 -> M10

```
T8.1 (Capacitor wrapper) **DECISION GATE**
    ├── T8.4 (Native biometrics)
    │       └── T4.10 (Biometric unlock)
    ├── T8.5 (Native secure storage)
    │       └── F4.4 (Stealth Mode)
    ├── T9.1 (Push notifications)
    └── F4.2 (Burn After Reading)
```

**Impact:** Entire M9 (15 items) blocked **Risk:** CRITICAL - architecture
decision **Mitigation:** Capacitor PoC during M8

### Chain 5: Pattern Matching & Insights

**Path:** M5 -> M6-F1

```
F5.2 (Pattern Matcher)
    ├── F5.3 (Tag Heat Map) [bundled]
    ├── F5.7 (Weather Correlation) [bundled]
    ├── F5.13 (Trend Line) [bundled]
    └── M5-PATTERN (Pattern Recognition)
            └── M4-HALT-P3-1 (Predictive alerts)
```

**Impact:** 8 insight/visualization features **Risk:** MEDIUM - can defer to
rule-based MVP **Mitigation:** Feature flag, rule-based first

### Chain 6: Export Infrastructure

**Path:** M5 -> M7-F4

```
T5.2 (Client-side PDF)
    ├── T5.3 (EXIF stripping)
    │       └── F7.5 (Full Archive)
    ├── T5.5 (Preview screen)
    ├── T5.6 (Sponsor packet builder)
    │       └── F2.1 (Sponsor Export)
    ├── T5.7 (Watermark option)
    └── T5.8 (Web Share API)
```

**Impact:** 14 export features in M7-F4 **Risk:** MEDIUM - well-understood tech
**Mitigation:** Standard PDF libraries available

### Chain 7: Safety Features (P0 Priority)

**Path:** M5 -> M6-F2

```
M6-LICENSE (AA/NA permissions) **EXTERNAL DEPENDENCY**
    └── F6.5 (Crisis Decision Tree)
            └── F10.1 (The Lifeline)
                    ├── F10.2 (The Guardrails)
                    ├── F10.3 (Harm Reduction Locker)
                    └── F10.4 (Compassionate U-Turn)
```

**Impact:** 4 critical safety features **Risk:** HIGH - external licensing
dependency **Mitigation:** Begin legal outreach during M5

---

## Dependency Matrix (Key Items)

### M4.5 - Security & Privacy (13 items)

| Item ID | Title                         | Blocks          | Blocked By    | Parallel With |
| ------- | ----------------------------- | --------------- | ------------- | ------------- |
| T4.1    | Tab-level PIN passcode        | T4.2, T4.9      | M4 completion | F4.12         |
| T4.2    | PBKDF2 key derivation         | T4.3, T4.6      | T4.1          | F4.5          |
| T4.3    | AES-256-GCM encryption        | T4.4, T4.7      | T4.2          | -             |
| T4.4    | Encrypt ALL step work         | -               | T4.3          | F4.7          |
| T4.6    | Recovery key generation       | -               | T4.2          | F4.10         |
| T4.7    | DEK/KEK key wrapping          | T4.9, T1.2 (M5) | T4.3          | -             |
| T4.9    | Auto-lock timeout             | -               | T4.1, T4.7    | F4.1          |
| F4.1    | Offline Queue Trust Indicator | -               | T1.2 (M5)     | T4.9          |
| F4.5    | Guest Mode (sandboxed demo)   | -               | -             | T4.2          |
| F4.7    | Selective Sync                | -               | T1.2 (M5)     | T4.4          |
| F4.10   | Nuclear Option                | -               | -             | T4.6          |
| F4.12   | No-Tracking Dashboard         | -               | -             | T4.1          |
| F4.14   | Snapshot Protection           | -               | T4.9          | -             |

### M5 - Offline + Steps (23 items)

| Item ID    | Title                        | Blocks                         | Blocked By         | Parallel With |
| ---------- | ---------------------------- | ------------------------------ | ------------------ | ------------- |
| T1.2       | Custom mutation queue        | T1.3, T1.4, T1.11, all offline | M4.5 (T4.7)        | -             |
| T1.3       | Sync worker                  | T7.8, T7.9                     | T1.2               | T1.4          |
| T1.4       | IndexedDB setup              | T2.2, T2.8, T2.12              | T1.2               | T1.3          |
| T1.6       | Storage quota mgmt           | -                              | T1.4               | T1.11         |
| T1.11      | Multi-device conflict UI     | T1.12                          | T1.4               | T1.6          |
| T1.12      | Conflict resolution          | -                              | T1.11              | T7.8          |
| T2.2       | sharedPackets collection     | F2.1, F2.4, F2.5, F7.7 (M7)    | T1.4               | T2.8          |
| T2.8       | SyncState per device         | -                              | T1.4               | T2.2          |
| T2.12      | Soft delete pattern          | -                              | T1.4               | T7.1          |
| T7.1       | Feature flag offline         | -                              | M4.5               | T7.2          |
| T7.2       | PR strategy                  | -                              | T7.1               | -             |
| T7.8       | Unit tests conflicts         | -                              | T1.3, T1.12        | T7.9          |
| T7.9       | Firebase emulator tests      | -                              | T1.3               | T7.8          |
| F1.0       | Speech-to-text               | -                              | -                  | T1.2          |
| F1.2       | Step Work Worksheets (2-9)   | -                              | T4.4 (M4.5)        | F1.2b         |
| F1.2b      | Step Work Worksheets (11-12) | -                              | T4.4 (M4.5)        | F1.2          |
| M5-STEP-1  | 10th Step Inventory          | -                              | T4.4 (M4.5)        | M5-STEP-2     |
| M5-STEP-2  | Inventory Templates          | -                              | T4.4 (M4.5)        | M5-STEP-1     |
| F1.3       | Interactive step tools       | -                              | F1.2, T1.2         | -             |
| F5.1       | Tag as Inventory             | -                              | T1.2               | F1.4          |
| M5-AMENDS  | Amends Tracker               | -                              | T4.4 (M4.5)        | -             |
| F1.4       | I'm Stuck button             | -                              | -                  | F5.1          |
| M5-PATTERN | Pattern Recognition          | F5.2 (M6)                      | T1.2, journal data | -             |

### M6 - Journaling + Safety (26 items)

| Item ID    | Title                 | Blocks                     | Blocked By           | Parallel With |
| ---------- | --------------------- | -------------------------- | -------------------- | ------------- |
| F5.2       | Pattern Matcher       | F5.3, F5.7, F5.13          | M5-PATTERN           | F5.4          |
| F5.4       | Gratitude Mosaic      | -                          | T1.2 (M5)            | F5.2          |
| F5.5       | Time Capsule          | -                          | T1.2 (M5)            | F5.6          |
| F5.6       | The Wave (Urge Log)   | -                          | T1.2 (M5)            | F5.5          |
| F5.9       | Rant Room (audio)     | -                          | F1.0 (M5), T1.2      | F5.10         |
| F5.10      | Unsent Letter         | -                          | T1.2 (M5)            | F5.9          |
| F5.11      | Dynamic Prompts       | -                          | -                    | F5.12         |
| F5.12      | Meeting Takeaways     | -                          | T1.2 (M5)            | F5.11         |
| F5.14      | Brain Dump            | -                          | T1.2 (M5)            | F9.1          |
| F9.1       | One Action            | -                          | T1.2 (M5)            | F5.14         |
| F9.2       | Bookends (AM/PM)      | -                          | T1.2 (M5)            | F9.6          |
| F9.6       | Pause Protocol        | -                          | -                    | F9.2          |
| F9.7       | Habit Stacker         | -                          | T1.2 (M5)            | F9.10         |
| F9.10      | Sleep Hygiene         | -                          | T1.2 (M5)            | F9.7          |
| F7.6       | 30-Day Retrospective  | -                          | T1.2 (M5)            | F6.5          |
| F6.5       | Crisis Decision Tree  | F10.1, F10.2, F10.3, F10.4 | M6-LICENSE           | -             |
| M6-PRAYER  | Prayer Library        | -                          | M6-LICENSE           | M6-MED-1      |
| F10.1      | The Lifeline          | F10.2, F10.3, F10.4        | F6.5                 | -             |
| F10.2      | The Guardrails        | -                          | F10.1                | F10.3         |
| F10.3      | Harm Reduction Locker | -                          | F10.1                | F10.2         |
| F10.4      | Compassionate U-Turn  | -                          | F10.1                | -             |
| F12.10     | Intake Interview      | -                          | M15-004 (Onboarding) | F12.11        |
| F12.11     | Slow Rollout          | -                          | F12.10               | -             |
| M6-MED-1   | Daily Meditation      | -                          | M6-LICENSE           | M6-MED-2      |
| M6-MED-2   | Guided Meditation     | -                          | M6-MED-1             | -             |
| M6-LICENSE | Content Licensing     | F6.5, M6-PRAYER, M6-MED-1  | -                    | -             |

### M9 - Native App (15 items)

| Item ID | Title                 | Blocks       | Blocked By        | Parallel With |
| ------- | --------------------- | ------------ | ----------------- | ------------- |
| T8.1    | Capacitor wrapper     | ALL M9 items | M8 completion     | -             |
| T8.4    | Native biometrics     | T4.10        | T8.1              | T8.5          |
| T8.5    | Native secure storage | F4.4         | T8.1              | T8.4          |
| T4.10   | Biometric unlock      | -            | T8.4, T4.1 (M4.5) | F4.4          |
| F4.4    | Stealth Mode          | -            | T8.5              | T4.10         |
| F5.4b   | Gratitude widget      | -            | T8.1              | F9.9          |
| F5.9b   | Voice tone analysis   | -            | T8.1, F5.9 (M6)   | -             |
| F9.9    | Nashville Sound       | -            | T8.1              | F5.4b         |
| F9.11   | Drive Time Companion  | -            | T8.1              | -             |
| F12.4   | Stress Monitor        | -            | T8.1              | F12.5         |
| F12.5   | Sleep Truth           | -            | T8.1              | F12.4         |
| F12.6   | Movement as Medicine  | -            | T8.1              | F12.5         |
| F11.1   | SoNash Beacon         | -            | T8.1              | T9.1          |
| T9.1    | Push notifications    | -            | T8.1              | F11.1         |
| M9-TBD  | Additional native     | -            | T8.1              | -             |

---

## Critical Path

The longest chain of sequential dependencies from start to completion:

```
M0 (Baseline)
    └── M1 (Foundation)
            └── DOC (Integrated Improvement)
                    └── OVS (Operational Visibility) [ACTIVE]
                            └── M15 (Quick Wins)
                                    └── M3 (Meetings)
                                            └── M4 (Feature Expansion)
                                                    └── M4.5 (Security) **GATE 1**
                                                            └── M5 (Offline Infrastructure) **BOTTLENECK**
                                                                    └── M7 (Fellowship Suite)
                                                                            └── M8 (Speakers)
                                                                                    └── M9 (Native App) **GATE 2**
                                                                                            └── M10 (Monetization)
```

**Critical Path Length:** 13 milestones **Estimated Duration:** 68+ weeks from
OVS completion **Primary Gates:**

1. **M4.5 (Encryption):** Security audit required before M5
2. **M9 (Capacitor):** Architecture decision required during M8

### Item-Level Critical Path (within M4.5-M5)

```
T4.1 (PIN) -> T4.2 (PBKDF2) -> T4.3 (AES-256) -> T4.7 (DEK/KEK)
    -> T1.2 (Offline Queue) -> T1.4 (IndexedDB) -> T2.2 (sharedPackets)
        -> M7-F1 (Sponsor features)
```

**Length:** 8 items sequential **Duration:** ~12-16 weeks **Mitigation:**
Parallel encryption R&D during M4

---

## Parallelization Opportunities

### Group 1: M4.5 Privacy Features (No Encryption Dependency)

**Can run in parallel with encryption core:**

| Item  | Title                 | Effort | Why Independent                 |
| ----- | --------------------- | ------ | ------------------------------- |
| F4.5  | Guest Mode            | E2     | Sandboxed, no encryption needed |
| F4.10 | Nuclear Option        | E2     | Account deletion, independent   |
| F4.12 | No-Tracking Dashboard | E1     | UI display only                 |

**Potential Time Savings:** 1-2 weeks

### Group 2: M5 Non-Offline Step Work (Parallel with Offline Core)

**Can run alongside T1.2-T1.4 development:**

| Item | Title            | Effort | Why Independent         |
| ---- | ---------------- | ------ | ----------------------- |
| F1.0 | Speech-to-text   | E2     | Browser API, no offline |
| F1.4 | I'm Stuck button | E1     | Simple UI trigger       |
| T7.1 | Feature flag     | E1     | Config only             |
| T7.2 | PR strategy      | E1     | Process only            |

**Potential Time Savings:** 1 week

### Group 3: M6 Journaling (Offline-Agnostic Features)

**Can start before M5 offline complete:**

| Item       | Title             | Effort | Why Independent        |
| ---------- | ----------------- | ------ | ---------------------- |
| F5.11      | Dynamic Prompts   | E2     | Content-based, no sync |
| F9.6       | Pause Protocol    | E1     | Simple timer/UI        |
| M6-LICENSE | Content Licensing | E1     | Legal task             |

**Potential Time Savings:** 2-3 weeks

### Group 4: M6 Safety Features (Parallel Stream)

**F10.x safety features after F6.5:**

| Item  | Title                | Effort | Parallel Partner |
| ----- | -------------------- | ------ | ---------------- |
| F10.2 | The Guardrails       | E2     | F10.3            |
| F10.3 | Harm Reduction       | E2     | F10.2            |
| F10.4 | Compassionate U-Turn | E2     | After F10.1      |

**Potential Time Savings:** 1-2 weeks

### Group 5: M7 Content-First Features (No Sponsor Sharing)

**Can run while T2.2 (sharedPackets) develops:**

| Item | Title                  | Effort | Why Independent |
| ---- | ---------------------- | ------ | --------------- |
| F6.2 | Am I Doing This Right? | E1     | Static content  |
| F6.3 | Smart Glossary         | E2     | Local search    |
| F6.6 | Daily Principle Deck   | E1     | Static content  |
| F6.8 | Normie Translator      | E1     | Static content  |
| F6.9 | Service Menu           | E1     | Static content  |

**Potential Time Savings:** 2-3 weeks

### Group 6: M7 Export Features (Parallel Stream)

**T5.x features can run in parallel:**

| Item | Title            | Effort | Parallel Partner |
| ---- | ---------------- | ------ | ---------------- |
| T5.3 | EXIF stripping   | E1     | T5.5, T5.7, T5.8 |
| T5.5 | Preview screen   | E1     | T5.3, T5.7       |
| T5.7 | Watermark option | E1     | T5.3, T5.5       |
| T5.8 | Web Share API    | E1     | T5.3, T5.5       |

**Potential Time Savings:** 1-2 weeks

### Group 7: M9 Native Features (Post-Capacitor)

**After T8.1 approved, parallel streams:**

| Stream A           | Stream B               | Stream C               |
| ------------------ | ---------------------- | ---------------------- |
| T8.4 (Biometrics)  | F12.4 (Stress Monitor) | F11.1 (Beacon)         |
| T4.10 (Bio unlock) | F12.5 (Sleep Truth)    | T9.1 (Push)            |
| F4.4 (Stealth)     | F12.6 (Movement)       | F9.9 (Nashville Sound) |

**Potential Time Savings:** 3-4 weeks

### Total Parallelization Savings

| Group                         | Savings         | Risk   |
| ----------------------------- | --------------- | ------ |
| Group 1 (M4.5 Privacy)        | 1-2 weeks       | Low    |
| Group 2 (M5 Non-Offline)      | 1 week          | Low    |
| Group 3 (M6 Offline-Agnostic) | 2-3 weeks       | Low    |
| Group 4 (M6 Safety)           | 1-2 weeks       | Medium |
| Group 5 (M7 Content)          | 2-3 weeks       | Low    |
| Group 6 (M7 Export)           | 1-2 weeks       | Low    |
| Group 7 (M9 Native)           | 3-4 weeks       | Medium |
| **TOTAL**                     | **11-17 weeks** | -      |

---

## Circular Dependencies

**Result:** 0 circular dependencies found.

### Validation Method

1. **DFS Traversal:** Complete graph traversal from M0 to terminal nodes (M6,
   M10)
2. **State Tracking:** Visited/visiting states tracked for each node
3. **Back Edge Detection:** No back edges found (edges pointing to ancestors)

### Verified Acyclic Paths

| Path                                                                             | Terminates At |
| -------------------------------------------------------------------------------- | ------------- |
| M0 -> M1 -> DOC -> OVS -> M15 -> M3 -> M4 -> M4.5 -> M5 -> M6                    | M6            |
| M0 -> M1 -> DOC -> OVS -> M15 -> M3 -> M4 -> M4.5 -> M5 -> M7 -> M8 -> M9 -> M10 | M10           |
| M0 -> M1 -> DOC -> OVS -> M16 -> M3 -> ...                                       | Same as above |
| M2 -.-> M3 -> ... (optional)                                                     | Same as above |

**Graph Integrity:** VALID DIRECTED ACYCLIC GRAPH (DAG)

---

## Risk Analysis

### High-Risk Dependencies

| Dependency           | Risk                        | Impact                   | Mitigation                         |
| -------------------- | --------------------------- | ------------------------ | ---------------------------------- |
| T4.3 (Encryption)    | Complexity + Security Audit | 60+ items blocked        | Parallel R&D, external audit early |
| T8.1 (Capacitor)     | Architecture Decision       | 15 items blocked         | PoC during M8, PWA fallback        |
| M6-LICENSE (Content) | External Legal              | 4 safety items blocked   | Begin outreach in M5               |
| T2.2 (sharedPackets) | Complexity                  | 12 sponsor items blocked | Implement early in M5              |

### Medium-Risk Dependencies

| Dependency             | Risk                 | Impact          | Mitigation               |
| ---------------------- | -------------------- | --------------- | ------------------------ |
| T1.2 (Offline Queue)   | Technical Complexity | 50+ items       | Well-understood pattern  |
| F5.2 (Pattern Matcher) | R&D Required         | 8 insight items | Rule-based MVP first     |
| T5.2 (Client PDF)      | Library Selection    | 14 export items | Standard libraries exist |

### Low-Risk Dependencies

| Dependency           | Risk             | Impact              | Mitigation              |
| -------------------- | ---------------- | ------------------- | ----------------------- |
| OV-A8 (Privileges)   | Already Complete | Auth features       | Stable foundation       |
| M15-004 (Onboarding) | Well-scoped      | Onboarding features | Standard wizard pattern |

---

## Recommendations

### Immediate Actions (Before M4)

1. **Start encryption R&D** - Prototype T4.2 (PBKDF2) and T4.3 (AES-256) in
   isolation
2. **Begin content licensing outreach** - M6-LICENSE is external dependency
3. **Evaluate offline libraries** - Dexie.js vs alternatives for T1.2/T1.4

### M4.5 Execution Strategy

1. **Week 1-2:** T4.1 (PIN) + T4.2 (PBKDF2) + F4.5/F4.10/F4.12 (parallel privacy
   features)
2. **Week 3-4:** T4.3 (AES-256) + T4.4 (Encrypt step work)
3. **Week 5-6:** T4.6 (Recovery key) + T4.7 (DEK/KEK) + Security Audit
4. **Week 7-8:** T4.9 (Auto-lock) + F4.1/F4.7/F4.14 (offline-dependent features)

### M5 Execution Strategy

1. **Week 1-2:** T1.2 (Queue) + T7.1/T7.2 (Feature flag, PR strategy)
2. **Week 3-4:** T1.3 (Sync worker) + T1.4 (IndexedDB) in parallel
3. **Week 5-6:** T2.2 (sharedPackets - PRIORITIZE) + T2.8/T2.12
4. **Week 7-8:** T1.11/T1.12 (Conflict resolution) + T7.8/T7.9 (Testing)

### M8-M9 Decision Gate

**During M8:**

1. Create Capacitor PoC (2-week sprint)
2. Test biometric auth + secure storage
3. **Decision Point:** Approve M9 or defer to PWA APIs

---

## Appendix: Full Dependency Count by Item

### Items Blocking Most Downstream Work

| Rank | Item ID    | Title                    | Direct Blocks | Cascade Total |
| ---- | ---------- | ------------------------ | ------------- | ------------- |
| 1    | T4.3       | AES-256-GCM encryption   | 12            | 60+           |
| 2    | T1.2       | Custom mutation queue    | 8             | 50+           |
| 3    | T8.1       | Capacitor wrapper        | 14            | 15            |
| 4    | T2.2       | sharedPackets collection | 12            | 25+           |
| 5    | T4.1       | Tab-level PIN passcode   | 6             | 40+           |
| 6    | T1.4       | IndexedDB setup          | 7             | 30+           |
| 7    | F6.5       | Crisis Decision Tree     | 4             | 8             |
| 8    | F5.2       | Pattern Matcher          | 5             | 8             |
| 9    | T5.2       | Client-side PDF          | 4             | 14            |
| 10   | M6-LICENSE | Content Licensing        | 3             | 6             |

---

_Generated by Claude Code (Opus 4.5) on 2026-01-24_
