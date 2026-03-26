# Findings: Interactive Skill Patterns — Menu Design, Navigation, and UX Conventions

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-26
**Sub-Question IDs:** SQ-009

---

## Key Findings

### 1. Skill Inventory and Survey Scope [CONFIDENCE: HIGH]

Thirteen skills were surveyed across three tiers. All SKILL.md files were read
directly from the filesystem. This represents the full population of interactive
skills in the codebase.

**Tier 1 (most interactive):** debt-runner, sonarcloud, ecosystem-health,
alerts, deep-plan

**Tier 2 (structured interactive elements):** pr-review, session-end,
system-test, skill-audit, pre-commit-fixer

**Tier 3 (shared protocols / atomic interaction patterns):** _shared/ecosystem-audit
(5 shared modules), convergence-loop

---

### 2. Menu Structures Used Across Skills [CONFIDENCE: HIGH]

Five distinct menu / interaction structures appear across the surveyed skills:

**A. Numbered flat menu (Mode selector)**

Used by: debt-runner, sonarcloud

```
1. verify   — [description]
2. sync     — [description]
...
Select mode [1-7]:
```

Characteristics: all options at the same level, user picks by number, no
sub-categories visible until mode is entered. debt-runner has 7 modes.
sonarcloud has 6 modes presented as a table (flag-based, not numbered).

**B. Dashboard + dimension drill-down**

Used by: ecosystem-health, alerts

The skill presents a scored/graded dashboard summary table first, then enters a
sequential per-item walkthrough. The user never "navigates" in the traditional
sense — the skill moves through items one by one.

```
Category   | Score | Rating | Alerts  | Trend
Code       | 60    | Poor   | 1 error | stable
...
Found 3 alerts. Walking through each one...
```

**C. Numbered phase pipeline (Linear wizard)**

Used by: pr-review (8 steps), session-end (10 steps across 4 phases),
pre-commit-fixer (7 steps), deep-plan (6 phases)

No navigable menu. The skill progresses through named steps in sequence. User
gates appear at confirmation points ("Ready to commit? [Y/n]"). Steps are labeled
(Step 1, Phase 2, etc.) to orient the user.

**D. Per-domain interactive audit loop**

Used by: system-test (23 domains), skill-audit (11 categories)

Each domain/category is presented sequentially with a decision point. The user
can skip, reorder, or pause at each boundary. Progress is tracked and displayed
("Category 3 of 10 complete. 18 decisions so far.").

**E. Per-finding review with decision options**

Used by: system-test, skill-audit, alerts, ecosystem-health, all 8 ecosystem
audit skills (via _shared/ecosystem-audit/FINDING_WALKTHROUGH.md)

The finest-grained interaction unit: one finding at a time, with numbered options
(Accept/Reject/Defer/Discuss or Fix/Defer/Ignore/Suppress), evidence, and AI
recommendation.

---

### 3. Maximum Menu Depth Observed [CONFIDENCE: HIGH]

**Maximum observed nesting: 3 levels**

No skill exceeds 3 levels of interaction depth. The pattern is:

```
Level 1: Mode/domain selection  (debt-runner menu, system-test domain pick)
Level 2: Within-mode options    (review mode: individual/batch/fix-all)
Level 3: Per-finding decisions  (Accept/Reject/Defer/Discuss)
```

Evidence:
- system-test: domain selection (L1) → review mode per domain (L2) → per-finding decision (L3)
- ecosystem-health: triage mode selection (L1) → per-dimension Q&A (L2) → approve fix command (L3)
- skill-audit: phase confirmation (L1) → per-category audit (L2) → per-suggestion accept/reject (L3)

**Critically: Level 3 is never a free-navigate menu.** It is always a single-item
review with enumerated choices. "Navigate into sub-sub-menus" never occurs.

The flat numbered mode selector (debt-runner, sonarcloud) is Level 1 only —
once inside a mode, it proceeds as a pipeline, not a sub-menu tree.

---

### 4. Item Presentation Formats [CONFIDENCE: HIGH]

Three primary formats, with evidence:

**Format A: Numbered flat list with inline descriptions**

```
1. verify   — Verify current debt accuracy via convergence loop
2. sync     — Run SonarCloud sync + intake pipeline
```
(debt-runner SKILL.md lines 105-113)

Used for: initial mode selection, options within a finding.

**Format B: Structured context card**

