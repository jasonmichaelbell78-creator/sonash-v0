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
| Average score              | 7.7/12 |
| Below threshold (<6)       | 1      |
| Action gaps (Action < 2)   | 16     |
| Recall gaps (Recall < 2)   | 2      |
| Storage gaps (Storage < 2) | 4      |

---

## All Systems (sorted by total score, worst first)

| System                   | Files                                                                                                                                                                                                                                                             | Cap | Sto | Rec | Act | Total  | Grade      | Gap                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Aggregation Data         | `MASTER_ISSUE_LIST.jsonl`, `crossref-log.jsonl`, `dedup-log.jsonl`, `net-new-findings.jsonl`, `normalized-findings.jsonl`, `raw-findings.jsonl`, `unique-findings.jsonl`                                                                                          | 3   | 1   | 1   | 0   | **5**  | D **FLAG** | Storage: unbounded pipeline artifacts. Recall: consumed once during aggregation. Action: none                                 |
| Planning Data            | `decisions.jsonl`, `changelog.jsonl`                                                                                                                                                                                                                              | 2   | 1   | 2   | 1   | **6**  | C          | Storage: still unbounded. Action: staleness alerting is informational                                                         |
| Audit Findings           | `findings.jsonl`, `*.jsonl`, `*.jsonl`                                                                                                                                                                                                                            | 3   | 1   | 1   | 1   | **6**  | C          | Storage: unbounded, no rotation. Recall: one-time consumption during audit. Action: findings → TDMS but no automated re-check |
| Ecosystem Deferred Items | `deferred-items.jsonl`, `enforcement-manifest.jsonl`                                                                                                                                                                                                              | 2   | 1   | 2   | 1   | **6**  | C          | Storage: still unbounded. Action: staleness alerting is informational                                                         |
| Review Learnings         | `reviews.jsonl`, `review-metrics.jsonl`, `AI_REVIEW_LEARNINGS_LOG.md`                                                                                                                                                                                             | 2   | 2   | 2   | 1   | **7**  | C          | Action: alerting drives investigation but no automated enforcement from review patterns                                       |
| Override Audit Trail     | `override-log.jsonl`                                                                                                                                                                                                                                              | 3   | 2   | 2   | 0   | **7**  | C          | Action: 78% cite 'pre-existing' — alerting exists but no enforcement to block repeat overrides                                |
| Security Checklist       | `SECURITY_CHECKLIST.md`, `PRE_GENERATION_CHECKLIST.md`                                                                                                                                                                                                            | 2   | 2   | 2   | 1   | **7**  | C          | Action: proxy metrics defined but not yet auto-collected                                                                      |
| Fix Templates            | `FIX_TEMPLATES.md`                                                                                                                                                                                                                                                | 2   | 2   | 2   | 1   | **7**  | C          | Action: code-reviewer references templates but application is still manual                                                    |
| Agent Tracking           | `agent-invocations.jsonl`                                                                                                                                                                                                                                         | 3   | 2   | 2   | 0   | **7**  | C          | Action: invocations summarized but no enforcement (e.g., no auto-trigger for missed agents)                                   |
| Retro Findings           | `retros.jsonl`, `task-pr-retro.state.json`                                                                                                                                                                                                                        | 3   | 2   | 2   | 1   | **8**  | B          | Action: action items tracked but not auto-enforced                                                                            |
| Hook Warnings            | `hook-warnings-log.jsonl`, `hook-warnings.json`                                                                                                                                                                                                                   | 3   | 2   | 2   | 1   | **8**  | B          | Action: warnings logged and surfaced but no auto-escalation to blocking gates                                                 |
| Health Scores            | `health-score-log.jsonl`, `doc-ecosystem-audit-history.jsonl`, `script-ecosystem-audit-history.jsonl`, `session-ecosystem-audit-history.jsonl`, `skill-ecosystem-audit-history.jsonl`, `tdms-ecosystem-audit-history.jsonl`, `hook-ecosystem-audit-history.jsonl` | 3   | 2   | 2   | 1   | **8**  | B          | Action: scores can degrade indefinitely without triggering re-audit. No regression alerting                                   |
| Memory                   | `MEMORY.md`                                                                                                                                                                                                                                                       | 2   | 2   | 3   | 1   | **8**  | B          | Action: memory loaded every turn (Recall=3) but no enforcement mechanism for memory-stored feedback                           |
| Commit Log               | `commit-log.jsonl`                                                                                                                                                                                                                                                | 3   | 2   | 2   | 1   | **8**  | B          | Action: commit pattern alerting is informational, not blocking                                                                |
| Pattern Rules            | `CODE_PATTERNS.md`, `verified-patterns.json`, `POSITIVE_PATTERNS.md`                                                                                                                                                                                              | 3   | 2   | 2   | 2   | **9**  | B          | Action: not all patterns enforced by gates (~15% automated)                                                                   |
| Behavioral Rules         | `CLAUDE.md`                                                                                                                                                                                                                                                       | 2   | 3   | 3   | 1   | **9**  | B          | Action: rules loaded every turn but 5/11 have no automated enforcement (Wave 4 annotated)                                     |
| Velocity Tracking        | `velocity-log.jsonl`                                                                                                                                                                                                                                              | 3   | 3   | 2   | 1   | **9**  | B          | Minor: regression alerting exists but no automated corrective action                                                          |
| Learning Routes          | `learning-routes.jsonl`                                                                                                                                                                                                                                           | 3   | 2   | 2   | 2   | **9**  | B          | New system (Wave 2). Verification runner exists. Needs more consumers                                                         |
| Technical Debt           | `MASTER_DEBT.jsonl`, `FALSE_POSITIVES.jsonl`                                                                                                                                                                                                                      | 3   | 3   | 2   | 2   | **10** | A          | Minor: debt resolution pipeline works but some items lack auto-verification                                                   |
| Session Context          | `SESSION_CONTEXT.md`, `SESSION_HISTORY.md`                                                                                                                                                                                                                        | 3   | 2   | 3   | 2   | **10** | A          | Minor: session handoff works well. Could improve archival automation                                                          |

