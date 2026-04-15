---
name: skill-audit
description: >-
  Interactive behavioral quality audit for individual skills. Evaluates against
  12 quality categories (including T25 convergence loop and completion
  verification) to surface attention management issues and produce actionable
  decisions. Includes self-audit verification that all decisions were actually
  implemented. Uses convergence loops in its own discovery phase. Produces a
  decision record and updated skill files.
---

<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-03-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Skill Audit

Interactive, category-by-category behavioral quality audit for individual
skills. Surfaces gaps in intent fidelity, workflow sequencing, prompt
engineering, integration, guard rails, and user experience — then resolves each
gap through guided decisions with the user.

## Critical Rules (MUST follow)

1. **Present ALL issues** — every con, gap, and issue identified in a category
   MUST be presented to the user, not just the ones with multiple options.
2. **Recommend with rationale** — for every suggestion, state your
   recommendation and explain WHY. Do not present options without a
   recommendation.
3. **Save decisions incrementally** — persist to state file after each category
   and each phase boundary. Non-negotiable for long-running audits.
4. **Crosscheck skill-creator** — before implementing, verify the creator skill
   itself covers the gaps found in this audit.
5. **Address the skill, not just the word** — when behavior doesn't match
   intent, fix the behavioral instructions, not the naming.
6. **Self-audit before completion** — Phase 5 is MUST. Never skip verification.
   Re-read all modified files and verify every decision was implemented.
7. **Mode-aware execution** — Phase 1.0 selects mode (single / batch / multi)
   before any other work. `single` preserves Phase 2a per-category gating MUST.
   `batch` and `multi` use Phase 2b (batched findings) + Phase 2.B (decision
   collection). Never apply Phase 2a gating to batch/multi; never collapse
   single-mode per-category gates.

## When to Use

- Evaluating a skill's behavioral quality before a major rewrite
- User invokes `/skill-audit`
- After creating a skill with `/skill-creator` to validate quality
- When a skill consistently produces weak output (diagnose root cause)
- Periodic quality review of critical skills

## When NOT to Use

- Auditing the skill ecosystem as a whole — use `/skill-ecosystem-audit`
- Creating a new skill from scratch — use `/skill-creator`
- Quick structural validation — use `npm run skills:validate`

## Routing Guide

- "Evaluate this skill's quality" → `/skill-audit`
- "Create a new skill" → `/skill-creator`
- "Update an existing skill" → `/skill-creator` (or `/skill-audit` first)
- "Check all skills for issues" → `/skill-ecosystem-audit`
- "Quick structural check" → `npm run skills:validate`

---

## Process Overview

```
Phase 1: Preparation    → Validate target, read skill + standards, initialize state
Phase 2: Category Audit → 12 categories (incl. T25 + Completion Verification), interactive, decisions saved per category
Phase 2.5: Operational Deps → Scripts, hooks, data files, npm scripts, state files
Phase 3: Crosscheck     → Verify skill-creator + ecosystem impact + adjacent contracts
Phase 4: Implementation → Apply decisions (priority order, batch related changes)
Phase 5: Self-Audit     → Verify decisions implemented, process followed
Phase 6: Learning Loop  → Process feedback, invocation tracking, closure
```

---

## Phase 1.0: Mode Selection (MUST — first gate)

Before any other work, prompt the user for mode:

```
Mode?
  (1) single — interactive, one category at a time (default behavior, MUST gated)
  (2) batch  — single skill, all 12 categories produced at once to tmp file
  (3) multi  — multiple skills, batched per skill, Shape Y orchestration
```

Record the chosen mode to state file `mode` field. If `mode=multi`, follow-up
prompt: _"Skills to audit (comma-separated list):"_ — record as
`skills_in_batch` on the parent batch state file (see
`.claude/skills/skill-audit/REFERENCE.md` §Parent Batch State Schema).

**Phase routing after Phase 1:**

- `mode=single` → standard flow through Phase 2a (gated, interactive)
- `mode=batch` → Phase 2b (batched findings) → Phase 2.B (decision collection) →
  Phase 3
- `mode=multi` → Phase 2b per skill → Phase 2.A (cross-skill patterns) → Phase
  2.B (decision collection per skill) → batched Phase 3

**Done when:** Mode recorded to state file; for multi, skills list captured.

---

## Phase 1: Preparation (MUST)

