# Findings: Intake Gaps, Defer-Path Audit, and Dark Debt — Updated for Hybrid Architecture

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-8 (carries forward SQ-8a + SQ-8b +
DECISIONS_PRE_PLAN.md adjustments)

---

## Overview

This document carries forward the 26 intake gaps (GAP-01 through GAP-19 plus
DARK-01 through DARK-06), the 18 defer-path locations, and the 6 dark debt
stores documented in the prior research wave. It adds three dimensions to each:

1. **Web Dashboard Impact** — what the web can visualize, surface as an alert,
   or help close
2. **Priority Revision** — whether the hybrid architecture changes a gap's
   urgency
3. **Defer-Path Architecture Review** — whether any of the 18 defer-path
   locations need updating

**Pre-plan adjustments consumed from DECISIONS_PRE_PLAN.md:**

- GAP-01: downgraded from CRITICAL to MODERATE (no auto-routing; selective defer
  option)
- GAP-09: downgraded from MUST-HAVE to MEDIUM (Dependabot overlap)
- GAP-13: REMOVED as a gap (correct design — fixed items should not create debt
  entries)
- DARK-01: reframed (pre-commit suppression list, not shadow store — needs DEBT
  cross-ref only)

---

## Part 1: Updated Gap Matrix — Intake Gaps with Web Dashboard Impact

### Fully Disconnected Paths (Sources That Never Reach TDMS)

---

#### GAP-01: code-reviewer Agent [PRIORITY: MODERATE — adjusted from CRITICAL]

**Original finding:** Code review violations and arch issues surface only in
Claude context and are never written to TDMS. Highest-volume operational finding
stream.

**Challenge adjustment (DECISIONS_PRE_PLAN.md D-GAP-01):** Auto-routing would
flood TDMS. The correct fix is a selective defer option, not auto-routing.

**Web Dashboard Impact:**

- VISUALIZE: The web can show a "code-reviewer coverage" metric — what
  percentage of PRs since the last session-end resulted in at least one TDMS
  entry from code-review source. If the `source_id` prefix
  `review:code-reviewer-*` is present, the web can track it. Currently there are
  622 `review`-sourced items in MASTER_DEBT — the web already shows this source
  bucket; it would just be more meaningful once code-reviewer routes here.
- CLOSE THE GAP? No. The web cannot force the code-reviewer skill to write
  JSONL. The CLI/skill change is required first. Once GAP-01 is closed at the
  skill level, the web immediately benefits — no web-side changes needed.
- DATA QUALITY EFFECT: Until closed, the web's "by-source" breakdown understates
  code-review debt. The `review` source bucket exists but only captures
  manually-routed findings from `/pr-review`, not from the always-running
  code-reviewer agent.

**Priority with hybrid architecture:** MODERATE. The selective-defer SKILL.md
change is still needed. The web does not make this easier to close, but it makes
the absence more visible (the gap between PR count and review-sourced TDMS items
will be chartable).

---

#### GAP-02: gh-fix-ci Skill — Systemic CI Failures [PRIORITY: LOW]

**Original finding:** Root cause analysis of CI failures never creates TDMS
records.

**Web Dashboard Impact:**

- VISUALIZE: Not currently visualizable — CI failure events are not in any data
  file accessible to the web. Would require a new `ci-events.jsonl` log.
- CLOSE THE GAP? No. This is a SKILL.md-only change.
- DATA QUALITY EFFECT: Minimal. Low event frequency.

**Priority with hybrid architecture:** Unchanged. LOW.

---

#### GAP-03: convergence-loop — Verification Results Not Tracked [PRIORITY: LOW]

**Original finding:** Net-new findings discovered during CL verification by
non-debt-runner callers have no TDMS path.

**Web Dashboard Impact:**

- VISUALIZE: Not applicable — CL is an internal agent protocol, not a
  user-facing source.
- DATA QUALITY EFFECT: Minimal.

**Priority with hybrid architecture:** Unchanged. LOW.

---

#### GAP-04: quick-fix Skill [PRIORITY: LOW]

**Original finding:** Overlaps with pre-commit-fixer. Correct path is
deprecation.

**Web Dashboard Impact:** None until deprecated. Post-deprecation: no effect on
web.

**Priority with hybrid architecture:** Unchanged. LOW (deprecation task).

---

#### GAP-05: SonarCloud CI Workflow — No Auto-Sync [PRIORITY: MUST-HAVE]

**Original finding:** `sonarcloud.yml` runs full analysis on every push but does
not invoke `sync-sonarcloud.js`. The sync script is fully implemented — the CI
gap is a single step.

**Web Dashboard Impact:**

- VISUALIZE: This is directly visible on the web today as a data quality
  indicator. `metrics.json` has a `generated` timestamp. A "SonarCloud last
  synced" date could be derived from the most recent `sonarcloud`-sourced item's
  `created_date`. If that date is more than 7 days ago, the web can show a
  "SonarCloud sync stale" alert banner.
- CLOSE THE GAP? No — the CI workflow change is required. But the web makes the
  staleness visible, creating a forcing function. Recommended: add a
  `sync_freshness` object to `metrics.json` with per-source last-sync
  timestamps.
