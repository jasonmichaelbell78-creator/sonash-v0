---
name: skill-ecosystem-audit
description: |
  Comprehensive diagnostic of the skill ecosystem — 21 categories across 5
  domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Covers all skills, cross-references,
  bloat detection, and agent orchestration health.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Skill Ecosystem Audit

Deep diagnostic of the entire skill ecosystem — SKILL.md files
(`.claude/skills/*/`), cross-references, registry sync, staleness detection, and
agent orchestration health. Produces per-category scores, a composite health
grade (A-F), trend tracking across runs, and an interactive walkthrough with
patch suggestions.

**Invocation:** `/skill-ecosystem-audit`

**When to use:** When you want to understand the overall health of the skill
system, identify structural issues, broken references, stale skills, bloated
content, or agent orchestration problems. Complementary with
`/hook-ecosystem-audit` (hook audit owns hook internals; skill audit owns skill
documentation quality and ecosystem integrity).

**When NOT to use:** When you only need to check a single skill file — use
manual review instead. When you need to audit hooks or pre-commit pipeline — use
`/hook-ecosystem-audit`. When you need PR workflow health — use
`/pr-ecosystem-audit`.

---

## When to Use

- |
- User explicitly invokes `/skill-ecosystem-audit`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## CRITICAL RULES (Read First)

> Read `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` and follow all
> 8 rules. The rules below are summaries — the shared file is authoritative.

1. **CHECK for saved progress first** (MUST)
2. **ALWAYS run the script first** (MUST)
3. **ALWAYS display the dashboard** (MUST)
4. **Use conversational Q&A for decisions** (MUST) — NEVER use AskUserQuestion
5. **SAVE progress after every decision** (MUST)
6. **Show patch suggestions inline** (SHOULD)
7. **Create TDMS entries** (MUST) for deferred findings
8. **Save decisions** (MUST) to session log

---

## Compaction Guard

> Read `.claude/skills/_shared/ecosystem-audit/COMPACTION_GUARD.md` for the full
> compaction guard protocol (state file schema, resume, save, cleanup, and
> domain-based chunking).

State file path: `.claude/tmp/skill-audit-progress.json`

**Extended fields:** This audit uses `currentDomain` and `domainsCompleted` for
domain-based chunking (see shared module).

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/skill-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Save initial progress state to `.claude/tmp/skill-audit-progress.json` with
   `currentFindingIndex: 0`, the full findings data, score, and grade.

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
Skill Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌───────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                          │ Score │ Rating   │ Trend        │
├───────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Structural Compliance         │       │          │              │
│   Frontmatter Schema              │  {s}  │ {rating} │ {trend}      │
│   Step Continuity                 │  {s}  │ {rating} │ {trend}      │
│   Section Structure               │  {s}  │ {rating} │ {trend}      │
│   Bloat Score                     │  {s}  │ {rating} │ {trend}      │
├───────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Cross-Reference Integrity     │       │          │              │
│   Skill-to-Skill References       │  {s}  │ {rating} │ {trend}      │
│   Skill-to-Script References      │  {s}  │ {rating} │ {trend}      │
│   Skill-to-Template References    │  {s}  │ {rating} │ {trend}      │
│   Evidence Citation Validity      │  {s}  │ {rating} │ {trend}      │
│   Dependency Chain Health         │  {s}  │ {rating} │ {trend}      │
├───────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Coverage & Consistency        │       │          │              │
│   Scope Boundary Clarity          │  {s}  │ {rating} │ {trend}      │
│   Trigger Accuracy                │  {s}  │ {rating} │ {trend}      │
│   Output Format Consistency       │  {s}  │ {rating} │ {trend}      │
│   Skill Registry Sync             │  {s}  │ {rating} │ {trend}      │
├───────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Staleness & Drift             │       │          │              │
│   Version History Currency        │  {s}  │ {rating} │ {trend}      │
│   Dead Skill Detection            │  {s}  │ {rating} │ {trend}      │
│   Pattern Reference Sync          │  {s}  │ {rating} │ {trend}      │
│   Inline Code Duplication         │  {s}  │ {rating} │ {trend}      │
├───────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Agent Orchestration Health    │       │          │              │
│   Agent Prompt Consistency        │  {s}  │ {rating} │ {trend}      │
│   Agent-Skill Alignment           │  {s}  │ {rating} │ {trend}      │
│   Parallelization Correctness     │  {s}  │ {rating} │ {trend}      │
│   Team Config Health              │  {s}  │ {rating} │ {trend}      │
└───────────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

Then say: **"Found N findings to review. Walking through each one
(impact-weighted, domain-chunked)..."**

---

## Phase 3: Finding-by-Finding Walkthrough

> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).

Sort findings by `impactScore` descending, grouped by domain for chunked
processing. DEBT entries use source_id: `review:skill-ecosystem-audit-{date}`.

---

## Phase 4: Summary & Actions

> Read `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md` for the
> summary template, trend report template, and verification re-run template.

Write report to `.claude/tmp/skill-audit-report-{YYYY-MM-DD}.md`.

**Process verification:** Run `__tests__/` suite:

```bash
node --test .claude/skills/skill-ecosystem-audit/scripts/__tests__/*.test.js
```

---

## Phase 5: Trend Report (if previous runs exist)

> Uses trend report template from `SUMMARY_AND_TRENDS.md`.

History: `.claude/state/skill-ecosystem-audit-history.jsonl`

---

## Phase 6: Self-Audit (Verification)

> Uses verification re-run template from `SUMMARY_AND_TRENDS.md`.

Re-run script:

```bash
node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js
```

---

## Category Reference

### Domain 1: Structural Compliance (20% weight)

| Category           | What It Checks                                                     |
| ------------------ | ------------------------------------------------------------------ |
| Frontmatter Schema | --- delimiters present, name: and description: fields in SKILL.md  |
| Step Continuity    | Numbered steps are sequential with no gaps or duplicates           |
| Section Structure  | "When to Use", "When NOT to Use", "Version History" sections exist |
| Bloat Score        | Line count thresholds (500 warn, 800 error), code block density    |

### Domain 2: Cross-Reference Integrity (25% weight)

| Category                     | What It Checks                                                 |
| ---------------------------- | -------------------------------------------------------------- |
| Skill-to-Skill References    | /skill-name and backtick references resolve to existing skills |
| Skill-to-Script References   | node scripts/... and npm run ... references resolve            |
| Skill-to-Template References | FIX_TEMPLATE #N references exist in template files             |
| Evidence Citation Validity   | PR #NNN, Review #NNN, Session #NNN citations are verifiable    |
| Dependency Chain Health      | No circular dependencies, no broken chains between skills      |

### Domain 3: Coverage & Consistency (20% weight)

| Category                  | What It Checks                                              |
| ------------------------- | ----------------------------------------------------------- |
| Scope Boundary Clarity    | Skills with overlapping "When to Use" have differentiation  |
| Trigger Accuracy          | SKILL_INDEX.md descriptions match actual "When to Use" text |
| Output Format Consistency | Similar skill types produce consistent output structures    |
| Skill Registry Sync       | Bidirectional sync between SKILL_INDEX.md and disk          |

### Domain 4: Staleness & Drift (15% weight)

| Category                 | What It Checks                                             |
| ------------------------ | ---------------------------------------------------------- |
| Version History Currency | Last version history entry within 30 days                  |
| Dead Skill Detection     | Skills not updated in 60+ days flagged as potentially dead |
| Pattern Reference Sync   | Resolved churn patterns archived rather than left inline   |
| Inline Code Duplication  | Code blocks duplicated from FIX_TEMPLATES/CODE_PATTERNS    |

### Domain 5: Agent Orchestration Health (20% weight)

| Category                    | What It Checks                                            |
| --------------------------- | --------------------------------------------------------- |
| Agent Prompt Consistency    | COMPLETE: protocol and context overflow guards in prompts |
| Agent-Skill Alignment       | CLAUDE.md trigger table maps to actual skill directories  |
| Parallelization Correctness | Parallel execution documented with dependency constraints |
| Team Config Health          | settings.json hook/team configs are structurally valid    |

---

## Benchmarks & Checker Development

> Read `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` for
> scoring conventions and the checker development guide.

21 categories. Domain weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%.

### Data Sources

| Source         | Path                               | Content                      |
| -------------- | ---------------------------------- | ---------------------------- |
| Skill files    | `.claude/skills/*/SKILL.md`        | Skill documentation          |
| Skill registry | `.claude/skills/SKILL_INDEX.md`    | Skill index and descriptions |
| Settings       | `.claude/settings.json`            | Hook and team configurations |
| Agent triggers | `CLAUDE.md`                        | Agent trigger table          |
| Fix templates  | `docs/agent_docs/FIX_TEMPLATES.md` | Fix template library         |
| Code patterns  | `docs/agent_docs/CODE_PATTERNS.md` | Code pattern reference       |
| State files    | `.claude/state/*.jsonl`            | Audit state and history      |

---

## Version History

| Version | Date       | Description                                          |
| ------- | ---------- | ---------------------------------------------------- |
| 1.1     | 2026-03-25 | Extract shared patterns to \_shared/ecosystem-audit/ |
| 1.0     | 2026-02-24 | Initial implementation                               |