```
[ERROR/WARNING/INFO] Category: {category}
  Message: {message}
  Details: {details}
  Trend: {trend} {sparkline}
  Benchmark: {benchmark_value}
  Suggested: {recommendation}

  Action? (f) Fix now  (d) Defer  (i) Ignore  (s) Suppress
```
(alerts REFERENCE.md lines 37-47)

Used for: per-alert or per-finding decisions. The card combines data (what's
wrong) and action (what to do about it) in one block.

**Format C: Dashboard table with drill-down**

```
| Category    | Score | Rating  | Alerts   | Trend     |
| Code        | 60    | Poor    | 1 error  | stable    |
...
```
(ecosystem-health SKILL.md, alerts REFERENCE.md)

Used for: overview before walkthrough. Never the primary interaction mechanism —
always followed by a deeper loop.

**Format D: Bordered finding card (ecosystem audit shared library)**

```
━━━ Finding {n}/{total} ({pct}% complete -- {fixed} fixed, {deferred} deferred) ━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}
```
(_shared/ecosystem-audit/FINDING_WALKTHROUGH.md lines 33-41)

Used by all 8 ecosystem audit skills. The most polished standardized format.

---

### 5. Delegation Patterns [CONFIDENCE: HIGH]

Five delegation patterns are explicitly coded across the skills. These exist
because the user is a solo operator who often wants to move fast.

**Pattern D1: "You decide" full delegation**

- Triggers: "you decide", "all", "auto", "apply all", "go ahead", "yes"
- Effect: AI accepts all recommendations, logs each as `delegated-accept`
- Evidence: alerts SKILL.md line 186-190; ecosystem-health SKILL.md line 146-149;
  deep-plan SKILL.md line 163; skill-audit SKILL.md line 145; _shared
  FINDING_WALKTHROUGH.md lines 148-164

**Pattern D2: Severity filter delegation**

- Triggers: "skip remaining INFO", "fix errors only", "skip S3"
- Effect: bulk-skips items below threshold, continues loop on remainder
- Evidence: alerts SKILL.md line 186 ("fix errors only", "except item 3");
  _shared FINDING_WALKTHROUGH.md lines 158-163; ecosystem-health batch
  management (F-grade first, D-grade second)

**Pattern D3: Patchable-only delegation**

- Triggers: "fix all patchable"
- Effect: applies all patches without individual review
- Evidence: _shared FINDING_WALKTHROUGH.md line 159

**Pattern D4: DAS-bracket auto-delegation (pr-review specific)**

- Triggers: "you decide on clear items"
- Effect: auto-accepts DAS 0-2 (act) and DAS 5-6 (defer) recommendations.
  DAS 3-4 items MUST still be presented individually.
- Evidence: pr-review SKILL.md lines 247-248, 340-342

**Pattern D5: Escape hatch with auto-defer**

- Triggers: after N items (every 10 in alerts), user may ask to stop
- Effect: remaining items auto-defer with confirmation
- Evidence: alerts SKILL.md line 133 ("escape hatch every 10 alerts")

**Delegation confirmation is universal.** Before bulk execution, all skills show
a preview: "Will apply: X Fix Now, Y Defer. Confirm? [Y/n]" (alerts SKILL.md
line 190).

---

### 6. Navigation Back / Return-to-Menu Patterns [CONFIDENCE: HIGH]

The codebase uses three return-to-menu patterns:

**Return A: Automatic return after mode completion**

debt-runner Critical Rule #5: "Return to menu after each mode — present updated
stats + mode menu. User picks next mode or exits."

The updated stats header (S0/S1/S2/S3 counts) changes between modes, providing
orientation signal even after returning.

**Return B: Sequential progression with no "back"**

pr-review, session-end, pre-commit-fixer: strictly linear pipelines. No "back"
navigation concept. Pause/resume exists for interruption, but not for revisiting
a prior step during normal flow.

Exception: pr-review Step 4 has "re-triage" if item proves more complex.

**Return C: Pause-and-resume at boundary**

ecosystem-health, system-test, skill-audit, alerts: user can say "pause" at any
decision boundary. State is saved, instructions for resume are printed. On next
invocation, the skill auto-detects state and resumes without re-running checks.

Evidence:
- ecosystem-health SKILL.md lines 215-217: "User says 'pause' → save all
  decisions to state file, print progress ('5 of 8 dimensions triaged'), exit
  cleanly"
- alerts SKILL.md line 178 (compaction resilience)
- skill-audit SKILL.md line 328 (guard rails)
- _shared CRITICAL_RULES.md: "CHECK for saved progress first — resume from
  progress file if < 2 hours old"