- DATA QUALITY EFFECT: HIGH. SonarCloud is 30% of MASTER_DEBT (2,561 items).
  Without auto-sync, new SonarCloud findings after a push never reach the
  dashboard until a manual sync is run. The web shows an incomplete picture of
  code quality.

**Priority with hybrid architecture:** MUST-HAVE. Web visibility of source
freshness makes this gap more urgent — users will immediately see the staleness
indicator.

**Web recommendation:** Add a source-staleness panel to the web dashboard. For
each major source (sonarcloud, audit, review, npm-audit), show "last item
ingested" date and a freshness status badge. This is a zero-code-change
enhancement using existing `source_id` prefix data.

---

#### GAP-06: Pattern Compliance CI — GitHub Issues Instead of TDMS [PRIORITY: MUST-HAVE]

**Original finding:** Weekly pattern-compliance-audit.yml creates GitHub Issues,
not TDMS items. GitHub Issues are completely invisible to the web dashboard.

**Web Dashboard Impact:**

- VISUALIZE: Currently zero. GitHub Issues do not appear in MASTER_DEBT and thus
  not in the web. After closing the gap, pattern-violation items (source_id
  prefix `pattern-compliance:`) would appear in the source breakdown chart.
- CLOSE THE GAP? No — requires workflow change. But the web is the motivation:
  GitHub Issues are the wrong terminal format because they bypass the only
  dashboard the user actually monitors.
- DATA QUALITY EFFECT: HIGH. Every weekly compliance scan result is currently
  invisible to the debt dashboard. The web makes this absence painfully
  concrete.

**Priority with hybrid architecture:** Elevated to MUST-HAVE. The web dashboard
makes the absence of pattern-compliance data in the debt picture immediately
obvious. The web is the correct terminal for this data; GitHub Issues are not.

---

#### GAP-07: Semgrep Findings [PRIORITY: NICE-TO-HAVE]

**Web Dashboard Impact:**

- VISUALIZE: After sync, Semgrep findings would appear in the security category
  and in a new `semgrep` source bucket. The web could show a "Code Scanning
  coverage" widget.
- DATA QUALITY EFFECT: Unknown until alert count is enumerated via GitHub API.

**Priority with hybrid architecture:** Unchanged. NICE-TO-HAVE.

---

#### GAP-08: CodeQL Findings [PRIORITY: NICE-TO-HAVE]

**Web Dashboard Impact:** Same as GAP-07 — bundled with Semgrep into a "Code
Scanning" source bucket on the web. After sync, vulnerability-type items from
CodeQL would show on the security category view.

**Priority with hybrid architecture:** Unchanged. NICE-TO-HAVE (bundle with
GAP-07).

---

#### GAP-09: npm audit Vulnerabilities [PRIORITY: MEDIUM — adjusted from MUST-HAVE]

**Original finding:** npm audit runs as a health metric (aggregate counts only)
but produces no per-vulnerability TDMS items.

**Challenge adjustment (DECISIONS_PRE_PLAN.md D-GAP-09):** Overlaps with
Dependabot coverage. Downgraded from MUST-HAVE to MEDIUM.

**Web Dashboard Impact:**

- VISUALIZE: The web today shows 723 security-category items. With npm-audit
  sync, actual CVE-sourced items would appear in a dedicated `npm-audit` source
  bucket, giving the security category row more specificity.
- ALERT: The web could show a "npm audit: N critical vulnerabilities not in
  TDMS" status indicator — but this requires running `npm audit --json`
  server-side or at build time and embedding results in a generated JSON file
  (e.g., `docs/technical-debt/npm-audit-snapshot.json`).
- DATA QUALITY EFFECT: MEDIUM. Dependabot handles the auto-merge cases. The gap
  matters most for vulnerabilities in the 30-day window before Dependabot PRs
  merge.

**Priority with hybrid architecture:** MEDIUM. The web makes it easy to display
this data once synced, but the web does not change the urgency of building the
sync script.

**Web recommendation:** Add a "Security Debt" sub-panel that shows
vulnerability-type items broken out by source (npm-audit, sonarcloud, semgrep).
This sub-panel is useful now (with existing sonarcloud vulnerability data) and
becomes richer as more sources sync.

---

#### GAP-10: Dependabot Vulnerabilities [PRIORITY: LOW]

**Web Dashboard Impact:**

- VISUALIZE: Low value. Routine Dependabot PRs auto-merge — by the time the web
  dashboard is viewed, the vulnerability is already resolved. Only un-merged
  major-version Dependabot PRs would benefit from TDMS tracking.
- DATA QUALITY EFFECT: Low.

**Priority with hybrid architecture:** Unchanged. LOW.

---

#### GAP-11: ESLint Warn-Level Violations in scripts/ and .claude/hooks/ [PRIORITY: LOW]

**Web Dashboard Impact:**

- VISUALIZE: If suppression were removed and violations were ingested, they
  would appear in `code-quality` category. Currently zero web visibility.
- CLOSE THE GAP? No — requires policy decision.
- DATA QUALITY EFFECT: Unknown until suppression is removed.

**Priority with hybrid architecture:** Unchanged. LOW. Policy decision, not a
tooling gap.

---

#### GAP-12: CodeRabbit, Qodo, Gemini PR Comments [PRIORITY: LOW]

**Web Dashboard Impact:**

- VISUALIZE: The web shows 622 `review`-sourced items. AI reviewer comments that
  make it through `/pr-review` already land here. The manual paste workflow is
  the correct filter.
