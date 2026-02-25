---
name: create-audit
description:
  Interactive wizard to scaffold a new audit type with skill, template, and
  directory
---

# Create Audit Wizard

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Interactive skill that scaffolds a new audit type with all required files and
integrations.

---

## When to Use

- Tasks related to create-audit
- User explicitly invokes `/create-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## What This Creates

1. `.claude/skills/audit-<name>/SKILL.md` — Single-session audit skill
2. `docs/audits/multi-ai/templates/<NAME>_AUDIT.md` — Multi-AI template
3. `docs/audits/single-session/<name>/` — Output directory
4. Entry in `docs/audits/AUDIT_TRACKER.md` — Threshold tracking
5. Entry in `.claude/skills/SKILL_INDEX.md` — Skill index

---

## Step 1: Gather Information

Ask the user for the following (offer defaults where possible):

### Required

```
1. Name: <lowercase-hyphenated> (e.g., "api-quality")
   → Skill: audit-<name>, Template: <NAME>_AUDIT.md

2. Description: <one-line> (e.g., "API design quality and consistency audit")

3. Category: Which of the 9 fixed categories does this belong to?
   - code-quality, security, performance, refactoring, documentation,
     process, engineering-productivity, enhancements, ai-optimization
   - Or: NEW (requires updating AUDIT_STANDARDS.md — warn user)

4. Domains: List the sub-areas to audit (3-8 recommended)
   Example: ["endpoint design", "error responses", "auth patterns", "rate limiting"]

5. Agent count: How many parallel agents? (default: 1 per domain, max 6 per wave)

6. Stages: How many stages? (default: 2 — analysis + synthesis)
```

### Optional

```
7. Threshold trigger: When should this audit be re-run?
   Default: "50 commits OR relevant file changes"

8. Add to audit-comprehensive? (default: no — only for permanent audits)

