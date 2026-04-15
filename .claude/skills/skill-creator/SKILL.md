---
name: skill-creator
description: >-
  Structured workflow for creating or updating skills — from discovery through
  validation and audit. Produces structurally correct, behaviorally effective
  skill packages (SKILL.md + companions) using deep-plan-style discovery with
  skill-specific question categories and convergence-loop verification of
  codebase claims.
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
4. **Extraction context (MUST):** Scan `.research/EXTRACTIONS.md` for candidates
   relevant to the skill being created (human-readable, grouped by source). For
   targeted filtering, query `.research/extraction-journal.jsonl` (match by
   type, tags in notes, or source domain). If matches found, present as "Prior
   art from analyzed sources" — these are patterns, architectures, and design
   principles already identified from external repos/websites that may inform
   the skill's design.
5. Read existing skill files if updating (MUST for updates)
6. **Domain research check** (SHOULD) — if the skill being created covers a
   domain the AI lacks expertise in (unfamiliar technology, specialized
   workflow, external ecosystem), suggest: "This skill targets a domain that
   would benefit from research. Run `/deep-research` first to understand the
   landscape?" Prior research at `.research/<topic-slug>/` feeds directly into
   better discovery questions and informed defaults in Phase 2.

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
8. **Save decisions with rationale after every batch** (MUST) — persist to state
   file, include WHY per decision
9. **Show progress** — "Batch 2 of ~3. N decisions captured."
10. **Multi-agent exploration** (SHOULD for Complex) — dispatch Explore agents
    to scan the codebase for relevant patterns before presenting questions.
    Findings inform defaults and recommendations.
11. **Cross-batch revision** (MUST) — if a later batch answer conflicts with an
    earlier decision, present the conflict and allow revision. Update state file
    with the revised decision.
12. **Self-audit design** (MUST for Standard/Complex) — discovery MUST include
    questions about the created skill's self-audit phase. See REFERENCE.md
    Category 2 for the self-audit design questions.

**Delegation:** If user says "you decide," accept recommended defaults. Document
each delegated decision with rationale.

**Contradiction detection:** If answers conflict, flag immediately: "Decision N
said X, but this implies Y. Which takes priority?"

**Mid-discovery check (MUST after batch 2):** "Discovery progress: N questions,
M decisions. Estimated ~K more. Continue or scope-reduce?"

**Post-discovery prompt (MUST):** "Discovery complete. Anything the questions
didn't cover, or concerns before we plan?"

**Done when:** All 6 categories covered, no remaining ambiguity, user confirms
nothing missing.

---

## Phase 3: Planning + Approval (MUST)

1. Compile decision record — one row per decision, choice + rationale (MUST)
2. Present skill structure plan (MUST):
   - Files to create (SKILL.md, REFERENCE.md, scripts/, etc.)
   - Section outline for SKILL.md
   - Guard rails and failure modes
   - Integration surface (neighbors, handoffs)
   - Compaction resilience design
   - **Self-audit phase design** (MUST for Standard/Complex) — list expected
     output artifacts to verify, verification agents to dispatch, orphan
     detection scope, and downstream contract checks. Reference
     SKILL_STANDARDS.md "Self-Audit at Completion" for the 9 dimensions.
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

**Convergence-loop integration (SHOULD):** If Phase 2 discovery identified a
discovery or verification phase in the skill being created (T25 question), wire
convergence-loop programmatic mode into that phase. Reference
`/convergence-loop` SKILL.md "Programmatic Mode" section for the integration
contract.

**Self-audit phase (MUST for Standard/Complex):** Two parts.

1. **Prose phase in SKILL.md** — write a self-audit phase as the penultimate
   phase (before Closure). Reference SKILL_STANDARDS.md "Self-Audit at
   Completion" for the 9 verification dimensions. Customize with the skill's
   specific deliverables, downstream contracts, and regression detection needs
   from Phase 3 planning.
2. **Scaffold the script** — create `scripts/skills/<skill-name>/self-audit.js`
   per [SELF_AUDIT_PATTERN.md](../_shared/SELF_AUDIT_PATTERN.md). Use
   `scripts/skills/skill-audit/self-audit.js` as the template and replace
   domain-specific dimension checks. The Phase 5 prose in SKILL.md MUST invoke
   this script first (per pattern doc §Wiring to SKILL.md Phase 5), with prose
   handling judgment-only checks afterwards.