**There is no "back to previous step" within a mode.** Once a decision is made,
the skill advances. Revision of earlier decisions is handled via explicit
"revision" prompts after the full pass completes (e.g., alerts Phase 4 Decision
Review; pr-review re-triage flag).

---

### 7. State Persistence Patterns [CONFIDENCE: HIGH]

Every interactive skill persists state to disk. No skill relies on conversation
context alone. This is a hard invariant — all state files are listed in SKILL.md.

**State file naming conventions:**

| Skill              | State File Pattern                                      |
| ------------------ | ------------------------------------------------------- |
| debt-runner        | `.claude/state/debt-runner.state.json`                  |
| ecosystem-health   | `.claude/state/task-ecosystem-health-triage.state.json` |
| alerts             | `.claude/tmp/alerts-progress-{YYYY-MM-DD}.json`         |
| deep-plan          | `.claude/state/deep-plan.{topic-slug}.state.json`       |
| pr-review          | `.claude/state/task-pr-review-{pr}-r{N}.state.json`     |
| skill-audit        | `.claude/state/task-skill-audit-{skill}.state.json`     |
| system-test        | `PLAN_INDEX.md` (domain-per-line progress tracker)      |
| pre-commit-fixer   | `.claude/tmp/pre-commit-fixer-state.json`               |
| convergence-loop   | `.claude/state/convergence-loop-{topic}.state.json`     |

**Update frequency:**
- After every individual decision (alerts, ecosystem-health, skill-audit)
- After every phase/category boundary (deep-plan, skill-audit, pr-review)
- After every mode completion (debt-runner)

**Resume detection:** All skills check for existing state on startup. Pattern:
"Resuming [skill]. Last [step]. Continue? [Y/restart]"

system-test uses a simpler approach: PLAN_INDEX.md marks each domain as
pending/complete, readable at a glance.

---

### 8. What Works Well (UX Wins) [CONFIDENCE: HIGH]

**Win 1: Warm-up before any interaction**

Every skill presents a warm-up summary before beginning. Content includes: what
the skill will do, estimated time, last-run context (if applicable), resume
status. This orients the user and prevents surprise.

Examples:
- debt-runner: S0-S4 counts + effort estimates per mode + resume status
- ecosystem-health: previous score + grade + dimensions previously flagged
- alerts: previous insights from history + mode being run
- skill-audit: line counts, companion files, previous audit score if exists
- deep-plan: topic + phase overview + estimated effort (S/M/L)

**Win 2: Progress counter on all sequential loops**

"Alert N of M" / "Category N of 10" / "Finding N of M (pct% complete -- X fixed,
Y deferred, Z skipped)" — every skill shows where you are in the sequence. The
running tally (fixed/deferred/skipped) is shown on each step in the most mature
skills, not just a count.

The bordered finding card header from _shared/ecosystem-audit is the most
sophisticated: `━━━ Finding 4/12 (33% complete -- 2 fixed, 1 deferred, 1
skipped) ━━━`

**Win 3: AI recommendation with explicit rationale**

Every per-item decision includes a recommendation: "Recommendation: Option 2
because [rationale]." The user can accept without reading options. The options
are enumerated to enable override.

This is the deep-plan Q&A style, now used universally. The skill-audit SKILL.md
explicitly prohibits presenting options without a recommendation.

**Win 4: Scope explosion guards with automatic offers**

No skill allows unbounded work without asking first:
- >100 mutations: confirmation + preview (debt-runner)
- >30 findings: "review all, errors-only, or top-20 by impact?" (_shared)
- >50 findings: offer top-20 + batch remainder (_shared)
- >15 errors or >10 files: ask scope before proceeding (pre-commit-fixer)
- >50 items: suggest splitting into severity batches (pr-review)
- >20 items for decision: offer "you decide / severity filter / batch review" (debt-runner)
- >15 alerts: "Apply to all N? [Apply All / Next 15 / Revise]" (alerts)

**Win 5: Batch shortcuts offered contextually**

After 3+ consecutive INFO or WARNING findings with no patches, the _shared
protocol offers to batch-acknowledge. This prevents mechanical repetition without
removing individual control for higher-severity items. ERRORs are always
individual.

**Win 6: Updated context on return to menu**

debt-runner re-computes and re-displays stats (S0/S1/S2/S3 counts) after every
mode. The user sees what changed as a result of the mode they just ran. This
closes the feedback loop.

**Win 7: Script progress announcements**

