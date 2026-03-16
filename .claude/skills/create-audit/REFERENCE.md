<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Create Audit — Reference

Templates, question banks, audit type taxonomy, schemas, guard rails, and
operational details for the create-audit skill. Referenced from SKILL.md.

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
- **Phase 4 error recovery:** If generation fails mid-Phase 4, save state with
  last completed sub-step. Fix the error (missing script, invalid path) and
  resume from the failed sub-step. Do not restart Phase 4 from scratch.

## Anti-Patterns (MUST avoid)

1. Generating audit without scanning existing audits first
2. Too many domains for single-session execution without staging
3. Hardcoding file paths instead of using variables
4. Generating files without approval gate
5. Skipping `/skill-audit` on created output
6. Generic `[TODO]` or `<placeholder>` text in generated files
7. Generated skills without MUST/SHOULD/MAY hierarchy

## Integration

- **Neighbors:** `/skill-creator` (general skills), `/skill-audit` (validate
  created audit — Phase 5 gate), `/skill-ecosystem-audit` (ecosystem-wide),
  `/audit-comprehensive` (orchestrator — update in Phase 4.5)
- **References:** [SKILL_STANDARDS.md](../_shared/SKILL_STANDARDS.md),
  [CLAUDE.md](../../CLAUDE.md)
- **Handoff:** State file documents discovery decisions for `/skill-audit`

## Artifact Contracts

| Artifact           | Producer   | Consumer                   | Lifetime   |
| ------------------ | ---------- | -------------------------- | ---------- |
| State file         | This skill | This skill (resume)        | Persistent |
| Generated SKILL.md | This skill | `/audit-<name>` invocation | Persistent |
| Generated SKILL.md | This skill | `/skill-audit` (Phase 5)   | Persistent |
| Multi-AI template  | This skill | External AI models         | Persistent |
| Output directory   | This skill | Generated audit (findings) | Persistent |
| TDMS entries       | Gen. audit | TDMS pipeline              | Persistent |

---

## Output Manifest

| File                | Condition                             | Path                                             |
| ------------------- | ------------------------------------- | ------------------------------------------------ |
| Audit SKILL.md      | Always (MUST)                         | `.claude/skills/audit-<name>/SKILL.md`           |
| REFERENCE.md        | If >300 lines (SHOULD)                | `.claude/skills/audit-<name>/REFERENCE.md`       |
| Multi-AI template   | If audit type suits multi-AI (SHOULD) | `docs/audits/multi-ai/templates/<NAME>_AUDIT.md` |
| Output directory    | Always (MUST)                         | `docs/audits/single-session/<name>/`             |
| Checker scripts     | If ecosystem type (MUST)              | `.claude/skills/audit-<name>/scripts/`           |
| COMMAND_REFERENCE   | Always (MUST)                         | `.claude/COMMAND_REFERENCE.md`                   |
| AUDIT_TRACKER       | Always (SHOULD)                       | `docs/audits/AUDIT_TRACKER.md`                   |
| SKILL_INDEX         | Always (SHOULD)                       | `.claude/skills/SKILL_INDEX.md`                  |
| audit-comprehensive | Always (SHOULD)                       | `.claude/skills/audit-comprehensive/SKILL.md`    |
| audits README       | Always (SHOULD)                       | `docs/audits/README.md`                          |
| multi-ai README     | If template created (SHOULD)          | `docs/audits/multi-ai/README.md`                 |

---

## Audit Type Taxonomy

### Type 1: Single-Session Multi-Agent

**Pattern:** Parallel agents analyze domains, synthesis agent merges findings.
**Examples:** `audit-code`, `audit-security`, `audit-performance` **Best for:**
Code analysis, pattern detection, broad surface-area scans

**Architecture:**

- Stage 1: N parallel Explore agents (1 per domain, max 6 per wave)
- Stage 2: 1 synthesis agent merges, deduplicates, generates report
- Output: JSONL findings + executive summary
- TDMS integration: intake-audit.js after synthesis

### Type 2: Ecosystem Diagnostic

**Pattern:** Script-based checkers with composite scoring and interactive
walkthrough. **Examples:** `script-ecosystem-audit`, `hook-ecosystem-audit`,
`pr-ecosystem-audit` **Best for:** Infrastructure health, pattern compliance,
trend tracking

**Architecture:**

- Automated script runs checkers across categories
- Produces JSON with scores, grades, findings
- Interactive finding-by-finding walkthrough with decisions
- History JSONL for trend tracking across runs

### Type 3: Interactive Review

