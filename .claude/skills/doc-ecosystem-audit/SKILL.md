---
name: doc-ecosystem-audit
description: |
  Comprehensive diagnostic of the documentation ecosystem — 16 categories across
  5 domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Covers index sync, link integrity,
  content quality, generation pipelines, and documentation coverage.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Doc Ecosystem Audit

Deep diagnostic of the entire documentation ecosystem — documentation index
(`DOCUMENTATION_INDEX.md`), cross-references, content quality, generation
pipelines (`docs:index`, doc-optimizer), and coverage completeness. Produces
per-category scores, a composite health grade (A-F), trend tracking across runs,
and an interactive walkthrough with patch suggestions.

**Invocation:** `/doc-ecosystem-audit`

**When to use:** When you want to understand the overall health of the
documentation system, identify broken links, orphaned docs, stale content, or
pipeline issues. Complementary with `/hook-ecosystem-audit` (hook audit owns
hook internals; doc audit owns documentation quality).

---

## When to Use

- |
- User explicitly invokes `/doc-ecosystem-audit`

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
> compaction guard protocol (state file schema, resume, save, cleanup).

State file path: `.claude/tmp/doc-audit-progress.json`

---

## Phase 1: Run & Parse

1. Run the audit script:

```bash
node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js
```

2. Parse the v2 JSON output from stdout (progress goes to stderr).

3. Create a session decision log file:
   - Path: `.claude/tmp/doc-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
   - Create `.claude/tmp/` directory if it doesn't exist

4. Save initial progress state to `.claude/tmp/doc-audit-progress.json` with
   `currentFindingIndex: 0`, the full findings data, score, and grade.

---

## Phase 2: Dashboard Overview (compact)

Present a compact header with composite grade and domain breakdown:

```
Doc Ecosystem Health: {grade} ({score}/100)  |  Trend: {sparkline} ({delta})
{errors} errors · {warnings} warnings · {info} info  |  {patches} patch suggestions

