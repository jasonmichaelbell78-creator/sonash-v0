---
name: skill-audit
description: >-
  Interactive behavioral quality audit for individual skills. This skill should
  be used when evaluating a skill against 10 quality categories to identify
  gaps, improve attention management, and produce actionable decisions. Produces
  a decision record and updated skill files.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
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
   to survive compaction. This is non-negotiable for long-running audits.
4. **Crosscheck skill-creator** — before using `/skill-creator` to implement
   changes, verify the creator skill itself covers the gaps found in this audit.
5. **Address the skill, not just the word** — when a skill's behavior doesn't
   match its intent, fix the behavioral instructions, not the naming.

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

---

## Process Overview

```
Phase 1: Preparation    → Read skill, read standards, initialize state
Phase 2: Category Audit → 10 categories, interactive, decisions saved per category
Phase 3: Crosscheck     → Verify skill-creator covers findings
Phase 4: Implementation → Apply decisions (update skill or create new version)
Phase 5: Validation     → Run skills:validate, confirm changes
```

---

## Phase 1: Preparation

1. Read the target skill's SKILL.md and any companion files
2. Read SKILL_STANDARDS.md for current quality checklist
3. Run a preliminary scan: count lines, check structure, identify neighbors
4. Initialize state file at `.claude/state/task-skill-audit.state.json`
5. Present warm-up summary to user:

```
Skill Audit: [skill-name]
Lines: [N] | Neighbors: [list] | Last Updated: [date]
Categories: 10 | Estimated time: [depends on skill complexity]
```

**State file MUST include:** task name, target skill, status, current category,
all decisions so far, files modified, and timestamp. Update after every
category.

---

## Phase 2: Category Audit (Interactive)

> Read `.claude/skills/skill-audit/REFERENCE.md` for the 10 category
> definitions, question banks, and scoring rubrics.

### Interactive Flow (MUST follow)

Present ONE category at a time. Wait for user response before proceeding to the
next category. Do NOT batch multiple categories together.

### Per-Category Procedure (MUST follow for each category)

1. **Present the category** — name, purpose, what it evaluates
2. **Assess current state** — how the skill performs in this category
3. **List ALL pros** — what's working well (be specific, cite lines/sections)
4. **List ALL cons** — what's not working (be specific)
5. **List ALL issues & gaps** — what's missing entirely
6. **Present suggestions** — labeled A, B, C, etc. Two modes:
   - **Multiple options:** When there are genuinely different approaches,
     present each as a distinct option with pros/cons. State which you recommend
     and WHY.
   - **Single fix:** When only one sensible fix exists for a con or gap, present
     it as a recommendation with rationale. Do NOT fabricate artificial
     alternatives.
7. **Cover EVERY con and gap** — each con and gap MUST have at least one
   suggestion. If a con/gap wasn't covered by a multi-option suggestion, add a
   standalone recommendation for it. Nothing gets skipped.
8. **Collect user decisions** — user may: accept all recommendations, accept
   with modifications, reject specific items, or ask for alternatives
9. **Save to state file** — persist ALL decisions before moving to next category
10. **Show progress** — "Category 3 of 10 complete. 18 decisions so far."

### Category Presentation Format (MUST follow)

```
## Category N: [Name] (N of 10)

**Purpose:** [What this category evaluates]

**Score:** [N/10]

### Current State
[Specific assessment citing skill sections/lines]

### Pros
- [What's working well — cite specific sections]

### Cons
- [What's not working — be specific about the problem]

### Issues & Gaps
- [What's missing entirely]

### Suggestions

**A. [Title]** (Recommended: [Yes/No])
[Description of change]
Rationale: [Why this matters]

**B. [Title]** (Recommended: [Yes/No])
[Description of change]
Rationale: [Why this matters]

[Additional suggestions for ALL remaining cons/gaps not covered above]
```

### Anti-Patterns (MUST avoid)

- Presenting options without recommendations
- Skipping cons or gaps because they seem minor
- Asking the user to choose without explaining trade-offs
- Forgetting to save state between categories
- Presenting more than 8 suggestions per category (split into sub-batches)

---

## Phase 3: Crosscheck

After all 10 categories are complete:

1. Count total decisions across all categories
2. Review the skill-creator skill against your findings — does it guide creators
   to avoid the gaps you found?
3. If skill-creator has gaps, flag them for the user and recommend updates
4. Present crosscheck summary:

```
Crosscheck: skill-creator vs audit findings
Gaps found: [N]
[List of gaps with recommendations]
```

---

## Phase 4: Implementation

Apply all decisions to the target skill:

1. Update SKILL.md (keep under 300 lines per SKILL_STANDARDS)
2. Extract detailed content to REFERENCE.md if needed
3. Update companion files as needed
4. If skill-creator needs updates, apply those too
5. Run `npm run skills:validate`

---

## Phase 5: Validation

1. Verify structural quality (frontmatter, sections, line count)
2. Verify behavioral quality against SKILL_STANDARDS checklist
3. Present completion summary:

```
Skill Audit Complete: [skill-name]
Categories: 10 | Decisions: [N]
Files modified: [list]
Skill-creator gaps found: [N]
```

---

## Compaction Resilience

This skill runs long (10+ interactive categories). MUST persist state:

- **State file:** `.claude/state/task-skill-audit.state.json`
- **Update frequency:** After every category completion
- **Recovery:** On resume, read state file to determine current category and
  skip completed categories
- **State schema:** task, target_skill, status, current_category, decisions (per
  category), files_modified, cross_cutting_principles, timestamp

---

## Integration

- **Neighbors:** `/skill-creator` (create/update), `/skill-ecosystem-audit`
  (ecosystem-wide), `npm run skills:validate` (structural)
- **Input:** Target skill name or path
- **Output:** Updated skill files, decision record in state file
- **Handoff:** After audit, use `/skill-creator` to implement changes if the
  skill needs a major rewrite

---

## Version History

| Version | Date       | Description                                              |
| ------- | ---------- | -------------------------------------------------------- |
| 1.0     | 2026-03-01 | Initial implementation from deep-plan audit of deep-plan |
