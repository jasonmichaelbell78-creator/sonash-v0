# Parallel Execution Guide

**Generated:** 2026-01-24 **Source:** ROADMAP Full Analysis (Pass B4
Dependencies) **Potential Savings:** 11-17 weeks

---

## Executive Summary

This guide documents 7 parallelization groups where independent work can proceed
concurrently, reducing the critical path timeline. Each group lists items that
have NO blocking dependencies on each other and can be worked on simultaneously.

**Key Insight:** While milestones appear sequential (M4.5 → M5 → M6 → M7), many
items within each milestone don't actually depend on each other. Strategic
parallelization can compress the timeline significantly.

---

## Parallelization Groups

### Group 1: M4.5 Privacy Features (No Encryption Dependency)

**Savings:** 1-2 weeks | **Risk:** Low | **Items:** 6

These M4.5 items do NOT require T4.3 (encryption) to be complete:

| ID         | Title                             | Can Start             | Blocked By     |
| ---------- | --------------------------------- | --------------------- | -------------- |
| F4.5       | Guest Mode (sandboxed demo)       | Immediately           | None           |
| F4.7       | Selective Sync UI                 | Immediately           | None           |
| F4.10      | Nuclear Option (account deletion) | Immediately           | None           |
| F4.12      | No-Tracking Dashboard             | Immediately           | None           |
| F4.14      | Snapshot Protection               | Immediately           | None           |
| DEDUP-0001 | Re-enable App Check               | After DEDUP-0003/0004 | reCAPTCHA work |

**Execution Strategy:**

- Start these while T4.1/T4.2/T4.3 (encryption core) is being built
- No need to wait for encryption audit
- Can be done by different developer than encryption work

---

### Group 2: M5 Non-Offline Features

**Savings:** 1 week | **Risk:** Low | **Items:** 4

These M5 items don't require offline infrastructure (T1.2/T1.4):

| ID    | Title                        | Can Start             | Blocked By |
| ----- | ---------------------------- | --------------------- | ---------- |
| F1.0  | App-wide speech-to-text      | After M4.5 encryption | T4.3 only  |
| F1.2  | Step Work Worksheets (2-9)   | After M4.5 encryption | T4.3 only  |
| F1.2b | Step Work Worksheets (11-12) | After M4.5 encryption | T4.3 only  |
| F1.3  | Interactive step tools       | After M4.5 encryption | T4.3 only  |

**Execution Strategy:**

- Start UI work for step worksheets while offline queue is being built
- Speech-to-text is independent browser API work
- These become "encryption-ready" before offline-ready

---

### Group 3: M6 Offline-Agnostic Journaling

**Savings:** 2-3 weeks | **Risk:** Low | **Items:** 8

These M6 journaling features work with or without offline:

| ID    | Title                     | Can Start  | Blocked By      |
| ----- | ------------------------- | ---------- | --------------- |
| F5.2  | Pattern Matcher (bundled) | After M4.5 | Encryption only |
| F5.3  | Mood-to-Entry AI linking  | After F5.2 | Pattern Matcher |
| F5.6  | Voice-to-Journal          | After M4.5 | Encryption only |
| F5.7  | Prompt Rotation           | After M4.5 | Encryption only |
| F5.9  | Sentiment Sparkline       | After M4.5 | Encryption only |
| F5.10 | Share Snippets            | After M4.5 | Encryption only |
| F5.11 | Writing Streaks           | After M4.5 | Encryption only |
| F5.12 | Topic Tags                | After M4.5 | Encryption only |

**Execution Strategy:**

- These features work online-first, offline is enhancement
- Build journaling UI while offline sync is being developed
- Add offline capability as enhancement layer later

---

### Group 4: M6 Safety Features

**Savings:** 1-2 weeks | **Risk:** Medium | **Items:** 4

Critical safety features that are standalone:

| ID    | Title                         | Can Start  | Blocked By      |
| ----- | ----------------------------- | ---------- | --------------- |
| F10.1 | SOS Button (panic button)     | After M4.5 | Encryption only |
| F10.2 | The Guardrails (trauma gates) | After M4.5 | Encryption only |
| F10.3 | Harm Reduction Locker         | After M4.5 | Encryption only |
| F10.4 | Compassionate U-Turn          | After M4.5 | Encryption only |

**Execution Strategy:**

