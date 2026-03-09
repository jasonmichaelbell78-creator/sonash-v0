---
name: create-audit
description: >-
  Interactive wizard for creating any type of audit — code, process,
  infrastructure, ecosystem, or custom. Uses extensive multi-agent discovery and
  deep-plan Q&A to produce audit skills, multi-AI templates, and TDMS
  integration through a structured, approval-gated workflow.
---

# Create Audit Wizard

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Interactive skill that creates audit infrastructure for any domain in this
repository — code quality, processes, ecosystems, infrastructure, workflows,
documentation, or anything else that exists here. Produces audit skills,
multi-AI templates, output directories, and TDMS integration through extensive
discovery and approval-gated generation.

## Critical Rules (MUST follow)

1. **Extensive discovery before writing** — MUST complete multi-agent codebase
   exploration and deep-plan Q&A before generating any files. No skipping ahead.
2. **Approval gate before generation** — MUST present planned structure and get
   explicit approval before creating files. Irreversible actions need gates.
3. **Run `/skill-audit` on every created audit** — MUST prompt user to run
   `/skill-audit` on the generated audit before considering it complete.
4. **Generated audits MUST follow SKILL_STANDARDS.md** — routing table, When NOT
   to Use, MUST/SHOULD/MAY, compaction resilience, learning loop, invocation
   tracking. Reference CLAUDE.md by path, don't duplicate conventions.
5. **Use conversational Q&A** — MUST use deep-plan style batched questions with
   recommendations. NEVER use AskUserQuestion.
6. **Persist state incrementally** — save to state file after every phase. Long
   creation sessions WILL hit compaction.

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

| Situation              | Use                       | Why                               |
| ---------------------- | ------------------------- | --------------------------------- |
| Create new audit type  | `/create-audit`           | Audit-specific scaffolding + TDMS |
| Create non-audit skill | `/skill-creator`          | General skill creation workflow   |
| Evaluate audit quality | `/skill-audit`            | Behavioral quality assessment     |
| Run all audits         | `/audit-comprehensive`    | Orchestrates existing audits      |
| Quick structural check | `npm run skills:validate` | Fast, no AI needed                |

> `/create-audit` is the specialized path for audit-type skills. It provides
> audit-specific scaffolding that `/skill-creator` doesn't: TDMS integration,
> multi-AI template generation, finding JSONL schemas, audit type taxonomy,
> domain-based agent architecture, and output directory setup.

## Input

**Argument:** Audit name or description, passed as `/create-audit <name>` or in
conversation context.

**Output location:** `.claude/skills/audit-<name>/` for skills,
`docs/audits/multi-ai/templates/` for multi-AI templates.

---

## Process Overview

```
WARM-UP    Orientation    -> Audit name, process overview, effort estimate
PHASE 1    Context        -> ROADMAP check, scan existing audits, exemplar scan
PHASE 2    Discovery      -> Audit type, multi-agent exploration, deep-plan Q&A
PHASE 3    Planning       -> Decision record + structure plan + approval gate
PHASE 4    Build          -> Generate skill, template, directory, supporting files
PHASE 5    Validate       -> Structural + functional validation
PHASE 6    Self-Audit     -> Verify generated files are complete and correct
PHASE 7    Closure        -> Handoff, learning loop, invocation tracking
```

Use phase markers: `======== PHASE N: [NAME] ========`

---

## Warm-Up (MUST)

Present before any work: audit name, process overview (7 phases), effort
estimate (single-session: ~20 min, ecosystem: ~30 min, interactive: ~40 min,
hybrid: ~40 min+), audit type preview if inferable from name.

"Before we start: any specific constraints, existing audit patterns you want
this to follow, or concerns about this audit type?"

**Done when:** User confirms proceed.

---

## Phase 1: Context (MUST)

1. Check ROADMAP.md — verify audit aligns with project direction (MUST). **If
   misaligned:** present conflict, offer proceed/reframe/abort.
2. Scan `.claude/skills/audit-*` and `docs/audits/` for existing audits (MUST) —
   identify overlaps and potential duplicates
3. **Exemplar scanning** (MUST) — dispatch Explore agents to find 2-3 existing
   audits most similar to the requested type. Present as reference patterns:
   "Your audit is most like X (pattern) and Y (pattern). Use as base?"
4. **Dynamic category discovery** (MUST) — scan existing audit infrastructure to
   build current category list. Do NOT use a hardcoded list.
5. Check CLAUDE.md for relevant conventions (MUST)

**Reframe path:** If existing audit already covers the domain, present options:
extend existing audit, create specialized sub-audit, or proceed with new audit.

**Done when:** Context gathered, no conflicts, exemplars identified.

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

Dispatch Explore agents to scan the codebase for patterns relevant to the audit
domain. Agents should identify: relevant files/directories, existing patterns,
common issues, and potential domains to audit.

Present findings to user before proceeding to Q&A.

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
8. **Save decisions after every batch** (MUST)
9. **Show progress** — "Batch 2 of ~4. N decisions captured."

**Done when:** Audit type determined, domains defined, architecture decided.

---

## Phase 3: Planning + Approval (MUST)

1. Compile decision record — one row per decision, choice + rationale (MUST)
2. Present planned structure (MUST):
   - Files to create (skill, template, directory, supporting file updates)
   - Section outline for generated SKILL.md
   - Agent architecture (count, domains, stages)
   - Integration surface (TDMS, comprehensive, COMMAND_REFERENCE)
3. **Preview generated structure** — show what will be created before writing
4. Present for approval (MUST): "Here's the planned structure. Proceed? [approve
   / approve with changes / redo discovery]"

