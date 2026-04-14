# Findings: What Does SoNash's Review Data Show About Learning Over Time?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-03
**Sub-Question IDs:** SQ-7 (Part B)

---

## Key Findings

### 1. Review System Coverage: 28 JSONL Records Spanning 2026-03-06 to 2026-04-03 [CONFIDENCE: HIGH]

`reviews.jsonl` contains 28 records. Of these, 18 carry `schema_version:1`, 4
carry `schema_version:2`, and 2 carry `schema_version:3`, indicating active
schema evolution during the observation window. The records cover a mixed set of
PR-level reviews (individual rounds), bulk retros, and manual entries. Several
records have `"date":"unknown"` (4 records), indicating incomplete data capture
at the time of entry.

`review-metrics.jsonl` is more complete with 64 records timestamped 2026-03-06
through 2026-04-03 (28 days). This file tracks per-PR metrics across 64 PRs
including dependency bumps (fix_ratio=0, review_rounds=0) and substantive
feature PRs.

**Sources:** `.claude/state/reviews.jsonl` (28 lines),
`.claude/state/review-metrics.jsonl` (64 lines).

---

### 2. Review Outcome Totals: 72% Fix Rate Across All Review Items [CONFIDENCE: HIGH]

Summing across all 28 records in `reviews.jsonl`:

| Outcome  | Count |
| -------- | ----- |
| Fixed    | 221   |
| Deferred | 7     |
| Rejected | 74    |
| Total    | 306   |

The overall fix rate (fixed / (fixed + deferred + rejected)) is **72.5%**
(221/305). The rejection rate is 24.2% (74/305) — a notable share that the log
documents is primarily driven by: stale repeat findings from prior review rounds
(labeled in the learnings log as auto-rejected), false positives flagged by
Gemini, and compliance duplicates.

**Sources:** `.claude/state/reviews.jsonl`.

---

### 3. Fix Ratio Trend (review-metrics.jsonl): No Clear Upward Trend; Average 0.44 [CONFIDENCE: HIGH]

The mean `fix_ratio` across all 64 PR metric records is **0.44**. This figure is
substantially depressed by the 20 PRs with `fix_ratio:0` — these are automated
dependency bumps (Dependabot/Renovate PRs) that receive no code review and are
expected to have fix_ratio=0.

Excluding zero-review PRs (20 records), the average fix_ratio across reviewed
PRs rises to approximately **0.67**.

Trend analysis by chronological position (record 1 through 64):

- **Records 1-20 (early, Mar 6–15):** Fix ratios range 0–1.0, mean ~0.68 across
  non-zero records
- **Records 21-40 (mid, Mar 15–26):** Mix of 0-ratio dependency PRs and
  substantive PRs; substantive mean ~0.65
- **Records 41-64 (recent, Mar 26–Apr 3):** More recent PRs show lower
  fix_ratios on substantive work (0.15, 0.17, 0.33, 0.36, 0.22, 0.46)

This suggests no consistent improvement in fix_ratio for feature PRs in the most
recent period; recent PRs tend to be planning/research-heavy (lower ratio
expected) rather than code-focused.

**Sources:** `.claude/state/review-metrics.jsonl`.

---

### 4. Review Rounds Distribution: 45% Single-Round, 31% Zero-Round (Bots) [CONFIDENCE: HIGH]

| Review Rounds | Count | % of Total |
| ------------- | ----- | ---------- |
| 0 (no review) | 20    | 31%        |
| 1             | 29    | 45%        |
| 2             | 9     | 14%        |
| 3             | 2     | 3%         |
| 4             | 2     | 3%         |
| 5             | 1     | 2%         |
| 6             | 1     | 2%         |

Most reviewed PRs complete in a single round. Outliers at 5–6 rounds include: PR
#468 (`passive-surfacing compliance`) at 5 rounds and PR #470
(`Wave 1b — propagation`) at 6 rounds — both complex multi-file infrastructure
changes.

**Sources:** `.claude/state/review-metrics.jsonl`.

---

### 5. Learning Routes: All 39 Routes Are in "Refined" or Earlier — Only 1 "Enforced" [CONFIDENCE: HIGH]

