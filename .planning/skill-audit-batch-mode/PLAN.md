# PLAN: Multi-skill Batched Audit Mode for /skill-audit

<!-- prettier-ignore-start -->
**Status:** ⏳ NEW (0 of 23 steps complete — 22 numbered + 1 sub-step 5b)
**Created:** 2026-04-14 (Session #281)
**Effort:** L (60-90 min implementation + parity test)
**Scope:** Design + spec. Implementation requires separate approval after plan signoff (per S7).
**Source decisions:** [DECISIONS.md](./DECISIONS.md) (27 decisions)
**Diagnosis:** [DIAGNOSIS.md](./DIAGNOSIS.md)
<!-- prettier-ignore-end -->

---

## Status Summary

| Phase                           | Steps   | Status |
| ------------------------------- | ------- | ------ |
| A. SKILL.md structural updates  | 1-5, 5b | ⏳ NEW |
| B. REFERENCE.md + state schema  | 6-10    | ⏳ NEW |
| C. self-audit.js Dim 6 rework   | 11-12   | ⏳ NEW |
| D. audit-review-team decoupling | 13      | ⏳ NEW |
| E. Implementation mechanics     | 14-18   | ⏳ NEW |
| F. Parity test + verification   | 19-21   | ⏳ NEW |
| G. Plan completion audit        | 22      | ⏳ NEW |

---

## Overview

This plan adds two new modes (`batch`, `multi`) to `/skill-audit` and removes
agent-layer verification from all modes. Per D15, all three modes ship in one
coherent pass. Per S7, this document is the **spec** — each step says _what_
will change; the separate execution approval covers _doing_ it.

**Modified files (total):**

- `.claude/skills/skill-audit/SKILL.md` (v3.6 → v4.0)
- `.claude/skills/skill-audit/REFERENCE.md` (v2.2 → v3.0)
- `scripts/skills/skill-audit/self-audit.js` (Dim 6 rework)
- `.claude/teams/audit-review-team.md` (v1.0 → v2.0, decouple from skill-audit)

**New directories:**

- `.claude/tmp/history/` (archived findings tmp files)

---

## Phase A: SKILL.md Structural Updates

### Step 1: Add mode-selection first gate ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` Phase 1 (Preparation)

**Change:** Add new Phase 1.0 **before** existing Phase 1:

```markdown
## Phase 1.0: Mode Selection (MUST — first gate)

Before any other work, prompt the user:

Mode? (1) single — interactive, one category at a time (current/default
behavior) (2) batch — single skill, all 12 categories produced at once to tmp
file (3) multi — multiple skills, each batched per skill, Shape Y orchestration

Record choice to state file `mode` field.

If mode=multi, follow-up prompt: "Skills to audit (comma-separated or list):"
```

**Done when:** SKILL.md has Phase 1.0 before Phase 1 with three-mode prompt.
State schema has `mode` field (see Step 6).

**References:** D5 (interactive first gate), D7 (mode names).

---

### Step 2: Split Phase 2 into 2a (gated) and 2b (batched) ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` Phase 2

**Change:**

- Rename current Phase 2 → **Phase 2a: Category Audit (single mode — Gated,
  MUST)**
- Move line 118 MUST rule + per-category procedure (lines 116-154) into Phase 2a
- Mark Phase 2a: "Applies ONLY when mode=single"
- Add new **Phase 2b: Category Audit (batch/multi mode — Batched, MUST)**
  - Applies when mode=batch or mode=multi
  - For each skill in the batch (just one if batch mode; list if multi):
    - Produce all 12 categories' findings atomically (D2): pros, cons, gaps,
      suggestions with rationale, opportunities — same rubric as Phase 2a,
      different delivery
    - Save state after each category's findings generated (D13)
    - Render markdown to `.claude/tmp/skill-audit-<name>-findings.md` from state
      (D3)
  - Phase 2b does NOT collect decisions — that's Phase 2.B (Step 3)
- Add phase transition note: "If mode=single, proceed to Phase 2a. If mode=batch
  or mode=multi, proceed to Phase 2b."

**Done when:**

- Phase 2a explicitly scoped to single mode; line 118 MUST language stays intact
  _within 2a only_
- Phase 2b documents the batched-production procedure
- Phase transition language handles the mode branch

**References:** D8 (Phase 2 split), D13 (save cadence), D3 (tmp file source).

---

### Step 3: Add Phase 2.B (decision collection for batch/multi) ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` — new phase between Phase 2b and
Phase 2.5

**Change:** Add **Phase 2.B: Decision Collection (batch/multi only, MUST)**

Procedure per skill in batch order:

1. Reference the tmp findings file
   (`.claude/tmp/skill-audit-<name>-findings.md`)
2. For each category (1-12):
   - Present category's suggestions (from findings state)
   - Collect accept/modify/reject/alternative per suggestion (same schema as
     Phase 2a step 9, conversational Q&A — no AskUserQuestion)
   - Check for conflict with earlier decisions (real-time per D10); if found,
     flag and resolve before continuing
   - Save decision to state file
3. After all 12 categories have decisions: run final sweep for any missed
   conflicts (D10 backstop)

For multi mode: repeat per-skill through all skills before moving to Phase 3.

**Done when:** Phase 2.B section exists, procedure is MUST-classified, conflict
detection is documented (real-time + backstop), save cadence is per-category.

**References:** D9 (Phase 2.B), D10 (conflict detection).

---

### Step 4: Add cross-skill systemic-pattern step (multi only) ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` — new phase between Phase 2b and
Phase 2.B (multi mode)

**Change:** Add **Phase 2.A: Cross-Skill Pattern Detection (multi only, MUST)**

Procedure:

1. After all skills' Phase 2b findings produced
2. Analyze findings across all skills in batch
3. Identify patterns that appear in 3+ skills (threshold): same gap type, same
   missing section, same anti-pattern
4. Write patterns to parent batch state file (`cross_skill_patterns` field)
5. Present to user before Phase 2.B begins: "Patterns detected across 3+ skills:
   [list]. These will be noted in per-skill decision prompts."

**Done when:** Phase 2.A exists for multi mode only; pattern threshold (3+) is
documented; cross-skill patterns surface before decisions.

**References:** D4 (parent state cross_skill_patterns field), D20 (cross-skill
context flows into decisions).

---

### Step 5: Rework Phase 5 self-audit for batch/multi + remove agent layer ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` Phase 5

**Change:**

Part 1 — Remove code-reviewer agent layer from all modes (D11):

- Delete existing Phase 5.2 Layer 2 "Independent Agent Verification (MUST
  for >15 decisions)" section entirely