- DATA QUALITY EFFECT: The items that don't make it through manual review are
  intentionally filtered (high false-positive rate). Web shows the
  correctly-filtered set.

**Priority with hybrid architecture:** Unchanged. LOW. Manual paste to
/pr-review is correct by design.

---

### Partially Connected Paths (Leaky Pipes)

---

#### GAP-13: Ecosystem Audit "Fix Now" Findings — REMOVED AS GAP

**Challenge adjustment (DECISIONS_PRE_PLAN.md D-GAP-13):** Correct design. Items
fixed immediately should not create debt entries. The ecosystem audit "Fix Now"
path is working as intended — an immediate fix requires no debt record. REMOVED
from gap list.

**Residual concern (not a gap):** The category distortion issue remains valid.
`engineering-productivity` is hardcoded for all deferred items regardless of
finding domain. This is a data quality issue, not an intake gap. The web
dashboard will show `engineering-productivity` as a bucket containing
mixed-domain items. Recommend documenting this in the web dashboard design as a
known label artifact, not blocking.

---

#### GAP-14: pr-retro Skill — Systemic Findings Discouraged from TDMS [PRIORITY: NICE-TO-HAVE]

**Web Dashboard Impact:**

- VISUALIZE: Not directly. pr-retro systemic findings would land in `process`
  category if routed to TDMS. Currently 727 `process`-category items exist; the
  web already shows this category, it would just have more items.
- CLOSE THE GAP? No — requires SKILL.md optional closure step.
- DATA QUALITY EFFECT: Low. The volume is small (process systemic findings per
  PR retro).

**Priority with hybrid architecture:** Unchanged. NICE-TO-HAVE. The
philosophical design of pr-retro (implementation over filing) is sound.

---

#### GAP-15: alerts Skill — "Defer" Is Suggestion, Not Enforcement [PRIORITY: MUST-HAVE]

**Original finding:** When a user chooses "Defer" for an alert, `/add-debt` is
suggested but not invoked. Pending-refinements items that have been surfaced 3+
times should mandatorily create TDMS entries but currently don't.

**Web Dashboard Impact:**

- VISUALIZE: This gap directly degrades web dashboard quality. Alerts that recur
  3+ sessions without resolution are definitionally systemic — they should
  appear in TDMS and thus in the web's open-items view. Until GAP-15 is closed,
  recurrent alerts are invisible to the web.
- CLOSE THE GAP? The web cannot enforce the alerts skill behavior. But the web
  could show a "recurrent alerts not in TDMS" counter as a data quality
  indicator — computed by comparing `pending-refinements.jsonl` item IDs against
  MASTER_DEBT `source_id` values.
- DATA QUALITY EFFECT: HIGH. The pending-refinements escalation is the intended
  circuit-breaker for systemic issues. If it doesn't fire into TDMS, the web's
  open-item counts understate systemic debt.

**Priority with hybrid architecture:** MUST-HAVE. The web makes the enforcement
gap more visible — recurring alerts that don't appear in TDMS create a
discrepancy between what `/alerts` reports and what the web shows. This
inconsistency is confusing to the user.

**Web recommendation:** Add a "Recurrent Alerts" indicator to the web showing
items from `pending-refinements.jsonl` that have been surfaced 3+ times and do
NOT have a matching TDMS entry. This creates a visible prompt to close the gap.

---

#### GAP-16: session-end — In-Session Discoveries Lost [PRIORITY: NICE-TO-HAVE]

**Web Dashboard Impact:**

- VISUALIZE: Not applicable — in-session context findings have no persistent
  representation.
- DATA QUALITY EFFECT: Low. `/add-debt` is available throughout the session; the
  gap is behavioral (no reminder), not technical.

**Priority with hybrid architecture:** Unchanged. NICE-TO-HAVE.

---

#### GAP-17: pre-commit-fixer — Defer to known-debt-baseline.json vs TDMS [PRIORITY: MUST-HAVE]

**Original finding:** known-debt-baseline.json has 45+ complexity violations
with no DEBT-XXXX IDs, no severity, no TDMS connection. Items added there are
permanently invisible.

**Web Dashboard Impact:**

- VISUALIZE: HIGH IMPACT. Once a `sync-baseline-debt.js` script runs, the 45+
  complexity violations become visible in the web's `code-quality` category. The
  web could also show a "Baseline Debt Coverage" indicator — what percentage of
  items in `known-debt-baseline.json` have a corresponding DEBT-XXXX ID.
  Currently: 0%.
- CLOSE THE GAP? No — requires the `sync-baseline-debt.js` script. But the web
  could display a count of "baseline items without DEBT IDs" as a data quality
  alert, read directly from the static `known-debt-baseline.json` file served
  alongside `metrics.json`.
- DATA QUALITY EFFECT: MODERATE. 45+ acknowledged items are invisible. Their
  absence slightly understates the open-item count but not by a percentage that
  changes the health grade (currently F at 13%).

**Priority with hybrid architecture:** MUST-HAVE. The web makes the absence
visible in a specific, actionable way. A "Baseline Coverage: 0%" badge on the
dashboard would be a concrete signal that drives this gap closure.

---

#### GAP-18: Hook Warnings — Recurrence Not Tracked for TDMS Escalation [PRIORITY: MUST-HAVE]