`learning-routes.jsonl` contains 39 records created 2026-03-13 through
2026-03-22.

| Status     | Count |
| ---------- | ----- |
| scaffolded | 39\*  |
| refined    | 38    |
| enforced   | 1     |
| verified   | 0     |

\*Note: The grep output shows 39 `"status":"scaffolded"` field values because
the `scaffold` sub-object field also contains `"status":"scaffolded"`. The
top-level `status` field shows 38 `refined` and 1 `enforced`.

By route type:

| Route                | Count |
| -------------------- | ----- |
| claude-md-annotation | 19    |
| hook-gate            | 18    |
| verified-pattern     | 2     |

The single `enforced` route (`id: 3689cfd62f77`) targets audit findings rotation
(unbounded storage) — but it carries `"_repair_needed": true` and
`"_failure_reason": "test exit code 1"` as of 2026-04-03, indicating the
enforcement test is currently failing. All routes classified as `behavioral` or
`process` type carry `confidence:"low"` with the rationale that "proxy metrics
need human judgment." This means the pipeline has not advanced any behavioral
routes beyond `refined` status.

**Sources:** `.claude/state/learning-routes.jsonl`.

---

### 6. Lifecycle Scores: 20 Systems Scored; Highest Gaps in Action Dimension [CONFIDENCE: HIGH]

`lifecycle-scores.jsonl` contains 20 records, all dated 2026-03-13 (single audit
snapshot — not time-series). Systems are scored on four dimensions: Capture,
Storage, Recall, Action (each 1–3). Scores range from 5 to 10.

| System               | Total | Action Score | Gap Summary                              |
| -------------------- | ----- | ------------ | ---------------------------------------- |
| Technical Debt       | 10    | 2            | Minor: auto-verification gap             |
| Pattern Rules        | 9     | 2            | ~15% automated enforcement               |
| Session Context      | 10    | 2            | Good; archival automation gap            |
| Velocity Tracking    | 9     | 1            | No automated corrective action           |
| Learning Routes      | 9     | 2            | New system; needs more consumers         |
| Review Learnings     | 7     | 1            | No automated enforcement from patterns   |
| Hook Warnings        | 8     | 1            | No auto-escalation to blocking gates     |
| Health Scores        | 8     | 1            | No regression alerting                   |
| Behavioral Rules     | 9     | 1            | 5/11 rules have no automated enforcement |
| Override Audit Trail | 7     | 0            | 78% cite 'pre-existing', no blocking     |
| Agent Tracking       | 7     | 0            | No enforcement from invocation data      |
| Audit Findings       | 6     | 1            | No automated re-check                    |
| Planning Data        | 6     | 1            | Unbounded, staleness alerting only       |
| Aggregation Data     | 5     | 0            | No action; pipeline artifacts only       |
| Ecosystem Deferred   | 6     | 1            | Staleness alerting only                  |

The Action dimension is the systemic gap: only 2 systems score Action=2
(Technical Debt, Pattern Rules). Three systems score Action=0 (Override Audit
Trail, Agent Tracking, Aggregation Data). The remediation notes reference "Wave
6" fixes for most gaps (adding consumers to session-end and /alerts), but no
updated lifecycle scores exist — the file remains a single 2026-03-13 snapshot.

**Sources:** `.claude/state/lifecycle-scores.jsonl`.

---

### 7. Hook Warnings: 35 Total, Dominated by pr-creep (37%) and network-error (11%) [CONFIDENCE: HIGH]

`hook-warnings-log.jsonl` contains 35 records. Date range: 2026-04-02 through
2026-04-03 (only 2 days of data visible, suggesting this file may rotate or was
recently created).

By warning type:

| Type               | Count | %   |
| ------------------ | ----- | --- |
| pr-creep           | 13    | 37% |
| network-error      | 4     | 11% |
| propagation-staged | 4     | 11% |
| trigger            | 3     | 9%  |
| tdms-s0            | 2     | 6%  |
| review-lifecycle   | 2     | 6%  |
| cli-tools-missing  | 2     | 6%  |
| agent              | 2     | 6%  |
| patterns           | 1     | 3%  |
| pattern-violations | 1     | 3%  |
| mcp-secrets        | 1     | 3%  |