1. **Validate target** (MUST) — if SKILL.md doesn't exist, report error and
   suggest `/skill-creator`. Note companion file count in warm-up.
2. Read target skill's SKILL.md and companion files (MUST)
3. Read SKILL_STANDARDS.md for quality checklist (MUST)
4. **Check previous audit** (SHOULD) — look for existing state file. If found,
   include previous scores and top findings in warm-up.
5. **Audit health self-check** (MUST) — verify REFERENCE.md has all 10
   categories, state file path is writable, SKILL_STANDARDS.md is readable.
6. Initialize state file (MUST) — path:
   `.claude/state/task-skill-audit-{skill-name}.state.json`
7. Present warm-up summary (MUST):

```
Skill Audit: [skill-name]
Lines: [N] | Companions: [N] | Neighbors: [list] | Last Updated: [date]
Categories: 10 | Estimated decisions: [N]
[If repeat: Previous: [date], score [N/100]. Top findings: [list]]
```

**Done when:** Warm-up presented, state initialized, user confirms proceed.

---

## Phase 2a: Category Audit — single mode (Interactive, Gated, MUST)

> **Mode scope:** This phase applies ONLY when `mode=single`. For `mode=batch`
> or `mode=multi`, skip to Phase 2b below.

> Read `.claude/skills/skill-audit/REFERENCE.md` for the 12 category
> definitions, question banks, scoring rubrics, and presentation format.
> Category 11 (Convergence Loop Integration) evaluates T25 compliance. Category
> 12 (Completion Verification Design) evaluates built-in self-audit quality per
> SKILL_STANDARDS.md.

**Self-application (T25):** Skill-audit's own discovery (this phase) SHOULD use
a `quick` convergence loop: Pass 1 audits all categories, Pass 2 verifies
findings are accurate and nothing was missed. Present T20 tally before Phase 3.

### Interactive Flow (MUST)

Present ONE category at a time. Wait for user response. Do NOT batch. Even if a
rewrite is confirmed at mid-audit, MUST continue one-category-at-a-time
interactive flow. The rewrite conclusion does not change the process.

- **Correction protocol:** If user corrects presentation format, re-present the
  category in the EXACT original format (full pros, cons, gaps, suggestions with
  rationale). Never summarize, truncate, or use table-only format.
- **Mid-category recovery:** If compaction occurs mid-category, re-read state
  file and restart the current category (partial progress not persisted).
- **Cross-category revision:** If a later category conflicts with an earlier
  decision, present the conflict to the user and update state with revision.

### Per-Category Procedure (MUST)

1. Present the category — name, purpose, what it evaluates
2. Assess current state — cite specific skill sections/lines
3. List ALL pros — what's working well
4. List ALL cons — what's not working
5. List ALL issues & gaps — what's missing entirely
6. Present suggestions — labeled A, B, C. Recommend with rationale. Two modes:
   multiple options (with pros/cons per option) or single fix (one
   recommendation). Use multi-option mode when genuine alternatives exist.
7. Cover EVERY con and gap — each MUST have at least one suggestion
8. Present opportunities section (MUST present, MAY populate) — value-add ideas
   beyond fixing problems. If genuine ideas exist, present with recommendation +
   rationale. If none: state "Opportunities: None for this category."
9. Collect decisions — accept/modify/reject/alternatives via conversational Q&A.
   NEVER use AskUserQuestion — present findings and collect decisions through
   normal conversation. **Delegation:** if user says "you decide," accept all
   recommendations; record `delegated-accept`.
10. **AskUserQuestion check** (MUST) — if the audited skill uses
    AskUserQuestion, flag it as a finding. Skills MUST use conversational Q&A
    (deep-plan style) instead of AskUserQuestion for all interactive decisions.
11. Tag confidence (SHOULD) — `high`/`medium`/`low`. Low-confidence gets extra
    confirmation during Phase 4.
12. Save to state file — persist ALL decisions before next category
13. Show progress — "Category 3 of 10 complete. 18 decisions so far."

> If >8 suggestions per category, split into sub-batches by theme,
> severity-first.

### Mid-Audit Check (MUST — after Category 5)

"Mid-audit status: Score [N/55], [M] decisions across 5 categories. Top concern:
[lowest-scoring category]."

**Scope explosion guard:** If 3+ categories below 4/10: "Multiple categories
show fundamental issues. Continue auditing, or pivot to `/skill-creator`?"

### After Category 12 (MUST)