- Safety features are P0 priority - start as soon as encryption allows
- Don't wait for journaling features
- Medium risk: ensure crisis hotline integrations work reliably

---

### Group 5: M7 Content-First Features

**Savings:** 2-3 weeks | **Risk:** Low | **Items:** 12

Knowledge base and content features with no sync dependencies:

| ID    | Title                      | Can Start | Blocked By |
| ----- | -------------------------- | --------- | ---------- |
| F6.2  | Am I Doing This Right?     | After M5  | None in M7 |
| F6.3  | Smart Glossary             | After M5  | None in M7 |
| F6.4  | Script Lab                 | After M5  | None in M7 |
| F6.6  | Daily Principle Deck       | After M5  | None in M7 |
| F6.7  | Anatomy of a Meeting       | After M5  | None in M7 |
| F6.8  | Normie Translator          | After M5  | None in M7 |
| F6.9  | Service Menu               | After M5  | None in M7 |
| F6.10 | Fellowship Compass         | After M5  | None in M7 |
| F6.11 | Traditions in Real Life    | After M5  | None in M7 |
| F6.12 | Readiness Checkers         | After M5  | None in M7 |
| F8.1  | Rosetta Stone (vocabulary) | After M5  | None in M7 |
| T9.5  | FlexSearch (local search)  | After M5  | None in M7 |

**Execution Strategy:**

- Content features are mostly static/educational
- Can be built by content-focused developer
- FlexSearch is infrastructure but independent of sponsor features

---

### Group 6: M7 Export Features

**Savings:** 1-2 weeks | **Risk:** Low | **Items:** 8

Export and PDF features with minimal dependencies:

| ID   | Title                 | Can Start  | Blocked By |
| ---- | --------------------- | ---------- | ---------- |
| F7.1 | Recovery Resume       | After M5   | None in M7 |
| F7.2 | Step Packets          | After M5   | None in M7 |
| F7.4 | Emergency Wallet Card | After M5   | None in M7 |
| F7.5 | Full Archive          | After M5   | None in M7 |
| T5.2 | Client-side PDF       | After M5   | None in M7 |
| T5.5 | Preview screen        | After T5.2 | PDF engine |
| T5.7 | Watermark option      | After T5.2 | PDF engine |
| T5.8 | Web Share API         | After M5   | None in M7 |

**Execution Strategy:**

- PDF generation is self-contained (@react-pdf/renderer)
- Start with T5.2 (PDF engine), then parallelize individual export types
- Web Share API is independent browser integration

---

### Group 7: M9 Native Features (Post-Capacitor)

**Savings:** 3-4 weeks | **Risk:** Medium | **Items:** 6

After T8.1 (Capacitor wrapper) is complete, these can parallelize:

| ID   | Title                     | Can Start  | Blocked By     |
| ---- | ------------------------- | ---------- | -------------- |
| T8.2 | Native biometric auth     | After T8.1 | Capacitor only |
| T8.3 | Native file system access | After T8.1 | Capacitor only |
| T8.4 | Push notifications        | After T8.1 | Capacitor only |
| T8.5 | Background sync           | After T8.1 | Capacitor only |
| T9.1 | Deep linking              | After T8.1 | Capacitor only |
| T9.3 | Offline map tiles         | After T8.1 | Capacitor only |

**Execution Strategy:**

- T8.1 (Capacitor wrapper) is the gate - all native features wait for it
- Once Capacitor works, all 6 features can develop in parallel
- Medium risk: native features require device testing

---

## Execution Timeline

### Compressed Timeline (With Parallelization)

```
M4.5 (12 weeks)
├── Encryption Core (T4.1-T4.3): Weeks 1-8
├── Group 1 (Privacy): Weeks 4-10 (parallel with encryption)
└── Security Audit: Weeks 9-12

M5 (10 weeks → 7 weeks with parallel)
├── Offline Infrastructure (T1.2-T1.4): Weeks 1-6
├── Group 2 (Non-Offline): Weeks 1-4 (parallel)
└── Group 3 (Journaling): Weeks 3-7 (parallel)

M6 (8 weeks → 5 weeks with parallel)
├── Group 3 (Journaling): Weeks 1-3 (continuing from M5)
├── Group 4 (Safety): Weeks 1-3 (parallel)
└── Onboarding: Weeks 3-5

M7 (16 weeks → 10 weeks with parallel)
├── M7.1 Sponsor (T2.2-T2.4): Weeks 1-4 (sequential - dependencies)
├── Group 5 (Content): Weeks 1-6 (parallel with sponsor)
├── Group 6 (Exports): Weeks 2-6 (parallel with content)
└── M7.4 Personalization: Weeks 6-10

M9 (8 weeks → 5 weeks with parallel)
├── T8.1 Capacitor: Weeks 1-3
└── Group 7 (Native): Weeks 3-5 (all parallel after Capacitor)
```

