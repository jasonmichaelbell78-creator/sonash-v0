# Lifecycle Scores — Data Effectiveness Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-13
**Status:** ACTIVE
**Generated:** 2026-03-13
**Source:** `.claude/state/lifecycle-scores.jsonl`
**Note:** AUTO-GENERATED — do not hand-edit
<!-- prettier-ignore-end -->

> Scoring: Capture/Storage/Recall/Action (0-3 each, 0-12 total). Systems below
> 6/12 are flagged for remediation.

---

## Summary

| Metric                     | Value  |
| -------------------------- | ------ |
| Total systems              | 20     |
| Average score              | 6.9/12 |
| Below threshold (<6)       | 4      |
| Action gaps (Action < 2)   | 16     |
| Recall gaps (Recall < 2)   | 11     |
| Storage gaps (Storage < 2) | 4      |

---

## All Systems (sorted by total score, worst first)

| System                   | Files                                                                                                                                                                                                                                                             | Cap | Sto | Rec | Act | Total  | Grade      | Gap                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Planning Data            | `decisions.jsonl`, `changelog.jsonl`                                                                                                                                                                                                                              | 2   | 1   | 0   | 0   | **3**  | F **FLAG** | Recall: write-only, no consumer. Action: none. Dead weight per diagnosis                                                      |
| Ecosystem Deferred Items | `deferred-items.jsonl`, `enforcement-manifest.jsonl`                                                                                                                                                                                                              | 2   | 1   | 0   | 0   | **3**  | F **FLAG** | Recall: write-only, no consumer reads these. Action: none                                                                     |
| Review Learnings         | `reviews.jsonl`, `review-metrics.jsonl`, `AI_REVIEW_LEARNINGS_LOG.md`                                                                                                                                                                                             | 2   | 2   | 1   | 0   | **5**  | D **FLAG** | Recall: review-metrics.jsonl has 0 consumers. Action: no enforcement from review learnings                                    |
| Aggregation Data         | `MASTER_ISSUE_LIST.jsonl`, `crossref-log.jsonl`, `dedup-log.jsonl`, `net-new-findings.jsonl`, `normalized-findings.jsonl`, `raw-findings.jsonl`, `unique-findings.jsonl`                                                                                          | 3   | 1   | 1   | 0   | **5**  | D **FLAG** | Storage: unbounded pipeline artifacts. Recall: consumed once during aggregation. Action: none                                 |
| Override Audit Trail     | `override-log.jsonl`                                                                                                                                                                                                                                              | 3   | 2   | 1   | 0   | **6**  | C          | Action: 78% cite 'pre-existing' with no mitigation                                                                            |
| Security Checklist       | `SECURITY_CHECKLIST.md`, `PRE_GENERATION_CHECKLIST.md`                                                                                                                                                                                                            | 2   | 2   | 1   | 1   | **6**  | C          | Recall: referenced in CLAUDE.md but not read at point of use. Action: proxy metrics defined but not collected                 |
| Fix Templates            | `FIX_TEMPLATES.md`                                                                                                                                                                                                                                                | 2   | 2   | 1   | 1   | **6**  | C          | Recall: templates exist but not wired to moment of creation. Action: manual application only                                  |
| Agent Tracking           | `agent-invocations.jsonl`                                                                                                                                                                                                                                         | 3   | 2   | 1   | 0   | **6**  | C          | Recall: logged but minimal analysis. Action: no enforcement based on invocation data                                          |
| Commit Log               | `commit-log.jsonl`                                                                                                                                                                                                                                                | 3   | 2   | 1   | 0   | **6**  | C          | Recall: one consumer (session analytics). Action: no enforcement from commit patterns                                         |
| Audit Findings           | `findings.jsonl`, `*.jsonl`, `*.jsonl`                                                                                                                                                                                                                            | 3   | 1   | 1   | 1   | **6**  | C          | Storage: unbounded, no rotation. Recall: one-time consumption during audit. Action: findings → TDMS but no automated re-check |
| Velocity Tracking        | `velocity-log.jsonl`                                                                                                                                                                                                                                              | 3   | 3   | 1   | 0   | **7**  | C          | Recall: one consumer (velocity report). Action: no automated response to velocity changes                                     |
| Retro Findings           | `retros.jsonl`, `task-pr-retro.state.json`                                                                                                                                                                                                                        | 3   | 2   | 2   | 1   | **8**  | B          | Action: action items tracked but not auto-enforced                                                                            |
| Hook Warnings            | `hook-warnings-log.jsonl`, `hook-warnings.json`                                                                                                                                                                                                                   | 3   | 2   | 2   | 1   | **8**  | B          | Action: warnings logged and surfaced but no auto-escalation to blocking gates                                                 |
| Health Scores            | `health-score-log.jsonl`, `doc-ecosystem-audit-history.jsonl`, `script-ecosystem-audit-history.jsonl`, `session-ecosystem-audit-history.jsonl`, `skill-ecosystem-audit-history.jsonl`, `tdms-ecosystem-audit-history.jsonl`, `hook-ecosystem-audit-history.jsonl` | 3   | 2   | 2   | 1   | **8**  | B          | Action: scores can degrade indefinitely without triggering re-audit. No regression alerting                                   |
| Memory                   | `MEMORY.md`                                                                                                                                                                                                                                                       | 2   | 2   | 3   | 1   | **8**  | B          | Action: memory loaded every turn (Recall=3) but no enforcement mechanism for memory-stored feedback                           |
| Pattern Rules            | `CODE_PATTERNS.md`, `verified-patterns.json`, `POSITIVE_PATTERNS.md`                                                                                                                                                                                              | 3   | 2   | 2   | 2   | **9**  | B          | Action: not all patterns enforced by gates (~15% automated)                                                                   |
| Behavioral Rules         | `CLAUDE.md`                                                                                                                                                                                                                                                       | 2   | 3   | 3   | 1   | **9**  | B          | Action: rules loaded every turn but 5/11 have no automated enforcement (Wave 4 annotated)                                     |
| Learning Routes          | `learning-routes.jsonl`                                                                                                                                                                                                                                           | 3   | 2   | 2   | 2   | **9**  | B          | New system (Wave 2). Verification runner exists. Needs more consumers                                                         |
| Technical Debt           | `MASTER_DEBT.jsonl`, `FALSE_POSITIVES.jsonl`                                                                                                                                                                                                                      | 3   | 3   | 2   | 2   | **10** | A          | Minor: debt resolution pipeline works but some items lack auto-verification                                                   |
| Session Context          | `SESSION_CONTEXT.md`, `SESSION_HISTORY.md`                                                                                                                                                                                                                        | 3   | 2   | 3   | 2   | **10** | A          | Minor: session handoff works well. Could improve archival automation                                                          |

