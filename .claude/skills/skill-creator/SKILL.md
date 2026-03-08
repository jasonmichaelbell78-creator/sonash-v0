---
name: skill-creator
description: >-
  Structured workflow for creating or updating skills — from discovery through
  validation and audit. Produces structurally correct, behaviorally effective
  skill packages (SKILL.md + companions) using deep-plan-style discovery with
  skill-specific question categories.
---

# Skill Creator

Structured creation workflow that produces high-quality skills by front-loading
decision-making through exhaustive discovery. Effectiveness is measured against
the quality checklist in [SKILL_STANDARDS.md](../_shared/SKILL_STANDARDS.md).

## Critical Rules (MUST follow)

1. **Discovery before writing** — MUST complete discovery and planning before
   writing any skill files. No skipping ahead.
2. **Approval gate before scaffold** — MUST present planning output to user and
   get explicit approval before creating files.
3. **Skill-audit is mandatory** — MUST run `/skill-audit` on every created skill
   before considering it complete.
4. **Under 300 lines** — created SKILL.md MUST stay under 300 lines. Extract to
   REFERENCE.md if approaching the limit.
5. **MUST/SHOULD/MAY on every instruction** — every instruction in created
   skills MUST be classifiable as MUST, SHOULD, or MAY.
6. **Persist state incrementally** — save to state file after every phase. Long
   creation sessions WILL hit compaction.
7. **Recommend with rationale** — at every decision point, state your
   recommendation and explain WHY.

## When to Use

- Creating a new skill from scratch
- Updating or improving an existing skill (major changes)
- User explicitly invokes `/skill-creator`

## When NOT to Use

- Auditing an existing skill's quality — use `/skill-audit`
- Creating an audit-type skill — use `/create-audit`
- Checking all skills for issues — use `/skill-ecosystem-audit`
- Quick structural check — use `npm run skills:validate`

## What This Skill Does NOT Do

- Ecosystem-wide analysis (use `/skill-ecosystem-audit`)
- Structural validation only (use `npm run skills:validate`)
- Behavioral quality evaluation (use `/skill-audit`)
- Audit-specific scaffolding (use `/create-audit`)

## Routing Guide

| Situation               | Use                       | Why                           |
| ----------------------- | ------------------------- | ----------------------------- |
| Create new skill        | `/skill-creator`          | Full discovery + planning     |
| Improve existing skill  | `/skill-audit` first      | Audit identifies what to fix  |
| Create audit-type skill | `/create-audit`           | Specialized audit scaffolding |
| Check all skills        | `/skill-ecosystem-audit`  | Ecosystem-wide analysis       |
| Quick structural check  | `npm run skills:validate` | Fast, no AI needed            |

## Input

**Argument:** Skill name or description, passed as `/skill-creator <name>` or in
conversation context.

**Output location:** `.claude/skills/<skill-name>/` (MUST — user-created skills
go here, not in vendor directories).

## Complexity Tiers

| Tier     | Characteristics                           | Process                          |
| -------- | ----------------------------------------- | -------------------------------- |
| Simple   | Reference-only, <50 lines, no companions  | Skip discovery, write directly   |
| Standard | Workflow, 50-200 lines, 0-2 companions    | Full process                     |
| Complex  | Multi-phase, 200-300 lines, 3+ companions | Full process + enhanced planning |

---

## Process Overview

```
WARM-UP    Orientation    -> Skill name, process, effort estimate, welcome
PHASE 1    Context        -> ROADMAP check, neighbor scan, existing patterns
PHASE 2    Discovery      -> Exhaustive questions (6 categories, floor ~12)
PHASE 3    Planning       -> Decision record + skill structure plan + approval
PHASE 4    Build          -> Scaffold, write SKILL.md + companions
PHASE 5    Validate       -> Structural + behavioral checklist
PHASE 6    Audit          -> Run /skill-audit on created skill
PHASE 7    Closure        -> Retro, invocation tracking, session cleanup
```

Use phase markers: `======== PHASE N: [NAME] ========`

---

## Warm-Up (MUST)

Present before any work: skill name, process overview, complexity tier estimate,
effort estimate (Simple: 10min, Standard: 30min, Complex: 60min+).

"Before we start: any specific concerns, constraints, or existing patterns you
want this skill to follow?"

