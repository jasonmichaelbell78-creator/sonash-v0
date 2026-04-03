# Dispute Resolutions — Dev Dashboard Research

**Agent:** Dispute Resolution Agent **Date:** 2026-03-29 **Source document:**
`.research/dev-dashboard/RESEARCH_OUTPUT.md` **Verification sources:**
V1-codebase-verification.md, V2-data-format-verification.md,
V3-dependency-verification.md, CONTRARIAN-1.md, OTB-1.md **User constraint
applied:** "No broken widgets or partial tab inventories in shipped product. Fix
data gaps BEFORE building the tab. Build order = data readiness order."

---

## Summary Tally

| Category                | Count                                         |
| ----------------------- | --------------------------------------------- |
| Total disputes assessed | 11                                            |
| Accepted corrections    | 10                                            |
| Rejected corrections    | 1                                             |
| Report lines changed    | ~45                                           |
| Architecture changes    | 1 (user constraint → build order resequenced) |

---

## File Path Corrections

### V1-R1 — metrics.json and metrics-log.jsonl Paths

**ID:** V1-R1 **Source:** V1-codebase-verification.md §21, §22;
V2-data-format-verification.md §1, §2 **Original claim:** Multiple sections of
the report reference `metrics.json` without a path anchor; some references imply
a root or `data/ecosystem-v2/` location. **Correction:** Both files are
exclusively under `docs/technical-debt/`:

- `docs/technical-debt/metrics.json`
- `docs/technical-debt/logs/metrics-log.jsonl` Neither file exists at any other
  path. Build scripts that reference these without a full path will silently
  fail. **Resolution:** ACCEPT **Impact:** Minor text fix — Section 4 Tab 2 data
  source headers now include explicit paths; Section 3.3 output file budget
  table now includes source path in parentheses. No architecture change.

---

### V1-R2 — lifecycle-scores.jsonl Path

**ID:** V1-R2 **Source:** V1-codebase-verification.md §31;
V2-data-format-verification.md §9 **Original claim:** lifecycle-scores.jsonl not
consistently path-anchored; could be inferred as `data/ecosystem-v2/` alongside
other ecosystem-v2 files. **Correction:** File is at
`.claude/state/lifecycle-scores.jsonl`, NOT `data/ecosystem-v2/`. V1 and V2
agree on this. **Resolution:** ACCEPT **Impact:** Minor text fix — Tab 1 data
sources section and Tab 6 data sources section now include explicit path
annotations.

---

## Record Count Corrections

### V1-C1 — hook-runs.jsonl Record Count

**ID:** V1-C1 **Source:** V1-codebase-verification.md §4;
V2-data-format-verification.md §6 **Original claim:** "hook-runs.jsonl has 120
records" (C007 and Section 4 Tab 4, multiple references) **Correction:**
Verified count is 122. The 2-record growth is consistent with active development
during the research session. Both V1 and V2 independently confirm 122.
**Resolution:** ACCEPT — update Section 4 Tab 4 reference count from 120 to 122.
The Tier 1 sources table in Section 16 ("120 at W3; 114 at W1") should be
updated to "122 at V1/V2; 114 at W1". **Impact:** Minor text fix. No behavior
change.

---

### V1-C2 — by_source Distinct Label Count

**ID:** V1-C2 **Source:** V1-codebase-verification.md §24 **Original claim:**
C086 states "19 distinct source labels in by_source breakdown" **Correction:**
Actual count is 20. The missing label is `sonarcloud-paste` (a one-off ingestion
event). V1 provides the full 20-item enumeration. **Resolution:** ACCEPT —
update Section 4 Tab 2 metrics.json schema description from "19 sources" to "20
sources". Note: build scripts should enumerate `by_source` keys dynamically, not
hard-code the count. **Impact:** Minor text fix — one number in the Tab 2 data
schema block.

---

## Field Name Correction

### V2-D4 — review-metrics.jsonl Field Name "rounds" vs "review_rounds"

**ID:** V2-D4 **Source:** V2-data-format-verification.md §4 (Discrepancy D4)
**Original claim:** Section 4 Tab 3 refers to the field as "rounds" in a display
context. **Correction:** The actual field name is `review_rounds`, not `rounds`.
This matters for any export script query referencing this field by name.
**Resolution:** ACCEPT — update the one instance in Section 4 Tab 3 where
"rounds" is used as a field reference to `review_rounds`. The report's stats
table already uses "review_rounds" correctly in the schema line; the fix targets
the prose description only. **Impact:** Minor text fix — affects export script
correctness if the prose was used as a field name reference.