**Original finding:** hook-warnings-log.jsonl captures recurring
pre-commit/pre-push warnings persistently, but no escalation rule promotes
recurrent warnings to TDMS items.

**Web Dashboard Impact:**

- VISUALIZE: The web could show a "Hook Warning Recurrence" panel reading
  `hook-warnings-log.jsonl` (served as a static file). Display: top N warning
  types, occurrence count, first/last seen, TDMS status (has DEBT entry or not).
  This would be the most operationally useful "data quality" panel on the web
  dashboard.
- CLOSE THE GAP? No — requires `checkHookWarningRecurrence()` addition to
  `run-alerts.js`. But the web showing recurring warnings without TDMS entries
  is a direct motivator.
- DATA QUALITY EFFECT: HIGH. Warnings that recur across sessions are systemic
  debt by definition. Their absence from TDMS means the web's open-item count
  understates code-quality and process debt.

**Priority with hybrid architecture:** MUST-HAVE — and the web makes it newly
feasible to visualize without the CLI fix. The web could show the recurrence
data directly from the JSONL log file, creating a "dark debt revealed" panel
that highlights hooks with high recurrence counts but no TDMS entry. This web
panel can exist before the CLI escalation rule is built.

**Priority escalation note:** This is the strongest case in this document for a
gap where the web dashboard ACTIVELY HELPS CLOSE the gap by making invisible
data visible. The hook warning log exists; the web can read it; showing it
creates the pressure to route recurrent items to TDMS.

---

#### GAP-19: system-test "Skip sync" — Findings Lost [PRIORITY: NICE-TO-HAVE]

**Web Dashboard Impact:**

- VISUALIZE: Low. system-test findings in per-domain JSONL files are not
  accessible to the web — they are local filesystem artifacts.
- DATA QUALITY EFFECT: Low. system-test is not run every session.

**Priority with hybrid architecture:** Unchanged. NICE-TO-HAVE.

---

## Part 2: Dark Debt Stores — Web Dashboard Assessment

### DARK-01: known-debt-baseline.json [REFRAMED]

**Challenge adjustment:** This is a pre-commit suppression list, not a shadow
store. The correct framing: it needs DEBT-XXXX cross-references, not wholesale
migration.

**Should it appear on the web?** YES — as a coverage indicator.

**What the web should show:**

- A "Baseline Coverage" card: "N of M complexity suppressions have DEBT-XXXX
  cross-refs"
- Currently: 0 of 45 have DEBT-XXXX cross-refs
- Target: 45 of 45 (after `sync-baseline-debt.js` runs)
- Data source: `known-debt-baseline.json` is a static JSON file; it can be
  served alongside `metrics.json` or embedded in `metrics.json` as a `coverage`
  sub-object
- Visualization: a simple progress bar or percentage in the health section

**Implementation path:** Serve `known-debt-baseline.json` as a static file from
`docs/technical-debt/`. The web reads it client-side at page load. No new build
step needed.

**Priority:** Medium. Useful signal but not blocking. Add as a data quality
indicator panel.

---

### DARK-02: override-log.jsonl [AGING NOT MONITORED]

**Should it appear on the web?** YES — as an aging/hygiene alert.

**What the web should show:**

- A table of overrides: `skip_reason`, `date`, `checks_skipped`, age in days
- Filter: show only overrides older than 30 days
- Alert badge: "N overrides older than 30 days — review recommended"
- Color coding: < 30 days (green), 30-60 days (yellow), > 60 days (red)
- Data source: `.claude/override-log.jsonl` — this is a local file, NOT in
  `docs/technical-debt/`. It would need to be either copied to a served location
  or included in a generated summary JSON.

**Implementation path:** Add an `override_summary` object to `metrics.json`
during the `generate-metrics.js` run. Fields: `total_count`, `aging_count` (>30
days), oldest entry date. The web reads from `metrics.json` without direct log
access.

**Alternative:** Serve `override-log.jsonl` as a static asset. The web parses it
client-side. This is lower-infrastructure but exposes raw log data.

**Priority:** MEDIUM. The aging data is concrete and actionable. A web panel
showing stale overrides is the best forcing function for reviewing and resolving
them.

**Revised gap status:** DARK-02 is now a NICE-TO-HAVE web panel PLUS a future
`/alerts` checker. The web panel is feasible today (from a `metrics.json`
summary); the `/alerts` checker is deferred.

---

### DARK-03: deferred-items.jsonl [ESCALATION THRESHOLD TOO HIGH]

**Should it appear on the web?** YES — as a "Deferred Without Escalation"
indicator.

**What the web should show:**

- A panel: "Deferred ecosystem findings pending escalation"
- Counts: items with `defer_count == 1` (below threshold, invisible to TDMS) vs
  items with `defer_count >= 2` (at threshold, eligible for escalation)
- Items with `defer_count >= 2` that have not been escalated: shown as overdue
- For each deferred item: topic, defer count, last deferred date, "Escalate"
  note (not an action button — the web is read-only; show the CLI command to
  escalate)
- Data source: `data/ecosystem-v2/deferred-items.jsonl` — local file

**Implementation path:** Add a `deferred_items_summary` object to `metrics.json`
during `generate-metrics.js`. Fields: `single_deferred_count`,
`threshold_reached_count`, `oldest_deferred_date`. The web reads the summary
without direct JSONL access.

