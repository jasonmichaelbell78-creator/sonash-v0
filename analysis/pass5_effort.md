# Pass 5: Effort Estimation Alignment

**Generated:** 2026-01-24 | **Status:** COMPLETE | **Last Updated:** 2026-01-27

## Purpose

This document provides effort estimates for all 85 staged expansion items using
the E0-E3 effort scale. It analyzes milestone capacity, identifies bundling
savings, and validates that work can be completed within planned timelines. The
analysis supports sprint planning and resource allocation decisions.

---

## Executive Summary

**Total Staged Items:** 85 **Effort Distribution Overview:**

| Milestone | Items    | Raw SP  | Bundled SP | Savings |
| --------- | -------- | ------- | ---------- | ------- |
| M4.5      | 13       | 72      | 48         | 33%     |
| M5        | 19       | 195     | 145        | 26%     |
| M6        | 23       | 145     | 102        | 30%     |
| M7        | 77       | 385     | 290        | 25%     |
| M9        | 3 staged | 35      | 35         | 0%      |
| **Total** | **135**  | **832** | **620**    | **25%** |

_Note: M7 count includes multi-group placements_

---

## 1. Effort Code Definitions

| Code   | Story Points | Time       | Complexity                    |
| ------ | ------------ | ---------- | ----------------------------- |
| **E0** | 1-2 SP       | ~1-2 hours | Trivial - config, text change |
| **E1** | 3-5 SP       | ~1 day     | Simple - single component     |
| **E2** | 8-13 SP      | ~2-3 days  | Medium - multiple components  |
| **E3** | 21+ SP       | ~1 week+   | Complex - R&D required        |

---

## 2. Milestone Capacity Analysis

| Milestone | Bundled SP | Capacity | Status                    |
| --------- | ---------- | -------- | ------------------------- |
| **M4.5**  | 48         | 70 SP    | OK                        |
| **M5**    | 145        | 150 SP   | WARN - At capacity        |
| **M6**    | 102        | 120 SP   | WARN - Near capacity      |
| **M7**    | 290        | 250 SP   | **ALERT - Over capacity** |
| **M9**    | 35         | 50 SP    | OK                        |

### M7 Capacity Resolution (Required)

M7 at 290 SP exceeds 250 SP limit. Recommend split into sub-milestones:

| Sub-Milestone | Focus                                | Bundled SP |
| ------------- | ------------------------------------ | ---------- |
| M7.1          | Core Fellowship (F1, F2, F3)         | 68 SP      |
| M7.2          | Exports & Reports (F4)               | 45 SP      |
| M7.3          | Knowledge & Personalization (F6, F8) | 73 SP      |
| M7.4          | Nashville & Safety (F5, F7)          | 49 SP      |
| M7.5          | Analytics & Future (F9, F10, F11)    | 55 SP      |

---

## 3. Effort Distribution by Tier

| Tier         | Count | % Items | Total SP | % SP |
| ------------ | ----- | ------- | -------- | ---- |
| E0 (Trivial) | 12    | 14%     | 20       | 3%   |
| E1 (Simple)  | 49    | 58%     | 220      | 35%  |
| E2 (Medium)  | 20    | 24%     | 180      | 29%  |
| E3 (Complex) | 4     | 5%      | 83       | 13%  |

---

## 4. Bundling Cluster Savings

| Cluster              | Items | Raw SP | Bundled SP | Savings |
| -------------------- | ----- | ------ | ---------- | ------- |
| 3A (Encryption)      | 7     | 42     | 28         | 33%     |
| 3B (Privacy)         | 6     | 30     | 20         | 33%     |
| 3C (Offline)         | 21    | 85     | 60         | 29%     |
| 3D (Step Work)       | 2     | 34     | 25         | 26%     |
| 3E (Journaling)      | 9     | 55     | 40         | 27%     |
| 3F (Sponsor)         | 12    | 50     | 38         | 24%     |
| 3G (Exports)         | 15    | 65     | 45         | 31%     |
| 3H (Nashville)       | 8     | 40     | 28         | 30%     |
| 3I (Knowledge)       | 12    | 52     | 38         | 27%     |
| 3J (Personalization) | 11    | 48     | 35         | 27%     |
| 3K (Safety)          | 9     | 50     | 36         | 28%     |
| 3M (Analytics)       | 7     | 26     | 19         | 27%     |