"Are there quality concerns the 11 categories didn't surface?" Add user findings
as additional decisions.

### Phase 2a Completion (MUST — single mode only)

> See REFERENCE.md for the completion summary template.

Present aggregate summary: all decisions by category, overall score, top
findings. Then: "Proceed to implementation with these N decisions? [Y/modify/n]"

**Update state file.**

---

## Phase 2b: Category Audit — batch/multi modes (Batched, MUST)

> **Mode scope:** This phase applies when `mode=batch` or `mode=multi`. Line 118
> MUST rule (single-category gating) does NOT apply here — it is scoped to Phase
> 2a only.

### Findings-Only Flow (MUST)

Produce findings for ALL 12 categories **before** collecting any decisions.
Decision collection happens in Phase 2.B. This decouples:

- **Findings production** (this phase — batched)
- **User decision gate** (Phase 2.B — still interactive per-category)

### Per-Skill Procedure (MUST)

For each skill in the batch (one skill if `mode=batch`, list if `mode=multi`):

1. **For each category (1-12)** — follow the Phase 2a per-category procedure
   steps 1-8 (assess, list pros, cons, gaps, suggestions with recommendations,
   opportunities) — **SKIP step 9 (collect decisions)**. Findings go to state
   under `findings_by_category.<cat_key>`.
2. **Save state after each category's findings** (MUST — matches Phase 2a save
   cadence). See REFERENCE.md §Batch Findings Production Procedure.
3. **Render markdown** to `.claude/tmp/skill-audit-<name>-findings.md` after all
   12 categories complete. See REFERENCE.md §Batch Findings Rendering.

### Faithfulness Guarantee (MUST)

Findings produced in Phase 2b MUST be equivalent to what Phase 2a would produce
on the same skill — same 12 categories, same pros/cons/gaps/suggestions depth,
same REFERENCE.md rubric. Only **delivery** differs (batched vs gated).

**Done when:** All skills in the batch have complete
`state.findings_by_category` and rendered tmp file. State saved after each
category per skill.

---

## Phase 2.A: Cross-Skill Pattern Detection (MUST — multi mode only)

> **Mode scope:** This phase applies ONLY when `mode=multi`. Skip for batch or
> single modes.

### Purpose

Surface systemic patterns (same gap type, same missing section, same
anti-pattern) that appear across multiple skills in the batch — before any
decisions are collected. Lets cross-skill context inform per-skill decisions.

### Procedure (MUST)

1. After all skills' Phase 2b findings produced
2. Analyze `findings_by_category` across all skills in the batch
3. **Identify patterns appearing in 3+ skills** (threshold): same gap label,
   same missing section, same anti-pattern type
4. Write to parent batch state file `cross_skill_patterns` field (see
   REFERENCE.md §Parent Batch State Schema)
5. **Present to user before Phase 2.B begins:** "Patterns detected across 3+
   skills: [list]. These will be noted in per-skill decision prompts."

**Done when:** Cross-skill patterns written to parent state and presented to
user.

---

## Phase 2.B: Decision Collection (MUST — batch/multi modes)

> **Mode scope:** This phase applies when `mode=batch` or `mode=multi`.

### Purpose

Collect accept/modify/reject/alternative decisions for the already-produced
findings. Faithful to Phase 2a's per-category decision schema — just decoupled
from findings production.

### Procedure (MUST)

For each skill in the batch (if multi, iterate through all skills):

1. Reference the rendered tmp findings file
   (`.claude/tmp/skill-audit-<name>-findings.md`)
2. For each category (1-12):
   - Present that category's suggestions (read from state, NOT re-analyze —
     findings are locked from Phase 2b per faithfulness guarantee)
   - For `mode=multi`: surface any `cross_skill_patterns` entries affecting this
     category inline ("also appears in 3 other skills in this batch")
   - Collect decisions conversationally (accept/modify/reject/alternative) —
     NEVER use AskUserQuestion. Same schema as Phase 2a step 9.
   - **Real-time conflict check** (MUST): compare new decision vs all earlier
     decisions in this audit. If conflict detected, present and resolve before
     continuing.
   - Save decision to state file (MUST — per category)
3. After all 12 categories decided: **final sweep conflict pass** (MUST
   backstop) over the full decision set.

**Done when:** All categories across all skills in the batch have decisions
recorded; both real-time and final-sweep conflict checks complete.

---

## Phase 2.5: Operational Dependency Check (SA-1, MUST)