debt-runner Integration section: "Before each script call, print 'Running
[script]...' After completion, print result summary. Prevents user uncertainty
during long operations." This is specific and well-reasoned.

**Win 8: Effort estimates in warm-up**

debt-runner, deep-plan, ecosystem-health all provide time estimates per mode or
per task. This enables the user to decide whether to run now or defer.

**Win 9: Compaction-resilient design**

All skills write state after every decision. Resume prompts are standardized.
The _shared ecosystem-audit library formalizes a 2-hour staleness window for
progress files. system-test uses PLAN_INDEX.md as a "recovery anchor" — a
single file that shows all 23 domain statuses.

---

### 9. What Doesn't Work Well (UX Friction) [CONFIDENCE: HIGH]

**Friction 1: No unified "where am I?" signal across modes**

debt-runner returns to the menu after each mode with updated stats. But if the
user runs a mode that produces no changes (e.g., health with no degraded items),
the menu re-appears looking identical to before. The user has no way to know what
changed without scrutinizing numbers.

The _shared ecosystem-audit finding card solves this at the finding level (running
tally in header) but debt-runner's mode-level return doesn't have equivalent
"completed modes" display.

**Friction 2: Inconsistent delegation trigger phrases**

Different skills use different natural-language triggers for delegation:
- debt-runner: "you decide", severity filter, batch review
- alerts: "you decide", "all", "auto", "apply all", "go ahead", "yes"
- _shared: "you decide or similar"
- pr-review: "you decide on clear items" (scope-restricted)
- ecosystem-health: "fix all", "you decide"

There is no canonical list of delegation phrases. A new skill author must infer
from examples.

**Friction 3: Back/redo is always "outside the loop"**

No skill supports revisiting a decision mid-loop. Revision is only offered
at the end of a batch (alerts Phase 4, pr-review re-triage). For long loops
(23-domain system-test, 11-category skill-audit), this means the user must
wait until completion to fix an early decision.

The only exception is convergence-loop's Disagreement Handling, which can
surface mid-loop, but this applies to agent disagreements, not user decisions.

**Friction 4: AskUserQuestion vs conversational Q&A inconsistency (historical)**

skill-audit and ecosystem-health both MUST note and flag use of AskUserQuestion
in audited skills. The _shared CRITICAL_RULES.md states all skills adopted
conversational Q&A in the v2 rewrite (2026-03-08). This suggests earlier skills
used AskUserQuestion and it caused friction. The explicit prohibition is now
documented in SKILL_STANDARDS (referenced in skill-audit) and skill-audit
Category 10 flags it as a finding.

**Friction 5: Long pipelines with no mid-pipeline overview**

pr-review has 8 steps and session-end has 10 steps across 4 phases. The user
is shown the step they're on but never a "here's what remains" overview after
getting into the pipeline. This differs from deep-plan, which shows a phase
overview in warm-up and uses phase transition markers (`========== PHASE N ==========`).

**Friction 6: Inconsistent escape hatch placement**

alerts has "escape hatch every 10 alerts." ecosystem-health has "pause" support
but no timed escape hatch. skill-audit has "pause" at any point. system-test
offers "continue / re-review / pause" at each domain boundary. The interval and
trigger differ per skill.

**Friction 7: Effort estimates absent in high-friction skills**

session-end, pr-review, and pre-commit-fixer do not provide effort estimates in
warm-up. Only debt-runner, deep-plan, and ecosystem-health do. For pr-review,
the item count + severity breakdown serves as a proxy, but an explicit estimate
("Estimated effort: medium 6-15 items") is only formatted in pr-review's Step 1
effort estimate — not the warm-up.

---

### 10. The _shared/ecosystem-audit Library: Standardized Pattern [CONFIDENCE: HIGH]

The most mature standardized interactive pattern in the codebase is the
`_shared/ecosystem-audit` library, extracted 2026-03-25 from 8 ecosystem audit
skills to eliminate copy-paste. It codifies the "run script → dashboard → find-
by-finding walkthrough → closure" pattern.

**Key conventions standardized:**
- Progress file path: `.claude/tmp/{audit-name}-audit-progress.json`
- Staleness threshold for resume: 2 hours
- Finding card format with progress header
- Decision options by severity (ERROR: Fix/Defer/Skip; WARNING: Fix/Defer/Skip;
  INFO: Acknowledge/Defer)
- Batch shortcuts after 3+ same-severity consecutive findings
- Scope explosion guards (30+ and 50+ findings)
- Delegation protocol ("you decide" = accept patches, defer the rest)
- Post-walkthrough contradiction check
- Closure: learnings + user feedback + invocation tracking + cleanup

