# Mining Agent 3: Retro & Action Item Analysis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Analysis of PR retrospective coverage, action item implementation rates, and
deferred item tracking gaps.

**Generated:** 2026-02-27 **Source files:** `.claude/state/reviews.jsonl`,
`.claude/skills/pr-retro/SKILL.md`, `docs/technical-debt/MASTER_DEBT.jsonl`,
`docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`

---

## 1. Retro Entry Analysis

### Retro Coverage

| Metric                                             | Count                                            |
| -------------------------------------------------- | ------------------------------------------------ |
| Total merged PRs (#367-#397)                       | 27                                               |
| PRs with retro entries in `reviews.jsonl`          | 16                                               |
| PRs with retro headers in learnings log / archives | 26 (some duplicated across archive + active log) |
| Unique PRs with retros                             | 16                                               |
| PRs without retros                                 | 11                                               |
| **Retro coverage rate**                            | **59%**                                          |

### PRs with retros (from `reviews.jsonl` type=retrospective):

| PR# | Date       | Rounds | Total Items | Fixed | Rejected | Deferred |
| --- | ---------- | ------ | ----------- | ----- | -------- | -------- |
| 367 | 2026-02-16 | 7      | 193         | 100   | 24       | 6        |
| 368 | 2026-02-16 | 6      | 65          | 50    | 15       | 0        |
| 369 | 2026-02-17 | 9      | 119         | 78    | 41       | 0        |
| 370 | 2026-02-17 | 5      | 53          | 46    | 6        | 1        |
| 371 | 2026-02-17 | 2      | 45          | 38    | 7        | 0        |
| 374 | 2026-02-18 | 5      | 40          | 29    | 5        | 5        |
| 379 | 2026-02-20 | 11     | 190         | 106   | 61       | 4        |
| 382 | 2026-02-20 | 3      | 76          | 61    | 13       | 0        |
| 383 | 2026-02-21 | 8      | 282         | 192   | 23       | 67       |
| 390 | 2026-02-25 | 0      | 0           | 0     | 0        | 0        |
| 391 | 2026-02-25 | 3      | 122         | 108   | 7        | 0        |
| 392 | 2026-02-25 | 4      | 54          | 35    | 12       | 4        |
| 393 | 2026-02-26 | 2      | 15          | 6     | 9        | 0        |
| 394 | 2026-02-26 | 12     | 321         | 153   | 112      | 35       |
| 395 | 2026-02-27 | 2      | 18          | 17    | 1        | 0        |
| 396 | 2026-02-27 | 2      | 48          | 30    | 16       | 1        |

### PRs without retros:

PRs #372, #375, #377, #378, #380, #381, #384, #386, #387, #388, #389 (some may
have been too minor or were review-fix PRs for parent PRs).

### Key finding:

- Retros exist for 16 of 27 merged PRs (59%). The pr-retro SKILL.md baseline
  (v3.1) now sets PR >= 395 as the threshold, meaning earlier PRs are considered
  done.
- The `reviews.jsonl` retro entries have **zero-valued severity breakdowns** in
  many entries (critical/major/minor/trivial all = 0) even when `total` is
  non-zero. This is a data quality gap.

---

## 2. Action Item Counts

### By Category (from `reviews.jsonl` retro entries)

| Category                  | Items                     | Examples                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Automation Candidates** | 14                        | CC eslint rule, shared validateSkipReason, CC >15, Seed data PII, SonarCloud tool conflict, Gemini outdated suggestions, Compliance: secure errors, S4036 PATH binary hijacking (FP), Fail-closed catch, Absolute path leakage, S5852 Regex DoS, Options object for 7+ params, Schema convention disagreement, Secret redaction pattern gaps |
| **Skills to Update**      | 6 entries across 3 retros | FIX_TEMPLATES.md (x2), pr-review SKILL.md Step 0.5 (x2), check-pattern-compliance.js, CODE_PATTERNS.md                                                                                                                                                                                                                                       |
| **Process Improvements**  | 30                        | Propagation is #1 churn driver (x3), Path containment upfront design, Algorithm design before implementation, Large PRs amplify review cycles, PR scope discipline, etc.                                                                                                                                                                     |

### Totals

| Metric                                        | Count           |
| --------------------------------------------- | --------------- |
| Total retros                                  | 16              |
| Total automation candidates across all retros | 14 unique items |
| Total skills-to-update entries                | 6               |
| Total process improvements                    | 30              |
| **Grand total action items**                  | **50**          |

