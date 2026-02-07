# Audit Tracker

**Document Version:** 2.5 **Created:** 2026-01-08 **Last Updated:** 2026-02-03
**Purpose:** Track single-session and multi-AI audit completions for threshold
management

> **Related:** [TECHNICAL_DEBT_MASTER.md](./technical-debt/INDEX.md) ← Single
> source of truth for all technical debt items (Session #98)

---

## Overview

This document tracks:

1. **Single-session audit completions** - When `/audit-*` commands are run
2. **Multi-AI audit completions** - When full multi-model reviews are completed
3. **Threshold reset dates** - Separate per category

**IMPORTANT:** Thresholds reset when:

- Single-session audit: Resets that CATEGORY's threshold only
- Multi-AI audit: Resets ALL thresholds for that category

## Quick Start

1. Check current audit status in the tracker table
2. Review findings for your audit category
3. Update tracker when completing audit items

## AI Instructions

When tracking audits:

- Update status immediately after changes
- Document all findings with CANON IDs
- Keep tracker synchronized with actual progress

---

## Current Thresholds

### Single-Session Audit Thresholds (Per Category)

| Category                 | Last Audit                 | Commits Since | Files Since | Trigger At                                |
| ------------------------ | -------------------------- | ------------- | ----------- | ----------------------------------------- |
| Code                     | 2026-02-03 (Comprehensive) | 0             | 0           | 25 commits OR 15 files                    |
| Security                 | 2026-02-03 (Comprehensive) | 0             | 0           | Any security-sensitive file OR 20 commits |
| Performance              | 2026-02-03 (Comprehensive) | 0             | 0           | 30 commits OR bundle change               |
| Refactoring              | 2026-02-03 (Comprehensive) | 0             | 0           | 40 commits OR 3 complexity warnings       |
| Documentation            | 2026-02-03 (Comprehensive) | 0             | 0           | 20 doc files changed OR 30 commits        |
| Process                  | 2026-02-03 (Comprehensive) | 0             | 0           | Any CI/hook file changed OR 30 commits    |
| Engineering-Productivity | 2026-02-03 (Comprehensive) | 0             | 0           | 30 commits OR DX-impacting changes        |

### Multi-AI Audit Thresholds (Cross-Category)

| Trigger Type    | Threshold          | Current                                 | Status   |
| --------------- | ------------------ | --------------------------------------- | -------- |
| Total commits   | 100 commits        | 0 (reset 2026-02-03)                    | ✅ Reset |
| Time elapsed    | 14 days            | 0 days (comprehensive audit 2026-02-03) | ✅ Reset |
| Major milestone | Any M1.5+ complete | —                                       | ⏳ Check |

**Multi-AI audit is triggered when ANY of:**

- 100+ commits since last multi-AI audit
- 14+ days since last multi-AI audit
- Major milestone completed

**Note:** Single-session audits do NOT count toward multi-AI escalation
triggers.

---

## Single-Session Audit Log

### Code Audits (`/audit-code`)

| Date       | Session       | Commits Covered | Files Covered | Findings                                                                                          | Reset Threshold |
| ---------- | ------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------- | --------------- |
| 2026-02-03 | Comprehensive | Full codebase   | All           | 18 findings - [audit-code-report.md](./audits/comprehensive/audit-code-report.md)                 | ✅ (all)        |
| 2026-01-30 | Comprehensive | Full codebase   | All           | Session #116 - [audit-code-report.md](./audits/comprehensive/audit-code-report.md)                | ✅ (all)        |
| 2026-01-24 | Comprehensive | Full codebase   | 95 files      | 16 (0 S0, 2 S1, 8 S2, 6 S3) - [audit-code-report.md](./audits/comprehensive/audit-code-report.md) | ✅ (all)        |
| 2026-01-17 | Single-Claude | 435             | 221           | 14 (2 S1, 5 S2, 7 S3) - [audit-2026-01-17.md](./audits/single-session/code/audit-2026-01-17.md)   | ⚠️ (single)     |
| 2026-01-06 | Multi-AI      | Full codebase   | All TS/TSX    | See CANON-CODE.jsonl                                                                              | ✅              |

### Security Audits (`/audit-security`)

| Date       | Session       | Commits Covered | Files Covered | Findings                                                                                                                                    | Reset Threshold |
| ---------- | ------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2026-02-03 | Comprehensive | Full codebase   | All           | 6 findings - [audit-security-report.md](./audits/comprehensive/audit-security-report.md)                                                    | ✅ (all)        |
| 2026-01-30 | Comprehensive | Full codebase   | All           | Session #116 - [audit-security-report.md](./audits/comprehensive/audit-security-report.md)                                                  | ✅ (all)        |
| 2026-01-24 | Comprehensive | Full codebase   | All security  | 14 (2 S0, 3 S1, 5 S2, 4 S3) - [audit-security-report.md](./audits/comprehensive/audit-security-report.md) **CRITICAL: Credential exposure** | ✅ (all)        |
| 2026-01-17 | Single-Claude | 172             | 16            | 11 (2 S1, 3 S2, 6 S3) - [audit-2026-01-17.md](./audits/single-session/security/audit-2026-01-17.md)                                         | ⚠️ (single)     |
| 2026-01-13 | Single-Claude | Full codebase   | All TS/TSX    | 11 (2 HIGH, 4 MEDIUM, 2 LOW, 3 INFO) - [audit-2026-01-13.md](./audits/single-session/security/audit-2026-01-13.md)                          | ⚠️ (single)     |
| 2026-01-07 | Multi-AI      | Full codebase   | All TS/TSX    | 10 (CANON-SECURITY.jsonl)                                                                                                                   | ✅              |

### Performance Audits (`/audit-performance`)

| Date       | Session        | Commits Covered | Files Covered | Findings                                                                                                                                               | Reset Threshold |
| ---------- | -------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| 2026-02-03 | Comprehensive  | Full codebase   | All           | 15 findings - [audit-performance-report.md](./audits/comprehensive/audit-performance-report.md)                                                        | ✅ (all)        |
| 2026-01-30 | Comprehensive  | Full codebase   | All           | Session #116 - [audit-performance-report.md](./audits/comprehensive/audit-performance-report.md)                                                       | ✅ (all)        |
| 2026-01-24 | Comprehensive  | Full codebase   | All           | 25 (7 S0, 10 S1, 5 S2, 3 S3) - [audit-performance-report.md](./audits/comprehensive/audit-performance-report.md) **CRITICAL: 11MB images, no offline** | ✅ (all)        |
| 2026-01-17 | Single-Claude  | 353             | 248           | 12 (2 S1, 7 S2, 3 S3) - [audit-2026-01-17.md](./audits/single-session/performance/audit-2026-01-17.md)                                                 | ⚠️ (single)     |
| 2026-01-08 | Multi-AI (#37) | Full codebase   | All TS/TSX    | 20 (CANON-PERF.jsonl)                                                                                                                                  | ✅              |

### Refactoring Audits (`/audit-refactoring`)

| Date       | Session       | Commits Covered | Files Covered | Findings                                                                                                         | Reset Threshold |
| ---------- | ------------- | --------------- | ------------- | ---------------------------------------------------------------------------------------------------------------- | --------------- |
| 2026-02-03 | Comprehensive | Full codebase   | All           | 11 findings - [audit-refactoring-report.md](./audits/comprehensive/audit-refactoring-report.md)                  | ✅ (all)        |
| 2026-01-30 | Comprehensive | Full codebase   | All           | Session #116 - [audit-refactoring-report.md](./audits/comprehensive/audit-refactoring-report.md)                 | ✅ (all)        |
| 2026-01-24 | Comprehensive | Full codebase   | All           | 19 (0 S0, 4 S1, 10 S2, 5 S3) - [audit-refactoring-report.md](./audits/comprehensive/audit-refactoring-report.md) | ✅ (all)        |
| 2026-01-17 | Single-Claude | 295             | 159           | 12 (4 S1, 5 S2, 3 S3) - [audit-2026-01-17.md](./audits/single-session/refactoring/audit-2026-01-17.md)           | ⚠️ (single)     |
| 2026-01-10 | Multi-AI      | Full codebase   | All TS/TSX/JS | 27 (CANON-REFACTOR.jsonl)                                                                                        | ✅              |

### Documentation Audits (`/audit-documentation`)

| Date       | Session       | Commits Covered | Files Covered | Findings                                                                                                            | Reset Threshold |
| ---------- | ------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2026-02-03 | Comprehensive | Full codebase   | All           | 24 findings - [audit-documentation-report.md](./audits/comprehensive/audit-documentation-report.md)                 | ✅ (all)        |
| 2026-01-30 | Comprehensive | Full codebase   | All           | Session #116 - [audit-documentation-report.md](./audits/comprehensive/audit-documentation-report.md)                | ✅ (all)        |
| 2026-01-24 | Comprehensive | Full codebase   | 194 docs      | 14 (0 S0, 4 S1, 6 S2, 4 S3) - [audit-documentation-report.md](./audits/comprehensive/audit-documentation-report.md) | ✅ (all)        |
| 2026-01-17 | Single-Claude | 295             | 157           | 10 (2 S1, 5 S2, 3 S3) - [audit-2026-01-17.md](./audits/single-session/documentation/audit-2026-01-17.md)            | ⚠️ (single)     |
| 2026-01-10 | Multi-AI      | Full codebase   | All MD        | 14 (CANON-DOCS.jsonl)                                                                                               | ✅              |

### Process Audits (`/audit-process`)

| Date       | Session       | Commits Covered | Files Covered    | Findings                                                                                                  | Reset Threshold |
| ---------- | ------------- | --------------- | ---------------- | --------------------------------------------------------------------------------------------------------- | --------------- |
| 2026-02-03 | Comprehensive | Full codebase   | All              | 46 findings - [audit-process-report.md](./audits/comprehensive/audit-process-report.md)                   | ✅ (all)        |
| 2026-01-30 | Comprehensive | Full codebase   | All              | Session #116 - [audit-process-report.md](./audits/comprehensive/audit-process-report.md)                  | ✅ (all)        |
| 2026-01-24 | Comprehensive | Full codebase   | 60+ workflows    | 27 (0 S0, 5 S1, 12 S2, 10 S3) - [audit-process-report.md](./audits/comprehensive/audit-process-report.md) | ✅ (all)        |
| 2026-01-17 | Single-Claude | N/A (first)     | 60+              | 10 (0 S1, 4 S2, 6 S3) - [audit-2026-01-17.md](./audits/single-session/process/audit-2026-01-17.md)        | ⚠️ (single)     |
| 2026-01-10 | Multi-AI      | Full codebase   | CI/hooks/scripts | 14 (CANON-PROCESS.jsonl)                                                                                  | ✅              |

### Engineering-Productivity Audits (`/audit-engineering-productivity`)

| Date       | Session       | Commits Covered | Files Covered | Findings                                                                                                                  | Reset Threshold |
| ---------- | ------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2026-02-03 | Comprehensive | Full codebase   | All           | 12 findings - [audit-engineering-productivity-report.md](./audits/comprehensive/audit-engineering-productivity-report.md) | ✅ (all)        |

---

## Multi-AI Audit Log

| Date       | Categories    | Models Used                                                          | Total Findings                                  | Aggregated To                                                                         |
| ---------- | ------------- | -------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| 2026-02-03 | **ALL 7**     | Claude Opus 4.5 (7 specialized agents)                               | 132 raw → 30 unique (0 S0, 13 S1, 12 S2, 5 S3)  | [aggregated-findings.jsonl](./audits/comprehensive/aggregated-findings.jsonl)         |
| 2026-01-24 | **ALL 6**     | Claude Opus 4.5 (6 specialized agents)                               | 115 (9 S0, 28 S1, 46 S2, 32 S3)                 | [COMPREHENSIVE_AUDIT_REPORT.md](./audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md) |
| 2026-01-10 | Process       | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 14 canonical                                    | [CANON-PROCESS.jsonl](./technical-debt/MASTER_DEBT.jsonl)                             |
| 2026-01-10 | Documentation | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 14 canonical                                    | [CANON-DOCS.jsonl](./technical-debt/MASTER_DEBT.jsonl)                                |
| 2026-01-10 | Refactoring   | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 27 canonical                                    | [CANON-REFACTOR.jsonl](./technical-debt/MASTER_DEBT.jsonl)                            |
| 2026-01-08 | Performance   | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 28 raw → 20 canonical (1 S0, 7 S1, 17 S2, 3 S3) | [CANON-PERF.jsonl](./technical-debt/MASTER_DEBT.jsonl)                                |
| 2026-01-07 | Security      | Claude Opus 4.5, ChatGPT 5.2                                         | 10 canonical                                    | [CANON-SECURITY.jsonl](./technical-debt/MASTER_DEBT.jsonl)                            |
| 2026-01-06 | Code Review   | Claude Opus 4.5, ChatGPT 5.2                                         | 33 canonical                                    | [CANON-CODE.jsonl](./technical-debt/MASTER_DEBT.jsonl)                                |

---

## Master Issue Aggregation

| Date       | Raw Findings | Unique Findings | Reduction | Output                                                                                                                         |
| ---------- | ------------ | --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-03 | 132          | 30              | 77%       | [aggregated-findings.jsonl](./audits/comprehensive/aggregated-findings.jsonl), TDMS intake: DEBT-0869 to DEBT-0898 (898 total) |
| 2026-01-24 | 115          | 109             | 5%        | [COMPREHENSIVE_AUDIT_REPORT.md](./audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md)                                          |
| 2026-01-17 | 292          | 283             | 3%        | [MASTER_ISSUE_LIST.md](./technical-debt/INDEX.md), [IMPLEMENTATION_PLAN.md](./technical-debt/INDEX.md)                         |

**Latest Aggregation Summary (2026-02-03 Comprehensive):**

- **Sources:** 7 parallel Claude Opus 4.5 agents (Code, Security, Performance,
  Refactoring, Documentation, Process, Engineering-Productivity)
- **Raw Findings:** 132 across 7 domains
- **Unique Findings:** 30 after deduplication (77% reduction)
- **Severity Distribution:** S0: 0, S1: 13, S2: 12, S3: 5
- **TDMS Intake:** 30 new items added (DEBT-0869 to DEBT-0898), total: 898 items
- **Key Areas:** TodayPage component (multi-domain), performance hotspots,
  process automation

---

## Threshold Reset Rules

### When Single-Session Audit Completes

1. Update the relevant category table above with audit date
2. Reset ONLY that category's "Commits Since" and "Files Since" to 0
3. DO NOT reset other categories
4. Single-session audits do NOT count toward multi-AI escalation
5. Run:
   `node scripts/reset-audit-triggers.js --type=single --category=<name> --apply`

### When Multi-AI Audit Completes

1. Update the Multi-AI Audit Log above
2. Reset ALL category thresholds (all dates, commits, files to 0)
3. Reset the time-based trigger
4. Reset total commits counter
5. Multi-AI audit counts as a single-session audit for all covered categories
6. Run: `node scripts/reset-audit-triggers.js --type=multi-ai --apply`

---

## Threshold Check Commands

```bash
# Check current threshold status
npm run review:check

# Check with category filter
npm run review:check -- --category=security

# Reset thresholds after audit (dry-run by default)
npm run audit:reset -- --type=single --category=code
npm run audit:reset -- --type=multi-ai
npm run audit:reset -- --type=comprehensive

# Apply the reset (writes to file)
npm run audit:reset -- --type=single --category=code --apply
```

---

---

## Terminology

**Raw Findings**: Total findings reported by all AI models before
deduplication/aggregation (e.g., 28 raw findings from 5 models).

**Canonical Findings**: Deduplicated, verified findings in CANON-\*.jsonl format
(e.g., 28 raw → 20 canonical after removing duplicates and false positives).

**Always report both**: "28 raw → 20 canonical" to show the aggregation process.

---

## Version History

| Version | Date       | Changes                                                                                                                                                                   |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.5     | 2026-02-03 | **COMPREHENSIVE AUDIT (7 domains):** Added Engineering-Productivity category; 132 raw → 30 unique findings; TDMS intake DEBT-0870-0899; all thresholds reset              |
| 2.4     | 2026-01-31 | **FIX:** Updated last audit dates from 2026-01-24 to 2026-01-30 (Session #116 comprehensive audit wasn't tracked)                                                         |
| 2.2     | 2026-01-24 | **COMPREHENSIVE AUDIT:** 6 parallel agents, 115 findings (9 S0, 28 S1, 46 S2, 32 S3), 110h remediation; ALL thresholds reset; CRITICAL: 2 credential exposures found      |
| 2.1     | 2026-01-17 | Master Issue Aggregation: 292 raw findings → 283 unique (10 S0, 75 S1, 135 S2, 63 S3); created MASTER_ISSUE_LIST.md and IMPLEMENTATION_PLAN.md                            |
| 2.0     | 2026-01-17 | Added single-session documentation audit (2026-01-17): 10 findings (2 S1, 5 S2, 3 S3); 295 commits/157 files; documentation:1 single audit now; ALL 6 CATEGORIES COMPLETE |
| 1.9     | 2026-01-17 | Added single-session refactoring audit (2026-01-17): 12 findings (4 S1, 5 S2, 3 S3); 295 commits/159 files; refactoring:1 single audit now                                |
| 1.8     | 2026-01-17 | Added single-session process audit (2026-01-17): 10 findings (0 S1, 4 S2, 6 S3); 60+ process files; process:1 single audit now                                            |
| 1.7     | 2026-01-17 | Added single-session performance audit (2026-01-17): 12 findings (2 S1, 7 S2, 3 S3); 353 commits/248 files; performance:2 single audits now                               |
| 1.6     | 2026-01-17 | Added single-session security audit (2026-01-17): 11 findings (2 S1, 3 S2, 6 S3); 172 commits/16 security files; security:2 single audits now                             |
| 1.5     | 2026-01-17 | Added single-session code audit (2026-01-17): 14 findings (2 S1, 5 S2, 7 S3); 435 commits/221 files covered; code:2 single audits now                                     |
| 1.4     | 2026-01-13 | Added single-session security audit (2026-01-13); moved files from docs/audit/ to docs/audits/single-session/security/                                                    |
| 1.3     | 2026-01-11 | Added Refactoring/Documentation/Process audits (all 6 categories now complete); 118 total canonical findings                                                              |
| 1.2     | 2026-01-10 | Updated thresholds with completion dates for Code/Security/Performance audits; clarified raw vs canonical findings terminology; updated audit logs                        |
| 1.1     | 2026-01-08 | Added Performance multi-AI audit results (28 findings from 5 models)                                                                                                      |
| 1.0     | 2026-01-08 | Initial creation - separate tracking for single vs multi-AI audits                                                                                                        |