This library represents the "best of breed" for the find-by-find pattern.

---

### 11. Convergence Loop: The Meta-Interaction Pattern [CONFIDENCE: HIGH]

Convergence-loop is not a user-facing skill — it is an internal verification
protocol used by other skills. Its UX conventions are relevant because:

1. The T20 tally (Confirmed/Corrected/Extended/New) is presented to the user
   after each pass. This is a "show your work" interaction: the user sees what
   the agents found, not just the result.

2. User gates exist before convergence declaration. The skill never self-
   declares convergence — it presents the tally and asks.

3. Disagreement handling surfaces both agent positions with evidence and asks the
   user to decide. This is the deepest form of transparency in the codebase.

Skills that integrate convergence-loop (deep-plan, skill-audit) inherit these
patterns and present T20 tallies to the user at verification boundaries.

---

## Sources

All sources are SKILL.md files, REFERENCE.md files, and shared library files
read directly from the filesystem. No external sources consulted.

| # | File Path | Trust | Date |
|---|-----------|-------|------|
| 1 | `.claude/skills/debt-runner/SKILL.md` | HIGH (filesystem) | 2026-03-15 |
| 2 | `.claude/skills/debt-runner/REFERENCE.md` | HIGH (filesystem) | 2026-03-15 |
| 3 | `.claude/skills/sonarcloud/SKILL.md` | HIGH (filesystem) | 2026-02-25 |
| 4 | `.claude/skills/ecosystem-health/SKILL.md` | HIGH (filesystem) | 2026-03-11 |
| 5 | `.claude/skills/ecosystem-health/REFERENCE.md` | HIGH (filesystem) | 2026-03-11 |
| 6 | `.claude/skills/alerts/SKILL.md` | HIGH (filesystem) | 2026-03-24 |
| 7 | `.claude/skills/alerts/REFERENCE.md` | HIGH (filesystem) | 2026-03-19 |
| 8 | `.claude/skills/deep-plan/SKILL.md` | HIGH (filesystem) | 2026-03-15 |
| 9 | `.claude/skills/pr-review/SKILL.md` | HIGH (filesystem) | 2026-03-18 |
| 10 | `.claude/skills/session-end/SKILL.md` | HIGH (filesystem) | 2026-03-13 |
| 11 | `.claude/skills/system-test/SKILL.md` | HIGH (filesystem) | 2026-02-18 |
| 12 | `.claude/skills/skill-audit/SKILL.md` | HIGH (filesystem) | 2026-03-19 |
| 13 | `.claude/skills/pre-commit-fixer/SKILL.md` | HIGH (filesystem) | 2026-03-22 |
| 14 | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` | HIGH (filesystem) | 2026-03-25 |
| 15 | `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` | HIGH (filesystem) | 2026-03-25 |
| 16 | `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` | HIGH (filesystem) | 2026-03-25 |
| 17 | `.claude/skills/_shared/ecosystem-audit/README.md` | HIGH (filesystem) | 2026-03-25 |
| 18 | `.claude/skills/convergence-loop/SKILL.md` | HIGH (filesystem) | 2026-03-15 |

---

## Contradictions

None significant. The main tension is between "deep-plan Q&A style" (no
AskUserQuestion) and the older skills that used it — this is a resolved
historical inconsistency, not a current contradiction. The shared library
standardized the conversational Q&A approach in March 2026.

One minor inconsistency: the _shared library's scope guard thresholds (30, 50
findings) are not consistent with alerts' threshold (15 alerts → "Apply to all N
/ Next 15 / Revise"). The different thresholds appear to reflect different
expected volumes per skill type, not design incoherence.

---

## Gaps

1. No skill was found that implements true two-level hierarchical menus (a menu
   leading to a sub-menu). The deepest is three-level pipeline depth, not nested
   menus.

2. No skill documents how a user can navigate "back" mid-decision-loop. All
   back-navigation is explicitly absent by design (sequential pipelines) or
   handled by end-of-batch revision. This may be intentional to prevent
   confusion, but the rationale is not documented.

3. The delegation trigger phrases are not canonically documented anywhere. They
   appear inline in each skill's delegation section. A future shared protocol
   document (similar to _shared/ecosystem-audit) would help new skill authors.

4. session-end and pr-review have no effort estimate in warm-up despite being
   potentially long-running (10-step pipeline, XL reviews). This is a documented
   gap in several skill-audit notes but not yet fixed.

---

## Serendipitous Findings

**S1: The _shared/ecosystem-audit library is very recent (2026-03-25)**

This library was extracted from 8 individual skills just one day before this
survey was conducted. It represents the project's most current thinking about
shared interactive patterns. The debt dashboard should consider anchoring to this
library rather than reinventing from scratch.

**S2: The debt-runner menu is the closest analog to a debt dashboard**

debt-runner already solves the "mode selection + stats header + sequential mode
execution + return to menu" problem. The debt dashboard expansion should be
treated as extending this skill's interaction model, not replacing it. The key
gap in debt-runner's current menu is: no "completed modes" display on return, no
cross-mode progress visualization.

**S3: The DAS framework (pr-review) is the most sophisticated delegation model**

Defer/Act Score: three dimensions (Signal, Dependency, Risk), each 0-2, total
0-6. Auto-act on 0-2, user decides on 3-4, auto-defer on 5-6. This framework
prevents over-burdening the user with gray-zone items while preserving mandatory
human judgment on genuinely ambiguous cases. Applicable to any skill that presents
items with a "fix vs defer" binary.

**S4: system-test's PLAN_INDEX.md is the best multi-session progress artifact**

For tasks spanning multiple sessions (system-test: 6 recommended sessions),
a single markdown file with per-domain status is a superior recovery artifact to
a JSONL state file. The user and the AI can both read it at a glance. The debt
dashboard's "multi-category health" view could use a similar artifact.

**S5: Effort estimates are a warm-up requirement in the most mature skills**

Deep-plan, ecosystem-health, and debt-runner all put effort estimates in warm-up.
This is not present in all skills but correlates with user satisfaction signals
(the most actively maintained skills have it). Any new interactive skill — including
a debt dashboard — should include this.

---

## Synthesis: Best Practices for the Debt Dashboard

### Pattern Selection Guide

| Dashboard Need | Recommended Pattern | Evidence Source |
|---|---|---|
| Top-level navigation | Numbered flat menu with stats header | debt-runner |
| Per-item triage | Bordered context card + numbered options | _shared/ecosystem-audit |
| Health overview | Dashboard table with grades/scores | ecosystem-health, alerts |
| Bulk handling | Scope guards + delegation shortcuts | All skills |
| Progress tracking | "Item N of M (X% -- Y fixed, Z deferred)" header | _shared finding card |
| State across sessions | PLAN_INDEX.md + state JSONL pair | system-test |
| Severity filtering | Severity-bracket delegation (fix S0/S1, defer rest) | alerts, debt-runner |
| AI recommendations | Every item gets recommendation + rationale | All finding-loop skills |

### Menu Depth Guide

The evidence from 13 skills is clear: **3 levels is the practical maximum**, and
level 3 should always be a single-item review (not a sub-menu). The recommended
structure for a debt dashboard:

```
Level 1: Mode/view selector (flat numbered menu with live stats)
  → "1. triage  2. plan  3. health  4. sync  5. cleanup"