---

## Flagged Systems (Total < 6)

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

| System                   | Action Score | Gap                                                                                                                           | Remediation                                                                                                    |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Aggregation Data         | 0            | Storage: unbounded pipeline artifacts. Recall: consumed once during aggregation. Action: none                                 | Pending                                                                                                        |
| Planning Data            | 1            | Storage: still unbounded. Action: staleness alerting is informational                                                         | W6: session-end Step 4c reads planning data + /alerts stale-planning-data checker                              |
| Audit Findings           | 1            | Storage: unbounded, no rotation. Recall: one-time consumption during audit. Action: findings → TDMS but no automated re-check | Pending                                                                                                        |
| Ecosystem Deferred Items | 1            | Storage: still unbounded. Action: staleness alerting is informational                                                         | W6: /alerts deferred-items staleness checker. >20 unresolved triggers warning                                  |
| Review Learnings         | 1            | Action: alerting drives investigation but no automated enforcement from review patterns                                       | W6: /alerts consumes review-metrics (churn + avoidable rounds). review-metrics→pr-retro wired in W1            |
| Override Audit Trail     | 0            | Action: 78% cite 'pre-existing' — alerting exists but no enforcement to block repeat overrides                                | W6: pr-retro cross-references override-log during churn analysis. session-end Step 5 already reviews overrides |
| Security Checklist       | 1            | Action: proxy metrics defined but not yet auto-collected                                                                      | W6: code-reviewer item 11 now actively verifies SECURITY_CHECKLIST at point of use (not just reference)        |
| Fix Templates            | 1            | Action: code-reviewer references templates but application is still manual                                                    | W6: code-reviewer item 10 strengthened — use existing templates before writing custom solutions                |
| Agent Tracking           | 0            | Action: invocations summarized but no enforcement (e.g., no auto-trigger for missed agents)                                   | W6: session-end Step 4b (W1) + compliance check (Step 4) both consume invocations                              |
| Retro Findings           | 1            | Action: action items tracked but not auto-enforced                                                                            | In rotation (historical tier). Wave 2 pr-retro skill updated with pattern_recurrence map (v4.4)                |
| Hook Warnings            | 1            | Action: warnings logged and surfaced but no auto-escalation to blocking gates                                                 | Rotation added (W0). Hook audit Wave 4 added enrichment                                                        |
| Health Scores            | 1            | Action: scores can degrade indefinitely without triggering re-audit. No regression alerting                                   | Rotation added (historical tier). /alerts checks some thresholds                                               |
| Memory                   | 1            | Action: memory loaded every turn (Recall=3) but no enforcement mechanism for memory-stored feedback                           | Pending                                                                                                        |
| Commit Log               | 1            | Action: commit pattern alerting is informational, not blocking                                                                | W6: session-end Step 7g commit analytics + /alerts commit-patterns checker. 2 consumers now                    |
| Behavioral Rules         | 1            | Action: rules loaded every turn but 5/11 have no automated enforcement (Wave 4 annotated)                                     | Wave 4 added enforcement annotations; Wave 4.2 routed 5 gaps through learning-router                           |
| Velocity Tracking        | 1            | Minor: regression alerting exists but no automated corrective action                                                          | W6: /alerts velocity-regression checker detects 50%+ drops. Velocity report + alerts = 2 consumers             |