Run these checks for every skill with scripts, hooks, or data file dependencies:

| Check          | Level               | What to verify                                                            |
| -------------- | ------------------- | ------------------------------------------------------------------------- |
| A. Scripts     | MUST                | All invoked scripts exist, **run without error**, produce expected output |
| B. Hooks       | SHOULD              | All hooks that feed data are configured and write output                  |
| C. Data files  | MUST                | Every file read has a writer, every file written has a reader             |
| C2. Contracts  | MUST (if consumers) | Output artifacts match downstream consumer expectations (format, schema)  |
| D. npm scripts | SHOULD              | All `npm run` commands exist in package.json                              |
| E. Docs        | SHOULD              | All referenced docs/anchors still exist                                   |
| F. Functions   | MAY (MUST if >3)    | Internal functions produce output, handle missing input                   |
| G. State files | MUST                | Schema matches read/write usage, path writable                            |

**MUST investigate root causes** (SA-3) — don't just note "file missing." Trace
the writer, identify WHY it's missing (dead code? never wired? wrong path?).

**MUST functionally validate scripts** (SA-5) — existence is the floor, not the
ceiling. Run each script in dry-run/check mode and verify it produces expected
output. A script that exists but fails silently is worse than a missing script.

Present findings with severity and fix recommendations. User decides per
finding. **Pause for user confirmation before proceeding to Phase 3.**

---

## Phase 3: Crosscheck + Ecosystem Impact (MUST)

> **Mode branching:**
>
> - `mode=single` or `mode=batch`: run this phase per-skill (single skill in
>   scope)
> - `mode=multi`: run this phase ONCE across the batch (see Batched Phase 3
>   below)

### Standard Phase 3 (single / batch modes)

1. Review skill-creator — does it guide creators to avoid the gaps found?
2. **Self-audit crosscheck** (MUST) — does skill-creator's discovery include
   self-audit design questions? Does the content checklist require a self-audit
   phase per SKILL_STANDARDS.md?
3. Present crosscheck summary: gap count + recommendations
4. **Adjacent skill contracts** (SA-4, MUST) — referenced skills exist,
   interfaces match assumptions, handoff protocol consistent on both sides
5. **Ecosystem impact** (MUST) — identify downstream skills/files affected. For
   each impact, offer actionable solutions (not just notifications). User may
   address downstream impacts within this audit or defer.

### Batched Phase 3 (multi mode only, MUST)

Run the crosscheck **ONCE across the batch**, not N times:

1. **Skill-creator crosscheck** — review ONCE against composite gap list (union
   of skill-creator-affecting gaps across all audited skills)
2. **Self-audit crosscheck** — ONCE for the composite
3. **Adjacent skill contracts** — aggregate across batch; identify cross-skill
   contract inconsistencies (e.g., two audited skills reference each other with
   mismatched handoff assumptions)
4. **Ecosystem impact** — aggregate downstream skills/files across all audited
   skills; dedupe overlapping impacts
5. Present a **single batched crosscheck summary** with per-skill breakdown +
   composite findings

Rationale: skill-creator crosscheck converges quickly across skills (gap set is
small); N-times is waste. Batched aggregation catches cross-skill
inconsistencies that per-skill would miss.

**Update state file (parent batch state for multi, per-skill state for
single/batch).**

---

## Phase 4: Implementation (MUST)

1. **Priority order** (MUST) — highest-impact decisions first
2. **Batch related changes** (SHOULD) — group edits to the same file
3. **Flag conflicts** (MUST) — if two decisions conflict, ask user first
4. **Low-confidence confirm** (MUST) — decisions tagged `low` get extra
   confirmation before applying
5. **Correction protocol** (MUST) — if user corrects presentation format,
   re-present in the EXACT original format. Never summarize or truncate.
6. Update SKILL.md — keep under 300 lines (MUST)
7. Extract to REFERENCE.md if needed (SHOULD)
8. Update companion files as needed (SHOULD)
9. Apply skill-creator updates if crosscheck found gaps (SHOULD)
10. Run `npm run skills:validate` (MUST)

**For multi-file skills:** Audit root SKILL.md, note sub-command coverage gaps.
Do not run separate audits per sub-command.

**Done when:** All accepted decisions applied, `skills:validate` passes.
**Update state file.**

---

## Phase 5: Self-Audit (MUST — before completing)