Level 2: Within-mode options (triage mode, filter, delegation choice)
  → "Review each / Fix S0+S1 only / You decide / Batch by category"

Level 3: Per-item decision (single debt item with options)
  → "A. Fix now  B. Defer  C. Reassign severity  D. Mark FP  E. Discuss"
```

Going deeper than 3 levels consistently creates scope explosion and disorientation.
The escape valve at this depth is delegation (Level 2 "you decide" bypasses
Level 3 entirely).

### Delegation Spectrum

Observed delegation spectrum from "you decide everything" to "show me results only":

```
Full control    ←————————————————————————————————→    Full delegation
  Individual    Severity    Patchable    DAS-bracket    "You decide"
  per-item      filter      only         delegation      everything
  review        (skip S3)   ("fix all    (auto on        (all accept
                             patchable") clear items)    all deferred)
```

Practical rule observed across skills:
- S0/S1 items: never auto-accept without showing to user (debt-runner, pr-review)
- S2/S3 items: safe for delegation / batch shortcuts
- DAS 3-4 items (gray zone): pr-review mandates user decision even under delegation
- Items >100 mutations: confirmation gate even under delegation (debt-runner)

The implication for a debt dashboard: the delegation setting should be
per-severity by default. "You decide on S2/S3, show me S0/S1" is the most
powerful single-statement delegation pattern.

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All claims are grounded in direct filesystem reads of SKILL.md files. No
training-data inference was used. The source files are the ground truth.