---

## Recall Gaps (Recall < 2) — Priority for Wave 6

| System           | Recall Score | Gap                                                                                                                           |
| ---------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Aggregation Data | 1            | Storage: unbounded pipeline artifacts. Recall: consumed once during aggregation. Action: none                                 |
| Audit Findings   | 1            | Storage: unbounded, no rotation. Recall: one-time consumption during audit. Action: findings → TDMS but no automated re-check |

---

## Wave Improvements Applied

| System                   | Wave | Remediation                                                                                                    |
| ------------------------ | ---- | -------------------------------------------------------------------------------------------------------------- |
| Pattern Rules            | W3   | Wave 3 added POSITIVE_PATTERNS.md; code-reviewer now blocks on violations                                      |
| Review Learnings         | W6   | W6: /alerts consumes review-metrics (churn + avoidable rounds). review-metrics→pr-retro wired in W1            |
| Retro Findings           | W2   | In rotation (historical tier). Wave 2 pr-retro skill updated with pattern_recurrence map (v4.4)                |
| Hook Warnings            | W0   | Rotation added (W0). Hook audit Wave 4 added enrichment                                                        |
| Override Audit Trail     | W6   | W6: pr-retro cross-references override-log during churn analysis. session-end Step 5 already reviews overrides |
| Health Scores            | W0   | Rotation added (historical tier). /alerts checks some thresholds                                               |
| Behavioral Rules         | W4   | Wave 4 added enforcement annotations; Wave 4.2 routed 5 gaps through learning-router                           |
| Security Checklist       | W6   | W6: code-reviewer item 11 now actively verifies SECURITY_CHECKLIST at point of use (not just reference)        |
| Fix Templates            | W6   | W6: code-reviewer item 10 strengthened — use existing templates before writing custom solutions                |
| Agent Tracking           | W6   | W6: session-end Step 4b (W1) + compliance check (Step 4) both consume invocations                              |
| Velocity Tracking        | W6   | W6: /alerts velocity-regression checker detects 50%+ drops. Velocity report + alerts = 2 consumers             |
| Commit Log               | W6   | W6: session-end Step 7g commit analytics + /alerts commit-patterns checker. 2 consumers now                    |
| Learning Routes          | W2   | Created in Wave 2; verify-enforcement.js added                                                                 |
| Planning Data            | W6   | W6: session-end Step 4c reads planning data + /alerts stale-planning-data checker                              |
| Ecosystem Deferred Items | W6   | W6: /alerts deferred-items staleness checker. >20 unresolved triggers warning                                  |