> Read REFERENCE.md for detailed self-audit criteria and report format. Pattern
> reference:
> [`.claude/skills/_shared/SELF_AUDIT_PATTERN.md`](../_shared/SELF_AUDIT_PATTERN.md).

### 5.0 Run Self-Audit Script (MUST — first step)

**Mode branching:**

- `mode=single` or `mode=batch`: invoke the per-skill self-audit script once:

  ```bash
  node scripts/skills/skill-audit/self-audit.js --target=<audited-skill-name>
  ```

- `mode=multi`: invoke **in parallel** for each skill in the batch. Aggregate
  `---SUMMARY---` JSON blocks into a composite result; present to user as a
  batch table (one row per skill) with `overall` status + counts of
  `must_failed` / `should_warned`.

Parse the `---SUMMARY---` JSON block. Branch:

- **`overall == "FAIL"`**: present each `must_failed` dimension to the user with
  remediation options. Re-enter Phase 4 (Implementation), fix, re-run the
  script. Per SKILL_STANDARDS.md §Self-Audit ordering: "If self-audit finds
  failures, re-enter Build, fix, then re-run Self-Audit." For multi mode: failed
  skills get per-skill remediation; passing skills remain clean.
- **`overall == "PASS"` with `should_warned` non-empty**: present warnings
  (typically `regression` no-history note on first runs). User decides
  acknowledge / fix / defer. Proceed only after explicit decision.
- **`overall == "PASS"` clean**: proceed to 5.1 prose verification.