### Time Savings Summary

| Phase     | Sequential   | Parallel     | Savings           |
| --------- | ------------ | ------------ | ----------------- |
| M4.5      | 12 weeks     | 12 weeks     | 0 (audit is gate) |
| M5        | 10 weeks     | 7 weeks      | 3 weeks           |
| M6        | 8 weeks      | 5 weeks      | 3 weeks           |
| M7        | 16 weeks     | 10 weeks     | 6 weeks           |
| M9        | 8 weeks      | 5 weeks      | 3 weeks           |
| **Total** | **54 weeks** | **39 weeks** | **15 weeks**      |

---

## Resource Requirements

### Parallel Track Developers

To maximize parallelization, the following developer roles can work
simultaneously:

| Track          | Focus                     | Skills            |
| -------------- | ------------------------- | ----------------- |
| **Encryption** | T4.1-T4.3, security audit | Crypto, security  |
| **Privacy UI** | Group 1, Group 4          | React, forms      |
| **Offline**    | T1.2-T1.4, sync           | IndexedDB, Dexie  |
| **Journaling** | Group 3                   | React, AI/ML      |
| **Content**    | Group 5                   | React, content    |
| **Export**     | Group 6                   | PDF, file APIs    |
| **Native**     | Group 7                   | Capacitor, mobile |

**Minimum for parallelization:** 2-3 developers **Optimal for maximum savings:**
4-5 developers

---

## Risk Mitigation

### Low-Risk Groups (1, 2, 3, 5, 6)

- Independent features with clear boundaries
- No shared state or complex integration
- Can be tested in isolation

### Medium-Risk Groups (4, 7)

**Group 4 (Safety):**

- Crisis features must work reliably
- Mitigation: Extensive testing, fallback to external resources
- Require QA sign-off before merge

**Group 7 (Native):**

- Device-specific issues possible
- Mitigation: Test on multiple device types early
- Have PWA fallback for all features

---

## Integration Points

### Merge Gates (Sequential Requirements)

1. **M4.5 → M5 Gate:** Security audit must pass before offline work begins
2. **M5 → M7 Gate:** T2.2 (sharedPackets) must complete before sponsor sharing
3. **M8 → M9 Gate:** Capacitor decision (native vs PWA-only)

### Parallel → Sequential Handoffs

When parallel tracks complete, integration testing required:

- Encryption + Privacy UI → Combined security testing
- Offline + Journaling → Sync behavior validation
- Content + Exports → Cross-feature navigation
- Native features → Full device testing suite

---

## Recommended Execution Order

### Phase 1: M4.5 (Parallel Track A + B)

- **Track A:** T4.1 → T4.2 → T4.3 → Security Audit
- **Track B:** Group 1 (Privacy UI features)

### Phase 2: M5 (Three Parallel Tracks)

- **Track A:** T1.2 → T1.4 → T1.6 → T1.11/12 (Offline core)
- **Track B:** Group 2 (Non-offline features)
- **Track C:** Group 3 (Journaling, continuing into M6)

### Phase 3: M6 (Two Parallel Tracks)

- **Track A:** Group 3 completion + F12.10/11 (Onboarding)
- **Track B:** Group 4 (Safety features)

### Phase 4: M7 (Three Parallel Tracks)

- **Track A:** M7.1 Sponsor features (sequential - T2.2 dependency)
- **Track B:** Group 5 (Content)
- **Track C:** Group 6 (Exports)

### Phase 5: M9 (Post-Gate)

- **Gate:** T8.1 Capacitor decision
- **If Go:** Group 7 (all native features in parallel)
- **If No-Go:** Enhance PWA instead

---

_Guide generated from ROADMAP Full Analysis Pass B4 (Dependencies)_