- Retain Layer 1 (grep-based proof) and Layer 3 (diff-based mapping) — both
  deterministic
- Update Phase 5 intro to note: "Verification uses deterministic checks only
  (grep + diff + schema). No LLM agent re-interpretation."

Part 2 — Add batch/multi Phase 5 branch (D12):

- For mode=single or mode=batch: existing per-skill Phase 5.0 self-audit.js
  invocation (already in place)
- For mode=multi: dispatch `self-audit.js --target=<skill>` **in parallel** for
  each skill in the batch, aggregate results, present to user as composite table

Part 3 — Delete team-config recommendation:

- Remove SKILL.md line 385-388 (audit-review-team paragraph)

**Done when:**

- No "code-reviewer" or "Layer 2" language remains in Phase 5 prose
- Phase 5 documents parallel self-audit.js dispatch for multi mode
- Team config paragraph removed

**References:** D11 (scope expansion — remove agent layer from all modes), D12
(parallel self-audit.js).

---

### Step 5b: Add batched Phase 3 crosscheck for multi mode ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` Phase 3 (lines 210-223)

**Change:** Add a multi-mode branch to Phase 3 procedure:

For mode=single or mode=batch: existing Phase 3 procedure unchanged (per-skill).

For mode=multi: **Batched Phase 3**:

