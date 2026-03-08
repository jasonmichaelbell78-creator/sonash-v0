---
name: skill-audit
description: >-
  Interactive behavioral quality audit for individual skills. Evaluates against
  10 quality categories to surface attention management issues and produce
  actionable decisions. Includes self-audit verification that all decisions were
  actually implemented. Produces a decision record and updated skill files.
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
Phase 2: Category Audit → 10 categories, interactive, decisions saved per category
Phase 2.5: Operational Deps → Scripts, hooks, data files, npm scripts, state files
Phase 3: Crosscheck     → Verify skill-creator + ecosystem impact + adjacent contracts
Phase 4: Implementation → Apply decisions (priority order, batch related changes)
Phase 5: Self-Audit     → Verify decisions implemented, process followed
Phase 6: Learning Loop  → Process feedback, invocation tracking, closure
```

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

## Phase 2: Category Audit (Interactive, MUST)

> Read `.claude/skills/skill-audit/REFERENCE.md` for the 10 category
> definitions, question banks, scoring rubrics, and presentation format.

### Interactive Flow (MUST)

Present ONE category at a time. Wait for user response. Do NOT batch.

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
8. Present opportunities (MAY) — value-add ideas beyond fixing problems. Only
   when genuinely useful. Each gets recommendation + rationale.
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

"Mid-audit status: Score [N/50], [M] decisions across 5 categories. Top concern:
[lowest-scoring category]."

**Scope explosion guard:** If 3+ categories below 4/10: "Multiple categories
show fundamental issues. Continue auditing, or pivot to `/skill-creator`?"

### After Category 10 (MUST)

"Are there quality concerns the 10 categories didn't surface?" Add user findings
as additional decisions.

### Phase 2 Completion (MUST)

> See REFERENCE.md for the completion summary template.

Present aggregate summary: all decisions by category, overall score, top
findings. Then: "Proceed to implementation with these N decisions? [Y/modify/n]"

**Update state file.**

---

## Phase 2.5: Operational Dependency Check (SA-1, MUST)

Run these checks for every skill with scripts, hooks, or data file dependencies:

| Check          | Level            | What to verify                                                            |
| -------------- | ---------------- | ------------------------------------------------------------------------- |
| A. Scripts     | MUST             | All invoked scripts exist, **run without error**, produce expected output |
| B. Hooks       | SHOULD           | All hooks that feed data are configured and write output                  |
| C. Data files  | MUST             | Every file read has a writer, every file written has a reader             |
| D. npm scripts | SHOULD           | All `npm run` commands exist in package.json                              |
| E. Docs        | SHOULD           | All referenced docs/anchors still exist                                   |
| F. Functions   | MAY (MUST if >3) | Internal functions produce output, handle missing input                   |
| G. State files | MUST             | Schema matches read/write usage, path writable                            |

**MUST investigate root causes** (SA-3) — don't just note "file missing." Trace
the writer, identify WHY it's missing (dead code? never wired? wrong path?).

**MUST functionally validate scripts** (SA-5) — existence is the floor, not the
ceiling. Run each script in dry-run/check mode and verify it produces expected
output. A script that exists but fails silently is worse than a missing script.

Present findings with severity and fix recommendations. User decides per
finding. **Pause for user confirmation before proceeding to Phase 3.**

---

## Phase 3: Crosscheck + Ecosystem Impact (MUST)

1. Review skill-creator — does it guide creators to avoid the gaps found?
2. Present crosscheck summary: gap count + recommendations
3. **Adjacent skill contracts** (SA-4, MUST) — referenced skills exist,
   interfaces match assumptions, handoff protocol consistent on both sides
4. **Ecosystem impact** (MUST) — identify downstream skills/files affected. For
   each impact, offer actionable solutions (not just notifications). User may
   address downstream impacts within this audit or defer.

**Update state file.**

---

## Phase 4: Implementation (MUST)

1. **Priority order** (MUST) — highest-impact decisions first
2. **Batch related changes** (SHOULD) — group edits to the same file
3. **Flag conflicts** (MUST) — if two decisions conflict, ask user first
4. **Low-confidence confirm** (MUST) — decisions tagged `low` get extra
   confirmation before applying
5. **Rewrite threshold** — if >70% of lines need changing, recommend
   `/skill-creator` instead of piecemeal edits
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

> Read REFERENCE.md for detailed self-audit criteria and report format.

### 5.1 Re-read All Modified Files (MUST)

Re-read every file modified or created in Phase 4. Do NOT rely on memory.

### 5.2 Evidence-Based Decision Verification (MUST)

> Logging a decision as "PASS" does NOT mean it was implemented. Each decision
> MUST be verified with objective evidence. See REFERENCE.md for the three
> required verification methods and evidence format.

Three verification layers, ALL required:

1. **Grep-based proof (MUST):** For each decision, grep the output file for a
   keyword or pattern that proves implementation. Cite the grep result. If grep
   finds nothing, the decision is MISSING — not PASS.
2. **Independent agent verification (MUST for >15 decisions):** Dispatch a
   `code-reviewer` agent with the decision list and modified files. Agent
   independently checks each decision and reports discrepancies.
3. **Diff-based mapping (MUST):** Generate `git diff` of all modified files. Map
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

**Learning loop:** "Was this audit useful? Any patterns the process should learn
for next time?" Capture in state file `process_feedback` field.

**Invocation tracking** (MUST):

```bash
cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"skill-audit","type":"skill","success":true,"context":{"target":"SKILL_NAME"}}'
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

---

## Version History

| Version | Date       | Description                                                             |
| ------- | ---------- | ----------------------------------------------------------------------- |
| 3.2     | 2026-03-07 | Evidence-based self-audit: grep proof, agent verification, diff mapping |
| 3.1     | 2026-03-07 | SA-1,3,4: Phase 2.5 operational deps, root cause, adjacent contracts    |
| 3.0     | 2026-03-06 | Self-audit: 42 changes, routing, guard rails, UX, confidence.           |
| 2.0     | 2026-03-06 | Add Phase 5 self-audit. Source: pr-retro audit session.                 |
| 1.0     | 2026-03-01 | Initial implementation from deep-plan audit of deep-plan                |