---

## Flagged Systems (Total < 6)

### Planning Data (3/12)

- **Category:** planning-data
- **Files:** .planning/system-wide-standardization/decisions.jsonl,
  .planning/system-wide-standardization/changelog.jsonl
- **Gap:** Recall: write-only, no consumer. Action: none. Dead weight per
  diagnosis

### Ecosystem Deferred Items (3/12)

- **Category:** ecosystem-deferred
- **Files:** data/ecosystem-v2/deferred-items.jsonl,
  data/ecosystem-v2/enforcement-manifest.jsonl
- **Gap:** Recall: write-only, no consumer reads these. Action: none

### Review Learnings (5/12)

- **Category:** review-learnings
- **Files:** .claude/state/reviews.jsonl, .claude/state/review-metrics.jsonl,
  docs/AI_REVIEW_LEARNINGS_LOG.md
- **Gap:** Recall: review-metrics.jsonl has 0 consumers. Action: no enforcement
  from review learnings
- **Remediation:** Wave 2 router can scaffold; Wave 6 will wire consumers

### Aggregation Data (5/12)

- **Category:** aggregation-data
- **Files:** docs/aggregation/MASTER_ISSUE_LIST.jsonl,
  docs/aggregation/crossref-log.jsonl, docs/aggregation/dedup-log.jsonl,
  docs/aggregation/net-new-findings.jsonl,
  docs/aggregation/normalized-findings.jsonl,
  docs/aggregation/raw-findings.jsonl, docs/aggregation/unique-findings.jsonl
- **Gap:** Storage: unbounded pipeline artifacts. Recall: consumed once during
  aggregation. Action: none

---

## Action Gaps (Action < 2) — Priority for Wave 6