1. Review skill-creator ONCE against composite gap list (union of
   skill-creator-affecting gaps across all skills in batch)
2. Self-audit crosscheck ONCE for the composite
3. Adjacent skill contracts: aggregate across batch, identify cross-skill
   contract inconsistencies
4. Ecosystem impact: aggregate downstream skills/files across all audited
   skills; dedupe overlapping impacts
5. Present single batched crosscheck summary with per-skill breakdown

**Done when:** SKILL.md Phase 3 documents the multi-mode branch; procedure
states explicitly that skill-creator + self-audit crosscheck + ecosystem impact
are evaluated ONCE per batch, not N times.

**References:** D20 (batched Phase 3 for multi mode; matches Shape Y cross-skill
philosophy).

---

## Phase B: REFERENCE.md + State Schema Updates

### Step 6: Extend per-skill state schema with mode + findings fields ⏳ NEW

**File:** `.claude/skills/skill-audit/REFERENCE.md` State File Schema section
(lines 688-719)

**Change:** Add these fields to schema:

```json
{
  "mode": "single | batch | multi",
  "batch_id": "optional string — if part of a multi-mode batch, refs parent state",
  "findings_by_category": {
    "cat1_intent_fidelity": {
      "assessment": "string — current-state assessment",
      "pros": ["..."],
      "cons": ["..."],
      "gaps": ["..."],
      "suggestions": [
        {
          "id": "A",
          "description": "...",
          "rationale": "...",
          "recommendation": true
        }
      ],
      "opportunities": ["..."],
      "generated_at": "ISO timestamp"
    },
    "...cat12": "..."
  }
}
```

The existing `decisions` field stays. `findings_by_category` is populated during
Phase 2b; `decisions` is populated during Phase 2.B (or Phase 2a for single
mode).

**Done when:** REFERENCE.md State File Schema documents the new fields with
types and when they populate.

**References:** D3 (state file carries findings), D6 (findings depth equivalent
across modes).

---

### Step 7: Add parent batch state schema ⏳ NEW

**File:** `.claude/skills/skill-audit/REFERENCE.md` — new section after State
File Schema

**Change:** Add **Parent Batch State Schema** section:

```json
{
  "task": "Skill Audit Batch: [batch-id]",
  "batch_id": "string — timestamp or user-supplied tag",
  "mode": "multi",
  "skills": ["name1", "name2", "..."],
  "skill_status": {
    "name1": "phase_2b_findings | phase_2B_decisions | phase_3_crosscheck | phase_4_impl | phase_5_audit | complete",
    "...": "..."
  },
  "cross_skill_patterns": [
    { "pattern": "description", "skills_affected": ["..."], "severity": "..." }
  ],
  "started_at": "ISO timestamp",
  "updated": "ISO timestamp",
  "status": "in_progress | complete"
}
```

Path: `.claude/state/task-skill-audit-batch-<batch-id>.state.json`

**Done when:** Section added, schema fields documented, path convention stated.

**References:** D4 (parent batch state), D17 (compaction recovery via parent
state).

---

### Step 8: Document Phase 2b findings production procedure ⏳ NEW

**File:** `.claude/skills/skill-audit/REFERENCE.md` — new section after Category
12

**Change:** Add **Batch Findings Production Procedure** section:

- Per-category procedure (same as Phase 2a per-category MUST steps 1-8: assess,
  pros, cons, gaps, suggestions with rationale, opportunities) BUT step 9
  (collect decisions) is **SKIPPED** in this phase
- Output to `state.findings_by_category[cat_N]`
- State saved after each category (D13)
- Render markdown to `.claude/tmp/skill-audit-<name>-findings.md` after all 12
  categories complete

Document the markdown render format (section per category, matching single-mode
presentation style).

**Done when:** REFERENCE.md documents the step-by-step Phase 2b procedure +
markdown render spec.