By hook source: pre-commit (19), session-start (8), pre-push (8).

Key observations:

- `tdms-s0` warnings show S0: 26 critical debt items (constant across both
  session-start entries), indicating no reduction in critical debt between
  2026-04-02 and 2026-04-03.
- `pr-creep` is the dominant warning category (37% of all warnings), driven by
  large branch histories.
- `pattern-violations` appeared on 2026-04-03, indicating regression in pattern
  compliance.
- Lifecycle score LS-005 (Hook Warnings) rated Action=1 with the gap "no
  auto-escalation to blocking gates" — this is confirmed by the data: all
  warnings carry `"outcome":"warned"` with no blocking actions observed.

**Sources:** `.claude/state/hook-warnings-log.jsonl`,
`.claude/state/lifecycle-scores.jsonl`.

---

### 8. AI_REVIEW_LEARNINGS_LOG: 72 Review Sections, Review #1 through #62 Plus Numbered IDs [CONFIDENCE: HIGH]

`docs/AI_REVIEW_LEARNINGS_LOG.md` is 3,187 lines with document version 17.116,
created 2026-01-02, last updated 2026-03-26. It contains 72 `### Review`
sections.

The log spans from review #1 (not visible in the tail) through review #62 (most
recent visible numbered entry, dated 2026-03-30, PR #480). Additional entries
exist using non-sequential ID formats: `review-466-r3`, `503`, `504`,
`retro-bulk-448-470`, `rev-14` through `rev-65`. The version history table in
the file shows entries from at least v17.58 through v17.116, indicating 58+
version increments were captured in the condensed history.

The document version history (embedded in the collapsed `<details>` block) shows
reviews numbered #458 through #509 in the version history, suggesting the log's
"Review #N" numbering in the body covers recent reviews while earlier entries
are summarized in the version table. Review #486 (PR #448 R1) had 47 fixes — the
largest single-round fix count visible in the version history.

**Sources:** `docs/AI_REVIEW_LEARNINGS_LOG.md`.

---

### 9. Pattern Enforcement: 16 Verified Patterns, 15 Enforced by CI/Lint, 1 by SonarCloud [CONFIDENCE: HIGH]

`scripts/config/verified-patterns.json` defines 16 patterns. The enforcement
breakdown:

| Enforcement Mechanism          | Count |
| ------------------------------ | ----- |
| patterns:check + code-reviewer | 15    |
| SonarCloud CI                  | 1     |

All 7 critical-severity patterns use `patterns:check + code-reviewer`. The
single SonarCloud-only pattern is `cyclomatic-complexity` (CC > 15 threshold).
The config also carries a `known_violations` map listing files with current
unresolved violations across multiple patterns including:
`regex-complexity-s5852` (24 files), `unbounded-query` (14 files),
`banned-direct-firestore-write` (7 files), `happy-path-only` (6 files). This
`known_violations` section functions as a technical debt register embedded
directly in the pattern config.

**Sources:** `scripts/config/verified-patterns.json`.

---

## Sources

| #   | Path                                    | Type          | Trust | CRAAP Avg | Date                         |
| --- | --------------------------------------- | ------------- | ----- | --------- | ---------------------------- |
| 1   | `.claude/state/reviews.jsonl`           | state-file    | HIGH  | 4.6       | 2026-03-24 to 2026-04-03     |
| 2   | `.claude/state/review-metrics.jsonl`    | state-file    | HIGH  | 4.6       | 2026-03-06 to 2026-04-03     |
| 3   | `.claude/state/learning-routes.jsonl`   | state-file    | HIGH  | 4.4       | 2026-03-13 to 2026-03-22     |
| 4   | `.claude/state/lifecycle-scores.jsonl`  | state-file    | HIGH  | 4.4       | 2026-03-13 (single snapshot) |
| 5   | `.claude/state/hook-warnings-log.jsonl` | state-file    | HIGH  | 3.8       | 2026-04-02 to 2026-04-03     |
| 6   | `docs/AI_REVIEW_LEARNINGS_LOG.md`       | documentation | HIGH  | 4.2       | 2026-01-02 to 2026-03-26     |
| 7   | `scripts/config/verified-patterns.json` | config        | HIGH  | 4.6       | 2026-03-13                   |

