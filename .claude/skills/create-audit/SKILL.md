---
name: create-audit
description: >-
  Interactive wizard for creating any type of audit — code, process,
  infrastructure, ecosystem, or custom. Uses extensive multi-agent discovery and
  deep-plan Q&A to produce audit skills, multi-AI templates, and TDMS-ready
  output through a structured, approval-gated workflow.
---

# Create Audit Wizard

<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-03-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Interactive skill that creates audit infrastructure for any domain in this
repository — code quality, processes, ecosystems, infrastructure, workflows,
documentation, or anything else that exists here. Produces audit skills,
multi-AI templates, output directories, and TDMS-ready integration through
extensive discovery and approval-gated generation.

## Critical Rules (MUST follow)

1. **Extensive discovery before writing** — MUST complete multi-agent codebase
   exploration (with convergence loop) and deep-plan Q&A before generating any
   files. No skipping ahead.
2. **Approval gate before generation** — MUST present planned structure and get
   explicit approval before creating files. Irreversible actions need gates.
3. **Run `/skill-audit` on every created audit** — MUST run `/skill-audit` on
   the generated audit as a Phase 5 validation gate, not just a post-creation
   suggestion.
4. **Generated audits MUST follow SKILL_STANDARDS.md** — routing table, When NOT
   to Use, MUST/SHOULD/MAY, compaction resilience, learning loop, invocation
   tracking. Reference CLAUDE.md by path, don't duplicate conventions.
5. **Generated scripts MUST follow CLAUDE.md Section 5** — error sanitization
   via `scripts/lib/sanitize-error.js`, path traversal checks, try/catch on file
   reads. Reference [CLAUDE.md](../../CLAUDE.md) Section 5 for full list.
6. **Use conversational Q&A** — MUST use deep-plan style batched questions with
   recommendations. NEVER use AskUserQuestion.
7. **Persist state incrementally** — save to state file after every phase and
   every Phase 4 sub-step. Long creation sessions WILL hit compaction.
8. **TDMS pipeline scripts** — generated audits MUST use: `validate-schema.js`,
   `intake-audit.js`, `generate-views.js`, `generate-metrics.js` (all in
   `scripts/debt/`).

## When to Use

- Creating a new audit type from scratch (any domain)
- Scaffolding audit infrastructure for a new domain
- Adding a new audit category to the project
- User explicitly invokes `/create-audit`

## When NOT to Use

- Running an existing audit — use `/audit-<name>`
- Evaluating audit quality — use `/skill-audit`
- Creating a non-audit skill — use `/skill-creator`
- Checking all audits are healthy — use `/audit-health`
- Aggregating audit results — use `/audit-aggregator`

## What This Skill Does NOT Do

- Run audits (use the generated `/audit-<name>` skill)
- Modify existing audits (edit the skill directly or run `/skill-audit`)
- Aggregate audit results (use `/audit-aggregator`)
- Evaluate audit quality (use `/skill-audit`)

## Routing Guide

| Situation               | Use                       | Why                                                               |
| ----------------------- | ------------------------- | ----------------------------------------------------------------- |
| Create new audit type   | `/create-audit`           | Audit-specific scaffolding + TDMS                                 |
| Create non-audit skill  | `/skill-creator`          | General skill creation workflow                                   |
| Evaluate audit quality  | `/skill-audit`            | Behavioral quality assessment                                     |
| Run all audits          | `/audit-comprehensive`    | Orchestrates existing audits                                      |
| Plan audit as GSD phase | `/gsd:plan-phase`         | GSD manages milestones; create-audit manages audit infrastructure |
| Quick structural check  | `npm run skills:validate` | Fast, no AI needed                                                |

> `/create-audit` is the specialized path for audit-type skills. It provides
> audit-specific scaffolding that `/skill-creator` doesn't: TDMS integration,
> multi-AI template generation, finding JSONL schemas, audit type taxonomy,
> domain-based agent architecture, and output directory setup. For simple
> interactive review audits (Type 3) without TDMS integration or multi-AI
> templates, `/skill-creator` may be sufficient. Use `/create-audit` when
> audit-specific scaffolding (findings schema, output directory, TDMS intake) is
> needed.