9. Parallel or sequential? (default: parallel if agents > 1)
```

---

## Step 2: Validate

Before generating files:

1. **Check name uniqueness:**

   ```bash
   ls .claude/skills/audit-${NAME}/ 2>/dev/null && echo "EXISTS" || echo "OK"
   ```

2. **Check category validity:** Must be one of the 9 fixed categories (or user
   acknowledged NEW category requirements)

3. **Check domain count:** Warn if >8 domains (suggest splitting into stages)

---

## Step 3: Generate Skill

Create `.claude/skills/audit-<name>/SKILL.md` using this template:

````markdown
---
name: audit-<name>
description: <description>
supports_parallel: true
fallback_available: true
estimated_time_parallel: <agents * 5> min
estimated_time_sequential: <agents * 15> min
---

# Single-Session <Title> Audit

**Version:** 1.0

This audit covers **<N> domains** across **<stages> stages** with parallel agent
execution.

---

## Quick Reference

| Stage | Name      | Parallel Agents | Output            |
| ----- | --------- | --------------- | ----------------- |
| 1     | Analysis  | <N>             | `stage-1-*.jsonl` |
| 2     | Synthesis | 1               | Final report      |

---

## CRITICAL: Persistence Rules

**EVERY agent MUST write outputs directly to files. NEVER rely on conversation
context.**

1. Each agent prompt MUST include:
   `Write findings to: ${AUDIT_DIR}/[filename].jsonl`
2. Verify after each stage: `wc -l ${AUDIT_DIR}/*.jsonl`
3. Agents return ONLY: `COMPLETE: [id] wrote N findings to [path]`

---

## Pre-Audit Setup

### Step 0: Episodic Memory Search

```javascript
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["<name>", "audit", "<keywords>"],
    limit: 5,
  });
```

### Step 1: Create Audit Directory

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/single-session/<name>/audit-${AUDIT_DATE}"
mkdir -p "${AUDIT_DIR}"
```

### Step 2: Load False Positives

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and filter matching patterns.

---

## Stage 1: Analysis (<N> Agents, Parallel)

**Dependency constraints:** All Stage 1 agents are independent -- no ordering
required. Stage 2 (synthesis) depends on all Stage 1 outputs being written to
disk.

<FOR EACH DOMAIN, generate an agent block:>

### Agent 1<X>: <Domain Name>

```
Task(subagent_type="Explore", prompt="""
Audit <domain description>:

<Specific instructions for what to check>

**Output Format:** JSONL per finding:
{"category":"<category>","title":"...","fingerprint":"<category>::FILE::ISSUE","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","confidence":0-100,"files":["path"],"why_it_matters":"...","suggested_fix":"...","acceptance_tests":["..."]}

CRITICAL: Write findings to: ${AUDIT_DIR}/stage-1<x>-<domain>.jsonl
Return ONLY: COMPLETE: 1<X> wrote N findings to ${AUDIT_DIR}/stage-1<x>-<domain>.jsonl
""")
```

---

## Stage 2: Synthesis (1 Agent, Sequential)

```
Task(subagent_type="general-purpose", prompt="""
Synthesize all findings:

Read ALL findings from ${AUDIT_DIR}/stage-*.jsonl.

1. Deduplicate and merge: ${AUDIT_DIR}/all-findings-deduped.jsonl
2. Executive summary: ${AUDIT_DIR}/<NAME>_AUDIT_REPORT.md

CRITICAL: Write BOTH files.
""")
```

---

## Post-Audit

```bash
node scripts/debt/validate-schema.js ${AUDIT_DIR}/all-findings-deduped.jsonl
node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings-deduped.jsonl --source "audit-<name>-$(date +%Y-%m-%d)"
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```
````

**Customize the template** based on user's domain list and stage count.

---

## Step 4: Generate Multi-AI Template

Create `docs/audits/multi-ai/templates/<NAME>_AUDIT.md`:

````markdown
# [Project Name] Multi-AI <Title> Audit Plan

**Document Version:** 1.0 **Created:** <DATE> **Last Updated:** <DATE>
**Status:** PENDING

> **Shared Boilerplate:** Common sections in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md)

## Purpose

<Description of when to use this template>

## Review Scope

| Area | Location | Count |
| ---- | -------- | ----- |

<FOR EACH DOMAIN>

## <Title> Audit Prompt (Copy for Each AI Model)

<Instructions for external AIs to follow>

### Sub-Categories

<Numbered list of domains with what-to-check>

### Output Format

```json
{
  "category": "<category>",
  "title": "short, specific description",
  "fingerprint": "<category>::<file>::<issue>",
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
node scripts/debt/intake-audit.js <findings.jsonl> --source "multi-ai-<name>-<DATE>"
```
````

---

## Step 5: Create Output Directory

```bash
mkdir -p docs/audits/single-session/<name>
```

---

## Step 6: Update Supporting Files

### 6a. AUDIT_TRACKER.md

Add row to Single-Session Audit Thresholds table:

```markdown
| <Title> | Never | — | — | <threshold trigger> |
```

### 6b. SKILL_INDEX.md

Add to Audit & Code Quality section:

```markdown
| `/audit-<name>` | <description> |
```

### 6c. multi-ai-audit/README.md

Update template count and add reference to new template.

### 6d. docs/audits/README.md

Add to Skill Inventory and Multi-AI Templates tables.

---

## Step 7: Validate

```bash
npm run skills:validate 2>/dev/null || echo "Validate manually"
npm run docs:headers
npm run crossdoc:check
```

---

## Step 8: Summary

Print what was created:

```
Created audit type: <name>
  Skill:     .claude/skills/audit-<name>/SKILL.md
  Template:  docs/audits/multi-ai/templates/<NAME>_AUDIT.md
  Output:    docs/audits/single-session/<name>/
  Tracker:   Updated docs/audits/AUDIT_TRACKER.md
  Index:     Updated .claude/skills/SKILL_INDEX.md

To run: /audit-<name>
To run multi-AI: Copy prompt from template to external AIs
```

---

## Version History

| Version | Date       | Change           |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-02-14 | Initial creation |
