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

1. **CHECK for saved progress first** — resume from
   `.claude/tmp/doc-audit-progress.json` if it exists and is < 2 hours old.
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

Path: `.claude/tmp/doc-audit-progress.json`

Schema:

```json
{
  "auditTimestamp": "ISO timestamp of audit run",
  "score": 85,
  "grade": "B",
  "totalFindings": 42,
  "currentFindingIndex": 8,
  "decisions": [
    {
      "findingIndex": 1,
      "category": "internal_link_health",
      "message": "5 broken internal links found",
      "decision": "fix",
      "note": "Fixed broken paths"
    }
  ],
  "fixesApplied": ["fixed 5 broken links in docs/"],
  "findingsData": []
}
```

### On Skill Start (Before Phase 1)

1. Check if `.claude/tmp/doc-audit-progress.json` exists and is < 2 hours old
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
4. Write the updated JSON to `.claude/tmp/doc-audit-progress.json`

This ensures that if compaction occurs mid-walkthrough, the next invocation
resumes exactly where it left off — no repeated questions, no lost decisions.

### On Audit Completion (Phase 4)

After the summary is presented, delete the progress file (audit is complete).

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

Sort all findings by `impactScore` descending (highest impact first).

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
   - source_id: "review:doc-ecosystem-audit-{date}"
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
node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js
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

### Domain 1: Index & Registry Health (20% weight)

| Category                | What It Checks                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| Index-Filesystem Sync   | Every DOCUMENTATION_INDEX.md entry has a matching file on disk and v.v. |
| Index Metadata Accuracy | Titles and descriptions in the index match actual file content          |
| Orphaned Documents      | Files in docs/ referenced by at least one other document                |

### Domain 2: Link & Reference Integrity (25% weight)

| Category                      | What It Checks                                              |
| ----------------------------- | ----------------------------------------------------------- |
| Internal Link Health          | All markdown links [text](path) resolve to existing files   |
| Cross-Doc Dependency Accuracy | Cross-doc dependency checker exists and rules are valid     |
| Anchor Reference Validity     | Links with #section anchors point to existing headings      |
| Image Asset References        | Image references (![](path), <img src>) point to real files |

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

## Benchmarks

Internal benchmarks are defined in `scripts/lib/benchmarks.js`. Each category
scores 0-100 with ratings: good (90+), average (70-89), poor (<70). The
composite grade uses weighted average across all 16 categories with domain
weights: D1=20%, D2=25%, D3=20%, D4=20%, D5=15%.

---

## Checker Development Guide

### Adding a New Category

1. Choose the appropriate domain checker in `scripts/checkers/`
2. Add a new check function following the pattern of existing categories
3. Add benchmarks to `scripts/lib/benchmarks.js`
4. Add weight to `CATEGORY_WEIGHTS` in benchmarks.js (adjust existing weights)
5. Add labels to the orchestrator's `CATEGORY_LABELS` and `CATEGORY_DOMAIN_MAP`
6. Test: `node scripts/run-doc-ecosystem-audit.js --summary`

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

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-24 | Initial implementation |