---

## Partial Claims

### V2-D1 — reviews.jsonl "Three Schema Versions"

**ID:** V2-D1 **Source:** V2-data-format-verification.md §3 (Discrepancy D1)
**Original claim:** "three coexisting schemas (v1 with title/patterns/learnings,
v2 without, and legacy integer-ID stubs)" — implies three distinct
`schema_version` integers. **Correction:** There are two explicit numeric
`schema_version` values (1 and 2), plus records with NO `schema_version` field
at all (pre-versioning legacy). The count of "three variants" is technically
correct but the description implies three versioned integers, which is
misleading. Dashboard code must handle the case where `schema_version` is
absent. **Resolution:** ACCEPT PARTIAL — update the description to "two explicit
schema versions (1 and 2) plus unversioned legacy records" to prevent
misimplementation. The functional guidance (three code paths in export script)
is unchanged. **Impact:** Minor text fix — improves implementation accuracy.

---

### V2-D2 — retros.jsonl action_items as "Standard" Field

**ID:** V2-D2 **Source:** V2-data-format-verification.md §5 (Discrepancy D2)
**Original claim:** Section 4 Tab 3 retros.jsonl description implies
`action_items` is a standard schema field. **Correction:** `action_items` is
present on only 3 of 57 records (~5%). It is an optional/newer field. Dashboard
code that assumes its presence will fail for 54 of 57 records without
null-guarding. **Resolution:** ACCEPT — add a null-guard note to the Tab 3
retros.jsonl data source description: "action_items is optional — present on ~3
of 57 records; null-guard required." **Impact:** Minor text fix — prevents a
null-reference bug in Tab 3 implementation.

---

### V1-P1 — hook-runs.jsonl Pre-Push Check Count

**ID:** V1-P1 **Source:** V1-codebase-verification.md §4 **Original claim:**
C007 states "pre-push (12 checks)" **Correction:** 13 distinct check IDs appear
across pre-push records. The discrepancy is explained by the `tsc` →
`type-check` rename: older records have `tsc`, current records have
`type-check`. They represent the same logical check but appear as two distinct
ID tokens in the data. **Resolution:** ACCEPT PARTIAL — update Section 4 Tab 4
to note "13 distinct pre-push check IDs (12 logical checks; `tsc` is a legacy
alias for the current `type-check`)" to give accurate implementation guidance.
**Impact:** Minor text fix — prevents an off-by-one confusion in the compliance
heatmap widget.

---

## Contrarian Challenge Resolutions

### CONT-W1 — 6-Tab Structure: Cadence Analysis Absent

**ID:** CONT-W1 **Source:** CONTRARIAN-1.md Challenge 1 **Challenged claim:**
The 6-tab structure is optimal for a solo developer. **Challenge finding:** The
structure was validated against data coverage, not usage frequency. Tabs 5 and 6
have sub-weekly cadences (monthly, per-sprint kickoff) and risk being built,
used twice, and forgotten. **Evidence quality:** The contrarian correctly notes
the absence of cadence data. The tab structure is a locked user decision from
Session #245. The challenge cannot overturn the structure; it surfaces a valid
implementation risk. **Resolution:** ACCEPT scope-limited — the 6-tab structure
stands (user decision). Add to Section 15 Open Questions: "Minimum-viable
implementations for Tabs 5 and 6 should be defined in /deep-plan, given their
sub-weekly use cadences. Full feature parity with daily-use tabs is not
warranted at current data volumes." **Impact:** Planning change — adds one open
question to Section 15.

---

### CONT-W2 — Static JSON Budget: S1 Initial Load Is Speculative Prefetch

**ID:** CONT-W2 **Source:** CONTRARIAN-1.md Challenge 3 **Challenged claim:**
464 KB `debt-items-s0s1.json` initial load is acceptable. **Challenge finding:**
Loading all 1,259 S1 items on tab mount is speculative prefetch. S0 items (11)
are critical and small (~5 KB); S1 items (1,259) are a browsing surface. The
plan should define an explicit lazy-load trigger for S1. **Evidence quality:**
The challenge is technically correct. TanStack Virtual prevents DOM bloat but
does not reduce network transfer. 464 KB still crosses the wire before the table
renders on first Tab 2 open. **Resolution:** ACCEPT — add to Section 15 Open
Questions: "Define the S1 lazy-load trigger in /deep-plan: does S1 browser load
on Tab 2 mount, on first scroll past the S0 section, or on explicit 'Load all
S1' user action? The current plan loads it on mount (speculative prefetch of 464
KB)." **Impact:** Planning change — one new open question in Section 15. No
architecture change yet.