**Done when:** User confirms proceed.

---

## Phase 1: Context Gathering (MUST)

1. Check ROADMAP.md — verify skill aligns with project direction (MUST). **If
   misaligned:** present conflict, offer proceed/reframe/abort. Do NOT silently
   proceed.
2. Scan `.claude/skills/` for existing neighbors (MUST)
3. Check CLAUDE.md for relevant conventions (MUST)
4. Read existing skill files if updating (MUST for updates)

**Reframe path:** If context reveals the user doesn't need a skill — they need a
hook, script, CLAUDE.md entry, or agent — present the reframe before proceeding.

**Done when:** Context gathered, no ROADMAP conflict (or conflict resolved).

---

## Phase 2: Discovery (MUST for Standard/Complex, skip for Simple)

> Read `.claude/skills/skill-creator/REFERENCE.md` for the 6 question categories
> with example questions.

### Discovery Rules (MUST follow)

1. **Floor of ~12 questions, no ceiling** — ask until ambiguity is resolved
2. **Front-load critical decisions** — scope, architecture, neighbors first
3. **Offer defaults for every question** — "I recommend X because Y. Override?"
4. **Reference existing patterns** — cite actual codebase skills, not generics
5. **Batch 4-6 related questions** — group by category, critical first
6. **Inter-batch synthesis** — summarize learnings before next batch
7. **State inferences explicitly** — "Based on Q3, inferring X for Q7"
8. **Save decisions after every batch** (MUST) — persist to state file
9. **Show progress** — "Batch 2 of ~3. N decisions captured."

**Delegation:** If user says "you decide," accept recommended defaults. Document
each delegated decision with rationale.

**Contradiction detection:** If answers conflict, flag immediately: "Decision N
said X, but this implies Y. Which takes priority?"

**Mid-discovery check (MUST after batch 2):** "Discovery progress: N questions,
M decisions. Estimated ~K more. Continue or scope-reduce?"

**Done when:** All 6 categories covered, no remaining ambiguity.

---

## Phase 3: Planning + Approval (MUST)

1. Compile decision record — one row per decision, choice + rationale (MUST)
2. Present skill structure plan (MUST):
   - Files to create (SKILL.md, REFERENCE.md, scripts/, etc.)
   - Section outline for SKILL.md
   - Guard rails and failure modes
   - Integration surface (neighbors, handoffs)
   - Compaction resilience design
3. Present for approval (MUST): "Here's the planned structure. Proceed? [approve
   / approve with changes / reject]"

**Revision:** If writing later reveals a planning decision was wrong, pause,
note the revision, confirm with user before continuing.

**Done when:** User approves plan.

---

## Phase 4: Build (MUST)

### 4.1 Input Validation (MUST)

Validate skill name: lowercase-kebab-case, no spaces, max 40 chars. Check
`.claude/skills/` for existing skill. If exists and malformed, offer repair or
fresh start.

### 4.2 Scaffold

Run `init_skill.py <name> --path .claude/skills` for new skills. Skip for
updates.

### 4.3 Write SKILL.md

> Read REFERENCE.md for the full content checklist (MUST/SHOULD items).

**Structure for attention management:**

1. Top third (1-100): Critical rules, MUST behaviors, process overview
2. Middle third (100-200): Step-by-step procedures, checklists
3. Bottom third (200-300): Guard rails, compaction, version history

**Point-of-use reminders (MUST):**

- Repeat "under 300 lines" in the validation phase
- Repeat "MUST/SHOULD/MAY" where instructions are written
- Repeat "front-load critical rules" in the writing phase

**Project conventions:** Reference CLAUDE.md by path. Do NOT duplicate
conventions into the skill.

**Data standards:** If skill produces data files, SHOULD use JSONL as canonical
format with .md for human readability.

### 4.4 Write Companions (SHOULD)

Extract to REFERENCE.md if SKILL.md approaches 300 lines. Move examples,
templates, question banks to companion files.

**Done when:** All files written, content checklist addressed.

---

## Phase 5: Validate (MUST)

1. Run `npm run skills:validate` (MUST) — structural check
2. Walk the content checklist from REFERENCE.md (MUST) — for each unchecked
   item, either address it or document why not applicable