If skill is Simple tier (<50 lines, reference-only), skip both parts — the "Done
when:" gate is sufficient per SKILL_STANDARDS.md.

### 4.4 Write Companions (SHOULD)

Extract to REFERENCE.md if SKILL.md approaches 300 lines. Move examples,
templates, question banks to companion files.

**Done when:** All files written, content checklist addressed.

---

## Phase 5: Validate (MUST)

1. Run `npm run skills:validate` (MUST) — structural check
2. Walk the content checklist from REFERENCE.md (MUST) — for each unchecked
   item, either address it or document why not applicable
3. **Convergence-loop verify** (MUST for Complex, SHOULD for Standard) — verify
   created skill's codebase claims (neighbors, integration points, existing
   patterns) via convergence-loop quick preset. Skip if skill makes no codebase
   claims. **If claims are wrong:** fix in created skill files (Phase 4
   re-entry) before continuing validation.
4. Verify line count under 300 (MUST)
5. Verify cross-references resolve (SHOULD)
6. **Evidence-based self-check** (MUST) — re-read all created files. For each
   planning decision from Phase 3, grep the output file for a keyword proving
   implementation. Decisions with no grep match are MISSING — fix before
   proceeding to Phase 6. See SKILL_STANDARDS.md "Self-Audit at Completion."

7. **Self-audit phase present** (MUST for Standard/Complex) — verify both: (a)
   SKILL.md includes a self-audit phase positioned as penultimate, referencing
   SKILL_STANDARDS.md dimensions appropriate to tier; (b)
   `scripts/skills/<name>/self-audit.js` exists and follows
   [SELF_AUDIT_PATTERN.md](../_shared/SELF_AUDIT_PATTERN.md) (matching CLI
   shape, exit codes, SUMMARY block, required helpers).
8. **Contract verification wired** (MUST if downstream consumers) — verify the
   self-audit checks output against documented consumer expectations

**Done when:** `skills:validate` passes, behavioral checklist addressed, under
300 lines, codebase claims verified, all decisions grep-verified, self-audit
phase present (Standard/Complex).

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
   cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"skill-creator","type":"skill","success":true,"schema_version":1,"completeness":"stub","origin":{"type":"manual"},"context":{"target":"SKILL_NAME"}}'
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

## Anti-Patterns

> Read REFERENCE.md "Anti-Patterns" section for the full 12-item list of common
> skill creation mistakes (MUST check during Phase 4 Build).

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
  (check all skills), `/create-audit` (audit-specific scaffolding),
  `/convergence-loop` (Phase 4.3: wire into created skill if T25 applies; Phase
  5: verify created skill's codebase claims)
- **References:** [SKILL_STANDARDS.md](../_shared/SKILL_STANDARDS.md) (Phase 5
  content checklist), [SELF_AUDIT_PATTERN.md](../_shared/SELF_AUDIT_PATTERN.md)
  (Phase 4.3 scaffold + Phase 5 verification),
  [SKILL_AGENT_POLICY.md](../../../docs/agent_docs/SKILL_AGENT_POLICY.md)
- **Handoff:** State file documents intent + discovery decisions for skill-audit

---

## Version History

| Version | Date       | Description                                                                          |
| ------- | ---------- | ------------------------------------------------------------------------------------ |
| 3.4     | 2026-04-14 | Phase 4.3 + 5.7: scaffold + verify scripts/skills/<name>/self-audit.js per pattern   |
| 3.3     | 2026-04-04 | Add mandatory self-audit phase for Standard/Complex skills (9 dimensions)            |
| 3.2     | 2026-03-15 | Skill-audit: CL verify MUST for Complex, reorder Phase 5, anti-patterns to REFERENCE |
| 3.1     | 2026-03-15 | Convergence-loop integration: Phase 4.3 build + Phase 5 verify                       |
| 3.0     | 2026-03-08 | Full rewrite from 52-decision audit (48/100 -> target 82/100)                        |
| 2.2     | 2026-03-07 | SC-1..5: operational deps, compaction MUST, scope, recommendations                   |
| 2.1     | 2026-03-06 | Add interactive design, verification phase, UX                                       |
| 2.0     | 2026-02-28 | Add attention management, behavioral quality, guards                                 |
| 1.0     | 2026-02-25 | Initial implementation (Anthropic skill, Apache 2.0)                                 |