---

### CONT-W3 — Pre-Work Gate: Conflates Shared and Tab-Specific Work

**ID:** CONT-W3 **Source:** CONTRARIAN-1.md Challenge 6 **Challenged claim:**
The pre-work gate must complete before any tab work starts. **Challenge
finding:** The gate mixes genuinely shared pre-work (DevTabProvider, DevTabId
type, recharts, badge/tooltip shadcn) with Tab 2-specific work (TanStack,
MiniSearch, BUG-01). Tab 1 has clean data and could start before
TanStack/MiniSearch are installed. **Evidence quality:** Correct. However, this
is superseded by the user constraint (see OTB-UC below): "fix data gaps BEFORE
building the tab." Under the user constraint, this challenge becomes moot — the
gate is redefined by data readiness, not by shared-vs-tab-specific work
decomposition. **Resolution:** REJECT as a standalone change. The user
constraint provides a cleaner resolution: build order follows data readiness.
The gate structure itself is not the problem; the build ORDER after the gate is
what changes. See OTB-UC below. **Impact:** None directly. Superseded by OTB-UC.

---

### CONT-W4 — Tab 4 Process Compliance: BLOCKS in the Working Section

**ID:** CONT-W4 **Source:** CONTRARIAN-1.md Challenge 7 **Challenged claim:**
Process compliance widgets should be built as part of Tab 4. **Challenge
finding:** G29, G30, G33 are all BLOCKS in the Process Compliance sub-section of
Tab 4 (not in the session log sub-section). Building Tab 4 in Phase 2 means
shipping a tab where 3 widgets are visibly broken from day one. The session log
portion is clean; the compliance portion is blocked. **Evidence quality:**
Accurate. However, the user constraint now requires: no broken widgets in
shipped product. Under the user constraint, the resolution is not to delay Tab 4
but to ship Tab 4 WITHOUT the Process Compliance sub-section initially — that
section is gated on data readiness (G29, G30, G33 resolved). **Resolution:**
ACCEPT — add note to Section 13 Phase 2 Tab 4 entry: "Ship Tab 4 pipeline
session-log widgets first (hook compliance heatmap, override log, agent
invocations, commit timeline). Process Compliance sub-section (velocity, commit
branch breakdown, retro follow-through) is deferred to a separate increment once
G29/G30/G33 data is resolved. Do not ship with 'Data Unavailable' placeholders."
**Impact:** Planning change — Tab 4 scope splits into clean and blocked
sub-sections.

---

## OTB Recommendation Resolution

### OTB-UC — User Constraint: No Broken Widgets, Build Order = Data Readiness

**ID:** OTB-UC **Source:** User constraint stated in dispatch prompt;
CONTRARIAN-1.md Challenges 7, 8; OTB-1.md Idea 7 (Anti-Patterns) **Constraint:**
"I don't want to ship with broken widgets or partial tab inventories. We need to
plan for full functionality built around complete content. Fix data gaps BEFORE
building the tab, not after. Tabs 5 and 6 get full treatment. Build order = data
readiness order." **What changes:**

1. **Section 12 (Pre-Work Gate):** Step 3 "Acknowledge Data Gaps (No Fixes
   Needed)" is removed. It is replaced with a harder requirement: BLOCKS must be
   resolved before their tab is built, not acknowledged as acceptable "Data
   Unavailable" states.
2. **Section 13 (Implementation Phasing):** Build order is resequenced to data
   readiness order. Tabs with clean data ship first. Tabs with BLOCKS ship only
   after their BLOCKS are resolved.
3. **Section 4 individual gap tables:** Gap rows that previously said "Show Data
   Unavailable" are updated to say "Resolve before building tab."

**Revised build order (data readiness):**

- Phase 1 (Foundation): unchanged — packages, BUG-01, DevTabProvider, DevTabId,
  build script skeleton
- Phase 2: Tabs with no BLOCKS and clean primary data
  - **Tab 4 (Pipeline) — session log widgets only** (hook-runs, override-log,
    agent-invocations, commit timeline — all clean). Process Compliance
    sub-section held until G29/G30/G33 resolved.
  - **Tab 2 (Debt Pipeline)** — all widgets clean after BUG-01 fix. Data is
    ready.
  - **Tab 1 (Health & Alerts)** — data is clean. Warning unification adds
    complexity but no BLOCKS.
  - **Tab 3 (Code Review Quality)** — no BLOCKS. Schema evolution handled in
    export script.
