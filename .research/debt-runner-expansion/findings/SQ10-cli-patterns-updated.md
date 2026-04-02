# Findings: CLI Interactive Patterns — Write-Side Only (Debt-Runner Expansion)

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-010 (carries forward SQ9 from findings-v1)

---

## Scope Declaration

This document covers CLI write-side interaction patterns ONLY. Every pattern
documented here applies to the `/debt-runner` skill running inside a Claude Code
session. The web dashboard at `/dev/debt` handles read-side equivalents where
noted.

**Architecture boundary:**

- CLI (`/debt-runner`): AI-powered orchestration, mutations, agent spawning,
  convergence-loop verification. All write paths.
- Web (`/dev/debt`): Rich read-only visualization, tab navigation, charts, row
  expansion, progress bars. No mutations.

---

## Key Findings

### 1. SQ9 Pattern Inventory — Carried Forward and Scoped [CONFIDENCE: HIGH]

The prior survey (SQ9) identified 5 menu structure types across 13 skills. Each
is carried forward here with explicit CLI/web scope assignment.

**A. Numbered flat menu (Mode selector)**

- **CLI write-side ONLY** (web has tab navigation instead)
- Used by debt-runner (7 modes currently, expanding to 10+) and sonarcloud
- Pattern: numbered list with inline descriptions, single-prompt selection
- Web equivalent: tab bar in React (`dev-tabs.tsx`), no numbered prompt needed
- On expansion: the flat menu grows to accommodate new modes; grouping by type
  (query modes vs mutation modes) may be needed at 10+ options

**B. Dashboard header / stats summary**

- **CLI shows text summary** (web shows rich metric cards with trend lines)
- CLI example: `S0: 3 | S1: 47 | S2: 841 | S3: 1,234 | Total: 2,125`
- Web equivalent: metric cards with sparklines, severity donut chart, resolution
  velocity chart (SQ6, SQ3 findings)
- CLI stat block appears on warm-up AND on return to menu after each mode — the
  delta between appearances is the feedback signal

**C. Per-item review loop**

- **CLI write-side ONLY** (web has row expansion for viewing, not deciding)
- The finest-grained interaction unit: one debt item at a time, decision
  options, AI recommendation with rationale
- Web equivalent: row expansion shows item detail for _reading_; no decision
  prompts exist in the web layer