---

## 3. Action Item Implementation Rate

### Evidence from git history

There are **27 commits** with messages containing "retro action" or
"implement.\*retro" and **72 total commits** mentioning "retro" in their
messages.

Specific implementation commits by PR retro:

| Source Retro | Implementation Commit  | What was done                                         |
| ------------ | ---------------------- | ----------------------------------------------------- | --- | ------- |
| PR #370      | `0eec075c`             | Template 36, Pattern 9, skill updates                 |
| PR #374      | `4875943e`             | 3 fix templates, 4 code patterns, 2 skill updates     |
| PR #379      | `954587c4`, `bc607c63` | Algorithm design pre-check                            |
| PR #382      | `1c97085f`             | New patterns, templates, skill updates                |
| PR #383      | `0eec075c`             | Template 36, Pattern 9, skill updates                 |
| PR #384      | `9c9e1e3e`             | Pattern check + `                                     |     | `vs`??` |
| PR #388      | `9908e902`, `e33fb1d4` | Propagation check, pattern enforcement, MAX_FILE_SIZE |
| PR #390/391  | `e1b35236`             | Combined retro action items                           |
| PR #392      | `139d2f72`             | 6 skills/templates updates                            |
| PR #393/394  | `b509d04c`             | Templates, patterns, skills                           |
| PR #395/396  | `a1f7f628`             | Retro automation candidates + skills/templates        |

### Implementation rate