**Done when:** User approves plan.

---

## Phase 4: Build (MUST)

> Read REFERENCE.md for generation templates per audit type.

### 4.1 Validate Name (MUST)

Lowercase-kebab-case, no spaces, max 40 chars. Check `.claude/skills/audit-*`
for existing skill. If exists, offer repair or fresh start.

### 4.2 Generate Audit Skill (MUST)

Generate `.claude/skills/audit-<name>/SKILL.md` using the appropriate template
from REFERENCE.md based on audit type. Generated skill MUST include:

- Routing table, When to Use, When NOT to Use (MUST)
- MUST/SHOULD/MAY hierarchy (MUST)
- Compaction resilience (MUST for long-running types)
- Learning loop with auto-learnings (MUST)
- Invocation tracking (SHOULD)
- CLAUDE.md reference by path (MUST — don't duplicate conventions)
- Under 300 lines (MUST — extract to companion files if needed)

**Replace all generic placeholders** with guided prompts based on discovery
answers. No `<Specific instructions>` or `<TODO>` text.

### 4.3 Generate Multi-AI Template (SHOULD)

Generate `docs/audits/multi-ai/templates/<NAME>_AUDIT.md` using template from
REFERENCE.md. Skip if audit type doesn't suit multi-AI execution.

### 4.4 Create Output Directory (MUST)

```bash
mkdir -p docs/audits/single-session/<name>
```

### 4.5 Update Supporting Files (SHOULD)

- AUDIT_TRACKER.md — add threshold row (SHOULD)
- SKILL_INDEX.md — add skill entry (SHOULD)
- multi-ai-audit/README.md — update template count (SHOULD)
- docs/audits/README.md — add to inventory (SHOULD)
- COMMAND_REFERENCE.md — add skill entry (MUST)

**Done when:** All files generated, supporting files updated.

---

## Phase 5: Validate (MUST)

1. Run `npm run skills:validate` (MUST)
2. Verify generated SKILL.md is under 300 lines (MUST)
3. Verify cross-references resolve (MUST) — all referenced scripts exist, all
   paths are valid
4. **Functional validation** (MUST) — verify the generated audit can be invoked
   without immediate errors. Check agent prompts reference valid paths, JSONL
   schema is correct, TDMS scripts exist.
5. Run `npm run crossdoc:check` (SHOULD)

**Done when:** All validation passes.

---

## Phase 6: Self-Audit (MUST)

Re-read all generated files. Verify against the decision record from Phase 3:

1. Every accepted decision is reflected in the output (MUST)
2. Generated skill follows SKILL_STANDARDS.md (MUST)
3. No generic placeholders remain (MUST)
4. All templates populated with discovery-specific content (MUST)

**Done when:** All decisions verified in output.

---

## Phase 7: Closure (MUST)

1. **Artifact manifest** (MUST): list all created/modified files with paths
2. **Post-creation action plan** (MUST):
   - "Run `/skill-audit <name>` to verify quality"
   - "Test the audit: `/audit-<name>`"
   - "Consider adding to `/audit-comprehensive`"
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

---

## Guard Rails

- **Scope explosion:** If >8 domains + 3 stages + 2 template types, pause: "This
  is growing large. Split into multiple audits?"
- **Contradiction detection:** Flag conflicting config (sequential + 6 agents,
  security category + documentation domains)
- **Reframe path:** If existing audit covers domain, offer extend/sub-audit
- **Disengagement:** If user stops mid-creation, save state, list files, offer:
  (1) keep state and resume later, (2) delete partial, (3) keep as-is
- **Phase gates:** MUST complete Phase 1 before Phase 2. MUST have approved plan
  (Phase 3) before Phase 4.

## Anti-Patterns (MUST avoid)

1. Generating audit without scanning existing audits first
2. Too many domains for single-session execution without staging
3. Hardcoding file paths instead of using variables
4. Generating files without approval gate
5. Skipping `/skill-audit` on created output
6. Generic `[TODO]` or `<placeholder>` text in generated files
7. Generated skills without MUST/SHOULD/MAY hierarchy

## Compaction Resilience

- **State file:** `.claude/state/task-create-audit-{name}.state.json`
- **Update:** After every phase boundary and every discovery batch
- **Contents:** Audit name, type, discovery decisions, planning checklist,
  current phase, files created
- **Recovery:** Re-invoke `/create-audit <name>` to read state and resume

## Integration

- **Neighbors:** `/skill-creator` (general skills), `/skill-audit` (validate
  created audit), `/skill-ecosystem-audit` (ecosystem-wide),
  `/audit-comprehensive` (orchestrator that may need updating)
- **References:** [SKILL_STANDARDS.md](../_shared/SKILL_STANDARDS.md),
  [CLAUDE.md](../../CLAUDE.md)
- **Handoff:** State file documents discovery decisions for `/skill-audit`

## Artifact Contracts

| Artifact           | Producer   | Consumer                   | Lifetime   |
| ------------------ | ---------- | -------------------------- | ---------- |
| State file         | This skill | This skill (resume)        | Persistent |
| Generated SKILL.md | This skill | `/audit-<name>` invocation | Persistent |
| Multi-AI template  | This skill | External AI models         | Persistent |
| Output directory   | This skill | Generated audit (findings) | Persistent |
| TDMS entries       | Gen. audit | TDMS pipeline              | Persistent |

---

## Version History

| Version | Date       | Description                                                |
| ------- | ---------- | ---------------------------------------------------------- |
| 2.0     | 2026-03-08 | Full rewrite from skill-audit: 65 decisions (33→82 target) |
| 1.0     | 2026-02-14 | Initial creation                                           |