| System                   | Action Score | Gap                                                                                                                           | Remediation                                                                                     |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Planning Data            | 0            | Recall: write-only, no consumer. Action: none. Dead weight per diagnosis                                                      | Pending                                                                                         |
| Ecosystem Deferred Items | 0            | Recall: write-only, no consumer reads these. Action: none                                                                     | Pending                                                                                         |
| Review Learnings         | 0            | Recall: review-metrics.jsonl has 0 consumers. Action: no enforcement from review learnings                                    | Wave 2 router can scaffold; Wave 6 will wire consumers                                          |
| Aggregation Data         | 0            | Storage: unbounded pipeline artifacts. Recall: consumed once during aggregation. Action: none                                 | Pending                                                                                         |
| Override Audit Trail     | 0            | Action: 78% cite 'pre-existing' with no mitigation                                                                            | In rotation (operational tier). File created by hooks when overrides occur                      |
| Security Checklist       | 1            | Recall: referenced in CLAUDE.md but not read at point of use. Action: proxy metrics defined but not collected                 | Wave 3 created PRE_GENERATION_CHECKLIST.md with proxy metrics                                   |
| Fix Templates            | 1            | Recall: templates exist but not wired to moment of creation. Action: manual application only                                  | Pending                                                                                         |
| Agent Tracking           | 0            | Recall: logged but minimal analysis. Action: no enforcement based on invocation data                                          | Rotation added (operational tier). session-end v2.1 added invocation summary                    |
| Commit Log               | 0            | Recall: one consumer (session analytics). Action: no enforcement from commit patterns                                         | Rotation added (operational tier)                                                               |
| Audit Findings           | 1            | Storage: unbounded, no rotation. Recall: one-time consumption during audit. Action: findings → TDMS but no automated re-check | Pending                                                                                         |
| Velocity Tracking        | 0            | Recall: one consumer (velocity report). Action: no automated response to velocity changes                                     | Permanent rotation tier                                                                         |
| Retro Findings           | 1            | Action: action items tracked but not auto-enforced                                                                            | In rotation (historical tier). Wave 2 pr-retro skill updated with pattern_recurrence map (v4.4) |
| Hook Warnings            | 1            | Action: warnings logged and surfaced but no auto-escalation to blocking gates                                                 | Rotation added (W0). Hook audit Wave 4 added enrichment                                         |
| Health Scores            | 1            | Action: scores can degrade indefinitely without triggering re-audit. No regression alerting                                   | Rotation added (historical tier). /alerts checks some thresholds                                |
| Memory                   | 1            | Action: memory loaded every turn (Recall=3) but no enforcement mechanism for memory-stored feedback                           | Pending                                                                                         |
| Behavioral Rules         | 1            | Action: rules loaded every turn but 5/11 have no automated enforcement (Wave 4 annotated)                                     | Wave 4 added enforcement annotations; Wave 4.2 routed 5 gaps through learning-router            |

---

## Recall Gaps (Recall < 2) — Priority for Wave 6

| System                   | Recall Score | Gap                                                                                                                           |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Planning Data            | 0            | Recall: write-only, no consumer. Action: none. Dead weight per diagnosis                                                      |
| Ecosystem Deferred Items | 0            | Recall: write-only, no consumer reads these. Action: none                                                                     |
| Review Learnings         | 1            | Recall: review-metrics.jsonl has 0 consumers. Action: no enforcement from review learnings                                    |
| Aggregation Data         | 1            | Storage: unbounded pipeline artifacts. Recall: consumed once during aggregation. Action: none                                 |
| Override Audit Trail     | 1            | Action: 78% cite 'pre-existing' with no mitigation                                                                            |
| Security Checklist       | 1            | Recall: referenced in CLAUDE.md but not read at point of use. Action: proxy metrics defined but not collected                 |
| Fix Templates            | 1            | Recall: templates exist but not wired to moment of creation. Action: manual application only                                  |
| Agent Tracking           | 1            | Recall: logged but minimal analysis. Action: no enforcement based on invocation data                                          |
| Commit Log               | 1            | Recall: one consumer (session analytics). Action: no enforcement from commit patterns                                         |
| Audit Findings           | 1            | Storage: unbounded, no rotation. Recall: one-time consumption during audit. Action: findings → TDMS but no automated re-check |
| Velocity Tracking        | 1            | Recall: one consumer (velocity report). Action: no automated response to velocity changes                                     |

---

## Wave Improvements Applied

| System               | Wave | Remediation                                                                                     |
| -------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| Pattern Rules        | W3   | Wave 3 added POSITIVE_PATTERNS.md; code-reviewer now blocks on violations                       |
| Retro Findings       | W2   | In rotation (historical tier). Wave 2 pr-retro skill updated with pattern_recurrence map (v4.4) |
| Hook Warnings        | W0   | Rotation added (W0). Hook audit Wave 4 added enrichment                                         |
| Override Audit Trail | W5   | In rotation (operational tier). File created by hooks when overrides occur                      |
| Health Scores        | W0   | Rotation added (historical tier). /alerts checks some thresholds                                |
| Behavioral Rules     | W4   | Wave 4 added enforcement annotations; Wave 4.2 routed 5 gaps through learning-router            |
| Security Checklist   | W3   | Wave 3 created PRE_GENERATION_CHECKLIST.md with proxy metrics                                   |
| Agent Tracking       | W2   | Rotation added (operational tier). session-end v2.1 added invocation summary                    |
| Commit Log           | W0   | Rotation added (operational tier)                                                               |
| Learning Routes      | W2   | Created in Wave 2; verify-enforcement.js added                                                  |