┌──────────────────────────────────────┬───────┬──────────┬──────────────┐
│ Category                             │ Score │ Rating   │ Trend        │
├──────────────────────────────────────┼───────┼──────────┼──────────────┤
│ D1: Index & Registry Health          │       │          │              │
│   Index-Filesystem Sync              │  {s}  │ {rating} │ {trend}      │
│   Index Metadata Accuracy            │  {s}  │ {rating} │ {trend}      │
│   Orphaned Documents                 │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────────┼───────┼──────────┼──────────────┤
│ D2: Link & Reference Integrity       │       │          │              │
│   Internal Link Health               │  {s}  │ {rating} │ {trend}      │
│   Cross-Doc Dependency Accuracy      │  {s}  │ {rating} │ {trend}      │
│   Anchor Reference Validity          │  {s}  │ {rating} │ {trend}      │
│   Image Asset References             │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────────┼───────┼──────────┼──────────────┤
│ D3: Content Quality & Compliance     │       │          │              │
│   Header & Frontmatter Compliance    │  {s}  │ {rating} │ {trend}      │
│   Formatting Consistency             │  {s}  │ {rating} │ {trend}      │
│   Content Freshness                  │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────────┼───────┼──────────┼──────────────┤
│ D4: Generation Pipeline Health       │       │          │              │
│   Docs Index Correctness             │  {s}  │ {rating} │ {trend}      │
│   Doc Optimizer Pipeline             │  {s}  │ {rating} │ {trend}      │
│   Pre-commit Doc Checks              │  {s}  │ {rating} │ {trend}      │
├──────────────────────────────────────┼───────┼──────────┼──────────────┤
│ D5: Coverage & Completeness          │       │          │              │
│   Documentation Coverage             │  {s}  │ {rating} │ {trend}      │
│   Agent Doc References               │  {s}  │ {rating} │ {trend}      │
│   README & Onboarding                │  {s}  │ {rating} │ {trend}      │
└──────────────────────────────────────┴───────┴──────────┴──────────────┘
```

Rating badges: good = "Good", average = "Avg", poor = "Poor"

Then say: **"Found N findings to review. Walking through each one
(impact-weighted)..."**

---

## Phase 3: Finding-by-Finding Walkthrough

> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).

Sort findings by `impactScore` descending (highest impact first). DEBT entries
use source_id: `review:doc-ecosystem-audit-{date}`.

---

## Phase 4: Summary & Actions

> Read `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md` for the
> summary template, trend report template, and verification re-run template.

Write report to `.claude/tmp/doc-audit-report-{YYYY-MM-DD}.md`.

**Process verification:** Run `__tests__/` suite:

```bash
node --test .claude/skills/doc-ecosystem-audit/scripts/__tests__/*.test.js
```

---

## Phase 5: Trend Report (if previous runs exist)

> Uses trend report template from `SUMMARY_AND_TRENDS.md`.

History: `.claude/state/doc-ecosystem-audit-history.jsonl`

---

## Phase 6: Self-Audit (Verification)

> Uses verification re-run template from `SUMMARY_AND_TRENDS.md`.

Re-run script:

```bash
node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js
```

---

## Category Reference

### Domain 1: Index & Registry Health (20% weight)

| Category                | What It Checks                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| Index-Filesystem Sync   | Every DOCUMENTATION_INDEX.md entry has a matching file on disk and v.v. |
| Index Metadata Accuracy | Titles and descriptions in the index match actual file content          |
| Orphaned Documents      | Files in docs/ referenced by at least one other document                |

### Domain 2: Link & Reference Integrity (25% weight)

| Category                      | What It Checks                                                  |
| ----------------------------- | --------------------------------------------------------------- |
| Internal Link Health          | All markdown links [text](path) resolve to existing files       |
| Cross-Doc Dependency Accuracy | Cross-doc dependency checker exists and rules are valid         |
| Anchor Reference Validity     | Links with #section anchors point to existing headings          |
| Image Asset References        | Image references (`![](path)`, `<img src>`) point to real files |

### Domain 3: Content Quality & Compliance (20% weight)

| Category                        | What It Checks                                             |
| ------------------------------- | ---------------------------------------------------------- |
| Header & Frontmatter Compliance | Required elements: title heading, Purpose, Version History |
| Formatting Consistency          | Heading levels, code block language tags, list markers     |
| Content Freshness               | Docs not >30 days behind their referenced code files       |

### Domain 4: Generation Pipeline Health (20% weight)

| Category               | What It Checks                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| Docs Index Correctness | npm docs:index script exists, referenced file exists, index valid |
| Doc Optimizer Pipeline | doc-optimizer skill present, state files valid                    |
| Pre-commit Doc Checks  | Doc-related stages present in .husky/pre-commit                   |

### Domain 5: Coverage & Completeness (15% weight)

| Category               | What It Checks                                           |
| ---------------------- | -------------------------------------------------------- |
| Documentation Coverage | Major systems (from package.json, directories) have docs |
| Agent Doc References   | All docs referenced in CLAUDE.md exist and are non-empty |
| README & Onboarding    | README, CLAUDE.md, AI_WORKFLOW.md present and consistent |

---

## Benchmarks & Checker Development

> Read `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md` for
> scoring conventions and the checker development guide.

16 categories. Domain weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%.

### Data Sources

| Source              | Path                              | Content                     |
| ------------------- | --------------------------------- | --------------------------- |
| Documentation Index | `DOCUMENTATION_INDEX.md`          | Master doc listing          |
| Documentation files | `docs/**/*.md`                    | All documentation           |
| Main AI config      | `CLAUDE.md`                       | AI rules and doc references |
| AI workflow         | `AI_WORKFLOW.md`                  | Session startup, navigation |
| Pre-commit pipeline | `.husky/pre-commit`               | Doc quality gates           |
| Cross-doc deps      | `scripts/check-cross-doc-deps.js` | Dependency rules            |
| Doc optimizer       | `.claude/skills/doc-optimizer/`   | Optimizer state and config  |
| Package config      | `package.json`                    | npm scripts for doc tools   |
| State files         | `.claude/state/*.jsonl`           | Audit history and trends    |

---

## Version History

| Version | Date       | Description                                          |
| ------- | ---------- | ---------------------------------------------------- |
| 1.1     | 2026-03-25 | Extract shared patterns to \_shared/ecosystem-audit/ |
| 1.0     | 2026-02-24 | Initial implementation                               |