**Pattern:** Category-by-category evaluation with user decisions. **Examples:**
`skill-audit` **Best for:** Quality evaluation, behavioral assessment, guided
improvement

**Architecture:**

- Sequential category presentation (one at a time)
- Per-category: pros, cons, gaps, suggestions with recommendations
- Decision record built incrementally
- Implementation phase applies accepted decisions

**Generation template:**

````markdown
---
name: audit-{name}
description: >-
  {description}
---

# Interactive {Title} Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** {DATE}
**Status:** ACTIVE
<!-- prettier-ignore-end -->

{description_expanded}

## Critical Rules (MUST follow)

1. **Present ONE category at a time** — wait for user response before next
2. **Every suggestion needs a recommendation with rationale** — no bare options
3. **Save decisions after every category** — persist to state file
4. **Use conversational Q&A** — NEVER use AskUserQuestion

## When to Use

- {specific trigger 1}
- {specific trigger 2}
- User explicitly invokes `/audit-{name}`

## When NOT to Use

- {alternative 1} — use `/{redirect}`
- {alternative 2} — use `/{redirect}`

## Routing Guide

| Situation | Use | Why |
| --------- | --- | --- |

---

## Categories

{FOR EACH CATEGORY — generate with guided prompts:}

### Category {N}: {Name}

**Purpose:** {what this category evaluates}

Evaluation criteria, scoring guide, and common findings for this category.
Generate from discovery answers.

---

## Post-Audit (MUST)

Present aggregate summary, collect final approval, apply accepted decisions.

## Compaction Resilience

- **State file:** `.claude/state/task-audit-{name}.state.json`
- **Update:** After each category
- **Recovery:** Re-invoke `/audit-{name}` to resume

## Learning Loop + Closure (MUST)

**Auto-learnings** (MUST): Generate 2-3 data-driven insights. **Invocation
tracking** (MUST):

```bash
cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"audit-{name}","type":"skill","success":true,"context":{}}'
```

## Version History

| Version | Date   | Description                        |
| ------- | ------ | ---------------------------------- |
| 1.0     | {DATE} | Initial creation via /create-audit |
````

### Type 4: Custom Hybrid

**Pattern:** Combines elements from multiple types. **Best for:** Audits that
don't fit cleanly into one pattern

Present the three standard types and ask the user which elements they want to
combine. Document the hybrid architecture in the planning phase.

**Generation guidance:** Combine structural elements from the relevant type
templates. For example, a hybrid might use ecosystem-style scoring (Type 2) with
interactive category walkthrough (Type 3). Document which elements come from
which type in the generated skill's REFERENCE.md.

---

## Discovery Question Categories

### Batch 1: Identity (MUST — ask first)

1. **Name:** What should the audit be called? (lowercase-kebab-case) Default:
   infer from description
2. **Description:** One-line description of what this audit evaluates Default:
   infer from name + domain
3. **Scope:** What specific area of the repo does this audit cover? Default:
   infer from name
4. **Audit type:** Which type matches best? (present taxonomy above) Default:
   recommend based on scope description

### Batch 2: Architecture (MUST)

5. **Domains:** What sub-areas should be checked? (3-8 recommended) Default:
   suggest based on codebase exploration findings
6. **Agent/checker count:** How many parallel units? Default: 1 per domain, max
   6 per wave
7. **Stages:** How many processing stages? Default: 2 for multi-agent
   (analysis + synthesis), 1 for ecosystem
8. **Execution model:** Parallel, sequential, or interactive? Default: parallel
   for multi-agent, interactive for review

### Batch 3: Integration (SHOULD)

9. **TDMS integration:** Should findings feed into MASTER_DEBT.jsonl? Default:
   yes for all audit types. Recommend: accept — TDMS is canonical.
10. **Threshold trigger:** When should this audit be re-run? Default: "50
    commits OR relevant file changes"
11. **Comprehensive inclusion:** Add to `/audit-comprehensive`? Default: no for
    first version. Add after audit proves stable.
12. **Multi-AI template:** Generate a template for external AIs? Default: yes
    for multi-agent, no for ecosystem/interactive

### Batch 4: Quality (SHOULD)

13. **Finding schema:** Standard JSONL or custom fields? Default: standard
    (fingerprint, severity, effort, confidence)
14. **Scoring model:** Category scores + composite? Pass/fail? Rubric? Default:
    depends on type — scores for ecosystem, findings for multi-agent
15. **Trend tracking:** Track scores across runs? Default: yes for ecosystem, no
    for single-session