**Priority:** MUST-HAVE for web visibility. This is one of the most important
"dark debt revealed" panels because it shows items explicitly deferred by the
user that are not yet tracked in TDMS. The first-deferral invisibility means the
user can lose track of things they consciously chose to defer.

**Web panel value:** Showing `N items deferred but not yet in TDMS` makes the
"your deferrals are falling through" problem concrete and non-ignorable.

---

### DARK-04: ESLint Suppressed Violations in scripts/ [POLICY DECISION REQUIRED]

**Should it appear on the web?** Not until the suppression policy changes.

**Current state:** Zero data exists (suppressed at ESLint config level). The web
cannot show what doesn't exist. Until the zero-warning override is removed,
there is no `eslint-scripts` data to display.

**Possible web hook:** The web could show a "ESLint tooling coverage" indicator:
"N files in scripts/ and .claude/hooks/ have zero ESLint coverage (suppressed)."
This is a fixed value derived from counting files in those directories — it
doesn't require removing the suppression. It at least makes the coverage gap
visible.

**Priority:** LOW. Policy decision required before web visualization is
meaningful.

---

### DARK-05: GitHub Code Scanning (Semgrep + CodeQL) [API ACCESS REQUIRED]

**Should it appear on the web?** YES — after sync script is built.

**What the web should show:**

- A "Code Scanning" source card in the security sub-panel
- Count of open alerts by tool (Semgrep: N, CodeQL: M)
- Trend: new alerts this week vs last week
- Data source: After `sync-code-scanning.js` runs, items appear in MASTER_DEBT
  with `source_id` prefix `semgrep:` or `codeql:`. No separate web integration
  needed — they would appear in the existing source breakdown.

**Web can show staleness without the sync script:** If `metrics.json` includes
`last_code_scanning_sync: null`, the web can show "Code Scanning: not yet
synced" as a coverage gap indicator.

**Priority:** NICE-TO-HAVE. Build `sync-code-scanning.js` (GAP-07/08) first; web
visualization follows automatically.

---

### DARK-06: FALSE_POSITIVES.jsonl — Under-Populated [PRIORITY: MUST-HAVE]

**Original finding:** Only 6 FP entries despite an estimated 52% false-positive
rate in the verification queue (2,126 NEW items). The true S0/S1 count is
unknown; dashboard metrics are inflated.

**Should it appear on the web?** YES — as a critical health indicator.

**What the web should show:**

- A "Verification Queue Health" panel with two sub-numbers:
  - "2,126 items in verification queue (NEW status)"
  - "Estimated FP rate: 52% (verified by `reverify-resolved.js`)" — this is the
    most important data quality signal in the entire dashboard
  - "Only 6 formally classified FPs in FALSE_POSITIVES.jsonl"
- Impact: The "S0 Critical Alerts" KPI card (showing 11 or 26, depending on
  source) may be showing inflated numbers. The web should caveat: "S0 count may
  include unverified items — FP rate not assessed for this severity tier."
- Data source: `metrics.json` already has `health.verification_queue_size`
  (2,126) and `summary.false_positive_count` (74 classified FPs, per SQ4a ground
  truth). The 52% FP rate estimate comes from `reverify-resolved.js` audit
  results and should be added to `metrics.json` as a
  `data_quality.estimated_fp_rate` field.

**Priority with hybrid architecture:** MUST-HAVE. The web KPI cards (S0 count,
open count, resolution rate) are the primary way a user interprets debt health.
If those numbers are inflated by false positives, the dashboard is actively
misleading. Showing an FP rate caveat on the S0 card is the most important data
quality improvement for the web.

**Web recommendation:** Add a "Data Quality" sub-panel alongside the KPI cards
with:

- FP rate estimate and last FP triage date
- Verification queue size with "% unverified"
- A prompt: "Run `/debt-runner validate` to reduce verification queue"

---

## Part 3: Defer-Path Architecture Review — Hybrid Impact

### Do Any Defer Paths Need to Change for the Hybrid Architecture?

The 18 defer-path locations fall into three categories for hybrid impact:

**Category A: No change required (WORKING paths — 6 + 4 ecosystem inherited)**

| Location                                 | Assessment                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/pr-review` DAS framework               | Fully functional. Web shows deferred-from-pr items in the `review` source bucket.             |
| `AUDIT_TEMPLATE.md` ACCEPT/DECLINE/DEFER | Functional. Audit findings in TDMS appear on web in `audit` source bucket (35% of all items). |
| `ecosystem-audit/FINDING_WALKTHROUGH.md` | Functional. Critical Rule 7 (MUST create TDMS entries) is correct. No change.                 |
| All 8 ecosystem audit skills (inherited) | Functional. No change.                                                                        |
| `audit-comprehensive`                    | Functional.                                                                                   |
| `multi-ai-audit`                         | Functional (most explicit confirmation gate).                                                 |
| `/pr-retro` (gated)                      | Intentionally gated. Correct design. No change for hybrid.                                    |

**Category B: Needs update — path exists but is weak (ASPIRATIONAL paths)**

| Location                                     | Change Required                                             | Why Hybrid Makes It Urgent                                                                  |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/alerts` — "suggest /add-debt"              | Change to "invoke /add-debt" for 3x-surfaced items          | Web showing recurrent alerts without TDMS entries makes the gap embarrassing                |
| `/session-begin` — session-scoped defer      | Add optional "escalate to TDMS?" step for repeated failures | Low urgency; web doesn't directly surface session-begin deferrals                           |
| `/ecosystem-health` — defer to session goals | Add optional "create DEBT entry?" prompt for 2nd+ deferral  | Medium urgency; once deferred-items.jsonl is visible on web, this becomes a user-facing gap |

