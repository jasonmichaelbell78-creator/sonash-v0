<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Create Audit — Reference

Templates, question banks, audit type taxonomy, and schemas for the create-audit
skill. Referenced from SKILL.md.

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

### Type 4: Custom Hybrid

**Pattern:** Combines elements from multiple types. **Best for:** Audits that
don't fit cleanly into one pattern

Present the three standard types and ask the user which elements they want to
combine. Document the hybrid architecture in the planning phase.

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

### Batch 5: Output (MAY — skip if defaults accepted)

16. **Output directory:** Where do results go? Default:
    `docs/audits/single-session/<name>/`
17. **Report format:** JSONL + MD? JSONL only? Default: JSONL canonical, MD
    generated for human readability
18. **False positive handling:** Check FALSE_POSITIVES.jsonl? Default: yes

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
- **References:** [CLAUDE.md](../../CLAUDE.md) for project conventions

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
  "status": "warm-up | context | discovery | planning | build | validate | self-audit | complete",
  "current_phase": 0,
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