## Input

**Argument:** Audit name or description, passed as `/create-audit <name>` or in
conversation context. Name must be lowercase-kebab-case, max 40 chars. If not
provided, will be inferred during discovery.

**Output location:** `.claude/skills/audit-<name>/` for skills,
`docs/audits/multi-ai/templates/` for multi-AI templates.

> See REFERENCE.md "Output Manifest" for complete file list with paths and
> conditions.

---

## Process Overview

```
WARM-UP    Orientation    -> Audit name, process overview, effort estimate
PHASE 1    Context        -> ROADMAP check, scan existing audits, name validation, exemplar scan
PHASE 2    Discovery      -> Audit type, multi-agent exploration (with CL), deep-plan Q&A
PHASE 3    Planning       -> Decision record + structure plan + approval gate
PHASE 4    Build          -> Generate skill, template, directory, supporting files
PHASE 5    Validate       -> Structural + functional + skill-audit validation
PHASE 6    Self-Audit     -> Evidence-based verification of generated files
PHASE 7    Closure        -> Handoff, learning loop, invocation tracking
```

Use phase markers: `======== PHASE N: [NAME] ========`

---

## Warm-Up (MUST)

Present before any work: audit name, process overview (7 phases), effort
estimate (single-session: ~20 min, ecosystem: ~30 min, interactive: ~40 min,
hybrid: ~40 min+), audit type preview if inferable from name. Input constraints:
name must be lowercase-kebab-case, max 40 chars.

"Before we start: any specific constraints, existing audit patterns you want
this to follow, or concerns about this audit type?"

**Done when:** User confirms proceed.

---

## Phase 1: Context (MUST)

1. Check ROADMAP.md — verify audit aligns with project direction (MUST). **If
   misaligned:** present conflict, offer proceed/reframe/abort.
2. **Validate name** (MUST) — lowercase-kebab-case, max 40 chars. Check
   `.claude/skills/audit-*` for existing skill. If exists, offer repair or fresh
   start. Catching collisions here prevents wasted discovery/planning.
3. Scan `.claude/skills/audit-*` and `docs/audits/` for existing audits (MUST) —
   identify overlaps and potential duplicates
4. **Exemplar scanning** (MUST) — dispatch Explore agents to find 2-3 existing
   audits most similar to the requested type. Present as reference patterns:
   "Your audit is most like X (pattern) and Y (pattern). Use as base?"
5. **Dynamic category discovery** (SHOULD) — scan existing audit infrastructure
   to build current category list. Do NOT use a hardcoded list.
6. Check CLAUDE.md for relevant conventions (MUST)

**Reframe path:** If existing audit already covers the domain, present options:
extend existing audit, create specialized sub-audit, or proceed with new audit.

**Done when:** Context gathered, name validated, no conflicts, exemplars
identified.

---

## Phase 2: Discovery (MUST)

> Read `.claude/skills/create-audit/REFERENCE.md` for the audit type taxonomy,
> question categories, and example questions.

### 2.1 Determine Audit Type (MUST)

Present the audit type taxonomy. User selects or describes a hybrid:

1. **Single-session multi-agent** — parallel agents analyze domains, synthesis
   agent merges (like `audit-code`, `audit-security`)
2. **Ecosystem diagnostic** — script-based checkers with interactive walkthrough
   (like `script-ecosystem-audit`, `hook-ecosystem-audit`)
3. **Interactive review** — category-by-category evaluation with user decisions
   (like `skill-audit`)
4. **Custom hybrid** — combines elements from multiple types

### 2.2 Multi-Agent Codebase Exploration (MUST)

**(Critical Rule 1: discovery MUST be complete before writing.)**

Dispatch Explore agents to scan the codebase for patterns relevant to the audit
domain. Agents should identify: relevant files/directories, existing patterns,
common issues, and potential domains to audit.

**Convergence loop (MUST per T25):** Minimum 2 passes on exploration.

- Pass 1: Explore agents scan codebase for audit-relevant patterns
- Pass 2: Verify findings are complete — check for missed directories, patterns,
  or domains. Correct any inaccuracies from Pass 1.