**Average Savings:** 25% (~200 hours / 5-6 weeks)

---

## 5. Priority Distribution

| Priority | Items | Bundled SP | Description            |
| -------- | ----- | ---------- | ---------------------- |
| **P0**   | 20    | 160 SP     | Critical path blockers |
| **P1**   | 35    | 220 SP     | Core features          |
| **P2**   | 30    | 162 SP     | Enhancement features   |

### P0 Critical Items (Blocking Downstream)

- **M4.5-F1** (7 items, 28 SP): Encryption blocks M5
- **M5-F1** (13 items, 60 SP): Offline blocks M6/M7
- **T8.1** (1 item, 21 SP): Capacitor blocks M9

---

## 6. Key Items by Milestone

### M4.5 (48 SP bundled)

| ID        | Item                    | Effort | SP  |
| --------- | ----------------------- | ------ | --- |
| T4.1      | Tab-level PIN passcode  | E2     | 8   |
| T4.2-T4.3 | PBKDF2 + AES-256        | E1     | 8   |
| T4.4      | Encrypt step work       | E2     | 8   |
| T4.6-T4.7 | Key recovery + wrapping | E2     | 13  |
| F4.5      | Guest Mode              | E2     | 8   |
| F4.7      | Selective Sync          | E2     | 8   |

### M5 (145 SP bundled)

| ID   | Item                  | Effort | SP  |
| ---- | --------------------- | ------ | --- |
| T1.2 | Mutation queue        | E3     | 21  |
| T1.4 | Sync worker           | E2     | 13  |
| F1.0 | Speech-to-Text        | E2     | 13  |
| F1.2 | Step Worksheets (2-9) | E3     | 26  |
| T2.2 | sharedPackets         | E2     | 8   |

### M6 (102 SP bundled)

| ID     | Item             | Effort | SP  |
| ------ | ---------------- | ------ | --- |
| F5.2   | Pattern Matcher  | E3     | 21  |
| F5.9   | Rant Room        | E2     | 13  |
| F10.1  | The Lifeline     | E2     | 8   |
| F12.10 | Intake Interview | E2     | 8   |

### M7 (290 SP bundled - requires split)

| Group              | Items | Bundled SP |
| ------------------ | ----- | ---------- |
| F1 Sponsor         | 12    | 38         |
| F4 Exports         | 14    | 45         |
| F5 Nashville       | 8     | 28         |
| F6 Knowledge       | 13    | 38         |
| F7 Safety          | 5     | 21         |
| F8 Personalization | 11    | 35         |
| Other              | 14    | 85         |

### M9 (35 SP - no bundling savings)

| ID   | Item              | Effort | SP  |
| ---- | ----------------- | ------ | --- |
| T8.1 | Capacitor wrapper | E3     | 21  |
| T8.4 | Native biometrics | E2     | 8   |
| T8.5 | Secure storage    | E1     | 5   |

---

## 7. Recommendations

### Immediate Actions

1. **Approve M7 Split** - Current 290 SP exceeds capacity
2. **Parallel Streams for M5** - Offline (T1.x) + Step Work (F1.x)
3. **Pattern Matcher MVP** - Rule-based first, ML deferred to M7

### Risk Mitigations

| Risk                   | Mitigation                      | Savings      |
| ---------------------- | ------------------------------- | ------------ |
| M4.5 delays            | Parallel R&D during M4          | -3 weeks     |
| M5 complexity          | Feature flags, gradual rollout  | -2 weeks     |
| M7 scope creep         | Strict sub-milestone boundaries | -4 weeks     |
| M9 Capacitor rejection | PWA fallback defined            | M9 cancelled |

---

**Pass 5 Status:** COMPLETE **Confidence:** HIGH **Next:** Pass 6 - Integration
& Output Generation

---

## Version History

| Version | Date       | Author       | Changes                                   |
| ------- | ---------- | ------------ | ----------------------------------------- |
| 1.0     | 2026-01-24 | Analysis Bot | Initial effort estimation alignment       |
| 1.1     | 2026-01-27 | Claude       | Added Purpose section and Version History |