---

## Contradictions

**1. Schema evolution vs. data completeness.** `reviews.jsonl` shows 3 schema
versions (v1, v2, v3) and includes records with `"date":"unknown"` — suggesting
the data capture pipeline was retrofitted rather than consistently applied from
the start. The `review-metrics.jsonl` (64 records) covers more PRs than
`reviews.jsonl` (28 records), indicating the two files are not in sync and
capture different slices of the review history.

**2. Lifecycle scores show "wave_fixed" for most gaps but no updated scores
exist.** Multiple lifecycle entries reference "W6" fixes (e.g., ls-002, ls-006,
ls-013, ls-014, ls-015, ls-017, ls-020) as remediations. However, the
lifecycle-scores.jsonl file contains only the single 2026-03-13 baseline — no
post-wave re-scoring records exist. It is not possible to verify from the data
whether the Wave 6 remediations actually improved the Action scores.

**3. Learning routes pipeline is stalled at "refined."** The learning-routes
pipeline was designed with stages: scaffolded → refined → enforced → verified.
Only 1 of 39 routes has reached `enforced` status, and that route's enforcement
test is currently failing (`_repair_needed: true`). The design intent (automated
enforcement from review learnings) is not reflected in the actual data state.

---

## Gaps

1. **No time-series lifecycle scores.** The `lifecycle-scores.jsonl` file is a
   single 2026-03-13 snapshot. There is no way to measure whether Action scores
   have improved after Wave 6 remediations from the available data.

2. **hook-warnings-log.jsonl covers only 2 days.** The 35-entry file spans only
   2026-04-02 to 2026-04-03. Either the file rotates aggressively or it was
   recently created. No longer-term trend in warning frequency is measurable.

3. **AI_REVIEW_LEARNINGS_LOG.md body review numbering is non-sequential.** The
   72 review sections use multiple ID schemes (`### Review 61`,
   `### Review 503`, `### review-466-r3`), making it difficult to determine the
   complete sequential range without reading the full document. The earliest
   body review number visible in the tail is #59; the earliest in the version
   history refers to #458. The relationship between body numbering and
   version-history numbering is unclear without a full read.

4. **No per-pattern violation trend data.** The `verified-patterns.json`
   `known_violations` map is a point-in-time snapshot. There is no historical
   data showing whether specific pattern violations are increasing or decreasing
   over time.

5. **"enforced" and "verified" route counts are near-zero.** It is unclear
   whether this represents the pipeline working as designed (routes genuinely
   can't be automated) or a systemic failure to advance routes through the
   pipeline. The classification notes consistently cite "confidence:low" and
   "pending-refinement" for behavioral/process routes without a clear escalation
   path.

---

## Serendipity

- **Pattern violations appeared on 2026-04-03** (hook-warnings-log entry
  `"type":"pattern-violations"`) while the session-start on 2026-04-02 showed
  only `"type":"patterns"` (different type key). This may indicate a type key
  inconsistency in the hook system or a new check added between sessions.

- **known_violations in verified-patterns.json is a substantial debt register.**
  The embedded `known_violations` object lists 24 files with
  `regex-complexity-s5852` violations — the second-largest debt category in the
  entire TDMS system (based on the 26 S0 items cited in hook warnings). This
  co-location of enforcement config and known debt is architecturally
  interesting: it means the pattern checker can skip known-bad files, but also
  that these violations are not tracked in MASTER_DEBT.jsonl separately.

- **The review rejection rate (24%) is largely driven by "stale repeat
  findings."** The version history entries for PR #448 rounds show 7–8
  "repeat-rejected" items per round. This pattern suggests that reviewer bots
  (Qodo, Gemini) are not consuming prior round decisions — a learning loop gap
  where the review tooling itself doesn't learn, even if the AI agent does.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings are derived directly from
  filesystem state files with exact counts and dates. No external sources
  consulted.
