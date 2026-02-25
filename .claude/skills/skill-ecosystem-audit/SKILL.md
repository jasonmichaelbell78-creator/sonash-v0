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

## CRITICAL RULES (Read First)

1. **CHECK for saved progress first** — resume from
   `.claude/tmp/skill-audit-progress.json` if it exists and is < 2 hours old.
   Never re-present findings that were already decided.
2. **ALWAYS run the script first** (if no saved progress) — never generate
   findings without data
3. **ALWAYS display the dashboard to the user** before starting the walkthrough
4. **Present findings one at a time** using AskUserQuestion for decisions
5. **SAVE progress after every decision** — write updated state to progress file
   immediately
6. **Show patch suggestions inline** with each patchable finding
7. **Create TDMS entries** for deferred findings via `/add-debt`
8. **Save decisions** to session log for audit trail

---

## Compaction Guard

Audits are long-running interactive workflows vulnerable to context compaction.
To survive compaction, save progress after every decision and check for existing
progress on startup.

### State File

Path: `.claude/tmp/skill-audit-progress.json`

Schema:

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 142,
  "currentFindingIndex": 8,
  "currentDomain": "cross_reference_integrity",
  "domainsCompleted": ["structural_compliance"],
  "decisions": [
    {
      "findingIndex": 1,
      "category": "frontmatter_schema",
      "message": "Skill 'xyz' has invalid frontmatter",
      "decision": "skip",
      "note": "Will fix in batch"
    }
  ],
  "fixesApplied": ["added frontmatter to skill-creator"],
  "findingsData": []
}
```

### On Skill Start (Before Phase 1)

1. Check if `.claude/tmp/skill-audit-progress.json` exists and is < 2 hours old
2. If yes: **resume from saved position**
   - Display the dashboard from saved data (skip re-running the audit script)
   - Show: "Resuming audit from finding {n}/{total} ({n-1} already reviewed)"
   - List prior decisions briefly: "{n} fixed, {n} skipped, {n} deferred"
   - Continue the walkthrough from `currentFindingIndex`
3. If no (or stale): proceed to Phase 1 normally

### After Each Decision (During Phase 3)

After each AskUserQuestion response, immediately save progress:

1. Update `currentFindingIndex` to the next finding
2. Append the decision to the `decisions` array
3. If "Fix Now" was chosen, append to `fixesApplied`
4. Write the updated JSON to `.claude/tmp/skill-audit-progress.json`

This ensures that if compaction occurs mid-walkthrough, the next invocation
resumes exactly where it left off — no repeated questions, no lost decisions.

### Domain-Based Chunking

To manage context budget in large audits, process findings domain by domain:

1. Process all D1 (Structural Compliance) findings first, then save progress
2. Process D2 (Cross-Reference Integrity) findings, then save progress
3. Process D3 (Coverage & Consistency) findings, then save progress
4. Process D4 (Staleness & Drift) findings, then save progress
5. Process D5 (Agent Orchestration Health) findings, then save progress

**Budget check between domains:** If context is running low after completing a
domain, save progress and tell the user: "Context budget is running low.
Progress saved at domain {N}. Re-invoke `/skill-ecosystem-audit` to continue
from where we left off."

### On Audit Completion (Phase 4)

After the summary is presented, delete the progress file (audit is complete).

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

Sort all findings by `impactScore` descending (highest impact first), then group
by domain for chunked processing.

For each finding, present a context card:

```
━━━ Finding {n}/{total} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}
```

If the finding has `patchable: true`, also show:

```
Patch Available:
  Target: {patch.target}
  Action: {patch.description}
  Preview:
    {patch.preview or patch.content}
```

Then use `AskUserQuestion` with options based on severity:

**ERROR findings:**

- Fix Now — execute the fix/patch immediately
- Defer — add to deferred list, create DEBT entry
- Suppress — suppress this finding type permanently

**WARNING findings:**

- Fix Now
- Defer
- Skip — acknowledge but don't track

**INFO findings:**

- Acknowledge
- Defer for later

### Handling Decisions

**Fix Now:**

1. If patch is available, apply it (edit file, run command, etc.)
2. If no patch, provide guidance for manual fix
3. Log decision to session file

**Defer:**

1. Create DEBT entry via `/add-debt` with:
   - severity: S1 (errors) or S2 (warnings)
   - category: engineering-productivity
   - source_id: "review:skill-ecosystem-audit-{date}"
2. Log decision to session file

**Suppress:**

1. Add to suppression list (not yet implemented — log for future)
2. Log decision to session file

---

## Phase 4: Summary & Actions

After all findings are reviewed, present the summary:

```
━━━ Audit Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite: {grade} ({score}/100)  |  {trend}

Decisions:
  Fixed:      {count} findings
  Deferred:   {count} findings → {count} DEBT entries created
  Skipped:    {count} findings
  Suppressed: {count} findings

Patches Applied: {count}/{total patchable}

Top 3 Impact Areas:
  1. {category} — {brief description}
  2. {category} — {brief description}
  3. {category} — {brief description}

Next Steps:
  - {actionable recommendation based on worst categories}
  - {actionable recommendation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 5: Trend Report (if previous runs exist)

If the state file has previous entries, show improvement/regression:

```
━━━ Trend Report ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Composite Trend: {sparkline}  {direction} ({delta})

Improving:
  {category}: {before} → {after} (+{delta})

Declining:
  {category}: {before} → {after} ({delta})

Stable:
  {category}: {score} (no change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 6: Self-Audit (Verification)

After all findings are reviewed and fixes committed, re-run the audit to verify
improvements:

1. Re-run the audit script:

```bash
node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js
```

2. Compare the new score against the Phase 2 score:

```
━━━ Self-Audit Verification ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before: {previous_grade} ({previous_score}/100)
After:  {new_grade} ({new_score}/100)
Delta:  {+/-delta} points

Improved Categories:
  {category}: {before} → {after} (+{delta})

Remaining Issues:
  {count} findings still open (deferred/skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

3. If the score improved, commit the audit state for trend tracking.
4. If the score did not improve, investigate why — fixes may have introduced new
   findings.

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

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 21 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=15%, D5=20%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-skill-ecosystem-audit.js --summary`

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

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-24 | Initial implementation |