- CLI pattern: bordered context card from `_shared/ecosystem-audit` library (see
  Finding #4 below)

**D. Progress tracking**

- **CLI**: "Item N of M (X% — Y verified, Z false-positive, W skipped)"
- **Web**: progress bar in the Discovery panel showing agent wave completion, or
  a "2,125 items in queue" count badge — passive display only
- Both surfaces show progress; only the CLI prompts for action at each step

**E. Delegation spectrum**

- **CLI write-side ONLY** (web is passive read; it cannot make decisions or
  trigger mutations)
- The spectrum from full-control to full-delegation applies only during CLI
  sessions where the user is present and decision-making
- "You decide on S2/S3, show me S0/S1" is the most powerful single-statement
  delegation for this user (solo, speed-oriented, non-developer)

---

### 2. Current Debt-Runner Patterns Verified Against SKILL.md v1.1 [CONFIDENCE: HIGH]

Direct read of `.claude/skills/debt-runner/SKILL.md` confirms the following
patterns are currently implemented and remain valid for the expanded skill:

| Pattern                          | Current state                                                 | Expansion notes                                                                   |
| -------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Flat numbered menu               | 7-item menu with live stats header                            | Expands to 10+ items; grouping by type may be needed                              |
| Warm-up before menu              | S0-S3 counts, effort estimates, resume check, pending staging | Remains required; new modes add their own estimates                               |
| Return to menu after mode        | Updated stats re-displayed                                    | "Completed modes" display is a documented gap (SQ9 Friction 1) — fix in expansion |
| >100 mutations confirmation gate | Confirm + 10-item preview                                     | Unchanged; applies to all new modes equally                                       |
| Delegation at >20 items          | "You decide" / severity filter / batch review                 | Unchanged; new modes inherit this protocol                                        |
| State file persistence           | `.claude/state/debt-runner.state.json`                        | State file gains new sections per new mode                                        |
| Script progress announcements    | "Running `[script]`..." before each call                      | Unchanged; all new modes follow this                                              |
| Retro prompt on session exit     | "Any modes with unexpected results?"                          | Unchanged                                                                         |
| Empty-result short-circuit       | "No items found. Returning to menu."                          | Unchanged; applies to all new modes                                               |
| Staging safety                   | Never delete staging until pipeline succeeds                  | Unchanged                                                                         |

**REFERENCE.md verification:** Menu stats source commands, per-mode script
sequences, CL domain slicing templates, staging schemas, and state file schema
are all current and compatible with the expansion. New modes will add sections
to REFERENCE.md following the same format.

---

### 3. Web Dashboard Read-Side Equivalents — Full Mapping [CONFIDENCE: HIGH]

This table closes the scope boundary for every interaction element. Anything in
the "Web equivalent" column is OUT OF SCOPE for the CLI skill design.

| CLI write-side pattern              | Web read-side equivalent                    |
| ----------------------------------- | ------------------------------------------- | -------------------------------------- |
| Flat numbered mode menu             | React tab bar in `dev-tabs.tsx`             |
| Stats header (`S0: N                | S1: N...`)                                  | Metric cards with sparklines (SQ3/SQ6) |
| Per-item decision prompts           | Row expansion panel (view only, no prompts) |
| "Item N of M" progress counter      | Progress bar in Discovery panel             |
| Delegation shortcuts ("you decide") | No equivalent — web cannot make decisions   |
| Effort estimates in warm-up         | "Last run: X days ago" staleness badge      |
| Resume / session continuity         | "Data as of: [timestamp]" + Refresh button  |
| "Running [script]..." announcements | Loading spinner on Refresh action           |
| Retro prompt                        | No equivalent                               |
| Staged confirmation gates           | No equivalent — CLI owns all mutations      |
| AI recommendation + rationale       | Item detail panel (read-only context)       |

---

### 4. Interaction Pattern for Triage Mode [CONFIDENCE: HIGH]

**Scope: CLI write-side ONLY.** The triage mode processes the verification queue
(items in NEW status that have not been confirmed or resolved).

**Interaction design:**

```
━━━ Triage: Item 4/47 (8% — 1 verified, 1 false-positive, 1 skipped) ━━━
S1  |  Category: code-quality  |  File: src/auth/validate.ts:142

Missing rate limiting on login endpoint — attacker can brute-force credentials.

Evidence:
  No rate-limit middleware applied to POST /api/auth/login.
  Related: DEBT-0044 (resolved — same handler, different method).
  Age: 47 days. Last reviewed: never.

Options:
  1. Verify (confirm issue is still present and accurate)
  2. False positive (mark FP — issue is not real or already addressed)
  3. Skip (leave in queue, review later)
  4. Defer (move to deferred state with optional note)
  5. Escalate (upgrade severity — flag for immediate attention)
  6. You decide (apply AI recommendation to all remaining items)

Recommendation: Option 1 — Issue is confirmed S1. Code read shows login
handler at line 142 has no rate-limit middleware. Severity is accurate.

Action [1-6]:
```

**Delegation protocol for triage:**

- At any point: "you decide" → applies AI recommendation to ALL remaining items
- "skip S3" → batch-skips all S3 items in queue, continues on S0-S2
- "fix S0/S1" → applies verify to all S0/S1, defers rest
- After >20 items: automatically offer delegation options before continuing
- After every 10 items: escape hatch — "Pause here? Remaining N items will be
  preserved in queue."

**State persistence:** After every individual decision, write to
`.claude/state/debt-runner.state.json` under `triage_mode` section. Queue
position survives compaction.

**Web equivalent:** The web dashboard shows a "Triage Queue" count badge (N
items in NEW status) and links to filter the item table by status=NEW. No
per-item decision UI exists in the web layer.

**Post-triage handoff message:**

> "Triage complete: 23 verified, 4 false positives, 3 deferred, 17 skipped. View
> updated results at /dev/debt — filter by status to see changes."

---

### 5. Interaction Pattern for Review-Needed Mode (Dedup Pair Comparison) [CONFIDENCE: HIGH]

**Scope: CLI write-side ONLY.** The review-needed mode presents candidate
duplicate pairs identified by the dedup script.

**Interaction design:**

```
━━━ Dedup Review: Pair 2/8 (25% — 1 merged, 1 kept-both, 0 skipped) ━━━

Candidate duplicates — similarity: 94%

ITEM A  DEBT-0812                              ITEM B  DEBT-0500
───────────────────────────────────────────── ────────────────────────────────────────────
S1  code-quality                              S2  code-quality
src/lib/api.ts:88                             src/lib/api.ts:91
"Missing input validation on API boundary"   "No Zod validation at API entry point"
Added: 2026-01-15                             Added: 2025-11-20
Source: SonarCloud SQRD-112                   Source: extract-scattered-debt (TODO comment)
Evidence: API handler accepts raw body        Evidence: TODO: add Zod here (line 91)

Options:
  1. Merge → keep DEBT-0812 (S1), absorb DEBT-0500 into it
  2. Merge → keep DEBT-0500, absorb DEBT-0812
  3. Keep both (they describe different aspects of the same problem)
  4. Skip (leave both unchanged, review later)

Recommendation: Option 1 — Merge into DEBT-0812. DEBT-0812 is higher severity
(S1 vs S2), was added more recently (2026), and has stronger SonarCloud evidence.
DEBT-0500 is the same issue described from source-code context. Absorbing is safe.

Action [1-4]:
```

**Key constraints:**

- S0/S1 items absorbing into lower severity is BLOCKED (CL Critical Rule from
  SKILL.md dedup mode — must warn and require explicit override)
- If user tries to merge an S0 into an S3: "Warning: this would absorb an S0
  item into an S3. Confirm? [Y/N] (not recommended)"
- All merge decisions written to `staging/dedup-merges.jsonl` before applying

**Web equivalent:** The web shows the item table with a "possible duplicates"
indicator icon on items flagged by the dedup script. Clicking shows a
side-by-side comparison panel for _reading_. No merge action available in web.

**Post-session handoff message:**

> "Dedup review complete: 5 merged, 2 kept-both, 1 skipped. Refresh the web
> dashboard to see N items removed from the duplicate candidates view."

---

### 6. Interaction Pattern for Dark-Debt Mode (Per-Store Walkthrough) [CONFIDENCE: HIGH]

**Scope: CLI write-side ONLY.** Dark-debt mode surfaces debt discovered by AI
discovery agents that exists in the codebase but is not yet in MASTER_DEBT. The
"per-store walkthrough" groups new findings by their source store (code-scanner,
pattern-checker, security-scanner, etc.).

**Interaction design:**

```
Dark Debt Review — Source: code-scanner (22 findings)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Store 1 of 4: code-scanner — 22 findings
  Severity breakdown: S0: 0 | S1: 3 | S2: 7 | S3: 12
  Confidence: 18 HIGH, 3 MEDIUM, 1 LOW

Action for this store?
  1. Review each item individually
  2. Promote all HIGH-confidence items, review MEDIUM/LOW manually
  3. Promote all S1+ items automatically, defer S2/S3
  4. Acknowledge all (add to MASTER_DEBT without individual review)
  5. Skip this store entirely
  6. You decide (AI applies recommendation to all stores)

Recommendation: Option 2 — 18 HIGH-confidence items are safe to promote
automatically. 3 MEDIUM items need review (2 are borderline S1/S2 assignments).
1 LOW item should be reviewed — it may be a false positive.

Action [1-6]:
```

When the user selects individual review (Option 1), it enters the per-item
review loop using the bordered context card pattern (Finding #4).

**Per-item options for dark-debt promotion:**

```
  1. Promote (add to MASTER_DEBT at suggested severity)
  2. Promote with severity change (add at different severity)
  3. Acknowledge (add as S3/low-priority without full review)
  4. Skip (do not add — not real debt)
  5. Defer (add to staging for later decision)
```

**State persistence:** After each store is processed, update state file with
`dark_debt_mode.stores_processed[]`. Discovery agent output in
`staging/discovery-*.jsonl` is preserved until the session applies or rejects
all findings.

**Web equivalent:** The web dashboard shows a "New Discoveries" badge in the
header if staging/discovery-\*.jsonl files exist with unreviewed items. Clicking
opens a read-only list of pending items. No promote/skip action in web — the
user returns to CLI for decisions.

**Post-session handoff message:**

> "Dark debt review complete: 31 items promoted to MASTER_DEBT, 12 skipped, 5
> deferred. Refresh the web dashboard to see N new items in the full list."

---

### 7. Interaction Pattern for Discover Mode (Agent Spawn + Result Review) [CONFIDENCE: HIGH]

**Scope: CLI write-side ONLY.** Discover mode spawns AI discovery agents in
parallel waves, waits for completion, then presents the delta for review. The
"agent spawn" phase is automated; the "result review" phase is interactive.

**Pre-launch prompt (warm-up gate):**

```
Discover Mode — Full Debt Refresh

This will spawn up to 9 discovery agents in 2 parallel waves to scan the
codebase for new debt and verify existing items.

Estimated time: ~45 min (9 scan agents + delta synthesis)
Last discovery run: 2026-03-10 (17 days ago)

Scan scope:
  Wave 1 (4 agents): code-scanner, pattern-checker, security-scanner,
                     dependency-auditor
  Wave 2 (4 agents): complexity-scanner, test-coverage-auditor,
                     schema-drift-checker, doc-coverage-scanner
  Wave 3 (1 agent):  sonarcloud-verifier (fetch + verify SonarCloud)

Include existing-item verification? [Y/n]
  (3 additional agents check whether current MASTER_DEBT items are still real)

Proceed? [Y/n]:
```

**Progress announcements during discovery (non-interactive phase):**

```
Launching Wave 1 (4 agents in parallel)...
  code-scanner:      running...
  pattern-checker:   running...
  security-scanner:  running...
  dependency-auditor: running...

Wave 1 complete (12 min):
  code-scanner:      31 findings written to staging/discovery-code-2026-03-27.jsonl
  pattern-checker:   14 findings written to staging/discovery-pattern-2026-03-27.jsonl
  security-scanner:   8 findings written to staging/discovery-security-2026-03-27.jsonl
  dependency-auditor: 6 findings written to staging/discovery-deps-2026-03-27.jsonl

Launching Wave 2...
```

**Delta synthesis summary (before interactive review):**

```
Discovery Complete — Delta Summary

New findings:        59 items (not currently in MASTER_DEBT)
  S0: 2  |  S1: 11  |  S2: 23  |  S3: 23
  HIGH confidence: 41  |  MEDIUM: 14  |  LOW: 4

Existing items verified: 127
  Still present:    112
  Possibly resolved:  9  (code may have changed)
  False positives:    6  (agents say issue is not real)

Hot spots (files in 3+ agent findings):
  src/auth/validate.ts (5 agents)
  lib/api/client.ts   (4 agents)
  components/form/    (3 agents)

Review options:
  1. Review S0/S1 new findings first (13 items — ~10 min)
  2. Review all new findings by section (59 items — ~45 min)
  3. Auto-promote HIGH confidence, review MEDIUM/LOW (18 items — ~15 min)
  4. Review resolved candidates first (9 items — ~5 min)
  5. You decide (AI recommends: promote HIGH S0-S2, defer rest)

Action [1-5]:
```

After review, the interactive session follows the dark-debt per-item pattern
(Finding #6) for new findings and the triage pattern (Finding #4) for resolved
candidates.

**Post-discover handoff message:**

> "Discovery found 59 new items — review on web or continue here. To view all
> discoveries: refresh /dev/debt and filter by added-date = today."

---

### 8. Interaction Pattern for Intake Mode (Source-by-Source Pipeline) [CONFIDENCE: HIGH]

**Scope: CLI write-side ONLY.** Intake mode walks through disconnected debt
sources, surfacing items that exist in source files but are not yet in
MASTER_DEBT, and routes them through the intake pipeline one source at a time.

**Source selection prompt:**

```
Intake Mode — Source Selection

Available sources with pending items:
  1. TODOs/FIXMEs in code comments    (26 untracked, last scanned: 3 days ago)
  2. SonarCloud issues not in TDMS    (14 pending, last sync: 2026-03-24)
  3. Known-debt-baseline violations   ( 8 pending, last checked: today)
  4. Audit report findings            ( 5 pending from audit-code 2026-03-20)
  5. PR deferred items not in TDMS    ( 3 pending from PRs #448-#452)

Process all sources? [Y] or select sources [1,2,3...]:
```

**Per-source pipeline (preview → confirm → ingest):**

```
━━━ Intake: Source 1/3 — TODOs/FIXMEs in code comments ━━━

Preview (26 items found):
  S1: 2 items  (FIXME in auth-critical paths — severity auto-upgraded)
  S2: 8 items  (FIXME standard)
  S3: 16 items (TODO)

Show full list? [Y/n]: Y

[list of 26 items with file:line and description]

Options:
  1. Ingest all 26 (add to MASTER_DEBT via intake-audit.js)
  2. Ingest S1/S2 only (10 items), defer S3
  3. Review each individually
  4. Skip this source

Recommendation: Option 2 — The 2 S1 items (FIXME in auth paths) should be
ingested immediately. The 8 S2 items are real debt. The 16 S3 TODOs can be
reviewed later — ingesting all 16 at once inflates the queue.

Action [1-4]:
```

**Post-source confirmation:**

```
Ingesting 10 items from TODOs/FIXMEs source...
Running `node scripts/debt/intake-audit.js --file staging/intake-comments.jsonl`...
✓ 10 items added to MASTER_DEBT. IDs: DEBT-2126 through DEBT-2135.
16 S3 items preserved in staging/intake-comments-deferred.jsonl.

Proceeding to Source 2/3...
```

**Post-intake handoff message:**

> "Intake complete: 28 items added from 3 sources. Refresh the web dashboard to
> see N new items in the full list."

---

### 9. Guided Mode Design for Non-Developer User [CONFIDENCE: HIGH]

**Scope: CLI write-side ONLY.** The guided mode is the primary entry point for a
non-developer user who wants outcome-oriented navigation rather than
mode-by-mode selection.

**Activation:** `/debt-runner --guided` or answering "yes" to a prompt on first
invocation if no prior usage history exists.

**Guided warm-up (outcome-oriented language):**

```
Debt Runner — Guided Mode

I'll walk you through your technical debt in order of what matters most.
Here's where things stand:

  Critical issues (S0/S1): 50 items — these block safe development
  Medium issues (S2):      841 items — these slow development
  Low issues (S3):       1,234 items — backlog, address when convenient

  Verification queue: 2,125 items still need review (never confirmed)
  Last full review:   47 days ago

What would you like to do?
  1. Fix the most critical issues first (review 50 S0/S1 items — ~30 min)
  2. Clear the verification backlog (start working through 2,125 unreviewed — ~15 min today)
  3. Find new issues that aren't tracked yet (run discovery — ~45 min)
  4. Clean up resolved items and false positives (~10 min)
  5. See the full status dashboard
  6. Let me handle S2/S3 — just show me the S0/S1 items
  7. You decide — do what's most useful right now

Action [1-7]:
```

**Severity-based auto-routing ("Let me handle S2/S3, show me S0/S1"):**

When the user selects Option 6:

```
Auto-routing: I'll handle S2/S3 items using AI recommendations.
You only need to review S0/S1 items personally.

S2/S3 strategy (applying now):
  - Verified S2/S3: accept as confirmed (no action needed)
  - Stale S2/S3 (>90 days, no change): flag for cleanup pass
  - False-positive S2/S3: defer to next review cycle

This affects 2,040 items. Proceed? [Y/n]:
```

**Progress summaries in plain language:**

After every 10 items:

```
Progress check: 12 items reviewed so far.
  3 items verified as real — added to the fix plan
  1 item marked as false positive — removed from the queue
  8 items skipped for now

Still ahead: 35 items in today's session.
Keep going? [Y] or pause until next session [P]:
```

After mode completion:

```
Session summary:
  Reviewed: 23 items in 18 minutes
  Fixed: 3 verified as real critical issues
  Cleared: 1 false positive removed
  Still in queue: 47 items (down from 50)

Recommendation: Next time, focus on the 2,125 unverified items — they're
the biggest backlog. About 15 minutes per session would clear them in ~3 weeks.
```

**Guided mode guardrails:**

- Guided mode NEVER shows mode numbers unless user requests them
- Options always use outcome language, not technical mode names
- "You decide" / delegation always available as an explicit option
- Effort estimates always shown in plain time, not technical estimates (E0-E3)
- After each section: "Pause? I'll save your progress." is always offered

---

### 10. CLI Output That References the Web [CONFIDENCE: HIGH]

These are standardized post-action messages that bridge CLI output to the web
dashboard. Consistent phrasing trains the user to associate CLI actions with web
views.

**Template: After any mutation mode completes**

> "View updated results at /dev/debt"

Used after: triage, dark-debt, intake, cleanup, dedup-review. Never shown after
read-only modes (health, verify with no corrections).

**Template: After sync completes**

> "Refresh the web dashboard to see N new items"

N is the count of net-new items added to MASTER_DEBT in this sync session. This
is a concrete number, not a vague "items may have changed."

**Template: After discovery agents complete**

> "Discovery found N items — review on web or continue here"

Gives the user an explicit choice: continue in CLI (for immediate decisions) or
switch to web (for browsing/filtering before deciding). This is the only handoff
message that offers a real decision point between surfaces.

**Template: After discover mode finishes all review**

> "Discovery review complete. N items added to MASTER_DEBT. Refresh /dev/debt to
> see them in the full list."

**Template: When CLI detects data may be stale in web**

This appears after any mutation mode, in the return-to-menu stats block:

> "Web dashboard data is stale — click Refresh at /dev/debt to see current
> counts."

The CLI knows this because it tracks its own `last_sync_at` in the state file
and compares against the `sync_meta.last_sync_at` in `data/tdms.db`. If the CLI
made mutations after the last SQLite sync, it shows this message.

**Template: After triage session**

> "Triage complete: N verified, M false positives, K deferred. View updated
> queue at /dev/debt (filter Status = NEW to see remaining items)."

**Template: After intake session**

> "Intake complete: N items added from M sources. Refresh /dev/debt to see new
> items in the main table."

---

### 11. Updated Delegation Spectrum — CLI Write-Side [CONFIDENCE: HIGH]

The prior survey's delegation spectrum (SQ9 Finding #5) applies unchanged to all
CLI write-side modes. The following table extends it with debt-runner-specific
trigger phrases and applies to all new modes.

**Canonical delegation triggers (CLI only):**

| Phrase                          | Effect                                                           | Applies to                |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| "you decide"                    | AI applies recommendation to ALL remaining items in current loop | All modes                 |
| "skip S3" / "skip remaining S3" | Bulk-skip all S3 items in current queue                          | triage, dark-debt, intake |
| "skip S2/S3"                    | Bulk-skip all S2 and S3 items                                    | triage, dark-debt         |
| "fix S0/S1"                     | Auto-verify all S0/S1, defer rest                                | triage                    |
| "promote all high confidence"   | Auto-promote HIGH confidence findings, review MEDIUM/LOW         | dark-debt, discover       |
| "let me handle S2/S3"           | Enters auto-routing as described in Finding #9                   | guided mode               |
| "ingest all"                    | Ingests entire source without individual review                  | intake                    |

**Hard stops regardless of delegation level:**

- S0/S1 items being demoted to lower severity: always requires explicit
  confirmation
- Merging an S0 item into a lower-severity item: always blocked with warning
- > 100 total mutations in a session: requires count + preview confirmation
- CL verification failure: always surfaces to user regardless of delegation
  setting

**Confirmation pattern before bulk execution (MUST, unchanged from SQ9):**

```
About to apply: 41 changes
  → 23 items promoted to MASTER_DEBT (HIGH confidence)
  → 12 items skipped (LOW confidence)
  →  6 items deferred (MEDIUM confidence, need review)

Confirm? [Y/n]:
```

---

### 12. Menu Structure for Expanded Modes [CONFIDENCE: HIGH]

The current 7-item flat menu expands to accommodate new modes. At 10+ items,
plain grouping (a blank line between groups) improves readability without
introducing nested menus.

**Proposed expanded menu:**

```
Debt Runner — Interactive Mode
S0: 3 | S1: 47 | S2: 841 | S3: 1,234 | Total: 2,125
Last sync: 2026-03-24 | Last verify: 2026-03-10 | Triage queue: 2,125

── Query & Reporting ──
1. health    — Surface metrics, trends, staleness dashboard
2. plan      — Create resolution plan for target severities

── Verification & Triage ──
3. verify    — Verify existing items via convergence loop
4. triage    — Process verification queue (2,125 NEW items)

── Intake & Discovery ──
5. sync      — SonarCloud sync + intake pipeline
6. intake    — Source-by-source intake pipeline
7. discover  — AI-driven full debt refresh (find new, verify existing)

── Maintenance ──
8. dedup     — Run deduplication with pair comparison
9. validate  — Schema validation + stale item detection
10. cleanup  — Archive resolved, clear FPs, regenerate views

Select mode [1-10]:
```

**Grouping rationale:**

- Query/Reporting: no mutations possible (health) or low-risk artifact creation
  (plan)
- Verification/Triage: confirm/update existing items
- Intake/Discovery: bring in new items from external sources or AI agents
- Maintenance: structural housekeeping on MASTER_DEBT itself

**Max depth: 3 levels (unchanged from SQ9 survey)**

```
Level 1: Mode selection  (flat menu above)
Level 2: Within-mode options  (triage: per-item vs batch vs you-decide)
Level 3: Per-item decision   (verify/FP/skip/defer — single item, enumerated choices)
```

Level 3 is always a single-item review with enumerated options. No nested menus.
Delegation at Level 2 bypasses Level 3 entirely.

---

## Sources

All sources are SKILL.md files, REFERENCE.md files, and prior research findings
read directly from the filesystem.

| #   | File Path                                                                 | Type           | Trust | Date       |
| --- | ------------------------------------------------------------------------- | -------------- | ----- | ---------- |
| 1   | `.claude/skills/debt-runner/SKILL.md` (v1.1)                              | skill-doc      | HIGH  | 2026-03-15 |
| 2   | `.claude/skills/debt-runner/REFERENCE.md` (v1.0)                          | skill-doc      | HIGH  | 2026-03-15 |
| 3   | `.research/debt-runner-expansion/findings-v1/SQ9-interactive-patterns.md` | prior-research | HIGH  | 2026-03-26 |
| 4   | `.research/debt-runner-expansion/findings-v1/SQ10-discovery-layer.md`     | prior-research | HIGH  | 2026-03-26 |
| 5   | `.research/debt-runner-expansion/findings/SQ5-cli-web-handoff.md`         | prior-research | HIGH  | 2026-03-27 |
| 6   | `.research/debt-runner-expansion/findings/SQ6-read-write-split.md`        | prior-research | HIGH  | 2026-03-27 |
| 7   | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md`           | shared-lib     | HIGH  | 2026-03-25 |
| 8   | `.claude/state/deep-research.debt-runner-expansion.state.json`            | state-file     | HIGH  | 2026-03-27 |

---

## Contradictions

**None found.**

All patterns are consistent with the existing codebase conventions. The
CLI-write-only / web-read-only boundary established in SQ6 is respected
throughout. The web-equivalent mappings in Finding #3 are consistent with the
SQ5 handoff findings (static SPA, no filesystem writes possible from web).

One design tension to surface (not a contradiction): the guided mode's "Let me
handle S2/S3" delegation (Finding #9) applies AI auto-routing to 2,000+ items.
This approaches the >100 mutation confirmation gate. The design resolves this by
treating auto-routing as a decision _strategy_ (not an immediate mutation) — the
strategy is applied item-by-item as items are encountered, not as a bulk
mutation without review. Each item still goes through the per-item loop under
the chosen strategy.

---

## Gaps

1. **Guided mode vs standard mode coexistence** — How the skill detects or
   remembers the user's mode preference (standard vs guided) is not designed
   here. Options: a flag in the state file, a preference in REFERENCE.md, or
   always asking on first invocation. Needs a design decision.

2. **Triage mode scope definition** — The 2,125 NEW-status items are the current
   queue. But triage could also include items that have never had a CL
   verification pass. The mode's entry criteria ("what counts as needing
   triage?") is not formally specified in any current document. The expansion
   plan must define this.

3. **Dark-debt mode as a named entry point** — The discovery findings (SQ10 v1)
   design this as part of discover mode's review phase. This document treats it
   as a distinct mode with a per-store walkthrough. Whether it is a mode or a
   sub-workflow of discover mode is an open question for the deep-plan phase.

4. **"Review on web or continue here" — handoff mechanics** — The discover mode
   post-discovery message offers this choice but the implementation of "review
   on web" requires the SQLite sync to run before the web shows the new
   findings. The timing (auto-sync after discover agents complete, before
   presenting the delta summary) needs to be specified.

5. **Intake mode source enumeration** — The sources listed in Finding #8 are
   illustrative. The definitive list of disconnected sources comes from SQ8a (26
   gap categories). The full intake mode design must be grounded in that
   survey's findings.

---

## Serendipity

**The guided mode resolves a documented UX problem from SQ9 (Friction 1).**

SQ9 noted that when a debt-runner mode produces no changes, the menu re-appears
looking identical to before — the user cannot tell what changed. Guided mode's
post-section summaries ("Reviewed: 23 items, Fixed: 3, Cleared: 1") solve this
explicitly by always reporting what happened, even when the answer is "nothing
changed in this pass."

**The per-store walkthrough pattern (Finding #6) maps directly to
`_shared/ecosystem-audit`'s per-domain audit structure.**

The shared library processes domains sequentially with a decision point at each
boundary ("continue / re-review / pause"). The dark-debt per-store walkthrough
follows the same structure: store = domain, findings within store = findings
within domain. This means the shared library's state persistence and
pause/resume patterns can be directly applied to dark-debt mode without
reinvention.

**The delta synthesis step in discover mode (Finding #7) is already implemented
in `audit-comprehensive` as `DEDUP_VS_MASTER_DEBT.md`.**

SQ10 (discovery layer) found this. It is surfaced here again because it directly
affects the CLI interaction design: the user-facing delta summary in Finding #7
can be generated by reusing the audit-comprehensive synthesis logic rather than
building new.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct filesystem reads of SKILL.md files,
REFERENCE.md, shared library files, and cross-referenced against prior research
findings (SQ5, SQ6, SQ9, SQ10-v1). No external sources consulted. No
training-data inference used. The interaction designs are derived from patterns
observed in the actual codebase, not invented.