**References:** D1, D2, D6, D13.

---

### Step 9: Document Phase 2.B decision collection procedure ⏳ NEW

**File:** `.claude/skills/skill-audit/REFERENCE.md` — new section after Step 8's
section

**Change:** Add **Decision Collection Procedure (Phase 2.B)** section:

- Read findings from state (NOT re-analyze — findings are locked per D6)
- For each category, present suggestions (A, B, C...) with recommendations
- Collect disposition conversationally (accept/modify/reject/alternative)
- Real-time conflict check: compare new decision vs all earlier decisions; if
  conflict found, present and resolve before continuing
- After all categories decided: final sweep pass over full decision set for any
  missed conflicts
- Cross-skill context injection (multi only): when presenting category N of
  skill X, surface any `cross_skill_patterns` entries affecting that category

**Done when:** REFERENCE.md documents the Phase 2.B procedure including conflict
detection (real-time + backstop) and cross-skill context injection.

**References:** D9, D10, D20.

---

### Step 10: Remove Layer 2 (agent) from self-audit report format ⏳ NEW

**File:** `.claude/skills/skill-audit/REFERENCE.md` Self-Audit Report Format
section (lines 536-652)

**Change:**

- Delete "Layer 2: Independent Agent Verification" section (lines 573-586)
- Update Self-Audit Report template (line 640) to remove `Agent discrepancies:`
  line
- Renumber remaining layers: Layer 1 Grep stays; what was Layer 3 Diff becomes
  Layer 2 Diff

**Done when:** No "agent" or "code-reviewer" language remains in Self-Audit
Report Format section; template reflects 2-layer deterministic verification.

**References:** D11.

---

## Phase C: self-audit.js Dim 6 Rework

### Step 11: Replace Dim 6 with stronger deterministic check OR document as N/A ⏳ NEW

**File:** `scripts/skills/skill-audit/self-audit.js` lines 342-366
(`dim6MultiAgent` function)

**Change — two viable paths, pick at implementation time:**

**Option A (preferred):** Replace Dim 6 with a **cross-reference integrity
check**:

- For each accepted decision in state, verify the corresponding diff hunk exists
  in the cited file_modified
- Check that
  `state.total_decisions == len(decisions.accepted) + len(decisions.rejected)`
- This is deterministic and catches the same failure mode (decision recorded but
  no implementation) that the agent layer was meant to catch — but mechanically.

**Option B (fallback):** Drop Dim 6 entirely:

- Remove `dim6MultiAgent` function
- Remove `"multi_agent"` from dimensions dict in `main()`
- Remove `"multi_agent"` from `mustDimensions` array
- Update script header "Skipped" rationale to document removal

**Recommendation in PLAN:** Implement Option A. Option B is the safety net if
cross-reference check proves non-deterministic in practice.

**Done when:** Dim 6 no longer prints "MANUAL: Dispatch code-reviewer" block;
either produces a deterministic check (A) or is removed (B) with documented
rationale.

**References:** D11.

---

### Step 12: Update self-audit.js header documentation ⏳ NEW

**File:** `scripts/skills/skill-audit/self-audit.js` header comment (lines 1-47)

**Change:**

- Update "Skipped / degraded from full coverage" block to reflect Dim 6 change
  from Step 11
- Update "@see" references to include this plan's DECISIONS.md (D11 rationale
  reference)
- Bump internal version comment

**Done when:** Script header accurately reflects post-Step-11 behavior; no stale
references to MANUAL agent dispatch.

**References:** D11.

---

## Phase D: audit-review-team Decoupling

### Step 13: Rewrite audit-review-team.md to remove /skill-audit references ⏳ NEW

**File:** `.claude/teams/audit-review-team.md`

**Changes:**