### Batch 5: Output (SHOULD)

16. **Output directory:** Where do results go? Default:
    `docs/audits/single-session/<name>/`
17. **Report format:** JSONL + MD? JSONL only? Default: JSONL canonical, MD
    generated for human readability
18. **False positive handling:** Check FALSE_POSITIVES.jsonl? Default: yes

---

## Template Variables

Variables used in generation templates. Each is populated from a specific
discovery phase or question.

| Variable                 | Source                   | Default                              |
| ------------------------ | ------------------------ | ------------------------------------ |
| `{name}`                 | Batch 1 Q1 (Name)        | Inferred from description            |
| `{description}`          | Batch 1 Q2 (Description) | Inferred from name + domain          |
| `{description_expanded}` | Phase 3 planning         | Generated from all discovery answers |
| `{Title}`                | Derived from `{name}`    | Title-cased name                     |
| `{DATE}`                 | Generation time          | `date +%Y-%m-%d`                     |
| `{N}`                    | Batch 2 Q6 (Agent count) | 1 per domain                         |
| `{domain}`               | Batch 2 Q5 (Domains)     | From codebase exploration            |
| `{category}`             | Batch 2 Q5 (Domains)     | Maps to domain names                 |
| `{specific trigger N}`   | Phase 3 planning         | Generated from scope + domain        |
| `{alternative N}`        | Phase 1 exemplars        | Neighboring audits                   |
| `{redirect}`             | Phase 1 exemplars        | Neighboring audit skill names        |
| `{NAME}`                 | Derived from `{name}`    | UPPER-KEBAB-CASE name                |

---

## Generated Skill Template (Type 1: Single-Session Multi-Agent)

Template version: 1.0

````markdown
---
name: audit-{name}
description: >-
  {description}
---

# Single-Session {Title} Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** {DATE}
**Status:** ACTIVE
<!-- prettier-ignore-end -->

{description_expanded}

## When to Use

- {specific trigger 1}
- {specific trigger 2}
- User explicitly invokes `/audit-{name}`

## When NOT to Use

- {alternative 1} — use `/{redirect}`
- {alternative 2} — use `/{redirect}`

## Routing Guide

| Situation | Use | Why |
| --------- | --- | --- |

---

## Critical Rules (MUST follow)

1. **EVERY agent MUST write outputs directly to files** — NEVER rely on
   conversation context
2. Each agent prompt MUST include output path
3. Verify after each stage: `wc -l ${AUDIT_DIR}/*.jsonl`
4. Agents return ONLY: `COMPLETE: [id] wrote N findings to [path]`

## Quick Reference

| Stage | Name      | Parallel Agents | Output            |
| ----- | --------- | --------------- | ----------------- |
| 1     | Analysis  | {N}             | `stage-1-*.jsonl` |
| 2     | Synthesis | 1               | Final report      |

---

## Pre-Audit Setup

### Step 1: Check Previous Results

Check for previous audit runs in `docs/audits/single-session/{name}/` and
surface key findings from last run if available.