- Phase 3: Tab 5 (Governance) — requires running health-ecosystem-audit to close
  G37 BEFORE building. Ship after audit is run and history file exists.
- Phase 4: Tab 6 (Planning) — no BLOCKS; data is sparse but complete. Tab 4
  Process Compliance sub-section ships here once G29/G30/G33 are resolved.

**Resolution:** ACCEPT — sections 12 and 13 updated per above. Tab 5 and Tab 6
receive full treatment (user decision) but are sequenced correctly. **Impact:**
Architecture change (the only one) — phasing order rewritten. Section 12 Step 3
rewritten. Section 13 rewritten with data-readiness rationale.

---

### OTB-D1 — Diff Mode: Design Comparison Props in Phase 1

**ID:** OTB-D1 **Source:** OTB-1.md Idea 6 **Recommendation:** Tab components
should accept an optional `baseline?: TabData` prop from day one. This is a
Phase 1 design decision. Retrofitting it in Phase 3 is 3-4x more expensive.
**Assessment:** This is a valid architectural insight, not a claim correction.
The cost of building it in is near-zero; the cost of retrofitting is high.
**Resolution:** ACCEPT as an Open Question addition — add to Section 15: "Should
all tab data hooks accept a `baseline?: TabData` prop for future Diff Mode? If
yes, design the interface in Phase 1 at near-zero cost. If deferred, retrofit in
Phase 3 at significantly higher cost (requires modifying every tab component)."
**Impact:** Planning change — adds one actionable open question to Section 15.

---

## Rejected Corrections

### V1-P2 — CONT-W3 Rejected (see above)

CONT-W3 (pre-work gate decomposition) is rejected as a standalone correction
because the user constraint provides a higher-order resolution that makes the
gate decomposition moot. The real question is "what is data-ready?" not "what is
shared vs tab-specific?"

---

## Applied Changes Reference

| Section                                | Change Type                                                                                                                                      | ID                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Section 3.3 output budget table        | Add source paths for metrics.json and metrics-log.jsonl                                                                                          | V1-R1                             |
| Section 4 Tab 1 lifecycle-scores entry | Add explicit path `.claude/state/lifecycle-scores.jsonl`                                                                                         | V1-R2                             |
| Section 4 Tab 2 metrics.json schema    | Change "19 sources" to "20 sources"                                                                                                              | V1-C2                             |
| Section 4 Tab 2 data sources header    | Add explicit path `docs/technical-debt/metrics.json`                                                                                             | V1-R1                             |
| Section 4 Tab 2 metrics-log header     | Add explicit path `docs/technical-debt/logs/metrics-log.jsonl`                                                                                   | V1-R1                             |
| Section 4 Tab 3 review-metrics field   | Change "rounds" field reference to `review_rounds`                                                                                               | V2-D4                             |
| Section 4 Tab 3 reviews.jsonl schema   | Clarify "two explicit versions + unversioned legacy"                                                                                             | V2-D1                             |
| Section 4 Tab 3 retros.jsonl note      | Add "action_items optional — ~3/57 records; null-guard required"                                                                                 | V2-D2                             |
| Section 4 Tab 4 hook-runs count        | Change "120 records" to "122 records"                                                                                                            | V1-C1                             |
| Section 4 Tab 4 hook-runs pre-push IDs | Change "12 checks" to "13 distinct IDs (12 logical; tsc is legacy alias for type-check)"                                                         | V1-P1                             |
| Section 12 Step 3                      | Rewrite from "acknowledge gaps" to "resolve BLOCKS before building tab"                                                                          | OTB-UC                            |
| Section 13 all phases                  | Resequence build order to data-readiness order                                                                                                   | OTB-UC                            |
| Section 4 Tab 4 gap table G29/G30/G33  | Change resolution from "Show Data Unavailable" to "Resolve before building Tab 4 Process Compliance sub-section"                                 | OTB-UC, CONT-W4                   |
| Section 15 Open Questions              | Add Q11 (S1 lazy-load trigger), Q12 (diff mode comparison props), Q13 (minimum-viable Tabs 5/6), Q14 (Tab 4 process compliance sub-section gate) | CONT-W1, CONT-W2, OTB-D1, CONT-W4 |
| Sources (Tier 1)                       | Update hook-runs count from "120 at W3" to "122 at V1/V2"                                                                                        | V1-C1                             |