- Remove Spawn Trigger item 1 ("/audit-_ or /skill-audit invocation targeting 3+
  artifacts") → replace with "/audit-_ invocation targeting 3+ artifacts"
  (without /skill-audit)
- Remove Integration Points row for `/skill-audit`
- Update Example Invocation section's "Task Assignment Example (skill-audit on 5
  skills)" → replace with generic "Task Assignment Example (5-target audit)"
  using different domain (e.g., `/audit-comprehensive`)
- Bump version to 2.0, add Version History entry: "Decoupled from /skill-audit
  per PLAN skill-audit-batch-mode D19. Skill-audit uses faithful in-conversation
  rubric, not agent simulation."
- Document retained use cases: `/audit-comprehensive`, manual multi-artifact
  audits where 12-category rubric fidelity is not required

**Done when:** No "/skill-audit" string remains in audit-review-team.md; Version
History documents the decoupling; team config remains valid for other audit
contexts.

**References:** D19.

---

## Phase E: Implementation Mechanics

### Step 14: Define tmp file rendering logic ⏳ NEW

**File:** Add rendering behavior spec to
`.claude/skills/skill-audit/REFERENCE.md` (companion to Step 8's procedure doc)

**Change:** Document:

- Trigger: after all 12 categories written to `state.findings_by_category`
- Output path: `.claude/tmp/skill-audit-<name>-findings.md`
- Format: Markdown with top-level `# Findings: <skill-name>` header; one
  `## Category N: Name` section per category; within each: Assessment, Pros,
  Cons, Gaps, Suggestions (with rationale), Opportunities subsections
- Rendering is done by the main session (not a separate script) — it's just
  writing state data to a markdown template

**Done when:** REFERENCE.md documents the markdown render trigger, path, and
format.

**References:** D3, D18 (tmp path).

---

### Step 15: Define tmp file lifecycle + history archive ⏳ NEW

**File:** Add to `.claude/skills/skill-audit/REFERENCE.md` (lifecycle section)

**Change:** Document:

- Created: at Phase 2b completion per skill
- Active: lives at `.claude/tmp/skill-audit-<name>-findings.md` through Phase
  2.B + Phase 4
- Archived: at Phase 6 closure, moved to
  `.claude/tmp/history/skill-audit-<name>-<ISO-timestamp>-findings.md`
- Rolling retention: keep last 5 per skill; older archives pruned at archive
  time
- Ensure `.claude/tmp/history/` exists (create at archive time if missing)

**Done when:** REFERENCE.md has a tmp file lifecycle subsection; path
conventions, rotation cap, and create-if-missing behavior documented.

**References:** D18.

---

### Step 16: Define resume-from-partial logic ⏳ NEW

**File:** Add to `.claude/skills/skill-audit/SKILL.md` Compaction Resilience
section (line 367-373)

**Change:** Document resume behavior:

- On `/skill-audit <name>` invocation: check for existing per-skill state file
- If state found and `status != "complete"`: read state, identify last saved
  category (per `findings_by_category` keys for Phase 2b, or `decisions` keys
  for Phase 2a/2.B), offer: "Resume from category N / discard and restart?"
- For multi mode: check for parent batch state file by batch_id or recent
  timestamp; offer: "Resume batch <batch-id> from skill <X> category <N> /
  discard and restart?"
- Ensure state save cadence supports this (D13)

**Done when:** SKILL.md Compaction Resilience section explicitly covers resume
from partial findings (not just from completed categories); multi-mode parent
state recovery documented.

**References:** D16, D17.

---

### Step 17: Update SKILL.md Version History + Critical Rules ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` Version History (line 394) +
Critical Rules (line 25)

**Changes:**

- Add Version History entry:
  `| 4.0 | 2026-04-XX | Add batch + multi modes (D7); split Phase 2 into 2a/2b (D8); Phase 2.B decision collection (D9); cross-skill pattern detection (D20); remove code-reviewer agent layer (D11); decouple from audit-review-team (D19) |`
- Update Critical Rule #3 (save decisions incrementally) — no change needed,
  already covers findings save (D13)
- Add new Critical Rule: "Modes are selected interactively (Phase 1.0). Default
  is single. Batch/multi modes produce findings all at once; single mode is
  per-category gated."

**Done when:** Version bumped to 4.0 with changelog entry; new Critical Rule
documents mode system.

**References:** D7, D8, D9, D11, D13, D15, D19, D20.

---

### Step 18: Update invocation tracking for batch/multi ⏳ NEW

**File:** `.claude/skills/skill-audit/SKILL.md` Phase 6 (line 322-341)
invocation tracking block

**Change:** Update the `npx tsx write-invocation.ts` context payload to include
`mode` field:

```bash
--data '{"skill":"skill-audit","type":"skill","success":true,"schema_version":1,"completeness":"stub","origin":{"type":"manual"},"context":{"target":"SKILL_NAME","decisions":N,"score":SCORE,"mode":"single|batch|multi"}}'
```

For multi mode: also include `batch_id` and `skills_in_batch: [...]`.

**Done when:** SKILL.md Phase 6 documents updated invocation tracking payload
with mode field; multi-mode extensions shown.

**References:** D5, D15.

---

## Phase F: Parity Test + Faithfulness Verification

### Step 19: Select parity-test skill + document procedure ✅ DONE (Session #282)

**File:** `.planning/skill-audit-batch-mode/PARITY_TEST.md` (new file)

**Change:** Create test plan:

- Select ONE target skill for parity test — recommendation: `recall` (smallest
  CAS skill, lowest cost to audit twice)
- Procedure: (1) run `/skill-audit recall --mode=single`, capture findings per
  category; (2) run `/skill-audit recall --mode=batch`, capture findings per
  category; (3) compare category-by-category — for each category, findings
  should contain same pros, cons, gaps, suggestions (modulo ordering and wording
  variance)
- Acceptance criteria: ≥ 80% suggestion overlap per category (allows for LLM
  variance); zero missing cons/gaps between modes; same recommendation for each
  suggestion
- Document in PARITY_TEST.md before running the test

**Done when:** PARITY_TEST.md exists with target skill, procedure, acceptance
criteria.

**References:** D14 (parity test).

---

### Step 20: Execute parity test + document results ✅ DONE (Session #282 — PASS with same-session bias caveat)

**File:** `.planning/skill-audit-batch-mode/PARITY_TEST.md` (updated with
results)

**Change:** After Steps 1-18 implemented, run the test defined in Step 19.
Record:

- Full single-mode findings
- Full batch-mode findings
- Category-by-category diff
- Acceptance criteria pass/fail

**Done when:** PARITY_TEST.md contains test results + verdict (PASS/FAIL). If
FAIL, return to implementation with remediation list.

**References:** D14.

---

### Step 21: Final self-audit + Critical Rule verification ⏳ NEW

**Action:** Run
`node scripts/skills/skill-audit/self-audit.js --target=skill-audit` on the
skill-audit skill itself after all modifications. Verify all 9 dimensions PASS.
Spot-check:

- Phase 2a retains line 118 MUST (grep)
- Phase 2b does NOT have line 118 MUST (grep)
- No "code-reviewer" string in SKILL.md or REFERENCE.md (grep)
- `.claude/teams/audit-review-team.md` has no "/skill-audit" string (grep)

**Done when:** `self-audit.js` returns `overall: "PASS"` for skill-audit. Grep
spot-checks return expected results.

**References:** D11 (agent removal), D8 (mode-scoped MUST), D19 (team
decoupling).

---

## Phase G: Plan Completion Audit

### Step 22: code-reviewer audit on all modified files ⏳ NEW

**Action:** Dispatch `code-reviewer` agent (for the plan's own implementation —
**not** for /skill-audit's Phase 5) on the diff of:

- `.claude/skills/skill-audit/SKILL.md`
- `.claude/skills/skill-audit/REFERENCE.md`
- `scripts/skills/skill-audit/self-audit.js`
- `.claude/teams/audit-review-team.md`
- `.planning/skill-audit-batch-mode/PARITY_TEST.md`

Focus areas:

- MUST/SHOULD/MAY classification consistency
- Phase transition markers correctly placed
- Cross-references between SKILL.md and REFERENCE.md valid
- State schema examples are valid JSON
- No stale "code-reviewer" or "audit-review-team" references in skill-audit
  files

Triage surfaced findings per user decision (fix in-session / defer to TDMS /
skip).

**Done when:** code-reviewer findings triaged and addressed or deferred with
explicit user decision.

**References:** Plan self-audit Step 21 covers deterministic checks; this step
adds the peer review pass on the plan's own implementation (separate from
/skill-audit's own Phase 5 which no longer uses agents per D11).

**Note:** This audit uses code-reviewer as a generic code review for this plan's
PR. D11 removed code-reviewer from /skill-audit's process (where drift matters
against a 12-category rubric). Using code-reviewer to review a diff of
markdown + script changes is a different use case — standard code-review, no
12-category rubric in play.

---

## Dependencies

- Step 1 blocks Steps 2, 3, 4 (mode field must exist in state)
- Step 6 blocks Steps 8, 9, 14 (schema extensions referenced)
- Steps 2-18 can be parallelized in implementation (within each step's file),
  but REFERENCE.md changes (Steps 6-10, 14-15) should be batched into one edit
  session to avoid merge churn
- Step 11 (self-audit.js Dim 6) is independent of other steps
- Step 13 (audit-review-team.md) is independent of all other steps
- Step 19 blocks Step 20 (test plan must exist before running)
- Steps 1-18 block Step 20 (parity test needs implementation done)
- Steps 21-22 are final audits; block plan closure

**Parallelizable batches:**

- Wave 1: Steps 1-5 (SKILL.md), 11-12 (self-audit.js), 13 (team config) — three
  independent file trees
- Wave 2: Steps 6-10, 14-15 (REFERENCE.md) — single file, batch as one edit
- Wave 3: Steps 16-18 (SKILL.md — second pass for sections added post-Wave 1)
- Wave 4: Steps 19-22 (test + audits)

---

## Out of Scope (reaffirmed)

- Running the actual CAS 7-skill audit — downstream consumer, after this plan
  ships
- `/skill-creator` scaffolding updates for self-audit.js stubs per new skills —
  follow-up plan
- Migrating existing state files to new schema — schema extensions are additive;
  old state files remain valid (default `mode: "single"` if missing)

---

## Handoff Routing

Per `/deep-plan` Handoff phase: this plan produces 4 file modifications + 1 new
file + parity test. Implementation sequence:

- **Route: Manual sequential with optional parallelization at Wave boundaries.**
  Steps are interdependent enough that subagent dispatch across all would be
  messier than execution in waves. User applies Wave 1 (3 parallel edits), Wave
  2 (single large edit), Wave 3 (sequential SKILL.md additions), Wave 4 (tests +
  audits).
- Alternative: use `/gsd:plan-phase` to break waves into phases if user prefers
  the GSD cadence — this plan is already phase-structured so conversion is
  trivial.

---

## Effort Breakdown

| Phase                        | Est. Effort                          |
| ---------------------------- | ------------------------------------ |
| A (SKILL.md structural)      | 25-30 min                            |
| B (REFERENCE.md + schema)    | 20-25 min                            |
| C (self-audit.js)            | 10 min                               |
| D (audit-review-team)        | 5-10 min                             |
| E (implementation mechanics) | 10-15 min                            |
| F (parity test)              | 15-20 min (includes actual test run) |
| G (plan completion audit)    | 10-15 min                            |
| **Total**                    | **~2 hours implementation + test**   |

---

## Version History

| Version | Date       | Description                                            |
| ------- | ---------- | ------------------------------------------------------ |
| 1.0     | 2026-04-14 | Initial plan from 20-question Discovery (Session #281) |