**Category C: Needs repair — BROKEN or MISSING paths**

| Location                                                      | Change Required                                                                                     | Why Hybrid Makes It Urgent                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pre-commit-fixer` Path B (defer to known-debt-baseline.json) | Document distinction vs TDMS; recommend "defer to baseline AND create DEBT entry"                   | Web showing "Baseline Coverage: 0%" makes the disconnect concrete                         |
| CLAUDE.md guardrail #14 option (b)                            | Add guidance: option (b) creates no DEBT entry; for tracked acknowledgment, also invoke `/add-debt` | Users will see the disconnect on the web (no DEBT entry for a known complexity violation) |

**Category D: No change, by design**

| Location                                                     | Assessment                                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `audit-enhancements` `resolve-item.js --action defer` caveat | The `--action defer` flag warrants code inspection but does not block the hybrid architecture. |

---

### Should the Web Show "Items Deferred From This Source" as a Metric?

YES. This is one of the most useful source-level metrics the web could show.

**Proposed metric: "Deferred From" source breakdown**

The `source_id` field in MASTER_DEBT tracks where an item came from (e.g.,
`audit:session- audit-2026-03-15`, `review:pr-review-PR-421`, `sonarcloud:*`).
For deferred items specifically (those with `status: NEW` that entered via a
user defer decision), the source tells you which workflow surfaced the item.

A "Deferred Items by Source" bar chart would show:

- Which workflows are generating the most deferred debt
- Which sources have items stuck in NEW status the longest
- The ratio of DEFERRED (status=NEW) to RESOLVED per source

This is directly useful for prioritization: a source with 50 deferred items and
0 resolved tells you where debt is accumulating without resolution.

**Implementation:** Filter `MASTER_DEBT` by `status: NEW` and group by source
prefix. This is entirely computable from the existing data with no new fields
required.

---

## Part 4: Priority Revision — Hybrid Architecture Impact

### Gaps Elevated by the Hybrid Architecture (web makes absence more visible)

| Gap                                      | Original Priority | Revised Priority          | Why                                                                                                 |
| ---------------------------------------- | ----------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| GAP-05: SonarCloud CI auto-sync          | MUST-HAVE         | MUST-HAVE (reinforced)    | Web source-freshness panel makes the staleness immediately visible                                  |
| GAP-06: Pattern compliance → TDMS        | MUST-HAVE         | MUST-HAVE (reinforced)    | Web is the correct terminal for this data; GitHub Issues bypass the dashboard entirely              |
| GAP-15: alerts defer enforcement         | MUST-HAVE         | MUST-HAVE (reinforced)    | Web recurrent-alerts panel exposes the gap between alerts and TDMS in real time                     |
| GAP-18: Hook warning recurrence          | MUST-HAVE         | MUST-HAVE + web panel now | Web can show the recurrence data FROM THE EXISTING LOG even before the CLI escalation rule is built |
| DARK-03: deferred-items.jsonl            | MUST-HAVE         | MUST-HAVE (reinforced)    | Web "Deferred Without Escalation" panel makes first-deferrals visible                               |
| DARK-06: FALSE_POSITIVES under-populated | MUST-HAVE         | MUST-HAVE (reinforced)    | Web KPI cards are misleading without FP rate caveat                                                 |
| DARK-02: override-log aging              | NICE-TO-HAVE      | MEDIUM                    | Web aging panel is feasible from metrics.json summary; creates hygiene visibility                   |

### Gaps Whose Priority Is Unchanged by the Hybrid Architecture

| Gap                                  | Priority     | Reason                                                                       |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------- |
| GAP-01: code-reviewer JSONL output   | MODERATE     | Web benefits after closing but doesn't accelerate closure                    |
| GAP-02: gh-fix-ci                    | LOW          | Web has no role in CI failure root-cause tracking                            |
| GAP-03: convergence-loop             | LOW          | Internal agent protocol, not web-visible                                     |
| GAP-04: quick-fix deprecation        | LOW          | Maintenance task                                                             |
| GAP-07/08: Code Scanning sync        | NICE-TO-HAVE | Web visualization follows automatically after sync script is built           |
| GAP-09: npm audit                    | MEDIUM       | Web can display vulnerability data once synced; doesn't change build urgency |
| GAP-10: Dependabot                   | LOW          | Routine auto-merge cases don't benefit from web tracking                     |
| GAP-11: ESLint suppression           | LOW          | Policy decision; web can't help                                              |
| GAP-12: AI PR review tools           | LOW          | Manual paste is correct design                                               |
| GAP-14: pr-retro systemic findings   | NICE-TO-HAVE | Optional closure step only                                                   |
| GAP-16: session-end context          | NICE-TO-HAVE | Behavioral reminder only                                                     |
| GAP-17: known-debt-baseline sync     | MUST-HAVE    | Web "Baseline Coverage: 0%" reinforces urgency                               |
| GAP-19: system-test skip             | NICE-TO-HAVE | Low frequency                                                                |
| DARK-01: known-debt-baseline reframe | MEDIUM       | Web coverage indicator is useful but not urgent                              |
| DARK-04: ESLint suppression          | LOW          | Policy decision                                                              |
| DARK-05: Code Scanning               | NICE-TO-HAVE | Follows from GAP-07/08                                                       |

### NICE-TO-HAVE Gaps That Are Now MUST-HAVE Due to Web Visibility

**GAP-18 becomes a dual-track item:** The web dashboard can expose hook warning
recurrence data NOW (before the CLI escalation rule is built) by reading
`hook-warnings-log.jsonl` directly. This means the web panel for hook warnings
is a MUST-HAVE web feature even if the CLI escalation rule is deferred. Two
separate work items:

1. Web panel (high value, low effort, can be built independently)
2. CLI escalation rule (moderate effort, dependent on above for motivation)

**DARK-02 (override-log aging) is elevated to MEDIUM.** The web aging panel is
feasible immediately from a `metrics.json` summary field. An `/alerts` checker
is a separate, deferrable addition. Showing aging skip acknowledgments on the
web is a low-effort, high-value hygiene feature.

---

## Part 5: Consolidated Action Table

### Tier 1 — Web Dashboard Data Quality Wins (immediately visible impact)

These are either already-needed CLI fixes that the web makes more urgent, or
web-side additions that require zero new CLI work:

| Action                                                         | Type                                | Effort  | Unlocks                                                          |
| -------------------------------------------------------------- | ----------------------------------- | ------- | ---------------------------------------------------------------- |
| Add source-freshness timestamps to metrics.json                | Script change (generate-metrics.js) | Trivial | Web source-staleness badges for GAP-05                           |
| Add override_summary to metrics.json                           | Script change (generate-metrics.js) | Trivial | Web override-aging panel for DARK-02                             |
| Add deferred_items_summary to metrics.json                     | Script change (generate-metrics.js) | Trivial | Web deferred-items panel for DARK-03                             |
| Add data_quality.estimated_fp_rate to metrics.json             | Script change (generate-metrics.js) | Low     | Web FP rate caveat on KPI cards for DARK-06                      |
| Add baseline_coverage to metrics.json                          | Script change (generate-metrics.js) | Trivial | Web "Baseline Coverage: 0%" badge for DARK-01                    |
| Serve hook-warnings-log.jsonl or embed summary in metrics.json | Script/serving change               | Low     | Web hook-recurrence panel for GAP-18 (web-only, before CLI rule) |

### Tier 2 — CLI Gap Closures That Web Makes Urgent

| Action                                                                   | Gap              | Effort   | Why Urgent                                                         |
| ------------------------------------------------------------------------ | ---------------- | -------- | ------------------------------------------------------------------ |
| Add sync-sonarcloud.js to sonarcloud.yml                                 | GAP-05           | Trivial  | Source freshness badge would be red until this ships               |
| Change pattern-compliance-audit.yml to call intake-pattern-violations.js | GAP-06           | Moderate | Web shows zero pattern compliance data; GitHub Issues are wrong    |
| Change alerts "suggest" to "invoke" for 3x-escalated items               | GAP-15           | Trivial  | Web recurrent-alerts panel shows items without TDMS — embarrassing |
| Add checkHookWarningRecurrence() to run-alerts.js                        | GAP-18           | Moderate | Web hook panel motivates CLI rule completion                       |
| Run sync-baseline-debt.js (new script)                                   | GAP-17 + DARK-01 | Moderate | Web "Baseline Coverage: 0%" is unacceptable target state           |
| Lower deferred-items.jsonl threshold to 1 for S0/S1                      | DARK-03          | Trivial  | Web shows single-deferred S0/S1 items as ignored                   |

### Tier 3 — Deferred (Hybrid Architecture Doesn't Change Priority)

GAP-02, GAP-03, GAP-04, GAP-07, GAP-08, GAP-10, GAP-11, GAP-12, GAP-14, GAP-16,
GAP-19, DARK-04, DARK-05 — all carry forward at their original priority levels.

---

## Contradictions

**Contradiction 1: GAP-13 removed but category distortion remains.**
DECISIONS_PRE_PLAN.md removes GAP-13 ("Fix Now" findings should not create debt
entries). However, the original GAP-13 also identified that
`engineering-productivity` is hardcoded for all deferred ecosystem-audit items
regardless of domain. This category distortion is not resolved by removing the
gap — it persists as a data quality issue that the web dashboard will surface
(all deferred ecosystem findings appear under `engineering-productivity` in the
category breakdown, making that category appear busier than it is). This should
be a separate, named data quality item, not silently dropped with GAP-13.

**Contradiction 2: DARK-01 reframe creates scope ambiguity.**
DECISIONS_PRE_PLAN.md reframes DARK-01 from "shadow store" to "needs DEBT-XXXX
cross- reference." The original SQ8a analysis and GAP-17 are the same underlying
item (both address known-debt-baseline.json). In this document they are treated
as one item (GAP-17 = the intake gap; DARK-01 = the data visibility dimension of
the same thing). If the /deep-plan team creates work items for both, they may
appear as duplicate scope. The correct framing: GAP-17 is the CLI fix
(sync-baseline-debt.js); DARK-01 is the web indicator (Baseline Coverage %). One
script serves both.

---

## Gaps in This Research

1. **Override-log.jsonl volume and age distribution unknown.** The count and age
   of entries in `.claude/override-log.jsonl` was not inspected in this wave.
   The web aging panel design assumes data exists; actual staleness distribution
   unknown.

2. **hook-warnings-log.jsonl recurrence pattern unknown.** GAP-18 web panel
   design assumes recurring warnings exist. The actual recurrence frequency (how
   many distinct warning types recur 3+ sessions) has not been analyzed.

3. **deferred-items.jsonl current count unknown.** The file exists and is
   monitored by `/alerts` when count > 20, but the actual count at time of
   research was not confirmed in this wave.

4. **metrics.json does not currently have source-freshness fields.** The web
   recommendations in this document require additions to `generate-metrics.js`.
   Those additions were not validated against the existing metrics.json schema —
   they are design recommendations, not confirmed schema additions.

5. **FALSE_POSITIVES.jsonl count discrepancy.** SQ4a ground truth shows 74
   classified FPs in MASTER_DEBT (status: FALSE_POSITIVE). The SQ8a analysis
   says only 6 entries in `docs/technical-debt/FALSE_POSITIVES.jsonl`. These are
   two different stores — the MASTER_DEBT status field and the standalone FP
   file. The 52% FP rate estimate applies to the verification queue (NEW status
   items), not to the classified FP pool.

---

## Serendipity

**metrics.json is the right integration hub for web data quality signals.** The
`generate- metrics.js` script already runs at session-end and produces a static
file served by the web. Every dark debt store and data quality indicator in this
document can be surfaced on the web by adding summary fields to this one script.
No new build pipeline, no new static files, no new endpoints. A single
`generate-metrics.js` expansion unlocks 6+ web panels.

**The web panel for GAP-18 (hook warnings) is the best "quick win" in this
entire document.** The `hook-warnings-log.jsonl` already exists, already has
persistent structured data, and requires only a `metrics.json` summary addition
to expose on the web. A table showing "top 5 recurring hook warnings (untracked
in TDMS)" is high-value, low-effort, and immediately actionable. It also creates
organic pressure to close GAP-18 at the CLI level.

**The S0 KPI card should carry an asterisk.** SQ4a confirms 26 S0 items in
MASTER_DEBT (severity distribution) but `metrics.json` reports 11 S0 alerts (the
`/alerts` checker figure). These numbers count different things (total S0 items
vs S0 items that trigger the alert threshold). The web dashboard showing two
different "S0" numbers without explanation will confuse users. The design should
clarify: "S0 items: 26 | S0 alerts triggered: 11" with a tooltip explaining the
difference.

**The `/dev/debt` tab is the first place the user will see the 13% resolution
rate as a persistent visual.** Currently, this number only appears in
session-end summaries and `/alerts`. The web makes it always-visible. This
changes the psychological context of every subsequent decision about debt intake
vs. debt resolution. The web dashboard may do more to motivate resolution-rate
improvement than any CLI feature — simply by making the F-grade health score a
persistent background fact.

---

## Sources

| #   | Path                                                                   | Type             | Trust | Notes                                                       |
| --- | ---------------------------------------------------------------------- | ---------------- | ----- | ----------------------------------------------------------- |
| 1   | `.research/debt-runner-expansion/findings-v1/SQ8a-intake-gaps.md`      | Prior research   | HIGH  | Full gap matrix with effort and priority assessments        |
| 2   | `.research/debt-runner-expansion/findings-v1/SQ8b-defer-path-audit.md` | Prior research   | HIGH  | 18 defer-path locations, classification, and gap analysis   |
| 3   | `.research/debt-runner-expansion/DECISIONS_PRE_PLAN.md`                | Decision record  | HIGH  | Challenge-adjusted findings; architectural decisions D6-D10 |
| 4   | `.research/debt-runner-expansion/findings/SQ2-web-integration.md`      | Current research | HIGH  | /dev/debt tab architecture; output: export constraint       |
| 5   | `.research/debt-runner-expansion/findings/SQ4a-web-browsing.md`        | Current research | HIGH  | MASTER_DEBT field distribution; actual item counts          |
| 6   | `.research/debt-runner-expansion/findings/SQ4b-web-power.md`           | Current research | HIGH  | metrics.json schema; Sonner/Recharts availability           |
| 7   | `.research/debt-runner-expansion/findings/SQ5-cli-web-handoff.md`      | Current research | HIGH  | Clipboard handoff; no API routes in production              |
| 8   | `.research/debt-runner-expansion/findings/SQ6-read-write-split.md`     | Current research | HIGH  | CLI-only vs. BOTH vs. web-only capability assignment        |

---

## Confidence Assessment

- HIGH claims: 24
- MEDIUM claims: 8
- LOW claims: 2
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All gap carry-forward claims are HIGH confidence (sourced directly from prior
research files read in this session). Web dashboard impact assessments are HIGH
where they derive from confirmed metrics.json schema and MASTER_DEBT field
analysis (SQ4a/SQ4b). MEDIUM confidence on volume estimates for dark debt stores
where current counts were not confirmed in this wave.