- Present T20 tally (Confirmed/Corrected/Extended/New) before proceeding.
- **User gate:** "Exploration found N patterns across M directories. Anything
  missing from this picture?" Wait for confirmation before Q&A.

### 2.3 Deep-Plan Q&A (MUST)

> Read REFERENCE.md for question categories and examples per audit type.

**Discovery rules (MUST follow):**

1. **Floor of ~15 questions, no ceiling** — ask until ambiguity is resolved
2. **Batch 4-6 related questions** — group by category, critical first
3. **Recommend with rationale per question** — "I recommend X because Y"
4. **Inter-batch synthesis** — summarize learnings before next batch
5. **Inference handling** — "Based on your name 'security', inferring domains:
   [auth, input validation, secrets, dependencies]. Override?"
6. **Contradiction detection** — flag conflicting answers immediately
7. **Delegation** — if user says "you decide," accept recommended defaults
8. **Save decisions with rationale after every batch** (MUST) — include WHY per
   decision in state file
9. **Show progress** — "Batch 2 of ~4. N decisions captured."
10. **Cross-batch revision** (MUST) — if a later batch answer conflicts with an
    earlier decision, present the conflict and allow revision. Update state file
    with the revised decision.

**Post-discovery prompt (MUST):** "Discovery complete. Anything the questions
didn't cover, or concerns before we plan?"

**Done when:** Audit type determined, domains defined, architecture decided,
user confirms nothing missing.

---

## Phase 3: Planning + Approval (MUST)

**(Critical Rule 2: approval gate before generation.)**

1. Compile decision record — one row per decision, choice + rationale (MUST)
2. Present planned structure (MUST):
   - Files to create (skill, template, directory, supporting file updates)
   - Section outline for generated SKILL.md
   - Agent architecture (count, domains, stages)
   - Integration surface (TDMS, comprehensive, COMMAND_REFERENCE)
3. **Preview generated structure** — show what will be created before writing
4. Present for approval (MUST): "Here's the planned structure. Proceed? [approve
   / approve with changes / redo discovery / abort]"

**Abort:** Triggers disengagement protocol (see REFERENCE.md Guard Rails).

**Done when:** User approves plan.

---

## Phase 4: Build (MUST)

> Read REFERENCE.md for generation templates per audit type.

### 4.1 Confirm Name (MUST)

Final confirmation of name validated in Phase 1. If name was inferred during
discovery, confirm with user now.

Build step 1 of 5. Save state after completion.

### 4.2 Generate Audit Skill (MUST)

Generate `.claude/skills/audit-<name>/SKILL.md` using the appropriate template
from REFERENCE.md based on audit type. Generated skill MUST include:

- Routing table, When to Use, When NOT to Use (MUST)
- MUST/SHOULD/MAY hierarchy (MUST)
- Compaction resilience (MUST for long-running types)
- Learning loop with auto-learnings (MUST)
- Invocation tracking (SHOULD)
- CLAUDE.md reference by path (MUST — don't duplicate conventions)
- CLAUDE.md Section 5 security patterns for scripts (MUST)
- Under 300 lines (MUST — extract to companion files if needed)

**Replace all generic placeholders** with guided prompts based on discovery
answers. No `<Specific instructions>` or `<TODO>` text.

**Inline quality check (MUST):** After generating, immediately verify: (1) line
count < 300, (2) no unresolved `{placeholder}` text, (3) all MUST sections
present per SKILL_STANDARDS.md. Fix inline before proceeding.

Build step 2 of 5. Save state after completion.

### 4.3 Generate Multi-AI Template (SHOULD)

Generate `docs/audits/multi-ai/templates/<NAME>_AUDIT.md` using template from
REFERENCE.md. Skip if audit type doesn't suit multi-AI execution.

Build step 3 of 5. Save state after completion.

### 4.4 Create Output Directory (MUST)

```bash
mkdir -p docs/audits/single-session/<name>
```

Build step 4 of 5. Save state after completion.

### 4.5 Update Supporting Files (SHOULD)

Update with full paths:

- `.claude/COMMAND_REFERENCE.md` — add skill entry (MUST)
- `.claude/skills/audit-comprehensive/SKILL.md` — add to audit list (SHOULD)
- `docs/audits/AUDIT_TRACKER.md` — add threshold row (SHOULD)
- `.claude/skills/SKILL_INDEX.md` — add skill entry (SHOULD)
- `docs/audits/multi-ai/README.md` — update template count (SHOULD)
- `docs/audits/README.md` — add to inventory (SHOULD)

Build step 5 of 5. Save state after completion.

**Done when:** All files generated, supporting files updated.

---

## Phase 5: Validate (MUST)

1. Run `npm run skills:validate` (MUST)
2. Verify generated SKILL.md is under 300 lines (MUST)
3. Verify cross-references resolve (MUST) — all referenced scripts exist, all
   paths are valid
4. **Functional validation checklist** (MUST):
   - [ ] All referenced scripts exist (`validate-schema.js`, `intake-audit.js`,
         `generate-views.js`, `generate-metrics.js`)
   - [ ] Agent prompts reference valid output paths
   - [ ] JSONL schema matches `validate-schema.js` expectations
   - [ ] TDMS pipeline scripts are correctly invoked in post-audit section
   - [ ] Generated skill has all SKILL_STANDARDS.md MUST sections
5. **Run `/skill-audit` on generated audit** (MUST) — behavioral quality gate.
   Address findings before proceeding.
6. Run `npm run crossdoc:check` (SHOULD)

**Done when:** All validation passes, `/skill-audit` findings addressed.

---

## Phase 6: Self-Audit (MUST)

Re-read all generated files. Verify against the decision record from Phase 3
using evidence-based methods:

1. **Grep-based proof** (MUST) — for each accepted decision, grep the generated
   file for a keyword that proves implementation. Cite the result.
2. Every accepted decision is reflected in the output (MUST)
3. Generated skill follows SKILL_STANDARDS.md (MUST)
4. No generic placeholders remain (MUST)
5. All templates populated with discovery-specific content (MUST)
6. **T20 tally** (MUST) — categorize verification results: Confirmed (decision
   implemented as expected), Corrected (implementation differs), Extended
   (beyond decision), New (unmapped content).

**Done when:** All decisions verified with evidence, T20 tally presented.

---

## Phase 7: Closure (MUST)

1. **Artifact manifest** (MUST): list all created/modified files with paths
2. **Post-creation action plan** (MUST):
   - "Test the audit: `/audit-<name>`"
   - "Update ROADMAP.md if this was planned work"
3. **Learning loop** (MUST): Generate 2-3 auto-learnings (audit type patterns,
   template usage, discovery effectiveness). Save to state file.
4. **Optional user feedback** (SHOULD): "Any steps to add, remove, or reorder?"
   Accept empty / "none." If provided, save to state file.
5. **On next startup** (MUST): Surface previous learnings and feedback.
6. **Invocation tracking** (MUST):
   ```bash
   cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"create-audit","type":"skill","success":true,"context":{"target":"AUDIT_NAME"}}'
   ```

**Done when:** Artifact manifest presented, invocation tracked, user confirms
closure.

---

> Read `.claude/skills/create-audit/REFERENCE.md` for: Guard Rails,
> Anti-Patterns, Integration, Artifact Contracts, Compaction Resilience details,
> and generation templates.

## Compaction Resilience

- **State file:** `.claude/state/task-create-audit-{name}.state.json`
- **Update:** After every phase boundary, every discovery batch, and every Phase
  4 sub-step
- **Contents:** Audit name, type, discovery decisions, planning checklist,
  current phase, current sub-step, files created
- **Recovery:** Re-invoke `/create-audit <name>` to read state and resume
- **Session-end:** If `/session-end` is invoked mid-creation, state file
  persists. Next session: re-invoke `/create-audit <name>` to resume.

---

## Version History

| Version | Date       | Description                                                                                                                          |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 3.0     | 2026-03-16 | Skill-audit: 32 decisions, 75→88 target. CL on discovery, evidence self-audit, Phase 5 skill-audit gate, full paths, output manifest |
| 2.0     | 2026-03-08 | Full rewrite from skill-audit: 65 decisions (33→82 target)                                                                           |
| 1.0     | 2026-02-14 | Initial creation                                                                                                                     |
