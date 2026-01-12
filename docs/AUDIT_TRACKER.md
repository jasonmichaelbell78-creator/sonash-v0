# Audit Tracker

**Document Version:** 1.3 **Created:** 2026-01-08 **Last Updated:** 2026-01-11
**Purpose:** Track single-session and multi-AI audit completions for threshold
management

---

## Overview

This document tracks:

1. **Single-session audit completions** - When `/audit-*` commands are run
2. **Multi-AI audit completions** - When full multi-model reviews are completed
3. **Threshold reset dates** - Separate per category

**IMPORTANT:** Thresholds reset when:

- Single-session audit: Resets that CATEGORY's threshold only
- Multi-AI audit: Resets ALL thresholds for that category

---

## Current Thresholds

### Single-Session Audit Thresholds (Per Category)

| Category      | Last Audit            | Commits Since | Files Since | Trigger At                                |
| ------------- | --------------------- | ------------- | ----------- | ----------------------------------------- |
| Code          | 2026-01-06 (Multi-AI) | 0             | 0           | 25 commits OR 15 files                    |
| Security      | 2026-01-07 (Multi-AI) | 0             | 0           | Any security-sensitive file OR 20 commits |
| Performance   | 2026-01-08 (Multi-AI) | 0             | 0           | 30 commits OR bundle change               |
| Refactoring   | 2026-01-10 (Multi-AI) | 0             | 0           | 40 commits OR 3 complexity warnings       |
| Documentation | 2026-01-10 (Multi-AI) | 0             | 0           | 20 doc files changed OR 30 commits        |
| Process       | 2026-01-10 (Multi-AI) | 0             | 0           | Any CI/hook file changed OR 30 commits    |

### Multi-AI Audit Thresholds (Cross-Category)

| Trigger Type            | Threshold          | Current | Status     |
| ----------------------- | ------------------ | ------- | ---------- |
| Single audits completed | 3 per category     | 0       | ⏳ Pending |
| Total commits           | 100 commits        | —       | ⏳ Check   |
| Time elapsed            | 14 days            | —       | ⏳ Check   |
| Major milestone         | Any M1.5+ complete | —       | ⏳ Check   |

**Multi-AI audit is triggered when ANY of:**

- 3+ single-session audits completed in same category
- 100+ commits since last multi-AI audit
- 14+ days since last multi-AI audit
- Major milestone completed

---

## Single-Session Audit Log

### Code Audits (`/audit-code`)

| Date       | Session  | Commits Covered | Files Covered | Findings             | Reset Threshold |
| ---------- | -------- | --------------- | ------------- | -------------------- | --------------- |
| 2026-01-06 | Multi-AI | Full codebase   | All TS/TSX    | See CANON-CODE.jsonl | ✅              |

### Security Audits (`/audit-security`)

| Date       | Session  | Commits Covered | Files Covered | Findings                  | Reset Threshold |
| ---------- | -------- | --------------- | ------------- | ------------------------- | --------------- |
| 2026-01-07 | Multi-AI | Full codebase   | All TS/TSX    | 10 (CANON-SECURITY.jsonl) | ✅              |

### Performance Audits (`/audit-performance`)

| Date       | Session        | Commits Covered | Files Covered | Findings              | Reset Threshold |
| ---------- | -------------- | --------------- | ------------- | --------------------- | --------------- |
| 2026-01-08 | Multi-AI (#37) | Full codebase   | All TS/TSX    | 20 (CANON-PERF.jsonl) | ✅              |

### Refactoring Audits (`/audit-refactoring`)

| Date       | Session  | Commits Covered | Files Covered | Findings                  | Reset Threshold |
| ---------- | -------- | --------------- | ------------- | ------------------------- | --------------- |
| 2026-01-10 | Multi-AI | Full codebase   | All TS/TSX/JS | 27 (CANON-REFACTOR.jsonl) | ✅              |

### Documentation Audits (`/audit-documentation`)

| Date       | Session  | Commits Covered | Files Covered | Findings              | Reset Threshold |
| ---------- | -------- | --------------- | ------------- | --------------------- | --------------- |
| 2026-01-10 | Multi-AI | Full codebase   | All MD        | 14 (CANON-DOCS.jsonl) | ✅              |

### Process Audits (`/audit-process`)

| Date       | Session  | Commits Covered | Files Covered    | Findings                 | Reset Threshold |
| ---------- | -------- | --------------- | ---------------- | ------------------------ | --------------- |
| 2026-01-10 | Multi-AI | Full codebase   | CI/hooks/scripts | 14 (CANON-PROCESS.jsonl) | ✅              |

---

## Multi-AI Audit Log

| Date       | Categories    | Models Used                                                          | Total Findings                                  | Aggregated To                                                             |
| ---------- | ------------- | -------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-01-10 | Process       | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 14 canonical                                    | [CANON-PROCESS.jsonl](./reviews/2026-Q1/canonical/CANON-PROCESS.jsonl)   |
| 2026-01-10 | Documentation | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 14 canonical                                    | [CANON-DOCS.jsonl](./reviews/2026-Q1/canonical/CANON-DOCS.jsonl)         |
| 2026-01-10 | Refactoring   | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 27 canonical                                    | [CANON-REFACTOR.jsonl](./reviews/2026-Q1/canonical/CANON-REFACTOR.jsonl) |
| 2026-01-08 | Performance   | Copilot, Claude Sonnet 4.5, Codex, Claude Code Opus 4.5, ChatGPT 5.2 | 28 raw → 20 canonical (1 S0, 7 S1, 17 S2, 3 S3) | [CANON-PERF.jsonl](./reviews/2026-Q1/canonical/CANON-PERF.jsonl)         |
| 2026-01-07 | Security      | Claude Opus 4.5, ChatGPT 5.2                                         | 10 canonical                                    | [CANON-SECURITY.jsonl](./reviews/2026-Q1/canonical/CANON-SECURITY.jsonl) |
| 2026-01-06 | Code Review   | Claude Opus 4.5, ChatGPT 5.2                                         | 33 canonical                                    | [CANON-CODE.jsonl](./reviews/2026-Q1/canonical/CANON-CODE.jsonl)         |

---

## Threshold Reset Rules

### When Single-Session Audit Completes

1. Update the relevant category table above with audit date
2. Reset ONLY that category's "Commits Since" and "Files Since" to 0
3. Increment the "Single audits completed" counter for multi-AI tracking
4. DO NOT reset other categories

### When Multi-AI Audit Completes

1. Update the Multi-AI Audit Log above
2. Reset ALL thresholds for that category
3. Reset the time-based trigger (14 days)
4. Log in AI_REVIEW_LEARNINGS_LOG.md with Review # entry

---

## Threshold Check Commands

```bash
# Check current threshold status
npm run review:check

# Check with category filter (future enhancement)
npm run review:check -- --category=security

# Force threshold reset after audit (future enhancement)
npm run review:reset -- --category=code --type=single
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

| Version | Date       | Changes                                                                                                                                            |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.3     | 2026-01-11 | Added Refactoring/Documentation/Process audits (all 6 categories now complete); 118 total canonical findings                                       |
| 1.2     | 2026-01-10 | Updated thresholds with completion dates for Code/Security/Performance audits; clarified raw vs canonical findings terminology; updated audit logs |
| 1.1     | 2026-01-08 | Added Performance multi-AI audit results (28 findings from 5 models)                                                                               |
| 1.0     | 2026-01-08 | Initial creation - separate tracking for single vs multi-AI audits                                                                                 |