| Metric                                             | Value                                          |
| -------------------------------------------------- | ---------------------------------------------- |
| Retros with evidence of action item implementation | 12 of 16                                       |
| Retros with NO implementation evidence             | 4 (PR #367, #368, #369, #371)                  |
| **Implementation rate (retros acted on)**          | **75%**                                        |
| DEBT item DEBT-3528/DEBT-11062 self-reports        | "4 of ~14 action items tracked as DEBT" (~29%) |

**Gap:** While 75% of retros have at least one implementation commit, individual
action item tracking is weak. DEBT-3528 itself documents that only 4 of ~14
action items were tracked as DEBT entries. The system generates action items but
has incomplete follow-through tracking.

---

## 4. Deferred Item Audit

### Deferred counts per retro

| PR#       | Deferred | Notes                             |
| --------- | -------- | --------------------------------- |
| 367       | 6        | Early retro                       |
| 370       | 1        |                                   |
| 374       | 5        | Path containment items            |
| 379       | 4        | Algorithm hardening items         |
| 383       | **67**   | Largest deferral — large PR scope |
| 392       | 4        |                                   |
| 394       | **35**   | Second largest — 12-round PR      |
| 396       | 1        |                                   |
| **Total** | **123**  | Across 8 retros                   |

### Deferred item resolution tracking

**Promoted to DEBT:** Only 22 items in `MASTER_DEBT.jsonl` mention "pr-retro"
(and some are duplicates from dedup issues). Of 638 review-sourced DEBT items,
the vast majority come from review rounds, not retro-deferred items
specifically.

**Resolution rate for deferred items:**

- Total deferred across all retros: 123
- Deferred items tracked as DEBT: ~6-10 (estimated from
  `source: "review:pr-retro-*"` entries)
- **Deferred-to-DEBT conversion rate: ~5-8%**
- **Gap: ~90%+ of deferred items have no trackable resolution path**

This is the single largest gap in the review ecosystem. PR #383 alone deferred
67 items. PR #394 deferred 35 items. Where did those 102 items go? There is no
mechanism to:

1. Track individual deferred items (they are counts, not lists)
2. Check if deferred items were resolved in later PRs
3. Escalate repeatedly-deferred items

---

## 5. Recurring Deferrals

### Items deferred across 2+ PRs

Since deferred items are stored as **counts** (not lists) in `reviews.jsonl`,
identifying specific recurring deferrals requires cross-referencing retro
learnings and process improvements.

**Identified recurring themes from retro process improvements:**

| Theme                                  | Retros Mentioning               | Times Deferred |
| -------------------------------------- | ------------------------------- | -------------- |
| Propagation enforcement                | PR #374, #379, #383, #391, #392 | 5 retros       |
| CC reduction automation                | PR #367, #370, #371, #379, #394 | 5 retros       |
| Large PR scope discipline              | PR #383, #391, #394             | 3 retros       |
| Path normalization patterns            | PR #370, #374, #388, #392       | 4 retros       |
| Algorithm design before implementation | PR #379, #394                   | 2 retros       |
| JSONL data quality                     | PR #392, #395                   | 2 retros       |

**Most commonly deferred pattern:** Propagation enforcement (mentioned in 5
retros, partially automated but still appearing).

**Key finding:** Without itemized deferral tracking, we cannot determine if the
same item was deferred in PR #383 and again in PR #394. The data model
(counts-only) makes recurring deferral detection impossible. This is a
structural gap.

---

## 6. Cross-PR Systemic Detection

### How well does the system detect cross-PR patterns?

The pr-retro skill (SKILL.md) has explicit support:

- Step 1.4: "Check Previous Retros (MANDATORY)" - reads last 3-5 retros
- Step 3, Section 7: "Cross-PR Systemic Analysis"
- Step 5.2: "Flag Repeat Offenders" - same action item in 2+ retros escalates to
  S1

### Evidence of cross-PR detection working:

| Pattern                         | First Seen | Later Occurrences               | Detection                                         |
| ------------------------------- | ---------- | ------------------------------- | ------------------------------------------------- |
| Pattern 1 (CC)                  | PR #366    | Every PR through #394           | Detected, automated (pre-commit hook)             |
| Pattern 5 (Propagation)         | PR #366    | PR #367, #369, #383, #388, #394 | Detected, partially automated                     |
| Pattern 8 (Algorithm hardening) | PR #379    | PR #394 (12 rounds)             | Detected but marked BLOCKING after 4th occurrence |
| Pattern 11 (Path normalization) | PR #388    | PR #391, #392                   | Detected, template created                        |
| Pattern 13 (Fix-one-audit-all)  | PR #388    | PR #394                         | Detected, generalized from patterns 5, 11, 12     |

### Systemic detection effectiveness:

- **Detection rate: High** — The system reliably identifies cross-PR patterns
- **Resolution rate: Medium** — Templates and patterns are created but problems
  recur
- **Escalation rate: Low** — Only Pattern 8 was escalated to BLOCKING status
  despite multiple patterns recurring 3+ times
- **Gap:** The "Flag Repeat Offenders" (Step 5.2) mechanism exists in the skill
  but there is little evidence of S1 escalation happening in practice

---

## 7. pr-retro Known Patterns

### Active Patterns (from SKILL.md)

| #   | Pattern                           | Status       | Evidence                      |
| --- | --------------------------------- | ------------ | ----------------------------- |
| 6   | Filesystem Guard Lifecycle        | Active       | Last seen PR #374             |
| 7   | Path Containment Direction        | Active       | Last seen PR #374             |
| 8   | Incremental Algorithm Hardening   | **BLOCKING** | Last seen PR #394 (12 rounds) |
| 9   | Dual-File JSONL Sync              | Active       | Last seen PR #383             |
| 10  | Stale Reviewer Comments           | Active       | Last seen PR #388             |
| 11  | Cross-Platform Path Normalization | Active       | Last seen PR #392             |
| 12  | ChainExpression Propagation       | Active       | Last seen PR #394             |
| 13  | Fix-One-Audit-All                 | Active       | Last seen PR #394             |

### Archived Patterns (from ARCHIVE.md)

| #   | Pattern                                 | Status                                        |
| --- | --------------------------------------- | --------------------------------------------- |
| 1   | Cognitive Complexity (CC >15)           | IMPLEMENTED (pre-commit hook)                 |
| 2   | Incremental Security Hardening          | Addressed via FIX_TEMPLATES                   |
| 3   | JSONL Data Quality Rejections           | IMPLEMENTED (.qodo config)                    |
| 4   | Pattern Checker Incomplete Modification | Addressed                                     |
| 5   | Propagation Failures                    | Addressed (but still recurring as Pattern 13) |

### Assessment:

- 5 of 13 patterns have been resolved or archived
- 8 remain active, with Pattern 8 marked BLOCKING
- Pattern 5 (Propagation) was "archived" but its generalization (Pattern 13:
  Fix-One-Audit-All) is still active — the root problem persists
- **Pattern lifecycle: ~38% resolution rate** (5/13)

---

## 8. DEBT Items from Reviews

### MASTER_DEBT.jsonl breakdown

| Metric                                                | Count                                      |
| ----------------------------------------------------- | ------------------------------------------ |
| Total DEBT items in MASTER_DEBT.jsonl                 | 8,354 lines                                |
| Items with `source: "review"` or `source: "review:*"` | 638                                        |
| Items mentioning "pr-retro"                           | 22 (includes duplicates from dedup issues) |
| **Review-sourced % of total DEBT**                    | **7.6%**                                   |

### Status breakdown of review-sourced DEBT items (638 total):

| Status         | Count | %     |
| -------------- | ----- | ----- |
| VERIFIED       | 558   | 87.5% |
| RESOLVED       | 44    | 6.9%  |
| NEW            | 26    | 4.1%  |
| FALSE_POSITIVE | 10    | 1.6%  |

### Status breakdown of pr-retro DEBT items (22 total):

| Status   | Count | %     |
| -------- | ----- | ----- |
| VERIFIED | 12    | 54.5% |
| RESOLVED | 6     | 27.3% |
| NEW      | 4     | 18.2% |

### Key findings:

- Only **6.9% of review-sourced DEBT items are RESOLVED** — the vast majority
  sit in VERIFIED status
- pr-retro items have a better resolution rate (27.3%) than general review items
  (6.9%)
- **Duplicate DEBT entries exist:** DEBT-2236/DEBT-10673, DEBT-2364/DEBT-10798,
  DEBT-2424/DEBT-10858, DEBT-2429/DEBT-10863, DEBT-2430/DEBT-10864,
  DEBT-2431/DEBT-10865, DEBT-3528/DEBT-11062 — these are exact duplicates (same
  title, different IDs), indicating a dedup failure in the TDMS pipeline
- 7.6% of all DEBT items originating from reviews is relatively low, suggesting
  the review pipeline is not feeding back into DEBT tracking effectively

---

## Summary of Gaps Found

| #   | Gap                                                 | Severity | Evidence                                                                                                                     |
| --- | --------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Deferred items are counts, not lists**            | Critical | 123 deferred items across 8 retros have no itemized tracking. Cannot verify resolution.                                      |
| 2   | **Deferred-to-DEBT conversion is ~5-8%**            | Critical | ~90% of deferred items vanish without trace                                                                                  |
| 3   | **Retro action item tracking is incomplete**        | High     | DEBT-3528 self-reports "4 of ~14" tracked. 75% of retros have implementation commits but individual item tracking is absent. |
| 4   | **DEBT duplicates from pr-retro entries**           | Medium   | 7 duplicate pairs found (e.g., DEBT-2236/10673). TDMS dedup pipeline failure.                                                |
| 5   | **Severity breakdown always zero in reviews.jsonl** | Medium   | critical/major/minor/trivial fields are all 0 even when total > 0 across 80%+ of entries                                     |
| 6   | **Pattern 5 archived but recurs as Pattern 13**     | Medium   | Root cause (propagation) not actually solved, just renamed                                                                   |
| 7   | **S1 escalation mechanism unused**                  | Medium   | Step 5.2 "Flag Repeat Offenders" exists but no S1 escalations found in DEBT data                                             |
| 8   | **Review-sourced DEBT resolution rate is 6.9%**     | High     | 558 of 638 review DEBT items stuck in VERIFIED status                                                                        |
| 9   | **41% of merged PRs lack retros**                   | Medium   | 11 of 27 PRs without retros (though some are minor/fix PRs)                                                                  |

---

## Aggregate Metrics

| Metric                                   | Value                       |
| ---------------------------------------- | --------------------------- |
| Total review items across all retros     | 1,641                       |
| Total fixed                              | 1,019 (62.1%)               |
| Total rejected                           | 330 (20.1%)                 |
| Total deferred                           | 123 (7.5%)                  |
| Average rounds per PR (retro'd PRs)      | 5.1                         |
| Median rounds per PR                     | 4.5                         |
| Most efficient PR                        | #393 (2 rounds, 15 items)   |
| Least efficient PR                       | #394 (12 rounds, 321 items) |
| Automation candidates generated          | 14                          |
| Process improvements documented          | 30                          |
| Known churn patterns (active + archived) | 13                          |
| Patterns resolved                        | 5 (38%)                     |
| Retro implementation commits in git      | 27                          |

## Version History

| Version | Date       | Changes          |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-02-27 | Initial creation |