### Step 2: Create Audit Directory

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/single-session/{name}/audit-${AUDIT_DATE}"
mkdir -p "${AUDIT_DIR}"
```

### Step 3: Load False Positives

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and filter matching patterns.

---

## Stage 1: Analysis ({N} Agents, Parallel)

**Dependency constraints:** All Stage 1 agents are independent — no ordering
required. Stage 2 depends on all Stage 1 outputs written to disk.

{FOR EACH DOMAIN — generate with guided prompts:}

### Agent 1{X}: {Domain Name}

Prompt guidance: For domain '{domain}', generate specific instructions that: (1)
identify 3-5 patterns to check based on discovery findings, (2) specify evidence
format per finding, (3) define severity criteria for this domain.

**Output Format:** JSONL per finding:

```json
{"category":"{category}","title":"...","fingerprint":"{category}::FILE::ISSUE","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}
```

CRITICAL: Write findings to: `${AUDIT_DIR}/stage-1{x}-{domain}.jsonl` Return
ONLY:
`COMPLETE: 1{X} wrote N findings to ${AUDIT_DIR}/stage-1{x}-{domain}.jsonl`

---

## Stage 2: Synthesis (1 Agent, Sequential)

Read ALL findings from `${AUDIT_DIR}/stage-*.jsonl`.

1. Deduplicate and merge: `${AUDIT_DIR}/all-findings-deduped.jsonl`
2. Executive summary: `${AUDIT_DIR}/{NAME}_AUDIT_REPORT.md`

CRITICAL: Write BOTH files.

---

## Post-Audit (MUST)

```bash
node scripts/debt/validate-schema.js ${AUDIT_DIR}/all-findings-deduped.jsonl
node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings-deduped.jsonl --source "audit-{name}-$(date +%Y-%m-%d)"
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

If any script fails, note the error and continue with remaining scripts.

## Compaction Resilience

- **State file:** `.claude/state/task-audit-{name}.state.json`
- **Update:** After each stage boundary
- **Recovery:** Re-invoke `/audit-{name}` to resume

## Learning Loop + Closure (MUST)

**Auto-learnings** (MUST): Generate 2-3 data-driven insights from audit results.
Save to state file `learnings` field.

**Optional user feedback** (SHOULD): "Any additional observations?" Save to
`process_feedback` field.

**On next startup** (MUST): If previous audit state exists, surface learnings.

**Invocation tracking** (MUST):

```bash
cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"audit-{name}","type":"skill","success":true,"context":{}}'
```

## Integration

- **Neighbors:** {list neighbors based on domain}
- **References:** [CLAUDE.md](../../CLAUDE.md) for project conventions, Section
  5 for security patterns in scripts

## Version History

| Version | Date   | Description                        |
| ------- | ------ | ---------------------------------- |
| 1.0     | {DATE} | Initial creation via /create-audit |
````

---

## Generated Skill Template (Type 2: Ecosystem Diagnostic)

Template version: 1.0

> Ecosystem diagnostic audits use a script-based checker architecture. The
> generated skill should reference a checker script and provide an interactive
> walkthrough. See `script-ecosystem-audit` and `hook-ecosystem-audit` as
> exemplars. The template structure follows the same pattern: run script →
> display dashboard → finding-by-finding walkthrough → summary → self-audit →
> learning loop.

Key structural elements for ecosystem audits:

- Automated checker script in `.claude/skills/audit-{name}/scripts/`
- Dashboard template with category scores and grades
- Finding card template with severity, impact, and patch suggestions
- Progress file for compaction resilience
- History JSONL for trend tracking
- Delegation protocol for batch decisions

---

## Multi-AI Template

Template version: 1.0

````markdown
# [Project Name] Multi-AI {Title} Audit Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Created:** {DATE}
**Last Updated:** {DATE}
**Status:** PENDING
<!-- prettier-ignore-end -->

> **Shared Boilerplate:** Common sections in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md)

## Purpose

{description of when to use this template}

## Review Scope

| Area | Location | Count |
| ---- | -------- | ----- |

{domain rows}

## {Title} Audit Prompt (Copy for Each AI Model)

{domain-specific instructions generated from discovery answers}

### Sub-Categories

{numbered list of domains with specific check instructions}

### Output Format

```json
{
  "category": "{category}",
  "title": "short, specific description",
  "fingerprint": "{category}::<file>::<issue>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path"],
  "why_it_matters": "...",
  "suggested_fix": "...",
  "acceptance_tests": ["..."]
}
```

### Quality Guardrails

- Minimum confidence: 60
- Evidence required for S0/S1
- Check docs/technical-debt/FALSE_POSITIVES.jsonl

## Aggregation Process

See [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md)

## TDMS Integration

```bash
node scripts/debt/intake-audit.js <findings.jsonl> --source "multi-ai-{name}-{DATE}"
```
````

---

## State File Schema

Path: `.claude/state/task-create-audit-{name}.state.json`

```json
{
  "task": "Create Audit: {name}",
  "audit_name": "{name}",
  "audit_type": "single-session-multi-agent | ecosystem-diagnostic | interactive-review | custom-hybrid",
  "status": "warm-up | context | discovery | planning | build | build-substep-N | validate | self-audit | complete",
  "current_phase": 0,
  "current_substep": null,
  "discovery_decisions": [
    { "batch": 1, "question": "...", "answer": "...", "rationale": "..." }
  ],
  "planned_structure": {
    "files_to_create": [],
    "domains": [],
    "agents": 0,
    "stages": 0
  },
  "files_created": [],
  "learnings": [],
  "feedback": null,
  "updated": "ISO timestamp"
}
```

---

## Data Standards

- **JSONL** is the canonical machine-readable format for findings
- **.md** is generated for human readability (reports, summaries)
- Finding schema: fingerprint, severity (S0-S3), effort (E0-E3), confidence
  (0-100), files, why_it_matters, suggested_fix, acceptance_tests
- Reference CLAUDE.md Section 5 for error sanitization, path traversal, and
  other security patterns in generated scripts