3. Verify line count under 300 (MUST)
4. Verify cross-references resolve (SHOULD)

**Done when:** `skills:validate` passes, behavioral checklist addressed, under
300 lines.

---

## Phase 6: Audit (MUST)

Run `/skill-audit <skill-name>` on the created skill. The audit verifies
behavioral quality that structural validation cannot catch.

**Done when:** Skill-audit complete, findings addressed.

## Phase 7: Closure (MUST)

1. **Closure signal** (MUST): List all created/modified files with paths
2. **Retro prompt** (MUST): "What did discovery surface that you didn't expect?
   What did the checklist catch? What would you do differently?" Capture in
   state file `process_feedback`.
3. **Invocation tracking** (MUST):
   ```bash
   cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"skill-creator","type":"skill","success":true,"context":{"target":"SKILL_NAME"}}'
   ```
4. **Session cleanup** (SHOULD): Commit created skill files. State file retained
   as creation record. Run `/session-end` if ending session.
5. **Version history** (MUST): WHAT changed + WHY in every entry.

---

## Guard Rails

- **Contradiction:** Flag conflicting requirements immediately
- **Scope explosion:** If planned skill exceeds 300 lines + 3 companions + 5
  scripts, pause: "This is growing large. Split into multiple skills?"
- **Phase gates:** MUST complete Phase 1 before Phase 2. MUST have approved plan
  (Phase 3) before Phase 4.
- **Disengagement:** If user stops mid-skill, save state, list files created,
  offer cleanup (delete partial work or keep for later)

## Anti-Patterns (MUST avoid)

1. Monolithic SKILL.md over 300 lines without companions
2. Generic `[TODO]` or `[placeholder]` text — use guided prompts
3. Duplicating CLAUDE.md conventions into skill files
4. All instructions at same volume (no MUST/SHOULD/MAY distinction)
5. No skip conditions on optional steps
6. Using AskUserQuestion for interactive decisions — use conversational Q&A
   (deep-plan style: present in batches, collect decisions via conversation)
7. Audit-type skills without separate self-audit AND verification phases —
   self-audit checks process quality, verification re-runs to confirm fixes
8. Presenting suggestions without multi-option format when genuine alternatives
   exist — each option needs description, pros/cons, and a recommendation
9. Script-dependent skills without failure handling — if a skill runs external
   scripts, MUST handle non-zero exit, malformed output, and timeouts
10. Interactive skills with large item sets without batch management — if a
    skill could present >20 interactive items, MUST include delegation protocol
    ("you decide"), severity-based filtering ("skip remaining INFO"), and batch
    actions
11. Skills without invocation tracking — all skills SHOULD log invocations via
    `write-invocation.js` in their closure phase for usage analysis

## Compaction Resilience

- **State file:** `.claude/state/skill-creator.state.json`
- **Update:** After every phase boundary and every discovery batch
- **Contents:** Skill name, discovery decisions, planning checklist, current
  phase, files created, process feedback
- **Recovery:** Re-invoke `/skill-creator <skill-name>` to read state and resume
- **Retention:** State file retained after completion as creation record and
  artifact contract for `/skill-audit` handoff

## Integration

- **Neighbors:** `/skill-audit` (audit created skill), `/skill-ecosystem-audit`
  (check all skills), `/create-audit` (audit-specific scaffolding)
- **References:** [SKILL_STANDARDS.md](../_shared/SKILL_STANDARDS.md),
  [SKILL_AGENT_POLICY.md](../../../docs/agent_docs/SKILL_AGENT_POLICY.md)
- **Handoff:** State file documents intent + discovery decisions for skill-audit

---

## Version History

| Version | Date       | Description                                                        |
| ------- | ---------- | ------------------------------------------------------------------ |
| 3.0     | 2026-03-08 | Full rewrite from 52-decision audit (48/100 -> target 82/100)      |
| 2.2     | 2026-03-07 | SC-1..5: operational deps, compaction MUST, scope, recommendations |
| 2.1     | 2026-03-06 | Add interactive design, verification phase, UX                     |
| 2.0     | 2026-02-28 | Add attention management, behavioral quality, guards               |
| 1.0     | 2026-02-25 | Initial implementation (Anthropic skill, Apache 2.0)               |