The script covers all 9 MUST dimensions mechanically (Dim 6 is a deterministic
cross-reference integrity check, replacing the previous agent-based layer per
Session #281 D11). Steps 5.1-5.5 below handle process-compliance + decision-by-
decision evidence walkthrough — **no LLM agent re-interpretation**,
deterministic only.

### 5.1 Re-read All Modified Files (MUST)

Re-read every file modified or created in Phase 4. Do NOT rely on memory.

### 5.2 Evidence-Based Decision Verification (MUST)

> Logging a decision as "PASS" does NOT mean it was implemented. Each decision
> MUST be verified with objective evidence. See REFERENCE.md for the
> deterministic verification methods and evidence format.
>
> **Deterministic only (Session #281 change):** Verification uses grep + diff
> mechanical checks. No LLM agent re-interpretation. Rationale: another LLM
> reading the same inputs is echo, not independent verification. Deterministic
> checks (grep + diff + schema validation) catch the "I thought I wrote it but
> didn't" failure mode without drift risk.

Two verification layers, ALL required:

1. **Grep-based proof (MUST):** For each decision, grep the output file for a
   keyword or pattern that proves implementation. Cite the grep result. If grep
   finds nothing, the decision is MISSING — not PASS.
2. **Diff-based mapping (MUST):** Generate `git diff` of all modified files. Map
   each decision to the specific diff hunk that implements it. Decisions with no
   corresponding diff hunk are MISSING.

Present results as decision-by-decision table. **If >20 decisions:** group by
category, expand only PARTIAL/MISSING items; PASS items get one-line summary
with grep evidence.

### 5.3 Process Compliance Verification (MUST)

Verify the skill-audit process was followed. See REFERENCE.md checklist.

### 5.4 Structural Validation (MUST)

Run `npm run skills:validate`, check line count, verify cross-references.

### 5.5 Self-Audit Report → Completion Summary (MUST)

Report is ALWAYS shown first. Completion Summary ONLY after report passes clean.
They are sequential, not alternatives. Fix any PARTIAL/MISSING before summary.

**Update state file to `status: complete`.**

---

## Phase 6: Learning Loop + Closure (MUST)

**Auto-learnings** (MUST): Generate 2-3 data-driven insights from audit results
(lowest-scoring category, most common gap type, recurring patterns across repeat
audits). Save to state file `learnings` field.

**Optional user feedback** (SHOULD): "Any additional observations?" Accept empty
/ "none" to proceed. If provided, save to `process_feedback` field.

**On next startup** (MUST): If previous audit state exists for the same skill,
surface auto-learnings and user feedback from the previous run.

**Invocation tracking** (MUST):

> **Context MUST include** `{"target":"SKILL_NAME","decisions":N}` — substitute
> the actual skill name and decision count. Empty context breaks audit tracking.

```bash
# single / batch mode:
cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"skill-audit","type":"skill","success":true,"schema_version":1,"completeness":"stub","origin":{"type":"manual"},"context":{"target":"SKILL_NAME","decisions":N,"score":SCORE,"mode":"single"}}'

# multi mode — includes batch_id + skills_in_batch:
cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"skill-audit","type":"skill","success":true,"schema_version":1,"completeness":"stub","origin":{"type":"manual"},"context":{"mode":"multi","batch_id":"BATCH_ID","skills_in_batch":["a","b","c"],"decisions":N}}'
```

**Closure summary:**

```
Skill Audit Complete: [skill-name]
Categories: 10 | Decisions: [N] ([M] accepted, [K] rejected)
Overall Score: [N/100] → post-fix: [N/100]
[If repeat: Previous: [N] → Current: [M] | Improved: [list] | Regressed: [list]]
Files modified: [list] | Skill-creator gaps: [N]
```

---

## Guard Rails

- **Target doesn't exist:** Report error, suggest `/skill-creator`
- **Scope explosion:** 3+ categories below 4/10 at midpoint → offer pivot
- **Pause/resume:** User says "pause" → save state, print progress, exit.
  Resume: `/skill-audit <name>` reads state, skips completed categories.
- **Multi-file skills:** Audit root SKILL.md only; note sub-command gaps
- **Phase entry gates:** Phase 2 requires warm-up + state init. Phase 3 requires
  all 10 categories. Phase 4 requires crosscheck + user approval.

---

## Compaction Resilience

- **State file:** `.claude/state/task-skill-audit-{skill-name}.state.json`
- **Update frequency:** After every category AND every phase boundary
- **Recovery:** On resume, read state file, skip completed categories/phases
- **Retention:** File retained after completion as audit decision record
- **State schema:** See REFERENCE.md for full schema

---

## Integration

- **Neighbors:** `/skill-creator` (create/update), `/skill-ecosystem-audit`
  (ecosystem-wide), `npm run skills:validate` (structural)
- **Input:** Target skill name or path
- **Output:** Updated skill files + decision record in state file (the state
  file IS the persistent decision record)
- **Handoff:** Use `/skill-creator` for major rewrites after audit
- **Multi-skill batches:** Use `mode=multi` (selected in Phase 1.0) to audit 3+
  skills in one coherent run. The skill handles batch orchestration natively via
  Shape Y (audit-all → decide-all → implement-all) with cross-skill pattern
  detection in Phase 2.A. No team dispatch required — faithfulness to the
  12-category rubric is maintained by running the real skill process, not agent
  simulation.

---

## Version History

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.0     | 2026-04-14 | Add batch + multi modes (D7); split Phase 2 into 2a/2b (D8); Phase 2.B decision collection (D9); Phase 2.A cross-skill pattern detection (D20); batched Phase 3 crosscheck (D20); remove code-reviewer agent layer from all modes (D11); parallel Phase 5 self-audit.js dispatch for multi (D12); decouple from audit-review-team (D19). Per skill-audit-batch-mode plan. |
| 3.6     | 2026-04-14 | Phase 5.0: invoke scripts/skills/skill-audit/self-audit.js (pattern-based)                                                                                                                                                                                                                                                                                                |
| 3.5     | 2026-04-04 | Add Category 12 (Completion Verification Design), expand Phase 2.5+3                                                                                                                                                                                                                                                                                                      |
| 3.4     | 2026-03-19 | Fix invocation tracking: context MUST include target+decisions+score                                                                                                                                                                                                                                                                                                      |
| 3.3     | 2026-03-15 | Add Category 11 (T25 convergence loop), self-application in Phase 2                                                                                                                                                                                                                                                                                                       |
| 3.2     | 2026-03-07 | Evidence-based self-audit: grep proof, agent verification, diff mapping                                                                                                                                                                                                                                                                                                   |
| 3.1     | 2026-03-07 | SA-1,3,4: Phase 2.5 operational deps, root cause, adjacent contracts                                                                                                                                                                                                                                                                                                      |
| 3.0     | 2026-03-06 | Self-audit: 42 changes, routing, guard rails, UX, confidence.                                                                                                                                                                                                                                                                                                             |
| 2.0     | 2026-03-06 | Add Phase 5 self-audit. Source: pr-retro audit session.                                                                                                                                                                                                                                                                                                                   |
| 1.0     | 2026-03-01 | Initial implementation from deep-plan audit of deep-plan                                                                                                                                                                                                                                                                                                                  |
